'use strict';

angular.module('WebtroPie')
.controller('AppCtrl', ['$scope','config','ThemeService', 'util','GameService',
function($scope, config, ThemeService, util, GameService) {

   $scope.config = config;
   $scope.ThemeService = ThemeService;

   //ThemeService.animate_view_class = 'fade';

   config.init();

   $scope.themeChanged = function(theme)
   {
      if (theme)
      {
         config.app.ThemeSet = theme;
         config.themehover = false;
      }
      else
      {
         config.hideMenu();
      }
      config.save('ThemeSet', config.app.ThemeSet);
      ThemeService.getTheme(config.app.ThemeSet,
                            ThemeService.system.name,
                            ThemeService.view.name)
      .then(function() {
         // choose best view
         GameService.checkSystemTheme(ThemeService.system.name, true);
         util.defaultFocus();
      });
   }

   $scope.languageChanged = function()
   {
      config.save('Language', config.app.Language);
      config.init(config.LANG, config.app.Language, true)
      .then(function() {
         GameService.set_field_text();
         config.hideMenu();
      });
   }

   $scope.dateFormatChanged = function()
   {
      config.save('DateFormat', config.app.DateFormat);
   }
}])

.directive('menu', function()
{
   return {
      //templateUrl: 'menu.html'
      template: '<div ng-include="config.menu_template"></div>'
   }
})

.filter('orderObjectBy', function() {
   return function(items, field, reverse)
   {
      var filtered = [];
      angular.forEach(items, function(item)
      {
         filtered.push(item);
      });

      filtered.sort(function (a, b)
      {
         return (a[field] > b[field] ? 1 : -1);
      });

      if(reverse)
      {
         filtered.reverse();
      }
      return filtered;
   };
});
