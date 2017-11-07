var assert = require("assert"),
    Modules = require('../../../src/lib/modules'),
    Config = require('../../../src/lib/config');


var HC = null;
describe('hc fake app1 tests', function () {


    before(function (done) {
        HC = new HippoCore({
            ROOT_DIR: __dirname,
        });

        done()
    });

    it('test module', function (done) {
        var HCT1 = require('./node_modules/hc_test1');
        assert.equal(true,HCT1.hasOwnProperty('onExtend'));
        var HCT2 = require('hc_test1');
        assert.equal(true,HCT2.hasOwnProperty('onExtend'));
        assert.equal(HCT1,HCT2);
        done()
    });

    it('find modules', function (done) {
        this.timeout(10000);
        var modules = new Modules({
            module_paths:[__dirname + '/node_modules']
        });

        modules.rebuild_registry()
            .then(function (modules) {
                console.log(modules);
                assert.equal(2, modules.length);
                done()
            })
            .catch(function (err) {
                done(err)

            })
    });

    it('init modules', function (done) {
        this.timeout(10000);
        HC.initialize()
            .then(function (results) {
                assert.equal(2, results.length);

                /*
                modules.forEach(function(modul){
                    assert.ok(modul.handle)
                })
                */
                done()
            })
            .catch(function (err) {
                done(err)
            })
    })

});
