<?php
error_reporting(E_ERROR);
require_once("xml_util.php");
require_once("vars.php");

$system='';

$local_client = preg_match('/192.168/',$_SERVER['REMOTE_ADDR']) ? true : false;

if (!$local_client)
   exit;

// get a full list of games for a system
if (isset($_GET['system']))
{
   $system = $_GET['system'];
   $run    = $_GET['run'];
}
// update a single game
elseif (isset($_POST['system']))
{
   $system = $_POST['system'];
   $update = $_POST['update'];
   $path   = $_POST['path'];
   $upload = $_FILES['upload'];
   //$filename = $_POST['filename'];
}

if (!$system) exit;

$SYSTEM_PATH = ROMSPATH.$system;

// -------------
// LAUNCH A GAME
if ($run)
{
/*
   // is there a game currently running ?
   $runcommand_pid = system('ps -ax | grep runcommand.sh | grep -v killall | grep -v grep | cut -f1 -d" "');
   if ($runcommand_pid)
   {
      if (isset($_GET['killgame']))
      {
         // user clicked to kill game
         $game_pid = system("pgrep -P $runcommand_pid");
         if ($game_pid)
         {
            exec("kill -9 $game_pid");
         }
      }
      else
      {
         // prompt user to kill game ?
         $response = array();
         $response['running'] = true;
         $response['info'] = file('/dev/shm/runcommand.info');
         echo json_encode($response);
         exit;
      }
   }
*/
   echo exec(
'killall -q emulationstation
 export HOME='.HOME.'
./runcommand.sh 0 _SYS_ '.$system.' '.$SYSTEM_PATH.'/'.$run);
   exit;
}

if ($upload)
{
   $response = array();
   if ($_FILES['upload']['error'] == 0)
   {
      $filename = $SYSTEM_PATH;
      if ($path)
      {
         $filename .= '/' . $path;
         if (!file_exists($filename))
         {
            mkdir($filename, 0775);
         }
         $filename .= '/' . $_FILES['upload']['name'];
      }
      move_uploaded_file($_FILES['upload']['tmp_name'], $filename);
      chmod($filename, 0664);
      $response['success'] = true;
      $response['filename'] = $filename;
   }
   else
   {
      $response['success'] = false;
   }
   echo json_encode($response);
   exit;
}

/*
// uploads image in the folder images
if (isset($_FILES['file']) && $_FILES['file']['error'] == 0)
{
   $temp = explode(".", $_FILES["file"]["name"]);
   $newfilename = substr(md5(time()), 0, 10) . '.' . end($temp);
   move_uploaded_file($_FILES['file']['tmp_name'], 'images/' . $newfilename);

   // give callback to your angular code with the image src name
   echo json_encode($newfilename);
   exit;
}
*/

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

if($update)
{
   $response = array();

   $gamelist = simplexml_load_file($gamelist_file);

   for ($i=0; $i<count($gamelist->game); $i++)
   {
      $game = $gamelist->game[$i];
      if ($game->path == $path)
      {
         // for all meta data posted...
         foreach (array(
            'name','desc','image','rating',
            'releasedate','developer','publisher',
            'genre','players','favorite','kidgame','hidden',
            'marquee','video'
         ) as $field)
         {
            // get the value
            if (isset($_POST[$field]))
            {
               $value = $_POST[$field];
               if ($field == 'favorite' || $field == 'kidgame' || $field == 'hidden')
               {
                  if ($value == 1 || $value == 'true')
                  {
                     // add true
                     if (isset($game->$field))
                        $game->$field = 'true';
                     else
                        $game->addChild($field, 'true');
                  }
                  else if($game->$field)
                  {
                     unset($game->$field);  // remove
                  }
               }
               else
               {
                  // then update the xml
                  if (isset($game->$field))
                     $game->$field = $value;
                  else
                     $game->addChild($field, $value);
               }
            }
         }
         $response['success'] = true;
      }
   }
   $gamelist->asXml($gamelist_file);
   echo json_encode($response);
}
else
   echo json_encode($_POST);
?>
