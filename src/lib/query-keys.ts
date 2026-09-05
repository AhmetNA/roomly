// Central query-key factory so every screen's cache entries are scoped to the
// current household consistently (categories/shopping-items/expenses reuse this).
export const queryKeys = {
  household: ['household'] as const,
  members: (householdId: string | undefined) => ['household_members', householdId] as const,
  categories: (householdId: string | undefined) => ['categories', householdId] as const,
  shoppingItems: (householdId: string | undefined) => ['shopping_items', householdId] as const,
  expenses: (householdId: string | undefined) => ['expenses', householdId] as const,
};
