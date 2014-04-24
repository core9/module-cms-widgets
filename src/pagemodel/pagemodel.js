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
      sidebar: 'config',
      context: 'pagemodels'
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
      sidebar: 'config',
      context: 'pagemodels'
    }
  });
})

.controller('PageModelsCtrl', function($scope, $http, $state, ConfigFactory) {
  $scope.pagemodelsFolder = '';

  function putPageModelInFolder(pagemodel, target) {
    var folderIndex = pagemodel.name.indexOf('/');
    if(folderIndex === -1) {
      if(target.pagemodels === undefined) {
        target.pagemodels = [];
      }
      target.pagemodels.push(pagemodel);
    } else {
      if(target.folders === undefined) {
        target.folders = {};
      }
      var folderName = '/' + pagemodel.name.substring(0, folderIndex);
      if(target.folders[folderName] === undefined) {
        target.folders[folderName] = {};
      }
      pagemodel.name = pagemodel.name.substring(folderIndex + 1);
      putPageModelInFolder(pagemodel, target.folders[folderName]);
    }
  }

  $scope.handlePageModelsData = function (data) {
    $scope.pagemodels = [];
    var l = data.length;
    for(var n = 0; n < l; n++) {
      putPageModelInFolder(data[n], $scope.pagemodels);
    }
    $scope.pagemodelList = $scope.pagemodels;
  };

  $scope.switchTo = function (folder) {
    if(folder === '..') {
      $scope.pagemodelsFolder = $scope.pagemodelsFolder.substring(0, $scope.pagemodelsFolder.lastIndexOf('/'));
    } else {
      $scope.pagemodelsFolder += folder;
    }
    if($scope.pagemodelsFolder === '') {
      $scope.pagemodelList = $scope.pagemodels;
    } else {
      var folders = $scope.pagemodelsFolder.split('/');
      for (var n = 0; n < folders.length; n++) {
        if(folders[n] === '') {
          $scope.pagemodelList = $scope.pagemodels;
        } else {
          $scope.pagemodelList = $scope.pagemodelList.folders['/' + folders[n]];
        }
      }
    }
  };

  ConfigFactory.query({configtype: 'pagemodel'}, $scope.handlePageModelsData);

  $scope.add = function(newName) {
    var model = new ConfigFactory({configtype: 'pagemodel'});
    if($scope.pagemodelsFolder === '' || $scope.pagemodelsFolder === '/') {
      model.name = newName;
    } else {
      model.name = $scope.pagemodelsFolder.substring(1) + '/' + newName;
    }
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
      ConfigFactory.query({configtype: 'pagemodel'}, $scope.handlePageModelsData);
      $scope.refresh();
    });
  };
})

.controller('PageModelsModelCtrl', function($scope, $http, ConfigFactory, $stateParams) {
  $scope.pagemodel = ConfigFactory.get({configtype: 'pagemodel', id: $stateParams.id});

  $scope.$watch('pagemodel.name', function(newVal, oldVal) {
    if($scope.pagemodel.templateName === undefined || $scope.pagemodel.templateName === oldVal) {
      $scope.pagemodel.templateName = $scope.pagemodel.name;
    }
  });
  
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

  $scope.addPermission = function(permission) {
    if($scope.pagemodel.permissions === undefined) {
      $scope.pagemodel.permissions = [];
    }
    $scope.pagemodel.permissions.push(permission);
  };

  $scope.addRole = function(role) {
    if($scope.pagemodel.roles === undefined) {
      $scope.pagemodel.roles = [];
    }
    $scope.pagemodel.roles.push(role);
  };
})

.run(function(MenuService) {
	MenuService.add('config', {title: "PageModels", weight: 150, link: "pagemodels"});
  MenuService.add('pagemodels', {title: "Refresh", weight: 0, 
    template: "<a href=\"\" ng-controller=\"PageModelsCtrl\" ng-click=\"refresh()\">Refresh pagemodels</a>"});
})
;