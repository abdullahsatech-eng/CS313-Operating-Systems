import asyncio, os, json
from playwright.async_api import async_playwright
URL = "file:///home/claude/os-scheduler/index.html"
res = []
def ok(name, cond, extra=""):
    res.append((name, bool(cond), extra)); print(("PASS " if cond else "FAIL ")+name, extra)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width":1200,"height":900})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        await pg.goto(URL)
        ok("page loads, 5 sample rows", await pg.locator("#process-body tr").count()==5)
        # run each algorithm on sample and read results
        async def results():
            return await pg.eval_on_selector_all("#results-table tbody tr","rs=>rs.map(r=>[...r.cells].map(c=>c.textContent))")
        async def cards():
            return await pg.eval_on_selector_all("#summary-cards .v","e=>e.map(x=>x.textContent)")
        exp = {"FCFS":["8.00","12.80"],"SJN":["5.40","10.20"],"RR":["10.20","15.00"]}
        for a,e in exp.items():
            await pg.select_option("#algo",a); await pg.click("#btn-run")
            c = await cards(); ok(f"UI {a} averages", c[0]==e[0] and c[1]==e[1], str(c))
        await pg.select_option("#algo","PRIORITY")
        await pg.click("#btn-run"); c=await cards(); ok("UI Priority NP", c[0]=="5.60" and c[1]=="10.40", str(c))
        await pg.check("input[name=pmode][value=p]"); await pg.click("#btn-run"); c=await cards()
        ok("UI Priority preemptive", c[0]=="5.60" and "preemptive" in (await pg.inner_text("#run-label")), str(c))
        ok("Gantt has 7 process segments", await pg.locator("#gantt .seg:not(.idle)").count()==7)
        await pg.locator("#results-card").screenshot(path="screenshots/02_priority_preemptive.png")
        # RR gantt + screenshot
        await pg.select_option("#algo","RR"); await pg.fill("#quantum","2"); await pg.click("#btn-run")
        ok("RR q=2 Gantt segments = 13 slices (hand-counted)", await pg.locator("#gantt .seg").count()==13, str(await pg.locator("#gantt .seg").count()))
        await pg.locator("#results-card").screenshot(path="screenshots/03_round_robin.png")
        # compare
        await pg.click("#btn-compare"); ok("compare table 5 rows", await pg.locator("#compare-table tbody tr").count()==5)
        await pg.locator("#compare-card").screenshot(path="screenshots/04_comparison.png")
        # validation
        await pg.click("#btn-add"); inputs = pg.locator("#process-body tr").nth(5).locator("input")
        await inputs.nth(2).fill("0"); await inputs.nth(1).fill("-3")
        await pg.click("#btn-run")
        ok("invalid input blocks run, shows errors", await pg.locator("#errors").is_visible() and await pg.locator("#results-card").is_hidden())
        txt = await pg.inner_text("#errors"); ok("error text mentions Arrival and Burst", "Arrival Time" in txt and "Burst Time" in txt)
        await pg.locator("#input-card").screenshot(path="screenshots/05_validation_errors.png")
        # duplicate ID
        await inputs.nth(0).fill("P1"); await inputs.nth(2).fill("2"); await inputs.nth(1).fill("0")
        await pg.click("#btn-run"); ok("duplicate id error", "duplicates" in await pg.inner_text("#errors"))
        # clear => empty error
        await pg.click("#btn-clear"); await pg.click("#btn-run")
        ok("empty set shows error", "at least one process" in await pg.inner_text("#errors"))
        # sample + shared file demo (RR -> conflict)
        await pg.click("#btn-reset")
        sel = lambda i,n: pg.locator("#process-body tr").nth(i).locator("select").nth(n)
        await sel(0,0).select_option("data.txt"); await sel(0,1).select_option("write")
        await sel(1,0).select_option("data.txt"); await sel(1,1).select_option("read")
        await sel(2,0).select_option("log.txt")
        await pg.select_option("#algo","RR"); await pg.click("#btn-run")
        ok("RR shows ACCESS CONFLICT", "ACCESS CONFLICT" in await pg.inner_text("#file-list"), "")
        await pg.select_option("#algo","FCFS"); await pg.click("#btn-run")
        ok("FCFS shows no conflict for same file", "ACCESS CONFLICT" not in await pg.inner_text("#file-list"))
        await pg.select_option("#algo","RR"); await pg.click("#btn-run")
        await pg.locator("#file-card").screenshot(path="screenshots/06_shared_file_conflict.png")
        # full page of RR run + initial
        await pg.click("#btn-reset"); await pg.locator("#input-card").screenshot(path="screenshots/01_input_panel.png")
        # mobile
        m = await b.new_page(viewport={"width":390,"height":800}); await m.goto(URL); await m.click("#btn-run")
        sw = await m.evaluate("document.documentElement.scrollWidth"); ok("mobile: no page-level horizontal overflow", sw<=392, str(sw))
        await m.screenshot(path="screenshots/07_mobile.png")
        ok("no JS errors", not errs, str(errs))
        await b.close()
    json.dump(res, open("/home/claude/os-scheduler/ui-test-results.json","w"))
    print(sum(1 for r in res if r[1]),"passed",sum(1 for r in res if not r[1]),"failed")
asyncio.run(main())
