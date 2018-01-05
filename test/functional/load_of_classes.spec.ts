import {suite, test} from "mocha-typescript";
import {expect} from "chai";
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";
import {RequireLoader} from "../../src/loader/require/RequireLoader";
import {ClassesLoader} from "../../src/loader/classes/ClassesLoader";
import {IClassesOptions} from "../../src/loader/classes/IClassesOptions";


@suite('load of classes')
class Load_by_requireSpec {

  @test
  async 'use classes loader'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_02'
      ],
    });

    await registry.rebuild();
    expect(registry.modules()).to.have.length(2);


    let loader = await registry.loader<ClassesLoader, IClassesOptions>(ClassesLoader, {
      libs: [{
        topic: 'klass',
        paths: ['lib']
      }]
    });


  }

}
