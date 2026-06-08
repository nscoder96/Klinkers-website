'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Award,
  Leaf,
  Hammer,
  TreeDeciduous,
  Fence,
  Sparkles,
  CheckCircle2,
  Star,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.contact.includes('@') ? formData.contact : undefined,
          phone: !formData.contact.includes('@') ? formData.contact : undefined,
          address: formData.address,
          description: formData.description,
          source: 'website'
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', contact: '', address: '', description: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToDiensten = () => {
    document.getElementById('diensten')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="glass-dark">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="flex items-center group">
                <div className="bg-white rounded-xl px-4 py-2 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image
                    src="/logo.png"
                    alt="Klinkers & Co"
                    width={160}
                    height={45}
                    className="h-8 w-auto"
                    priority
                  />
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <a href="#diensten" className="text-white/80 hover:text-white transition-colors link-underline">
                  Diensten
                </a>
                <a href="#waarom" className="text-white/80 hover:text-white transition-colors link-underline">
                  Waarom Wij
                </a>
                <a href="#werkgebied" className="text-white/80 hover:text-white transition-colors link-underline">
                  Werkgebied
                </a>
                <a href="#contact" className="text-white/80 hover:text-white transition-colors link-underline">
                  Contact
                </a>
                <a href="tel:0653967819">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-orange btn-shine rounded-full px-6">
                    <Phone className="w-4 h-4 mr-2" />
                    Bel Direct
                  </Button>
                </a>
              </nav>
              {/* Mobile menu button */}
              <a href="tel:0653967819" className="md:hidden">
                <Button className="bg-orange-500 hover:bg-orange-600 rounded-full" size="icon">
                  <Phone className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full" />
        </div>

        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1920&q=80')" }}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className={`max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium mb-8 border border-white/30 shadow-lg">
              <Sparkles className="w-4 h-4 text-orange-400" />
              Specialist in verzakkingsgevoelige grond
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              De Hovenier van{' '}
              <span className="text-gradient">Gouda</span>{' '}
              en omstreken
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl leading-relaxed drop-shadow-md">
              Specialist in tuinaanleg en bestrating. Snelle offertes binnen 24 uur.
              <span className="text-orange-400 font-semibold drop-shadow-sm"> Vakwerk gegarandeerd.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button
                size="lg"
                onClick={scrollToContact}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-full shadow-orange btn-shine font-semibold"
              >
                Vraag Gratis Offerte Aan
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToDiensten}
                className="border-2 border-white/30 text-white bg-white/10 hover:bg-white hover:text-slate-800 text-lg px-8 py-6 rounded-full backdrop-blur-sm font-semibold transition-all"
              >
                Bekijk Onze Diensten
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-8">
              {[
                { icon: Clock, text: 'Offerte binnen 24 uur' },
                { icon: Shield, text: '5 jaar ervaring' },
                { icon: Award, text: 'Lokale specialist' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white drop-shadow-md">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="font-semibold">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block">
            <button onClick={scrollToDiensten} className="scroll-indicator opacity-60 hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* USP Bar */}
      <section className="relative -mt-1 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Snelle Respons', desc: 'Offerte binnen 24 uur' },
              { icon: MapPin, title: 'Lokale Expert', desc: 'Goudse bodem specialist' },
              { icon: Shield, title: 'Garantie', desc: '5 jaar op ons werk' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-orange flex-shrink-0">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waarom Klinkers & Co */}
      <section id="waarom" className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-50 pattern-dots" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="inline-block text-orange-500 font-semibold mb-4 tracking-wide uppercase text-sm">
              Waarom kiezen voor ons
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-6">
              Waarom verzakt alles in{' '}
              <span className="text-gradient">Gouda</span>?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Woont u in Bloemendaal, Plaswijck of Korte Akkeren? Dan kent u het probleem.
              De slappe veen- en kleigrond zorgt ervoor dat opritten verzakken en tuinen blank staan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'De Analyse',
                desc: 'Wij kijken eerst naar de grondslag in uw wijk. Wij weten precies waar we extra maatregelen moeten nemen.',
                color: 'orange'
              },
              {
                step: '02',
                title: 'De Oplossing',
                desc: 'Wij werken indien nodig met lichtgewicht ophoogmaterialen (Tempex/EPS) of puinbanen om verzakking te stoppen.',
                color: 'green'
              },
              {
                step: '03',
                title: 'De Afwatering',
                desc: 'Geen plassen meer. Wij leggen drainage en kolken aan zodat het water in uw laaggelegen tuin altijd weg kan.',
                color: 'slate'
              }
            ].map((item, i) => (
              <Card key={i} className={`group hover-lift border-0 shadow-premium overflow-hidden`}>
                <div className={`h-2 bg-gradient-to-r ${
                  item.color === 'orange' ? 'from-orange-500 to-orange-400' :
                  item.color === 'green' ? 'from-green-500 to-green-400' :
                  'from-slate-700 to-slate-600'
                }`} />
                <CardContent className="p-8">
                  <span className={`text-6xl font-bold ${
                    item.color === 'orange' ? 'text-orange-100' :
                    item.color === 'green' ? 'text-green-100' :
                    'text-slate-100'
                  }`}>
                    {item.step}
                  </span>
                  <h3 className={`text-2xl font-bold mt-4 mb-3 ${
                    item.color === 'orange' ? 'text-orange-600' :
                    item.color === 'green' ? 'text-green-600' :
                    'text-slate-700'
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Diensten */}
      <section id="diensten" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-orange-500 font-semibold mb-4 tracking-wide uppercase text-sm">
              Wat wij doen
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-6">
              Onze Diensten
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Van complete tuinaanleg tot professioneel onderhoud
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Leaf,
                title: 'Tuinaanleg & Ontwerp',
                image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
                features: ['Complete tuinontwerpen op maat', 'Gazon aanleg (graszoden of inzaaien)', 'Borders en beplanting', 'Hagen en bomen planten'],
                color: 'green',
                cta: 'Offerte aanvragen'
              },
              {
                icon: Hammer,
                title: 'Bestrating & Straatwerk',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80',
                features: ['Opritten met verstevigde fundering', 'Terrassen en paden', 'Keramische tegels en klinkers', 'Herstraten verzakte oppervlakken'],
                color: 'orange',
                cta: 'Offerte aanvragen'
              },
              {
                icon: Fence,
                title: 'Schuttingen & Afscheidingen',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
                features: ['Houten schuttingen', 'Betonpalen met schermen', 'Tuinhekken en poorten', 'Privacy schermen'],
                color: 'amber',
                cta: 'Offerte aanvragen'
              },
              {
                icon: TreeDeciduous,
                title: 'Tuinonderhoud',
                image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80',
                features: ['Seizoensonderhoud', 'Snoeiwerk bomen en hagen', 'Onkruidbestrijding', 'Bladruimen en winterklaar maken'],
                color: 'slate',
                cta: 'Offerte aanvragen'
              }
            ].map((service, i) => (
              <Card key={i} className="group overflow-hidden border-0 shadow-premium hover-lift bg-white">
                <div className="relative h-56 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url('${service.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className={`absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center ${
                    service.color === 'green' ? 'bg-green-500' :
                    service.color === 'orange' ? 'bg-orange-500' :
                    service.color === 'amber' ? 'bg-amber-500' :
                    'bg-slate-600'
                  }`}>
                    <service.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                    {service.title}
                  </h3>
                </div>
                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          service.color === 'green' ? 'text-green-500' :
                          service.color === 'orange' ? 'text-orange-500' :
                          service.color === 'amber' ? 'text-amber-500' :
                          'text-slate-500'
                        }`} />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={scrollToContact}
                    className={`w-full rounded-full font-semibold btn-shine ${
                      service.color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                      service.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600' :
                      service.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' :
                      'bg-slate-600 hover:bg-slate-700'
                    } text-white`}
                  >
                    {service.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Werkgebied */}
      <section id="werkgebied" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-orange-400 font-semibold mb-4 tracking-wide uppercase text-sm">
                Ons werkgebied
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Actief in <span className="text-gradient">Gouda</span> en omstreken
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Wij werken in een straal van 35 kilometer rond Gouda. Van Alphen aan den Rijn tot Rotterdam, en van Den Haag tot Utrecht.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {['Gouda', 'Waddinxveen', 'Boskoop', 'Reeuwijk', 'Moordrecht', 'Nieuwerkerk a/d IJssel', 'Alphen a/d Rijn', 'Woerden'].map((city, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    <span>{city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 border border-slate-700">
                <div className="w-full h-full rounded-2xl bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                  {/* Stylized map placeholder */}
                  <div className="absolute inset-0 pattern-grid opacity-20" />
                  <div className="relative text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center animate-pulse-glow">
                      <MapPin className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">35 km</p>
                    <p className="text-slate-400">werkgebied rond Gouda</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/50 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Klaar om uw tuin aan te pakken?
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Stuur ons een bericht of bel direct. Wij komen graag langs voor een vrijblijvend adviesgesprek.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={scrollToContact}
              className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 rounded-full font-semibold shadow-xl btn-shine"
            >
              Offerte Aanvragen
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a href="tel:0653967819">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-orange-500 text-lg px-8 py-6 rounded-full font-semibold w-full"
              >
                <Phone className="w-5 h-5 mr-2" />
                06 53 96 78 19
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-slate-50 relative">
        <div className="absolute inset-0 pattern-diagonal" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <span className="inline-block text-orange-500 font-semibold mb-4 tracking-wide uppercase text-sm">
                Contact
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-800 mb-6">
                Neem Contact Op
              </h2>
              <p className="text-xl text-slate-600 mb-10">
                Vraag vrijblijvend een offerte aan. Wij komen graag langs in Gouda en omstreken.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Phone, label: 'Telefoon', value: '06 53 96 78 19', href: 'tel:0653967819' },
                  { icon: Mail, label: 'E-mail', value: 'info@klinkersenco.nl', href: 'mailto:info@klinkersenco.nl' },
                  { icon: MapPin, label: 'Werkgebied', value: 'Gouda en omstreken (35km)', href: '#werkgebied' }
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-800">{item.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="border-0 shadow-premium-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-orange-500 via-orange-400 to-green-500" />
                <CardContent className="p-8">
                  {submitStatus === 'success' ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">Bedankt voor uw aanvraag!</h3>
                      <p className="text-slate-600 mb-6">We nemen zo snel mogelijk contact met u op.</p>
                      <Button
                        onClick={() => setSubmitStatus('idle')}
                        variant="outline"
                        className="rounded-full"
                      >
                        Nieuwe aanvraag
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Naam *</label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="Uw naam"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Telefoon / Email *</label>
                          <input
                            type="text"
                            required
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                            placeholder="Hoe kunnen we u bereiken?"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Adres / Wijk</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="Bijv. Bloemendaal, Gouda"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Wat kunnen we voor u doen? *</label>
                        <textarea
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all min-h-32 resize-none"
                          placeholder="Beschrijf uw project of vraag..."
                        />
                      </div>

                      {submitStatus === 'error' && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">
                          Er ging iets mis. Probeer het opnieuw of bel ons direct.
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg py-6 rounded-full font-semibold shadow-orange btn-shine"
                      >
                        {isSubmitting ? 'Versturen...' : 'Verstuur Aanvraag'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & description */}
            <div className="md:col-span-2">
              <div className="inline-block bg-white rounded-xl px-4 py-2 mb-6">
                <Image
                  src="/logo.png"
                  alt="Klinkers & Co"
                  width={160}
                  height={45}
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-slate-400 mb-6 max-w-md">
                Specialist in tuinaanleg en bestrating op verzakkingsgevoelige grond in Gouda en omstreken.
              </p>
              <div className="flex gap-4">
                <a href="tel:0653967819" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="mailto:info@klinkersenco.nl" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Diensten</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#diensten" className="hover:text-orange-400 transition-colors">Tuinaanleg</a></li>
                <li><a href="#diensten" className="hover:text-orange-400 transition-colors">Bestrating</a></li>
                <li><a href="#diensten" className="hover:text-orange-400 transition-colors">Schuttingen</a></li>
                <li><a href="#diensten" className="hover:text-orange-400 transition-colors">Onderhoud</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Contact</h4>
              <ul className="space-y-3 text-slate-400">
                <li>
                  <a href="tel:0653967819" className="hover:text-orange-400 transition-colors flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    06 53 96 78 19
                  </a>
                </li>
                <li>
                  <a href="mailto:info@klinkersenco.nl" className="hover:text-orange-400 transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    info@klinkersenco.nl
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Gouda en omstreken
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Klinkers & Co. Alle rechten voorbehouden.
            </p>
            <Link
              href="/voor-hoveniers"
              className="text-slate-600 text-sm hover:text-orange-400 transition-colors"
            >
              Voor hoveniersbedrijven
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
