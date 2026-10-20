# OS Process Scheduling Simulator — CS313 Assignment 1
Abasyn University, Islamabad · Operating System Concepts · Instructor: Ms. Naveen Ahmed · Fall 2026

Scope: **Assignment 1 only** (CPU scheduling + a small conceptual shared-file demo).

## Run
1. Keep all files in one folder (`index.html`, `style.css`, `scheduler.js`, `script.js`).
2. Double-click `index.html` (any modern browser). No server, install or internet needed.
3. Tests (optional, needs Node.js): `node tests.js`

## Use
Edit the process table (or **Load Sample Data**), choose an algorithm (set the quantum for RR, or the mode for Priority), click **Run Simulation**. **Compare All Algorithms** runs every variant on the same data. Invalid input shows an error list and blocks the run.

## Files
| File | Purpose |
|---|---|
| `scheduler.js` | Pure logic: validation, 4 algorithms (5 variants), metrics, file-conflict analysis. No DOM. |
| `script.js` | UI: table editing, Gantt rendering, results, comparison. |
| `index.html`, `style.css` | Layout and styling (responsive, light/dark). |
| `tests.js`, `test-results.txt` | Test harness and its real output. |

## Algorithms
- **FCFS** (non-preemptive): earliest arrival first.
- **SJN** (non-preemptive): shortest burst among *arrived* processes; runs to completion.
- **Round Robin** (preemptive): configurable quantum; arrivals at the instant a quantum expires are queued before the pre-empted process.
- **Priority**: non-preemptive, or preemptive (a *strictly* higher priority arrival interrupts). **Lower number = higher priority.**
- Tie-break everywhere: arrival time, then input order. CPU idle gaps are shown as IDLE.

## Formulas
TAT = CT − AT · WT = TAT − BT · RT = first CPU start − AT · Throughput = completed ÷ (last CT − first AT) (0 if interval is 0).

## Shared-file demo (conceptual)
Each process may name a file, an operation (read/write) and an optional second file. A process is assumed to hold its files from first CPU start to completion. Overlapping holders of one file with at least one writer are flagged as a **conflict**; two overlapping processes holding each other's wanted file are flagged as a **potential deadlock (circular wait)**. It does **not** alter the timeline or metrics, and is not a real file system, mutex/semaphore, or deadlock detector.

## Tests
`node tests.js` → 52 passed, 0 failed (see `test-results.txt`). Covers sample, single process, equal arrivals, staggered arrivals, idle start, equal priorities, RR (short quantum, early finish), preemptive/non-preemptive priority, validation, shared files, plus invariants (CT ≥ AT, TAT, WT, RT bounds, busy time = ΣBT, no gaps, no overrun) on every algorithm × scenario. A headless-browser smoke test (Playwright/Chromium) also exercised run, compare, validation and file demo without script errors; it was not a full UI test suite.

## Requirement checklist
| Requirement | Where |
|---|---|
| FCFS, SJN, RR, Priority | `scheduler.js` `simulate()` |
| Preemptive & non-preemptive | RR, preemptive priority; others non-preemptive |
| Varied arrival/burst/priority | process table, sample data |
| WT, TAT, throughput (+RT) | Results cards/table |
| Visualisation | Gantt chart (real timeline, idle, split segments) |
| Process–file link | Shared-file panel |
| Testable interface | `tests.js` + UI |

## Suggested screenshots
Input table; RR Gantt; RR results; preemptive Priority Gantt; comparison table; shared-file warning; validation error; mobile view.

## Conclusion (for report)
The simulator implements FCFS, SJN, Round Robin and Priority scheduling, computing all metrics from the generated timeline. On the sample data, SJN gave the lowest average waiting time and RR the best response time among fair-share policies, illustrating the trade-offs between efficiency and responsiveness.
