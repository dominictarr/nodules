
nodules = require("../lib/nodules")
sys = require("sys")
when = require("../lib/nodules-utils/promise").when
exports['test load from web'] = function (assert) {
	nodules.ensure("http://github.com/kriszyp/nodules/raw/master/lib/nodules-utils/fs-promise.js", function(require){
        var validate = require("./fs-promise");
        sys.puts("loaded fs-promise: "+ validate);

			
        //these don't make sense to me.
        sys.puts("cachePath(): "+ nodules.getCachePath(""));
        //downloaded-modules/.fs
        sys.puts("cachePath(): "+ nodules.getCachePath("./fs-promise"));
        //downloaded-modules/./fs-promise.fs
        
        assert.ok (validate);
	});
}

//nodules.load source given a uri but doesn't compile it.

exports['test load(file:)'] = function (assert) {
	sys.puts(__dirname);
	var sibling_uri = 'file:./example/lib/sibling.js'
		, sibling_source = nodules.load(sibling_uri,nodules)
		, m = sibling_source.match(/^exports.foo = (.+?)\;?$/);

	assert.ok(m,"was expecting " + sibling_source + "to match: /^exports.foo = (.+?)\;?$/");
	sys.puts(sibling_source);
	sys.puts(m[1]);
}
exports['test load(http:)'] = function (assert) {
	sys.puts(__dirname);
	
	
	var uri = 'http://gist.github.com/raw/625989/b8e0801c00fc4240f640543cf6ec396db2b4b94f/hello_from_nodule.js'
		//, source = ;
	,source = nodules.load(uri,nodules)

	when(nodules.load(uri,nodules),function(source){
		assert.equal(source,"exports.hello = function(){return 'HI');");
		sys.puts(source);
	});
}

