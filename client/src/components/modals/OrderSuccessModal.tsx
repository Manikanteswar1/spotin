import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
}

export default function OrderSuccessModal({ isOpen, onClose, orderId }: OrderSuccessModalProps) {
  const [, setLocation] = useLocation();
  
  const handleViewOrder = () => {
    onClose();
    setLocation("/orders");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 text-center">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-500 h-10 w-10" />
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 mb-2">
            Order Placed Successfully!
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Your order #{orderId} has been placed successfully. You can track the status in My Orders.
          </DialogDescription>
        </DialogHeader>
        
        <Button 
          className="w-full mt-6"
          onClick={handleViewOrder}
        >
          View My Order
        </Button>
      </DialogContent>
    </Dialog>
  );
}
