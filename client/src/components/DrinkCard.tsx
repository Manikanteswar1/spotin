import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { DrinkWithCategory } from "@shared/schema";
import { Plus } from "lucide-react";
import DrinkModal from "./modals/DrinkModal";

interface DrinkCardProps {
  drink: DrinkWithCategory;
}

export default function DrinkCard({ drink }: DrinkCardProps) {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <div 
        className="drink-card bg-white rounded-xl overflow-hidden shadow-sm transition duration-200"
        onClick={() => setShowModal(true)}
      >
        <img 
          src={drink.image} 
          alt={drink.name} 
          className="w-full h-32 object-cover"
        />
        <div className="p-3">
          <h3 className="font-medium text-gray-800 line-clamp-1">{drink.name}</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="font-semibold text-primary">
              {formatCurrency(drink.price ? parseFloat(drink.price.toString()) : 0)}
            </span>
            <button 
              className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white"
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {showModal && (
        <DrinkModal 
          drink={drink} 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
