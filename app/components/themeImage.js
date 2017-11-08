/**
 * themeText.js
 *
 * theme view images, positioned and styled by theme, some of which can also be toggled
 */
(function() {

   'use strict';

   angular
      .module('WebtroPie.components')
      .directive('themeImage', themeImage);

   function themeImage()
   {
      var directive = {
         restrict: 'E',
         replace: true,
         scope: true,
         template: '<div id={{vm.obj.name}} title={{vm.title}} '+
                        'ng-click="vm.click($event)" ng-switch on="!!vm.obj.div">'+
                        //'ng-click="vm.click($event)" ng-switch on="'+
                        //'vm.obj.div[\'background-image\'] || '+
                        //'vm.obj.div[\'background-color\']">'+
                     '<div ng-switch-when="true" ng-style="vm.obj.div"></div>'+
                     //'<img ng-switch-default ng-style="vm.obj.img" ng-src="{{vm.src}}" >'+
                     '<img ng-switch-default ng-style="vm.obj.img">'+
                   '</div>',
         controller: controller,
         controllerAs: 'vm',
         bindToController: { obj:'=', game:'=', type:'@' }
      }
      return directive;
   }

   controller.$inject = ['$scope','config','util','GameService'];

   function controller($scope, config, util, GameService)
   {
      var vm = this;
      vm.$onInit = onInit;

      function onInit()
      {
console.log('themeImage : ' + vm.obj.name);
         //vm.src = vm.obj.fullpath;

         if (vm.obj &&
            vm.obj.name &&
            vm.obj.name.substring(0,3) == 'md_')
         {
            vm.md = vm.obj.name.substring(3);

            if (vm.md == 'image' || vm.md == 'marquee')    // game image, just a static image
            {
               vm.updateImage = updateImage;
            }
            else    // kidgame, favorite, hidden - a toggle image
            {
               // set up ON / OFF images
               if (!vm.obj.img_url_on)
               {
                  var img_url;
                  if (vm.obj.div)
                  {
                     img_url = vm.obj.div['background-image'];
                     vm.obj.div.cursor = 'pointer';
                  }
                  else if (vm.obj.img)
                  {
                     //img_url = vm.obj.img['content'];
                     vm.obj.img.cursor = 'pointer';
                  }

                  if (img_url && img_url.match(/color=/))
                  {
                     var on_color;
                     var off_alpha;
                     vm.obj.img_url_on = img_url;
                     vm.obj.img_url_off = '';
                     off_alpha = '50';
                     if (vm.md == 'kidgame')
                     {
                        on_color = 'B58151'; // brown teddy
                     }
                     else if (vm.md =='favorite')
                     {
                        on_color = 'DD3000'; // red heart
                     }
                     else if (vm.md =='hidden')
                     {
                        on_color = '444488'; // red heart
                     }
                     if(on_color)
                     {
                        vm.obj.img_url_on =
                           img_url.replace(/color=[0-9a-f]*/i,'color='+on_color);
                     }
                     if(off_alpha)
                     {
                       vm.obj.img_url_off =
                           img_url.replace(/(color=[0-9a-f]{6})[0-9a-f]*/i,'$1'+off_alpha);
                     }
                  }
               }

               vm.updateImage = updateToggleImage;
               vm.click = click;
            }

            // watch for theme change
            $scope.$watch('obj', vm.updateImage);

            // watch for current game change, update image using meta data value
            $scope.$watch('vm.game.'+vm.md, vm.updateImage);
         }
      }


      function updateImage()
      {
         if (vm.game && vm.game[vm.md] && ! vm.game[vm.md+'_missing'])
         {
            // set up Game image
            if (!vm.game[vm.md+'_url'])
            {
               vm.game[vm.md+'_url'] = GameService
                   .getImageUrl('svr/roms/'+vm.game.sys, vm.game[vm.md]);
            }
            if (vm.obj.div)
            {
               vm.obj.div['background-image'] = vm.game[vm.md+'_url'];
            }
            else if (vm.obj.img)
            {
               vm.obj.img['content']          = vm.game[vm.md+'_url'];
               //vm.src = vm.game[vm.md+'_url'];
            }
         }
         else
         {
            if (vm.obj.div)
            {
               delete vm.obj.div['background-image'];
            }
            else if (vm.obj.img)
            {
               delete vm.obj.img['content'];
               //delete vm.src;
            }
         }
//console.log('themeImage.content = ' + vm.obj.img.content);
//if(vm.obj.div)
   //console.log('themeImage.background-image = ' + vm.obj.div['background-image']);
//else
   //console.log('themeImage.src = ' + vm.src);
      }

      // click to toggle ON or OFF
      function click($event)
      {
         $event.stopPropagation();
         if (!config.env.read_only)
         {
            vm.game[vm.md] = !vm.game[vm.md];
            GameService.md_changed(vm.md, true, vm.game);
            updateToggleImage();
         }
         util.defaultFocus();
      }

      function updateToggleImage()
      {
         if (vm.game && vm.game[vm.md])
         {
            if (!config.env.read_only)
            {
               vm.title = 'Click to turn '+config.lang.md_labels[vm.md]+' OFF';
            }
            if (vm.obj.div)
            {
               vm.obj.div['background-image'] = vm.obj.img_url_on;
            }
            else if (vm.obj.img)
            {
               vm.obj.img['content'] = vm.obj.img_url_on;
               //vm.src = vm.obj.img_url_on;
            }
         }
         else
         {
            if (!config.env.read_only)
            {
               vm.title = 'Click to turn '+config.lang.md_labels[vm.md]+' ON';
            }

            if (vm.obj.div)
            {
               vm.obj.div['background-image'] = vm.obj.img_url_off;
            }
            else if (vm.obj.img)
            {
               vm.obj.img['content'] = vm.obj.img_url_off;
               //vm.src = vm.obj.img_url_off;
            }
         }
//if(vm.obj.div)
   //console.log('themeImage.background-image = ' + vm.obj.div['background-image']);
//else
   //console.log('themeImage.src = ' + vm.src);
      }

   }

})();

