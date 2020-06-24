import {suite, test} from "mocha-typescript";
import {expect} from "chai";
import {ModuleRegistry} from "../../src/registry/ModuleRegistry";
import {RequireLoader} from "../../src/loader/require/RequireLoader";
import {IRequireOptions, ModuleDescriptor} from "../../src";


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
    expect(registry.modules()).to.have.length(3);

    let loader = await registry.loader<RequireLoader,{}>(RequireLoader);
    let obj = {}
    let ret = await loader.invokeHook('boot',obj);

    expect(obj).to.deep.eq({ modul1: true, modul2: true , modul4:true});
    expect(ret).to.deep.eq([ 'module1', 'module4' ,'module2']);

  }


  @test
  async 'filter internal module by options '() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/node_modules'
      ],
    });

    await registry.rebuild();
    expect(registry.modules()).to.have.length(3);

    let loader = await registry.loader<RequireLoader,IRequireOptions>(RequireLoader,{
      filter:(m:ModuleDescriptor) => {
        return m.name === 'module1'
      }
    });

    expect(loader.handles()).to.have.length(1);

    let obj = {}
    let ret = await loader.invokeHook('boot',obj);

    expect(obj).to.deep.eq({ modul1: true });
    expect(ret).to.deep.eq([ 'module1']);

  }

  @test
  async 'filter external module by options '() {

    let registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_01/own_modules'
      ],
    });

    await registry.rebuild();
    expect(registry.modules()).to.have.length(2);


    let loader = await registry.loader<RequireLoader,IRequireOptions>(RequireLoader,{
      filter:(m:ModuleDescriptor) => {
        return m.name === 'module3'
      }
    });

    expect(loader.handles()).to.have.length(1);

    let obj = {}
    let ret = await loader.invokeHook('boot',obj);

    expect(obj).to.deep.eq({ modul3: true });
    expect(ret).to.deep.eq([ 'module3']);

  }
}
