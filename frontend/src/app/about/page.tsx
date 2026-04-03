'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Star, Award, Heart, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { branchesApi } from '@/lib/api';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  isActive: boolean;
}

export default function AboutPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchesApi.getAll({ status: 'active', limit: 100 });
        
        // Extract branches from response
        const responseData = response.data as any;
        let branchesData: Branch[] = [];
        
        // Try multiple extraction patterns
        if (Array.isArray(responseData)) {
          branchesData = responseData;
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          branchesData = responseData.data;
        } else if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
          branchesData = responseData.data.data;
        } else if (responseData?.branches && Array.isArray(responseData.branches)) {
          branchesData = responseData.branches;
        }
        
        // Filter active branches (keep if isActive is true or undefined)
        const activeBranches = branchesData.filter((b: any) => b.isActive !== false);
        
        setBranches(activeBranches);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-[#1A2332] to-[#2A3A4A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About <span className="text-[#00BCD4]">Tooth & Truth</span> Dental Clinic
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your trusted partner in dental care since 2015. We believe in honest, 
              transparent, and compassionate dental services for the whole family.
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

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-[#00BCD4]/10 flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-[#00BCD4]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2332] mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide exceptional dental care that puts patients first. We are committed to 
                delivering honest diagnoses, transparent pricing, and personalized treatment 
                plans that ensure every patient leaves with a confident smile.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-14 h-14 rounded-full bg-[#FF6B35]/10 flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-[#FF6B35]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1A2332] mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be the most trusted dental care provider in Myanmar, known for our 
                commitment to quality, integrity, and creating beautiful smiles that last a lifetime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Why Choose Tooth & Truth?</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We combine expertise with empathy to deliver dental care that exceeds expectations.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Certified Experts', desc: 'Board-certified dentists with years of experience', color: '#00BCD4' },
              { icon: Users, title: 'Patient-Centered', desc: 'Tailored treatment plans for your unique needs', color: '#FF6B35' },
              { icon: Star, title: '4.9★ Rating', desc: 'Trusted by thousands of happy patients', color: '#00BCD4' },
              { icon: Clock, title: 'Flexible Hours', desc: 'Convenient appointments including weekends', color: '#FF6B35' },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md text-center">
                <div 
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <h4 className="font-bold text-[#1A2332] mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Our Core Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#00BCD4] mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">H</span>
              </div>
              <h4 className="text-xl font-bold text-[#1A2332] mb-2">Honesty</h4>
              <p className="text-gray-600">
                We provide transparent diagnoses and explain every treatment option clearly, 
                so you can make informed decisions about your dental health.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#FF6B35] mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">E</span>
              </div>
              <h4 className="text-xl font-bold text-[#1A2332] mb-2">Excellence</h4>
              <p className="text-gray-600">
                We use the latest technology and follow international standards to deliver 
                exceptional dental care that stands the test of time.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#00BCD4] mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">C</span>
              </div>
              <h4 className="text-xl font-bold text-[#1A2332] mb-2">Compassion</h4>
              <p className="text-gray-600">
                We understand dental anxiety and create a warm, welcoming environment 
                where every patient feels comfortable and cared for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A2332] mb-4">Our Locations</h2>
            {isLoading ? (
              <p className="text-gray-600">Loading locations...</p>
            ) : (
              <p className="text-gray-600">
                Find us at {branches.length} convenient {branches.length === 1 ? 'location' : 'locations'} across Yangon
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              [1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-md animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : branches.length > 0 ? (
              branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#00BCD4] mt-1" />
                    <div>
                      <h4 className="font-bold text-[#1A2332]">{branch.name}</h4>
                      <p className="text-sm text-gray-600">{branch.address}</p>
                      {branch.phone && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{branch.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No locations available at the moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience Quality Dental Care?</h2>
          <p className="text-white/90 mb-8 text-lg">
            Book your appointment today and let us take care of your smile!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/book">
              <button className="bg-white text-[#1A2332] font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Book Appointment
              </button>
            </Link>
            <Link href="/services">
              <button className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white/10 transition-all">
                Our Services
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
