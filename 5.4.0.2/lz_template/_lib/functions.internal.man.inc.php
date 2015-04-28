<?php
/****************************************************************************************
* LiveZilla functions.internal.man.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

function setAvailability($_available)
{
	global $INTERNAL,$RESPONSE;
	administrationLog("setAvailability","",CALLER_SYSTEM_ID);
	if($INTERNAL[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN)
	{
		if(!empty($_POST["p_del_ws"]) && file_exists(str_replace("config.inc","config.".$_POST["p_del_ws"].".inc",FILE_CONFIG)))
			@unlink(str_replace("config.inc","config.".$_POST["p_del_ws"].".inc",FILE_CONFIG));
		if(!empty($_available) && file_exists(FILE_SERVER_DISABLED))
			@unlink(FILE_SERVER_DISABLED);
		else if(empty($_available) && !ISSUBSITE)
			createFile(FILE_SERVER_DISABLED,time(),false);
		$RESPONSE->SetStandardResponse(1,"");
	}
}

function setIdle($_idle)
{
	global $RESPONSE;
    if(empty($_idle) && file_exists(FILE_SERVER_IDLE))
        @unlink(FILE_SERVER_IDLE);
    $RESPONSE->SetStandardResponse(1,"");
}

function getBannerList($list = "")
{
	global $RESPONSE;
	administrationLog("getBannerList",serialize($_POST),CALLER_SYSTEM_ID);
	$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_IMAGES."` ORDER BY `id` ASC,`online` DESC;");
	while($row = DBManager::FetchArray($result))
		$list .= "<button type=\"".base64_encode($row["button_type"])."\" name=\"".base64_encode($row["button_type"]."_".$row["id"]."_".$row["online"].".".$row["image_type"])."\" data=\"".base64_encode($row["data"])."\" />\r\n";
	$RESPONSE->SetStandardResponse(1,"<button_list>".$list."</button_list>");
}

function dataBaseTest($id=0)
{
	global $RESPONSE;
	$res = testDataBase($_POST[POST_INTERN_DATABASE_HOST],$_POST[POST_INTERN_DATABASE_USER],$_POST[POST_INTERN_DATABASE_PASS],$_POST[POST_INTERN_DATABASE_NAME],$_POST[POST_INTERN_DATABASE_PREFIX],$_POST["p_db_ext"],false,@$_POST["p_db_eng"]);
	if(empty($res))
	{
		$RESPONSE->SetStandardResponse(1,base64_encode(""));
        Server::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX]);
	}
	else
		$RESPONSE->SetStandardResponse(2,base64_encode($res));
}

function sendTestMail($amount=0)
{
	global $RESPONSE;
    $account = Mailbox::GetById($_POST["p_mailbox"]);
    try
    {
        if($account->Type == "IMAP" || $account->Type == "POP")
        {
            $reload = false;
            $amount = $account->Download($reload,false,true);
            $return = 1;
        }
        else
        {
            $return = sendMail($account,$account->Email,$account->Email,"LiveZilla Test Mail","","LiveZilla Test Mail",true);
        }
    }
    catch(Exception $e)
    {
        logit(serialize($e));
        $return = $e->getMessage();
    }

    if(is_array($amount))
        $amount = count($amount);

    if($return==1)
		$RESPONSE->SetStandardResponse(1,base64_encode($amount));
	else
		$RESPONSE->SetStandardResponse(2,base64_encode($return));
}

function createTables($id=0)
{
	global $RESPONSE,$INTERNAL,$DB_CONNECTOR;
	if($INTERNAL[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN)
	{
        $connection = new DBManager($_POST[POST_INTERN_DATABASE_USER], $_POST[POST_INTERN_DATABASE_PASS], $_POST[POST_INTERN_DATABASE_HOST], "", $_POST[POST_INTERN_DATABASE_PREFIX]);
        $engine = (!empty($_POST["p_db_eng"]) && $_POST["p_db_eng"] == "InnoDB") ? "InnoDB" : "MyISAM";

        if(!empty($_POST["p_db_ext"]))
            DBManager::$Extension = strtolower($_POST["p_db_ext"]);

        if(DBManager::$Extension == "mysql" && !function_exists("mysql_connect"))
        {
            $RESPONSE->SetStandardResponse($id,base64_encode("PHP MySQL extension is missing (php_mysql.dll)"));
            return false;
        }
        else if(DBManager::$Extension == "mysqli" && !function_exists("mysqli_connect"))
        {
            $RESPONSE->SetStandardResponse($id,base64_encode("PHP MySQLi extension is missing (php_mysqli.dll)"));
            return false;
        }

        $connection->InitConnection();
		if(!DBManager::$Provider)
		{
			$error = DBManager::GetError();
			$RESPONSE->SetStandardResponse($id,base64_encode("Can't connect to database. Invalid host or login! (" . DBManager::GetErrorCode() . ((!empty($error)) ? ": " . $error : "") . ")"));
			return false;
		}
		else
		{
            $connection->Query(false,"SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8', character_set_database = 'utf8', character_set_server = 'utf8'");
			$db_selected = $connection->SelectDatabase(DBManager::RealEscape($_POST[POST_INTERN_DATABASE_NAME]));
			if(!$db_selected)
			{
				if(!empty($_POST[POST_INTERN_DATABASE_CREATE]))
				{
					$resultcr = $connection->Query(false,"CREATE DATABASE `".DBManager::RealEscape($_POST[POST_INTERN_DATABASE_NAME])."`");
					if(!$resultcr)
						$RESPONSE->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
					else
					{
						unset($_POST[POST_INTERN_DATABASE_CREATE]);
						return createTables();
					}
				}
				else
	    			$RESPONSE->SetStandardResponse(2,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
			}
			else
			{
				$resultvc = $connection->Query(false,"SELECT `version`,`chat_id`,`ticket_id` FROM `".DBManager::RealEscape($_POST[POST_INTERN_DATABASE_PREFIX]).DATABASE_INFO."` ORDER BY `version` DESC LIMIT 1");
				if($rowvc = @DBManager::FetchArray($resultvc))
				{
					if(VERSION != $rowvc["version"] && !empty($rowvc["version"]))
					{
						$upres = initUpdateDatabase($rowvc["version"],$connection,$_POST[POST_INTERN_DATABASE_PREFIX],$engine);
						if($upres === true)
						{
							$RESPONSE->SetStandardResponse(1,base64_encode(""));
							return true;
						}
					}
				}

				$resultv = $connection->Query(false,$sql = "SELECT VERSION() as `mysql_version`");
				if(!$resultv)
				{
					$RESPONSE->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $sql));
					return false;
				}
				else
				{
					$mrow = @DBManager::FetchArray($resultv);
					$mversion = explode(".",$mrow["mysql_version"]);
					if(count($mversion) > 0 && $mversion[0] < MYSQL_NEEDED_MAJOR)
					{
						$RESPONSE->SetStandardResponse($id,base64_encode("LiveZilla requires MySQL version ".MYSQL_NEEDED_MAJOR." or greater. The MySQL version installed on your server is " . $mrow["mysql_version"]."."));
						return false;
					}
				}


				$commands = explode("###",str_replace("<!--engine-->",$engine,str_replace("<!--version-->",VERSION,str_replace("<!--prefix-->",$_POST[POST_INTERN_DATABASE_PREFIX],file_get_contents(LIVEZILLA_PATH . "_definitions/dump.lsql")))));
                foreach($commands as $sql)
				{
					if(empty($sql))
						continue;

					$result = $connection->Query(false,trim($sql));
					if(!$result && DBManager::GetErrorCode() != 1050 && DBManager::GetErrorCode() != 1005 && DBManager::GetErrorCode() != 1062)
					{
						$RESPONSE->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $sql));
						return false;
					}
				}

				importButtons(PATH_IMAGES . "buttons/",$_POST[POST_INTERN_DATABASE_PREFIX],$connection);
				$DB_CONNECTOR = $connection;
				$RESPONSE->SetStandardResponse(1,base64_encode(""));
				return true;
			}
		}
	}
	return false;
}

function importButtons($_folder,$_prefix,$_connection)
{
	try
	{
		administrationLog("importButtons",serialize($_POST),CALLER_SYSTEM_ID);
		$buttons = getDirectory($_folder,".php",true);
		foreach($buttons as $button)
		{
			$parts = explode("_",$button);
			if(count($parts) == 3)
			{
				$type = ($parts[0]=="overlay") ? $parts[0] : "inlay";
				$id = intval($parts[1]);
				$online = explode(".",$parts[2]);
				$online = $online[0];
				$parts = explode(".",$button);
				$itype = $parts[1];
                $_connection->Query(false,"INSERT INTO `".DBManager::RealEscape($_prefix).DATABASE_IMAGES."` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('".DBManager::RealEscape($id)."','".DBManager::RealEscape($online)."','".DBManager::RealEscape($type)."','".DBManager::RealEscape($itype)."','".DBManager::RealEscape(fileToBase64($_folder . $button))."');");
			}
		}
	}
	catch (Exception $e)
	{
		logit(serialize($e));
	}
}

function testDataBase($_host,$_user,$_pass,$_dbname,$_prefix,$_extension="",$_intense=false,$_engine)
{
	global $DB_CONNECTOR;
	$connection = new DBManager($_user, $_pass, $_host, "", $_prefix);
    $_engine = (empty($_engine)) ? "MyISAM" : $_engine;

    if(!empty($_extension))
        DBManager::$Extension = $_extension;

    if(DBManager::$Extension == "mysql" && !function_exists("mysql_connect"))
        return "PHP MySQL extension is missing (php_mysql.dll)";
    else if(DBManager::$Extension == "mysqli" && !function_exists("mysqli_connect"))
        return "PHP/MySQLi extension is missing (php_mysqli.dll)";

    $connection->InitConnection();

	if(!DBManager::$Provider)
	{
		$error = DBManager::GetError();
		return "Can't connect to database. Invalid host or login! (" . DBManager::GetErrorCode() . ((!empty($error)) ? ": " . $error : "") . ")";
	}
	else
	{
		$db_selected = $connection->SelectDatabase(DBManager::RealEscape($_dbname));
		if (!$db_selected) 
    		return DBManager::GetErrorCode() . ": " . DBManager::GetError();
		else
		{
			$resultv = $connection->Query(false,"SELECT VERSION() as `mysql_version`");
			if(!$resultv)
				return DBManager::GetErrorCode() . ": " . DBManager::GetError();
			else
			{
				$mrow = @DBManager::FetchArray($resultv);
				$mversion = explode(".",$mrow["mysql_version"]);
				if(count($mversion) > 0 && $mversion[0] < MYSQL_NEEDED_MAJOR)
					return "LiveZilla requires MySQL version ".MYSQL_NEEDED_MAJOR." or greater. The MySQL version installed on your server is " . $mrow["mysql_version"].".";
			}

			$result = $connection->Query(false,"SELECT `version`,`chat_id`,`ticket_id` FROM `".DBManager::RealEscape($_prefix).DATABASE_INFO."` ORDER BY `version` DESC LIMIT 1");
			$row = @DBManager::FetchArray($result);
			$version = $row["version"];
			if(!$result || empty($version))
				return "Cannot read the LiveZilla Database version. Please try to recreate the table structure. If you experience this message during installation process, please try to setup a prefix (for example lz_).";
				
			if($version != VERSION && defined("SERVERSETUP") && SERVERSETUP)
			{
				$upres = initUpdateDatabase($version,$connection,$_prefix,$_engine);
				if($upres !== true)
					return "Cannot update database structure from [".$version."] to [".VERSION."]. Please make sure that the user " . $_user . " has the MySQL permission to ALTER tables in " . $_dbname .".\r\n\r\nError: " . $upres;
			}
			else if($version != VERSION && empty($_GET["iv"]))
				return "Invalid database version: ".$version." (required: ".VERSION."). Please validate the database in the server administration panel first.\r\n\r\n";

			$DB_CONNECTOR = $connection;
			$result = $connection->Query(false,"SELECT * FROM `".DBManager::RealEscape($_prefix).DATABASE_OPERATORS."`");
			if(DBManager::GetRowCount($result) == 0)
                Server::UpdateUserManagement($_prefix,false,true);

			if($_intense && empty($_GET["iv"]))
				foreach(get_defined_constants() as $constant => $val)
					if(substr($constant,0,9) == "DATABASE_")
						if(!$connection->Query(false,"SELECT * FROM `".DBManager::RealEscape($_prefix).$val."` LIMIT 1;"))
                        {
                            $code = DBManager::GetErrorCode();
                            $error = DBManager::GetError();

                            if($code == 144 || $code == 145 || $code == 1194)
                            {
                                $connection->Query(true,"REPAIR TABLE `".DBManager::RealEscape($_prefix).$val."`;");
                                $error .= " - (trying to repair ...)";
                            }
							return $code . ": " . $error;
                        }
			return null;
		}
	}
}

function initUpdateDatabase($_version,$_connection,$_prefix,$engine)
{
	require_once("./_lib/functions.data.db.update.inc.php");
	$upres = updateDatabase($_version,$_connection,$_prefix,$engine);
	return $upres;
}

class Server
{
    static function UpdateSignatures($_prefix)
    {
        administrationLog("UpdateSignatures","",CALLER_SYSTEM_ID);
        $sigs = array();
        foreach(array("g","u") as $type)
            foreach($_POST as $key => $value)
            {
                if(strpos($key,"p_db_sig_".$type."_")===0)
                {
                    $parts = explode("_",$key);
                    $gid = $parts[4];
                    if(empty($sigs[$type.$gid]))
                        $sigs[$type.$gid] = array();
                    if(strpos($key,"p_db_sig_".$type."_" . $gid . "_")===0)
                    {
                        if(!isset($sigs[$type.$gid][$parts[5]]))
                        {
                            $sigs[$type.$gid][$parts[5]] = new Signature();
                            $sigs[$type.$gid][$parts[5]]->GroupId = ($type=="g") ? base64_decode($gid) : "";
                            $sigs[$type.$gid][$parts[5]]->OperatorId = ($type=="u") ? base64_decode($gid) : "";
                        }
                    }
                    $sigs[$type.$gid][$parts[5]]->XMLParamAlloc($parts[6],$value);
                }
            }
        foreach($sigs as $signatures)
            foreach($signatures as $signature)
                $signature->Save($_prefix);
    }

    static function UpdateSocialMedia($_prefix)
    {
        administrationLog("UpdateSocialMedia","",CALLER_SYSTEM_ID);
        $channels = array();
        $groups = array();
        foreach($_POST as $key => $value)
        {
            if(strpos($key,"p_db_smc_g_")===0)
            {
                $parts = explode("_",$key);
                $gid = $parts[4];
                $groups[$gid] = true;
                if(empty($channels["g".$gid]))
                    $channels["g".$gid] = array();

                if(strpos($key,"p_db_smc_g_" . $gid . "_")===0)
                    if(!isset($channels["g".$gid][$parts[5]]))
                        $channels["g".$gid][$parts[5]] = new SocialMediaChannel(base64_decode($gid));

                $channels["g".$gid][$parts[5]]->XMLParamAlloc($parts[7],$value);
            }
        }
        foreach($channels as $chs)
            foreach($chs as $ch)
                $ch->Save($_prefix);
    }

    static function UpdatePredefinedMessages($_prefix)
    {
        administrationLog("UpdatePredefinedMessages","",CALLER_SYSTEM_ID);
        $pms = array();
        foreach(array("g","u") as $type)
            foreach($_POST as $key => $value)
            {
                if(strpos($key,"p_db_pm_".$type."_")===0)
                {
                    $parts = explode("_",$key);
                    $gid = $parts[4];
                    if(empty($pms[$type.$gid]))
                        $pms[$type.$gid] = array();
                    if(strpos($key,"p_db_pm_".$type."_" . $gid . "_")===0)
                    {
                        if(!isset($pms[$type.$gid][$parts[5]]))
                        {
                            $pms[$type.$gid][$parts[5]] = new PredefinedMessage();
                            $pms[$type.$gid][$parts[5]]->GroupId = ($type=="g") ? base64_decode($gid) : "";
                            $pms[$type.$gid][$parts[5]]->UserId = ($type=="u") ? base64_decode($gid) : "";
                            $pms[$type.$gid][$parts[5]]->LangISO = $parts[5];
                        }
                    }
                    $pms[$type.$gid][$parts[5]]->XMLParamAlloc($parts[6],$value);
                }
            }
        foreach($pms as $messages)
            foreach($messages as $message)
            {
                $message->Id = getId(32);
                $message->Save($_prefix);
            }
    }

    static function UpdateUserManagement($_prefix)
    {
        global $INTERNAL,$RESPONSE,$GROUPS,$VISITOR;
        if(isValidated() && is("VALIDATED_FULL_LOGIN") && isAdministrator(true))
        {
            administrationLog("SetManagement","",CALLER_SYSTEM_ID);
            $count = 0;
            while(isset($_POST["p_operators_" . $count . "_id"]))
            {
                if(!empty($_POST["p_operators_" . $count . "_delete"]))
                    queryDB(true,"DELETE FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `id`='".DBManager::RealEscape($_POST["p_operators_" . $count . "_id"])."' LIMIT 1;");
                else
                {
                    $did = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->AppDeviceId : "";
                    $abm = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->AppBackgroundMode : false;
                    $aos = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->AppOS : "";
                    $lac = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->LastActive : 0;
                    $fac = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->FirstActive : 0;
                    $wcl = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->ClientWeb : 0;
                    $acl = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->AppClient : 0;
                    $sta = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->Status : 2;
                    $tok = (!empty($INTERNAL[$_POST["p_operators_" . $count . "_system_id"]])) ? $INTERNAL[$_POST["p_operators_" . $count . "_system_id"]]->Token : "";
                    queryDB(true,"REPLACE INTO `".$_prefix.DATABASE_OPERATORS."` (`id`, `system_id`, `token`, `fullname`, `description`, `email`, `permissions`, `webspace`, `password`, `status`, `level`, `visitor_file_sizes`, `groups`, `groups_status`, `groups_hidden`,`reposts`, `languages`, `auto_accept_chats`, `login_ip_range`, `websites_users`, `websites_config`, `bot`, `wm`, `wmohca`,`first_active`,`last_active`,`sign_off`,`lweb`,`lapp`,`mobile_os`,`mobile_device_id`,`mobile_background`,`mobile_ex`,`max_chats`) VALUES ('".DBManager::RealEscape($_POST["p_operators_" . $count . "_id"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_system_id"])."','".DBManager::RealEscape($tok)."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_fullname"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_description"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_email"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_permissions"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_webspace"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_password"])."','".$sta."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_level"])."','','".DBManager::RealEscape($_POST["p_operators_" . $count . "_groups"])."','','".DBManager::RealEscape($_POST["p_operators_" . $count . "_groups_hidden"])."','','".DBManager::RealEscape($_POST["p_operators_" . $count . "_languages"])."',0,'".DBManager::RealEscape($_POST["p_operators_" . $count . "_lipr"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_websites_users"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_websites_config"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_bot"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_wm"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_wmohca"])."',".$fac.",".$lac.",".intval((empty($_POST["p_operators_" . $count . "_deac"])) ? 0 : 2).",".intval($wcl ? 1:0).",".intval($acl ? 1:0).",'".DBManager::RealEscape($aos)."','".DBManager::RealEscape($did)."',".intval($abm ? 1:0).",'".DBManager::RealEscape(@$_POST["p_operators_" . $count . "_mobile_ex"])."',".intval(@$_POST["p_operators_" . $count . "_max_chats"]).");");
                }

                if(!empty($_POST["p_operators_" . $count . "_pp"]))
                {
                    queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_PROFILE_PICTURES."` WHERE `webcam`='0' AND `internal_id`='".DBManager::RealEscape($_POST["p_operators_" . $count . "_id"])."' LIMIT 1;");
                    queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_PROFILE_PICTURES."` (`id` ,`internal_id`,`time` ,`webcam` ,`data`) VALUES ('".DBManager::RealEscape(getId(32))."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_system_id"])."','".DBManager::RealEscape(time())."',0,'".DBManager::RealEscape($_POST["p_operators_" . $count . "_pp"])."');");
                }
                $count++;
            }

            $count = 0;
            while(isset($_POST["p_groups_" . $count . "_id"]))
            {
                if(!empty($_POST["p_groups_" . $count . "_delete"]))
                    queryDB(true,"DELETE FROM `".$_prefix.DATABASE_GROUPS."`  WHERE `id`='".DBManager::RealEscape($_POST["p_groups_" . $count . "_id"])."' LIMIT 1;");
                else
                    queryDB(true,"REPLACE INTO `".$_prefix.DATABASE_GROUPS."` (`id`, `dynamic`, `description`, `external`, `internal`, `created`, `email`, `standard`, `opening_hours`, `functions`, `chat_inputs_hidden`, `ticket_inputs_hidden`, `chat_inputs_required`, `ticket_inputs_required`, `chat_inputs_masked`, `ticket_inputs_masked`, `chat_inputs_cap`, `ticket_inputs_cap`, `max_chats`, `visitor_filters`, `chat_vouchers_required`, `pre_chat_js`, `post_chat_js`, `ticket_email_out`, `ticket_email_in`, `ticket_handle_unknown`, `chat_email_out`,`ticket_assignment`,`priorities`,`priority_sleep`) VALUES ('".DBManager::RealEscape($_POST["p_groups_" . $count . "_id"])."',0,'".DBManager::RealEscape($_POST["p_groups_" . $count . "_description"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_external"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_internal"])."',".time().",'".DBManager::RealEscape($_POST["p_groups_" . $count . "_email"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_standard"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_opening_hours"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_functions"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_hidden"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_hidden"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_masked"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_masked"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_cap"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_cap"])."',".intval($_POST["p_groups_" . $count . "_max_chats"]).",'".DBManager::RealEscape($_POST["p_groups_" . $count . "_visitor_filters"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_vouchers_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_pre_js"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_post_js"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_out"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_in"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_handling"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_email_out"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_assign"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_priorities"])."',".intval($_POST["p_groups_" . $count . "_ps"]).");");
                SocialMediaChannel::DeleteByGroup($_prefix,$_POST["p_groups_" . $count . "_id"]);
                $count++;
            }

            queryDB(true,"DELETE FROM `".$_prefix.DATABASE_OPERATOR_LOGINS."`;");

            $INTERNAL=$GROUPS=$VISITOR=null;
            initData(array("INTERNAL","GROUPS","VISITOR"));

            Server::UpdatePredefinedMessages($_prefix);
            Server::UpdateSignatures($_prefix);
            Server::UpdateSocialMedia($_prefix);

            if(!empty($_POST["p_operators_0_id"]))
            {
                queryDB(true,"DELETE FROM `".$_prefix.DATABASE_AUTO_REPLIES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_AUTO_REPLIES."`.`owner_id`) AND NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_GROUPS."` WHERE `id` = `".$_prefix.DATABASE_AUTO_REPLIES."`.`owner_id`)");
                queryDB(true,"DELETE FROM `".$_prefix.DATABASE_PROFILE_PICTURES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_PROFILE_PICTURES."`.`internal_id`);");
                queryDB(true,"DELETE FROM `".$_prefix.DATABASE_PROFILES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_PROFILES."`.`id`);");

                if(isset($_POST[POST_INTERN_EDIT_USER]))
                {
                    $combos = explode(";",$_POST[POST_INTERN_EDIT_USER]);
                    for($i=0;$i<count($combos);$i++)
                        if(strpos($combos[$i],",") !== false)
                        {
                            $vals = explode(",",$combos[$i]);
                            if(strlen($vals[1])>0)
                                $INTERNAL[$vals[0]]->ChangePassword($vals[1]);
                            if($vals[2] == 1)
                                $INTERNAL[$vals[0]]->SetPasswordChangeNeeded();
                        }
                }
            }
            setIdle(0);
            $RESPONSE->SetStandardResponse(1,"");
        }
    }

    static function UpdateLanguageFiles()
    {
        global $CONFIG;
        if(isValidated() && is("VALIDATED_FULL_LOGIN") && isAdministrator(true))
        {
            administrationLog("writeLanguageFile","",CALLER_SYSTEM_ID);
            $int = 0;
            $delete = false;
            while(isset($_POST["p_trl_" . $int . "_0"]))
            {
                $isMobileFile = !(empty($_POST["p_trl_" . $int . "_2"]));
                $file = getLocalizationFileString($_POST["p_trl_" . $int . "_0"],false,$isMobileFile);

                if(empty($_POST["p_trl_" . $int . "_3"]))
                    createFile($file, ($_POST["p_trl_" . $int . "_1"]), true);
                else
                {
                    $delete = true;
                    if(file_exists($file))
                        @unlink($file);
                    if(empty($CONFIG["gl_root"]))
                        createFile($file,"",true);
                }
                $int++;
            }

            if(!empty($file) && !$delete && (!@file_exists($file) || (@file_exists($file) && @filemtime($file) !== false && @filemtime($file) < (time()-10))))
            {
                header("HTTP/1.1 502 Bad Gateway");
                exit("HTTP/1.1 502 Bad Gateway");
            }
        }
    }

    static function UpdateConfiguration($id = 0)
    {
        global $INTERNAL,$RESPONSE,$STATS;
        if(isValidated() && is("VALIDATED_FULL_LOGIN") && isAdministrator(true))
        {
            administrationLog("WriteConfig","",CALLER_SYSTEM_ID);
            if(is("STATS_ACTIVE") && !empty($_POST["p_reset_stats"]))
                $STATS->ResetAll();

            CacheManager::Flush();

            $int = 0;
            $file = (ISSUBSITE || $INTERNAL[CALLER_SYSTEM_ID]->Level != USER_LEVEL_ADMIN) ? str_replace("config.inc","config.".SUBSITEHOST.".inc",FILE_CONFIG) : FILE_CONFIG;

            if(DB_CONNECTION && (!ISSUBSITE || file_exists($file)))
            {
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` SET `delete`='1';");
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."`;");
                while(!empty($_POST["p_cfg_cct_id_" . $int]))
                {
                    $cct = new CommercialChatBillingType($_POST["p_cfg_cct_id_" . $int],$_POST["p_cfg_cct_mnoc_" . $int],$_POST["p_cfg_cct_mtloc_" . $int],$_POST["p_cfg_cct_tae_" . $int],$_POST["p_cfg_cct_tvbo_" . $int],$_POST["p_cfg_cct_svbo_" . $int],$_POST["p_cfg_cct_evbo_" . $int],$_POST["p_cfg_cct_citl_" . $int],$_POST["p_cfg_cct_p_" . $int]);
                    $cct->Save();
                    $iint = 0;

                    while(!empty($_POST["p_cfg_cctli_id_" . $int . "_" .$iint]))
                    {
                        $cctl = new CommercialChatVoucherLocalization($_POST["p_cfg_cctli_id_" . $int . "_" .$iint],$_POST["p_cfg_cctli_itl_" . $int . "_" .$iint],$_POST["p_cfg_cctli_t_" . $int . "_" .$iint],$_POST["p_cfg_cctli_d_" . $int . "_" .$iint],$_POST["p_cfg_cctli_terms_" . $int . "_" .$iint],$_POST["p_cfg_cctli_emvc_" . $int . "_" .$iint],$_POST["p_cfg_cctli_emvp_" . $int . "_" .$iint],$_POST["p_cfg_cctli_emvu_" . $int . "_" .$iint],$_POST["p_cfg_cctli_exr_" . $int . "_" .$iint]);
                        $cctl->Save($_POST["p_cfg_cct_id_" . $int]);
                        $iint++;
                    }
                    $int++;
                }
                $int=0;
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_PROVIDERS."`;");
                while(!empty($_POST["p_cfg_ccpp_id_" . $int]))
                {
                    $ccpp = new CommercialChatPaymentProvider($_POST["p_cfg_ccpp_id_" . $int],$_POST["p_cfg_ccpp_n_" . $int],$_POST["p_cfg_ccpp_a_" . $int],$_POST["p_cfg_ccpp_u_" . $int],$_POST["p_cfg_ccpp_l_" . $int]);
                    $ccpp->Save();
                    $int++;
                }
                $int=0;
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_MAILBOXES."`;");
                while(!empty($_POST["p_cfg_es_i_" . $int]))
                {
                    $acc = new Mailbox($int,true);
                    $acc->Save();
                    $int++;
                }

                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` WHERE `delete`='1';");
                queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CONFIG."`;");
                foreach($_POST as $key => $value)
                    if(strpos($key,"p_cfg_g_")===0)
                    {
                        $skey = str_replace("p_cfg_g_","",$key);
                        $value = base64_decode($value);
                        queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_CONFIG."` (`key`,`value`) VALUES ('".DBManager::RealEscape($skey)."','".DBManager::RealEscape($value)."');");
                    }
            }

            if(isset($_POST["p_available"]))
                setAvailability(!empty($_POST["p_available"]));
            $id = createFile($file,base64_decode($_POST["p_upload_value"]),true);
        }
        removeSSpanFile(true);
        setIdle(0);
        $RESPONSE->SetStandardResponse($id,"");
    }

    static function GetTranslationData($translation = "")
    {
        global $LZLANG,$RESPONSE;
        if(isValidated() && is("VALIDATED_FULL_LOGIN") && isAdministrator(true))
        {
            administrationLog("getTranslationData",serialize($_POST),CALLER_SYSTEM_ID);
            $langid = $_POST["p_int_trans_iso"];
            if(strpos($langid,"..") === false && strlen($langid) <= 6)
            {
                $mobile = !empty($_POST["p_int_trans_m"]);
                $mobileOriginal = !empty($_POST["p_int_trans_mo"]);
                $path = (!$mobileOriginal) ? "_language/" : "mobile/php/translation/";
                requireDynamic(getLocalizationFileString($langid,true,$mobile,$mobileOriginal),LIVEZILLA_PATH . $path);
                $translation .= "<language key=\"".base64_encode($langid)."\">\r\n";
                foreach($LZLANG as $key => $value)
                    $translation .= "<val key=\"".base64_encode($key)."\">".base64_encode($value)."</val>\r\n";
                $translation .= "</language>\r\n";
                $RESPONSE->SetStandardResponse(1,$translation);
            }
            else
                $RESPONSE->SetStandardResponse(0,$translation);
        }
    }
}
?>
