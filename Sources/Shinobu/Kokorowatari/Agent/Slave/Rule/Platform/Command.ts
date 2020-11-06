import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Client, ClientConfig } from "./Client";
import { JSON, JSONConfig } from "../Platform/Command/JSON";
import { Request, RequestConfig } from "../Platform/Command/Request";
import { Expression } from "../Expression";
import { Cache, CacheConfig } from "./Command/Cache";
import { DOM, DOMConfig } from "./Command/DOM";

export type CommandConfig = {
  Client: ClientConfig | string,
  Cache?: CacheConfig,
  Request: RequestConfig,
  Type: 'JSON' | 'DOMD' | 'DOMS',
  JSON?: JSONConfig,
  DOM?: DOMConfig,
}

export class Command {

  public readonly Client: Expression;
  public readonly Cache?: Cache;
  public readonly Request: Request;
  public readonly Type: 'JSON' | 'DOMD' | 'DOMS';
  public readonly JSON?: JSON;
  public readonly DOM?: DOM;

  constructor(commandConfig: CommandConfig) {
    this.Client = new Expression('string' == typeof commandConfig.Client ? commandConfig.Client : new Client(commandConfig.Client));

    if (commandConfig.Cache) this.Cache = new Cache(commandConfig.Cache);
    this.Request = new Request(commandConfig.Request);
    this.Type = commandConfig.Type;

    switch (this.Type) {
      case 'JSON':
        this.JSON = new JSON(commandConfig.JSON!);
        break;
      case 'DOMS':
      case 'DOMD':
        this.DOM = new DOM(commandConfig.DOM!);
        break;
      default: Urusai.Panic('Unsupported command type', this.Type);
    }
  }
}