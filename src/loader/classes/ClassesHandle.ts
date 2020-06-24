import {AbstractModuleHandle} from "../AbstractModuleHandle";


export class ClassesHandle extends AbstractModuleHandle {

  size: number = 0;

  classes: {[key:string]:Function[]} = {};

  refs: {[key:string]:string[]} = {};


  getClasses(topic:string):Function[]{
    return this.classes[topic];
  }


  add(topic:string, refs:string[], classes:Function[]){
    this.classes[topic] = classes;
    this.refs[topic] = refs;
    this.size += classes.length;
  }

  hasAnyClasses(){
    return this.size;
  }


}
