import { Condition, ConditionConfig } from "./JSON/Condition";
import { Expression } from "../../../Rule/Expression";
import { Result, ResultConfig } from "./JSON/Result";

export type JSONConfig = {
  Indicator: ConditionConfig[],
  Postprocess?: string,
  Stash?: string;
  Result?: ResultConfig
}

export class JSON {

  public readonly Indicator: Condition;
  public readonly Postprocess?: Expression;
  public readonly Stash?: string;
  public readonly Result?: Result;

  constructor(jsonConfig: JSONConfig) {

    this.Indicator = new Condition(jsonConfig.Indicator);
    this.Stash = jsonConfig.Stash;
    if (jsonConfig.Postprocess) this.Postprocess = new Expression(jsonConfig.Postprocess);
    if (jsonConfig.Result) this.Result = new Result(jsonConfig.Result);
  }
}