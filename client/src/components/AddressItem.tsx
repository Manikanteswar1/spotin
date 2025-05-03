import { Address } from "@shared/schema";
import { Home, Briefcase, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import AddressModal from "./modals/AddressModal";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AddressItemProps {
  address: Address;
}

export default function AddressItem({ address }: AddressItemProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeleteAddress = async () => {
    try {
      await apiRequest("DELETE", `/api/addresses/${address.id}`);
      
      toast({
        title: "Address Deleted",
        description: "Your address has been deleted successfully"
      });

      // Invalidate and refetch addresses
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const IconComponent = address.label.toLowerCase() === 'work'
    ? Briefcase
    : Home;

  return (
    <>
      <div className="address-item bg-white p-4 rounded-xl mb-3 shadow-sm">
        <div className="flex items-start">
          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-1">
            <IconComponent className="text-gray-600" size={18} />
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <h3 className="font-medium text-gray-800">{address.label}</h3>
              {address.default && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">{address.address}</p>
          </div>
          <div className="flex">
            <button 
              className="text-gray-400 mx-1 p-1.5"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil size={16} />
            </button>
            <button 
              className="text-gray-400 mx-1 p-1.5"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {showEditModal && (
        <AddressModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          existingAddress={address}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this address. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAddress}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
