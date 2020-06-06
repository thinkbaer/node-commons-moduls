/**
 * Implementation for a cache interface
 */
export interface ICache {

  get(key: string): any;

  set(key: string, value: any): void;

  clear(): void;

}
