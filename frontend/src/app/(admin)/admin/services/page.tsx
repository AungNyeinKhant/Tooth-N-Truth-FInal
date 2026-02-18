export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500">Manage dental services</p>
        </div>
        <a
          href="/admin/services/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00BCD4] px-4 py-2 text-sm font-medium text-white hover:bg-[#00ACC1] transition-colors"
        >
          Add Service
        </a>
      </div>

      <div className="rounded-xl bg-white p-12 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500">Service management coming in Phase 2.8</p>
      </div>
    </div>
  );
}
