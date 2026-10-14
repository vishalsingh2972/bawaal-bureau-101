import { randomUUID } from 'node:crypto';
import { plainText, storyIncident } from '@/lib/crisis';
import { generateCrisis } from '@/lib/server/brain';
import { liveError, liveJson, protectLiveRequest } from '@/lib/server/live-request';
export const runtime = 'nodejs';
export const maxDuration = 35;
export async function POST(request: Request) {
  try { protectLiveRequest(request, 'crisis'); const body = await liveJson(request); const complaint = plainText(body?.complaint, 160); const story = await generateCrisis(complaint, request.signal); return Response.json({ incident: storyIncident(story, complaint, `live-${randomUUID().slice(0, 12)}`), model: 'sarvam-105b-conversations' }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return liveError(error); }
}
