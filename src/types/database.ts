export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "debtor" | "mediator" | "creditor" | "admin";
export type CreditorOrganizationStatus = "pending" | "approved" | "rejected" | "suspended";
export type CreditorOfficerRole = "creditor_admin" | "creditor_staff" | "creditor_approver";
export type CreditorResponseStatus =
  | "accepted"
  | "rejected"
  | "needs_more_info"
  | "settlement_proposed"
  | "settlement_approved";
export type CaseStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "needs_more_info"
  | "matched"
  | "scheduled"
  | "in_mediation"
  | "settled"
  | "not_settled"
  | "closed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          email: string | null;
          full_name: string;
          phone: string | null;
          organization_name: string | null;
          email_verified: boolean;
          account_status: "pending_verification" | "active" | "suspended" | "disabled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AppRole;
          email?: string | null;
          full_name: string;
          phone?: string | null;
          organization_name?: string | null;
          email_verified?: boolean;
          account_status?: "pending_verification" | "active" | "suspended" | "disabled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          email?: string | null;
          full_name?: string;
          phone?: string | null;
          organization_name?: string | null;
          email_verified?: boolean;
          account_status?: "pending_verification" | "active" | "suspended" | "disabled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          debtor_user_id: string;
          assigned_mediator_id: string | null;
          creditor_organization_id: string | null;
          creditor_name: string;
          creditor_type: string;
          debt_type: string;
          debt_amount: number;
          overdue_months: number;
          province: string;
          district: string;
          contact_phone: string;
          problem_description: string;
          desired_solution: string;
          status: CaseStatus;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number?: string;
          debtor_user_id?: string;
          assigned_mediator_id?: string | null;
          creditor_organization_id?: string | null;
          creditor_name: string;
          creditor_type: string;
          debt_type: string;
          debt_amount: number;
          overdue_months?: number;
          province: string;
          district: string;
          contact_phone: string;
          problem_description: string;
          desired_solution: string;
          status?: CaseStatus;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          debtor_user_id?: string;
          assigned_mediator_id?: string | null;
          creditor_organization_id?: string | null;
          creditor_name?: string;
          creditor_type?: string;
          debt_type?: string;
          debt_amount?: number;
          overdue_months?: number;
          province?: string;
          district?: string;
          contact_phone?: string;
          problem_description?: string;
          desired_solution?: string;
          status?: CaseStatus;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_status_history: {
        Row: {
          id: string;
          case_id: string;
          from_status: CaseStatus | null;
          to_status: CaseStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          from_status?: CaseStatus | null;
          to_status: CaseStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          from_status?: CaseStatus | null;
          to_status?: CaseStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      creditor_organizations: {
        Row: {
          id: string;
          organization_name: string;
          organization_type: string;
          logo: string | null;
          tax_id: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          status: CreditorOrganizationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_name: string;
          organization_type: string;
          logo?: string | null;
          tax_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          status?: CreditorOrganizationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_name?: string;
          organization_type?: string;
          logo?: string | null;
          tax_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          status?: CreditorOrganizationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creditor_officers: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          profile_image: string | null;
          first_name: string;
          last_name: string;
          mobile: string | null;
          email: string | null;
          position: string | null;
          role: CreditorOfficerRole;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          profile_image?: string | null;
          first_name: string;
          last_name: string;
          mobile?: string | null;
          email?: string | null;
          position?: string | null;
          role?: CreditorOfficerRole;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          profile_image?: string | null;
          first_name?: string;
          last_name?: string;
          mobile?: string | null;
          email?: string | null;
          position?: string | null;
          role?: CreditorOfficerRole;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      case_creditor_responses: {
        Row: {
          id: string;
          case_id: string;
          organization_id: string;
          officer_id: string | null;
          response: CreditorResponseStatus;
          reason: string | null;
          requested_information: string | null;
          proposed_terms: string | null;
          settlement_amount: number | null;
          monthly_payment: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          organization_id: string;
          officer_id?: string | null;
          response: CreditorResponseStatus;
          reason?: string | null;
          requested_information?: string | null;
          proposed_terms?: string | null;
          settlement_amount?: number | null;
          monthly_payment?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          organization_id?: string;
          officer_id?: string | null;
          response?: CreditorResponseStatus;
          reason?: string | null;
          requested_information?: string | null;
          proposed_terms?: string | null;
          settlement_amount?: number | null;
          monthly_payment?: number | null;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      case_documents: {
        Row: {
          id: string;
          case_id: string;
          mediation_case_id: string | null;
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
          mediation_case_id?: string | null;
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
          mediation_case_id?: string | null;
          uploaded_by?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          mime_type?: string | null;
          file_size_bytes?: number | null;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
      case_status: CaseStatus;
      creditor_organization_status: CreditorOrganizationStatus;
      creditor_officer_role: CreditorOfficerRole;
      creditor_response_status: CreditorResponseStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
