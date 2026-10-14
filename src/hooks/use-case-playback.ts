'use client';
import { useEffect, useState } from 'react';
import { CaseDirector, emptyCase } from '@/lib/case-director';
import type { BulbulAudio } from './use-bulbul-audio';
export function useCasePlayback(audio: BulbulAudio) {
  const [state, setState] = useState(emptyCase);
  // Audio transport functions use refs, so the director can retain its initial adapter safely.
  const [director] = useState(() => new CaseDirector(audio, setState));
  useEffect(() => () => director.dispose(), [director]);
  return { state, director };
}
