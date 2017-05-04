'use strict';
 
angular.module('Authentication')
 
.controller('LoginController',
    ['$scope', '$rootScope', '$location', 'AuthenticationService', '$window', '$localStorage', 'onlineStatus', 'CoronlineStatus',
    function ($scope, $rootScope, $location, AuthenticationService, $window, $localStorage, onlineStatus, CoronlineStatus ) {

        initController();
        
        function initController() {
            AuthenticationService.Logout();
        };   

        console.log($scope.http_online_status_string);
        
		 $scope.login = function() {
			 $scope.dataLoading = true;
			 console.log($scope.username);
			 console.log($scope.password);
			 AuthenticationService
			 .Login(
					 $scope.username,
					 $scope.password,
					 function(status, response) {
						 if (status === true) {
							console.log("hi" + response.data);
							var responseData=response.data;
							if(responseData.indexOf("User.Active")!=-1) {
								console.log("Inside Login");
								$location.path('/homepage/');
							} else {
								$scope.error = $rootScope.propertiesValues[responseData];
								//$scope.error = 'Username or password is incorrect';
								$scope.dataLoading = false;
							}
						 } else {
							$scope.error = $rootScope.propertiesValues.IncorrectUser;
							//$scope.error = 'Username or password is incorrect';
							 $scope.dataLoading = false;
							 $window.localStorage.removeItem('currentUser');
						 }
					 });
		 };

        
        
        $scope.onlineStatus = onlineStatus;
        
        $scope.$watch('onlineStatus.isOnline()', function(online) {
            $scope.online_status_string = online ? 'online' : 'offline';
        });
       
        $rootScope.$on('httpOffline', function() {
        	$scope.http_online_status_string = 'offline';
        });

		$scope.CoronlineStatus = CoronlineStatus;

		 $scope.$watch('CoronlineStatus.isOnline()', function(
				 Coronline) {
			 $scope.cor_online_status_string = Coronline ? 'online' : 'offline';
		 });
        
    }]);