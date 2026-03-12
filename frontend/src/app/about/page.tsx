'use client';

import { MapPin, Phone, Mail, Clock, Star, Award, Heart, Shield, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
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
            <p className="text-gray-600">Find us at 5 convenient locations across Yangon</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'South Okkalapa', address: 'No. 123, Main Road, South Okkalapa' },
              { name: 'Downtown', address: 'No. 456, Sule Pagoda Road, Downtown' },
              { name: 'Hlaing', address: 'No. 789, Hlaing Township' },
            ].map((branch, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#00BCD4] mt-1" />
                  <div>
                    <h4 className="font-bold text-[#1A2332]">{branch.name}</h4>
                    <p className="text-sm text-gray-600">{branch.address}</p>
                  </div>
                </div>
              </div>
            ))}
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
