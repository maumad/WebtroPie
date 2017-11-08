/**
 * icon.directive.js
 *
 * Show an svg icon coloured by a specific colour or the current Theme help text colour
 * 
 * E.g. <icon svg="resources/heart.svg" color="FF0000"></icon>
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie')
      .directive('icon', icon);

   function icon()
   {
      var directive = {
         restrict: 'E',
         replace: true,
         scope: true,
         template: '<img class="icon" ng-style="vm.img">',
         controller: controller,
         controllerAs: 'vm',
         bindToController: { svg: '=', color: '=' }
      }
      return directive;
   }

   controller.$inject = ['$scope','util','ThemeService'];

   function controller($scope, util, ThemeService)
   {
      var vm = this;
      vm.$onInit = onInit;
      vm.img = {};

      function onInit()
      {
         $scope.$watch(function() {return ThemeService.helpTextColor}, updateThemeColor);
      }

      function updateThemeColor()
      {
         var color = (vm.color || ThemeService.helpTextColor).substring(0,6);
         vm.img.content = "url('svr/color_img.php?file=" + vm.svg + "&color=" + color + "')";
      }
   }

})();
