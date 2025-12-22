'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Klinkers & Co"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </a>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#diensten" className="hover:text-orange-400 transition-colors">Diensten</a>
            <a href="#waarom" className="hover:text-orange-400 transition-colors">Waarom Wij</a>
            <a href="#contact" className="hover:text-orange-400 transition-colors">Contact</a>
            <a href="tel:0612345678">
              <Button className="bg-orange-500 hover:bg-orange-600 font-semibold text-white">Bel Direct</Button>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-800 to-slate-900 text-white py-24 md:py-32">
        <div className="absolute inset-0 bg-black/40"></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1920&q=80')" }}
        ></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            De Hovenier van Gouda en omstreken
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-gray-200">
            Specialist in tuinaanleg en bestrating op verzakkingsgevoelige grond.
            <br />
            <span className="text-orange-400">Snelle offertes. Vakwerk gegarandeerd.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-lg px-8 font-semibold text-white shadow-lg"
              onClick={scrollToContact}
            >
              Vraag Gratis Offerte Aan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2 border-white text-white bg-white/10 hover:bg-white hover:text-slate-800 font-semibold"
              onClick={scrollToDiensten}
            >
              Bekijk Onze Diensten
            </Button>
          </div>
        </div>
      </section>

      {/* USP Bar */}
      <section className="bg-orange-500 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">&#9889;</span>
              <span className="font-semibold">Offerte binnen 24 uur</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">&#128205;</span>
              <span className="font-semibold">Goudse bodem expert</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">&#9989;</span>
              <span className="font-semibold">5 jaar garantie</span>
            </div>
          </div>
        </div>
      </section>

      {/* Waarom Klinkers & Co */}
      <section id="waarom" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-800">
            Waarom verzakt alles in Gouda?
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            Woont u in Bloemendaal, Plaswijck of Korte Akkeren? Dan kent u het probleem.
            De slappe veen- en kleigrond zorgt ervoor dat opritten verzakken en tuinen blank staan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-t-4 border-t-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-500">De Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Wij kijken eerst naar de grondslag in uw wijk.
                  Wij weten precies waar we extra maatregelen moeten nemen.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-500">De Oplossing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Wij werken indien nodig met lichtgewicht ophoogmaterialen (Tempex/EPS)
                  of puinbanen om verzakking te stoppen.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardHeader>
                <CardTitle className="text-orange-500">De Afwatering</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Geen plassen meer. Wij leggen drainage en kolken aan zodat het water
                  in uw laaggelegen tuin altijd weg kan.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Diensten */}
      <section id="diensten" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-800">
            Onze Diensten
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tuinaanleg */}
            <Card className="overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80')" }}
              />
              <CardHeader>
                <CardTitle>Tuinaanleg & Ontwerp</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <span>Complete tuinontwerpen op maat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <span>Gazon aanleg (graszoden of inzaaien)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <span>Borders en beplanting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">&#10003;</span>
                    <span>Hagen en bomen planten</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 font-semibold text-white"
                  onClick={scrollToContact}
                >
                  Offerte aanvragen
                </Button>
              </CardContent>
            </Card>

            {/* Bestrating */}
            <Card className="overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80')" }}
              />
              <CardHeader>
                <CardTitle>Bestrating & Straatwerk</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">&#10003;</span>
                    <span>Opritten met verstevigde fundering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">&#10003;</span>
                    <span>Terrassen en paden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">&#10003;</span>
                    <span>Keramische tegels en klinkers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">&#10003;</span>
                    <span>Herstraten verzakte oppervlakken</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 font-semibold text-white"
                  onClick={scrollToContact}
                >
                  Offerte aanvragen
                </Button>
              </CardContent>
            </Card>

            {/* Schuttingen */}
            <Card className="overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80')" }}
              />
              <CardHeader>
                <CardTitle>Schuttingen & Afscheidingen</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">&#10003;</span>
                    <span>Houten schuttingen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">&#10003;</span>
                    <span>Betonpalen met schermen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">&#10003;</span>
                    <span>Tuinhekken en poorten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">&#10003;</span>
                    <span>Privacy schermen</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 bg-amber-600 hover:bg-amber-700 font-semibold text-white"
                  onClick={scrollToContact}
                >
                  Offerte aanvragen
                </Button>
              </CardContent>
            </Card>

            {/* Onderhoud */}
            <Card className="overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80')" }}
              />
              <CardHeader>
                <CardTitle>Tuinonderhoud</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">&#10003;</span>
                    <span>Seizoensonderhoud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">&#10003;</span>
                    <span>Snoeiwerk bomen en hagen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">&#10003;</span>
                    <span>Onkruidbestrijding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 mt-1">&#10003;</span>
                    <span>Bladruimen en winterklaar maken</span>
                  </li>
                </ul>
                <Button
                  className="w-full mt-6 bg-slate-600 hover:bg-slate-700 font-semibold text-white"
                  onClick={scrollToContact}
                >
                  Offerte aanvragen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Klaar om uw tuin aan te pakken?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Stuur ons een bericht of bel direct. Wij komen graag langs voor een vrijblijvend adviesgesprek.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8 font-semibold shadow-lg"
              onClick={scrollToContact}
            >
              Offerte Aanvragen
            </Button>
            <a href="tel:0612345678">
              <Button size="lg" variant="outline" className="text-lg px-8 border-2 border-white text-white bg-white/10 hover:bg-white hover:text-orange-500 w-full font-semibold">
                06 - 12345678
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-800">
            Neem Contact Op
          </h2>
          <p className="text-lg text-gray-600 text-center mb-8">
            Vraag vrijblijvend een offerte aan. Wij komen graag langs in Gouda en omstreken.
          </p>

          <Card>
            <CardContent className="pt-6">
              {submitStatus === 'success' ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-5xl mb-4">&#10003;</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Bedankt voor uw aanvraag!</h3>
                  <p className="text-gray-600 mb-4">We nemen zo snel mogelijk contact met u op.</p>
                  <Button
                    onClick={() => setSubmitStatus('idle')}
                    variant="outline"
                  >
                    Nieuwe aanvraag
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Naam *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Uw naam"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Telefoon / Email *</label>
                      <input
                        type="text"
                        required
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Hoe kunnen we u bereiken?"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Adres / Wijk</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Bijv. Bloemendaal, Gouda"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Wat kunnen we voor u doen? *</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-32"
                      placeholder="Beschrijf uw project of vraag..."
                    ></textarea>
                  </div>

                  {submitStatus === 'error' && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                      Er ging iets mis. Probeer het opnieuw of bel ons direct.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6 font-semibold text-white shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Versturen...' : 'Verstuur Aanvraag'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-gray-600">
            <p className="font-semibold text-slate-800">Klinkers & Co</p>
            <p>Gouda en omstreken</p>
            <p>
              <a href="tel:0612345678" className="hover:text-orange-500 transition-colors">
                Tel: 06 - 12345678
              </a>
            </p>
            <p>
              <a href="mailto:info@klinkersenco.nl" className="hover:text-orange-500 transition-colors">
                Email: info@klinkersenco.nl
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <a href="/" className="inline-block mb-4">
            <Image
              src="/logo.png"
              alt="Klinkers & Co"
              width={160}
              height={45}
              className="h-12 w-auto"
            />
          </a>
          <p className="mb-4">Uw hovenier in Gouda en omstreken</p>
          <div className="flex justify-center gap-4 mb-4">
            <a href="tel:0612345678" className="hover:text-orange-400 transition-colors">
              Bellen
            </a>
            <span>|</span>
            <a href="mailto:info@klinkersenco.nl" className="hover:text-orange-400 transition-colors">
              E-mail
            </a>
            <span>|</span>
            <a href="#contact" className="hover:text-orange-400 transition-colors">
              Contact
            </a>
          </div>
          <p className="text-sm text-gray-500">
            &copy; 2025 Klinkers & Co - Specialist in tuinaanleg en bestrating
          </p>
        </div>
      </footer>
    </div>
  );
}
