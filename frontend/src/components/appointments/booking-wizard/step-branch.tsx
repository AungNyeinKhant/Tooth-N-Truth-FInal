"use client";

import { useAppointmentStore } from "@/stores";
import { MapPin, Phone } from "lucide-react";

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

  // Debug: log what we receive as props
  console.log("[StepBranch] PROPS branches:", branches);
  console.log("[StepBranch] PROPS isLoading:", isLoading);
  console.log("[StepBranch] PROPS branches.length:", branches?.length);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]'></div>
      </div>
    );
  }

  // Debug: if branches is empty, show what's happening
  if (!branches || branches.length === 0) {
    console.log(
      "[StepBranch] branches is empty! Type:",
      typeof branches,
      Array.isArray(branches),
    );
    return (
      <div className='flex flex-col items-center justify-center h-64 text-center'>
        <p className='text-gray-500 mb-2'>No branches available</p>
        <p className='text-sm text-gray-400'>
          branches type: {typeof branches}, isArray: {Array.isArray(branches)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className='text-2xl font-bold text-[#1A2332] mb-6'>
        Select a Branch - {branches.length} found
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {branches.map((branch) => (
          <div
            key={branch.id}
            onClick={() => setBranch(branch)}
            className={`
              bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all
              hover:shadow-lg border-2
              ${
                selectedBranch?.id === branch.id
                  ? "border-[#00BCD4] ring-2 ring-[#00BCD4]"
                  : "border-transparent hover:border-gray-200"
              }
            `}
          >
            <h3 className='text-lg font-semibold text-[#1A2332] mb-2'>
              {branch.name}
            </h3>
            <div className='space-y-2 text-sm text-gray-600'>
              <div className='flex items-start gap-2'>
                <MapPin className='w-4 h-4 mt-0.5 flex-shrink-0' />
                <span>{branch.address}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='w-4 h-4 flex-shrink-0' />
                <span>{branch.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
