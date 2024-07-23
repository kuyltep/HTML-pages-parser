export default function getRect(element) {
  if (!element) {
    throw new Error("Element is null or undefined");
  }

  const rect = element.getBoundingClientRect();

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  };
}
