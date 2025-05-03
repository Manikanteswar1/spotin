import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Admin {
  id: number;
  username: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<{ isNewUser: boolean, phone?: string }>;
  register: (name: string, phone: string, email?: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  sendOtp: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for stored auth tokens
        const userToken = localStorage.getItem("userToken");
        const adminToken = localStorage.getItem("adminToken");
        
        if (adminToken) {
          // Fetch admin profile
          const res = await fetch("/api/admin/profile", {
            headers: {
              Authorization: `Bearer ${adminToken}`
            }
          });
          
          if (res.ok) {
            const adminData = await res.json();
            setAdmin(adminData);
          } else {
            // Clear invalid token
            localStorage.removeItem("adminToken");
          }
        } else if (userToken) {
          // Fetch user profile
          const res = await fetch("/api/user/profile", {
            headers: {
              Authorization: `Bearer ${userToken}`
            }
          });
          
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Clear invalid token
            localStorage.removeItem("userToken");
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Clear tokens on error
        localStorage.removeItem("userToken");
        localStorage.removeItem("adminToken");
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const sendOtp = async (phone: string) => {
    try {
      await apiRequest("POST", "/api/auth/send-otp", { phone });
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone"
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const login = async (phone: string, otp: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { phone, otp });
      const data = await res.json();
      
      if (data.isNewUser) {
        return { isNewUser: true, phone };
      }
      
      // Store token and set user
      localStorage.setItem("userToken", data.token);
      setUser(data.user);
      setAdmin(null);
      
      toast({
        title: "Welcome back",
        description: `Hello, ${data.user.name}!`
      });
      
      return { isNewUser: false };
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid phone number or OTP",
        variant: "destructive"
      });
      throw error;
    }
  };

  const register = async (name: string, phone: string, email?: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", { name, phone, email });
      const data = await res.json();
      
      // Store token and set user
      localStorage.setItem("userToken", data.token);
      setUser(data.user);
      setAdmin(null);
      
      toast({
        title: "Welcome to Sip & Savor",
        description: "Your account has been created successfully"
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Could not create your account. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const adminLogin = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/admin/login", { username, password });
      const data = await res.json();
      
      // Store token and set admin
      localStorage.setItem("adminToken", data.token);
      setAdmin(data.admin);
      setUser(null);
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the admin dashboard"
      });
      
      setLocation("/");
    } catch (error) {
      console.error("Admin login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("adminToken");
    setUser(null);
    setAdmin(null);
    setLocation("/");
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  const value = {
    user,
    admin,
    isAdmin: !!admin,
    isLoading,
    login,
    register,
    adminLogin,
    logout,
    sendOtp
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
