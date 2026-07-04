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
export type CreditorCampaignStatus = "draft" | "pending_review" | "published" | "expired";
export type MediatorProfileStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_revision"
  | "approved"
  | "rejected"
  | "suspended";
export type AppointmentStatus =
  | "requested"
  | "pending_confirmation"
  | "confirmed"
  | "reschedule_requested"
  | "completed"
  | "cancelled"
  | "no_show";
export type MeetingType = "online" | "onsite" | "hybrid";
export type MeetingProvider = "manual_link" | "google_meet" | "zoom" | "other";
export type AppointmentParticipantRole = "debtor" | "creditor_officer" | "mediator" | "admin";
export type AppointmentParticipantStatus = "pending" | "confirmed" | "reschedule_requested" | "declined" | "no_show";
export type MediationResultStatus = "settled" | "not_settled";
export type PaymentFrequency = "monthly" | "biweekly" | "weekly" | "custom";
export type SettlementDocumentType = "settlement_agreement" | "unsuccessful_closing_report";
export type BillingInvoiceStatus = "draft" | "issued" | "sent" | "paid" | "overdue" | "cancelled";
export type CaseStatus =
  | "draft"
  | "submitted"
  | "reviewing"
  | "admin_review"
  | "needs_more_info"
  | "creditor_review"
  | "creditor_accepted"
  | "creditor_rejected"
  | "matched"
  | "mediator_matching"
  | "mediator_selected"
  | "scheduled"
  | "appointment_scheduling"
  | "in_mediation"
  | "settlement_draft"
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
          creditor_campaign_id: string | null;
          creditor_name: string;
          creditor_type: string;
          debt_type: string;
          debt_amount: number;
          overdue_months: number;
          contract_number: string | null;
          account_number: string | null;
          monthly_income: number | null;
          monthly_expense: number | null;
          affordable_monthly_payment: number | null;
          address: string | null;
          province: string;
          district: string;
          contact_phone: string;
          problem_description: string;
          desired_solution: string;
          uploaded_documents: Json;
          admin_review_note: string | null;
          creditor_response_note: string | null;
          rejection_reason: string | null;
          selected_mediator_profile_id: string | null;
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
          creditor_campaign_id?: string | null;
          creditor_name: string;
          creditor_type: string;
          debt_type: string;
          debt_amount: number;
          overdue_months?: number;
          contract_number?: string | null;
          account_number?: string | null;
          monthly_income?: number | null;
          monthly_expense?: number | null;
          affordable_monthly_payment?: number | null;
          address?: string | null;
          province: string;
          district: string;
          contact_phone: string;
          problem_description: string;
          desired_solution: string;
          uploaded_documents?: Json;
          admin_review_note?: string | null;
          creditor_response_note?: string | null;
          rejection_reason?: string | null;
          selected_mediator_profile_id?: string | null;
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
          creditor_campaign_id?: string | null;
          creditor_name?: string;
          creditor_type?: string;
          debt_type?: string;
          debt_amount?: number;
          overdue_months?: number;
          contract_number?: string | null;
          account_number?: string | null;
          monthly_income?: number | null;
          monthly_expense?: number | null;
          affordable_monthly_payment?: number | null;
          address?: string | null;
          province?: string;
          district?: string;
          contact_phone?: string;
          problem_description?: string;
          desired_solution?: string;
          uploaded_documents?: Json;
          admin_review_note?: string | null;
          creditor_response_note?: string | null;
          rejection_reason?: string | null;
          selected_mediator_profile_id?: string | null;
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
          logo_url: string | null;
          short_name: string | null;
          website: string | null;
          tax_id: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          status: CreditorOrganizationStatus;
          is_public: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_name: string;
          organization_type: string;
          logo?: string | null;
          logo_url?: string | null;
          short_name?: string | null;
          website?: string | null;
          tax_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          status?: CreditorOrganizationStatus;
          is_public?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_name?: string;
          organization_type?: string;
          logo?: string | null;
          logo_url?: string | null;
          short_name?: string | null;
          website?: string | null;
          tax_id?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          status?: CreditorOrganizationStatus;
          is_public?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creditor_campaigns: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          subtitle: string | null;
          description: string;
          campaign_image_url: string | null;
          campaign_start_date: string | null;
          campaign_end_date: string | null;
          conditions: Json;
          benefits: Json;
          required_documents: Json;
          faqs: Json;
          target_debt_type: string | null;
          target_province: string | null;
          call_to_action_text: string | null;
          button_text: string;
          button_link: string | null;
          status: CreditorCampaignStatus;
          is_featured: boolean;
          display_order: number;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          subtitle?: string | null;
          description: string;
          campaign_image_url?: string | null;
          campaign_start_date?: string | null;
          campaign_end_date?: string | null;
          conditions?: Json;
          benefits?: Json;
          required_documents?: Json;
          faqs?: Json;
          target_debt_type?: string | null;
          target_province?: string | null;
          call_to_action_text?: string | null;
          button_text?: string;
          button_link?: string | null;
          status?: CreditorCampaignStatus;
          is_featured?: boolean;
          display_order?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          subtitle?: string | null;
          description?: string;
          campaign_image_url?: string | null;
          campaign_start_date?: string | null;
          campaign_end_date?: string | null;
          conditions?: Json;
          benefits?: Json;
          required_documents?: Json;
          faqs?: Json;
          target_debt_type?: string | null;
          target_province?: string | null;
          call_to_action_text?: string | null;
          button_text?: string;
          button_link?: string | null;
          status?: CreditorCampaignStatus;
          is_featured?: boolean;
          display_order?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_note?: string | null;
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
      case_comments: {
        Row: {
          id: string;
          case_id: string;
          author_profile_id: string | null;
          audience: "internal" | "debtor" | "creditor";
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          author_profile_id?: string | null;
          audience?: "internal" | "debtor" | "creditor";
          comment: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          author_profile_id?: string | null;
          audience?: "internal" | "debtor" | "creditor";
          comment?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      mediator_profiles: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          first_name: string;
          last_name: string;
          profile_photo_url: string | null;
          citizen_id: string | null;
          date_of_birth: string | null;
          gender: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          province: string | null;
          district: string | null;
          education_level: string | null;
          education_detail: string | null;
          occupation: string | null;
          current_organization: string | null;
          mediator_license_number: string | null;
          mediator_registration_authority: string | null;
          mediation_experience_years: number;
          total_cases_handled: number;
          successful_cases: number;
          expertise_areas: Json;
          debt_types_supported: Json;
          languages: Json;
          service_provinces: Json;
          online_mediation_available: boolean;
          onsite_mediation_available: boolean;
          profile_summary: string | null;
          status: MediatorProfileStatus;
          admin_review_note: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          first_name?: string;
          last_name?: string;
          profile_photo_url?: string | null;
          citizen_id?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          province?: string | null;
          district?: string | null;
          education_level?: string | null;
          education_detail?: string | null;
          occupation?: string | null;
          current_organization?: string | null;
          mediator_license_number?: string | null;
          mediator_registration_authority?: string | null;
          mediation_experience_years?: number;
          total_cases_handled?: number;
          successful_cases?: number;
          expertise_areas?: Json;
          debt_types_supported?: Json;
          languages?: Json;
          service_provinces?: Json;
          online_mediation_available?: boolean;
          onsite_mediation_available?: boolean;
          profile_summary?: string | null;
          status?: MediatorProfileStatus;
          admin_review_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_profiles"]["Insert"]>;
        Relationships: [];
      };
      mediator_certifications: {
        Row: {
          id: string;
          mediator_profile_id: string;
          certification_name: string;
          issuer: string | null;
          issued_date: string | null;
          certificate_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          certification_name: string;
          issuer?: string | null;
          issued_date?: string | null;
          certificate_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_certifications"]["Insert"]>;
        Relationships: [];
      };
      mediator_experiences: {
        Row: {
          id: string;
          mediator_profile_id: string;
          organization_name: string | null;
          role_title: string | null;
          case_type: string | null;
          description: string | null;
          start_year: number | null;
          end_year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          organization_name?: string | null;
          role_title?: string | null;
          case_type?: string | null;
          description?: string | null;
          start_year?: number | null;
          end_year?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_experiences"]["Insert"]>;
        Relationships: [];
      };
      mediator_specialties: {
        Row: {
          id: string;
          mediator_profile_id: string;
          specialty: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          specialty: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_specialties"]["Insert"]>;
        Relationships: [];
      };
      mediator_availability: {
        Row: {
          id: string;
          mediator_profile_id: string;
          available_days: Json;
          available_time_slots: Json;
          max_cases_per_month: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          available_days?: Json;
          available_time_slots?: Json;
          max_cases_per_month?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_availability"]["Insert"]>;
        Relationships: [];
      };
      mediator_availability_slots: {
        Row: {
          id: string;
          mediator_profile_id: string;
          slot_date: string | null;
          day_of_week: number | null;
          start_time: string;
          end_time: string;
          timezone: string;
          meeting_type: MeetingType;
          is_recurring: boolean;
          active: boolean;
          max_cases_per_day: number;
          max_cases_per_month: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          slot_date?: string | null;
          day_of_week?: number | null;
          start_time: string;
          end_time: string;
          timezone?: string;
          meeting_type?: MeetingType;
          is_recurring?: boolean;
          active?: boolean;
          max_cases_per_day?: number;
          max_cases_per_month?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_availability_slots"]["Insert"]>;
        Relationships: [];
      };
      mediator_documents: {
        Row: {
          id: string;
          mediator_profile_id: string;
          document_type: string;
          file_name: string | null;
          file_url: string;
          visibility: "admin_only" | "public";
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          document_type: string;
          file_name?: string | null;
          file_url: string;
          visibility?: "admin_only" | "public";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_documents"]["Insert"]>;
        Relationships: [];
      };
      mediator_review_logs: {
        Row: {
          id: string;
          mediator_profile_id: string;
          reviewer_profile_id: string | null;
          from_status: MediatorProfileStatus | null;
          to_status: MediatorProfileStatus;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_profile_id: string;
          reviewer_profile_id?: string | null;
          from_status?: MediatorProfileStatus | null;
          to_status: MediatorProfileStatus;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_review_logs"]["Insert"]>;
        Relationships: [];
      };
      mediator_trust_scores: {
        Row: {
          id: string;
          mediator_id: string;
          overall_score: number;
          rating_score: number;
          success_rate_score: number;
          experience_score: number;
          response_score: number;
          reliability_score: number;
          qualification_score: number;
          review_count: number;
          average_rating: number;
          completed_cases: number;
          successful_cases: number;
          badge_code: "gold_elite" | "platinum" | "trusted" | "verified" | "new_mediator";
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          mediator_id: string;
          overall_score?: number;
          rating_score?: number;
          success_rate_score?: number;
          experience_score?: number;
          response_score?: number;
          reliability_score?: number;
          qualification_score?: number;
          review_count?: number;
          average_rating?: number;
          completed_cases?: number;
          successful_cases?: number;
          badge_code?: "gold_elite" | "platinum" | "trusted" | "verified" | "new_mediator";
          calculated_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_trust_scores"]["Insert"]>;
        Relationships: [];
      };
      mediation_appointments: {
        Row: {
          id: string;
          case_id: string;
          mediator_id: string;
          debtor_user_id: string;
          creditor_organization_id: string | null;
          creditor_officer_user_id: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          timezone: string;
          meeting_type: MeetingType;
          meeting_url: string | null;
          meeting_provider: MeetingProvider;
          status: AppointmentStatus;
          requested_by: string | null;
          confirmed_by_mediator_at: string | null;
          confirmed_by_creditor_at: string | null;
          confirmed_by_debtor_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          mediator_id: string;
          debtor_user_id: string;
          creditor_organization_id?: string | null;
          creditor_officer_user_id?: string | null;
          appointment_date: string;
          start_time: string;
          end_time: string;
          timezone?: string;
          meeting_type?: MeetingType;
          meeting_url?: string | null;
          meeting_provider?: MeetingProvider;
          status?: AppointmentStatus;
          requested_by?: string | null;
          confirmed_by_mediator_at?: string | null;
          confirmed_by_creditor_at?: string | null;
          confirmed_by_debtor_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediation_appointments"]["Insert"]>;
        Relationships: [];
      };
      appointment_participants: {
        Row: {
          id: string;
          appointment_id: string;
          profile_id: string | null;
          organization_id: string | null;
          role: AppointmentParticipantRole;
          status: AppointmentParticipantStatus;
          note: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          profile_id?: string | null;
          organization_id?: string | null;
          role: AppointmentParticipantRole;
          status?: AppointmentParticipantStatus;
          note?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_participants"]["Insert"]>;
        Relationships: [];
      };
      appointment_status_history: {
        Row: {
          id: string;
          appointment_id: string;
          from_status: AppointmentStatus | null;
          to_status: AppointmentStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          from_status?: AppointmentStatus | null;
          to_status: AppointmentStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_status_history"]["Insert"]>;
        Relationships: [];
      };
      fee_settings: {
        Row: {
          id: string; platform_fee_percent: number; success_fee_percent: number; currency: string; vat_percent: number; invoice_prefix: string; payment_due_days: number;
          bank_account_name: string | null; bank_account_number: string | null; bank_name: string | null; fee_policy_description: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; platform_fee_percent?: number; success_fee_percent?: number; currency?: string; vat_percent?: number; invoice_prefix?: string; payment_due_days?: number;
          bank_account_name?: string | null; bank_account_number?: string | null; bank_name?: string | null; fee_policy_description?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fee_settings"]["Insert"]>;
        Relationships: [];
      };
      mediation_closing_records: {
        Row: {
          id: string; case_id: string; appointment_id: string | null; mediator_id: string; debtor_user_id: string; creditor_organization_id: string | null; result_status: MediationResultStatus;
          original_debt_amount: number; settled_amount: number | null; settlement_summary: string | null; unsuccessful_reason: string | null; mediator_note: string | null;
          closed_at: string; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; case_id: string; appointment_id?: string | null; mediator_id: string; debtor_user_id: string; creditor_organization_id?: string | null; result_status: MediationResultStatus;
          original_debt_amount: number; settled_amount?: number | null; settlement_summary?: string | null; unsuccessful_reason?: string | null; mediator_note?: string | null;
          closed_at?: string; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediation_closing_records"]["Insert"]>;
        Relationships: [];
      };
      settlement_payment_plans: {
        Row: {
          id: string; closing_record_id: string; case_id: string; total_settlement_amount: number; down_payment_amount: number; installment_amount: number; number_of_installments: number;
          first_payment_due_date: string | null; payment_frequency: PaymentFrequency; payment_method: string | null; special_terms: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; closing_record_id: string; case_id: string; total_settlement_amount: number; down_payment_amount?: number; installment_amount?: number; number_of_installments?: number;
          first_payment_due_date?: string | null; payment_frequency?: PaymentFrequency; payment_method?: string | null; special_terms?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlement_payment_plans"]["Insert"]>;
        Relationships: [];
      };
      settlement_documents: {
        Row: {
          id: string; closing_record_id: string; case_id: string; document_type: SettlementDocumentType; pdf_url: string | null; generated_at: string;
          sent_to_debtor_at: string | null; sent_to_creditor_at: string | null; sent_to_mediator_at: string | null; created_at: string;
        };
        Insert: {
          id?: string; closing_record_id: string; case_id: string; document_type: SettlementDocumentType; pdf_url?: string | null; generated_at?: string;
          sent_to_debtor_at?: string | null; sent_to_creditor_at?: string | null; sent_to_mediator_at?: string | null; created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlement_documents"]["Insert"]>;
        Relationships: [];
      };
      billing_invoices: {
        Row: {
          id: string; invoice_number: string; case_id: string; closing_record_id: string; creditor_organization_id: string | null; original_debt_amount: number; settled_amount: number | null;
          platform_fee_percent: number; platform_fee_amount: number; success_fee_percent: number; success_fee_amount: number; vat_percent: number; vat_amount: number; total_amount: number;
          status: BillingInvoiceStatus; issued_at: string; due_at: string | null; paid_at: string | null; pdf_url: string | null; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; invoice_number: string; case_id: string; closing_record_id: string; creditor_organization_id?: string | null; original_debt_amount?: number; settled_amount?: number | null;
          platform_fee_percent?: number; platform_fee_amount?: number; success_fee_percent?: number; success_fee_amount?: number; vat_percent?: number; vat_amount?: number; total_amount?: number;
          status?: BillingInvoiceStatus; issued_at?: string; due_at?: string | null; paid_at?: string | null; pdf_url?: string | null; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_invoices"]["Insert"]>;
        Relationships: [];
      };
      billing_invoice_items: {
        Row: { id: string; invoice_id: string; item_name: string; description: string | null; calculation_base_amount: number; fee_percent: number; amount: number; created_at: string; };
        Insert: { id?: string; invoice_id: string; item_name: string; description?: string | null; calculation_base_amount?: number; fee_percent?: number; amount?: number; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["billing_invoice_items"]["Insert"]>;
        Relationships: [];
      };
      email_logs: {
        Row: { id: string; case_id: string | null; recipient_email: string | null; recipient_role: string; subject: string; template_name: string; status: string; error_message: string | null; sent_at: string | null; created_at: string; };
        Insert: { id?: string; case_id?: string | null; recipient_email?: string | null; recipient_role: string; subject: string; template_name: string; status?: string; error_message?: string | null; sent_at?: string | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["email_logs"]["Insert"]>;
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
      creditor_campaign_status: CreditorCampaignStatus;
      creditor_officer_role: CreditorOfficerRole;
      creditor_response_status: CreditorResponseStatus;
      mediator_profile_status: MediatorProfileStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
