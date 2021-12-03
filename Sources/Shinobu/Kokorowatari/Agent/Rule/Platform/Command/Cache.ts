import { Expression } from "../../Expression";

export type CacheConfig = {
  Key: string[],
  Expire: string
}

export class Cache {

  public readonly Key: Expression[];
  public readonly Expire: Expression;

  constructor(cacheConfig: CacheConfig) {

    this.Key = cacheConfig.Key.map(v => new Expression(v));
    this.Expire = new Expression(cacheConfig.Expire);
  }
}