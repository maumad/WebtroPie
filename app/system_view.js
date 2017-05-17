'use strict';

angular.module('WebtroPie.system_view', ['ngRoute','ngTouch'])

.config(['$routeProvider', function($routeProvider)
{
  $routeProvider.when('/',  // this page is the main index page
  {
    templateUrl: 'system_view.html',
    controller: 'SystemViewCtrl'
  });
}])

.controller('SystemViewCtrl',
['$scope','$rootScope','$window','$timeout',
 'config', 'ThemeService', 'GameService', 'util',
function($scope, $rootScope, $window, $timeout,
         config, ThemeService, GameService, util )
{
/*
   $scope.systembar = {x: 0, speed: 0,
                       'logostyle-2': {},
                       'logostyle-1': {},
                       'logostyle0': {},
                       'logostyle1': {},
                       'logostyle2': {},
                       'infostyle-2': {},
                       'infostyle-1': {},
                       'infostyle0': {},
                       'infostyle1': {},
                       'infostyle2': {},
                      };
*/
   $scope.systembar = {};
   $scope.initSystembar = function(y)
   {
      var logotop = util.pct((y||0.38)+0.16,'vh');
      for (var i=-2; i<=2; i++)
      {
         $scope.systembar['logostyle'+i] = {top: logotop};
         $scope.systembar['infostyle'+i] = {top: logotop};
      }
      $scope.systembar.x = 0;
      $scope.systembar.change_ix = 0;
   }

   $scope.initSystembar();

   $scope.sys_index = 0;  // just used for animation -1, 0 or +1
   $scope.mid_index = 0;  // floor( systems.length / 2 ), offset of center

   $scope.ThemeService = ThemeService;
   $scope.GameService = GameService;

   delete GameService.filtered;

   // wait for config (which theme?)
   config.init()
   .then(function()
   {
      $scope.helpmenu = [
        {langButton: 'menu',   click: config.toggleMenu, svg: 'resources/button_start.svg'}
       ,{langButton: 'select', click: $scope.keyEnter, svg: 'resources/button_a.svg'}
     //,{langButton: 'search', click: null,            svg: 'resources/search.svg'} // TODO
       ,{langButton: '',   click: $scope.go_favorites, svg: 'resources/favorite-o.svg',
                                                       color: '990000'} // red
      ];

      // wait for themes to load
      return ThemeService.themeInit();
   })
   .then(function()
   {
      $scope.mid_index = Math.floor( ThemeService.theme.systems.length / 2 );

      ThemeService.setSystemByIndex(ThemeService.system_index, 'system');
      ThemeService.playSound('bgsound');

      // get the current system gamelist (to show games total and get list ahead of navigation)
      GameService.getGamelist(ThemeService.system.name)
      .then(function() {
         if (config.app.LoadAllSystems)
         {
            GameService.getGamelist('all');
         }
      });

      // focus on center logo (so that input events are listened to)
      util.register_defaultFocus('#logo0');

      $scope.keyPress = function($event)
      {
         // Ctrl - M - Main Menu
         if (($event.ctrlKey || util.commandDown) && $event.keyCode == 77)
         {
            config.toggleMenu();
            return true;
         }

            if ($event.keyCode == 13) // enter
            {
               return $scope.keyEnter();
            }
            else if ($event.keyCode == 39) // right
            {
               return $scope.keyArrowRight();
            }
            else if ($event.keyCode == 37) // left
            {
               return $scope.keyArrowLeft();
            }
            // type a character - goto 'all' page
            else if ( !$event.shiftKey &&
                      !$event.ctrlKey &&
                      !$event.altKey &&
                      ( ($event.keyCode >= 48 && $event.keyCode <= 57) ||  // 0-9
                        ($event.keyCode >= 65 && $event.keyCode <= 90)) )  // a-z
            {
               if (!ThemeService.filter)
               {
                  ThemeService.filter = String.fromCharCode(event.keyCode);
                  ThemeService.goSystemDetail(-1); // all
                  return false;
               }
            }

            return true;
      }

      util.register_keyPressCallback($scope.keyPress);

   });

   $scope.cancel_timeout = function() {
      if ($scope.timeout_promise)
      {
         $timeout.cancel($scope.timeout_promise);
      }
   }

   $scope.$on("$destroy", $scope.cancel_timeout);

   // click whichever system is selected
   $scope.keyEnter = function()
   {
      GameService.show_favorite = false;
      ThemeService.goSystemDetail(ThemeService.system_index-$scope.sys_index);
   }

   // roll systems left
   $scope.keyArrowLeft = function()
   {
      if (!$scope.sys_index)
      {
         $scope.sys_index++; // start animation
         $scope.cancel_timeout();
         $scope.timeout_promise = $timeout(function()
         {
           delete $scope.timeout_promise;
           $scope.sys_index=0;
           ThemeService.previousSystem();
           GameService.getGamelist(ThemeService.system.name);
           $scope.$evalAsync();
           util.defaultFocus();
         }, 500, false);
      }
   }

   // roll systems right
   $scope.keyArrowRight = function(repeated)
   {
      if (!$scope.sys_index)
      {
         $scope.sys_index--; // start animation
         $scope.cancel_timeout();
         $scope.timeout_promise = $timeout(function()
         {
           delete $scope.timeout_promise;
           $scope.sys_index=0;
           ThemeService.nextSystem();
           GameService.getGamelist(ThemeService.system.name);
           $scope.$evalAsync();
           util.defaultFocus();
         }, 500, false);
      }
   }

   // remember the start dragging point offset
   // and which system clicked
   $scope.mouseDown = function($event, clicked_ix)
   {
      //$event.preventDefault();
      var pageX, pageY;
      if($event.touches)
      {
         if(!$event.touches.length)
         {
            return;
         }
         pageX = $event.touches[0].pageX;
         pageY = $event.touches[0].pageY;
      }
      else
      {
         pageX = $event.pageX;
         pageY = $event.pageY;
      }
      if (!$scope.systembar.dragging)
      {
         $scope.systembar.clicked_pageX = pageX;
         $scope.systembar.clicked_pageY = pageY;
         $scope.systembar.clicked_offsetX = pageX - $scope.systembar.x;
         $scope.systembar.clicked_ix = clicked_ix + ThemeService.system_index;
         $scope.systembar.dragging = true;
         $scope.systembar.dragged = false;
      }
   }

   // reindex and recenter, clear everything
   $scope.stopDragging = function($event)
   {
      $scope.systembar.dragging = false;
      $scope.initSystembar();
   }
   $scope.mouseOut = function($event)
   {
      var y_pct = 100 * $event.pageY / $scope.window_height;
      if ( y_pct >= 37.95 && y_pct <= 68.42)
      {
         return;
      }
      $scope.stopDragging();
   }

   // change systembar x by difference in mouse x
   $scope.mouseMove = function($event)
   {
      $event.preventDefault();
      var pageX, pageY;
      if($event.touches)
      {
         if(!$event.touches.length)
         {
            return;
         }
         pageX = $event.touches[0].pageX;
         pageY = $event.touches[0].pageY;
      }
      else
      {
         pageX = $event.pageX;
         pageY = $event.pageY;
      }
      var x_pct = 100 * pageX / $scope.window_width;
      if ( x_pct >= 98 && x_pct <= 2)
      {
         return $scope.stopDragging();
      }

      if ($scope.systembar.dragging)
      {
         var new_x = pageX - $scope.systembar.clicked_offsetX;
         if ($scope.systembar.x != new_x)
         {
            $scope.systembar.x = new_x;
            var change_pct = 100 * new_x / $scope.window_width;
            $scope.systembar.change_ix = Math.sign(-change_pct) *
                                         Math.floor((19+Math.abs(change_pct))/38);
            $scope.setLogoStyle(-2, -25 + change_pct);
            $scope.setLogoStyle(-1, 12 + change_pct);
            $scope.setLogoStyle(0, 50 + change_pct);
            $scope.setLogoStyle(1, 88 + change_pct);
            $scope.setLogoStyle(2, 125 + change_pct);

            $scope.systembar.dragged = true;
         }
      }
   }

   // either a click or stop dragging
   $scope.mouseUp = function($event)
   {
      if (!$scope.systembar.dragged)
      {
         if ($scope.systembar.clicked_ix !== undefined)
         {
            $scope.cancel_timeout();
            ThemeService.goSystemDetail($scope.systembar.clicked_ix);
         }
      }
      else if ($scope.systembar.change_ix)
      {
        ThemeService.nextSystem($scope.systembar.change_ix);
        GameService.show_favorite = false;
        GameService.getGamelist(ThemeService.system.name);
      }

      $scope.stopDragging();
   }


   // styles used for logo and info while dragging
   // (keys uses class animations)
   $scope.setLogoStyle = function(offset, x_pct)
   {
      var style = $scope.systembar['logostyle'+offset];
      var infostyle = $scope.systembar['infostyle'+offset];

      style.left = x_pct + '%';
      var prop;
      if (x_pct < 12)
      {
         prop = (x_pct+25)/(12+25);
         style.width = (18+(23-18)*prop)+'%';
         style.height = (8+(12-8)*prop)+'%';
         style['font-size'] = (7+(11-7)*prop)+'vmin';
         infostyle.opacity = 0;
      }
      else if (x_pct < 50)
      {
         prop=(x_pct-12)/(50-12);
         style.width = (23+(35-23)*prop)+'%';
         style.height = (12+(17-12)*prop)+'%';
         style['font-size'] = (11+(15-11)*prop)+'vmin';
         infostyle.opacity = prop;
      }
      else if (x_pct < 88)
      {
         prop=(x_pct-50)/(88-50);
         style.width = (35+(23-35)*prop)+'%';
         style.height = (17+(12-17)*prop)+'%';
         style['font-size'] = (15+(11-15)*prop)+'vmin';
         infostyle.opacity = 1 - prop;
      }
      else
      {
         prop=(x_pct-88)/(125-88)
         style.width = (23+(18-23)*prop)+'%';
         style.height = (12+(8-12)*prop)+'%';
         style['font-size'] = (11+(7-11)*prop)+'vmin';
         infostyle.opacity = 0;
      }
      infostyle.left = style.left;
      infostyle.width = style.width;
   }

   $scope.go_favorites = function()
   {
      GameService.show_favorite = true;
      util.call('/all');
   }

   // keep track of page width to '$scope.window_width'
   $scope.window = angular.element($window);
   $scope.$watch(
      function () { return $window.innerWidth; },
      function (value) { $scope.window_width = value; },
      true
   );
   $scope.$watch(
      function () { return $window.innerHeight; },
      function (value) { $scope.window_height = value; },
      true
   );
   $scope.$watch('ThemeService.view.carousel.systemcarousel.pos.y', $scope.initSystembar);

   $scope.window.bind('resize', function()
   {
      $scope.$evalAsync();
   });

}]);
