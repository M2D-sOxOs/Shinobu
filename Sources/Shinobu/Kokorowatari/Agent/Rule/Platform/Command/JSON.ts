import { Condition, ConditionConfig } from "./JSON/Condition";
import { Expression } from "../../../Rule/Expression";
import { Result, ResultConfig } from "./JSON/Result";

export type JSONConfig = {
  Indicator: ConditionConfig[],
  Postprocess?: string,
  Result?: ResultConfig
}

export class JSON {

  public readonly Indicator: Condition;
  public readonly Postprocess?: Expression;
  public readonly Result?: Result;

  constructor(jsonConfig: JSONConfig) {

    this.Indicator = new Condition(jsonConfig.Indicator);
    if (jsonConfig.Postprocess) this.Postprocess = new Expression(jsonConfig.Postprocess);
    if (jsonConfig.Result) this.Result = new Result(jsonConfig.Result);
  }
}