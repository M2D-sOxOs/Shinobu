export type ProxyConfig = {
  Enabled: boolean,
  Provider?: string,
  Server: string,
  Port: number
}

export class Proxy {
  
  public readonly Enabled: boolean;
  public readonly Provider: string;
  public readonly Server: string;
  public readonly Port: number;

  constructor(proxyConfig: ProxyConfig) {

    this.Enabled = proxyConfig.Enabled;
    this.Provider = proxyConfig.Provider || 'SOCKS5';
    this.Server = proxyConfig.Server;
    this.Port = proxyConfig.Port;
  }

}