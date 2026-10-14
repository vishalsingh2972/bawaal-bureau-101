import manifestData from '../../public/audio/manifest.json';
import { inputKey, type AudioManifest } from './tts';
import { sceneRequest } from './case-director';
import type { Incident } from './types';
const manifest = manifestData as AudioManifest;
export function measuredCaseDuration(incident: Incident): number | null {
  let duration = 0;
  for (const [index, scene] of incident.scenes.entries()) {
    const entry = manifest.clips[scene.id];
    if (!entry?.durationSeconds || inputKey(entry.input) !== inputKey(sceneRequest(incident, index).input)) return null;
    duration += entry.durationSeconds;
  }
  return duration;
}
