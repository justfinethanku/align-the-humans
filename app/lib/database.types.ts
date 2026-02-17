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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alignment_analyses: {
        Row: {
          alignment_id: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          round: number
          summary: Json | null
        }
        Insert: {
          alignment_id: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          round: number
          summary?: Json | null
        }
        Update: {
          alignment_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          round?: number
          summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "alignment_analyses_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignment_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_analyses_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignments"
            referencedColumns: ["id"]
          },
        ]
      }
      alignment_invitations: {
        Row: {
          alignment_id: string
          created_at: string
          created_by: string
          current_uses: number | null
          expires_at: string | null
          id: string
          invalidated_at: string | null
          max_uses: number | null
          token_ciphertext: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          alignment_id: string
          created_at?: string
          created_by: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invalidated_at?: string | null
          max_uses?: number | null
          token_ciphertext?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          alignment_id?: string
          created_at?: string
          created_by?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          invalidated_at?: string | null
          max_uses?: number | null
          token_ciphertext?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_invitations_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignment_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_invitations_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alignment_participants: {
        Row: {
          alignment_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          alignment_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          alignment_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_participants_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignment_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_participants_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignments"
            referencedColumns: ["id"]
          },
        ]
      }
      alignment_responses: {
        Row: {
          alignment_id: string
          answers: Json
          created_at: string
          id: string
          metadata: Json | null
          response_version: number
          round: number
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_id: string
          answers?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          response_version?: number
          round: number
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_id?: string
          answers?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          response_version?: number
          round?: number
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_responses_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignment_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_responses_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignments"
            referencedColumns: ["id"]
          },
        ]
      }
      alignment_signatures: {
        Row: {
          alignment_id: string
          canonical_snapshot: Json
          created_at: string
          id: string
          round: number
          signature: string
          user_id: string
        }
        Insert: {
          alignment_id: string
          canonical_snapshot: Json
          created_at?: string
          id?: string
          round: number
          signature: string
          user_id: string
        }
        Update: {
          alignment_id?: string
          canonical_snapshot?: Json
          created_at?: string
          id?: string
          round?: number
          signature?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignment_signatures_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignment_status_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignment_signatures_alignment_id_fkey"
            columns: ["alignment_id"]
            isOneToOne: false
            referencedRelation: "alignments"
            referencedColumns: ["id"]
          },
        ]
      }
      alignments: {
        Row: {
          allow_solo_start: boolean | null
          clarity_draft: Json
          created_at: string
          created_by: string
          current_invite_id: string | null
          current_round: number
          id: string
          partner_id: string | null
          status: string
          template_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          allow_solo_start?: boolean | null
          clarity_draft?: Json
          created_at?: string
          created_by: string
          current_invite_id?: string | null
          current_round?: number
          id?: string
          partner_id?: string | null
          status: string
          template_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          allow_solo_start?: boolean | null
          clarity_draft?: Json
          created_at?: string
          created_by?: string
          current_invite_id?: string | null
          current_round?: number
          id?: string
          partner_id?: string | null
          status?: string
          template_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alignments_current_invite_id_fkey"
            columns: ["current_invite_id"]
            isOneToOne: false
            referencedRelation: "alignment_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          created_by: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          id: string
          name: string
          schema: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          content: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          schema?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          schema?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
    }
    Views: {
      alignment_status_view: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_round: number | null
          id: string | null
          participant_count: number | null
          partner_id: string | null
          signed_count: number | null
          status: string | null
          submitted_responses: number | null
          template_id: string | null
          title: string | null
          ui_status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      increment_invite_usage: {
        Args: {
          invite_id: string
        }
        Returns: boolean
      }
      decrement_invite_usage: {
        Args: {
          invite_id: string
        }
        Returns: void
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
