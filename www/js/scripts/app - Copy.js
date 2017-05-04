'use strict';

// declare modules
angular.module('Authentication', []);
angular.module('Navigate', []);
angular.module('Home', []);

angular.module('BasicHttpAuthExample', [
    'Authentication',
    'Home',
    'Navigate',
    'ngRoute',
    'ngCookies',
    'ngResource',
    'ngStorage',
    'mobile-angular-ui',
    '720kb.datepicker',
	'angularjs-datetime-picker',
	'angular-table',
	'angularFileUpload'/*,
	'ngCordova.plugins.network'*/
])
 
.config(['$routeProvider','$httpProvider','$qProvider', function ($routeProvider,$httpProvider,$qProvider) {

    $routeProvider
        .when('/login/', {
            controller: 'LoginController',
            templateUrl: 'js/modules/authentication/views/login.html',
            hideMenus: true
        })
 
        .when('/signup/', {
            controller: 'homeController',
            templateUrl: 'js/modules/home/views/home.html'
        })
        
        .when('/homepage/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/navigate.html'
        })
        
        .when('/workorder/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/workorder.html'
        })
        
        .when('/stonedetails/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/stonedetails.html'
        })
 
        .when('/images/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/images.html'
        })
        
        .when('/charts/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/charts.html'
        })
        
        .when('/reports/', {
        	controller: 'navigateController',
            templateUrl: 'js/modules/navigate/views/reports.html'
        })
        
        .otherwise({ redirectTo: '/login/' });
    
      $httpProvider.interceptors.push('APIInterceptor');
      $qProvider.errorOnUnhandledRejections(false);
}])  

.service('APIInterceptor', function($rootScope) {
    var service = this;
    service.request = function(config) {
       /* var currentUser = UserService.getCurrentUser(),
            access_token = currentUser ? currentUser.access_token : null;
        if (access_token) {
            config.headers.authorization = access_token;
        }*/
        return config;
    };
    service.response = function(response) {
    	console.log(response.status);
    	 if (response.status != 200 ) {
    		 $rootScope.$broadcast('httpOffline');/*
    		 $rootScope.*/
    	 }
    	 return response;
    }
    service.responseError = function(response) {
        $rootScope.$broadcast('httpOffline');
        return response;
    };
})


.factory('onlineStatus', ["$window", "$rootScope", function ($window, $rootScope) {
    var onlineStatus = {};

    onlineStatus.onLine = $window.navigator.onLine;

    onlineStatus.isOnline = function() {
        return onlineStatus.onLine;
    }

    $window.addEventListener("online", function () {
        onlineStatus.onLine = true;
        $rootScope.$digest();
    }, true);

    $window.addEventListener("offline", function () {
        onlineStatus.onLine = false;
        $rootScope.$digest();
    }, true);

    return onlineStatus;
}])
 
.run(['$rootScope', '$location', '$cookieStore', '$http', '$window', '$resource', 'SharedState', '$localStorage', /*'$cordovaNetwork',*/
      function ($rootScope, $location, $cookieStore, $http, $window, $resource, SharedState, $localStorage/*, $cordovaNetwork*/) {        
      	
        	$rootScope.$on('$locationChangeStart', function (event, next, current) {
                var publicPages = ['/login/'];
                var restrictedPage = publicPages.indexOf($location.path()) === -1;
                console.log(restrictedPage);
                if (restrictedPage && !$localStorage.currentUser && ($location.path()!='/signup/')) {
                    $location.path('/login/');
                }
            });
        	
        	/*var isOnline = $cordovaNetwork.isOnline();
        	var isOffline = $cordovaNetwork.isOffline();
      	
        	
        	 $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
        	      var onlineState = networkState;
        	      alert(onlineState);
        	 });
        	   
        	 $rootScope.$on('$cordovaNetwork:offline',function(event,networkState){
        		  var offlineState = networkState;
        	       alert(offlineState);
        	     $window.confirm({
        	                        title: "Internet Disconnected",
        	                        content: "The internet is disconnected on your device."
        	                    }).then(function(result){
        	                                    ionic.Platform.exitApp();
        	                    	if(!result) {
        	                            console.log('ok clicked');
        	                          }
        	                    })
        	  });*/
       
    }]);