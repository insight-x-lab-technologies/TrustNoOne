export function showScreen(screenName) {
  const nextScreen = document.getElementById(`screen-${screenName}`);
  if (!nextScreen) return;
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
  nextScreen.classList.add('active');
  document.body.dataset.activeScreen = screenName;
  window.scrollTo(0, 0);
}

export function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}
