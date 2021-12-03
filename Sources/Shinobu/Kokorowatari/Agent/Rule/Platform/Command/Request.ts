import { Table } from "../../../Rule";
import { Expression } from "../../../Rule/Expression";

export type RequestConfig = {
  Method: 'GET' | 'POST',
  URL: string,
  Timeout: number,
  Headers: Table<string>,
  Parameters: Table<string>,
  Forms: Table<string>,
  Encoding?: string
}

export class Request {

  public readonly Method: 'GET' | 'POST';
  public readonly URL: Expression;
  public readonly Timeout: number;
  public readonly Headers: Table<Expression> = {};
  public readonly Parameters: Table<Expression> = {};
  public readonly Forms: Table<Expression> = {};
  public readonly Encoding?: string;

  constructor(requestConfig: RequestConfig) {

    this.Method = requestConfig.Method;
    this.URL = new Expression(requestConfig.URL);
    this.Timeout = requestConfig.Timeout;

    if (requestConfig.Headers) for (const headerKey in requestConfig.Headers) this.Headers[headerKey] = new Expression(requestConfig.Headers[headerKey]);
    if (requestConfig.Parameters) for (const parameterKey in requestConfig.Parameters) this.Parameters[parameterKey] = new Expression(requestConfig.Parameters[parameterKey]);
    if (requestConfig.Forms) for (const formKey in requestConfig.Forms) this.Forms[formKey] = new Expression(requestConfig.Forms[formKey]);
    if (requestConfig.Encoding) this.Encoding = requestConfig.Encoding;
  }
}