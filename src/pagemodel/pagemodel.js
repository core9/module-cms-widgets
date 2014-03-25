angular.module( 'core9Dashboard.pagemodel', [
  'ui.router',
  'core9Dashboard.config',
  'core9Dashboard.menu'
])

.config(function($stateProvider) {
	$stateProvider.state('pagemodels',  {
    url: '/config/pagemodels',
    views: {
      "main": {
        controller: 'PageModelsCtrl',
        templateUrl: 'pagemodel/pagemodels.tpl.html'
      }
    },
    data:{ 
      pageTitle: 'PageModels',
      sidebar: 'config'
    }
	})
	.state('pagemodel', {
    url: '/config/pagemodels/:id',
    views: {
      "main": {
        templateUrl: 'pagemodel/pagemodel.tpl.html',
        controller: 'PageModelsModelCtrl'
      }
    },
    data:{ 
      pageTitle: 'PageModels',
      sidebar: 'config'
    }
  });
})

.controller('PageModelsCtrl', function($scope, $http, $state, ConfigFactory) {
  $scope.pagemodels = ConfigFactory.query({configtype: 'pagemodel'});

  $scope.add = function(newName) {
    var model = new ConfigFactory({configtype: 'pagemodel'});
    model.name = newName;
    model.$save(function(data) {
      $scope.pagemodels.push(data);
      $state.go("pagemodel", {id: data._id});
    });
  };

  $scope.refresh = function() {
    $http.post('/admin/pagemodel')
    .success(function() {
      alert('All templates reloaded.');
    }).error(function(data) {
      $scope.$emit("$error", data.error);
    });
  };

  $scope.edit = function(pagemodel) {
    $state.go('pagemodel', {id: pagemodel._id});
  };

  $scope.remove = function(pagemodel) {
    pagemodel.$remove(function(data) {
      $scope.pagemodels = ConfigFactory.query({configtype: 'pagemodel'});
    });
  };
})

.controller('PageModelsModelCtrl', function($scope, $http, ConfigFactory, $stateParams) {
  $scope.pagemodel = ConfigFactory.get({configtype: 'pagemodel', id: $stateParams.id});
  
  $http.get('/admin/widget')
    .success(function(data) {
      $scope.widgets = data;
      $scope.newComponent = {name: $scope.widgets[0], globals: {}};
    });

	$scope.save = function() {
		$scope.pagemodel.$update(function() {
      $http.post('/admin/pagemodel').success(function() {
        alert('reloaded');
      }).error(function(data) {
        $scope.$emit("$error", data.error);
      });
    });
	};

	$scope.addComponent = function() {
		if($scope.pagemodel.components === undefined) {
			$scope.pagemodel.components = [];
		}
		$scope.pagemodel.components.push($scope.newComponent);
    $scope.newComponent = {name: $scope.widgets[0], globals: {}};
	};

	$scope.removeComponent = function(index) {
		$scope.pagemodel.components.splice(index, 1);
	};
})

.run(function(MenuService) {
	MenuService.add('config', {title: "PageModels", weight: 150, link: "pagemodels"});
})
;