var validate = require("commonjs-utils/json-schema").validate,
	sys = require("sys");
validate({},{});
//d = require('debug.js');
//d.listen(8080);
sys.puts("We can access modules within the local package using top level ids, and from " +
		"here we can use a relative reference: " + (require("./sibling") == require("sibling")));

require.reloadable(function(){
	var foo = require("./sibling").foo;
	sys.puts("The latest value from sibling is " + foo);
	setInterval(function(){
		// wait around for a bit to see if sibling changes
	}, 1000);
});

sys.puts(require("promise"));
if(require.main == module){
	sys.puts("This indicates that we are the main/entry module");
}
