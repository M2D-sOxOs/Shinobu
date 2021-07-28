import { join } from "path";
import { Jinja } from "../../../../../Common/Jinja/Jinja";
import { Base } from "./Base";

export class Passive extends Base {

  constructor() {
    super(join(Jinja.Get('Koyomi.Cache.Path'), 'Koyomi-Cache-Passive'))
  }

}