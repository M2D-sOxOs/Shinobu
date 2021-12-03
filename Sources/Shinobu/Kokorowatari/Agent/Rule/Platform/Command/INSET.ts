import { Result, ResultConfig } from "./INSET/Result";

export type INSETConfig = {
  Strict: boolean,
  Result: ResultConfig
}

export class INSET {

  public readonly Strict: boolean;

  public readonly Result?: Result;

  constructor(domConfig: INSETConfig) {

    this.Strict = domConfig.Strict;
    this.Result = new Result(domConfig.Result);
  }
}