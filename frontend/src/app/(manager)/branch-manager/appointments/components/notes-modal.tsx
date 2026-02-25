"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Appointment } from "@/lib/api/appointments-manager.api";

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => Promise<void>;
  appointment: Appointment | null;
  isLoading: boolean;
}

export function NotesModal({ isOpen, onClose, onSubmit, appointment, isLoading }: NotesModalProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && appointment) {
      setNotes(appointment.notes || "");
    }
  }, [isOpen, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(notes);
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Appointment Notes</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{appointment.patient.user.firstName} {appointment.patient.user.lastName}</p>
              <p className="text-xs text-gray-500">{appointment.service.name} - {appointment.startTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this appointment..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-[#00BCD4] text-white rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Notes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
