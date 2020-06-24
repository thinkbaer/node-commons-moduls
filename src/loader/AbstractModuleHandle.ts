import {ModuleDescriptor} from "../registry/ModuleDescriptor";


export abstract class AbstractModuleHandle {

  module: ModuleDescriptor;

  constructor(module: ModuleDescriptor){
    this.module = module;
  }

}
