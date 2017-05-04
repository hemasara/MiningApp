'use strict';

var app = angular.module('Home', []);

app.directive('back', ['$window', function($window) {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem.bind('click', function () {
                $window.history.back();
            });
        }
    };
}]);

app.controller('homeController', ['$scope','$rootScope', '$http', '$window', 'onlineStatus', '$location', '$cordovaSQLite',
                                  function($scope, $rootScope, $http, $window, onlineStatus, $location, $cordovaSQLite) {
    
/*	getServerUrl();
	
	function getServerUrl(){
  		console.log("Calling getServerUrl");
  		$http.get("http://10.30.54.162:8080/mining/ms/getServerUrl",{
  			transformResponse: function (data, headers) {			  				
  				return data;
  			}
  		}).then(function(response) {
  			$rootScope.HUrlLink = response.data;
  	   });
   };	
   
    $rootScope.UrlLink="http://sample-env.t3r3qbtdde.ap-south-1.elasticbeanstalk.com/ms/";   */
	$rootScope.UrlLink="http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/";
   	
    $scope.onlineStatus = onlineStatus;
    
    $scope.$watch('onlineStatus.isOnline()', function(online) {
        $scope.online_status_string = online ? 'online' : 'offline';
		SyncReg();
    });
    
    $rootScope.$on('httpOffline', function() {
    	$scope.http_online_status_string = 'offline';
    });
	
	$scope.registration = function(registerValue) {
	    /*var apilink = "http://10.30.54.162:8080/mining/ms/register";*/
	//	$window.alert("Inside Registration");
		var apilink = $rootScope.HUrlLink+"register";
		var registerValuesave = angular.toJson(registerValue);		
		console.log(registerValuesave);
	//	$window.alert(registerValuesave);
	//	$window.alert("online_status_string: "+$scope.online_status_string);
	//	$window.alert("onlineStatus: "+$scope.onlineStatus);
		if( $scope.online_status_string != "online" ){
	//		$window.alert("No Connection");
			var regArr = [];
			regArr.push(registerValue);
			
			for(var i = 0; i < regArr.length; i++) {
				var data= regArr[i];
				var userName = data.userName;
				var password = data.password;
				var email = data.email;
				var phoneNumber = data.phoneNumber;
			}

	//		$window.alert(userName+" "+password+" "+email+" "+phoneNumber);
									
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			
			var createquery = "CREATE TABLE IF NOT EXISTS user_register (userName TEXT PRIMARY KEY ASC, password TEXT, email TEXT, phoneNumber INTEGER)";
			
	//		$window.alert("Before Create");
			$cordovaSQLite.execute(db, createquery, []).then(function(res) {
	//			$window.alert("Creation!!");
				}, function (err) {
	//			$window.alert("err!!");
			});
			
			var insertquery = "INSERT INTO user_register (userName,password,email,phoneNumber) VALUES (?,?,?,?)";
			$cordovaSQLite.execute(db, insertquery, [userName,password,email,phoneNumber]).then(function(res) {
	//			$window.alert("Insertion!!");
				var message = "INSERT ID -> " + res.insertId;
				console.log(message);
	//			$window.alert(message);
				}, function (err) {
				console.error(err);
			});
			
			var selectquery = "SELECT * FROM user_register ORDER BY userName";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
	//			$window.alert("Selection!!");
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).userName + " " + res.rows.item(0).password;
	//					$window.alert(message);
						console.log(message);
					} else {
	//					$window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		}
		
		$http({
		        method: 'POST',
		        url: apilink,
		        data: registerValuesave,
		        transformRequest: angular.identity,
		        transformResponse: angular.identity,
		        headers: {'Content-Type': 'application/json'}}
		    ).then(
		    	    function(res) {
		    	        console.log('succes !', res);
		    	        $location.path('/login/');
		    	    },
		    	    function(err) {
		    	        console.log('error...', err);
		    	    }
		    	);
	
	};
	
	function SyncReg(){
  	//	$window.alert("Calling SyncReg");
		if( $scope.online_status_string != "offline" ){
	//		$window.alert("SyncReg: "+$scope.online_status_string);
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			var selectquery = "SELECT * FROM user_register ORDER BY userName";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
	//			$window.alert("Selection!!");
				
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).userName + " " + res.rows.item(0).password;
	//					$window.alert(message);
						console.log(message);
						
						
						for(var i = 0; i < res.rows.length; i++) {	
							var jsObj  = null;						
							jsObj = {userName: res.rows.item(i).userName,
								password: res.rows.item(i).password,
								email: res.rows.item(i).email,
								phoneNumber: res.rows.item(i).phoneNumber
							};
	//						$window.alert(jsObj);
	//						$window.alert(JSON.stringify(jsObj));
							
							var apilink = $rootScope.HUrlLink+"register";
							var registerValuesave = angular.toJson(jsObj);		

							$http({
								method: 'POST',
								url: apilink,
								data: registerValuesave,
								transformRequest: angular.identity,
								transformResponse: angular.identity,
								headers: {'Content-Type': 'application/json'}}
							).then(
									function(res) {
										console.log('succes !', res);
										var deletequery = "DELETE FROM user_register";
										$cordovaSQLite.execute(db, deletequery, []).then(function(res) {
	//										$window.alert("Insertion!!");
	//										$window.alert(res);
											}, function (err) {
											console.error(err);
										});
									},
									function(err) {
										console.log('error...', err);
									}
								);							
						}
			
					} else {
	//					$window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		}
	};

}]);