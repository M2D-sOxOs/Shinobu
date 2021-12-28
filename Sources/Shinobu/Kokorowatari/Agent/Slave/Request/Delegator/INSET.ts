import Axios, { AxiosResponse } from "axios";
import { Console } from "console";
import { stringify } from "querystring";
import { Tokei } from "../../../../../../Common/Tokei/Tokei";
import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Expression } from "../../../Rule/Expression";
import { Command } from "../../../Rule/Platform/Command";
import { INSET as INSETRule } from "../../../Rule/Platform/Command/INSET";
import { Result } from "../../../Rule/Platform/Command/INSET/Result";
import { Proxy } from "../../../Rule/Platform/Proxy";
import { Delegator } from "../Delegator";

export class INSET extends Delegator {

  private _INSET!: INSETRule;

  constructor(command: Command, session: any, flowZone: any) {
    super(command, session, flowZone);

  }

  public async Initialize(): Promise<INSET> {

    await super.Initialize();

    this._INSET = this.Command.INSET!;

    return this;
  }

  protected async _PerformRequest(scopeZone: any): Promise<boolean> {
    console.log(1);

    return true;
  }

  protected async _PerformResult(scopeZone: any): Promise<boolean> {

    this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(scopeZone, this._INSET.Result);
    if (this._INSET.Stash) this.FlowZone.__STASH__[this._INSET.Stash] = scopeZone['__RESULT__'];
    return true;
  }

  private async __PerformResultStructure(scopeZone: any, result?: Result) {

    if (!result) {
      delete this.FlowZone['__RESULT__'];
      return;
    }

    switch (result.Type) {
      case 'CONCAT': return (await Promise.all((result.Value as Expression[]).map(v => v.Value(this.Session, scopeZone)))).join('');
      case 'SIMPLE': return await (result.Value as Expression).Value(this.Session, scopeZone);
      case 'URL': return this._Urlfy(await (result.Value as Expression).Value(this.Session, scopeZone));
      case 'ARRAY':

        // Map
        if (!result.MapFrom || !result.MapTo) Urusai.Panic('Map is required when type is set to Array');
        const searchArray: any[] = await result.MapFrom!.Value(this.Session, scopeZone);
        if (!searchArray) return [];
        const resultArray: any[] = [];
        for (const v of searchArray) {
          scopeZone[result.MapTo] = v;
          resultArray.push(await this.__PerformResultStructure(scopeZone, result.Value as Result));
        }
        return resultArray;
      case 'TABLE':
        const outputObject: any = {};
        for (const resultKey in result.Value as Table<Result>) outputObject[resultKey] = await this.__PerformResultStructure(scopeZone, (result.Value as Table<Result>)[resultKey]);
        return outputObject;
      case 'NULL':
        return null;
    }

    Urusai.Panic('Unknown type of Result, Check your configuration file');
  }

}