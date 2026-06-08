'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  PartyPopper,
  Rocket,
  Target,
  Users,
  Euro
} from 'lucide-react';

interface CompanySettings {
  company_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  city: string;
  kvk_number: string;
  btw_number: string;
  iban: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const STORAGE_KEY = 'klinkers_onboarding_complete';
const SETTINGS_KEY = 'klinkers_company_settings';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setShowOnboarding(!completed);
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, isLoading, completeOnboarding, resetOnboarding };
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: 'Klinkers & Co',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    postal_code: '',
    city: '',
    kvk_number: '',
    btw_number: '',
    iban: '',
  });

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  };

  const handleComplete = () => {
    saveSettings();
    onComplete();
  };

  const updateSetting = (key: keyof CompanySettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const steps = [
    { title: 'Welkom', icon: PartyPopper },
    { title: 'Bedrijfsgegevens', icon: Building2 },
    { title: 'Contact', icon: Phone },
    { title: 'Zakelijk', icon: FileText },
    { title: 'Aan de slag', icon: Rocket },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-2 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                i === step
                  ? 'bg-orange-100 text-orange-700'
                  : i < step
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? (
                <Check className="w-3 h-3" />
              ) : (
                <s.icon className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>

        <CardContent className="p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Welkom bij Klinkers & Co!
                </h2>
                <p className="text-slate-600 text-lg">
                  De slimste software voor hoveniers
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: Target, label: 'AI Offertes', desc: 'In 5 minuten klaar' },
                  { icon: Users, label: 'Lead Management', desc: 'Nooit meer vergeten' },
                  { icon: Euro, label: 'Meer Omzet', desc: 'Hogere conversie' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl text-center">
                    <feature.icon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">{feature.label}</p>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-slate-500 text-sm pt-4">
                Laten we beginnen met het instellen van je bedrijfsgegevens.
                Dit duurt ongeveer 2 minuten.
              </p>
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Bedrijfsgegevens</h2>
                <p className="text-slate-500">Deze gegevens verschijnen op je offertes</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bedrijfsnaam
                  </label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    placeholder="Jouw Hoveniersbedrijf"
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Naam eigenaar
                  </label>
                  <Input
                    value={settings.owner_name}
                    onChange={(e) => updateSetting('owner_name', e.target.value)}
                    placeholder="Jan Jansen"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Postcode
                    </label>
                    <Input
                      value={settings.postal_code}
                      onChange={(e) => updateSetting('postal_code', e.target.value)}
                      placeholder="1234 AB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Plaats
                    </label>
                    <Input
                      value={settings.city}
                      onChange={(e) => updateSetting('city', e.target.value)}
                      placeholder="Amsterdam"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Adres
                  </label>
                  <Input
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    placeholder="Tuinstraat 123"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Contactgegevens</h2>
                <p className="text-slate-500">Hoe kunnen klanten je bereiken?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefoonnummer
                  </label>
                  <Input
                    value={settings.phone}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    placeholder="06 12345678"
                    type="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mailadres
                  </label>
                  <Input
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    placeholder="info@jouwbedrijf.nl"
                    type="email"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-700">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <strong>Tip:</strong> Deze gegevens worden automatisch ingevuld in je offertes en emails naar klanten.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Business Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Zakelijke gegevens</h2>
                <p className="text-slate-500">Voor op je facturen en offertes</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    KvK-nummer
                  </label>
                  <Input
                    value={settings.kvk_number}
                    onChange={(e) => updateSetting('kvk_number', e.target.value)}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    BTW-nummer
                  </label>
                  <Input
                    value={settings.btw_number}
                    onChange={(e) => updateSetting('btw_number', e.target.value)}
                    placeholder="NL123456789B01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    IBAN
                  </label>
                  <Input
                    value={settings.iban}
                    onChange={(e) => updateSetting('iban', e.target.value)}
                    placeholder="NL00 BANK 0123 4567 89"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl">
                <p className="text-sm text-amber-700">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Je kunt deze gegevens later altijd nog wijzigen via Instellingen.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Ready to go */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Rocket className="w-12 h-12 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                  Je bent klaar om te beginnen!
                </h2>
                <p className="text-slate-600 text-lg">
                  Alle gegevens zijn opgeslagen
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-3">
                <h3 className="font-semibold text-slate-800">Snelle start tips:</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Leads:</strong> Voeg je eerste lead toe om de flow te leren kennen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>AI Offerte:</strong> Plak je schouwnotities en laat AI een offerte maken</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span><strong>Prijzen:</strong> Bekijk de prijzenlijst en pas aan waar nodig</span>
                  </li>
                </ul>
              </div>

              <p className="text-slate-500 text-sm">
                Veel succes met Klinkers & Co!
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(prev => prev - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Vorige
            </Button>

            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(prev => prev + 1)}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                Volgende
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Check className="w-4 h-4" />
                Aan de slag!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
