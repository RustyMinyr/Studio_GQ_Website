import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getTursoClient, getTursoConfig } from '@/lib/turso';

export function clientKey(request: NextRequest) {
  // Traefik must overwrite/append the real peer and reject untrusted forwarded headers.
  // Never trust cf-connecting-ip supplied by a client hitting this direct origin.
  const ip = process.env.TRUST_COOLIFY_PROXY === '1'
    ? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    : process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : null;
  return createHash('sha256').update(`${process.env.CREW_SESSION_SECRET ?? ''}:${ip || 'anonymous'}`).digest('hex');
}

export async function crewLoginRateLimit(request: NextRequest) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const config = getTursoConfig();
  if (!config?.local) return null;
  const client = getTursoClient(config);
  try {
    await client.execute('create table if not exists studio_security_limits (key text primary key, count integer not null, reset_at integer not null)');
    const result = await client.batch([
      {sql:'delete from studio_security_limits where reset_at <= ?',args:[now]},
      {sql:'insert into studio_security_limits (key,count,reset_at) values (?,1,?) on conflict(key) do update set count=count+1 returning count,reset_at',args:[clientKey(request),now+windowMs]},
    ],'write');
    const row = result[1].rows[0] as Record<string, unknown>;
    return {allowed:Number(row.count)<=8,resetSeconds:Math.max(1,Math.ceil((Number(row.reset_at)-now)/1000))};
  } catch {
    // Keep login closed if its persistent abuse protection cannot be read.
    return {allowed:false,resetSeconds:60};
  } finally {client.close();}
}
