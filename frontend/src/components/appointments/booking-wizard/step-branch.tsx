"use client";

import { MapPin, Phone } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface StepBranchProps {
  branches: Branch[];
  isLoading: boolean;
  onSelect: (branch: Branch) => void;
  selectedId?: string;
}

export default function StepBranch({ branches, isLoading, onSelect, selectedId }: StepBranchProps) {
  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]'></div>
      </div>
    );
  }

  if (!branches || branches.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-center'>
        <p className='text-gray-500 mb-2'>No branches available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className='text-2xl font-bold text-[#1A2332] mb-6'>
        Select a Branch
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {branches.map((branch) => (
          <div
            key={branch.id}
            onClick={() => onSelect(branch)}
            className={`
              bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all
              hover:shadow-lg border-2
              ${
                selectedId === branch.id
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
