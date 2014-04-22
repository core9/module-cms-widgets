angular.module( 'core9Dashboard.widgets', [
  'core9Dashboard.widget',
  'core9Dashboard.pagemodel',
  'templates-module-cms-widgets'
  ])

;
angular.module('core9Dashboard.admin.dashboard').requires.push('core9Dashboard.widgets');