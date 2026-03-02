"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, UserPlus, Search, Calendar } from "lucide-react";
import { CreateWalkInRequest, PatientSearchResult, searchPatientsByPhone } from "@/lib/api/walkins.api";
import { Doctor, slotsApi, Slot } from "@/lib/api/slots.api";
import { Service } from "@/lib/api/services.api";

interface RegisterWalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWalkInRequest) => Promise<void>;
  doctors: Doctor[];
  services: Service[];
  isLoading: boolean;
}

type PatientMode = "new" | "returning";

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateToLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function RegisterWalkInModal({
  isOpen,
  onClose,
  onSubmit,
  doctors,
  services,
  isLoading,
}: RegisterWalkInModalProps) {
  // Form state
  const [formData, setFormData] = useState<CreateWalkInRequest>({
    date: formatDateToLocal(new Date()),
    patientId: "",
    firstName: "",
    lastName: "",
    phone: "",
    reason: "",
    doctorId: "",
    slotId: "",
    serviceId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [patientMode, setPatientMode] = useState<PatientMode>("new");
  const [doctorsForDate, setDoctorsForDate] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [searchedPatients, setSearchedPatients] = useState<PatientSearchResult[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);

  // Get today's date string (using local timezone)
  const today = formatDateToLocal(new Date());

  // Fetch doctors when date changes
  const fetchDoctorsByDate = useCallback(async (date: string) => {
    setIsLoadingDoctors(true);
    try {
      const result = await slotsApi.getDoctorsByDate(date);
      setDoctorsForDate(result || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctorsForDate([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  }, []);

  // Fetch slots when doctor and date changes
  const fetchSlots = useCallback(async (date: string) => {
    setIsLoadingSlots(true);
    try {
      const availableSlots: Slot[] = await slotsApi.getAvailableSlots(date);
      setSlots(availableSlots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Initial load and date change
  useEffect(() => {
    if (formData.date && isOpen) {
      fetchDoctorsByDate(formData.date);
    }
  }, [formData.date, isOpen, fetchDoctorsByDate]);

  // Fetch slots when doctor changes
  useEffect(() => {
    if (formData.doctorId && formData.date) {
      fetchSlots(formData.date);
      // Clear slot selection when doctor changes
      setFormData((prev) => ({ ...prev, slotId: "" }));
    } else {
      setSlots([]);
    }
  }, [formData.doctorId, formData.date, fetchSlots]);

  // Search patients by phone when in returning mode
  const handlePhoneSearch = useCallback(async (phone: string) => {
    if (!phone || phone.trim().length < 3) {
      setSearchedPatients([]);
      return;
    }

    setIsSearchingPatients(true);
    try {
      const result = await searchPatientsByPhone(phone.trim());
      setSearchedPatients(result || []);
      setShowPatientResults(true);
    } catch (error) {
      console.error("Error searching patients:", error);
      setSearchedPatients([]);
    } finally {
      setIsSearchingPatients(false);
    }
  }, []);

  // Select a patient from search results
  const handleSelectPatient = (patient: PatientSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      patientId: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
    }));
    setShowPatientResults(false);
    setSearchedPatients([]);
  };

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      date: formatDateToLocal(new Date()),
      patientId: "",
      firstName: "",
      lastName: "",
      phone: "",
      reason: "",
      doctorId: "",
      slotId: "",
      serviceId: "",
    });
    setErrors({});
    setDoctorsForDate([]);
    setSlots([]);
    setSearchedPatients([]);
    setPatientMode("new");
  }, []);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }

    if (patientMode === "returning") {
      if (!formData.patientId) {
        newErrors.phone = "Please search and select a patient";
      }
    } else {
      if (!formData.firstName?.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName?.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.phone?.trim()) {
        newErrors.phone = "Phone number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData: CreateWalkInRequest = {
      date: formData.date,
      reason: formData.reason?.trim() || undefined,
      doctorId: formData.doctorId,
      slotId: formData.slotId || undefined,
      serviceId: formData.serviceId || undefined,
    };

    if (patientMode === "returning" && formData.patientId) {
      submitData.patientId = formData.patientId;
    } else {
      submitData.firstName = formData.firstName?.trim();
      submitData.lastName = formData.lastName?.trim();
      submitData.phone = formData.phone?.trim();
    }

    try {
      await onSubmit(submitData);
      resetForm();
    } catch {
      // Error handling done in parent
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Filter slots for selected doctor
  const doctorSlots = slots
    .filter((s) => s.doctorId === formData.doctorId)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-cyan-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Register Walk-in
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
            {/* Date Selection - Step 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  min={today}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value, doctorId: "", slotId: "" })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                    errors.date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date}</p>
              )}
            </div>

            {/* Doctor Selection - Step 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor <span className="text-red-500">*</span>
              </label>
              {isLoadingDoctors ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading doctors...</span>
                </div>
              ) : !formData.date ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Select a date first
                </div>
              ) : doctorsForDate.length === 0 ? (
                <div className="px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm text-yellow-700">
                  No doctors available on this date
                </div>
              ) : (
                <select
                  value={formData.doctorId}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorId: e.target.value, slotId: "" })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                    errors.doctorId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a doctor</option>
                  {doctorsForDate.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName} -{" "}
                      {doctor.specialization}
                    </option>
                  ))}
                </select>
              )}
              {errors.doctorId && (
                <p className="text-xs text-red-500 mt-1">{errors.doctorId}</p>
              )}
            </div>

            {/* Slot Selection - Step 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Slot (Optional)
              </label>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading slots...</span>
                </div>
              ) : !formData.doctorId ? (
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Select a doctor to see available slots
                </div>
              ) : doctorSlots.length === 0 ? (
                <div className="px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-sm text-yellow-700">
                  No slots available for this doctor on this date
                </div>
              ) : (
                <select
                  value={formData.slotId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, slotId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                >
                  <option value="">Immediate walk-in (current time)</option>
                  {doctorSlots.map((slot) => (
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
                {formData.slotId
                  ? "Patient will be scheduled for this slot"
                  : "Patient will be registered as immediate walk-in"}
              </p>
            </div>

            {/* Patient Mode Toggle */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode("new");
                    setFormData((prev) => ({
                      ...prev,
                      patientId: "",
                      firstName: "",
                      lastName: "",
                      phone: "",
                    }));
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    patientMode === "new"
                      ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  New Patient
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode("returning");
                    setFormData((prev) => ({
                      ...prev,
                      firstName: "",
                      lastName: "",
                      phone: "",
                    }));
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    patientMode === "returning"
                      ? "bg-cyan-100 text-cyan-700 border border-cyan-300"
                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Returning Patient
                </button>
              </div>
            </div>

            {/* Patient Information */}
            {patientMode === "new" ? (
              <>
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="First name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                      errors.firstName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Last name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                      errors.lastName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
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
                </div>
              </>
            ) : (
              /* Returning Patient - Phone Search */
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value, patientId: "" });
                      setShowPatientResults(false);
                      if (e.target.value.length >= 3) {
                        handlePhoneSearch(e.target.value);
                      } else {
                        setSearchedPatients([]);
                      }
                    }}
                    onFocus={() => {
                      if (searchedPatients.length > 0) {
                        setShowPatientResults(true);
                      }
                    }}
                    placeholder="Enter phone number to search"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  {isSearchingPatients && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showPatientResults && searchedPatients.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                    {searchedPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-4 py-2 text-left hover:bg-cyan-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{patient.phone}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* No results found */}
                {showPatientResults && searchedPatients.length === 0 && (formData.phone?.length || 0) >= 3 && !isSearchingPatients && (
                  <div className="mt-1 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">No patients found with this phone number</p>
                  </div>
                )}

                {/* Selected Patient Info */}
                {formData.patientId && (
                  <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Selected: <strong>{formData.firstName} {formData.lastName}</strong> ({formData.phone || ''})
                    </p>
                  </div>
                )}

                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Search by phone to find existing patients
                </p>
              </div>
            )}

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
