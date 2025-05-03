import { CartItem as CartItemType } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Plus, Minus } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity } = useCart();
  
  const handleDecreaseQuantity = () => {
    updateQuantity(item.drinkId, item.quantity - 1);
  };
  
  const handleIncreaseQuantity = () => {
    updateQuantity(item.drinkId, item.quantity + 1);
  };
  
  return (
    <div className="cart-item bg-white p-4 rounded-xl mb-3 shadow-sm">
      <div className="flex items-center">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="ml-3 flex-grow">
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          <span className="text-primary font-semibold">
            {formatCurrency(item.price)}
          </span>
        </div>
        <div className="flex items-center">
          <button 
            className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
            onClick={handleDecreaseQuantity}
          >
            <Minus size={14} />
          </button>
          <span className="mx-3 font-medium">{item.quantity}</span>
          <button 
            className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
            onClick={handleIncreaseQuantity}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
