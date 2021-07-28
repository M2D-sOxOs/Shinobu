import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Agent } from "../../../Agent";
import { Master } from "../../Master";
import { Base } from "./Base";

export class Active extends Base {

  protected _Pending: string[] = [];

  constructor() {
    super();

    this._Queue();
    this._Tick();
  }

  /**
   * Start tick
   */
  protected async _Tick() {

    // Tick time
    const intervalValue: number = Jinja.Get('Koyomi.Cache.Interval');

    // Tick
    setTimeout(() => {
      const currentStamp = new Date().getTime();
      for (const dataKey in this._Data) {
        if ((this._Data[dataKey].Expire - intervalValue) < currentStamp && -1 == this._Pending.indexOf(dataKey)) this._Pending.push(dataKey);
      }

      this._Queue();

    }, intervalValue);
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
        await Master.Perform(cacheEntry.Flow, cacheEntry.In, Agent.GenerateID());
      }

      this._Queue();

    }, 1);
  }
}