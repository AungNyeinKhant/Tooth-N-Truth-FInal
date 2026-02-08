import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { Calendar, Clock, MapPin, Phone, Shield, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-background-light py-20">
        <div className="container-app text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your Smile Deserves{' '}
            <span className="text-primary-cyan">Honest Care</span>
          </h1>
          <p className="text-xl text-text-gray mb-8 max-w-2xl mx-auto">
            Professional dental services across 5 convenient locations in Yangon.
            Book your appointment today and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Book Appointment</Button>
            </Link>
            <Link href="/services">
              <Button variant="outline" size="lg">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Happy Patients' },
              { value: '50K+', label: 'Treatments' },
              { value: '5', label: 'Branches' },
              { value: '4.9/5', label: 'Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-cyan mb-2">
                  {stat.value}
                </div>
                <div className="text-text-gray">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-background-light">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Dental Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'General Checkup', icon: Shield, desc: 'Comprehensive dental examination' },
              { name: 'Dental Cleaning', icon: Star, desc: 'Professional teeth cleaning' },
              { name: 'Tooth Extraction', icon: Clock, desc: 'Safe tooth removal' },
              { name: 'Teeth Whitening', icon: Star, desc: 'Cosmetic whitening treatment' },
            ].map((service) => (
              <Card key={service.name} hover className="text-center">
                <service.icon className="w-12 h-12 text-primary-cyan mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                <p className="text-text-gray text-sm">{service.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Tooth & Truth?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: '5 Convenient Locations',
                desc: 'Strategically located across Yangon for easy access',
              },
              {
                icon: Clock,
                title: 'Flexible Hours',
                desc: 'Open Monday to Friday, 9 AM to 5 PM',
              },
              {
                icon: Phone,
                title: 'Easy Booking',
                desc: 'Book appointments online or walk-in anytime',
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-primary-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-cyan" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-gray">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-cyan">
        <div className="container-app text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Book your first appointment today and take the first step towards a healthier smile.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Book Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
