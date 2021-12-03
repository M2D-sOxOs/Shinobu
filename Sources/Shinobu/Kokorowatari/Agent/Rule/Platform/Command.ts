import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Client, ClientConfig } from "./Client";
import { JSON, JSONConfig } from "../Platform/Command/JSON";
import { Request, RequestConfig } from "../Platform/Command/Request";
import { Expression } from "../../Rule/Expression";
import { Cache, CacheConfig } from "./Command/Cache";
import { DOM, DOMConfig } from "./Command/DOM";
import { XML, XMLConfig } from "./Command/XML";
import { INSET, INSETConfig } from "./Command/INSET";
import { HEAD, HEADConfig } from "./Command/HEAD";

export type CommandConfig = {
  Client?: ClientConfig | string,
  Cache?: CacheConfig,
  Request?: RequestConfig,
  Type: 'JSON' | 'HEAD' | 'DOMD' | 'DOMS' | 'XML' | 'INSET',
  HEAD?: HEADConfig,
  JSON?: JSONConfig,
  DOM?: DOMConfig,
  XML?: XMLConfig,
  INSET?: INSETConfig,
}

export class Command {

  public readonly Client?: Expression;
  public readonly Cache?: Cache;
  public readonly Request?: Request;
  public readonly Type: 'JSON' | 'HEAD' | 'DOMD' | 'DOMS' | 'XML' | 'INSET';
  public readonly HEAD?: HEAD;
  public readonly JSON?: JSON;
  public readonly DOM?: DOM;
  public readonly XML?: XML;
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
      case 'XML':
        this.XML = new XML(commandConfig.XML!);
        break;
      case 'HEAD':
        this.HEAD = new HEAD(commandConfig.HEAD!);
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