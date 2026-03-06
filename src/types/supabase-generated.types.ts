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
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          date_of_birth: string
          gender: string
          looking_for: string[]
          bio: string
          location: string
          nationality: string
          interests: string[]
          photos: Json[]
          verified_email: boolean
          verified_phone: boolean
          phone_hash: string | null
          is_active: boolean
          last_active: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          date_of_birth: string
          gender: string
          looking_for?: string[]
          bio?: string
          location?: string
          nationality?: string
          interests?: string[]
          photos?: Json[]
          verified_email?: boolean
          verified_phone?: boolean
          phone_hash?: string | null
          is_active?: boolean
          last_active?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          date_of_birth?: string
          gender?: string
          looking_for?: string[]
          bio?: string
          location?: string
          nationality?: string
          interests?: string[]
          photos?: Json[]
          verified_email?: boolean
          verified_phone?: boolean
          phone_hash?: string | null
          is_active?: boolean
          last_active?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          id: string
          liker_id: string
          likee_id: string
          created_at: string
        }
        Insert: {
          id?: string
          liker_id: string
          likee_id: string
          created_at?: string
        }
        Update: {
          id?: string
          liker_id?: string
          likee_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_likee_id_fkey"
            columns: ["likee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          match_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
