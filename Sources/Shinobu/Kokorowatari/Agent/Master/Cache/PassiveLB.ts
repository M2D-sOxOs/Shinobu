import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Master } from "../../Master";
import { Base, Entry } from "./Base";

export class PassiveLB extends Base {

  protected _Pending: string[] = [];

  constructor() {
    super();

    this._Queue();
  }

  public async Get(cacheKey: string) {

    const cacheEntry: Entry = this._Data[cacheKey];
    if(!cacheEntry) return null;
    const currentTime = new Date().getTime();

    if (currentTime > cacheEntry.Expire && -1 == this._Pending.indexOf(cacheKey)) this._Pending.push(cacheKey);

    return cacheEntry.Raw;
  }

  /**
   * Start queue
   */
  protected async _Queue() {

    // Tick time
    const intervalValue: number = Jinja.Get('Koyomi.Cache.Interval');

    // Tick
    setTimeout(async () => {
      const currentStamp = new Date().getTime();

      let cacheKey;
      while (cacheKey = this._Pending.shift()) {
        const cacheEntry = this._Data[cacheKey];
        await Master.Perform(cacheEntry.Flow, cacheEntry.In);
      }

      this._Queue();

    }, 1);
  }

}