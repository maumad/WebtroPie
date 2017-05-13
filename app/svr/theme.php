<?php
error_reporting(E_ERROR);
$seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache");

require_once("xml_util.php");
require_once("config.php");

$array_types = array('include'=>true);
$index_types = array('image'=>0,
                     'view'=>0);

// find all system directories that have a gamelist.xml
// and return the system themes for those systems

if(!isset($_GET['theme']) || $_GET['theme']=='null' || !file_exists('themes/'.$_GET['theme']))
   $theme = DEFAULT_THEME;
else
   $theme = $_GET['theme'];

$path = "themes/".$theme;

$response = array();

$response['name'] = $theme;
$response['path'] = 'svr/'.$path;
$response['has_gd'] = extension_loaded('gd') ? 1 : 0;

// load file and recursively includes within included files
$response['includes'] = array();
function load_and_include($file) {
   global $response, $path;

   // the files that will be returned as an array
   $arr = load_file_xml_as_array($file);


   // add includes to the array of includes recursively
   if(isset($arr['include']))
   foreach ($arr['include'] as $index => $incfile) {
      $incfile = ltrim($incfile,"./../"); // we dont need this
      $arr['include'][$index] = $incfile;
      // if it hasn't already been included then include it
      if(!isset($response['includes'][$incfile]))
         $response['includes'][$incfile] = load_and_include($path.'/'.$incfile);
   }

   return $arr;
}

// array of 'systems', get theme for each system/platform
// where roms/system/gamelist.xml exists
if ($dh = opendir(ROMSPATH))
{
   $response['systems'] = array();
   while (($system = readdir($dh)) !== false)
   {
      if ($system != '.' && $system != '..' &&
          is_dir(ROMSPATH."/".$system) &&
         ($_GET['all']  ||
          filesize(ROMSPATH."/".$system."/gamelist.xml") > 40 ||
          filesize(HOME_ES."/gamelists/".$system."/gamelist.xml") > 40 ||
          filesize(ES_PATH."/gamelists/".$system."/gamelist.xml") > 40))
      {
         // system them file
         $syspath = $path."/".$system;
         $systhemefile = $syspath."/theme.xml";
         // if E.g "mame-libretro" doesn't exist use "mame"
         if(!file_exists($systhemefile) && strpos($system,'-')!==false) {
            $syspath = $path."/".preg_replace('/-.*/','',$system);
            $systhemefile = $syspath."/theme.xml";
         }
         $system_array =
           array(
             'name' => $system,
             'path' => 'svr/'.$syspath,
             'theme' => load_and_include($systhemefile)
           );

         array_push($response['systems'], $system_array);
      }
   }
   closedir($dh);
}

// also get a list of names of other available themes
$response['themes'] = array();
if($dh = opendir("themes")) {
   while(($theme = readdir($dh)) !== false)
      if($theme != '.' && $theme != '..' && is_dir("themes/".$theme))
         array_push($response['themes'], array( 'name' => $theme));
   closedir($dh);
}

// return converted array to json
echo json_encode($response);
?>
