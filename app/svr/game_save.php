<?php
require_once("game.php");

if (!$config['edit'])
{
    exit;
}

$gamelist_file = $config['systems'][$_POST['system']]['gamelist_file'];

$response = array('success'=>false);

$gamelist = simplexml_load_file($gamelist_file);

if($_POST['insert'])
{
    $game = $gamelist->addChild('game');
    $game->addChild('path', $_POST['game_path']);
    foreach ($GAME_FIELDS as $field)
    {
        if ($_POST[$field])
        {
            if ($field == 'favorite' || $field == 'kidgame' || $field == 'hidden')
            {
                $game->addChild($field, 'true');
            }
            else
            {
                $game->addChild($field, $_POST[$field]);
            }
        }
    }
    $response['success'] = true;
}
elseif($_POST['update'])
{
    for ($i=0; $i<count($gamelist->game); $i++)
    {
        $game = &$gamelist->game[$i];
        if ($game->path == $_POST['game_path'])
        {
            // for all meta data posted...
            foreach ($GAME_FIELDS as $field)
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
                            {
                                $game->$field = 'true';
                            }
                            else
                            {
                                $game->addChild($field, 'true');
                            }
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
}

// Something changed
if ($response['success'])
{
    // fast but unformatted
    //$gamelist->asXml($gamelist_file);

    // slower nice whitespace :-
    $dom = new DOMDocument('1.0');
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    $dom->loadXML($gamelist->asXML());
    $dom->save($gamelist_file);

    /* TODO:

    if ($_POST['delete_image'])
    ...
    if ($_POST['delete_marquee'])
    ...
    */
}

echo json_encode($response);
?>
