import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';

import * as _ from 'lodash';
import {ModuleRegistry} from '../../src/registry/ModuleRegistry';
import {ICache} from '../../src/registry/ICache';
import {inspect} from 'util';


@suite('modul registry')
class ModulesSpec {

  @test
  async 'find modules in node_modules directory of application path'() {

    let registry = new ModuleRegistry({
      paths: [
        __dirname + '/fake_scenario/fake_app_01/node_modules'
      ],
      module: module
    });

    await registry.rebuild();
    let modules = registry.modules();
    expect(modules).to.have.length(3);
  }

  @test
  async 'find modules in multiple node_modules directories'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules',
        './test/functional/fake_scenario/fake_app_01/own_modules',
      ],
      module: module
    });

    await registry.rebuild();
    let modules = registry.modules();

    let modulNames = _.map(modules, m => m.name);
    expect(modulNames).to.deep.eq([
      'module1',
      '@group/module4',
      '@ownGroup/module4',
      'module2',
      'module3'
    ]);
    expect(modules).to.have.length(5);
  }

  @test
  async 'find modules in multiple node_modules directories with filter'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules',
        './test/functional/fake_scenario/fake_app_01/own_modules',
      ],
      module: module,
      packageFilter: (packageJson) => {
        return _.has(packageJson, 'core_module') && packageJson.core_module;
      }
    });

    await registry.rebuild();
    let modules = registry.modules();
    let modulNames = _.map(modules, m => m.name);
    expect(modules).to.have.length(2);
    expect(modulNames).to.deep.eq(['@group/module4', 'module2']);
    expect((await modules[0].packageJson()).core_module).to.be.true;

    registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules',
        './test/functional/fake_scenario/fake_app_01/own_modules',
      ],
      module: module,
      packageFilter: (packageJson) => {
        return _.has(packageJson, 'own_module') && packageJson.own_module;
      }
    });

    await registry.rebuild();
    modules = registry.modules();
    modulNames = _.map(modules, m => m.name);
    expect(modules).to.have.length(2);
    expect(modulNames).to.deep.eq(['@ownGroup/module4', 'module3']);
    expect((await modules[0].packageJson()).own_module).to.be.true;
  }

  @test
  async 'find modules in directories declared by pattern'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01'
      ],
      pattern: ['own_modules'],
      module: module
    });

    await registry.rebuild();
    let modules = registry.modules();
    let modulNames = _.map(modules, m => m.name);
    expect(modules).to.have.length(7);
    expect(modulNames).to.deep.eq([
      'module1',
      'own_module7',
      '@group/module4',
      '@ownGroup/module4',
      'module2',
      'module3',
      'fake_app_01'
    ]);


  }


  @test
  async 'find direct module'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules/module1',
      ],
      module: module
    });

    await registry.rebuild();
    let modules = registry.modules();
    expect(modules).to.have.length(1);
    expect(modules[0].name).to.eq('module1');

  }

  @test
  async 'ignore duplicate modules'() {
    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_04/node_modules',
      ],
      depth: 3,
      module: module
    });

    await registry.rebuild();
    let modules = registry.modules();
    expect(modules).to.have.length(2);
    expect(modules[0].name).to.eq('module6');
    expect(modules[1].name).to.eq('module5');

  }


  @test
  async 'use cache for performance'() {
    class CacheImpl implements ICache {


      data: any = {};

      clear(): void {
      }

      get(key: string): any {
        if (this.data[key]) {
          return this.data[key];
        }
        return null;
      }

      set(key: string, value: any): void {
        this.data[key] = value;
      }

    }

    const cacheDemo = new CacheImpl();

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01'
      ],
      depth: 10,
      module: module,
      cache: cacheDemo
    });

    const start = Date.now();
    await registry.rebuild();
    const duration = Date.now() - start;
    let modules = registry.modules();

    const start2 = Date.now();
    await registry.rebuild();
    const duration2 = Date.now() - start2;
    let modules2 = registry.modules();

    const cacheKeys = _.keys(cacheDemo.data);
    expect(cacheKeys).to.have.length(1);
    expect(cacheDemo.data[cacheKeys.shift()]).to.have.length(4);
    // expect(duration).to.be.greaterThan(duration2);
    expect(modules).to.be.deep.eq(modules2);

  }
}
