# html-pages-parser

**Описание**

Этот модуль предоставляет простой и удобный способ извлекать данные из HTML-страниц в формате JSON.

**Установка**

```bash
npm install html-pages-parser
```

```javascript
const parser = require("html-pages-parser");
/**
 * @param {string} url - page url
 * @param {object} options - options for parser
 * @param {string} options.host - host proxy
 * @param {string | number} options.port - port proxy
 * @param {string} options.username - username proxy
 * @param {string} options.password - password proxy
 * @param {string[]} options.classesToRemove - array with classes by which the parser delete the elements //optional has default array for crypto sites
 * @param {string[]} options.tagsToRemove - array with tags which the parser delete the elements //optional has default array for crypto sites
 * @param {string[]} options.textToRemove - array with text which the parser delete the elements with this text //optional has default array for crypto sites
 */
//Proxy is not required, you can use library without proxy
//(if you don't use proxy or your proxy is incorrect parser working with default settings)
async function getDataFromPage(url, host, port, username, password) {
  const data = await parser(url, host, port, username, password); // return string data
  return data;
}

// Example:
const result = await getDataFromPage("https://example.com");
console.log(result);
```
