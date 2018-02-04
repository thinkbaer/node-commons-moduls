import * as path from 'path';
import {Helper} from "../utils/Helper";
import {ISubModule} from "./ISubModule";

export class Module {

  name: string;

  version: string;

  path: string;

  weight: number = 0;

  dependencies: any = {};

  child_modules: string[] = [];

  /**
   * if modul is declared outside a node_modules directory
   *
   * @type {boolean}
   */
  internal: boolean = false;

  main: string;

  sub_modules: { [subpath: string]: ISubModule } = {}


  constructor() {
    this.name = null;
    this.version = null;
    this.path = null;
    this.weight = 0;
    this.dependencies = {};
    this.child_modules = [];
    //  this.uses_hooks = [];
    //  this.exposes_hooks = []
  }


  packageJson(): Promise<any> {
    return Helper.getPackageJson(this.path)
  }

  static fromOptions(options: any): Module {
    let m = new Module();
    m.name = options.name;
    m.version = options.version || null;
    m.path = options.path || null;
    m.main = options.main || null;
    m.internal = !/(\/|\\)node_modules(\/|\\)/.test(m.path);
    m.dependencies = options.dependencies || {};
    m.child_modules = options.child_modules || [];
    m.sub_modules = options.sub_modules || {};
    return m; //merge(m,options)
  }

  getMain(): string {
    let chain = [this.path]
    if (this.main) {
      chain.push(this.main.replace(/.\w+$/, ''))
    }
    return path.join(...chain);
  }
}
