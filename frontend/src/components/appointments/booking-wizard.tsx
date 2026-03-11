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

  // Load state from URL params on mount
  useEffect(() => {
    const branchId = searchParams.get("branch");
    const serviceId = searchParams.get("service");
    const doctorId = searchParams.get("doctor");
    const dateStr = searchParams.get("date");
    const time = searchParams.get("time");
    const step = searchParams.get("step");

    if (step) {
      setCurrentStep(parseInt(step, 10));
    }

    // Load initial data first
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [branchesRes, servicesRes] = await Promise.all([
          branchesApi.getAll(),
          servicesApi.getAll(),
        ]);

        const branchesList = extractList(branchesRes);
        const servicesList = extractList(servicesRes);

        setBranches(Array.isArray(branchesList) ? branchesList : []);
        setServices(Array.isArray(servicesList) ? servicesList : []);

        // Find and set branch from URL
        if (branchId) {
          const branch = branchesList.find((b: any) => b.id === branchId);
          if (branch) {
            console.log('[Booking] Setting branch from URL:', branch);
            setBranch(branch);
          }
        }

        // Find and set service from URL
        if (serviceId) {
          const service = servicesList.find((s: any) => s.id === serviceId);
          if (service) {
            console.log('[Booking] Setting service from URL:', service);
            setService(service);
          }
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        addToast("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load doctors when branch is selected (from URL or store)
  useEffect(() => {
    console.log('[Booking] selectedBranch changed:', selectedBranch);
    if (selectedBranch) {
      const loadDoctors = async () => {
        setLoading(true);
        console.log('[Booking] Loading doctors for branch:', selectedBranch.id);
        try {
          const res = await doctorsApi.getAll({ branchId: selectedBranch.id });
          console.log('[Booking] Doctors API response:', res.data);
          const doctorsList = extractList(res);
          console.log('[Booking] Extracted doctors list:', doctorsList);
          setDoctors(Array.isArray(doctorsList) ? doctorsList : []);

          // Check if doctor is in URL
          const doctorId = searchParams.get("doctor");
          if (doctorId) {
            const doctor = doctorsList.find((d: any) => d.id === doctorId);
            if (doctor) {
              console.log('[Booking] Setting doctor from URL:', doctor);
              setDoctor(doctor);
            }
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
    if (selectedDoctor && selectedDate && selectedService) {
      const loadSlots = async () => {
        setLoading(true);
        try {
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
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
          
          setAvailableSlots(Array.isArray(slotsData) ? slotsData : []);

          // Check if time is in URL
          const time = searchParams.get("time");
          if (time) {
            const slot = slotsData.find((s: any) => s.startTime === time);
            if (slot) {
              useAppointmentStore.getState().setSlot(slot);
            }
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
  }, [selectedDoctor, selectedDate, selectedService]);

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
      
      await appointmentsApi.create({
        branchId: selectedBranch.id,
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        appointmentDate: dateStr,
        startTime: selectedSlot.startTime,
        notes,
      });

      addToast("Appointment booked successfully!", "success");
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
          disabled={currentStep === 1}
        >
          Back
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
