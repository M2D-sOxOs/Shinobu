import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Agent } from "../../../Agent";
import { Master } from "../../Master";
import { Base, Entry } from "./Base";

export class PassiveLB extends Base {

  protected _Pending: string[] = [];

  constructor() {
    super();

    this._Queue();
  }

  public async Get(cacheKey: string) {

    const cacheData = await super.Get(cacheKey);
    if (!cacheData) return cacheData;

    const cacheEntry: Entry = this._Data[cacheKey];

    const currentTime = new Date().getTime();
    if (currentTime > cacheEntry.Expire && -1 == this._Pending.indexOf(cacheKey)) this._Pending.push(cacheKey);

    return cacheData;
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
        Master.Perform(cacheEntry.Flow, cacheEntry.In, Agent.GenerateID());
      }

      this._Queue();

    }, intervalValue);
  }

}