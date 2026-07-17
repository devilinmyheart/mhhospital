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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          department_id: string
          doctor_id: string
          duration_min: number
          id: string
          mode: Database["public"]["Enums"]["appointment_mode"]
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          session_token: string
          status: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          created_at?: string
          department_id: string
          doctor_id: string
          duration_min?: number
          id?: string
          mode?: Database["public"]["Enums"]["appointment_mode"]
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          session_token?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          created_at?: string
          department_id?: string
          doctor_id?: string
          duration_min?: number
          id?: string
          mode?: Database["public"]["Enums"]["appointment_mode"]
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          session_token?: string
          status?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          emailed_at: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          emailed_at?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          emailed_at?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          max_bookings_per_slot: number
          slot_duration_min: number
          start_time: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          max_bookings_per_slot?: number
          slot_duration_min?: number
          start_time: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          max_bookings_per_slot?: number
          slot_duration_min?: number
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          created_at: string
          department_id: string
          full_name: string
          id: string
          is_active: boolean
          photo_url: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department_id: string
          full_name: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          department_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_reports: {
        Row: {
          appointment_id: string | null
          category: string | null
          doctor_id: string | null
          file_path: string | null
          id: string
          patient_id: string
          status: string
          title: string
          uploaded_at: string
        }
        Insert: {
          appointment_id?: string | null
          category?: string | null
          doctor_id?: string | null
          file_path?: string | null
          id?: string
          patient_id: string
          status?: string
          title: string
          uploaded_at?: string
        }
        Update: {
          appointment_id?: string | null
          category?: string | null
          doctor_id?: string | null
          file_path?: string | null
          id?: string
          patient_id?: string
          status?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          doctor_id: string
          id: string
          issued_at: string
          medications: Json
          notes: string | null
          patient_id: string
          refills_remaining: number
        }
        Insert: {
          appointment_id?: string | null
          doctor_id: string
          id?: string
          issued_at?: string
          medications?: Json
          notes?: string | null
          patient_id: string
          refills_remaining?: number
        }
        Update: {
          appointment_id?: string | null
          doctor_id?: string
          id?: string
          issued_at?: string
          medications?: Json
          notes?: string | null
          patient_id?: string
          refills_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
      appointment_mode: "in_person" | "video"
      appointment_status: "booked" | "completed" | "cancelled"
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
      app_role: ["patient", "doctor", "admin"],
      appointment_mode: ["in_person", "video"],
      appointment_status: ["booked", "completed", "cancelled"],
    },
  },
} as const
