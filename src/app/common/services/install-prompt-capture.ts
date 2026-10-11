let captured: Event | null = null;
let listening = false;

export function captureInstallPrompt(win: Window | null): void {
  if (listening || !win) return;
  listening = true;
  win.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    captured = event;
  });
}

export function takeCapturedInstallPrompt(): Event | null {
  const event = captured;
  captured = null;
  return event;
}
