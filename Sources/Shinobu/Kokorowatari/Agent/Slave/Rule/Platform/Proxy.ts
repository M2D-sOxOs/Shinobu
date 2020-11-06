export type ProxyConfig = {
  Server: string,
  Port: number
}

export class Proxy {
  
  public readonly Server: string;
  public readonly Port: number;

  constructor(proxyConfig: ProxyConfig) {

    this.Server = proxyConfig.Server;
    this.Port = proxyConfig.Port;
  }

}