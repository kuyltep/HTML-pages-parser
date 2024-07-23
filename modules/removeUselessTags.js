export default function removeUselessTags(document) {
  const tagsToRemove = [
    "script",
    "svg",
    "button",
    "style",
    "iframe",
    "noscript",
    "head",
    "nav",
    "footer",
    "header",
    "figure",
    "form",
    "video",
    "canvas",
    "figcaption",
    "aside",
    "recommend",
    "articles",
    "banner",
    "menu",
  ];
  tagsToRemove.forEach((tag) => {
    const elements = document.querySelectorAll(tag);
    elements.forEach((element) => element.remove());
  });
}
