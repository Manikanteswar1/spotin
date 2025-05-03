import { useQuery } from "@tanstack/react-query";
import { Order, OrderItem as OrderItemType } from "@shared/schema";
import OrderItem from "@/components/OrderItem";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  
  // Fetch user orders
  const { data: orders, isLoading } = useQuery<(Order & { items: OrderItem[] })[]>({
    queryKey: ['/api/orders'],
  });
  
  const handleStartOrdering = () => {
    setLocation("/");
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">My Orders</h1>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white p-4 rounded-xl mb-3 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="h-3 bg-gray-200 rounded w-28"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div id="orders-list">
          {orders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="text-gray-300 h-16 w-16 mb-4" />
          <p className="text-gray-500 text-center">You haven't placed any orders yet</p>
          <Button 
            className="mt-4"
            onClick={handleStartOrdering}
          >
            Start Ordering
          </Button>
        </div>
      )}
    </div>
  );
}
