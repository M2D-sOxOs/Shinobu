import Axios from "axios";
import { stringify } from "querystring";
import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Client } from "../../Rule/Platform/Client";
import { Command } from "../../Rule/Platform/Command";
import { Request } from "../../Rule/Platform/Command/Request";
import { Expression } from "../../Rule/Expression";
import { Proxy } from "../../Rule/Platform/Proxy";
import { Tokei } from "../../../../../Common/Tokei/Tokei";
import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { createCipheriv } from "crypto";

export abstract class Delegator {

  /**
   * Client config
   */
  protected _Client?: Client;
  protected _Request?: Request;

  constructor(public readonly Command: Command, public readonly Session: any, public readonly FlowZone: any) {

  }

  public async Initialize(): Promise<Delegator> {

    this._Client = await this.Command.Client?.Value();
    this._Request = this.Command.Request;
    return this;
  }

  public async Perform(scopeZone: any) {

    try {

      Object.assign(scopeZone, this.FlowZone);
      return (await Tokei.Record('Network-Request', async () => {
        return await this._PerformRequest(scopeZone);
      })) && (await Tokei.Record('Result-Resolve', async () => {
        return await this._PerformResult(scopeZone);
      }));
    } catch (e) {
      console.log(e);
      Urusai.Error('Something goes wrong when processing, Maybe the source data structure changed?');
      Urusai.Error('Error request:', (await this.Command.Client?.Value()).Host + await this.Command.Request?.URL.Value());
      return false;
    }
  }

  protected abstract _PerformRequest(scopeZone: any): Promise<boolean>;

  protected abstract _PerformResult(scopeZone: any): Promise<boolean>;

  protected async _Inflate(expressionTable: Table<Expression>): Promise<Table<string>> {

    const flowZone = this.FlowZone, sessionStorage = this.Session;
    const inflatedTable: Table<string> = {};
    for (const key in expressionTable) {

      let parsedKey: string = key;
      const keyVars = key.match(/\${([a-z0-9_\.\[\]]+)}/ig)?.map(keyVar => {
        const keyVarValue = eval(keyVar.replace(/^\${([a-z0-9_]+)([a-z0-9_\.\[\]]+)}$/i, '(flowZone["$1"] || sessionStorage["$1"])$2'));
        parsedKey = parsedKey.replace(keyVar, keyVarValue)
      });

      if (false === (inflatedTable[parsedKey] = await expressionTable[key].Value(this.Session, this.FlowZone))) {
        Urusai.Error('Cannot get value of expression for the field:', key);
        throw new Error('Cannot get value of expression for the field: ' + key);
      }

      if (null === inflatedTable[parsedKey]) delete inflatedTable[parsedKey];
    }
    return inflatedTable;

  }

  protected _Urlfy(rawUrl: string) {
    if (!rawUrl) return rawUrl;
    const key = Jinja.Get('Kokorowatari.Urlfy.Key');
    const iv = Jinja.Get('Kokorowatari.Urlfy.IV');

    const cipher = createCipheriv('aes-128-cfb', key, iv);
    cipher.setAutoPadding(true);
    return Jinja.Get('Kokorowatari.Urlfy.Prefix') + '/' + encodeURIComponent(cipher.update(rawUrl, 'utf8', 'base64')) + encodeURIComponent(cipher.final('base64'));
  }
}