import {Module} from "../../index";
import {IModuleOptions} from "../IModuleOptions";

export interface ISettingsOptions extends IModuleOptions{

  ref: string

  path?: string

}
