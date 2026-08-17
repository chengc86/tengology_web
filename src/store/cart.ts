import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  /**
   * Bespoke jewellery designed in the studio. Every design is unique, so these
   * lines carry their own `lineId` and are never merged with each other — two
   * bracelets from the same designer are two different products.
   */
  design?: {
    kind: string;
    /** Share code — round-trips the full design through `tryDecodeDesign`. */
    encoded: string;
    beadCount: number;
  };
}

/** Cart lines are keyed by `lineId` when present, else by `productId`. */
export function cartLineKey(item: Pick<CartItem, "productId" | "design">): string {
  return item.design ? `design:${item.design.encoded}` : item.productId;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const key = cartLineKey(item);
        const existing = items.find((i) => cartLineKey(i) === key);

        if (existing) {
          set({
            items: items.map((i) =>
              cartLineKey(i) === key
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity }] });
        }
      },

      removeItem: (key) => {
        set({ items: get().items.filter((i) => cartLineKey(i) !== key) });
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) =>
            cartLineKey(i) === key ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "tengology-cart" }
  )
);
