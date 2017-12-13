# WebtroPie WIP 0.2.2

WebtroPie is a ROM Manager specifically for RetroPie

* [source](https://github.com/gazpan/WebtroPie)
* [early WIP very long video](https://www.youtube.com/watch?v=d1ovSZqve44)
* [forum link](https://retropie.org.uk/forum/topic/10164/web-app-wip-please-give-it-a-name/18)

WebtroPie is a website hosted on your raspberry pi so it can read and write game information directly on the pi.

It can be used by any device running a modern web browser in your home or remote network without a need to install any additional files on the device.

WebtroPie uses the themes installed on your pi to show systems and gamelists similarly to EmulationStation.


Controls
=

The opening screen is a systems selection screen and this can be used in much the same way as emulationstation using the arrow keys and enter key to select a system.

You can also use the mouse or finger to drag the system bar and click on a system to drill into a games list, this is also true of game lists, any of the logos can be clicked on to drill into that system, it does not have to be the center logo

System screen
-

* Arrow Keys Left / Right to change system
* Enter key to select system and proceed to gamelist page.
* Any alphanumeric character navigates to the 'all' gamelisting and enters the first character into the filter box - so, for example from first launch simply typing 'pacman' will list all pacman games
* Ctrl-M to open memu
* You can also click on items in the helpbar usually at the foot of the web page

Helpbar :-

* Click 'MENU' for main menu
* Click heart icon to navigate to 'all' gamelist filtered by games flagged as favourite

Gamelist screen
-

* Arrow Keys Left / Right to change system
* Arrow Keys Up, Down, Page Up, Page Down to change game
* Home Key - top of list
* End Key - bottom of list
* Enter Key to open game editor for a game or open sub directory
* Escape key, closes the editor (if open) or
              clears the filter box (if filtered) or
                            goes to parent diretory (if in a subdirectory) or
                                          goes to the system screen  - note: this is not exactly the same as clicking the browser back button which is only the same if the previous page is the system menu.

* Mouse scroll to scroll the list
* Mouse left click to change the selected game, a second click opens the game editor
* Right click for context menu which applies to either the selection list or single game if the mouseover game is not selected

* Ctrl + click to add to selection list
* Shift + click to add range between last click and click to selection list
* Shift + Ctrl + click to select all or none

Helpbar :-

* click OPTIONS for game list centric options
* click MENU for the spplication main menu
* click BACK for system view
* click HEART icon to filter the list by games flagged as a favourite
* click FOLDER icon to toggle between showing only files within the current directory and also files in subdirectories.

Filtering

On a games list screen you can enter part of a name in the filter box to filter the list to a smaller selection.

Sorting

When addtional fields are added the column headings appear, clicking on these headings is another way of sorting by that column, clicking a second time reverses the order.

Adding and Removing Game listing Fields - +/-

By default just the game name is listed, click columns to add aditional columns to the list.

Special editing components
--------------------------
If the current theme supports it several components modify the game meta data directly without the need to go into the game editor screen, these are :-
 * Rating
 * Kidgame
 * Favorite
 * Hidden

By clicking when unchecked Kidgame, Favorite and Hidden appear faintly (20% opacity) in the color determined by the theme, when clicked the Favorite (heart) becomes Red, Kidgame (bear) becomes brown and hidden becomes the true theme color. The value is changed and the game meta data is automatically saved.

When the Rating stars are clicked depending on which star is click alters the rating value, the game meta data is automatically saved.

If the current theme does not show these controls then they can be shown by adding a column to the listing (see above).

'all' game list view
--------------------
The 'all' game list shows games across all systems. The system theme matches the currently selected game which usually includes the logo and name of the system platform that the game belongs to. The list can be sorted and filtered in the same way as other game lists.

Game Meta Data Editor
---------------------
Any of the alterable metadata items can be edited here, when a field is changed the SAVE and RESET buttons appear, SAVE saves the meta data changes, RESET returns the metadata to the last saved state.

CANCEL closes the editor but any unsaved changes remain until either later RESET or SAVED.

The Kidgame, Favorite, Hidden and Rating controls behave in the same way as described for the game listing page above except that changes are not saved immediatly in the same way that other changes are not saved immediately.

Rating can be changed by either typing in the rating field, clicking the up/down spinners or clicking on the stars slider.

If the Image field is colored red it indicates that the current image does not exist.

Launching a Game
----------------

The LAUNCH button on the Game Editor launches the game remotely on the raspberry pi, at the time of writing not all emulators correctly capture the keyboard input, libretro emulators seem ok and of non keyboard based inputs will still work on all emulators.

If the LAUNCH button is not present it means that the ENABLE_LAUNCH.sh script has not been executed, this script generates a runcommand.sh script that can be executed from the web server and also changes the user which the apache web server runs as, this is necessary as many emulators need to run as the 'pi' user for correct permissions and config file paths and also to ensure that all image and data files are readable by the web application. However, this is optional and if not run the web application should still mostly work without this launch functionality.

Config and Settings
-------------------

Default options can be found in confg/settings.cfg. (TODO: user_settings.cfg a copy of settings.cfg with local changes that do not get overwritten after a WebtroPie update)

- *LoadAllSystems* : Get all system's gamelists when page is first loaded or refreshed, if the gamelist has not been updated then this may be from client chache.
- *ScanAtStartup* : Scan all systems's ROMS directories for new roms when page is firt loaded or refreshed.
- *ShowEmptySystems* : (TODO) Show on the system carousel systems that have no games.
- *ShowEmptyDirectories* : Show on the gamelist screen any directories that do not contain games
- *ShowAddFields* : Show on the gamelist screen Helpbar the option to add additional fields to the game list
- *ShowGameCounts* : Show on the gamelist screen Helpbar the total number of games for the current system and the number of filtered games.
- *ShowThemeSelect* : Show of the Helpbar the Theme seletion
- *ShowViewSelect* : Show on the gamelist screen helpbar the View selection
- *LogSystemTotals* : Show in the browser console additional game count information including duplicate counts and lists.
- *LogThemeStyles* : Show in the browser console theme element attributes and resulting css style.
- *WanEditMode* : By default (false) all devices on 192.168.* network have write access, when true there is no restriction.
- *ThemeSet* : The current theme
- *Language* : Language
- *DateFormat* : Date format
- *ViewTransitions* : Slide, Fade or none
- *ViewStyle* : Basic, Detailed, Video or none for automatic
- *uploadImageDirectory* : Default absolute path or relative to the system rom directory of where images are uploaded, or where media is matched from. Default is 'images' but may be a path including the "$(system_name}" variable E.g. "~/medias/${system_name}/box front". Note: Directory must be under /home/pi
- *uploadVideoDirectory* : Default absolute path or relative to the system rom directory of where videos are uploaded, or where media is matched from. Default is 'videos' but may be a path including the "$(system_name}" variable E.g. "~/medias/${system_name}/videos"
- *uploadMarqueeDirectory* : Default absolute path or relative to the system rom directory of where marquees are uploaded, or where media is matched from. Default is 'marquees' but may be a path including the "$(system_name}" variable E.g. "~/medias/${system_name}/marquees"
- *maxImageSize* : If smaller than the uploaded image size then scale down the image to the maximum size that the maxImageSize dimensions can contain. E.g. 400x400
- *maxMarqueeSize* : If smaller than the uploaded marquee size then scale down the marquee to the maximum size that the maxMarqueeSize dimensions can contain. E.g. 400x400

### Thanks

* Darknior for lots of ideas, testing and patience. Many thanks
* creators of retropie, emulationstation and emulator creators
* retropie community
* theme makers for emulationstation, thanks for making WebtroPie look good
* google for making angularjs
* php guys




