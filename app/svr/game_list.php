<?php
// allow client cache
if (isset($_GET['mtime']))
{
    $seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
    $ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
    header("Expires: $ts");
    header("Pragma: cache");
    header("Cache-Control: max-age=$seconds_to_cache");
}
require_once("game.php");

$system      = isset($_GET['system'])      ? $_GET['system']      : false;
$scan        = isset($_GET['scan'])        ? $_GET['scan']        : false;
$match_media = isset($_GET['match_media']) ? $_GET['match_media'] : false;
$extensions  = isset($config['systems'][$system]['extension'])
                ? '*{'.str_replace(' ',',',$config['systems'][$system]['extension']).'}'
                : false;

if (!$system) exit;
if (!$config['edit'])
{
    $scan = false;
    $match_media = false;
}

chdir($SYSTEM_PATH = ROMSPATH.$system);


// scan for new files in the directory specified
function scan_dir($subdir='')
{
    global $response, $games, $extensions, $SYSTEM_PATH, $svr_dir;

    $path = '';
    if ($subdir)
    {
        $path = $subdir.'/';
    }

    // scan for files with matching extensions
    foreach( glob($path.$extensions, GLOB_BRACE) as $filename)
    {
        $shortpath = simplify_path($filename, HOME.'/RetroPie/'.$SYSTEM_PATH.'/');

        // already in gamelist.xml?
        if (!isset($games[strtolower($shortpath)]))
        {
            array_push($response['game'],
                array(
                    'name' => pathinfo($filename, PATHINFO_FILENAME),
                    'path' => './'.$filename,
                    'shortpath' => $shortpath,
                    'size' => filesize($filename),
                    'human_size' => human_filesize($size),
                    'mtime' => filemtime($filename),
                    'new'  => 1  // flag as a new rom
                ));
        }
    }

    // scan for subdirectories
    foreach(glob($path.'*', GLOB_ONLYDIR) as $filename)
    {
        // already in gamelist.xml?
        if (!isset($games[strtolower($filename)]))
        {
            array_push($response['game'],
                array(
                    'name' => substr($filename,strlen($path)),
                    'path' => $filename,
                    'isDir'  => 1,
                    'new'  => 1  // flag as a new directory
                ));
        }

        // recurse into directory
        scan_dir($path.$filename);
    }
}

function check_media(&$game, $media, $ext)
{
    global $response, $match_media, $system, $svr_dir;

    if (!isset($game[$media]) && $match_media)
    {
        $rom = preg_replace('|.*/(.*)\..*|','$1',$game['path']);
        $mediafile = get_media_path($media, $system).'/'.$rom.'.'.$ext;
        if (file_exists($mediafile))
        {
            $game[$media] = $mediafile;
            $game[$media.'_found'] = 1;
        }
    }
    if (isset($game[$media]))
    {
        $response['has_'.$media] = true;

        $media_paths = get_media_paths_full_url($game[$media], $system);
        if (!file_exists($media_paths['fullpath']))
        {
            $game[$media.'_missing'] = true;
        }
        if ($media_paths['url'])
        {
            $game[$media.'_url'] = $media_paths['url'];
        }
    }
}

// -------------------
// GET A FULL GAMELIST

$response = load_file_xml_as_array($config['systems'][$system]['gamelist_file'], false, false, ['game'=>true], ['game'=>1]);

$response['name'] = $system;
$response['path'] = 'svr/roms/'.$system;
$response['has_image'] = false;
$response['has_video'] = false;
$response['has_marquee'] = false;

foreach ($response['game'] as $index => &$game)
{
    $game['shortpath'] = simplify_path($game['path'], HOME.'/RetroPie/'.$SYSTEM_PATH.'/');

    if (file_exists($game['path']))
    {
        $size = filesize($game['path']);
        $game['size'] = $size;
        $game['human_size'] = human_filesize($size);
        $game['mtime'] = filemtime($game['path']);
    }
    else
    {
        $game['size'] = 0;
    }

    if ($scan)
    {
        $games[strtolower($game['shortpath'])] = 1;
    }

    check_media($game, 'image',   'png');
    check_media($game, 'marquee', 'png');
    check_media($game, 'video',   'mp4');
}

if ($scan && $extensions)
{
    scan_dir();
}

/*
 TODO : Folders
foreach ($response['folder'] as $index => &$game)
{
    $game['isDir'] = 1;    // flag as folder
    $response['game'][] = $game;   // add to game array
}
unset($response['folder'])
*/

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
