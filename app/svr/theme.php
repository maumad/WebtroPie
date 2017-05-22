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

$themepath = "themes/".$theme;

$response = array();
$response['name'] = $theme;
$response['path'] = 'svr/'.$themepath;
$response['has_gd'] = extension_loaded('gd') ? 1 : 0;

// load file and recursively includes within included files
$response['includes'] = array();

function load_and_include($file, &$parent, $index)
{
   global $response, $themepath;

   $path = pathinfo($file, PATHINFO_DIRNAME );
   $file = pathinfo($file, PATHINFO_BASENAME );

   // simplify path remove ./
   $path = preg_replace('|/\./|','/',$path);
   $path = preg_replace('|/\.$|','',$path);
   // simplify path remove dir/..
   $path = preg_replace('|([^/]*)/\.\.|','',$path);
   $path = preg_replace('|^\/|','',$path);

   if($path)
      $incfile = $path.'/'.$file;
   else
      $incfile = $file;

   if(isset($index)) {
      // copy modified reference back to parent
      $parent['include'][$index] = $incfile;
      // if already included return
      if ($response['includes'][$incfile])
         return;
   }

   // the files that will be returned as an array
   $arr = load_file_xml_as_array($themepath.'/'.$incfile);

   // store include file in response
   if(isset($index))
      $response['includes'][$incfile] = &$arr;

   // include includes recursively
   if (isset($arr['include']))
   foreach ($arr['include'] as $index => $incfile)
   {
      load_and_include($path.'/'.$incfile, $arr, $index);
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
          is_dir(ROMSPATH.'/'.$system) &&
         ($_GET['all']  ||
          filesize(ROMSPATH.'/'.$system."/gamelist.xml") > 40 ||
          filesize(HOME_ES."/gamelists/".$system."/gamelist.xml") > 40 ||
          filesize(ES_PATH."/gamelists/".$system."/gamelist.xml") > 40))
      {
         $platform = $system;
         // if E.g "mame-libretro" doesn't exist use "mame"
         if (substr($system, 0, 5) == 'mame-' &&
            !file_exists($themepath.'/'.$system.'/theme.xml') &&
             file_exists($themepath.'/mame/theme.xml'))
         {
            $platform = 'mame';
         }
         $system_array =
           array(
             'name' => $system,
             'path' => 'svr/'.$themepath.'/'.$platform,
             'theme' => load_and_include($platform.'/theme.xml')
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
