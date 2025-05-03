import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import CafePage from "@/pages/CafePage";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import AccountPage from "@/pages/AccountPage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);
    }
  }, [isLoading]);

  if (!isReady) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-primary">Loading...</div>
    </div>;
  }

  return (
    <div className="pb-24 bg-background min-h-screen max-w-lg mx-auto">
      <Switch>
        <Route path="/" component={CafePage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/account" component={AccountPage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function AuthRoutes() {
  const { user, isAdmin } = useAuth();
  
  if (isAdmin) {
    return (
      <Switch>
        <Route path="/" component={AdminDashboardPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  if (user) {
    return <ProtectedRoutes />;
  }
  
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <div className="mx-auto bg-background min-h-screen">
            <AuthRoutes />
          </div>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
