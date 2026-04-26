'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  Clock, MapPin, Phone, Shield, Star, ArrowRight,
  CheckCircle, Heart, Smile, Award, Users, CalendarCheck
} from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  }, []);

  const bookHref = '/book';

  return (
    <div className="flex flex-col font-sans">

      {/* ══════════════════════════════════════════════
          HERO — dark dental photo, split layout
      ══════════════════════════════════════════════ */}
      <section
        className="relative min-h-[92vh] flex items-center"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(10,22,40,0.92) 55%, rgba(10,22,40,0.45)), url('/hero-dental.jpg?v=1')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20">
          <div className="max-w-xl">
            {/* Pill badge */}
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-[#FF6B35] bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
              Trusted Dental Care · Yangon
            </span>

            <h1 className="text-5xl md:text-[4.5rem] font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Your Smile<br />
              Deserves{' '}
              <span className="text-[#00BCD4]">Honest</span><br />
              <span className="text-[#FF6B35]">Care</span>
            </h1>

            <p className="text-lg text-gray-300 mb-9 leading-relaxed">
              Professional dental services across 5 convenient locations in Yangon —
              where expertise meets warmth.
            </p>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-3 mb-10">
              {['Certified Specialists', 'Same-day Slots', 'Transparent Pricing', '4.9★ Rating'].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-sm text-white/80 bg-white/10 rounded-full px-3 py-1">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00BCD4]" />
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href={bookHref}>
                <button className="group flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e85e2a] text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-[#FF6B35]/30 hover:shadow-[#FF6B35]/50">
                  Book Appointment
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/services">
                <button className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-full transition-all backdrop-blur-sm">
                  Browse Services
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating stats card — bottom right */}
        <div className="absolute bottom-8 right-8 hidden lg:block z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              {[
                { value: '500+', label: 'Happy Patients', color: '#00BCD4' },
                { value: '4.9★', label: 'Patient Rating', color: '#FF6B35' },
                { value: '5',    label: 'Branches',       color: '#00BCD4' },
                { value: '50K+', label: 'Treatments',     color: '#FF6B35' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          STATS BAR — teal + orange pill
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '500+', label: 'Happy Patients',  icon: Users,         color: 'text-[#00BCD4]' },
              { value: '50K+', label: 'Treatments Done', icon: CalendarCheck,  color: 'text-[#FF6B35]' },
              { value: '5',    label: 'Branches',         icon: MapPin,         color: 'text-[#00BCD4]' },
              { value: '4.9/5',label: 'Patient Rating',   icon: Star,           color: 'text-[#FF6B35]' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center text-center gap-2">
                <s.icon className={`w-7 h-7 ${s.color}`} />
                <p className={`text-4xl font-extrabold tracking-tight ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SERVICES — clean cards with orange hover ring
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#FF6B35] text-sm font-bold uppercase tracking-wider">What We Offer</span>
            <h2 className="text-4xl font-extrabold text-[#1A2332] mt-2 mb-3">Our Dental Services</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From routine checkups to cosmetic treatments — comprehensive care all under one roof.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'General Checkup',  icon: Shield,       desc: 'Comprehensive dental examination and oral health screening' },
              { name: 'Dental Cleaning',  icon: Smile,        desc: 'Professional plaque & tartar removal for a fresh clean smile' },
              { name: 'Tooth Extraction', icon: Heart,        desc: 'Pain-free, safe removal when necessary with full aftercare' },
              { name: 'Teeth Whitening',  icon: Award,        desc: 'Cosmetic brightening for a confident, radiant smile' },
            ].map(service => (
              <div
                key={service.name}
                className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-[#FF6B35]/40 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#00BCD4]/10 group-hover:bg-[#FF6B35]/10 flex items-center justify-center mb-5 transition-colors">
                  <service.icon className="w-7 h-7 text-[#00BCD4] group-hover:text-[#FF6B35] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2332] mb-2">{service.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-[#FF6B35] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          WHY US — cyan left panel + orange detail
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — image panel */}
            <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-2xl">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('/hero-dental.jpg?v=1')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              {/* Teal vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00BCD4]/60 via-transparent to-transparent" />
              {/* Orange accent card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4 shadow-lg">
                <div className="w-12 h-12 rounded-full bg-[#FF6B35] flex items-center justify-center shrink-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#1A2332]">Patients Come First</p>
                  <p className="text-sm text-gray-500">Honest care, every single visit.</p>
                </div>
              </div>
            </div>

            {/* Right — content */}
            <div>
              <span className="text-[#FF6B35] text-sm font-bold uppercase tracking-wider">Why Choose Us</span>
              <h2 className="text-4xl font-extrabold text-[#1A2332] mt-2 mb-5 leading-snug">
                Tooth &amp; Truth —<br />
                <span className="text-[#00BCD4]">Expertise</span> with <span className="text-[#FF6B35]">Warmth</span>
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                We believe great dental care is built on honesty, skill, and genuine compassion.
                Every patient deserves to feel heard, comfortable, and confident in their treatment plan.
              </p>
              <div className="space-y-5">
                {[
                  { icon: MapPin,  title: '5 Convenient Locations', desc: 'Strategically placed across Yangon for easy access', color: '#00BCD4' },
                  { icon: Clock,   title: 'Flexible Hours',          desc: 'Monday – Friday · 9 AM–5 PM, walk-ins welcome',   color: '#FF6B35' },
                  { icon: Shield,  title: 'Certified Specialists',   desc: 'Experienced, credentialed dental professionals',    color: '#00BCD4' },
                  { icon: Phone,   title: 'Easy Online Booking',     desc: 'Book in under 2 minutes — anytime, anywhere',     color: '#FF6B35' },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}18` }}>
                      <f.icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1A2332]">{f.title}</p>
                      <p className="text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS — warm orange tint section
      ══════════════════════════════════════════════ */}
      <section className="py-24 bg-[#FFF7F4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#00BCD4] text-sm font-bold uppercase tracking-wider">What Patients Say</span>
            <h2 className="text-4xl font-extrabold text-[#1A2332] mt-2 mb-3">Smiles Speak for Themselves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Ma Thin Thin',   role: 'Patient since 2022', quote: "The team is so kind and thorough. I used to fear the dentist — now I actually look forward to my visits!", stars: 5,  color: '#FF6B35' },
              { name: 'Ko Kyaw Zin',    role: 'Patient since 2021', quote: "Transparent pricing, no hidden fees. They explained every step clearly. Real honest care — exactly as the name says.", stars: 5,  color: '#00BCD4' },
              { name: 'Daw Aye Myint',  role: 'Patient since 2023', quote: "Walked in with toothache, walked out smiling. Quick appointment, zero wait time, and genuinely caring staff.", stars: 5,  color: '#FF6B35' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FF6B35] text-[#FF6B35]" />
                  ))}
                </div>
                <p className="text-[#1A2332] leading-relaxed mb-6 text-sm">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: t.color }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A2332] text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA — dual-tone gradient (cyan → orange)
      ══════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 40%, #FF6B35 100%)' }}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white">
          <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            Ready to Begin?
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Book Your First Visit Today
          </h2>
          <p className="text-xl opacity-90 mb-10">
            Experience dental care that puts <em>you</em> first — honest, warm, and professional.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={bookHref}>
              <button className="flex items-center gap-2 bg-white text-[#1A2332] hover:bg-gray-100 font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:shadow-2xl">
                Book Appointment
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/services">
              <button className="flex items-center gap-2 border-2 border-white/50 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-all">
                View Services
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
