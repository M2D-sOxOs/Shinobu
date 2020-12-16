import { Expression } from "../../Rule/Expression";
import { Cache, CacheConfig } from "../Platform/Flow/Cache";

export type FlowConfig = {
  Flow: string[],
  Proxy?: string,
  Failover?: string,
  Cache?: CacheConfig
}

export class Flow {

  public readonly Flow: Expression[];
  public readonly Proxy?: Expression;
  public readonly Failover?: Expression;
  public readonly Cache?: Cache;

  constructor(flowConfig: FlowConfig) {

    this.Flow = flowConfig.Flow.map(v => new Expression(v));

    if (flowConfig.Proxy) this.Proxy = new Expression(flowConfig.Proxy);

    if (flowConfig.Failover) this.Failover = new Expression(flowConfig.Failover);

    if (flowConfig.Cache) this.Cache = new Cache(flowConfig.Cache);
  }

}