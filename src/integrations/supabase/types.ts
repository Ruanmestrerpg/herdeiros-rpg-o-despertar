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
      campaign_members: {
        Row: {
          campaign_id: string
          id: string
          joined_at: string
          sheet_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          joined_at?: string
          sheet_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          joined_at?: string
          sheet_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_secrets: {
        Row: {
          campaign_id: string
          password_hash: string | null
        }
        Insert: {
          campaign_id: string
          password_hash?: string | null
        }
        Update: {
          campaign_id?: string
          password_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_secrets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          code: string
          created_at: string
          has_password: boolean
          id: string
          master_id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          has_password?: boolean
          id?: string
          master_id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          has_password?: boolean
          id?: string
          master_id?: string
          name?: string
        }
        Relationships: []
      }
      combat_participants: {
        Row: {
          active: boolean
          bloqueio: number
          combat_id: string
          corpo: number
          espirito: number
          esquiva: number
          id: string
          initiative: number
          kind: string
          mente: number
          name: string
          npc_id: string | null
          order_index: number
          pf_current: number
          pf_max: number
          pv_current: number
          pv_max: number
          sheet_id: string | null
          weapon: string | null
        }
        Insert: {
          active?: boolean
          bloqueio: number
          combat_id: string
          corpo: number
          espirito: number
          esquiva: number
          id?: string
          initiative: number
          kind: string
          mente: number
          name: string
          npc_id?: string | null
          order_index: number
          pf_current: number
          pf_max: number
          pv_current: number
          pv_max: number
          sheet_id?: string | null
          weapon?: string | null
        }
        Update: {
          active?: boolean
          bloqueio?: number
          combat_id?: string
          corpo?: number
          espirito?: number
          esquiva?: number
          id?: string
          initiative?: number
          kind?: string
          mente?: number
          name?: string
          npc_id?: string | null
          order_index?: number
          pf_current?: number
          pf_max?: number
          pv_current?: number
          pv_max?: number
          sheet_id?: string | null
          weapon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combat_participants_combat_id_fkey"
            columns: ["combat_id"]
            isOneToOne: false
            referencedRelation: "combats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs_enemies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      combats: {
        Row: {
          campaign_id: string
          created_at: string
          ended_at: string | null
          id: string
          round: number
          status: string
          turn_index: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          round?: number
          status?: string
          turn_index?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          round?: number
          status?: string
          turn_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "combats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          campaign_id: string
          combat_id: string | null
          created_at: string
          data: Json
          id: string
          message: string
          type: string
        }
        Insert: {
          campaign_id: string
          combat_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          message: string
          type: string
        }
        Update: {
          campaign_id?: string
          combat_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          message?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_combat_id_fkey"
            columns: ["combat_id"]
            isOneToOne: false
            referencedRelation: "combats"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs_enemies: {
        Row: {
          bloqueio: number | null
          campaign_id: string
          corpo: number
          created_at: string
          deslocamento: number | null
          espirito: number
          esquiva: number | null
          id: string
          kind: string
          mente: number
          name: string
          pf_current: number | null
          pf_max: number | null
          pv_current: number | null
          pv_max: number | null
          weapon: string | null
        }
        Insert: {
          bloqueio?: number | null
          campaign_id: string
          corpo?: number
          created_at?: string
          deslocamento?: number | null
          espirito?: number
          esquiva?: number | null
          id?: string
          kind?: string
          mente?: number
          name: string
          pf_current?: number | null
          pf_max?: number | null
          pv_current?: number | null
          pv_max?: number | null
          weapon?: string | null
        }
        Update: {
          bloqueio?: number | null
          campaign_id?: string
          corpo?: number
          created_at?: string
          deslocamento?: number | null
          espirito?: number
          esquiva?: number | null
          id?: string
          kind?: string
          mente?: number
          name?: string
          pf_current?: number | null
          pf_max?: number | null
          pv_current?: number | null
          pv_max?: number | null
          weapon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "npcs_enemies_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      roll_history: {
        Row: {
          created_at: string
          dice: Json
          expression: string
          id: string
          modifier: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          dice: Json
          expression: string
          id?: string
          modifier?: number
          total: number
          user_id?: string
        }
        Update: {
          created_at?: string
          dice?: Json
          expression?: string
          id?: string
          modifier?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      sheets: {
        Row: {
          bloqueio: number | null
          concept: string | null
          corpo: number
          created_at: string
          deslocamento: number | null
          espirito: number
          esquiva: number | null
          id: string
          karma: number
          mente: number
          name: string
          pf_current: number | null
          pf_max: number | null
          pv_current: number | null
          pv_max: number | null
          user_id: string
          weapon: string | null
        }
        Insert: {
          bloqueio?: number | null
          concept?: string | null
          corpo?: number
          created_at?: string
          deslocamento?: number | null
          espirito?: number
          esquiva?: number | null
          id?: string
          karma?: number
          mente?: number
          name: string
          pf_current?: number | null
          pf_max?: number | null
          pv_current?: number | null
          pv_max?: number | null
          user_id?: string
          weapon?: string | null
        }
        Update: {
          bloqueio?: number | null
          concept?: string | null
          corpo?: number
          created_at?: string
          deslocamento?: number | null
          espirito?: number
          esquiva?: number | null
          id?: string
          karma?: number
          mente?: number
          name?: string
          pf_current?: number | null
          pf_max?: number | null
          pv_current?: number | null
          pv_max?: number | null
          user_id?: string
          weapon?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _apply_damage: {
        Args: { p_amount: number; p_participant: string }
        Returns: Json
      }
      can_view_sheet: { Args: { _sid: string }; Returns: boolean }
      combat_apply_damage: {
        Args: { p_amount: number; p_participant_id: string }
        Returns: Json
      }
      create_campaign: {
        Args: { p_name: string; p_password?: string }
        Returns: {
          code: string
          created_at: string
          has_password: boolean
          id: string
          master_id: string
          name: string
        }
        SetofOptions: {
          from: "*"
          to: "campaigns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      end_combat: { Args: { p_combat_id: string }; Returns: undefined }
      is_campaign_master: { Args: { _cid: string }; Returns: boolean }
      is_campaign_member: { Args: { _cid: string }; Returns: boolean }
      join_campaign: {
        Args: { p_code: string; p_password: string; p_sheet_id: string }
        Returns: string
      }
      next_turn: { Args: { p_combat_id: string }; Returns: undefined }
      perform_attack: {
        Args: {
          p_attribute: string
          p_base_damage: number
          p_combat_id: string
          p_defense: string
          p_karmic?: boolean
          p_target_id: string
          p_weapon?: string
        }
        Returns: Json
      }
      record_roll: {
        Args: { p_expression: string }
        Returns: {
          created_at: string
          dice: Json
          expression: string
          id: string
          modifier: number
          total: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "roll_history"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_combat: { Args: { p_campaign_id: string }; Returns: string }
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
