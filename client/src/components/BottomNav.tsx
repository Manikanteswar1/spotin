import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { Coffee, ShoppingCart, FileText, User } from "lucide-react";

export default function BottomNav() {
  const [location] = useLocation();
  const { itemCount } = useCart();
  
  return (
    <div className="bottom-nav fixed bottom-0 left-0 right-0 bg-white p-3 flex justify-around items-center">
      <Link href="/">
        <a className={`flex flex-col items-center ${location === "/" ? "text-primary" : "text-gray-500"}`}>
          <Coffee size={20} />
          <span className="text-xs mt-1">Cafe</span>
        </a>
      </Link>
      <Link href="/cart">
        <a className={`flex flex-col items-center ${location === "/cart" ? "text-primary" : "text-gray-500"} relative`}>
          <div className="relative">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 bg-accent rounded-full flex items-center justify-center text-white text-xs">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Cart</span>
        </a>
      </Link>
      <Link href="/orders">
        <a className={`flex flex-col items-center ${location === "/orders" ? "text-primary" : "text-gray-500"}`}>
          <FileText size={20} />
          <span className="text-xs mt-1">Orders</span>
        </a>
      </Link>
      <Link href="/account">
        <a className={`flex flex-col items-center ${location === "/account" ? "text-primary" : "text-gray-500"}`}>
          <User size={20} />
          <span className="text-xs mt-1">Account</span>
        </a>
      </Link>
    </div>
  );
}
