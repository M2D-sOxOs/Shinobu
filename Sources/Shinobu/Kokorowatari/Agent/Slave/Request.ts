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

/**
 * All things moving on Request
 */
export class Request {

  private static __Pending: { [k: string]: number } = {};

  /**
   * Actual processor for flows
   */
  public static async Process(dataFrame: Frame): Promise<void> {

    return new Promise(async (s, f) => {
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
      s();        
    })
  }

  /**
   * Process with flow
   */
  private static async __Process(requestId: string, flowExpr: Expression, additionalZones: any, sessionStorage: any = {}): Promise<any> {

    const flowObject: Flow = await flowExpr.Value();

    let isFailure = 0 == flowObject.Flow.length;
    for (let flowIndex = 0; flowIndex < flowObject.Flow.length; flowIndex++) {
      if (false === await this.__Execute(flowObject.Flow[flowIndex].Expression ? flowObject.Flow[flowIndex].Expression.replace(/^./, '#') : '#' + flowIndex, await flowObject.Flow[flowIndex].Value(), sessionStorage, additionalZones)) {
        isFailure = true;
        break;
      }
    }

    if (isFailure) return false;

    return additionalZones['__RESULT__'];
  }

  public static async Execute(command: string, sessionStorage: any, additionalZones: any) {

    Urusai.Verbose('Executing command', command);
    const quickCommandName: string = '#' + command;
    if (quickCommandName in sessionStorage) {
      Urusai.Verbose('Using Quick Command');
      return sessionStorage[quickCommandName];
    }

    const commandExpression: Expression = new Expression('*' + command);
    const commandObject: Command = await commandExpression.Value();

    return await this.__Execute(quickCommandName, commandObject, sessionStorage, additionalZones);
  }

  private static async __Execute(quickCommandName: string, commandObject: Command, sessionStorage: any, additionalZones: any) {
    let cacheKey = '';
    if (commandObject.Cache) {
      Urusai.Verbose('Trying to use cache');
      cacheKey = (await commandObject.Cache.Key.map(async (v) => await v.Value(sessionStorage, additionalZones))).join(' ');
      if (Cache.Has(cacheKey)) {
        Urusai.Verbose('Cache hit');
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
        if (!await (await (new JSON(commandObject, sessionStorage, additionalZones)).Initialize()).Perform()) {
          Urusai.Warning('Execute command failed');
          return false;
        }
        break;
      case 'DOMS':
      case 'DOMD':
        Urusai.Verbose('Perform with DOM');
        if (!await (await (new DOM(commandObject, sessionStorage, additionalZones)).Initialize()).Perform()) {
          Urusai.Warning('Execute command failed');
          return false;
        }
        break;
    }

    if (commandObject.Cache) {

      Urusai.Verbose('Result should be cached according to cache policy');
      const cacheExpire: string = await commandObject.Cache.Expire.Value(sessionStorage, additionalZones);
      let cacheExpireTime: number = '+' == cacheExpire[0] ? Math.floor((new Date().getTime() / 1000) + parseInt(cacheExpire)) : parseInt(cacheExpire);
      Cache.Set(cacheKey, additionalZones['__RESULT__'], cacheExpireTime);
    }

    // Quick Command
    return (sessionStorage[quickCommandName] = additionalZones['__RESULT__']);
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