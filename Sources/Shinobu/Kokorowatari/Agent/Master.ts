import { ChildProcess, spawn } from "child_process";
import { createServer, Socket } from "net";
import { Server } from "net";
import { cpus } from "os";
import { Jinja } from "../../../Common/Jinja/Jinja";
import { Urusai } from "../../../Common/Urusai/Urusai";
import { Agent, Frame } from "../Agent";
import { Rule, Table } from "./Rule";
import { Expression } from "./Rule/Expression";
import { Flow } from "./Rule/Platform/Flow";
import { Cache } from "./Master/Cache";

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
  private static __Buffers: { [k: string]: string } = {};
  private static __Requesting: { [k: string]: string } = {};
  private static __Flowing: { [k: string]: Flow } = {};
  private static __Additional: { [k: string]: any } = {};

  //#endregion

  /**
   * Create and online all slaves
   */
  public static async Initialize() {

    this.__Interconnection = createServer().listen(this.IPCName);

    const poolSize: number = Jinja.Get('Kokorowatari.Pool.Size') || (cpus().length - 1);
    const processObject = { Current: 0, Total: poolSize };

    Urusai.Verbose('Master initializing rule set');
    await Rule.Initialize();

    Urusai.Verbose('Master initializing cache');
    await Cache.Initialize();

    // const indicator: Promise<void> = Urusai.Progress('Initialize agents......', processObject);
    for (let poolIndex = 0; poolIndex < poolSize; poolIndex++) {

      const agentId: string = Agent.GenerateID();

      await this.__Run(agentId);
      processObject.Current++;
    }

    // await indicator;
    Urusai.Verbose('Kotorowatari slaves all ready')
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

    // Initialize buffer
    this.__Buffers[agentId] = '';

    this.Connections[agentId].on('data', async (d) => {

      Urusai.Verbose('Incoming data from Slave', agentId);
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
        this.__Response(frameData.Message == 'SUCCESS' ? 0 : 1, frameData.Reply!, frameData.Data);
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
        delete this.__Flowing[requestId];
        this.__Response(1, requestId, null);
      }

      Urusai.Verbose('Restarting agent:', agentId);
      await this.__Run(agentId);
    });
  }

  public static async Start() {

    Urusai.Verbose('Start on Master Received, but will not performed immediately by data-integrity reason.')
    return new Promise<void>((s, f) => setTimeout(s, 100));
  }

  public static Send(dataFrame: Frame, agentId?: string, requestId?: string): string {
    dataFrame.Id = requestId || Agent.GenerateID();
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
  public static async Perform(flowName: string, userInput: Table<string>): Promise<string | null> {

    return await this.__Perform(new Expression('*' + flowName), {
      __IN__: userInput
    });
  }

  private static async __Perform(flowExpr: Expression, additionalZones: any, requestId?: string): Promise<string | null> {

    const flowObject: Flow = await flowExpr.Value();
    if (flowObject.Cache) {
      let cacheKey = '';
      for (const key of flowObject.Cache.Key) cacheKey += (await key.Value()) + '-';
    }

    if (0 == flowObject.Flow.length) {
      if (flowObject.Failover) {
        Urusai.Verbose('Using flow as a virtual node');
        return await this.__Perform(flowObject.Failover, additionalZones, requestId);
      }

      Urusai.Warning('Using flow as a virtual node without providing failover will always return false');
      return null;
    }

    const agentId = this.__Pick();
    requestId = requestId || Agent.GenerateID();
    this.Send({
      Action: 'REQUEST',
      Message: flowExpr.Expression,
      Data: additionalZones
    }, agentId, requestId);
    this.__Requesting[requestId] = requestId;
    this.__Additional[requestId] = additionalZones;
    this.__Flowing[requestId] = flowObject;
    return requestId;
  }

  /**
   * Response event
   */
  public static async __Response(status: number, requestId: string, responseData: any) {

    Urusai.Verbose('Handling response of request', requestId);
    delete this.__Requesting[requestId];

    // Failure try next
    if (1 == status && this.__Flowing[requestId].Failover) {
      Urusai.Verbose('Flow is failure but has an failover', this.__Flowing[requestId].Failover!.Expression);
      return this.__Perform(this.__Flowing[requestId].Failover!, this.__Additional[requestId], requestId);
    }

    // End of life
    delete this.__Additional[requestId];
    delete this.__Flowing[requestId];

    this.__CALLBACKS.forEach(v => v(status, requestId, responseData));
  }

  private static readonly __CALLBACKS: ((status: number, requestId: string, responseData: any) => void)[] = [];
  public static async Callback(cb: (status: number, requestId: string, responseData: any) => void) {
    this.__CALLBACKS.push(cb);
  }

}