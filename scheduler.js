/* scheduler.js — pure scheduling logic (no DOM). Works in browser and Node.
   Process: {id, at, bt, pr, file, op, file2}   op: 'none'|'read'|'write'
   Tie-break (all algorithms): arrival time, then input order (index). */
(function (root) {
  'use strict';

  const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

  /** Validate raw rows. Returns array of error strings (empty = valid). */
  function validate(procs) {
    const errs = [], seen = new Set();
    if (!procs.length) errs.push('Add at least one process.');
    procs.forEach((p, i) => {
      const n = `Row ${i + 1}`, id = String(p.id || '').trim();
      if (!id) errs.push(`${n}: Process ID is required.`);
      else if (seen.has(id.toLowerCase())) errs.push(`${n}: Process ID "${id}" is duplicated.`);
      seen.add(id.toLowerCase());
      if (!Number.isInteger(p.at) || p.at < 0) errs.push(`${n} (${id}): Arrival time must be a non-negative integer.`);
      if (!Number.isInteger(p.bt) || p.bt <= 0) errs.push(`${n} (${id}): Burst time must be a positive integer.`);
      if (!Number.isInteger(p.pr)) errs.push(`${n} (${id}): Priority must be an integer.`);
    });
    return errs;
  }

  /** Append a segment, merging with the previous one if same process and contiguous. */
  function push(tl, id, s, e) {
    const last = tl[tl.length - 1];
    if (last && last.id === id && last.end === s) last.end = e; else tl.push({ id, start: s, end: e });
  }

  // Non-preemptive: FCFS, SJN, priority. keyFn defines "best" ready process.
  function nonPreemptive(ps, keyFn) {
    const tl = [], rem = ps.slice(); let t = 0;
    while (rem.length) {
      const ready = rem.filter(p => p.at <= t);
      if (!ready.length) { const next = Math.min(...rem.map(p => p.at)); push(tl, 'IDLE', t, next); t = next; continue; }
      ready.sort((a, b) => cmp(keyFn(a), keyFn(b)));
      const p = ready[0]; push(tl, p.id, t, t + p.bt); t += p.bt;
      rem.splice(rem.indexOf(p), 1);
    }
    return tl;
  }

  // Preemptive priority: re-decide every time unit; the running process is only
  // displaced by a STRICTLY higher priority (lower number) process.
  function preemptivePriority(ps) {
    const tl = [], left = new Map(ps.map(p => [p.id, p.bt])); let t = 0, cur = null, done = 0;
    while (done < ps.length) {
      const ready = ps.filter(p => p.at <= t && left.get(p.id) > 0).sort((a, b) => cmp([a.pr, a.at, a.i], [b.pr, b.at, b.i]));
      if (!ready.length) { const next = Math.min(...ps.filter(p => left.get(p.id) > 0).map(p => p.at)); push(tl, 'IDLE', t, next); t = next; cur = null; continue; }
      let pick = ready[0];
      if (cur && left.get(cur.id) > 0 && cur.pr <= pick.pr) pick = cur; // tie or better: keep running
      cur = pick; push(tl, pick.id, t, t + 1); t++;
      left.set(pick.id, left.get(pick.id) - 1);
      if (left.get(pick.id) === 0) done++;
    }
    return tl;
  }

  // Round Robin. Convention: processes arriving at the instant a quantum expires
  // enter the queue BEFORE the pre-empted process is re-queued.
  function roundRobin(ps, q) {
    const tl = [], sorted = ps.slice().sort((a, b) => cmp([a.at, a.i], [b.at, b.i])),
      rem = new Map(ps.map(p => [p.id, p.bt])), queue = []; let t = 0, k = 0;
    const admit = () => { while (k < sorted.length && sorted[k].at <= t) queue.push(sorted[k++]); };
    while (k < sorted.length || queue.length) {
      admit();
      if (!queue.length) { push(tl, 'IDLE', t, sorted[k].at); t = sorted[k].at; continue; }
      const p = queue.shift(), run = Math.min(q, rem.get(p.id));
      push(tl, p.id, t, t + run); t += run; rem.set(p.id, rem.get(p.id) - run);
      admit();
      if (rem.get(p.id) > 0) queue.push(p);
    }
    return tl;
  }

  /** Main entry. algo: 'FCFS'|'SJN'|'RR'|'PRIORITY'. opts: {quantum, preemptive} */
  function simulate(raw, algo, opts) {
    opts = opts || {};
    const ps = raw.map((p, i) => Object.assign({}, p, { i }));
    let timeline, label;
    if (algo === 'FCFS') { timeline = nonPreemptive(ps, p => [p.at, p.i]); label = 'FCFS (non-preemptive)'; }
    else if (algo === 'SJN') { timeline = nonPreemptive(ps, p => [p.bt, p.at, p.i]); label = 'SJN (non-preemptive)'; }
    else if (algo === 'RR') {
      const q = opts.quantum; if (!Number.isInteger(q) || q <= 0) throw new Error('Time quantum must be a positive integer.');
      timeline = roundRobin(ps, q); label = `Round Robin (preemptive, q=${q})`;
    } else if (algo === 'PRIORITY') {
      timeline = opts.preemptive ? preemptivePriority(ps) : nonPreemptive(ps, p => [p.pr, p.at, p.i]);
      label = `Priority (${opts.preemptive ? 'preemptive' : 'non-preemptive'}, lower number = higher priority)`;
    } else throw new Error('Unknown algorithm: ' + algo);

    // Metrics come only from the timeline.
    const results = ps.map(p => {
      const segs = timeline.filter(s => s.id === p.id);
      const ct = Math.max(...segs.map(s => s.end)), first = Math.min(...segs.map(s => s.start));
      const tat = ct - p.at;
      return { id: p.id, at: p.at, bt: p.bt, pr: p.pr, ct, tat, wt: tat - p.bt, rt: first - p.at };
    });
    const n = results.length, avg = k => results.reduce((s, r) => s + r[k], 0) / n;
    const start = Math.min(...results.map(r => r.at)), end = Math.max(...results.map(r => r.ct)), span = end - start;
    const busy = timeline.filter(s => s.id !== 'IDLE').reduce((s, x) => s + x.end - x.start, 0);
    return {
      algo, label, timeline, results,
      summary: { avgWT: avg('wt'), avgTAT: avg('tat'), avgRT: avg('rt'),
        throughput: span > 0 ? n / span : 0, intervalStart: start, intervalEnd: end, span, completed: n, busy,
        idle: timeline.filter(s => s.id === 'IDLE').reduce((s, x) => s + x.end - x.start, 0) }
    };
  }

  /** Conceptual shared-file analysis (does NOT change the CPU timeline).
      A process is assumed to hold its file(s) from its first CPU start until completion. */
  function analyzeFiles(raw, sim) {
    const life = {}; sim.results.forEach(r => {
      const first = Math.min(...sim.timeline.filter(s => s.id === r.id).map(s => s.start)); life[r.id] = [first, r.ct];
    });
    const overlap = (a, b) => life[a][0] < life[b][1] && life[b][0] < life[a][1];
    const conflicts = [], deadlocks = [], files = {};
    raw.forEach(p => { if (p.file) (files[p.file] = files[p.file] || []).push(p); });
    Object.entries(files).forEach(([f, list]) => {
      for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
        const A = list[a], B = list[b];
        if (!overlap(A.id, B.id)) continue;
        if (A.op === 'write' || B.op === 'write')
          conflicts.push({ file: f, a: A.id, b: B.id, text: `${A.id} (${A.op}) and ${B.id} (${B.op}) both hold "${f}" during overlapping execution — write/access conflict.` });
      }
    });
    for (let a = 0; a < raw.length; a++) for (let b = a + 1; b < raw.length; b++) {
      const A = raw[a], B = raw[b];
      if (A.file && A.file2 && B.file && B.file2 && A.file === B.file2 && A.file2 === B.file && overlap(A.id, B.id))
        deadlocks.push({ a: A.id, b: B.id, text: `Potential deadlock: ${A.id} holds "${A.file}" and wants "${A.file2}", while ${B.id} holds "${B.file}" and wants "${B.file2}" (circular wait).` });
    }
    return { files, conflicts, deadlocks };
  }

  const api = { validate, simulate, analyzeFiles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Scheduler = api;
})(typeof window !== 'undefined' ? window : globalThis);
