import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { phoneSchema, otpSchema } from "@/lib/utils";
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

const phoneFormSchema = z.object({
  phone: phoneSchema,
});

const otpFormSchema = z.object({
  otp: otpSchema,
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

export default function LoginPage() {
  const [showOtp, setShowOtp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [, setLocation] = useLocation();
  const { sendOtp, login } = useAuth();
  
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: "",
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: "",
    },
  });
  
  const handlePhoneSubmit = async (values: PhoneFormValues) => {
    try {
      await sendOtp(values.phone);
      setPhoneNumber(values.phone);
      setShowOtp(true);
      
      // Auto-fill OTP for demo
      setTimeout(() => {
        otpForm.setValue("otp", "1234");
      }, 1000);
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };
  
  const handleOtpSubmit = async (values: OtpFormValues) => {
    try {
      const result = await login(phoneNumber, values.otp);
      
      if (result.isNewUser) {
        // Redirect to registration
        setLocation(`/register?phone=${phoneNumber}`);
      }
      // Auth context will handle setting the user and redirecting to home
    } catch (error) {
      console.error("Error verifying OTP:", error);
    }
  };
  
  const navigateToAdminLogin = () => {
    setLocation("/admin/login");
  };
  
  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="mt-16 mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to</h1>
        <h1 className="text-3xl font-bold text-primary">Sip & Savor</h1>
        <p className="text-gray-600 mt-2">Sign in to order your favorite drinks</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        {!showOtp ? (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="Enter your phone number" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">
                Send OTP
              </Button>
              
              <div className="text-center mt-4 text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/" className="text-primary hover:underline">
                  Register here
                </Link>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 4-digit OTP" 
                        maxLength={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500 mt-1">OTP will be auto-filled for demo purposes</p>
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">
                Verify & Continue
              </Button>
            </form>
          </Form>
        )}
      </div>
      
      <div className="mt-auto">
        <p className="text-center text-gray-600 mb-4">Are you an admin?</p>
        <Button 
          variant="outline" 
          className="w-full border-primary text-primary"
          onClick={navigateToAdminLogin}
        >
          Admin Login
        </Button>
      </div>
    </div>
  );
}
