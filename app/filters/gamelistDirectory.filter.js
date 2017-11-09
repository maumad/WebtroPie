/**
 * gamelist-directory.filter.js
 *
 * Parameters
 *      subdir - the directory to filter to games
 *
 * Also references :-
 *      GameService.show_nested
 *      GameService.show_favorite
 *      config.app.ShowEmptyDirectories (passed in)
 *
 * Filter games within a gamelist by a directory to show just the games contained
 * within that directory
 *
 * also, filter favorites if show favorite is set
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.gamelist')
        .filter('directory', directory);
        
        
    function directory(GameService)
    {
        return function(rows, subdir, ShowEmptyDirectories)
        {
            // everything, do nothing just return the input array
            if (typeof rows === 'undefined' ||
                (GameService.show_nested && !GameService.show_favorite))
            {
                return rows;
            }

            var result = [];
            angular.forEach(rows, function(row)
            {
                // show nothing if empty directory
                if (row.isDir &&
                      //!app.config.app.ShowEmptyDirectories &&
                      !ShowEmptyDirectories &&
                      GameService.subdirs &&
                      GameService.subdirs[row.path].games == 0)
                {
                    return;
                }
                // folder and favourite filter
                if ( ( (GameService.show_nested ||
                         GameService.system_name=='auto-allgames' ||
                         GameService.system_name=='auto-favorites' ||
                         GameService.system_name=='auto-lastplayed') && !row.isDir) ||
                      (!subdir && !row.subdir) ||                    // both root folder
                      (subdir == row.subdir) )                       // matching folder name
                {
                    if (!GameService.show_favorite ||                  // show all
                        (GameService.show_favorite && row.favorite)) // show only favorite
                    {
                        result.push(row);
                    }
                }
            });
            return result;
        }
    }

})();

