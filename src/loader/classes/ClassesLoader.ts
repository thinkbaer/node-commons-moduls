import * as _ from 'lodash';

import {IModuleLoader} from '../IModuleLoader';

import {Module} from '../../registry/Module';
import {ClassesHandle} from './ClassesHandle';
import {IClassesOptions} from './IClassesOptions';
import {ClassLoader, PlatformUtils} from 'commons-base';
import {Helper} from '../../utils/Helper';


const MODULE_NAME = '__MODULNAME__';

export class ClassesLoader extends IModuleLoader<ClassesHandle, IClassesOptions> {


  getClasses(topic: string): Function[] {
    let classes: Function[] = [];
    for (let handle of this.handles()) {
      let cls = handle.getClasses(topic);
      if (!_.isEmpty(cls)) {
        classes = classes.concat(cls);
      }
    }
    return classes;
  }

  getClassesWithFilter(topic: string, excludeFilter?: (className: string, modulName: string) => boolean): Function[] {
    let classes: Function[] = [];
    for (let handle of this.handles()) {
      let cls = handle.getClasses(topic);
      if (!_.isEmpty(cls)) {
        cls.forEach(c => {
          const className = ClassLoader.getClassName(c);
          if (excludeFilter && excludeFilter(className, handle.module.name)) {
            return;
          }
          classes.push(c);
        });
      }
    }
    return classes;
  }

  getClassesByModule(topic: string): { [modul: string]: Function[] } {
    let classes: { [modul: string]: Function[] } = {};
    for (let handle of this.handles()) {
      let modulClasses = handle.getClasses(topic);
      if (!_.isEmpty(modulClasses)) {
        classes[handle.module.name] = modulClasses;
      }
    }
    return classes;
  }


  protected async loadOne(modul: Module): Promise<ClassesHandle> {
    let handle = new ClassesHandle(modul);
    let promises = [];
    for (let lib of this._options.libs) {
      let refs = [];
      for (let _path of lib.refs) {
        let lib_path = PlatformUtils.join(modul.path, _path);
        let res = await Helper.glob(lib_path);

        if (!_.isEmpty(res)) {
          for (let r of res) {
            if (PlatformUtils.fileExist(r) && PlatformUtils.isDir(r)) {
              refs.push(PlatformUtils.join(r, '*'));
            } else if (PlatformUtils.fileExist(r) && PlatformUtils.isFile(r)) {
              refs.push(r);
            }
          }
        } else if (PlatformUtils.fileExist(lib_path + '.js') && PlatformUtils.isFile(lib_path + '.js')) {
          refs.push(lib_path + '.js');
        } else if (PlatformUtils.fileExist(lib_path + '.ts') && PlatformUtils.isFile(lib_path + '.ts')) {
          // if ts-node is used on start
          refs.push(lib_path + '.ts');
        }
      }

      if (!_.isEmpty(refs)) {
        promises.push(this.loadClasses(handle, refs, modul.name, lib.topic));
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
    return handle.hasAnyClasses() ? handle : null;
  }


  private async loadClasses(handle: ClassesHandle, refs: string[], modulName: string, topic: string) {
    let classes = await ClassLoader.importClassesFromAnyAsync(refs);
    if (!_.isEmpty(classes)) {
      if (Reflect && Reflect['getOwnMetadata']) {
        classes.forEach(cls => {
          Reflect['defineMetadata'](MODULE_NAME, modulName, cls);
        });
      } else {
        classes.forEach(cls => {
          cls[MODULE_NAME] = modulName;
        });
      }
      handle.add(topic, refs, classes);
    }
  }


  static getSource(cls: Function) {
    return ClassLoader.getSource(cls);
  }


  static getModulName(cls: Function) {
    if (Reflect && Reflect['getOwnMetadata']) {
      return Reflect['getOwnMetadata'](MODULE_NAME, cls);
    } else {
      return cls[MODULE_NAME] ? cls[MODULE_NAME] : null;
    }
  }


}
