<?php
/****************************************************************************************
 * LiveZilla preview.php
 *
 * Copyright 2016 LiveZilla GmbH
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
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

Server::DefineURL("print.php");
@set_error_handler("handleError");
if(Server::InitDataProvider())
{
    if(!empty($_GET["id"]) && !empty($_GET["id"]) && strlen($_GET["id"])==32)
    {
        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CODES."` WHERE `id`='".DBManager::RealEscape($_GET["id"])."';");
        if($row = @DBManager::FetchArray($result))
            exit("<!DOCTYPE HTML><html><head><title>LiveZilla Server Admin (Preview)</title><meta http-equiv=\"X-UA-Compatible\" content=\"IE=9\" /></head><body topmargin=\"0\" leftmargin=\"0\" background=\"./images/preview_bg.gif\"><script type=\"text/javascript\" src=\".//script.php?id=".$_GET["id"]."\"></script></body></html>");
    }
}
exit("Sorry, this preview has expired.")
?>