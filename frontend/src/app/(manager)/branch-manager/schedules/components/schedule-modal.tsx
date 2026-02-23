"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Schedule, Doctor, DAY_NAMES, DAY_NAMES_SHORT } from "@/lib/api/schedules.api";

const scheduleSchema = z.object({
  doctorId: z.string().min(1, "Doctor is required"),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/, "Invalid time format"),
  slotDuration: z.number().min(5).max(120),
  bufferTime: z.number().min(0).max(60),
  isActive: z.boolean(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  schedule?: Schedule | null;
  doctors: Doctor[];
  isLoading?: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  schedule,
  doctors,
  isLoading = false,
}: ScheduleModalProps) {
  const isEditing = !!schedule;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      doctorId: "",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
      bufferTime: 10,
      isActive: true,
    },
  });

  useEffect(() => {
    if (schedule) {
      setValue("doctorId", schedule.doctorId);
      setValue("dayOfWeek", schedule.dayOfWeek);
      setValue("startTime", schedule.startTime);
      setValue("endTime", schedule.endTime);
      setValue("slotDuration", schedule.slotDuration);
      setValue("bufferTime", schedule.bufferTime);
      setValue("isActive", schedule.isActive);
    } else {
      reset({
        doctorId: doctors.length === 1 ? doctors[0].id : "",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 30,
        bufferTime: 10,
        isActive: true,
      });
    }
  }, [schedule, doctors, setValue, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: ScheduleFormData) => {
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
            {isEditing ? "Edit Schedule" : "Add Schedule"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Doctor Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doctor
            </label>
            <select
              {...register("doctorId")}
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] disabled:bg-gray-100"
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

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of Week
            </label>
            <select
              {...register("dayOfWeek", { valueAsNumber: true })}
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] disabled:bg-gray-100"
            >
              {DAY_NAMES.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && (
              <p className="text-sm text-red-500 mt-1">{errors.dayOfWeek.message}</p>
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

          {/* Slot Duration & Buffer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slot Duration (min)
              </label>
              <input
                type="number"
                {...register("slotDuration", { valueAsNumber: true })}
                min={5}
                max={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
              {errors.slotDuration && (
                <p className="text-sm text-red-500 mt-1">{errors.slotDuration.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buffer Time (min)
              </label>
              <input
                type="number"
                {...register("bufferTime", { valueAsNumber: true })}
                min={0}
                max={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              />
              {errors.bufferTime && (
                <p className="text-sm text-red-500 mt-1">{errors.bufferTime.message}</p>
              )}
            </div>
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
                  Saving...
                </>
              ) : (
                isEditing ? "Update" : "Create"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
