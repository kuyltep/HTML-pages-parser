import launchBrowser from "./modules/browser";
import processPage from "./modules/pageProcessor";
import generateColumnTree from "./modules/generateColumnTree";
import findMainContentColumn from "./modules/findMainContentColumn";
import createTextFromColumn from "./modules/createTextFromColumn";

async function fetchPageData(url) {
  const { browser, page } = await launchBrowser();
  const bodyZone = await processPage(page, url);

  const columns = generateColumnTree(bodyZone.children);
  const mainColumn = findMainContentColumn(columns);
  const text = createTextFromColumn(mainColumn);
  console.log(JSON.stringify(text));
}
