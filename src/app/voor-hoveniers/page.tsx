'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  FileText,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Shield,
  TrendingUp,
  Phone,
  Mail,
  X,
  Sparkles,
  Calculator,
  Send,
  BarChart3
} from 'lucide-react';

export default function VoorHoveniersPage() {
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Replace with your actual video URL
  const demoVideoUrl = ''; // Example: 'https://www.youtube.com/embed/VIDEO_ID' or 'https://player.vimeo.com/video/VIDEO_ID'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you could send to an API endpoint
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-800">
            Klinkers & Co <span className="text-orange-500">Software</span>
          </Link>
          <Button
            onClick={() => setShowContactForm(true)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Gratis Demo Aanvragen
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Gebouwd door een hovenier, voor hoveniers
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Stop met uren besteden aan{' '}
              <span className="text-orange-500">offertes</span> en{' '}
              <span className="text-orange-500">administratie</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Het complete systeem dat automatisch leads opvangt, met AI offertes genereert,
              en klanten online laat accepteren. Speciaal ontwikkeld voor hoveniersbedrijven.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => setShowContactForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-lg px-8"
              >
                Gratis Demo Aanvragen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800 text-lg"
                onClick={() => document.getElementById('demo-video')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-5 h-5 mr-2" />
                Bekijk Demo Video
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Herkenbaar?
            </h2>
            <p className="text-xl text-slate-600">
              Dit zijn de problemen waar iedere hovenier tegenaan loopt
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "'s Avonds nog offertes maken",
                description: "Na een lange dag buiten nog achter de laptop om offertes uit te typen. Terwijl je eigenlijk bij je gezin wilt zijn."
              },
              {
                icon: MessageSquare,
                title: "Leads die weglekken",
                description: "Mensen bellen of mailen, maar in de drukte vergeet je terug te bellen. Die klus gaat naar de concurrent."
              },
              {
                icon: FileText,
                title: "Offertes in Word of Excel",
                description: "Elke offerte handmatig opmaken. Copy-paste fouten. Geen overzicht van wat er uitstaat."
              },
              {
                icon: Phone,
                title: "WhatsApp chaos",
                description: "Klantgesprekken verspreid over 10 verschillende chats. Wie had ook alweer een offerte nodig?"
              },
              {
                icon: Users,
                title: "Geen klantoverzicht",
                description: "Klantgegevens in je hoofd, op briefjes, of ergens in je telefoon. Onvindbaar als je het nodig hebt."
              },
              {
                icon: TrendingUp,
                title: "Geen inzicht in je bedrijf",
                description: "Hoeveel offertes staan er uit? Wat is je conversie? Geen idee - je runt op gevoel."
              }
            ].map((problem, i) => (
              <Card key={i} className="border-red-100 bg-red-50/50">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <problem.icon className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{problem.title}</h3>
                  <p className="text-slate-600">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              De Oplossing
            </h2>
            <p className="text-xl text-slate-600">
              Eén systeem dat alles voor je regelt
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: MessageSquare,
                  title: "AI Chat vangt leads op",
                  description: "24/7 een slimme chatbot op je website die vragen beantwoordt en contactgegevens verzamelt. Jij wordt genotificeerd, de lead staat klaar."
                },
                {
                  icon: Calculator,
                  title: "AI genereert offertes",
                  description: "Beschrijf de klus in je eigen woorden. De AI berekent automatisch materialen, uren en prijzen. Offerte klaar in 2 minuten."
                },
                {
                  icon: Send,
                  title: "Klant accepteert online",
                  description: "Professionele PDF + online acceptatielink. Klant klikt op 'Akkoord' en je hebt de opdracht binnen. Geen gedoe met printen of scannen."
                },
                {
                  icon: BarChart3,
                  title: "Volledig overzicht",
                  description: "Dashboard met al je leads, offertes en projecten. Weet precies wat er speelt in je bedrijf."
                }
              ].map((solution, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <solution.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">{solution.title}</h3>
                    <p className="text-slate-600">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 lg:p-12">
              <div className="text-center">
                <div className="text-6xl font-bold text-orange-500 mb-2">5+</div>
                <div className="text-xl text-slate-700 mb-6">uur per week besparen</div>
                <div className="space-y-3 text-left">
                  {[
                    "Geen offertes meer typen 's avonds",
                    "Geen leads meer vergeten",
                    "Geen Excel-gedoe meer",
                    "Professionele uitstraling naar klanten"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo-video" className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Zie het in actie
            </h2>
            <p className="text-xl text-slate-400">
              In 5 minuten zie je precies hoe het werkt
            </p>
          </div>

          <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
            {demoVideoUrl ? (
              <iframe
                src={demoVideoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Product Demo"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <Play className="w-16 h-16 mb-4" />
                <p className="text-lg">Demo video komt binnenkort</p>
                <p className="text-sm mt-2">Vraag een live demo aan voor nu</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Alle Features
            </h2>
            <p className="text-xl text-slate-600">
              Alles wat je nodig hebt in één pakket
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "AI Chatbot",
                description: "Slimme chat op je website die vragen beantwoordt over jouw diensten en leads verzamelt."
              },
              {
                icon: Sparkles,
                title: "AI Offerte Generator",
                description: "Beschrijf de klus, AI berekent materialen en prijzen automatisch op basis van jouw tarieven."
              },
              {
                icon: FileText,
                title: "Professionele PDF Offertes",
                description: "Mooi opgemaakte offertes met jouw logo en bedrijfsgegevens. Direct te downloaden of mailen."
              },
              {
                icon: CheckCircle,
                title: "Online Acceptatie",
                description: "Klanten accepteren of wijzen af via een link. Geen printen, scannen of heen-en-weer mailen."
              },
              {
                icon: Users,
                title: "Lead & Klant Beheer",
                description: "Alle klantgegevens op één plek. Contacthistorie, offertes en notities overzichtelijk bij elkaar."
              },
              {
                icon: BarChart3,
                title: "Dashboard & Statistieken",
                description: "Zie in één oogopslag: openstaande offertes, nieuwe leads, omzet deze maand."
              },
              {
                icon: Zap,
                title: "Snel & Eenvoudig",
                description: "Geen cursus nodig. Intuïtieve interface die je binnen 10 minuten begrijpt."
              },
              {
                icon: Shield,
                title: "Veilig & Betrouwbaar",
                description: "Je data staat veilig in de cloud. Altijd en overal toegang, ook op je telefoon."
              },
              {
                icon: TrendingUp,
                title: "Prijzen Database",
                description: "Beheer je eigen prijzen voor materialen en werkzaamheden. AI gebruikt deze voor offertes."
              }
            ].map((feature, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Gebouwd vanuit de praktijk
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-8 lg:p-12">
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                  "Ik ben zelf hovenier in Gouda. Na jaren van 's avonds offertes typen,
                  leads vergeten en chaos in mijn administratie, besloot ik het anders aan te pakken.
                </p>
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                  Ik heb dit systeem gebouwd voor mijn eigen bedrijf. Het bespaart me uren per week
                  en mijn klanten zijn onder de indruk van de professionele aanpak.
                </p>
                <p className="text-lg text-slate-700 leading-relaxed">
                  Nu wil ik andere hoveniers helpen om ook slimmer te werken - niet harder."
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 font-bold text-xl">
                    N
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Niek</div>
                    <div className="text-slate-600">Eigenaar Klinkers & Co</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Klaar om slimmer te werken?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Vraag een gratis demo aan en ontdek hoe dit systeem jouw hoveniersbedrijf kan transformeren.
          </p>
          <Button
            size="lg"
            onClick={() => setShowContactForm(true)}
            className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8"
          >
            Gratis Demo Aanvragen
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="mt-4 text-orange-200 text-sm">
            Geen verplichtingen • Persoonlijke demo • Antwoord binnen 24 uur
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-800 mb-12 text-center">
            Veelgestelde Vragen
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Wat kost het?",
                a: "We hanteren een maandelijks abonnement. De exacte prijs bespreken we tijdens de demo, zodat we een pakket kunnen samenstellen dat past bij jouw bedrijf."
              },
              {
                q: "Moet ik technisch zijn?",
                a: "Absoluut niet. Als je een smartphone kunt gebruiken, kun je dit ook. We helpen je met de setup en geven een persoonlijke uitleg."
              },
              {
                q: "Kan ik mijn eigen prijzen invoeren?",
                a: "Ja, je beheert je eigen prijzen database. De AI gebruikt jouw tarieven voor materialen en uurlonen om offertes te berekenen."
              },
              {
                q: "Werkt het op mijn telefoon?",
                a: "Ja, het systeem werkt in elke browser - ook op je telefoon of tablet. Zo kun je onderweg snel een offerte maken of leads checken."
              },
              {
                q: "Hoe zit het met mijn huidige klantgegevens?",
                a: "We kunnen bestaande klantgegevens importeren. Dit bespreken we tijdens de setup."
              },
              {
                q: "Is er een contract of opzegtermijn?",
                a: "Maandelijks opzegbaar. Geen langlopende contracten. Je zit nergens aan vast."
              }
            ].map((faq, i) => (
              <div key={i} className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-xl font-bold mb-2">Klinkers & Co Software</div>
              <p className="text-slate-400">Het slimme systeem voor hoveniers</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="mailto:info@klinkersenco.nl" className="flex items-center gap-2 text-slate-400 hover:text-white">
                <Mail className="w-5 h-5" />
                info@klinkersenco.nl
              </a>
              <a href="tel:0653967819" className="flex items-center gap-2 text-slate-400 hover:text-white">
                <Phone className="w-5 h-5" />
                06 53 96 78 19
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Klinkers & Co. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Gratis Demo Aanvragen</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-800 mb-2">Aanvraag ontvangen!</h4>
                  <p className="text-slate-600">
                    Ik neem binnen 24 uur contact met je op om een demo in te plannen.
                  </p>
                  <Button
                    onClick={() => {
                      setShowContactForm(false);
                      setFormSubmitted(false);
                    }}
                    className="mt-6"
                  >
                    Sluiten
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Naam *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jouw naam"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Bedrijfsnaam</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Je hoveniersbedrijf"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email *</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jouw@email.nl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Telefoonnummer</label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12345678"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Bericht (optioneel)</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Vertel iets over je bedrijf of stel een vraag..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                    Demo Aanvragen
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Ik neem binnen 24 uur contact met je op
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
