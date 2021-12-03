import { Table } from "../../../../Rule";

export type ResultConfig = {
  Type: 'SIMPLE' | 'TABLE' | 'ARRAY' | 'ARRAY_VALUE' | 'COMBINED' | 'NULL',
  Map?: {
    From: string,
    To: string
  },
  Value: string | ResultConfig | Table<ResultConfig>
}

export class Result {

  public readonly Type: 'SIMPLE' | 'TABLE' | 'ARRAY' | 'ARRAY_VALUE' | 'COMBINED' | 'NULL';
  public readonly MapFrom?: string;
  public readonly MapTo?: string;
  public readonly Value: string | Result | Table<Result> | null;

  constructor(resultConfig: ResultConfig) {

    this.Type = resultConfig.Type;

    if (resultConfig.Map) {
      this.MapFrom = resultConfig.Map.From;
      this.MapTo = resultConfig.Map.To;
    }

    switch (this.Type) {
      case 'SIMPLE':
      case 'COMBINED':
        this.Value = resultConfig.Value as string;
        break;
      case 'NULL':
        this.Value = null;
        break;
      case 'TABLE':
        this.Value = {};
        for (const resultKey in <Table<ResultConfig>>resultConfig.Value) this.Value[resultKey] = new Result((resultConfig.Value as any)[resultKey] as ResultConfig);
        break;
      case 'ARRAY':
      case 'ARRAY_VALUE':
        this.Value = new Result(resultConfig.Value as ResultConfig);
        break;
    }

  }

}