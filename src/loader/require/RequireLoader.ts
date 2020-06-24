import * as path from "path";
import * as _ from "lodash";

import {RequireHandle} from "./RequireHandle";
import {AbstractModuleLoader} from "../AbstractModuleLoader";


import {ModuleDescriptor} from "../../registry/ModuleDescriptor";
import {Helper} from "../../utils/Helper";
import {IRequireOptions} from "./IRequireOptions";




export class RequireLoader extends AbstractModuleLoader<RequireHandle,IRequireOptions> {


  protected async loadOne(modul: ModuleDescriptor):Promise<RequireHandle> {
    let handle = new RequireHandle(modul);

    // necassary to extend the search directories of require
    let _module = this.registry.options().module;
    let new_node_modules_dir = path.dirname(modul.path);//split.join(path.sep);

    if (_module['paths'].indexOf(new_node_modules_dir) == -1) {
      _module['paths'].unshift(new_node_modules_dir)
    }

    if(modul.internal){
      handle.ref = _module.require(modul.name);
    }else{
      handle.ref = _module.require(modul.getMain());
    }

    if (handle.ref.exposesHooks) {
      handle.exposesHooks = handle.ref.exposesHooks
    }

    Object.getOwnPropertyNames(handle.ref).forEach(function (val, idx, array) {
      if (handle.ref[val] && _.isFunction(handle.ref[val]) && val != 'exposesHooks' && val.match(/^on[A-Z]/)) {
        let _val = val.replace('on', '');
        _val = _val[0].toLowerCase() + _val.substring(1);
        handle.usesHooks.push(_val)
      }
    });

    return handle
  }


  async invokeHook(hook:string, ...args:any[]) {
    let options: any = {concurrency: Infinity};

    if (_.isObject(hook)) {
      options = hook;
      hook = options.hook
    }

    let handles = _.filter(this._handles, function (_x) {
      return _x.usesHooks.indexOf(hook) > -1
    });

    return await Promise.all(_.map(handles, (handle) => {
      let _args = [handle, hook];
      _args = _args.concat(args);
      return RequireLoader.handleCall.apply(null, _args)
    }));
  }


  static async handleCall(handle:RequireHandle, hook:string, ...args:any[]): Promise<any> {
    let hookCall = 'on' + Helper.ucfirst(hook);

    if (handle.usesHooks.indexOf(hook) > -1) {
      return new Promise(function (res, rej) {
        if (handle.ref[hookCall].length == args.length) {

          let result, err;
          try {
            result = handle.ref[hookCall].apply(handle.ref, args)
          } catch (_err) {
            err = _err;
            rej(err)
          }
          if (!err) {
            res(result)
          }
        } else if (handle.ref[hookCall].length == (args.length + 1)) {
          args.push(function (err: Error, result: any) {
            if (err) {
              rej(err)
            } else {
              res(result)
            }
          });
          handle.ref[hookCall].apply(handle.ref, args)
        } else {
          rej(new Error('wrong defined function ' + hook + ' ' + hookCall + ' ' + handle.module.name))
        }
      })
    } else {
      return null
    }

  }




}
