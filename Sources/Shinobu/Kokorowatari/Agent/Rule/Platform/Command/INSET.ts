import { Result, ResultConfig } from "./INSET/Result";

export type INSETConfig = {
  Strict: boolean,
  Stash?: string;
  Result: ResultConfig
}

export class INSET {

  public readonly Strict: boolean;
  public readonly Stash?: string;
  public readonly Result?: Result;

  constructor(domConfig: INSETConfig) {

    this.Strict = domConfig.Strict;
    this.Stash = domConfig.Stash;
    this.Result = new Result(domConfig.Result);
  }
}