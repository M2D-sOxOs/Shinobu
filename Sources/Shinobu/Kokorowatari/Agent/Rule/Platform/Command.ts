import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Client, ClientConfig } from "./Client";
import { JSON, JSONConfig } from "../Platform/Command/JSON";
import { Request, RequestConfig } from "../Platform/Command/Request";
import { Expression } from "../../Rule/Expression";
import { Cache, CacheConfig } from "./Command/Cache";
import { DOM, DOMConfig } from "./Command/DOM";
import { INSET, INSETConfig } from "./Command/INSET";

export type CommandConfig = {
  Client?: ClientConfig | string,
  Cache?: CacheConfig,
  Request?: RequestConfig,
  Type: 'JSON' | 'DOMD' | 'DOMS' | 'INSET',
  JSON?: JSONConfig,
  DOM?: DOMConfig,
  INSET?: INSETConfig,
}

export class Command {

  public readonly Client?: Expression;
  public readonly Cache?: Cache;
  public readonly Request?: Request;
  public readonly Type: 'JSON' | 'DOMD' | 'DOMS' | 'INSET';
  public readonly JSON?: JSON;
  public readonly DOM?: DOM;
  public readonly INSET?: INSET;

  constructor(commandConfig: CommandConfig) {
    if (commandConfig.Client) this.Client = new Expression('string' == typeof commandConfig.Client ? commandConfig.Client : new Client(commandConfig.Client));

    if (commandConfig.Cache) this.Cache = new Cache(commandConfig.Cache);
    if (commandConfig.Request) this.Request = new Request(commandConfig.Request);
    this.Type = commandConfig.Type;

    switch (this.Type) {
      case 'JSON':
        this.JSON = new JSON(commandConfig.JSON!);
        break;
      case 'DOMS':
      case 'DOMD':
        this.DOM = new DOM(commandConfig.DOM!);
        break;
      case 'INSET':
        this.INSET = new INSET(commandConfig.INSET!);
    }
  }
}