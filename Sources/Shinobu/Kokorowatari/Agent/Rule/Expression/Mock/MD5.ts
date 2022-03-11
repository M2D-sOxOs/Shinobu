import { Table } from "../../../Rule";
import { Base } from "./Base";
import { createHash } from "crypto";

export class MD5 extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {
    return createHash('md5').update(Date.now().toString()).digest('hex');
  }

}