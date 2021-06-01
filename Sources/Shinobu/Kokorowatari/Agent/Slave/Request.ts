import { Jinja } from "../../../../Common/Jinja/Jinja";
import { Tokei } from "../../../../Common/Tokei/Tokei";
import { Urusai } from "../../../../Common/Urusai/Urusai";
import { Frame } from "../../Agent";
import { Slave } from "../Slave";
import { Cache } from "./Cache";
import { DOM } from "./Request/Delegator/DOM";
import { JSON } from "./Request/Delegator/JSON";
import { Rule, Table } from "../Rule";
import { Expression } from "../Rule/Expression";
import { Command } from "../Rule/Platform/Command";
import { Flow } from "../Rule/Platform/Flow";
import { Proxy } from "../Rule/Platform/Proxy";
import { SocksProxyAgent } from "socks-proxy-agent";

/**
 * All things moving on Request
 */
export class Request {

  private static __Pending: { [k: string]: number } = {};

  /**
   * Actual processor for flows
   */
  public static async Process(dataFrame: Frame): Promise<void> {

    Urusai.Verbose('Start processing REQUEST frame')
    const result = await this.__Process(dataFrame.Id!, new Expression(dataFrame.Message), dataFrame.Data);
    Slave.Send(false === result ? {
      Reply: dataFrame.Id!,
      Action: 'RESPONSE',
      Data: {},
      Message: 'FAILURE'
    } : {
        Reply: dataFrame.Id!,
        Action: 'RESPONSE',
        Data: result,
        Message: 'SUCCESS'
      });
  }

  /**
   * Process with flow
   */
  private static async __Process(requestId: string, flowExpr: Expression, flowZone: any, sessionStorage: any = {}): Promise<any> {

    Urusai.Notice('Response:', requestId);
    const flowObject: Flow = await flowExpr.Value();

    if (flowObject.Proxy && (<Proxy>await flowObject.Proxy.Value()).Enabled) {
      const proxy: Proxy = await flowObject.Proxy.Value();
      const socksAgent = new SocksProxyAgent({
        host: proxy.Server,
        port: proxy.Port
      });
      sessionStorage.Proxy = {
        httpAgent: socksAgent,
        httpsAgent: socksAgent
      };
    }

    let isFailure = 0 == flowObject.Flow.length;
    for (let flowIndex = 0; flowIndex < flowObject.Flow.length; flowIndex++) {
      if (false === await this.__Execute(flowObject.Flow[flowIndex].Expression ? flowObject.Flow[flowIndex].Expression.replace(/^./, '#') : '#' + flowIndex, await flowObject.Flow[flowIndex].Value(), sessionStorage, flowZone)) {
        isFailure = true;
        break;
      }
    }

    if (isFailure) return false;

    return flowZone['__RESULT__'];
  }

  public static async Execute(command: string, sessionStorage: any, flowZone: any) {

    Urusai.Verbose('Executing command', command);
    const quickCommandName: string = '#' + command + global.JSON.stringify(flowZone.__IN__);
    if (quickCommandName in sessionStorage) {
      Urusai.Verbose('Using Quick Command');
      return sessionStorage[quickCommandName];
    }

    const commandExpression: Expression = new Expression('*' + command);
    const commandObject: Command = await commandExpression.Value();

    return await this.__Execute(quickCommandName, commandObject, sessionStorage, flowZone);
  }

  private static async __Execute(quickCommandName: string, commandObject: Command, sessionStorage: any, flowZone: any) {
    let cacheKey = '';
    let scopeZone: any = {};
    if (commandObject.Cache) {
      Urusai.Verbose('Trying to use cache');
      cacheKey = (await Promise.all(commandObject.Cache.Key.map(async (v) => await v.Value(sessionStorage, scopeZone)))).join(' ');
      if (Cache.Has(cacheKey)) {
        Urusai.Verbose('Cache hit with key:', cacheKey);
        return Cache.Get(cacheKey);
      }
      if (cacheKey in this.__Pending) {
        Urusai.Verbose('Cache hit but need waiting for it');
        await this.__ExecutePending(cacheKey);
        return Cache.Get(cacheKey);
      }
    }

    switch (commandObject.Type) {
      case 'JSON':
        Urusai.Verbose('Perform with JSON');
        if (!await (await (new JSON(commandObject, sessionStorage, flowZone)).Initialize()).Perform(scopeZone)) {
          Urusai.Warning('Execute command', quickCommandName, 'failed');
          return false;
        }
        break;
      case 'DOMS':
      case 'DOMD':
        Urusai.Verbose('Perform with DOM');
        if (!await (await (new DOM(commandObject, sessionStorage, flowZone)).Initialize()).Perform(scopeZone)) {
          Urusai.Warning('Execute command failed');
          return false;
        }
        break;
    }

    if (commandObject.Cache) {

      Urusai.Verbose('Result should be cached according to cache policy');
      const cacheExpire: string = await commandObject.Cache.Expire.Value(sessionStorage, scopeZone);
      let cacheExpireTime: number = '+' == cacheExpire[0] ? Math.floor((new Date().getTime() / 1000) + parseInt(cacheExpire)) : parseInt(cacheExpire);
      Cache.Set(cacheKey, flowZone['__RESULT__'], cacheExpireTime);
    }

    // Quick Command
    return (sessionStorage[quickCommandName] = flowZone['__RESULT__']);
  }

  private static async __ExecutePending(cacheKey: string): Promise<void> {
    return new Promise<void>((s, f) => {

      let pendingTimeout: NodeJS.Timeout;

      pendingTimeout = setInterval(() => {

        if (!Cache.Has(cacheKey)) return;
        clearInterval(pendingTimeout);
        s();
      }, 100);
    });
  }

}