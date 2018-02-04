import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import {PlatformUtils} from "commons-base";
import {INpmlsOptions} from "./INpmlsOptions";
import {ISubModule} from "../registry/ISubModule";


export class Helper {

  static readFile(file: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (fs.existsSync(file)) {
        fs.readFile(file, (err, buf) => {
          if (err) {
            reject(err);
          } else {
            try {
              resolve(buf);
            } catch (err) {
              reject(err);
            }
          }
        })
      } else {
        reject(new Error('cant find file ' + file))
      }
    })

  }

  static getPackageJson(_path: string): Promise<any> {
    if (!/package\.json$/.test(_path)) {
      _path = path.join(_path, 'package.json')
    }
    return this.readFile(_path).then(buf => {
      let data = buf.toString('utf8');
      let json = JSON.parse(data);
      return json;
    });
  }

  static ucfirst(word: string): string {
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
  }

  static async readdir(dir: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(dir, (err: NodeJS.ErrnoException, files: string[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(files);
        }
      })
    });
  }

  static async stat(dir: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(dir, (err: NodeJS.ErrnoException, stats: fs.Stats) => {
        if (err) {
          reject(err)
        } else {
          resolve(stats);
        }
      })
    });
  }


  static async npmls(node_modules_dir: string, options: INpmlsOptions = {depth: 1, level: 0}): Promise<any[]> {
    let depth = options.depth;
    let inc = options.level;

    if (inc >= depth) {
      return []
    }

    options.level = inc + 1;

    let modules: any[] = [];
    let directories = await this.readdir(node_modules_dir);
    await Promise.all(_.map(directories, async (directory: string) => {
      if (/^@/.test(directory)) {
        // is grouped
        let _grouped_node_modules_dir = PlatformUtils.join(node_modules_dir, directory);
        let _directories = await this.readdir(_grouped_node_modules_dir);

        return Promise.all(_.map(_directories, async (_directory: string) => {
          _directory = PlatformUtils.join(directory, _directory);
          return Helper.lookupNpmInDirectory(node_modules_dir, _directory, modules, options)
        }));
      } else {
        return Helper.lookupNpmInDirectory(node_modules_dir, directory, modules, options)
      }

    }));
    return modules;
  }


  static async lookupNpmInDirectory(node_modules_dir: string, directory: string, modules: any[] = [], options?: INpmlsOptions): Promise<any> {
    let _path = path.join(node_modules_dir, directory);
    if (!fs.existsSync(_path + '/package.json')) {
      return;
    }

    let package_json = await this.getPackageJson(_path);
    let modul_exists = _.find(modules, {name: directory});

    if (modul_exists) return;

    package_json.path = PlatformUtils.pathResolve(_path);
    package_json.child_modules = [];
    package_json.sub_modules = {};

    if (options && options.filter) {
      if (!options.filter(package_json)) {
        return;
      }
    }
    modules.push(package_json);

    if (options.subModulePaths) {
      // look in subpath like "node_modules"
      let results = await Promise.all(_.map(options.subModulePaths, subpath => {
        return this.look(_path, subpath, modules, options)
      }))

      for (let res of results) {
        if (res.subpath === 'node_modules') {
          package_json.has_node_modules = res.has_modules;
          package_json.child_modules = res.child_modules;
        } else {
          package_json.sub_modules[res.subpath] = <ISubModule>{
            has_modules: res.has_modules,
            modules: res.child_modules
          };
        }
      }


    }


    return modules;
  }

  static async look(_path: string, subpath: string, modules: any[] = [], options?: INpmlsOptions) {
    // FIXME detect the node_modules path
    let _new_node_module_dir = path.join(_path, subpath);
    let info: { subpath: string, has_modules: boolean, child_modules: string[] } = {
      subpath: subpath,
      has_modules: false,
      child_modules: []
    }
    if (PlatformUtils.fileExist(_new_node_module_dir)) {
      try {
        let stat = await this.stat(_new_node_module_dir);
        if (stat && stat.isDirectory()) {
          let _modules = await  this.npmls(_new_node_module_dir, options);
          info.has_modules = true;
          for (let _x of _modules) {
            info.child_modules.push(_x.name);
            let _modul_exists = modules.find(function (_m) {
              return _m.name == _x.name
            });
            if (!_modul_exists) {
              modules.push(_x)
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    return info;
  }

  static checkPaths(paths: string[]) {
    let ret_paths = []
    for (let _path of paths) {
      _path = path.resolve(_path);
      let _try_path = path.join(_path, 'node_modules');
      let _try_package = path.join(_path, 'package.json');
      if (fs.existsSync(_path)) {
        if (fs.existsSync(_try_package) && fs.existsSync(_try_path)) {
          _path = _try_path;
        }
      } else {
        throw new Error('checking path ' + _path + ' doesn\'t exists');
      }
      ret_paths.push(_path)
    }
    return ret_paths;
  }

}
