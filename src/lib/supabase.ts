import { createClient } from '@supabase/supabase-js';
import { Order } from '../types';

function cleanEnv(val?: unknown): string {
  if (!val) return '';
  return String(val)
    .trim()
    .replace(/^["']|["',]+$/g, '')
    .replace(/^["']|["',]+$/g, '')
    .trim();
}

export const SUPABASE_PROJECT_ID = 'qjgeqbsxczssxbsqvmje';
export const SUPABASE_URL = cleanEnv(import.meta.env.VITE_SUPABASE_URL) || 'https://qjgeqbsxczssxbsqvmje.supabase.co';
export const SUPABASE_ANON_KEY = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_agzaOJUf2Wr3uvDXNJMBqQ_JbxSWxu6';

// Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseOrderRow {
  id?: string;
  first_name: string;
  phone_number: string;
  city: string;
  product_name: string;
  total_amount: number;
  date_time: string;
}

export interface SupabaseSyncResult {
  success: boolean;
  orderId: string;
  error?: string;
  tableNotice?: string;
}

/**
 * Sends order data to the Supabase orders table with the requested columns:
 * - first_name
 * - phone_number
 * - city
 * - product_name
 * - total_amount
 * - date_time
 */
export async function sendOrderToSupabase(order: Order): Promise<SupabaseSyncResult> {
  const firstName = order.buyerName.trim().split(' ')[0] || order.buyerName;
  const productName = order.items && order.items.length > 0
    ? order.items.map((item) => `${item.artworkTitle} (${item.productName || item.productType})`).join(', ')
    : 'Custom Artwork Print';
  const orderDateTime = new Date(order.createdAt).toISOString();

  // Primary payload matching the requested table schema
  const primaryRow: Record<string, unknown> = {
    first_name: firstName,
    phone_number: order.phoneNumber || '',
    city: order.shippingAddress?.city || '',
    product_name: productName,
    total_amount: order.total,
    date_time: orderDateTime,
  };

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([primaryRow])
      .select();

    if (error) {
      console.warn('Supabase primary order insert response:', error);

      // If user's table requires id as text, retry with id included
      if (error.message.includes('id') && !primaryRow.id) {
        const { data: retryData, error: retryError } = await supabase
          .from('orders')
          .insert([{ ...primaryRow, id: order.id }])
          .select();

        if (!retryError) {
          console.info('Successfully synced order to Supabase orders table (with ID):', retryData);
          return { success: true, orderId: order.id };
        }
      }

      return {
        success: false,
        orderId: order.id,
        error: error.message,
        tableNotice: error.message.includes('Could not find the table')
          ? 'Table "orders" has not been created yet in your Supabase SQL editor. Run the provided SQL script to create it.'
          : error.message,
      };
    }

    console.info('Successfully synced order to Supabase orders table:', data);
    return {
      success: true,
      orderId: order.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Supabase order sync exception:', message);
    return {
      success: false,
      orderId: order.id,
      error: message,
    };
  }
}

/**
 * SQL statement that creates the 'orders' table in Supabase
 * with the exact columns requested:
 * - first_name
 * - phone_number
 * - city
 * - product_name
 * - total_amount
 * - date_time
 * along with Row Level Security (RLS) policies allowing public inserts.
 */
export const SUPABASE_ORDERS_TABLE_SQL = `-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    phone_number TEXT,
    city TEXT,
    product_name TEXT,
    total_amount NUMERIC(10, 2),
    date_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow checkout submissions (anonymous and authenticated inserts)
CREATE POLICY "Allow public insert on orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Policy: Allow reading orders
CREATE POLICY "Allow public select on orders" 
ON public.orders 
FOR SELECT 
TO anon, authenticated 
USING (true);
`;
