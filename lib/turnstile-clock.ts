// UX timers only. They never replace server-side Siteverify validation.
export const TOKEN_REFRESH_MS = 4 * 60 * 1000;
export const PANEL_RECHECK_MS = 25 * 60 * 1000;

export class TurnstileClock {
  private token: { value: string; issuedAt: number } | null = null;
  private recheckAt: number;

  constructor(now = Date.now()) {
    this.recheckAt = now + PANEL_RECHECK_MS;
  }

  needsRecheck(now = Date.now()) {
    return now >= this.recheckAt;
  }

  restartWindow(now = Date.now()) {
    this.recheckAt = now + PANEL_RECHECK_MS;
    this.clear();
  }

  issue(value: string, now = Date.now()) {
    if (!this.needsRecheck(now)) this.token = { value, issuedAt: now };
  }

  isFresh(now = Date.now()) {
    return Boolean(this.token && now >= this.token.issuedAt && now - this.token.issuedAt < TOKEN_REFRESH_MS && !this.needsRecheck(now));
  }

  take(now = Date.now()) {
    const value = this.isFresh(now) ? this.token!.value : null;
    this.clear();
    return value;
  }

  clear() {
    this.token = null;
  }
}
