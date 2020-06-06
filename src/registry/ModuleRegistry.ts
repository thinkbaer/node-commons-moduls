import * as _ from 'lodash';

import {Module} from './Module';
import {Helper} from '../utils/Helper';
import {IModuleRegistryOptions} from './IModuleRegistryOptions';
import {IModuleLoader} from '../loader/IModuleLoader';
import {IModuleHandle} from '../loader/IModuleHandle';

import {ClassesLoader, IClassesOptions, IRequireOptions, ISettingsOptions, RequireLoader, SettingsLoader} from '../';
import {CryptUtils, PlatformUtils} from 'commons-base';
import {INpmlsOptions} from '../utils/INpmlsOptions';


const DEFAULT: IModuleRegistryOptions = {

  paths: [],

  pattern: [],

  module: module,

  handleErrorOnDuplicate: 'skip'
};

export class ModuleRegistry {

  private readonly _options: IModuleRegistryOptions;

  private _modules: Module[] = [];

  paths: string[] = [];


  constructor(options: IModuleRegistryOptions) {
    _.defaults(options, DEFAULT);
    this._modules = [];
    this._options = options;
    this.paths = options.paths; // Helper.checkPaths(options.paths || []);
    this._options.depth = this._options.depth || 2;
    this._options.pattern.unshift('node_modules');
    this._options.pattern = _.uniq(this._options.pattern);
  }


  /**
   * Check if cache is present
   */
  hasCache() {
    return !!this._options.cache;
  }

  /**
   * Return the cache object
   */
  getCache() {
    return this._options.cache;
  }

  options() {
    return this._options;
  }


  async rebuild(): Promise<ModuleRegistry> {
    this._modules = [];

    let modules_lists = await Promise.all(
      _.map(this.paths, this._scan_module_path.bind(this))
    );

    let to_register = [];
    let one_list = [].concat(...modules_lists);

    for (let __modul of one_list) {
      let _modul = _.find(to_register, function (_x) {
        return _x.name == __modul.name;
      });

      if (!_modul) {
        to_register.push(__modul);
      } else {
        _modul.multi_implements = true;
        // TODO: if module already exists check version and replace them
      }
    }

    //  await Promise.all(_.map(modules, this.load.bind(this)));
    this._build_registry(to_register);
    return this;
  }

  modules(): Module[] {
    return this._modules;
  }


  private async _scan_module_path(node_modules_dir: string): Promise<Module[]> {

    const cacheKey = [ModuleRegistry.name.toLowerCase(), 'scan_modul_path', CryptUtils.shorthash(node_modules_dir)].join('--');
    let packageJsons = null;
    if (this.hasCache()) {
      try {
        packageJsons = await this.getCache().get(cacheKey);
      } catch (e) {
      }
    }

    let options: INpmlsOptions = {
      filter: this._options.packageFilter,
      depth: this._options.depth,
      subModulePaths: this._options.pattern
    };

    if (_.isNull(packageJsons)) {
      packageJsons = [];
      if (PlatformUtils.fileExist(PlatformUtils.join(node_modules_dir, 'package.json'))) {
        options.depth++;
        let dirname = PlatformUtils.dirname(node_modules_dir);
        let basename = PlatformUtils.basename(node_modules_dir);
        // TODO!!!!
        packageJsons = await Helper.lookupNpmInDirectory(dirname, basename, [], options);
      } else {
        packageJsons = await Helper.npmls(node_modules_dir, options);
      }

      if (this.hasCache()) {
        try {
          this.getCache().set(cacheKey, packageJsons);
        } catch (e) {

        }
      }
    }

    return _.map(packageJsons, (module: any) => {
      return Module.fromOptions(module);
    });
  }


  private _build_registry(modules: Module[]) {
    this._modules = modules;

    for (let _modul of this._modules) {
      let dependencies = Object.keys(_modul.dependencies);
      let submoduls: string[] = [];
      _.map(_.values(_modul.sub_modules), v => {
        submoduls.push(...v.modules);
      });

      let children = _.filter(this._modules, function (_x) {
        return dependencies.indexOf(_x.name) > -1;
      });

      for (let _dep_modul of children) {
        _modul.child_modules.push(_dep_modul.name);
      }
      _modul.child_modules = _.uniq(_modul.child_modules);

      let submodules = _.filter(this._modules, (_x) => {
        return submoduls.indexOf(_x.name) > -1;
      });

      submodules.forEach((m) => {
        m.submodule = true;
      });

    }

    this._modules.sort((a: Module, b: Module) => {
      return a.child_modules.length - b.child_modules.length;
    });

    for (let first of this._modules) {

      let dependents = _.filter(this._modules, function (other) {
        if (other.name == first.name) return false;

        if (other.child_modules.indexOf(first.name) > -1) {
          return true;
        }
        return false;
      });

      if (dependents.length) {
        for (let x of dependents) {
          x.weight += (first.weight + 1);
        }
      } else {
        // ???
      }
    }

    this._modules.sort((a, b) => {
      if (a.weight === b.weight) {
        return a.name.localeCompare(b.name);
      }
      return a.weight - b.weight;
    });

    return this._modules;
  }


  async loader<T extends IModuleLoader<IModuleHandle, OPT>, OPT>(loaderClazz: Function, options?: OPT): Promise<T> {
    let instance = <T>Reflect.construct(loaderClazz, [this, options]);
    await instance.load(this.modules());
    return instance;
  }

  async createRequireLoader(options?: IRequireOptions): Promise<RequireLoader> {
    return this.loader<RequireLoader, IRequireOptions>(RequireLoader, options);
  }

  async createClassesLoader(options?: IClassesOptions): Promise<ClassesLoader> {
    return this.loader<ClassesLoader, IClassesOptions>(ClassesLoader, options);
  }

  async createSettingsLoader(options?: ISettingsOptions): Promise<SettingsLoader> {
    return this.loader<SettingsLoader, ISettingsOptions>(SettingsLoader, options);
  }
}
