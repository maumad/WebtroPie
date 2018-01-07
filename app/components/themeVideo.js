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
            template: '<div class="themeVideo">'+
                          '<video ng-show="vm.video_url"'+
                                ' ng-style="vm.obj.div"'+
                                ' ng-src="{{vm.video_url}}" loop'+
                                ' on-load-video="vm.videoLoaded($event, width, height, size, mtime)"'+
                                ' ng-click="vm.togglePlayPause()">'+
                                '</video>'+
                          '<div ng-style="vm.obj.div" ng-if="!vm.video_url && '+
                                'vm.obj.div[\'background-image\']"></div>'+
                          '<div class="info" ng-if="vm.video_url"'+
                                ' ng-style="vm.obj.div">'+
                             '<div class="controls play">'+
                                 '<span ng-show="vm.video.paused"'+
                                      ' ng-click="vm.video.play()">'+
                                      '{{app.config.lang.button.play}}</span>'+
                                 '<span ng-hide="vm.video.paused"'+
                                      ' ng-click="vm.video.pause()">'+
                                      '{{app.config.lang.button.pause}}</span>'+
                             '</div>'+
                          '</div>'+
                      '<div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { game:'=', obj:'=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','GameService','$element','util','config','$timeout'];

    function controller($scope, GameService, $element, util, config, $timeout)
    {
        var vm = this;
        vm.$onInit = onInit;
        vm.togglePlayPause = togglePlayPause;
        vm.videoLoaded = videoLoaded;

        function onInit()
        {
            if (vm.obj.delay && typeof vm.obj.delay == 'string')
            {
                vm.obj.delay = parseFloat(vm.obj.delay);
            }

            // watch for theme change
            $scope.$watch('vm.obj', updateVideo);

            // watch for current game change, update video using meta data value
            $scope.$watch('vm.game', updateVideo);
        }

        function videoLoaded($event, width, height, size, mtime)
        {
            if (vm.video)
            {
                $scope.$watch(function() { return config.app.AutoplayVideos; }, setAutoplay);
                $scope.$watch(function() { return config.app.ShowVideoControls; }, setControls);
                $scope.$watch(function() { return config.app.MuteVideos; }, setMuted);
            }
            vm.video = $event.target;
            updateVideo();
        }

        function setAutoplay(new_val, old_val)
        {
            if (new_val != old_val)
            {
                if (config.app.AutoplayVideos)
                {
                    vm.video.play();
                }
                else
                {
                    vm.video.pause();
                }
            }
        }

        function setControls(new_val, old_val)
        {
            if (config.app.ShowVideoControls)
            {
                vm.video.setAttribute("controls", "controls");
            }
            else
            {
                vm.video.removeAttribute("controls");
            }
        }

        function setMuted()
        {
            if (config.app.MuteVideos)
            {
                vm.video.muted = true;
            }
            else
            {
                vm.video.muted = false;
            }
        }

        // click on video to pause/play video
        function togglePlayPause()
        {
            if (vm.video)
            {
                if (vm.video.paused)
                {
                    vm.video.play();
                }
                else
                {
                    vm.video.pause();
                }
            }
        }

        function updateVideo()
        {
            delete vm.obj.div['background-image'];
            if (vm.game)
            {
                // get video url or show image
                if (vm.game.video_url)
                {
                    vm.video_url = 'svr/'+vm.game.video_url;
                }
                else if (vm.obj.fulldefault)
                {
                    vm.video_url = vm.obj.fulldefault;
                }
                else if (vm.obj.showSnapshotNoVideo == 'true' && vm.game.image_url)
                {
                    if (vm.video)
                    {
                        vm.video.pause();
                        delete vm.video;
                    }
                    vm.video_url = '';
                    vm.obj.div['background-image'] = 'url("svr/'+vm.game.image_url+'")';
                }
            }

            // after a game change autoplay video after theme delay seconds
            if (vm.video && config.app.AutoplayVideos)
            {
                if (vm.obj.delay)  // play after delay seconds
                {
                    $timeout(function () {
                        vm.video.play();
                    }, vm.obj.delay * 1000);
                }
                else  // play now
                {
                    vm.video.play();
                }
            }
        }
    }

})();

