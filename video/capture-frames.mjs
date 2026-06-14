import { chromium } from "playwright";

const APP = "http://localhost:3001/verigate-arbitrum/";
const DECK = "file:///Users/yonko/Projects/verigate-arbitrum/deck/index.html";
const OWNER = "0xf9946775891a24462cD4ec885d0D4E2675C84355";
const INVESTOR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const OUT = "/Users/yonko/Projects/verigate-arbitrum/video/frames";

const injectProvider = (addr) => {
  const RPC = "https://rpc.testnet.chain.robinhood.com";
  const provider = {
    isMetaMask: true, _cbs: {},
    request: async ({ method, params }) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") return [addr];
      if (method === "eth_chainId") return "0xb626";
      if (method === "net_version") return "46630";
      if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
      const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random()*1e9), method, params: params || [] }) });
      const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
    },
    on(e, cb){ (this._cbs[e]=this._cbs[e]||[]).push(cb); }, removeListener(){},
  };
  window.ethereum = provider;
  const ann = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
    detail: Object.freeze({ info:{uuid:"00000000-0000-0000-0000-000000000001",name:"Mock",icon:"data:image/svg+xml;base64,PHN2Zy8+",rdns:"io.mock"}, provider }) }));
  window.addEventListener("eip6963:requestProvider", ann); ann();
};

const browser = await chromium.launch();

async function appShot(name, { addr, connect, tab }) {
  const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
  const page = await ctx.newPage();
  if (addr) await page.addInitScript(injectProvider, addr);
  await page.goto(APP, { waitUntil:"domcontentloaded" });
  await page.waitForTimeout(2000);
  if (connect) {
    await page.evaluate(()=>{const b=[...document.querySelectorAll("button")].find(b=>/connect wallet/i.test(b.textContent||"")&&!b.disabled); if(b)b.click();});
    try { await page.getByText(/Issuer Console/i).first().waitFor({timeout:12000}); } catch {}
    await page.waitForTimeout(2800);
  }
  if (tab) { const t=page.getByText(tab,{exact:false}).first(); if(await t.count()){await t.click().catch(()=>{}); await page.waitForTimeout(1800);} }
  await page.waitForTimeout(600);
  await page.screenshot({ path:`${OUT}/${name}.png` }); // viewport 1920x1080
  console.log("app:", name); await ctx.close();
}

async function deckShot(name, slideNum) {
  const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
  const page = await ctx.newPage();
  await page.goto(DECK, { waitUntil:"domcontentloaded" });
  await page.waitForTimeout(700);
  for (let i=1;i<slideNum;i++){ await page.keyboard.press("ArrowRight"); await page.waitForTimeout(120); }
  await page.waitForTimeout(500);
  await page.screenshot({ path:`${OUT}/${name}.png` });
  console.log("deck:", name, "slide", slideNum); await ctx.close();
}

await appShot("01-hook",   { addr:null, connect:false });
await deckShot("02-problem", 2);
await deckShot("03-solution", 3);
await appShot("04-blocked", { addr:INVESTOR, connect:true });
await appShot("05-verify",  { addr:OWNER, connect:true, tab:"Issuer Console" });
await deckShot("06-hardpart", 4);
await deckShot("07-close", 7);

await browser.close();
console.log("done");
