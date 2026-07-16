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
export type SettlementDocumentSignatureRole = "debtor" | "creditor" | "mediator";
export type BillingInvoiceStatus = "draft" | "issued" | "sent" | "paid" | "overdue" | "cancelled";
export type MediatorReviewStatus = "pending" | "approved" | "rejected";
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
      consent_versions: {
        Row: {
          id: string;
          version: string;
          title_th: string;
          title_en: string;
          content_th: string;
          content_en: string;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version: string;
          title_th?: string;
          title_en?: string;
          content_th: string;
          content_en?: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: string;
          title_th?: string;
          title_en?: string;
          content_th?: string;
          content_en?: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_consents: {
        Row: {
          id: string;
          user_id: string;
          consent_version: string;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_version: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          consent_version?: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          language?: string;
          created_at?: string;
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
      case_completion_certificates: {
        Row: {
          id: string;
          case_id: string;
          closing_record_id: string;
          certificate_number: string;
          issued_to_user_id: string;
          mediator_id: string;
          issued_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          closing_record_id: string;
          certificate_number: string;
          issued_to_user_id: string;
          mediator_id: string;
          issued_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["case_completion_certificates"]["Insert"]>;
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
      mediator_working_hours: {
        Row: {
          id: string;
          mediator_id: string;
          weekday: number;
          is_enabled: boolean;
          start_time: string | null;
          end_time: string | null;
          break_start: string | null;
          break_end: string | null;
          slot_duration_minutes: number;
          buffer_before_minutes: number;
          buffer_after_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mediator_id: string;
          weekday: number;
          is_enabled?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          break_start?: string | null;
          break_end?: string | null;
          slot_duration_minutes?: number;
          buffer_before_minutes?: number;
          buffer_after_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_working_hours"]["Insert"]>;
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
      mediator_reviews: {
        Row: {
          id: string;
          case_id: string;
          mediator_id: string;
          debtor_user_id: string;
          rating: number;
          comment: string | null;
          status: MediatorReviewStatus;
          submitted_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          mediator_id: string;
          debtor_user_id: string;
          rating: number;
          comment?: string | null;
          status?: MediatorReviewStatus;
          submitted_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["mediator_reviews"]["Insert"]>;
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
          calendar_event_id: string | null;
          meet_space_name: string | null;
          meeting_code: string | null;
          organizer_email: string | null;
          google_sync_status: "not_created" | "creating" | "synced" | "updating" | "cancelling" | "cancelled" | "failed";
          google_sync_error: string | null;
          recording_status: "not_requested" | "waiting_consent" | "enabled" | "disabled" | "processing" | "ready" | "failed";
          meeting_created_by: string | null;
          artifact_poll_after: string | null;
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
          calendar_event_id?: string | null;
          meet_space_name?: string | null;
          meeting_code?: string | null;
          organizer_email?: string | null;
          google_sync_status?: "not_created" | "creating" | "synced" | "updating" | "cancelling" | "cancelled" | "failed";
          google_sync_error?: string | null;
          recording_status?: "not_requested" | "waiting_consent" | "enabled" | "disabled" | "processing" | "ready" | "failed";
          meeting_created_by?: string | null;
          artifact_poll_after?: string | null;
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
      settlement_document_signatures: {
        Row: {
          id: string; document_id: string; case_id: string; signer_role: SettlementDocumentSignatureRole; signer_user_id: string; signer_name: string; signature_image_data: string | null; signed_at: string; created_at: string;
        };
        Insert: {
          id?: string; document_id: string; case_id: string; signer_role: SettlementDocumentSignatureRole; signer_user_id: string; signer_name: string; signature_image_data?: string | null; signed_at?: string; created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlement_document_signatures"]["Insert"]>;
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
      case_documents: {
        Row: { id: string; case_id: string; uploaded_by: string | null; storage_path: string; file_name: string; mime_type: string | null; size_bytes: number; page_count: number | null; ocr_status: "pending" | "processing" | "completed" | "failed" | "manual_bypass"; ocr_text: string | null; ocr_confidence: number | null; extracted_fields: Json; confirmed_fields: Json; retry_count: number; last_error: string | null; processed_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; case_id: string; uploaded_by?: string | null; storage_path: string; file_name: string; mime_type?: string | null; size_bytes?: number; page_count?: number | null; ocr_status?: "pending" | "processing" | "completed" | "failed" | "manual_bypass"; ocr_text?: string | null; ocr_confidence?: number | null; extracted_fields?: Json; confirmed_fields?: Json; retry_count?: number; last_error?: string | null; processed_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["case_documents"]["Insert"]>;
        Relationships: [];
      };
      case_ai_sessions: {
        Row: { id: string; case_id: string; status: "pending" | "processing" | "interview" | "ready" | "completed" | "failed" | "manual_bypass"; summary: string | null; strengths: Json; benefits: Json; missing_fields: Json; question_count: number; bypass_reason: string | null; prompt_version: string; completed_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; case_id: string; status?: "pending" | "processing" | "interview" | "ready" | "completed" | "failed" | "manual_bypass"; summary?: string | null; strengths?: Json; benefits?: Json; missing_fields?: Json; question_count?: number; bypass_reason?: string | null; prompt_version?: string; completed_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["case_ai_sessions"]["Insert"]>;
        Relationships: [];
      };
      case_ai_messages: {
        Row: { id: string; session_id: string; case_id: string; role: "user" | "assistant" | "system"; content: string; sequence: number; metadata: Json; created_at: string; };
        Insert: { id?: string; session_id: string; case_id: string; role: "user" | "assistant" | "system"; content: string; sequence: number; metadata?: Json; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["case_ai_messages"]["Insert"]>;
        Relationships: [];
      };
      case_ai_assessments: {
        Row: { id: string; case_id: string; session_id: string; version: number; risk_score: number; risk_level: "low" | "medium" | "high"; factors: Json; risks: Json; strengths: Json; benefits: Json; rationale: string; model: string | null; prompt_version: string; review_status: "pending" | "approved" | "needs_correction"; reviewed_by: string | null; reviewed_at: string | null; review_note: string | null; created_at: string; };
        Insert: { id?: string; case_id: string; session_id: string; version?: number; risk_score: number; risk_level: "low" | "medium" | "high"; factors?: Json; risks?: Json; strengths?: Json; benefits?: Json; rationale: string; model?: string | null; prompt_version?: string; review_status?: "pending" | "approved" | "needs_correction"; reviewed_by?: string | null; reviewed_at?: string | null; review_note?: string | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["case_ai_assessments"]["Insert"]>;
        Relationships: [];
      };
      case_payment_plans: {
        Row: { id: string; case_id: string; assessment_id: string; plan_type: "light_payment" | "fast_close"; principal_amount: number; assumed_interest_rate: number; assumed_discount_rate: number; monthly_payment: number; term_months: number; total_payment: number; assumptions: Json; status: "proposed" | "selected" | "superseded"; selected_at: string | null; created_at: string; };
        Insert: { id?: string; case_id: string; assessment_id: string; plan_type: "light_payment" | "fast_close"; principal_amount: number; assumed_interest_rate?: number; assumed_discount_rate?: number; monthly_payment: number; term_months: number; total_payment: number; assumptions?: Json; status?: "proposed" | "selected" | "superseded"; selected_at?: string | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["case_payment_plans"]["Insert"]>;
        Relationships: [];
      };
      ai_rate_policies: {
        Row: { id: string; debt_type: string; min_interest_rate: number; max_interest_rate: number; min_discount_rate: number; max_discount_rate: number; active: boolean; updated_by: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; debt_type: string; min_interest_rate?: number; max_interest_rate?: number; min_discount_rate?: number; max_discount_rate?: number; active?: boolean; updated_by?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["ai_rate_policies"]["Insert"]>;
        Relationships: [];
      };
      ai_processing_jobs: {
        Row: { id: string; case_id: string; document_id: string | null; job_type: "ocr" | "interview" | "assessment"; status: "queued" | "processing" | "completed" | "failed" | "manual_bypass"; attempts: number; payload: Json; result: Json; last_error: string | null; available_at: string; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; case_id: string; document_id?: string | null; job_type: "ocr" | "interview" | "assessment"; status?: "queued" | "processing" | "completed" | "failed" | "manual_bypass"; attempts?: number; payload?: Json; result?: Json; last_error?: string | null; available_at?: string; started_at?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["ai_processing_jobs"]["Insert"]>;
        Relationships: [];
      };
      appointment_recording_consents: {
        Row: { id: string; appointment_id: string; participant_profile_id: string; participant_role: "debtor" | "creditor" | "mediator"; consented: boolean; consent_version: string; consented_at: string; revoked_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; appointment_id: string; participant_profile_id: string; participant_role: "debtor" | "creditor" | "mediator"; consented: boolean; consent_version: string; consented_at?: string; revoked_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["appointment_recording_consents"]["Insert"]>;
        Relationships: [];
      };
      meeting_artifacts: {
        Row: { id: string; appointment_id: string; artifact_type: "recording" | "native_transcript" | "manual_transcript"; provider: string; external_name: string | null; drive_file_id: string | null; source_uri: string | null; status: "discovered" | "downloading" | "copied" | "processed" | "failed" | "deleted"; metadata: Json; last_error: string | null; discovered_at: string; processed_at: string | null; created_at: string; };
        Insert: { id?: string; appointment_id: string; artifact_type: "recording" | "native_transcript" | "manual_transcript"; provider?: string; external_name?: string | null; drive_file_id?: string | null; source_uri?: string | null; status?: "discovered" | "downloading" | "copied" | "processed" | "failed" | "deleted"; metadata?: Json; last_error?: string | null; discovered_at?: string; processed_at?: string | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_artifacts"]["Insert"]>;
        Relationships: [];
      };
      meeting_transcripts: {
        Row: { id: string; appointment_id: string; artifact_id: string | null; status: "processing" | "ready" | "failed" | "expired"; language_code: string; source: "google_speech_v2" | "google_meet" | "manual"; raw_text: string | null; private_storage_path: string | null; average_confidence: number | null; retention_until: string; created_at: string; updated_at: string; };
        Insert: { id?: string; appointment_id: string; artifact_id?: string | null; status?: "processing" | "ready" | "failed" | "expired"; language_code?: string; source?: "google_speech_v2" | "google_meet" | "manual"; raw_text?: string | null; private_storage_path?: string | null; average_confidence?: number | null; retention_until?: string; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_transcripts"]["Insert"]>;
        Relationships: [];
      };
      meeting_transcript_segments: {
        Row: { id: string; transcript_id: string; sequence: number; start_offset_ms: number; end_offset_ms: number; speaker_label: string; verified_participant_profile_id: string | null; text: string; confidence: number | null; created_at: string; };
        Insert: { id?: string; transcript_id: string; sequence: number; start_offset_ms?: number; end_offset_ms?: number; speaker_label: string; verified_participant_profile_id?: string | null; text: string; confidence?: number | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_transcript_segments"]["Insert"]>;
        Relationships: [];
      };
      meeting_processing_jobs: {
        Row: { id: string; appointment_id: string; job_type: "artifact_poll" | "transcribe" | "summarize" | "retention_cleanup"; status: "queued" | "processing" | "completed" | "failed" | "manual_required"; attempts: number; next_attempt_at: string; payload: Json; result: Json; last_error: string | null; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; appointment_id: string; job_type: "artifact_poll" | "transcribe" | "summarize" | "retention_cleanup"; status?: "queued" | "processing" | "completed" | "failed" | "manual_required"; attempts?: number; next_attempt_at?: string; payload?: Json; result?: Json; last_error?: string | null; started_at?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_processing_jobs"]["Insert"]>;
        Relationships: [];
      };
      meeting_minutes: {
        Row: { id: string; appointment_id: string; case_id: string; current_version: number; status: "draft" | "approved"; approved_by: string | null; approved_at: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; appointment_id: string; case_id: string; current_version?: number; status?: "draft" | "approved"; approved_by?: string | null; approved_at?: string | null; created_at?: string; updated_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_minutes"]["Insert"]>;
        Relationships: [];
      };
      meeting_minute_versions: {
        Row: { id: string; minutes_id: string; version: number; meeting_datetime: string | null; verified_attendees: Json; objective: string; key_points: Json; party_positions: Json; monetary_proposals: Json; confirmed_agreements: Json; unresolved_issues: Json; action_items: Json; next_steps: Json; low_confidence_items: Json; source_segment_ids: Json; status: "draft" | "approved" | "superseded"; created_by: string | null; approved_by: string | null; approved_at: string | null; created_at: string; };
        Insert: { id?: string; minutes_id: string; version: number; meeting_datetime?: string | null; verified_attendees?: Json; objective?: string; key_points?: Json; party_positions?: Json; monetary_proposals?: Json; confirmed_agreements?: Json; unresolved_issues?: Json; action_items?: Json; next_steps?: Json; low_confidence_items?: Json; source_segment_ids?: Json; status?: "draft" | "approved" | "superseded"; created_by?: string | null; approved_by?: string | null; approved_at?: string | null; created_at?: string; };
        Update: Partial<Database["public"]["Tables"]["meeting_minute_versions"]["Insert"]>;
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
      can_access_case: { Args: { target_case_id: string }; Returns: boolean };
      can_staff_case: { Args: { target_case_id: string }; Returns: boolean };
      can_access_appointment: { Args: { target_appointment_id: string }; Returns: boolean };
      can_staff_appointment: { Args: { target_appointment_id: string }; Returns: boolean };
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
