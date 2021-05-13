import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Base } from "./Mock/Base";
import { UUID } from "./Mock/UUID";
import { RakutenPage } from "./Mock/RakutenPage";
import { RakutenSort } from "./Mock/RakutenSort";
import { RakutenCondition } from "./Mock/RakutenCondition";
import { RakutenFilters } from "./Mock/RakutenFilters";

export class Mock {

  /**
   * Mocker
   */
  private __Mocker!: Base;

  public static Initialize(mockName: string, mockKey: string): Mock {
    return new Mock(mockName, mockKey);
  }

  protected constructor(public readonly Name: string, public readonly Key: string) {
    switch (Name) {
      case '@UUID':
        this.__Mocker = new UUID();
        return;
      case '@RakutenPage':
        this.__Mocker = new RakutenPage();
        return;
      case '@RakutenSort':
        this.__Mocker = new RakutenSort();
        return;
      case '@RakutenCondition':
        this.__Mocker = new RakutenCondition();
        return;
      case '@RakutenFilters':
        this.__Mocker = new RakutenFilters();
        return;
    }
    Urusai.Panic('Using unknown mock', Name);
  }

  public Value(sessionStorage: Table<Table<string>>, flowZone?: any): string {
    sessionStorage[this.Name] || (sessionStorage[this.Name] = {});
    return sessionStorage[this.Name][this.Key] || (sessionStorage[this.Name][this.Key] = this.__Mocker.Value(this.Key, sessionStorage, flowZone));
  }
}