import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
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

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { adminLogin } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const handleSubmit = async (values: FormValues) => {
    try {
      await adminLogin(values.username, values.password);
      // Auth context will handle setting the admin and redirecting
    } catch (error) {
      console.error("Admin login error:", error);
    }
  };
  
  const goBack = () => {
    setLocation("/");
  };
  
  return (
    <div className="p-6 flex flex-col h-screen">
      <div className="flex items-center mb-6">
        <button 
          className="p-2"
          onClick={goBack}
        >
          <ArrowLeft className="text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 ml-2">Admin Login</h1>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter admin username" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Enter password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500 mt-1">Demo credentials: admin / admin123</p>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" variant="secondary">
              Login
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
