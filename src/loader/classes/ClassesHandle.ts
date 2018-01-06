import {IModuleHandle} from "../IModuleHandle";


export class ClassesHandle extends IModuleHandle {

  classes: {[key:string]:Function[]} = {};

  refs: {[key:string]:string[]} = {};


  getClasses(topic:string):Function[]{
    return this.classes[topic];
  }


  add(topic:string, refs:string[], classes:Function[]){
    this.classes[topic] = classes;
    this.refs[topic] = refs;
  }


}
