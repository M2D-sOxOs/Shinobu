import { Condition, ConditionConfig } from "./HEAD/Condition";
import { Expression } from "../../Expression";
import { Result, ResultConfig } from "./HEAD/Result";

export type HEADConfig = {
  Indicator: ConditionConfig[],
  Postprocess?: string,
  Result?: ResultConfig
}

export class HEAD {

  public readonly Indicator: Condition;
  public readonly Postprocess?: Expression;
  public readonly Result?: Result;

  constructor(headConfig: HEADConfig) {

    this.Indicator = new Condition(headConfig.Indicator);
    if (headConfig.Postprocess) this.Postprocess = new Expression(headConfig.Postprocess);
    if (headConfig.Result) this.Result = new Result(headConfig.Result);
  }
}