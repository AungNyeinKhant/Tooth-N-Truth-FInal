"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Appointment, AppointmentStatus } from "@/lib/api/appointments-manager.api";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  appointment: Appointment | null;
  action: AppointmentStatus | null;
  isLoading: boolean;
}

export function StatusModal({ isOpen, onClose, onSubmit, appointment, action, isLoading }: StatusModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setNotes(appointment?.notes || "");
    }
  }, [isOpen, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action === "CANCELLED" && !reason.trim()) return;
    await onSubmit({ status: action, reason: action === "CANCELLED" || action === "NO_SHOW" ? reason : undefined, notes });
  };

  const getStatusInfo = () => {
    switch (action) {
      case "COMPLETED": return { title: "Mark Completed", icon: <CheckCircle className="w-5 h-5 text-green-600" />, color: "green" };
      case "NO_SHOW": return { title: "Mark No Show", icon: <XCircle className="w-5 h-5 text-red-600" />, color: "red" };
      case "CANCELLED": return { title: "Cancel Appointment", icon: <XCircle className="w-5 h-5 text-red-600" />, color: "red" };
      default: return { title: "Update Status", icon: null, color: "gray" };
    }
  };

  if (!isOpen || !appointment || !action) return null;
  const info = getStatusInfo();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${info.color}-100 rounded-lg`}>{info.icon}</div>
              <h2 className="text-lg font-semibold">{info.title}</h2>
            </div>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{appointment.patient.user.firstName} {appointment.patient.user.lastName}</p>
              <p className="text-xs text-gray-500">{appointment.service.name} - {appointment.startTime}</p>
            </div>
            {(action === "CANCELLED" || action === "NO_SHOW") && (
              <div>
                <label className="block text-sm font-medium mb-1">Reason {action === "CANCELLED" && <span className="text-red-500">*</span>}</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={action === "CANCELLED" ? "Why is this being cancelled?" : "Why did the patient not show up?"} rows={2} className="w-full px-3 py-2 border rounded-lg" required={action === "CANCELLED"} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={isLoading || (action === "CANCELLED" && !reason.trim())} className={`flex-1 px-4 py-2 text-white rounded-lg flex items-center justify-center gap-2 ${action === "CANCELLED" || action === "NO_SHOW" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : info.title}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
