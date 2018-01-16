import {IModuleOptions} from "../IModuleOptions";

export interface IClassesLib {

  topic: string;

  /**
   * Can contain file references or paths
   */
  refs?: string[];


}

export interface IClassesOptions extends IModuleOptions {

  libs: IClassesLib[];

}
