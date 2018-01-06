import {StringOrFunction} from "../../types";

export interface IClassesLib {

  topic: string;

  /**
   * Can contain file references or paths
   */
  refs?: string[];


}

export interface IClassesOptions {

  libs: IClassesLib[];

}
