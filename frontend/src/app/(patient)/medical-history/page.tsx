"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { appointmentsApi, PatientAppointment } from "@/lib/api/appointments.api";
import { useAuthStore, useUIStore } from "@/stores";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Stethoscope, 
  CheckCircle, 
  XCircle, 
  X,
  Loader2,
  Filter
} from "lucide-react";

export default function MedicalHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await appointmentsApi.getMyAppointments();
      console.log('[MedicalHistory] API Response:', response);
      console.log('[MedicalHistory] Response data:', response.data);
      console.log('[MedicalHistory] Response data data:', response.data?.data);
      
      let data = response.data?.data || response.data || [];
      console.log('[MedicalHistory] Appointments:', data);
      
      // Filter by status if selected
      if (statusFilter) {
        data = data.filter((apt: PatientAppointment) => apt.status === statusFilter);
      }
      
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      addToast("Failed to load medical records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClick = (appointment: PatientAppointment) => {
    setSelectedAppointment(appointment);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    setIsCancelling(true);
    try {
      await appointmentsApi.cancel(selectedAppointment.id, cancelReason || "Cancelled by patient");
      addToast("Appointment cancelled successfully", "success");
      setShowCancelModal(false);
      fetchAppointments();
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to cancel appointment", "error");
    } finally {
      setIsCancelling(false);
    }
  };

  // Check if appointment can be cancelled (at least 1 hour before)
  const canCancel = (appointment: PatientAppointment) => {
    if (appointment.status !== 'CONFIRMED') return false;
    if (!appointment.appointmentDate || !appointment.startTime) return false;
    
    // Parse date - handle both ISO format and YYYY-MM-DD
    const dateOnly = appointment.appointmentDate.split('T')[0];
    const dateParts = dateOnly.split('-').map(Number);
    const timeParts = appointment.startTime.split(':').map(Number);
    
    if (dateParts.some(isNaN) || timeParts.some(isNaN)) return false;
    
    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    
    if (isNaN(appointmentDateTime.getTime())) return false;
    
    const now = new Date();
    const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntil >= 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date properly in local timezone
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== 'string') {
      return 'No Date';
    }
    
    // Handle ISO format or YYYY-MM-DD format
    const dateOnly = dateStr.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return 'Invalid Date';
    }
    
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusTabs = [
    { key: "", label: "All" },
    { key: "CONFIRMED", label: "Ongoing" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  // Separate upcoming and past appointments based on filter
  const getFilteredAppointments = () => {
    if (statusFilter === 'CONFIRMED') {
      return appointments.filter(apt => apt.status === 'CONFIRMED');
    } else if (statusFilter === 'COMPLETED') {
      return appointments.filter(apt => apt.status === 'COMPLETED');
    } else if (statusFilter === 'CANCELLED') {
      return appointments.filter(apt => apt.status === 'CANCELLED');
    }
    return appointments;
  };

  const filteredAppointments = getFilteredAppointments();
  
  // Separate ongoing and past for display
  const ongoingAppointments = filteredAppointments.filter(apt => apt.status === 'CONFIRMED');
  const pastAppointments = filteredAppointments.filter(apt => apt.status !== 'CONFIRMED');

  return (
    <div className="container-app py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with border */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-sm text-gray-500">Your appointment history</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 p-1 bg-white rounded-lg border border-gray-200 w-fit mb-6">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                statusFilter === tab.key
                  ? "bg-[#00BCD4] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No medical records
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Your appointment history will appear here
          </p>
          <button
            onClick={() => router.push('/book')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BCD4] rounded-lg text-sm font-medium text-white hover:bg-[#00A5BA] transition-colors"
          >
            Book Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ongoing/Confirmed Appointments */}
          {ongoingAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {statusFilter === 'CONFIRMED' ? 'Ongoing Appointments' : 'Ongoing'}
              </h2>
              <div className="space-y-4">
                {ongoingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left side - Date & Time */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-cyan-100 rounded-lg">
                          <Calendar className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatDate(apt.appointmentDate)}
                          </p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.startTime} - {apt.endTime}
                          </p>
                        </div>
                      </div>

                      {/* Right side - Status */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                        {canCancel(apt) && (
                          <button
                            onClick={() => handleCancelClick(apt)}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {!canCancel(apt) && apt.status === 'CONFIRMED' && (
                          <span className="text-xs text-gray-400">
                            (Less than 1 hour to appointment)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Doctor */}
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{apt.doctor.specialization}</p>
                        </div>
                      </div>

                      {/* Service */}
                      <div className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Service</p>
                          <p className="text-sm font-medium text-gray-900">{apt.service.name}</p>
                          <p className="text-xs text-gray-500">{apt.service.duration} minutes</p>
                        </div>
                      </div>

                      {/* Branch */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Branch</p>
                          <p className="text-sm font-medium text-gray-900">{apt.branch.name}</p>
                          <p className="text-xs text-gray-500">{apt.branch.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {apt.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm text-gray-700">{apt.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {statusFilter === 'COMPLETED' ? 'Completed Appointments' : 
                 statusFilter === 'CANCELLED' ? 'Cancelled Appointments' : 
                 'Past Appointments'}
              </h2>
              <div className="space-y-4">
                {pastAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 opacity-90"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left side - Date & Time */}
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          apt.status === 'COMPLETED' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {apt.status === 'COMPLETED' ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatDate(apt.appointmentDate)}
                          </p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.startTime} - {apt.endTime}
                          </p>
                        </div>
                      </div>

                      {/* Right side - Status */}
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(apt.status)}`}>
                        {apt.status === 'COMPLETED' ? 'Completed' : 
                         apt.status === 'CANCELLED' ? 'Cancelled' : apt.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Doctor */}
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="text-sm font-medium text-gray-900">
                            Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{apt.doctor.specialization}</p>
                        </div>
                      </div>

                      {/* Service */}
                      <div className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Service</p>
                          <p className="text-sm font-medium text-gray-900">{apt.service.name}</p>
                          <p className="text-xs text-gray-500">{apt.service.duration} minutes</p>
                        </div>
                      </div>

                      {/* Branch */}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Branch</p>
                          <p className="text-sm font-medium text-gray-900">{apt.branch.name}</p>
                          <p className="text-xs text-gray-500">{apt.branch.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Cancel Reason */}
                    {apt.cancelReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-500">Cancellation Reason</p>
                        <p className="text-sm text-red-700">{apt.cancelReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowCancelModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Cancel Appointment</h2>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Are you sure you want to cancel this appointment?
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {formatDate(selectedAppointment.appointmentDate)} at {selectedAppointment.startTime}
                </p>
                <p className="text-sm text-gray-600">
                  Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for cancellation (optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BCD4] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    "Cancel Appointment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
