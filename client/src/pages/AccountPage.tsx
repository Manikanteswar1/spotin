import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Address } from "@shared/schema";
import { getInitials } from "@/lib/utils";
import AddressItem from "@/components/AddressItem";
import AddressModal from "@/components/modals/AddressModal";
import { Bell, HeadphonesIcon, Info, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Fetch user addresses
  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">My Account</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xl">
            {user ? getInitials(user.name) : "G"}
          </div>
          <div className="ml-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              {user?.name || "Guest"}
            </h2>
            <p className="text-gray-600">{user?.phone || ""}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 w-full border-primary text-primary"
        >
          Edit Profile
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">My Addresses</h2>
          <Button 
            variant="ghost" 
            className="text-primary flex items-center p-2"
            onClick={() => setShowAddAddressModal(true)}
          >
            <Plus size={16} className="mr-1" /> Add New
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-xl mb-3 shadow-sm">
                <div className="flex items-start">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-grow">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : addresses && addresses.length > 0 ? (
          <div>
            {addresses.map((address) => (
              <AddressItem key={address.id} address={address} />
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-3 text-center">
            <p className="text-gray-500">No addresses found</p>
            <Button 
              size="sm"
              variant="outline" 
              className="mt-2 border-primary text-primary"
              onClick={() => setShowAddAddressModal(true)}
            >
              Add Your First Address
            </Button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-6">
        <button className="w-full p-4 text-left border-b border-gray-100 flex items-center">
          <Bell className="text-gray-600 mr-3" size={18} />
          <span className="font-medium text-gray-800">Notifications</span>
        </button>
        <button className="w-full p-4 text-left border-b border-gray-100 flex items-center">
          <HeadphonesIcon className="text-gray-600 mr-3" size={18} />
          <span className="font-medium text-gray-800">Help & Support</span>
        </button>
        <button className="w-full p-4 text-left flex items-center">
          <Info className="text-gray-600 mr-3" size={18} />
          <span className="font-medium text-gray-800">About</span>
        </button>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        onClick={() => setShowLogoutConfirm(true)}
      >
        Logout
      </Button>
      
      {showAddAddressModal && (
        <AddressModal 
          isOpen={showAddAddressModal}
          onClose={() => setShowAddAddressModal(false)}
        />
      )}
      
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to login again to place orders.
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
