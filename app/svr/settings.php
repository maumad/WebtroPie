<?php
error_reporting(E_ERROR);
require_once("xml_util.php");
require_once("config.php");

if (preg_match('/192.168/',$_SERVER['REMOTE_ADDR']) &&
    isset($_POST['update']))
{
   $response = array('changed'=>false);

   $xml = simplexml_load_file_wrapped('../config/settings.cfg');

   foreach ($xml->children() as $type => $xmlchild)
   {
      if ( (string) $xmlchild['name'] == $_POST['setting'] )
      {
         if ( (string) $xmlchild['value'] != $_POST['value'] )
         {
            $xmlchild['value'] = $_POST['value'];
            $response['changed'] = true;
         }
         break;
      }
   }
   // success: save
   // failed: postback for debugging
   if ($response['changed'])
   {
      simplexml_save_file_unwrapped($xml, '../config/settings.cfg');
   }
   else
   {
      $response['post'] = $_POST;
   }

   echo json_encode($response);
   exit;
}

$array_types = array();
$index_types = array();

$response = array();

if ($_GET['get'] & APP)
{
   $response['app'] = load_file_xml_as_array('../config/settings.cfg','y');
}

if ($_GET['get'] & ENV)
{
   $response['env'] = array();
   $response['env']['has_gd'] = extension_loaded('gd') ? 1 : 0;
   $response['env']['has_launch'] = file_exists("runcommand.sh") ? 1 : 0;
   $response['env']['read_only'] = preg_match('/192.168/',$_SERVER['REMOTE_ADDR']) ? 0 : 1;
}

if ($_GET['get'] & LANG)
{
   if (isset($_GET['lang']))
      $lang = $_GET['lang'];
   else
      $lang = $response['app']['Language'];

   if (!$lang || !file_exists('../config/lang-'.$lang.'.cfg'))
      $lang='en';

   $response['lang'] = load_file_xml_as_array('../config/lang-'.$lang.'.cfg','y');
}

if ($_GET['get'] & ES)
{
   $response['es'] = load_file_xml_as_array(ES_CONFIG_PATH."/es_settings.cfg",'y');
}

echo json_encode($response);
?>
