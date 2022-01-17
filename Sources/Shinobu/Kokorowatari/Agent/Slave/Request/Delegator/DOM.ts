import Axios, { AxiosResponse } from "axios";
import { load } from "cheerio";
import { stringify } from "querystring";
import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Expression } from "../../../Rule/Expression";
import { Command } from "../../../Rule/Platform/Command";
import { DOM as DOMRule } from "../../../Rule/Platform/Command/DOM";
import { Result } from "../../../Rule/Platform/Command/DOM/Result";
import { Proxy } from "../../../Rule/Platform/Proxy";
import { Delegator } from "../Delegator";
//@ts-ignore
import * as encoding from "encoding";

/**
 * Most easy way to map an element
 * let x = $0, y = []; while(x.tagName != 'BODY') y.unshift([...x.parentNode.children].indexOf(x)), (x = x.parentNode); '/body/' + y.join('/');
 */
export class DOM extends Delegator {

  private _DOM!: DOMRule;

  constructor(command: Command, session: any, flowZone: any) {
    super(command, session, flowZone);

  }

  public async Initialize(): Promise<DOM> {

    await super.Initialize();

    this._DOM = this.Command.DOM!;
    if (!this._Client || !this._Request) Urusai.Panic('Client / Request is required in DOM.');
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
      Urusai.Verbose('Request forms:', inflatedFormFields);
      Urusai.Verbose('Performing request:', requestUrl);

      scopeZone['__REQUEST_HEADERS__'] = inflatedHeaders;

      axiosResult = await Axios({
        url: requestUrl,
        method: this._Request!.Method,
        headers: inflatedHeaders,
        jar: this.Session.__COOKIE__,
        withCredentials: true,
        params: inflatedParameters,
        data: 'GET' == this._Request!.Method ? undefined : ('application/x-www-form-urlencoded' == inflatedHeaders['Content-Type'] ? stringify(inflatedFormFields) : inflatedFormFields),
        timeout: this._Request!.Timeout,
        httpAgent: this.Session.Proxy ? this.Session.Proxy[Math.ceil(Math.random() * 10000) % this.Session.Proxy.length].httpAgent : undefined,
        httpsAgent: this.Session.Proxy ? this.Session.Proxy[Math.ceil(Math.random() * 10000) % this.Session.Proxy.length].httpsAgent : undefined,
        maxRedirects: 0,
        responseType: 'arraybuffer',
        validateStatus: (status: number) => {
          return status >= 200 && status < 400;
        },
        transformResponse: (rawData: Buffer) => {
          if (this._Request?.Encoding) {
            Urusai.Verbose('Converting from encoding:', this._Request?.Encoding);
            const converted = encoding.convert(rawData, 'utf8', this._Request?.Encoding);
            return converted.toString('utf8');
          }
          return rawData.toString('utf8');
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

    return false;
  }

  protected async _PerformResult(scopeZone: any): Promise<boolean> {

    switch (this.Command.Type) {
      case 'DOMS':
        return await this.__PerformResultDOMS(scopeZone);
      case 'DOMD':
        break;
      default: Urusai.Panic('Unexpected command type:', this.Command.Type);
    }

    // this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(this._DOM.Result);
    return true;
  }

  private async __PerformResultDOMS(scopeZone: any): Promise<boolean> {

    const domObject: cheerio.Root = load(scopeZone['__RESPONSE__']);

    if (!(await this._DOM.Indicator.Estimate(domObject, this.Session, scopeZone))) {
      Urusai.Warning('Result is not passing indicator exam');
      return false;
    }

    /**
     * Perform pre-processors
     */
    this._DOM.Preprocess?.forEach(async (processor) => {
      await processor.Process(domObject, this.Session, scopeZone);
    });

    scopeZone['__RESULT__'] = (this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(domObject.root(), scopeZone, domObject.root(), this.Command.DOM!.Result));
    if (this._DOM.Stash) this.FlowZone.__STASH__[this._DOM.Stash] = scopeZone['__RESULT__'];

    return true;
  }

  private async __PerformResultStructure(searchElement: cheerio.Cheerio, scopeZone: any, rootElement: cheerio.Cheerio, resultObject?: Result): Promise<any> {

    if (!resultObject) {
      delete this.FlowZone['__RESULT__'];
      return;
    }

    switch (resultObject.Type) {
      case 'SIMPLE':
        return await this.__PerformResultStructureValue(resultObject.Value as string, searchElement, scopeZone, rootElement);
      case 'NULL':
        return null;
      case 'COMBINED':
        return await this.__PerformResultStructureValues(resultObject.Value as string, searchElement, scopeZone, rootElement);
      case 'ARRAY':

        {
          const mappedChildren: cheerio.Cheerio = await this.__PerformResultStructureValue(resultObject.MapFrom!, searchElement, scopeZone, rootElement);
          const mappedArray: cheerio.Cheerio[] = [];
          mappedChildren.map(i => mappedArray.push(mappedChildren.eq(i)));

          const resultArray: any[] = [];
          scopeZone[resultObject.MapTo! + '_Index'] = 0;
          for (const v of mappedArray) {
            scopeZone[resultObject.MapTo!] = v;
            resultArray.push(await this.__PerformResultStructure(searchElement, scopeZone, rootElement, resultObject.Value as Result));
            scopeZone[resultObject.MapTo! + '_Index']++;
          }
          return resultArray;
        }
      case 'ARRAY_VALUE':
        {
          const mappedArray: any[] = await this.__PerformResultStructureValue(resultObject.MapFrom!, searchElement, scopeZone, rootElement);

          const resultArray: any[] = [];
          scopeZone[resultObject.MapTo! + '_Index'] = 0;
          for (const v of mappedArray) {
            scopeZone[resultObject.MapTo!] = v;
            resultArray.push(await this.__PerformResultStructure(searchElement, scopeZone, rootElement, resultObject.Value as Result));
            scopeZone[resultObject.MapTo! + '_Index']++;
          }

          return resultArray;
        }
      case 'TABLE':

        const outputObject: any = {};
        for (const resultKey in resultObject.Value as Table<Result>) outputObject[resultKey] = await this.__PerformResultStructure(searchElement, scopeZone, rootElement, (resultObject.Value as Table<Result>)[resultKey]);
        return outputObject;
    }

    Urusai.Panic('Unknown type of Result', resultObject.Type, ', Check your configuration file');
  }

  private async __PerformResultStructureValue(domRExp: string, searchElement: cheerio.Cheerio, scopeZone: any, rootElement: cheerio.Cheerio) {

    const domRExps = domRExp.split('@');
    if (domRExps[0]) {
      const selectors = domRExps[0].split(/(\s+|>)/);
      const firstSelector = selectors[0];
      if ('$' == firstSelector[0]) {
        searchElement = scopeZone[firstSelector.substr(1)];
        domRExps[0] = domRExps[0].substr(firstSelector.length)
      }

      if ('/' == firstSelector[0]) {
        searchElement = rootElement;
        domRExps[0] = domRExps[0].substr(1)
      }

      if (domRExps[0].trim()) searchElement = searchElement.find(domRExps[0]);
    }

    return domRExps[1] ? eval(`searchElement.${domRExps[1].replace(/\$([a-z_]+)/gi, 'scopeZone[\'$1\']')}`) : searchElement;
  }

  private async __PerformResultStructureValues(domRExp: string, searchElement: cheerio.Cheerio, scopeZone: any, rootElement: cheerio.Cheerio) {

    const domRexpArray = domRExp.split('+');
    const resultArray = await Promise.all(domRexpArray.map(v => {
      const matchedResult = v.trim().match(/^(["'])([^\1]*?)\1$/);
      if (matchedResult) return matchedResult[2];
      return this.__PerformResultStructureValue(v, searchElement, scopeZone, rootElement);
    }));
    return resultArray.join('')
  }

}