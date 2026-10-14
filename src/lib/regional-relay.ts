import type { Incident } from './types.ts';
import { regionalVoices } from './voices.ts';
const lines = [
  { city: 'Delhi', languageName: 'Hindi', text: 'ब्रेकिंग न्यूज़! बिस्किट चाय में डूबा। अब कप को crime scene घोषित किया गया!', english: 'Biscuit drowned in chai. The cup is now a crime scene.' },
  { city: 'Hyderabad', languageName: 'Telugu', text: 'బిస్కెట్ చాయ్‌లో మునిగింది! చెంచా పంపండి. బిర్యానీ టీమ్‌ను ఇంకా పిలవొద్దు!', english: 'Send a spoon! Do not call the biryani team. Yet.' },
  { city: 'Chennai', languageName: 'Tamil', text: 'பிஸ்கட் டீயில் மூழ்கியது! மீட்புக்கு கரண்டி தயார். இட்லியை சாட்சியாக அழைக்காதீங்க!', english: 'Spoon ready for rescue. Do not summon idli as a witness.' },
  { city: 'Mumbai', languageName: 'Marathi', text: 'बिस्किट चहात बुडालं! चमचा रवाना झाला. ट्रॅफिकमुळे बचावकार्य थोडं उशिरा होईल!', english: 'Spoon dispatched. Traffic will delay the rescue.' },
  { city: 'Kolkata', languageName: 'Bengali', text: 'চায়ে বিস্কুট ডুবেছে! চামচ নিয়ে সভা বসেছে। উদ্ধার পরে হবে, আগে আরেক কাপ চা!', english: 'The spoon committee is meeting. Rescue later. Another chai first.' },
];
export const regionalRelay: Incident = {
  id: 'pan-india', number: 'BB-5-NEWSROOMS', title: 'Pan-India Bawaal', hindi: 'एक बिस्किट। पाँच newsrooms।', description: 'The same biscuit disaster, escalating across five fictional regional newsrooms.', severity: 'SPECIAL SCRIPTED BULBUL SHOWCASE', exhibit: 'biscuit', relay: true,
  verdict: 'Five newsrooms. Still no biscuit.', resolution: 'The spoon got transferred five times. The biscuit resigned.',
  scenes: lines.map((line, index) => ({ ...line, id: `relay-${index + 1}`, role: 'reporter', department: 'Breaking news', headline: `${line.city.toUpperCase()} / ${line.languageName.toUpperCase()} / ${regionalVoices[index].language}`, voice: regionalVoices[index] })),
};
