import {suite, test} from "mocha-typescript";
import {expect} from "chai";
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";
import {RequireLoader} from "../../src/loader/require/RequireLoader";
import {ClassesLoader} from "../../src/loader/classes/ClassesLoader";
import {IClassesOptions} from "../../src/loader/classes/IClassesOptions";


let registry: ModuleRegistry;

@suite('load of classes')
class Load_by_requireSpec {

  static async before() {
    registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_02'
      ],
    });
    await registry.rebuild();

    expect(registry.modules()).to.have.length(2);
  }


  @test
  async 'use classes loader on path'() {
    let loader = await registry.loader<ClassesLoader, IClassesOptions>(ClassesLoader, {
      libs: [{
        topic: 'generic',
        refs: ['lib']
      }]
    });
    let handles = loader.handles();
    expect(handles).to.have.length(2);

    let classes = loader.getClasses('generic');
    expect(classes).to.have.length(2);
    expect(classes[0].prototype.constructor.name).to.eq('KlassM3');
    expect(classes[1].prototype.constructor.name).to.eq('KlassM4');
  }


  @test
  async 'use classes loader single file'() {
    let loader = await registry.loader<ClassesLoader, IClassesOptions>(ClassesLoader, {
      libs: [{
        topic: 'generic',
        refs: ['Activator']
      }]
    });

    let handles = loader.handles();
    expect(handles).to.have.length(2);

    let classes = loader.getClasses('generic');
    expect(classes).to.have.length(2);
    expect(classes[0].prototype.constructor.name).to.eq('Activator');
    expect(classes[1].prototype.constructor.name).to.eq('Activator');

    let classesByModule = loader.getClassesByModule('generic');
    expect(Object.keys(classesByModule)).to.deep.eq(['module3', 'module4']);
  }

}
