/*
	idea: method that is called when test does not finish.
	idea2: what if you parsed the stack trace to find out which test an async error came from?
*/

var promise = require('../lib/nodules-utils/promise')
	,sys = require('sys');

function has_interface (test,func_array,obj){
	func_array.forEach(function(e){
		//sys.puts("check: " +  e);
		test.equal('function', typeof obj[e],"expected method " + e);
	});
}

exports['test Promise interface'] = function (test){
	p = new promise.Promise();

	has_interface(test,['then','get','put','call','addCallback','addErrback','addBoth','addCallbacks','wait','resolve','progress','reject'],p);
	test.finish();
	
}
//same functionality for Deferred, except it has cancel
exports['test Promise.reject callback'] = function (test){
	var err = new Error('test cancel')
		,p = new promise.Promise()
		,errorCallback = function (error){
			test.equal(error,err);
			test.finish();
		}
		//on cancel() the error is passed to the second argument to then()
		p.then(null,errorCallback);
		p.reject(err);
}

exports['test Promise.reject catch error'] = function (test){
	//note, if you do now pass a canceller function to the constructor there will be no cancel method.
	var err = new Error('test cancel')
		,p = new promise.Promise(function (){return err})
		,errorCallback = function (error){
			test.equal(error,err);
			test.finish();
		}
		test.uncaughtExceptionHandler = errorCallback
		
		//on cancel() the error is passed to the second argument to then(),
		//if there isn't one the error is thrown.
		p.reject(err);
}

exports['test Promise.resolve'] = function(test){
	var p = new promise.Promise()
		,val = "12345";
		p.then(function(value){
			test.equal(val,value);
			test.finish();
		});
		p.resolve(val);	
}

exports['test already resolved error (catch error)'] = function(test){
	var p = new promise.Promise()
		,val = "12345"
		,deferedCallback = function (error){
			test.ok(error instanceof Error);
			test.finish();
		};
		p.then(function(value){
			test.equal(val,value);
		});
		p.resolve(val);
		test.uncaughtExceptionHandler = deferedCallback
		p.resolve("already been resolved");	
}

exports['test progress '] = function(test){
	var p = new promise.Promise()
		,max = 10
		,resolvedCallback = function (value){
			//sys.puts(value + '!');
			test.equal(max,value);
			test.finish();
		}
		,inc = 0, i = 0
		,progressCallback = function (value){
			//sys.puts(value);
			test.equal(value,inc)
			inc = inc + 1;
		}
		p.then(resolvedCallback,null,progressCallback)
		for(i = 0; i < 10; i = i + 1) {
			p.progress(i);
		}
		p.resolve(i);
}

/**
	for making a checklist from callbacks
	useful to check the right async callbacks have been made.

	use like this:
	check = makeCheck(test,[checklist])
	f = check.make(expected_value,item)

	then when f is called:

	f(test_value)
	
	it's tested to be equal to it's expected value, and if so, f's item is checked off the checklist.
	else it makes an error and fails the test.
*/
function makeCheck(test,checklist){
	var check = function (item) {
			checklist.splice(checklist.indexOf(item),1)
			if(checklist.length == 0)
				test.finish()
		}
	check.list = checklist;
	check.make = function (expected,item){
		if (item === undefined){
			item = expected;
		}
		return function(value){
			test.equal(expected,value);
			check(item);
		}
	};
	return check;
}

exports ['test addCallback addErrback and addBoth'] = function (test){

	var p = new promise.Promise()
		, p2 = new promise.Promise()
		, val = "9876"
		, err = new Error ("I AM the WALRUS")
		, check = makeCheck(test,[1,2,3,4,val,err])
		, both = function (value) {
			if(value !== val && value !== err){
				test.ok(false,"expected either " + val + " or " + err + " but got: " + value);
			}
			check(value);				
		}

		p.addCallback(check.make(val,1));
		p.addCallback(check.make(val,2));
		p.addBoth(both);
		p2.addErrback(check.make(err,3));
		p2.addErrback(check.make(err,4));
		p2.addBoth(both);

		p.resolve(val);//resolve 9876 to 3 callbacks
		p2.reject(err);//reject I AM the WALRUS to 3 callbacks
}

//will throw an error: "Can not wait, the event-queue module is not available"
/*exports['test wait'] = function (test){
	var p = new promise.Promise()
		,done = false;
	process.nextTick(function (){
		done = true;
		p.resolve();
	});
	test.equal(false,done);
	p.wait();
	test.equal(true,done);
	test.finish();
}*/

exports['test when'] = function (test){
	var check = makeCheck(test,[1,2]);
	
	promise.when(10,check.make(10,1));
//	function (){
		p = new promise.Promise();
		process.nextTick(function(){
			p.resolve(20);
		});
	
	promise.when(p,check.make(20,2));
}

exports['test whenPromise'] = function (test){
	var check = makeCheck(test,['sync','async'])
		,p = new promise.Promise();
				
	process.nextTick(function(){
		p.resolve(20);
	});
	promise.whenPromise(10,check.make(10,'sync'));
	promise.whenPromise(p,check.make(20,'async'));
}

exports['test seq'] = function (test){
	var check = makeCheck(test,[1,2,3,4,5,'done'])
		, m = 0
		,makePromise = function (inc) {
			var p = new promise.Promise();
			process.nextTick(function(){
				sys.puts("promise:" + inc + " expects: " + m);
				test.equal(m,inc);
				m = inc + 1
				check (m)
				p.resolve(m)
			});
			return p;
		};
//	promise.seq([makePromise,makePromise],0)//,makePromise,makePromise,makePromise],0);
	promise.seq([makePromise,makePromise,makePromise,makePromise,makePromise],0).then(function(value){
		test.equal(5,value);
		check("done");
	});
}

exports['test put and get'] = function (test){
	var p = new promise.Promise()
		, pi = 3.14159
		, sqrt_2 = 1.41
		, zero = 0
		, one = 1
		,check = makeCheck(test,[pi,sqrt_2,zero,one])

	p.put('pi',pi)
	promise.put(p,'zero',zero)
	
	p.get('pi').then(check.make(pi))
	promise.when(promise.get(p,'zero'),check.make(zero));
	
	p.get('sqrt_2').then(check.make(sqrt_2));
	promise.when(promise.get(p,'one'),check.make(one));
	
	process.nextTick(function(){
		p.resolve({'sqrt_2':sqrt_2, 'one':one});
	});
}

if (module == require.main) {
  require('async_testing').run(__filename, process.ARGV);
//    require('async_testing/web-runner').run(__filename, process.ARGV);

}

exports ['test synonyms'] = function(test){
	var p = new promise.Promise()
	test.equal(p.reject,p.errback);
	test.equal(p.reject,p.emitError);

	test.equal(p.resolve,p.callback);
	test.equal(p.resolve,p.emitSuccess);

	test.equal(promise.Promise,promise.Deferred);
	test.equal(promise.Promise,promise.defer);
	
	test.finish();
}

exports['test all & first'] = function (test){
	var check = makeCheck(test,[10,10,20,30,'done']) 
		, promises = [new promise.Promise(),
				new promise.Promise(),
				new promise.Promise()]
		
			promises[0].addCallback(check.make(10));
			promises[1].addCallback(check.make(20));
			promises[2].addCallback(check.make(30));
				
			setTimeout(function(){promises[0].resolve(10)},10)
			setTimeout(function(){promises[1].resolve(20)},20)
			setTimeout(function(){promises[2].resolve(30)},30)

		promise.all(promises).then(function(results){
			sys.puts("results:" + results);
			test.equal(3,results.length);
			check('done');
		});
		promise.first(promises).then(check.make(10));
}

/*
//post is broken. fix later.
//so it Promise.call, which it depends on.
exports['test post'] = function (test){
	var p = promise.Promise()
		, val = 12445;
	p.finish = function(v){
		test.equal(val,v);
		test.finish();
	}
	promise.post(p,'finish',[val])
	process.nextTick(function(){p.resolve(p)});
}
*/

exports['test execute'] = function (test) {
	var callback = null
		,check = makeCheck(test,[36]);
	function takeCallback(cb){
		callback = cb;
	}
	promise.execute(takeCallback).then(check.make(36));
	process.nextTick(function(){
		callback(null,36);
	});
	
}

exports['test convertNodeAsyncFunction'] = function (test) {
	var callback = null
		,check = makeCheck(test,[72]);
	function takeCallback(cb){
		callback = cb;
	}
	
	makePromise = promise.convertNodeAsyncFunction(takeCallback);
	makePromise().then(check.make(72));

	process.nextTick(function(){
		callback(null,72);
	});
}
