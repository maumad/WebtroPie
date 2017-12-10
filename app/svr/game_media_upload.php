<?php
require_once("game.php");

$response = array('success' => false);

if ($config['edit'] && $_FILES['upload'])
{
    $system = $_POST['system'];
    $media  = $_POST['media'];

    if ($system && $media)
    {
        chdir($SYSTEM_PATH = ROMSPATH.$system);
        
        if ($_FILES['upload']['error'] == 0)
        {
            $directory = get_media_path($media, $system);

            $response['media_path'] = $directory . '/' . $_FILES['upload']['name'];

            $directory = simplify_path($directory, $SYSTEM_PATH);

            if (!file_exists($directory))
            {
                mkdir($directory, 0775, true);
            }

            $filename = $directory . '/' . $_FILES['upload']['name'];

            move_uploaded_file($_FILES['upload']['tmp_name'], $filename);

            // create symlink if needed, find url
            $media_paths = get_media_paths_full_url($filename, $system);

            chmod($filename, 0664);
            $response['success'] = true;
            $response['media_url'] = $media_paths['url'];
        }
    }
    else
    {
        $response['error'] = $_FILES['upload']['error'];
    }
}
else
{
    $response['error'] = 'Upload Not allowed';
}

echo json_encode($response);
exit;
?>
