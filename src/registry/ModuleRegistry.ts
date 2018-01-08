import * as _ from 'lodash';

import {Module} from "./Module";
import {Helper, INpmlsOptions} from "../utils/Helper";
import {IModuleRegistryOptions} from "./IModuleRegistryOptions";
import {IModuleLoader} from "../loader/IModuleLoader";
import {IModuleHandle} from "../loader/IModuleHandle";
import {PlatformTools} from "../utils/PlatformTools";


const DEFAULT: IModuleRegistryOptions = {
  paths: [],
  // skipCheck:[],
  module: module
}

export class ModuleRegistry {

  private readonly _options: IModuleRegistryOptions;

  private _modules: Module[] = [];

  paths: string[] = [];


  constructor(options: IModuleRegistryOptions) {
    _.defaults(options, DEFAULT);
    this._modules = [];
    this._options = options;
    this.paths = options.paths; // Helper.checkPaths(options.paths || []);
    this._options.depth = this._options.depth || 2
  }


  options() {
    return this._options;
  }


  async rebuild(): Promise<ModuleRegistry> {
    this._modules = [];

    let modules_lists = await Promise.all(
      _.map(this.paths, this._scan_module_path.bind(this))
    );

    let one_list = [].concat(...modules_lists);
    for (let __modul of one_list) {
      let _modul = _.find(one_list, function (_x) {
        return _x.name == __modul.name
      });

      if (!_modul) {
        one_list.push(__modul)
      } else {
        _modul.multi_implements = true
        // TODO: if module already exists check version and replace them
      }
    }

    //  await Promise.all(_.map(modules, this.load.bind(this)));
    this._build_registry(one_list);
    return this;
  }

  modules(): Module[] {
    return this._modules;
  }


  private async _scan_module_path(node_modules_dir: string): Promise<Module[]> {
    let options: INpmlsOptions = {
      filter: this._options.packageFilter,
      depth: this._options.depth
    };

    let packageJsons = [];
    if (PlatformTools.fileExist(PlatformTools.join(node_modules_dir, 'package.json'))) {
      options.depth++;
      let dirname = PlatformTools.dirname(node_modules_dir);
      let basename = PlatformTools.basename(node_modules_dir);
        // TODO!!!!
      packageJsons = await Helper.lookupNpmInDirectory(dirname,basename,[], options);
    } else {
      packageJsons = await Helper.npmls(node_modules_dir, options);
    }

    return _.map(packageJsons, (module: any) => {
      return Module.fromOptions(module)
    })
  }


  private _build_registry(modules: Module[]) {
    this._modules = modules;

    for (let _modul of this._modules) {
      let dependencies = Object.keys(_modul.dependencies);
      let children = _.filter(this._modules, function (_x) {
        return dependencies.indexOf(_x.name) > -1
      });

      for (let _dep_modul of children) {
        _modul.child_modules.push(_dep_modul.name)
      }
      _modul.child_modules = _.uniq(_modul.child_modules);
    }

    this._modules.sort((a: Module, b: Module) => {
      return a.child_modules.length - b.child_modules.length;
    });

    for (let first of this._modules) {

      let dependents = _.filter(this._modules, function (other) {
        if (other.name == first.name) return false;

        if (other.child_modules.indexOf(first.name) > -1) {
          return true
        }
        return false
      });

      if (dependents.length) {
        for (let x of dependents) {
          x.weight += (first.weight + 1)
        }
      } else {
        // ???
      }
    }

    this._modules.sort((a, b) => {
      if (a.weight === b.weight) {
        return a.name.localeCompare(b.name);
      }
      return a.weight - b.weight
    });

    return this._modules
  }


  async loader<T extends IModuleLoader<IModuleHandle, OPT>, OPT>(loaderClazz: Function, options?: OPT): Promise<T> {
    let instance = <T>Reflect.construct(loaderClazz, [this, options]);
    await instance.load(this.modules());
    return instance;
  }
}
