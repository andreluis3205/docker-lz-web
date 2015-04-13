<?php
/****************************************************************************************
 * LiveZilla report.php
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.global.users.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
if(!empty($_GET["h"]) && !empty($_GET["y"]) && isset($_GET["m"]) && isset($_GET["d"]) && initDataProvider())
{
    defineURL("report.php");
    initStatisticProvider();
    $repData = StatisticProvider::GetReportFromHash($_GET["h"],$_GET["y"],$_GET["m"],$_GET["d"],!empty($_GET["u"]));
    if($repData !== false)
    {
        languageSelect(strtolower($CONFIG["gl_default_language"]),true);
        $repData = applyReplacements($repData,true,false,false,true);
        exit($repData);
    }
}
exit("Sorry, report was not found.");
?>