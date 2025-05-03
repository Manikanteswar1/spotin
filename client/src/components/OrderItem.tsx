import { Order, OrderItem as OrderItemType } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Check, Truck, Clock, Package } from "lucide-react";

interface OrderItemProps {
  order: Order & { items?: OrderItemType[] };
}

export default function OrderItem({ order }: OrderItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get status info
  const getStatusInfo = () => {
    switch (order.status) {
      case 'pending':
        return {
          icon: <Clock className="mr-1" size={14} />,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Pending'
        };
      case 'processing':
        return {
          icon: <Package className="mr-1" size={14} />,
          color: 'bg-blue-100 text-blue-800',
          text: 'Processing'
        };
      case 'on-the-way':
        return {
          icon: <Truck className="mr-1" size={14} />,
          color: 'bg-yellow-100 text-yellow-800',
          text: 'On the way'
        };
      case 'delivered':
        return {
          icon: <Check className="mr-1" size={14} />,
          color: 'bg-green-100 text-green-800',
          text: 'Delivered'
        };
      default:
        return {
          icon: <Clock className="mr-1" size={14} />,
          color: 'bg-gray-100 text-gray-800',
          text: order.status
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  const itemCount = order.items?.length || 0;
  
  return (
    <>
      <div className="order-item bg-white p-4 rounded-xl mb-3 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-xs text-gray-500">Order #{order.id}</span>
            <p className="font-medium text-gray-800">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatCurrency(parseFloat(order.total.toString()))}
            </p>
          </div>
          <div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.text}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
          <button 
            className="text-primary text-sm font-medium"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </button>
        </div>
      </div>

      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Order #{order.id}</SheetTitle>
            <SheetDescription>
              {formatDate(order.createdAt)}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Order Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.icon}
              {statusInfo.text}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Delivery Address</h3>
            <p className="text-gray-600 text-sm">{order.deliveryAddress}</p>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Items</h3>
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm">{item.quantity} x</span>
                  <span className="text-gray-800 ml-2">{item.name}</span>
                </div>
                <span className="text-gray-800">{formatCurrency(parseFloat(item.price.toString()) * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(parseFloat(order.total.toString()) - parseFloat(order.deliveryFee.toString()))}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(parseFloat(order.deliveryFee.toString()))}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100 mt-2">
              <span className="font-medium text-gray-800">Total</span>
              <span className="font-semibold text-primary">
                {formatCurrency(parseFloat(order.total.toString()))}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
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
        </SheetContent>
      </Sheet>
    </>
  );
}
