import * as _ from 'lodash';
import {IModuleLoader} from "../IModuleLoader";

import {Module} from "../../registry/Module";
import {ClassesHandle} from "./ClassesHandle";
import {IClassesOptions} from "./IClassesOptions";
import {ClassLoader, PlatformUtils} from "commons-base";


export class ClassesLoader extends IModuleLoader<ClassesHandle, IClassesOptions> {


  getClasses(topic: string): Function[] {
    let classes:Function[] = [];
    for(let handle of this.handles()){
      let cls = handle.getClasses(topic);
      if(!_.isEmpty(cls)){
        classes = classes.concat(cls);
      }
    }
    return classes;
  }


  getClassesByModule(topic: string): {[modul:string]:Function[]} {
    let classes:{[modul:string]:Function[]} = {};
    for(let handle of this.handles()){
      let modulClasses = handle.getClasses(topic);
      if(!_.isEmpty(modulClasses)){
        classes[handle.module.name] = modulClasses;
      }
    }
    return classes;
  }


  protected async loadOne(modul: Module): Promise<ClassesHandle> {
    let handle = new ClassesHandle(modul);

    for (let lib of this._options.libs) {
      let refs = []
      for (let _path of lib.refs) {
        let lib_path = PlatformUtils.join(modul.path, _path);
        if (PlatformUtils.fileExist(lib_path) && PlatformUtils.isDir(lib_path)) {
          refs.push(PlatformUtils.join(lib_path, '*'));
        } else if (PlatformUtils.fileExist(lib_path) && PlatformUtils.isFile(lib_path)) {
          refs.push(lib_path);
        } else if (PlatformUtils.fileExist(lib_path + '.js') && PlatformUtils.isFile(lib_path + '.js')) {
          refs.push(lib_path + '.js');
        } else if (PlatformUtils.fileExist(lib_path + '.ts') && PlatformUtils.isFile(lib_path + '.ts')) {
          // if ts-node is used on start
          refs.push(lib_path + '.ts');
        }
      }

      let classes = ClassLoader.importClassesFromAny(refs);

      if (!_.isEmpty(classes)) {
        handle.add(lib.topic, refs, classes);
      }
    }

    return handle
  }


}
