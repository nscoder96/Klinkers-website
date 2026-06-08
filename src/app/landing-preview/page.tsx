'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Leaf,
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Users,
  Clock,
  Star,
  ChevronRight,
  Play,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

// Osmo-inspired Design System for Klinkers & Co
const colors = {
  // Core
  dark: '#222222',
  white: '#ffffff',

  // Brand - Orange (Primary)
  orange: '#FA5D29',
  orangeHover: '#e54d1c',
  orangeLight: '#FFF4F1',

  // Accent - Blue
  blue: '#49B3FC',
  blueHover: '#2da3f7',
  blueLight: '#F0F9FF',

  // Backgrounds
  bgLight: '#F8F8F8',
  bgDark: '#222222',

  // Neutrals
  gray100: '#fafafa',
  gray200: '#ededed',
  gray400: '#a1a1a1',
  gray600: '#666666',

  // Semantic
  success: '#52c67e',
  successLight: '#F0FDF4',
};

export default function LandingPreview() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bgLight }}>
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
        style={{
          backgroundColor: scrolled ? colors.white : 'transparent',
          boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.orange }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: colors.dark }}>
              Klinkers & Co
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.dark }}>
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.dark }}>
              Prijzen
            </Link>
            <Link href="#demo" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.dark }}>
              Demo
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/admin/login">
              <Button variant="ghost" className="font-medium" style={{ color: colors.dark }}>
                Inloggen
              </Button>
            </Link>
            <Button
              className="font-medium rounded-lg px-5"
              style={{ backgroundColor: colors.orange, color: colors.white }}
            >
              Gratis Proberen
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" style={{ color: colors.dark }} />
            ) : (
              <Menu className="w-6 h-6" style={{ color: colors.dark }} />
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section - Dark */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: colors.bgDark }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-10"
            style={{ backgroundColor: colors.orange }}
          />
          <div
            className="absolute bottom-40 left-10 w-64 h-64 rounded-full opacity-5"
            style={{ backgroundColor: colors.blue }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(${colors.white} 1px, transparent 1px), linear-gradient(90deg, ${colors.white} 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-32">
          <div className="max-w-4xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: 'rgba(250, 93, 41, 0.15)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: colors.orange }} />
              <span className="text-sm font-medium" style={{ color: colors.orange }}>
                AI-Powered Hovenierssoftware
              </span>
            </div>

            {/* Main Headline */}
            <h1
              className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6"
              style={{ color: colors.white }}
            >
              Van schouwnotitie naar{' '}
              <span style={{ color: colors.orange }}>offerte</span>{' '}
              in 5 minuten
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl md:text-2xl mb-10 max-w-2xl leading-relaxed"
              style={{ color: colors.gray400 }}
            >
              De slimste software voor hoveniers. Maak professionele offertes,
              beheer je leads en groei je bedrijf — allemaal vanuit één plek.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-lg font-medium"
                style={{ backgroundColor: colors.orange, color: colors.white }}
              >
                Start Gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-lg font-medium"
                style={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: colors.white,
                  backgroundColor: 'transparent'
                }}
              >
                <Play className="w-5 h-5 mr-2" />
                Bekijk Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 mt-12 pt-12" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[colors.orange, colors.blue, colors.success].map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: color, borderColor: colors.bgDark }}
                    >
                      {['JV', 'PK', 'MB'][i]}
                    </div>
                  ))}
                </div>
                <span className="text-sm" style={{ color: colors.gray400 }}>
                  100+ hoveniers
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: colors.orange }} />
                ))}
                <span className="text-sm ml-2" style={{ color: colors.gray400 }}>
                  4.9/5 rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs" style={{ color: colors.gray400 }}>Scroll</span>
          <div
            className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-2"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <div
              className="w-1.5 h-3 rounded-full animate-bounce"
              style={{ backgroundColor: colors.orange }}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Light */}
      <section className="py-32" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="max-w-3xl mb-20">
            <span
              className="text-sm font-semibold uppercase tracking-wider mb-4 block"
              style={{ color: colors.orange }}
            >
              Features
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{ color: colors.dark }}
            >
              Alles wat je nodig hebt om je{' '}
              <span style={{ color: colors.orange }}>hoveniersbedrijf</span>{' '}
              te laten groeien
            </h2>
            <p className="text-xl" style={{ color: colors.gray600 }}>
              Van lead tot factuur — wij automatiseren het saaie werk zodat jij kunt focussen op wat je het beste doet.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'AI Offerte Generator',
                description: 'Upload een foto of voicenote van je schouw. Onze AI maakt automatisch een gedetailleerde offerte.',
                color: colors.orange
              },
              {
                icon: Users,
                title: 'Lead Management',
                description: 'Houd al je leads bij op één plek. Van eerste contact tot gewonnen klant.',
                color: colors.blue
              },
              {
                icon: FileText,
                title: 'Professionele Offertes',
                description: 'Mooie, branded offertes die je klanten direct kunnen accepteren.',
                color: colors.success
              },
              {
                icon: Clock,
                title: 'Tijdregistratie',
                description: 'Registreer uren per project en genereer automatisch facturen.',
                color: colors.orange
              },
              {
                icon: BarChart3,
                title: 'Inzichten & Rapportages',
                description: 'Zie in één oogopslag hoe je bedrijf presteert met realtime dashboards.',
                color: colors.blue
              },
              {
                icon: Shield,
                title: 'Veilig & Betrouwbaar',
                description: 'Je data is veilig opgeslagen in Nederland met automatische backups.',
                color: colors.success
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: colors.bgLight,
                  border: `1px solid ${colors.gray200}`
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: colors.dark }}>
                  {feature.title}
                </h3>
                <p style={{ color: colors.gray600 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-32" style={{ backgroundColor: colors.bgLight }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              Hoveniers over Klinkers & Co
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Ik bespaar nu 5 uur per week aan administratie. De AI offerte generator is een game-changer.',
                name: 'Jan de Vries',
                role: 'Eigenaar, De Groene Tuin',
                avatar: 'JV'
              },
              {
                quote: 'Eindelijk software die begrijpt hoe hoveniers werken. Simpel, snel en effectief.',
                name: 'Petra Klaassen',
                role: 'Hoveniersbedrijf Klaassen',
                avatar: 'PK'
              },
              {
                quote: 'Mijn klanten zijn onder de indruk van de professionele offertes. Mijn conversie is met 30% gestegen.',
                name: 'Mohammed Bakker',
                role: 'MB Tuinen',
                avatar: 'MB'
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl"
                style={{ backgroundColor: colors.white, border: `1px solid ${colors.gray200}` }}
              >
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-current" style={{ color: colors.orange }} />
                  ))}
                </div>
                <p className="text-lg mb-8" style={{ color: colors.dark }}>
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: colors.blue }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: colors.dark }}>{testimonial.name}</p>
                    <p className="text-sm" style={{ color: colors.gray600 }}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32" style={{ backgroundColor: colors.white }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span
              className="text-sm font-semibold uppercase tracking-wider mb-4 block"
              style={{ color: colors.orange }}
            >
              Prijzen
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.dark }}>
              Simpele, eerlijke prijzen
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.gray600 }}>
              Geen verborgen kosten. Geen lange contracten. Betaal alleen voor wat je gebruikt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div
              className="p-8 rounded-2xl"
              style={{ backgroundColor: colors.bgLight, border: `1px solid ${colors.gray200}` }}
            >
              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.dark }}>Starter</h3>
              <p className="mb-6" style={{ color: colors.gray600 }}>Perfect om te beginnen</p>
              <div className="mb-8">
                <span className="text-5xl font-bold" style={{ color: colors.dark }}>€49</span>
                <span className="text-lg" style={{ color: colors.gray600 }}>/maand</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Tot 50 leads', '25 offertes/maand', 'Email support', 'Basis rapportages'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5" style={{ color: colors.success }} />
                    <span style={{ color: colors.dark }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full py-6 rounded-lg font-medium"
                variant="outline"
                style={{ borderColor: colors.gray200, color: colors.dark }}
              >
                Start Gratis Trial
              </Button>
            </div>

            {/* Pro Plan */}
            <div
              className="p-8 rounded-2xl relative overflow-hidden"
              style={{ backgroundColor: colors.dark }}
            >
              <div
                className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: colors.orange, color: colors.white }}
              >
                Populair
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.white }}>Pro</h3>
              <p className="mb-6" style={{ color: colors.gray400 }}>Voor groeiende bedrijven</p>
              <div className="mb-8">
                <span className="text-5xl font-bold" style={{ color: colors.white }}>€99</span>
                <span className="text-lg" style={{ color: colors.gray400 }}>/maand</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Onbeperkt leads', 'Onbeperkt offertes', 'AI Offerte Generator', 'Priority support', 'Geavanceerde rapportages', 'API toegang'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5" style={{ color: colors.orange }} />
                    <span style={{ color: colors.white }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full py-6 rounded-lg font-medium"
                style={{ backgroundColor: colors.orange, color: colors.white }}
              >
                Start Gratis Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32" style={{ backgroundColor: colors.bgDark }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: colors.white }}>
            Klaar om je bedrijf te laten groeien?
          </h2>
          <p className="text-xl mb-10" style={{ color: colors.gray400 }}>
            Start vandaag nog met Klinkers & Co. Geen creditcard nodig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-lg font-medium"
              style={{ backgroundColor: colors.orange, color: colors.white }}
            >
              Start Gratis Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-lg font-medium"
              style={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: colors.white,
                backgroundColor: 'transparent'
              }}
            >
              Plan een Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16" style={{ backgroundColor: colors.white, borderTop: `1px solid ${colors.gray200}` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.orange }}
                >
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl" style={{ color: colors.dark }}>
                  Klinkers & Co
                </span>
              </div>
              <p style={{ color: colors.gray600 }}>
                De slimste software voor hoveniers in Nederland.
              </p>
            </div>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Prijzen', 'Demo', 'Updates'] },
              { title: 'Bedrijf', links: ['Over ons', 'Contact', 'Partners', 'Vacatures'] },
              { title: 'Support', links: ['Help Center', 'API Docs', 'Status', 'Privacy'] },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold mb-4" style={{ color: colors.dark }}>{group.title}</h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: colors.gray600 }}
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderTop: `1px solid ${colors.gray200}` }}
          >
            <p style={{ color: colors.gray600 }}>
              © {new Date().getFullYear()} Klinkers & Co. Alle rechten voorbehouden.
            </p>
            <div className="flex gap-6">
              <Link href="#" style={{ color: colors.gray600 }} className="hover:opacity-70">Privacy</Link>
              <Link href="#" style={{ color: colors.gray600 }} className="hover:opacity-70">Voorwaarden</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Back link */}
      <div className="fixed bottom-4 left-4">
        <Link
          href="/admin"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: colors.dark, color: colors.white }}
        >
          ← Terug naar Admin
        </Link>
      </div>
    </div>
  );
}
