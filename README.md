# html-pages-parser

**Описание**

Этот модуль предоставляет простой и удобный способ извлекать данные из HTML-страниц в формате JSON.

**Установка**

```bash
npm install html-pages-parser
```

```javascript
const parser = require("html-pages-parser");

async function getDataFromPage(url) {
  const data = await parser(url); // Возвращает данные в формате JSON
  return data;
}

// Пример использования:
const result = await getDataFromPage("https://example.com");
console.log(result);
```
