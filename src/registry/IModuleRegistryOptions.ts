import {ICache} from './ICache';

export interface IModuleRegistryOptions {

  packageFilter?: (packageJson: any) => boolean;

  /**
   * Paths to begin lookup for modules
   */
  paths: string[]

  /**
   * Path pattern to look for futher modules, fix pattern is the "node_modules" directory
   */
  pattern?: string[]

  //skipCheck: string[]

  depth?: number

  module?: NodeModule

  /**
   * how should error be handled for already existsing moduls
   */
  handleErrorOnDuplicate?:'log' | 'skip' | 'throw'

  /**
   * for performace reasons the scanned directories can be cached
   */
  cache?: ICache;
}
