// Gerado a partir do banco (Supabase › generate types). Não edite à mão:
// quando o esquema mudar, gere de novo.
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
      body_entries: {
        Row: {
          date: string
          deleted_at: string | null
          id: string
          measures: Json
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          date: string
          deleted_at?: string | null
          id?: string
          measures?: Json
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Update: {
          date?: string
          deleted_at?: string | null
          id?: string
          measures?: Json
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      day_logs: {
        Row: {
          date: string
          meals_done: string[]
          swaps: Json
          updated_at: string
          user_id: string
          variants: Json
          water_log: number[]
        }
        Insert: {
          date: string
          meals_done?: string[]
          swaps?: Json
          updated_at?: string
          user_id?: string
          variants?: Json
          water_log?: number[]
        }
        Update: {
          date?: string
          meals_done?: string[]
          swaps?: Json
          updated_at?: string
          user_id?: string
          variants?: Json
          water_log?: number[]
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          plan: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          plan: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          plan?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          water_goal_ml: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          water_goal_ml?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          water_goal_ml?: number
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          schedule: Json
          stretches: Json
          updated_at: string
          user_id: string
          workouts: Json
        }
        Insert: {
          schedule?: Json
          stretches?: Json
          updated_at?: string
          user_id?: string
          workouts?: Json
        }
        Update: {
          schedule?: Json
          stretches?: Json
          updated_at?: string
          user_id?: string
          workouts?: Json
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: { auth: string; created_at: string; endpoint: string; id: string; p256dh: string; user_agent: string | null; user_id: string }
        Insert: { auth: string; created_at?: string; endpoint: string; id?: string; p256dh: string; user_agent?: string | null; user_id: string }
        Update: { auth?: string; created_at?: string; endpoint?: string; id?: string; p256dh?: string; user_agent?: string | null; user_id?: string }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          last_water_push_at: string | null
          last_workout_push_on: string | null
          timezone: string
          updated_at: string
          user_id: string
          water_enabled: boolean
          water_every_min: number
          window_end: string
          window_start: string
          workout_enabled: boolean
          workout_time: string
        }
        Insert: {
          last_water_push_at?: string | null
          last_workout_push_on?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          water_enabled?: boolean
          water_every_min?: number
          window_end?: string
          window_start?: string
          workout_enabled?: boolean
          workout_time?: string
        }
        Update: {
          last_water_push_at?: string | null
          last_workout_push_on?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          water_enabled?: boolean
          water_every_min?: number
          window_end?: string
          window_start?: string
          workout_enabled?: boolean
          workout_time?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          cardio: Json | null
          finished_at: string | null
          id: string
          logs: Json
          started_at: string
          suggestions: Json | null
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          cardio?: Json | null
          finished_at?: string | null
          id?: string
          logs?: Json
          started_at: string
          suggestions?: Json | null
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          cardio?: Json | null
          finished_at?: string | null
          id?: string
          logs?: Json
          started_at?: string
          suggestions?: Json | null
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
      save_push_subscription: {
        Args: { p_auth: string; p_endpoint: string; p_p256dh: string; p_user_agent?: string }
        Returns: undefined
      }
      vapid_public_key: { Args: never; Returns: string }
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
