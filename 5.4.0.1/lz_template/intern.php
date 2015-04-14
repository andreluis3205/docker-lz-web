<?php
/****************************************************************************************
* LiveZilla intern.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
define("LOGIN",($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN));
define("LOGOFF",(isset($_POST[POST_INTERN_USER_STATUS]) && $_POST[POST_INTERN_USER_STATUS] == USER_STATUS_OFFLINE));
define("DB_ACCESS_REQUIRED",(DB_CONNECTION && !empty($_POST[POST_INTERN_GET_MANAGEMENT])));
define("NO_CLIPPING",(LOGIN || (isset($_POST["p_ext_u"]) && $_POST["p_ext_u"] == XML_CLIP_NULL)));
define("SERVERSETUP",isServerSetup());
define("MANAGEMENT",(!empty($_POST[POST_INTERN_GET_MANAGEMENT]) && SERVERSETUP));

initData(array("INTERNAL","GROUPS","VISITOR","FILTERS","INPUTS","DBCONFIG"));
require(LIVEZILLA_PATH . "_lib/functions.internal.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.internal.inc.php");
validate();
if(isValidated())
{
    CacheManager::GetDataUpdateTimes();
	if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LISTEN || $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN)
	{
        $INTERNAL[CALLER_SYSTEM_ID]->SaveMobileParameters();
		listenXML();
		if(STATS_ACTIVE && !LOGIN)
			$STATS->ProcessAction(ST_ACTION_LOG_STATUS,array($INTERNAL[CALLER_SYSTEM_ID]));
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_FILE)
		receiveFile();
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_OPTIMIZE_TABLES)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.optimize.inc.php");
		optimizeTables($_POST["p_table"]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_IDLE)
	{
		require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		setIdle($_POST[POST_INTERN_SERVER_IDLE]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_RESOURCES)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
		processUpdateReport();
		processResources();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_REPORTS)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
		require(LIVEZILLA_PATH . "_lib/functions.internal.build.inc.php");
		processUpdateReport();
		buildReports();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_DATABASE_TEST)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		dataBaseTest();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_TEST_MAIL)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		sendTestMail();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_CREATE_TABLES)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		if(createTables())
            Server::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX],true);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_MANAGEMENT)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        Server::UpdateUserManagement(DB_PREFIX);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_CONFIG)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        Server::UpdateConfiguration();
        Server::UpdateLanguageFiles();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_AVAILABILITY)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		setAvailability($_POST["p_available"]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_DOWNLOAD_TRANSLATION)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		Server::GetTranslationData();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_GET_BANNER_LIST)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		getBannerList();
	}
    else if($_POST[POST_INTERN_SERVER_ACTION]=="upload_translation")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        Server::UpdateLanguageFiles();
    }
}
else
{
	$RESPONSE->SetValidationError(AUTH_RESULT);
}

if(isValidated() && !SERVERSETUP)
{
	if(LOGOFF || LOGIN)
	{
		if(LOGOFF)
			$INTERNAL[CALLER_SYSTEM_ID]->GetExternalObjects();

        /*
        if(LOGOFF)
            foreach($INTERNAL[CALLER_SYSTEM_ID]->ExternalChats as $chat)
            {

                $chat->Load();
                if($chat->Members[CALLER_SYSTEM_ID]->Status==0 && count($chat->Members)<=1)
                    $chat->InternalClose(CALLER_SYSTEM_ID);
                else if($chat->Status==1 && $chat->Members[CALLER_SYSTEM_ID]->Status != 2)
                    $chat->InternalDecline(CALLER_SYSTEM_ID);
                else
                    $chat->LeaveChat(CALLER_SYSTEM_ID);
            }
        */

		$INTERNAL[CALLER_SYSTEM_ID]->Reposts = array();
	}
	else if(isset($_POST[POST_GLOBAL_TYPING]))
		$INTERNAL[CALLER_SYSTEM_ID]->Typing = $_POST[POST_GLOBAL_TYPING];
		
	$INTERNAL[CALLER_SYSTEM_ID]->Save();
}

if(LOGIN && DB_ACCESS_REQUIRED)
{
	require(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
    $extension = (!empty($CONFIG["gl_db_ext"])) ? $CONFIG["gl_db_ext"] : "";
	$res = testDataBase($CONFIG["gl_db_host"],$CONFIG["gl_db_user"],$CONFIG["gl_db_pass"],$CONFIG["gl_db_name"],$CONFIG["gl_db_prefix"],$extension,false,$CONFIG["gl_db_eng"]);
	if(!empty($res))
		$RESPONSE->SetValidationError(LOGIN_REPLY_DB,$res);
}
$response = $RESPONSE->GetXML(true);
?>
