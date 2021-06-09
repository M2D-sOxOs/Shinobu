import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenPaged extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): string {

    const parameters: Array<string | null> = key.split(',').map(v => {
      let gotVar: string = '';
      if (v[0] == '$') eval(`gotVar = flowZone.${v.substr(1)}`);
      return gotVar;
    })

    flowZone['__RESULT__'].Items = flowZone['__RESULT__'].Items.slice(0, parseInt(parameters[0] || '45'));
    return flowZone['__RESULT__'];
  }

}