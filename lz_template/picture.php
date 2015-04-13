<?php
/****************************************************************************************
* LiveZilla picture.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.global.users.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
header("Content-Type: image/jpg;");
@set_error_handler("handleError");
if(isset($_GET["intid"]) && initDataProvider())
{
	initData(array("INTERNAL"));
	$id = Operator::GetSystemId(base64UrlDecode($_GET["intid"]));
	if(isset($INTERNAL[$id]))
	{
        if(!empty($INTERNAL[$id]->WebcamPicture))
            exit(base64_decode($INTERNAL[$id]->WebcamPicture));
        else if(!empty($INTERNAL[$id]->ProfilePicture))
            exit(base64_decode($INTERNAL[$id]->ProfilePicture));
	}
}
exit(getFile("./images/nopic.jpg"));
?>
