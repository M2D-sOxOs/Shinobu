import { Serializable, spawn } from "child_process";
import { createConnection, createServer, Server, Socket } from "net";
import { Urusai } from "../../Common/Urusai/Urusai";
import { Master } from "./Agent/Master";
import { Slave } from "./Agent/Slave";

export type Frame = {
  Id?: string,
  Reply?: string,
  Action: 'CONTROL' | 'REQUEST' | 'RESPONSE',
  Message: string,
  Data: Serializable
}

export class Agent {

  /**
   * Agent master-slave flag
   */
  public static get isMaster(): boolean {
    return !('Mark-Slave' in process.env);
  }

  /**
   * Initialize agent
   */
  public static async Initialize() {
    return this.isMaster ? Master.Initialize() : Slave.Initialize();
  }

  /**
   * Start service
   */
  public static async Start() {
    Urusai.Verbose('Starting')
    return this.isMaster ? Master.Start() : Slave.Start();
  }

  private static __ID = new Date().getTime();

  /**
   * ID
   */
  public static GenerateID(): string {
    this.__ID += Math.round(Math.random() * 100);
    return this.__ID.toString(36);
  }
}