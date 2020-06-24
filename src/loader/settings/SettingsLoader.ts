import * as _ from 'lodash';
import {AbstractModuleLoader} from "../AbstractModuleLoader";

import {Module} from "../../registry/Module";
import {SettingsHandle} from "./SettingsHandle";
import {ISettingsOptions} from "./ISettingsOptions";

import {Helper} from "../../utils/Helper";
import {PlatformUtils} from "commons-base";


export class SettingsLoader extends AbstractModuleLoader<SettingsHandle, ISettingsOptions> {


  getSettings(){
    let settings = {};
    for(let x of this.handles()){
      settings[x.module.name] = x.settings;
    }
    return settings;
  }

  protected async loadOne(modul: Module): Promise<SettingsHandle> {
    let handle = null;
    let filepath = PlatformUtils.join(modul.path, this._options.ref);
    let ext = PlatformUtils.pathExtname(filepath, false);

    if(PlatformUtils.fileExist(filepath)){
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
