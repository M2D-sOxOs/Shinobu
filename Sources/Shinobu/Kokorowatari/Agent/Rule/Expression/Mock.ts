import { Urusai } from "../../../../../Common/Urusai/Urusai";
import { Table } from "../../Rule";
import { Base } from "./Mock/Base";
import { UUID } from "./Mock/UUID";
import { DPOP } from "./Mock/DPOP";
import { MercariSessionCode } from "./Mock/MercariSessionCode";
import { MercariSessionCodeChallenge } from "./Mock/MercariSessionCodeChallenge";
import { MercariSessionNonce } from "./Mock/MercariSessionNonce";
import { MercariSessionState } from "./Mock/MercariSessionState";
import { RakutenPage } from "./Mock/RakutenPage";
import { RakutenPaged } from "./Mock/RakutenPaged";
import { RakutenSort } from "./Mock/RakutenSort";
import { RakutenCondition } from "./Mock/RakutenCondition";
import { RakutenFilters } from "./Mock/RakutenFilters";
import { BoothSort } from "./Mock/BoothSort";

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
      case '@DPOP':
        this.__Mocker = new DPOP();
        return;
      case '@MercariSessionCode':
        this.__Mocker = new MercariSessionCode();
        return;
      case '@MercariSessionCodeChallenge':
        this.__Mocker = new MercariSessionCodeChallenge();
        return;
      case '@MercariSessionNonce':
        this.__Mocker = new MercariSessionNonce();
        return;
      case '@MercariSessionState':
        this.__Mocker = new MercariSessionState();
        return;
      case '@RakutenPage':
        this.__Mocker = new RakutenPage();
        return;
      case '@RakutenPaged':
        this.__Mocker = new RakutenPaged();
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

      case '@BoothSort':
        this.__Mocker = new BoothSort();
        return;
    }
    Urusai.Panic('Using unknown mock', Name);
  }

  public async Value(sessionStorage: Table<Table<string>>, flowZone?: any): Promise<string> {
    if ('' == this.Name) return await this.__Mocker.Value(this.Key, sessionStorage, flowZone);
    sessionStorage[this.Name] || (sessionStorage[this.Name] = {});
    return sessionStorage[this.Name][this.Key] || (sessionStorage[this.Name][this.Key] = await this.__Mocker.Value(this.Key, sessionStorage, flowZone));
  }
}