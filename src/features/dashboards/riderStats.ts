import type { Ride } from "@/api/rides";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function startOfWeek(d: Date): number {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  return s.getTime();
}

export interface RiderStats {
  earningsToday: number;
  earningsWeek: number;
  ridesToday: number;
}

export function deriveRiderStats(rides: Ride[], nowMs: number): RiderStats {
  const dayStart = startOfDay(new Date(nowMs));
  const weekStart = startOfWeek(new Date(nowMs));
  let earningsToday = 0;
  let earningsWeek = 0;
  let ridesToday = 0;
  for (const r of rides) {
    if (r.status !== "completed" || !r.completedAt || !r.fare) continue;
    const t = new Date(r.completedAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= weekStart) earningsWeek += r.fare.amount;
    if (t >= dayStart) {
      earningsToday += r.fare.amount;
      ridesToday += 1;
    }
  }
  return { earningsToday, earningsWeek, ridesToday };
}

export function acceptanceRate(totalRides: number, missedRides: number): number {
  const denom = totalRides + missedRides;
  if (denom <= 0) return 100;
  return Math.round(100 - (missedRides / denom) * 100);
}
