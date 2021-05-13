import Axios, { AxiosResponse } from "axios";
import { Console } from "console";
import { stringify } from "querystring";
import { Tokei } from "../../../../../../Common/Tokei/Tokei";
import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Expression } from "../../../Rule/Expression";
import { Command } from "../../../Rule/Platform/Command";
import { JSON as JSONRule } from "../../../Rule/Platform/Command/JSON";
import { Result } from "../../../Rule/Platform/Command/JSON/Result";
import { Proxy } from "../../../Rule/Platform/Proxy";
import { Delegator } from "../Delegator";

export class JSON extends Delegator {

  private _JSON!: JSONRule;

  constructor(command: Command, session: any, flowZone: any) {
    super(command, session, flowZone);

  }

  public async Initialize(): Promise<JSON> {

    await super.Initialize();

    this._JSON = this.Command.JSON!;
    return this;
  }

  protected async _PerformRequest(scopeZone: any): Promise<boolean> {

    let axiosResult!: AxiosResponse;
    try {

      const inflatedHeaders = Object.assign({}, await this._Inflate(this._Client.Headers), await this._Inflate(this._Request.Headers));
      Urusai.Verbose('Request headers:', inflatedHeaders);
      const inflatedParameters = await this._Inflate(this._Request.Parameters);
      Urusai.Verbose('Request parameters:', inflatedParameters);
      const inflatedFormFields = await this._Inflate(this._Request.Forms);
      Urusai.Verbose('Request forms:', inflatedFormFields);

      Urusai.Verbose('Performing request:', this._Request.Method, this._Client.Host + this._Request.URL);
      Urusai.Verbose('URL Parameters:', inflatedParameters);
      Urusai.Verbose('Form fields:', inflatedFormFields);

      axiosResult = await Axios({
        url: this._Client.Host + this._Request.URL,
        method: this._Request.Method,
        headers: inflatedHeaders,
        params: inflatedParameters,
        data: 'application/x-www-form-urlencoded' == inflatedHeaders['Content-Type'] ? stringify(inflatedFormFields) : global.JSON.stringify(inflatedFormFields),
        timeout: this._Request.Timeout,
        httpAgent: this.Session.Proxy ? this.Session.Proxy.httpAgent : undefined,
        httpsAgent: this.Session.Proxy ? this.Session.Proxy.httpsAgent : undefined
      });

      scopeZone['__RESPONSE__'] = axiosResult.data;
      scopeZone['__STATUS__'] = axiosResult.status;
      return true;
    } catch (e) {
      Urusai.Error('Error happened when processing request:', this._Request.Method, this._Client.Host + this._Request.URL);
      Urusai.Error('Original error message:', e.message);
      return false;
    }
  }

  protected async _PerformResult(scopeZone: any): Promise<boolean> {

    if (!this._JSON.Indicator.Estimate(this.Session, scopeZone)) {
      Urusai.Warning('Result is not passing indicator exam');
      return false;
    }

    this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(scopeZone, this._JSON.Result);
    return true;
  }

  private async __PerformResultStructure(scopeZone: any, result?: Result) {

    if (!result) {
      delete this.FlowZone['__RESULT__'];
      return;
    }

    switch (result.Type) {
      case 'CONCAT': return (await Promise.all((result.Value as Expression[]).map(v => v.Value(this.Session, scopeZone)))).join('');
      case 'SIMPLE':
      case 'URL': return await (result.Value as Expression).Value(this.Session, scopeZone);
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