// Auto-generated from the Supabase project schema (mcp: generate_typescript_types).
// Regenerate after any migration instead of editing by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
          amount: number;
          expense_id: string;
          id: string;
          name: string;
        };
        Insert: {
          amount: number;
          expense_id: string;
          id?: string;
          name: string;
        };
        Update: {
          amount?: number;
          expense_id?: string;
          id?: string;
          name?: string;
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
          user_id: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          iban?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          iban?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
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
            foreignKeyName: 'shopping_items_purchased_by_fkey';
            columns: ['purchased_by'];
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
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_household: {
        Args: { household_name: string; my_name: string };
        Returns: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
      };
      get_my_household_id: { Args: never; Returns: string };
      leave_household: { Args: never; Returns: undefined };
      join_household: {
        Args: { code: string; my_name: string };
        Returns: {
          created_at: string;
          id: string;
          invite_code: string;
          name: string;
        };
      };
      create_expense: {
        Args: {
          p_household_id: string;
          p_category_id: string | null;
          p_title: string;
          p_total_amount: number;
          p_split_type: string;
          p_splits: Json;
          p_payments: Json;
        };
        Returns: Database['public']['Tables']['expenses']['Row'];
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

type PublicSchema = Database['public'];

export type Tables<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Row'];

export type TablesInsert<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Insert'];

export type TablesUpdate<TableName extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][TableName]['Update'];
