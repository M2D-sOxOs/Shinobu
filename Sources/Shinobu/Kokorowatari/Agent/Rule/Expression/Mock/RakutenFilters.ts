import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenFilters extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, additionalZones?: any): string {
    return '0';
  }

}