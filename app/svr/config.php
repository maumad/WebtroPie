<?php
error_reporting(E_ERROR);
require_once("xml_util.php");
require_once("vars.php");

$array_types = array();
$index_types = array();

$config = array();

if ($_GET['get'] & APP)
{
   $config['app'] = load_file_xml_as_array('../config/settings.cfg','y');
}

if ($_GET['get'] & ENV)
{
   $config['env'] = array();
   $config['env']['has_gd'] = extension_loaded('gd') ? 1 : 0;
   $config['env']['has_launch'] = file_exists("runcommand.sh") ? 1 : 0;
   $config['env']['read_only'] = preg_match('/192.168/',$_SERVER['REMOTE_ADDR']) ? 0 : 1;
}

if ($_GET['get'] & LANG)
{
   if (isset($_GET['lang']))
      $lang = $_GET['lang'];
   else
      $lang = $config['app']['Language'];

   if (!$lang || !file_exists('../config/lang-'.$lang.'.cfg'))
      $lang='en';

   $config['lang'] = load_file_xml_as_array('../config/lang-'.$lang.'.cfg','y');
}

if ($_GET['get'] & ES)
{
   $config['es'] = load_file_xml_as_array(ES_CONFIG_PATH."/es_settings.cfg",'y');
}

if ($_GET['get'] & THEMES)
{
   $config['themes'] = load_file_xml_as_array('../config/themes.cfg','y');
}

if ($_GET['get'] & SYSTEMS)
{
    $array_types = array('system'=>true);
    if (file_exists(HOME_ES."/es_systems.cfg"))
        $systems = load_file_xml_as_array(HOME_ES."/es_systems.cfg");
    else
        $systems = load_file_xml_as_array(ES_PATH."/es_systems.cfg");
    $config['systems'] = array();
    for($i=0; $i<count($systems['system']);$i++)
    {
        $system_name = $systems['system'][$i]['name'];
        if (file_exists($systems['system'][$i]['path']."/gamelist.xml") ||
            file_exists(ROMSPATH.'/'.$system_name."/gamelist.xml") ||
            file_exists(HOME_ES."/gamelists/".$system_name."/gamelist.xml") ||
            file_exists(ES_PATH."/gamelists/".$system_name."/gamelist.xml")
            )
        {
            $systems['system'][$i]['has_gamelist'] = true;
            if (filesize($systems['system'][$i]['path']."/gamelist.xml") > 40 ||
                filesize(ROMSPATH.'/'.$system_name."/gamelist.xml") > 40 ||
                filesize(HOME_ES."/gamelists/".$system_name."/gamelist.xml") > 40 ||
                filesize(ES_PATH."/gamelists/".$system_name."/gamelist.xml") > 40
                )
                $systems['system'][$i]['has_games'] = true;
        }
       $config['systems'][$system_name] = $systems['system'][$i];
    }
}

// also get a list of names of other available themes
if ($_GET['get'] & THEMES_LIST)
{
    $config['themes_list'] = array();
    if($dh = opendir("themes"))
    {
        while(($theme = readdir($dh)) !== false)
            if($theme != '.' && $theme != '..' && is_dir("themes/".$theme))
                array_push($config['themes_list'], array( 'name' => $theme));
        closedir($dh);
    }
}

if (!isset($inc))
{
    echo json_encode($config);
}
?>
