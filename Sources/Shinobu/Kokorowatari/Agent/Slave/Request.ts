import { Jinja } from "../../../../Common/Jinja/Jinja";
import { Tokei } from "../../../../Common/Tokei/Tokei";
import { Urusai } from "../../../../Common/Urusai/Urusai";
import { Frame } from "../../Agent";
import { Slave } from "../Slave";
import { Cache } from "./Cache";
import { DOM } from "./Request/Delegator/DOM";
import { JSON } from "./Request/Delegator/JSON";
import { HEAD } from "./Request/Delegator/HEAD";
import { Rule, Table } from "../Rule";
import { Expression } from "../Rule/Expression";
import { Command } from "../Rule/Platform/Command";
import { Flow } from "../Rule/Platform/Flow";
import { Proxy } from "../Rule/Platform/Proxy";
import { SocksProxyAgent } from "socks-proxy-agent";
import { httpOverHttp, httpsOverHttp } from "tunnel";
import { INSET } from "./Request/Delegator/INSET";
import { CookieJar } from "tough-cookie";
import { Client } from "../Rule/Platform/Client";
import { XML } from "./Request/Delegator/XML";

/**
 * All things moving on Request
 */
export class Request {

  private static __Pending: { [k: string]: true } = {};

  private static __Cookies: { [k: string]: CookieJar } = {};

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
  private static async __Process(requestId: string, flowExpr: Expression, flowZone: any): Promise<any> {

    const flowObject: Flow = await flowExpr.Value();

    const sessionStorage: any = {};

    if (flowObject.Proxy && (<Proxy>await flowObject.Proxy.Value()).Enabled) {

      const proxy: Proxy = await flowObject.Proxy.Value();
      switch (proxy.Provider) {
        case 'SOCKS5':
          Urusai.Verbose('Using SOCKS5 as proxy server');
          sessionStorage.Proxy = {
            httpAgent: new SocksProxyAgent({
              host: proxy.Server,
              port: proxy.Port
            }),
            httpsAgent: new SocksProxyAgent({
              host: proxy.Server,
              port: proxy.Port
            })
          };
          break;
        case 'HTTP':
          Urusai.Verbose('Using HTTP as proxy server');
          sessionStorage.Proxy = {
            httpAgent: httpOverHttp({ proxy: { host: proxy.Server, port: proxy.Port } }),
            httpsAgent: httpsOverHttp({ proxy: { host: proxy.Server, port: proxy.Port } })
          };
          break;
      }
    }

    let isFailure = 0 == flowObject.Flow.length;
    for (let flowIndex = 0; flowIndex < flowObject.Flow.length; flowIndex++) {
      sessionStorage.__THIS__ = await flowObject.Flow[flowIndex].Value();
      if (false === await this.__Execute(flowObject.Flow[flowIndex].Expression ? flowObject.Flow[flowIndex].Expression.replace(/^./, '#') : '#' + flowIndex, await flowObject.Flow[flowIndex].Value(), sessionStorage, flowZone)) {
        isFailure = true;
        break;
      }
    }

    if (isFailure) return false;

    return flowZone['__RESULT__'];
  }

  public static async Execute(command: string, sessionStorage: any, flowZone: any) {

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

    const client: Client = await commandObject.Client?.Value(sessionStorage, flowZone)
    if (client?.Cookie) sessionStorage['__COOKIE__'] = (this.__Cookies[client.Cookie] = this.__Cookies[client.Cookie] || new CookieJar());

    Urusai.Verbose('Executing command', quickCommandName);
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
        // TODO: Replace default timeout into Jinja
        if (!await this.__ExecutePending(cacheKey, commandObject.Request?.Timeout || 3000)) return false;
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
      case 'HEAD':
        Urusai.Verbose('Perform with HEAD');
        if (!await (await (new HEAD(commandObject, sessionStorage, flowZone)).Initialize()).Perform(scopeZone)) {
          Urusai.Warning('Execute command', quickCommandName, 'failed');
          return false;
        }
        break;
      case 'XML':
        Urusai.Verbose('Perform with XML');
        if (!await (await (new XML(commandObject, sessionStorage, flowZone)).Initialize()).Perform(scopeZone)) {
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
      case 'INSET':
        Urusai.Verbose('Perform with INSET');
        if (!await (await (new INSET(commandObject, sessionStorage, flowZone)).Initialize()).Perform(scopeZone)) {
          Urusai.Warning('Execute command', quickCommandName, 'failed');
          return false;
        }
        break;
    }

    if (commandObject.Cache) {

      Urusai.Verbose('Result should be cached according to cache policy');
      const cacheExpire: string = await commandObject.Cache.Expire.Value(sessionStorage, scopeZone);
      let cacheExpireTime: number = '+' == cacheExpire[0] ? Math.floor((new Date().getTime() / 1000) + parseInt(cacheExpire)) : parseInt(cacheExpire);
      Cache.Set(cacheKey, flowZone['__RESULT__'], cacheExpireTime);
      delete this.__Pending[cacheKey];
    }

    // Quick Command
    return (sessionStorage[quickCommandName] = flowZone['__RESULT__']);
  }

  private static async __ExecutePending(cacheKey: string, maxWait: number): Promise<boolean> {
    return new Promise<boolean>((s, f) => {

      let pendingTimeout: NodeJS.Timeout, maxTimeout: NodeJS.Timeout;

      pendingTimeout = setInterval(() => {

        if (!Cache.Has(cacheKey)) return;
        clearInterval(pendingTimeout);
        clearTimeout(maxTimeout);
        s(true);
      }, 100);

      maxTimeout = setTimeout(() => {
        clearInterval(pendingTimeout);
        s(false);
      }, maxWait);
    });
  }

}