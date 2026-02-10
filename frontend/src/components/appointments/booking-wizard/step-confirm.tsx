'use client';

import { useAppointmentStore } from '@/stores';
import { Input } from '@/components/ui';
import { MapPin, User, Clock, Calendar, StickyNote } from 'lucide-react';

interface StepConfirmProps {
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function StepConfirm({ onSubmit, isSubmitting }: StepConfirmProps) {
  const {
    selectedBranch,
    selectedService,
    selectedDoctor,
    selectedDate,
    selectedSlot,
    notes,
    setNotes,
  } = useAppointmentStore();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-navy mb-6">Confirm Your Appointment</h2>

      <div className="space-y-6">
        {/* Branch */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <MapPin className="w-5 h-5 text-primary-cyan mt-0.5" />
          <div>
            <p className="text-sm text-text-light">Branch</p>
            <p className="font-semibold text-text-navy">{selectedBranch?.name}</p>
            <p className="text-sm text-text-gray">{selectedBranch?.address}</p>
          </div>
        </div>

        {/* Service */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-primary-cyan mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-text-light">Service</p>
            <p className="font-semibold text-text-navy">{selectedService?.name}</p>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-text-gray">{selectedService?.duration} minutes</p>
              <p className="font-semibold text-primary-cyan">
                {selectedService?.price.toLocaleString()} MMK
              </p>
            </div>
          </div>
        </div>

        {/* Doctor */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <User className="w-5 h-5 text-primary-cyan mt-0.5" />
          <div>
            <p className="text-sm text-text-light">Doctor</p>
            <p className="font-semibold text-text-navy">
              Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}
            </p>
            <p className="text-sm text-primary-cyan">{selectedDoctor?.specialization}</p>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-primary-cyan mt-0.5" />
          <div>
            <p className="text-sm text-text-light">Date & Time</p>
            <p className="font-semibold text-text-navy">
              {selectedDate && formatDate(selectedDate)}
            </p>
            <p className="text-lg font-bold text-primary-cyan">
              {selectedSlot?.startTime} - {selectedSlot?.endTime}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="flex items-start gap-4">
          <StickyNote className="w-5 h-5 text-primary-cyan mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-text-light mb-2">Additional Notes (Optional)</p>
            <Input
              as="textarea"
              rows={3}
              placeholder="Any special requests or concerns..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
