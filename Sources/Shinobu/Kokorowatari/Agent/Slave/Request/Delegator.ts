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
      Urusai.Error('Error request:', (await this.Command.Client?.Value()).Host + this.Command.Request?.URL);
      return false;
    }
  }

  protected abstract _PerformRequest(scopeZone: any): Promise<boolean>;

  protected abstract _PerformResult(scopeZone: any): Promise<boolean>;

  protected async _Inflate(expressionTable: Table<Expression>): Promise<Table<string>> {

    const inflatedTable: Table<string> = {};
    for (const key in expressionTable) {
      if (false === (inflatedTable[key] = await expressionTable[key].Value(this.Session, this.FlowZone))) {
        Urusai.Error('Cannot get value of expression for the field:', key);
        throw new Error('Cannot get value of expression for the field: ' + key);
      }
    }
    return inflatedTable;

  }
}