import {suite, test} from "mocha-typescript";
import {expect} from "chai";

import * as _ from 'lodash'
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";


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
    expect(modules).to.have.length(2);
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
    expect(modules).to.have.length(3);
  }

  @test
  async 'find modules in multiple node_modules directories with filter'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules',
        './test/functional/fake_scenario/fake_app_01/own_modules',
      ],
      module: module,
      packageFilter:(packageJson) => {return _.has(packageJson,'core_module') && packageJson.core_module}
    });

    await registry.rebuild();
    let modules = registry.modules();
    expect(modules).to.have.length(1);
    expect(modules[0].name).to.eq('module2');
    expect((await modules[0].packageJson()).core_module).to.be.true;

    registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules',
        './test/functional/fake_scenario/fake_app_01/own_modules',
      ],
      module: module,
      packageFilter:(packageJson) => {return _.has(packageJson,'own_module') && packageJson.own_module}
    });

    await registry.rebuild();
    modules = registry.modules();
    expect(modules).to.have.length(1);
    expect(modules[0].name).to.eq('module3');
    expect((await modules[0].packageJson()).own_module).to.be.true;

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

}
