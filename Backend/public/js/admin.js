var socket=io();


angular.module('app',[]).controller('profile', function($scope, $http) {
	  $scope.user = '';
	  var getitems = function() {
		socket.emit('getList', 'items');
	}
	//get user logged in
    $http({
      method: 'GET',
      url: 'http://localhost:3000/user'
    }).then(function successCallback(response) {
      $scope.user = response.data;
		getitems();
    }, function errorCallback(response) {
      console.log(response);
    });

//change password and returns whether old password is correct
//and if so changes it to new password and makes new salt
$scope.changePass = function() {
	var pass = document.getElementById("password").value;
	var cpass = document.getElementById("cpassword").value;
	var opass = document.getElementById("opassword").value;
	
	if (pass != cpass) {
		$scope.error = "Your passwords don't match";
	}else {
		socket.emit('changePass', opass,pass,$scope.user);
	}
}	 



//interactive message to tell user whether password is correct or not
socket.on('cPassRes', function(result) {
	$scope.$apply(function() {
		$scope.error = result;
	});
});
    
    
//add item to list
$scope.addItem = function() {
	var item = {
		desc: document.getElementById("desc").value,
        price: document.getElementById("price").value,
        date_added: new Date(), 
        category: document.getElementById("category").value,
        tags: 'temp',
        pay_method: '',
        paid_by: '',
        paid: '',
		table: 'items'
	}
	socket.emit('addItem',item);
	getitems();
}
//move item in list
$scope.movePickup = function(item) {
	var item = {
		table: 'items',
        newtable: 'pickup',
		name: item,
	}
	socket.emit('editItem',item);
	getitems();
}
$scope.moveSold = function(item) {
	var item = {
		table: 'items',
        newtable: 'sold',
		name: item,
	}
	socket.emit('editItem',item);
	getitems();
}
$scope.moveItems = function(item) {
	var item = {
		table: 'items',
        newtable: 'items',
		name: item,
	}
	socket.emit('editItem',item);
	getitems();
}

//remove item in list
$scope.removeItem = function(itemName) {
	var item = {
		table: 'items',
		name: itemName
	}
	socket.emit('removeItem',item);
	getitems();
}


    
socket.on('receiveList',function(list){
	$scope.$apply(function() {
		$scope.items = list;
	});
 
})

 
});

