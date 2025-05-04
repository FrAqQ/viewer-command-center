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
      admin_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_requests: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatter_counts: {
        Row: {
          chatter_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chatter_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chatter_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commands: {
        Row: {
          id: string
          payload: Json | null
          status: string | null
          target: string
          timestamp: string | null
          type: string
        }
        Insert: {
          id?: string
          payload?: Json | null
          status?: string | null
          target: string
          timestamp?: string | null
          type: string
        }
        Update: {
          id?: string
          payload?: Json | null
          status?: string | null
          target?: string
          timestamp?: string | null
          type?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          details: Json | null
          id: string
          level: string
          message: string
          source: string
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          id?: string
          level: string
          message: string
          source: string
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          id?: string
          level?: string
          message?: string
          source?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number
          viewer_limit: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price: number
          viewer_limit: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          viewer_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_period_end: string | null
          email: string | null
          follower_plan: string | null
          id: string
          is_admin: boolean | null
          plan: string | null
          stripe_customer_id: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          follower_plan?: string | null
          id: string
          is_admin?: boolean | null
          plan?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          follower_plan?: string | null
          id?: string
          is_admin?: boolean | null
          plan?: string | null
          stripe_customer_id?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proxies: {
        Row: {
          address: string
          created_at: string | null
          fail_count: number | null
          id: string
          last_checked: string | null
          password: string | null
          port: string
          username: string | null
          valid: boolean | null
        }
        Insert: {
          address: string
          created_at?: string | null
          fail_count?: number | null
          id?: string
          last_checked?: string | null
          password?: string | null
          port: string
          username?: string | null
          valid?: boolean | null
        }
        Update: {
          address?: string
          created_at?: string | null
          fail_count?: number | null
          id?: string
          last_checked?: string | null
          password?: string | null
          port?: string
          username?: string | null
          valid?: boolean | null
        }
        Relationships: []
      }
      slaves: {
        Row: {
          cpu: number | null
          created_at: string | null
          hostname: string
          id: string
          instances: number | null
          ip: string
          last_seen: string | null
          name: string
          ram: number | null
          status: string
        }
        Insert: {
          cpu?: number | null
          created_at?: string | null
          hostname: string
          id?: string
          instances?: number | null
          ip: string
          last_seen?: string | null
          name: string
          ram?: number | null
          status: string
        }
        Update: {
          cpu?: number | null
          created_at?: string | null
          hostname?: string
          id?: string
          instances?: number | null
          ip?: string
          last_seen?: string | null
          name?: string
          ram?: number | null
          status?: string
        }
        Relationships: []
      }
      stream_stats: {
        Row: {
          chatter_count: number
          created_at: string
          id: string
          stream_url: string
          user_id: string | null
          viewer_count: number
        }
        Insert: {
          chatter_count: number
          created_at?: string
          id?: string
          stream_url: string
          user_id?: string | null
          viewer_count: number
        }
        Update: {
          chatter_count?: number
          created_at?: string
          id?: string
          stream_url?: string
          user_id?: string | null
          viewer_count?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          email: string | null
          id: string
          plan_id: string | null
          viewers_active: number | null
        }
        Insert: {
          email?: string | null
          id: string
          plan_id?: string | null
          viewers_active?: number | null
        }
        Update: {
          email?: string | null
          id?: string
          plan_id?: string | null
          viewers_active?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_counts: {
        Row: {
          updated_at: string
          user_id: string
          viewer_count: number
        }
        Insert: {
          updated_at?: string
          user_id: string
          viewer_count?: number
        }
        Update: {
          updated_at?: string
          user_id?: string
          viewer_count?: number
        }
        Relationships: []
      }
      viewer_logs: {
        Row: {
          id: string
          started_at: string | null
          user_id: string | null
          viewer_count: number | null
        }
        Insert: {
          id?: string
          started_at?: string | null
          user_id?: string | null
          viewer_count?: number | null
        }
        Update: {
          id?: string
          started_at?: string | null
          user_id?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_sessions: {
        Row: {
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viewer_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      viewers: {
        Row: {
          error: string | null
          id: string
          is_test: boolean | null
          proxy_id: string | null
          slave_id: string | null
          start_time: string | null
          status: string
          url: string
        }
        Insert: {
          error?: string | null
          id?: string
          is_test?: boolean | null
          proxy_id?: string | null
          slave_id?: string | null
          start_time?: string | null
          status: string
          url: string
        }
        Update: {
          error?: string | null
          id?: string
          is_test?: boolean | null
          proxy_id?: string | null
          slave_id?: string | null
          start_time?: string | null
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewers_proxy_id_fkey"
            columns: ["proxy_id"]
            isOneToOne: false
            referencedRelation: "proxies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewers_slave_id_fkey"
            columns: ["slave_id"]
            isOneToOne: false
            referencedRelation: "slaves"
            referencedColumns: ["id"]
          },
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
