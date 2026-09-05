export type Member = {
  id: string;
  name: string;
  iban: string | null;
};

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
};

export type Category = {
  id: string;
  name: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  categoryId: string | null;
  addedBy: string;
  isPurchased: boolean;
  createdAt: number;
};
