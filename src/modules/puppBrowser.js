const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const proxyChain = require("proxy-chain");
const proxyChecker = require("proxy-checker");
const randomUseragent = require("random-useragent");
const path = require("path");
puppeteer.use(StealthPlugin());
/**
 * Передаем данные для proxy
 *
 * @param {string} host - host proxy
 * @param {string | number} port - port proxy
 * @param {string} username - username proxy
 * @param {string} password - password proxy
 */

const { chromium, firefox } = require("playwright");

async function createBrowser(host, port, username, password) {
  let proxyUrl;
  const userAgent = randomUseragent.getRandom();
  let args = [
    `--ignore-certificate-errors`, // Ignore certificate errors
    "--no-sandbox", // Disable sandbox
  ];
  if (host && port && username && password) {
    const proxy = `${host}:${port}`;
    const originalUrl = `http://${username}:${password}@${proxy}`;
    newProxy = await proxyChain.anonymizeProxy(originalUrl);
    proxyChecker.checkProxy(
      newProxy,
      port,
      {
        url: "https://www.google.com/", // URL для проверки
      },
      (host, port, ok, statusCode, err) => {
        if (ok) {
          args.push(`--proxy-server=${newProxy}`);
        } else {
          newProxy = null;
        }
      }
    );
  }

  const browser = await firefox.launch({
    headless: false, // Set to true for headless mode
    channel: "firefox", // Specify Firefox browser
    args: args.filter((arg) => arg),
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: userAgent,
  });
  context.setExtraHTTPHeaders({
    referer: "www.google.com",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "accept-encoding": "gzip, deflate, br",
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: 500, height: 700 });

  return [page, browser, proxyUrl];
}
module.exports = createBrowser;
