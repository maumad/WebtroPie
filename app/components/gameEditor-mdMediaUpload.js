/**
 * gameEditor-fileSelector.js
 *
 * copies selected files into ngModel
 * which in turn should fire ngChange
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_editor')
        .directive('mdMediaUpload', mdMediaUpload);

    function mdMediaUpload()
    {
        var directive = {
            restrict: 'EA',
            scope: true,
            template:
          '<form class="upload" novalidate'+
                ' ng-hide="app.GameService.game[vm.md] && '+
                ' app.GameService.game[vm.md+\'_url\']">'+
              '<div ng-show="vm.uploading" class="progressbar"'+
                  ' ng-style="{width: vm.progress+\'%\'}">{{vm.progress}}%'+
              '</div>'+
              '<div ng-hide="vm.uploading">'+
                  '<icon svg="\'resources/upload.svg\'"></icon>'+
                  '<input class="uploadfile" type="file" accept="image/*"'+
                       ' ng-model="vm.files" file-selector id="{{::vm.md}}_files"'+
                       ' ng-change="upload(vm.files)"/> '+
                  '<label for="{{::vm.md}}_files">'+
                       'Choose or drag a {{::vm.md}} file.</label>'+
              '</div>'+
          '</form>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { md:'@', accept:'@' }
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','$http','GameService','util'];

    function controller($scope, $element, $http, GameService, util)
    {
        var vm = this

        // member functions
        vm.$onInit = onInit;

        function onInit()
        {
            util.waitForRender($scope).then(bindDropToUpload);
        }

        function bindDropToUpload()
        {
            $element
            .bind('dragover', function(e) {
                e.stopPropagation();
                e.preventDefault();
            })
            .bind('drop', function(e) {
                e.stopPropagation();
                e.preventDefault();
                upload(e.dataTransfer.files);
            });
        }

        function upload(files)
        {
            if (files.length)
            {
                var formData = new FormData();
                formData.append('upload', files[0]);
                formData.append('system', GameService.game.sys);
                formData.append('game_path', GameService.game.path);
                formData.append('media', vm.md);
                vm.progress = 0;
                vm.uploading = true;
                //formData.append('filename', files[0].name);
                $http({
                    url: 'svr/game_media_upload.php',
                    method: "POST",
                    data: formData,
                    headers: {'Content-Type': undefined},
                    uploadEventHandlers: { progress: uploading }
                })
                .then(uploaded);
            }
        }

        function uploading(e)
        {
            if (e.lengthComputable)
            {
                vm.progress = (e.loaded / e.total) * 100;
            }
        }

        function uploaded(response)
        {
            // file uploaded so update gamelist game metadata
            if (response.data.success)
            {
                // E.g. set game.video = "videos/filename"
                GameService.game[vm.md] = response.data.media_path;
                GameService.game[vm.md+'_url'] = response.data.media_url;
                // flag that the field has changed
                GameService.mdChanged(vm.md);
                // trigger digest cycle now so there's no visual delay
                $scope.$parent.$evalAsync();
                // finished
                vm.uploading = false;
                vm.progress = 0;
            }
        }
    }

})();
