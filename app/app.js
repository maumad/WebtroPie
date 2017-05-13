'use strict';

// Declare app level module which depends on views, and components
angular.module('WebtroPie', [
  'ngRoute',
  //'ngAnimate',
  'WebtroPie.util',
  'WebtroPie.config_service',
  'WebtroPie.theme_service',
  'WebtroPie.theme_components',
  //'WebtroPie.init',
  'WebtroPie.system_view',
  'WebtroPie.game_service',
  'WebtroPie.gamelist_view',
  'WebtroPie.gamelist',
  'WebtroPie.game_editor',
  'ngTouch'
])

.config([ '$routeProvider', '$compileProvider',
function( $routeProvider, $compileProvider)
{
  $compileProvider.debugInfoEnabled(false);
  $routeProvider.otherwise({redirectTo: '/'});
}]);

