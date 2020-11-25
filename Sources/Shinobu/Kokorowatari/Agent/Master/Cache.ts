import { Active } from "./Cache/Active";
import { Base } from "./Cache/Base";
import { Passive } from "./Cache/Passive";
import { PassiveLB } from "./Cache/PassiveLB";

/**
 * Cache provider
 */
export class Cache {

  private static __Drivers: { [k: string]: Base } = {};

  /**
   * Initialize cache provider
   */
  public static async Initialize(): Promise<void> {

    // Initialize cache drivers
    this.__Drivers['ACTIVE'] = new Active();
    this.__Drivers['PASSIVE'] = new Passive();
    this.__Drivers['PASSIVE-LB'] = new PassiveLB();
  }

  /**
   * Fetch from cache
   */
  public static async Get(key: string, driver: string) {
    return await this.__Drivers[driver].Get(key);
  }

  /**
   * 
   * @param key 
   * @param value 
   */
  public static async Set(key: string, value: string, flowName: string, inData: any, expire: number, driver: string) {
    return await this.__Drivers[driver].Set(key, value, flowName, inData, expire);
  }
}