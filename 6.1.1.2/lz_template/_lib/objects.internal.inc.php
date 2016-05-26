<?php
/****************************************************************************************
* LiveZilla objects.internal.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

class OperatorRequest
{
    static function Validate($_basic=false)
    {
        if(!empty(Server::$Configuration->File["gl_rhts"]) && Communication::GetScheme() != SCHEME_HTTP_SECURE)
        {
            define("AUTH_RESULT",LOGIN_REPLY_HTTPS);
        }
        else if(DB_CONNECTION || SERVERSETUP)
        {
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_USER]))
            {
                foreach(Server::$Operators as $sysId => $operator)
                {
                    if(strtolower($operator->UserId) == strtolower($_POST[POST_INTERN_AUTHENTICATION_USER]))
                    {
                        if(!$operator->IsBot && $operator->ValidateLoginAttempt())
                        {
                            if(!empty(CacheManager::$ActiveManager))
                                $operator->LoadUnCacheables();

                            if($operator->ValidateLoginAuthentication())
                            {
                                define("CALLER_SYSTEM_ID",$sysId);
                                if($_basic)
                                {
                                    define("VALIDATED",true);
                                    return;
                                }

                                if(!empty($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]))
                                {
                                    if(empty($_POST["p_db_no_req"]) && !DB_CONNECTION)
                                    {
                                        define("AUTH_RESULT",LOGIN_REPLY_DB);
                                        break;
                                    }

                                    if(!LOGIN && !SERVERSETUP)
                                    {
                                        if($operator->Deactivated)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ACCOUNT_DEACTIVATED);
                                            break;
                                        }
                                        if(!$operator->ClientWeb && $operator->LastActive < (time()-Server::$Configuration->File["timeout_clients"]) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] == $operator->ClientSystemId)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_SESSION_TIMEOUT);
                                            break;
                                        }
                                        if($operator->SignOffRequest || (!empty($_POST["p_app_device_id"]) && $operator->AppDeviceId != "LOGIN" && $operator->AppDeviceId != $_POST["p_app_device_id"]))
                                        {
                                            $operator->SignOff(false);
                                            define("AUTH_RESULT",LOGIN_REPLY_SIGN_OFF_REQUEST);
                                            break;
                                        }
                                        if(!empty($operator->ClientSystemId) && !empty($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] != $operator->ClientSystemId)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_BAD_COMBINATION);
                                            break;
                                        }
                                    }
                                    else if(LOGIN && !SERVERSETUP)
                                    {
                                        $operator->AppClient = !empty($_POST["p_app"]);
                                        $operator->ClientWeb = !empty($_POST["p_web"]);

                                        if(($operator->AppClient || $operator->ClientWeb) && $operator->GetPermission(45,PERMISSION_FULL) == PERMISSION_NONE)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_NO_MOBILE_ACCESS);
                                            break;
                                        }
                                        else if($operator->Deactivated)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ACCOUNT_DEACTIVATED);
                                            break;
                                        }
                                        else if($operator->SignOffRequest)
                                        {
                                            $operator->SignOff(false);
                                            define("AUTH_RESULT",LOGIN_REPLY_SIGN_OFF_REQUEST);
                                            break;
                                        }
                                        else if(empty($_POST[POST_INTERN_IGNORE_SIGNED_ON]) && $operator->LastActive > (time()-Server::$Configuration->File["timeout_clients"]) && !empty($operator->ClientSystemId) && $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] != $operator->ClientSystemId)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_ALREADY_ONLINE);
                                            break;
                                        }
                                        else if(!isset($_POST["p_ldap"]) && $operator->PasswordChangeRequest && empty($_POST[POST_INTERN_NEW_PASSWORD]) && !$operator->ClientWeb)
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_CHANGE_PASS);
                                            break;
                                        }
                                    }
                                    else if(SERVERSETUP && $operator->Level != USER_LEVEL_ADMIN)
                                    {
                                        if(!(in_array(Server::$Configuration->File["gl_host"],$operator->WebsitesUsers) && !empty($_POST[POST_INTERN_GET_MANAGEMENT])) && !(in_array(Server::$Configuration->File["gl_host"],$operator->WebsitesConfig) && empty($_POST[POST_INTERN_GET_MANAGEMENT])))
                                        {
                                            define("AUTH_RESULT",LOGIN_REPLY_NOADMIN);
                                            break;
                                        }
                                    }

                                    define("VALIDATED",true);

                                    if(isset($_POST[POST_INTERN_NEW_PASSWORD]))
                                    {
                                        $operator->ChangePassword($_POST[POST_INTERN_NEW_PASSWORD]);
                                        Server::$Response->Authentications = "<val userid=\"".base64_encode(CALLER_SYSTEM_ID)."\" />\r\n";
                                    }

                                    if(Is::Defined("VALIDATED_FULL_LOGIN") && Is::Defined("LOGIN") && !Is::Defined("SERVERSETUP") && !Is::Defined("MANAGEMENT"))
                                    {
                                        $operator->ValidateUpdateSession(getId(32), $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]);
                                    }
                                    else if(LOGOFF)
                                    {
                                        $operator->ValidateUpdateSession("", "");
                                    }

                                    define("AUTH_RESULT",LOGIN_REPLY_SUCCEEDED);
                                    break;
                                }
                            }
                            else
                            {
                                $operator->DeleteLoginAttempts();

                                if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
                                    $operator->SaveLoginAttempt(md5($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]));

                                break;
                            }
                        }
                    }
                }
            }
        }
        else
            define("AUTH_RESULT",LOGIN_REPLY_DB);

        if(OperatorRequest::IsValidated() && LOGIN)
        {
            Server::$Operators[CALLER_SYSTEM_ID]->IP = Communication::GetIP();
            Server::$Operators[CALLER_SYSTEM_ID]->FirstActive = time();
            Server::$Operators[CALLER_SYSTEM_ID]->VisitorFileSizes = array();
            Server::$Operators[CALLER_SYSTEM_ID]->VisitorStaticReload = array();
            $isex = !empty(Server::$Operators[CALLER_SYSTEM_ID]->Groups) && Server::$Groups[Server::$Operators[CALLER_SYSTEM_ID]->Groups[0]]->IsExternal;
            Server::$Response->Login = Server::$Operators[CALLER_SYSTEM_ID]->GetLoginReply($isex,SystemTime::GetTimeDifference($_POST[POST_INTERN_CLIENT_TIME]));
        }
        if(!defined("AUTH_RESULT"))
        {
            define("AUTH_RESULT",LOGIN_REPLY_BAD_COMBINATION);
        }
    }

    static function GetConfig($xml="")
    {
        global $_CONFIG;
        $skeys = array("gl_db_host","gl_db_user","gl_db_pass","gl_db_name");
        $hashfile = FILE_CONFIG;
        $cindex = 0;

        foreach($_CONFIG as $index => $server_val)
        {
            if(is_array($server_val))
            {
                $xml .= "<conf key=\"".base64_encode($index)."\">\r\n";
                foreach($server_val as $skey => $sval)
                {
                    if(!is_array($sval))
                        $xml .= "<sub key=\"".base64_encode($skey)."\">".($sval)."</sub>\r\n";
                }
                $xml .= "</conf>\r\n";
            }
            else if(!(is_int($index) && is_array($server_val)))
            {
                $xml .= "<conf value=\"".($server_val)."\" key=\"".base64_encode($index)."\" />\r\n";
            }
        }

        $sxml = "";
        foreach($_CONFIG as $index => $server_val)
        {
            if(is_int($index) && is_array($server_val))
            {
                $sxml .= "<site index=\"".base64_encode($cindex)."\">\r\n";
                foreach($server_val as $key => $site_val)
                {
                    if(is_array($site_val))
                    {
                        $sxml .= "<conf key=\"".base64_encode($key)."\">\r\n";
                        foreach($site_val as $skey => $sval)
                            $sxml .= "<sub key=\"".base64_encode($skey)."\">".($sval)."</sub>\r\n";
                        $sxml .= "</conf>\r\n";
                    }
                    else if(!in_array($key,$skeys) || SERVERSETUP)
                        $sxml .= "<conf value=\"".($site_val)."\" key=\"".base64_encode($key)."\" />\r\n";
                    else
                        $sxml .= "<conf value=\"".base64_encode("")."\" key=\"".base64_encode($key)."\" />\r\n";
                }
                $cindex++;

                if(Server::$Configuration->File["gl_host"] == base64_decode($server_val["gl_host"]))
                {
                    $sxml .= "<db_conf>\r\n";
                    if(!empty(Server::$Configuration->Database["cct"]))
                    {
                        $sxml .= "<cct>\r\n";
                        foreach(Server::$Configuration->Database["cct"] as $cct)
                            $sxml .= $cct->GetXML();
                        $sxml .= "</cct>\r\n";
                    }
                    if(!empty(Server::$Configuration->Database["ccpp"]))
                    {
                        $sxml .= "<ccpp>\r\n";
                        foreach(Server::$Configuration->Database["ccpp"] as $ccpp)
                            $sxml .= $ccpp->GetXML();
                        $sxml .= "</ccpp>\r\n";
                    }
                    if(!empty(Server::$Configuration->Database["gl_email"]))
                    {
                        $sxml .= "<gl_email>\r\n";
                        foreach(Server::$Configuration->Database["gl_email"] as $mb)
                            $sxml .= $mb->GetXML();
                        $sxml .= "</gl_email>\r\n";
                    }
                    if(!empty(Server::$Configuration->Database["gl_fb"]))
                    {
                        $sxml .= "<gl_fbc>\r\n";
                        foreach(Server::$Configuration->Database["gl_fb"] as $fbc)
                            $sxml .= $fbc->GetXML();
                        $sxml .= "</gl_fbc>\r\n";
                    }
                    if(!empty(Server::$Configuration->Database["gl_go"]))
                    {
                        $sxml .= "<gl_go>\r\n";
                        foreach(Server::$Configuration->Database["gl_go"] as $goal)
                            $sxml .= $goal->GetXML();
                        $sxml .= "</gl_go>\r\n";
                    }
                    if(!empty(Server::$Configuration->Database["gl_tsd"]))
                    {
                        $sxml .= "<gl_tsd>\r\n";
                        foreach(Server::$Configuration->Database["gl_tsd"] as $tsd)
                            $sxml .= $tsd->GetXML();
                        $sxml .= "</gl_tsd>\r\n";
                    }
                    $sxml .= "</db_conf>\r\n";
                }
                $sxml .= "</site>\r\n";
            }
        }

        $xml .= $sxml;
        $xml .= "<translations>\r\n";
        $files = IOStruct::ReadDirectory("./_language","index",true);
        foreach($files as $translation)
        {
            if(strpos($translation,".bak.")===false && Str::EndsWith($translation,".php"))
            {
                $lang = substr($translation,4,strlen($translation)-1);
                $mobile = false;
                if(strpos($lang,"mobile")===0)
                {
                    $lang = substr($lang,6,strlen($lang)-6);
                    $mobile = true;
                }
                $parts = explode(".",$lang);
                if((ISSUBSITE && strpos($translation,$parts[0].".".SUBSITEHOST) !== false) || (!ISSUBSITE && substr_count($translation,".")==1))
                    $xml .= "<language m=\"".base64_encode($mobile?"1":"0")."\" key=\"".base64_encode($parts[0])."\" blocked=\"".base64_encode((@filesize("./_language/".$translation) == 0) ? 1 : "0"). "\" />\r\n";
                else if(ISSUBSITE && strpos($translation,$parts[0].".".SUBSITEHOST) === false && !@file_exists(LocalizationManager::GetLocalizationFileString($parts[0],false)) && substr_count($translation,".")==1)
                    $xml .= "<language m=\"".base64_encode($mobile?"1":"0")."\" key=\"".base64_encode($parts[0])."\" derived=\"".base64_encode(1). "\" />\r\n";
            }
        }
        $xml .= "</translations>\r\n";
        $xml .= "<php_cfg_vars post_max_size=\"".base64_encode(IOStruct::ToBytes((!Is::Null(@get_cfg_var("post_max_size")))?get_cfg_var("post_max_size"):MAX_POST_SIZE_SAFE_MODE))."\" upload_max_filesize=\"".base64_encode(IOStruct::ToBytes((!Is::Null(@get_cfg_var("upload_max_filesize")))?get_cfg_var("upload_max_filesize"):MAX_UPLOAD_SIZE_SAFE_MODE))."\" />\r\n";
        $xml .= "</gl_c>\r\n";
        return "<gl_c h=\"".base64_encode(substr(IOStruct::HashMD5($hashfile),0,5))."\">\r\n" . $xml;
    }

    static function Listen()
    {
        OperatorRequest::Process();

        if(!SERVERSETUP && !LOGIN && Server::$Operators[CALLER_SYSTEM_ID]->Status == USER_STATUS_OFFLINE)
            return;

        Server::$Response->XML = "<listen disabled=\"".base64_encode(((Server::IsAvailable(false)) ?  "0" : "1" ))."\" h=\"<!--gl_all-->\" ".((isset($_POST[POST_INTERN_XMLCLIP_HASH_EXECUTION_TIME])) ? "ex_time=\"<!--execution_time-->\"" : "").">\r\n";
        Server::$Response->Typing = "";
        if(Server::$Response->Login != null)
            Server::$Response->XML .= Server::$Response->Login;

        OperatorRequest::Build();

        processPosts();

        if(($hash = substr(md5(Server::$Response->Typing),0,5)) != @$_POST["p_gl_t"] && strlen(Server::$Response->Typing) > 0)
            Server::$Response->XML .= "<gl_typ h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Typing . "</gl_typ>\r\n";
        Server::$Response->XML .= Server::$Response->Events . "\r\n";
        if(($hash = substr(md5(Server::$Response->Exceptions),0,5)) != @$_POST["p_gl_e"] && strlen(Server::$Response->Exceptions) > 0)
            Server::$Response->XML .= "<gl_e h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Exceptions . "</gl_e>\r\n";
        if(($hash = substr(md5(Server::$Response->Internals),0,5)) != @$_POST["p_int_r"] && strlen(Server::$Response->Internals) > 0)
            Server::$Response->XML .= "<int_r h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Internals . "</int_r>\r\n";
        if(($hash = substr(md5(Server::$Response->Groups),0,5)) != @$_POST["p_int_d"] && strlen(Server::$Response->Groups) > 0)
            Server::$Response->XML .= "<int_d h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Groups . "</int_d>\r\n";
        if(($hash = substr(md5(Server::$Response->Actions),0,5)) != @$_POST["p_int_ev"])
            Server::$Response->XML .= "<int_ac h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Actions . "</int_ac>\r\n";
        if(($hash = substr(md5(Server::$Response->InternalVcards),0,5)) != @$_POST["p_int_v"])
            Server::$Response->XML .= "<int_v h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->InternalVcards . "</int_v>\r\n";
        if(($hash = substr(md5(Server::$Response->InternalWebcamPictures),0,5)) != @$_POST["p_int_wp"])
            Server::$Response->XML .= "<int_wp h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->InternalWebcamPictures . "</int_wp>\r\n";
        if(!empty(Server::$Response->Tracking) && ($hash = substr(md5(Server::$Response->Tracking),0,5)) != @$_POST["p_ext_u"])
            Server::$Response->XML .= "<ext_u h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Tracking . "</ext_u>\r\n";
        if(($hash = substr(md5(Server::$Response->Forwards),0,5)) != @$_POST["p_ext_f"])
            Server::$Response->XML .= "<ext_f h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Forwards . "</ext_f>\r\n";
        if(($hash = substr(md5(Server::$Response->ChatVouchers),0,5)) != @$_POST["p_ext_ct"])
            Server::$Response->XML .= "<ext_ct h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->ChatVouchers . "</ext_ct>\r\n";
        if(Server::$Response->Archive != null)
            Server::$Response->XML .= "<ext_c>\r\n" . Server::$Response->Archive . "</ext_c>\r\n";
        if(Server::$Response->Resources != null)
            Server::$Response->XML .= "<ext_res>\r\n" . Server::$Response->Resources . "</ext_res>\r\n";
        if(Server::$Response->Feedbacks != null)
            Server::$Response->XML .= "<ext_fb>\r\n" . Server::$Response->Feedbacks . "</ext_fb>\r\n";
        if(Server::$Response->Filters != null)
            Server::$Response->XML .= "<ext_b h=\"".base64_encode($hash)."\">\r\n" . Server::$Response->Filters . "</ext_b>\r\n";
        if(!empty(Server::$Response->Reports))
            Server::$Response->XML .= Server::$Response->Reports;
        Server::$Response->XML .= Server::$Response->Messages . "\r\n";
        if(strlen(Server::$Response->Authentications) > 0)
            Server::$Response->XML .= "<gl_auths>\r\n" . Server::$Response->Authentications . "\r\n</gl_auths>\r\n";
        if(strlen(Server::$Response->Posts)>0)
            Server::$Response->XML .=  "<usr_p>\r\n" . Server::$Response->Posts . "</usr_p>\r\n";
        if(isset($_POST[POST_INTERN_ACCESSTEST]))
            Server::$Response->XML .= "<permission>" . base64_encode(OperatorRequest::GetPermissions()) . "</permission>";
        if(SERVERSETUP || LOGIN || Server::$Operators[CALLER_SYSTEM_ID]->LastActive <= @filemtime(FILE_CONFIG))
            Server::$Response->XML .= OperatorRequest::GetConfig();
        Server::$Response->XML .= "</listen>";
    }

    static function Process()
    {
        require(LIVEZILLA_PATH . "_lib/functions.internal.process.inc.php");
        processChatActions();
        processAuthentications();
        processStatus();
        processChatInvitation();
        processForwards();
        processWebsitePushs();
        processAutoReplies();
        processFilters();
        processProfile();
        processProfilePictures();
        processWebcamPictures();
        processAlerts();
        processPermissions();
        processTicketActions();
        processExternalReloads();
        processReceivedPosts();
        processCancelInvitation();
        processEvents();
        processGoals();
        processResources();
        if(SERVERSETUP && Server::$Operators[CALLER_SYSTEM_ID]->Level == USER_LEVEL_ADMIN || in_array(Server::$Configuration->File["gl_host"],Server::$Operators[CALLER_SYSTEM_ID]->WebsitesConfig))
            processButtonIcons();
    }

    static function Build()
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.build.inc.php");
        Server::$Operators[CALLER_SYSTEM_ID]->GetExternalObjects();

        buildIntern();
        buildExtern();
        buildEvents();

        if(!Server::$Operators[CALLER_SYSTEM_ID]->ClientWeb)
        {
            buildActions();
        }

        if(!SERVERSETUP)
        {
            if(!LOGIN)
            {
                buildNewPosts();
                if(!isset($_POST[POST_GLOBAL_SHOUT]))
                {
                    buildResources();
                    demandFeedback();
                    demandFilters();
                    demandTickets();
                    demandEmails();

                    if(!Server::$Operators[CALLER_SYSTEM_ID]->ClientWeb)
                    {
                        //buildTickets();
                        buildArchive();
                        buildChatVouchers();
                    }
                    else
                    {
                        //demandTickets();
                        //demandEmails();
                        demandChats();
                        demandReports();
                    }
                }
            }
        }
    }

    static function IsAdministrator($_allowSubSites=false)
    {
        if(OperatorRequest::IsValidated() && isset(Server::$Operators[CALLER_SYSTEM_ID]))
        {
            if(Server::$Operators[CALLER_SYSTEM_ID]->Level == USER_LEVEL_ADMIN)
                return true;
            else if($_allowSubSites && (is_array(Server::$Operators[CALLER_SYSTEM_ID]->WebsitesUsers) && in_array(Server::$Configuration->File["gl_host"],Server::$Operators[CALLER_SYSTEM_ID]->WebsitesUsers)))
                return true;
        }
        return false;
    }

    static function IsValidated()
    {
        return (defined("VALIDATED") && defined("CALLER_SYSTEM_ID") && VALIDATED === true);
    }

    static function MaskData($_value,$_level)
    {
        $_value = utf8_decode($_value);
        $reserved=array("@",".",",","-","_"," ");
        if(!empty($_value))
            for($i=0;$i<strlen($_value);$i++)
                if(!in_array($_value[$i],$reserved))
                    if($_level==1)
                        $_value[$i]="*";
                    else if($_level==2 && $i%2==0)
                        $_value[$i]="*";
                    else if($_level==3 && $i<=(strlen($_value)/2))
                        $_value[$i]="*";
                    else if($_level==4 && $i>(strlen($_value)/2))
                        $_value[$i]="*";
        $_value = utf8_encode($_value);
        return $_value;
    }

    static function IPMatch($_ip, $_range)
    {
        if (strpos($_range, '/') !== false)
        {
            list($_range, $netmask) = explode('/', $_range, 2);
            if (strpos($netmask, '.') !== false)
            {
                $netmask = str_replace('*', '0', $netmask);
                $netmask_dec = ip2long($netmask);
                return ((ip2long($_ip) & $netmask_dec) == (ip2long($_range) & $netmask_dec));
            }
            else
            {
                $x = explode('.', $_range);
                while(count($x)<4) $x[] = '0';
                list($a,$b,$c,$d) = $x;
                $_range = sprintf("%u.%u.%u.%u", empty($a)?'0':$a, empty($b)?'0':$b,empty($c)?'0':$c,empty($d)?'0':$d);
                $range_dec = ip2long($_range);
                $ip_dec = ip2long($_ip);
                $wildcard_dec = pow(2,(32-$netmask)) - 1;
                $netmask_dec = ~ $wildcard_dec;
                return (($ip_dec & $netmask_dec) == ($range_dec & $netmask_dec));
            }
        }
        else
        {
            if(strpos($_range, '*')!==false)
            {
                $lower = str_replace('*', '0', $_range);
                $upper = str_replace('*', '255', $_range);
                $_range = "$lower-$upper";
            }
            if(strpos($_range, '-')!==false)
            {
                list($lower, $upper) = explode('-', $_range, 2);
                $lower_dec = (float)sprintf("%u",ip2long($lower));
                $upper_dec = (float)sprintf("%u",ip2long($upper));
                $ip_dec = (float)sprintf("%u",ip2long($_ip));
                return (($ip_dec>=$lower_dec) && ($ip_dec<=$upper_dec) );
            }
            return false;
        }
    }

    static function UploadFile($id = FILE_ACTION_NONE)
    {
        if(isset($_POST[POST_INTERN_FILE_TYPE]) && $_POST[POST_INTERN_FILE_TYPE] == FILE_TYPE_USERFILE)
        {
            if(!empty($_GET["QRD_TFILE"]))
                $_FILES["file"]["name"] = base64_decode($_GET["QRD_TFILE"]);

            if(empty($_GET["QRD_TRESID"]))
                $fid = md5($_FILES["file"]["name"] . CALLER_SYSTEM_ID . time());
            else
                $fid = base64_decode($_GET["QRD_TRESID"]);

            $filemask = CALLER_SYSTEM_ID . "_" . $fid;

            if(empty($_GET["QRD_PARENT_ID"]))
            {
                KnowledgeBase::CreateFolders(CALLER_SYSTEM_ID,true);
                KnowledgeBase::Process(CALLER_SYSTEM_ID,CALLER_SYSTEM_ID,Server::$Operators[CALLER_SYSTEM_ID]->Fullname,0,Server::$Operators[CALLER_SYSTEM_ID]->Fullname,0,4,3);
                $parentId = CALLER_SYSTEM_ID;
                $rank = 4;
            }
            else
            {
                $parentId = $_GET["QRD_PARENT_ID"];
                $rank = $_GET["QRD_RANK"];
            }
            KnowledgeBase::Process(CALLER_SYSTEM_ID,$fid,$filemask,3,$_FILES["file"]["name"],0,$parentId,$rank,$_FILES["file"]["size"]);
            if(@move_uploaded_file($_FILES["file"]["tmp_name"], PATH_UPLOADS.$filemask))
                $id = FILE_ACTION_SUCCEEDED;
            else
                $id = FILE_ACTION_ERROR;
        }
        Server::$Response->SetStandardResponse($id,base64_encode($fid));
    }

    static function GetPermissions()
    {
        $directories = Array(PATH_UPLOADS,PATH_CONFIG);
        foreach($directories as $dir)
        {
            $result = IOStruct::IsWriteable($dir);
            if(!$result)
                return 0;
        }
        return 1;
    }
}

class InternalXMLBuilder
{
	public $Caller;
	public $XMLProfilePictures = "";
	public $XMLWebcamPictures = "";
	public $XMLProfiles = "";
	public $XMLInternal = "";
	public $XMLTyping = "";
	public $XMLGroups = "";

	function __construct($_caller)
	{
		$this->Caller = $_caller;
	}

	function Generate()
	{
        Server::InitDataBlock(array("DBCONFIG"));
        $objects = array("group"=>Server::$Groups,"operator"=>Server::$Operators);
        foreach($objects as $type => $list)
            foreach($list as $sysId => $object)
            {
                $arxml="";
                if(!$object->IsDynamic && !(SERVERSETUP || Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(20) == PERMISSION_NONE || (!Server::$Operators[CALLER_SYSTEM_ID]->IsInGroupWith($object) && Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(20) != PERMISSION_FULL)))
                {
                    foreach($object->AutoReplies as $reply)
                        $arxml .= $reply->GetXML();
                }

                if($type=="group")
                {
                    if(!SERVERSETUP && in_array($sysId,Server::$Operators[CALLER_SYSTEM_ID]->GroupsHidden))
                        continue;

                    $this->XMLGroups .= $object->GetXML();
                    if(SERVERSETUP && !$object->IsDynamic)
                    {
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_sm")."\">".base64_encode($object->ChatFunctions[0])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_so")."\">".base64_encode($object->ChatFunctions[1])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_pr")."\">".base64_encode($object->ChatFunctions[2])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_ra")."\">".base64_encode($object->ChatFunctions[3])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_fv")."\">".base64_encode($object->ChatFunctions[4])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("gr_ex_fu")."\">".base64_encode($object->ChatFunctions[5])."</f>\r\n";
                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_hidden")."\">\r\n";

                        foreach($object->ChatInputsHidden as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_hidden")."\">\r\n";
                        foreach($object->TicketInputsHidden as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_mandatory")."\">\r\n";
                        foreach($object->ChatInputsMandatory as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_mandatory")."\">\r\n";
                        foreach($object->TicketInputsMandatory as $index)
                            $this->XMLGroups .= "<value>".base64_encode($index)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_masked")."\">\r\n";
                        foreach($object->ChatInputsMasked as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_masked")."\">\r\n";
                        foreach($object->TicketInputsMasked as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_cap")."\">\r\n";
                        foreach($object->TicketInputsCapitalized as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ci_cap")."\">\r\n";
                        foreach($object->ChatInputsCapitalized as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("ti_assign")."\">\r\n";
                        foreach($object->TicketAssignment as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("c_prio")."\">\r\n";
                        foreach($object->ChatPriorities as $index => $value)
                            $this->XMLGroups .= "<value key=\"".base64_encode($index)."\">".base64_encode($value)."</value>\r\n";
                        $this->XMLGroups .= "</f>\r\n";

                        $this->XMLGroups .= "<f key=\"".base64_encode("c_smc")."\">\r\n";
                        if(!empty(Server::$Configuration->Database["gl_sm"]))
                            foreach(Server::$Configuration->Database["gl_sm"] as $channel)
                                if($channel->GroupId == $sysId)
                                    $this->XMLGroups .= $channel->GetXML();
                        $this->XMLGroups .= "</f>\r\n";
                    }
                    else
                        $this->XMLGroups .= $arxml;

                    $this->XMLGroups .= "</v>\r\n";
                }
                else
                {
                    $b64sysId = base64_encode($sysId);
                    $sessiontime = $this->Caller->LastActive;

                    if($sysId != CALLER_SYSTEM_ID && !empty(Server::$Operators[$sysId]->WebcamPicture))
                    {
                        if(Server::$Operators[$sysId]->WebcamPictureTime >= $sessiontime)
                            $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".Server::$Operators[$sysId]->WebcamPicture."\" />\r\n";
                    }
                    else
                        $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".base64_encode("")."\" />\r\n";

                    $DEAC = (Server::$Operators[$sysId]->Deactivated) ? " deac=\"".base64_encode(1)."\"" : "";
                    $CPONL = (Server::$Operators[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN) ? " cponl=\"".base64_encode(($object->PasswordChangeRequest) ? 1 : 0)."\"" : "";
                    $PASSWORD = (SERVERSETUP) ? " pass=\"".base64_encode(Server::$Operators[$sysId]->Password)."\"" : "";

                    $WSCONFIG = Server::$Operators[$sysId]->WebsitesConfig;array_walk($WSCONFIG,"b64ecode");
                    $WSUSERS = Server::$Operators[$sysId]->WebsitesUsers;array_walk($WSUSERS,"b64ecode");

                    $botatts = (Server::$Operators[$sysId]->IsBot) ? " isbot=\"".base64_encode(Server::$Operators[$sysId]->IsBot ? "1" : "0")."\" wm=\"".base64_encode(Server::$Operators[$sysId]->WelcomeManager ? "1" : "0")."\" wmohca=\"".base64_encode(Server::$Operators[$sysId]->WelcomeManagerOfferHumanChatAfter)."\"" : "";

                    $this->XMLInternal .= "<v status=\"".base64_encode(Server::$Operators[$sysId]->Status)."\" id=\"".$b64sysId."\" userid=\"".base64_encode(Server::$Operators[$sysId]->UserId)."\"".$botatts." lang=\"".base64_encode(Server::$Operators[$sysId]->Language)."\" email=\"".base64_encode(Server::$Operators[$sysId]->Email)."\" websp=\"".base64_encode(Server::$Operators[$sysId]->Webspace)."\" name=\"".base64_encode(Server::$Operators[$sysId]->Fullname)."\" desc=\"".base64_encode(Server::$Operators[$sysId]->Description)."\" perms=\"".base64_encode(Server::$Operators[$sysId]->PermissionSet)."\" ip=\"".base64_encode(Server::$Operators[$sysId]->IP)."\" lipr=\"".base64_encode(Server::$Operators[$sysId]->LoginIPRange)."\" aac=\"".base64_encode(Server::$Operators[$sysId]->CanAutoAcceptChats)."\" ws_users=\"".base64_encode(base64_encode(serialize($WSUSERS)))."\" ws_config=\"".base64_encode(base64_encode(serialize($WSCONFIG)))."\" mc=\"".base64_encode(Server::$Operators[$sysId]->MaxChats)."\" ldap=\"".base64_encode(Server::$Operators[$sysId]->LDAP ? 1 : 0)."\" level=\"".base64_encode(Server::$Operators[$sysId]->Level)."\" ".$DEAC." ".$CPONL." ".$PASSWORD.">\r\n";

                    if(!empty(Server::$Operators[$sysId]->ProfilePicture))
                        $this->XMLInternal .= "<pp>".Server::$Operators[$sysId]->ProfilePicture."</pp>\r\n";

                    foreach(Server::$Operators[$sysId]->Groups as $groupid)
                        $this->XMLInternal .= "<gr>".base64_encode($groupid)."</gr>\r\n";

                    foreach(Server::$Operators[$sysId]->GroupsHidden as $groupid)
                        $this->XMLInternal .= "<gh>".base64_encode($groupid)."</gh>\r\n";

                    foreach(Server::$Operators[$sysId]->MobileExtends as $sid)
                        $this->XMLInternal .= "<me>".base64_encode($sid)."</me>\r\n";

                    foreach(Server::$Groups as $groupid => $group)
                        if($group->IsDynamic){
                            foreach($group->Members as $member => $persistent)
                                if($member == $sysId)
                                    $this->XMLInternal .= "<gr p=\"".base64_encode($persistent ? "1" : "0")."\">".base64_encode($groupid)."</gr>\r\n";
                        }


                    if(!empty(Server::$Operators[$sysId]->GroupsAway))
                        foreach(Server::$Operators[$sysId]->GroupsAway as $groupid)
                            $this->XMLInternal .= "<ga>".base64_encode($groupid)."</ga>\r\n";

                    foreach($object->PredefinedMessages as $premes)
                        $this->XMLInternal .= $premes->GetXML();

                    foreach($object->Signatures as $sig)
                        $this->XMLInternal .= $sig->GetXML();

                    if($object->AppClient)
                        $this->XMLInternal .= "<cm />\r\n";

                    if($object->ClientWeb)
                        $this->XMLInternal .= "<cw />\r\n";

                    $this->XMLInternal .= $arxml;
                    $this->XMLInternal .= "</v>\r\n";

                    if($sysId!=$this->Caller->SystemId && $object->Status != USER_STATUS_OFFLINE)
                        $this->XMLTyping .= "<v id=\"".$b64sysId."\" tp=\"".base64_encode(((Server::$Operators[$sysId]->Typing==CALLER_SYSTEM_ID)?1:0))."\" />\r\n";

                    if($object->Profile != null)
                        $this->XMLProfiles .= $object->Profile->GetXML($object->SystemId);
                }
            }
	}
}

class ExternalXMLBuilder
{
	public $CurrentStatics = array();
	public $ActiveBrowsers = array();
	public $AddedVisitors = array();
	public $SessionFileSizes = array();
	public $StaticReload = array();
	public $DiscardedObjects = array();
	public $IsDiscardedObject = false;
	public $ObjectCounter = 0;
	public $CurrentUser;
	public $CurrentFilesize;
	public $CurrentResponseType = DATA_RESPONSE_TYPE_KEEP_ALIVE;
	public $XMLVisitorOpen = false;
	public $XMLCurrentChat = "";
	public $XMLCurrentAliveBrowsers = "";
	public $XMLCurrentVisitor = "";
	public $XMLCurrentVisitorTag = "";
	public $XMLCurrent = "";
	public $XMLTyping = "";
	public $Caller;
	public $ExternUsers;
	public $GetAll;
	public $IsExternal;

	function __construct($_caller,$_visitors,$_getall,$_external)
	{
		$this->Caller = $_caller;
		$this->Visitors = $_visitors;
		$this->GetAll = $_getall;
		$this->IsExternal = $_external;
	}
	
	function SetDiscardedObject($_base)
	{
		$this->DiscardedObjects = $_base;
		if(!empty($this->SessionFileSizes))
			foreach($this->SessionFileSizes as $sfs_userid => $sfs_browsers)
            {
				if(!empty($sfs_browsers) && isset($this->Visitors[$sfs_userid]))
				{
					$filtered = ($this->Visitors[$sfs_userid]->IsInChatWith(Server::$Operators[CALLER_SYSTEM_ID])) ? false : Server::$Operators[CALLER_SYSTEM_ID]->IsVisitorFiltered($this->Visitors[$sfs_userid]);
   					foreach($sfs_browsers as $sfs_bid => $sfs_browser)
					{
						if($this->Visitors[$sfs_userid]->GetBrowser($sfs_bid)==null || $filtered)
						{
							if(!isset($this->DiscardedObjects[$sfs_userid]))
                            {
								$this->DiscardedObjects[$sfs_userid] = array($sfs_bid=>$sfs_bid);
                            }
							else if($this->DiscardedObjects[$sfs_userid] != null)
                            {
								$this->DiscardedObjects[$sfs_userid][$sfs_bid] = $sfs_bid;
                            }
						}
					}
				}
				else
				{
					$this->DiscardedObjects[$sfs_userid] = null;
				}
            }
			
		if(LOGIN && is_array($this->Visitors))
		{
			foreach($this->Visitors as $uid => $visitor)
				foreach($visitor->Browsers as $browser)
					if($browser->LastActive < (time()-Server::$Configuration->File["timeout_track"]))
					{
						if(!isset($this->DiscardedObjects[$uid]))
							$this->DiscardedObjects[$uid] = array($browser->BrowserId=>$browser->BrowserId);
						else if($this->DiscardedObjects[$uid] != null)
							$this->DiscardedObjects[$uid][$browser->BrowserId] = $browser->BrowserId;

					}
		}
	}
	
	function Generate()
	{
		global $BROWSER,$USER,$RVISITOR;
		if(is_array($this->Visitors))
			foreach($this->Visitors as $userid => $USER)
			{
				$icw = $USER->IsInChatWith(Server::$Operators[CALLER_SYSTEM_ID]);
                if(!$icw)
				{
					if(Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_MONITORING) == PERMISSION_RELATED)
						continue;

					if(Server::$Operators[CALLER_SYSTEM_ID]->IsVisitorFiltered($USER))
						continue;
				}

				if($icw || !(!empty(Server::$Configuration->File["gl_hvjd"]) && empty($USER->Javascript)))
				{
					$isactivebrowser = false;
					$this->XMLCurrentAliveBrowsers = 
					$this->XMLCurrentVisitor = "";
					$this->GetStaticInfo();

					$this->CurrentResponseType = ($USER->StaticInformation) ? DATA_RESPONSE_TYPE_STATIC : DATA_RESPONSE_TYPE_KEEP_ALIVE;
                    if(!empty($RVISITOR) && $USER->UserId == $RVISITOR->UserId)
                    {
                        $this->CurrentResponseType = ($this->CurrentResponseType == DATA_RESPONSE_TYPE_KEEP_ALIVE) ? DATA_RESPONSE_TYPE_STATIC : $this->CurrentResponseType;
                        unset($this->SessionFileSizes[$userid]);
                    }

					foreach($USER->Browsers as $BROWSER)
					{
						$this->ObjectCounter++;
						array_push($this->ActiveBrowsers,$BROWSER->BrowserId);
						$this->CurrentFilesize = $BROWSER->LastUpdate;
						$this->XMLCurrentChat = null;
						if(Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) != PERMISSION_FULL)
							foreach(Server::$Groups as $group)
								if(!empty($group->Members[CALLER_SYSTEM_ID]) && !empty($group->Members[$BROWSER->SystemId]))
									$iproom = true;

  						if($BROWSER->Type == BROWSER_TYPE_CHAT && (!empty($iproom) || (Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_FULL || (Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_RELATED && in_array($BROWSER->DesiredChatGroup,Server::$Operators[CALLER_SYSTEM_ID]->Groups)) || (Server::$Operators[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_NONE && !empty($BROWSER->Members[CALLER_SYSTEM_ID])))))
						{
							$isactivebrowser = true;
							$this->BuildChatXML();
							$this->SessionFileSizes[$userid][$BROWSER->BrowserId] = $this->CurrentFilesize;
						}
						else if(!isset($this->SessionFileSizes[$userid]) || !empty($BROWSER->ChatRequest) || $this->CurrentResponseType == DATA_RESPONSE_TYPE_STATIC || (isset($this->SessionFileSizes[$userid]) && (!isset($this->SessionFileSizes[$userid][$BROWSER->BrowserId]) || (isset($this->SessionFileSizes[$userid][$BROWSER->BrowserId]) && $this->SessionFileSizes[$userid][$BROWSER->BrowserId] != $this->CurrentFilesize))))
						{
                            $USER->LoadChatRequests(true);
                            $USER->LoadComments();
							$isactivebrowser = true;
							if($this->CurrentResponseType == DATA_RESPONSE_TYPE_KEEP_ALIVE)
								$this->CurrentResponseType = DATA_RESPONSE_TYPE_BASIC;
							$this->SessionFileSizes[$userid][$BROWSER->BrowserId] = $this->CurrentFilesize;
						}
						else
							$this->CurrentResponseType = DATA_RESPONSE_TYPE_KEEP_ALIVE;
						$this->AddBrowserXML();
					}

                    if($this->CurrentResponseType != DATA_RESPONSE_TYPE_KEEP_ALIVE)
                    {
                        if(!empty($USER->Comments))
                            foreach($USER->Comments as $cid => $carray)
                                $this->XMLCurrentVisitor .=  " <c id=\"".base64_encode($cid)."\" c=\"".base64_encode($carray["created"])."\" o=\"".base64_encode($carray["operator_id"])."\">".base64_encode($carray["comment"])."</c>\r\n";
                        if(!empty($RVISITOR) && $USER->UserId == $RVISITOR->UserId)
                            $this->XMLCurrentVisitor .= $RVISITOR->GetRecentXML(true);
                        else if(!empty($USER->RecentVisits))
                            $this->XMLCurrentVisitor .= $USER->GetRecentXML();
                    }

                    if(!empty($USER->ChatRequests))
                        foreach($USER->ChatRequests as $invite)
                            $this->XMLCurrentVisitor .= $invite->GetXML();

					$this->XMLCurrentVisitor .= $this->XMLCurrentAliveBrowsers;
					if($this->XMLVisitorOpen)
					{
						if($this->IsDiscardedObject || $isactivebrowser)
							$this->XMLCurrent .= $this->XMLCurrentVisitorTag . $this->XMLCurrentVisitor . "</v>\r\n";
						$this->XMLVisitorOpen = false;
					}
				}
			}
		$this->RemoveFileSizes($this->ActiveBrowsers);
	}
	
	function AddBrowserXML()
	{
		global $USER,$BROWSER;
		Server::InitDataBlock(array("INPUTS"));
		$visitorDetails = Array("userid" => " id=\"".base64_encode($USER->UserId)."\"","resolution" => null,"ip" => null,"lat" => null,"long" => null,"city" => null,"ctryi2" => null,"region" => null,"system" => null,"language" => null,"ka" => null,"requested" => null,"target" => null,"declined" => null,"accepted" => null,"cname" => null,"cemail" => null,"ccompany" => null,"waiting" => null,"timezoneoffset" => null,"visits" => null,"host"=>null,"grid"=>null,"isp"=>null,"cf0"=>null,"cf1"=>null,"cf2"=>null,"cf3"=>null,"cf4"=>null,"cf5"=>null,"cf6"=>null,"cf7"=>null,"cf8"=>null,"cf9"=>null,"sys"=>null,"bro"=>null,"js"=>null,"visitlast"=>null);
		if($this->CurrentResponseType != DATA_RESPONSE_TYPE_KEEP_ALIVE)
		{
			$visitorDetails["ka"] = " ka=\"".base64_encode(true)."\"";
        }
		if($this->CurrentResponseType == DATA_RESPONSE_TYPE_STATIC)
		{
            $USER->LoadRecentVisits();
			$visitorDetails["resolution"] = " res=\"".base64_encode($USER->Resolution)."\"";
			$visitorDetails["ip"] = " ip=\"".base64_encode($USER->IP)."\"";
			$visitorDetails["timezoneoffset"] = " tzo=\"".base64_encode($USER->GeoTimezoneOffset)."\"";
			$visitorDetails["lat"] = " lat=\"".base64_encode($USER->GeoLatitude)."\"";
			$visitorDetails["long"] = " long=\"".base64_encode($USER->GeoLongitude)."\"";
			$visitorDetails["city"] = " city=\"".base64_encode($USER->GeoCity)."\"";
			$visitorDetails["ctryi2"] = " ctryi2=\"".base64_encode($USER->GeoCountryISO2)."\"";
			$visitorDetails["region"] = " region=\"".base64_encode($USER->GeoRegion)."\"";
			$visitorDetails["js"] = " js=\"".base64_encode($USER->Javascript)."\"";
			$visitorDetails["language"] = " lang=\"".base64_encode($USER->Language)."\"";
			$visitorDetails["visits"] = " vts=\"".base64_encode($USER->Visits)."\"";
			$visitorDetails["host"] = " ho=\"".base64_encode($USER->Host)."\"";
			$visitorDetails["grid"] = " gr=\"".base64_encode($USER->GeoResultId)."\"";
			$visitorDetails["isp"] = " isp=\"".base64_encode($USER->GeoISP)."\"";
			$visitorDetails["sys"] = " sys=\"".base64_encode($USER->OperatingSystem)."\"";
			$visitorDetails["bro"] = " bro=\"".base64_encode($USER->Browser)."\"";
			$visitorDetails["visitlast"] = " vl=\"".base64_encode($USER->VisitLast)."\"";
		}
		
		if(!empty($BROWSER->DesiredChatPartner) && !empty(Server::$Operators[$BROWSER->DesiredChatPartner]) && !in_array($BROWSER->DesiredChatGroup,Server::$Operators[$BROWSER->DesiredChatPartner]->Groups))
			$BROWSER->DesiredChatPartner = "";

		$visitorDetails["waiting"] = ($BROWSER->Type == BROWSER_TYPE_CHAT && $BROWSER->Waiting && in_array($BROWSER->DesiredChatGroup,Server::$Operators[CALLER_SYSTEM_ID]->Groups) && (empty($BROWSER->DesiredChatPartner) || $BROWSER->DesiredChatPartner == CALLER_SYSTEM_ID)) ? " w=\"".base64_encode(1)."\"" : "";
		if(!in_array($USER->UserId,$this->AddedVisitors))
		{
			array_push($this->AddedVisitors, $USER->UserId);
			$this->XMLVisitorOpen = true;
			$this->XMLCurrentVisitorTag =  "<v".$visitorDetails["userid"].$visitorDetails["resolution"].$visitorDetails["ip"].$visitorDetails["lat"].$visitorDetails["long"].$visitorDetails["region"].$visitorDetails["city"].$visitorDetails["ctryi2"].$visitorDetails["visits"].$visitorDetails["system"].$visitorDetails["language"].$visitorDetails["cname"].$visitorDetails["cemail"].$visitorDetails["ccompany"].$visitorDetails["timezoneoffset"].$visitorDetails["host"].$visitorDetails["grid"].$visitorDetails["isp"].$visitorDetails["cf0"].$visitorDetails["cf1"].$visitorDetails["cf2"].$visitorDetails["cf3"].$visitorDetails["cf4"].$visitorDetails["cf5"].$visitorDetails["cf6"].$visitorDetails["cf7"].$visitorDetails["cf8"].$visitorDetails["cf9"].$visitorDetails["sys"].$visitorDetails["bro"].$visitorDetails["js"].$visitorDetails["visitlast"].">\r\n";
		}

		if($BROWSER->Overlay && empty($this->XMLCurrentChat))
			$BROWSER->History = null;

		if($this->CurrentResponseType != DATA_RESPONSE_TYPE_KEEP_ALIVE)
		{
            if(count($BROWSER->History)>0)
                $this->XMLCurrentVisitor .= $BROWSER->GetXML($this->XMLCurrentChat,$visitorDetails);

            if(!empty($USER->Comments))
            {
                foreach($USER->Comments as $cid => $carray)
                    $this->XMLCurrentVisitor .=  " <c id=\"".base64_encode($cid)."\" c=\"".base64_encode($carray["created"])."\" o=\"".base64_encode($carray["operator_id"])."\">".base64_encode($carray["comment"])."</c>\r\n";
                $USER->Comments = array();
            }
        }
	}
	
	function BuildChatXML()
	{
		global $USER,$BROWSER;
		Server::InitDataBlock(array("INPUTS"));

		if($this->CurrentResponseType == DATA_RESPONSE_TYPE_KEEP_ALIVE)
			$this->CurrentResponseType = DATA_RESPONSE_TYPE_BASIC;
		if($this->GetAll)
			$this->CurrentResponseType = DATA_RESPONSE_TYPE_STATIC;

		if(!$BROWSER->Closed && ($BROWSER->Status > CHAT_STATUS_OPEN || $BROWSER->Waiting))
		{
			if(!empty($BROWSER->DesiredChatGroup))
			{
				$pra = (!empty($BROWSER->Members[CALLER_SYSTEM_ID])) ? " pra=\"".base64_encode($BROWSER->PostsReceived(CALLER_SYSTEM_ID))."\"" : "";
                $dgc = (!empty($BROWSER->DynamicGroupChat)) ? " dgc=\"".base64_encode($BROWSER->DynamicGroupChat)."\"" : "";
				$cti = "";

				$USER->IsChat = true;
				$this->XMLCurrentChat = "<chat id=\"".base64_encode($BROWSER->ChatId)."\" hc=\"".base64_encode($BROWSER->HistoryCounts)."\" d=\"".base64_encode(!empty($BROWSER->Declined) ? 1 : 0)."\" p=\"".base64_encode($BROWSER->Priority)."\" f=\"".base64_encode($BROWSER->FirstActive)."\" q=\"".base64_encode(($BROWSER->Status > CHAT_STATUS_OPEN) ? "0" : "1")."\" cmb=\"".base64_encode($BROWSER->CallMeBack)."\" st=\"".base64_encode($BROWSER->Activated)."\" fn=\"" . base64_encode($BROWSER->GetInputData(111,true)) . "\" em=\"" . base64_encode($BROWSER->GetInputData(112,true)) . "\" eq=\"" . base64_encode($BROWSER->GetInputData(114,true)) . "\" gr=\"".base64_encode($BROWSER->DesiredChatGroup)."\" dcp=\"".base64_encode($BROWSER->DesiredChatPartner)."\" at=\"".base64_encode($BROWSER->AllocatedTime)."\" cp=\"" . base64_encode($BROWSER->GetInputData(116,true))."\" co=\"" . base64_encode($BROWSER->GetInputData(113,true)) . "\"".$pra.$cti.$dgc.">\r\n";
				foreach(Server::$Groups as $groupid => $group)
					if($group->IsDynamic)
						foreach($group->Members as $member => $persistent)
							if($member == $BROWSER->SystemId)
								$this->XMLCurrentChat .= "<dgr p=\"".base64_encode($persistent ? "1" : "0")."\">".base64_encode($groupid)."</dgr>\r\n";
				
				if(is_array($BROWSER->UserData->Customs))
					foreach($BROWSER->UserData->Customs as $index => $value)
						if(Server::$Inputs[$index]->Active && Server::$Inputs[$index]->Custom)
                        {
                            $value = (Server::$Inputs[$index]->Type == "Text") ? $BROWSER->GetInputData($index) : $value;
							$this->XMLCurrentChat .=  "   <cf index=\"" . base64_encode($index) . "\">".base64_encode(Server::$Inputs[$index]->GetClientValue($value))."</cf>\r\n";
                        }

				$this->XMLCurrentChat .=  "   <pn acc=\"".base64_encode(($BROWSER->Activated) ? "1" : "0")."\">\r\n";
				foreach($BROWSER->Members as $systemid => $member)
					$this->XMLCurrentChat .=  "<member id=\"" . base64_encode($systemid) . "\" st=\"".base64_encode($member->Status)."\" dec=\"".base64_encode(($member->Declined)?1:0)."\" />\r\n";
				$this->XMLCurrentChat .=  "   </pn>\r\n";
				
				if(!empty($BROWSER->ChatVoucherId))
				{
					$chatticket = VisitorChat::GetMatchingVoucher($BROWSER->DesiredChatGroup,$BROWSER->ChatVoucherId);
					if(!empty($chatticket))
						$this->XMLCurrentChat .= "<cticket>" . $chatticket->GetXML(true) . "</cticket>\r\n";
				}
				
				$v_tp = 0;
				if(!empty($BROWSER->Members[CALLER_SYSTEM_ID]))
				{
					if($BROWSER->Activated == 0)
					{
						$BROWSER->LoadForward(false,true);
						if(!empty($BROWSER->Forward) && ($BROWSER->Forward->TargetSessId == CALLER_SYSTEM_ID || empty($BROWSER->Forward->TargetSessId)))
						{
							//$BROWSER->RepostChatHistory(3,$BROWSER->ChatId,CALLER_SYSTEM_ID,0,0,"","","",false,false);
							$BROWSER->Forward->Destroy();
						}
						else
						{
							//$BROWSER->RepostChatHistory(3,$BROWSER->ChatId,CALLER_SYSTEM_ID,0,0,"","","",false,false);
						}
					}
					$v_tp = ($BROWSER->Typing) ? 1 : 0;
				}
				if(isset($this->Caller->ExternalChats[$BROWSER->SystemId]) && !empty($this->Caller->ExternalChats[$BROWSER->SystemId]->FileUploadRequest))
				{
					foreach($this->Caller->ExternalChats[$BROWSER->SystemId]->FileUploadRequest as $request)
					{
						if($request->Error && $request->Permission != PERMISSION_NONE)
						{
							if(!$request->Closed)
								$request->Close();
							$this->XMLCurrentChat .=  "   <fupr id=\"".base64_encode($request->Id)."\" cr=\"".base64_encode($request->Created)."\" fm=\"".base64_encode($request->FileMask)."\" fn=\"".base64_encode($request->FileName)."\" fid=\"".base64_encode($request->FileId)."\" cid=\"".base64_encode($request->ChatId)."\" error=\"".base64_encode(true)."\" />\r\n";
						}
						else if($request->Download)
							$this->XMLCurrentChat .=  "   <fupr pm=\"".base64_encode($request->Permission)."\" id=\"".base64_encode($request->Id)."\" cr=\"".base64_encode($request->Created)."\" fm=\"".base64_encode($request->FileMask)."\" fn=\"".base64_encode($request->FileName)."\" cid=\"".base64_encode($request->ChatId)."\" fid=\"".base64_encode($request->FileId)."\" download=\"".base64_encode(true)."\" size=\"".base64_encode(@filesize($request->GetFile()))."\" />\r\n";
						else if($request->Permission == PERMISSION_VOID)
							$this->XMLCurrentChat .=  "   <fupr id=\"".base64_encode($request->Id)."\" cr=\"".base64_encode($request->Created)."\" fm=\"".base64_encode($request->FileMask)."\" fn=\"".base64_encode($request->FileName)."\" fid=\"".base64_encode($request->FileId)."\" cid=\"".base64_encode($request->ChatId)."\" />\r\n";
						else if($request->Permission == PERMISSION_NONE)
							$this->XMLCurrentChat .=  "   <fupr pm=\"".base64_encode($request->Permission)."\" id=\"".base64_encode($request->Id)."\" cr=\"".base64_encode($request->Created)."\" fm=\"".base64_encode($request->FileMask)."\" fn=\"".base64_encode($request->FileName)."\" cid=\"".base64_encode($request->ChatId)."\" fid=\"".base64_encode($request->FileId)."\" />\r\n";
						else if($request->Permission == PERMISSION_CHAT_ARCHIVE)
							$this->XMLCurrentChat .=  "   <fupr pm=\"".base64_encode($request->Permission)."\" id=\"".base64_encode($request->Id)."\" cr=\"".base64_encode($request->Created)."\" fm=\"".base64_encode($request->FileMask)."\" fn=\"".base64_encode($request->FileName)."\" cid=\"".base64_encode($request->ChatId)."\" fid=\"".base64_encode($request->FileId)."\" />\r\n";
					}
				}
				$this->XMLCurrentChat .=  "  </chat>\r\n";
				$this->XMLTyping .= "<v id=\"".base64_encode($BROWSER->UserId . "~" . $BROWSER->BrowserId)."\" tp=\"".base64_encode($v_tp)."\" />\r\n";
			}
			else
				$this->XMLCurrentChat = "  <chat />\r\n";
		}
        else
        {


        }
	}
	
	function GetStaticInfo($found = false)
	{
		global $USER;
		foreach($USER->Browsers as $BROWSER)
			if(isset($this->SessionFileSizes[$USER->UserId][$BROWSER->BrowserId]))
			{
				$found = true;
				break;
			}
		
		if($this->GetAll || isset($this->StaticReload[$USER->UserId]) || !$found || ($this->Caller->LastActive <= $USER->LastActive && !in_array($USER->UserId,$this->CurrentStatics)))
		{
			if(isset($this->StaticReload[$USER->UserId]))
				unset($this->StaticReload[$USER->UserId]);
			
			array_push($this->CurrentStatics,$USER->UserId);
			$USER->StaticInformation = true;
		}
		else
			$USER->StaticInformation = false;
	}

	function RemoveFileSizes($_browsers)
	{
		if(!empty($this->SessionFileSizes))
			foreach($this->SessionFileSizes as $userid => $browsers)
				if(is_array($browsers) && count($browsers) > 0)
				{
					foreach($browsers as $BROWSER => $size)
						if(!in_array($BROWSER,$_browsers))
							unset($this->SessionFileSizes[$userid][$BROWSER]);
				}
				else
					unset($this->SessionFileSizes[$userid]);
	}
}
?>
