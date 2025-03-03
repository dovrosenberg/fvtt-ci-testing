// @ts-check
// const fs = require('fs');
const puppeteer = require('puppeteer');
const { promiseHooks } = require('v8');
const { resourceLimits } = require('worker_threads');

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);

    console.log("Navigating to Foundry VTT...");
    await page.goto('http://localhost:30000', { waitUntil: 'networkidle0' });

    console.log("Foundry found");

    // based on the URL, we need to do different things
    // we check them in the order they're going to happen
    if (page.url()==='http://localhost:30000/license') {
        console.log('Handling license');
        await handleLicense(browser, page);
    }

    if (page.url()==='http://localhost:30000/setup') {
        console.log('Handling setup');
        await handleSetup(browser, page);
    }
    
    if (page.url()==='http://localhost:30000/join') {
        console.log('Handling join');
        await handleJoin(browser, page);
    }

    let testResults={};
    if (page.url()==='http://localhost:30000/game') {
        console.log('Handling game');
        testResults = await handleGame(browser, page);
    }

    if (page.url()!=='http://localhost:30000/game') {
        console.log('Never got to game page: ' + page.url());
        await browser.close();
        process.exit(1);
    }

    // save results to a file
    // fs.writeFileSync('/testScript/test-results.json', JSON.stringify(testResults, null, 2));

    await browser.close();

    // Parse the test results
    // Exit with failure if there are failed tests
    if (testResults.stats.failures > 0) {
        console.log(testResults.tests.filter((t) => t.err?.message != null));
        // console.log(testResults.stats);

        // note: this number doesn't match the number of tests with errors
        // console.log("❌ Test Failures: " + testResults.stats.failures);
        
        console.log("❌ Test Failures!");
        process.exit(1); // GitHub Action will fail
    } else {
        console.log("✅ All tests passed!");
        process.exit(0); // GitHub Action will pass
    }
})();

async function handleLicense(browser, page)  {
    // select the test world - there should only be one world in the list
    try {
        console.log("Waiting for license");
        await page.waitForSelector('#eula-agree', { timeout: 20000 });

        // need to accept the license
        console.log('accepting terms');
        await page.click('#eula-agree');
        await page.click('#sign');
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out looking for #worlds-list");
        await browser.close();
        process.exit(1);
    }

    try {
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out waiting for navigation after setup");
        await browser.close();
        process.exit(1);
    }
}

async function handleSetup(browser, page)  {
    const contents = await page.content();

    // there are a few different things that could happen here
    if (contents.includes('This tour covers a brief overview')){
        // need to skip the backups tour
        console.log('skipping tour');
        await page.click('a.step-button[data-action="exit"]');
    }

    // select the test world - there should only be one world in the list
    try {
        console.log("Waiting for home");
        await page.waitForSelector('#worlds-list', { timeout: 20000 });
        // await page.click('#worlds-list li a.control.play');
        await page.$eval('#worlds-list li a.control.play', el => el.click());   // for some reason page.click doesn't work here
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out looking for #worlds-list");
        await browser.close();
        process.exit(1);
    }

    try {
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out waiting for navigation after setup");
        await browser.close();
        process.exit(1);
    }
}

async function handleJoin(browser, page)  {
    // login page
    try {
        // login as gamemaster - there should be no password
        console.log("Waiting for login form");
        await page.waitForSelector('#join-game-form', { timeout: 20000 });
    
        await page.type('#join-game-form div.form-group div.form-fields select[name="userid"]', 'Gamemaster');
        await page.click("#join-game-form button[name=join]");
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out waiting for #join-game-form");
        await browser.close();
        process.exit(1);
    }

    try {
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out waiting for navigation after login");
        await browser.close();
        process.exit(1);
    }
}

async function handleGame(browser, page)  {
    // Wait for the Foundry UI to fully load
    try {
        console.log("Waiting for game to load");
        await page.waitForSelector('#ui-left', { timeout: 20000 });
    } catch (error) {
        console.log(await page.content());
        console.log(page.url());
        console.log("Timed out waiting for #ui-left");
        await browser.close();
        process.exit(1);
    }

    console.log("Executing Quench tests...");

    // Run tests in the browser console
    // const testResults = await page.evaluate(async () => {
    //     return await window.quench.runBatches('**');
    // });
    // make sure game and modules are loaded
    await page.waitForFunction(() => window.game?.ready, { timeout: 30000 });

    // page.on("console", async (msg) => {
    //     try {
    //         const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
    //         console.log(`BROWSER LOG:`, msg.text(), ...args);
    //     } catch (error) {}
    // });

    // install the quench hook and run the tests
    await page.evaluate(async () => {
        window.runTestResults = false;
        window.testResults = null;

        window.Hooks.once('quenchReports', (reports) => {
           window.runTestResults = true;
           window.testResults = reports;
        });

        await window.quench.runBatches();
    });

    await page.waitForFunction(() => window.runTestResults, { timeout: 30000 });

    const results = await page.evaluate(() => window.testResults);
    return JSON.parse(results.json);
}