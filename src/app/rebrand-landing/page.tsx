'use client';

import Link from 'next/link';
import {
  Leaf,
  FileText,
  Clock,
  TrendingUp,
  Check,
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Users,
  Star
} from 'lucide-react';

// ============================================
// DESIGN TOKENS - Klinkers & Co Rebrand
// ============================================
const colors = {
  anthracite: '#1a1f2e',
  anthraciteLight: '#2a3142',
  forest: '#2d5a47',
  moss: '#4a7c59',
  stone: '#f5f3ef',
  warmWhite: '#fafaf8',
  mist: '#e8e6e1',
  slate: '#64748b',
  terra: '#a16c46',
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: unknown;
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.anthracite, color: 'white' };
      case 'accent':
        return { backgroundColor: colors.forest, color: 'white' };
      case 'secondary':
        return { backgroundColor: 'transparent', color: colors.anthracite, border: `1.5px solid ${colors.mist}` };
      case 'ghost':
        return { backgroundColor: 'transparent', color: colors.slate };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={getStyles()}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================
// PAGE SECTIONS
// ============================================

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'white', borderBottom: `1px solid ${colors.mist}` }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.forest }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg" style={{ color: colors.anthracite }}>
              Klinkers & Co
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.slate }}>
              Functionaliteit
            </a>
            <a href="#pricing" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.slate }}>
              Prijzen
            </a>
            <a href="#about" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: colors.slate }}>
              Over ons
            </a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/admin/login">
              <Button variant="ghost" size="sm">
                Inloggen
              </Button>
            </Link>
            <Button variant="accent" size="sm">
              Probeer gratis
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6" style={{ backgroundColor: 'white' }}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6"
          style={{ backgroundColor: colors.stone, color: colors.forest }}
        >
          <Zap className="w-4 h-4" />
          Software voor hoveniers
        </div>

        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight"
          style={{ color: colors.anthracite }}
        >
          Van schouwnotitie naar offerte
          <br />
          <span style={{ color: colors.forest }}>in 5 minuten</span>
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: colors.slate }}
        >
          Professionele bedrijfssoftware die hoveniers helpt om sneller offertes te maken,
          projecten te plannen en hun bedrijf te laten groeien.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="accent" size="lg">
            Start gratis proefperiode
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="secondary" size="lg">
            Bekijk demo
          </Button>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-8">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" style={{ color: colors.terra }} />
            ))}
            <span className="ml-2 text-sm" style={{ color: colors.slate }}>4.9/5 van 120+ hoveniers</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: FileText,
      title: 'Slimme offertes',
      description: 'Maak professionele offertes in minuten. Automatische berekeningen en herbruikbare templates.',
    },
    {
      icon: Clock,
      title: 'Tijdbesparing',
      description: 'Gemiddeld 70% sneller offertes maken. Meer tijd voor het echte werk in de tuin.',
    },
    {
      icon: BarChart3,
      title: 'Inzicht in cijfers',
      description: 'Dashboard met omzet, conversie en openstaande offertes. Altijd up-to-date.',
    },
    {
      icon: Users,
      title: 'Klantbeheer',
      description: 'Alle klantgegevens, offertes en projecten op één plek. Nooit meer zoeken.',
    },
    {
      icon: Shield,
      title: 'Betrouwbaar',
      description: 'Veilige opslag in de cloud. Je data is altijd beschikbaar en beveiligd.',
    },
    {
      icon: TrendingUp,
      title: 'Groei',
      description: 'Tools die meegroeien met je bedrijf. Van ZZP\'er tot team met meerdere mensen.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6" style={{ backgroundColor: colors.stone }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold" style={{ color: colors.anthracite }}>
            Alles wat je nodig hebt
          </h2>
          <p className="mt-4 text-lg" style={{ color: colors.slate }}>
            Gebouwd door en voor hoveniers. Geen overbodige functies.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg"
              style={{ backgroundColor: colors.warmWhite, border: `1px solid ${colors.mist}` }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{ backgroundColor: colors.stone }}
              >
                <feature.icon className="w-6 h-6" style={{ color: colors.forest }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.anthracite }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.slate }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: 'white' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          {/* Quote */}
          <blockquote>
            <p
              className="text-2xl md:text-3xl font-medium leading-relaxed"
              style={{ color: colors.anthracite }}
            >
              "Sinds we Klinkers & Co gebruiken bespaar ik
              <span style={{ color: colors.forest }}> 4 uur per week </span>
              op administratie. Mijn offertes zien er professioneler uit en klanten reageren sneller."
            </p>
          </blockquote>

          {/* Author */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: colors.stone, color: colors.forest }}
            >
              JP
            </div>
            <div className="text-left">
              <p className="font-semibold" style={{ color: colors.anthracite }}>Jan Pietersen</p>
              <p className="text-sm" style={{ color: colors.slate }}>Pietersen Hoveniers, Almere</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: colors.anthracite }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-white">
          Klaar om te beginnen?
        </h2>
        <p className="mt-4 text-lg text-white/70">
          Probeer 14 dagen gratis. Geen creditcard nodig.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="text-base"
            style={{ backgroundColor: colors.forest, color: 'white' }}
          >
            Start gratis proefperiode
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-white/80 hover:text-white"
          >
            Plan een demo
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex items-center justify-center gap-8 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" style={{ color: colors.forest }} />
            <span>Geen creditcard</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" style={{ color: colors.forest }} />
            <span>14 dagen gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" style={{ color: colors.forest }} />
            <span>Direct starten</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6" style={{ backgroundColor: 'white', borderTop: `1px solid ${colors.mist}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.forest }}
            >
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold" style={{ color: colors.anthracite }}>
              Klinkers & Co
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm" style={{ color: colors.slate }}>
            <a href="#" className="hover:opacity-70 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Voorwaarden</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Contact</a>
          </div>

          {/* Copyright */}
          <p className="text-sm" style={{ color: colors.slate }}>
            © 2026 Klinkers & Co. Alle rechten voorbehouden.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function RebrandLanding() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      <Header />
      <main>
        <Hero />
        <Features />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
