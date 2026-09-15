export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_item_attachments: {
        Row: {
          action_item_id: string
          caption: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          file_size: number
          id: string
          mime_type: string
          organization_id: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          upload_status: string
          uploaded_by: string
        }
        Insert: {
          action_item_id: string
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          file_size: number
          id?: string
          mime_type: string
          organization_id: string
          original_file_name: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          upload_status?: string
          uploaded_by: string
        }
        Update: {
          action_item_id?: string
          caption?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          file_size?: number
          id?: string
          mime_type?: string
          organization_id?: string
          original_file_name?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          upload_status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_item_attachments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_attachments_item_org_fk"
            columns: ["action_item_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "action_item_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_items: {
        Row: {
          action_plan_id: string
          completed_at: string | null
          completed_by: string | null
          completion_description: string | null
          created_at: string
          description: string | null
          due_at: string
          id: string
          organization_id: string
          priority: string
          responsible_member_id: string
          responsible_organization_id: string
          status: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_note: string | null
        }
        Insert: {
          action_plan_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_description?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          organization_id: string
          priority: string
          responsible_member_id: string
          responsible_organization_id: string
          status?: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Update: {
          action_plan_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_description?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          organization_id?: string
          priority?: string
          responsible_member_id?: string
          responsible_organization_id?: string
          status?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_plan_org_fk"
            columns: ["action_plan_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "action_items_responsible_member_org_fk"
            columns: ["responsible_member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "action_items_responsible_organization_id_fkey"
            columns: ["responsible_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          occurrence_id: string
          organization_id: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          occurrence_id: string
          organization_id: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          occurrence_id?: string
          organization_id?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_occurrence_org_fk"
            columns: ["occurrence_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "action_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          unit_id: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          unit_id: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          unit_id?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_unit_org_consistency"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "areas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_assignments: {
        Row: {
          assignment_role: string
          contract_id: string
          created_at: string
          granted_at: string
          id: string
          is_active: boolean
          organization_id: string
          organization_member_id: string
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_role: string
          contract_id: string
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          organization_member_id: string
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_role?: string
          contract_id?: string
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          organization_member_id?: string
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_assignments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_assignments_member_org_consistency"
            columns: ["organization_member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "contract_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_organization_id: string
          contract_number: string | null
          contractor_organization_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string
          unit_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          client_organization_id: string
          contract_number?: string | null
          contractor_organization_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at: string
          unit_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          client_organization_id?: string
          contract_number?: string | null
          contractor_organization_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string
          unit_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_client_org_consistency"
            columns: ["unit_id", "client_organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      management_departments: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          unit_id: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          unit_id: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          unit_id?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_departments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_departments_unit_org_consistency"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "management_departments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mdho_assessments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          complement: string | null
          created_at: string
          id: string
          occurrence_id: string
          organization_id: string
          return_reason: string | null
          returned_at: string | null
          returned_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          occurrence_id: string
          organization_id: string
          return_reason?: string | null
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          complement?: string | null
          created_at?: string
          id?: string
          occurrence_id?: string
          organization_id?: string
          return_reason?: string | null
          returned_at?: string | null
          returned_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdho_assessments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_assessments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: true
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_assessments_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_assessments_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mdho_categories: {
        Row: {
          allows_multiple: boolean
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          requires_selection: boolean
          updated_at: string
        }
        Insert: {
          allows_multiple?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          requires_selection?: boolean
          updated_at?: string
        }
        Update: {
          allows_multiple?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          requires_selection?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdho_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mdho_options: {
        Row: {
          allows_detail: boolean
          category_id: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          label: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          allows_detail?: boolean
          category_id: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          allows_detail?: boolean
          category_id?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdho_options_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdho_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mdho_selections: {
        Row: {
          assessment_id: string
          category_id: string
          created_at: string
          created_by: string
          detail: string | null
          id: string
          option_id: string
        }
        Insert: {
          assessment_id: string
          category_id: string
          created_at?: string
          created_by: string
          detail?: string | null
          id?: string
          option_id: string
        }
        Update: {
          assessment_id?: string
          category_id?: string
          created_at?: string
          created_by?: string
          detail?: string | null
          id?: string
          option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdho_selections_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "mdho_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_selections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mdho_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_selections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdho_selections_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "mdho_options"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_member_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_member_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          occurrence_id: string
          organization_id: string
          payload: Json
          priority: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          occurrence_id: string
          organization_id: string
          payload?: Json
          priority: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          occurrence_id?: string
          organization_id?: string
          payload?: Json
          priority?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          awareness_confirmed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          notification_event_id: string
          organization_id: string
          priority: string
          read_at: string | null
          recipient_member_id: string
          requires_awareness: boolean
          title: string
        }
        Insert: {
          awareness_confirmed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          notification_event_id: string
          organization_id: string
          priority: string
          read_at?: string | null
          recipient_member_id: string
          requires_awareness?: boolean
          title: string
        }
        Update: {
          awareness_confirmed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          notification_event_id?: string
          organization_id?: string
          priority?: string
          read_at?: string | null
          recipient_member_id?: string
          requires_awareness?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_notification_event_id_fkey"
            columns: ["notification_event_id"]
            isOneToOne: false
            referencedRelation: "notification_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_attachments: {
        Row: {
          attachment_type: string
          caption: string | null
          captured_at: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          file_size: number
          id: string
          latitude: number | null
          longitude: number | null
          mime_type: string
          occurrence_id: string
          organization_id: string
          original_file_name: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          upload_status: string
          uploaded_by: string
        }
        Insert: {
          attachment_type: string
          caption?: string | null
          captured_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          file_size: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type: string
          occurrence_id: string
          organization_id: string
          original_file_name: string
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          upload_status?: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: string
          caption?: string | null
          captured_at?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          file_size?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          mime_type?: string
          occurrence_id?: string
          organization_id?: string
          original_file_name?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          upload_status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_attachments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_attachments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_comments: {
        Row: {
          author_id: string
          comment_type: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          edited_at: string | null
          edited_by: string | null
          id: string
          is_internal: boolean
          occurrence_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_type?: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_internal?: boolean
          occurrence_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_type?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_internal?: boolean
          occurrence_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_comments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_comments_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_comments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_decisions: {
        Row: {
          created_at: string
          decided_at: string
          decided_by: string
          decision_reason: string | null
          decision_type: string
          id: string
          occurrence_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string
          decided_by: string
          decision_reason?: string | null
          decision_type: string
          id?: string
          occurrence_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string
          decided_by?: string
          decision_reason?: string | null
          decision_type?: string
          id?: string
          occurrence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_decisions_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_participants: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          occurrence_id: string
          organization_id: string
          organization_member_id: string
          participant_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          occurrence_id: string
          organization_id: string
          organization_member_id: string
          participant_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          occurrence_id?: string
          organization_id?: string
          organization_member_id?: string
          participant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_participants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_participants_member_org_consistency"
            columns: ["organization_member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "occurrence_participants_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_participants_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_public_code_counters: {
        Row: {
          created_at: string
          last_value: number
          organization_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          last_value?: number
          organization_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          last_value?: number
          organization_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_public_code_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_public_code_yearly_counters: {
        Row: {
          created_at: string
          last_value: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          last_value?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          last_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      occurrence_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          from_status: string | null
          id: string
          metadata: Json
          occurrence_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          from_status?: string | null
          id?: string
          metadata?: Json
          occurrence_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          from_status?: string | null
          id?: string
          metadata?: Json
          occurrence_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_status_history_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          area_id: string
          assigned_evaluator_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          closed_at: string | null
          condition_description: string
          contract_id: string | null
          contractor_organization_id: string | null
          created_at: string
          created_by: string
          decision_type: string | null
          evaluated_at: string | null
          id: string
          immediate_action_description: string | null
          ims_reference_code: string | null
          ims_reference_registered_at: string | null
          ims_reference_registered_by: string | null
          ims_reference_updated_at: string | null
          ims_reference_updated_by: string | null
          latitude: number | null
          location_accuracy: number | null
          location_description: string
          longitude: number | null
          management_department_id: string | null
          occurred_at: string
          organization_id: string
          origin_organization_id: string | null
          public_code: string
          released_at: string | null
          severity: string
          status: string
          stopped_at: string | null
          task_description: string
          title: string
          unit_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          area_id: string
          assigned_evaluator_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          condition_description: string
          contract_id?: string | null
          contractor_organization_id?: string | null
          created_at?: string
          created_by: string
          decision_type?: string | null
          evaluated_at?: string | null
          id?: string
          immediate_action_description?: string | null
          ims_reference_code?: string | null
          ims_reference_registered_at?: string | null
          ims_reference_registered_by?: string | null
          ims_reference_updated_at?: string | null
          ims_reference_updated_by?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          location_description: string
          longitude?: number | null
          management_department_id?: string | null
          occurred_at?: string
          organization_id: string
          origin_organization_id?: string | null
          public_code: string
          released_at?: string | null
          severity: string
          status?: string
          stopped_at?: string | null
          task_description: string
          title: string
          unit_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          area_id?: string
          assigned_evaluator_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          condition_description?: string
          contract_id?: string | null
          contractor_organization_id?: string | null
          created_at?: string
          created_by?: string
          decision_type?: string | null
          evaluated_at?: string | null
          id?: string
          immediate_action_description?: string | null
          ims_reference_code?: string | null
          ims_reference_registered_at?: string | null
          ims_reference_registered_by?: string | null
          ims_reference_updated_at?: string | null
          ims_reference_updated_by?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          location_description?: string
          longitude?: number | null
          management_department_id?: string | null
          occurred_at?: string
          organization_id?: string
          origin_organization_id?: string | null
          public_code?: string
          released_at?: string | null
          severity?: string
          status?: string
          stopped_at?: string | null
          task_description?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_assigned_evaluator_id_fkey"
            columns: ["assigned_evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_ims_reference_registered_by_fkey"
            columns: ["ims_reference_registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_ims_reference_updated_by_fkey"
            columns: ["ims_reference_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_origin_organization_id_fkey"
            columns: ["origin_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_contacts: {
        Row: {
          area_id: string | null
          contact_type: string
          contract_id: string | null
          created_at: string
          id: string
          is_active: boolean
          management_department_id: string | null
          organization_id: string
          organization_member_id: string
          priority: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          contact_type: string
          contract_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          management_department_id?: string | null
          organization_id: string
          organization_member_id: string
          priority?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          contact_type?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          management_department_id?: string | null
          organization_id?: string
          organization_member_id?: string
          priority?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_area_org_consistency"
            columns: ["area_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_contacts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_management_department_id_fkey"
            columns: ["management_department_id"]
            isOneToOne: false
            referencedRelation: "management_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_management_department_org_consistency"
            columns: ["management_department_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "management_departments"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_contacts_member_org_consistency"
            columns: ["organization_member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_contacts_unit_org_consistency"
            columns: ["unit_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          employee_number: string | null
          id: string
          is_active: boolean
          job_title: string | null
          joined_at: string
          left_at: string | null
          membership_type: string
          organization_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_number?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          joined_at?: string
          left_at?: string | null
          membership_type: string
          organization_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_number?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          joined_at?: string
          left_at?: string | null
          membership_type?: string
          organization_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_workspace_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          participation_role: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          participation_role?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          participation_role?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_workspace_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_workspace_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          document_number: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          name: string
          organization_type: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name: string
          organization_type: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name?: string
          organization_type?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          last_access_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          job_title?: string | null
          last_access_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_access_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_export_audit: {
        Row: {
          created_at: string
          export_format: string
          exported_by: string
          filters: Json
          id: string
          organization_id: string
          report_type: string
          row_count: number
        }
        Insert: {
          created_at?: string
          export_format: string
          exported_by: string
          filters?: Json
          id?: string
          organization_id: string
          report_type: string
          row_count: number
        }
        Update: {
          created_at?: string
          export_format?: string
          exported_by?: string
          filters?: Json
          id?: string
          organization_id?: string
          report_type?: string
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_export_audit_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_export_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_role: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          organization_id: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          organization_id: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          organization_id?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          created_at: string
          granted_at: string
          id: string
          is_active: boolean
          organization_id: string
          organization_member_id: string
          revoked_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          organization_member_id: string
          revoked_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          organization_member_id?: string
          revoked_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_member_org_consistency"
            columns: ["organization_member_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "workspace_memberships_org_workspace_link_consistency"
            columns: ["organization_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "organization_workspace_links"
            referencedColumns: ["organization_id", "workspace_id"]
          },
          {
            foreignKeyName: "workspace_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_organization_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_organization_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_organization_id_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_action_item: { Args: { p_payload: Json }; Returns: Json }
      approve_mdho_assessment: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      can_access_occurrence: {
        Args: { target_occurrence_id: string }
        Returns: boolean
      }
      can_access_workspace: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      can_manage_contract_assignment: {
        Args: { p_contract_id: string; p_member_organization_id: string }
        Returns: boolean
      }
      can_read_contract_assignment: {
        Args: {
          p_assignment_organization_id: string
          p_contract_id: string
          p_is_active: boolean
          p_organization_member_id: string
        }
        Returns: boolean
      }
      can_read_occurrence_in_org: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_read_occurrence_record: {
        Args: { p_occurrence_id: string }
        Returns: boolean
      }
      cancel_action_item: { Args: { p_payload: Json }; Returns: Json }
      complete_action_item_attachment_upload: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      complete_action_plan: { Args: { p_plan_id: string }; Returns: Json }
      complete_occurrence_attachment_upload: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      confirm_notification_awareness: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      create_action_plan: { Args: { p_payload: Json }; Returns: Json }
      create_occurrence: { Args: { payload: Json }; Returns: Json }
      create_occurrence_comment: {
        Args: { p_content: string; p_occurrence_id: string }
        Returns: Json
      }
      create_occurrence_notification_event: {
        Args: {
          p_created_by: string
          p_direct_recipients?: Json
          p_event_type: string
          p_exclude_member_id: string
          p_message: string
          p_occurrence_id: string
          p_payload?: Json
          p_priority: string
          p_requires_awareness: boolean
          p_title: string
        }
        Returns: string
      }
      current_organization_ids: { Args: never; Returns: string[] }
      current_organization_member_id: {
        Args: { p_organization_id: string }
        Returns: string
      }
      current_profile_id: { Args: never; Returns: string }
      current_workspace_ids: { Args: never; Returns: string[] }
      delete_action_item_attachment: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      delete_occurrence_attachment: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      delete_occurrence_comment: {
        Args: { p_comment_id: string }
        Returns: Json
      }
      fail_action_item_attachment_upload: {
        Args: { failure_reason?: string; target_attachment_id: string }
        Returns: Json
      }
      fail_occurrence_attachment_upload: {
        Args: { failure_reason?: string; target_attachment_id: string }
        Returns: Json
      }
      format_occurrence_status_label: {
        Args: { p_status: string }
        Returns: string
      }
      get_action_item_attachment_signed_url: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      get_dashboard_kpis: {
        Args: {
          p_due_soon_days?: number
          p_organization_id: string
          p_period_end?: string
          p_period_start?: string
        }
        Returns: Json
      }
      get_occurrence_attachment_signed_url: {
        Args: { target_attachment_id: string }
        Returns: Json
      }
      get_occurrence_timeline: {
        Args: { p_cursor?: Json; p_limit?: number; p_occurrence_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { permission_code: string; target_organization_id: string }
        Returns: boolean
      }
      is_action_item_responsible_member: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      list_action_items_report: {
        Args: {
          p_cursor?: Json
          p_due_soon_days?: number
          p_due_soon_only?: boolean
          p_limit?: number
          p_organization_id: string
          p_overdue_only?: boolean
          p_period_end?: string
          p_period_start?: string
          p_responsible_member_id?: string
          p_sort_direction?: string
          p_sort_field?: string
          p_status?: string[]
        }
        Returns: Json
      }
      list_awareness_report: {
        Args: {
          p_cursor?: Json
          p_limit?: number
          p_occurrence_id?: string
          p_organization_id: string
          p_pending_only?: boolean
          p_period_end?: string
          p_period_start?: string
          p_recipient_member_id?: string
          p_sort_direction?: string
          p_sort_field?: string
        }
        Returns: Json
      }
      list_mdho_pending_approvals: {
        Args: { p_cursor?: Json; p_limit?: number; p_organization_id: string }
        Returns: Json
      }
      list_my_notifications: {
        Args: { p_cursor?: string; p_limit?: number; p_organization_id: string }
        Returns: Json
      }
      list_occurrences_report: {
        Args: {
          p_area_id?: string
          p_contract_id?: string
          p_contractor_organization_id?: string
          p_cursor?: Json
          p_has_ims?: boolean
          p_limit?: number
          p_organization_id: string
          p_period_end?: string
          p_period_start?: string
          p_search?: string
          p_severity?: string[]
          p_sort_direction?: string
          p_sort_field?: string
          p_status?: string[]
        }
        Returns: Json
      }
      list_operational_occurrences: {
        Args: {
          p_area_id?: string
          p_contractor_organization_id?: string
          p_cursor?: Json
          p_ims_reference_code?: string
          p_limit?: number
          p_organization_id: string
          p_search?: string
          p_severity?: string[]
          p_status?: string[]
          p_workspace_id?: string
        }
        Returns: Json
      }
      list_organization_contractors: {
        Args: { target_organization_id: string }
        Returns: Json
      }
      list_organization_contracts: {
        Args: {
          filter_contractor_organization_id?: string
          target_organization_id: string
        }
        Returns: Json
      }
      log_report_export: {
        Args: {
          p_export_format: string
          p_filters: Json
          p_organization_id: string
          p_report_type: string
          p_row_count: number
        }
        Returns: undefined
      }
      lookup_organization_member_id: {
        Args: { p_organization_id: string; p_profile_id: string }
        Returns: string
      }
      map_contact_type_to_participant_type: {
        Args: { p_contact_type: string }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: { p_organization_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      prepare_action_item_attachment_upload: {
        Args: { payload: Json }
        Returns: Json
      }
      prepare_occurrence_attachment_upload: {
        Args: { payload: Json }
        Returns: Json
      }
      record_occurrence_decision: { Args: { p_payload: Json }; Returns: Json }
      register_ims_reference: { Args: { p_payload: Json }; Returns: Json }
      resolve_member_display_name: {
        Args: { p_organization_member_id: string }
        Returns: string
      }
      resolve_occurrence_notification_recipients: {
        Args: {
          p_event_type: string
          p_exclude_member_id?: string
          p_occurrence_id: string
        }
        Returns: {
          organization_member_id: string
          participant_type: string
        }[]
      }
      resolve_organization_display_name: {
        Args: { p_organization_id: string }
        Returns: string
      }
      resolve_profile_display_name: {
        Args: { p_profile_id: string }
        Returns: string
      }
      return_mdho_assessment: { Args: { p_payload: Json }; Returns: Json }
      save_mdho_draft: { Args: { p_payload: Json }; Returns: Json }
      start_action_item: { Args: { p_item_id: string }; Returns: Json }
      start_mdho_assessment: {
        Args: { p_occurrence_id: string }
        Returns: Json
      }
      start_occurrence_evaluation: {
        Args: { p_occurrence_id: string }
        Returns: Json
      }
      submit_action_item: { Args: { p_payload: Json }; Returns: Json }
      submit_mdho_assessment: {
        Args: { p_assessment_id: string }
        Returns: Json
      }
      update_action_item: { Args: { p_payload: Json }; Returns: Json }
      update_action_plan: { Args: { p_payload: Json }; Returns: Json }
      update_ims_reference: { Args: { p_payload: Json }; Returns: Json }
      update_occurrence_comment: {
        Args: { p_comment_id: string; p_content: string }
        Returns: Json
      }
      validate_action_item: { Args: { p_payload: Json }; Returns: Json }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

