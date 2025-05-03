import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { nameSchema, phoneSchema, emailSchema, addressSchema } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

const formSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  address: addressSchema,
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const [location, setLocation] = useLocation();
  const { register } = useAuth();
  
  // Get phone from query params if available
  const params = new URLSearchParams(location.split('?')[1] || '');
  const phoneFromParams = params.get('phone') || '';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: phoneFromParams,
      email: "",
      address: "",
    },
  });
  
  // Update phone field when params change
  useEffect(() => {
    if (phoneFromParams) {
      form.setValue('phone', phoneFromParams);
    }
  }, [phoneFromParams, form]);
  
  const handleSubmit = async (values: FormValues) => {
    try {
      // Register user (this will also create the first address)
      await register(values.name, values.phone, values.email || undefined);
      
      // Create first address
      await apiRequest("POST", "/api/addresses", {
        label: "Home",
        address: values.address,
        default: true
      });
      
      // AuthContext will handle setting the user and redirect
    } catch (error) {
      console.error("Registration error:", error);
    }
  };
  
  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Complete Your Profile</h1>
        <p className="text-gray-600">We need some details to get you started</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your full name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="Enter your phone number" 
                      {...field} 
                      disabled={!!phoneFromParams}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      {...field} 
                    />
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
                  <FormLabel>Delivery Address</FormLabel>
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
            
            <Button type="submit" className="w-full">
              Complete Registration
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
