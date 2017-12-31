/**
 * gameEditor.js
 *
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_editor', [])
        .directive('gameEditor', gameEditor);

    function gameEditor()
    {
        var directive = {
            templateUrl: 'components/gameEditor.html',
            scope: true,
            controller: GameEditorCtrl,
            controllerAs: 'vm',
            bindToController: { game:'=', selectedList:'=' }
        }
        return directive;
    }

    GameEditorCtrl.$inject = ['$scope','$element','$http','util','GameService','ThemeService'];

    function GameEditorCtrl($scope, $element, $http, util, GameService, ThemeService)
    {
        var vm = this

        // member functions
        vm.$onInit = onInit;
        vm.clearMedia = clearMedia;
        vm.editorButtonKeyPress = editorButtonKeyPress;
        vm.editorKeyPress = editorKeyPress;
        vm.focusFirstButton = focusFirstButton;
        vm.gameImageStyle = gameImageStyle;
        vm.gamePreviewStyle = gamePreviewStyle;
        vm.mdChanged = mdChanged;

        function onInit()
        {
            util.waitForRender($scope).then(focusFirstButton);
            getImageStats();
        }

        // get images (does not cause a second http request)
        function getImageStats()
        {
            if(vm.game['image_url'])
            {
                angular.element('<img/>')
                .attr('src', 'svr/'+vm.game['image_url'])
                .on('load', function() {
                    vm.image_w = this.width;
                    vm.image_h = this.height;
                    var url = this.src || this.href;
                    var iTime = performance.getEntriesByName(url)[0];
                    vm.image_size = util.humanSize(iTime.encodedBodySize);
                    this.remove(); // prevent memory leaks
                    if (vm.game.image == vm.game.reset.image)
                    {
                        ['url','w','h','size','modified','modofied_ago']
                        .forEach(function(f) {
                            vm.game.reset['image_'+f] = vm.game['image_'+f];
                        });
                    }
                });

                var image_mtime = parseInt(vm.game['image_url'].replace(/^.*\?/,''));
                if (image_mtime)
                {
                    vm.image_modified = util.formatDate(image_mtime);
                    vm.image_modified_ago = util.formatDate(image_mtime,'ago');
                }
            }
            if(vm.game['marquee_url'])
            {
                angular.element('<img/>')
                .attr('src', 'svr/'+vm.game['marquee_url'])
                .on('load', function() {
                    vm.marquee_w = this.width;
                    vm.marquee_h = this.height;
                    var url = this.src || this.href;
                    var iTime = performance.getEntriesByName(url)[0];
                    vm.marquee_size = util.humanSize(iTime.encodedBodySize);
                    this.remove(); // prevent memory leaks
                    if (vm.game.marquee == vm.game.reset.marquee)
                    {
                        ['url','w','h','size','modified','modofied_ago']
                        .forEach(function(f) {
                            vm.game.reset['marquee_'+f] = vm.game['marquee_'+f];
                        });
                    }
                });
                var marquee_mtime = parseInt(vm.game['marquee_url'].replace(/^.*\?/,''));
                if (marquee_mtime)
                {
                    vm.marquee_modified = util.formatDate(marquee_mtime);
                    vm.marquee_modified_ago = util.formatDate(marquee_mtime,'ago');
                }
            }
        }

        function clearMedia(md)
        {
            vm.game[md]='';
            vm.game[md+'_url']='';
            vm.game[md+'_w']='';
            vm.game[md+'_h']='';
            vm.game[md+'_size']='';
            vm.game[md+'_modified']='';
            vm.game[md+'_modified_ago']='';
            vm.mdChanged(md);
        }

        function editorButtonKeyPress($event)
        {
            if ($event.keyCode == 27)         // Escape
            {
                GameService.hideEditor();
            }
            else if ($event.keyCode == 37 )  // left arrow
            {
                $event.preventDefault();
                util.prevButton($event.srcElement);
            }
            else if ($event.keyCode == 39)    // right arrow
            {
                $event.preventDefault();
                util.nextButton($event.srcElement);
            }
        }

        function editorKeyPress($event)
        {
            if ($event.keyCode == 27)  // Escape
            {
                GameService.hideEditor();
            }
/*
            else if ($event.keyCode != 13 && // enter
                     $event.keyCode != 39 && // right arrow: system right
                     $event.keyCode != 37 && // left arrow: system left
                     $event.keyCode != 36 && // Home key: top of list
                     $event.keyCode != 35)    // End key: bottom of list
                util.keyPressCallback($event);
*/
        }

        function focusFirstButton()
        {
            var el = $element.find( "button" );
            if (el)
            for (var i = 0; i<el.length; i++)
            {
                if(!el[i].className)
                {
                    el[i].focus();
                    break;
                }
            }
        }

        function gameImageStyle(md)
        {
            if (vm.game[md+'_url'])
            {
                return { 'background-image': 'url("svr/'+vm.game[md+'_url']+'")' }
            }
        }

        function gamePreviewStyle(md)
        {
            if (vm.game[md+'_url'])
            {
                return { 'background-image': 'url("svr/'+vm.game[md+'_url']+'")',
                            width: vm[md+'_w']+'px',
                            height: vm[md+'_h']+'px' }
            }
        }

        function mdChanged(field)
        {
            GameService.mdChanged(field, false, vm.game, GameService.editAll, vm.selectedList)
        }

    }

})();
