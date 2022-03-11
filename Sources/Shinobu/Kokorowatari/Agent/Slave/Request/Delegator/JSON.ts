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
//@ts-ignore
import * as encoding from "encoding";

export class JSON extends Delegator {

  private _JSON!: JSONRule;

  constructor(command: Command, session: any, flowZone: any) {
    super(command, session, flowZone);

  }

  public async Initialize(): Promise<JSON> {

    await super.Initialize();

    this._JSON = this.Command.JSON!;

    if (!this._Client || !this._Request) Urusai.Panic('Client / Request is required in JSON.');

    return this;
  }

  protected async _PerformRequest(scopeZone: any): Promise<boolean> {

    let axiosResult!: AxiosResponse;
    const requestUrl = this._Client!.Host + (await this._Request!.URL.Value(this.Session, scopeZone));
    try {

      const inflatedHeaders = Object.assign({}, await this._Inflate(this._Client!.Headers), await this._Inflate(this._Request!.Headers));
      const inflatedParameters = await this._Inflate(this._Request!.Parameters);
      const inflatedFormFields = await this._Inflate(this._Request!.Forms);

      Urusai.Verbose('Request headers:', inflatedHeaders);
      Urusai.Verbose('Request parameters:', inflatedParameters);
      Urusai.Verbose('Request forms:', 'GET' == this._Request!.Method ? undefined : ('application/x-www-form-urlencoded' == inflatedHeaders['Content-Type'] ? stringify(inflatedFormFields) : global.JSON.stringify(inflatedFormFields)));
      Urusai.Verbose('Performing request:', requestUrl);

      scopeZone['__REQUEST_HEADERS__'] = inflatedHeaders;

      axiosResult = await Axios({
        url: requestUrl,
        method: this._Request!.Method,
        headers: inflatedHeaders,
        jar: this.Session.__COOKIE__,
        withCredentials: true,
        params: inflatedParameters,
        data: 'GET' == this._Request!.Method ? undefined : ('application/x-www-form-urlencoded' == inflatedHeaders['Content-Type'] ? stringify(inflatedFormFields) : global.JSON.stringify(inflatedFormFields)),
        timeout: this._Request!.Timeout,
        httpAgent: this.Session.Proxy ? this.Session.Proxy[Math.ceil(Math.random() * 10000) % this.Session.Proxy.length].httpAgent : undefined,
        httpsAgent: this.Session.Proxy ? this.Session.Proxy[Math.ceil(Math.random() * 10000) % this.Session.Proxy.length].httpsAgent : undefined,
        maxRedirects: 0,
        validateStatus: (status: number) => {
          return status >= 200 && status < 400;
        },
        transformResponse: (rawData: any) => {
          return global.JSON.parse(this._Request?.Encoding ? encoding.convert(rawData, 'utf8', this._Request?.Encoding) : rawData)
        }
      });

      Urusai.Verbose('Request finished with status code: ', axiosResult.status);

      scopeZone['__RESPONSE_HEADERS__'] = axiosResult.headers;
      scopeZone['__RESPONSE__'] = axiosResult.data;
      scopeZone['__STATUS__'] = axiosResult.status;
      return true;
    } catch (e: any) {
      Urusai.Error('Error happened when processing request:', this._Request!.Method, requestUrl);
      Urusai.Error('Original error message:', e.message);
      return false;
    }
  }

  protected async _PerformResult(scopeZone: any): Promise<boolean> {

    if (!(await this._JSON.Indicator.Estimate(this.Session, scopeZone))) {
      Urusai.Warning('Result is not passing indicator exam');
      return false;
    }

    scopeZone['__RESULT__'] = (this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(scopeZone, this._JSON.Result));
    if (this._JSON.Stash) this.FlowZone.__STASH__[this._JSON.Stash] = scopeZone['__RESULT__'];
    if (this._JSON.Postprocess) return await this._JSON.Postprocess.Value(this.Session, scopeZone);
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

    Urusai.Panic(`Unknown type of Result ${result.Type}, Check your configuration file`);
  }

}