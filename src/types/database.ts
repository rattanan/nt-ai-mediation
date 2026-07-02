export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "debtor" | "mediator" | "creditor" | "admin";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          full_name: string;
          phone: string | null;
          organization_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AppRole;
          full_name: string;
          phone?: string | null;
          organization_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          full_name?: string;
          phone?: string | null;
          organization_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      creditors: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          tax_id: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          tax_id?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          name?: string;
          tax_id?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mediators: {
        Row: {
          id: string;
          profile_id: string;
          license_no: string | null;
          expertise: string[];
          service_area: string | null;
          active: boolean;
          max_active_cases: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          license_no?: string | null;
          expertise?: string[];
          service_area?: string | null;
          active?: boolean;
          max_active_cases?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          license_no?: string | null;
          expertise?: string[];
          service_area?: string | null;
          active?: boolean;
          max_active_cases?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      debtor_cases: {
        Row: {
          id: string;
          case_number: string;
          debtor_profile_id: string;
          creditor_id: string | null;
          mediator_id: string | null;
          debt_amount: number;
          debt_type: string;
          status: "draft" | "submitted" | "ai_interview" | "matching" | "scheduled" | "in_mediation" | "settled" | "closed" | "cancelled";
          ai_summary: string | null;
          debtor_notes: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number?: string;
          debtor_profile_id?: string;
          creditor_id?: string | null;
          mediator_id?: string | null;
          debt_amount: number;
          debt_type: string;
          status?: "draft" | "submitted" | "ai_interview" | "matching" | "scheduled" | "in_mediation" | "settled" | "closed" | "cancelled";
          ai_summary?: string | null;
          debtor_notes?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          debtor_profile_id?: string;
          creditor_id?: string | null;
          mediator_id?: string | null;
          debt_amount?: number;
          debt_type?: string;
          status?: "draft" | "submitted" | "ai_interview" | "matching" | "scheduled" | "in_mediation" | "settled" | "closed" | "cancelled";
          ai_summary?: string | null;
          debtor_notes?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mediation_sessions: {
        Row: {
          id: string;
          case_id: string;
          mediator_id: string | null;
          scheduled_at: string;
          duration_minutes: number;
          channel: "online" | "phone" | "onsite";
          meeting_url: string | null;
          status: "scheduled" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          mediator_id?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          channel?: "online" | "phone" | "onsite";
          meeting_url?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          mediator_id?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          channel?: "online" | "phone" | "onsite";
          meeting_url?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      settlement_agreements: {
        Row: {
          id: string;
          case_id: string;
          session_id: string | null;
          total_amount: number;
          monthly_payment: number | null;
          start_date: string | null;
          end_date: string | null;
          terms: string;
          status: "draft" | "proposed" | "accepted" | "active" | "completed" | "defaulted" | "cancelled";
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          session_id?: string | null;
          total_amount: number;
          monthly_payment?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          terms: string;
          status?: "draft" | "proposed" | "accepted" | "active" | "completed" | "defaulted" | "cancelled";
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          session_id?: string | null;
          total_amount?: number;
          monthly_payment?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          terms?: string;
          status?: "draft" | "proposed" | "accepted" | "active" | "completed" | "defaulted" | "cancelled";
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          uploaded_by: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          mime_type: string | null;
          file_size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          uploaded_by?: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          uploaded_by?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_profile_id: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_profile_id?: string | null;
          action: string;
          entity_table: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_profile_id?: string | null;
          action?: string;
          entity_table?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: {
        Args: Record<string, never>;
        Returns: AppRole;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
