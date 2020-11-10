import { Table } from "../../../../Rule";
import { Expression } from "../../../../Rule/Expression";

export type ResultConfig = {
  Type: 'SIMPLE' | 'TABLE' | 'ARRAY' | 'URL',
  Map?: {
    From: string,
    To: string
  },
  Value: string | ResultConfig | Table<ResultConfig>
}

export class Result {

  public readonly Type: 'SIMPLE' | 'TABLE' | 'ARRAY' | 'URL';
  public readonly MapFrom?: Expression;
  public readonly MapTo?: string;
  public readonly Value: Expression | Result | Table<Result>;

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