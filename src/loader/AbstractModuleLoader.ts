import * as _ from 'lodash';
import {Module} from '../registry/Module';
import {AbstractModuleHandle} from './AbstractModuleHandle';
import {ModuleRegistry} from '../registry/ModuleRegistry';
import {IModuleOptions} from './IModuleOptions';

export abstract class AbstractModuleLoader<T extends AbstractModuleHandle, OPT extends IModuleOptions> {

  _options: OPT;

  protected readonly registry: ModuleRegistry;

  _handles: T[] = [];

  constructor(registry: ModuleRegistry, options?: OPT) {
    this.registry = registry;
    this._options = options || <OPT>{};
  }

  handles(): T[] {
    return this._handles;
  }

  add(handle: T) {
    if (handle) {
      let exists = _.find(this._handles, (x) => {
        return x.module.name === handle.module.name;
      });
      if (!exists) {
        this._handles.push(handle);
      } else {
        throw new Error('handle for module ' + handle.module.name + ' already loaded');
      }
    }
    return handle;
  }

  protected abstract loadOne(modul: Module): Promise<T>;

  load(module: Module): Promise<T> ;
  load(modules: Module[]): Promise<T[]> ;
  load(modules: Module | Module[]): Promise<T | T[]> {
    if (_.isArray(modules)) {
      const promises = [];
      for (let x of modules) {
        if (this._options.filter && !this._options.filter(x)) {
          continue;
        }
        promises.push(this._loadOne(x));
      }
      return Promise.all(promises);
    } else {
      return this._loadOne(modules);
    }
  }


  private async _loadOne(modules: Module) {
    let res = null;
    let y = await this.loadOne(modules);
    try {
      res = this.add(y);
    } catch (err) {
      if (this.registry.options().handleErrorOnDuplicate) {
        switch (this.registry.options().handleErrorOnDuplicate) {
          case 'skip':
            break;
          case 'log':
            console.error(err);
            break;
          default:
            throw err;
        }
      } else {
        throw err;
      }
    }
    return res;
  }

}
