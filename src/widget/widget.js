angular.module( 'core9Dashboard.widget', [
  'ui.router',
  'core9Dashboard.widget.datahandlers',
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
    data:{
      pageTitle: 'Widgets',
      sidebar: 'config',
      context: 'widgets'
    }
	})
	.state('widgetsitem', {
    url: '/config/widgets/:id',
    views: {
      "main": {
        controller: 'ConfigWidgetCtrl',
        templateUrl: 'widget/widget.tpl.html'
      }
    },
    data:{
      pageTitle: 'Widgets',
      sidebar: 'config',
      context: 'widgets'
    }
  });
})

.controller('ConfigWidgetListCtrl', function($scope, $http, $state, ConfigFactory) {
  $scope.widgetFolder = '';

  function putWidgetInFolder(widget, target) {
    var folderIndex = widget.name.indexOf('/');
    if(folderIndex === -1) {
      if(target.widgets === undefined) {
        target.widgets = [];
      }
      target.widgets.push(widget);
    } else {
      if(target.folders === undefined) {
        target.folders = {};
      }
      var folderName = '/' + widget.name.substring(0, folderIndex);
      if(target.folders[folderName] === undefined) {
        target.folders[folderName] = {};
      }
      widget.name = widget.name.substring(folderIndex + 1);
      putWidgetInFolder(widget, target.folders[folderName]);
    }
  }

  $scope.handleWidgetData = function (data) {
    $scope.widgets = [];
    var l = data.length;
    for(var n = 0; n < l; n++) {
      putWidgetInFolder(data[n], $scope.widgets);
    }
    $scope.widgetList = $scope.widgets;
  };

  ConfigFactory.query({configtype: 'widget'}, $scope.handleWidgetData);

  $scope.switchTo = function (folder) {
    if(folder === '..') {
      $scope.widgetFolder = $scope.widgetFolder.substring(0, $scope.widgetFolder.lastIndexOf('/'));
    } else {
      $scope.widgetFolder += folder;  
    }
    if($scope.widgetFolder === '') {
      $scope.widgetList = $scope.widgets;
    } else {
      var folders = $scope.widgetFolder.split('/');
      for (var n = 0; n < folders.length; n++) {
        if(folders[n] === '') {
          $scope.widgetList = $scope.widgets;
        } else {
          $scope.widgetList = $scope.widgetList.folders['/' + folders[n]];
        }
      }
    }
  };

  $scope.add = function(newName) {
    var widget = new ConfigFactory({configtype: 'widget'});
    if($scope.widgetFolder === '' || $scope.widgetFolder === '/') {
      widget.name = newName;
    } else {
      widget.name = $scope.widgetFolder.substring(1) + '/' + newName;
    }
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
      ConfigFactory.query({configtype: 'widget'}, $scope.handleWidgetData);
      $scope.refresh();
    });
  };
})

.controller('ConfigWidgetCtrl', function($scope, $state, $http, ConfigFactory, $stateParams, DataHandlers) {
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

  $scope.generateBoilerplate = function () {
    var index = $scope.widget.templateName.lastIndexOf('.');
    var namespace = $scope.widget.templateName.substring(0, index);
    var template = $scope.widget.templateName.substring(index);
    $scope.widget.template = "{namespace " + namespace + "}\n\n/**\n *\n */\n{template " + template + "}\nBody\n{/template}\n";
  };
  
})

.run(function(MenuService) {
	MenuService.add('config', {title: "Widgets", weight: 200, link: "widgets"});
  MenuService.add('widgets', {title: "Refresh", weight: 0, 
    template: "<a href=\"\" ng-controller=\"ConfigWidgetListCtrl\" ng-click=\"refresh()\">Refresh widgets</a>"});
})
;