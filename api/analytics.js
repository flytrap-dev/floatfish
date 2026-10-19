// GET /api/analytics  →  {
//   totals: { signIns7d, signIns30d, signInsAll, estimatedUsd, uniqueUsers },
//   byDay: [{ date, count }],      // last 14 days, zero-filled
//   byClient: [{ clientId, name, totalSignIns, todaySignIns, estimatedUsd }],
//   recent: [{ at, username, clientId, clientName }],
// }
//
// Billing model: COST_PER_SIGNIN per /oauth/token exchange. Trivial to swap.

import { store } from "./_store.js";
import { readSession } from "./_session.js";

const COST_PER_SIGNIN = 0.01; // $0.01 per successful sign-in

function dayKey(d) {
  return d.toISOString().slice(0, 10);
}

function zeroFill(byDay, days = 14) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = dayKey(d);
    out.push({ date: k, count: byDay[k] || 0 });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const sess = readSession(req);
  if (!sess) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const uid = sess.sub;

  const ids = await store.listSet(`user:${uid}:keys`);
  const perClient = await Promise.all(
    ids.map(async (id) => {
      const k = await store.get(`key:${id}`);
      const s = (await store.get(`key:${id}:stats`)) || {
        totalSignIns: 0,
        todaySignIns: 0,
        byDay: {},
      };
      return k ? {
        clientId: id,
        name: k.name,
        totalSignIns: s.totalSignIns,
        todaySignIns: s.todaySignIns,
        estimatedUsd: +(s.totalSignIns * COST_PER_SIGNIN).toFixed(2),
        byDay: s.byDay || {},
      } : null;
    })
  );
  const clients = perClient.filter(Boolean);

  // Aggregate per-day across all clients.
  const combinedByDay = {};
  for (const c of clients) {
    for (const [d, n] of Object.entries(c.byDay)) {
      combinedByDay[d] = (combinedByDay[d] || 0) + n;
    }
  }
  const byDay = zeroFill(combinedByDay, 14);

  const signInsAll = clients.reduce((a, c) => a + c.totalSignIns, 0);
  const signIns7d = byDay.slice(-7).reduce((a, x) => a + x.count, 0);
  const signIns30d = Object.values(combinedByDay).reduce((a, n) => a + n, 0);

  const recent = (await store.get(`user:${uid}:recent`)) || [];
  const uniqueUsers = new Set(recent.map((r) => r.sub)).size;

  res.status(200).json({
    totals: {
      signIns7d,
      signIns30d,
      signInsAll,
      estimatedUsd: +(signInsAll * COST_PER_SIGNIN).toFixed(2),
      uniqueUsers,
      costModel: `$${COST_PER_SIGNIN.toFixed(2)} per sign-in`,
    },
    byDay,
    byClient: clients.map(({ byDay: _b, ...rest }) => rest),
    recent: recent.map((r) => ({
      at: r.at,
      username: r.username,
      clientId: r.clientId,
      clientName: r.clientName,
    })),
  });
}
