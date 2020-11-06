import { Tokei } from "../../../../Common/Tokei/Tokei";
import { Urusai } from "../../../../Common/Urusai/Urusai";
import { Frame } from "../../Agent";
import { Request } from "./Request";
import { Expression } from "./Rule/Expression";

export type TrialCommandData = {
  Command: string,
  Proxy: string,
  Input?: any
}

export class Control {

  public static async Process(dataFrame: Frame) {

    switch (dataFrame.Message) {
      case 'TRIAL_COMMAND':
        Urusai.Verbose('Performing a simple trail command on slave');
        const trialCommandData: TrialCommandData = dataFrame.Data as any;

        Urusai.Verbose('Using command', trialCommandData.Command, 'as trial');
        this.__TrialCommand(trialCommandData.Command, trialCommandData.Proxy, trialCommandData.Input);
        break;
      case 'TOKEI_REPORT':
        Tokei.Report();
        break;
      default:
        Urusai.Error('Unknown message', dataFrame.Message, 'in frame');
    }
  }

  private static async __TrialCommand(commandName: string, proxyName: string, inputData: any) {

    const proxy: Expression = new Expression('*' + proxyName);

    const sessionStorage = { Proxy: await proxy.Value() };
    const additionalZones = { __IN__: inputData };
    await Request.Execute(commandName, sessionStorage, additionalZones);
    Urusai.Verbose('Request executed and completed');
    Urusai.Verbose('Session Storage:', sessionStorage);
    Urusai.Verbose('Additional Zones:', additionalZones);
  }

}