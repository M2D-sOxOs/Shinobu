import { Table } from "../../../Rule";
import { Expression } from "../../Expression";

export type RequestConfig = {
  Method: 'GET' | 'POST',
  URL: string,
  Timeout: number,
  Headers: Table<string>,
  Parameters: Table<string>,
  Forms: Table<string>
}

export class Request {

  public readonly Method: 'GET' | 'POST';
  public readonly URL: string;
  public readonly Timeout: number;
  public readonly Headers: Table<Expression> = {};
  public readonly Parameters: Table<Expression> = {};
  public readonly Forms: Table<Expression> = {};

  constructor(requestConfig: RequestConfig) {

    this.Method = requestConfig.Method;
    this.URL = requestConfig.URL;
    this.Timeout = requestConfig.Timeout;

    if (requestConfig.Headers) for (const headerKey in requestConfig.Headers) this.Headers[headerKey] = new Expression(requestConfig.Headers[headerKey]);
    if (requestConfig.Parameters) for (const parameterKey in requestConfig.Parameters) this.Parameters[parameterKey] = new Expression(requestConfig.Parameters[parameterKey]);
    if (requestConfig.Forms) for (const formKey in requestConfig.Forms) this.Forms[formKey] = new Expression(requestConfig.Forms[formKey]);
  }
}