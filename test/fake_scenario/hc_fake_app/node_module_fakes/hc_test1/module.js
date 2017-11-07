/**
 * Created by cezaryrk on 18.06.16.
 */

exports = module.exports = {

    onExtend : function(HippoCore){
        console.log('Extending HippoCore');
        HippoCore.$hcTest1 = true
    },

    onBoot : function(HC){

    },

    onRoutes : function(){

    }


};
