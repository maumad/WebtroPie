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
                    this.remove(); // prevent memory leaks
                });
            }
            if(vm.game['marquee_url'])
            {
                angular.element('<img/>')
                .attr('src', 'svr/'+vm.game['marquee_url'])
                .on('load', function() {
                    vm.marquee_w = this.width;
                    vm.marquee_h = this.height;
                    this.remove(); // prevent memory leaks
                });
            }
        }

        function clearMedia(md)
        {
            vm.game[md]='';
            vm.game[md+'_url']='';
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

        function mdChanged(field)
        {
            GameService.mdChanged(field, false, vm.game, GameService.editAll, vm.selectedList)
        }

    }

})();
