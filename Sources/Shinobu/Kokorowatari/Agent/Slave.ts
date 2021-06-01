import { createConnection, Socket } from "net";
import { Urusai } from "../../../Common/Urusai/Urusai";
import { Agent, Frame } from "../Agent";
import { Control } from "./Slave/Control";
import { Request } from "./Slave/Request";
import { Rule } from "./Rule";
import { Cache } from "./Slave/Cache";

export class Slave {

  private static __IPCMaster: Socket | null = null;

  public static IPC_ID: string;

  /**
   * Initialize slave to Online
   */
  public static async Initialize(): Promise<void> {

    if (!('IPCName' in process.env)) Urusai.Panic('Start Agent without IPCName is not supported');
    if (!('IPCId' in process.env)) Urusai.Panic('Start Agent without IPCId is not supported');

    this.IPC_ID = process.env['IPCId']!;

    return new Promise(async (s, f) => {

      Urusai.Verbose('Connecting to master......');

      this.__IPCMaster = createConnection(process.env['IPCName']!);
      this.__IPCMaster.once('connect', () => {

        Urusai.Verbose('Sending HELLO flag to Master');
        this.Send({ Action: 'CONTROL', Message: 'HELLO', Data: '' });

        Urusai.Verbose('Waiting for HELLO flag from Master');
        let receivedString: string = '';
        this.__IPCMaster!.on('data', async (d) => {
          receivedString += d.toString('utf8');
          if (-1 == receivedString.indexOf('\n')) return;

          const frameData: Frame = JSON.parse(receivedString.split('\n')[0]);
          if ('CONTROL' != frameData.Action || 'HELLO' != frameData.Message) Urusai.Panic('Master send invalid HELLO message');

          Urusai.Verbose('HELLO Message received from master');
          this.__IPCMaster!.removeAllListeners();

          Urusai.Verbose('Slave initializing rule set');
          await Rule.Initialize();

          Urusai.Verbose('Binding final events');
          this.__IPCMaster!.on('data', (d) => {

            Urusai.Verbose('Incoming data from Master');
            this.__Buffer += d.toString('utf8');

            this.__Dispatch();
          });

          this.__IPCMaster?.on('close', () => {
            Urusai.Panic('Lost connection to Master');
            process.exit(0);
          });

          s();
        });
      });
    });

  }

  private static __Buffer: string = '';
  /**
   * Start from binding & handling events
   */
  public static Start(): void {

    Urusai.Notice('Slave started');
    Cache.Start();
    throw 'INT';
  }

  private static async __Dispatch() {

    if (-1 == this.__Buffer.indexOf('\n')) {
      Urusai.Verbose('No enough data to process, maybe already processed all received messages?');
      return;
    }

    const frameData: Frame = JSON.parse(this.__Buffer.substr(0, this.__Buffer.indexOf('\n')));
    this.__Buffer = this.__Buffer.substr(this.__Buffer.indexOf('\n') + 1);
    Urusai.Verbose('A', frameData.Action, 'frame received');

    switch (frameData.Action) {
      case 'CONTROL':
        Control.Process(frameData);
        break;
      case 'REQUEST':
        Urusai.Notice('Requested:', frameData.Id);
        Request.Process(frameData);
        break;
      default:
        Urusai.Error('Unsupported action', frameData.Action, 'at this time');
    }

    this.__Dispatch();
  }

  public static async Send(dataFrame: Frame) {
    dataFrame.Id = Agent.GenerateID();
    Urusai.Verbose('Sending', dataFrame.Action, 'frame', dataFrame.Id)
    this.__IPCMaster?.write(JSON.stringify(dataFrame) + '\n');
  }

}