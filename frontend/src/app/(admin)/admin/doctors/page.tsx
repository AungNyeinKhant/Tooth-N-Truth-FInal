export default function DoctorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">Manage healthcare professionals</p>
        </div>
        <a
          href="/admin/doctors/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00BCD4] px-4 py-2 text-sm font-medium text-white hover:bg-[#00ACC1] transition-colors"
        >
          Add Doctor
        </a>
      </div>

      <div className="rounded-xl bg-white p-12 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">Doctor management coming in Phase 2.11</p>
      </div>
    </div>
  );
}
