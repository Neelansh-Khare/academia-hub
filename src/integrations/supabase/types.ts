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
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          cv_url: string | null
          id: string
          message: string | null
          post_id: string
          status: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          cv_url?: string | null
          id?: string
          message?: string | null
          post_id: string
          status?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          cv_url?: string | null
          id?: string
          message?: string | null
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lab_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_posts: {
        Row: {
          commitment_hours_per_week: number | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          institution: string | null
          location: string | null
          methods: string[] | null
          owner_id: string
          paid: boolean | null
          remote_allowed: boolean | null
          slug: string | null
          tags: string[] | null
          title: string
          tools: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          commitment_hours_per_week?: number | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          institution?: string | null
          location?: string | null
          methods?: string[] | null
          owner_id: string
          paid?: boolean | null
          remote_allowed?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title: string
          tools?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          commitment_hours_per_week?: number | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          institution?: string | null
          location?: string | null
          methods?: string[] | null
          owner_id?: string
          paid?: boolean | null
          remote_allowed?: boolean | null
          slug?: string | null
          tags?: string[] | null
          title?: string
          tools?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string | null
          body: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          application_id?: string | null
          body: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          application_id?: string | null
          body?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          full_name: string | null
          headline: string | null
          id: string
          institution: string | null
          location: string | null
          methods: string[] | null
          research_fields: string[] | null
          tools: string[] | null
          updated_at: string
          degree_status: string | null
          orcid_id: string | null
          google_scholar_id: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          institution?: string | null
          location?: string | null
          methods?: string[] | null
          research_fields?: string[] | null
          tools?: string[] | null
          updated_at?: string
          degree_status?: string | null
          orcid_id?: string | null
          google_scholar_id?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          institution?: string | null
          location?: string | null
          methods?: string[] | null
          research_fields?: string[] | null
          tools?: string[] | null
          updated_at?: string
          degree_status?: string | null
          orcid_id?: string | null
          google_scholar_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      linked_profiles: {
        Row: {
          id: string
          user_id: string
          platform: string
          url: string | null
          username: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          url?: string | null
          username?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          url?: string | null
          username?: string | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      publications: {
        Row: {
          id: string
          user_id: string
          title: string
          authors: string[] | null
          venue: string | null
          year: number | null
          url: string | null
          doi: string | null
          abstract: string | null
          citation_count: number | null
          source: string | null
          source_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          authors?: string[] | null
          venue?: string | null
          year?: number | null
          url?: string | null
          doi?: string | null
          abstract?: string | null
          citation_count?: number | null
          source?: string | null
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          authors?: string[] | null
          venue?: string | null
          year?: number | null
          url?: string | null
          doi?: string | null
          abstract?: string | null
          citation_count?: number | null
          source?: string | null
          source_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      papers: {
        Row: {
          id: string
          user_id: string
          title: string
          filename: string
          file_url: string
          page_count: number | null
          processed: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          filename: string
          file_url: string
          page_count?: number | null
          processed?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          filename?: string
          file_url?: string
          page_count?: number | null
          processed?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      paper_chunks: {
        Row: {
          id: string
          paper_id: string
          chunk_index: number
          chunk_text: string
          page_number: number | null
          embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          paper_id: string
          chunk_index: number
          chunk_text: string
          page_number?: number | null
          embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          paper_id?: string
          chunk_index?: number
          chunk_text?: string
          page_number?: number | null
          embedding?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_chunks_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          }
        ]
      }
      paper_conversations: {
        Row: {
          id: string
          paper_id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paper_id: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          paper_id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_conversations_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "papers"
            referencedColumns: ["id"]
          }
        ]
      }
      paper_messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          content: string
          chunks_used: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: string
          content: string
          chunks_used?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          content?: string
          chunks_used?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "paper_conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      research_assistant_outputs: {
        Row: {
          id: string
          user_id: string
          prompt: string
          topic: string | null
          papers: Json | null
          project_ideas: Json | null
          outline: Json | null
          datasets: Json | null
          libraries: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          topic?: string | null
          papers?: Json | null
          project_ideas?: Json | null
          outline?: Json | null
          datasets?: Json | null
          libraries?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          topic?: string | null
          papers?: Json | null
          project_ideas?: Json | null
          outline?: Json | null
          datasets?: Json | null
          libraries?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cold_emails: {
        Row: {
          id: string
          user_id: string
          recipient_name: string | null
          recipient_email: string | null
          recipient_institution: string | null
          subject: string
          body: string
          tone: string | null
          context: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_name?: string | null
          recipient_email?: string | null
          recipient_institution?: string | null
          subject: string
          body: string
          tone?: string | null
          context?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_name?: string | null
          recipient_email?: string | null
          recipient_institution?: string | null
          subject?: string
          body?: string
          tone?: string | null
          context?: string | null
          created_at?: string
        }
        Relationships: []
      }
      match_scores: {
        Row: {
          id: string
          student_id: string
          post_id: string
          overall_score: number
          keyword_score: number | null
          skills_score: number | null
          proximity_score: number | null
          llm_score: number | null
          explanation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          post_id: string
          overall_score: number
          keyword_score?: number | null
          skills_score?: number | null
          proximity_score?: number | null
          llm_score?: number | null
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          post_id?: string
          overall_score?: number
          keyword_score?: number | null
          skills_score?: number | null
          proximity_score?: number | null
          llm_score?: number | null
          explanation?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lab_posts"
            referencedColumns: ["id"]
          }
        ]
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
