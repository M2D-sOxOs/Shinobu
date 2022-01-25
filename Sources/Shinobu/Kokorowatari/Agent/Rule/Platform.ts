import { Table } from "../Rule";
import { Client, ClientConfig } from "./Platform/Client";
import { Command, CommandConfig } from "./Platform/Command";
import { FlowConfig, Flow } from "./Platform/Flow";
import { Proxy, ProxyConfig } from "./Platform/Proxy";

export type PlatformConfig = {
  Proxies: Table<ProxyConfig[]>,
  Clients: Table<ClientConfig>,
  Commands: Table<CommandConfig>,
  Flows: Table<FlowConfig>
};
export class Platform {

  public Proxies: Table<Proxy[]> = {};
  public Clients: Table<Client> = {};
  public Commands: Table<Command> = {};
  public Flows: Table<Flow> = {};

  constructor(public readonly Config: PlatformConfig) { }

  /**
   * Build after initialize for self-read
   */
  public Build(): void {
    this.__BuildProxy(this.Config.Proxies);
    this.__BuildClient(this.Config.Clients);
    this.__BuildCommands(this.Config.Commands);
    this.__BuildFlows(this.Config.Flows);
  }

  private __BuildProxy(proxyConfigs: Table<ProxyConfig[]>) {
    for (const proxyKey in proxyConfigs) this.Proxies[proxyKey] = proxyConfigs[proxyKey].map(v => new Proxy(v));
  }

  private __BuildClient(clientConfigs: Table<ClientConfig>) {
    for (const clientKey in clientConfigs) this.Clients[clientKey] = new Client(clientConfigs[clientKey]);
  }

  private __BuildCommands(commandConfigs: Table<CommandConfig>) {
    for (const commandKey in commandConfigs) this.Commands[commandKey] = new Command(commandConfigs[commandKey]);
  }

  private __BuildFlows(flowConfigs: Table<FlowConfig>) {
    for (const flowKey in flowConfigs) this.Flows[flowKey] = new Flow(flowConfigs[flowKey]);
  }
}