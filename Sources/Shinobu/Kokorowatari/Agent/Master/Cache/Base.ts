import { writeFileSync } from "fs";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";

export type Entry = {
  Flow: string,
  In: any,
  Expire: number,
  Raw: any
};

/**
 * Cache will block the request already performed in same time.
 * Unlike Request Merge, same request block in Cache will not be affected by Timeout.
 */

export class Base {

  protected _Data: Table<Entry> = {};

  protected _Requesting: string[] = [];

  constructor(protected _Filename: string) {

    Urusai.Verbose('Loading cache from:', this._Filename);
    if (existsSync(this._Filename)) this._Data = JSON.parse(readFileSync(this._Filename).toString('utf-8'));
    this.__Monitor(Jinja.Get('Koyomi.Cache.Save'));
  }

  public async Get(cacheKey: string) {

    const cacheEntry: Entry = this._Data[cacheKey];
    if (!cacheEntry) {

      if (-1 != this._Requesting.indexOf(cacheKey)) return await this.__Wait(cacheKey);
      this._Requesting.push(cacheKey);
      return null;
    }

    return (this._Data[cacheKey] || {}).Raw;
  }

  public async Set(cacheKey: string, cacheValue: any, flowName: string, inData: any, expire: number) {
    this._Data[cacheKey] = {
      Flow: flowName,
      In: inData,
      Expire: expire,
      Raw: cacheValue
    }

    if (-1 != this._Requesting.indexOf(cacheKey)) this._Requesting.splice(this._Requesting.indexOf(cacheKey), 1);
  }

  public async Clear(cacheKey: string) {

    if (-1 != this._Requesting.indexOf(cacheKey)) this._Requesting.splice(this._Requesting.indexOf(cacheKey), 1);
  }

  private async __Wait(cacheKey: string) {

    Urusai.Verbose('Waiting for cache already fired.')

    return new Promise((s, f) => {
      const loop = () => {
        if (this._Data[cacheKey]) s(this._Data[cacheKey]);
        else if (-1 != this._Requesting.indexOf(cacheKey)) setTimeout(loop, 10);
        else throw 'Cache failed after waiting.'
      };
    })
  }

  private __Monitor(saveDelay: number) {

    setTimeout(() => {
      Urusai.Verbose('Master cache saved');
      writeFileSync(this._Filename, JSON.stringify(this._Data));
      this.__Monitor(saveDelay);
    }, saveDelay);
  }

}