// Run: node tests.js
const S = require('./scheduler.js');
let pass = 0, fail = 0; const log = [];
function ok(name, cond, extra) { (cond ? pass++ : fail++); log.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + (extra || '')}`); }
const P = (id, at, bt, pr, o) => Object.assign({ id, at, bt, pr, file: '', op: 'none', file2: '' }, o);
const sample = [P('P1',0,5,3),P('P2',1,3,1),P('P3',2,8,4),P('P4',3,6,2),P('P5',5,2,1)];
const ct = (r, id) => r.results.find(x => x.id === id).ct;
const cts = r => ['P1','P2','P3','P4','P5'].map(i => ct(r, i)).join(',');

// invariants checked on every run
function invariants(name, procs, algo, opts) {
  const r = S.simulate(procs, algo, opts), tot = procs.reduce((s,p)=>s+p.bt,0);
  let good = true, why = '';
  r.results.forEach(x => {
    if (x.ct < x.at) { good = false; why += `CT<AT ${x.id};`; }
    if (x.tat !== x.ct - x.at) { good = false; why += 'TAT;'; }
    if (x.wt !== x.tat - x.bt) { good = false; why += 'WT;'; }
    if (x.rt < 0 || x.rt > x.tat) { good = false; why += 'RT;'; }
    const ran = r.timeline.filter(s=>s.id===x.id).reduce((s,y)=>s+y.end-y.start,0);
    if (ran !== x.bt) { good = false; why += `ran ${ran}!=${x.bt} ${x.id};`; }
    r.timeline.filter(s=>s.id===x.id).forEach(s => { if (s.start < x.at) { good = false; why += 'started before arrival;'; } });
  });
  if (r.summary.busy !== tot) { good = false; why += 'busy!=sum BT;'; }
  for (let i = 1; i < r.timeline.length; i++) if (r.timeline[i].start !== r.timeline[i-1].end) { good = false; why += 'gap/overlap;'; }
  ok(`Invariants: ${name} [${algo}${opts&&opts.preemptive?' preemptive':''}]`, good, why);
  return r;
}
const algos = [['FCFS'],['SJN'],['RR',{quantum:2}],['PRIORITY',{preemptive:false}],['PRIORITY',{preemptive:true}]];
const scenarios = {
  'T1 five-process sample': sample,
  'T2 single process': [P('P1',0,4,1)],
  'T3 identical arrival times': [P('A',0,3,2),P('B',0,1,1),P('C',0,2,3)],
  'T4 different arrival times': [P('A',0,2,1),P('B',4,3,2),P('C',6,1,1)],
  'T5 idle before first arrival': [P('A',3,2,1),P('B',4,2,2)],
  'T6 identical priorities': [P('A',0,3,1),P('B',1,2,1),P('C',2,1,1)],
};
for (const [n, ps] of Object.entries(scenarios)) algos.forEach(([a,o]) => invariants(n, ps, a, o));

// Hand-calculated expectations (sample)
let r = S.simulate(sample,'FCFS'); ok('T1 FCFS CT = 5,8,16,22,24', cts(r)==='5,8,16,22,24', cts(r));
ok('T1 FCFS avg WT = 8, avg TAT = 12.8', r.summary.avgWT===8 && Math.abs(r.summary.avgTAT-12.8)<1e-9);
ok('T1 FCFS throughput = 5/24', Math.abs(r.summary.throughput-5/24)<1e-12);
r = S.simulate(sample,'SJN'); ok('T1 SJN CT = 5,10,24,16,7', cts(r)==='5,10,24,16,7', cts(r));
ok('T1 SJN avg WT = 5.4, avg TAT = 10.2', Math.abs(r.summary.avgWT-5.4)<1e-9 && Math.abs(r.summary.avgTAT-10.2)<1e-9);
r = S.simulate(sample,'PRIORITY',{preemptive:false}); ok('T10 Priority NP CT = 5,8,24,16,10', cts(r)==='5,8,24,16,10', cts(r));
r = S.simulate(sample,'PRIORITY',{preemptive:true}); ok('T9 Priority P CT = 16,4,24,12,7', cts(r)==='16,4,24,12,7', cts(r));
ok('T9 P2 preempts P1 at t=1', r.timeline[0].id==='P1' && r.timeline[0].end===1 && r.timeline[1].id==='P2');
ok('T9 preempted P1 appears as separate segments', r.timeline.filter(s=>s.id==='P1').length===2);
ok('T9 avg WT = 5.6', Math.abs(r.summary.avgWT-5.6)<1e-9);
// RR hand check: q=2, P1(0,5) P2(1,3) P3(2,1)
r = S.simulate([P('P1',0,5,1),P('P2',1,3,1),P('P3',2,1,1)],'RR',{quantum:2});
ok('T7 RR q=2 CT P1=9,P2=8,P3=5', ct(r,'P1')===9&&ct(r,'P2')===8&&ct(r,'P3')===5);
ok('T7 RR slices 0-2 P1, 2-4 P2, 4-5 P3, 5-7 P1, 7-8 P2, 8-9 P1',
   r.timeline.map(s=>`${s.start}-${s.end}${s.id}`).join(' ')==='0-2P1 2-4P2 4-5P3 5-7P1 7-8P2 8-9P1', r.timeline.map(s=>`${s.start}-${s.end}${s.id}`).join(' '));
ok('T8 RR: P3 (BT 1 < q) ends early at t=5', ct(r,'P3')===5);
// idle
r = S.simulate([P('A',3,2,1)],'FCFS');
ok('T5 idle 0-3 then A 3-5; throughput 1/2', r.timeline[0].id==='IDLE'&&r.timeline[0].end===3&&ct(r,'A')===5&&r.summary.throughput===0.5);
// tie-breaking
r = S.simulate([P('B',0,2,1),P('A',0,2,1)],'SJN'); ok('Tie-break: equal AT/BT -> input order', r.timeline[0].id==='B');
// validation (T11)
ok('T11 empty list rejected', S.validate([]).length===1);
ok('T11 bad values rejected', S.validate([P('P1',-1,0,1.5),P('P1',0,1,1)]).length>=4);
ok('T11 RR quantum 0 rejected', (()=>{try{S.simulate(sample,'RR',{quantum:0});}catch(e){return true;}return false;})());
// shared files (T12)
const fp = [P('P1',0,4,1,{file:'data.txt',op:'write'}),P('P2',1,3,2,{file:'data.txt',op:'read'}),P('P3',9,1,3,{file:'data.txt',op:'read'})];
r = S.simulate(fp,'RR',{quantum:2}); let f = S.analyzeFiles(fp,r);
ok('T12 FCFS: no overlap so no conflict', S.analyzeFiles(fp,S.simulate(fp,'FCFS')).conflicts.length===0);
ok('T12 shared file: conflict P1/P2 found, P3 (later, no overlap) not', f.conflicts.length===1 && f.conflicts[0].a==='P1'&&f.conflicts[0].b==='P2');
const dl = [P('P1',0,3,1,{file:'a.txt',op:'write',file2:'b.txt'}),P('P2',1,3,2,{file:'b.txt',op:'write',file2:'a.txt'})];
f = S.analyzeFiles(dl,S.simulate(dl,'RR',{quantum:1})); ok('T12 circular wait flagged as potential deadlock', f.deadlocks.length===1);
ok('T12 file demo does not alter metrics', JSON.stringify(S.simulate(fp,'FCFS').results)===JSON.stringify(S.simulate(fp.map(p=>Object.assign({},p,{file:'',op:'none'})),'FCFS').results));

console.log(log.join('\n')); console.log(`\n${pass} passed, ${fail} failed, ${pass+fail} total`); process.exit(fail?1:0);
