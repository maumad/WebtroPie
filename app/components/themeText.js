/**
 * themeText.js
 *
 * Show text for labels and metadata whos style is described by theme object
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie.components')
      .directive('themeText', themeText);

   function themeText()
   {
      var directive = {
         restrict: 'E',
         replace: true,
         scope: true,
         template: '<div id="{{vm.obj.name}}" ng-show="vm.obj.div" ng-style="vm.obj.div" '+
                      ' class="{{vm.obj.multiline?\'text_multiline\':\'text\'}}">'+
                      '<div ng-style="vm.obj.style">{{vm.text}}</div>'+
                      '<theme-text ng-if="vm.text_obj" obj="vm.text_obj"></theme-text>'+
                      '<theme-date ng-if="vm.date_obj" obj="vm.date_obj" text="vm.date_text"></theme-date>'+
                   '</div>',
         controller: controller,
         controllerAs: 'vm',
         bindToController: { obj:'=', game:'=' }
      }
      return directive;

   }

   controller.$inject = ['$scope','GameService','ThemeService'];

   function controller($scope, GameService, ThemeService)
   {
      var vm = this;

      vm.$onInit = onInit;

      function onInit()
      {
         $scope.$watch('vm.game', gameChanged);
         $scope.$watch('vm.obj', themeChanged);
      }

      function gameChanged(game)
      {
         vm.text = GameService.getGameMetadata(game, vm.obj);
         if (vm.date_obj)
         {
            vm.date_text = GameService.getGameMetadata(game, vm.date_obj);
         }
      }

      function themeChanged()
      {
         if (vm.obj.name && vm.obj.name.substring(0,7)=="md_lbl_")
         {
            vm.md = vm.obj.name.substring(7);
            if (vm.md != 'rating')
            {
               var obj;
               delete vm.text_obj;
               delete vm.date_obj;
               if (ThemeService.view.datetime)
               {
                  obj = ThemeService.view.datetime['md_'+vm.md];
                  if (obj && obj.div && obj.div.display == 'inline')  // no position
                  {
                     vm.date_obj = obj;
                  }
               }
               if (!obj)
               {
                  obj = ThemeService.view.text['md_'+vm.md];
                  if (obj && obj.div && obj.div.display == 'inline')  // no position
                  {
                     vm.text_obj = obj;
                  }
               }
            }
         }
      }
   }

})();

