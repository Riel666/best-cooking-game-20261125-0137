// Keyboard and mouse into one small state the game reads each frame.
// Clicks on the canvas become floor targets; clicks on a station become
// "walk there and use it" (the game resolves the station from the point).
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.interactHeld = false;
    this.interactPressed = false;
    this.click = null; // { x, y } in canvas pixels, consumed by the game
    this.onFirstGesture = null;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        this.interactHeld = true;
        this.interactPressed = true;
      }
      if (this.onFirstGesture) { this.onFirstGesture(); this.onFirstGesture = null; }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') this.interactHeld = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.click = { x, y };
      if (this.onFirstGesture) { this.onFirstGesture(); this.onFirstGesture = null; }
    });
  }

  axis() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    return { dx, dy };
  }

  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  takeInteractPressed() {
    const p = this.interactPressed;
    this.interactPressed = false;
    return p;
  }
}
