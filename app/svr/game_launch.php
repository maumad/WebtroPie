<?php
// -------------
// LAUNCH A GAME

require_once("vars.php");

if (preg_match('/192.168/', $_SERVER['REMOTE_ADDR']) && // local
    isset($_GET['system']) &&
    isset($_GET['game_path']))
{
    $system = $_GET['system'];
    $game_path = $_GET['game_path'];

    if(substr($game_path,0,2) == "./")
    {
        $game_path = substr($game_path, 2);
    }
    
    $SYSTEM_PATH = ROMSPATH.$system;
    
    echo exec('killall -q emulationstation
export HOME='.HOME.'
./runcommand.sh 0 _SYS_ '.$system.' '.$SYSTEM_PATH.'/'.$game_path);
}

?>
