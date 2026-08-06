/**
 * database.generated.ts — tipos TypeScript del esquema Supabase de Blue Velvet.
 *
 * ⚠️ FUENTE DEL SNAPSHOT (BV2-06): generado desde FUENTE LOCAL CONFIABLE
 * (supabase_schema.sql histórico + supabase/migrations/* + SQL de raíz +
 * queries del frontend), NO desde la base de datos en vivo, porque en este
 * entorno no hay project-ref vinculado ni credenciales Supabase.
 *
 * Para regenerar contra producción (cuando haya acceso, sin escribir nada):
 *   npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.generated.ts
 * (el PROJECT_REF operativo está en docs/operations/PHASE_0_RELEASE_RUNBOOK.md;
 *  no lo incluyas en el repo ni en scripts committeados).
 *
 * Contiene solo definiciones de tipo. Ninguna fila ni dato real.
 * Ver docs/data/SCHEMA_INVENTORY.md para el inventario confirmado/legado/CRM.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Definición de fila por tabla. Insert/Update se derivan salvo excepciones. */
export interface Database {
  public: {
    Tables: {
      /** Perfil de usuario; extiende auth.users. (supabase_schema.sql) */
      profiles: {
        Row: {
          id: string; // uuid, FK auth.users
          role: string; // 'user' | 'admin'
        };
        Insert: { id: string; role?: string };
        Update: { id?: string; role?: string };
      };

      /** Pedidos. (supabase_schema.sql + migraciones payment/checkout Fase 0) */
      orders: {
        Row: {
          id: string; // uuid
          user_id: string; // uuid, FK auth.users
          created_at: string; // timestamptz
          total_amount: number; // numeric
          status: string; // 'pending' | 'pending_transfer' | 'confirmed' | ...
          shipping_details: Json | null; // jsonb
          message_details: Json | null; // jsonb
          coupon_code: string | null;
          discount_amount: number | null;
          payment_id: string | null;
          checkout_attempt_id: string | null; // uuid
          payment_method: string | null;
          payment_preference_id: string | null;
          payment_init_point: string | null;
          payment_currency: string | null; // default 'MXN'
          payment_amount: number | null; // numeric(12,2)
          paid_at: string | null; // timestamptz
          confirmation_email_sent_at: string | null; // timestamptz
        };
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & {
          user_id: string;
          total_amount: number;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
      };

      /** Ítems de pedido. (supabase_schema.sql + add_addons_to_order_items.sql) */
      order_items: {
        Row: {
          id: string; // uuid
          order_id: string; // uuid, FK orders
          product_id: string; // text
          product_name: string;
          quantity: number; // integer
          price: number; // numeric
          size: string | null;
          addons: Json | null; // jsonb, default []
        };
        Insert: Partial<Database['public']['Tables']['order_items']['Row']> & {
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          price: number;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
      };

      /** Productos del catálogo. Tabla creada fuera de migraciones (legado);
       *  columnas por types.ts + migración add_seo_columns + queries. */
      products: {
        Row: {
          id: string; // uuid
          name: string;
          price: number; // numeric
          originalPrice: number | null;
          image: string;
          description: string;
          category: string;
          occasions: string[] | null;
          sizes: Json | null; // jsonb ProductSize[]
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          name: string;
          price: number;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };

      /** Categorías. (setup_categories.sql — legado no migrado) */
      categories: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
      };

      /** Ocasiones. (supabase_schema.sql) */
      occasions: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['occasions']['Row']>;
      };

      /** Complementos/extras. (migración create_addons_table) */
      addons: {
        Row: {
          id: string;
          name: string;
          price: number;
          type: string; // 'mariposa' | 'corona' | 'banda' | 'extra'
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['addons']['Row']> & {
          name: string;
          price: number;
          type: string;
        };
        Update: Partial<Database['public']['Tables']['addons']['Row']>;
      };

      /** Cupones de descuento. (supabase_schema.sql) */
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: 'percentage' | 'fixed';
          value: number;
          expiration_date: string | null;
          usage_limit: number | null;
          usage_count: number;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['coupons']['Row']> & {
          code: string;
          discount_type: 'percentage' | 'fixed';
          value: number;
        };
        Update: Partial<Database['public']['Tables']['coupons']['Row']>;
      };

      /** Ítems del carrito. (supabase_schema.sql) */
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string; // uuid, FK products
          quantity: number;
          size: Json; // jsonb
          addons: Json | null; // jsonb, default []
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['cart_items']['Row']> & {
          user_id: string;
          product_id: string;
          quantity: number;
          size: Json;
        };
        Update: Partial<Database['public']['Tables']['cart_items']['Row']>;
      };

      /** Configuración del sitio. (migración create_settings_table) */
      site_settings: {
        Row: { key: string; value: string | null; description: string | null };
        Insert: { key: string; value?: string | null; description?: string | null };
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>;
      };

      /** Zonas de envío por CP/colonia. (create_shipping_zones.sql — legado) */
      shipping_zones: {
        Row: {
          id: string;
          zip_code: string;
          colony: string;
          municipality: string;
          status: 'standard' | 'surcharge' | 'blocked';
          surcharge: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['shipping_zones']['Row']> & {
          zip_code: string;
          colony: string;
        };
        Update: Partial<Database['public']['Tables']['shipping_zones']['Row']>;
      };

      /** Contador de visitantes únicos. (create_visitor_counter.sql — legado) */
      unique_visitors: {
        Row: {
          id: string;
          visitor_id: string;
          last_visit: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['unique_visitors']['Row']> & {
          visitor_id: string;
        };
        Update: Partial<Database['public']['Tables']['unique_visitors']['Row']>;
      };

      /** Direcciones guardadas del usuario. (create_addresses_table.sql — legado) */
      user_addresses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          recipient_name: string;
          street: string;
          colonia: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string;
          reference: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_addresses']['Row']> & {
          user_id: string;
          name: string;
          recipient_name: string;
          street: string;
          colonia: string;
          city: string;
          state: string;
          zip_code: string;
          phone: string;
        };
        Update: Partial<Database['public']['Tables']['user_addresses']['Row']>;
      };
    };

    Functions: {
      /** RPC Fase 0. Ver docs/data/SCHEMA_INVENTORY.md. */
      confirm_checkout_payment: {
        Args: Record<string, unknown>;
        Returns: Json;
      };
      create_checkout_order: {
        Args: Record<string, unknown>;
        Returns: Json;
      };
      get_users_with_email: {
        Args: Record<string, unknown>;
        Returns: Json;
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Helpers de conveniencia (filas por tabla).
// ---------------------------------------------------------------------------
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
