import { BookingWizard } from '@/components/appointments/booking-wizard';

export default function BookAppointmentPage() {
  return (
    <div className="container-app py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-text-navy">Book an Appointment</h1>
        <p className="text-text-gray mt-2">
          Schedule your dental appointment in just a few simple steps
        </p>
      </div>

      <BookingWizard />
    </div>
  );
}
