import { ChildProcess, spawn } from "child_process";
import { createServer, Socket } from "net";
import { Server } from "net";
import { cpus } from "os";
import { Jinja } from "../../../Common/Jinja/Jinja";
import { Urusai } from "../../../Common/Urusai/Urusai";
import { Agent, Frame } from "../Agent";
import { Table } from "./Slave/Rule";

export class Master {

  //#region IPC Channel

  public static readonly IPCName: string = '/tmp/kokorowatari-agent-' + new Date().getTime().toString(36);

  private static __Interconnection: Server | null = null;

  //#endregion

  //#region Pool

  public static readonly Processes: { [k: string]: ChildProcess } = {};
  public static readonly Connections: { [k: string]: Socket } = {};
  public static readonly Agents: string[] = [];

  /**
   * Callbacks
   */
  private static __Responses: ((s: number, requestId: string, d: any) => void)[] = [];
  private static __Buffers: { [k: string]: string } = {};
  private static __Requesting: { [k: string]: string } = {};

  //#endregion

  /**
   * Create and online all slaves
   */
  public static async Initialize() {

    this.__Interconnection = createServer().listen(this.IPCName);

    const poolSize: number = Jinja.Get('Kokorowatari.Pool.Size') || (cpus().length - 1);
    const processObject = { Current: 0, Total: poolSize };

    return new Promise<void>(async (s, f) => {

      // const indicator: Promise<void> = Urusai.Progress('Initialize agents......', processObject);
      for (let poolIndex = 0; poolIndex < poolSize; poolIndex++) {

        const agentId: string = Agent.GenerateID();

        await this.__Run(agentId);
        processObject.Current++;
      }

      // await indicator;
      Urusai.Verbose('Kotorowatari agents all ready')
      s();
    })
  }

  private static async __Online(agentId: string): Promise<void> {

    return new Promise((s, f) => {

      // Monitor Too-Quick-Exited
      this.Processes[agentId].on('exit', () => {
        Urusai.Panic('Some child is failed to start');
      });

      this.__Interconnection!.once('connection', (connection) => {

        Urusai.Verbose('Agent is online, waiting for HELLO');

        let receivedString: string = '';
        connection.on('data', (d) => {

          receivedString += d.toString('utf8');
          if (-1 == receivedString.indexOf('\n')) return;

          const frameData: Frame = JSON.parse(receivedString.split('\n')[0]);
          if ('CONTROL' != frameData.Action || 'HELLO' != frameData.Message) Urusai.Panic('Agent sending invalid HELLO message');

          Urusai.Verbose('HELLO Message received from agent:', agentId);
          this.Connections[agentId] = connection;
          this.Connections[agentId].removeAllListeners();
          this.Processes[agentId].removeAllListeners();
          this.Agents.push(agentId);

          Urusai.Verbose('Sending HELLO Message to agent:', agentId);
          this.Send({ Action: 'CONTROL', Message: 'HELLO', Data: '' }, agentId);

          this.__Event(agentId);
          s();
        });
      });
    })
  }

  private static async __Event(agentId: string) {

    this.Connections[agentId].on('data', async (d) => {

      Urusai.Verbose('Incoming data from Slave', agentId, ':', d.toString('utf-8'));
      this.__Buffers[agentId] += d.toString('utf-8');
      await this.__EventDispatch(agentId);
    })
  }

  private static async __EventDispatch(agentId: string) {
    if (-1 == this.__Buffers[agentId].indexOf('\n')) {
      Urusai.Verbose('No enough data to process, maybe already processed all received messages?');
      return;
    }


    const frameData: Frame = JSON.parse(this.__Buffers[agentId].substr(0, this.__Buffers[agentId].indexOf('\n')));
    this.__Buffers[agentId] = this.__Buffers[agentId].substr(this.__Buffers[agentId].indexOf('\n') + 1);
    Urusai.Verbose('A', frameData.Action, 'frame received');

    switch (frameData.Action) {
      case 'RESPONSE':
        this.__Responses.forEach(v => v(0, frameData.Reply!, frameData.Data));
        break;
      default:
        Urusai.Error('Unsupported action', frameData.Action, 'at this time');
    }

  }

  private static async __Run(agentId: string) {

    Urusai.Verbose('Running agent:', agentId)

    this.Processes[agentId] = spawn('electron', ['--no-sandbox', require.main?.filename!], {
      env: Object.assign({ 'Mark-Slave': 1, 'IPCName': this.IPCName, 'IPCId': agentId }, process.env),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Redirect STDIO
    this.Processes[agentId].stdout!.on('data', (d) => {
      if (this.Connections[agentId]) process.stdout.write(d.toString().trim().split('\n').map((v: string) => (`\x1B[32m[${agentId}]\x1B[0m` + v)).join('\n') + '\n');
    });
    this.Processes[agentId].stderr!.on('data', (d) => {
      if (this.Connections[agentId]) process.stdout.write(d.toString().trim().split('\n').map((v: string) => (`\x1B[31m[${agentId}]\x1B[0m` + v)).join('\n') + '\n');
    });

    await this.__Online(agentId);

    this.Processes[agentId].on('exit', async () => {

      let foundIndex = this.Agents.indexOf(agentId);
      if (-1 != foundIndex) this.Agents.splice(foundIndex, 1);
      Urusai.Notice('Agent gone, Restart and retry:', agentId);

      this.Connections[agentId].removeAllListeners();
      this.Processes[agentId].removeAllListeners();
      delete this.Connections[agentId];
      delete this.Processes[agentId];

      Urusai.Verbose('Clean-up pending requests related to agent:', agentId);
      for (const requestId in this.__Requesting) {

        if (this.__Requesting[requestId] != agentId) continue;

        delete this.__Requesting[requestId];
        this.__Responses.forEach(v => v(0, requestId, null));
      }

      Urusai.Verbose('Restarting agent:', agentId);
      await this.__Run(agentId);
    });
  }

  public static async Start() {

    Urusai.Verbose('Start on Master Received, but will not performed immediately by data-integrity reason.')
    return new Promise<void>((s, f) => setTimeout(s, 100));
  }

  public static Send(dataFrame: Frame, agentId?: string): string {
    dataFrame.Id = Agent.GenerateID();
    return this.__Send(dataFrame, agentId || this.__Pick());
  }

  private static __Send(dataFrame: Frame, agentId: string): string {
    Urusai.Verbose('Sending', dataFrame.Action, 'frame to', agentId);
    this.Connections[agentId].write(JSON.stringify(dataFrame) + '\n');
    return dataFrame.Id!;
  }

  private static __Pick(): string {
    return this.Agents[Math.floor(Math.random() * 1000 % this.Agents.length)];
  }

  /**
   * Perform an actual crawl
   */
  public static Perform(flowName: string, userInput: Table<string>): string {
    const agentId = this.__Pick(), requestId = this.Send({
      Action: 'REQUEST',
      Message: flowName,
      Data: {
        __IN__: userInput
      }
    }, agentId);
    this.__Requesting[requestId] = agentId;
    return requestId;
  }

  /**
   * Response event
   */
  public static Response(cb: (status: number, requestId: string, responseData: any) => void) {
    this.__Responses.push(cb);
  }

}