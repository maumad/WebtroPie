'use strict';

angular.module('WebtroPie.game_editor', [])

.controller('GameEditorCtrl', ['$scope','GameService','ThemeService','util','config','$http',
function($scope, GameService, ThemeService, util, config, $http)
{
  $scope.gameImageStyle = function(path, filename)
  {
     if (filename)
     {
        return { 'background-image':
                  GameService.getImageUrl(path, filename) }
     }
  }

  $scope.editorButtonKeyPress = function($event)
  {
//console.log('key codea '+ $event.keyCode);
     if ($event.keyCode == 27)       // Escape
     {
        GameService.hideEditor();
     }
     else if ($event.keyCode == 37 )  // left arrow
     {
        $event.preventDefault();
        util.prevButton($event.srcElement);
     }
     else if ($event.keyCode == 39)   // right arrow
     {
        $event.preventDefault();
        util.nextButton($event.srcElement);
     }
  }

  $scope.editorKeyPress = function($event)
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
              $event.keyCode != 35)   // End key: bottom of list
        util.keyPressCallback($event);
*/
  }

}])
/*
.directive('filesUpload', function()
{
   return {
      template: '<form class="upload" method="post" action="" enctype="multipart/form-data">'+
                  '<icon svg="'+"'resources/upload.svg'"+'"></icon>'+
                  '<input class="uploadfile" type="file" name="files[]"'+
                  ' data-multiple-caption="{{files.length}} files selected" multiple />'+
                  '<label>Choose a marquee file or drag it here.</label>'+
                  '<button type="submit">Upload</button>'+
                '</form>',

      link: function (scope, element, attrs)
      {
      }
   };
})
*/
.directive('gameEditor', function($timeout)
{
   return {
      templateUrl: 'game_editor.html',

      link: function (scope, element, attrs)
      {
         // focus on the first visible button
         scope.focusFirstButton = function()
         {
            var el = element.find( "button" );
            if (el)
            for (var i = 0; i<el.length; i++)
            {
               if (el[i].className != 'ng-hide')
               {
                  el[i].focus();
                  break;
               }
            }
         }
         $timeout(function() {
            scope.focusFirstButton();
         });
      }
   };
})
// copies selected files into ngModel
// which in turn should fire ngChange
.directive('fileSelector', function()
{
   return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, ngModel) {
        element.bind('change', function(e) {
          if (element[0].value)
          {
             ngModel.$setViewValue(element[0].files);
          }
        });
      }
   };
})
// copies selected files into ngModel
// which in turn should fire ngChange
.directive('mdMediaUpload', function(GameService)
{
   return {
      restrict: 'EA',
         scope: {md:'@', accept:'@'}, // image, marquee or video
      template:
        '<form class="upload" novalidate'+
            ' ng-hide="GameService.game[md] && !GameService.game[md+\'_missing\']">'+
            '<div ng-show="uploading" class="progressbar"'+
                ' ng-style="{width: progress+\'%\'}">{{progress}}%'+
            '</div>'+
            '<div ng-hide="uploading">'+
              '<icon svg="\'resources/upload.svg\'"></icon>'+
              '<input class="uploadfile" type="file" accept="image/*"'+
                    ' ng-model="files" file-selector id="{{md}}_files"'+
                    ' ng-change="upload(files)"/>'+
              '<label for="{{md}}_files">'+
                    'Choose or drag a {{md}} file.</label>'+
            '</div>'+
        '</form>',
      link: function(scope, element, attrs, ngModel) {
        element.bind('dragover', function(e) {
           e.stopPropagation();
           e.preventDefault();
        })
        .bind('drop', function(e) {
           e.stopPropagation();
           e.preventDefault();
           scope.upload(e.dataTransfer.files);
        });
      },
      controller: function($scope, $http)
      {
         $scope.GameService = GameService;
         $scope.upload = function(files) {
            if (files.length)
            {
               var formData = new FormData();
               formData.append('upload', files[0]);
               formData.append('system', GameService.game.sys);
               formData.append('path', $scope.md+'s');
               $scope.progress = 0;
               $scope.uploading = true;
               //formData.append('filename', files[0].name);
               $http({
                  url: 'svr/gamelist_edit.php',
                  method: "POST",
                  data: formData,
                  headers: {'Content-Type': undefined},
                  uploadEventHandlers: {
                     progress: function(e) {
                        if (e.lengthComputable) {
                           $scope.progress = (e.loaded / e.total) * 100;
                        }
                     }
                  }
               })
               .then(function onSuccess(response) {
                  // file uploaded so update gamelist game metadata
                  if (response.data.success)
                  {
                     // E.g. set game.video = "videos/filename"
                     GameService.game[$scope.md] = $scope.md+'s/' + files[0].name;
                     // flag that the field has changed
                     GameService.md_changed($scope.md);
                     // trigger digest cycle now so there's no visual delay
                     $scope.$parent.$evalAsync();
                     // finished
                     $scope.uploading = false;
                     $scope.progress = 0;
                  }
               });
            }
         }
      }
   };
});
