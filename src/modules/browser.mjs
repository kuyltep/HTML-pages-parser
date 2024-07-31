import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { connect } from "puppeteer-real-browser";

puppeteer.use(StealthPlugin());

export async function launchBrowser() {
  const { browser, page } = await connect({
    headless: false,
    fingerprint: true,
    turnstile: true,
    args: ["--window-size=425,700", `--ignore-certificate-errors`],
  });
  await page.setViewport({ width: 425, height: 700 });

  return { browser, page };
}
