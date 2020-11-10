import { Table } from "../../../Rule";
import { v4 } from 'node-uuid';
import { Base } from "./Base";

export class UUID extends Base {

  public Value(): string {
    return v4();
  }

}