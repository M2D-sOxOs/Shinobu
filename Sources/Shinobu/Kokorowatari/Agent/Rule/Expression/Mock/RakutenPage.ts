import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenPage extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): string {
    
    const parameters: Array<string | null> = key.split(',').map(v => {
      let gotVar: string = '';
      if (v[0] == '$') eval(`gotVar = flowZone.${v.substr(1)}`);
      return gotVar;
    })

    return (45 * parseInt(parameters[0]! || '0')).toString();
  }

}