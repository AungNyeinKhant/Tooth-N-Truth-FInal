'use client';

import { useAppointmentStore } from '@/stores';
import { Card } from '@/components/ui';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface StepDateTimeProps {
  availableSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
  isLoading: boolean;
}

export default function StepDateTime({ availableSlots, isLoading }: StepDateTimeProps) {
  const { selectedDate, selectedSlot, setDate, setSlot } = useAppointmentStore();

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-cyan"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-navy mb-6">Select Date & Time</h2>

      {/* Date Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-text-navy mb-4 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Available Dates
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {availableDates.map((date, index) => (
            <button
              key={index}
              onClick={() => setDate(date)}
              className={`p-3 rounded-lg text-center transition-all ${
                isSelectedDate(date)
                  ? 'bg-primary-cyan text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-text-navy'
              }`}
            >
              <div className="text-xs uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg font-bold">{date.getDate()}</div>
              <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold text-text-navy mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Available Times for {formatDate(selectedDate)}
          </h3>

          {availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-text-gray">No available slots for this date</p>
              <p className="text-sm text-text-light mt-1">Please select another date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => setSlot(slot)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedSlot?.startTime === slot.startTime
                      ? 'bg-primary-cyan text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-text-navy'
                  }`}
                >
                  <div className="text-sm font-semibold">{slot.startTime}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="text-center py-8 text-text-gray">
          Please select a date to see available time slots
        </div>
      )}
    </div>
  );
}
