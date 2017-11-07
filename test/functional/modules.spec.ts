import {suite, test,timeout} from "mocha-typescript";
import {assert, expect} from "chai";
import * as fs from 'fs'
import * as _ from 'lodash'
import {ModuleRegistry} from "../../src/ModuleRegistry";

describe('', () => {});

@suite('modul ')
class ModulesSpec {

    @test.only @timeout(10000)
    async 'find modules'() {

        let registry = new ModuleRegistry({
            paths:[
                __dirname + '/fake_scenario/hc_fake_app/node_module_fakes'
            ],
            module:module
        });

        let modules = await registry.rebuild_registry();

        expect(modules).to.have.length(2);
        expect(_.find(modules,{name:'hc_test1'})).to.not.be.null;
    }

}

/*
describe('module registry tests', function () {

    before(function (done) {
        done()
    });


    it('find modules with inner node_modules', function (done) {
        this.timeout(10000);

        var modules = new Modules({
            module_paths:[
                __dirname + '/fake_scenario/modules_fake_app2/node_modules'
            ]
        });

        modules.rebuild_registry()
            .then(function (modules) {
                console.log(modules);
                assert.equal(5, modules.length);
                done()
            })
            .catch(function (err) {
                done(err)

            })
    });

    it('find modules in to directories', function (done) {
        this.timeout(10000);

        var modules = new Modules({
            module_paths:[
                __dirname + '/fake_scenario/modules_fake_app/node_modules',
                __dirname + '/fake_scenario/modules_fake_app2/node_modules'
            ]
        });

        modules.rebuild_registry()
            .then(function (modules) {
                console.log(modules);
                assert.equal(5, modules.length);
                done()
            })
            .catch(function (err) {
                done(err)

            })
    })

});

*/