/**
 * themeVideo.js
 *
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeVideo', themeVideo);

    function themeVideo() {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<div>'+
                          '<video ng-style="vm.obj.div" ng-if="vm.video_url"'+
                                ' ng-src="{{vm.video_url}}" autoplay loop></video>'+
                          '<div ng-style="vm.obj.div" ng-if="!vm.video_url && '+
                                'vm.obj.div[\'background-image\']"></div>'+
                      '<div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { game:'=', obj:'=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','GameService'];

    function controller($scope, GameService)
    {
        var vm = this;

        // watch for theme change
        $scope.$watch('vm.obj', updateVideo);

        // watch for current game change, update image using meta data value
        $scope.$watch('vm.game', updateVideo);

        function updateVideo()
        {
            delete vm.obj.div['background-image'];
            if (vm.game && vm.game.video_url)
            {
                if (vm.game.video_url)
                {
                    vm.video_url = 'svr/'+vm.game.video_url;
                }
                else if (vm.obj.fulldefault)
                {
                    vm.video_url = vm.obj.fulldefault;
                }
                else if (vm.obj.showSnapshotNoVideo == 'true' && vm.game.image)
                {
                    vm.video_url = '';
                    vm.obj.div['background-image'] = vm.game.image_url;
                    if (!vm.obj.div.width)
                    {
                        vm.obj.div.width = vm.obj.div['max-width'];
                        vm.obj.div.height = vm.obj.div['max-height'];
                    }
                }
                if (vm.video_url && vm.obj.div &&
                     vm.obj.div.width && vm.obj.div['max-width'])
                {
                    delete vm.obj.div.width;
                    delete vm.obj.div.height;
                }
            }
        }
    }

})();

