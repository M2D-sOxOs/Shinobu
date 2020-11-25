import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Table } from "../../Rule";

export type Entry = {
  Flow: string,
  In: any,
  Expire: number,
  Raw: any
};

export class Base {

  protected _Data: Table<Entry> = {};

  constructor() {

    const cachePath = Jinja.Get('Koyomi.Cache.Path');
    const activeCacheFile = join(cachePath, 'Koyomi-Active');
    if (existsSync(activeCacheFile)) this._Data = JSON.parse(readFileSync(activeCacheFile).toString('utf-8'));
  }

  public async Get(cacheKey: string) {
    return this._Data[cacheKey].Raw;
  }

  public async Set(cacheKey: string, cacheValue: any, flowName: string, inData: any, expire: number) {
    this._Data[cacheKey] = {
      Flow: flowName,
      In: inData,
      Expire: expire,
      Raw: cacheValue
    }
  }

}