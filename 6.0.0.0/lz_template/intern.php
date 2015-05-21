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
define("SERVERSETUP",Server::IsServerSetup());
define("MANAGEMENT",(!empty($_POST[POST_INTERN_GET_MANAGEMENT]) && SERVERSETUP));
Server::InitDataBlock(array("INTERNAL","GROUPS","VISITOR","FILTERS","INPUTS","DBCONFIG"));
require(LIVEZILLA_PATH . "_lib/objects.internal.inc.php");
OperatorRequest::Validate();
if(OperatorRequest::IsValidated())
{
    CacheManager::GetDataUpdateTimes();
	if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LISTEN || $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN)
	{
        Server::$Operators[CALLER_SYSTEM_ID]->SaveMobileParameters();
		OperatorRequest::Listen();
		if(STATS_ACTIVE && !LOGIN)
			Server::$Statistic->ProcessAction(ST_ACTION_LOG_STATUS,array(Server::$Operators[CALLER_SYSTEM_ID]));
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_FILE)
		OperatorRequest::UploadFile();
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_OPTIMIZE_TABLES)
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.optimize.inc.php");
		DatabaseMaintenance::Optimize($_POST["p_table"]);
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
		ServerManager::DatabaseTest();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SEND_TEST_MAIL)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::SendTestMail();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_CREATE_TABLES)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		if(ServerManager::CreateTables())
            ServerManager::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX],true);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_MANAGEMENT)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::UpdateUserManagement(DB_PREFIX);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_CONFIG)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::UpdateConfiguration();
        ServerManager::UpdateLanguageFiles();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_SET_AVAILABILITY)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::UpdateAvailability($_POST["p_available"]);
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_DOWNLOAD_TRANSLATION)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::GetTranslationData();
	}
	else if($_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_GET_BANNER_LIST)
	{
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
		ServerManager::GetBannerList();
	}
    else if($_POST[POST_INTERN_SERVER_ACTION]=="upload_translation")
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        ServerManager::UpdateLanguageFiles();
    }
}
else
{
	Server::$Response->SetValidationError(AUTH_RESULT);
}

if(OperatorRequest::IsValidated() && !SERVERSETUP)
{
	if(LOGOFF || LOGIN)
	{
		if(LOGOFF)
			Server::$Operators[CALLER_SYSTEM_ID]->GetExternalObjects();

		Server::$Operators[CALLER_SYSTEM_ID]->Reposts = array();
	}
	Server::$Operators[CALLER_SYSTEM_ID]->Save();
}

if(LOGIN && DB_ACCESS_REQUIRED)
{
	require(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
    $extension = (!empty(Server::$Configuration->File["gl_db_ext"])) ? Server::$Configuration->File["gl_db_ext"] : "";
	$res = ServerManager::ValidateDatabase(Server::$Configuration->File["gl_db_host"],Server::$Configuration->File["gl_db_user"],Server::$Configuration->File["gl_db_pass"],Server::$Configuration->File["gl_db_name"],Server::$Configuration->File["gl_db_prefix"],$extension,false,Server::$Configuration->File["gl_db_eng"]);
	if(!empty($res))
		Server::$Response->SetValidationError(LOGIN_REPLY_DB,$res);
}
$response = Server::$Response->GetXML(true);
?>
