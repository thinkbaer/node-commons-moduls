import {ModuleDescriptor} from "../index";

export interface IModuleOptions {
  filter?: (modul:ModuleDescriptor) => boolean
}
