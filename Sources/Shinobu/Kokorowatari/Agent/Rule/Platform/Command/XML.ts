import { Condition, ConditionConfig } from "./XML/Condition";
import { Expression } from "../../Expression";
import { Result, ResultConfig } from "./XML/Result";

export type XMLConfig = {
  Indicator: ConditionConfig[],
  Postprocess?: string,
  Stash?: string;
  Result?: ResultConfig
}

export class XML {

  public readonly Indicator: Condition;
  public readonly Postprocess?: Expression;
  public readonly Stash?: string;
  public readonly Result?: Result;

  constructor(xmlConfig: XMLConfig) {

    this.Indicator = new Condition(xmlConfig.Indicator);
    this.Stash = xmlConfig.Stash;
    if (xmlConfig.Postprocess) this.Postprocess = new Expression(xmlConfig.Postprocess);
    if (xmlConfig.Result) this.Result = new Result(xmlConfig.Result);
  }
}