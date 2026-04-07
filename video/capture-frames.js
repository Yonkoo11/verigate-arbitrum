const puppeteer = require('puppeteer');
const path = require('path');

const FRAMES_DIR = path.join(__dirname, 'frames');

async function capture() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Clip 01 & 07: Hero split (gate metaphor)
  console.log('Capturing hero...');
  await page.goto('https://yonkoo11.github.io/verigate/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000)); // Wait for fonts to load
  await page.screenshot({ path: path.join(FRAMES_DIR, '01-hook.png'), fullPage: false });
  await page.screenshot({ path: path.join(FRAMES_DIR, '07-close.png'), fullPage: false });
  console.log('  -> 01-hook.png, 07-close.png');

  // Clip 02: BSCScan factory contract (verified)
  console.log('Capturing BSCScan...');
  await page.goto('https://testnet.bscscan.com/address/0x60aa769416EfBbc0A6BC9cb454758dE6f76D52B5#code', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(FRAMES_DIR, '02-problem.png'), fullPage: false });
  console.log('  -> 02-problem.png');

  await browser.close();
  console.log('Live captures done. Dashboard frames need to be generated separately.');
}

capture().catch(e => { console.error(e); process.exit(1); });
