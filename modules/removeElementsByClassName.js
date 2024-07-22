export default function removeElementsByClassName(child) {
  let isRemoved = false;
  const removedClassNames = [
    "_widget",
    "faq",
    "footer",
    "uplp-list",
    "navbar",
    "hidden",
    "header",
    "sidebar",
    "related",
    "want-to-know",
    "sponsor",
    "brief",
    "social",
    "tags",
    "self-stretch",
    "slider",
    "join",
    "aside",
    "post-blocks",
    "author",
  ];
  removedClassNames.forEach((substring) => {
    const className = child.className.baseVal || child.className;
    if (
      typeof className === "string" &&
      className.includes(substring) &&
      !child.tagName.toLowerCase().includes("h")
    ) {
      isRemoved = true;
    }
  });
  return isRemoved;
}
