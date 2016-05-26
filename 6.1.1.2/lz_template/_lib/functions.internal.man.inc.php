<?php
/****************************************************************************************
* LiveZilla functions.internal.man.inc.php
* 
* Copyright 2015 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();


class ServerManager
{
    static function DatabaseTest()
    {
        $res = ServerManager::ValidateDatabase($_POST[POST_INTERN_DATABASE_HOST],$_POST[POST_INTERN_DATABASE_USER],$_POST[POST_INTERN_DATABASE_PASS],$_POST[POST_INTERN_DATABASE_NAME],$_POST[POST_INTERN_DATABASE_PREFIX],$_POST["p_db_ext"],false,@$_POST["p_db_eng"]);
        if(empty($res))
        {
            Server::$Response->SetStandardResponse(1,base64_encode(""));
            ServerManager::UpdateUserManagement($_POST[POST_INTERN_DATABASE_PREFIX]);
        }
        else
            Server::$Response->SetStandardResponse(2,base64_encode($res));
    }

    static function InitUpdateDatabase($_version,$_connection,$_prefix,$engine)
    {
        require_once("./_lib/functions.data.db.update.inc.php");
        $upres = updateDatabase($_version,$_connection,$_prefix,$engine);
        return $upres;
    }

    static function TestMailAccount($amount=0)
    {
        Logging::SecurityLog("ServerManager::SendTestMail","",CALLER_SYSTEM_ID);
        if(OperatorRequest::IsValidated() && OperatorRequest::IsAdministrator(true))
        {
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
                    $return = Communication::SendEmail($account,$account->Email,$account->Email,"LiveZilla Test Mail","","LiveZilla Test Mail",true);
                }
            }
            catch(Exception $e)
            {
                Logging::GeneralLog(serialize($e));
                $return = $e->getMessage();
            }

            if(is_array($amount))
                $amount = count($amount);

            if($return==1)
                Server::$Response->SetStandardResponse(1,base64_encode($amount));
            else
                Server::$Response->SetStandardResponse(2,base64_encode($return));
        }
    }

    static function ValidateDatabase($_host,$_user,$_pass,$_dbname,$_prefix,$_extension="",$_intense=false,$_engine)
    {
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
                    $upres = ServerManager::InitUpdateDatabase($version,$connection,$_prefix,$_engine);
                    if($upres !== true)
                        return "Cannot update database structure from [".$version."] to [".VERSION."]. Please make sure that the user " . $_user . " has the MySQL permission to ALTER tables in " . $_dbname .".\r\n\r\nError: " . $upres;
                }
                else if($version != VERSION && empty($_GET["iv"]))
                    return "Invalid database version: ".$version." (required: ".VERSION."). Please validate the database in the server administration panel first.\r\n\r\n";

                DBManager::$Connector = $connection;
                $result = $connection->Query(false,"SELECT * FROM `".DBManager::RealEscape($_prefix).DATABASE_OPERATORS."`");
                if(DBManager::GetRowCount($result) == 0)
                    ServerManager::UpdateUserManagement($_prefix,false,true);

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

    static function CreateTables($id=0)
    {
        if(OperatorRequest::IsAdministrator(true))
        {
            $connection = new DBManager($_POST[POST_INTERN_DATABASE_USER], $_POST[POST_INTERN_DATABASE_PASS], $_POST[POST_INTERN_DATABASE_HOST], "", $_POST[POST_INTERN_DATABASE_PREFIX]);
            $engine = (!empty($_POST["p_db_eng"]) && $_POST["p_db_eng"] == "InnoDB") ? "InnoDB" : "MyISAM";

            if(!empty($_POST["p_db_ext"]))
                DBManager::$Extension = strtolower($_POST["p_db_ext"]);

            if(DBManager::$Extension == "mysql" && !function_exists("mysql_connect"))
            {
                Server::$Response->SetStandardResponse($id,base64_encode("PHP MySQL extension is missing (php_mysql.dll)"));
                return false;
            }
            else if(DBManager::$Extension == "mysqli" && !function_exists("mysqli_connect"))
            {
                Server::$Response->SetStandardResponse($id,base64_encode("PHP MySQLi extension is missing (php_mysqli.dll)"));
                return false;
            }

            $connection->InitConnection();
            if(!DBManager::$Provider)
            {
                $error = DBManager::GetError();
                Server::$Response->SetStandardResponse($id,base64_encode("Can't connect to database. Invalid host or login! (" . DBManager::GetErrorCode() . ((!empty($error)) ? ": " . $error : "") . ")"));
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
                            Server::$Response->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
                        else
                        {
                            unset($_POST[POST_INTERN_DATABASE_CREATE]);
                            return ServerManager::CreateTables();
                        }
                    }
                    else
                        Server::$Response->SetStandardResponse(2,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError()));
                }
                else
                {
                    $resultvc = $connection->Query(false,"SELECT `version`,`chat_id`,`ticket_id` FROM `".DBManager::RealEscape($_POST[POST_INTERN_DATABASE_PREFIX]).DATABASE_INFO."` ORDER BY `version` DESC LIMIT 1");
                    if($rowvc = @DBManager::FetchArray($resultvc))
                    {
                        if(VERSION != $rowvc["version"] && !empty($rowvc["version"]))
                        {
                            $upres = ServerManager::InitUpdateDatabase($rowvc["version"],$connection,$_POST[POST_INTERN_DATABASE_PREFIX],$engine);
                            if($upres === true)
                            {
                                Server::$Response->SetStandardResponse(1,base64_encode(""));
                                return true;
                            }
                        }
                    }

                    $resultv = $connection->Query(false,$sql = "SELECT VERSION() as `mysql_version`");
                    if(!$resultv)
                    {
                        Server::$Response->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $sql));
                        return false;
                    }
                    else
                    {
                        $mrow = @DBManager::FetchArray($resultv);
                        $mversion = explode(".",$mrow["mysql_version"]);
                        if(count($mversion) > 0 && $mversion[0] < MYSQL_NEEDED_MAJOR)
                        {
                            Server::$Response->SetStandardResponse($id,base64_encode("LiveZilla requires MySQL version ".MYSQL_NEEDED_MAJOR." or greater. The MySQL version installed on your server is " . $mrow["mysql_version"]."."));
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
                            Server::$Response->SetStandardResponse($id,base64_encode(DBManager::GetErrorCode() . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $sql));
                            return false;
                        }
                    }

                    ServerManager::ImportButtons(PATH_IMAGES . "buttons/",$_POST[POST_INTERN_DATABASE_PREFIX],$connection);
                    DBManager::$Connector = $connection;
                    Server::$Response->SetStandardResponse(1,base64_encode(""));
                    return true;
                }
            }
        }
        return false;
    }

    static function GetImageSets($list = "")
    {
        Logging::SecurityLog("ServerManager::GetBannerList","",CALLER_SYSTEM_ID);
        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_IMAGES."` ORDER BY `id` ASC,`online` DESC;");
        while($row = DBManager::FetchArray($result))
            $list .= "<button type=\"".base64_encode($row["button_type"])."\" o=\"".base64_encode($row["online"])."\" t=\"".base64_encode($row["image_type"])."\" id=\"".base64_encode($row["id"])."\" name=\"".base64_encode($row["button_type"]."_".$row["id"]."_".$row["online"].".".$row["image_type"])."\" data=\"".base64_encode($row["data"])."\" />\r\n";
        Server::$Response->SetStandardResponse(1,"<button_list>".$list."</button_list>");
    }

    static function UpdateAvailability($_available)
    {
        Logging::SecurityLog("ServerManager::UpdateAvailability","",CALLER_SYSTEM_ID);
        if(Server::$Operators[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN)
        {
            if(!empty($_POST["p_del_ws"]) && file_exists(str_replace("config.inc","config.".$_POST["p_del_ws"].".inc",FILE_CONFIG)))
                @unlink(str_replace("config.inc","config.".$_POST["p_del_ws"].".inc",FILE_CONFIG));
            if(!empty($_available) && file_exists(FILE_SERVER_DISABLED))
                @unlink(FILE_SERVER_DISABLED);
            else if(empty($_available) && !ISSUBSITE)
                IOStruct::CreateFile(FILE_SERVER_DISABLED,time(),false);
            Server::$Response->SetStandardResponse(1,"");
        }
    }

    static function ImportButtons($_folder,$_prefix,$_connection)
    {
        try
        {
            Logging::SecurityLog("ServerManager::ImportButtons","",CALLER_SYSTEM_ID);
            $buttons = IOStruct::ReadDirectory($_folder,".php",true);
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
                    $_connection->Query(false,"INSERT INTO `".DBManager::RealEscape($_prefix).DATABASE_IMAGES."` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('".DBManager::RealEscape($id)."','".DBManager::RealEscape($online)."','".DBManager::RealEscape($type)."','".DBManager::RealEscape($itype)."','".DBManager::RealEscape(IOStruct::ToBase64($_folder . $button))."');");
                }
            }
        }
        catch (Exception $e)
        {
            Logging::GeneralLog(serialize($e));
        }
    }

    static function UpdateSignatures($_prefix)
    {
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
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN") && OperatorRequest::IsAdministrator(true))
        {
            Logging::SecurityLog("ServerManager::UpdateUserManagement","",CALLER_SYSTEM_ID);
            $count = 0;
            while(isset($_POST["p_operators_" . $count . "_id"]))
            {
                if(!empty($_POST["p_operators_" . $count . "_delete"]))
                    DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `id`='".DBManager::RealEscape($_POST["p_operators_" . $count . "_id"])."' LIMIT 1;");
                else
                {
                    $did = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->AppDeviceId : "";
                    $abm = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->AppBackgroundMode : false;
                    $aos = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->AppOS : "";
                    $lac = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->LastActive : 0;
                    $fac = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->FirstActive : 0;
                    $wcl = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->ClientWeb : 0;
                    $acl = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->AppClient : 0;
                    $sta = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->Status : 2;
                    $tok = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->Token : "";
                    $gaw = (!empty(Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]])) ? Server::$Operators[$_POST["p_operators_" . $count . "_system_id"]]->GroupsAway : "";


                    DBManager::Execute(true,"REPLACE INTO `".$_prefix.DATABASE_OPERATORS."` (`id`, `system_id`, `token`, `fullname`, `description`, `email`, `permissions`, `webspace`, `password`, `status`, `level`, `visitor_file_sizes`, `groups`, `groups_status`, `groups_hidden`,`reposts`, `languages`, `auto_accept_chats`, `login_ip_range`, `websites_users`, `websites_config`, `bot`, `wm`, `wmohca`,`first_active`,`last_active`,`sign_off`,`lweb`,`lapp`,`mobile_os`,`mobile_device_id`,`mobile_background`,`mobile_ex`,`max_chats`,`ldap`) VALUES ('".DBManager::RealEscape($_POST["p_operators_" . $count . "_id"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_system_id"])."','".DBManager::RealEscape($tok)."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_fullname"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_description"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_email"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_permissions"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_webspace"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_password"])."','".$sta."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_level"])."','','".DBManager::RealEscape($_POST["p_operators_" . $count . "_groups"])."','".DBManager::RealEscape(serialize($gaw))."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_groups_hidden"])."','','".DBManager::RealEscape($_POST["p_operators_" . $count . "_languages"])."',0,'".DBManager::RealEscape($_POST["p_operators_" . $count . "_lipr"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_websites_users"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_websites_config"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_bot"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_wm"])."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_wmohca"])."',".$fac.",".$lac.",".intval((empty($_POST["p_operators_" . $count . "_deac"])) ? 0 : 2).",".intval($wcl ? 1:0).",".intval($acl ? 1:0).",'".DBManager::RealEscape($aos)."','".DBManager::RealEscape($did)."',".intval($abm ? 1:0).",'".DBManager::RealEscape(@$_POST["p_operators_" . $count . "_mobile_ex"])."',".intval(@$_POST["p_operators_" . $count . "_max_chats"]).",".intval(@$_POST["p_operators_" . $count . "_ldap"]).");");
                }

                if(!empty($_POST["p_operators_" . $count . "_pp"]))
                {
                    DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_PROFILE_PICTURES."` WHERE `webcam`='0' AND `internal_id`='".DBManager::RealEscape($_POST["p_operators_" . $count . "_system_id"])."';");

                    if($_POST["p_operators_" . $count . "_pp"] != "DEFAULT")
                        DBManager::Execute(true,"INSERT INTO `".$_prefix.DATABASE_PROFILE_PICTURES."` (`id` ,`internal_id`,`time` ,`webcam` ,`data`) VALUES ('".DBManager::RealEscape(getId(32))."','".DBManager::RealEscape($_POST["p_operators_" . $count . "_system_id"])."','".DBManager::RealEscape(time())."',0,'".DBManager::RealEscape($_POST["p_operators_" . $count . "_pp"])."');");
                }
                $count++;
            }

            $count = 0;
            while(isset($_POST["p_groups_" . $count . "_id"]))
            {
                if(!empty($_POST["p_groups_" . $count . "_delete"]))
                    DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_GROUPS."`  WHERE `id`='".DBManager::RealEscape($_POST["p_groups_" . $count . "_id"])."' LIMIT 1;");
                else
                {
                    $f_position = 0;
                    $f_functions = "000000";
                    $result = DBManager::Execute(true,"SELECT * FROM `".$_prefix.DATABASE_GROUPS."` WHERE `id`='".DBManager::RealEscape($_POST["p_groups_" . $count . "_id"])."' LIMIT 1;");
                    if($row = DBManager::FetchArray($result))
                    {
                        $f_functions = (isset($row["functions"])) ? $row["functions"] : $f_functions;
                        $f_position = (isset($row["position"])) ? $row["position"] : $f_position;
                    }
                    $f_functions = (!empty($_POST["p_groups_" . $count . "_functions"])) ? $_POST["p_groups_" . $count . "_functions"] : $f_functions;
                    $f_position = (!empty($_POST["p_groups_" . $count . "_pos"])) ? $_POST["p_groups_" . $count . "_pos"] : $f_position;
                    $f_standard = (!empty($_POST["p_groups_" . $count . "_standard"])) ? 1 : 0;

                    DBManager::Execute(true,"REPLACE INTO `".$_prefix.DATABASE_GROUPS."` (`id`, `dynamic`, `description`, `external`, `internal`, `created`, `email`, `standard`, `opening_hours`, `functions`, `chat_inputs_hidden`, `ticket_inputs_hidden`, `chat_inputs_required`, `ticket_inputs_required`, `chat_inputs_masked`, `ticket_inputs_masked`, `chat_inputs_cap`, `ticket_inputs_cap`, `max_chats`, `visitor_filters`, `chat_vouchers_required`, `pre_chat_js`, `post_chat_js`, `ticket_email_out`, `ticket_email_in`, `ticket_handle_unknown`, `chat_email_out`,`ticket_assignment`,`priorities`,`priority_sleep`,`position`) VALUES ('".DBManager::RealEscape($_POST["p_groups_" . $count . "_id"])."',0,'".DBManager::RealEscape($_POST["p_groups_" . $count . "_description"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_external"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_internal"])."',".time().",'".DBManager::RealEscape($_POST["p_groups_" . $count . "_email"])."',".intval($f_standard).",'".DBManager::RealEscape($_POST["p_groups_" . $count . "_opening_hours"])."','".DBManager::RealEscape($f_functions)."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_hidden"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_hidden"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_masked"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_masked"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_inputs_cap"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_inputs_cap"])."',".intval($_POST["p_groups_" . $count . "_max_chats"]).",'".DBManager::RealEscape($_POST["p_groups_" . $count . "_visitor_filters"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_vouchers_required"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_pre_js"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_post_js"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_out"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_in"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_email_handling"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_chat_email_out"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_ticket_assign"])."','".DBManager::RealEscape($_POST["p_groups_" . $count . "_priorities"])."',".intval($_POST["p_groups_" . $count . "_ps"]).",".intval($f_position).");");
                }

                SocialMediaChannel::DeleteByGroup($_prefix,$_POST["p_groups_" . $count . "_id"]);
                $count++;
            }

            DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_OPERATOR_LOGINS."`;");

            Server::$Operators=Server::$Groups=Server::$Visitors=null;
            Server::InitDataBlock(array("INTERNAL","GROUPS","VISITOR"));

            ServerManager::UpdatePredefinedMessages($_prefix);
            ServerManager::UpdateSignatures($_prefix);
            ServerManager::UpdateSocialMedia($_prefix);

            if(!empty($_POST["p_operators_0_id"]))
            {
                DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_AUTO_REPLIES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_AUTO_REPLIES."`.`owner_id`) AND NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_GROUPS."` WHERE `id` = `".$_prefix.DATABASE_AUTO_REPLIES."`.`owner_id`)");
                DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_PROFILE_PICTURES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_PROFILE_PICTURES."`.`internal_id`);");
                DBManager::Execute(true,"DELETE FROM `".$_prefix.DATABASE_PROFILES."` WHERE NOT EXISTS (SELECT * FROM `".$_prefix.DATABASE_OPERATORS."` WHERE `system_id` = `".$_prefix.DATABASE_PROFILES."`.`id`);");

                if(isset($_POST[POST_INTERN_EDIT_USER]))
                {
                    $combos = explode(";",$_POST[POST_INTERN_EDIT_USER]);
                    for($i=0;$i<count($combos);$i++)
                        if(strpos($combos[$i],",") !== false)
                        {
                            $vals = explode(",",$combos[$i]);
                            if(strlen($vals[1])>0)
                                Server::$Operators[$vals[0]]->ChangePassword($vals[1]);
                            if($vals[2] == 1)
                                Server::$Operators[$vals[0]]->SetPasswordChangeNeeded();
                        }
                }
            }
            CacheManager::Flush();
            Server::$Response->SetStandardResponse(1,"");
        }
    }
	
	static function CreateCode()
    {
        if(OperatorRequest::IsValidated() && OperatorRequest::IsAdministrator(true))
        {
            $name = (isset($_POST["p_cc_n"])) ? $_POST["p_cc_n"] : '';
            DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_CODES."` WHERE `created` < ".(time()-3600)." AND `type`=0;");
            $id=getId(32);
            if(isset($_POST["p_cc_i"]) && strlen($_POST["p_cc_i"])==32)
            {
                $id = $_POST["p_cc_i"];
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_CODES."` WHERE `id` = '".DBManager::RealEscape($id)."';");
            }
            DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_CODES."` (`id`,`created`,`name`,`operator_id`,`type`,`code`,`element`) VALUES ('".DBManager::RealEscape($id)."',".time().", '".DBManager::RealEscape($name)."','".DBManager::RealEscape(CALLER_SYSTEM_ID)."', ".intval($_POST["p_cc_t"]).", '".DBManager::RealEscape($_POST["p_cc_c"])."', '".DBManager::RealEscape($_POST["p_cc_e"])."');");
            Server::$Response->SetStandardResponse(1,"<code id=\"".base64_encode($id)."\" />");
        }
	}

    static function DeleteCode()
    {
        if(OperatorRequest::IsValidated() && OperatorRequest::IsAdministrator(true))
        {
            DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_CODES."` WHERE `id`='".DBManager::RealEscape($_POST["p_cc_c"])."' LIMIT 1;");
        }
    }

    static function CreateImageSet($_remove=false)
    {
        if(!empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"]))
        {
            DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_IMAGES."`  WHERE `id`='".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"])."' AND `button_type`='".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"])."' LIMIT 2;");
            if(!$_remove && !empty($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"]))
            {
                DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_IMAGES."` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"])."',1,'".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"])."','".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vb"])."','".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_va"])."');");
                DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_IMAGES."` (`id`,`online`,`button_type`,`image_type`,`data`) VALUES ('".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_ve"])."',0,'".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vf"])."','".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vd"])."','".DBManager::RealEscape($_POST[POST_INTERN_PROCESS_IMAGE_SET . "_vc"])."');");
            }
            Server::$Response->SetStandardResponse(1,"");
        }
    }

    static function GetCodeList($xml = "")
    {
        if(OperatorRequest::IsValidated() && OperatorRequest::IsAdministrator(true))
        {
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CODES."` WHERE `type`=1 ORDER BY `created` DESC;");
            while($row = @DBManager::FetchArray($result))
                $xml .= "<code i=\"".base64_encode($row["id"])."\" t=\"".base64_encode($row["created"])."\" n=\"".base64_encode($row["name"])."\">".$row["element"]."</code>";
            Server::$Response->SetStandardResponse(1,"<code_list>".$xml."</code_list>");
        }
    }

    static function UpdateLanguageFiles()
    {
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN") && OperatorRequest::IsAdministrator(true))
        {
            Logging::SecurityLog("ServerManager::UpdateLanguageFiles","",CALLER_SYSTEM_ID);
            $int = 0;
            $delete = false;
            while(isset($_POST["p_trl_" . $int . "_0"]))
            {
                $isMobileFile = !(empty($_POST["p_trl_" . $int . "_2"]));
                $file = LocalizationManager::GetLocalizationFileString($_POST["p_trl_" . $int . "_0"],false,$isMobileFile);

                if(empty($_POST["p_trl_" . $int . "_3"]))
                    IOStruct::CreateFile($file, ($_POST["p_trl_" . $int . "_1"]), true);
                else
                {
                    $delete = true;
                    if(file_exists($file))
                        @unlink($file);
                    if(empty(Server::$Configuration->File["gl_root"]))
                        IOStruct::CreateFile($file,"",true);
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
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN") && OperatorRequest::IsAdministrator(true))
        {
            Logging::SecurityLog("ServerManager::UpdateConfiguration","",CALLER_SYSTEM_ID);
            if(Is::Defined("STATS_ACTIVE") && !empty($_POST["p_reset_stats"]))
                Server::$Statistic->ResetAll();

            $int = 0;
            if(DB_CONNECTION)
            {
                DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` SET `delete`='1';");
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."`;");
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
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_PROVIDERS."`;");
                while(!empty($_POST["p_cfg_ccpp_id_" . $int]))
                {
                    $ccpp = new CommercialChatPaymentProvider($_POST["p_cfg_ccpp_id_" . $int],$_POST["p_cfg_ccpp_n_" . $int],$_POST["p_cfg_ccpp_a_" . $int],$_POST["p_cfg_ccpp_u_" . $int],$_POST["p_cfg_ccpp_l_" . $int]);
                    $ccpp->Save();
                    $int++;
                }
                $int=0;
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_MAILBOXES."`;");
                while(!empty($_POST["p_cfg_es_i_" . $int]))
                {
                    $acc = new Mailbox($int,true);
                    $acc->Save();
                    $int++;
                }

                $int=0;
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_FEEDBACK_CRITERIA_CONFIG."`;");
                while(isset($_POST["p_cfg_fc_i_" . $int]))
                {
                    $fc = new FeedbackCriteria($int,true);
                    $fc->Save();
                    $int++;
                }

                $int=0;
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_SUBS."`;");
                while(isset($_POST["p_cfg_tsd_i_" . $int]))
                {
                    $tsd = new TicketSubDefinition($int,true);
                    $tsd->Save();
                    $int++;
                }

                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` WHERE `delete`='1';");
                DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_CONFIG."`;");
                foreach($_POST as $key => $value)
                    if(strpos($key,"p_cfg_g_")===0)
                    {
                        $skey = str_replace("p_cfg_g_","",$key);
                        $value = base64_decode($value);
                        DBManager::Execute(true,"REPLACE INTO `".DB_PREFIX.DATABASE_CONFIG."` (`key`,`value`) VALUES ('".DBManager::RealEscape($skey)."','".DBManager::RealEscape($value)."');");
                    }
                CacheManager::Flush();
            }

            if(isset($_POST["p_available"]))
                ServerManager::UpdateAvailability(!empty($_POST["p_available"]));
        }
        GeoTracking::SpanRemove(true);
        CacheManager::Flush();
        Server::$Response->SetStandardResponse($id,"");
    }

    static function GetTranslationData($translation = "")
    {
        global $LZLANG;
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN") && OperatorRequest::IsAdministrator(true))
        {
            Logging::SecurityLog("ServerManager::GetTranslationData",serialize($_POST),CALLER_SYSTEM_ID);
            $langid = $_POST["p_int_trans_iso"];
            if(strpos($langid,"..") === false && strlen($langid) <= 6)
            {
                $mobile = !empty($_POST["p_int_trans_m"]);
                $mobileOriginal = !empty($_POST["p_int_trans_mo"]);
                $path = (!$mobileOriginal) ? "_language/" : "mobile/php/translation/";
                IOStruct::RequireDynamic(LocalizationManager::GetLocalizationFileString($langid,true,$mobile,$mobileOriginal),LIVEZILLA_PATH . $path);
                $translation .= "<language key=\"".base64_encode($langid)."\">\r\n";
                foreach($LZLANG as $key => $value)
                    $translation .= "<val key=\"".base64_encode($key)."\">".base64_encode($value)."</val>\r\n";
                $translation .= "</language>\r\n";
                Server::$Response->SetStandardResponse(1,$translation);
            }
            else
                Server::$Response->SetStandardResponse(0,$translation);
        }
    }

    static function BackupLocalData($update=false,$update_nid=false,$nid=1,$xml="")
    {
        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX."operator_backups` WHERE `operator_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."';");
        if($result && DBManager::GetRowCount($result) > 0)
            while($row = @DBManager::FetchArray($result))
            {
                $nid = max($row["backup_id"],$nid);
                if($_POST["p_backup_id"] == $row["backup_id"])
                    $update_nid = $update = true;
                else
                    $xml .= "<bu_set i=\"".base64_encode($row["data_id"])."\">".$row["data"]."</bu_set>";
            }
        else
            $update = true;

        if($update_nid)
            $nid++;

        if($update)
        {
            $keys = array("ts","kbr");
            foreach($keys as $key)
                if(!empty($_POST["p_backup_data_" . $key])){
                    DBManager::Execute(true,"DELETE FROM `".DB_PREFIX."operator_backups` WHERE `operator_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."' AND `data_id`='".DBManager::RealEscape($key)."';");
                    DBManager::Execute(true,"INSERT INTO `".DB_PREFIX."operator_backups` (`backup_id`,`operator_id`,`data_id`,`time`,`data`) VALUES (".intval($nid).",'".DBManager::RealEscape(CALLER_SYSTEM_ID)."','".DBManager::RealEscape($key)."',".intval(time()).",'".DBManager::RealEscape($_POST["p_backup_data_" . $key])."');");
                }
        }
        $xml = "<bu i=\"".base64_encode($nid)."\">".$xml."</bu>";
        Server::$Response->SetStandardResponse(1,$xml);
    }
}
?>
