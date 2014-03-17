angular.module( 'core9Dashboard.widget', [
  'ui.router',
  'core9Dashboard.config',
  'core9Dashboard.menu',
  'core9.formgenerator',
  'ui.codemirror'
])

.config(function($stateProvider) {
	$stateProvider.state('widgets',  {
    url: '/config/widgets',
    views: {
      "main": {
        controller: 'ConfigWidgetListCtrl',
        templateUrl: 'widget/widgetlist.tpl.html'
      }
    },
    data:{ pageTitle: 'Widgets' }
	})
	.state('widgetsitem', {
    url: '/config/widgets/:id',
    views: {
      "main": {
        controller: 'ConfigWidgetCtrl',
        templateUrl: 'widget/widget.tpl.html'
      }
    },
    data:{ pageTitle: 'Widget' }
  });
})
.factory('DataHandlers', function($q, $http) {
  var datahandlers = [];
  var handlerschemas = {};

  this.retrieveDataHandlers = function() {
    var deferred = $q.defer();
    if(datahandlers.length > 0) {
      deferred.resolve(datahandlers);
    } else {
      $http.get('/admin/widget/datahandler')
      .success(function(data) {
        datahandlers = data;
        deferred.resolve(datahandlers);
      });
    }
    return deferred.promise;
  };

  this.retrieveHandlerSchema = function(handlerName) {
    var deferred = $q.defer();
    if(handlerschemas[handlerName] !== undefined) {
      deferred.resolve(handlerschemas[handlerName]);
    } else {
      $http.get('/admin/widget/datahandler/' + handlerName)
      .success(function(data) {
        handlerschemas[handlerName] = data;
        deferred.resolve(handlerschemas[handlerName]);
      });
    }
    return deferred.promise;
  };
  return this;
})

.controller('ConfigWidgetListCtrl', function($scope, $http, $state, ConfigFactory) {
  $scope.widgets = ConfigFactory.query({configtype: 'widget'});

  $scope.add = function(newName) {
    var widget = new ConfigFactory({configtype: 'widget'});
    widget.name = newName;
    widget.handleroptions = {};
    widget.$save(function(data) {
      $scope.widgets.push(data);
      $state.go("widgetsitem", {id: data._id});
    });
  };
  
  $scope.refresh = function() {
    $http.post('/admin/widget').success(function() {
      alert('reloaded');
    }).error(function(data) {
      $scope.$emit("$error", data.error);
    });
  };

  $scope.edit = function(widget) {
    $state.go("widgetsitem", {id: widget._id});
  };


  $scope.remove = function(widget) {
    widget.$remove(function(data) {
      $scope.widgets = ConfigFactory.query({configtype: 'widget'});
    });
  };
})

.controller('ConfigWidgetCtrl', function($scope, $state, $http, ConfigFactory, $stateParams, DataHandlers) {
  $http.get('/admin/widget')
    .success(function(data) {
      $scope.widgets = data;
      $scope.newComponent = {name: $scope.widgets[0], globals: {}};
    });
    
  $scope.widget = ConfigFactory.get({configtype: 'widget', id: $stateParams.id});
  $scope.editorOptions = {
    mode: 'htmlmixed',
    fullScreen: false,
    smartIndent: false,
    lineWrapping: true,
    lineNumbers: true
  };

  DataHandlers.retrieveDataHandlers().then(function(data) {
    $scope.datahandlers = data;
  });
  
  $scope.save = function() {
    $scope.widget.$update(function() {
      $http.post('/admin/widget').success(function() {
        alert('reloaded');
      }).error(function(data) {
        $scope.$emit("$error", data.error);
      });
    });
  };

  $scope.addComponent = function() {
    if($scope.widget.handleroptions.components === undefined) {
      $scope.widget.handleroptions.components = [];
    }
    $scope.widget.handleroptions.components.push($scope.newComponent);
    $scope.newComponent = {name: $scope.widgets[0], globals: {}};
  };

  $scope.removeComponent = function(index) {
    $scope.widget.handleroptions.components.splice(index, 1);
  };

  $scope.$watch('widget.handler', function(newValue, oldValue) {
    if($scope.widget.handler !== undefined) {
      if(newValue !== oldValue && oldValue !== undefined) {
        $scope.widget.handleroptions = {};
      }
      DataHandlers.retrieveHandlerSchema($scope.widget.handler).then(function(data) {
        if(data.schema === null) {
          $scope.schema = {};
        } else {
          $scope.schema = data.schema;
        }
        if(data.options === null) {
          $scope.schemaOptions = {};
        } else {
          $scope.schemaOptions = data.options;
        }
      });
    }
  });
})

.run(function(MenuService) {
	MenuService.add('config', {title: "Widgets", weight: 200, link: "/config/widgets"});
})
;