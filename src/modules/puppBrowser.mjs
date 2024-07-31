import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

export default async function createBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--window-size=425,700", `--ignore-certificate-errors`],
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });
    const patchedRTCConfig = {
      iceServers: [{ urls: "stun:stun.example.org" }],
    };
    Object.defineProperty(window, "RTCConfiguration", {
      writable: false,
      value: patchedRTCConfig,
    });
  });
  await page.setExtraHTTPHeaders({
    referer: "www.google.com",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "accept-encoding": "gzip, deflate, br",
  });
  return { page, browser };
}
