<?php
error_reporting(E_ERROR);
require_once("xml_util.php");
require_once("vars.php");

$system='';
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
if (!file_exists($gamelist_file))
{
   $gamelist_file = HOME_ES."/gamelists/".$system."/gamelist.xml";
   if (!file_exists($gamelist_file))
   {
      $gamelist_file = ES_PATH."/gamelists/".$system."/gamelist.xml";
      if (!file_exists($gamelist_file))
      {
         exit;
      }
   }
}

function human_filesize($bytes, $decimals = 1)
{
   $sz = 'BKMGTP';
   $factor = floor((strlen($bytes) - 1) / 3);
   return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

function check_media($media, $ext) {

   global $SYSTEM_PATH, $response, $game, $index, $has, $match_media;

   if (isset($game[$media]))
   {
      $has[$media] = true;
      $mediafile = $game[$media];
      if(substr($mediafile,0,2) == "./")
      {
         $mediafile = substr($mediafile,2);
         $response['game'][$index][$media] = $mediafile;
         $mediafile = $SYSTEM_PATH.'/'.$mediafile;
      }
      elseif (substr($mediafile,0,2) == "~/")
      {
         $mediafile = HOME.'/'.substr($mediafile,2);
      }
      elseif (substr($mediafile,0,1) != "/")
      {
         $mediafile = $SYSTEM_PATH.'/'.$mediafile;
      }

      // absolute path
      if (!file_exists($mediafile))
      {
         $response['game'][$index][$media.'_missing'] = true;
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

   $has['image'] = false;
   $has['video'] = false;
   $has['marquee'] = false;
   foreach ($response['game'] as $index => $game)
   {
      // remove ./ (only changes get saved back)
      if (substr($game['path'],0,2) == "./")
      {
         $response['game'][$index]['path'] = substr($game['path'],2);
      }

      if (substr($game['path'],0,1) == "/")
         $fullpath = $response['game'][$index]['path']; 
      else
         $fullpath = $SYSTEM_PATH."/".$response['game'][$index]['path']; 

      // maybe read cue files in future to get bin sizes
      //$extension = strtolower(preg_replace(".*\.","",$fullpath));
      //switch($extension) {
         //case 'cue': $fullpath = preg_replace("/cue$/i","bin", $fullpath); break;
      //}

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
   $response['has_image'] = $has['image'];
   $response['has_video'] = $has['video'];
   $response['has_marquee'] = $has['marquee'];

   if ($debug)
   {
      echo 'response :-';
      print_r($response);
      exit;
   }
   echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

?>
