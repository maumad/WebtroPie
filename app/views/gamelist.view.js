'use strict';

angular.module('WebtroPie.gamelist_view', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/:system/:subdir*?', {
    controller: 'GamelistViewCtrl', templateUrl: 'gamelist_view.html'
  });
}])
.controller('GamelistViewCtrl', [
     '$scope','$routeParams','$window','$document','$timeout',
     'config', 'ThemeService', 'GameService', 'util',
function($scope, $routeParams, $window, $document, $timeout,
      config, ThemeService, GameService, util )
{
   //$scope.ThemeService = ThemeService;
   $scope.GameService = GameService;
   //$scope.config = config;


   $scope.go_back = function()
   {
      ThemeService.playSound('back');

      config.hideMenu();

      GameService.saveState();

      var parent_path = '/';
      if (GameService.subdir)
      {
         // stay within this system
         parent_path += ThemeService.system.name;

         // find parent directory
         GameService.subdir = GameService.getParentDir(GameService.subdir);
         // still under a subdirectory?
         if (GameService.subdir)
         {
            parent_path += '/' + GameService.subdir;
         }
      }
      util.back(parent_path);
      // todo: just restore saved values
      //GameService.checkGameStillVisible();

      return true;
   }

   $scope.keyPress = function($event)
   {
      // Ctrl - A - Select or Deselect All
      if (($event.ctrlKey || util.commandDown) && $event.keyCode == 65)
      {
         if (GamelistService.selected_list.length == 0)
         {
            GamelistService.selectAll();
         }
         else
         {
            GamelistService.clearSelection();
         }
         return true;
      }

      // Ctrl - M - Main Menu
      if (($event.ctrlKey || util.commandDown) && $event.keyCode == 77)
      {
         config.toggleMenu();
         return true;
      }

      // - it's best not to always have focus on filter to prevent
      // onscreen keyboard being forever open on mobile devices
      if (!ThemeService.filter || $document[0].activeElement.id != 'filter')
      {
         if ($event.keyCode == 39)       // right arrow: system right
         {
            GameService.saveState();
            GameService.nextSystem();
            return true;
         }
         else if ($event.keyCode == 37)  // left arrow: system left
         {
            GameService.saveState();
            GameService.prevSystem();
            return true;
         }
         // type a character while focus is on the game list :-
         // focus on 'filter' and enter key char in filter field
         else if ( !ThemeService.filter &&
                   !$event.shiftKey && !$event.ctrlKey && !$event.altKey &&
                   ( ($event.keyCode >= 48 && $event.keyCode <= 57) ||  // 0-9
                     ($event.keyCode >= 65 && $event.keyCode <= 90)) )  // a-z
         {
            ThemeService.filter = String.fromCharCode(event.keyCode);
            util.focus('#filter');
            $event.preventDefault();
            return;
         }
      }

      if ($event.keyCode == 13)        // enter
      {
         // if it's a directoy go to sub directory
         // otherwise open game metadata editor
         if (GameService.game.isDir)
         {
            return GameService.openFolder();
         }
         else
         {
            return GameService.showEditor();
         }
      }
      else if ($event.keyCode == 27)    // Escape
      {
         // close editor if open
         if (GameService.edit)
         {
            return GameService.hideEditor();
         }
         // clear filter
         else if (ThemeService.filter)
         {
            ThemeService.filter = '';
         }
         // go systems view
         else
         {
            return $scope.go_back();
         }
      }
      else if ($event.keyCode == 36)        // Home key: top of list
      {
         return GameService.keyListTop();
      }
      else if ($event.keyCode == 35)        // End key: bottom of list
      {
         return GameService.keyListBottom();
      }
      else if ($event.keyCode == 38)        // up arrow: previous game
      {
         return GameService.keyPrevGame(1);
      }
      else if ($event.keyCode == 40)   // down arrow: next game
      {
         return GameService.keyNextGame(1);
      }
      else if ($event.keyCode == 33)   // page up: previous game * view rows
      {
         return GameService.keyPrevPage();
      }
      else if ($event.keyCode == 34)   // page down: next game * view rows
      {
         return GameService.keyNextPage();
      }

      return true; // default handling (dont prevent default)
   }

   util.register_keyPressCallback($scope.keyPress);

   $scope.showFavoriteOn = function()
   {
      GameService.show_favorite = true;
      util.defaultFocus();
   }

   $scope.showFavoriteOff = function()
   {
      GameService.show_favorite = false;
      util.defaultFocus();
   }

   $scope.showNestedOn = function()
   {
      GameService.show_nested = true;
      util.defaultFocus();
   }

   $scope.showNestedOff = function()
   {
      GameService.show_nested = false;
      util.defaultFocus();
   }

   $scope.scan = function()
   {
      var game = GameService.game;
      GameService.getSystemGamelist($routeParams.system, true)
      .then(function(gamelist) {
         util.waitForRender($scope).then(function() {
            GameService.game = game;
            GameService.checkGameStillVisible();
            util.defaultFocus();
         });
      });
   }

   $scope.match_media = function()
   {
      GameService.getSystemGamelist($routeParams.system, false, true)
      .then(function(gamelist) {
         util.defaultFocus();
      });
   }

   // wait for config (which theme?)
   config.init()
   .then(function()
   {
      $scope.helpmenu = 
         [{langButton: 'options',click: $scope.click_option, svg: 'resources/button_select.svg',
            menu: [{text: 'Scan',        click: $scope.scan},
                   {text: 'Match Media', click: $scope.match_media},
                   {text: 'New Folder'},
                   {text: 'Upload Roms'}]}
          ,{langButton: 'menu',  click: config.toggleMenu,   svg: 'resources/button_start.svg'}
          ,{langButton: 'back',  click: $scope.go_back,      svg: 'resources/button_b.svg'}

          // X on the menu reflects the key enter / mouse click action

          // for a Game, X = Edit, A = Launch (if enabled)
          ,{langButton: 'edit',  click: GameService.showEditor, svg: 'resources/button_a.svg',
                                  show: '!GameService.game.isDir && !config.env.read_only'}
          ,{langButton: 'launch',click: GameService.launch,     svg: 'resources/button_x.svg',
                                  show: '!GameService.game.isDir && config.env.has_launch'},

         // for a Directory, X = Open, A = Edit
          ,{langButton: 'open',  click: GameService.openFolder, svg: 'resources/button_a.svg',
                                  show: 'GameService.game.isDir'}
          ,{langButton: 'edit',  click: GameService.showEditor, svg: 'resources/button_x.svg',
                                  show: 'GameService.game.isDir && !config.env.read_only'}

          ,{                     click: $scope.showFavoriteOn,  svg: 'resources/favorite-o.svg',
                                  show: '!GameService.show_favorite'}
          ,{                     click: $scope.showFavoriteOff, svg: 'resources/favorite.svg',
                                  show: 'GameService.show_favorite', color: "DD3000"}

          ,{                     click: $scope.showNestedOn,  svg: 'resources/folder-o.svg',
                                  show: "GameService.system_name!='all' && !GameService.show_nested"}
          ,{                     click: $scope.showNestedOff, svg: 'resources/folder.svg',
                                  show: "GameService.system_name!='all' && GameService.show_nested"}
      ];

      // wait for themes to load
      return ThemeService.themeInit($routeParams.system);
   })
   .then(function()
   {
      // get games (and count) for the current system
      return GameService.getGamelist($routeParams.system, $scope);
   })
   .then(function(gamelist)
   {
      GameService.setSystem($routeParams.system, $routeParams.subdir, true);

      util.register_defaultFocus('#scroller');

      // drilled by entering filter on prev screen
      if (ThemeService.filter)
      {
         //$scope.return_when_filter_empty = true;
         util.focus('#filter');
      }

      $scope.filter_change = function()
      {
         if (GameService.checkGameStillVisible)
         {
            GameService.checkGameStillVisible();
         }
         $scope.$evalAsync();
      }

      $scope.$watch('GameService.show_favorite', $scope.filter_change);
      $scope.$watch('GameService.show_nested', $scope.filter_change);
      $scope.$watch('ThemeService.filter', $scope.filter_change);
   });

}]);
