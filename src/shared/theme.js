export function getThemeVar(name, root = document.body) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}
