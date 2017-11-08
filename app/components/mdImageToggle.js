/**
 * mdImageToggle.js
 *
 * used to toggle boolean game attributes in game editor
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie.components')
      .directive('mdImageToggle', mdImageToggle);

   function mdImageToggle()
   {
      var directive = {
         restrict: 'E',
         replace: true,
         scope: true,
         template: '<img class="icon" title="{{vm.title}}"'+
                   ' ng-click="vm.click($event)"'+
                   ' ng-style="vm.img">',
         controller: controller,
         controllerAs: 'vm',
         bindToController: {
            game: '=',
            md:'@',
            autosave:'@', 
            size: '=',
            sizeUnits: '@'
         }
      }
      return directive;
   }

   controller.$inject = ['$scope','GameService','util','config'];

   function controller($scope, GameService, util, config)
   {
      var vm = this;
      vm.$onInit = onInit;
      vm.click = click;
      vm.img = {cursor: 'pointer'};

      function onInit()
      {
         // default icons
         if (vm.md == "hidden")
         {
            vm.imgUrlOn="url(svr/color_img.php?file=resources/eye.svg&color=444488)";
            vm.imgUrlOff="url(svr/color_img.php?file=resources/eye.svg&color=55555590)";
         }
         else if (vm.md == "kidgame")
         {
            vm.imgUrlOn="url(svr/color_img.php?file=resources/child.svg&color=B58151)";
            vm.imgUrlOff="url(svr/color_img.php?file=resources/child.svg&color=55555590)";
         }
         else if (vm.md == "favorite")
         {
            vm.imgUrlOn="url(svr/color_img.php?file=resources/favorite.svg&color=DD3000)";
            vm.imgUrlOff="url(svr/color_img.php?file=resources/favorite.svg&color=55555590)";
         }

         $scope.$watch('size', changeSize);
         $scope.$watch('game.'+vm.md, updateImage);
      }
      
      function click($event)
      {
         $event.stopPropagation();

         if (!config.env.read_only)
         {
            // toggle value
            vm.game[vm.md] = !vm.game[vm.md];
            // set changed flag, save if autosave set
            GameService.md_changed(vm.md, vm.autosave, vm.game);
            // update image to reflect changed value
            updateImage();
         }
         util.defaultFocus();
      }

      function changeSize(size)
      {
         if (size)
         {
            vm.img.width = util.pct(size, vm.sizeUnits);
         }
      }

      function updateImage()
      {
         if (vm.game && vm.game[vm.md] )
         {
            if (!config.env.read_only)
            {
               vm.title = 'Click to turn '+config.lang.md_labels[vm.md]+' OFF';
            }
            vm.img.content = vm.imgUrlOn;
         }
         else
         {
            if (!config.env.read_only)
            {
               vm.title = 'Click to turn '+config.lang.md_labels[vm.md]+' ON';
            }
            vm.img.content = vm.imgUrlOff;
         }
      }
   }

})();

