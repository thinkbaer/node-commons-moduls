/**
 *
 * @see https://github.com/typeorm/typeorm/blob/master/src/util/DirectoryExportedClassesLoader.ts
 *
 */

import * as _ from 'lodash'
import {PlatformTools} from "./PlatformTools";
import {StringOrFunction} from "../types";

/**
 * Loads all exported classes from the given directory.
 */
export class ClassLoader {

    static importClassesFromAny(o: StringOrFunction[]):Function[] {

        let klasses: Function[] = [];

        o.forEach(x => {
            if (_.isString(x)) {
                let _x = PlatformTools.pathNormilize(PlatformTools.pathResolve(x));
                    let exported = ClassLoader.importClassesFromDirectories([_x]);
                    klasses = klasses.concat.apply(klasses,exported)
            } else if (x instanceof Function) {
                klasses.push(x)
            } else {
                throw new Error('TODO: unknown '+x)
            }
        });
        return klasses
    }

    private static loadFileClasses(exported: any, allLoaded: Function[]) {
        if (exported instanceof Function) {
            allLoaded.push(exported);

        } else if (exported instanceof Object) {
            Object.keys(exported).forEach(key => this.loadFileClasses(exported[key], allLoaded));

        } else if (exported instanceof Array) {
            exported.forEach((i: any) => this.loadFileClasses(i, allLoaded));
        }

        return allLoaded;
    }

    static importClassesFromDirectories(directories: string[], formats = [".js", ".ts"]): Function[] {

        const allFiles = directories.reduce((allDirs, dir) => {
            let x = PlatformTools.pathNormilize(dir);
            let y = PlatformTools.load("glob").sync(x);
            return allDirs.concat(y);
        }, [] as string[]);

        const dirs = allFiles
            .filter(file => {
                const dtsExtension = file.substring(file.length - 5, file.length);
                return formats.indexOf(PlatformTools.pathExtname(file)) !== -1 && dtsExtension !== ".d.ts";
            })
            .map(file => PlatformTools.load(PlatformTools.pathResolve(file)));

        return this.loadFileClasses(dirs, []);
    }


    /**
     * Loads all json files from the given directory.
     */
    static importJsonsFromDirectories(directories: string[], format = ".json"): any[] {

        const allFiles = directories.reduce((allDirs, dir) => {
            return allDirs.concat(PlatformTools.load("glob").sync(PlatformTools.pathNormilize(dir)));
        }, [] as string[]);

        return allFiles
            .filter(file => PlatformTools.pathExtname(file) === format)
            .map(file => PlatformTools.load(PlatformTools.pathResolve(file)));
    }
}
