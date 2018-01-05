import {Module} from "../registry/Module";


export abstract class IModuleHandle {

  module: Module;

  constructor(module: Module){
    this.module = module;
  }

}
