<?php
/****************************************************************************************
* LiveZilla server.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

define("IN_LIVEZILLA",true);
define("SAFE_MODE",@ini_get('safe_mode'));
define("LIVEZILLA_PATH","./");
@error_reporting(E_ALL);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.global.users.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.devices.inc.php");

define("ACCESSTIME",getRuntime());

if(isServerSetup())
    CacheManager::Flush();

defineURL(FILE_SERVER_FILE);
Operator::PrepareConnection();
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");

initDataProvider();
setTimeLimit($CONFIG["timeout_clients"]);
@ini_set('session.use_cookies', '0');
if(DEBUG_MODE)
    @ini_set('display_errors', '1');
@set_error_handler("handleError");

header("Access-Control-Allow-Origin: *");

$getRequest = getAlias("rqst");

if(isset($_POST[POST_INTERN_REQUEST]) || !empty($getRequest))
{
	if(DB_CONNECTION && STATS_ACTIVE)
		initStatisticProvider();

	if(DB_CONNECTION && $getRequest == CALLER_TYPE_TRACK)
	{
		define("CALLER_TYPE",CALLER_TYPE_TRACK);
        define("CALLER_TIMEOUT", $CONFIG["timeout_track"]);
		header("Keep-Alive: timeout=5, max=100");
		header("Content-Type: text/javascript; charset=UTF-8");
		header("Cache-Control: no-cache, must-revalidate");
		require(LIVEZILLA_PATH . "track.php");
		$response = @$TRACKINGSCRIPT;
	}
	else if(DB_CONNECTION && isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_EXTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_EXTERNAL);
        define("CALLER_TIMEOUT", $CONFIG["timeout_chats"]);
		header("Keep-Alive: timeout=5, max=100");
		header("Content-Type: text/xml; charset=UTF-8");
		require(LIVEZILLA_PATH . "extern.php");
		$response = utf8_encode("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_js>" . base64_encode(((isset($EXTERNSCRIPT)) ? $EXTERNSCRIPT : "")) . "</livezilla_js>");
	}
	else if(isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_INTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_INTERNAL);
        define("CALLER_TIMEOUT", $CONFIG["timeout_clients"]);
		header("Connection: close");
		header("Cache-Control: no-cache, must-revalidate");
		header("Content-Type: text/xml; charset=UTF-8");
		require(LIVEZILLA_PATH . "intern.php");
		$response = utf8_encode($response);
	}
    else if($getRequest == "cronjob" && !empty($_GET["cjid"]) && $_GET["cjid"] == $CONFIG["gl_cjid"])
    {
        define("CALLER_TYPE","cronjob");
        define("CALLER_TIMEOUT", 360);
        initData(array("INTERNAL","GROUPS"));
        $response=(DB_CONNECTION) ? "Success" : "No database connection";
    }

    if(DB_CONNECTION && is("CALLER_TYPE") && (!empty($CONFIG["gl_cjfs"])||CALLER_TYPE=="cronjob") && !is("SERVERSETUP") && !is("LOGIN"))
        cronJobs(CALLER_TYPE=="cronjob");
}

if(!isset($response))
	exit(getFile(TEMPLATE_HTML_SUPPORT));

sendPushMessages();
unloadDataProvider();
exit($response);
?>