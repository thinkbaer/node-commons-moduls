import * as _ from 'lodash';
import {Module} from "../registry/Module";
import {IModuleHandle} from "./IModuleHandle";
import {ModuleRegistry} from "../registry/ModuleRegistry";

export abstract class IModuleLoader<T extends IModuleHandle,OPT> {

  _options: OPT;

  registry: ModuleRegistry;

  handles: T[] = [];

  constructor(registry: ModuleRegistry, options?:OPT) {
    this.registry = registry;
    this._options = options || <OPT>{}
  }

  add(handle: T) {
    let exists = _.find(this.handles, (x) => {
      return x.module.name === handle.module.name
    });
    if (!exists) {
      this.handles.push(handle);
    } else {
      throw new Error('module ' + handle.module.name + ' already loaded');
    }
    return handle;
  }

  protected abstract loadOne(modul: Module): Promise<T>;

  load(module: Module):Promise<T> ;
  load(modules: Module[]):Promise<T[]> ;
  load(modules: Module | Module[]):Promise<T | T[]> {
    if(_.isArray(modules)){
      /*
      let m = []
      for(let x of modules){
        let y = await this.loadOne(x);
        m.push(this.add(y));
      }
      return m;
      */

      let pm = _.map(modules,(m:Module) => {return this.loadOne(m).then(r => {return this.add(r)})});
      return Promise.all(pm);

    }else {
      return this.loadOne(modules).then(r => {return this.add(r)});
    }
  }

}
