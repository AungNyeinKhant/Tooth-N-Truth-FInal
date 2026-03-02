"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { Doctor, Slot, slotsApi } from "@/lib/api/slots.api";
import { Appointment } from "@/lib/api/appointments-manager.api";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  appointment: Appointment | null;
  doctors: Doctor[];
  isLoading: boolean;
}

export function RescheduleModal({ isOpen, onClose, onSubmit, appointment, doctors, isLoading }: RescheduleModalProps) {
  const [formData, setFormData] = useState({ doctorId: "", appointmentDate: "", startTime: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) { setAvailableSlots([]); return; }
    setIsLoadingSlots(true);
    try {
      const slots = await slotsApi.getAvailableSlots(date);
      const doctorSlots = (slots || []).filter((s: Slot) => s.doctorId === doctorId).sort((a: Slot, b: Slot) => a.startTime.localeCompare(b.startTime));
      setAvailableSlots(doctorSlots);
    } catch { setAvailableSlots([]); } finally { setIsLoadingSlots(false); }
  }, []);

  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({ doctorId: appointment.doctorId, appointmentDate: appointment.appointmentDate.split("T")[0], startTime: "" });
      fetchSlots(appointment.doctorId, appointment.appointmentDate.split("T")[0]);
    }
  }, [isOpen, appointment, fetchSlots]);

  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      fetchSlots(formData.doctorId, formData.appointmentDate);
    }
  }, [formData.doctorId, formData.appointmentDate, fetchSlots]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.doctorId) newErrors.doctorId = "Required";
    if (!formData.appointmentDate) newErrors.appointmentDate = "Required";
    if (!formData.startTime) newErrors.startTime = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Reschedule Appointment</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{appointment.patient.user.firstName} {appointment.patient.user.lastName}</p>
              <p className="text-xs text-gray-500">{appointment.service.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Doctor</label>
              <select value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, startTime: "" })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={formData.appointmentDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, startTime: "" })} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              {isLoadingSlots ? <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"><Loader2 className="w-4 h-4 animate-spin" /></div> : availableSlots.length === 0 ? <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">No slots</div> : (
                <select value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select</option>
                  {availableSlots.map((s) => <option key={s.id} value={s.startTime}>{s.startTime} - {s.endTime}</option>)}
                </select>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-[#00BCD4] text-white rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reschedule"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
