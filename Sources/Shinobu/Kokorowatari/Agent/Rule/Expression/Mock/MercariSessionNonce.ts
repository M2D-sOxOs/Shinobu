import { v4 } from "node-uuid";
import { Table } from "../../../Rule";
import { Base } from "./Base";

export class MercariSessionNonce extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {

    const randomString = function (e: number) {

      let t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~", n: number[] = [], m: string[] = [];
      for (let i = 0; i < e; i++) n.push(Math.ceil(Math.random() * 1000000 % 255));
      n.forEach((u) => m.push(t[u % t.length]));
      return m.join("");
    };

    return randomString(12);
  }

}