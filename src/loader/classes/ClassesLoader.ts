import {IModuleLoader} from "../IModuleLoader";

import {Module} from "../../registry/Module";
import {ClassesHandle} from "./ClassesHandle";
import {IClassesOptions} from "./IClassesOptions";


export class ClassesLoader extends IModuleLoader<ClassesHandle,IClassesOptions> {


  protected async loadOne(modul: Module):Promise<ClassesHandle> {
    let handle = new ClassesHandle(modul);





    return handle
  }




}
