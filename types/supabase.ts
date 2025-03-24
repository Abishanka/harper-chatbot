export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          full_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          owner_id: string
          is_shared: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          owner_id: string
          is_shared?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          owner_id?: string
          is_shared?: boolean
        }
      }
      media: {
        Row: {
          id: string
          created_at: string
          name: string
          media_type: 'file' | 'image'
          owner_id: string
          vector_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          media_type: 'file' | 'image'
          owner_id: string
          vector_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          media_type?: 'file' | 'image'
          owner_id?: string
          vector_id?: string | null
        }
      }
      media_workspace_mapping: {
        Row: {
          id: string
          created_at: string
          media_id: string
          workspace_id: string
          added_by: string
        }
        Insert: {
          id?: string
          created_at?: string
          media_id: string
          workspace_id: string
          added_by: string
        }
        Update: {
          id?: string
          created_at?: string
          media_id?: string
          workspace_id?: string
          added_by?: string
        }
      }
      chunks: {
        Row: {
          id: string
          created_at: string
          chunk_text: string
          media_id: string
          page_number: number | null
          embedding: number[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          chunk_text: string
          media_id: string
          page_number?: number | null
          embedding?: number[] | null
        }
        Update: {
          id?: string
          created_at?: string
          chunk_text?: string
          media_id?: string
          page_number?: number | null
          embedding?: number[] | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 