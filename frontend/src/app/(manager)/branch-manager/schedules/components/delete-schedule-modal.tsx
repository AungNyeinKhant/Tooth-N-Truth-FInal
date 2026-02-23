"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

interface DeleteScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  scheduleInfo: string;
  isLoading?: boolean;
  hasAppointments?: boolean;
}

export function DeleteScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  scheduleInfo,
  isLoading = false,
  hasAppointments = false,
}: DeleteScheduleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Delete Schedule</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this schedule?
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">{scheduleInfo}</p>
          </div>
        </div>

        {hasAppointments && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              This doctor has upcoming appointments. You cannot delete this schedule until those appointments are completed or cancelled.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading || hasAppointments}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
