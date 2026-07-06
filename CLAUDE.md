# Invarianten offertegenerator (nooit schenden)
- De AI-laag genereert NOOIT prijzen of hoeveelheden die niet in de notities staan.
- De rekenlag (assemblies, formules, pricing) bevat GEEN AI-beslissingen.
- Geld is altijd in centen (zie src/lib/money.ts).
- Onzekerheid wordt altijd een flag, nooit een stille default of fuzzy gok.
- Een offerte met blocking flags kan niet verstuurd worden.
- Faal hard, gok nooit.

# Werkwijze
- Volg UITVOERPLAN.md taak voor taak, in volgorde.
- Na elke taak: npx vitest run moet groen zijn, dan één commit met de taaknaam.
- Verwijder oude code pas nadat de vervanging getest is.
- Ga nooit door naar de volgende taak zonder dat het acceptatiecriterium aantoonbaar gehaald is.
