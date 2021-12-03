import { Table } from "../../../Rule";
import { v4 } from 'node-uuid';
import { Base } from "./Base";

export class UUID extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {
    return v4();
  }

}