import Axios, { AxiosResponse } from "axios";
import { load } from "cheerio";
import { writeFileSync } from "fs";
import { stringify } from "querystring";
import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Expression } from "../../../Rule/Expression";
import { Command } from "../../../Rule/Platform/Command";
import { DOM as DOMRule } from "../../../Rule/Platform/Command/DOM";
import { Result } from "../../../Rule/Platform/Command/DOM/Result";
import { Proxy } from "../../../Rule/Platform/Proxy";
import { Delegator } from "../Delegator";

export class DOM extends Delegator {

  private _DOM!: DOMRule;

  constructor(command: Command, session: any, flowZone: any) {
    super(command, session, flowZone);

  }

  public async Initialize(): Promise<DOM> {

    await super.Initialize();

    this._DOM = this.Command.DOM!;
    return this;
  }

  protected async _PerformRequest(scopeZone: any): Promise<boolean> {

    let axiosResult!: AxiosResponse;
    try {

      const inflatedHeaders = await this._Inflate(this._Client.Headers);
      const inflatedParameters = await this._Inflate(this._Request.Parameters);
      const inflatedFormFields = await this._Inflate(this._Request.Forms);

      Urusai.Verbose('Performing request:', this._Request.Method, this._Client.Host + this._Request.URL);
      Urusai.Verbose('URL Parameters:', inflatedParameters);
      Urusai.Verbose('Form fields:', inflatedFormFields);

      axiosResult = await Axios({
        url: this._Client.Host + this._Request.URL,
        method: this._Request.Method,
        headers: inflatedHeaders,
        params: inflatedParameters,
        data: 'application/x-www-form-urlencoded' == inflatedHeaders['Content-Type'] ? stringify(inflatedFormFields) : inflatedFormFields,
        timeout: this._Request.Timeout,
        httpAgent: this.Session.Proxy ? this.Session.Proxy.httpAgent : undefined,
        httpsAgent: this.Session.Proxy ? this.Session.Proxy.httpsAgent : undefined
      });

      scopeZone['__RESPONSE__'] = axiosResult.data;
      return true;
    } catch (e) {
      Urusai.Error('Error happened when processing request:', this._Request.Method, this._Client.Host + this._Request.URL);
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

    if (!this._DOM.Indicator.Estimate(domObject, this.Session, scopeZone)) {
      Urusai.Warning('Result is not passing indicator exam');
      return false;
    }

    /**
     * Perform pre-processors
     */
    this._DOM.Preprocess?.forEach(async (processor) => {
      await processor.Process(domObject, this.Session, scopeZone);
    });

    this.FlowZone['__RESULT__'] = await this.__PerformResultStructure(domObject.root(), scopeZone, this.Command.DOM!.Result);

    return true;
  }

  private async __PerformResultStructure(searchElement: cheerio.Cheerio, scopeZone: any, resultObject?: Result): Promise<any> {

    if (!resultObject) {
      delete this.FlowZone['__RESULT__'];
      return;
    }

    switch (resultObject.Type) {
      case 'SIMPLE':
        return await this.__PerformResultStructureValue(resultObject.Value as string, searchElement);
      case 'ARRAY':

        const mappedChildren: cheerio.Cheerio = await this.__PerformResultStructureValue(resultObject.Map!, searchElement);
        const mappedArray: cheerio.Cheerio[] = [];
        mappedChildren.map(i => mappedArray.push(mappedChildren.eq(i)));

        const resultArray: any[] = [];
        for (const v of mappedArray) resultArray.push(await this.__PerformResultStructure(v, scopeZone, resultObject.Value as Result));

        return resultArray;
      case 'TABLE':

        const outputObject: any = {};
        for (const resultKey in resultObject.Value as Table<Result>) outputObject[resultKey] = await this.__PerformResultStructure(searchElement, scopeZone, (resultObject.Value as Table<Result>)[resultKey]);
        return outputObject;
    }

    Urusai.Panic('Unknown type of Result, Check your configuration file');
  }

  private async __PerformResultStructureValue(domRExp: string, searchElement: cheerio.Cheerio) {

    const domRExps = domRExp.split('@');
    if (domRExps[0]) searchElement = searchElement.find(domRExps[0]);

    return domRExps[1] ? eval(`searchElement.${domRExps[1]}`) : searchElement;
  }

}