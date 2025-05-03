import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, User, OrderItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminOrder = Order & { 
  user: User;
  items: OrderItem[];
};

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Fetch all orders
  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey: ['/api/admin/orders'],
  });
  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully"
      });
      
      // Invalidate orders
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update order status. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleStatusChange = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };
  
  const handleLogout = () => {
    logout();
  };
  
  // Count orders by status
  const pendingCount = orders?.filter(order => order.status === "pending").length || 0;
  const totalCount = orders?.length || 0;
  
  return (
    <div className="p-4 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button 
          className="text-sm text-gray-600 flex items-center"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={16} className="mr-1" /> Logout
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-gray-600 text-sm mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <h3 className="text-gray-600 text-sm mb-1">Pending</h3>
          <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-xl mb-3 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-28"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 rounded w-56"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div id="admin-orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-item bg-white p-4 rounded-xl mb-3 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Order #{order.id}</span>
                    <p className="font-medium text-gray-800">
                      {order.user.name} • {formatCurrency(parseFloat(order.total.toString()))}
                    </p>
                  </div>
                  <div>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px] bg-gray-100 border-0 focus:ring-0">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="on-the-way">On the way</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {formatDate(order.createdAt)}
                  </p>
                  <p className="text-xs mt-1">{order.deliveryAddress}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
      
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to login again to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
