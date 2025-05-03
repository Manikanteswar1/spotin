import { useState } from "react";
import { Address } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAddress?: Address;
}

// Client-side schema that matches the server's expectations
const formSchema = z.object({
  label: z.string().min(2, "Label must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  default: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddressModal({ isOpen, onClose, existingAddress }: AddressModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: existingAddress?.label || "",
      address: existingAddress?.address || "",
      default: existingAddress?.default || false,
    },
  });
  
  const handleSubmit = async (values: FormValues) => {
    try {
      if (existingAddress) {
        // Update existing address
        await apiRequest("PUT", `/api/addresses/${existingAddress.id}`, values);
        toast({
          title: "Address Updated",
          description: "Your address has been updated successfully"
        });
      } else {
        // Create new address
        await apiRequest("POST", "/api/addresses", values);
        toast({
          title: "Address Added",
          description: "Your address has been added successfully"
        });
      }
      
      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {existingAddress ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Home, Work, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your full address" 
                      className="resize-none" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Set as default address</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Save Address
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
