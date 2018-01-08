import {suite, test} from "mocha-typescript";
import {expect} from "chai";
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";
import {RequireLoader} from "../../src/loader/require/RequireLoader";
import {ClassesLoader} from "../../src/loader/classes/ClassesLoader";
import {IClassesOptions} from "../../src/loader/classes/IClassesOptions";
import {SettingsLoader} from "../../src/loader/settings/SettingsLoader";
import {ISettingsOptions} from "../../src/loader/settings/ISettingsOptions";


let registry: ModuleRegistry;

@suite('load of settings')
class Load_of_settingsSpec {

  static async before() {
    registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_03/node_modules'
      ],
    });
    await registry.rebuild();

    expect(registry.modules()).to.have.length(2);
  }


  @test
  async 'use settings loader on settings declared in package.json '() {
    let loader = await registry.loader<SettingsLoader, ISettingsOptions>(SettingsLoader, {
      ref: 'package.json',
      path: 'settings'
    });

    let handles = loader.handles();
    expect(handles).to.have.length(2);
    let settings = loader.getSettings();
    expect(settings).to.deep.eq({module5: {value: '5'}, module6: {value: '6'}});

  }

  @test
  async 'use settings loader on eplicit settings file'() {
    let loader = await registry.loader<SettingsLoader, ISettingsOptions>(SettingsLoader, {
      ref: 'modul.json'
    });

    let handles = loader.handles();
    expect(handles).to.have.length(2);
    let settings = loader.getSettings();
    expect(settings).to.deep.eq({
      module5: {module_name: 'module5'},
      module6: {module_name: 'module6'}
    });

  }
}
