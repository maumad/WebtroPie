<?php
error_reporting(E_ERROR);
require_once("config.php");

$config = getConfig( APP | ENV );

if ($config['edit'] && isset($_POST['update']) && isset($_POST['file']))
{
   $response = array('changed'=>false);

   if ($_POST['file'] & APP)
   {
      $file = '../config/settings.cfg';
   }
   elseif ($_POST['file']  & THEMES)
   {
      $file = '../config/themes.cfg';
   }

   $xml = simplexml_load_file_wrapped($file);
   $exists = false;

   foreach ($xml->children() as $type => $xmlchild)
   {
      if ( (string) $xmlchild['name'] == $_POST['setting'] )
      {
         $exists = true;
         if ( (string) $xmlchild['value'] != $_POST['value'] )
         {
            $xmlchild['value'] = $_POST['value'];
            $response['changed'] = true;
         }
         break;
      }
   }
   if (!$exists)
   {
      //$child = $xml->addChild($_POST['setting'], $_POST['value']);
      $child = $xml->addChild($_POST['type']);
      $child->addAttribute('name', $_POST['setting']);
      $child->addAttribute('value', $_POST['value']);
      $response['changed'] = true;
   }
   // success: save
   // failed: postback for debugging
   if ($response['changed'])
   {
      simplexml_save_file_unwrapped($xml, $file);
   }
   else
   {
      $response['post'] = $_POST;
   }

   echo json_encode($response);
   exit;
}

?>
