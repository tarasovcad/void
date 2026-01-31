import {create} from "zustand";

export type TestItem = {
  url: string;
  title: string;
  description: string;
};

type TestItemState = {
  item: TestItem | null;
  setItem: (item: TestItem) => void;
  clearItem: () => void;
};

export const useTestItemStore = create<TestItemState>((set) => ({
  item: null,
  setItem: (item) => set({item}),
  clearItem: () => set({item: null}),
}));
