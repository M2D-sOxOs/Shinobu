import { Expression } from "../Expression";
import { Cache, CacheConfig } from "../Platform/Flow/Cache";

export type FlowConfig = {
  Flow: string[],
  Failover?: string,
  Cache?: CacheConfig
}

export class Flow {

  public readonly Flow: Expression[];
  public readonly Failover?: Expression;
  public readonly Cache?: Cache;

  constructor(flowConfig: FlowConfig) {

    this.Flow = flowConfig.Flow.map(v => new Expression(v));

    if (flowConfig.Failover) this.Failover = new Expression(flowConfig.Failover);

    if (flowConfig.Cache) this.Cache = new Cache(flowConfig.Cache);
  }

}