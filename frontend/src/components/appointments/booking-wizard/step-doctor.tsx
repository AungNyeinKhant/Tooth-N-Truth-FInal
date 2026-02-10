'use client';

import { useAppointmentStore } from '@/stores';
import { Card } from '@/components/ui';
import { User } from 'lucide-react';

interface StepDoctorProps {
  doctors: Array<{
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    bio?: string;
  }>;
  isLoading: boolean;
}

export default function StepDoctor({ doctors, isLoading }: StepDoctorProps) {
  const { selectedDoctor, setDoctor } = useAppointmentStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-text-gray">No doctors available at this branch</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-navy mb-6">Select a Doctor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doctor) => (
          <Card
            key={doctor.id}
            hover
            className={`cursor-pointer transition-all ${
              selectedDoctor?.id === doctor.id
                ? 'ring-2 ring-primary-cyan border-primary-cyan'
                : ''
            }`}
            onClick={() => setDoctor(doctor)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-cyan/10 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-primary-cyan" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-navy">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-sm text-primary-cyan font-medium mb-1">
                  {doctor.specialization}
                </p>
                {doctor.bio && (
                  <p className="text-sm text-text-gray line-clamp-2">{doctor.bio}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
