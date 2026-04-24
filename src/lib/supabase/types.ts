export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          sku: string | null;
          default_sale_price: number;
          default_product_cost: number;
          default_shipping_cost: number;
          default_payment_gateway_cost: number;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          sku?: string | null;
          default_sale_price?: number;
          default_product_cost?: number;
          default_shipping_cost?: number;
          default_payment_gateway_cost?: number;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          sku?: string | null;
          default_sale_price?: number;
          default_product_cost?: number;
          default_shipping_cost?: number;
          default_payment_gateway_cost?: number;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_processes: {
        Row: {
          id: string;
          owner_id: string | null;
          product_id: string | null;
          process_date: string;
          ad_spend: number;
          total_sales: number;
          unit_sale_price: number | null;
          units_sold: number;
          product_cost: number;
          shipping_cost: number;
          payment_gateway_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          product_id?: string | null;
          process_date: string;
          ad_spend: number;
          total_sales: number;
          unit_sale_price?: number | null;
          units_sold: number;
          product_cost: number;
          shipping_cost?: number;
          payment_gateway_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          product_id?: string | null;
          process_date?: string;
          ad_spend?: number;
          total_sales?: number;
          unit_sale_price?: number | null;
          units_sold?: number;
          product_cost?: number;
          shipping_cost?: number;
          payment_gateway_cost?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_processes_calculated: {
        Row: {
          id: string;
          owner_id: string | null;
          product_id: string;
          process_date: string;
          ad_spend: number;
          total_sales: number;
          unit_sale_price: number;
          units_sold: number;
          product_cost: number;
          shipping_cost: number;
          payment_gateway_cost: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
          gross_profit: number;
          net_profit: number;
          net_day_profit: number;
          accumulated_net: number;
          gross_margin: number | null;
          net_margin: number | null;
          cost_per_unit: number | null;
          average_sale_per_unit: number | null;
          ad_spend_per_unit: number | null;
          acquisition_cost_per_sale: number | null;
          roas: number | null;
          break_even_sales: number | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
