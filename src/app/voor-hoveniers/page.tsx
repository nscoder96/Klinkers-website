'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  FileText,
  ArrowRight,
  Play,
  Zap,
  TrendingUp,
  Mail,
  X,
  Leaf,
  Menu,
  Check,
  CheckCircle,
  MoreHorizontal,
  Plus
} from 'lucide-react';

export default function VoorHoveniersPage() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => setFormSubmitted(true), 1000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-orange-500/30">

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                TuinPro
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Hoe het werkt</a>
              <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Ervaringen</a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">FAQ</a>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-900 hover:text-orange-500 transition-colors">
                Inloggen
              </Link>
              <Button
                onClick={() => setShowContactForm(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Gratis Demo
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-slate-100 p-4 flex flex-col gap-4 md:hidden animate-slide-up shadow-xl">
            <a href="#features" className="text-base font-medium text-slate-600 p-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-base font-medium text-slate-600 p-2" onClick={() => setMobileMenuOpen(false)}>Hoe het werkt</a>
            <Button onClick={() => { setShowContactForm(true); setMobileMenuOpen(false); }} className="w-full bg-orange-500">
              Gratis Demo
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl animate-float-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-3xl animate-float" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">AI-Powered Klantenservice</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            <span className="block">Van notitie naar offerte</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600">
              in 5 minuten
            </span>
          </h1>

          <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Geen avonden meer achter de laptop. Type je notities, laat AI het rekenwerk doen en verstuur direct een professionele offerte.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => setShowContactForm(true)}
              className="h-14 px-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
            >
              Start Gratis Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <a href="#how-it-works" className="group flex items-center gap-3 px-6 py-4 rounded-full bg-white border border-slate-200 text-slate-600 font-medium hover:border-slate-300 transition-all">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                <Play className="w-4 h-4 fill-slate-900 group-hover:fill-orange-600 text-slate-900 group-hover:text-orange-600 transition-colors" />
              </div>
              Bekijk video
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Bespaar 10+ uur per week</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Meer gewonnen klussen</span>
            </div>
          </div>
        </div>

        {/* Hero Product - Realistic Mockup */}
        <div className="relative mt-20 max-w-6xl mx-auto px-4">
          <div className="relative rounded-2xl bg-slate-900 p-3 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/10 backdrop-blur-3xl">
            {/* Window Controls */}
            <div className="absolute top-0 left-0 right-0 h-10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>

            {/* Inner Content - The "Realistic View" */}
            <div className="rounded-xl overflow-hidden bg-slate-50 mt-8 shadow-inner border border-slate-200 relative aspect-[16/10] md:aspect-[16/9] flex flex-col">

              {/* App Header */}
              <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Nieuwe Offerte - Fam. de Vries</h3>
                    <p className="text-xs text-slate-500">Laatst opgeslagen: zojuist</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    AI Analyse Voltooid
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                </div>
              </div>

              {/* App Body - Split View */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left: Input */}
                <div className="w-1/2 p-6 border-r border-slate-200 bg-white flex flex-col">
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Jouw Notities</label>
                    <div className="h-full bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-600 leading-relaxed border border-slate-200 shadow-sm relative overflow-hidden">
                      <p>Klant wil voortuin renovatie.</p>
                      <p className="mt-2">- 40m2 bestrating (Abbey stones)</p>
                      <p>- 2x plantenbak verhoogd (stapelblokken antraciet)</p>
                      <p>- 15m beukenhaag</p>
                      <p>- Oude bestrating afvoeren</p>
                      <p className="mt-4 text-slate-400">// Berekenen inclusief arbeid en wit zand</p>

                      <div className="absolute bottom-4 right-4 animate-bounce">
                        <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow">AI Leest mee...</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Output */}
                <div className="w-1/2 bg-slate-50/50 p-6 flex flex-col relative">
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-0"></div> {/* Subtle blur to emphasize "magic" */}

                  <label className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2 block relative z-10 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Gegenereerd Resultaat
                  </label>

                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 relative z-10 overflow-hidden flex flex-col">
                    {/* Quote Table Mockup */}
                    <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 flex text-xs font-medium text-slate-500">
                      <div className="flex-1">Omschrijving</div>
                      <div className="w-16 text-right">Aantal</div>
                      <div className="w-20 text-right">Totaal</div>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Item 1 */}
                      <div className="flex items-center px-2 py-2 rounded hover:bg-slate-50 text-sm group">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Abbey Stones 20x30</div>
                          <div className="text-xs text-slate-500">Kleur: Zwart/Grijs</div>
                        </div>
                        <div className="w-16 text-right text-slate-600">42 m2</div>
                        <div className="w-20 text-right font-medium text-slate-900">€ 1.890</div>
                      </div>
                      {/* Item 2 */}
                      <div className="flex items-center px-2 py-2 rounded hover:bg-slate-50 text-sm group">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Stapelblokken Antraciet</div>
                        </div>
                        <div className="w-16 text-right text-slate-600">60 st</div>
                        <div className="w-20 text-right font-medium text-slate-900">€ 450</div>
                      </div>
                      {/* Item 3 */}
                      <div className="flex items-center px-2 py-2 rounded hover:bg-slate-50 text-sm group">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Arbeidsuren stratenmaker</div>
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Auto-berekend
                          </div>
                        </div>
                        <div className="w-16 text-right text-slate-600">16 uur</div>
                        <div className="w-20 text-right font-medium text-slate-900">€ 880</div>
                      </div>
                    </div>

                    <div className="mt-auto bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                      <div className="text-sm font-medium text-slate-500">Totaal incl. BTW</div>
                      <div className="text-xl font-bold text-slate-900">€ 3.896,20</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 text-center relative z-10">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full shadow-lg shadow-orange-500/20">
                      Verstuur naar Klant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating 'Result' Badge */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden md:block animate-float">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Tijdsbesparing</div>
                  <div className="text-sm font-bold text-slate-900">45 minuten</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">
            Al gebruikt door 50+ hoveniers in Nederland
          </p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simulated Logos */}
            {['GroenTotaal', 'De Hovenier', 'Tuin & Co', 'Het Buitenleven'].map((name, i) => (
              <div key={i} className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                <Leaf className="w-5 h-5" /> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid (Bento Style) */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Alles wat je nodig hebt om te groeien</h2>
            <p className="text-lg text-slate-600">Van eerste contact tot factuur. Wij automatiseren de saaie taken zodat jij je kunt focussen op de tuin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Feature 1 - Large */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare className="w-48 h-48 text-orange-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Receptioniste 24/7</h3>
                <p className="text-slate-600 mb-8 max-w-md">De slimme chatbot op je website beantwoordt vragen en filtert serieuze klanten. Krijg alleen leads binnen die klaar zijn voor een offerte.</p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-w-md">
                  <div className="flex gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                    <div className="bg-white p-3 rounded-tr-xl rounded-b-xl shadow-sm text-sm text-slate-600">
                      Hoi, ik wil graag een offerte voor bestrating van 40m2.
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-orange-500 p-3 rounded-tl-xl rounded-b-xl shadow-sm text-sm text-white">
                      Natuurlijk! Om welke regio gaat het?
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Offertes in seconden</h3>
                <p className="text-slate-400 mb-6 flex-1">Jij spreekt in, AI schrijft en berekent. Klaar in 2 minuten.</p>
                <ul className="space-y-3">
                  {['Spraak naar tekst', 'Automatische berekening', 'Direct als PDF'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Online Acceptatie</h3>
              <p className="text-slate-600">Klanten accepteren met één klik. Geen gedoe met printen en scannen. Juridisch dichtgetimmerd.</p>
              <Button variant="outline" className="mt-6 w-full group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200">
                Bekijk voorbeeld
              </Button>
            </div>

            {/* Feature 4 - Large */}
            <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-white rounded-3xl p-8 border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Inzicht in je cijfers</h3>
                  <p className="text-slate-600 mb-6">Weet precies wat je omzet is, welke offertes nog open staan en hoeveel werk er aan komt.</p>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                    Start Dashboard Demo
                  </Button>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-sm text-slate-500">Omzet deze maand</div>
                        <div className="text-3xl font-bold text-slate-900">€ 24.500</div>
                      </div>
                      <div className="text-green-500 text-sm font-semibold bg-green-50 px-2 py-1 rounded">+12%</div>
                    </div>
                    <div className="h-24 flex items-end gap-2">
                      {[40, 60, 45, 70, 85, 65, 90].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-orange-100 rounded-t-sm hover:bg-orange-500 transition-colors" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Klaar om professioneler te werken?
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Probeer TuinPro gratis. Geen creditcard nodig. Stop wanneer je wilt.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setShowContactForm(true)}
              size="lg"
              className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg"
            >
              Gratis Account Aanmaken
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 rounded-full border-slate-700 text-white bg-transparent hover:bg-slate-800 hover:text-white text-lg"
            >
              Plan een Demo
            </Button>
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Al 50+ hoveniers gingen je voor
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">TuinPro</span>
              </Link>
              <p className="text-slate-500 max-w-sm">
                Software gemaakt door hoveniers, voor hoveniers. Wij helpen je bedrijf groeien zonder gedoe.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-orange-500">Features</a></li>
                <li><a href="#" className="hover:text-orange-500">Prijzen</a></li>
                <li><a href="#" className="hover:text-orange-500">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@tuinpro.nl</li>
                <li>KVK: 12345678</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} TuinPro. Alle rechten voorbehouden.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-900">Privacy</a>
              <a href="#" className="hover:text-slate-900">Voorwaarden</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Start Gratis Demo</h3>
                <button onClick={() => setShowContactForm(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {formSubmitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Aanvraag Ontvangen!</h4>
                  <p className="text-slate-600 mb-6">We nemen contact met je op om je account te activeren.</p>
                  <Button onClick={() => setShowContactForm(false)} className="w-full">Sluiten</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Naam</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jouw naam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bedrijfsnaam</label>
                    <Input
                      value={formData.company}
                      onChange={e => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Naam van je bedrijf"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jouw@email.nl"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-lg">
                    Aanvragen
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
