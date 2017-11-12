/**
 * game_service.js
 *
 * Service to handle Game and Gamelists
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_service', ['WebtroPie.config_service'])
        .service('GameService', service);

    service.$inject = ['config','util','ThemeService',
                             '$http', '$httpParamSerializer', '$q', '$timeout', '$location'];

    function service(config, util, ThemeService,
                          $http, $httpParamSerializer, $q, $timeout, $location)
    {
        var self = this;

        self.allgames = [];

        self.checkSystemTheme = checkSystemTheme;
        self.getDefaultGamelistViewName = getDefaultGamelistViewName;
        self.getGamelist = getGamelist;
        self.getGameMetadata = getGameMetadata;
        self.getParentDir = getParentDir;
        self.getSubDirectory = getSubDirectory;
        self.getSystemGamelist = getSystemGamelist;
        self.goSystem = goSystem;
        self.hideEditor = hideEditor;
        self.launch = launch;
        self.mdChanged = mdChanged;
        self.openFolder = openFolder;
        self.rememberGameMetadata = rememberGameMetadata;
        self.resetGame = resetGame;
        self.save = save;
        self.saveState = saveState;
        self.setFieldText = setFieldText;
        self.setSystem = setSystem;
        self.showEditor = showEditor;
        activate();

        function activate()
        {
            self.systems = {
                'auto-allgames':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: self.allgames,
                       total: 0 },
                'auto-favorites':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: [],
                       total: 0 },
                'auto-lastplayed':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: [],
                       total: 0 },
            };

            self.gamelists_loaded = 0; // increases as system game lists are loaded

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
                 {name: 'name',       type: 'text',                  orderby: 'name', show: true },
                 {name: 'favorite',   type: 'toggle',   width: 0.04, orderby: 'favorite', align: 'center'},
                 {name: 'kidgame',    type: 'toggle',   width: 0.04, orderby: 'kidgame', align: 'center'},
                 {name: 'hidden',     type: 'toggle',   width: 0.04, orderby: 'hidden', align: 'center'},
                 {name: 'human_size', type: 'text',     width: 0.08, orderby: ['-size', 'name'], align: 'right'},
                 {name: 'rating',     type: 'rating',   width: 0.08, orderby: ['!rating','-rating','name'] },
               //{name: 'rating',     type: 'text',     width: 0.06, orderby: ['!rating','-rating','name'] },
                 {name: 'releasedate',type: 'datetime', width: 0.07, orderby: ['-year','name'], format: 'yyyy', align: 'right' },
                 {name: 'releasedate',type: 'datetime', width: 0.13, orderby: ['!releasedate','releasedate'], align: 'right'},
                 {name: 'developer',  type: 'text',     width: 0.24, orderby: ['!developer','developer','name'] },
                 {name: 'publisher',  type: 'text',     width: 0.28, orderby: ['!publisher','publisher','name'] },
                 {name: 'genre',      type: 'text',     width: 0.16, orderby: ['!genre','genre','name'] },
                 {name: 'players',    type: 'text',     width: 0.03, orderby: ['players','name'], align: 'center' },
                 {name: 'lastplayed', type: 'datetime', width: 0.12, orderby: 'lastplayed', reverse: true, align: 'right' },
                 {name: 'playcount',  type: 'text',     width: 0.04, orderby: 'playcount', reverse: true, align: 'center' },
            ]

            config.init()
            .then(setFieldText);
        }

        function getDefaultGamelistViewName(system_name)
        {
            if (config.app.ViewStyle)            // user chosen view
            {
                return config.app.ViewStyle;
            }
            else if (self.systems[system_name])  // game list is loaded
            {
                if (self.systems[system_name].has_image)
                {
                    // theme has video view and either gamelist has a video or
                    // theme flag showSnapshotNoVideo is true
                    var system = ThemeService.getSystemTheme(system_name);
                    if (system.view &&
                        system.view.video
                         && (self.systems[system_name].has_video ||
                             system.view.video.showSnapshotNoVideo == 'true'))
                    {
                        return 'video';
                    }
                    else
                    {
                        return 'detailed';
                    }
                }
                else
                {
                    return 'basic';
                }
            }
            else
            {
                return 'detailed';
            }
        }

        function checkSystemTheme(system_name, chooseBestGamelistView)
        {
            var view_name;

            if (ThemeService.view.name == 'basic' ||
                  ThemeService.view.name == 'detailed' ||
                  ThemeService.view.name == 'video')
            {
                if (!chooseBestGamelistView &&
                     ThemeService.view &&
                     system_name == ThemeService.system.name)
                {
                    view_name = ThemeService.view.name;
                }
                else
                {
                    view_name = getDefaultGamelistViewName(system_name);
                }
            }
            else
            {
                view_name = ThemeService.view.name;
            }

            // make sure theme system/view matches the gamelist system
            if (!ThemeService.view ||
                  ThemeService.system.missing ||
                  system_name != ThemeService.system.name ||
                  view_name != ThemeService.view.name)
            {
                ThemeService.setSystemByName(system_name, view_name);
            }
        }

        function hideEditor()
        {
            self.edit = false;
            util.defaultFocus();
        }

        // get either a specific gamelist for a system or all systems
        function getGamelist(system_name)
        {
            var promise;
            if (system_name.substring(0,4)=='auto' //||
                 //system.name.substring(0,6)=='custom'
                )      // get all systems
            {
                angular.forEach(config.systems, function(sys)
                {
                    if (sys.name.substring(0,4)=='auto' ||
                         sys.name.substring(0,6)=='custom' ||
                         !sys.has_games
                     )
                    {
                        return;
                    }
                    var p = getSystemGamelist(sys.name);
                    if (!promise) promise = p;
                });
            }
            else     // specific system
            {
                promise =  getSystemGamelist(system_name);
            }

            return promise;
        }

        // return text, can either be extra text itself,
        // a game attribute label or a game attribute
        function getGameMetadata(game, obj, isMd)
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
            else if (name && name.substring(0,3)=="md_")
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
                    else if (name == 'players')
                        return '1';
                    else if (name == 'playcount')
                        return '0';
                    return;
                }

                if (isObject && obj.type == 'datetime')
                {
                    return util.formatDate(text, obj.format);
                }

                if (name == 'name')
                {
                    if (!game.isDir && self.system_name.substring(0,4)=='auto')
                    {
                        // remove [.*]
                        if(text)
                            text = text.replace(/\[[^\]]*\]/g,'')
                        // remove (.*)
                        if(text)
                            text = text.replace(/\([^\)]*\)/g,'');
                    }
                    if (game.new)
                    {
                        text = 'New: '+text;
                    }
                    if (game.isDir)
                    {
                        text += ' ('+self.subdirs[game.path].games+')';
                    }
                    else
                    {
                        if (self.system_name.substring(0,4)=='auto')
                        {
                            text += ' ('+game.sys+')';
                        }
                    }
                }

                return text;
            }

            return (typeof obj) == 'object' ? obj.text : obj;
        }

        // return path of parent directory
        function getParentDir(path)
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
        function getSubDirectory(system, path)
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

                    var parent = getSubDirectory(system, path); // recursively find parents
                    if (parent)
                    {
                        dir.parent = parent;
                    }

                    system.subdirs[path] = dir;
                }
                return path;
            }
        }

        // get a single gamelist for a system
        function getSystemGamelist(system_name, scan, match_media)
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
                deferred.resolve(self.systems[system_name]);
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
                        //self.systems['auto-allgames'].gamelist.push.apply(
                        //    self.systems['auto-allgames'].gamelist, system.gamelist);
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
                                        mdChanged('image', false, old_game);
                                    }
                                    // found new marquee
                                    if (game.marquee_found && !old_game.marquee)
                                    {
                                        old_game.marquee = game.marquee;
                                        mdChanged('marquee', false, old_game);
                                    }
                                    // found new video
                                    if (game.video_found && !old_game.video)
                                    {
                                        old_game.video = game.video;
                                        mdChanged('video', false, old_game);
                                    }
                                }
                                return;
                            }
                        }

                        game.sys = system_name;

                        // extra year
                        if (game.releasedate &&
                             game.releasedate.substring(0,8)!= '00000000')
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
                            game.playcount = 0;
                        }
                        else
                        {
                            game.playcount = parseInt(game.playcount);
                        }

                        if (game.rating<0)
                        {
                            game.rating = 0;
                        }
                        else if (game.rating>1)
                        {
                            game.rating = 1;
                        }

                        // Add to list and auto lists
                        if (rescan)
                        {
                            system.gamelist.push(game);
                            self.systems['auto-allgames'].gamelist.push(game);
                        }

                        if (!game.isDir)
                        {
                            system.total++;
                            self.systems['auto-allgames'].gamelist.push(game);
                            self.systems['auto-allgames'].total++;
                            if (game.image)
                            {
                                self.systems['auto-allgames'].has_image = true;
                            }
                            if (game.marquee)
                            {
                                self.systems['auto-allgames'].has_marquee = true;
                            }
                            if (game.video)
                            {
                                self.systems['auto-allgames'].has_video = true;
                            }

                            if (game.favorite)
                            {
                                self.systems['auto-favorites'].gamelist.push(game);
                                self.systems['auto-favorites'].total++;
                                if (game.image)
                                {
                                    self.systems['auto-favorites'].has_image = true;
                                }
                                if (game.marquee)
                                {
                                    self.systems['auto-favorites'].has_marquee = true;
                                }
                                if (game.video)
                                {
                                    self.systems['auto-favorites'].has_video = true;
                                }
                            }
                            if (game.playcount>1)
                            {
                                self.systems['auto-lastplayed'].gamelist.push(game);
                                self.systems['auto-lastplayed'].total++;
                                if (game.image)
                                {
                                    self.systems['auto-lastplayed'].has_image = true;
                                }
                                if (game.marquee)
                                {
                                    self.systems['auto-lastplayed'].has_marquee = true;
                                }
                                if (game.video)
                                {
                                    self.systems['auto-lastplayed'].has_video = true;
                                }
                            }
                        }

                        // Work out subdirectories
                        //  only relative or under roms directory

                        var path = game.path;

                        // strip home directory (?shouldn't be any)
                        var sysdir = "/home/pi/RetroPi/roms/"+system_name;
                        if (path.substring(0,sysdir.length) == sysdir)
                        {
                            path = path.substring(0,sysdir.length);
                        }
          
                        // dont even try if its and abs path
                        if (path.substring(0,1) == "/")
                        {
                            return;
                        }

                        // no need to point to current directory - this breaks urls so strip
                        if (path.substring(0,2) == "./")
                        {
                            path = path.substring(2);
                        }

                        var subdir = getSubDirectory(system, path);
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

                    });

                    // Add any directories that contained games (in the game.path)
                    // but not in the game list file as entries themselves
                    var dir_count = 0;
                    angular.forEach(system.subdirs, function(dir, name)
                    {
                        if (!dir.game)
                        {
                            // create a game object
                            dir.game = {name: name, path: dir.path, isDir: true, sys: system.name};
                            // add it to the game list
                            system.gamelist.push(dir.game);
                        }
                        dir_count++;
                    });

                    console.groupCollapsed("%s (%d)", system_name, system.total);
                    console.log("games = %04d", system.total);
                    console.log("directories = %04d", dir_count);
                    console.log("total = %04d", system.gamelist.length);
                    console.groupEnd();

                    deferred.resolve(system);
                    delete system.promise;

                    self.gamelists_loaded++;

                });
            }

            return deferred.promise;
        }


        function goSystem(system_name)
        {
            ThemeService.playSound('systemselect');
            delete ThemeService.applyGamelistFieldsShown;

            var subdir;
            if(self.systems[system_name])
            {
                subdir = self.systems[system_name].subdir;
            }

            //delete GameService.gamelist;
            delete self.game;

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


        // launch the passed in game or current game remotely
        function launch(game)
        {
            game = game || self.game;

            $http.get('svr/gamelist_edit.php', {cache: false, params:
                                    {run: game.path, system: game.sys}})
        }

        // record which metadata has changed and optionally save
        function mdChanged(md, autosave, game, changeSelected, selectedList)
        {
            game = game || self.game;  // the current game

            if (!game.changes)
            {
                game.changes = {};
            }

            game.changes[md] = true;

            // if requested auto save changes
            if(autosave)
            {
                save(game);
            }

            // duplicate change to all selected games
            if (selectedList.length && game.selected && changeSelected)
            {
                angular.forEach(selectedList, function(selectedGame)
                {
                    if (selectedGame != game)
                    {
                        rememberGameMetadata(selectedGame);
                        selectedGame[md] = game[md];
                        mdChanged(md, autosave, selectedGame, false);
                    }
                });
            }
        }

        // navigate to sub folder
        function openFolder()
        {
            saveState();
            util.call( '/'+ self.game.sys + '/' + self.game.path );
        }

        // save a copy of the current game meta data incase of editing
        function rememberGameMetadata(game)
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

        // restore game meta data to it's original values
        function resetGame(game)
        {
            if (!game.reset)
            {
                return;
            }

            angular.forEach(self.attrs, function(field)
            {
                game[field] = game.reset[field];
            });

            delete game.changes;
        }


        // save changed fields for a single game
        function save(game)
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

        // remember state
        // store the index positions for either root or subdirectory
        function saveState(vm)
        {
            if (!vm && self.gamelist_vm)
            {
                vm = self.gamelist_vm;
            }
            if (!vm)
            {
                return;
            }
            if (self.subdir)
            {
                self.subdirs[self.subdir].game_index = vm.game_index;
                self.subdirs[self.subdir].buffer_index = vm.buffer_index;
                self.subdirs[self.subdir].scrollTop = vm.scroller.scrollTop;
            }
            else
            {
                self.systems[self.system_name].game_index = vm.game_index;
                self.systems[self.system_name].buffer_index = vm.buffer_index;
                self.systems[self.system_name].scrollTop = vm.scroller.scrollTop;
          }
        }

        // set current language column headings
        function setFieldText()
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

        // switch gamelist system, update system/gamelist globals
        function setSystem(system_name, subdir, chooseBestGamelistView, vm)
        {
//console.log('gamelist setsystem ' + system_name + ' choose = ' + chooseBestGamelistView)
            checkSystemTheme(system_name, chooseBestGamelistView);

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
                self.subdir   = self.systems[system_name].subdir;
            }
            else
            {
                self.subdir   = subdir
            }
            self.subdirs      = self.systems[system_name].subdirs;
            self.has_subdirs  = !angular.equals({},self.subdirs);

            if (vm)
            {
                self.gamelist_vm = vm;
                vm.gamelist = self.gamelist;
                if (self.subdir)
                {
                    vm.game_index   = self.subdirs[self.subdir].game_index;
                    vm.buffer_index = self.subdirs[self.subdir].buffer_index;
                    $timeout(function(){
                        vm.scrollTo(self.subdirs[self.subdir].scrollTop);
                    });
                }
                else
                {
                    vm.game_index   = self.systems[system_name].game_index;
                    vm.buffer_index = self.systems[system_name].buffer_index;
                    $timeout(function(){
                        vm.scrollTo(self.systems[system_name].scrollTop);
                    });
                }
//console.log('game.service setSystem trying to setGame');
                vm.setGame();
            }
        }

        function showEditor()
        {
            //$scope.app.hideMenu();
            if (config.env.read_only)
            {
                return;
            }
            self.edit = true;
        }
    }

})();
