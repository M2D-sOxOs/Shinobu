import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenSort extends Base {

  public Value(key: string, sessionStorage: Table<Table<string>>, additionalZones?: any): string {

    const parameters: Array<string | null> = key.split(',').map(v => {
      let gotVar: string = '';
      if (v[0] == '$') eval(`gotVar = additionalZones.${v.substr(1)}`);
      return gotVar;
    })

    switch (`${parameters[0]}-${parameters[1]}`) {
      case 'price-asc': return 'price_low_to_high';
      case 'price-desc': return 'price_high_to_low';
      case 'created_time-desc': return 'newest';
      default: return 'relevancy';
    }
    return '';
  }

}