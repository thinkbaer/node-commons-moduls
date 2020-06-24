import {Module} from "../registry/Module";


export abstract class AbstractModuleHandle {

  module: Module;

  constructor(module: Module){
    this.module = module;
  }

}
