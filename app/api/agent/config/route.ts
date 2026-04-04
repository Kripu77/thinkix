import { getClientAIConfig } from '@thinkix/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(getClientAIConfig(process.env));
}
