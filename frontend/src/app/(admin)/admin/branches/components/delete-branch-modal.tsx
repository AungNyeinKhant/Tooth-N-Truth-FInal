"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { Building2, User, AlertTriangle, Loader2 } from "lucide-react";
import { Branch } from "@/types";

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  onConfirm: () => Promise<void>;
}

export function DeleteBranchModal({
  isOpen,
  onClose,
  branch,
  onConfirm,
}: DeleteBranchModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!branch) return;

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to delete branch";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  const getManagerName = () => {
    if (branch?.managers && branch.managers.length > 0) {
      const manager = branch.managers[0].user;
      return `${manager.firstName} ${manager.lastName}`;
    }
    return null;
  };

  const getManagerEmail = () => {
    if (branch?.managers && branch.managers.length > 0) {
      return branch.managers[0].user.email;
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete Branch"
      description="This action cannot be undone"
      size="md"
    >
      <div className="space-y-4">
        {/* Branch Info */}
        {branch && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[#00BCD4]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{branch.name}</p>
                <p className="text-sm text-gray-500">{branch.address}</p>
              </div>
            </div>

            {getManagerName() && (
              <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getManagerName()}</p>
                  <p className="text-sm text-gray-500">{getManagerEmail()}</p>
                  <p className="text-xs text-red-500 mt-1">
                    This manager account will be permanently deleted
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-3 text-amber-700 bg-amber-50 rounded-lg p-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Warning</p>
            <p className="mt-1">
              Deleting this branch will also permanently delete the manager account. 
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <p className="font-medium">Cannot delete branch</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete Branch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
