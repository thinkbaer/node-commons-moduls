import * as _ from 'lodash';
import {IModuleLoader} from "../IModuleLoader";

import {Module} from "../../registry/Module";
import {SettingsHandle} from "./SettingsHandle";
import {ISettingsOptions} from "./ISettingsOptions";
import {PlatformTools} from "../../utils/PlatformTools";
import {Helper} from "../../utils/Helper";


export class SettingsLoader extends IModuleLoader<SettingsHandle, ISettingsOptions> {


  getSettings(){
    let settings = {};
    for(let x of this.handles()){
      settings[x.module.name] = x.settings;
    }
    return settings;
  }

  protected async loadOne(modul: Module): Promise<SettingsHandle> {
    let handle = null;
    let filepath = PlatformTools.join(modul.path, this._options.ref);
    let ext = PlatformTools.pathExtname(filepath, false);

    if(PlatformTools.fileExist(filepath)){
      handle = new SettingsHandle(modul);
      let file = await Helper.readFile(filepath);
      let settings = {}

      switch(ext){
        case 'json':
          settings = JSON.parse(file.toString('utf8'));
          break;
        default:
          throw new Error('Cannot load settings from '+ext);
      }

      if(this._options.path){
        settings = _.get(settings,this._options.path);
      }

      handle.settings = settings;
    }

    return handle
  }


}
