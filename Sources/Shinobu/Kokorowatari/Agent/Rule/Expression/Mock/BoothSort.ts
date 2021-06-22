import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Base } from "./Base";

export class BoothSort extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): string {

    const parameters: Array<string | null> = key.split(',').map(v => {
      let gotVar: string = '';
      if (v[0] == '$') eval(`gotVar = flowZone.${v.substr(1)}`);
      return gotVar;
    })

    switch (`${parameters[0]}-${parameters[1]}`) {
      case 'price-asc': return 'price_asc';
      case 'price-desc': return 'price_desc';
      case 'created_time-desc': return 'new';
      default: return '';
    }
    return '';
  }

}