# OS Process Scheduling Simulator — CS313 Assignment 1

**Student Name:** Abdullah Khan  
**Registration Number:** 9826  
**Section:** B  
**Submission Date:** 21 October 2026  

**University:** Abasyn University, Islamabad Campus  
**Course:** CS313 — Operating System Concepts  
**Instructor:** Ms. Naveen Ahmed  
**Semester:** Fall 2026  
**Project:** Operating System Simulation — Assignment 1

## Live Demo

**[Open the OS Process Scheduling Simulator](https://abdullahsatech-eng.github.io/CS313-Operating-Systems/)**

## 1. Project Overview

The OS Process Scheduling Simulator is a browser-based application developed for CS313 Assignment 1. It demonstrates CPU process scheduling algorithms and provides a conceptual shared-file access demonstration.

Users can enter process details, select a scheduling algorithm, visualize CPU execution through a Gantt chart, calculate scheduling metrics, and compare algorithm performance.

**Project Scope:** Assignment 1 only — CPU scheduling and a conceptual shared-file demonstration. This project does not implement the later assignments.

## 2. Features

- Interactive process input table.
- Four CPU scheduling algorithms with five supported variants.
- Configurable time quantum for Round Robin.
- Preemptive and non-preemptive Priority Scheduling.
- Gantt chart showing execution order and CPU idle periods.
- Per-process completion, turnaround, waiting, and response times.
- Throughput calculation.
- Comparison of scheduling algorithms using the same input data.
- Conceptual shared-file conflict and potential deadlock demonstration.
- Input validation with error messages.
- Responsive interface with light and dark styling.
- Automated tests for scheduling logic.

## 3. CPU Scheduling Algorithms

### 3.1 First-Come, First-Served (FCFS)

- **Type:** Non-preemptive.
- Selects the process with the earliest arrival time.
- Once execution begins, the process continues until completion.
- Simple to understand and implement, but long processes can delay shorter ones.

### 3.2 Shortest Job Next (SJN)

- **Type:** Non-preemptive.
- Selects the process with the shortest burst time among processes that have arrived.
- Runs the selected process until completion.
- Can reduce average waiting time, but longer processes may experience starvation.

### 3.3 Round Robin (RR)

- **Type:** Preemptive.
- Uses a configurable time quantum.
- Each ready process receives CPU time according to the round-robin queue.
- Processes that are unfinished after their quantum return to the ready queue.
- Provides fair CPU sharing and good responsiveness, depending on the quantum.

### 3.4 Priority Scheduling

Supports two modes:

- **Non-preemptive:** The selected process runs until completion.
- **Preemptive:** A newly arrived process interrupts the running process when it has a strictly higher priority.

**Priority convention:** A lower numerical value indicates a higher priority.

### 3.5 Tie-Breaking Rules

When processes have equal selection criteria, arrival time and then input order determine the selection. CPU idle periods are represented as `IDLE` in the Gantt chart.

## 4. Scheduling Metrics and Formulas

| Metric | Formula | Description |
|---|---|---|
| Completion Time (CT) | Final completion time | Time at which a process finishes |
| Turnaround Time (TAT) | CT − AT | Total time spent in the system |
| Waiting Time (WT) | TAT − BT | Time spent waiting for CPU execution |
| Response Time (RT) | First CPU start − AT | Time from arrival until first CPU execution |
| Throughput | Completed processes ÷ Total measured interval | Number of completed processes per unit of time |

**Abbreviations:**

- **AT:** Arrival Time
- **BT:** Burst Time
- **CT:** Completion Time
- **TAT:** Turnaround Time
- **WT:** Waiting Time
- **RT:** Response Time

The throughput interval is calculated from the first arrival to the last completion. If the interval is zero, throughput is defined as zero.

## 5. Gantt Chart and Algorithm Comparison

The simulator generates a Gantt chart from the calculated execution timeline. It displays process execution segments, preemption where applicable, and CPU idle periods.

The **Compare All Algorithms** feature runs the supported algorithm variants using the same process data so their results can be compared.

The results demonstrate the trade-offs between waiting time, response time, fairness, and scheduling efficiency.

## 6. Shared-File Access Demonstration

The simulator includes a conceptual demonstration connecting processes to shared-file operations.

Users can specify:

- A file associated with a process.
- A read or write operation.
- An optional second file.

The demonstration identifies overlapping file access involving at least one writer as a potential conflict. It also flags potential circular-wait situations when overlapping processes hold files needed by one another.

**Important limitation:** This is an educational demonstration only. It does not change the CPU scheduling timeline or calculated metrics. It is not a real file system, synchronization mechanism, mutex/semaphore implementation, or complete operating-system deadlock detector.

## 7. Technologies Used

- **HTML5** — application structure.
- **CSS3** — styling and responsive layout.
- **JavaScript** — scheduling algorithms, calculations, validation, and user interaction.
- **Node.js** — optional execution of automated tests.
- **Playwright/Chromium** — headless-browser smoke testing, as described in the project test report.

The application can run in a modern web browser without a backend server or database.

## 8. Project Files

| File or Folder | Purpose |
|---|---|
| `index.html` | Main application page |
| `style.css` | Layout, styling, and responsive design |
| `scheduler.js` | Scheduling logic, validation, metrics, and file-conflict analysis |
| `script.js` | User interface, process-table controls, Gantt chart, and results |
| `tests.js` | Automated tests for scheduling logic |
| `test-results.txt` | Recorded automated test output |
| `ui-test-results.txt` | Recorded UI smoke-test results, if included |
| `ui_test.py` | Browser smoke-test script, if included |
| `screenshots/` and `shots/` | Project screenshots, if included |

The exact files available depend on the contents of the submitted repository.

## 9. How to Run Locally

1. Download or clone the repository.
2. Open the `Assignments/Assignment-01-Process-Scheduling/` folder.
3. Ensure the application files are in the same folder.
4. Open `index.html` in a modern web browser.
5. Enter process data or click **Load Sample Data**.
6. Select an algorithm and configure its options if required.
7. Click **Run Simulation** to view the Gantt chart and metrics.
8. Click **Compare All Algorithms** to compare the supported variants.

No server installation is required for normal local use.

### Running the Tests

If Node.js is installed, open a terminal in the project folder and run:

```bash
node tests.js
```

The existing test report records **52 passed and 0 failed**. Run the tests yourself before submission to confirm the current code produces the same result.

## 10. Testing and Validation

The documented tests cover:

- Sample process data.
- Single-process scheduling.
- Equal and staggered arrival times.
- CPU idle periods.
- Equal priorities.
- Round Robin with short time quanta and early completion.
- Preemptive and non-preemptive Priority Scheduling.
- Invalid input.
- Shared-file conflicts and potential deadlock cases.
- Scheduling invariants across algorithms and scenarios.

The project documentation also describes a headless-browser smoke test covering simulation execution, algorithm comparison, input validation, and the shared-file demonstration. This is a smoke test, not a complete UI test suite.

## 11. Assignment Requirement Checklist

| Assignment Requirement | Implementation |
|---|---|
| FCFS scheduling | Implemented in `scheduler.js` |
| SJN scheduling | Implemented in `scheduler.js` |
| Round Robin scheduling | Implemented in `scheduler.js` |
| Priority Scheduling | Preemptive and non-preemptive modes |
| Different arrival, burst, and priority values | Configurable process table |
| Waiting and turnaround times | Calculated and displayed |
| Response time and throughput | Calculated and displayed |
| Execution visualization | Gantt chart |
| Algorithm comparison | Compare All Algorithms feature |
| Process and shared-file interaction | Conceptual shared-file panel |
| Testing | Automated tests and documented smoke testing |

## 12. Suggested Screenshots for Submission

Include screenshots of the following, if required by the assignment submission instructions:

1. Main interface and process input table.
2. FCFS simulation and Gantt chart.
3. Round Robin simulation and results.
4. Preemptive Priority Scheduling.
5. Algorithm comparison results.
6. Shared-file conflict or potential deadlock warning.
7. Input validation error.
8. Responsive or mobile layout.

## 13. Conclusion

The OS Process Scheduling Simulator demonstrates FCFS, SJN, Round Robin, and Priority Scheduling through an interactive browser-based interface. It calculates scheduling metrics from execution timelines, visualizes process execution, compares algorithm variants, and provides a conceptual shared-file conflict demonstration.

The simulator supports learning about the trade-offs between CPU scheduling strategies, including waiting time, response time, fairness, and potential starvation. The shared-file demonstration introduces resource conflicts and circular wait without claiming to implement a real operating-system synchronization or deadlock-management system.

---

## Student Submission Details

| Field | Details |
|---|---|
| Student Name | Abdullah Khan |
| Registration Number | 9826 |
| Section | B |
| Course | CS313 — Operating System Concepts |
| Assignment | Assignment 1 — Process Scheduling |
| Instructor | Ms. Naveen Ahmed |
| University | Abasyn University, Islamabad Campus |
| Semester | Fall 2026 |
| Submission Date | 21 October 2026 |
| Live Project | [OS Process Scheduling Simulator](https://abdullahsatech-eng.github.io/CS313-Operating-Systems/) |
