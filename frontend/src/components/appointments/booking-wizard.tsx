"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const steps = [
  { id: 1, name: "Select Branch" },
  { id: 2, name: "Select Service" },
  { id: 3, name: "Select Doctor" },
  { id: 4, name: "Select Date & Time" },
  { id: 5, name: "Confirm" },
];

export function BookingWizard() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    reset,
  } = useAppointmentStore();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [branchesRes, servicesRes] = await Promise.all([
          branchesApi.getAll(),
          servicesApi.getAll(),
        ]);

        console.log("[Booking] Raw branchesRes:", branchesRes);
        console.log("[Booking] Raw branchesRes.data:", branchesRes.data);

        // The API returns { data: [...], meta: {...} }
        // axios adds another .data wrapper, so we access branchesRes.data.data
        const branchesList = extractList(branchesRes);
        console.log("[Booking] Final branchesList:", branchesList);

        const servicesList = extractList(servicesRes);
        console.log("[Booking] Final servicesList:", servicesList);

        setBranches(Array.isArray(branchesList) ? branchesList : []);
        setServices(Array.isArray(servicesList) ? servicesList : []);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        addToast("Failed to load initial data", "error");
        setBranches([]);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setBranches, setServices, setLoading, addToast]);

  // Load doctors when branch is selected
  useEffect(() => {
    if (selectedBranch) {
      const loadDoctors = async () => {
        setLoading(true);
        try {
          const res = await doctorsApi.getAll({ branchId: selectedBranch.id });

          console.log("[Booking] Raw doctorsRes:", res);
          console.log("[Booking] Raw doctorsRes.data:", res.data);

          const doctorsList = extractList(res);
          console.log("[Booking] Final doctorsList:", doctorsList);

          setDoctors(Array.isArray(doctorsList) ? doctorsList : []);
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
  }, [selectedBranch, setDoctors, setLoading, addToast]);

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedService) {
      const loadSlots = async () => {
        setLoading(true);
        try {
          const dateStr = selectedDate.toISOString().split("T")[0];
          const res = await doctorsApi.getAvailableSlots(
            selectedDoctor.id,
            dateStr,
            selectedService.id,
          );
          // Handle slots response - API may return array or { data: [...], meta: {...} }
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
  }, [
    selectedDoctor,
    selectedDate,
    selectedService,
    setAvailableSlots,
    setLoading,
    addToast,
  ]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
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
      await appointmentsApi.create({
        branchId: selectedBranch.id,
        doctorId: selectedDoctor.id,
        serviceId: selectedService.id,
        appointmentDate: selectedDate.toISOString().split("T")[0],
        startTime: selectedSlot.startTime,
        notes,
      });

      addToast("Appointment booked successfully!", "success");
      reset();
      router.push("/appointments");
    } catch (error: any) {
      addToast(
        error.response?.data?.message || "Failed to book appointment",
        "error",
      );
    } finally {
      setIsSubmitting(false);
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
          <StepBranch branches={branches} isLoading={isLoading} />
        )}
        {currentStep === 2 && (
          <StepService services={services} isLoading={isLoading} />
        )}
        {currentStep === 3 && (
          <StepDoctor doctors={doctors} isLoading={isLoading} />
        )}
        {currentStep === 4 && (
          <StepDateTime availableSlots={availableSlots} isLoading={isLoading} />
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
          <Button onClick={handleNext} disabled={!canProceed() || isLoading}>
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Confirm Booking
          </Button>
        )}
      </div>
    </div>
  );
}
