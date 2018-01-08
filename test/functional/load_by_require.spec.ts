import {suite, test} from "mocha-typescript";
import {expect} from "chai";
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";
import {RequireLoader} from "../../src/loader/require/RequireLoader";


@suite('load by require')
class Load_by_requireSpec {

  @test
  async 'use registry loader and execute hook'() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules'
      ],
    });

    await registry.rebuild();
    expect(registry.modules()).to.have.length(2);


    let loader = await registry.loader<RequireLoader,{}>(RequireLoader);
    let obj = {}
    let ret = await loader.invokeHook('boot',obj);

    expect(obj).to.deep.eq({ modul1: true, modul2: true });
    expect(ret).to.deep.eq([ 'module1', 'module2' ]);

  }

}
