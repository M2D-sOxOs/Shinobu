import { Table } from "../../Rule";
import { Expression } from "../Expression";

export type ClientConfig = {
  Host: string,
  Headers: Table<string>
}

export class Client {

  public readonly Host: string;
  public readonly Headers: Table<Expression> = {};

  constructor(clientConfig: ClientConfig) {
    this.Host = clientConfig.Host;
    if (clientConfig.Headers) for (const headerKey in clientConfig.Headers) this.Headers[headerKey] = new Expression(clientConfig.Headers[headerKey]);
  }
}