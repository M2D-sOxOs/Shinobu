export class Tokei {

  public static Catalog: { [k: string]: number[] } = {};

  public static async Record<T>(catalog: string, fn: () => T): Promise<T> {
    this.Catalog[catalog] = this.Catalog[catalog] || [];

    const startTime = new Date().getTime();
    const result: T = await fn();
    this.Catalog[catalog].push(new Date().getTime() - startTime);
    return result;
  }

  public static Report() {
    console.log('Catalog', 'Count', 'Avg.', 'Max.', 'Min.')
    for (const catalogKey in this.Catalog) {
      console.log(catalogKey, this.Catalog[catalogKey].length, this.Catalog[catalogKey].reduce((p, c) => p + c, 0) / this.Catalog[catalogKey].length, Math.max(...this.Catalog[catalogKey]), Math.min(...this.Catalog[catalogKey]));
    }
  }
}