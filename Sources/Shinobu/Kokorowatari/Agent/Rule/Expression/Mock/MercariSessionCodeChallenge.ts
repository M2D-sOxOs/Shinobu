import { createHash } from "crypto";
import { Table } from "../../../Rule";
import { Base } from "./Base";

export class MercariSessionCodeChallenge extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {

    const randomString = function (e: number) {

      let t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~", n: number[] = [], m: string[] = [];
      for (let i = 0; i < e; i++) n.push(Math.ceil(Math.random() * 1000000 % 255));
      n.forEach((u) => m.push(t[u % t.length]));
      return m.join("");
    };

    sessionStorage['Mercari.Code'] = sessionStorage['Mercari.Code'] || randomString(43);

    const getDigit = (d: string) => {
      return createHash('sha256').update(d).digest().toString('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }

    return getDigit(<any>sessionStorage['Mercari.Code']);
  }

}