'use strict';

angular.module('WebtroPie.theme_components', [])
.directive('icon', function() {
   return {
      restrict: 'E', replace: true, scope: { svg:'=', color:'=' },
      template: '<img class="icon" ng-style="img">',
      controller: function($scope, util, ThemeService)
      {
         $scope.img = {};
         $scope.ThemeService = ThemeService;
         $scope.updateThemeColor = function()
         {
            var color = ($scope.color || ThemeService.helpTextColor).substring(0,6);
            $scope.img.content = "url(svr/color_img.php?" +
                                 "file=" + $scope.svg +
                                 "&color="+color+")";
         }
         $scope.$watch('ThemeService.helpTextColor', $scope.updateThemeColor);
      }
   };
})
// makes a silhouette of all foreground including icons, background is helpbar foreground color
// mouseover inverts colors
/*
                  // invert foreground - background svg filter
                  '<svg class="ng-hide" xmlns="http://www.w3.org/2000/svg" version="1.1">'+
                    '<defs>'+
                       '<filter id="helpinv">'+
                          // alpha is reversed
                          // foreground (multicolor) becomes transparent
                          // background (transparent) becomes textcolor
                          '<feColorMatrix in="SourceGraphic" mode="matrix" values="'+
                            '0 0 0 -1 {{textcolor_r}} '+
                            '0 0 0 -1 {{textcolor_g}} '+
                            '0 0 0 -1 {{textcolor_b}} '+
                            '0 0 0 -1 1" />'+
                       '</filter>'+
                     '</defs>'+
                  '</svg>'+
 //'<div class="filters click" ng-style="hover?{filter: url("../#helpinv")}:{}">'+
*/
.directive('helpInverter', function() {
   return {
      restrict: 'EA', replace: true, transclude: true, scope: {},
      template: function( element, attrs ) {
         var tag = element[0].nodeName;
         return '<'+tag+' class="click"'+
                    ' ng-style="hover?ThemeService.helpInverseBackground:{}"'+
                    ' ng-mouseover="hover=true"'+
                    ' ng-mouseout="hover=false">'+
                    '<span ng-class="hover?ThemeService.helpInverseForegroundClass:\'\'">'+
                      '<ng-transclude></ng-transclude>'+
                    '</span>'+
                '</'+tag+'>';
      },
      controller: function($scope, ThemeService)
      {
         $scope.ThemeService = ThemeService;
      }
   };
})
.directive('helpmenu', function(ThemeService) {
   return {
      restrict: 'E', replace: true, transclude: true,
      scope: { list:'=', obj:'=' },
      //templateUrl: 'helpbar.html',
      template: '<div class="helpsystembar" ng-style="obj.div">'+
                  '<span ng-repeat="item in list" class="dropdown"'+
                       ' ng-click="item.click()"'+
                       ' ng-mouseover="hover=true"'+
                       ' ng-mouseout="hover=false"'+
                       ' ng-show="show(item)">'+
                    '<div class="filters" help-inverter>'+
                       '<icon svg="item.svg" color="item.color||obj.iconcolor.hex"></icon>'+
                       "{{item.langButton?' '+config.lang.buttons[item.langButton]:''}}"+
                    '</div>'+
                    '<div ng-class="ThemeService.helpMenuOptionClasses"'+
                        ' ng-style="ThemeService.helpTextColorBorder"'+
                        ' ng-show="hover && item.menu"'+
                        ' ng-click="hover=false">'+
                      '<a ng-repeat="option in item.menu" help-inverter'+
                        ' ng-click="option.click()" >{{option.text}}</a>'+
                    '</div>'+
                  '</span>'+
                  '<ng-transclude></ng-transclude>'+
                '</div>',
      controller: function($scope, config, GameService)
      {
         $scope.config = config;
         $scope.ThemeService = ThemeService;
         $scope.GameService = GameService;

         // show when there is no show expression
         // or when show expression is true
         $scope.show = function(item)
         {
            if (!item)
            {
               return false;
            }
            else if (!item.show) // no show expression
            {
               return true;
            }
            $scope.$eval('result=' + item.show);
            return $scope.result;
         }
      }
   };
})
.directive('logo', function() {
   return {
      restrict: 'E', replace: true, scope: { obj:'=' },
      template: '<button class="systemlogo"'+
                ' style="background-image: {{obj.logo}}">'+
                 '{{obj.logo ? "" : obj.name }}'+
                '</button>'
   };
})
.directive('themeText', function(GameService, ThemeService) {
   return {
      restrict: 'E', replace: true, scope: { obj:'=' },
      template: '<div id="{{obj.name}}" ng-show="obj.div" ng-style="obj.div" '+
                   ' class="{{obj.multiline?\'text_multiline\':\'text\'}}">'+
                   '{{text}}'+
                   '<theme-text ng-if="text_obj" obj="text_obj"></theme-text>'+
                   '<theme-date ng-if="date_obj" obj="date_obj" text="date_text"></theme-date>'+
                   '</div>',
      controller: function($scope)
      {
         $scope.GameService = GameService;
         $scope.$watch('GameService.game', function(game)
         {
            $scope.text = GameService.getGameMetadata(game, $scope.obj);
            //if ($scope.text_obj)
               //$scope.md_text = GameService.getGameMetadata(game, $scope.text_obj);
            //else
            if ($scope.date_obj)
               $scope.date_text = GameService.getGameMetadata(game, $scope.date_obj);
         });
         $scope.$watch('obj', function()
         {
            if ($scope.obj.name && $scope.obj.name.substring(0,7)=="md_lbl_")
            {
               $scope.md = $scope.obj.name.substring(7);
               if ($scope.md != 'rating')
               {
                  var obj;
                  if (ThemeService.view.datetime)
                  {
                     obj = ThemeService.view.datetime['md_'+$scope.md];
                     if (obj && obj.div && obj.div.display == 'inline')  // no position
                     {
                        $scope.date_obj = obj;
                     }
                  }
                  if (!obj)
                  {
                     obj = ThemeService.view.text['md_'+$scope.md];
                     if (obj && obj.div && obj.div.display == 'inline')  // no position
                     {
                        $scope.text_obj = obj;
                     }
                  }
               }
            }
         });
      }
   };
})
.directive('dateInput', function() {
   return {
      restrict: 'E', replace: false,  scope: {ngModel:'='},
      template: '<input type=date ng-model="date"/>',
      controller: function($scope)
      {
         $scope.$watch('ngModel', function(model)
         {
            if (model == $scope.last_model)
            {
               return;
            }
            var year, month, day, hours, minutes, seconds;
            if (model.length>=4)  year    = parseInt(model.substring(0,4));
            if (model.length>=6)  month   = parseInt(model.substring(4,6));
            if (model.length>=8)  day     = parseInt(model.substring(6,8));
            if (model.length>=11) hours   = parseInt(model.substring(9,11));
            if (model.length>=13) minutes = parseInt(model.substring(11,13));
            if (model.length>=15) seconds = parseInt(model.substring(13,15));
            $scope.last_date = $scope.date = new Date(year, month-1, day, hours, minutes, seconds);
         });
         $scope.$watch('date', function(date)
         {
            if (date == $scope.last_date)
            {
               return;
            }
            if (!date)
            {
               $scope.last_model = $scope.ngModel = null;
            }
            else
            {
               $scope.last_model = $scope.ngModel =
                   date.toISOString().replace(/[:-]/g,'').substring(0,15);
            }
         });
      }
   };
})
/*
                 text="GameService.getGameMetadata(GameService.game, obj)"
*/
.directive('themeDate', function() {
   return {
      restrict: 'E', replace: true, scope: { obj:'=', format:'@', blank: '@' },
      template: '<div id="{{obj.name}}" ng-show="obj.div || blank" ng-style="obj.div" '+
                   ' ng-class="class">'+
                   '{{date}}</div>',
      controller: function($scope, config, GameService)
      {
         $scope.GameService = GameService;
         if ($scope.obj)
         {
            $scope.class = $scope.obj.multiline ? "text_multiline" : "text";
         }

         $scope.$watch('GameService.game', function()
         {
            var text = GameService.getGameMetadata(GameService.game, $scope.obj);
            if (!text)
            {
               $scope.date = '';
               if ($scope.blank)
               {
                  $scope.date = $scope.blank;
               }
               else if ($scope.obj.name == 'md_releasedate')
               {
                  $scope.date = 'Unknown';
               }
               else if ($scope.obj.name == 'md_lastplayed')
               {
                  $scope.date = 'Never';
               }
            }
            else
            {
               $scope.date = config.formatDate(text, $scope.format);
            }
         });
      }
   };
})
// used for gui checkboxes and helpmenu icon toggles
.directive('imageToggle', function(util, config) {
   return {
      restrict: 'E',
      replace: true,
      scope: { ngModel: '=', ngChange: '=',
               onSvg:'@', offSvg:'@', onColor: '@', offColor: '@' },
      template: '<img class="icon click" ng-click="click($event)" ng-style="img">',
      controller: function($scope, ThemeService)
      {
         $scope.img = {};
         $scope.ThemeService = ThemeService;
         $scope.updateImage = function()
         {
            var img   = ( $scope.ngModel ? $scope.onSvg : $scope.offSvg );
            var color = ( $scope.ngModel ? $scope.onColor : $scope.offColor );
            if (color)
            {
               if (color == 'help')
               {
                  color = ThemeService.helpTextColor;
               }
               $scope.img.content = "url(svr/color_img.php?file=" + img + "&color=" + color + ")";
            }
            else
            {
               $scope.img.content = "url(svr/" + img + ")";
            }
         }
         $scope.$watch('ThemeService.helpTextColor', $scope.updateImage);
         $scope.$watch('ngModel', $scope.updateImage);
      },
      link: function (scope, element, attrs)
      {
         if (!attrs.noclick)
         scope.click = function($event)
         {
            $event.preventDefault();
            $event.stopPropagation();
            scope.ngModel = !scope.ngModel;
            scope.updateImage();
            util.defaultFocus();
            if (attrs.ngModel.substring(0,10) == 'config.app')
            {
               config.save(attrs.ngModel.substring(11), scope.ngModel);
            }
            if (attrs.changed)
            {
               scope.$parent.$eval(attrs.changed);
            }
         }
      }
   }
})
// used to toggle boolean game attributes in game editor
.directive('mdImageToggle', function() {
   return {
      restrict: 'E',
      replace: true,
      scope: { game: '=', md:'@', autosave:'@', 
               size: '=', sizeUnits: '@' },
      template: '<img class="icon" ng-click="click($event)" ng-style="img" title={{title}}>',
      controller: function($scope, GameService, util, config)
      {
         if ($scope.md == "hidden")
         {
            $scope.imgUrlOn="url(svr/color_img.php?file=resources/eye.svg&color=444488)";
            $scope.imgUrlOff="url(svr/color_img.php?file=resources/eye.svg&color=55555590)";
         }
         else if ($scope.md == "kidgame")
         {
            $scope.imgUrlOn="url(svr/color_img.php?file=resources/child.svg&color=B58151)";
            $scope.imgUrlOff="url(svr/color_img.php?file=resources/child.svg&color=55555590)";
         }
         else if ($scope.md == "favorite")
         {
            $scope.imgUrlOn="url(svr/color_img.php?file=resources/favorite.svg&color=DD3000)";
            $scope.imgUrlOff="url(svr/color_img.php?file=resources/favorite.svg&color=55555590)";
         }
         //$scope.img = {height: '3vh'};
         $scope.img = {};
         $scope.$watch('size', function(size)
         {
            if (size)
            {
               $scope.img.width = util.pct(size, $scope.sizeUnits);
            }
         });
         $scope.img.cursor = 'pointer';
         $scope.updateImage = function()
         {
            if ($scope.game && $scope.game[$scope.md] )
            {
               if (!config.env.read_only)
               {
                  $scope.title = 'Click to turn '+config.lang.md_labels[$scope.md]+' OFF';
               }
               $scope.img.content = $scope.imgUrlOn;
            }
            else
            {
               if (!config.env.read_only)
               {
                  $scope.title = 'Click to turn '+config.lang.md_labels[$scope.md]+' ON';
               }
               $scope.img.content = $scope.imgUrlOff;
            }
         }
         $scope.$watch('game.'+$scope.md, $scope.updateImage);
         $scope.click = function($event)
         {
            $event.stopPropagation();
            if (!config.env.read_only)
            {
               $scope.game[$scope.md] = !$scope.game[$scope.md];
               GameService.md_changed($scope.md, $scope.autosave, $scope.game);
               $scope.updateImage();
            }
            util.defaultFocus();
         }
      }
   }
})
.directive('themeVideo', function() {
   return {
      restrict: 'E', replace: true, scope: { game: '=', obj: '=' },
      template: '<div>'+
                   '<video ng-style="obj.div" ng-if="video_url"'+
                      ' ng-src="{{video_url}}" autoplay></video>'+
                   '<div ng-style="obj.div" ng-if="!video_url && '+
                               'obj.div[\'background-image\']"></div>'+
                '<div>',
      controller: function($scope, GameService)
      {
         $scope.updateVideo = function()
         {
            if ($scope.game && !$scope.game.video_url)
            {
               if ($scope.game.video)
               {
                  $scope.video_url = 'svr/roms/'+$scope.game.sys+'/'+$scope.game.video;
               }
               else if ($scope.obj.fulldefault)
               {
                  $scope.video_url = $scope.obj.fulldefault;
               }
               else if ($scope.obj.showsnapshotnovideo == 'true' && $scope.game.image)
               {
                  $scope.video_url = '';
                  if (!$scope.game.image_url)
                  {
                     $scope.game.image_url = GameService
                         .getImageUrl('svr/roms/'+$scope.game.sys, $scope.game.image);
                  }
                  $scope.obj.div['background-image'] = $scope.game.image_url;
                  if (!$scope.obj.div.width)
                  {
                     $scope.obj.div.width = $scope.obj.div['max-width'];
                     $scope.obj.div.height = $scope.obj.div['max-height'];
                  }
               }
               if ($scope.video_url && $scope.obj.div &&
                   $scope.obj.div.width && $scope.obj.div['max-width'])
               {
                  delete $scope.obj.div.width;
                  delete $scope.obj.div.height;
               }
            }
         }
         // watch for theme change
         $scope.$watch('obj', function() {
            $scope.updateVideo();
         });
         // watch for current game change, update image using meta data value
         $scope.$watch('game', function() {
            $scope.updateVideo();
         });
      }
   }
})
// theme view images, positioned and styled by theme, some of which can also be toggled
.directive('themeImage', function() {
   return {
      restrict: 'E', replace: true, scope: { obj: '=', type:'@' },
      template: '<div id={{obj.name}} ng-click="click($event)">'+
                  '<div ng-style="obj.div" '+
                        ' title={{title}} ng-if="'+
                        'obj.div[\'background-image\'] || '+
                        'obj.div[\'background-color\']"></div>'+
                  '<img ng-style="obj.img" ng-if="obj.img.content">'+
                '</div>',
      controller: function($scope, GameService, util, config)
      {
         $scope.GameService = GameService;
         if ($scope.obj &&
            $scope.obj.name &&
            $scope.obj.name.substring(0,3) == 'md_')
         {
            $scope.md = $scope.obj.name.substring(3);

            if ($scope.md == 'image' || $scope.md == 'marquee')    // game image
            {
               $scope.updateImage = function(game)
               {
                  if (game && game[$scope.md] && ! game[$scope.md+'_missing'])
                  {
                     // set up Game image
                     if (!game[$scope.md+'_url'])
                     {
                        game[$scope.md+'_url'] = GameService
                            .getImageUrl('svr/roms/'+game.sys, game[$scope.md]);
                     }
                     if ($scope.obj.div)
                     {
                        $scope.obj.div['background-image'] = game[$scope.md+'_url'];
                     }
                     else if ($scope.obj.img)
                     {
                        $scope.obj.img['content']          = game[$scope.md+'_url'];
                     }
                  }
                  else
                  {
                     if ($scope.obj.div)
                     {
                        delete $scope.obj.div['background-image'];
                     }
                     else if ($scope.obj.img)
                     {
                        delete $scope.obj.img['content'];
                     }
                  }
               }
            }
            else    // kidgame, favorite, hidden
            {
               // set up ON / OFF images
               if (!$scope.obj.img_url_on)
               {
                  var img_url;
                  if ($scope.obj.div)
                  {
                     img_url = $scope.obj.div['background-image'];
                     $scope.obj.div.cursor = 'pointer';
                  }
                  else if ($scope.obj.img)
                  {
                     img_url = $scope.obj.img['content'];
                     $scope.obj.img.cursor = 'pointer';
                  }

                  if (img_url && img_url.match(/color=/))
                  {
                     var on_color;
                     var off_alpha;
                     $scope.obj.img_url_on = img_url;
                     $scope.obj.img_url_off = '';
                     off_alpha = '50';
                     if ($scope.md == 'kidgame')
                     {
                        on_color = 'B58151'; // brown teddy
                     }
                     else if ($scope.md =='favorite')
                     {
                        on_color = 'DD3000'; // red heart
                     }
                     else if ($scope.md =='hidden')
                     {
                        on_color = '444488'; // red heart
                     }
                     if(on_color)
                     {
                        $scope.obj.img_url_on =
                           img_url.replace(/color=[0-9a-f]*/i,'color='+on_color);
                     }
                     if(off_alpha)
                     {
                       $scope.obj.img_url_off =
                           img_url.replace(/(color=[0-9a-f]{6})[0-9a-f]*/i,'$1'+off_alpha);
                     }
                  }
               }

               $scope.updateImage = function(game)
               {
                  if (game && game[$scope.md])
                  {
                     if (!config.env.read_only)
                     {
                        $scope.title = 'Click to turn '+config.lang.md_labels[$scope.md]+' OFF';
                     }
                     if ($scope.obj.div)
                     {
                        $scope.obj.div['background-image'] = $scope.obj.img_url_on;
                     }
                     else if ($scope.obj.img)
                     {
                        $scope.obj.img['content'] = $scope.obj.img_url_on;
                     }
                  }
                  else
                  {
                     if (!config.env.read_only)
                     {
                        $scope.title = 'Click to turn '+config.lang.md_labels[$scope.md]+' ON';
                     }
                     //$scope.obj.div['background-image'] = $scope.obj.img_url_off;
                     if ($scope.obj.div)
                     {
                        $scope.obj.div['background-image'] = $scope.obj.img_url_off;
                     }
                     else if ($scope.obj.img)
                     {
                        $scope.obj.img['content'] = $scope.obj.img_url_off;
                     }
                  }
               }

               // click to toggle ON or OFF
               $scope.click = function($event)
               {
                  $event.stopPropagation();
                  if (!config.env.read_only)
                  {
                     var game = GameService.game;
                     game[$scope.md] = !game[$scope.md];
                     GameService.md_changed($scope.md, true, game);
                     $scope.updateImage(game);
                  }
                  util.defaultFocus();
               }
            }
            // watch for theme change
            $scope.$watch('obj', function() {
               $scope.updateImage(GameService.game);
            });
            // watch for current game change, update image using meta data value
            $scope.$watch('GameService.game.'+$scope.md, function() {
               $scope.updateImage(GameService.game);
            });
         }
      }
   };
})
.directive('themeRating', function() {
   return {
      restrict: 'E', scope: { game: '=', obj: '=', autosave: '@',
                              size: '=', sizeUnits: '@' },
      template: '<div class="rating_background" ng-style="div" '+
                       'ng-click="click($event)" title="{{stars.width}}">'+
                  '<div class="rating_foreground" ng-style="stars"></div>'+
                '</div>',
      controller: function($scope, GameService, util, config)
      {
         $scope.defaults = function()
         {
            $scope.div['background-image']='url("svr/resources/star_unfilled.svg")';
            $scope.stars['background-image']='url("svr/color_img.php?file=resources/star_filled.svg&color=FFD400")';
         }
         if(!$scope.obj)
         {
            $scope.div = {};
            $scope.stars = {};
            $scope.defaults();
            $scope.$watch('size', function(size)
            {
               $scope.div.width = util.pct(size, $scope.sizeUnits);
               $scope.div.height = util.pct(size/5, $scope.sizeUnits);
            });
         }
         else // if theme changes swap styles
         {
            $scope.$watch('obj', function(obj)
            {
               if (obj.div)
               {
                  $scope.div = obj.div;
               }
               if (obj.stars)
               {
                  $scope.stars = obj.stars;
                  if (!$scope.stars['background-image'])
                     $scope.defaults();
               }
               $scope.calcStars();
            });
         }

         $scope.calcStars = function()
         {
            if (!$scope.stars)
            {
               return;
            }
            if (!$scope.game ||
               !$scope.game.rating ||
               $scope.game.rating<=0)  // bounds checking
            {
               $scope.stars.width = '0';
            }
            else if ($scope.game.rating >=1)
            {
               $scope.stars.width = '100%';
            }
            else
            {
               $scope.stars.width = (100 * $scope.game.rating)+'%';
            }
         }


         // if game changes update the stars width style to new rating
         $scope.$watch('game.rating', function(rating)
         {
            if (!$scope.game)
            {
               return;
            }
            $scope.game.rating_pct = Math.floor(rating*100);
            $scope.calcStars();
         });

         // calc rating on ratio of width to mouse click X
         $scope.click = function($event)
         {
            $event.stopPropagation();
            if (!config.env.read_only)
            {
               var width;

               if ($event.srcElement.className == 'rating_background') // clicked background
               {
                  width = $event.srcElement.clientWidth;
               }
               else                                                   // clicked foreground
               {
                  width = $event.srcElement.parentElement.clientWidth;
               }

               var rating = util.round( $event.offsetX / width , 2 );
               if (!isNaN(rating))
               {
                  $scope.game.rating = rating;
                  $scope.calcStars();
                  GameService.md_changed('rating', $scope.autosave, $scope.game);
               }
            }
            util.defaultFocus();
         }
      }
   }
});
