import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Address } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import CartItem from "@/components/CartItem";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrderSuccessModal from "@/components/modals/OrderSuccessModal";

export default function CartPage() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);
  
  // Fetch user addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });
  
  // Get default/first address
  const selectedAddress = addresses?.find(addr => addr.default) || addresses?.[0];
  
  // Place order mutation
  const placeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddress) {
        throw new Error("No address selected");
      }
      
      if (items.length === 0) {
        throw new Error("Cart is empty");
      }
      
      const orderData = {
        addressId: selectedAddress.id,
        items: items.map(item => ({
          drinkId: item.drinkId,
          quantity: item.quantity
        }))
      };
      
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: (data) => {
      // Clear cart
      clearCart();
      
      // Show success modal
      setNewOrderId(data.id);
      setShowOrderSuccess(true);
      
      // Invalidate orders with user ID in query key
      queryClient.invalidateQueries({ queryKey: ['/api/orders', user?.id] });
    },
    onError: (error) => {
      console.error("Error placing order:", error);
      toast({
        title: "Order Failed",
        description: "Could not place your order. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast({
        title: "No Delivery Address",
        description: "Please add a delivery address",
        variant: "destructive"
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add some drinks to your cart first",
        variant: "destructive"
      });
      return;
    }
    
    placeMutation.mutate();
  };
  
  const handleChangeAddress = () => {
    setLocation("/account");
  };
  
  const handleBrowseDrinks = () => {
    setLocation("/");
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">My Cart</h1>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="text-gray-300 h-16 w-16 mb-4" />
          <p className="text-gray-500 text-center">Your cart is empty</p>
          <p className="text-gray-500 text-center">Add some drinks to get started</p>
          <Button 
            className="mt-4"
            onClick={handleBrowseDrinks}
          >
            Browse Drinks
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            {items.map((item) => (
              <CartItem key={item.drinkId} item={item} />
            ))}
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-medium text-gray-800">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100 mt-2">
              <span className="font-medium text-gray-800">Total</span>
              <span className="font-semibold text-primary text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Delivery Address</h3>
            
            {isLoadingAddresses ? (
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
            ) : selectedAddress ? (
              <>
                <p className="text-gray-600">{selectedAddress.address}</p>
                <button 
                  className="text-primary text-sm font-medium mt-1"
                  onClick={handleChangeAddress}
                >
                  Change
                </button>
              </>
            ) : (
              <div>
                <p className="text-gray-500">No address found</p>
                <button 
                  className="text-primary text-sm font-medium mt-1"
                  onClick={handleChangeAddress}
                >
                  Add Address
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <h3 className="font-medium text-gray-800 mb-2">Payment Method</h3>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when your order arrives</p>
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={placeMutation.isPending}
          >
            {placeMutation.isPending ? "Processing..." : "Place Order"}
          </Button>
        </>
      )}
      
      {showOrderSuccess && newOrderId && (
        <OrderSuccessModal 
          isOpen={showOrderSuccess}
          onClose={() => setShowOrderSuccess(false)}
          orderId={newOrderId}
        />
      )}
    </div>
  );
}
