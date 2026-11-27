// Screenshots for the "Currently exploring" shuffle feature
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3005';
const OUT = __dirname;

async function shot(page, name) {
  // Scroll to explore section
  await page.evaluate(() => {
    var el = document.querySelector('.fd-exploring');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  console.log('wrote', name);
}

async function getThreadInfo(page) {
  return page.evaluate(() => {
    var panels = Array.from(document.querySelectorAll('.fd-exp-panel'));
    var active = panels.find(p => !p.hasAttribute('aria-hidden'));
    var heading = active && active.querySelector('.fd-exp-thread');
    var items = active ? Array.from(active.querySelectorAll('.fd-exp-item-type')).map(e => e.textContent) : [];
    var allHeadings = panels.map(p => { var h = p.querySelector('.fd-exp-thread'); return h ? h.textContent.trim() : ''; });
    var consoleErrors = window.__consoleErrors || [];
    return {
      activeThread: heading ? heading.textContent.trim() : '(none)',
      itemTypes: items,
      totalPanels: panels.length,
      allThreads: allHeadings,
      hasShuffleBtn: !!document.getElementById('exp-shuffle'),
      consoleErrors,
    };
  });
}

async function clickShuffle(page) {
  await page.click('#exp-shuffle');
  await page.waitForTimeout(350); // wait for 200ms fade + buffer
}

(async () => {
  // Capture console errors
  const browser = await chromium.launch();

  for (const [theme, label] of [['dark', 'dark'], ['light', 'light']]) {
    for (const [vpLabel, vp] of [['1280', {width:1280,height:800}], ['390', {width:390,height:844}]]) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();

      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(msg.text());
      });

      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(200);

      // Before shuffle
      var info = await getThreadInfo(page);
      console.log(`\n[${vpLabel}-${theme}] panels: ${info.totalPanels}, active: "${info.activeThread}", hasShuffleBtn: ${info.hasShuffleBtn}`);
      console.log(`  threads: ${JSON.stringify(info.allThreads)}`);
      await shot(page, `exp-${vpLabel}-${theme}-before.png`);

      // Shuffle through all panels and capture each
      if (info.hasShuffleBtn && info.totalPanels > 1) {
        for (let i = 1; i < info.totalPanels; i++) {
          await clickShuffle(page);
          var info2 = await getThreadInfo(page);
          console.log(`  after shuffle ${i}: "${info2.activeThread}" items: ${JSON.stringify(info2.itemTypes)}`);
          if (i === 1) await shot(page, `exp-${vpLabel}-${theme}-after1.png`);
        }
        // One more shuffle (wrap around)
        await clickShuffle(page);
        var info3 = await getThreadInfo(page);
        console.log(`  after wrap: "${info3.activeThread}"`);
      }

      if (consoleErrors.length) console.log('  CONSOLE ERRORS:', consoleErrors);
      await ctx.close();
    }
  }

  // Reduced motion check
  const ctxRm = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const pageRm = await ctxRm.newPage();
  await pageRm.goto(BASE, { waitUntil: 'networkidle' });
  await pageRm.waitForTimeout(300);
  var rmInfo = await getThreadInfo(pageRm);
  console.log(`\n[reduced-motion] active: "${rmInfo.activeThread}"`);
  await pageRm.evaluate(() => {
    var el = document.querySelector('.fd-exploring');
    if (el) el.scrollIntoView({ block: 'start' });
  });
  await pageRm.waitForTimeout(80);
  await pageRm.screenshot({ path: path.join(OUT, 'exp-reduced-motion-before.png') });
  if (rmInfo.hasShuffleBtn) {
    await pageRm.click('#exp-shuffle');
    await pageRm.waitForTimeout(100);
    var rmInfo2 = await getThreadInfo(pageRm);
    console.log(`  after shuffle: "${rmInfo2.activeThread}"`);
    await pageRm.screenshot({ path: path.join(OUT, 'exp-reduced-motion-after.png') });
    console.log('wrote exp-reduced-motion-after.png');
  }
  console.log('wrote exp-reduced-motion-before.png');
  await ctxRm.close();

  await browser.close();
  console.log('\ndone');
})();
