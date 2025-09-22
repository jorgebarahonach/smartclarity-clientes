import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          document_type: 'manual' | 'plano' | 'archivo'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          file_path: string
          file_type: string
          file_size: number
          document_type: 'manual' | 'plano' | 'archivo'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          document_type?: 'manual' | 'plano' | 'archivo'
          created_at?: string
        }
      }
    }
  }
}