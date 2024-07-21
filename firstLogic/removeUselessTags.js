export function removeUselessTags($) {
  const tagsToRemove = [
    "script",
    "style",
    "header",
    "nav",
    "footer",
    "noscript",
    "img",
  ];
  tagsToRemove.forEach((tag) => {
    $(tag).remove();
  });
}
