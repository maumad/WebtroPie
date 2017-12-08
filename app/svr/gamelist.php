<?php
error_reporting(E_ERROR);

// allow client cache
if (isset($_GET['mtime']))
{
    $seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
    $ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
    header("Expires: $ts");
    header("Pragma: cache");
    header("Cache-Control: max-age=$seconds_to_cache");
}

require_once("config.php");

$config = getConfig( SYSTEMS | APP | ENV );

$svr_dir = getcwd();

$system      = isset($_GET['system'])      ? $_GET['system']      : false;
$getlist     = isset($_GET['getlist'])     ? $_GET['getlist']     : false;
$scan        = isset($_GET['scan'])        ? $_GET['scan']        : false;
$match_media = isset($_GET['match_media']) ? $_GET['match_media'] : false;

if (!$system) exit;
if (!$config['edit'])
{
    $scan = false;
    $match_media = false;
}

$SYSTEM_PATH = ROMSPATH.$system;

function human_filesize($bytes, $decimals = 1)
{
    $sz = 'BKMGTP';
    $factor = floor((strlen($bytes) - 1) / 3);
    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

function check_media(&$game, $media, $ext)
{
    global $SYSTEM_PATH, $response, $match_media, $system;
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
            $game[$media.'_missing'] = true;
        }

        if ($url)
        {
            $game[$media.'_url'] = $url;
        }
    }
    elseif ($match_media)
    {
        $rom = preg_replace('|.*/(.*)\..*|','$1',$game['path']);
        $mediafile = $media.'s/'.$rom.'.'.$ext;
        if (file_exists($SYSTEM_PATH.'/'.$mediafile)) {
            $game[$media] = $mediafile;
            $game[$media.'_found'] = 1;
        }
    }
}

// -------------------
// GET A FULL GAMELIST
if ($getlist)
{
    $response = load_file_xml_as_array($config['systems'][$system]['gamelist_file'], false, false, ['game'=>true], ['game'=>1]);

    chdir($SYSTEM_PATH);

    // $scan flag is set to request scan
    if ($scan)
    {
        $scan = '*{'.str_replace(' ',',',$config['systems'][$system]['extension']).'}';
    }

    // scan if we have a glob pattern for system
    if($scan)
    {
        // scan for new files in the directory specified
        function scan_dir($subdir)
        {
            global $response, $games, $scan, $SYSTEM_PATH, $svr_dir;

            $path = '';
            if ($subdir)
            {
                $path = $subdir.'/';
            }

            foreach( glob($path.$scan, GLOB_BRACE) as $filename)
            {
                $shortpath = simplify_path($filename, HOME.'/RetroPie/'.$SYSTEM_PATH.'/');

                // already in gamelist.xml?
                if (!isset($games[strtolower($shortpath)]))
                {
                    array_push($response['game'],
                        array(
                          'name' => preg_replace('/\\.[^\\.]{1-3}/','', substr($filename,strlen($path))),
                          'path' => $filename,
                          'shortpath' => $shortpath,
                          'size' => filesize($filename),
                          'human_size' => human_filesize($size),
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
    }

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

    if ($scan)
    {
        scan_dir();
    }

    $response['name'] = $system;
    $response['path'] = 'svr/roms/'.$system;

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

?>
