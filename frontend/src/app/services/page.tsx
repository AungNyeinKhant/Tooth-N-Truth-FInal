'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { servicesApi, Service } from '@/lib/api/services.api';
import { Clock, DollarSign, CheckCircle, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await servicesApi.getAll({ status: 'active' });
        // Handle the response - could be { data: [...], meta: {...} } or just [...]
        const responseData = response.data as any;
        const data = responseData.data?.data || responseData.data || responseData;
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load services:', error);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Static facilities data
  const facilities = [
    { name: 'Digital X-Ray', desc: 'Low radiation, instant results' },
    { name: 'Sterile Environment', desc: 'International hygiene standards' },
    { name: 'Modern Equipment', desc: 'Latest dental technology' },
    { name: 'Comfortable Chairs', desc: 'Patient comfort prioritized' },
    { name: 'Kids Corner', desc: 'Friendly environment for children' },
    { name: 'Parking Available', desc: 'Easy access for all patients' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#1A2332] to-[#2A3A4A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="text-[#00BCD4]">Services</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive dental care for the whole family. From routine checkups 
              to advanced procedures, we've got you covered.
            </p>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Dental Services We Offer</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Our experienced team provides a wide range of dental treatments 
              using modern techniques and quality materials.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00BCD4]"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div 
                  key={service.id} 
                  className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border border-gray-100 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#00BCD4]/10 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-[#00BCD4]" />
                    </div>
                    <span className="text-2xl font-bold text-[#FF6B35]">
                      {service.price.toLocaleString()} MMK
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-[#1A2332] mb-2 group-hover:text-[#00BCD4] transition-colors">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description || 'Professional dental service with quality care.'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} minutes</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No services available at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* Facilities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Our Facilities</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We invest in modern technology and comfortable amenities to ensure 
              your visit is as pleasant as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {facilities.map((facility, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-md flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1A2332] mb-1">{facility.name}</h4>
                  <p className="text-sm text-gray-600">{facility.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Transparency */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gradient-to-r from-[#00BCD4] to-[#0097A7] rounded-2xl p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Transparent Pricing</h2>
              <p className="text-white/90 mb-6">
                No hidden fees. No surprise bills. We believe in complete 
                transparency so you know exactly what to expect.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Free initial consultation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Detailed treatment plans with costs</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span>Multiple payment options available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Ready to Book Your Appointment?</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Take the first step towards a healthier smile. Our team is ready to welcome you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book">
              <button className="bg-[#FF6B35] hover:bg-[#e85e2a] text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                Book Now <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/about">
              <button className="border-2 border-[#00BCD4] text-[#00BCD4] font-semibold px-8 py-3 rounded-full hover:bg-[#00BCD4] hover:text-white transition-all">
                Learn More About Us
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
