import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { connect } from "puppeteer-real-browser";
puppeteer.use(StealthPlugin());

export async function launchBrowser() {
  const { browser, page } = await connect({
    headless: true,
    fingerprint: true,
    turnstile: true,
    args: [
      "--window-size=425,700",
      `--ignore-certificate-errors`,
      `--no-sandbox`,
      `--disable-setuid-sandbox`,
    ],
  });

  await page.setViewport({ width: 425, height: 700 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  return { browser, page };
}
