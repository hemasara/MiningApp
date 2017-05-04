 'use strict';
 
var myApp = angular.module('Navigate', ['mobile-angular-ui','720kb.datepicker','720kb.socialshare','angularFileUpload','angular-table','ngFileUpload','highcharts-ng','angular-clockpicker','daterangepicker','chart.js'/*,'ngCordova.plugins.network'*/]);

		myApp.directive('fileModel', ['$parse', function ($parse) {
            return {
               restrict: 'A',
               link: function(scope, element, attrs) {
                  var model = $parse(attrs.fileModel);
                  var modelSetter = model.assign;
                  
                  element.bind('change', function(){
                     scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                     });
                  });
               }
            };
         }]);
		 
		myApp.directive('validFile',function(){
		return {
			require:'ngModel',
			link:function(scope,el,attrs,ctrl){
				ctrl.$setValidity('validFile', el.val() != '');
				el.bind('change',function(){
					ctrl.$setValidity('validFile', el.val() != '');
					scope.$apply(function(){
						ctrl.$setViewValue(el.val());
						ctrl.$render();
					});
				});
				}
			}
		});
      
         myApp.service('fileUpload', ['$http', function ($http) {
            this.uploadFileToUrl = function(file, uploadUrl){
               var fd = new FormData();
               fd.append('file', file);
            
               $http.post(uploadUrl, fd, {
                  transformRequest: angular.identity,
                  headers: {'Content-Type': 'multipart/form-data'}
               })
            
               .success(function(){
				   console.log("Success");
               })
            
               .error(function(){
               });
            }
         }]);
         
         myApp.service('SplitArrayService', function () {
        	 return {
        	     SplitArray: function (array, columns) {
        	         if (array.length <= columns) {
        	             return [array];
        	         };

        	         var rowsNum = Math.ceil(array.length / columns);

        	         var rowsArray = new Array(rowsNum);

        	         for (var i = 0; i < rowsNum; i++) {
        	             var columnsArray = new Array(columns);
        	             for (var j = 0; j < columns; j++) {
        	                 var index = i * columns + j;

        	                 if (index < array.length) {
        	                     columnsArray[j] = array[index];
        	                 } else {
        	                     break;
        	                 }
        	             }
        	             rowsArray[i] = columnsArray;
        	         }
        	         return rowsArray;
        	     }
        	 }
        	 });


         myApp.filter('formatDateTime', function ($filter) {
            return function (date, format) {
                if (date) {
                    return moment(Number(date)).format(format || "HH:mm");
                }
                else
                    return "";
            };
        });
         
         myApp.directive('navback', ['$window','$location', function($window,$location) {
             return {
                 restrict: 'A',
                 link: function (scope, elem, attrs) {
                     elem.bind('click', function () {
                         $window.history.back();
                         /*$location.path('/homepage/');*/
                     });
                 }
             };
         }]);
         
myApp.controller('navigateController', ['$scope','$http','$rootScope','$window','$location','SharedState', 'fileUpload', 'FileUploader', 'SplitArrayService', 'Upload','moment','AuthenticationService','$localStorage','onlineStatus','$cordovaSQLite',
                                        function ($scope, $http, $rootScope, $window, $location, SharedState , fileUpload, FileUploader , SplitArrayService, Upload, moment, AuthenticationService, $localStorage, onlineStatus, $cordovaSQLite) {
	console.log("Inside navigate controller");
	
	$scope.workorder =[];
	$scope.stone =[];	
	$scope.approveDet =[];

	$rootScope.UrlLink="http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/";
	console.log("Nav Controllers: "+$rootScope.UrlLink);	
	
	$scope.currentRole = $localStorage.currentUser.currentRole;
//	alert($scope.currentRole);
	
    $scope.onlineStatus = onlineStatus;
    
    $scope.$watch('onlineStatus.isOnline()', function(online) {
        $scope.online_status_string = online ? 'online' : 'offline';		
			SyncWO();
			SyncStone();
			SyncStoneImage();
    });
    
    $rootScope.$on('httpOffline', function() {
    	$scope.http_online_status_string = 'offline';
    });
    
	var username=$localStorage.currentUser.username;
    console.log(" NC UserName: "+username);
    $scope.currentUser = username;
	$scope.stonedetails={};
	
	console.log("Event1: "+SharedState.get('event1'));
	
	$scope.logOut= function(){
		delete $localStorage.currentUser;
        $http.defaults.headers.common.Authorization = '';
		$location.path('/login');
	};
		
	/* WORK ORDER START */	
	
	$scope.workOrder= function(){
		$location.path('/workorder/');
	};
	
	$scope.getWorkOrderDetails = function(){
		console.log("Calling getWorkOrderDetails");
		var apilink = $rootScope.UrlLink+"getWorkOrderDetails"; 
		$http.get(apilink).then(function(response) {			
			$scope.workorder = response.data;
	    });
	};
	
	$scope.getTimeDiff = function(wo) {
		var iDate = moment(wo.dtIN + ' ' + (moment(wo.tmIN).format("HH:mm")), "YYYY-MM-DD HH:mm");
		var oDate = moment(wo.dtOUT + ' ' + (moment(wo.tmOUT).format("HH:mm")), "YYYY-MM-DD HH:mm");
		var diff = moment.utc(oDate.diff(iDate)).format("HH:mm");
		return diff;		
	};
	
	$scope.workorderCreate = function(wo) {
		console.log(wo);
		var iDate = moment(wo.dtIN + ' ' + (moment(wo.tmIN).format("HH:mm")), "YYYY-MM-DD HH:mm");
		var oDate = moment(wo.dtOUT + ' ' + (moment(wo.tmOUT).format("HH:mm")), "YYYY-MM-DD HH:mm");
		var diff = moment.utc(oDate.diff(iDate)).format("HH:mm");
		console.log(diff);
	    var apilink = $rootScope.UrlLink+"workorder/create";
	    console.log($localStorage.currentUser.username);
	    var woData = {
	    		empName: $localStorage.currentUser.username,
	    		timeIN: moment(wo.tmIN).format("HH:mm"),
	    		timeOUT: moment(wo.tmOUT).format("HH:mm"),
	    		workedHours: diff,
				createdBy: $scope.currentUser
            };
	    console.log(woData);
		var woCreate = angular.toJson(woData);		
		console.log(woCreate);
		
		if( $scope.online_status_string != "online" ){
			OfflineWO(woData);
		}
		
		 $http({
		        method: 'POST',
		        url: apilink,
		        data: woCreate,
		        transformRequest: angular.identity,
		        transformResponse: angular.identity,
		        headers: {'Content-Type': 'application/json'}}
		    ).then(
		    	    function(res) {
		    	        console.log('success of work order!', res.data);
						// $window.alert('success of work order!', res.data);
		    	        SharedState.initialize($scope, 'event1');
		    	        SharedState.turnOff('event1');
						$scope.getWorkOrderDetails();
		    	    },
		    	    function(err) {
		    	        console.log('error...', err);
					// $window.alert('error of work order!', err);
		    	    }
		    	);
	
	};
	
	function OfflineWO(woData){
			
			// $window.alert("No Connection");
			var woArr = [];
			woArr.push(woData);
			
		//	// $window.alert(woData);
		//	// $window.alert(woArr.length);
			
			for(var i = 0; i < woArr.length; i++) {
				var data=woArr[i];
				var empName = data.empName;
				var timeIN = data.timeIN;
				var timeOUT = data.timeOUT;
				var workedHours = data.workedHours;
			}

		//	// $window.alert(empName+" "+timeIN+" "+timeOUT+" "+workedHours);
									
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			
			var createquery = "CREATE TABLE IF NOT EXISTS work_order (empName TEXT, timeIN TEXT, timeOUT TEXT, workedHours TEXT)";
			
			// $window.alert("Before Create");
			$cordovaSQLite.execute(db, createquery, []).then(function(res) {
		//		// $window.alert("Creation!!");
				}, function (err) {
		//		// $window.alert("err!!");
			});
			
			var insertquery = "INSERT INTO work_order (empName,timeIN,timeOUT,workedHours) VALUES (?,?,?,?)";
			$cordovaSQLite.execute(db, insertquery, [empName,timeIN,timeOUT,workedHours]).then(function(res) {
		//		// $window.alert("Insertion!!");
				var message = "INSERT ID -> " + res.insertId;
				console.log(message);
		//		// $window.alert(message);
				}, function (err) {
				console.error(err);
			});
			
			var selectquery = "SELECT * FROM work_order ORDER BY empName";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
		//		// $window.alert("Selection!!");
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).empName + " " + res.rows.item(0).timeIN+ " " + res.rows.item(0).timeOUT;
		//				// $window.alert(message);
						console.log(message);
					} else {
		//				// $window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		
	}
	
	function SyncWO(){
  	//	// $window.alert("Calling SyncWO");
		if( $scope.online_status_string != "offline" ){
		//	// $window.alert("SyncWO: "+$scope.online_status_string);
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			var selectquery = "SELECT * FROM work_order ORDER BY empName";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
		//		// $window.alert("Selection!!");
				
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).empName + " " + res.rows.item(0).timeIN+ " " + res.rows.item(0).timeOUT;
		//				// $window.alert(message);
						console.log(message);
						
						
						for(var i = 0; i < res.rows.length; i++) {	
							var jsObj  = null;						
							jsObj = {empName: res.rows.item(i).empName,
								timeIN: res.rows.item(i).timeIN,
								timeOUT: res.rows.item(i).timeOUT,
								workedHours: res.rows.item(i).workedHours,
								createdBy: $scope.currentUser							
							};
		//					// $window.alert(jsObj);
		//					// $window.alert(JSON.stringify(jsObj));
							
							var apilink = $rootScope.HUrlLink+"workorder/create";
							var workOrdersave = angular.toJson(jsObj);		

							$http({
								method: 'POST',
								url: apilink,
								data: workOrdersave,
								transformRequest: angular.identity,
								transformResponse: angular.identity,
								headers: {'Content-Type': 'application/json'}}
							).then(
									function(res) {
										console.log('succes !', res);
										var deletequery = "DELETE FROM work_order";
										$cordovaSQLite.execute(db, deletequery, []).then(function(res) {
							//				// $window.alert("Insertion!!");
							//				// $window.alert(res);
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
					//	// $window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		}
	};
	
	/* WORK ORDER END */
	
	/* STONE DETAILS START */
		
	$scope.stoneDetails= function(){
		$location.path('/stonedetails/');
	};
	
	$scope.getStoneDetails = function(){
		console.log("Calling getStoneDetails");
		
		var apilinkstonetype = $rootScope.UrlLink+"getStoneTypes";
		$http.get(apilinkstonetype).then(function(response) {
	  			$scope.stoneTypes =[];
	  			$scope.stoneTypes = response.data;
	  	});
		
		var apilinkcolour = $rootScope.UrlLink+"getColours";
 	    $http.get(apilinkcolour).then(function(response) {
	  			$scope.colours =[];
	  			$scope.colours = response.data;
	  	});
		   
		var apilink = $rootScope.UrlLink+"getStoneDetails";
		$http.get(apilink).then(function(response) {
			$scope.stone = response.data;
	    });
	};
	
	
	$scope.stoneDetailsSave = function(stoneDetails) {
		var apilink = $rootScope.UrlLink+"stone/create";		
		stoneDetails["createdBy"]=$scope.currentUser;
		var stoneDetailssave = angular.toJson(stoneDetails);		
		
		//// $window.alert(stoneDetailssave);
		
		if( $scope.online_status_string != "online" ){
			OfflineStone(stoneDetails);
		}
		
		 $http({
		        method: 'POST',
		        url: apilink,
		        data: stoneDetailssave,
		        transformRequest: angular.identity,
		        transformResponse: angular.identity,
		        headers: {'Content-Type': 'application/json'}}
		    ).then(
		    	    function(res) {
		    	        console.log('succes !', res.data);
	//					// $window.alert('succes of stone!', res.data);
		    	        SharedState.initialize($scope, 'event2');
		    	        SharedState.turnOff('event2');
						$scope.getStoneDetails();
		    	    },
		    	    function(err) {
		    	        console.log('error...', err);
	//					// $window.alert('error of stone!', err);
		    	    }
		    	);
	
	};
	
	function OfflineStone(stoneDetails){
		//	// $window.alert("No Connection");
			var stoneArr = [];
			stoneArr.push(stoneDetails);
			
		//	// $window.alert(stoneDetails);
		//	// $window.alert(stoneArr.length);
			
			for(var i = 0; i < stoneArr.length; i++) {
				var data=stoneArr[i];
				var width = data.width;
				var height = data.height;
				var length = data.length;
				var type = data.type;
				var colour = data.colour;
				var quantity = data.quantity;
			}

		//	// $window.alert(width+" "+height+" "+length+" "+type);
									
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			
			var createquery = "CREATE TABLE IF NOT EXISTS stone_detail (width INTEGER, height INTEGER, length INTEGER, type TEXT, colour TEXT, quantity INTEGER)";
			
		//	// $window.alert("Before Create");
			$cordovaSQLite.execute(db, createquery, []).then(function(res) {
		//		// $window.alert("Creation!!");
				}, function (err) {
		//		// $window.alert("err!!");
			});
			
			var insertquery = "INSERT INTO stone_detail (width,height,length,type,colour,quantity) VALUES (?,?,?,?,?,?)";
			$cordovaSQLite.execute(db, insertquery, [width,height,length,type,colour,quantity]).then(function(res) {
		//		// $window.alert("Insertion!!");
				var message = "INSERT ID -> " + res.insertId;
				console.log(message);
		//		// $window.alert(message);
				}, function (err) {
				console.error(err);
			});
			
			var selectquery = "SELECT * FROM stone_detail ORDER BY type";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
		//		// $window.alert("Selection!!");
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).width + " " + res.rows.item(0).height+ " " + res.rows.item(0).type;
		//				// $window.alert(message);
						console.log(message);
					} else {
		//				// $window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
	};
	
	function SyncStone(){
  	//	// $window.alert("Calling SyncStone");
		if( $scope.online_status_string != "offline" ){
	//		// $window.alert("SyncStone: "+$scope.online_status_string);
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			var selectquery = "SELECT * FROM stone_detail ORDER BY type";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
	//			// $window.alert("Selection!!");
				
					if(res.rows.length > 0) {
						var message = "SELECTED -> " + res.rows.item(0).width + " " + res.rows.item(0).type;
	//					// $window.alert(message);
						console.log(message);
						
						
						for(var i = 0; i < res.rows.length; i++) {	
							var jsObj  = null;						
							jsObj = {width: res.rows.item(i).width,
								height: res.rows.item(i).height,
								length: res.rows.item(i).length,
								type: res.rows.item(i).type,
								colour: res.rows.item(i).colour,
								quantity: res.rows.item(i).quantity								
							};
	//						// $window.alert(jsObj);
	//						// $window.alert(JSON.stringify(jsObj));
							
							var apilink = $rootScope.HUrlLink+"stone/create";
							var stoneDetailssave = angular.toJson(jsObj);		

							$http({
								method: 'POST',
								url: apilink,
								data: stoneDetailssave,
								transformRequest: angular.identity,
								transformResponse: angular.identity,
								headers: {'Content-Type': 'application/json'}}
							).then(
									function(res) {
										console.log('succes !', res);
										var deletequery = "DELETE FROM stone_detail";
										$cordovaSQLite.execute(db, deletequery, []).then(function(res) {
										//	// $window.alert("Insertion!!");
										//	// $window.alert(res);
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
	//					// $window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		}
	};

	/* STONE DETAILS END */


	/* STONE IMAGES START */	
	
	$scope.imageDetails= function(){
		$location.path('/images/');
	};

	$scope.getFile = function(){
		console.log("Calling getFile");
		var apilink = $rootScope.UrlLink+"getImages";
		$http.get(apilink).then(function(response) {
			/*$scope.images = SplitArrayService.SplitArray(response.data,3);*/
			$scope.images = response.data;
			console.log($scope.images);
	    });
	};

      var countstone=0;
	  var click = 0;
   // upload on file select or drop
      $scope.upload = function (file) {
		  alert(file.size);
		  alert(file.type);
    	var apilink = $rootScope.UrlLink+"image";

		// $window.alert("Before upload click");
		click+= 1;
		// $window.alert("click: "+click);  
		if( $scope.online_status_string === "offline" ){
			countstone += 1;
			OfflineStoneImage(file);
			// $window.alert("countstone: "+countstone);
		}
		if(Upload.isFile(file)){
			alert("Good file");
        Upload.upload({
              /*url: 'http://10.30.54.162:8080/mining/ms/image',*/
        	  url: apilink,
              data: {file: file,sessionUser:$scope.currentUser }
          }).then(function (resp) {
              /*console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);*/
        	  console.log(resp.data);
        	  $scope.getFile();
          }, function (resp) {
              console.log('Error status: ' + resp.status);
          }, function (evt) {
             /* var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
              console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);*/
        });
      };
	  };
	  
	  	function OfflineStoneImage(file){
			
			var img = file;
									
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			
			var createquery = "CREATE TABLE IF NOT EXISTS stone_image (img blob)";
			
		//	// $window.alert("Before Create OfflineStoneImage");
			$cordovaSQLite.execute(db, createquery, []).then(function(res) {
				// $window.alert("Creation!!");
				}, function (err) {
				console.error(err);
			});
			
			var insertquery = "INSERT INTO stone_image (img) VALUES (?)";
			$cordovaSQLite.execute(db, insertquery, [img]).then(function(res) {
				// $window.alert("OfflineStoneImage Insertion!!");
				var message = "INSERT ID -> " + res.insertId;
				console.log(message);
			//	// $window.alert(message);
				}, function (err) {
				console.error(err);
			});
			
			var selectquery = "SELECT * FROM stone_image";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
				// $window.alert("Selection!!");
					if(res.rows.length > 0) {
						var message = "SELECTED -> ";
				//		// $window.alert(message);
						console.log(message);
					} else {
				//		// $window.alert("OfflineStoneImage No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
	};
	
	function SyncStoneImage(){
  	//	// $window.alert("Calling SyncStoneImage");
		if( $scope.online_status_string != "offline" ){
	//		// $window.alert("SyncStoneImage: "+$scope.online_status_string);
			var db = $cordovaSQLite.openDB({ name: "my.db" , description: 'Test DB', version: '1.0', location:'default'});
			var selectquery = "SELECT * FROM stone_image";
			$cordovaSQLite.execute(db, selectquery, []).then(function(res) {
	//			// $window.alert("SyncStoneImage Selection!!");
				
				var apilink = $rootScope.UrlLink+"image";
				//// $window.alert(" SyncStoneImage res.rows.length: "+res.rows.length);
					if(res.rows.length > 0) {
						var message = "SELECTED -> "
					//	// $window.alert(message);
						console.log(message);						
						
						for(var i = 0; i < res.rows.length; i++) {	
						console.log("count: "+i);
					//	// $window.alert("res.rows.length: "+res.rows.length);						
						console.log("res.rows.img: "+res.rows.item(i).img);
					
						var formData = new FormData();
						formData.append("file", res.rows.item(i).img);
						alert("formData: "+formData);
						
					//	var file = "data:image/jpeg;base64," + res.rows.item(i).img;
					//var file= res.rows.item(i).img;
	/*				var abc = {file:res.rows.item(i).img};
					alert(abc);
						if(Upload.isFile(abc)){
			alert("Good file abc after changing");
								};
								
					var file1 = new File([res.rows.item(i).img], filename, {type: contentType, lastModified: Date.now()});
								
								if(Upload.isFile(file1)){
			alert("Good file after changing");
								};
								/*
							Upload.upload({
								url: apilink,
								data: formData				
							  }).then(function (resp) {								  
								  // $window.alert(resp.data);
								    var deletequery = "DELETE FROM stone_image";
										$cordovaSQLite.execute(db, deletequery, []).then(function(res) {
											// $window.alert("Deletion FROM stone_image!!");
										//	// $window.alert(res);
											}, function (err) {
											console.error(err);
								    });
							  }, function (resp) {
								  console.log('Error status: ' + resp.status);
							  }, function (evt) {
								 /* var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
								  console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);*/
						/*	});		*/
						
						$http({
								method: 'POST',
								url: apilink,
								data: formData,
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined}}
							).then(
									function(res) {
										console.log('succes !', res);
										var deletequery = "DELETE FROM stone_image";
										$cordovaSQLite.execute(db, deletequery, []).then(function(res) {
										// $window.alert("Deletion FROM stone_image!!");
										//	// $window.alert(res);
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
					//	// $window.alert("No results found");
						console.log("No results found");
					}
				}, function (err) {
				console.error(err);
			});
		}
	};
	
	
      
    /* STONE IMAGES END */
    
    /* CHART START */
	  
   	$scope.charts= function(){
   		$location.path('/charts/');
   	};
       
    $scope.date = {
    		startDate: "",
    		endDate: ""
    };    

    $scope.singleDate = moment();

    $scope.opts = {
        locale: {
            applyClass: 'btn-green',
            applyLabel: "Apply",
            fromLabel: "From",
            format: "MMM DD, YYYY",
            toLabel: "To",
            cancelLabel: 'Cancel',
            customRangeLabel: 'Custom range'
        },
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
         }
    };

    $scope.setStartDate = function () {
        $scope.date.startDate = moment().subtract(4, "days").toDate();
    };

    $scope.setRange = function () {
        $scope.date = {
            startDate: moment().subtract(5, "days"),
            endDate: moment()
        };
    };

    //Watch for date changes
    $scope.$watch('date', function(newDate) {
        console.log('New date set: ', newDate);
    }, false);
    

   	
    $scope.config = {
   		itemsPerPage: 10,
   		fillLastPage: true
    }     	

	$scope.category=[];
	$scope.tileData=[];
	$scope.slabData=[];
			
			
			$scope.chartConfig={
	           options: {
	                chart: {
	                    type: 'column',
	           	        reflow: true
	                }
	            },
	            series: [{
	            	data: $scope.tileData,
	       	        name: 'TILE',
	       	        color: 'red'
	            },{
	            	data: $scope.slabData,
	       	        name: 'SLAB',
	       	        color: 'orange'
	            }],
	            xAxis: {
	                categories: $scope.category
	            },
	            yAxis: {
                    min: 0,
                    title: {
                        text: ''
                    }
                },
	            title: {
	                text: 'Chart'
	            },
				loading: false,
				chart: {
					type: 'column',
	           	    reflow: true
				}
	        };
      	
			$scope.getstoneChartDetails = function() {
				//alert("Inside getStoneChartReports");
				var stoneChartData = {
						fromDate: moment($scope.date.startDate, "MMM DD, YYYY").format("DD/MM/YYYY"),
						toDate: moment($scope.date.endDate, "MMM DD, YYYY").format("DD/MM/YYYY"),
						createdBy:"admin"	    		
		        };
				var apilink = $rootScope.UrlLink+"stoneChartDetails";
				
				console.log(stoneChartData.fromDate);
				console.log(stoneChartData.toDate);
				var apilink = $rootScope.UrlLink+"stoneChartDetails";
				var stoneChartDatasave = angular.toJson(stoneChartData);
				console.log(stoneChartDatasave);
				
				 $http({
				        method: 'POST',
				        url: apilink,
				        data: stoneChartDatasave,
				        transformRequest: angular.identity,
				        headers: {'Content-Type': 'application/json'}}
				    ).then(
				    	    function(response) {
				    	        console.log('succes !', response.data);
				    	        console.log(response.data);
					  			$scope.stoneChart =[];
					  			$scope.stoneChart = response.data;
					  			console.log($scope.stoneChart);
					  			//alert(response.data);
					  			$scope.chartflag=false;
					  			var count=0;
					  			angular.forEach($scope.stoneChart, function(value, key){
					  			   count++;
					  			   console.log(key + ': ' + value.name + ':' + value.data);
					  			   if(value.name ===  'category'){
					  				   $scope.category = value.data;
					  			   }
					  			  if(value.name ===  'TILE'){
					  				   $scope.tileData = value.data;
					  			   }
					  			  if(value.name ===  'SLAP'){
					  				   $scope.slabData = value.data;
					  			   }
					  			  console.log(count);
					  			  console.log($scope.stoneChart.length);
						  			if(count == $scope.stoneChart.length){
						  				$scope.chartConfig.series[0].data = $scope.tileData.map(Number);
						  				$scope.chartConfig.series[1].data = $scope.slabData.map(Number);
						  				$scope.chartConfig.xAxis.categories = $scope.category;
					                    $scope.chartflag = true;
					                    console.log($scope.chartConfig.series[0].data);
					                    console.log($scope.chartConfig.series[1].data);
					                }
					  			 });
					  			
					  			console.log("DONE");
					  			
					  			console.log($scope.category);
					  			console.log($scope.tileData);
					  			console.log($scope.slabData);
					  	   
				    	    },
				    	    function(err) {
				    	        console.log('error...', err);
				    	    }
				    	);
			
			};
	  
    /* CHART END */
	
	/* REPORT START */		
 	
   	$scope.reports= function(){
   		$location.path('/reports/');
   	};
   	
    $scope.dateRep = {
            /*startDate: moment().subtract(1, "days"),
            endDate: moment()*/
    		startDate: "",
    		endDate: ""
    };    

    $scope.singleDateRep = moment();

    $scope.optsRep = {
        locale: {
            applyClass: 'btn-green',
            applyLabel: "Apply",
            fromLabel: "From",
            format: "MMM DD, YYYY",
            toLabel: "To",
            cancelLabel: 'Cancel',
            customRangeLabel: 'Custom range'
        },
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
         }
    };

    $scope.setStartDateRep = function () {
        $scope.dateRep.startDate = moment().subtract(4, "days").toDate();
    };

    $scope.setRangeRep = function () {
        $scope.dateRep = {
            startDate: moment().subtract(5, "days"),
            endDate: moment()
        };
    };

    //Watch for date changes
    $scope.$watch('dateRep', function(newDateRep) {
        console.log('New date set Rep: ', newDateRep);
    }, false);
   	
	
	$scope.getStoneDetailsReports = function() {
		console.log("Inside getStoneDetailsReports");
		var stoneReportData = {
				fromDate: moment($scope.dateRep.startDate, "MMM DD, YYYY").format("DD/MM/YYYY"),
				toDate: moment($scope.dateRep.endDate, "MMM DD, YYYY").format("DD/MM/YYYY"),
				createdBy:"admin"	    		
        };

		console.log(stoneReportData.fromDate);
		console.log(stoneReportData.toDate);
		//var apilink = $rootScope.$url+"mining/ms/getStoneDetailsReports";
		var apilink = $rootScope.UrlLink+"getStoneDetailsReports";
		var stoneReportDatasave = angular.toJson(stoneReportData);	
		console.log(stoneReportDatasave);
		 $http({
		        method: 'POST',
		        url: apilink,
		        data: stoneReportDatasave,
		        transformRequest: angular.identity,
		        headers: {'Content-Type': 'application/json'}}
		    ).then(
		    	    function(res) {
		    	        console.log('succes !', res.data);
		    	        console.log(res.data);
		    	        $scope.stoneReport =[];
			  			$scope.stoneReport =res.data;
		    	    },
		    	    function(err) {
		    	        console.log('error...', err);
		    	    }
		    	);
	
	};
	
	/* REPORT END */	
	        
      // Organization Start
      $scope.OrgPath= function(){
    	  $location.path('/orgPath/');
      };
      
      $scope.getOrganisationDetails = function(){
		  var apilink = "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/getOrganisationList";
    		//$http.get("http://10.30.54.138:8082/mining/ms/getOrganizationList").then(function(response) {
    	  $http.get(apilink).then(function(response) {
    			$scope.orgDet = response.data;
				console.log(response.data);
			//	// $window.alert($scope.orgDet);
    	    });
      };
	  
      $scope.orgRegister = function(org) {
    	/*var apilink = $rootScope.$url+"mining/ms/saveOrganisation";*/
    	  var apilink = "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/saveOrganisation";		  
    	  org["createdBy"]=$scope.currentUser;
  		var orgDetailssave = angular.toJson(org);		
  		console.log(orgDetailssave);
  		
  		 $http({
  		        method: 'POST',
  		        url: apilink,
  		        data: orgDetailssave,
  		        transformRequest: angular.identity,
  		        transformResponse: angular.identity,
  		        headers: {'Content-Type': 'application/json'}}
  		    ).then(
  		    	    function(res) {
  		    	        console.log('succes !', res.data);
  		    	        SharedState.initialize($scope, 'event7');
  		    	        SharedState.turnOff('event7');
  		    	        $("#update_user_modal").modal("hide");
  		    	        $window.location.reload();
  		    	    },
  		    	    function(err) {
  		    	        console.log('error...', err);
  		    	    }
  		    	);
  	
  	};      
      // Organization End
  	
  	// Approval Start
  	$scope.approvalPath = function(){
  	  $location.path('/approvalPath/');
    };
   
    $scope.getApproveDetails = function(){

    	$scope.orgList=[{}];
		var apilink = $rootScope.UrlLink+"getOrganisationList";
    	$http.get(apilink).then(function(response) {
    		console.log("org list---"+response.data);
		//	// $window.alert("org list---"+response.data);
			$scope.orgList = response.data;
	    });
    	
    	$scope.userRolesList=[{}];
		var apilink1 = $rootScope.UrlLink+"getUserRolesList";
    	$http.get(apilink1).then(function(response) {
    		console.log("user roles list---"+response.data);
		//	// $window.alert("user roles list---"+response.data);
			$scope.userRolesList = response.data;
	    });
    	
    	$scope.statusList=[{}];
		var apilink2 = $rootScope.UrlLink+"getStatusInfoValues";
    	$http.get(apilink2).then(function(response) {
    		console.log("status list---"+response.data);
		//	// $window.alert("status list---"+response.data);
			$scope.statusList = response.data;
	    });
    	
    	$scope.approveDet = [{}];
		var apilink3 = $rootScope.UrlLink+"getApprovalPendingList?searchBy=&searchVal=";
		//$http.get("http://10.30.54.138:8082/mining/ms/getApprovalPendingList?searchBy=&searchVal=").then(function(response) {
    	$http.get(apilink3).then(function(response) {
		//	// $window.alert("Appr ---"+response.data);
			$scope.approveDet = response.data;
	    });
	}; 
	

	/* checkbox iteration start*/
	
	$scope.CheckOrg = function(){
		var approveDetArr = [];
		var flag = false;
		$('#userAppTableId .approveChk').each(function(){			
			if($("#"+this.id).prop('checked')){
				//split the UserId from checkboxId
				var inputId = this.id;
				var spInputId = inputId.split("-");
				var firInputId = spInputId[1];
		
				//Frame dynamic Id for other components
				var orgId = 'orgMap-'+firInputId;
				var rolesId = 'roles-'+firInputId;
				var statusId = 'userStatus-'+firInputId;
								
				//Get the Value for the above components
				var orgVal = $("#"+orgId).val().replace("number:","");
				var roleVal = $("#"+rolesId).val().replace("number:","");
				var statusVal = $("#"+statusId).val().replace("number:","");
				
				console.log("orgVal>>>>"+orgVal);
				console.log("roleVal>>>>"+roleVal);
				console.log("statusVal>>>>"+statusVal);
				if((roleVal != undefined && roleVal != null && roleVal != '') && (statusVal != undefined && statusVal != null && statusVal != '')){
					flag = true;
					// Form as Json Obj and push to approveDetArr array				
					//var myobj = JSON.parse(JSON.stringify(orgVal));				
					var userObj =  {"userId": firInputId, "orgId": orgVal, "rolesId":roleVal, "statusId":statusVal};					
					//var userObj =  {"listInfo" : [{"userId": firInputId, "orgId": orgVal, "rolesId":roleVal, "statusId":statusVal}]};						     
					console.log("userObj>>>>>"+JSON.stringify(userObj));
	 				// Send the approveDetArr Array obj to web service
					approveDetArr.push(userObj);		
				}else{
					$('#orgMap-'+firInputId).css('border', '1px solid red');
					$('#roles-'+firInputId).css('border', '1px solid red');
					$('#userStatus-'+firInputId).css('border', '1px solid red');

				}
			}
		});
		var lastval={"listInfo" : approveDetArr};
		console.log("lastval---->"+JSON.stringify(lastval));
		
		
		$.ajax({
		    //url: "http://10.30.54.138:8082/mining/ms/saveUserApprovel",
			url: "http://miningwebservice-env.ap-south-1.elasticbeanstalk.com/ms/saveUserApprovel",
		    contentType: "application/json",
		    type: 'POST',
		    dataType: 'text',
		    data: angular.toJson(lastval)
		}).done(function(response){
			console.log('succes !', response);
			$scope.getApproveDetails();
		});		
				
		if(!flag){
			alert("Please select Organisation, Role, Status and Checkbox");
		}else{
			alert("success");
		}
		//$window.location.reload();		
	}
	/* checkbox iteration end*/
  	// Approval End
	
	
	
    }]);
	
	
/* EAch checkbox check with values */
function preCheckbox(ths)
{
	var xval=$(ths).val();
	
	if($("#orgMap-"+xval).val()=='')
	{
		alert("Please select Organization Value");
		$(ths).prop('checked',false);
		$("#orgMap-"+xval).focus();
		return;
	}
	if($("#roles-"+xval).val()=='')
	{
		alert("Please select Roles Value");
		$("#roles-"+xval).focus();
		$(ths).prop('checked',false);
		return;
	}
	if($("#userStatus-"+xval).val()=='')
	{
		alert("Please select Status Value");
		$(ths).prop('checked',false);
		$("#userStatus-"+xval).focus();
		return;
	}
}
