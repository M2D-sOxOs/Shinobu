import { Condition, ConditionConfig } from "./DOM/Condition";
import { Result, ResultConfig } from "./DOM/Result";
import { Model, ModelConfig } from "./DOM/Model";
import { Processor, ProcessorConfig } from "./DOM/Processor";

export type DOMConfig = {
  Strict: boolean,
  Model?: ModelConfig,
  Preprocess?: ProcessorConfig[],
  Indicator: ConditionConfig[],
  Stash?: string;
  Result?: ResultConfig
}

export class DOM {

  public readonly Strict: boolean;

  public readonly Model?: Model;

  public readonly Preprocess?: Processor[];
  
  public readonly Indicator: Condition;

  public readonly Stash?: string;

  public readonly Result?: Result;

  constructor(domConfig: DOMConfig) {

    this.Strict = domConfig.Strict;
    this.Stash = domConfig.Stash;

    if (domConfig.Model) this.Model = new Model(domConfig.Model);;

    this.Preprocess = domConfig.Preprocess?.map(v => new Processor(v));

    this.Indicator = new Condition(domConfig.Indicator);
    
    if (domConfig.Result) this.Result = new Result(domConfig.Result);
  }
}