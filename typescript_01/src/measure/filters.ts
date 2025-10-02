// src/measure/filters.ts
export class EMA {
  private alpha: number;
  private _value: number | null = null;
  constructor(alpha = 0.2) { this.alpha = alpha; }
  update(x: number | null | undefined) {
    if (x == null || isNaN(x)) return this._value;
    if (this._value == null) this._value = x;
    else this._value = this.alpha * x + (1 - this.alpha) * this._value;
    return this._value;
  }
  value() { return this._value ?? undefined; }
}

export class MedianBuffer {
  private buf: number[] = [];
  private cap: number;
  constructor(cap = 21) { this.cap = cap; }
  push(x: number | null | undefined) {
    if (x == null || isNaN(x)) return;
    this.buf.push(x);
    if (this.buf.length > this.cap) this.buf.shift();
  }
  median() {
    if (!this.buf.length) return undefined;
    const s = [...this.buf].sort((a,b)=>a-b);
    const mid = Math.floor(s.length/2);
    return (s.length % 2) ? s[mid] : (s[mid-1]+s[mid])/2;
  }
  values(){ return [...this.buf]; }
}

export {};

