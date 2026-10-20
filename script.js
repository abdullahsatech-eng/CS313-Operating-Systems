/* script.js — UI only. All scheduling logic lives in scheduler.js. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const SAMPLE = [['P1',0,5,3],['P2',1,3,1],['P3',2,8,4],['P4',3,6,2],['P5',5,2,1]];
  const COLORS = ['#2563eb','#db2777','#059669','#d97706','#7c3aed','#0891b2','#dc2626','#65a30d','#9333ea','#0d9488'];
  const NOTES = {
    FCFS: 'Non-preemptive. Runs processes in arrival order until each completes.',
    SJN: 'Non-preemptive. Among arrived processes, runs the one with the shortest burst; it then runs to completion.',
    RR: 'Preemptive. Each process runs at most one time quantum, then rejoins the back of the ready queue. Arrivals at a quantum boundary queue before the pre-empted process.',
    PRIORITY: 'Lower number = higher priority. Non-preemptive: runs to completion. Preemptive: a strictly higher-priority arrival interrupts the running process.'
  };
  const tbody = $('ptable').tBodies[0];

  function addRow(p) {
    p = Object.assign({ id: '', at: 0, bt: 1, pr: 1, file: '', op: 'none', file2: '' }, p || {});
    if (!p.id) { let n = 1; const ids = rowIds(); while (ids.includes('P' + n)) n++; p.id = 'P' + n; }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" data-k="id"></td><td><input type="number" data-k="at"></td><td><input type="number" data-k="bt"></td><td><input type="number" data-k="pr"></td>
      <td><input type="text" data-k="file" placeholder="e.g. data.txt"></td><td><select data-k="op"><option value="none">none</option><option value="read">read</option><option value="write">write</option></select></td>
      <td><input type="text" data-k="file2" placeholder="optional"></td><td><button class="danger" title="Remove">✕</button></td>`;
    tr.querySelectorAll('[data-k]').forEach(el => el.value = p[el.dataset.k]);
    tr.querySelector('button').onclick = () => { tr.remove(); };
    tbody.appendChild(tr);
  }
  const rowIds = () => [...tbody.rows].map(r => r.querySelector('[data-k=id]').value.trim());
  function readRows() { // raw values; numbers parsed strictly so '' or '1.5' fail validation
    return [...tbody.rows].map(r => {
      const g = k => r.querySelector(`[data-k=${k}]`).value, num = k => { const s = g(k).trim(); return s !== '' && /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN; };
      return { id: g('id').trim(), at: num('at'), bt: num('bt'), pr: num('pr'), file: g('file').trim(), op: g('op'), file2: g('file2').trim() };
    });
  }
  function loadSample() { tbody.innerHTML = ''; SAMPLE.forEach(s => addRow({ id: s[0], at: s[1], bt: s[2], pr: s[3] })); hideOutputs(); }
  function hideOutputs() { $('out').hidden = true; $('cmp').hidden = true; $('errors').hidden = true; }

  function opts() { return { quantum: Number($('quantum').value), preemptive: $('pmode').value === 'p' }; }
  function getValid() {
    const procs = readRows(); const errs = Scheduler.validate(procs);
    if ($('algo').value === 'RR') { const q = Number($('quantum').value); if (!Number.isInteger(q) || q <= 0) errs.push('Time quantum must be a positive integer.'); }
    tbody.querySelectorAll('input.bad').forEach(e => e.classList.remove('bad'));
    const box = $('errors'); box.hidden = !errs.length;
    box.innerHTML = errs.length ? '<b>Fix these before running:</b><ul>' + errs.map(e => `<li>${esc(e)}</li>`).join('') + '</ul>' : '';
    if (errs.length) { hideOutputsKeepErrors(); return null; }
    return procs;
  }
  function hideOutputsKeepErrors() { $('out').hidden = true; $('cmp').hidden = true; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const f2 = x => x.toFixed(2), f4 = x => x.toFixed(4);

  function run() {
    const procs = getValid(); if (!procs) return;
    const sim = Scheduler.simulate(procs, $('algo').value, opts());
    $('out').hidden = false; $('used').textContent = 'Algorithm used: ' + sim.label;
    drawGantt(sim, procs); drawResults(sim); drawFiles(procs, sim);
    $('out').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function drawGantt(sim, procs) {
    const total = sim.timeline[sim.timeline.length - 1].end, t0 = sim.timeline[0].start, span = total - t0;
    const px = Math.max(36, 0), width = Math.max(span * px, 600); // min 36px per time unit
    const color = id => COLORS[procs.findIndex(p => p.id === id) % COLORS.length];
    const pos = t => ((t - t0) / span * 100) + '%';
    let h = `<div style="min-width:${width}px"><div class="gtrack">`;
    sim.timeline.forEach(s => {
      const idle = s.id === 'IDLE';
      h += `<div class="seg ${idle ? 'idle' : ''}" style="left:${pos(s.start)};width:${(s.end - s.start) / span * 100}%;${idle ? '' : 'background:' + color(s.id)}" title="${idle ? 'CPU idle' : s.id}: ${s.start}–${s.end}">${idle ? 'IDLE' : esc(s.id)}</div>`;
    });
    h += '</div><div class="gticks">';
    const pts = [...new Set(sim.timeline.flatMap(s => [s.start, s.end]))];
    pts.forEach(t => h += `<span style="left:${pos(t)}">${t}</span>`);
    $('gantt').innerHTML = h + '</div></div>';
  }

  function drawResults(sim) {
    const s = sim.summary;
    $('cards').innerHTML = [['Average Waiting Time', f2(s.avgWT)], ['Average Turnaround Time', f2(s.avgTAT)], ['Average Response Time', f2(s.avgRT)], ['Throughput (processes / time unit)', f4(s.throughput)]]
      .map(c => `<div class="stat"><b>${c[1]}</b><span>${c[0]}</span></div>`).join('');
    $('interval').textContent = `Throughput = ${s.completed} completed ÷ (${s.intervalEnd} − ${s.intervalStart} = ${s.span}) time units. CPU busy: ${s.busy}, idle: ${s.idle}.` + (s.span === 0 ? ' (Interval is 0, throughput shown as 0.)' : '');
    $('rtable').tBodies[0].innerHTML = sim.results.map(r => `<tr><td>${esc(r.id)}</td><td>${r.at}</td><td>${r.bt}</td><td>${r.pr}</td><td>${r.ct}</td><td>${r.tat}</td><td>${r.wt}</td><td>${r.rt}</td></tr>`).join('');
  }

  function drawFiles(procs, sim) {
    const a = Scheduler.analyzeFiles(procs, sim), names = Object.keys(a.files);
    let h = '';
    if (!names.length) h = '<p class="note">No process is linked to a file. Enter a file name (e.g. data.txt) in the File column, and share it between processes to see the demo.</p>';
    names.forEach(f => h += `<p><b>📄 ${esc(f)}</b> — used by ${a.files[f].map(p => `${esc(p.id)} (${p.op})`).join(', ')}${a.files[f].length > 1 ? ' <em>(shared)</em>' : ''}</p>`);
    a.conflicts.forEach(c => h += `<div class="warn">⚠ ${esc(c.text)}</div>`);
    a.deadlocks.forEach(d => h += `<div class="warn dead">⛔ ${esc(d.text)}</div>`);
    if (names.length && !a.conflicts.length && !a.deadlocks.length) h += '<div class="okmsg">No overlapping access conflict under this schedule.</div>';
    $('files').innerHTML = h;
  }

  function compareAll() {
    const procs = getValid(); if (!procs) return;
    const runs = [['FCFS', {}], ['SJN', {}], ['RR', opts()], ['PRIORITY', { preemptive: false }], ['PRIORITY', { preemptive: true }]].map(([a, o]) => Scheduler.simulate(procs, a, o));
    const best = (k, min) => (min ? Math.min : Math.max)(...runs.map(r => r.summary[k]));
    const cell = (r, k, min, fmt) => `<td class="${r.summary[k] === best(k, min) ? 'best' : ''}">${fmt(r.summary[k])}</td>`;
    $('cmptable').tBodies[0].innerHTML = runs.map(r => `<tr><td>${esc(r.label)}</td>${cell(r, 'avgWT', true, f2)}${cell(r, 'avgTAT', true, f2)}${cell(r, 'avgRT', true, f2)}${cell(r, 'throughput', false, f4)}</tr>`).join('');
    $('cmp').hidden = false; $('cmp').scrollIntoView({ behavior: 'smooth' });
  }

  function syncAlgoUI() {
    const a = $('algo').value; $('qwrap').hidden = a !== 'RR'; $('pwrap').hidden = a !== 'PRIORITY'; $('algonote').textContent = NOTES[a];
  }
  $('add').onclick = () => addRow(); $('sample').onclick = loadSample; $('reset').onclick = loadSample;
  $('clear').onclick = () => { tbody.innerHTML = ''; hideOutputs(); };
  $('run').onclick = run; $('compare').onclick = compareAll; $('algo').onchange = syncAlgoUI;
  loadSample(); syncAlgoUI();
})();
