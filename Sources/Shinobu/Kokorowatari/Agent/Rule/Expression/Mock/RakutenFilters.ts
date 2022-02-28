import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenFilters extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {
    return key == '2' ? 'fs' : '';
  }

}