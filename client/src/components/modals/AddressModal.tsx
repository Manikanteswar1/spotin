import { useState } from "react";
import { Address } from "@shared/schema";
import { Home, Store, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAddress?: Address;
}

export default function AddressModal({ isOpen, onClose, existingAddress }: AddressModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Direct state management instead of form library
  const [addressType, setAddressType] = useState<string>(existingAddress?.label || "Home");
  const [addressText, setAddressText] = useState<string>(existingAddress?.address || "");
  const [isDefault, setIsDefault] = useState<boolean>(existingAddress?.default || false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAddressTypeChange = (value: string) => {
    setAddressType(value);
  };
  
  const handleAddressTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddressText(e.target.value);
    if (error) setError(null);
  };
  
  const handleDefaultChange = (checked: boolean) => {
    setIsDefault(checked);
  };
  
  const validateInputs = (): boolean => {
    if (!addressText || addressText.trim().length < 5) {
      setError("Please enter a complete address (at least 5 characters)");
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    
    try {
      const addressData = {
        label: addressType,
        address: addressText.trim(),
        default: isDefault
      };
      
      // Use fetch directly with proper headers
      const token = localStorage.getItem("userToken");
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      const url = existingAddress 
        ? `/api/addresses/${existingAddress.id}` 
        : "/api/addresses";
      
      const method = existingAddress ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save address");
      }
      
      // Success
      toast({
        title: existingAddress ? "Address Updated" : "Address Added",
        description: existingAddress 
          ? "Your address has been updated successfully" 
          : "Your address has been added successfully"
      });
      
      // Refresh address data
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      setError(error instanceof Error ? error.message : "Failed to save address");
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {existingAddress ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            Please fill in the details for your delivery address
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Address Type</Label>
            <RadioGroup 
              defaultValue={addressType} 
              onValueChange={handleAddressTypeChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Home" id="home" />
                <Label htmlFor="home" className="flex items-center gap-1 cursor-pointer">
                  <Home size={16} /> Home
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Work" id="work" />
                <Label htmlFor="work" className="flex items-center gap-1 cursor-pointer">
                  <Store size={16} /> Work
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Other" id="other" />
                <Label htmlFor="other" className="flex items-center gap-1 cursor-pointer">
                  <MapPin size={16} /> Other
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Complete Address</Label>
            <Textarea
              id="address"
              placeholder="Enter your full address with street, city, and pin code"
              className="resize-none"
              rows={4} 
              value={addressText}
              onChange={handleAddressTextChange}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="default-address"
              checked={isDefault}
              onCheckedChange={handleDefaultChange}
            />
            <Label htmlFor="default-address">Set as default address</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="border-gray-200"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
