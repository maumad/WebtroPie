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
            template: '<div id={{vm.obj.name}} title="{{vm.title}}" '+
                               'ng-click="vm.click($event)">'+
                          '<div ng-if="vm.obj.div" ng-style="vm.obj.div"></div>'+
                          '<img ng-if="vm.obj.img_src" '+
                               'ng-src="{{vm.obj.img_src}}" '+
                               'ng-style="vm.obj.img">'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { obj:'=', game:'=', type:'@', systemName:'=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','config','util','GameService','ThemeService'];

    function controller($scope, config, util, GameService, ThemeService)
    {
        var vm = this;

        vm.$onInit = onInit;

        function onInit()
        {
            if (vm.obj &&
                vm.obj.name &&
                vm.obj.name.substring(0,3) == 'md_')
            {
                vm.md = vm.obj.name.substring(3);

                if (vm.md == 'image' || vm.md == 'marquee')     // game image, just a static image
                {
                    vm.updateImage = updateImage;
                }
                else     // kidgame, favorite, hidden - a toggle image
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
                $scope.$watch('vm.obj', vm.updateImage);

                // watch for current game change, update image using meta data value
                $scope.$watch('vm.game.'+vm.md, vm.updateImage);
            }
            else if(vm.obj.background_orig)
            {
                $scope.$watch('vm.systemName', updateBackgroundImageSystemVariable);
            }
            else if(vm.obj.div &&
                    vm.obj.div['background-image'] &&
                    vm.obj.div['background-image'].indexOf('$')>=0)
            {
                vm.obj.background_orig = vm.obj.div['background-image'];
                $scope.$watch('vm.systemName', updateBackgroundImageSystemVariable);
            }
            else if(vm.obj.img_src_orig)
            {
                $scope.$watch('vm.systemName', updateImageSourceSystemVariable);
            }
            else if(vm.obj.img_src && vm.obj.img_src.indexOf('$')>=0)
            {
                vm.obj.img_src_orig = vm.obj.img_src;
                $scope.$watch('vm.systemName', updateImageSourceSystemVariable);
            }
        }

        function updateBackgroundImageSystemVariable(system_name)
        {
            if (system_name)
            {
                vm.obj.div['background-image'] = ThemeService.variableReplace(vm.obj.background_orig, system_name);
            }
        }

        function updateImageSourceSystemVariable(system_name)
        {
            if (system_name)
            {
                vm.obj.img_src = ThemeService.variableReplace(vm.obj.img_src_orig, system_name);
            }
        }

        function updateImage(new_val, old_val)
        {
            if (vm.game && vm.game[vm.md+'_url'])
            {
                if (vm.obj.div)
                {
                    vm.obj.div['background-image'] = 'url("svr/'+vm.game[vm.md+'_url']+'")';
                }
                else if (vm.obj.img)
                {
                    vm.obj.img_src = 'svr/'+vm.game[vm.md+'_url'];
                }
                if (vm.game[vm.md+'_width'] && vm.game[vm.md+'_height'])
                {
                    vm.title = vm.game[vm.md+'_width'] +' x ' + vm.game[vm.md+'_height'];
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
                    delete vm.obj.img_src;
                }
            }

        }

        // click to toggle ON or OFF
        function click($event)
        {
            $event.stopPropagation();
            if (!config.env.read_only)
            {
                vm.game[vm.md] = !vm.game[vm.md];
                GameService.mdChanged(vm.md, true, vm.game);
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
                    vm.obj.img_src = vm.obj.img_url_on;
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
                    vm.obj.img_src = vm.obj.img_url_off;
                }
            }
        }
    }

})();

