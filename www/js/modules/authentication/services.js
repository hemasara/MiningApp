'use strict';
 
angular.module('Authentication')
 
.factory('AuthenticationService',
    ['Base64', '$http', '$cookieStore', '$rootScope', '$timeout', '$window', '$localStorage','PropertiesLoader',
    function (Base64, $http, $cookieStore, $rootScope, $timeout, $window, $localStorage,PropertiesLoader) {
        var service = {};
		PropertiesLoader.loadProperties();
        service.Login = function (username, password, callback) {
console.log(username+password);
            /* Dummy authentication for testing, uses $timeout to simulate api call
             ----------------------------------------------*/
/*            $timeout(function(){
                var response = { success: ( username === 'admin' || username === 'user') && password === 'admin' };
				$localStorage.currentUser = { username: username };
                if(!response.success) {
                    response.message = 'Username or password is incorrect';
                }
                callback(response);
            }, 1000);*/

            //var apilink = "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/login";
			var apilink = "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/login";
    	    var loginData = {
    	    		email: username,
    	    		password: password
                };
    	    console.log(loginData);
    		var loginCreate = angular.toJson(loginData);		
    		console.log(loginCreate);    		
    		
            $http({
		        method: 'POST',
		        url: apilink,
		        data: loginCreate,
		        transformRequest: angular.identity,
		        transformResponse: angular.identity,
		        headers: {'Content-Type': 'application/json'}}
		    ).then(
		    	    function(response) {
		    	        console.log('succes !', response.data);
		    	        console.log('succes !', response);
						console.log("response.data.in--->"+response.data.indexOf("Active User"));
					//	alert(response.data);
					//	alert("response.data.in--->"+response.data.indexOf("Active User"));
						
		    	    //   $localStorage.currentUser = { username: username, token: response.data };
		               if(response.data.indexOf("User.Active")!=-1) {
						 //  $window.alert("Active");
		            	   var results=response.data.split("$$$");
		            	   $localStorage.currentUser = { username: results[1],currentRole:results[3], token: response.data };
	                       $http.defaults.headers.common.Authorization = 'Bearer ' + response.data;	                                             
		                } 
		                callback(true, response);
		    	    },
		    	    function(err) {
		    	        console.log('error...', err);
		    	        callback(false, err);
		    	    }
		    	);

        };
 
        service.SetCredentials = function (username, password) {
        	
        	console.log("sect2"+username+password);
            var authdata = Base64.encode(username + ':' + password);
 
            $rootScope.globals = {
                currentUser: {
                    username: username,
                    authdata: authdata
                }
            };
 
            $http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
            $cookieStore.put('globals', $rootScope.globals);
        };
 
        service.ClearCredentials = function () {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            $http.defaults.headers.common.Authorization = 'Basic ';
            console.log("Current User in clear: " + $window.localStorage.getItem('currentUser'));
            if ($window.localStorage.getItem('currentUser')) {
            	$window.localStorage.removeItem('currentUser');
            }
        };
        
        service.Logout = function(){
        	delete $localStorage.currentUser;
            $http.defaults.headers.common.Authorization = '';
        };
 
        return service;
        console.log(service);
    }])
    
	
  .factory('PropertiesLoader',  ['$http','$rootScope',
                                 function ( $http, $rootScope) {
	  var propservice = {};
	  propservice.loadProperties=function()
      {
          $http.get('resource/mining.properties').then(function (response) {
          	$rootScope.propertiesValues=response.data;
          	//alert("---"+JSON.stringify($rootScope.propertiesValues));
            });
      }
	  return propservice;
  }])
   
/*.factory('AuthInterceptor', function ($window, $q) {
    return {
        request: function(config) {
        	if(config){
        		config.data = config.data || {};
        		config.headers = config.headers || {};
                if ($window.localStorage.getItem('currentUser')) {
                	if($window.localStorage.getItem('currentUser')=="admin"){
                		config.headers.Authorization = 'Admin ' + $window.localStorage.getItem('currentUser');
                	} else {
                		config.headers.Authorization = 'User ' + $window.localStorage.getItem('currentUser');
                	}
                }
        	}
            return config || $q.when(config);
        },
        response: function(response) {
        	if (response) {
                response.config.response = response.data;
                return $q.reject(response);
            }
            return response || $q.when(response);
        }
    };
})

.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
})*/
 
.factory('Base64', function () {
    /* jshint ignore:start */
 
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
 
    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
 
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
 
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
 
                output = output +
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);
 
            return output;
            console.log(output);
        },
 
        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;
 
            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
                    "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                    "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
 
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
 
                output = output + String.fromCharCode(chr1);
 
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
 
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
 
            } while (i < input.length);
 
            return output;
            console.log(output);
        }
    };
 
    /* jshint ignore:end */
});