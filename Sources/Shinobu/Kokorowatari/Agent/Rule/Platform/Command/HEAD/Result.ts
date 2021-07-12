import { Table } from "../../../../Rule";
import { Expression } from "../../../Expression";

export type ResultConfig = {
  Type: 'CONCAT' | 'SIMPLE' | 'TABLE' | 'ARRAY' | 'URL',
  Map?: {
    From: string,
    To: string
  },
  Value: string | ResultConfig | Table<ResultConfig> | Array<Expression>
}

export class Result {

  public readonly Type: 'CONCAT' | 'SIMPLE' | 'TABLE' | 'ARRAY' | 'URL' | 'NULL';
  public readonly MapFrom?: Expression;
  public readonly MapTo?: string;
  public readonly Value: Expression | Result | Table<Result> | Array<Expression>;

  constructor(resultConfig: ResultConfig) {

    this.Type = resultConfig.Type;
    if (resultConfig.Map) {
      this.MapFrom = new Expression(resultConfig.Map.From);
      this.MapTo = resultConfig.Map.To;
    }

    switch (this.Type) {
      case 'SIMPLE':
      case 'URL':
        this.Value = new Expression(resultConfig.Value);
        break;
      case 'CONCAT':
        this.Value = [];
        for (const resultExpression of <Array<Expression>>resultConfig.Value) this.Value.push(new Expression(resultExpression));
        break;
      case 'TABLE':
        this.Value = {};
        for (const resultKey in <Table<ResultConfig>>resultConfig.Value) this.Value[resultKey] = new Result((resultConfig.Value as any)[resultKey] as ResultConfig);
        break;
      case 'ARRAY':
        this.Value = new Result(resultConfig.Value as ResultConfig);
        break;
    }
  }
}