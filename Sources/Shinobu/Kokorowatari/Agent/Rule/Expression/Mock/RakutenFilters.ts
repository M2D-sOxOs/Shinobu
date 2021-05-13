import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenFilters extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): string {
    return '0';
  }

}