import * as path from 'path';
import * as _ from 'lodash';
import {Module} from "./Module";
import {Helper, INpmlsOptions} from "./Helper";


export interface IModuleOptions {

    packageFilter?: (packageJson: any) => boolean;

    paths: string[]

    depth?: number

    module: NodeModule
}


export class ModuleRegistry {

    options: any;

    registry: Module[] = [];

    paths: string[] = [];


    constructor(options: IModuleOptions) {
        this.registry = [];
        this.options = options;
        this.paths = options.paths || [];
        this.options.depth = this.options.depth || 2
    }


    async rebuild_registry() {
        this.registry = [];


        let modules_lists = await Promise.all(
            _.map(this.paths, this._scan_module_path.bind(this))
        );

        let one_list = [].concat(...modules_lists);
        for (let __modul of one_list) {

            let _modul = _.find(one_list, function (_x) {
                return _x.name == __modul.name
            });

            if (!_modul) {
                one_list.push(__modul)
            } else {
                _modul.multi_implements = true
                // TODO: if module already exists check version and replace them
            }

        }

        let modules = this._build_registry(one_list);
        await Promise.all(_.map(modules, this.load.bind(this)));
        return modules;
    }

    async _scan_module_path(node_modules_dir: string): Promise<Module[]> {
        let options: INpmlsOptions = {
            filter: this.options.packageFilter,
            depth: this.options.depth
        };

        let packageJsons = await
            Helper.npmls(node_modules_dir, options);
        return _.map(packageJsons, (module: any) => {
            return Module.fromOptions(module)
        })
    }

    _build_registry(modules: Module[]) {
        this.registry = modules;

        for (let _modul of this.registry) {
            let dependencies = Object.keys(_modul.dependencies);
            let children = _.filter(this.registry, function (_x) {
                return dependencies.indexOf(_x.name) > -1
            });

            children.forEach(function (_dep_modul) {
                _modul.child_modules.push(_dep_modul.name)
            });
            _modul.child_modules = _.uniq(_modul.child_modules);
        }

        this.registry.sort((a: Module, b: Module) => {
            return a.child_modules.length - b.child_modules.length;
        });

        for (let first of this.registry) {

            let dependents = _.filter(this.registry, function (other) {
                if (other.name == first.name) return false;

                if (other.child_modules.indexOf(first.name) > -1) {
                    return true
                }
                return false
            });

            if (dependents.length) {
                dependents.forEach(function (x) {
                    x.weight += (first.weight + 1)
                })
            } else {
                // ???
            }
        }

        this.registry.sort((a, b) => {
            return a.weight - b.weight
        });

        return this.registry
    }


    load(modul: Module) {
        let split = modul.path.split(path.sep);
        split.pop();

        // necassary to extend the search directories of require
        let new_node_modules_dir = split.join(path.sep);
        if (this.options.module['paths'].indexOf(new_node_modules_dir) == -1) {
            this.options.module['paths'].unshift(new_node_modules_dir)
        }

        // TODO to analyse or integrate modul content/additions it should be given more options then "require",
        // for example a declarative version with file config like "module.json"
        // let handle = modul.internal ? require(modul.getMain()) : require(modul.name);
        // let handle = modul.internal ? require(modul.path) : require(modul.name);
        let handle = this.options.module.require(modul.name);
        modul.handle = handle;

        if (handle.exposesHooks) {
            modul.exposes_hooks = handle.exposesHooks
        }

        Object.getOwnPropertyNames(handle).forEach(function (val, idx, array) {
            if (handle[val] && _.isFunction(handle[val]) && val != 'exposesHooks' && val.match(/^on[A-Z]/)) {
                let _val = val.replace('on', '');
                _val = _val[0].toLowerCase() + _val.substring(1);
                modul.uses_hooks.push(_val)
            }
        });

        return modul
    }


    async invokeHook() {
        let args = Array.prototype.slice.call(arguments);
        let hook = args.shift();
        let options: any = {concurrency: Infinity};

        if (_.isObject(hook)) {
            options = hook;
            hook = options.hook
        }

        let modules = _.filter(this.registry, function (_x) {
            return _x.uses_hooks.indexOf(hook) > -1
        });

        return await Promise.all(_.map(modules, (modul) => {
            let _args = [modul, hook];
            _args = _args.concat(args);
            return ModuleRegistry.handleCall.apply(null, _args)
        }));
    }


    static async handleCall(): Promise<any> {
        let args = Array.prototype.slice.call(arguments);
        let modul = args.shift();
        let hook = args.shift();
        let hookCall = 'on' + Helper.ucfirst(hook);

        /*
        if (!hook.match('^on')) {
            hookCall = 'on' + ucfirst(hook)
        }
        */

        if (modul.uses_hooks.indexOf(hook) > -1) {
            return new Promise(function (res, rej) {
                if (modul.handle[hookCall].length == args.length) {

                    let result, err;
                    try {
                        result = modul.handle[hookCall].apply(modul.handle, args)
                    } catch (_err) {
                        err = _err;
                        rej(err)
                    }
                    if (!err) {
                        res(result)
                    }
                } else if (modul.handle[hookCall].length == (args.length + 1)) {
                    args.push(function (err: Error, result: any) {
                        if (err) {
                            rej(err)
                        } else {
                            res(result)
                        }
                    });
                    modul.handle[hookCall].apply(modul.handle, args)
                } else {
                    rej(new Error('wrong defined function ' + hook + ' ' + hookCall + ' ' + modul.name))
                }
            })
        } else {
            return null
        }

    }
}
