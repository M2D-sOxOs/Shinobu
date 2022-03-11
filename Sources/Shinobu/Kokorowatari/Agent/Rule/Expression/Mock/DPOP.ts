import { v4 } from "node-uuid";
import { Table } from "../../../Rule";
import { Base } from "./Base";

export class DPOP extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {

    const keyPair = await require('crypto').webcrypto.subtle.generateKey({
      name: 'ECDSA',
      namedCurve: 'P-256',
      hash: {
        name: "SHA-256"
      }
    }, true, ['sign', 'verify']);

    const signKey = await require('crypto').webcrypto.subtle.exportKey('jwk', keyPair.privateKey);
    const verifyKey = await require('crypto').webcrypto.subtle.exportKey('jwk', keyPair.publicKey);

    const mercariEncodeBase64JSON = (j: Buffer) => {
      return j.toString('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }

    const stringEscapedBuffer = (j: string) => {
      return Buffer.from(unescape(encodeURIComponent(j)));
    }

    const formatJWK = function (e: any, t: string[]) {
      if (null == e)
        return {};
      let n, r, a: any = {}, i = Object.keys(e);
      for (r = 0; r < i.length; r++)
        n = i[r],
          t.indexOf(n) >= 0 || (a[n] = e[n]);
      return a
    }

    const uuid = v4();

    const a = JSON.stringify({
      typ: "dpop+jwt",
      alg: "ES256",
      jwk: formatJWK(verifyKey, ['alg', 'ext', 'key_ops'])
    });

    const b = JSON.stringify({
      iat: Math.floor(Date.now() / 1000),
      jti: v4(),
      htu: (await (<any>sessionStorage).__THIS__.Client.Value()).Host + (await (<any>sessionStorage).__THIS__.Request.URL.Value()),
      htm: (<any>sessionStorage).__THIS__.Request.Method,
      uuid: uuid
    });

    const signData = [mercariEncodeBase64JSON(stringEscapedBuffer(a)), mercariEncodeBase64JSON(stringEscapedBuffer(b))].join('.');

    const signature = mercariEncodeBase64JSON(Buffer.from(await require('crypto').webcrypto.subtle.sign({
      name: "ECDSA",
      hash: {
        name: "SHA-256"
      }
    }, keyPair.privateKey, stringEscapedBuffer(signData))));

    return signData + '.' + signature;
  }

}