<?php
// -------------
// LAUNCH A GAME

if (preg_match('/192.168/', $_SERVER['REMOTE_ADDR']) && // local
    isset($_GET['system']) &&
    isset($_GET['game_path']))
{
    $system = $_GET['system'];
    $game_path = $_GET['game_path'];
    
    $SYSTEM_PATH = ROMSPATH.$system;
    
    echo exec('export HOME='.HOME.'
./runcommand.sh 0 _SYS_ '.$system.' '.$SYSTEM_PATH.'/'.$game_path);
}

?>
