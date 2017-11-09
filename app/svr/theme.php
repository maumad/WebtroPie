<?php
error_reporting(E_ERROR);
$seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache");


require_once("xml_util.php");
require_once("vars.php");

$theme = '';

// Get config at the same time
if (isset($_GET['theme']) && $_GET['theme']!='null')
{
   $theme = $_GET['theme'];
}

$_GET['get'] = SYSTEMS;

if (!$theme)
{
   $_GET['get'] |= APP | ENV;
}

$response = array();
$inc=true;
global $inc;
require("config.php");

$array_types = array('include'=>true, 'feature'=>true);
$index_types = array('image'=>0, 'view'=>0);

// find all system directories that have a gamelist.xml
// and return the system themes for those systems

if (!$theme)
{
   $theme = $config['app']['ThemeSet'];
   if (!$theme)
   {
       $theme = $config['es']['ThemeSet'];
       if (!$theme)
       {
           $theme = DEFAULT_THEME;
       }
   }
}

$scan = 0;

$themepath = "themes/".$theme;

$response = array();
$response['name'] = $theme;
$response['path'] = 'svr/'.$themepath;
$response['has_gd'] = extension_loaded('gd') ? 1 : 0;

// load file and recursively includes within included files
$response['includes'] = array();

$response['fonts'] = array();

function filepathinfo($file)
{
   global $themepath;

   $path = pathinfo($file, PATHINFO_DIRNAME );
   $file = pathinfo($file, PATHINFO_BASENAME );

   // simplify path remove ./
   $path = preg_replace('|/\./|','/',$path);
   $path = preg_replace('|/\.$|','',$path);
   // simplify path remove "dir/.."
   $path = preg_replace('|([^/]*)/\.\.|','',$path);
   $path = preg_replace('|^\/|','',$path);
   // simplify path remove //
   $path = preg_replace('|//|','/',$path);

   if($path)
      $fullpath = $path.'/'.$file;
   else
      $fullpath = $file;

   return array('fullpath' => $fullpath,
                'path' =>  $path,
                'file' => $file);
}

function get_font_metrics(&$text, $path)
{
   global $response, $themepath;

   if(!isset($text['fontPath']))
      return;

   $fullpath = filepathinfo($themepath.'/'.$path.'/'.$text['fontPath'])['fullpath'];
   // alternate method, avoids php bug in filepathinfo
   if(!file_exists($fullpath))
   {
      $fullpath =  preg_replace('|.*('.$themepath.')|','$1',
                   realpath($themepath.'/'.$path.'/'.$text['fontPath']));
   }

   if(!file_exists($fullpath)) {
      return;
   }
   $family = substr($fullpath,7, strlen($fullpath)-11);
   $family = str_replace(array('-','/'),'_',$family);
   $text['fontFamily'] = $family;
   unset($text['fontPath']);
   if(!isset($response['fonts'][$family])) {

      $em = 1000;
      $uppercase_dims   = imagettfbbox($em, 0, $fullpath, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()');
      $mixedcase_dims   = imagettfbbox($em, 0, $fullpath, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789()abcdefghijklmnopqrstuvwxyz');
      $uppercase_ascender  = -$uppercase_dims[5] / 12;
      $uppercase_descender =  $uppercase_dims[1] / 12;
      $mixedcase_ascender  = -$mixedcase_dims[5] / 12;
      $mixedcase_descender =  $mixedcase_dims[1] / 12;

      $ascender = max($mixedcase_ascender, $uppercase_ascender);
      //if($ascender<100) $ascender=100;

      $uppercase_height    = $uppercase_ascender;
      $mixedcase_height    = $mixedcase_ascender; // + //; //$uppercase_ascender; // +
                              // max($mixedcase_descender, $uppercase_descender);
      $average_height = ( $uppercase_height + $mixedcase_height ) / 2;

      $response['fonts'][$family] = array(
         'fullpath' => 'svr/'.$fullpath,
         'family' => $family,
         'uppercase_ascender'    => $uppercase_ascender,
         'uppercase_descender' => $uppercase_descender,
         'mixedcase_ascender'    => $mixedcase_ascender,
         'mixedcase_descender' => $mixedcase_descender,
         'uppercase_line_height' => $uppercase_height,
         'mixedcase_line_height' => $mixedcase_height,
         'average_line_height' => $average_height
        );
   }
}

function get_views_font_metrics(&$views, $path)
{
   foreach ($views as &$view)
   {
      foreach ($view['text'] as &$el)       get_font_metrics($el, $path);
      foreach ($view['textlist'] as &$el)   get_font_metrics($el, $path);
      foreach ($view['datetime'] as &$el)   get_font_metrics($el, $path);
      foreach ($view['helpsystem'] as &$el) get_font_metrics($el, $path);
   }
}

function load_and_include($file, &$parent, $index)
{
   global $response, $themepath;

   $fi = filepathinfo($file);
   $path = $fi['path'];
   $file = $fi['file'];
   $incfile = $fi['fullpath'];

   if(isset($index)) {
      // copy modified reference back to parent
      $parent['include'][$index] = $incfile;
      // if already included return
      if ($response['includes'][$incfile])
         return;
   }

   // the files that will be returned as an array
   $arr = load_file_xml_as_array($themepath.'/'.$incfile);
   get_views_font_metrics($arr['view'], $path);
   //get_views_font_metrics($arr['feature']['view'], $path);
   foreach ($arr['feature'] as &$feature) {
      get_views_font_metrics($feature['view'], $path);
   }

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
//if ($dh = opendir(ROMSPATH))
if (file_exists(ROMSPATH))
{
   $response['systems'] = array();

   // default theme
   if (file_exists($themepath.'/theme.xml'))
   {
      $response['systems']['default'] =
      array('name' => 'default',
            'path' => 'svr/'.$themepath,
            'theme' => load_and_include('theme.xml'));
   }

   // (usable -having roms) system themes
   //while (($system = readdir($dh)) !== false)
   foreach ($config['systems'] as $system_name => $system)
   {
      if (is_dir(ROMSPATH.'/'.$system_name) &&
         ($_GET['all']  ||
          ($scan &&
           (file_exists(ROMSPATH.'/'.$system_name."/gamelist.xml") ||
            file_exists(HOME_ES."/gamelists/".$system_name."/gamelist.xml") ||
            file_exists(ES_PATH."/gamelists/".$system_name."/gamelist.xml"))
          ) ||
          (!$scan &&
           (filesize(ROMSPATH.'/'.$system_name."/gamelist.xml") > 40 ||
            filesize(HOME_ES."/gamelists/".$system_name."/gamelist.xml") > 40 ||
            filesize(ES_PATH."/gamelists/".$system_name."/gamelist.xml") > 40)
          )
         ))
      {
         if (file_exists($themepath.'/'.$system['theme'].'/theme.xml'))
         {
            $response['systems'][$system['theme']] = 
               array(
                 'name' => $system['theme'],
                 'path' => 'svr/'.$themepath.'/'.$system['theme'],
                 'theme' => load_and_include($system['theme'].'/theme.xml')
               );
         }
         elseif (file_exists($themepath.'/'.$system['name'].'/theme.xml'))
         {
            $response['systems'][$system['name']] =
               array(
                 'name' => $system['name'],
                 'path' => 'svr/'.$themepath.'/'.$system['name'],
                 'theme' => load_and_include($system['name'].'/theme.xml')
               );
         }
      }
   }
   //closedir($dh);

   // collections
   foreach (array('auto-allgames','auto-favorites','auto-lastplayed','custom-collections') as $system)
   {
      if (file_exists($themepath.'/'.$system.'/theme.xml'))
      {
        $response['systems'][$system] =
            array('name' => $system,
                  'path' => 'svr/'.$themepath.'/'.$system,
                  'theme' => load_and_include($system.'/theme.xml'));
      }
   }

}
else
   $response['error'] = "Can't open ".ROMSPATH;

// return converted array to json
echo json_encode($response);
?>
