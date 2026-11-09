// Scenario, doctor and scoring content for SBARR Zorgsim.
// Each scoring rule is [label shown in feedback, regex source tested against the student's text].
window.SBARR = {
  SCENARIOS: [
    { ctx: "VERPLEEGHUIS", title: "Koorts en verwardheid", pat: "Mevr. De Vries, 84, kamer 12",
      talk: "Mevr. De Vries: 'Ik heb het zo koud... en het brandt als ik moet plassen. Waar is mijn dochter? Welke dag is het eigenlijk?'",
      order: "Start 2 liter zuurstof, neem urinekweek en bloedkweken af. Geef geen penicilline, ik geef later een alternatief antibioticum door. Controleer elk uur de vitale functies.",
      clues: [
        { n: "Mevrouw", t: "Mevr. is sinds vanochtend nieuw verward en slaperig. Ze heeft rillingen en voelt warm aan." },
        { n: "Monitor", t: "Temp 38,9. Pols 104. RR 105/60. AF 22. Saturatie 91% op kamerlucht." },
        { n: "Dossier", t: "Bekend met COPD en milde dementie. Allergie: penicilline. Reanimatiebeleid: niet reanimeren." },
        { n: "Medicatiekar", t: "Gebruikt tiotropium inhalatie en paracetamol 4x daags 1 g. Laatste paracetamol om 06.00 uur." },
        { n: "Urinezak", t: "Urine is troebel en riekt sterk. Slechts 150 ml in 8 uur." },
        { n: "Telefoonlijst", t: "Dienstdoende arts is bereikbaar. Familie wil dat mevr. zo mogelijk in het verpleeghuis blijft." }],
      S: [["naam/mevrouw", "de vries|mevr"], ["kamer 12", "kamer 12|12"], ["koorts", "koorts|38[,.]9|temperatuur"], ["verwardheid", "verward"], ["saturatie", "saturatie|91"], ["klacht branderig plassen", "brand|plas"]],
      B: [["COPD", "copd"], ["dementie", "dement"], ["penicilline-allergie", "penicilline|allergie"], ["medicatie", "paracetamol|tiotropium|medicatie"]],
      A: [["bloeddruk", "105|bloeddruk"], ["pols", "104|pols|hartslag"], ["ademfrequentie", "22|ademfrequentie"], ["saturatie 91%", "91|saturatie"], ["urine troebel", "troebel|urine"]],
      R: [["beoordeling aanvragen", "beoordel|komen|kijken|langs"], ["kweken/antibiotica", "antibiotica|kweek|lab"], ["zuurstof", "zuurstof|o2"], ["reanimatiebeleid", "dnr|reanim"]],
      X: [["2 liter zuurstof", "2 liter|2l|zuurstof"], ["kweken afnemen", "kweek"], ["geen penicilline", "penicilline|alternatief"], ["elk uur controleren", "uur|controle"]] },
    { ctx: "ZIEKENHUIS", title: "Bloeding na operatie", pat: "Dhr. Bakker, 67, bed 4",
      talk: "Dhr. Bakker: 'Het gaat niet goed, zuster. Ik ben misselijk, mijn hart bonkt en mijn been voelt warm en nat aan.'",
      order: "Spoed Hb prikken en kruisbloed aanvragen. Hang een extra liter NaCl. Geef de antistolling niet. Ik ben er binnen een kwartier.",
      clues: [
        { n: "Meneer", t: "Dhr. Bakker is bleek, zweterig en duizelig. Hij klaagt over toenemende pijn in de heup." },
        { n: "Monitor", t: "RR 88/50. Pols 118. AF 20. Saturatie 96%. Temp 37,4." },
        { n: "Drain", t: "Verband is doorbloed. Drain: 400 ml helder rood bloed in 2 uur." },
        { n: "Status", t: "Heupprothese gisteren 14.00 uur. Gebruikt apixaban (bloedverdunner) vanwege boezemfibrilleren, laatste dosis gisteren 20.00 uur." },
        { n: "Labkaart", t: "Hb gisteren na de operatie 7,9 mmol/l. Vanochtend nog niet geprikt." },
        { n: "Infuus", t: "1 liter NaCl loopt. Bloedgroep bekend, kruisbloed niet aangevraagd." }],
      S: [["naam", "bakker|meneer|dhr"], ["bed 4", "bed 4|4"], ["heup/pijn", "heup|pijn"], ["bleek/duizelig", "bleek|duizelig|zweet"], ["misselijk/hartkloppingen", "misselijk|bonk|hartklop"]],
      B: [["heupprothese", "prothese|operatie"], ["dag 1", "dag 1|gisteren"], ["bloedverdunner", "apixaban|bloedverdunner|antistolling"], ["Hb 7,9", "hb|7,9|7.9"]],
      A: [["bloeddruk 88/50", "88"], ["pols 118", "118|pols|hartslag"], ["drain 400 ml", "drain|400"], ["verband doorbloed", "verband|doorbloed"], ["saturatie", "96|saturatie"]],
      R: [["beoordeling", "kom|beoordel|kijken"], ["Hb/kruisbloed", "kruisbloed|hb|bloed"], ["vocht/infuus", "infuus|vocht|nacl"], ["antistolling", "antistolling|apixaban|stop"]],
      X: [["Hb/kruisbloed", "hb|bloed"], ["extra vocht", "vocht|nacl|infuus"], ["antistolling niet geven", "antistolling|apixaban"], ["binnen een kwartier", "kwartier|15"]] },
    { ctx: "SPOEDEISENDE HULP", title: "Pijn op de borst", pat: "Mevr. Yilmaz, 58, kamer 3",
      talk: "Mevr. Yilmaz: 'Het voelt alsof er een olifant op mijn borst zit. Het trekt naar mijn kaak en ik ben zo bang...'",
      order: "Laat haar 300 mg aspirine kauwen, zet een infuus en neem troponine af. Ik bel de cardioloog.",
      clues: [
        { n: "Mevrouw", t: "Pijn op de borst sinds 14.10 uur, uitstralend naar de linkerarm. Ze is zweterig en misselijk." },
        { n: "Monitor", t: "RR 150/90. Pols 96. AF 18. Saturatie 97%." },
        { n: "ECG", t: "ECG gemaakt: ST-elevatie in V2 tot en met V4." },
        { n: "Intake", t: "Diabetes type 2, hypertensie, rookt. Geen allergieen bekend." },
        { n: "Medicatielijst", t: "Gebruikt metformine en amlodipine. Aspirine nog niet gegeven." },
        { n: "Balie", t: "Cardioloog is in het huis. Dochter wacht in de wachtkamer." }],
      S: [["naam", "yilmaz|mevr"], ["pijn op de borst", "borst|pijn"], ["sinds 14.10", "14.10|14:10|sinds"], ["zweterig", "zweet|misselijk"], ["uitstraling kaak/angst", "kaak|olifant|bang|arm"]],
      B: [["diabetes", "diabetes"], ["hypertensie", "hypertensie"], ["roker", "rook"], ["medicatie", "metformine|amlodipine|medicatie"], ["geen allergie", "allergie"]],
      A: [["ECG ST-elevatie", "st|ecg"], ["bloeddruk 150/90", "150|bloeddruk"], ["pols 96", "96|pols"], ["saturatie 97%", "97|saturatie"]],
      R: [["direct beoordelen", "direct|kom|beoordel"], ["cardioloog", "cardio"], ["aspirine", "aspirine"], ["troponine/infuus", "troponine|infuus|lab"]],
      X: [["300 mg aspirine", "aspirine|300"], ["infuus", "infuus"], ["troponine", "troponine|bloed"], ["cardioloog", "cardio"]] }
  ],

  DOCTORS: [
    { name: "DR. VRIENDELIJK", img: "assets/doctor-vriendelijk.png", desc: "Rustig, stelt open vragen", intro: "Dag, ik luister. Vertel eens, wat is er aan de hand?", ask: "Kun je me iets meer vertellen over", good: "Dank je, een helder verhaal.", bad: "Ik mis nog wat, maar we komen er samen wel uit." },
    { name: "DR. HAASTIG", img: "assets/doctor-haastig.png", desc: "Onderbreekt, wil het kort", intro: "Ja, snel graag, ik sta in de gang. Waar gaat het om?", ask: "Ik heb geen tijd. Geef me nu kort", good: "Goed, korte lijnen. Prima.", bad: "Dat kan scherper. Eerst de kern, dan de rest." },
    { name: "DR. STRENG", img: "assets/doctor-streng.png", desc: "Veeleisend, wil cijfers", intro: "Ik hoop dat je voorbereid bent. Begin.", ask: "Dat is onvoldoende. Ik wil exact weten", good: "Dit is hoe het hoort. Compleet.", bad: "Dit is niet wat ik van een overdracht verwacht. Probeer het gestructureerd." },
    { name: "DR. ONERVAREN", img: "assets/doctor-onervaren.png", desc: "Onzeker, vraagt veel door", intro: "Eh, ja, hallo? Ik ben nieuw hier. Wat moet ik weten?", ask: "Sorry, kun je uitleggen wat je bedoelt met", good: "Oké, dat snap ik, dank je wel.", bad: "Ik weet het even niet zeker, kun je het nog eens doorlopen?" }
  ],

  // SBARR elements; X is the read-back, shown with the letter R.
  ELEMENTS: [["S", "Situatie"], ["B", "Achtergrond"], ["A", "Beoordeling"], ["R", "Aanbeveling"], ["X", "Read-back"]],

  HINTS: {
    S: "Wie ben je, welke patiënt, wat is het probleem?",
    B: "Voorgeschiedenis, medicatie, allergieen",
    A: "Vitale functies en wat jij ervan vindt",
    R: "Wat vraag je van de arts?"
  }
};
