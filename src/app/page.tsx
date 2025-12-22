import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-800 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold">
            <span className="text-orange-500">Klinkers</span>
            <span> & Co</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#diensten" className="hover:text-orange-400 transition-colors">Diensten</a>
            <a href="#waarom" className="hover:text-orange-400 transition-colors">Waarom Wij</a>
            <a href="#portfolio" className="hover:text-orange-400 transition-colors">Portfolio</a>
            <a href="#contact">
              <Button className="bg-orange-500 hover:bg-orange-600">Contact</Button>
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
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-lg px-8">
              Vraag Gratis Offerte Aan
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-slate-800">
              Bekijk Ons Werk
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
              <div className="h-48 bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-6xl">&#127793;</span>
              </div>
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
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                  Meer over tuinaanleg
                </Button>
              </CardContent>
            </Card>

            {/* Bestrating */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-6xl">&#129521;</span>
              </div>
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
                <Button className="w-full mt-6 bg-orange-500 hover:bg-orange-600">
                  Meer over bestrating
                </Button>
              </CardContent>
            </Card>

            {/* Schuttingen */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                <span className="text-6xl">&#127794;</span>
              </div>
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
                <Button className="w-full mt-6 bg-amber-600 hover:bg-amber-700">
                  Meer over schuttingen
                </Button>
              </CardContent>
            </Card>

            {/* Onderhoud */}
            <Card className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <span className="text-6xl">&#9986;</span>
              </div>
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
                <Button className="w-full mt-6 bg-slate-600 hover:bg-slate-700">
                  Meer over onderhoud
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
            <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8">
              Offerte Aanvragen
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-orange-500">
              06 - 12345678
            </Button>
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
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Naam *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Uw naam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefoon / Email *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Hoe kunnen we u bereiken?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Adres / Wijk</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Bijv. Bloemendaal, Gouda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Wat kunnen we voor u doen? *</label>
                  <textarea
                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-32"
                    placeholder="Beschrijf uw project of vraag..."
                  ></textarea>
                </div>

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6">
                  Verstuur Aanvraag
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-gray-600">
            <p className="font-semibold text-slate-800">Klinkers & Co</p>
            <p>Gouda en omstreken</p>
            <p>Tel: 06 - 12345678</p>
            <p>Email: info@klinkersenco.nl</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4">
            <span className="text-orange-500">Klinkers</span>
            <span className="text-white"> & Co</span>
          </div>
          <p className="mb-4">Uw hovenier in Gouda en omstreken</p>
          <p className="text-sm text-gray-500">
            &copy; 2025 Klinkers & Co - Specialist in tuinaanleg en bestrating
          </p>
        </div>
      </footer>
    </div>
  );
}
