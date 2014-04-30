angular.module( 'core9Dashboard.widget.datahandlers', [
  'core9Dashboard.config'
])

.factory('DataHandlers', function($q, $http) {
  var templates = {};
  var datahandlers = [];
  var handlerschemas = {};

  this.registerTemplateOnHandler = function (handlerName, templatePath) {
    templates[handlerName] = templatePath;
  };

  this.getTemplate = function (handlerName) {
    return templates[handlerName];
  };

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

.directive("cnDatahandlerForm", function($compile, $templateCache, DataHandlers) {
  return {
    replace: true,
    scope: {
      widget: '=cnWidget'
    },
    link: function(scope, element, attrs) {
      scope.$watch('widget.handler', function () {
        if(scope.widget.handler !== undefined) {
          var template = DataHandlers.getTemplate(scope.widget.handler);
          if(template === undefined) {
            DataHandlers.retrieveHandlerSchema(scope.widget.handler).then(function(data) {
              if(data.schema === null) {
                scope.schema = {};
              } else {
                scope.schema = data.schema;
              }
              if(data.options === null) {
                scope.schemaOptions = {};
              } else {
                scope.schemaOptions = data.options;
              }
              element.html('<div cn-schema-generator cn-schema="schema" cn-options="schemaOptions" cn-data="widget.handleroptions"></div>');
              $compile(element.contents())(scope);  
            });
          } else {
            element.html($templateCache.get(template));
            $compile(element.contents())(scope);
          }
        }
      });
    }
  };
})

.controller("WidgetBundleController", function ($scope, $http) {
  $scope.addComponent = function() {
    if($scope.widget.handleroptions.components === undefined) {
      $scope.widget.handleroptions.components = [];
    }
    $scope.widget.handleroptions.components.push($scope.newComponent);
    $scope.newComponent = {id: '', name: "Select a new component", globals: {}};
  };

  $scope.removeComponent = function(index) {
    $scope.widget.handleroptions.components.splice(index, 1);
  };
  
  $http.get('/admin/widget')
    .success(function(data) {
      $scope.widgets = data;
      $scope.newComponent = {id: '', name: "Select a new component", globals: {}};
    });
})

.controller("WidgetContentController", function ($scope, ConfigFactory) {
  $scope.contenttypes = ConfigFactory.query({configtype: 'content'}, function (data) {
    if($scope.widget.handleroptions.contentType !== undefined) {
      for (var i = data.length - 1; i >= 0; i--) {
        if(data[i].name === $scope.widget.handleroptions.contentType) {
          $scope.contenttype = data[i];
        }
      }
    }
  });

  $scope.$watch('contenttype', function() {
    if($scope.contenttype !== undefined && $scope.contenttype.name !== $scope.widget.handleroptions.contentType) {
      $scope.widget.handleroptions.contentType = $scope.contenttype.name;
    }
  });
})

.controller("ReferenceContentController", function ($scope) {
  $scope.$parent.$watch('contenttypes', function (data) {
    for (var i = $scope.contenttypes.length - 1; i >= 0; i--) {
      if($scope.contenttypes[i].name === $scope.widget.handleroptions.referencedContentType) {
        $scope.referenced = $scope.contenttypes[i];
      }
    }
  }, true);

  $scope.$watch('contenttype', function() {
    if($scope.contenttype !== undefined && $scope.contenttype.name !== $scope.widget.handleroptions.contentType) {
      $scope.widget.handleroptions.contentType = $scope.contenttype.name;
    }
  });
  
  $scope.$watch('referenced', function() {
    if($scope.referenced !== undefined && $scope.referenced.name !== $scope.widget.handleroptions.referencedContentType) {
      $scope.widget.handleroptions.referencedContentType = $scope.referenced.name;
    }
  });
})

.run(function (DataHandlers) {
  DataHandlers.registerTemplateOnHandler("Content", "widget/datahandler/Content.tpl.html");
  DataHandlers.registerTemplateOnHandler("Bundle", "widget/datahandler/Bundle.tpl.html");
  DataHandlers.registerTemplateOnHandler("Reference", "widget/datahandler/Reference.tpl.html");
})
;