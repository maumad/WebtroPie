'use strict';

angular.module('WebtroPie.gamelist', ['ngTouch'])

.directive('gamelistVirtualRepeat', function(GameService)
{
   return {
      replace: true,
      templateUrl: "gamelist.html",
      link: function (scope, element, attrs)
      {
         element.bind('contextmenu', scope.rightClick);
         scope.scroller =
            GameService.scroller =
               element[0].querySelector('#scroller')

         scope.scroller.addEventListener('scroll', scope.onScroll);
      }
   };
})
.controller('GamelistCtrl', ['$scope','$window','GameService','ThemeService','util',
function($scope, $window, GameService, ThemeService, util)
{
   self = $scope.GameService = GameService;
   $scope.util = util;

   $scope.onScroll = function($event)
   {
      var linesize_px = ThemeService.gamelist.linesize * $window.innerHeight;
      var buffer_index = GameService.scroller.scrollTop / linesize_px;
      buffer_index = Math.floor((buffer_index - 20)/50) * 50;  // buffer row start
      if (buffer_index<0) buffer_index = 0;
      if (GameService.buffer_index != buffer_index)
      {
         GameService.buffer_index = buffer_index;  // buffer row start
         $scope.$evalAsync();
      }
   }

   $scope.rightClick = function($event)
   {
      $scope.$apply(function()
      {
         $event.preventDefault();
         $scope.context = {};
         $scope.mouseOver(null, $event);
      });
   }

   $scope.mouseOver = function(game, $event)
   {
      if (!game)   // right click
      {
         game = $scope.gameover;
      }
      else        // mouse over
      {
         $scope.gameover = game;
      }

      // set title and menu position
      if ($scope.context)
      {
         $scope.context.top = ($event.pageY - 20)+'px';
         $scope.context.left = ($event.pageX + 15)+'px';

         if(game.selected)
         {
            $scope.context.title =
               GameService.select_list.length + ' games selected';
         }
         else
         {
            $scope.context.title = game.name;
         }
      }
   }

   // remember the start dragging point offset
   $scope.mouseDown = function($event)
   {
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

      //if (!$scope.dragging)
      //{
         $scope.clicked_pageX = pageX;
         $scope.clicked_pageY = pageY;
         $scope.dragging = true;
         $scope.dragged = false;
      //}
   }


   // change systembar x by difference in mouse x
   $scope.mouseMove = function($event)
   {
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

      if ($scope.dragging)
      {
         var change_pct = 100 * (pageX - $scope.clicked_pageX) / $window.innerWidth;
         //if (change_pct!=0)
         //{
            //$scope.dragged = true;
         //}
         if (change_pct > 20)
         {
            self.prevSystem();
         }
         else if (change_pct < -20)
         {
            self.nextSystem();
         }
      }
   }

   // either a click or stop dragging
   $scope.mouseUp = function($event)
   {
      $scope.dragging = false;
      $scope.dragged = true;
   }

   // LIST NAVIGATION FUNCTIONS

   self.keyNextPage = function()
   {
      self.keyNextGame( ThemeService.gamelist.rows-1 );
   }

   self.keyPrevPage = function()
   {
      self.keyPrevGame( ThemeService.gamelist.rows-1 );
   }

   // Move down 'count' games
   self.keyNextGame = function(count)
   {
      if (!self.filtered)
      {
         return;
      }

      ThemeService.playSound('scrollsound');

      var was_bottom = self.game_index == self.filtered.length -1;

      // round up - page down to mostly visible last row
      self.game_index += Math.floor(count + 0.4);

      if (self.game_index >= self.filtered.length)
      {

         // wrap around bottom to top
         if (was_bottom)
         {
            return self.scrollToTop();
         }
         // don't jump past end
         else if (count > 1)
         {
            return self.scrollToBottom();
         }
      }

      self.scrollToGame();
   }

   // go to top of list - home key
   self.keyListTop = function()
   {
      if (!self.filtered)
      {
         return;
      }

      ThemeService.playSound('scrollsound');

      self.scrollToTop();
   }

   // Move down 'up' games
   self.keyPrevGame = function(count)
   {
      if (!self.filtered)
      {
         return;
      }

      ThemeService.playSound('scrollsound');

      var was_top = self.game_index == 0;

      self.game_index -= Math.floor(count + 0.4); // move up by count

      if (self.game_index < 0)
      {

         if (was_top)
         {
            return self.scrollToBottom();
         }
         else if (count > 1)
         {
            return self.scrollToTop();
         }
      }

      self.scrollToGame();
   }

   // go to end of list - end key
   self.keyListBottom = function()
   {
      if (!self.filtered)
      {
         return;
      }

      ThemeService.playSound('scrollsound');

      self.scrollToBottom();
   }

   self.scrollToTop = function()
   {
      self.scroller.scrollTop = 0;
      self.game_index = 0;
      self.buffer_index = 0;

      self.setGame();
   }

   self.scrollToBottom = function()
   {
      self.game_index = -1; // wrap around to end

      self.scrollToGame();
   }

   // show/scroll to current game by index
   // similar to element.scrollIntoView() but also positions row
   // and sets buffer, game
   self.scrollToGame = function()
   {
      // calc game row height in pixels
      var linesize_px = ThemeService.gamelist.linesize * $window.innerHeight;
      // visible top index
      var scroll_index = null;

      if (self.game_index == 0)
      {
         self.scroller.scrollTop = self.buffer_index = 0;
      }
      // wrap around from top to bottom
      else if (self.game_index < 0)
      {
         // end of list
         self.game_index = self.filtered.length-1;

         // find visible top index from end of list
         scroll_index = self.filtered.length - (ThemeService.gamelist.rows - self.header);

         // list is smaller than screen rows
         if (scroll_index < 0)
         {
            scroll_index = 0;
         }

         self.scroller.scrollTop = scroll_index * linesize_px;
      }
      // set visible top to new game index
      else if ( self.game_index * linesize_px < self.scroller.scrollTop )
      {
         scroll_index = self.game_index;

         self.scroller.scrollTop = scroll_index * linesize_px;
      }
      else
      {
         // scroll  everything down

         var gamelist_h = ThemeService.gamelist.size.h * $window.innerHeight
              - self.header * linesize_px;

         // game index pos in pixels is past the bottom of visible game list
         if ( (self.game_index + 0.9) * linesize_px > self.scroller.scrollTop + gamelist_h )
         {
            scroll_index = self.game_index - ThemeService.gamelist.rows;

            // relative to end of list so that whole line shows for current game
            // at bottom of list
            self.scroller.scrollTop = (1 + self.game_index) * linesize_px - gamelist_h;
         }
      }

      // we moved
      if (scroll_index != null)
      {
         // visible scroll position
         //self.scroller.scrollTop = scroll_index * linesize_px;

         // buffer row start
         self.buffer_index = Math.floor((scroll_index - 20)/50) * 50;
         if (self.buffer_index < 0)
         {
            self.buffer_index = 0;
         }
      }

      self.setGame();
   }


   // after user types changes in filter box or sort order and after filter applied
   // check that the current game is still visible
   self.checkGameStillVisible = function()
   {
      if (!self.filtered)  // check there is a list
      {
         return;
      }

      if(self.game)
      {
         // search for game
         // is the current game in the new filtered list ?
         var game_index = self.filtered.indexOf(self.game);
         if (game_index >= 0)    // not in list
         {
            self.game_index = game_index;
            self.scrollToGame();
            return;
         }
      }
      self.scrollToTop();
   }

   self.goSystemByIndex = function(system_index)
   {
      ThemeService.playSound('systemselect');

      system_index = ThemeService.checkBounds(system_index);
      var system_name = ThemeService.theme.systems[system_index].name;
      var subdir;
      if(GameService.systems[system_name])
      {
         subdir = GameService.systems[system_name].subdir;
      }

      delete GameService.gamelist;
      delete GameService.game;

      // browse to new directory location (view/page change)
      if(subdir)
      {
         util.go('/'+system_name+'/'+subdir);
      }
      else
      {
         util.go('/'+system_name);
      }

      // TODO: animation
   }

   self.getSystemIndex = function()
   {
      return self.system_name == 'all'
                ? ThemeService.theme.systems.length - 1  // all is always the last system
                : ThemeService.system_index;
   }

   // roll systems left
   self.prevSystem = function()
   {
      self.goSystemByIndex( self.getSystemIndex() - 1 );

      // TODO: animation
      return true;
   }

   // roll systems right
   self.nextSystem = function()
   {
      self.goSystemByIndex( self.getSystemIndex() + 1 );

      // TODO: animation
      return true;
   }


   // clear all 'selected' flags for all games in the selected list
   self.clearSelection = function()
   {
      self.last_selected_index = -1;

      angular.forEach(self.selected_list, function(game)
      {
         delete game.selected;
      });

      self.selected_list.length = 0;  // truncate list
   }

   // set the 'selected' flag on a range of games and push to list
   self.selectRange = function(from_index, to_index)
   {
      if (to_index < from_index)   // swap to make smallest first
      {
         to_index = from_index;
         from_index = self.last_selected_index;
      }
      var game;
      for (var i=from_index; i<=to_index; i++)
      {
         game = self.filtered[i];
         // already selected ?
         var index = self.selected_list.indexOf(game);
         if (index == -1)
         {
            self.selected_list.push(game);
            game.selected = true;
         }
      }
   }

   // above for all games in list
   self.selectAll = function()
   {
      self.selectRange(0, self.filtered.length-1);
   }

   // change selected flag, push or pop to list
   self.toggleSelected = function(game)
   {
      game.selected = !game.selected;

      if (game.selected)  // remember for selecting range
      {
         self.last_selected_index = self.filtered.indexOf(game);
      }

      var index = self.selected_list.indexOf(game);
      if (index == -1 && game.selected)  // push
      {
         self.selected_list.push(game);
      }
      else if (index >= 0 && !game.selected) // pop
      {
         self.selected_list.splice(index, 1);
      }
   }

   self.clickGame = function(game, $event, $index)
   {
      var clicked_index = self.buffer_index + $index;

      // SHIFT-CTRL CLICK: clear / select all
      if ($event && $event.shiftKey && ($event.ctrlKey || util.commandDown))
      {
         if (self.selected_list.length == 0)
         {
            self.selectAll();
         }
         else
         {
            self.clearSelection();
         }
      }
      // SHIFT CLICK: select range
      else if ($event && $event.shiftKey && self.last_selected_index>=0)
      {
         self.selectRange(clicked_index, self.last_selected_index);
      }
      // CONTROL CLICK: select / unselect one
      else if ($event && ($event.ctrlKey || $event.shiftKey || util.commandDown))
      {
         self.toggleSelected(game);
      }
      // CLICK
      else
      {
         if (clicked_index == self.game_index)
         {
            if (self.game.isDir)
            {
               self.openFolder();
            }
            else
            {
               self.showEditor();
            }
         }
         else
         {
            self.setGameByIndex(clicked_index);
         }
      }
   }


   // get the game row style for a game within a list
   self.getGameStyle = function(game, $index)
   {
      if (!ThemeService.gamelist)
         return;

      var gl = ThemeService.gamelist;
      var style = {  top: util.pct($index * gl.linesize, 'vh'),
                  height: util.pct(gl.linesize,'vh') };

      // game rom file does not exists
      if (game && !game.size && !game.isDir)
      {
         style['text-decoration'] = 'line-through';
      }

      if (gl.horizontalmargin &&
          gl.horizontalmargin > 0)
      {
         style['box-sizing'] = 'border-box';
         //style['padding'] = '0 ' + (100 * gl.horizontalmargin) + '%';
      }

      if (game && game.selected)
      {
         style['border'] = '1px solid rgba(50,50,50,0.3)';
      }
      else
      {
         delete style.border;
      }

      // the current game
      if ($index == self.game_index )
      {
         // colour the current selected game bar
         style.color = '#' + gl.selectedcolor;
         style['background-color'] = '#' + gl.selectorcolor;
         if(game != self.game)
            self.setGame();
      }
      // Directory - theme secondary gamelist colour
      else if (game.isDir)
      {
         style.color = '#' + gl.secondarycolor;
      }
      // selected game
      else if (game.selected)
      {
         style.color = 'rgba(230,220,160,0.9)';
         style['background-color'] = 'rgba(90,90,90,0.4)';
      }
      // normal unselected non current game
      else
      {
         style.color = '#' + gl.primarycolor;
         style['background-color'] = '';
      }

      return style;
   }

   self.resetFields = function(field)
   {
      // only show name field / index 0
      angular.forEach(self.list_fields, function(f, index) {
         f.show = (index == 0);
      });
      // turn off header
      self.header = 0;
      // resize gamelist
      self.applyFieldsShown();
      // reset scale of everything else
      ThemeService.resetView(ThemeService.view);
   }

   self.toggleField = function(field)
   {
      field.show = !field.show;

      // count fields shown
      var shown = 0;
      angular.forEach(self.list_fields, function(f) {
         if (f.show)
            shown++;
      });

      if (shown==0)
      {
         ThemeService.resetView(ThemeService.view);
         return;
      }

      // if back to just name field then reset
      if (shown == 1 && self.list_fields[0].show)
      {
         self.header = 0;
         self.applyFieldsShown();
         ThemeService.resetView(ThemeService.view);
         return;
      }

      // more than one field, show header
      self.header = 1;
      self.applyFieldsShown();
   }

}])
.filter('startFrom', function()
{
   return function(input, start)
   {
      if (input)
      {
         return input.slice(start);
      }
   }
})
// folder and favourite filter
.filter('directory', function(GameService, config)
{
   return function(rows, subdir)
   {
     // everything
     if (typeof rows === 'undefined' ||
         (GameService.show_nested && !GameService.show_favorite))
     {
        return rows;
     }
     var result = [];
     angular.forEach(rows, function(row)
     {
        // hide empty directories
        if (row.isDir &&
            !config.app.ShowEmptyDirectories &&
            GameService.subdirs &&
            GameService.subdirs[row.path].games == 0)
        {
           return;
        }
        if ( ( (GameService.show_nested || GameService.system_name=='all') && !row.isDir) ||
              (!subdir && !row.subdir) ||
              (subdir == row.subdir) )
        {
           if (!GameService.show_favorite ||
               (GameService.show_favorite && row.favorite))
           {
              result.push(row);
           }
        }
     });
     return result;
   }
})
.filter('fieldtype', function(GameService)
{
   return function(fields, type)
   {
     var result = [];
     angular.forEach(fields, function(field)
     {
        if ( field.type == type ||
             (type == 'text' && field.type == 'datetime') )
        {
              result.push(field);
        }
     });
     return result;
   }
});
