
// https://stackoverflow.com/a/750043/2288659
export class LFSR {
  private seed: number;

  constructor(seed?: number) {
    if (seed === undefined) {
      seed = Math.random() * 676000 + 1;
    }
    this.seed = Math.floor(seed);
  }

  generate(): number {
    this.seed = (this.seed >> 1) ^ (-(this.seed & 1) & 0x90000);
    return this.seed;
  }

}
