export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      areas: {
        Row: {
          code: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          unit_id: string;
          updated_at: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          unit_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "areas_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "areas_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "areas_unit_org_consistency";
            columns: ["unit_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      contracts: {
        Row: {
          client_organization_id: string;
          contract_number: string | null;
          contractor_organization_id: string;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          name: string;
          starts_at: string;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          client_organization_id: string;
          contract_number?: string | null;
          contractor_organization_id: string;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          starts_at: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          client_organization_id?: string;
          contract_number?: string | null;
          contractor_organization_id?: string;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          starts_at?: string;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_client_organization_id_fkey";
            columns: ["client_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey";
            columns: ["contractor_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contracts_unit_client_org_consistency";
            columns: ["unit_id", "client_organization_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "contracts_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      management_departments: {
        Row: {
          code: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          unit_id: string;
          updated_at: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          unit_id: string;
          updated_at?: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          unit_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "management_departments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "management_departments_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "management_departments_unit_org_consistency";
            columns: ["unit_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      member_roles: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          organization_member_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_member_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_member_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_roles_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_roles_organization_member_id_fkey";
            columns: ["organization_member_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_contacts: {
        Row: {
          area_id: string | null;
          contact_type: string;
          contract_id: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          management_department_id: string | null;
          organization_id: string;
          organization_member_id: string;
          priority: number;
          unit_id: string | null;
          updated_at: string;
        };
        Insert: {
          area_id?: string | null;
          contact_type: string;
          contract_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          management_department_id?: string | null;
          organization_id: string;
          organization_member_id: string;
          priority?: number;
          unit_id?: string | null;
          updated_at?: string;
        };
        Update: {
          area_id?: string | null;
          contact_type?: string;
          contract_id?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          management_department_id?: string | null;
          organization_id?: string;
          organization_member_id?: string;
          priority?: number;
          unit_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_contacts_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_area_org_consistency";
            columns: ["area_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "organization_contacts_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_management_department_id_fkey";
            columns: ["management_department_id"];
            isOneToOne: false;
            referencedRelation: "management_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_management_department_org_consistency";
            columns: ["management_department_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "management_departments";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "organization_contacts_member_org_consistency";
            columns: ["organization_member_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_organization_member_id_fkey";
            columns: ["organization_member_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_contacts_unit_org_consistency";
            columns: ["unit_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          employee_number: string | null;
          id: string;
          is_active: boolean;
          job_title: string | null;
          joined_at: string;
          left_at: string | null;
          membership_type: string;
          organization_id: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          employee_number?: string | null;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          joined_at?: string;
          left_at?: string | null;
          membership_type: string;
          organization_id: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          employee_number?: string | null;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          joined_at?: string;
          left_at?: string | null;
          membership_type?: string;
          organization_id?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          document_number: string | null;
          id: string;
          is_active: boolean;
          legal_name: string | null;
          name: string;
          organization_type: string;
          trade_name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          document_number?: string | null;
          id?: string;
          is_active?: boolean;
          legal_name?: string | null;
          name: string;
          organization_type: string;
          trade_name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          document_number?: string | null;
          id?: string;
          is_active?: boolean;
          legal_name?: string | null;
          name?: string;
          organization_type?: string;
          trade_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean;
          job_title: string | null;
          last_access_at: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string | null;
          full_name: string;
          id: string;
          is_active?: boolean;
          job_title?: string | null;
          last_access_at?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          last_access_at?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          is_system_role: boolean;
          name: string;
          organization_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system_role?: boolean;
          name: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_system_role?: boolean;
          name?: string;
          organization_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      units: {
        Row: {
          address: string | null;
          code: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          code?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_organization_ids: { Args: never; Returns: string[] };
      current_profile_id: { Args: never; Returns: string };
      has_permission: {
        Args: { permission_code: string; target_organization_id: string };
        Returns: boolean;
      };
      is_platform_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
