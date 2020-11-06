import { Urusai } from "../../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Base } from "./Mock/Base";
import { UUID } from "./Mock/UUID";

export class Mock {

  /**
   * Mocker
   */
  private __Mocker!: Base;

  public static Initialize(mockName: '@UUID', mockKey: string): Mock {
    return new Mock(mockName, mockKey);
  }

  protected constructor(public readonly Name: '@UUID', public readonly Key: string) {
    switch (Name) {
      case '@UUID':
        this.__Mocker = new UUID();
        return;
    }
    Urusai.Panic('Using unknown mock', Name);
  }

  public Value(sessionStorage: Table<Table<string>>): string {
    sessionStorage[this.Name] || (sessionStorage[this.Name] = {});
    return sessionStorage[this.Name][this.Key] || (sessionStorage[this.Name][this.Key] = this.__Mocker.Value());
  }
}