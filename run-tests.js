const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);

    console.log("Navigating to Foundry VTT...");
    await page.goto('http://localhost:30000/setup', { waitUntil: 'networkidle0' });

    // make sure it's not on the "no active worlds" page... this happens sometimes when foundry reloads
    if (page.contents().includes('There is not currently an active game on this server')) {
        // need to renavigate
        // probably need to set an admin password
    }

    // select the test world - there should only be one world in the list
    console.log(await page.content());
    console.log("Waiting for home");
    await page.waitForSelector('#worlds-list', { timeout: 20000 });
    await page.click('#worlds-list li a.control.play');

    // login as gamemaster - there should be no password
    console.log(await page.content());
    console.log("Waiting for login form");
    await page.waitForSelector('#join-game-form', { timeout: 20000 });

    await page.type('#join-game-form div.form-group div.form-fields select[name="userid"]', 'Gamemaster');
    await page.click('#join-game-form button[name=join]');

    // Wait for the Foundry UI to fully load
    console.log(await page.content());
    console.log("Waiting for game to load");
    await page.waitForSelector('#ui-left', { timeout: 20000 });

    console.log("Executing Quench tests...");

    // Run tests in the browser console
    // const testResults = await page.evaluate(async () => {
    //     return await window.quench.runBatches('**');
    // });
    const testResults = await window.quench.runBatches('**');

    console.log("Test Results:", JSON.stringify(testResults, null, 2));

    // Parse the test results
    const failedTests = testResults.failures;

    await browser.close();

    // Exit with failure if there are failed tests
    if (failedTests > 0) {
        console.error("❌ Some tests failed!");
        console.log(testResults.currentRunnable.err);
        process.exit(1); // GitHub Action will fail
    } else {
        console.log("✅ All tests passed!");
        process.exit(0); // GitHub Action will pass
    }
})();
