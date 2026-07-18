export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      project_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["project_activity_type"]
          changed_fields: string[]
          changes: Json
          id: string
          occurred_at: string
          project_id: string | null
          project_title: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["project_activity_type"]
          changed_fields?: string[]
          changes?: Json
          id?: string
          occurred_at?: string
          project_id?: string | null
          project_title: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["project_activity_type"]
          changed_fields?: string[]
          changes?: Json
          id?: string
          occurred_at?: string
          project_id?: string | null
          project_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["project_priority"]
          project_lead: string
          sample_key: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_lead: string
          sample_key?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_lead?: string
          sample_key?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sample_project_sets: {
        Row: {
          anchor_date: string
          loaded_at: string
          user_id: string
        }
        Insert: {
          anchor_date: string
          loaded_at?: string
          user_id: string
        }
        Update: {
          anchor_date?: string
          loaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_completion_trend: {
        Args: { p_timezone?: string }
        Returns: {
          completion_count: number
          week_start: string
        }[]
      }
      get_dashboard_metrics: {
        Args: { p_local_date?: string; p_timezone?: string }
        Returns: {
          active_projects: number
          completed_projects: number
          completed_with_deadline: number
          completion_rate: number
          late_completion_rate: number
          late_completions: number
          overdue_projects: number
          total_projects: number
        }[]
      }
      get_status_distribution: {
        Args: never
        Returns: {
          percentage: number
          project_count: number
          status: Database["public"]["Enums"]["project_status"]
        }[]
      }
      get_upcoming_deadlines: {
        Args: { p_local_date?: string }
        Returns: {
          deadline: string
          id: string
          priority: Database["public"]["Enums"]["project_priority"]
          project_lead: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
        }[]
      }
      list_projects: {
        Args: {
          p_deadline?: Database["public"]["Enums"]["project_deadline_filter"]
          p_local_date?: string
          p_page?: number
          p_page_size?: number
          p_priority?: Database["public"]["Enums"]["project_priority"][]
          p_query?: string
          p_sort?: string
          p_status?: Database["public"]["Enums"]["project_status"][]
        }
        Returns: {
          created_at: string
          deadline: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["project_priority"]
          project_lead: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          total_count: number
          updated_at: string
        }[]
      }
      load_sample_project_set: {
        Args: never
        Returns: {
          anchor_date: string
          inserted_count: number
          total_projects: number
        }[]
      }
    }
    Enums: {
      project_activity_type:
        | "created"
        | "updated"
        | "status_changed"
        | "deleted"
      project_deadline_filter: "all" | "overdue" | "upcoming" | "no_deadline"
      project_priority: "low" | "medium" | "high"
      project_status: "planning" | "active" | "review" | "completed"
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
      project_activity_type: [
        "created",
        "updated",
        "status_changed",
        "deleted",
      ],
      project_deadline_filter: ["all", "overdue", "upcoming", "no_deadline"],
      project_priority: ["low", "medium", "high"],
      project_status: ["planning", "active", "review", "completed"],
    },
  },
} as const

