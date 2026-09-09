// Generated from the live Supabase schema. Nullable category RPC arguments are
// annotated explicitly because the generator does not infer argument nullability.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          household_id: string;
          icon: string | null;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          icon?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_debts: {
        Row: {
          amount: number;
          expense_id: string;
          from_member_id: string;
          id: string;
          is_settled: boolean;
          to_member_id: string;
        };
        Insert: {
          amount: number;
          expense_id: string;
          from_member_id: string;
          id?: string;
          is_settled?: boolean;
          to_member_id: string;
        };
        Update: {
          amount?: number;
          expense_id?: string;
          from_member_id?: string;
          id?: string;
          is_settled?: boolean;
          to_member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_debts_expense_id_fkey';
            columns: ['expense_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_debts_from_member_id_fkey';
            columns: ['from_member_id'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_debts_to_member_id_fkey';
            columns: ['to_member_id'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_line_items: {
        Row: {
          amount: number | null;
          expense_id: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          amount?: number | null;
          expense_id: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          amount?: number | null;
          expense_id?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_line_items_expense_id_fkey';
            columns: ['expense_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_payments: {
        Row: {
          amount_paid: number;
          expense_id: string;
          id: string;
          member_id: string;
        };
        Insert: {
          amount_paid: number;
          expense_id: string;
          id?: string;
          member_id: string;
        };
        Update: {
          amount_paid?: number;
          expense_id?: string;
          id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_payments_expense_id_fkey';
            columns: ['expense_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_payments_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
        ];
      };
      expense_splits: {
        Row: {
          amount_owed: number;
          expense_id: string;
          id: string;
          member_id: string;
          shares: number | null;
        };
        Insert: {
          amount_owed: number;
          expense_id: string;
          id?: string;
          member_id: string;
          shares?: number | null;
        };
        Update: {
          amount_owed?: number;
          expense_id?: string;
          id?: string;
          member_id?: string;
          shares?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expense_splits_expense_id_fkey';
            columns: ['expense_id'];
            isOneToOne: false;
            referencedRelation: 'expenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expense_splits_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
        ];
      };
      expenses: {
        Row: {
          category_id: string | null;
          created_at: string;
          household_id: string;
          id: string;
          receipt_photo_url: string | null;
          split_type: string;
          title: string;
          total_amount: number;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          household_id: string;
          id?: string;
          receipt_photo_url?: string | null;
          split_type: string;
          title: string;
          total_amount: number;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          receipt_photo_url?: string | null;
          split_type?: string;
          title?: string;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'expenses_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expenses_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      household_members: {
        Row: {
          created_at: string;
          household_id: string;
          iban: string | null;
          id: string;
          name: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          iban?: string | null;
          id?: string;
          name: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          iban?: string | null;
          id?: string;
          name?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
        ];
      };
      households: {
        Row: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_code: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          locale: string;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          locale?: string;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          locale?: string;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      shopping_items: {
        Row: {
          added_by: string | null;
          category_id: string | null;
          created_at: string;
          household_id: string;
          id: string;
          is_purchased: boolean;
          name: string;
          purchased_at: string | null;
          purchased_by: string | null;
        };
        Insert: {
          added_by?: string | null;
          category_id?: string | null;
          created_at?: string;
          household_id: string;
          id?: string;
          is_purchased?: boolean;
          name: string;
          purchased_at?: string | null;
          purchased_by?: string | null;
        };
        Update: {
          added_by?: string | null;
          category_id?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          is_purchased?: boolean;
          name?: string;
          purchased_at?: string | null;
          purchased_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shopping_items_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_items_household_id_fkey';
            columns: ['household_id'];
            isOneToOne: false;
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shopping_items_purchased_by_fkey';
            columns: ['purchased_by'];
            isOneToOne: false;
            referencedRelation: 'household_members';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_unclaimed_member: {
        Args: { member_name: string };
        Returns: {
          created_at: string;
          household_id: string;
          iban: string | null;
          id: string;
          name: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'household_members';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_expense: {
        Args: {
          p_category_id: string | null;
          p_household_id: string;
          p_payments: Json;
          p_split_type: string;
          p_splits: Json;
          p_title: string;
          p_total_amount: number;
        };
        Returns: {
          category_id: string | null;
          created_at: string;
          household_id: string;
          id: string;
          receipt_photo_url: string | null;
          split_type: string;
          title: string;
          total_amount: number;
        };
        SetofOptions: {
          from: '*';
          to: 'expenses';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_expense_with_details: {
        Args: {
          p_category_id: string | null;
          p_household_id: string;
          p_items?: Json;
          p_payments: Json;
          p_receipt_path?: string;
          p_split_type: string;
          p_splits: Json;
          p_title: string;
          p_total_amount: number;
        };
        Returns: {
          category_id: string | null;
          created_at: string;
          household_id: string;
          id: string;
          receipt_photo_url: string | null;
          split_type: string;
          title: string;
          total_amount: number;
        };
        SetofOptions: {
          from: '*';
          to: 'expenses';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_household: {
        Args: { household_name: string; my_name: string };
        Returns: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
        SetofOptions: {
          from: '*';
          to: 'households';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_my_household_id: { Args: never; Returns: string };
      join_household: {
        Args: { code: string; my_name: string };
        Returns: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
        SetofOptions: {
          from: '*';
          to: 'households';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      join_household_with_member: {
        Args: { code: string; member_id?: string; my_name: string };
        Returns: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
        SetofOptions: {
          from: '*';
          to: 'households';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      leave_household: { Args: never; Returns: undefined };
      preview_household_members: {
        Args: { code: string };
        Returns: {
          id: string;
          name: string;
        }[];
      };
      update_expense_with_details: {
        Args: {
          p_category_id: string | null;
          p_expense_id: string;
          p_items?: Json;
          p_payments: Json;
          p_split_type: string;
          p_splits: Json;
          p_title: string;
          p_total_amount: number;
        };
        Returns: {
          category_id: string | null;
          created_at: string;
          household_id: string;
          id: string;
          receipt_photo_url: string | null;
          split_type: string;
          title: string;
          total_amount: number;
        };
        SetofOptions: {
          from: '*';
          to: 'expenses';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      settle_debt: {
        Args: { p_from_member_id: string; p_to_member_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
