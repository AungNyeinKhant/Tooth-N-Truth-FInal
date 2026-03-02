"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Calendar, ArrowRight } from "lucide-react";
import {
  ConvertToAppointmentRequest,
  WalkIn,
} from "@/lib/api/walkins.api";
import { Doctor, Slot, DAY_NAMES, slotsApi } from "@/lib/api/slots.api";

interface ConvertToAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ConvertToAppointmentRequest) => Promise<void>;
  walkIn: WalkIn | null;
  doctors: Doctor[];
  isLoading: boolean;
}

export function ConvertToAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  walkIn,
  doctors,
  isLoading,
}: ConvertToAppointmentModalProps) {
  const [formData, setFormData] = useState({
    doctorId: "",
    appointmentDate: "",
    slotId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get date 30 days from now
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  // Fetch available slots when date changes
  const fetchAvailableSlots = useCallback(async (date: string) => {
    if (!date) {
      setAvailableSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    try {
      const slots = await slotsApi.getAvailableSlots(date);
      setAvailableSlots(slots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && walkIn) {
      // Default to today + 1 day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      
      setFormData({
        doctorId: walkIn.doctorId || "",
        appointmentDate: dateStr,
        slotId: "",
      });
      setErrors({});
      
      // Fetch slots for default date
      fetchAvailableSlots(dateStr);
    }
  }, [isOpen, walkIn, fetchAvailableSlots]);

  // Fetch slots when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      fetchAvailableSlots(formData.appointmentDate);
      // Clear slot selection when date changes
      setFormData((prev) => ({ ...prev, slotId: "" }));
    }
  }, [formData.appointmentDate, fetchAvailableSlots]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = "Please select a date";
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.appointmentDate = "Please select a future date";
      }
    }

    if (!formData.slotId) {
      newErrors.slotId = "Please select an available time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Find the selected slot to get time
    const selectedSlot = availableSlots.find((s) => s.id === formData.slotId);
    if (!selectedSlot) {
      return;
    }

    const submitData: ConvertToAppointmentRequest = {
      doctorId: formData.doctorId,
      appointmentDate: formData.appointmentDate,
      startTime: selectedSlot.startTime,
    };

    await onSubmit(submitData);
  };

  if (!isOpen || !walkIn) return null;

  // Filter slots by selected doctor
  const filteredSlots = formData.doctorId
    ? availableSlots.filter((s) => s.doctorId === formData.doctorId)
    : availableSlots;

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
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Calendar className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Convert to Appointment
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
            {/* Current Walk-in Info */}
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
                    {walkIn.service.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>

            <p className="text-sm text-gray-600">
              Select a date and choose an available time slot for this appointment.
            </p>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor
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

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                min={getTodayDate()}
                max={getMaxDate()}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.appointmentDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.appointmentDate && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.appointmentDate}
                </p>
              )}
            </div>

            {/* Available Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Time Slot <span className="text-red-500">*</span>
              </label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading slots...</span>
                </div>
              ) : !formData.appointmentDate ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Select a date to see available slots
                </div>
              ) : !formData.doctorId ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Select a doctor to see available slots
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm text-yellow-700">
                  No available slots for this doctor on this date
                </div>
              ) : (
                <select
                  value={formData.slotId}
                  onChange={(e) =>
                    setFormData({ ...formData, slotId: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                    errors.slotId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a time slot</option>
                  {filteredSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime} (Dr. {slot.doctor.firstName} {slot.doctor.lastName.charAt(0)}.)
                    </option>
                  ))}
                </select>
              )}
              {errors.slotId && (
                <p className="text-xs text-red-500 mt-1">{errors.slotId}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Only showing available slots (already booked slots are hidden)
              </p>
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
                className="flex-1 px-4 py-2 bg-[#00BCD4] rounded-lg text-white font-medium hover:bg-[#00A5BA] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  "Convert"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
