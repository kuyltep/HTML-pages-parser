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
 * Data for proxy (is not required)
 * @param {string} url - page url
 * @param {string} host - host proxy
 * @param {string | number} port - port proxy
 * @param {string} username - username proxy
 * @param {string} password - password proxy
 */
//Proxy is not required, you can use library without proxy
//(if you don't use proxy or your proxy is incorrect parser working with default settings)
async function getDataFromPage(url, host, port, username, password) {
  const data = await parser(url, host, port, username, password); // return string data
  return data;
}

// Пример использования:
const result = await getDataFromPage("https://example.com");
console.log(result);
```
