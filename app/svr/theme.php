<?php
$seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
$ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
header("Expires: $ts");
header("Pragma: cache");
header("Cache-Control: max-age=$seconds_to_cache");

require("config.php");

$theme  = isset($_GET['theme']) ? $_GET['theme'] : false;
//$scan   = isset($_GET['scan'])  ? $_GET['scan']  : false;

if ($theme)
{
    $config = getConfig( SYSTEMS );
}
else
{
    $config = getConfig( SYSTEMS | APP | ENV );

    $theme = $config['app']['ThemeSet'] ||
             $config['es']['ThemeSet'] ||
             DEFAULT_THEME;
}

$response = array();

$themepath = "themes/".$theme;

$response = array();
$response['name'] = $theme;
$response['path'] = 'svr/'.$themepath;
$response['has_gd'] = extension_loaded('gd') ? 1 : 0;

// load file and recursively includes within included files
$response['includes'] = array();

$response['fonts'] = array();


function get_font(&$text, $path)
{
    global $response, $themepath;

    if(!isset($text['fontPath']))
        return;

    $fullpath = simplify_path($themepath.'/'.$path.'/'.$text['fontPath']);

    if(!file_exists($fullpath)) {
        return;
    }
    $family = substr($fullpath,7, strlen($fullpath)-11);
    $family = str_replace(array('-','/'),'_',$family);
    $text['fontFamily'] = $family;
    unset($text['fontPath']);

    if(!isset($response['fonts'][$family]))
    {
        $response['fonts'][$family] = array(
            'fullpath' => 'svr/'.$fullpath,
            'family' => $family
        );
   }
}

function get_views_fonts(&$views, $path)
{
    if($views)
    foreach ($views as &$view)
    {
        if (isset($view['text']))
        {
            foreach ($view['text'] as &$el)       get_font($el, $path);
        }
        if (isset($view['textlist']))
        {
            foreach ($view['textlist'] as &$el)   get_font($el, $path);
        }
        if (isset($view['datetime']))
        {
            foreach ($view['datetime'] as &$el)   get_font($el, $path);
        }
        if (isset($view['helpsystem']))
        {
            foreach ($view['helpsystem'] as &$el) get_font($el, $path);
        }
    }

}

function load_and_include($file, &$parent=null, $index=-1)
{
    global $response, $themepath;

    $incfile = simplify_path($file);

    if($parent!=null && $index!=-1) {
        // copy modified reference back to parent
        $parent['include'][$index] = $incfile;
        // if already included return
        if (isset($response['includes'][$incfile]))
            return;
    }

    // already included
    if(isset($response['includes'][$incfile]))
    {
        return;
    }

    $path = pathinfo($incfile, PATHINFO_DIRNAME );

    // the files that will be returned as an array
    $arr = load_file_xml_as_array($themepath.'/'.$incfile, false, true, ['include'=>1, 'feature'=>1], ['image'=>1, 'video'=>1, 'rating'=>1, 'view'=>1]);

    if(isset($arr['error']))
    {
        return $arr;
    }

    get_views_fonts($arr['view'], $path);
    if (isset($arr['feature']))
    {
        foreach ($arr['feature'] as &$feature)
        {
            get_views_fonts($feature['view'], $path);
        }
    }

    // store include file in response
    if($index!=-1)
    {
        $response['includes'][$incfile] = &$arr;
    }

    // include includes recursively
    if (isset($arr['include']))
    {
        foreach ($arr['include'] as $index => $incfile)
        {
            load_and_include($path.'/'.$incfile, $arr, $index);
        }
    }

    return $arr;
}
// array of 'systems', get theme for each system/platform
// where roms/system/gamelist.xml exists
if (file_exists(ROMSPATH))
{
    $response['systems'] = array();

    // default theme
    if (file_exists($themepath.'/theme.xml'))
    {
        $response['systems']['default'] =
            array('name' => 'default',
                  'path' => 'svr/'.$themepath,
                  'theme' => load_and_include('theme.xml'));
    }
    // (usable - having roms) system themes
    foreach ($config['systems'] as $system_name => $system)
    {
        if (isset($_GET['all']) ||
            (isset($system['gamelist_file']) && file_exists($system['gamelist_file']))
        )
        {
            if (file_exists($themepath.'/'.$system['theme'].'/theme.xml'))
            {
                $response['systems'][$system['theme']] =
                    array(
                        'name' => $system['theme'],
                        'path' => 'svr/'.$themepath.'/'.$system['theme'],
                        'theme' => load_and_include($system['theme'].'/theme.xml')
                );
            }
            elseif (file_exists($themepath.'/'.$system['name'].'/theme.xml'))
            {
                $response['systems'][$system['name']] =
                    array(
                        'name' => $system['name'],
                        'path' => 'svr/'.$themepath.'/'.$system['name'],
                        'theme' => load_and_include($system['name'].'/theme.xml')
                );
            }
        }
    }

    // collections
    foreach (array('auto-allgames','auto-favorites','auto-lastplayed','custom-collections') as $system)
    {
        if (file_exists($themepath.'/'.$system.'/theme.xml'))
        {
            $response['systems'][$system] =
                array('name' => $system,
                      'path' => 'svr/'.$themepath.'/'.$system,
                      'theme' => load_and_include($system.'/theme.xml'));
        }
    }
}
else
    $response['error'] = "Can't open ".ROMSPATH;

// return converted array to json
echo json_encode($response);
?>
