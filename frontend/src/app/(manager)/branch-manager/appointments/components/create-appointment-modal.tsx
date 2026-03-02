"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Search, Plus } from "lucide-react";
import { Doctor, Slot, slotsApi, DAY_NAMES } from "@/lib/api/slots.api";
import { Service } from "@/lib/api/services.api";
import { Patient, appointmentsApi } from "@/lib/api/appointments-manager.api";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  doctors: Doctor[];
  services: Service[];
  isLoading: boolean;
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  services,
  isLoading,
}: CreateAppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    serviceId: "",
    appointmentDate: "",
    startTime: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Fetch slots when doctor/date changes
  const fetchSlots = useCallback(async (doctorId: string, date: string) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }
    setIsLoadingSlots(true);
    try {
      const slots = await slotsApi.getAvailableSlots(date);
      const doctorSlots = (slots || [])
        .filter((s: Slot) => s.doctorId === doctorId)
        .sort((a: Slot, b: Slot) => a.startTime.localeCompare(b.startTime));
      setAvailableSlots(doctorSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Search patients
  const searchPatients = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    setIsSearchingPatients(true);
    try {
      // Try by phone first, then by name
      const results = await appointmentsApi.searchPatients(query, undefined);
      setPatients(results || []);
    } catch (error) {
      console.error("Error searching patients:", error);
      setPatients([]);
    } finally {
      setIsSearchingPatients(false);
    }
  }, []);

  // Handle patient search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch) {
        searchPatients(patientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      fetchSlots(formData.doctorId, formData.appointmentDate);
    }
  }, [formData.doctorId, formData.appointmentDate, fetchSlots]);

  // Get today's date
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.patientId) newErrors.patientId = "Please select a patient";
    if (!formData.doctorId) newErrors.doctorId = "Please select a doctor";
    if (!formData.serviceId) newErrors.serviceId = "Please select a service";
    if (!formData.appointmentDate) newErrors.appointmentDate = "Please select a date";
    if (!formData.startTime) newErrors.startTime = "Please select a time slot";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const handlePatientSelect = (patient: Patient) => {
    setFormData({ ...formData, patientId: patient.id });
    setPatientSearch(`${patient.user.firstName} ${patient.user.lastName}`);
    setShowPatientDropdown(false);
    setPatients([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Create Appointment</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Patient Search */}
            <div>
              <label className="block text-sm font-medium mb-1">Patient <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setFormData({ ...formData, patientId: "" });
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  placeholder="Search by phone or name..."
                  className={`w-full px-3 py-2 border rounded-lg ${errors.patientId ? "border-red-500" : "border-gray-300"}`}
                />
                {isSearchingPatients && (
                  <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin" />
                )}
                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium">
                          {patient.user.firstName} {patient.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{patient.user.phone || patient.user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>}
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-sm font-medium mb-1">Doctor <span className="text-red-500">*</span></label>
              <select
                value={formData.doctorId}
                onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, startTime: "" })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.doctorId ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} - {d.specialization}
                  </option>
                ))}
              </select>
              {errors.doctorId && <p className="text-xs text-red-500 mt-1">{errors.doctorId}</p>}
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium mb-1">Service <span className="text-red-500">*</span></label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.serviceId ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.duration} min
                  </option>
                ))}
              </select>
              {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.appointmentDate}
                min={getTodayDate()}
                max={getMaxDate()}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, startTime: "" })}
                className={`w-full px-3 py-2 border rounded-lg ${errors.appointmentDate ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.appointmentDate && <p className="text-xs text-red-500 mt-1">{errors.appointmentDate}</p>}
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-medium mb-1">Time Slot <span className="text-red-500">*</span></label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading slots...</span>
                </div>
              ) : !formData.doctorId || !formData.appointmentDate ? (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                  Select doctor and date first
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  No available slots
                </div>
              ) : (
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.startTime ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select time</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.startTime}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
              )}
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 bg-[#00BCD4] text-white rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
