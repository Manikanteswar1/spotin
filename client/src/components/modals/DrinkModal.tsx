import { useState } from "react";
import { DrinkWithCategory } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { X, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DrinkModalProps {
  drink: DrinkWithCategory;
  isOpen: boolean;
  onClose: () => void;
}

export default function DrinkModal({ drink, isOpen, onClose }: DrinkModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleIncreaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  const handleAddToCart = () => {
    addItem({
      drinkId: drink.id,
      name: drink.name,
      price: parseFloat(drink.price.toString()),
      quantity,
      image: drink.image
    });
    onClose();
  };
  
  const priceValue = drink.price ? parseFloat(drink.price.toString()) : 0;
  const totalPrice = priceValue * quantity;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          <img 
            src={drink.image} 
            alt={drink.name} 
            className="w-full h-48 object-cover"
          />
          <button 
            className="absolute top-2 right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 mb-1">
              {drink.name}
            </DialogTitle>
            <DialogDescription className="text-primary font-semibold text-lg">
              {formatCurrency(drink.price ? parseFloat(drink.price.toString()) : 0)}
            </DialogDescription>
          </DialogHeader>
          
          <p className="text-gray-600 mt-4 mb-4">{drink.description}</p>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Quantity</h3>
            <div className="flex items-center">
              <button 
                className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
                onClick={handleDecreaseQuantity}
              >
                <Minus size={16} />
              </button>
              <span className="mx-6 font-medium text-xl">{quantity}</span>
              <button 
                className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
                onClick={handleIncreaseQuantity}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <button 
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            onClick={handleAddToCart}
          >
            Add to Cart • {formatCurrency(totalPrice)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
