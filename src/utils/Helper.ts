import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';


export interface INpmlsOptions {
  filter?: (packageJson: any) => boolean
  depth: number
  level?: number
}

export class Helper {

  static readFile(file:string):Promise<Buffer>{
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

    let filter = options.filter;
    options.level = inc + 1;

    let modules: any[] = [];

    let directories = await this.readdir(node_modules_dir);
    await Promise.all(_.map(directories, async (directory: string) => {

      let _path = path.join(node_modules_dir, directory);
      if (!fs.existsSync(_path + '/package.json')) {
        return;
      }

      let package_json = await this.getPackageJson(_path);
      let modul_exists = _.find(modules, {name: directory});

      if (modul_exists) return;

      package_json.path = _path;
      package_json.child_modules = [];

      if (filter) {
        if (!filter(package_json)) {
          return;
        }
      }
      modules.push(package_json);

      // FIXME detect the node_modules path
      let _new_node_module_dir = path.join(_path, 'node_modules');
      try {
        let stat = await this.stat(_new_node_module_dir);
        if (stat && stat.isDirectory()) {
          let _modules = await  this.npmls(_new_node_module_dir, options);
          package_json.has_node_modules = true;
          for (let _x of _modules) {
            package_json.child_modules.push(_x.name);
            let _modul_exists = modules.find(function (_m) {
              return _m.name == _x.name
            });
            if (!_modul_exists) {
              modules.push(_x)
            }
          }
        } else {
          package_json.has_node_modules = false
        }
      } catch (err) {
        package_json.has_node_modules = false
      }
    }));

    return modules;
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
