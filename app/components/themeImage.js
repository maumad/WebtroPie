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
            template: '<div id="{{vm.obj.name}}" '+
                               'title="{{vm.title}}" '+
                               'ng-click="vm.click($event)">'+
                          '<div ng-if="!vm.obj.img" ng-style="vm.obj.style"></div>'+
                          '<img ng-if="vm.obj.img && vm.obj.img_src" '+
                               'ng-src="{{vm.obj.img_src}}" '+
                               'ng-style="vm.obj.style">'+
                               //'[{{vm.obj.img_src}}]'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { obj:'=', game:'=', type:'@', system:'=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','config','util','GameService','styler'];

    function controller($scope, config, util, GameService, styler)
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
                        if (vm.obj.style)
                        {
                            img_url = vm.obj.style['background-image'];
                            vm.obj.style.cursor = 'pointer';
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

                // watch for theme or view change
                $scope.$watch('vm.obj', vm.updateImage);

                // watch for current game change, update image using meta data value
                $scope.$watch('vm.game.'+vm.md+'_url', vm.updateImage);
            }
            else
            {
                if (vm.obj.img)
                {
                    vm.obj.img_src_orig = vm.obj.img_src;
                }
                else if(vm.obj.style)
                {
                    vm.obj.background_orig = vm.obj.style['background-image'];
                }
                else
                {
                    vm.obj.img_src_orig = vm.obj.img_src || vm.obj.fullpath;
                }
                // watch for theme or view change
                $scope.$watch('vm.obj', updateImageSystemVariable);
            }
        }

        function updateImageSystemVariable()
        {
            // replace system variables
            if (vm.system)
            {
                if (vm.obj.img)
                {
                    vm.obj.img_src = styler.variableReplace(vm.obj.img_src_orig, vm.system);
                }
                else if(vm.obj.style)
                {
                    vm.obj.style['background-image'] = styler.variableReplace(vm.obj.background_orig, vm.system);
                }
                else
                {
                    vm.obj.img_src = styler.variableReplace(vm.obj.img_src_orig, vm.system);
                }
            }
        }

        function updateImage(new_val, old_val)
        {
            if (vm.game && vm.md && vm.game[vm.md+'_url'])
            {
                //var url = styler.variableReplace(vm.game[vm.md+'_url'], vm.system);
                var url = 'svr/'+vm.game[vm.md+'_url'];
                if (vm.obj.img)
                {
                    vm.obj.img_src = url;
                }
                else if(vm.obj.style)
                {
                    vm.obj.style['background-image'] = 'url("'+url+'")';
                }

                if (vm.game[vm.md+'_width'] && vm.game[vm.md+'_height'])
                {
                    vm.title = vm.game[vm.md+'_width'] +' x ' + vm.game[vm.md+'_height'];
                }
            }
            else
            {
                if (vm.obj.img)
                {
                    if (vm.game && !vm.game.image_url && vm.obj.fulldefault)
                    {
                        vm.obj.img_src = vm.obj.fulldefault;
                    }
                    else
                    {
                        delete vm.obj.img_src;
                    }
                }
                else if(vm.obj.style)
                {
                    if (vm.game && !vm.game.image_url && vm.obj.fulldefault)
                    {
                        vm.obj.style['background-image'] = vm.obj.fulldefault;
                    }
                    else
                    {
                        delete vm.obj.style['background-image'];
                    }
                }
            }
        }

        // click to toggle ON or OFF
        function click($event)
        {
            $event.stopPropagation();
            if (config.edit)
            {
                vm.game[vm.md] = !vm.game[vm.md];
                GameService.mdChanged(vm.md, true, vm.game);
                updateToggleImage();
            }
        }

        function updateToggleImage()
        {
            if (vm.game && vm.game[vm.md])
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' OFF';
                }
                if (vm.obj.img)
                {
                    vm.obj.img_src = vm.obj.img_url_on;
                }
                else if(vm.obj.style)
                {
                    vm.obj.style['background-image'] = vm.obj.img_url_on;
                }
            }
            else
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' ON';
                }

                if (vm.obj.img)
                {
                    vm.obj.img_src = vm.obj.img_url_off;
                }
                else if(vm.obj.style)
                {
                    vm.obj.style['background-image'] = vm.obj.img_url_off;
                }
            }
        }
    }

})();

