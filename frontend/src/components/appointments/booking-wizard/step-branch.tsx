'use client';

import { useAppointmentStore } from '@/stores';
import { Card } from '@/components/ui';
import { MapPin, Phone } from 'lucide-react';

interface StepBranchProps {
  branches: Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
  }>;
  isLoading: boolean;
}

export default function StepBranch({ branches, isLoading }: StepBranchProps) {
  const { selectedBranch, setBranch } = useAppointmentStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-navy mb-6">Select a Branch</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            hover
            className={`cursor-pointer transition-all ${
              selectedBranch?.id === branch.id
                ? 'ring-2 ring-primary-cyan border-primary-cyan'
                : ''
            }`}
            onClick={() => setBranch(branch)}
          >
            <h3 className="text-lg font-semibold text-text-navy mb-2">
              {branch.name}
            </h3>
            <div className="space-y-2 text-sm text-text-gray">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{branch.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{branch.phone}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
