<?php
/****************************************************************************************
 * LiveZilla email.php
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
if(isset($_GET["id"]) && initDataProvider())
{
    initData(array("INTERNAL"));
    if(Operator::IPValidate())
    {
        if(empty($CONFIG["gl_avhe"]))
            exit("HTML content is currently not being saved for security reasons. Please check your LiveZilla configuration:<br><br>LiveZilla Server Admin -> Server Configuration -> Security");
        $c=null;
        $html = TicketEmail::GetHTML(getOParam("id","",$c,null,null));
        if(!empty($html))
            exit($html);
        exit("Sorry, email does not exist or no HTML content was found.");
    }
}
?>