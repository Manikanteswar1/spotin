import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@shared/schema";

interface CartContextType {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (drinkId: number, quantity: number) => void;
  removeItem: (drinkId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "sipAndSavor_cart";
const DELIVERY_FEE = 2.00; // Fixed delivery fee

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from local storage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart:", e);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Calculate totals
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  
  const total = subtotal + DELIVERY_FEE;
  
  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      // Check if item already exists
      const existingItemIndex = currentItems.findIndex(
        item => item.drinkId === newItem.drinkId
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity
        };
        
        toast({
          title: "Cart Updated",
          description: `${newItem.name} quantity updated in cart`
        });
        
        return updatedItems;
      } else {
        // Add new item
        toast({
          title: "Added to Cart",
          description: `${newItem.name} added to your cart`
        });
        
        return [...currentItems, newItem];
      }
    });
  };

  const updateQuantity = (drinkId: number, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(drinkId);
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.drinkId === drinkId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const removeItem = (drinkId: number) => {
    setItems(currentItems => {
      const itemToRemove = currentItems.find(item => item.drinkId === drinkId);
      
      if (itemToRemove) {
        toast({
          title: "Removed from Cart",
          description: `${itemToRemove.name} removed from your cart`
        });
      }
      
      return currentItems.filter(item => item.drinkId !== drinkId);
    });
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart"
    });
  };

  const value = {
    items,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    total,
    itemCount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
