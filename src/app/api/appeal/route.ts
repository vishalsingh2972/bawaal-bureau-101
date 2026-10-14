import { generateAppeal } from '@/lib/server/brain';
import { plainText } from '@/lib/crisis';
import { liveError, liveJson, protectLiveRequest } from '@/lib/server/live-request';
export const runtime = 'nodejs';
export const maxDuration = 35;
export async function POST(request: Request) {
  try { protectLiveRequest(request, 'appeal'); const body = await liveJson(request); const comeback = await generateAppeal(plainText(body?.complaint, 160), plainText(body?.verdict, 160, 'Verdict'), plainText(body?.defence, 160, 'Defence'), request.signal); return Response.json({ comeback }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return liveError(error); }
}
