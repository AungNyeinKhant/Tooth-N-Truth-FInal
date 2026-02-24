"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { CreateWalkInRequest } from "@/lib/api/walkins.api";
import { Doctor, slotsApi, Slot, DAY_NAMES } from "@/lib/api/slots.api";
import { Service } from "@/lib/api/services.api";

interface RegisterWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWalkInRequest) => Promise<void>;
  doctors: Doctor[];
  services: Service[];
  isLoading: boolean;
}

export function RegisterWalkInModal({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  services,
  isLoading,
}: RegisterWalkInModalProps) {
  const [formData, setFormData] = useState<CreateWalkInRequest>({
    firstName: "",
    lastName: "",
    phone: "",
    reason: "",
    preferredDoctorId: "",
    slotId: "",
    serviceId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

      // Fetch available slots for today when doctor is selected
  const fetchSlots = useCallback(async (doctorId: string) => {
    if (!doctorId) {
      setSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    try {
      // Get today's date
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch available slots for today
      const availableSlots: Slot[] = await slotsApi.getAvailableSlots(today);
      
      // Filter to only slots for the selected doctor
      const doctorSlots = (availableSlots || [])
        .filter((s: Slot) => s.doctorId === doctorId)
        .sort((a: Slot, b: Slot) => a.startTime.localeCompare(b.startTime));
      
      setSlots(doctorSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Fetch slots when doctor changes
  useEffect(() => {
    if (formData.preferredDoctorId) {
      fetchSlots(formData.preferredDoctorId);
      // Clear slot selection when doctor changes
      setFormData((prev) => ({ ...prev, slotId: "" }));
    } else {
      setSlots([]);
    }
  }, [formData.preferredDoctorId, fetchSlots]);

  // Reset form only when explicitly called (on success)
  const resetForm = useCallback(() => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      reason: "",
      preferredDoctorId: "",
      slotId: "",
      serviceId: "",
    });
    setErrors({});
    setSlots([]);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.preferredDoctorId) {
      newErrors.preferredDoctorId = "Please select a doctor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: CreateWalkInRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      reason: formData.reason?.trim() || undefined,
      preferredDoctorId: formData.preferredDoctorId || undefined,
      slotId: formData.slotId || undefined,
      serviceId: formData.serviceId || undefined,
    };

    try {
      await onSubmit(submitData);
      // Only reset on success
      resetForm();
    } catch {
      // Don't reset on error - keep form values for editing
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    // Don't reset form when closing - user might want to continue later
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Register Walk-in Patient
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Patient Info */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Patient Name <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="First name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Last name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="e.g., 09123456789"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Used to identify returning patients
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit (Optional)
              </label>
              <textarea
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Describe the patient's concern..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-none"
              />
            </div>

            {/* Doctor - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.preferredDoctorId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, preferredDoctorId: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.preferredDoctorId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} -{" "}
                    {doctor.specialization}
                  </option>
                ))}
              </select>
              {errors.preferredDoctorId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.preferredDoctorId}
                </p>
              )}
            </div>

            {/* Slot - Optional but recommended */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot (Optional)
              </label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading slots...</span>
                </div>
              ) : !formData.preferredDoctorId ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Select a doctor to see available slots
                </div>
              ) : slots.length === 0 ? (
                <div className="px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm text-yellow-700">
                  No slots available for this doctor
                </div>
              ) : (
                <select
                  value={formData.slotId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, slotId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                >
                  <option value="">Use current time (walk-in)</option>
                  {slots.map((slot) => (
                    <option
                      key={slot.id}
                      value={slot.id}
                      disabled={slot.isBooked}
                    >
                      {slot.startTime} - {slot.endTime}{" "}
                      {slot.isBooked ? "(Booked)" : ""}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Available slots for today. Choose a slot or leave empty for immediate walk-in.
              </p>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service (Optional)
              </label>
              <select
                value={formData.serviceId || ""}
                onChange={(e) =>
                  setFormData({ ...formData, serviceId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              >
                <option value="">Auto-select first service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-[#00BCD4] rounded-lg text-white font-medium hover:bg-[#00A5BA] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
