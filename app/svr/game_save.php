<?php
require_once("game.php");

if (!$config['edit'])
{
    exit;
}

$system = $_POST['system'];
$game_path = $_POST['game_path'];

$gamelist_file = $config['systems'][$system]['gamelist_file'];

$response = array();

$gamelist = simplexml_load_file($gamelist_file);

for ($i=0; $i<count($gamelist->game); $i++)
{
    $game = $gamelist->game[$i];
    if ($game->path == $game_path)
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

?>
