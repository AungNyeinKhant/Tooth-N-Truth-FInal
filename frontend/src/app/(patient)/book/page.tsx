'use client';

import { BookingWizard } from '@/components/appointments/booking-wizard';

export default function BookAppointmentPage() {
  return (
    <div className="container-app py-8">
      <h1 className="text-3xl font-bold text-text-navy mb-8">Book an Appointment</h1>
      <BookingWizard />
    </div>
  );
}
