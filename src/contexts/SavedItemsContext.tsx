import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { CartItemCustomization } from "./CartContext";

export interface SavedItem {
  id: string;
  image: string;
  name: string;
  basePrice: number;
  customization?: CartItemCustomization;
}

interface SavedItemsContextType {
  savedItems: SavedItem[];
  addSavedItem: (item: SavedItem) => void;
  removeSavedItem: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | null>(null);

export const useSavedItems = () => {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error("useSavedItems must be used within SavedItemsProvider");
  return ctx;
};

export const SavedItemsProvider = ({ children }: { children: ReactNode }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const addSavedItem = useCallback((item: SavedItem) => {
    setSavedItems((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeSavedItem = useCallback((id: string) => {
    setSavedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const isSaved = useCallback(
    (id: string) => savedItems.some((i) => i.id === id),
    [savedItems]
  );

  return (
    <SavedItemsContext.Provider value={{ savedItems, addSavedItem, removeSavedItem, isSaved }}>
      {children}
    </SavedItemsContext.Provider>
  );
};
