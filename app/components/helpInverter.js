/**
 * helpInverter.js
 *
 * When mouse over or mouse out invert element contents (including icons) between
 * theme foreground background
 * Icons are silhouetted using filters in either a light or dark class
 * dependent on the themes lightness
 */
(function () {

   'use strict';

   angular
      .module('WebtroPie.components')
      .directive('helpInverter', helpInverter);

   function helpInverter()
   {
      var directive = {
         restrict: 'EA',
         replace: true,
         transclude: true,
         scope: true,
         template: template,
         controller: controller,
         controllerAs: 'vm'
      }
      return directive;
   }

   function template(element)
   {
      var tag = element[0].nodeName;
      return '<'+tag+' class="click"'+
                 ' ng-style="vm.style"'+
                 ' ng-mouseover="vm.mouseover(true)"'+
                 ' ng-mouseout="vm.mouseover(false)">'+
                 '<span ng-class="vm.class">'+
                   '<ng-transclude></ng-transclude>'+
                 '</span>'+
             '</'+tag+'>';
   }

   controller.$inject = ['$scope','ThemeService'];

   function controller($scope, ThemeService)
   {
      var vm = this;
      vm.$onInit = onInit;
      vm.mouseover = mouseover;

      function onInit()
      {
         $scope.$watch(function() {return ThemeService.helpInverseForegroundClass}, update);
      }

      function mouseover(hover)
      {
         vm.hover = hover;
         update();
      }

      function update()
      {
         vm.class = vm.hover ? ThemeService.helpInverseForegroundClass : '';
         vm.style = vm.hover ? ThemeService.helpInverseBackground : {};
      }
   }

})();
