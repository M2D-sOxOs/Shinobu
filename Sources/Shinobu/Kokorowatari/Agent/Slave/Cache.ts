import { Jinja } from "../../../../Common/Jinja/Jinja";

/**
 * Slave cache is just a cache manager to manage cache table in memory
 */
export class Cache {

  private static __Caches: { [k: string]: any } = {};
  private static __Timetable: ({ Key: string, Expire: number })[] = [];

  private static __Resort: boolean = false;

  /**
   * Start cache daemon
   */
  public static Start() {
    this.__Daemon();
  }

  /**
   * Is cache exists
   */
  public static Has(k: string): boolean {
    return k in this.__Caches;
  }

  /**
   * Get cache value
   */
  public static Get<T>(k: string): T {
    return this.__Caches[k];
  }

  /**
   * Set cache value
   */
  public static Set<T>(k: string, v: T, exp: number): T {

    // Remove is cache with same key is already exists
    if (k in this.__Caches) {
      const foundIndex = this.__Timetable.findIndex(v => v.Key == k);
      if (-1 != foundIndex) this.__Timetable.splice(foundIndex, 1);
    }

    this.__Resort = true;

    this.__Caches[k] = v;
    this.__Timetable.push({ Key: k, Expire: exp });
    return v;
  }

  /**
   * Daemon to clean up caches
   */
  private static __Daemon() {

    setInterval(() => {
      if (this.__Resort) {
        this.__Timetable = this.__Timetable.sort((a, b) => a.Expire - b.Expire);
        this.__Resort = false;
      }

      const currentTimestamp = new Date().getTime() / 1000 - Jinja.Get('Kokorowatari.Cache.Interval');
      const foundIndex = this.__Timetable.findIndex(v => currentTimestamp > v.Expire);
      if (-1 == foundIndex) return;
      this.__Timetable.splice(0, foundIndex + 1);

    }, Jinja.Get('Kokorowatari.Cache.Interval'));
  }
}