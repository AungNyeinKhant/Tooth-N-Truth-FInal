"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Play, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  UpdateWalkInStatusRequest,
  WalkIn,
  WalkInStatus,
} from "@/lib/api/walkins.api";
import { Doctor } from "@/lib/api/slots.api";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateWalkInStatusRequest) => Promise<void>;
  walkIn: WalkIn | null;
  action: WalkInStatus | null;
  doctors: Doctor[];
  isLoading: boolean;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  onSubmit,
  walkIn,
  action,
  doctors,
  isLoading,
}: UpdateStatusModalProps) {
  const [formData, setFormData] = useState({
    doctorId: "",
    cancelReason: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && walkIn) {
      setFormData({
        doctorId: walkIn.doctorId || "",
        cancelReason: "",
        notes: "",
      });
      setErrors({});
    }
  }, [isOpen, walkIn]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (action === "ASSIGNED" && !formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }

    if (action === "CANCELLED" && !formData.cancelReason.trim()) {
      newErrors.cancelReason = "Please provide a reason for cancellation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !action) return;

    const submitData: UpdateWalkInStatusRequest = {
      status: action,
    };

    if (action === "ASSIGNED") {
      submitData.doctorId = formData.doctorId;
    }

    if (action === "CANCELLED") {
      submitData.cancelReason = formData.cancelReason.trim();
    }

    if (formData.notes.trim()) {
      submitData.notes = formData.notes.trim();
    }

    await onSubmit(submitData);
  };

  const getActionInfo = () => {
    switch (action) {
      case "IN_PROGRESS":
        return {
          title: "Start Treatment",
          icon: <Play className="w-5 h-5 text-orange-600" />,
          color: "orange",
          description:
            "Mark this walk-in as currently being treated by the doctor.",
        };
      case "COMPLETED":
        return {
          title: "Complete Treatment",
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          color: "green",
          description: "Mark this walk-in as successfully completed.",
        };
      case "CANCELLED":
        return {
          title: "Cancel Walk-in",
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          color: "red",
          description: "Cancel this walk-in appointment.",
        };
      case "ASSIGNED":
        return {
          title: "Assign Doctor",
          icon: <Clock className="w-5 h-5 text-purple-600" />,
          color: "purple",
          description: "Assign a specific doctor to this walk-in.",
        };
      default:
        return {
          title: "Update Status",
          icon: null,
          color: "gray",
          description: "",
        };
    }
  };

  if (!isOpen || !walkIn || !action) return null;

  const actionInfo = getActionInfo();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 bg-${actionInfo.color}-100 rounded-lg`}
              >
                {actionInfo.icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {actionInfo.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Patient Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 bg-[#00BCD4] text-white font-bold rounded-lg text-sm">
                  {walkIn.tokenNumber}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {walkIn.patient.user.firstName} {walkIn.patient.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dr. {walkIn.doctor.firstName} {walkIn.doctor.lastName}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">{actionInfo.description}</p>

            {/* Assign Doctor (for ASSIGNED status) */}
            {action === "ASSIGNED" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorId: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                    errors.doctorId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} -{" "}
                      {doctor.specialization}
                    </option>
                  ))}
                </select>
                {errors.doctorId && (
                  <p className="text-xs text-red-500 mt-1">{errors.doctorId}</p>
                )}
              </div>
            )}

            {/* Cancel Reason (for CANCELLED status) */}
            {action === "CANCELLED" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  value={formData.cancelReason}
                  onChange={(e) =>
                    setFormData({ ...formData, cancelReason: e.target.value })
                  }
                  placeholder="Why is this walk-in being cancelled?"
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-none ${
                    errors.cancelReason ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.cancelReason && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.cancelReason}
                  </p>
                )}
              </div>
            )}

            {/* Notes (optional for all actions) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any relevant notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  action === "CANCELLED"
                    ? "bg-red-600 hover:bg-red-700"
                    : action === "COMPLETED"
                    ? "bg-green-600 hover:bg-green-700"
                    : action === "IN_PROGRESS"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-[#00BCD4] hover:bg-[#00A5BA]"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  actionInfo.title
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
