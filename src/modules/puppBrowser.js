const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const proxyChain = require("proxy-chain");
const proxyChecker = require("proxy-checker");
const randomUseragent = require("random-useragent");
puppeteer.use(StealthPlugin());
/**
 * Передаем данные для proxy
 *
 * @param {string} host - host proxy
 * @param {string | number} port - port proxy
 * @param {string} username - username proxy
 * @param {string} password - password proxy
 */
async function createBrowser(host, port, username, password) {
  let args = [
    "--window-size=425,700",
    `--ignore-certificate-errors`,
    "--no-sandbox",
  ];
  let newProxy;
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

  const browser = await puppeteer.launch({
    headless: false,
    args: args,
  });

  const page = await browser.newPage();
  await page.authenticate({ username, password });
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
  if (!newProxy) {
    const userAgent = randomUseragent.getRandom();
    await page.setUserAgent(userAgent);
  }

  await page.setExtraHTTPHeaders({
    referer: "www.google.com",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "accept-encoding": "gzip, deflate, br",
  });
  return [page, browser, newProxy];
}
module.exports = createBrowser;
