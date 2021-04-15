import { Table } from "../../../Rule";

export abstract class Base {

  public Cache: boolean = true;

  public abstract Value(key: string, sessionStorage: Table<Table<string>>, additionalZones?: any): string;

}