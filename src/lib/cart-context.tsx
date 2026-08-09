import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  materialId: string;
  name: string;
  brand: string;
  quality: string;
  unit: string;
  unitPrice: number;
  quantity: number;
};

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  setQuantity: (materialId: string, quantity: number) => void;
  remove: (materialId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "buildsupply.cart.v1";

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartValue>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    return {
      items,
      count: items.length,
      subtotal,
      add: (item) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.materialId === item.materialId);
          if (existing) {
            return prev.map((p) =>
              p.materialId === item.materialId
                ? { ...p, quantity: p.quantity + item.quantity }
                : p,
            );
          }
          return [...prev, item];
        }),
      setQuantity: (materialId, quantity) =>
        setItems((prev) =>
          prev.map((p) =>
            p.materialId === materialId ? { ...p, quantity: Math.max(1, quantity) } : p,
          ),
        ),
      remove: (materialId) => setItems((prev) => prev.filter((p) => p.materialId !== materialId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
