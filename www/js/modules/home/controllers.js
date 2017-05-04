'use strict';

var app = angular.module('Home', []);
app.controller('HomeController', function($scope, postService, $http) {
	 $http.defaults.headers.common['Accept'] = "application/json";
	 $http.defaults.headers.common['Content-Type'] = "application/json";
    $scope.register = {};
   
    $scope.registration = function(registerValue) {
    var apilink = "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/register";
	
	alert(registerValue);
	$scope.postresponse = postService.restFunction(apilink,registerValue);
	
	
    }
});

app.service('postService', function($http) {
	this.restFunction = function(apilink,registerValue) {
		var registersend = angular.toJson(registerValue);
		console.log(registersend);
$http.post(apilink,registersend).then(function(response) {
			var myWelcome = response.data;
			alert(myWelcome);
			return myWelcome;
		});
	};
});

/*
 * function HelloCtrl($scope, testService) { $scope.fromService =
 * testService.sayHello("World","welcome"); }
 */