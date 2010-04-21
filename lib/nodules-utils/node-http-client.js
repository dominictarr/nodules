/**
* HTTP Client using the JSGI standard objects
*/
var defer = require("./promise").defer,
	when = require("./promise").when,
	LazyArray = require("./lazy-array").LazyArray,
	http = require("http"),
	parse = require("url").parse;

exports.request = function(request){
	if(request.url){
		var parsed = parse(request.url);
		for(var i in parsed){
			request[i] = parsed[i];
		}
	}
	var deferred = defer();
	
	var client = http.createClient(request.port || 80, request.host);

	var req = client.request(request.method || "GET", request.pathname || request.pathInfo, request.headers || {host: request.host});
	
	req.addListener("response", function (response){
		response.status = response.statusCode;
		var sendData = function(block){
			buffer.push(block);
		};
		var buffer = [];
		var bodyDeferred = defer();
		var body = response.body = LazyArray({
			some: function(callback){
				buffer.forEach(callback);
				sendData = callback;
				return bodyDeferred.promise;
			}
		});
		if(request.encoding){
			response.setBodyEncoding(request.encoding);
		}

		response.addListener("data", function (chunk) {
			sendData(chunk);
		});
		response.addListener("end", function(){
			bodyDeferred.resolve();
		});
		deferred.resolve(response);
	});
	if(request.body){
		return when(request.body.forEach(function(block){
			req.write(block);
		}), function(){
			req.end();
			return deferred.promise;
		});
	}
	req.end();
	return deferred.promise;
};