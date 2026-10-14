import type { Incident, Scene } from './types.ts';
const scene = (id: string, role: Scene['role'], department: Scene['department'], text: string, previewMs = 7000): Scene => ({ id, role, department, text, previewMs });
export const incidents: Incident[] = [
  { id: 'biscuit', number: '2026-0007', title: 'Biscuit Doob Gaya', hindi: 'चाय में शहीद।', description: 'One dip too many. One biscuit missing. A nation on the edge.', severity: 'CODE: SOGGY', exhibit: 'biscuit', verdict: 'Guilty of over-dipping.', resolution: 'चम्मच को rescue medal. अगला बिस्किट केवल दो seconds डुबोइए।', scenes: [
    scene('biscuit-01', 'operator', 'Incoming call', 'Bawaal Bureau, emergency desk. Sir, शांत रहिए। बिस्किट आख़िरी बार कब देखा गया था?'),
    scene('biscuit-02', 'investigator', 'Investigation', 'Case number 2026-0007. बिस्किट तीन seconds डूबा था? Sir, ये dipping नहीं, underwater posting है।'),
    scene('biscuit-03', 'investigator', 'Investigation', 'चाय की सतह पर crumbs मिले हैं। बिस्किट का कोई नाम था? Parle जी? ठीक है, परिवार को सूचित करो।'),
    scene('biscuit-04', 'command', 'Escalation', 'पूरा department alert कर दो! अगली चुस्की रोकिए। चम्मच उतारो! ये tea break नहीं, rescue operation है!'),
    scene('biscuit-05', 'reporter', 'Breaking news', 'ब्रेकिंग न्यूज़! एक मासूम बिस्किट चाय में लापता! कप के बाहर तनाव। अंदर अदरक की वजह से visibility कम!'),
    scene('biscuit-06', 'announcer', 'Verdict', 'दोषी पाया गया है... over-dipping. चम्मच को rescue medal दिया जाएगा। परिवार को नया packet मिले। मामला बंद।'),
  ] },
  { id: 'five-minutes', number: '2026-0008', title: 'Bas 5 Minute', hindi: 'समय एक अफ़वाह है।', description: 'Your friend said five minutes. That was forty-five minutes ago.', severity: 'CODE: STILL COMING', exhibit: 'clock', verdict: 'Five minutes. Life imprisonment.', resolution: 'दोस्त का ETA अब calendar में मापा जाएगा। आप समोसा खा सकते हैं।', scenes: [
    scene('late-01', 'operator', 'Incoming call', 'आपके दोस्त ने बस पाँच minute कहा था? पैंतालीस हो गए? शांत रहिए। ये हमारा सबसे पुराना cold case है।'),
    scene('late-02', 'investigator', 'Investigation', 'Last location: बस निकल रहा हूँ। Background में shower की आवाज़ थी। Suspect अभी towel phase में है।'),
    scene('late-03', 'investigator', 'Investigation', 'उसने रास्ते में हूँ भी कहा? किस रास्ते में? Bedroom से bathroom वाला? बयान में बड़ा मोड़ आया है।'),
    scene('late-04', 'command', 'Escalation', 'सभी घड़ियाँ जब्त करो! पाँच minute को राष्ट्रीय स्तर पर unreliable घोषित करो। समोसा ठंडा नहीं होना चाहिए!'),
    scene('late-05', 'reporter', 'Breaking news', 'बड़ी ख़बर! दोस्त के पाँच minute में तीन मौसम गुज़र गए! इंतज़ार कर रहे युवक को bench से स्थायी पता मिला!'),
    scene('late-06', 'announcer', 'Verdict', 'फैसला: दोस्त का ETA अब calendar में मापा जाएगा। पीड़ित अपना समोसा खा सकता है। दोस्त की चटनी जब्त।'),
  ] },
  { id: 'full-name', number: '2026-0009', title: 'Mummy Used My Full Name', hindi: 'घर में high alert।', description: 'First name. Middle name. Surname. This is not a drill.', severity: 'CODE: BETA RUN', exhibit: 'name', verdict: 'Jurisdiction: Mummy.', resolution: 'Bureau की powers यहीं समाप्त। चुपचाप बर्तन धो दीजिए।', scenes: [
    scene('name-01', 'operator', 'Incoming call', 'Mummy ने पूरा नाम लिया? Surname भी? Sir, speaker पर मत डालिए। हमारा भी परिवार है।'),
    scene('name-02', 'investigator', 'Investigation', 'जाँच में तीन missed calls और sink में एक plate मिली है। दोनों घटनाएँ जुड़ी हो सकती हैं।'),
    scene('name-03', 'investigator', 'Investigation', 'उन्होंने नीचे आओ कहा? आवाज़ शांत थी? ये और गंभीर है। ग़ुस्सा अब silent mode में है।'),
    scene('name-04', 'command', 'Escalation', 'Gaming बंद करो! सारे excuses वापस लो! Operation बर्तन धो शुरू करो। अभी sorry बोलो, कारण बाद में जानेंगे!'),
    scene('name-05', 'reporter', 'Breaking news', 'ब्रेकिंग न्यूज़! घर में पूरा नाम गूँजा! Papa ने अख़बार के पीछे शरण ली। छोटे भाई ने popcorn निकाल लिया!'),
    scene('name-06', 'announcer', 'Verdict', 'इस मामले में सर्वोच्च authority Mummy हैं। Bureau की powers यहीं समाप्त। चुपचाप बर्तन धो दीजिए। जय माता दी।'),
  ] },
];
