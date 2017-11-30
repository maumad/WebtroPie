<?php
error_reporting(E_ERROR);
require_once("xml_util.php");
require_once("vars.php");

$system='';
$svr_dir = getcwd();
$local_client = preg_match('/192.168/',$_SERVER['REMOTE_ADDR']) ? true : false;

// get a full list of games for a system
if (isset($_GET['system']))
{
   $system = $_GET['system'];
   $getlist = $_GET['getlist'];
   // edit mode
   if ($local_client)
   {
      $scan   = $_GET['scan'];       // search for new roms
      $match_media = $_GET['match_media']; // match media : images/videos/marquees
      $run    = $_GET['run'];
   }
}

if (!$system) exit;

$SYSTEM_PATH = ROMSPATH.$system;

// work out which gamelist.xml to use
$gamelist_file = $SYSTEM_PATH."/gamelist.xml";
$gamelist_json = $svr_dir . '/' . $SYSTEM_PATH."/gamelist.json";
if (!file_exists($gamelist_file))
{
   $gamelist_file = HOME_ES."/gamelists/".$system."/gamelist.xml";
   $gamelist_json = HOME_ES."/gamelists/".$system."/gamelist.json";
   if (!file_exists($gamelist_file))
   {
      $gamelist_file = ES_PATH."/gamelists/".$system."/gamelist.xml";
      $gamelist_json = ES_PATH."/gamelists/".$system."/gamelist.json";
      if (!file_exists($gamelist_file))
      {
         $gamelist_file = "/opt/retropie/configs/all/emulationstation/".$system_name."/gamelist.xml";
         $gamelist_json = "/opt/retropie/configs/all/emulationstation/".$system_name."/gamelist.json";
         if (!file_exists($gamelist_file))
         {
            exit;
         }
      }
   }
}

$settings = load_file_xml_as_array('../config/settings.cfg','y');
if(file_exists($gamelist_json) &&
    filemtime($gamelist_json) > filemtime($gamelist_file))
{
   echo file_get_contents($gamelist_json);
   exit;
}

function human_filesize($bytes, $decimals = 1)
{
   $sz = 'BKMGTP';
   $factor = floor((strlen($bytes) - 1) / 3);
   return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

function check_media($media, $ext) {

   global $SYSTEM_PATH, $response, $game, $index, $match_media, $system;
   global $svr_dir;

   if (isset($game[$media]))
   {
      $response['has_'.$media] = true;

      $url='';
      $fullpath='';
      if(substr($game[$media],0,2) == "./")
      {
         $url = $SYSTEM_PATH.'/'.substr($game[$media],2);
      }
      elseif (substr($game[$media],0,2) == "~/")
      {
         $fullpath = HOME.'/'.substr($game[$media],2);
      }
      elseif (substr($game[$media],0,1) != "/")
      {
         $url = $SYSTEM_PATH.'/'.$game[$media];
      }
      else
      {
         $fullpath = $game[$media];
      }
      if ($fullpath)
      {
         $fullpath = simplify_path($fullpath);
         $l = strlen('/home/pi/RetroPie/');
         if (substr($fullpath, 0, $l) === '/home/pi/RetroPie/')
         {
             $url = substr($fullpath, $l);
             if (!file_exists($url))
             {
                 $p = strpos($url, '/'.$system.'/');
                 if ($p !== false)
                 {
                     $url_dir = $svr_dir.'/'.substr($url, 0, $p);
                     if (!file_exists($url_dir))
                     {
                        $full_dir = substr($fullpath, 0, $p+$l);
                        // pull media directory to under our web root
                        //$ret = symlink($full_dir, $url_dir);
                        exec("ln -s $full_dir $url_dir");
                     }
                 }
             }
         }
      }
      else
      {
          $fullpath = $svr_dir.'/'.$url;
      }

      if (!file_exists($fullpath))
      {
         $response['game'][$index][$media.'_missing'] = true;
      }

      if ($url)
      {
         $response['game'][$index][$media.'_url'] = $url;
      }
   }
   elseif ($match_media)
   {
      $rom = preg_replace('|.*/(.*)\..*|','$1',$game['path']);
      $mediafile = $media.'s/'.$rom.'.'.$ext;
      if (file_exists($SYSTEM_PATH.'/'.$mediafile)) {
         $response['game'][$index][$media] = $mediafile;
         $response['game'][$index][$media.'_found'] = 1;
      }
   }
}

// -------------------
// GET A FULL GAMELIST
if ($getlist)
{
   $array_types = array('game'=>true); // dont fetch games as associative array
   $index_types = array('game'=>0); // store the index number as an object member

   $response = load_file_xml_as_array($gamelist_file);

   chdir($SYSTEM_PATH);

   // $scan flag is set to request scan
   if ($scan)
   {
      $games = array();
      $array_types = array('system'=>true);
      $config = load_file_xml_as_array(ES_PATH."/es_systems.cfg");

      // get extensions glob pattern to scan system
      $scan='';
      // search systems array to get extensions to scan for
      for($i=0; $i<count($config['system']);$i++)
      {
         if ($config['system'][$i]['name']==$system)
         {
            $scan = '*{'.str_replace(' ',',',$config['system'][$i]['extension']).'}';
            break;
         }
      }
   }

   // scan if we have a glob pattern for system
   if($scan)
   {
      // scan for new files in the directory specified
      function scan_dir($subdir)
      {
         global $response, $games, $scan, $SYSTEM_PATH;

         $path = $SYSTEM_PATH;
         if ($subdir)
         {
            $path .= '/'.$subdir;
         }

         foreach( glob($path.'/'.$scan, GLOB_BRACE) as $filename)
         {
            $subdirfilename = substr($filename,strlen($SYSTEM_PATH)+1);
            // already in gamelist.xml?
            if (!isset($games[strtolower($subdirfilename)]))
            {
               // found new rom
               $size = filesize($filename);

               //strip off path from start of filename
               $filename = substr($filename,strlen($path)+1);
               //strip off system path from start of filename
               list($basename, $extension) = preg_split('/\./',$filename);

               array_push($response['game'],
                  array(
                    'name' => $basename,
                    //'path' => $subdir.$filename,
                    'path' => $subdirfilename,
                    'size' => $size,
                    'human_size' => human_filesize($size),
                    'new'  => 1  // flag as a new rom
                  ));
            }
         }

         // scan for subdirectories
         foreach(glob($path.'/*', GLOB_ONLYDIR) as $filename)
         {
            $subdirfilename = substr($filename,strlen($SYSTEM_PATH)+1);
            // already in gamelist.xml?
            if (!isset($games[strtolower($subdirfilename)]))
            {
               //strip off path from start of filename
               $filename = substr($filename,strlen($path)+1);
               //strip off system path from start of filename
               list($basename, $extension) = preg_split('/\./',$filename);

               array_push($response['game'],
                  array(
                    'name' => $filename,
                    //'path' => $subdir.$filename,
                    'path' => $subdirfilename,
                    'isDir'  => 1,
                    'new'  => 1  // flag as a new directory
                  ));
            }
            // recurse into directory
            //scan_dir($subdir.$filename);
            scan_dir($subdirfilename);
         }
      }

   }

   $response['has_image'] = false;
   $response['has_video'] = false;
   $response['has_marquee'] = false;
   foreach ($response['game'] as $index => $game)
   {
      $fullpath = $response['game'][$index]['path'];
      $response['game'][$index]['shortpath'] = simplify_path($fullpath, HOME.'/RetroPie/'.$SYSTEM_PATH.'/');

      if (file_exists($fullpath))
      {
         $size = filesize($fullpath);
         $response['game'][$index]['size'] = $size;
         $response['game'][$index]['human_size'] = human_filesize($size);
      }
      else
      {
         $response['game'][$index]['size'] = 0;
      }

      if ($scan)
      {
         $gamepath = preg_replace('|\\./|','',$game['path']);
         $games[strtolower($gamepath)] = 1;
      }

      check_media('image','png');
      check_media('marquee','png');
      check_media('video','mp4');
   }

   if ($scan)
   {
      scan_dir();
   }

   $response['name'] = $system;
   $response['path'] = 'svr/roms/'.$system;

   if ($debug)
   {
      echo 'response :-';
      print_r($response);
      exit;
   }

   if($settings['CacheUnchangedGamelists'])
   {
      file_put_contents($gamelist_json, json_encode($response, JSON_UNESCAPED_UNICODE));
   }
   echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

?>
