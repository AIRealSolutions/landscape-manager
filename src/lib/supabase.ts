import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          role: 'admin' | 'crew' | 'customer'
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      customers: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          email: string
          phone: string
          address: string
          preferred_contact: 'sms' | 'email' | 'call'
          notes: string | null
          service_history_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      services: {
        Row: {
          id: string
          company_id: string
          type: string
          name: string
          description: string | null
          base_price: number
          frequency: 'one-time' | 'weekly' | 'biweekly' | 'monthly'
          seasonal_availability: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          customer_id: string
          services: string[]
          crew_id: string[]
          scheduled_date: string
          start_time: string
          estimated_duration: number
          status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'paid'
          notes: string | null
          actual_duration: number | null
          price: number
          invoice_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      crew: {
        Row: {
          id: string
          user_id: string
          company_id: string
          name: string
          skills: string[]
          current_location: { lat: number; lng: number } | null
          availability: string
          max_jobs_per_day: number
          performance_rating: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['crew']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['crew']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          job_id: string
          customer_id: string
          type: 'sms' | 'email' | 'push'
          message: string
          scheduled_at: string
          sent_at: string | null
          status: 'pending' | 'sent' | 'failed'
          delivery_response: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          job_id: string[]
          total_amount: number
          tax: number
          discount: number
          due_date: string
          status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue'
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
    }
  }
}
