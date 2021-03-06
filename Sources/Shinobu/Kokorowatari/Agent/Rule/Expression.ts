import { Urusai } from "../../../../Common/Urusai/Urusai";
import { Request } from "../Slave/Request";
import { Rule, Table } from "../Rule";
import { Mock } from "./Expression/Mock";
import { Platform } from "./Platform";

/**
 * Expression
 */
export class Expression {

  protected _Type: 'DYNAMIC' | 'STATIC' | 'EXECUTION' | 'MOCK' | 'COMPLEX' | 'COMMAND' = 'STATIC';

  /**
   * User input expression string
   */
  public get Expression() {
    return this._Expression;
  }
  protected _Expression: string = '';

  constructor(expressionOrMap: string | any) {

    // Process with expression string
    if ('string' == typeof expressionOrMap) {
      this._Expression = expressionOrMap;
      this.__Parse();
    } else {
      this._Map = expressionOrMap;
      if ('object' == typeof expressionOrMap) {
        this._Type = 'COMPLEX';
        for (const key in this._Map) this._Map[key] = new Expression(this._Map[key]);
      }
    }
  }

  /**
   * Parse expression string
   */
  private __Parse(): void {

    if ('__' == this._Expression.substr(1, 2) && '$' != this._Expression[0]) {
      Urusai.Panic('Private zones are only allowed in dynamic value expression');
    }

    switch (this._Expression[0]) {

      // Dynamic
      case '$':

        this._Type = 'DYNAMIC';

        if (null == this.__Locate()) Urusai.Panic('Invalid expression:', this._Expression);
        break;

      // Static
      case '*':

        this._Type = 'STATIC';
        this._Map = this.__Find();
        if (!this._Map) Urusai.Panic('Invalid expression:', this._Expression);
        break;

      // Execution
      case '#':
        this._Type = 'EXECUTION';
        this._Expression = this._Expression.substr(1).replace(/\$([A-Za-z_]+)/g, '(flowZone["$1"] || sessionStorage["$1"])');
        break;

      // Mock
      case '@':
        this._Type = 'MOCK';

        if (!this.__Mock()) Urusai.Panic('Invalid expression:', this._Expression);
        break;

      // Execution
      case '=':
        this._Type = 'COMMAND';
        this._Expression = this._Expression.substr(1).replace(/\$([A-Za-z_]+)/g, '(flowZone["$1"] || sessionStorage["$1"])');
        break;

      case '\\':
        this._Type = 'STATIC';
        this._Expression = this._Expression.substr(1);

      default:
        this._Map = this._Expression;
        break;
    }
  }

  /**
   * Resolved instance
   */
  protected _Map: any | null = null;

  /**
   * Search zone located
   */
  private __Zone: any = null;

  /**
   * Name of Zone used for special zones
   */
  private __ZoneName: string = '';

  /**
   * Last key in zone
   */
  private __ZoneKeys: string[] | null = null;

  private __Mocker: Mock | null = null;

  /**
   * Locate by expression but not get actual value
   */
  private __Locate(): string[] | null {

    const expressionParts: string[] = this._Expression.substr(1).split('.');

    if ('__' == expressionParts[0].substr(0, 2)) {
      this.__ZoneName = expressionParts[0];
      return this.__ZoneKeys = expressionParts.slice(1);
    }

    let searchZone: any = Rule.Platforms;
    for (let partIndex = 0; partIndex < expressionParts.length - 1; partIndex++) {
      searchZone = searchZone[expressionParts[partIndex]] || null;
      if (!searchZone) return null;
    }

    this.__Zone = searchZone;
    return this.__ZoneKeys = expressionParts.slice(expressionParts.length - 1);
  }

  /**
   * A simple method to find by expression
   */
  private __Find(flowZone?: any): any | null {

    // If zone keys exists
    const expressionParts: string[] = this.__ZoneKeys || this._Expression.substr(1).split('.');

    let searchZone: any = this.__Zone || (this.__ZoneName ? flowZone[this.__ZoneName] : Rule.Platforms);
    for (let partIndex = 0; partIndex < expressionParts.length; partIndex++) {
      if (!searchZone) return searchZone;
      searchZone = expressionParts[partIndex] in searchZone ? searchZone[expressionParts[partIndex]] : null;
    }
    return searchZone;
  }

  private __Mock(): Mock | null {

    const mockParameters: string[] = this._Expression.split(':');

    if (2 != mockParameters.length) return null;

    return this.__Mocker = Mock.Initialize(mockParameters[0] as any, mockParameters[1]);
  }
  /**
   * Get Value of Expression
   */
  public async Value(sessionStorage: any = {}, flowZone?: any) {

    switch (this._Type) {
      case 'DYNAMIC': return this.__Find(Object.assign({}, sessionStorage, flowZone));
      case 'STATIC': return this._Map;
      case 'MOCK': return this.__Mocker!.Value(sessionStorage, flowZone);
      case 'EXECUTION':

        const command = this._Expression.match(/^(.*?)(\(.*?\))$/);
        if (command) eval(command[2]);
        return await Request.Execute(command ? command[1] : this._Expression, sessionStorage, flowZone);
      case 'COMMAND':
        let resultValue: any = null;
        try {
          eval(`resultValue = ${this._Expression}`);
        } catch (e: any) {
          Urusai.Error('Expression', this._Expression, 'execution failed');
          Urusai.Error(e.toString());
        }
        return resultValue;
      case 'COMPLEX':
        const resultObject: any = this._Map instanceof Array ? [] : {};
        for (const key in this._Map) resultObject[key] = await this._Map[key].Value(sessionStorage, flowZone);
        return resultObject;
    }

    Urusai.Warning('Expression', this._Expression, 'matched nothing');
    return null;
  }

}