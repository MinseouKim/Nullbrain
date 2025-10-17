// Simple EMA and MedianBuffer for smoothing
export class EMA {
  private alpha: number;
  private s: number | null = null;
  constructor(alpha = 0.2) { this.alpha = alpha; }
  update(x: number) {
    this.s = this.s == null ? x : (this.alpha * x + (1 - this.alpha) * this.s);
    return this.s;
  }
}
export class MedianBuffer {
  private buf: number[] = [];
  private cap: number;
  constructor(cap = 21) { this.cap = cap; }
  push(v: number){ this.buf.push(v); if(this.buf.length>this.cap) this.buf.shift(); }
  median(){
    if(!this.buf.length) return null;
    const tmp = [...this.buf].sort((a,b)=>a-b);
    const mid = Math.floor(tmp.length/2);
    return tmp.length%2? tmp[mid] : (tmp[mid-1]+tmp[mid])/2;
  }
}
