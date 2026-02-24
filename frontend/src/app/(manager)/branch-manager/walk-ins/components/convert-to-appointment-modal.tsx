"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, ArrowRight } from "lucide-react";
import {
  ConvertToAppointmentRequest,
  WalkIn,
} from "@/lib/api/walkins.api";
import { Doctor } from "@/lib/api/doctors.api";

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
    startTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate time slots from 8:00 to 18:00
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      timeSlots.push(time);
    }
  }

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

  useEffect(() => {
    if (isOpen && walkIn) {
      const today = new Date();
      today.setDate(today.getDate() + 1); // Default to tomorrow
      setFormData({
        doctorId: walkIn.doctorId || "",
        appointmentDate: today.toISOString().split("T")[0],
        startTime: "09:00",
      });
      setErrors({});
    }
  }, [isOpen, walkIn]);

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

    if (!formData.startTime) {
      newErrors.startTime = "Please select a time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: ConvertToAppointmentRequest = {
      doctorId: formData.doctorId,
      appointmentDate: formData.appointmentDate,
      startTime: formData.startTime,
    };

    await onSubmit(submitData);
  };

  if (!isOpen || !walkIn) return null;

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
              Convert this walk-in to a scheduled appointment. The token number
              will be removed.
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

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <select
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                  errors.startTime ? "border-red-500" : "border-gray-300"
                }`}
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.startTime && (
                <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
              )}
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
