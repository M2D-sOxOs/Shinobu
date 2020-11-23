/**
 * Cache provider
 */
export class Cache {

  /**
   * Initialize cache provider
   */
  public static async Initialize(): Promise<void> {
  }

  /**
   * Fetch from cache
   */
  public static async Fetch(key: string, forceUpdate: boolean = false) {

  }

  /**
   * 
   * @param key 
   * @param value 
   */
  public static async Set(key: string, value: string, expire: number, driver: string) {
    
  }
}