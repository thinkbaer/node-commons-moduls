import * as path from 'path';

export class Module {

    name:string;

    version:string;

    path:string;

    weight:number = 0;

    dependencies:any = {};

    child_modules:string[] = [];

    handle: Function;

    /**
     * if modul is declared outside a node_modules directory
     *
     * @type {boolean}
     */
    internal: boolean = false;

    uses_hooks:any[] = [];

    exposes_hooks:any[] = [];

    main: string;



    constructor() {
        this.name = null;
        this.version = null;
        this.path = null;
        this.weight = 0;
        this.dependencies = {};
        this.child_modules = [];
        this.uses_hooks = [];
        this.exposes_hooks = []
    }


    static fromOptions(options:any):Module {
        let m = new Module();
        m.name = options.name;
        m.version = options.version || null;
        m.path = options.path || null;
        m.main = options.main || null;
        m.internal = !/(\/|\\)node_modules(\/|\\)/.test(m.path);
        m.dependencies = options.dependencies || {};
        m.child_modules = options.child_modules || [];
        return m; //merge(m,options)
    }

    getMain():string {
        let chain = [this.path]
        if(this.main){
            chain.push(this.main.replace(/.\w+$/,''))
        }
        return path.join(...chain);
    }
}