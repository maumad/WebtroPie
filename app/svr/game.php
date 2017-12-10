<?php
require_once("config.php");

$config = getConfig( SYSTEMS | APP | ENV );
$svr_dir = getcwd();

function human_filesize($bytes, $decimals = 1)
{
    $sz = 'BKMGTP';
    $factor = floor((strlen($bytes) - 1) / 3);
    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

function get_media_path($media, $system)
{
    global $config, $svr_dir;

    $SYSTEM_PATH = ROMSPATH.$system;

    // use either config directories or roms path / images, videos or marquees
    if ($media == 'image' && isset($config['app']['uploadImageDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadImageDirectory']);
    }
    else if ($media == 'video' && isset($config['app']['uploadVideoDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadVideoDirectory']);
    }
    else if ($media == 'marquee' && isset($config['app']['uploadMarqueeDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadMarqueeDirectory']);
    }
    else
    {
        return $SYSTEM_PATH.'/'.$media.'s';  // E.g. images
    }
}

function get_media_paths_full_url($filename, $system)
{
    global $svr_dir;

    $SYSTEM_PATH = ROMSPATH.$system;

    $url='';
    $fullpath='';
    if(substr($filename,0,2) == "./")
    {
        $url = $SYSTEM_PATH.'/'.substr($filename,2);
    }
    elseif (substr($filename,0,2) == "~/")
    {
        $fullpath = HOME.'/'.substr($filename,2);
    }
    elseif (substr($filename,0,1) != "/")
    {
        $url = $SYSTEM_PATH.'/'.$filename;
    }
    else
    {
        $fullpath = $filename;
    }
    if ($fullpath)
    {
        $fullpath = simplify_path($fullpath);
        if (substr($fullpath, 0, $l= strlen('/home/pi/RetroPie/')) === '/home/pi/RetroPie/')
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
        elseif (substr($fullpath, 0, $l= strlen('/home/pi/')) === '/home/pi/')
        {
            $url = 'home_'.substr($fullpath, $l);
            if (!file_exists($url))
            {
                $p = strpos($url, '/'.$system.'/');
                if ($p !== false)
                {
                    $url_dir = $svr_dir.'/'.substr($url, 0, $p);
                    if (!file_exists($url_dir))
                    {
                        $full_dir = substr($fullpath, 0, $p+$l-5);
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

    return array('fullpath' => $fullpath, 'url' => $url);
}

?>