import { Expression } from "../../../Expression";

export type ConditionConfigEntity = {
  Value: string,
  Symbol: 'EQUAL' | 'NOT_EQUAL',
  Expect: string
};

export type ConditionConfig = ConditionConfigEntity | 'OR' | 'AND';

export type ConditionPattern = {
  Value: Expression,
  Symbol: 'EQUAL' | 'NOT_EQUAL',
  Expect: Expression
}

export class Condition {

  public readonly Connector?: 'OR' | 'AND';

  public readonly Patterns: ConditionPattern[][] = [];

  constructor(conditionConfig: ConditionConfig[]) {

    let foundOr: number;
    while (-1 != (foundOr = conditionConfig.indexOf('OR'))) {
      this.Patterns.push((conditionConfig.splice(0, foundOr).filter(v => !(v == 'AND')) as ConditionConfigEntity[]).map(v => <ConditionPattern>{
        Value: new Expression(v.Value),
        Symbol: v.Symbol,
        Expect: new Expression(v.Expect)
      }));
      conditionConfig.shift();
    }

    this.Patterns.push((conditionConfig as ConditionConfigEntity[]).map(v => <ConditionPattern>{
      Value: new Expression(v.Value),
      Symbol: v.Symbol,
      Expect: new Expression(v.Expect)
    }));
  }

  public async Estimate(sessionStorage?: any, flowZone?: any): Promise<boolean> {

    let estimateResult = false;
    for (const pattern of this.Patterns) {

      let patternResult = true;
      for (const condition of pattern) {

        switch (condition.Symbol) {
          case 'EQUAL':
            patternResult = patternResult && (await condition.Value.Value(sessionStorage, flowZone)) == (await condition.Expect.Value(sessionStorage, flowZone));
          case 'NOT_EQUAL':
            patternResult = patternResult && (await condition.Value.Value(sessionStorage, flowZone)) != (await condition.Expect.Value(sessionStorage, flowZone));
        }

        if (!patternResult) break;
      }

      estimateResult = estimateResult || patternResult;
      if (estimateResult) return true;
    }

    return false;
  }

}
