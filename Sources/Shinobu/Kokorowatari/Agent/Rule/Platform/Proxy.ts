export type ProxyConfig = {
  Enabled: boolean,
  Server: string,
  Port: number
}

export class Proxy {
  
  public readonly Enabled: boolean;
  public readonly Server: string;
  public readonly Port: number;

  constructor(proxyConfig: ProxyConfig) {

    this.Enabled = proxyConfig.Enabled;
    this.Server = proxyConfig.Server;
    this.Port = proxyConfig.Port;
  }

}