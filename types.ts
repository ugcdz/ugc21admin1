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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      apps: {
        Row: {
          client: string | null
          content_type: string
          created_at: string
          description: string | null
          download_url: string | null
          file_name: string | null
          file_path: string | null
          id: string
          images: string[]
          license: string
          notes: string | null
          price: number | null
          release_date: string | null
          site_id: string | null
          size_mb: number | null
          specs: string | null
          status: string
          title: string
          update_date: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          client?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          download_url?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          images?: string[]
          license?: string
          notes?: string | null
          price?: number | null
          release_date?: string | null
          site_id?: string | null
          size_mb?: number | null
          specs?: string | null
          status?: string
          title: string
          update_date?: string | null
          url?: string | null
          user_id?: string
        }
        Update: {
          client?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          download_url?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          images?: string[]
          license?: string
          notes?: string | null
          price?: number | null
          release_date?: string | null
          site_id?: string | null
          size_mb?: number | null
          specs?: string | null
          status?: string
          title?: string
          update_date?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      license_requests: {
        Row: {
          app_id: string
          contact: string
          created_at: string
          decided_at: string | null
          id: string
          license_code: string | null
          requester_name: string
          status: string
          submission_nonce: string | null
          user_id: string
        }
        Insert: {
          app_id: string
          contact: string
          created_at?: string
          decided_at?: string | null
          id?: string
          license_code?: string | null
          requester_name: string
          status?: string
          submission_nonce?: string | null
          user_id: string
        }
        Update: {
          app_id?: string
          contact?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          license_code?: string | null
          requester_name?: string
          status?: string
          submission_nonce?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_requests_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percent: number
          id: string
          max_uses: number
          site_id: string
          used_count: number
          user_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percent: number
          id?: string
          max_uses: number
          site_id: string
          used_count?: number
          user_id?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          max_uses?: number
          site_id?: string
          used_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      security_checks: {
        Row: {
          client: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          catalog_path: string
          client: string | null
          created_at: string
          github_branch: string
          github_repo: string | null
          id: string
          notes: string | null
          purpose: string
          status: string
          synced_at: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          catalog_path?: string
          client?: string | null
          created_at?: string
          github_branch?: string
          github_repo?: string | null
          id?: string
          notes?: string | null
          purpose?: string
          status?: string
          synced_at?: string | null
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          catalog_path?: string
          client?: string | null
          created_at?: string
          github_branch?: string
          github_repo?: string | null
          id?: string
          notes?: string | null
          purpose?: string
          status?: string
          synced_at?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          client: string | null
          created_at: string
          id: string
          notes: string | null
          status: string
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          client?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_promo: {
        Args: { _code: string; _site_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
