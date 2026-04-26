function slotKey(slot) {
  return `${slot.start}-${slot.end}`;
}

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map((x) => Number(x));
  return h * 60 + m;
}

function isConsecutive(keys) {
  for (let i = 1; i < keys.length; i++) {
    const [prevStart, prevEnd] = keys[i - 1].split('-');
    const [curStart] = keys[i].split('-');
    if (prevEnd !== curStart) return false;
    if (timeToMinutes(curStart) <= timeToMinutes(prevStart)) return false;
  }
  return true;
}

/**
 * @param {Object} input
 * @param {Array<{id:string,name:string}>} input.courts
 * @param {Record<string, Array<{start:string,end:string,available:boolean,price_cents:number}>>} input.slotsByCourtId
 * @param {Array<string>} input.desiredKeys - array of "HH:mm-HH:mm"
 * @returns {{
 *  ok: boolean,
 *  reason?: string,
 *  assignedCourtId?: string,
 *  segments?: Array<{courtId: string, keys: string[]}>,
 *  total_cents?: number,
 *  warnings?: string[],
 *  unavailableKeys?: string[]
 * }}
 */
export function autoAssignCourt({ courts, slotsByCourtId, desiredKeys }) {
  const keys = (desiredKeys ?? []).slice();
  if (!keys.length) return { ok: false, reason: 'empty' };
  if (!isConsecutive(keys)) return { ok: false, reason: 'non_consecutive' };

  const availableKeysByCourt = new Map();
  const priceByKey = new Map();

  for (const c of courts ?? []) {
    const slots = slotsByCourtId?.[c.id] ?? [];
    const set = new Set();
    for (const s of slots) {
      const k = slotKey(s);
      if (!priceByKey.has(k)) priceByKey.set(k, s.price_cents ?? 0);
      if (s.available) set.add(k);
    }
    availableKeysByCourt.set(c.id, set);
  }

  // Full-court candidates (no movement)
  const candidates = [];
  for (const c of courts ?? []) {
    const set = availableKeysByCourt.get(c.id) ?? new Set();
    const coversAll = keys.every((k) => set.has(k));
    if (!coversAll) continue;

    // score: longer run starting at first key + total available count
    let run = 0;
    for (const k of keys) {
      if (set.has(k)) run += 1;
      else break;
    }
    candidates.push({ courtId: c.id, run, totalAvail: set.size });
  }

  const total_cents = keys.reduce((sum, k) => sum + (priceByKey.get(k) ?? 0), 0);

  if (candidates.length) {
    candidates.sort((a, b) => (b.run - a.run) || (b.totalAvail - a.totalAvail));
    return { ok: true, assignedCourtId: candidates[0].courtId, segments: [{ courtId: candidates[0].courtId, keys }], total_cents };
  }

  // If cannot cover all keys with one court, attempt multi-court segmentation.
  // First detect truly unavailable keys.
  const availableCourtsByKey = new Map();
  for (const k of keys) {
    const courtsForKey = [];
    for (const c of courts ?? []) {
      const set = availableKeysByCourt.get(c.id) ?? new Set();
      if (set.has(k)) courtsForKey.push(c.id);
    }
    availableCourtsByKey.set(k, courtsForKey);
  }

  const unavailableKeys = keys.filter((k) => (availableCourtsByKey.get(k) ?? []).length === 0);
  if (unavailableKeys.length) {
    return { ok: false, reason: 'unavailable', unavailableKeys };
  }

  // Greedy: pick the court that covers the longest consecutive run from current index.
  const segments = [];
  let i = 0;
  while (i < keys.length) {
    let bestCourt = null;
    let bestLen = 0;

    const candidatesCourts = availableCourtsByKey.get(keys[i]) ?? [];
    for (const courtId of candidatesCourts) {
      const set = availableKeysByCourt.get(courtId) ?? new Set();
      let len = 0;
      for (let j = i; j < keys.length; j++) {
        if (set.has(keys[j])) len += 1;
        else break;
      }
      if (len > bestLen) {
        bestLen = len;
        bestCourt = courtId;
      }
    }

    if (!bestCourt || bestLen === 0) {
      return { ok: false, reason: 'unexpected' };
    }

    const segKeys = keys.slice(i, i + bestLen);
    segments.push({ courtId: bestCourt, keys: segKeys });
    i += bestLen;
  }

  const warnings = [
    'Lưu ý: Không có sân nào trống liên tục cho toàn bộ thời gian bạn chọn.',
    `Để đảm bảo lịch chơi, bạn sẽ cần di chuyển qua ${segments.length} sân khác nhau trong suốt buổi tập.`,
  ];

  return { ok: true, segments, total_cents, warnings };
}

