"use client";

import { useAppointmentStore } from "@/stores";
import { Card } from "@/components/ui";
import { Clock } from "lucide-react";

interface StepServiceProps {
  services: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
  }>;
  isLoading: boolean;
}

export default function StepService({ services, isLoading }: StepServiceProps) {
  const { selectedService, setService } = useAppointmentStore();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan'></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className='text-2xl font-bold text-text-navy mb-6'>
        Select a Service
      </h2>
      <div className='grid grid-cols-1 gap-4'>
        {services.map((service) => (
          <Card
            key={service.id}
            hover
            className={`cursor-pointer transition-all ${
              selectedService?.id === service.id
                ? "ring-2 ring-primary-cyan border-primary-cyan"
                : ""
            }`}
            onClick={() => setService(service)}
          >
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='text-lg font-semibold text-text-navy mb-1'>
                  {service.name}
                </h3>
                <p className='text-sm text-text-gray mb-2'>
                  {service.description}
                </p>
                <div className='flex items-center gap-4 text-sm'>
                  <div className='flex items-center gap-1 text-text-gray'>
                    <Clock className='w-4 h-4' />
                    <span>{service.duration} mins</span>
                  </div>
                </div>
              </div>
              <div className='text-right'>
                <span className='text-xl font-bold text-primary-cyan'>
                  {service.price.toLocaleString()} MMK
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
