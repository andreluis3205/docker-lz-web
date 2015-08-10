<?php
/****************************************************************************************
* LiveZilla server.php
* 
* Copyright 2015 LiveZilla GmbH
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
require(LIVEZILLA_PATH . "_lib/objects.devices.inc.php");

define("ACCESSTIME",SystemTime::GetRuntime());

if(Server::IsServerSetup())
    CacheManager::Flush();

Server::DefineURL(FILE_SERVER_FILE);
Operator::PrepareConnection();

require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");

Server::InitDataProvider();
Server::SetTimeLimit(Server::$Configuration->File["timeout_clients"]);
@ini_set('session.use_cookies', '0');
if(DEBUG_MODE)
    @ini_set('display_errors', '1');
@set_error_handler("handleError");

header("Access-Control-Allow-Origin: *");

$getRequest = Communication::GetParameterAlias("rqst");

if(isset($_POST[POST_INTERN_REQUEST]) || !empty($getRequest))
{
	if(DB_CONNECTION && STATS_ACTIVE)
		Server::InitStatisticProvider();

	if(DB_CONNECTION && $getRequest == CALLER_TYPE_TRACK)
	{
		define("CALLER_TYPE",CALLER_TYPE_TRACK);
        define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_track"]);
		header("Keep-Alive: timeout=5, max=100");
		header("Content-Type: text/javascript; charset=UTF-8");
		header("Cache-Control: no-cache, must-revalidate");
		require(LIVEZILLA_PATH . "track.php");
		$response = VisitorMonitoring::$Response;
	}
	else if(DB_CONNECTION && isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_EXTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_EXTERNAL);
        define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_chats"]);
		header("Keep-Alive: timeout=5, max=100");
		header("Content-Type: text/xml; charset=UTF-8");
		require(LIVEZILLA_PATH . "extern.php");
		$response = utf8_encode("<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_js>" . base64_encode(((isset($EXTERNSCRIPT)) ? $EXTERNSCRIPT : "")) . "</livezilla_js>");
	}
	else if(isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_INTERNAL)
	{
		define("CALLER_TYPE",CALLER_TYPE_INTERNAL);
        define("CALLER_TIMEOUT", Server::$Configuration->File["timeout_clients"]);
		header("Connection: close");
		header("Cache-Control: no-cache, must-revalidate");
		header("Content-Type: text/xml; charset=UTF-8");
		require(LIVEZILLA_PATH . "intern.php");
		$response = utf8_encode($response);
	}
    else if($getRequest == "cronjob" && !empty($_GET["cjid"]) && $_GET["cjid"] == Server::$Configuration->File["gl_cjid"])
    {
        define("CALLER_TYPE","cronjob");
        define("CALLER_TIMEOUT", 360);
        Server::InitDataBlock(array("INTERNAL","GROUPS"));
        $response=(DB_CONNECTION) ? "Success" : "No database connection";
    }

    //if(DB_CONNECTION && Is::Defined("CALLER_TYPE") && (!empty(Server::$Configuration->File["gl_cjfs"])||CALLER_TYPE=="cronjob") && !Is::Defined("SERVERSETUP") && !Is::Defined("LOGIN"))
    if(DB_CONNECTION && Is::Defined("CALLER_TYPE") && !Is::Defined("SERVERSETUP") && !Is::Defined("LOGIN"))
        Server::RunCronJobs(false/*CALLER_TYPE=="cronjob"*/);
}

if(!isset($response))
	exit(IOStruct::GetFile(TEMPLATE_HTML_SUPPORT));

Communication::SendPushMessages();
Server::UnloadDataProvider();
exit($response);
?>