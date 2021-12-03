import { Table } from "../../../Rule";
import { Base } from "./Base";

export class RakutenPage extends Base {

  public async Value(key: string, sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {
    
    const parameters: Array<string | null> = key.split(',').map(v => {
      let gotVar: string = '';
      if (v[0] == '$') eval(`gotVar = flowZone.${v.substr(1)}`);
      return gotVar;
    })

    return (parseInt(parameters[1]! || '45') * parseInt(parameters[0]! || '0')).toString();
  }

}