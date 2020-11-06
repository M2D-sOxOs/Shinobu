import { Table } from "../../../../Rule";

export type ResultConfig = {
  Type: 'SIMPLE' | 'TABLE' | 'ARRAY',
  Map?: string,
  Value: string | ResultConfig | Table<ResultConfig>
}

export class Result {

  public readonly Type: 'SIMPLE' | 'TABLE' | 'ARRAY';
  public readonly Map?: string;
  public readonly Value: string | Result | Table<Result>;

  constructor(resultConfig: ResultConfig) {

    this.Type = resultConfig.Type;

    switch (this.Type) {
      case 'SIMPLE':
        this.Value = resultConfig.Value as string;
        break;
      case 'TABLE':
        this.Value = {};
        for (const resultKey in <Table<ResultConfig>>resultConfig.Value) this.Value[resultKey] = new Result((resultConfig.Value as any)[resultKey] as ResultConfig);
        break;
      case 'ARRAY':
        this.Value = new Result(resultConfig.Value as ResultConfig);
        break;
    }

    this.Map = resultConfig.Map;
  }

}