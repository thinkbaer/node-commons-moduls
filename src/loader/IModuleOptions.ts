import {Module} from "../index";

export interface IModuleOptions {
  filter?: (modul:Module) => boolean
}
