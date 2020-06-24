import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {ModuleRegistry} from '../../src/registry/ModuleRegistry';
import {ClassesLoader} from '../../src/loader/classes/ClassesLoader';
import {IClassesOptions} from '../../src/loader/classes/IClassesOptions';


let registry: ModuleRegistry;

@suite('dependencies')
class DependenciesSpec {


  @test
  async 'load dependent modules'() {
    registry = new ModuleRegistry({
      paths: [
        './test/functional/fake_scenario/fake_app_dependencies/node_modules'
      ],
    });
    await registry.rebuild();
    const modules = registry.modules();
    expect(modules).to.have.length(3);
    expect(modules.map(x => x.name)).to.be.deep.eq(['module9', 'module8', 'module7']);

    let loader = await registry.loader<ClassesLoader, IClassesOptions>(ClassesLoader, {
      libs: [{
        topic: 'generic',
        refs: ['lib']
      }, {
        topic: 'commands',
        refs: ['commands']
      }]
    });
    let handles = loader.handles();
    expect(handles.map(x => x.module.name)).to.be.deep.eq(['module9', 'module8', 'module7']);
    expect(handles).to.have.length(3);

  }


}
