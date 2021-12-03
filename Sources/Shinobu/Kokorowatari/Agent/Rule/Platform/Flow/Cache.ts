import { Expression } from "../../../Rule/Expression";

export type CacheConfig = {
  Mode: 'PASSIVE' | 'ACTIVE',
  Key: string[],
  Expire: string
};

export class Cache {

  public readonly Mode: 'PASSIVE' | 'ACTIVE';

  public readonly Key: Expression[];

  public readonly Expire: Expression

  constructor(cacheConfig: CacheConfig) {

    this.Mode = cacheConfig.Mode;
    this.Key = cacheConfig.Key.map(v => new Expression(v));
    this.Expire = new Expression(cacheConfig.Expire);
  }
}