import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Category, Household, Member, ShoppingItem } from '@/types/household';

const DEFAULT_CATEGORY_NAMES = ['Yemek', 'Temizlik', 'Fatura', 'Diğer'];

function generateInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

type HouseholdState = {
  household: Household | null;
  members: Member[];
  currentMemberId: string | null;
  categories: Category[];
  shoppingItems: ShoppingItem[];

  createHousehold: (householdName: string, myName: string) => void;
  leaveHousehold: () => void;
  updateMember: (memberId: string, updates: Partial<Pick<Member, 'name' | 'iban'>>) => void;

  addCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  removeCategory: (id: string) => void;

  addShoppingItem: (name: string, categoryId: string | null) => void;
  toggleShoppingItemPurchased: (id: string) => void;
  removeShoppingItem: (id: string) => void;
};

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      household: null,
      members: [],
      currentMemberId: null,
      categories: [],
      shoppingItems: [],

      leaveHousehold: () => {
        set({
          household: null,
          members: [],
          currentMemberId: null,
          categories: [],
          shoppingItems: [],
        });
      },

      createHousehold: (householdName, myName) => {
        const memberId = Crypto.randomUUID();
        set({
          household: {
            id: Crypto.randomUUID(),
            name: householdName,
            inviteCode: generateInviteCode(),
          },
          members: [{ id: memberId, name: myName, iban: null }],
          currentMemberId: memberId,
          categories: DEFAULT_CATEGORY_NAMES.map((name) => ({ id: Crypto.randomUUID(), name })),
        });
      },

      updateMember: (memberId, updates) => {
        set((state) => ({
          members: state.members.map((member) =>
            member.id === memberId ? { ...member, ...updates } : member,
          ),
        }));
      },

      addCategory: (name) => {
        set((state) => ({
          categories: [...state.categories, { id: Crypto.randomUUID(), name }],
        }));
      },

      renameCategory: (id, name) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name } : category,
          ),
        }));
      },

      removeCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          shoppingItems: state.shoppingItems.map((item) =>
            item.categoryId === id ? { ...item, categoryId: null } : item,
          ),
        }));
      },

      addShoppingItem: (name, categoryId) => {
        set((state) => ({
          shoppingItems: [
            {
              id: Crypto.randomUUID(),
              name,
              categoryId,
              addedBy: state.currentMemberId ?? '',
              isPurchased: false,
              createdAt: Date.now(),
            },
            ...state.shoppingItems,
          ],
        }));
      },

      toggleShoppingItemPurchased: (id) => {
        set((state) => ({
          shoppingItems: state.shoppingItems.map((item) =>
            item.id === id ? { ...item, isPurchased: !item.isPurchased } : item,
          ),
        }));
      },

      removeShoppingItem: (id) => {
        set((state) => ({
          shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'roomly-household-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
