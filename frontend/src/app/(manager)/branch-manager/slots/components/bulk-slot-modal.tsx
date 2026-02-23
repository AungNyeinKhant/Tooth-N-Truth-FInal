"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Doctor, DAY_NAMES_SHORT } from "@/lib/api/slots.api";

const bulkSlotSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  days: z.array(z.number().min(0).max(6)).min(1, "Select at least one day"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, "Invalid time format"),
  bufferTime: z.number().min(0).max(60),
  isActive: z.boolean(),
});

type BulkSlotFormData = z.infer<typeof bulkSlotSchema>;

interface BulkSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BulkSlotFormData) => Promise<void>;
  doctors: Doctor[];
  isLoading?: boolean;
}

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri

export function BulkSlotModal({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  isLoading = false,
}: BulkSlotModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BulkSlotFormData>({
    resolver: zodResolver(bulkSlotSchema),
    defaultValues: {
      doctorId: "",
      days: WEEKDAYS,
      startTime: "09:00",
      endTime: "09:30",
      bufferTime: 5,
      isActive: true,
    },
  });

  const selectedDays = watch("days");

  const toggleDay = (day: number) => {
    const current = selectedDays || [];
    if (current.includes(day)) {
      setValue(
        "days",
        current.filter((d) => d !== day)
      );
    } else {
      setValue("days", [...current, day]);
    }
  };

  const selectWeekdays = () => {
    setValue("days", WEEKDAYS);
  };

  const selectAll = () => {
    setValue("days", [0, 1, 2, 3, 4, 5, 6]);
  };

  const clearAll = () => {
    setValue("days", []);
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (data: BulkSlotFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create Bulk Slots
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Create time slots for multiple days at once. Days with overlapping slots will be skipped.
        </p>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Doctor Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doctor
            </label>
            <select
              {...register("doctorId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            >
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                </option>
              ))}
            </select>
            {errors.doctorId && (
              <p className="text-sm text-red-500 mt-1">{errors.doctorId.message}</p>
            )}
          </div>

          {/* Days Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Days
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-xs text-[#00BCD4] hover:underline"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-[#00BCD4] hover:underline"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES_SHORT.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selectedDays?.includes(index)
                      ? "bg-[#00BCD4] text-white border-[#00BCD4]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#00BCD4]"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {errors.days && (
              <p className="text-sm text-red-500 mt-1">{errors.days.message}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register("startTime")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
              {errors.startTime && (
                <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                {...register("endTime")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
              {errors.endTime && (
                <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Buffer Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buffer Time (minutes)
            </label>
            <input
              type="number"
              {...register("bufferTime", { valueAsNumber: true })}
              min={0}
              max={60}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            />
            <p className="text-xs text-gray-400 mt-1">Time gap after each slot ends</p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("isActive")}
              className="w-4 h-4 rounded border-gray-300 text-[#00BCD4] focus:ring-[#00BCD4]"
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Slots"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
