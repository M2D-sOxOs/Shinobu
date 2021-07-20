import { Urusai } from "../../../../../../../Common/Urusai/Urusai";
import { Expression } from "../../../Expression";

export type ConditionConfigEntity = {
  Selector?: string,
  Path?: string,
  Value?: string,
  Method?: string,
  Parameters?: string[],
  Symbol?: 'EQUAL' | 'NOT_EQUAL',
  Expect?: string
};

export type ConditionConfig = ConditionConfigEntity | 'OR' | 'AND';

export type ConditionPattern = {
  Selector?: string,
  Path?: string,
  Method?: string,
  Value?: Expression,
  Parameters?: Expression[],
  Symbol?: 'EQUAL' | 'NOT_EQUAL',
  Expect?: Expression
}

export class Condition {

  public readonly Connector?: 'OR' | 'AND';

  public readonly Patterns: ConditionPattern[][] = [];

  constructor(conditionConfig: ConditionConfig[]) {

    let foundOr: number;
    while (-1 != (foundOr = conditionConfig.indexOf('OR'))) {
      this.Patterns.push((conditionConfig.splice(0, foundOr).filter(v => !(v == 'AND')) as ConditionConfigEntity[]).map(v => <ConditionPattern>{
        Selector: v.Selector,
        Path: v.Path,
        Value: v.Value,
        Method: v.Method,
        Parameters: v.Parameters?.map(v => new Expression(v)),
        Symbol: v.Symbol,
        Expect: new Expression(v.Expect)
      }));
      conditionConfig.shift();
    }

    this.Patterns.push((conditionConfig as ConditionConfigEntity[]).map(v => <ConditionPattern>{
      Selector: v.Selector,
      Path: v.Path,
      Value: v.Value,
      Method: v.Method,
      Parameters: v.Parameters?.map(v => new Expression(v)),
      Symbol: v.Symbol,
      Expect: new Expression(v.Expect)
    }));
  }

  public async Estimate(domAnalyzer: cheerio.Root, sessionStorage?: any, flowZone?: any): Promise<boolean> {

    let estimateResult = false;
    for (const pattern of this.Patterns) {

      let patternResult = true;
      for (const condition of pattern) {

        if (!condition.Path && !condition.Selector && !condition.Value) Urusai.Panic("Neither Path nor Selector and Value is defined in condition");

        // Selector first
        if (condition.Selector) patternResult = patternResult && await this.__EstimateSelector(condition, domAnalyzer, sessionStorage, flowZone);

        // Value second
        if (condition.Value) patternResult = patternResult && await this.__EstimateValue(condition, sessionStorage, flowZone);

        if (!patternResult) break;
      }

      estimateResult = estimateResult || patternResult;
      if (estimateResult) return true;
    }

    return false;
  }

  private async __EstimateSelector(condition: ConditionPattern, domAnalyzer: cheerio.Root, sessionStorage: any, flowZone: any): Promise<boolean> {

    const targetDOMElement: cheerio.Cheerio = domAnalyzer(condition.Selector);

    // Must be matched or something went wrong
    if (0 == targetDOMElement.length) {
      Urusai.Warning('Selector matched nothing:', condition.Selector);
      return false;
    }

    if (!condition.Path) {
      Urusai.Error('Strict mode enabled without Path');
      return false;
    }

    if (condition.Path != await this.__BuildPath(targetDOMElement)) return false;

    // Nothing to do
    if (!condition.Method) return true;

    return this.__EstimateMethod(condition, targetDOMElement, sessionStorage, flowZone);
  }

  private async __EstimateMethod(condition: ConditionPattern, targetDOMElement: cheerio.Cheerio, sessionStorage: any, flowZone: any): Promise<boolean> {

    if (!condition.Method || !condition.Symbol || !condition.Expect) Urusai.Panic('Using method in condition but not providing Symbol and Expect is not supported');
    else {

      if (!(condition.Method in targetDOMElement)) Urusai.Panic('Unsupported method:', condition.Method);

      const methodResult: any = (targetDOMElement[condition.Method as any] as any)(...condition.Parameters!.map(async (v) => await v.Value(sessionStorage, flowZone)));

      switch (condition.Symbol) {
        case 'EQUAL':
          return methodResult == await condition.Expect.Value();
        case 'NOT_EQUAL':
          return methodResult != await condition.Expect.Value();
        default:
          Urusai.Panic('Unsupported symbol for condition');
      }

    }
    return false;
  }

  private async __EstimateValue(condition: ConditionPattern, sessionStorage: any, flowZone: any): Promise<boolean> {

    // Nothing to do
    if (!condition.Method) return true;

    if (!condition.Method || !condition.Symbol || !condition.Expect) Urusai.Panic('Using method in condition but not providing Symbol and Expect is not supported');
    else {

      switch (condition.Symbol) {
        case 'EQUAL':
          return await condition.Value!.Value() == await condition.Expect.Value();
        case 'NOT_EQUAL':
          return await condition.Value!.Value() != await condition.Expect.Value();
        default:
          Urusai.Panic('Unsupported symbol for condition');
      }

    }
    return false;
  }

  private async __BuildPath(targetDOMElement: cheerio.Cheerio): Promise<string> {

    Urusai.Verbose('Trying to estimate generate path using selector');

    let builtPath: string = '';
    // Build Path
    while ('html' != targetDOMElement.get(0).tagName.toLowerCase()) {

      switch (targetDOMElement.get(0).tagName.toLowerCase()) {
        case 'body':
        case 'head':
          builtPath = '/' + targetDOMElement.get(0).tagName.toLowerCase() + builtPath;
          break;
        default:
          builtPath = '/' + targetDOMElement.index() + builtPath;
      }

      targetDOMElement = targetDOMElement.parent();
    }

    return builtPath;
  }

}
