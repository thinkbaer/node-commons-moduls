import * as _ from 'lodash';
import {Module} from "../registry/Module";
import {IModuleHandle} from "./IModuleHandle";
import {ModuleRegistry} from "../registry/ModuleRegistry";

export abstract class IModuleLoader<T extends IModuleHandle,OPT> {

  _options: OPT;

  protected readonly registry: ModuleRegistry;

  _handles: T[] = [];

  constructor(registry: ModuleRegistry, options?:OPT) {
    this.registry = registry;
    this._options = options || <OPT>{}
  }

  handles():T[]{
    return this._handles;
  }

  add(handle: T) {
    if(handle){
      let exists = _.find(this._handles, (x) => {
        return x.module.name === handle.module.name
      });
      if (!exists) {
        this._handles.push(handle);
      } else {
        throw new Error('module ' + handle.module.name + ' already loaded');
      }
    }
    return handle;
  }

  protected abstract loadOne(modul: Module): Promise<T>;

  load(module: Module):Promise<T> ;
  load(modules: Module[]):Promise<T[]> ;
  async load(modules: Module | Module[]):Promise<T | T[]> {
    if(_.isArray(modules)){
      let m = []
      for(let x of modules){
        let y = await this.loadOne(x);
        m.push(this.add(y));
      }
      return m;
      /*
      let pm = _.map(modules,(m:Module) => {return this.loadOne(m).then(r => {return this.add(r)})});
      return Promise.all(pm);
      */
    }else {
      return this.loadOne(modules).then(r => {return this.add(r)});
    }
  }

}
