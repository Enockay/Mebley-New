export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          likee_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          likee_id: string
          liker_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          likee_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_likee_id_fkey"
            columns: ["likee_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_likee_id_fkey"
            columns: ["likee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_scores_log: {
        Row: {
          api_version: string | null
          candidate_id: string
          created_at: string | null
          filters_passed: Json | null
          id: string
          score: number
          scoring_factors: Json | null
          user_id: string
        }
        Insert: {
          api_version?: string | null
          candidate_id: string
          created_at?: string | null
          filters_passed?: Json | null
          id?: string
          score: number
          scoring_factors?: Json | null
          user_id: string
        }
        Update: {
          api_version?: string | null
          candidate_id?: string
          created_at?: string | null
          filters_passed?: Json | null
          id?: string
          score?: number
          scoring_factors?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      precomputed_matches: {
        Row: {
          candidate_id: string
          computed_at: string | null
          id: string
          reasons: Json | null
          score: number
          user_id: string
        }
        Insert: {
          candidate_id: string
          computed_at?: string | null
          id?: string
          reasons?: Json | null
          score: number
          user_id: string
        }
        Update: {
          candidate_id?: string
          computed_at?: string | null
          id?: string
          reasons?: Json | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "precomputed_matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precomputed_matches_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precomputed_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precomputed_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_videos: {
        Row: {
          cloudfront_url: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          s3_key: string
          slot: number
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cloudfront_url: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          s3_key: string
          slot?: number
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cloudfront_url?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          s3_key?: string
          slot?: number
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_max: number | null
          age_min: number | null
          bio: string | null
          created_at: string | null
          date_of_birth: string
          distance_max: number | null
          full_name: string
          gender: string
          gender_preference: string[] | null
          id: string
          interests: string[]
          is_active: boolean | null
          last_active: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string[]
          nationality: string | null
          phone_hash: string | null
          photos: Json[]
          profile_completeness: number | null
          updated_at: string | null
          username: string
          verified_email: boolean | null
          verified_phone: boolean | null
          visibility: Database["public"]["Enums"]["profile_visibility"] | null
          visible: boolean | null
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string | null
          date_of_birth: string
          distance_max?: number | null
          full_name: string
          gender: string
          gender_preference?: string[] | null
          id: string
          interests?: string[]
          is_active?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[]
          nationality?: string | null
          phone_hash?: string | null
          photos?: Json[]
          profile_completeness?: number | null
          updated_at?: string | null
          username: string
          verified_email?: boolean | null
          verified_phone?: boolean | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
          visible?: boolean | null
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string | null
          date_of_birth?: string
          distance_max?: number | null
          full_name?: string
          gender?: string
          gender_preference?: string[] | null
          id?: string
          interests?: string[]
          is_active?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[]
          nationality?: string | null
          phone_hash?: string | null
          photos?: Json[]
          profile_completeness?: number | null
          updated_at?: string | null
          username?: string
          verified_email?: boolean | null
          verified_phone?: boolean | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
          visible?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      match_candidates: {
        Row: {
          age: number | null
          age_max: number | null
          age_min: number | null
          bio: string | null
          date_of_birth: string | null
          distance_max: number | null
          full_name: string | null
          gender: string | null
          gender_preference: string[] | null
          id: string | null
          interests: string[] | null
          is_active: boolean | null
          last_active: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string[] | null
          photos: Json[] | null
          profile_completeness: number | null
          username: string | null
          visibility: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Insert: {
          age?: never
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          date_of_birth?: string | null
          distance_max?: number | null
          full_name?: string | null
          gender?: string | null
          gender_preference?: string[] | null
          id?: string | null
          interests?: string[] | null
          is_active?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          photos?: Json[] | null
          profile_completeness?: number | null
          username?: string | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Update: {
          age?: never
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          date_of_birth?: string | null
          distance_max?: number | null
          full_name?: string | null
          gender?: string | null
          gender_preference?: string[] | null
          id?: string | null
          interests?: string[] | null
          is_active?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          photos?: Json[] | null
          profile_completeness?: number | null
          username?: string | null
          visibility?: Database["public"]["Enums"]["profile_visibility"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_age: { Args: { dob: string }; Returns: number }
      calculate_profile_completeness: {
        Args: { profile_id: string }
        Returns: number
      }
      get_age: { Args: { dob: string }; Returns: number }
      get_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
    }
    Enums: {
      profile_visibility: "visible" | "hidden" | "deleted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      profile_visibility: ["visible", "hidden", "deleted"],
    },
  },
} as const
