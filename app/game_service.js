'use strict';

angular.module('WebtroPie.game_service', [])

// Service to handle Game and Gamelists
.service('GameService',
function($http, $httpParamSerializer, $q, ThemeService, util, config, $timeout, $location)
{
   var self = this;

   self.systems = {all: {game_index: 0, buffer_index: 0, scrolltop: 0, gamelist: [], total: 0 }};
 
   self.selected_list = [];

   self.header = 0; // becomes 1 when additional columns are added

   self.gamelists_loaded = 0; // increases as system game lists are loaded
   self.liststyle = {};

  /* map theme attribute to gamelist field,
     and provides quick lookup of valid md fields */
   self.attrs = {
      name:        "name",
      description: "desc",
      image:       "image",
      rating:      "rating",
      releasedate: "releasedate",
      developer:   "developer",
      publisher:   "publisher",
      genre:       "genre",
      players:     "players",
      lastplayed:  "lastplayed",
      playcount:   "playcount",
      size:        "size",
      human_size:  "human_size",
      favorite:    "favorite",
      kidgame:     "kidgame",
      hidden:      "hidden",
      marquee:     "marquee",
      video:       "video"
   }

   /* available columns for display in game list view, provides formatting
      attributes as well as order by logic for each field */
   self.list_fields = [
      {name: 'name',       type: 'text',                  orderby: 'name' },
      {name: 'favorite',   type: 'toggle',   width: 0.04, orderby: 'favorite', align: 'center'},
      {name: 'kidgame',    type: 'toggle',   width: 0.04, orderby: 'kidgame', align: 'center'},
      {name: 'hidden',     type: 'toggle',   width: 0.04, orderby: 'hidden', align: 'center'},
      {name: 'human_size', type: 'text',     width: 0.08, orderby: ['-size', 'name'], align: 'right'},
      {name: 'rating',     type: 'rating',   width: 0.08, orderby: ['!rating','-rating','name'] },
    //{name: 'rating',     type: 'text',     width: 0.06, orderby: ['!rating','-rating','name'] },
      {name: 'releasedate',type: 'datetime', width: 0.06, orderby: ['-year','name'], format: 'yyyy', align: 'right' },
      {name: 'releasedate',type: 'datetime', width: 0.12, orderby: ['!releasedate','releasedate'], align: 'right'},
      {name: 'developer',  type: 'text',     width: 0.24, orderby: ['!developer','developer','name'] },
      {name: 'publisher',  type: 'text',     width: 0.28, orderby: ['!publisher','publisher','name'] },
      {name: 'genre',      type: 'text',     width: 0.16, orderby: ['!genre','genre','name'] },
      {name: 'players',    type: 'text',     width: 0.03, orderby: ['players','name'], align: 'center' },
      {name: 'lastplayed', type: 'datetime', width: 0.12, orderby: 'lastplayed', reverse: true, align: 'right' },
      {name: 'playcount',  type: 'text',     width: 0.04, orderby: 'playcount', reverse: true, align: 'center' },
   ]

   // set current language column headings
   self.set_field_text = function()
   {
      angular.forEach(self.list_fields, function(field, index)
      {
         field.text = config.lang.md_labels[field.name];
         if (field.name == 'releasedate' && field.format == 'yyyy')
         {
            field.text = config.lang.md_labels['year'];
         }
         field.order = index;
      });
   }

   config.init()
   .then(self.set_field_text);

   //self.fields_shown = [self.list_fields[0]]; // show name field
   self.list_fields[0].show = true; // show name field
   self.orderby      = self.list_fields[0]; // order by name field

   self.setOrderBy = function(orderby)
   {
      if(self.orderby == orderby)
         orderby.reverse = !orderby.reverse;
      else
         self.orderby = orderby;

      self.checkGameStillVisible();
   }

   self.showEditor = function()
   {
      config.hideMenu();
      if (config.env.read_only)
      {
         return;
      }
      self.edit = true;
   }

   self.hideEditor = function()
   {
      self.edit = false;
      util.defaultFocus();
   }

   // return text, can either be extra text itself,
   // a game attribute label or a game attribute
   self.getGameMetadata = function(game, obj, isMd)
   {
      var isObject = (typeof obj) == 'object';
      var name = isObject ? obj.name : obj;
      if (!name)
      {
         return '';
      }

      if (name && name.substring(0,7)=="md_lbl_")
      {
         return config.lang.md_labels[name.substring(7)] + ":";
      }

      if (name && name.substring(0,3)=="md_")
      {
         isMd = true;
         name = name.substring(3);
      }

      if (name && isMd && game)
      {
         var text = game[self.attrs[name]];
         //var text = game[self.attrs[name]];
         if (!text)
         {
            if (name == 'genre')
               return 'Unknown';
            else if (name == 'playcount')
               return '0';
            return;
         }

         if (isObject && obj.type == 'datetime')
         {
            return config.formatDate(text, obj.format);
         }

         if (name == 'name')
         {
            if (game.new)
            {
               text = 'New: '+text;
            }
            if (game.isDir)
            {
               text = text+' ('+self.subdirs[game.path].games+')';
            }
         }

         return text;
      }

      return (typeof obj) == 'object' ? obj.text : obj;
   }

   // local file path to url translations
   self.getImageUrl = function(path, filename)
   {
      if (!filename) return;

      var image_url;

      var RetroPie1 = '/home/pi/RetroPie';
      var RetroPie2 = '~/RetroPie';
      var homeES1 = '~/.emulationstation';
      var homeES2 = '/home/pi/.emulationstation';

      if (filename.substring(0,2) == './')
         image_url = filename.substring(2);
      else if (filename.substr(0,RetroPie1.length+5) == RetroPie1+'/roms')
         image_url = 'svr'+filename.substr(RetroPie1.length);
      else if (filename.substr(0,RetroPie2.length+5) == RetroPie2+'/roms')
         image_url = 'svr'+filename.substr(RetroPie2.length);
      else if (filename.substr(0,homeES1.length+18) == homeES1+'/downloaded_images')
         image_url = 'svr'+filename.substr(homeES1.length);
      else if (filename.substr(0,homeES2.length+18) == homeES2+'/downloaded_images')
         image_url = 'svr'+filename.substr(homeES2.length);
      else if (filename.substring(0,1) != '/')
         image_url = path+'/'+filename;
      else if (filename.substr(0,path.length) == path) {
         filename = filename.substr(path.length);
         image_url = path+'/'+filename;
      }
      else {
         console.log(filename);
         return;
      }
      return 'url("'+image_url+'")';
   }

   self.checkSystemTheme = function(system_name, chooseBestGamelistView)
   {
      var view_name;
      if (!chooseBestGamelistView &&
         ThemeService.view &&
          system_name == ThemeService.system.name)
      {
         view_name = ThemeService.view.name;
      }
      else
      {
         if (self.systems[system_name].has_image)
         {
//console.log(ThemeService.system);
            if (ThemeService.system.view &&
                ThemeService.system.view.video &&
                 self.systems[system_name].has_video)
            {
               view_name = 'video';
            }
            else
            {
               view_name = 'detailed';
            }
         }
         else
         {
            view_name = 'basic';
         }
      }

      // make sure theme system/view matches the gamelist system
      if (!ThemeService.view ||
         system_name != ThemeService.system.name ||
         view_name != ThemeService.view.name)
      {
         ThemeService.setSystemByName(system_name, view_name);
      }
   }

   // save a copy of the current game meta data incase of editing
   self.rememberGameMetadata = function(game)
   {
      if (!game.reset)
      {
         game.reset = {};
         angular.forEach(self.attrs, function(field)
         {
            game.reset[field] = game[field];
         });
      }
   }

   // set game after change to gamelist index
   self.setGame = function()
   {
      if (!self.filtered)
      {
         return;
      }

      // set the current game by the current index
      self.game = self.filtered[self.game_index];

      if (!self.game || !ThemeService.system)
      {
         return;
      }

      // change system and view to that of current game
      // (moving in the 'all' list)
      self.checkSystemTheme(self.game.sys);

      self.rememberGameMetadata(self.game);
   }

   // restore game meta data to it's original values
   self.resetGame = function()
   {
      if (!self.game.reset)
      {
         return;
      }

      angular.forEach(self.attrs, function(field)
      {
         self.game[field] = self.game.reset[field];
      });

      delete self.game.changes;
   }

   // record which metadata has changed and optionally save
   self.md_changed = function(md, autosave, game, change_selected)
   {
      // record changed fields
      if (!game)
      {
         game = self.game;  // the current game
      }

      if (!game.changes)
      {
         game.changes = {};
      }

      game.changes[md] = true;

      // if requested auto save changes
      if(autosave)
      {
         self.save(game);
      }

      if (self.selected_list.length && game.selected && change_selected)
      {
         angular.forEach(self.selected_list, function(selected_game)
         {
            if (selected_game != game)
            {
               self.rememberGameMetadata(selected_game);
               selected_game[md] = game[md];
               self.md_changed(md, autosave, selected_game, false);
            }
         });
      }
   }

   self.openFolder = function()
   {
      self.saveState();
      //util.call( '/'+ self.system_name + '/' + self.game.path );
      util.call( '/'+ self.game.sys + '/' + self.game.path );
   }

   // launch game remotely
   self.run = function(game)
   {
      $http.get('svr/gamelist_edit.php', {cache: false, params:
                        {run: game.path, system: game.sys}})
   }

   self.launch = function()
   {
      self.run(self.game);
   }

   // save changed fields for a single game
   self.save = function(game)
   {
      var update = {update: 1,
                    system: game.sys,
                      path: game.path};

      angular.forEach(game.changes, function(val, field)
      {
         update[field] = game[field];
      });

      $http({
         method  : 'POST',
         url     : 'svr/gamelist_edit.php',
         headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
         data    : $httpParamSerializer(update)
      })
      .then(function onSuccess(response) {
         delete game.changes;
      });
   }

   // change the current game index and set game
   self.setGameByIndex = function(game_index)
   {
      self.game_index = game_index;
      self.setGame();
   }

   // remember state
   // store the index positions for either root or subdirectory
   self.saveState = function()
   {
      if (self.subdir)
      {
         self.subdirs[self.subdir].game_index = self.game_index;
         self.subdirs[self.subdir].buffer_index = self.buffer_index;
         self.subdirs[self.subdir].scrollTop = self.scroller.scrollTop;
      }
      else
      {
         self.systems[self.system_name].game_index = self.game_index;
         self.systems[self.system_name].buffer_index = self.buffer_index;
         self.systems[self.system_name].scrollTop = self.scroller.scrollTop;
     }
   }

   // switch gamelist system, update system/gamelist globals
   self.setSystem = function(system_name, subdir, chooseBestGamelistView)
   {
      self.checkSystemTheme(system_name, chooseBestGamelistView);

      // if switching systems remember the subdirectory we are leaving
      if (self.system_name &&
          self.system_name != system_name)
      {
         self.systems[self.system_name].subdir = self.subdir;
      }

      // restore state for new system
      self.game         = null;
      self.system_name  = system_name;
      self.gamelist     = self.systems[system_name].gamelist;
      self.path         = self.systems[system_name].path;
      self.has_image    = self.systems[system_name].has_image;
      self.has_video    = self.systems[system_name].has_video;
      self.has_marquee  = self.systems[system_name].has_marquee;
      if (self.system_name != system_name)
      {
         self.subdir    = self.systems[system_name].subdir;
      }
      else
      {
         self.subdir    = subdir
      }
      self.subdirs      = self.systems[system_name].subdirs;
      self.has_subdirs  = !angular.equals({},self.subdirs);
      if (self.subdir)
      {
         self.game_index   = self.subdirs[self.subdir].game_index;
         self.buffer_index = self.subdirs[self.subdir].buffer_index;
         $timeout(function() {
            self.scroller.scrollTop = self.subdirs[self.subdir].scrollTop;
         });
      }
      else
      {
         self.game_index   = self.systems[system_name].game_index;
         self.buffer_index = self.systems[system_name].buffer_index;
         $timeout(function() {
            self.scroller.scrollTop = self.systems[system_name].scrollTop;
         });
      }

      self.setGame();
   }

   // return path of parent directory
   self.getParentDir = function(path)
   {
      if(!path)
      {
         return;
      }
      var i = path.lastIndexOf('/');
      if(i>0)
      {
         return path.substring(0,i);
      }
      return;
   }

   // if a path contains a directory ensure that the directories are
   // in the game list
   self.getSubDirectory = function(system, path)
   {
      var i = path.lastIndexOf('/');
      if (i>0)
      {
         path = path.substring(0, i);  // strip off filename

         if (!system.subdirs[path])
         {
            // new dir
            var dir = {path: path,
                 game_index: 0,
               buffer_index: 0,
                  scrolltop: 0,
                      games: 0};

            var parent = self.getSubDirectory(system, path); // recursively find parents
            if (parent)
            {
               dir.parent = parent;
            }

            system.subdirs[path] = dir;
         }
         return path;
      }
   }

   // get either s specific gamelist for a system or all systems
   self.getGamelist = function(system_name, $scope)
   {
      var promise;
      if (system_name=='all')     // all systems
      {
         angular.forEach(ThemeService.theme.systems, function(sys)
         {
            var p = self.getSystemGamelist(sys.name);
            if (!promise) promise = p;
         });
      }
      else    // specific system
      {
         promise =  self.getSystemGamelist(system_name);
      }

      return promise;
   }


   // get a single gamelist for a system
   self.getSystemGamelist = function(system_name, scan, match_media)
   {
      var deferred = $q.defer();

      // already loaded ?
      if (self.systems[system_name] && !scan)
      {
         // still getting from a differnt call, maybe from previous page
         if (self.systems[system_name].promise)
         {
            return self.systems[system_name].promise;
         }
         deferred.resolve(self.gamelist);
      }
      else
      {
         var system = self.systems[system_name]; // already loaded?
         var rescan;

         if (!system)
         {
            rescan = false;

            // create a system object
            var system = {game_index: 0,
                        buffer_index: 0,
                           scrolltop: 0,
                                name: system_name,
                             subdirs: {}};

            self.systems[system_name] = system;
         }
         else
         {
            rescan = true;
         }

         system.promise = deferred.promise;

         if (config.app.ScanAtStartup)
         {
            scan = 1;
         }

         $http.get('svr/gamelist.php',
            {cache: false,
            params:
               {getlist: 1,
                 system: system_name,
                   scan: scan,
             match_media: match_media}
            }
         )
         .then(function onSuccess(response) {

            if (!rescan)
            {
               system.gamelist = response.data.game || [];
               system.total = 0; // start count for games (not directories)
               system.path =  response.data.path;

               // concat arrays without creating a new array
               self.systems.all.gamelist.push.apply(
                  self.systems.all.gamelist, system.gamelist);
            }

            system.has_image =  response.data.has_image;
            system.has_video =  response.data.has_video;
            system.has_marquee =  response.data.has_marquee;

            // look for sub directories
            angular.forEach(response.data.game, function(game)
            {
               // continue if already loaded and not new
               if (rescan)
               {
                  if (!game.new && !match_media)
                  {
                     return;
                  }
                  var old_game = util.searchArrayByObjectField(system.gamelist, 'path', game.path);

                  if (old_game)
                  {
                     if (match_media)
                     {
                        // found new image
                        if (game.image_found && !old_game.image)
                        {
                           old_game.image = game.image;
                           self.md_changed('image', false, old_game);
                        }
                        // found new marquee
                        if (game.marquee_found && !old_game.marquee)
                        {
                           old_game.marquee = game.marquee;
                           self.md_changed('marquee', false, old_game);
                        }
                        // found new video
                        if (game.video_found && !old_game.video)
                        {
                           old_game.video = game.video;
                           self.md_changed('video', false, old_game);
                        }
                     }
                     return;
                  }
               }

               var path = game.path;

               game.sys = system_name;

               // strip home directory (?shouldn't be any)
               var sysdir = "/home/pi/RetroPi/roms/"+system_name;
               if (path.substring(0,sysdir.length) == sysdir)
               {
                  path = path.substring(0,sysdir.length);
               }

               // extra year
               if (game.releasedate)
               {
                  game.year = game.releasedate.substring(0,4);
               }
               else
               {
                  game.releasedate = '';
                  game.year = '';
               }

               if (!game.playcount)
               {
                  game.playcount=0;
               }
               else
               {
                  game.playcount = parseInt(game.playcount);
               }

               if (game.players)
               {
                  game.players = parseInt(game.players);
               }

               if (game.rating<0)
               {
                  game.rating = 0;
               }
               else if (game.rating>1)
               {
                  game.rating = 1;
               }

               // dont even try if its and abs path we dont know about
               // TODO: check need path translation?
               if (path.substring(0,1) == "/")
               {
                  return;
               }

               // no need to point to current directory - this breaks urls so strip
               if (path.substring(0,2) == "./")
               {
                  path = path.substring(2);
               }

               var subdir = self.getSubDirectory(system, path);
               if (subdir)
               {
                  game.subdir = subdir;
                  system.subdirs[subdir].games++;
               }

               if (!game.name)
               {
                  if (subdir)
                  {
                     game.name = path.substring(subdir.length+1);
                  }
                  else
                  {
                     game.name = path;
                  }
               }

               // if rescan then append new game to existing list
               if (rescan)
               {
                  system.gamelist.push(game);
                  self.systems.all.gamelist.push(game);
               }

               if (game.isDir)
               {
                  if (!system.subdirs[path])
                  {
                     system.subdirs[path] = {
                           path: path,
                           game_index: 0,
                           buffer_index: 0,
                           scrolltop: 0,
                           games: 0
                         };
                  }
                  system.subdirs[path].game = game;
               }
               else {
                  system.total++;
                  self.systems.all.total++;
               }
            });
            // Add any directories that contained games (in the game.path)
            // but not in the game list file as entries themselves
            angular.forEach(system.subdirs, function(dir, name)
            {
               if (!dir.game)
               {
                  // create a game object
                  dir.game = {name: name, path: dir.path, isDir: true, sys: system.name};
                  // add it to the game list
                  system.gamelist.push(dir.game);
               }
            });

            deferred.resolve(self.system);
            delete system.promise;

            self.gamelists_loaded++;

         });
      }

      return deferred.promise;
   }

   self.applyFieldsShown = function()
   {
      var gl = ThemeService.gamelist;
      var stretch = !ThemeService.dontstretch[config.app.ThemeSet];

      if (!gl) return;

      // column widths 

      // find total additional width of all extra fields
      var width = 0;
      var extra_width = 0;
      var spacing = 0.005;  // gap between columns
      angular.forEach(self.list_fields, function(f)
      {
         if (f.show) 
         {
            if (f.name == 'name')
            {
               f.width = gl.size.w;
               width += f.width;
            }
            else
            {
               width += f.width + spacing;
            }
         }
      });

      // find the difference of sum of all fields widths > gamelist width
      if (width <= gl.size.w)
      {
         extra_width = 0;  // all fields are within gamelist width
      }
      else
      {
         extra_width = width - gl.size.w;  // we need to stretch
      }

      // as width increases scale down to smaller font so text isn't truncated
      var fontsize;
      var gl_width;
      if (stretch)
      {
         fontsize = gl.fontsize / ( 1 + extra_width);
         gl_width = width / (1 + extra_width);
      }
      else {
         fontsize = gl.fontsize * gl.size.w / ( gl.size.w + extra_width);
         gl_width = width * gl.size.w / ( gl.size.w + extra_width);
      }
      delete gl.div['font-size'];

      // linespacing default 1.5, so 1.5 * font size = line size
      gl.linesize = fontsize + gl.linespacing/100;

      // more rows with smaller font ?
      gl.rows = gl.size.h / gl.linesize  - self.header;

      self.liststyle['max-width']  = util.pct(gl_width,'vw');
      self.liststyle.width         = util.pct(gl_width,'vw');
      self.liststyle.top           = util.pct(gl.pos.y + self.header * gl.linesize,'vh');
      self.liststyle['max-height'] = util.pct(gl.size.h - self.header * gl.linesize,'vh');
      self.liststyle.height        = util.pct(gl.size.h - self.header * gl.linesize,'vh');

      self.liststyle.position      = 'absolute';
      self.liststyle['overflow-y'] = 'auto';
      self.liststyle.outline       = 'none';

      self.liststyle['font-size']  = util.pct(fontsize,'vh');

      // column heading style

      self.headerstyle = angular.copy(self.liststyle);
      self.headerstyle.top           = util.pct(gl.pos.y,'vh');
      self.headerstyle['min-height'] = util.pct(gl.linesize,'vh');
      self.headerstyle['line-height'] = '135%';
      delete self.headerstyle['height'];
      delete self.headerstyle['max-height'];
      self.headerstyle.color = '#' + gl.secondarycolor;
      self.headerstyle['background-color'] = 'rgba(0,0,0,0.2)';

      if (stretch)
      {
         // move everything to the right of x by width and scale everything (left and right)
         // but only page components vertically beside gamelist, not above or below
         ThemeService.insertIntoView(ThemeService.view, gl.pos.x + gl.size.w, extra_width, gl.pos.y, gl.pos.y + gl.size.h);
      }
      self.liststyle.left = gl.div.left;
      self.headerstyle.left = gl.div.left;

      // work out x + widths proportional to overall width
      var x = 0;
      angular.forEach(self.list_fields, function(f)
      {
         if (!f.show)
            return true;
         var lmargin = parseFloat(0.005);
         var rmargin = parseFloat(0.005);

         if (f.name == 'name' && gl.horizontalmargin>0)
         {
            lmargin = parseFloat(gl.horizontalmargin);
         }
         //lmargin = rmargin = 0;
         x += lmargin;

         f.w = util.round( (f.width / width) - (lmargin + rmargin), 6);
         f.style = angular.copy(gl.div); // same style as gamelist
         delete f.style.top;
         delete f.style.height;
         f.style['left'] = util.pct(x, '%');
         f.vw = f.w * gl_width;
         //f.style['max-width'] = f.style['width'] = util.pct(f.vw,'vw');
         f.style['max-width'] = f.style['width'] = util.pct(f.w,'%');

         if (ThemeService.view.name == 'basic')
         {
            f.style['text-align'] = gl.alignment;
         }
         else if (f.align)
         {
            f.style['text-align'] = f.align;
         }
         else
         {
            delete f.style['text-align'];
         }
         x += f.w + rmargin + spacing;

         f.headerstyle = angular.copy(f.style);
         f.headerstyle['line-height'] = '135%';
         f.headerstyle['border-bottom'] = '1px solid rgba(150,150,150,0.4)'; 
      });
   }

   ThemeService.applyGamelistFieldsShown = self.applyFieldsShown;

});
