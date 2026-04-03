"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { useAppointmentStore, useAuthStore, useUIStore } from "@/stores";
import {
  branchesApi,
  servicesApi,
  doctorsApi,
  appointmentsApi,
} from "@/lib/api";
import StepBranch from "./booking-wizard/step-branch";
import StepService from "./booking-wizard/step-service";
import StepDoctor from "./booking-wizard/step-doctor";
import StepDateTime from "./booking-wizard/step-datetime";
import StepConfirm from "./booking-wizard/step-confirm";
import LoginModal from "../auth/login-modal";

const steps = [
  { id: 1, name: "Select Branch" },
  { id: 2, name: "Select Service" },
  { id: 3, name: "Select Doctor" },
  { id: 4, name: "Select Date & Time" },
  { id: 5, name: "Confirm" },
];

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useUIStore();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(false);

  const extractList = (response: any) => {
    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      if (Array.isArray(data.data)) return data.data;
      if (data.data && Array.isArray(data.data.data)) return data.data.data;
    }
    return [];
  };

  const {
    selectedBranch,
    selectedService,
    selectedDoctor,
    selectedDate,
    selectedSlot,
    notes,
    branches,
    services,
    doctors,
    availableSlots,
    isLoading,
    setBranches,
    setServices,
    setDoctors,
    setAvailableSlots,
    setLoading,
    setBranch,
    setService,
    setDoctor,
    setDate,
    setSlot,
    reset,
  } = useAppointmentStore();

  // Helper to update URL params
  const updateUrlParams = useCallback((params: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    router.replace(url.toString(), { scroll: false });
  }, [router]);

  // Load branches, services, and set URL params
  useEffect(() => {
    console.log('[Booking] ===== LOAD INITIAL DATA =====');
    
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get("branch");
    const serviceId = urlParams.get("service");
    const doctorId = urlParams.get("doctor");
    const dateStr = urlParams.get("date");
    const time = urlParams.get("time");
    const step = urlParams.get("step");

    console.log('[Booking] URL PARAMS:', { branchId, serviceId, doctorId, dateStr, time, step });

    if (step) {
      setCurrentStep(parseInt(step, 10));
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [branchesRes, servicesRes] = await Promise.all([
          branchesApi.getAll(),
          servicesApi.getAll(),
        ]);

        const branchesList = extractList(branchesRes);
        const servicesList = extractList(servicesRes);

        console.log('[Booking] Branches:', branchesList.length, 'Services:', servicesList.length);

        setBranches(branchesList);
        setServices(servicesList);

        // Set branch from URL
        if (branchId) {
          const branch = branchesList.find((b: any) => b.id === branchId);
          if (branch) {
            console.log('[Booking] ✓ Branch found:', branch.name);
            setBranch(branch);
          }
        }

        // Set service from URL
        if (serviceId) {
          const service = servicesList.find((s: any) => s.id === serviceId);
          if (service) {
            console.log('[Booking] ✓ Service found:', service.name);
            setService(service);
          }
        }

        // Set date from URL
        if (dateStr) {
          const date = new Date(dateStr + 'T00:00:00');
          console.log('[Booking] Parsing date:', dateStr, '→', date, 'isValid:', !isNaN(date.getTime()));
          if (!isNaN(date.getTime())) {
            console.log('[Booking] ✓ Setting date:', date);
            setDate(date);
          }
        }

        console.log('[Booking] Initial data load complete');
      } catch (error) {
        console.error('[Booking] Failed to load data:', error);
        addToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load doctors when branch is selected
  useEffect(() => {
    console.log('[Booking] ===== DOCTORS EFFECT =====');
    console.log('[Booking] selectedBranch:', selectedBranch?.name, selectedBranch?.id);
    
    if (selectedBranch) {
      const loadDoctors = async () => {
        setLoading(true);
        console.log('[Booking] Loading doctors for branch:', selectedBranch.id);
        
        // Get doctorId from URL using window.location
        const urlParams = new URLSearchParams(window.location.search);
        const doctorId = urlParams.get("doctor");
        console.log('[Booking] Doctor ID from URL:', doctorId);
        
        try {
          const res = await doctorsApi.getAll({ branchId: selectedBranch.id });
          const doctorsList = extractList(res);
          console.log('[Booking] Doctors loaded:', doctorsList.length);
          setDoctors(Array.isArray(doctorsList) ? doctorsList : []);

          // Check if doctor is in URL
          if (doctorId) {
            const doctor = doctorsList.find((d: any) => d.id === doctorId);
            if (doctor) {
              console.log('[Booking] ✓ Setting doctor from URL:', doctor.firstName, doctor.lastName);
              setDoctor(doctor);
            } else {
              console.log('[Booking] ✗ Doctor not found for ID:', doctorId);
            }
          } else {
            console.log('[Booking] No doctor ID in URL');
          }
        } catch (error) {
          console.error("Failed to load doctors:", error);
          addToast("Failed to load doctors", "error");
          setDoctors([]);
        } finally {
          setLoading(false);
        }
      };

      loadDoctors();
    }
  }, [selectedBranch]);

  // Load available slots when date is selected
  useEffect(() => {
    console.log('[Booking] ===== SLOTS EFFECT =====');
    console.log('[Booking] selectedDoctor:', selectedDoctor?.firstName, selectedDoctor?.id);
    console.log('[Booking] selectedDate:', selectedDate);
    console.log('[Booking] selectedService:', selectedService?.name, selectedService?.id);
    
    if (selectedDoctor && selectedDate && selectedService) {
      const loadSlots = async () => {
        setLoading(true);
        try {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          console.log('[Booking] Loading slots for:', { 
            doctorId: selectedDoctor.id, 
            date: dateStr, 
            serviceId: selectedService.id 
          });
          
          const res = await doctorsApi.getAvailableSlots(
            selectedDoctor.id,
            dateStr,
            selectedService.id,
          );
          
          let slotsData: any = res.data;
          if (
            slotsData &&
            typeof slotsData === "object" &&
            "data" in slotsData &&
            !Array.isArray(slotsData)
          ) {
            slotsData = slotsData.data;
          }
          
          console.log('[Booking] Slots loaded:', slotsData.length, 'slots');
          console.log('[Booking] Slot times:', slotsData.map((s: any) => s.startTime));
          
          setAvailableSlots(Array.isArray(slotsData) ? slotsData : []);

          // Get time from URL using window.location
          const urlParams = new URLSearchParams(window.location.search);
          const timeFromUrl = urlParams.get("time");
          console.log('[Booking] Time from URL:', timeFromUrl);
          
          if (timeFromUrl) {
            // Decode the time if needed (URL encoding)
            const decodedTime = decodeURIComponent(timeFromUrl);
            console.log('[Booking] Decoded time:', decodedTime);
            
            const slot = slotsData.find((s: any) => s.startTime === decodedTime);
            if (slot) {
              console.log('[Booking] ✓ Setting slot from URL:', slot);
              setSlot(slot);  // Use the hook function
            } else {
              console.log('[Booking] ✗ Slot not found for time:', decodedTime);
            }
          } else {
            console.log('[Booking] No time in URL');
          }
        } catch (error) {
          console.error("Failed to load available slots:", error);
          addToast("Failed to load available slots", "error");
          setAvailableSlots([]);
        } finally {
          setLoading(false);
        }
      };

      loadSlots();
    }
  }, [selectedDoctor, selectedDate, selectedService, searchParams]);

  // Handle step change and update URL
  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    updateUrlParams({ step: newStep.toString() });
  };

  // Handle branch selection and update URL
  const handleBranchSelect = (branch: any) => {
    useAppointmentStore.getState().setBranch(branch);
    updateUrlParams({ 
      branch: branch?.id || null,
      doctor: null,
      service: null,
      date: null,
      time: null,
      step: '2'
    });
    setCurrentStep(2);
  };

  // Handle service selection and update URL
  const handleServiceSelect = (service: any) => {
    useAppointmentStore.getState().setService(service);
    updateUrlParams({ 
      service: service?.id || null,
      doctor: null,
      date: null,
      time: null,
      step: '3'
    });
    setCurrentStep(3);
  };

  // Handle doctor selection and update URL
  const handleDoctorSelect = (doctor: any) => {
    useAppointmentStore.getState().setDoctor(doctor);
    updateUrlParams({ 
      doctor: doctor?.id || null,
      date: null,
      time: null,
      step: '4'
    });
    setCurrentStep(4);
  };

  // Handle date/time selection and update URL
  const handleDateSelect = (date: Date | null, slot: any = null) => {
    useAppointmentStore.getState().setDate(date);
    if (slot) {
      useAppointmentStore.getState().setSlot(slot);
    }
    
    let dateStr = null;
    let timeStr = null;
    
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    
    if (slot) {
      timeStr = slot.startTime;
    }
    
    updateUrlParams({ 
      date: dateStr,
      time: timeStr,
      step: slot ? '5' : null
    });
    
    if (slot) {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    } else {
      // On step 1, redirect to home
      router.push('/');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      // Show login modal instead of submitting
      setPendingBooking(true);
      setShowLoginModal(true);
      return;
    }

    if (
      !selectedBranch ||
      !selectedService ||
      !selectedDoctor ||
      !selectedDate ||
      !selectedSlot
    ) {
      addToast("Please complete all steps", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await appointmentsApi.create({
        branchId: selectedBranch.id,
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        appointmentDate: dateStr,
        startTime: selectedSlot.startTime,
        notes,
      });

      // Get calendar status from response
      const calendarEventCreated = response.data?.calendarEventCreated;
      const calendarError = response.data?.calendarError;

      // Main success toast
      addToast("Appointment booked successfully!", "success");

      // Handle calendar event creation status
      if (calendarEventCreated === true) {
        // Calendar event created successfully with reminder
        addToast("Google Calendar event created with 1-hour reminder!", "success");
      } else if (calendarEventCreated === 'sync_disabled') {
        // Calendar connected but sync is disabled
        addToast("Connect Google Calendar in your profile to get appointment reminders!", "info");
      } else if (calendarEventCreated === 'not_connected') {
        // Calendar not connected
        addToast("Link Google Calendar in your profile to get appointment reminders!", "info");
      } else if (calendarEventCreated === false || calendarError) {
        // Failed to create calendar event
        addToast("Failed to create Google Calendar event. You can still view your appointment in the app.", "warning");
      }

      reset();
      // Clear URL params
      router.replace("/book");
      router.push("/medical-history");
    } catch (error: any) {
      addToast(
        error.response?.data?.message || "Failed to book appointment",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    checkAuth();
    // Retry booking after login
    if (pendingBooking) {
      handleSubmit();
      setPendingBooking(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!selectedBranch;
      case 2:
        return !!selectedService;
      case 3:
        return !!selectedDoctor;
      case 4:
        return !!selectedDate && !!selectedSlot;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className='max-w-4xl mx-auto'>
      {/* Progress Steps */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          {steps.map((step, index) => (
            <div key={step.id} className='flex items-center'>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step.id <= currentStep
                    ? "bg-primary-cyan text-white"
                    : "bg-gray-200 text-text-gray"
                }`}
              >
                {step.id}
              </div>
              <span
                className={`ml-2 text-sm font-medium hidden md:block ${
                  step.id <= currentStep ? "text-text-navy" : "text-text-light"
                }`}
              >
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 md:w-24 h-1 mx-2 md:mx-4 ${
                    step.id < currentStep ? "bg-primary-cyan" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className='min-h-[400px]'>
        {currentStep === 1 && (
          <StepBranch 
            branches={branches} 
            isLoading={isLoading} 
            onSelect={handleBranchSelect}
            selectedId={selectedBranch?.id}
          />
        )}
        {currentStep === 2 && (
          <StepService 
            services={services} 
            isLoading={isLoading}
            onSelect={handleServiceSelect}
            selectedId={selectedService?.id}
          />
        )}
        {currentStep === 3 && (
          <StepDoctor 
            doctors={doctors} 
            isLoading={isLoading}
            onSelect={handleDoctorSelect}
            selectedId={selectedDoctor?.id}
          />
        )}
        {currentStep === 4 && (
          <StepDateTime 
            availableSlots={availableSlots} 
            isLoading={isLoading}
            onSelect={handleDateSelect}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
          />
        )}
        {currentStep === 5 && (
          <StepConfirm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className='flex justify-between mt-6'>
        <Button
          variant='outline'
          onClick={handleBack}
        >
          {currentStep === 1 ? 'Back to Home' : 'Back'}
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={() => handleStepChange(currentStep + 1)} disabled={!canProceed() || isLoading}>
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isAuthenticated ? "Confirm Booking" : "Login to Book"}
          </Button>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingBooking(false);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
