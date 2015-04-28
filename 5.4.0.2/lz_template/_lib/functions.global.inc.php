<?php

/****************************************************************************************
* LiveZilla functions.global.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

function initDataProvider($connection=false)
{
    global $CONFIG,$DB_CONNECTOR,$CM;
    if(!empty($CONFIG["gl_datprov"]))
    {
        if(!defined("DB_PREFIX"))
            define("DB_PREFIX",$CONFIG["gl_db_prefix"]);

        $DB_CONNECTOR = new DBManager($CONFIG["gl_db_user"], $CONFIG["gl_db_pass"], $CONFIG["gl_db_host"],$CONFIG["gl_db_name"],$CONFIG["gl_db_prefix"]);

        if(!empty($CONFIG["gl_db_ext"]))
            DBManager::$Extension = $CONFIG["gl_db_ext"];

        if($DB_CONNECTOR->InitConnection())
            $connection = true;
    }

    if(!defined("DB_CONNECTION"))
        define("DB_CONNECTION",$connection);

    if($connection)
    {
        loadDatabaseConfig(false,$CONFIG["gl_db_prefix"]);
        if(!isset($CONFIG["gl_caen"]))
            $CONFIG["gl_caen"] = 1;

        if(!isServerSetup() && !is("IN_API") && CacheManager::CachingAvailable($CONFIG["gl_caen"]) !== false)
        {
            $gttl = min($CONFIG["poll_frequency_clients"],$CONFIG["poll_frequency_tracking"])*2;
            $sttl = (!empty($CONFIG["gl_st_upin"])) ? $CONFIG["gl_st_upin"] : 3600;
            $CM = new CacheManager(md5(SUBSITEHOST.$CONFIG["gl_lzid"].$CONFIG["gl_db_prefix"].$CONFIG["gl_db_pass"].$CONFIG["gl_db_user"].$CONFIG["gl_db_name"]),$gttl,array(111=>array("VISITOR",512),112=>array("EVENTS",128),113=>array("INTERNAL",256,$gttl*2,true),114=>array("GROUPS",256,$gttl*2,true),115=>array("FILTERS",128,$gttl*2,true),116=>array("DBCNF",128,$gttl*2),117=>array("STATS",1,$sttl,true),118=>array("DUT",1)));
            $CM->Read();
        }
    }
    return $connection;
}

function unloadDataProvider()
{
    global $CM;
    if(!empty($CM) && !is("SERVERSETUP"))
        $CM->Close();

    DBManager::Close();
}

function initStatisticProvider()
{
    global $STATS;
    require(LIVEZILLA_PATH . "_lib/objects.stats.inc.php");
    $STATS = new StatisticProvider();
}

function queryDB($_log,$_sql,$_serversetup=false,&$_errorCode=-1)
{
    global $DB_CONNECTOR;
    if(!DB_CONNECTION && !(isServerSetup() && !empty(DBManager::$Provider)))
    {
        if(DEBUG_MODE)logit("Query without connection: " . $_sql,FILE_SQL_ERROR_LOG);
        return false;
    }
    return $DB_CONNECTOR->Query($_log,$_sql,$_errorCode);
}

function loadConfig($_default=true)
{
	global $CONFIG,$_CONFIG;
    if($_default)
    {
        if(file_exists(FILE_DEFAULT_CONFIG))
            require(FILE_DEFAULT_CONFIG);

        $mtimes = array("default"=>(file_exists(FILE_DEFAULT_CONFIG) ? @filemtime(FILE_DEFAULT_CONFIG) : 0),"web"=>(file_exists(FILE_CONFIG) ? @filemtime(FILE_CONFIG) : 0));
        if(file_exists(FILE_CONFIG) && $mtimes["default"]<=$mtimes["web"])
            require(FILE_CONFIG);

        $ssloaded=false;
        if(base64_decode($_CONFIG["gl_lzst"])==1)
        {
            $subHostParam = getSubHostParam();
            if(requireDynamic(str_replace("config.inc","config.".strtolower($_SERVER["HTTP_HOST"]).".inc",FILE_CONFIG), LIVEZILLA_PATH . "_config/"))
                $ssloaded = true;
            else if(!empty($subHostParam) && requireDynamic(str_replace("config.inc","config.".$subHostParam.".inc",FILE_CONFIG), LIVEZILLA_PATH . "_config/"))
                $ssloaded = true;
        }
    }

	if(!empty($_CONFIG) && is_array($_CONFIG))
		foreach($_CONFIG as $key => $value)
			if(is_array($value) && is_int($key))
			{
				foreach($value as $skey => $svalue)
					if(is_array($svalue))
						foreach($svalue as $sskey => $ssvalue)
							$CONFIG[$skey][$sskey]=base64_decode($ssvalue);
					else
						$CONFIG[$skey] = base64_decode($svalue);
			}
			else if(is_array($value))
			{
				foreach($value as $skey => $svalue)
					$CONFIG[$key][$skey]=base64_decode($svalue);
			}
			else
				$CONFIG[$key]=base64_decode($value);

	if(empty($CONFIG["gl_host"]))
		$CONFIG["gl_host"] = $_SERVER["HTTP_HOST"];

    if($_default)
    {
        define("ISSUBSITE",empty($CONFIG["gl_root"]) || !empty($_POST["p_host"]));
        define("SUBSITEHOST",((ISSUBSITE) ? ((!empty($_POST["p_host"]) && strpos($_POST["p_host"],"..")===false) ? $_POST["p_host"] : $CONFIG["gl_host"]) : ""));
        define("SUBSITECONFLOADED",$ssloaded);
    }
    configureTimezone();
}

function getSubHostParam($_allowPost=true)
{
    $value = "";
    if(isset($_GET["ws"]))
        $value = strtolower(base64UrlDecode($_GET["ws"]));
    else if($_allowPost && isset($_POST["p_host"]))
        $value = strtolower($_POST["p_host"]);
    if(strpos($value,"..")===false)
        return $value;
    return "";
}

function configureTimezone()
{
    if(function_exists("date_default_timezone_set"))
    {
        if(getSystemTimezone() !== false)
            @date_default_timezone_set(getSystemTimezone());
        else
            @date_default_timezone_set('Europe/Dublin');
    }
}

function loadDatabaseConfig($_extended,$_prefix)
{
	global $CONFIG,$_CONFIG,$CM;
    if(!$_extended)
    {
        $result = queryDB(true,"SELECT * FROM `".$_prefix.DATABASE_CONFIG."` ORDER BY `key` ASC;");
        while($row = @DBManager::FetchArray($result))
        {
            if(strpos($row["key"],"gl_input_list_")===0)
            {
                $CONFIG["gl_input_list"][str_replace("gl_input_list_","",$row["key"])] = $row["value"];
                $_CONFIG[0]["gl_input_list"][str_replace("gl_input_list_","",$row["key"])] = base64_encode($row["value"]);
            }
            else
            {
                $CONFIG[$row["key"]] = $row["value"];
                $_CONFIG[0][$row["key"]] = base64_encode($row["value"]);
            }
        }
        if(!empty($CONFIG["gl_stmo"]) && !is("SERVERSETUP"))
        {
            $CONFIG["poll_frequency_tracking"] = 86400;
            $CONFIG["timeout_track"] = 0;
        }
        if(!defined("STATS_ACTIVE"))
            define("STATS_ACTIVE", !empty($CONFIG["gl_stp"]));

        configureTimezone();
    }
    else
    {
        if(!empty($CM) && $CM->GetData(116,$CONFIG,false))
            return;

        if(!empty($CONFIG["gl_ccac"]))
        {
            $CONFIG["db"]["cct"] = array();
            $result = queryDB(true,"SELECT *,`t1`.`id` AS `typeid` FROM `".$_prefix.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t1` INNER JOIN `".$_prefix.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."` AS `t2` ON `t1`.`id`=`t2`.`tid` ORDER BY `t1`.`price`;");
            while($row = @DBManager::FetchArray($result))
            {
                if(!isset($CONFIG["db"]["cct"][$row["typeid"]]))
                    $CONFIG["db"]["cct"][$row["typeid"]] = new CommercialChatBillingType($row);
                $ccli = new CommercialChatVoucherLocalization($row);
                $CONFIG["db"]["cct"][$row["typeid"]]->Localizations[$row["language"]]=$ccli;
            }
            $result = queryDB(true,"SELECT * FROM `".$_prefix.DATABASE_COMMERCIAL_CHAT_PROVIDERS."`;");
            while($row = @DBManager::FetchArray($result))
                if($row["name"] == "Custom")
                    $CONFIG["db"]["ccpp"]["Custom"] = new CommercialChatPaymentProvider($row);
                else
                    $CONFIG["db"]["ccpp"][$row["name"]] = new CommercialChatPaymentProvider($row);
        }

        $CONFIG["db"]["gl_email"] = array();
        $result = queryDB(true,"SELECT * FROM `".$_prefix.DATABASE_MAILBOXES."`;");
        while($row = @DBManager::FetchArray($result))
            $CONFIG["db"]["gl_email"][$row["id"]] = new Mailbox($row);

        $CONFIG["db"]["gl_sm"] = array();
        $result = queryDB(false,"SELECT * FROM `".$_prefix.DATABASE_SOCIAL_MEDIA_CHANNELS."` ORDER BY `last_connect` ASC;");
        if($result)
            while($row = @DBManager::FetchArray($result))
            {
                if($row["type"] == "6")
                    $CONFIG["db"]["gl_sm"][$row["id"]] = new FacebookChannel($row["group_id"]);
                else if($row["type"] == "7")
                    $CONFIG["db"]["gl_sm"][$row["id"]] = new TwitterChannel($row["group_id"]);
                $CONFIG["db"]["gl_sm"][$row["id"]]->SetValues($row);
            }

        if(!empty($CM))
            $CM->SetData(116,$CONFIG);
    }
}

function loadLanguages()
{
    global $LANGUAGES; //+
    require(LIVEZILLA_PATH . "_lib/objects.languages.inc.php");
}

function loadCountries()
{
    global $COUNTRIES,$COUNTRY_ALIASES; //+
    require(LIVEZILLA_PATH . "_lib/objects.countries.inc.php");
}

function loadFilters()
{
    global $FILTERS,$CM;
    if(!empty($CM) && $CM->GetData(115,$FILTERS))
        return;

    $FILTERS = new FilterList();
    if(is("DB_CONNECTION"))
        $FILTERS->Populate();

    if(!empty($CM))
        $CM->SetData(115,$FILTERS,true);
}

function loadEvents()
{
    global $EVENTS,$CM;
    if(!empty($CM) && $CM->GetData(112,$EVENTS))
    {
        return;
    }
    $EVENTS = new EventList();
    $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENTS."` WHERE `priority`>=0 ORDER BY `priority` DESC;");
    while($row = @DBManager::FetchArray($result))
    {
        $Event = new Event($row);
        $result_urls = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_URLS."` WHERE `eid`='".DBManager::RealEscape($Event->Id)."';");
        while($row_url = @DBManager::FetchArray($result_urls))
        {
            $EventURL = new EventURL($row_url);
            $Event->URLs[$EventURL->Id] = $EventURL;
        }

        $result_funnel_urls = queryDB(true,"SELECT `ind`,`uid` FROM `".DB_PREFIX.DATABASE_EVENT_FUNNELS."` WHERE `eid`='".DBManager::RealEscape($Event->Id)."';");
        while($funnel_url = @DBManager::FetchArray($result_funnel_urls))
        {
            $Event->FunnelUrls[$funnel_url["ind"]] = $funnel_url["uid"];
        }
        $result_actions = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTIONS."` WHERE `eid`='".DBManager::RealEscape($Event->Id)."';");
        while($row_action = @DBManager::FetchArray($result_actions))
        {
            $EventAction = new EventAction($row_action);
            $Event->Actions[$EventAction->Id] = $EventAction;

            if($EventAction->Type==2)
            {
                $result_action_invitations = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_OVERLAYS."` WHERE `action_id`='".DBManager::RealEscape($EventAction->Id)."';");
                $row_invitation = @DBManager::FetchArray($result_action_invitations);
                $EventAction->Invitation = new Invitation($row_invitation);
                $result_senders = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_SENDERS."` WHERE `pid`='".DBManager::RealEscape($EventAction->Invitation->Id)."' ORDER BY `priority` DESC;");
                while($row_sender = @DBManager::FetchArray($result_senders))
                {
                    $InvitationSender = new EventActionSender($row_sender);
                    $EventAction->Invitation->Senders[$InvitationSender->Id] = $InvitationSender;
                }
            }
            else if($EventAction->Type==5)
            {
                $result_action_overlaybox = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_OVERLAYS."` WHERE `action_id`='".DBManager::RealEscape($EventAction->Id)."';");
                $row_overlaybox = @DBManager::FetchArray($result_action_overlaybox);
                $EventAction->OverlayBox = new OverlayElement($row_overlaybox);
            }
            else if($EventAction->Type==4)
            {
                $result_action_website_pushs = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_WEBSITE_PUSHS."` WHERE `action_id`='".DBManager::RealEscape($EventAction->Id)."';");
                $row_website_push = @DBManager::FetchArray($result_action_website_pushs);
                $EventAction->WebsitePush = new WebsitePush($row_website_push,true);

                $result_senders = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_SENDERS."` WHERE `pid`='".DBManager::RealEscape($EventAction->WebsitePush->Id)."' ORDER BY `priority` DESC;");
                while($row_sender = @DBManager::FetchArray($result_senders))
                {
                    $WebsitePushSender = new EventActionSender($row_sender);
                    $EventAction->WebsitePush->Senders[$WebsitePushSender->Id] = $WebsitePushSender;
                }
            }
            else if($EventAction->Type<2)
            {
                $result_receivers = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_RECEIVERS."` WHERE `action_id`='".DBManager::RealEscape($EventAction->Id)."';");
                while($row_receiver = @DBManager::FetchArray($result_receivers))
                    $EventAction->Receivers[$row_receiver["receiver_id"]] = new EventActionReceiver($row_receiver);
            }
        }
        if(STATS_ACTIVE)
        {
            $result_goals = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_GOALS."` WHERE `event_id`='".DBManager::RealEscape($Event->Id)."';");
            while($row_goals = @DBManager::FetchArray($result_goals))
                $Event->Goals[$row_goals["goal_id"]] = new EventAction($row_goals["goal_id"],9);
        }
        $EVENTS->Events[$Event->Id] = $Event;
    }
    if(!empty($CM))
        $CM->SetData(112,$EVENTS,true);
}

function loadInternals()
{
    global $CONFIG,$INTERNAL,$GROUPS,$CM;
    if(DB_CONNECTION)
    {
        if(!empty($CM) && $CM->GetData(113,$INTERNAL) && $CM->GetData(114,$GROUPS))
            return;

        $result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_OPERATORS."` ORDER BY `bot` ASC, `fullname` ASC;");
        if(!$result)
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_OPERATORS."`;");
        while($row = @DBManager::FetchArray($result))
        {
            if(!empty($row["system_id"]))
            {
                $INTERNAL[$row["system_id"]] = new Operator($row["system_id"],$row["id"]);
                $INTERNAL[$row["system_id"]]->SetValues($row);
            }
        }

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GROUPS."`;");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(empty($GROUPS[$row["id"]]))
                    $GROUPS[$row["id"]] = new UserGroup($row["id"],$row);

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PREDEFINED."`;");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(!empty($INTERNAL[$row["internal_id"]]))
                    $INTERNAL[$row["internal_id"]]->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row);
                else if(!empty($GROUPS[$row["group_id"]]))
                    $GROUPS[$row["group_id"]]->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row);

        if(is_array($GROUPS))
            foreach($GROUPS as $group)
                $group->SetDefaultPredefinedMessage();

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_SIGNATURES."`;");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(!empty($INTERNAL[$row["operator_id"]]))
                    $INTERNAL[$row["operator_id"]]->Signatures[strtolower($row["id"])] = new Signature($row);
                else if(!empty($GROUPS[$row["group_id"]]))
                    $GROUPS[$row["group_id"]]->Signatures[strtolower($row["id"])] = new Signature($row);

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_AUTO_REPLIES."` ORDER BY `search_type` DESC, `tags` ASC, `language` DESC;");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(!empty($INTERNAL[$row["owner_id"]]))
                    $INTERNAL[$row["owner_id"]]->AutoReplies[] = new ChatAutoReply($row);
                else if(!empty($GROUPS[$row["owner_id"]]))
                    $GROUPS[$row["owner_id"]]->AutoReplies[] = new ChatAutoReply($row);

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PROFILE_PICTURES."`");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(!empty($INTERNAL[$row["internal_id"]]))
                    if(empty($row["webcam"]))
                    {
                        $INTERNAL[$row["internal_id"]]->ProfilePicture = $row["data"];
                        $INTERNAL[$row["internal_id"]]->ProfilePictureTime = $row["time"];
                    }
                    else
                    {
                        $INTERNAL[$row["internal_id"]]->WebcamPicture = $row["data"];
                        $INTERNAL[$row["internal_id"]]->WebcamPictureTime = $row["time"];
                    }

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PROFILES."`;");
        if($result)
            while($row = DBManager::FetchArray($result))
                if(!empty($INTERNAL[$row["id"]]))
                    $INTERNAL[$row["id"]]->Profile = new Profile($row);

        if(!is("LOGIN") && !empty($CM))
        {
            $CM->SetData(113,$INTERNAL);
            $CM->SetData(114,$GROUPS);
        }
    }
    if(empty($INTERNAL))
    {
        $INTERNAL = array();
        if(!empty($CONFIG["gl_insu"]) && !empty($CONFIG["gl_insp"]))
        {
            $INTERNAL[$CONFIG["gl_insu"]] = new Operator($CONFIG["gl_insu"],$CONFIG["gl_insu"]);
            $INTERNAL[$CONFIG["gl_insu"]]->Level = USER_LEVEL_ADMIN;
            $INTERNAL[$CONFIG["gl_insu"]]->Password = $CONFIG["gl_insp"];
        }
    }
    if(!empty($_POST["p_groups_0_id"]) && empty($GROUPS) && is("SERVERSETUP") && !empty($INTERNAL))
        $GROUPS["DEFAULT"] = new UserGroup("DEFAULT");
}

function isServerSetup()
{
    if(defined("SERVERSETUP") && SERVERSETUP)
        return true;
    return isset($_POST[POST_INTERN_ADMINISTRATE]) || (isset($_POST[POST_INTERN_SERVER_ACTION]) && ($_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_GET_BANNER_LIST || $_POST[POST_INTERN_SERVER_ACTION] == INTERN_ACTION_DOWNLOAD_TRANSLATION));
}

function handleError($_errno, $_errstr, $_errfile, $_errline)
{
	if(error_reporting()!=0)
    {
        $estr = date("d.m.y H:i:s") . " " . $_SERVER["REMOTE_ADDR"] . " ERR# " . $_errno . " " . $_errstr . " ".$_errfile . " IN LINE ". $_errline."\r\n";

        if(SECURE_LOG)
        {
            $estr .= "\r\n\r\n" . @serialize(@debug_backtrace()) . "\r\n\r\n";
            $estr .= "\r\n\r\n" . serialize($_POST) . "\r\n\r\n";
        }
        errorLog($estr);
    }
}

function ignoreError($_errno, $_errstr, $_errfile, $_errline)
{
}

function getAvailability($_serverOnly=false)
{
	global $CONFIG;
	if(!$_serverOnly && !empty($CONFIG["gl_deac"]))
		return false;
	return (@file_exists(FILE_SERVER_DISABLED)) ? false : true;
}

function getIdle()
{
	if(file_exists(FILE_SERVER_IDLE) && @filemtime(FILE_SERVER_IDLE) < (time()-15))
		@unlink(FILE_SERVER_IDLE);
	return file_exists(FILE_SERVER_IDLE);
}

function getIP($_dontmask=false,$_forcemask=false,$ip="")
{
	global $CONFIG;
	$params = array($CONFIG["gl_sipp"]);
	foreach($params as $param)
		if(!empty($_SERVER[$param]))
		{
			$ipf = $_SERVER[$param];
			if(strpos($ipf,",") !== false)
			{
				$parts = explode(",",$ipf);
				foreach($parts as $part)
					if(substr_count($part,".") == 3 || substr_count($part,":") >= 3)
						$ip = trim($part);
			}
			else if(substr_count($ipf,".") == 3 || substr_count($ipf,":") >= 3)
				$ip = trim($ipf);
		}
	if(empty($ip))
		$ip = $_SERVER["REMOTE_ADDR"];
	if((empty($CONFIG["gl_maskip"]) || $_dontmask) && !$_forcemask)
		return $ip;
	else if(substr_count($ip,".")>2 || substr_count($ip,":")>3)
	{
        $hash = false;
        $masktype = !empty($CONFIG["gl_miat"]) ? $CONFIG["gl_miat"] : 0;
        if($masktype==3)
            $hash = $masktype = 1;
 		$split = (substr_count($ip,".") > 0) ? "." : ":";
		$parts = explode($split,$ip);
		$val="";
		for($i=0;$i<count($parts)-($masktype+1);$i++)
			$val .= $parts[$i].$split;
        for($i=0;$i<=$masktype;$i++)
            $val .= $split . "xxx";
        $val = str_replace("..",".",$val);
        if($hash)
            $val = strtoupper(substr(md5($val),10,10));
		return $val;
	}
    return $ip;
}

function getHost()
{
	global $CONFIG;
	$ip = getIP(true);
	$host = @utf8_encode(@gethostbyaddr($ip));
	if($CONFIG["gl_maskip"])
        $host = str_replace($ip,getIP(),$host);
	return $host;
}

function getTimeDifference($_time)
{
	$_time = (time() - $_time);
	if(abs($_time) <= 5)
		$_time = 0;
	return $_time;
}

function parseBool($_value,$_toString=true)
{
	if($_toString)
		return ($_value) ? "true" : "false";
	else
		return ($_value) ? "1" : "0";
}

function namebase($_path)
{
	$file = basename($_path);
	if(strpos($file,'\\') !== false)
	{
		$tmp = preg_split("[\\\]",$file);
		$file = $tmp[count($tmp) - 1];
		return $file;
	}
	else
		return $file;
}

function getScheme()
{
	$scheme = SCHEME_HTTP;
    if(!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"]!="off")
		$scheme = SCHEME_HTTP_SECURE;
	else if(!empty($_SERVER["HTTP_X_FORWARDED_PROTO"]) && strtolower($_SERVER["HTTP_X_FORWARDED_PROTO"]) == "https")
		$scheme = SCHEME_HTTP_SECURE;
	else if(!empty($_SERVER["SERVER_PORT"]) && $_SERVER["SERVER_PORT"] == 443)
		$scheme = SCHEME_HTTP_SECURE;
	return $scheme;
}

function applyReplacements($_toReplace,$_language=true,$_config=true,$_selectLanguage=true,$_stats=false)
{
	global $CONFIG,$LZLANG;

    if($_selectLanguage)
        languageSelect();

	$to_replace = array();
	if($_language)
		$to_replace["lang"] = $LZLANG;
	if($_config)
		$to_replace["config"] = $CONFIG;
	
	foreach($to_replace as $type => $values)
        if(is_array($values))
            foreach($values as $short => $value)
                if(!is_array($value))
                {
                    if($type == "lang" && !$_stats && strpos($short,"stats_")===0)
                    {

                        continue;
                    }
                    $_toReplace = str_replace("<!--".$type."_".$short."-->",$value,$_toReplace);
                }
                else
                    foreach($value as $subKey => $subValue)
                    {
                        if(!is_array($subValue))
                            $_toReplace = str_replace("<!--".$type."_".$subKey."-->",$subValue,$_toReplace);
                    }

	if($_language)
		for($i=1;$i<=10;$i++)
			$_toReplace = str_replace("<!--lang_client_custom_".str_pad($i, 2, "0", STR_PAD_LEFT)."-->","",$_toReplace);
					
	return str_replace("<!--file_chat-->",FILE_CHAT,$_toReplace);
}

function getGeoURL()
{
	global $CONFIG;
	if(!empty($CONFIG["gl_pr_ngl"]))
		return CONFIG_LIVEZILLA_GEO_PREMIUM;
	else
		return "";
}

function geoReplacements($_toReplace, $jsa = "")
{
	global $CONFIG;
	$_toReplace = str_replace("<!--geo_url-->",getGeoURL() . "?aid=" . $CONFIG["wcl_geo_tracking"]."&sid=".base64_encode($CONFIG["gl_lzid"])."&dbp=".$CONFIG["gl_gtdb"],$_toReplace);
	if(!isnull(trim($CONFIG["gl_pr_ngl"])))
	{
		$jsc = "var chars = new Array(";
		$jso = "var order = new Array(";
		$chars = str_split(sha1($CONFIG["gl_pr_ngl"] . date("d"),false));
		$keys = array_keys($chars);
		shuffle($keys);
		foreach($keys as $key)
		{
			$jsc .= "'" . $chars[$key] . "',";
			$jso .= $key . ",";
		}
		$jsa .= $jsc . "0);\r\n";$jsa .= $jso . "0);\r\n";
		$jsa .= "while(lz_oak.length < (chars.length-1))for(var f in order)if(order[f] == lz_oak.length)lz_oak += chars[f];\r\n";
	}
	$_toReplace = str_replace("<!--calcoak-->",$jsa,$_toReplace);
	$_toReplace = str_replace("<!--mip-->",getIP(false,true),$_toReplace);
	return $_toReplace;
}

function md5file($_file)
{
	$md5file = @md5_file($_file);
	if(gettype($md5file) != 'boolean' && $md5file != false)
		return $md5file;
}

function getAlias($_param)
{
    if($_param == "rqst")
        return isset($_GET["rqst"]) ? $_GET["rqst"] : (isset($_GET["request"]) ? $_GET["request"] : "");

    return "";
}

function getFile($_file,$data="")
{
	if(@file_exists($_file) && strpos($_file,"..") === false)
	{
		$handle = @fopen($_file,"r");
		if($handle)
		{
		   	$data = @fread($handle,@filesize($_file));
			@fclose ($handle);
		}
		return $data;
	}
}

function getParam($_getParam)
{
	if(isset($_GET[$_getParam]))
		return base64UrlEncode(base64UrlDecode($_GET[$_getParam]));
	else
		return null;
}

function getOParam($_key,$_default,&$_changed=false,$_filter=null,$_filteropt=array(),$_maxlen=0,$_dbase64=true,$_dbase64Url=true,$_ebase64=false,$_ebase64Url=false)
{
    if(isset($_REQUEST[$_key]))
    {
        if($_dbase64Url)
            $value = base64UrlDecode($_REQUEST[$_key]);
        else if($_dbase64)
            $value = base64_decode($_REQUEST[$_key]);
        else
            $value = $_REQUEST[$_key];
        if($value != $_default)
            $_changed = true;
    }
    else if(isset($_SERVER[$_key]))
    {
        if($_SERVER[$_key] != $_default)
            $_changed = true;
        $value = $_SERVER[$_key];
    }
    else
        return $_default;
    $value = filterParam($value,$_default,$_filter,$_filteropt,$_maxlen);
    if($_ebase64Url)
        return base64UrlEncode($value);
    if($_ebase64)
        return base64_encode($value);
    return $value;
}

function getParams($_getParams="",$_allowed=null)
{
	foreach($_GET as $key => $value)
		if($key != "template" && !($_allowed != null && !isset($_allowed[$key])))
		{
            if(isBase64Encoded($value,true))
            {
			    $value = !($_allowed != null && !$_allowed[$key]) ? base64UrlEncode(base64UrlDecode($value)) : base64UrlEncode($value);
			    $_getParams.=((strlen($_getParams) == 0) ? $_getParams : "&") . urlencode($key) ."=" . $value;
            }
		}
	return $_getParams;
}

function filterParam($_value,$_default,$_filter,$_filteropt,$_maxlen=0)
{
    if($_maxlen>0 && strlen($_value)>$_maxlen)
        $_value = substr($_value,0,$_maxlen);
    if($_filter == FILTER_HTML_ENTITIES)
    if($_filter == FILTER_HTML_ENTITIES)
        return htmlentities($_value,ENT_QUOTES,"UTF-8");
    if($_filter == null || !function_exists("filter_var"))
        return $_value;
    else if(!empty($_filter))
    {
        $var = ($_filteropt != null) ? filter_var($_value,$_filter,$_filteropt) : filter_var($_value,$_filter);
        if($var!==false)
            return $var;
    }
    return $_default;
}

function getCustomArray($_getCustomParams=null)
{
	global $INPUTS;
	initData(array("INPUTS"));
	
	if(empty($_getCustomParams))
		$_getCustomParams = array('','','','','','','','','','');

	for($i=0;$i<=9;$i++)
	{
		if(isset($_GET["cf" . $i]))
			$_getCustomParams[$i] = base64UrlDecode($_GET["cf" . $i]);
		else if(isset($_POST["p_cf" . $i]) && !empty($_POST["p_cf" . $i]))
			$_getCustomParams[$i] = base64UrlDecode($_POST["p_cf" . $i]);
		else if(isset($_POST["form_" . $i]) && !empty($_POST["form_" . $i]))
			$_getCustomParams[$i] = $_POST["form_" . $i];
		else if(!isnull(getCookieValue("cf_" . $i)) && $INPUTS[$i]->Cookie)
			$_getCustomParams[$i] = getCookieValue("cf_" . $i);
		else if(($INPUTS[$i]->Type == "CheckBox" || $INPUTS[$i]->Type == "ComboBox") && empty($_getCustomParams[$i]))
			$_getCustomParams[$i] = "0";
	}
	return $_getCustomParams;
}

function cfgFileSizeToBytes($_configValue) 
{
	$_configValue = strtolower(trim($_configValue));
	$last = substr($_configValue,strlen($_configValue)-1,1);
	switch($last) 
	{
	    case 'g':
	        $_configValue *= 1024;
	    case 'm':
	        $_configValue *= 1024;
	    case 'k':
	        $_configValue *= 1024;
	}
	return floor($_configValue);
}

function createFile($_filename,$_content,$_recreate,$_backup=true)
{
	administrationLog("createFile",$_filename,((defined("CALLER_SYSTEM_ID")) ? CALLER_SYSTEM_ID : ""));
	if(strpos($_filename,"..") === false)
	{
		if(file_exists($_filename))
		{
			if($_recreate)
			{
				if(file_exists($_filename.".bak.php"))
					@unlink($_filename.".bak.php");
				if($_backup)
					@rename($_filename,$_filename.".bak.php");
				else
					@unlink($_filename);
			}
			else
				return 0;
		}
		$handle = @fopen($_filename,"w");
		if(strlen($_content)>0)
			@fputs($handle,$_content);
		@fclose($handle);
		return 1;
	}
	return 0;
}

function b64dcode(&$_a,$_b)
{
	$_a = base64_decode($_a);
}

function b64ecode(&$_a,$_b)
{
	$_a = base64_encode($_a);
}

function base64UrlDecode($_input)
{
    return base64_decode(str_replace(array('_','-',','),array('=','+','/'),$_input));
}

function base64UrlEncode($_input)
{
    return str_replace(array('=','+','/'),array('_','-',','),base64_encode($_input));
}

function isBase64Encoded($_data,$_url=false)
{
    if($_url)
        $_data = str_replace(array('_','-',','),array('=','+','/'),$_data);
	if(preg_match('%^[a-zA-Z0-9/+]*={0,2}$%', $_data))
		return true;
	else
		return false;
}

function cutString($_string,$_maxlength,$_addDots=false)
{
    if(function_exists("mb_strlen"))
    {
        if(mb_strlen($_string,'utf-8')>$_maxlength)
        {
            if($_addDots)
                return mb_substr($_string,0,$_maxlength-3,'utf-8')."...";
            else
                return mb_substr($_string,0,$_maxlength,'utf-8');
        }
    }
    else
    {
        if(strlen($_string)>$_maxlength)
        {
            if($_addDots)
                return substr($_string,0,$_maxlength-3)."...";
            else
                return substr($_string,0,$_maxlength);
        }
    }
    return $_string;
}

function base64ToFile($_filename,$_content)
{
	administrationLog("base64ToFile",$_filename,CALLER_SYSTEM_ID);
	if(@file_exists($_filename))
		@unlink($_filename);
	$handle = @fopen($_filename,"wb");
	@fputs($handle,base64_decode($_content));
	@fclose($handle);
}

function fileToBase64($_filename)
{
	if(@filesize($_filename) == 0)
		return "";
	$handle = @fopen($_filename,"rb");
	$content = @fread($handle,@filesize($_filename));
	@fclose($handle);
	return base64_encode($content);
}

function initData($_fields)
{
	global $INTERNAL,$LANGUAGES,$COUNTRIES,$FILTERS,$EVENTS,$VISITOR,$INPUTS,$CONFIG;
    if(in_array("DBCONFIG",$_fields) && empty($CONFIG["db"]))loadDatabaseConfig(true,$CONFIG["gl_db_prefix"]);
    if((in_array("INTERNAL",$_fields) || in_array("GROUPS",$_fields)) && empty($INTERNAL))
    {
        loadInternals();
        if(is("IS_FILTERED") && FILTER_ALLOW_TICKETS && !FILTER_ALLOW_CHATS)
            foreach($INTERNAL as $operator)
                $operator->LastActive = $operator->Status = USER_STATUS_OFFLINE;
    }
    if(in_array("LANGUAGES",$_fields) && empty($LANGUAGES))loadLanguages();
    if(in_array("COUNTRIES",$_fields) && empty($COUNTRIES))loadCountries();
    if(in_array("INPUTS",$_fields) && empty($INPUTS))DataInput::Build();
    if(in_array("FILTERS",$_fields) && empty($FILTERS))loadFilters();
    if(is("DB_CONNECTION"))
    {
        if(in_array("EVENTS",$_fields) && empty($EVENTS))loadEvents();
        if(in_array("VISITOR",$_fields) && empty($VISITOR))Visitor::Build();
    }
}

function getTargetParameters($allowCOM=true)
{
	global $GROUPS;
	$parameters = array("exclude"=>null,"include_group"=>null,"include_user"=>null);

	if(isset($_GET[GET_EXTERN_HIDDEN_GROUPS]))
	{
		$groups = base64UrlDecode($_GET[GET_EXTERN_HIDDEN_GROUPS]);
		if(strlen($groups) > 1)
			$parameters["exclude"] = explode("?",$groups);
		if(isset($_GET[GET_EXTERN_GROUP]))
			$parameters["include_group"] = array(base64UrlDecode($_GET[GET_EXTERN_GROUP]));
		if(isset($_GET[GET_EXTERN_INTERN_USER_ID]))
			$parameters["include_user"] = base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID]);
		if(strlen($groups) == 1 && is_array($GROUPS))
			foreach($GROUPS as $gid => $group)
				if(!@in_array($gid,$parameters["include_group"]))
					$parameters["exclude"][] = $gid;
	}
	
	if(!$allowCOM)
	{
		initData(array("GROUPS"));
        if(is_array($GROUPS))
            foreach($GROUPS as $gid => $group)
                if(!empty($GROUPS[$gid]->ChatVouchersRequired) && !(is_array($parameters["exclude"]) && in_array($gid,$parameters["exclude"])))
                    $parameters["exclude"][] = $gid;
    }
	return $parameters;
}

function operatorsAvailable($_amount=0, $_exclude=null, $include_group=null, $include_user=null, $_allowBots=false)
{
	global $INTERNAL,$GROUPS;
	if(!DB_CONNECTION)
		return 0;
    initData(array("INTERNAL","GROUPS"));
	if(!empty($include_user))
		$include_group = $INTERNAL[Operator::GetSystemId($include_user)]->GetGroupList(true);

	foreach($INTERNAL as $internaluser)
	{
		$isex = $internaluser->IsExternal($GROUPS, $_exclude, $include_group);
		if($isex && $internaluser->Status < USER_STATUS_OFFLINE)
		{
			if($_allowBots || !$internaluser->IsBot)
				$_amount++;
		}
	}
	return $_amount;
}

function getOperatorList()
{
	global $INTERNAL,$GROUPS;
	$array = array();
    initData(array("INTERNAL","GROUPS"));
	foreach($INTERNAL as $internaluser)
		if($internaluser->IsExternal($GROUPS))
			$array[utf8_decode($internaluser->Fullname)] = $internaluser->Status;
	return $array;
}

function getOperators()
{
	global $INTERNAL,$GROUPS;
	$array = array();
    initData(array("INTERNAL","GROUPS"));
	foreach($INTERNAL as $sysId => $internaluser)
	{
		$internaluser->IsExternal($GROUPS);
		$array[$sysId] = $internaluser;
	}
	return $array;
}

function isValidUploadFile($_filename)
{
	global $CONFIG;
	if(!empty($CONFIG["wcl_upload_blocked_ext"]))
	{
		$extensions = explode(",",str_replace("*.","",$CONFIG["wcl_upload_blocked_ext"]));
		foreach($extensions as $ext)
			if(strlen($_filename) > strlen($ext) && substr($_filename,strlen($_filename)-strlen($ext),strlen($ext)) == $ext)
				return false;
	}
	return true;
}

function getLocalizationFileString($_language,$_checkForExistance=true,$_mobile=false,$_mobileoriginal=false)
{
    if(strpos($_language,"..") === false)
    {
        $prefix = (!$_mobile) ? "lang" : "langmobile";
        $folder = (!$_mobileoriginal) ? "_language/" : "mobile/php/translation/";

        $file = LIVEZILLA_PATH . $folder . $prefix . strtolower($_language) . ((ISSUBSITE)? ".".SUBSITEHOST:"") . ".php";
        if($_checkForExistance && !@file_exists($file))
            $file = LIVEZILLA_PATH . $folder . $prefix . strtolower($_language) . ".php";
        return $file;
    }
    return "";
}

function languageSelect($_mylang="",$_require=false)
{
	global $CONFIG,$INTERNAL,$LANGUAGES,$DEFAULT_BROWSER_LANGUAGE,$LANG_DIR,$LZLANG; //++
    if(is("DB_CONNECTION"))
    {
        initData(array("LANGUAGES"));
        if(!$_require && !empty($DEFAULT_BROWSER_LANGUAGE))
            return;

        requireDynamic(getLocalizationFileString("en"),LIVEZILLA_PATH . "_language/");
        if(empty($_mylang))
        {
            if(defined("CALLER_TYPE") && CALLER_TYPE == CALLER_TYPE_INTERNAL && defined("CALLER_SYSTEM_ID"))
            {
                $_mylang = strtolower($INTERNAL[CALLER_SYSTEM_ID]->Language);
            }
            else
            {
                $_mylang = getBrowserLocalization();
                $_mylang = strtolower($_mylang[0]);
            }
        }
        if(!empty($CONFIG["gl_on_def_lang"]) && file_exists($tfile=getLocalizationFileString($CONFIG["gl_default_language"])) && @filesize($tfile)>0)
        {
            $DEFAULT_BROWSER_LANGUAGE = $CONFIG["gl_default_language"];
            requireDynamic(getLocalizationFileString($CONFIG["gl_default_language"]),LIVEZILLA_PATH . "_language/");
        }
        else if(empty($_mylang) || (!empty($_mylang) && strpos($_mylang,"..") === false))
        {
            if(!empty($_mylang) && strlen($_mylang) >= 5 && substr($_mylang,2,1) == "-" && file_exists($tfile=getLocalizationFileString(substr($_mylang,0,5))) && @filesize($tfile)>0)
                requireDynamic(getLocalizationFileString($s_browser_language=strtolower(substr($_mylang,0,5))),LIVEZILLA_PATH . "_language/");
            else if(!empty($_mylang) && strlen($_mylang) > 1 && file_exists($tfile=getLocalizationFileString(substr($_mylang,0,2))) && @filesize($tfile)>0)
                requireDynamic(getLocalizationFileString($s_browser_language=strtolower(substr($_mylang,0,2))),LIVEZILLA_PATH . "_language/");
            else if(file_exists($tfile=getLocalizationFileString($CONFIG["gl_default_language"])) && @filesize($tfile)>0)
                requireDynamic(getLocalizationFileString($s_browser_language=$CONFIG["gl_default_language"]),LIVEZILLA_PATH . "_language/");

            if(isset($s_browser_language))
                $DEFAULT_BROWSER_LANGUAGE = $s_browser_language;
        }
        else if(file_exists(getLocalizationFileString($CONFIG["gl_default_language"])))
            requireDynamic(getLocalizationFileString($CONFIG["gl_default_language"]),LIVEZILLA_PATH . "_language/");

        if(empty($DEFAULT_BROWSER_LANGUAGE) && file_exists(getLocalizationFileString("en")))
            $DEFAULT_BROWSER_LANGUAGE = "en";
        /*
        if(empty($DEFAULT_BROWSER_LANGUAGE) || (!empty($DEFAULT_BROWSER_LANGUAGE) && !@file_exists(getLocalizationFileString($DEFAULT_BROWSER_LANGUAGE))))
            if(!(defined("SERVERSETUP") && SERVERSETUP))
                exit("Localization error: default language is not available.");
        */
        $LANG_DIR = (($LANGUAGES[strtoupper($DEFAULT_BROWSER_LANGUAGE)][2]) ? "rtl":"ltr");

        if($_require)
            DataInput::Build();
    }
    else
        requireDynamic(getLocalizationFileString("en"),LIVEZILLA_PATH . "_language/");
}

function checkPhpVersion($_ist,$_ond,$_ird)
{
	$array = explode(".",phpversion());
	if($array[0] >= $_ist)
	{
		if($array[1] > $_ond || ($array[1] == $_ond && $array[2] >= $_ird))
			return true;
		return false;
	}
	return false;
}

function getAlertTemplate()
{
	global $CONFIG;
	$html = str_replace("<!--server-->",LIVEZILLA_URL,getFile(TEMPLATE_SCRIPT_ALERT));
	$html = str_replace("<!--title-->",$CONFIG["gl_site_name"],$html);
	return $html;
}

function formLanguages($_lang)
{
	if(strlen($_lang) == 0)
		return "";
	$array_lang = explode(",",$_lang);
	foreach($array_lang as $key => $lang)
		if($key == 0)
		{
			$_lang = strtoupper(substr(trim($lang),0,2));
			break;
		}
	return (strlen($_lang) > 0) ? $_lang : "";
}

function administrationLog($_type,$_value,$_user)
{
	if(DB_CONNECTION)
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_ADMINISTRATION_LOG."` (`id`,`type`,`value`,`time`,`user`) VALUES ('".DBManager::RealEscape(getId(32))."','".DBManager::RealEscape($_type)."','".DBManager::RealEscape($_value)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($_user)."');");
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_ADMINISTRATION_LOG."` WHERE `time`<'".DBManager::RealEscape(time()-2592000)."';");
	}
}

function logit($_id,$_file=null)
{
	if(empty($_file))
		$_file = LIVEZILLA_PATH . "_log/debug.log";
	
	if(@file_exists($_file) && @filesize($_file) > 5000000)
		@unlink($_file);
		
	$handle = @fopen($_file,"a+");
	@fputs($handle,$_id."\r\n");
	@fclose($handle);
}

function errorLog($_message)
{
	global $RESPONSE;
	if(defined("FILE_ERROR_LOG"))
	{
		if(@file_exists(FILE_ERROR_LOG) && @filesize(FILE_ERROR_LOG) > 500000)
			@unlink(FILE_ERROR_LOG);

		$handle = @fopen(FILE_ERROR_LOG,"a+");
		if($handle)
		{
			@fputs($handle,$_message . "\r");
			@fclose($handle);
		}
		if(!empty($RESPONSE))
		{
			if(!isset($RESPONSE->Exceptions))
				$RESPONSE->Exceptions = "";
			$RESPONSE->Exceptions .= "<val err=\"".base64_encode(trim($_message))."\" />";
		}
	}
	else
		$RESPONSE->Exceptions = "";
}

function getValueBySystemId($_systemid,$_value,$_default)
{
	$value = $_default;
	$parts = explode("~",$_systemid);
	
	$result = queryDB(true,"SELECT `".DBManager::RealEscape($_value)."` FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($parts[0])."' AND `browser_id`='".DBManager::RealEscape($parts[1])."' ORDER BY `last_active` DESC LIMIT 1;");
	if($result)
	{
		$row = DBManager::FetchArray($result);
		$value = $row[$_value];
	}
	return $value;
}

function getId($_length,$start=0)
{
	$id = md5(uniqid(rand(),1));
	if($_length != 32)
		$start = rand(0,(31-$_length));
	$id = substr($id,$start,$_length);
	return $id;
}

function removeSSpanFile($_all)
{
	if($_all || (getSpanValue() < time()))
		setSpanValue(0);
}

function isSSpanFile()
{
	return !isnull(getSpanValue());
}

function getSpanValue()
{
	if(DB_CONNECTION && $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_INFO."`"))
		if($row = DBManager::FetchArray($result))
			return $row["gtspan"];
	return time();
}

function setSpanValue($_value)
{
	if(DB_CONNECTION)
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_INFO."` SET `gtspan`='".DBManager::RealEscape($_value)."'");
}

function createSSpanFile($_sspan)
{
    if($_sspan <= CONNECTION_ERROR_SPAN)
        setSpanValue((time()+$_sspan));
    else
        setSpanValue((time()+600));
}

function getLocalTimezone($_timezone,$ltz=0)
{
	$template = "%s%s%s:%s%s";
	if(isset($_timezone) && !empty($_timezone))
	{
		$ltz = $_timezone;
		if($ltz == ceil($ltz))
		{
			if($ltz >= 0 && $ltz < 10)
				$ltz = sprintf($template,"+","0",$ltz,"0","0");
			else if($ltz < 0 && $ltz > -10)
				$ltz = sprintf($template,"-","0",$ltz*-1,"0","0");
			else if($ltz >= 10)
				$ltz = sprintf($template,"+",$ltz,"","0","0");
			else if($ltz <= -10)
				$ltz = sprintf($template,"",$ltz,"","0","0");
		}
		else
		{
			$split = explode(".",$ltz);
			$split[1] = (60 * $split[1]) / 100;
			if($ltz >= 0 && $ltz < 10)
				$ltz = sprintf($template,"+","0",$split[0],$split[1],"0");
			else if($ltz < 0 && $ltz > -10)
				$ltz = sprintf($template,"","0",$split[0],$split[1],"0");
				
			else if($ltz >= 10)
				$ltz = sprintf($template,"+",$split[0],"",$split[1],"0");
			
			else if($ltz <= -10)
				$ltz = sprintf($template,"",$split[0],"",$split[1],"0");
		}
	}
	return $ltz;
}

function setCookieValue($_key,$_value,$_onlyWhenEmpty=false)
{
	global $CONFIG;
	if(!empty($CONFIG["gl_colt"]) && !empty($_value))
	{
        $current = getCookieValue($_key);
        if($_onlyWhenEmpty && $current != null)
            return;
        if($current == $_value)
            return;
        $lifetime = ((empty($CONFIG["gl_colt"])) ? 0 : (time()+($CONFIG["gl_colt"]*86400)));
        setcookie("lz_" . $_key,($_COOKIE["lz_" . $_key] = base64_encode($_value)),$lifetime);
        setcookie("livezilla", "", time()-3600);
	}
}

function getCookieValue($_key,$_filter=false,$_maxlen=0)
{
	global $CONFIG;
	if(empty($CONFIG["gl_colt"]))
		return null;
    if(empty($_COOKIE["lz_" . $_key]))
        return null;
    if($_filter)
        return filterParam(base64_decode($_COOKIE["lz_" . $_key]),"",FILTER_SANITIZE_STRING,null,$_maxlen);
    return base64_decode($_COOKIE["lz_" . $_key]);
}

function hashFile($_file)
{
	$enfile = md5(base64_encode(file_get_contents($_file)));
	return $enfile;
}

function mTime()
{
	$time = str_replace(".","",microtime());
	$time = explode(" " , $time);
	return $time;
}

function microtimeFloat($_microtime)
{
   list($usec, $sec) = explode(" ", $_microtime);
   return ((float)$usec + (float)$sec);
}

function testDirectory($_dir)
{	
	if(!@is_dir($_dir))
		@mkdir($_dir);
	
	if(@is_dir($_dir))
	{
		$fileid = md5(uniqid(rand()));
		$handle = @fopen ($_dir . $fileid ,"a");
		@fputs($handle,$fileid."\r\n");
		@fclose($handle);
		
		if(!file_exists($_dir . $fileid))
			return false;
			
		@unlink($_dir . $fileid);
		if(file_exists($_dir . $fileid))
			return false;
			
		return true;
	}
	else
		return false;
}

function sendMail($_account,$_receiver,$_replyto,$_bodyText,$_bodyHTML,$_subject="",$_test=false,$_attachments=null,$_fakeSender = "")
{
    if($_account == null)
        $_account=Mailbox::GetDefaultOutgoing();
    if($_account == null)
        return null;

    $_bodyText = correctLineBreaks($_bodyText);
    require_once(LIVEZILLA_PATH . "_lib/objects.mail.inc.php");
    $mailer = new MailSystem($_account, $_receiver, $_replyto, trim($_bodyText), trim($_bodyHTML), $_subject, $_test, $_attachments);
    $mailer->SendEmail($_fakeSender);
    return $mailer->Result;
}

function correctLineBreaks($_input)
{
    $rand = getId(32);
    $_input = str_replace("\r\n", $rand, $_input);
    $_input = str_replace("\r", $rand, $_input);
    $_input = str_replace("\n", $rand, $_input);
    $_input = str_replace($rand, "\r\n", $_input);
    return $_input;
}

function downloadSocialMedia($cronJob=false)
{
    global $GROUPS,$CONFIG;
    initData(array("DBCONFIG"));
    if(is_array($GROUPS) && !empty($CONFIG["db"]["gl_sm"]))
        foreach($GROUPS as $gid => $group)
        {
            foreach($CONFIG["db"]["gl_sm"] as $channel)
                if($channel->GroupId == $gid && $channel->LastConnect < (time()-($channel->ConnectFrequency*60)))
                {
                    $channel->SetLastConnect(time());
                    $newTickets = $channel->Download();
                    $newMessage = false;
                    $maxUpdateTime = array();
                    $dcountm = 0;
                    foreach($newTickets as $hash => $ticket)
                    {
                        $newMessageInTicket = false;
                        $dcountm+=count($ticket->Messages);
                        $id=$groupid=$language="";
                        if($exists=Ticket::Exists($hash,$id,$groupid,$language))
                        {
                            $ticket->Id = $id;
                            $ticket->Group = $groupid;
                            $ticket->Language = strtoupper($language);
                            $newMessage = true;
                        }
                        else
                        {
                            $ticket->Id = getObjectId("ticket_id",DATABASE_TICKETS);
                            $ticket->CreationType = $channel->Type;
                            $ticket->Language = strtoupper($CONFIG["gl_default_language"]);
                        }
                        $ticket->Group = $gid;
                        $tcreated = 0;
                        foreach($ticket->Messages as $index => $message)
                        {
                            $message->Hash = $hash;
                            $maxUpdateTime[$message->Id] = $message->Created;
                            $tcreated = ($tcreated>0) ? min($tcreated,$message->Created):$message->Created;
                            $message->ChannelId = $message->Id;
                            $message->Id = (($index==0) && !$exists) ? $ticket->Id : md5($message->Id);

                            if(DEBUG_MODE)logit($ticket->Id . " -MID: " . $message->Id . " - " . " - " . $message->ChannelId. " - " . $message->Email);

                            $message->Edited = $message->Created;
                            $message->TicketId = $ticket->Id;
                            $message->Subject = $channel->Name;

                            if(!TicketMessage::Exists($message->ChannelId))
                            {
                                $message->Save($ticket->Id,true,null,$ticket);
                                $newMessage = $newMessageInTicket = true;
                            }
                        }
                        if(!$exists)
                        {
                            $ticket->ChannelId = $channel->Id;
                            $ticket->Save($hash,false);
                            $ticket->Created = $tcreated;
                        }
                        if(!$exists || $newMessageInTicket)
                        {
                            $ticket->Reactivate();
                            $ticket->SetLastUpdate(time());
                        }
                    }

                    arsort($maxUpdateTime);
                    if($newMessage && $channel->IsSince())
                    {
                        $channel->SetLastConnect(0);
                    }

                    foreach($maxUpdateTime as $uid => $utime)
                    {
                        if($channel->Type == 6)
                            $channel->SetLastUpdate($utime);
                        else if($channel->Type == 7)
                            $channel->SetLastUpdate($uid);

                        break;
                    }
                    if(!$cronJob)
                        return;
                }
        }
}

function downloadEmails($cronJob=false,$exists=false,$reload=false)
{
    global $GROUPS,$CONFIG;
    initData(array("DBCONFIG"));
    if(is_array($GROUPS))
        foreach($GROUPS as $group)
        {
            $gmbout = Mailbox::GetById($group->TicketEmailOut);
            if(is_array($group->TicketEmailIn))
                foreach($group->TicketEmailIn as $mid)
                    if(!empty($CONFIG["db"]["gl_email"][$mid]) && $CONFIG["db"]["gl_email"][$mid]->LastConnect < (time()-($CONFIG["db"]["gl_email"][$mid]->ConnectFrequency*60)))
                    {
                        $CONFIG["db"]["gl_email"][$mid]->SetLastConnect(time());
                        $newmails = $CONFIG["db"]["gl_email"][$mid]->Download($reload,$CONFIG["db"]["gl_email"][$mid]->Delete);

                        if($reload)
                            $CONFIG["db"]["gl_email"][$mid]->SetLastConnect(0);

                        if(!empty($newmails) && is_array($newmails))
                            foreach($newmails as $temail)
                            {
                                if(TicketEmail::Exists($temail->Id))
                                    continue;

                                $Ticket = null;
                                $temail->MailboxId = $mid;
                                $temail->GroupId = $group->Id;

                                if(preg_match_all("/\[[a-zA-Z\d]{12}\]/", $temail->Subject . $temail->Body . $temail->BodyHTML, $matches))
                                {
                                    if(empty($CONFIG["gl_avhe"]))
                                        $temail->BodyHTML = "";

                                    foreach($matches[0] as $match)
                                    {
                                        $id=$groupid=$language="";
                                        if($exists=Ticket::Exists($match,$id,$groupid,$language))
                                        {
                                            $Ticket = new Ticket($id,true);
                                            $Ticket->ChannelId = $mid;
                                            $Ticket->Group = $groupid;
                                            $Ticket->Language = strtoupper($language);
                                            $Ticket->Messages[0]->Type = (($gmbout != null && $temail->Email == $gmbout->Email) || $temail->Email == $CONFIG["db"]["gl_email"][$mid]->Email) ? 1 : 3;
                                            $Ticket->Messages[0]->Text = $temail->Body;
                                            $Ticket->Messages[0]->Email = (!empty($temail->ReplyTo)) ? $temail->ReplyTo : $temail->Email;
                                            $Ticket->Messages[0]->ChannelId = $temail->Id;
                                            $Ticket->Messages[0]->Fullname = $temail->Name;
                                            $Ticket->Messages[0]->Subject = $temail->Subject;
                                            $Ticket->Messages[0]->Hash = strtoupper(str_replace(array("[","]"),"",$match));
                                            $Ticket->Messages[0]->Created = $temail->Created;
                                            $Ticket->Messages[0]->Save($id,false,null,$Ticket);
                                            $Ticket->Reactivate();
                                            $Ticket->SetLastUpdate(time());

                                            if(DEBUG_MODE)logit("SAVE EMAIL REPLY: " . $Ticket->Messages[0]->Id . " - " . $temail->Id . " - " . $temail->Subject);

                                            break;
                                        }
                                    }
                                }

                                if(!$exists)
                                {
                                    if($group->TicketHandleUnknownEmails == 1)
                                    {
                                        $temail->Save();
                                    }
                                    else if($group->TicketHandleUnknownEmails == 0)
                                    {
                                        $temail->Save();
                                        $temail->Destroy();

                                        $Ticket = new Ticket(getObjectId("ticket_id",DATABASE_TICKETS),true);
                                        $Ticket->ChannelId = $mid;
                                        $Ticket->Group = $group->Id;
                                        $Ticket->CreationType = 1;
                                        $Ticket->Language = strtoupper($CONFIG["gl_default_language"]);
                                        $Ticket->Messages[0]->Id = $Ticket->Id;
                                        $Ticket->Messages[0]->Type = 3;
                                        $Ticket->Messages[0]->Text = $temail->Body;
                                        $Ticket->Messages[0]->Email = (!empty($temail->ReplyTo)) ? $temail->ReplyTo : $temail->Email;
                                        $Ticket->Messages[0]->ChannelId = $temail->Id;
                                        $Ticket->Messages[0]->Fullname = $temail->Name;
                                        $Ticket->Messages[0]->Created = $temail->Created;
                                        $Ticket->Messages[0]->Subject = $temail->Subject;
                                        $Ticket->Messages[0]->Attachments = $temail->Attachments;
                                        $Ticket->Messages[0]->SaveAttachments();
                                        $Ticket->Save();
                                        $Ticket->AutoAssignEditor();
                                        $Ticket->SetLastUpdate(time());
                                        languageSelect(strtolower($CONFIG["gl_default_language"]),true);
                                        $Ticket->SendAutoresponder(new Visitor(""),new VisitorBrowser("",false));
                                        languageSelect("",true);
                                    }
                                }

  								foreach($temail->Attachments as $attid => $attdata)
                                {
                                    file_put_contents(PATH_UPLOADS.$attdata[0],$attdata[2]);
                                    processResource("SYSTEM",$attid,$attdata[0],3,$attdata[1],0,100,1);
                                    if(!$exists && $group->TicketHandleUnknownEmails == 1)
                                        $temail->SaveAttachment($attid);
                                    if(!empty($Ticket))
                                        $Ticket->Messages[0]->ApplyAttachment($attid);
                                }
                            }
                        if(!$cronJob)
                            return;
                    }
        }
}

function mimeHeaderDecode($_string)
{
    if(strpos($_string,"?") !== false && strpos($_string,"=") !== false)
    {
        if(function_exists("iconv_mime_decode"))
            return iconv_mime_decode($_string,2,"UTF-8");
        else if(strpos(strtolower($_string),"utf-8") !== false)
        {
            mb_internal_encoding("UTF-8");
            return mb_decode_mimeheader($_string);
        }
        else
            return utf8_encode(mb_decode_mimeheader($_string));
    }
    return utf8_encode($_string);
}

function setTimeLimit($_time)
{
    @set_time_limit($_time);
    $_time = min(max(@ini_get('max_execution_time'),30),$_time);
    return $_time;
}

function loadLibrary($_type,$_name)
{
    if($_type == "ZEND")
    {
        if(!defined("LIB_ZEND_LOADED"))
        {
            define("LIB_ZEND_LOADED",true);
            $includePath = array();

            if(defined("IN_API"))
                $includePath[] = './../../_lib/trdp/';
            else
                $includePath[] = './_lib/trdp/';

            $includePath[] = get_include_path();
            $includePath = implode(PATH_SEPARATOR,$includePath);
            set_include_path($includePath);
            require_once 'Zend/Loader.php';
            //@register_shutdown_function(array('Zend_Session', 'writeClose'), true);
        }
        if(!defined($_name))
        {
            define($_name,true);
            Zend_Loader::loadClass($_name);
        }
    }
}

function is($_definition)
{
    if(defined($_definition))
        return constant($_definition);
    else
        return false;
}

function cronJobs($_asCronJob)
{
    global $CONFIG;
    $timeouts = array($CONFIG["poll_frequency_clients"] * 10,86400,86400*7,DATA_LIFETIME);
    $randoms = ($_asCronJob) ? array(0=>10,1=>10,2=>1): array(0=>600,1=>300,2=>10);
    $randStandard = rand(1,$randoms[0]);

    if($randStandard < 5)
    {
        require_once(LIVEZILLA_PATH . "_lib/functions.internal.optimize.inc.php");
        maintainTables($randStandard,$timeouts);
    }

    if(rand(1,$randoms[2]) == 1)
    {
        if(empty($CONFIG["gl_rm_chats"]) || !empty($CONFIG["gl_rm_chats_time"]))
            sendChatTranscripts();

        if(rand(1,2)==1)
            downloadEmails($_asCronJob);
        else
            downloadSocialMedia($_asCronJob);
    }
}

function closeArchiveEntry($_chatId,$_externalFullname,$_externalId,$_internalId,$_groupId,$_email,$_company,$_phone,$_host,$_ip,$_question,$_transcriptSent=false,$_waitingtime,$_startResult,$_endResult)
{
	global $CONFIG,$LZLANG;
	$result = queryDB(true,"SELECT `voucher_id`,`endtime`,`transcript_text`,`transcript_html`,`iso_language`,`time` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=1 AND `chat_id`='".DBManager::RealEscape($_chatId)."' LIMIT 1;");
	$row = DBManager::FetchArray($result);
    languageSelect($row["iso_language"],true);
    CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_CHATS);
    $_externalFullname = (empty($_externalFullname)) ? ($LZLANG["client_guest"] . " " . getNoName($_externalId.$_ip))  : $_externalFullname;
    $filter = new Chat();
    $filter->Generate($_chatId,$_externalFullname,true,true,$_question,$row["time"]);
    $filter->PlainText = applyReplacements($filter->PlainText,true,false,false);
    $filter->HTML = applyReplacements($filter->HTML,true,false,false);
    $tsData = array($row["transcript_text"],$row["transcript_html"]);
    for($i=0;$i<count($tsData);$i++)
    {
        if($i==1 && empty($tsData[$i]))
            continue;

        $tsData[$i] = applyReplacements($tsData[$i],true,false,false);
        if(!empty($filter->PlainText))
        {
            $tText = (($i==0) ? $filter->PlainText : nl2br($filter->PlainText))."<!--lz_ref_link-->";
            $tsData[$i] = str_replace("%localdate%",date("r",$filter->FirstPost),$tsData[$i]);
            if(strpos($tsData[$i],"%transcript%")===false && strpos($tsData[$i],"%mailtext%")===false)
                $tsData[$i] .= $tText;
            else if(strpos($tsData[$i],"%transcript%")!==false)
                $tsData[$i] = str_replace("%transcript%",$tText,$tsData[$i]);
            else if(strpos($tsData[$i],"%mailtext%")!==false)
                $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);
        }
        else
            $tsData[$i] = "";

        $tsData[$i] = str_replace("%company_logo_url%",$CONFIG["gl_cali"],$tsData[$i]);
        $tsData[$i] = str_replace(array("%email%","%eemail%"),$_email,$tsData[$i]);
        $tsData[$i] = str_replace(array("%fullname%","%efullname%"),$_externalFullname,$tsData[$i]);
        $tsData[$i] = str_replace("%rating%",getRatingAVGFromChatId($_chatId),$tsData[$i]);
    }

    $name = (!empty($_externalFullname)) ? ",`fullname`='".DBManager::RealEscape($_externalFullname)."'" : "";
    queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `external_id`='".DBManager::RealEscape($_externalId)."',`closed`='".DBManager::RealEscape(time())."'".$name.",`internal_id`='".DBManager::RealEscape($_internalId)."',`group_id`='".DBManager::RealEscape($_groupId)."',`html`='".DBManager::RealEscape($filter->HTML)."',`plaintext`='".DBManager::RealEscape($filter->PlainText)."',`transcript_text`='".DBManager::RealEscape($tsData[0])."',`transcript_html`='".DBManager::RealEscape($tsData[1])."',`email`='".DBManager::RealEscape($_email)."',`company`='".DBManager::RealEscape($_company)."',`phone`='".DBManager::RealEscape($_phone)."',`host`='".DBManager::RealEscape($_host)."',`ip`='".DBManager::RealEscape($_ip)."',`gzip`=0,`wait`='".DBManager::RealEscape($_waitingtime)."',`accepted`='".DBManager::RealEscape($_startResult)."',`ended`='".DBManager::RealEscape($_endResult)."',`transcript_sent`='".DBManager::RealEscape(((((empty($CONFIG["gl_soct"]) && empty($CONFIG["gl_scct"]) && empty($CONFIG["gl_scto"]) && empty($CONFIG["gl_sctg"])) || empty($tsData) || $filter->ElementCount==0 || $_transcriptSent)) ? "1" : "0"))."',`question`='".DBManager::RealEscape(cutString($_question,255))."' WHERE `chat_id`='".DBManager::RealEscape($_chatId)."' AND `closed`=0 LIMIT 1;");
    $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `channel_id`='".DBManager::RealEscape($_chatId)."';");
    if($result && $rowc = DBManager::FetchArray($result))
    {
        $Ticket = new Ticket($rowc["ticket_id"],true);
        $Ticket->LinkChat($rowc["channel_id"],$rowc["id"]);
    }
}

function getPredefinedMessage($_list, $_language)
{
    $sel_message = null;
    foreach($_list as $message)
    {
        if(($message->IsDefault && (empty($_language))) || (!empty($_language) && $_language == $message->LangISO))
        {
            $sel_message = $message;
            break;
        }
        else if($message->IsDefault)
            $sel_message = $message;
    }
    return $sel_message;
}

function configTextReplace($_text,$_blank=false)
{
    global $CONFIG;
    $_text = str_replace(array("%website_name%","%SERVERNAME%"),$CONFIG["gl_site_name"],$_text);
    $_text = str_replace("%company_logo_url%",$CONFIG["gl_cali"],$_text);
    $_text = str_replace("%localdate%",date("Y-m-d"),$_text);
    $_text = str_replace("%localtime%",date("H:i:s"),$_text);
    return applyReplacements($_text,true,false);
}

function getSubject($_subject,$_email,$_username,$_group,$_chatid,$_company,$_phone,$_ip,$_question,$_language,$_customs=null)
{
    global $INPUTS,$LZLANG,$GROUPS;
    $_subject = configTextReplace($_subject);
    $_subject = str_replace(array("%external_name%","%USERNAME%"),$_username,$_subject);
    $_subject = str_replace(array("%external_email%","%USEREMAIL%"),$_email,$_subject);
    $_subject = str_replace(array("%external_company%","%USERCOMPANY%"),$_company,$_subject);
    $_subject = str_replace("%external_phone%",$_phone,$_subject);
    $_subject = str_replace("%external_ip%",$_ip,$_subject);
    $_subject = str_replace(array("%question%","%USERQUESTION%","%mailtext%"),$_question,$_subject);
    $_subject = str_replace(array("%group_name%","%group_id%","%TARGETGROUP%"),$_group,$_subject);
    $_subject = str_replace("%group_description%",((isset($GROUPS[$_group])) ? $GROUPS[$_group]->GetDescription($_language) : $_group),$_subject);
    $_subject = str_replace(array("%chat_id%","%CHATID%"),$_chatid,$_subject);

    foreach($INPUTS as $index => $input)
        if($input->Active && $input->Custom)
        {
            if($input->Type == "CheckBox")
                $_subject = str_replace("%custom".($index)."%",((!empty($_customs[$index])) ? $LZLANG["client_yes"] : $LZLANG["client_no"]),$_subject);
            else if(!empty($_customs[$index]))
                $_subject = str_replace("%custom".($index)."%",$input->GetClientValue($_customs[$index]),$_subject);
            else
                $_subject = str_replace("%custom".($index)."%","",$_subject);
        }
        else
            $_subject = str_replace("%custom".($index)."%","",$_subject);

    return applyReplacements(str_replace("\n","",$_subject),true,false);
}

function closeChats()
{
	global $INTERNAL,$CONFIG;
	$result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=1 AND `closed`=0 AND `transcript_sent`=0;");
    while($row = DBManager::FetchArray($result))
    {
        $results = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id`='".DBManager::RealEscape($row["chat_id"])."' AND (`exit`>0 OR `last_active`<".(time()-$CONFIG["timeout_track"]).");");
        if($results && $rows = DBManager::FetchArray($results))
        {
            $botchat = !empty($row["internal_id"]) && $INTERNAL[$row["internal_id"]]->IsBot;
            $chat = new VisitorChat($rows);
            $chat->LoadMembers();
            $startResult = 0;
            $endResult = 0;
            $waitingtime = 0;
            if($botchat)
            {
                $chat->CloseChat();
                $lastOp = $row["internal_id"];
                $waitingtime = 1;
                $startResult = 1;
            }
            else
            {
                $lastOp = $chat->GetLastOperator($waitingtime,$startResult,$endResult);
            }
            closeArchiveEntry($row["chat_id"],$rows["fullname"],$rows["visitor_id"],$lastOp,$rows["request_group"],$rows["email"],$rows["company"],$rows["phone"],$row["host"],$row["ip"],$rows["question"],(empty($CONFIG["gl_sctb"]) && $botchat),$waitingtime,$startResult,$endResult);
        }
    }
}

function sendChatTranscripts($_custom=false)
{
	global $CONFIG,$INTERNAL,$GROUPS,$INPUTS;
	initData(array("INTERNAL","INPUTS"));
	
	closeChats();
    $defmailbox = Mailbox::GetDefaultOutgoing();

	$result = queryDB(false,"SELECT `voucher_id`,`subject`,`customs`,`internal_id`,`transcript_text`,`transcript_html`,`transcript_receiver`,`email`,`chat_id`,`fullname`,`group_id` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_type`=1 AND `endtime`>0 AND `closed`>0 AND `transcript_sent`=0 LIMIT 1;");
	if($result)
		while($row = DBManager::FetchArray($result))
		{
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `transcript_sent`=1 WHERE `chat_id`='". DBManager::RealEscape($row["chat_id"])."' LIMIT 1;");

            if(empty($row["transcript_html"]) && empty($row["transcript_text"]))
                continue;

            $tData = array($row["transcript_text"],$row["transcript_html"]);
            for($i=0;$i<count($tData);$i++)
            {
                if($i == 1 && empty($tData[$i]))
                    continue;

                $tData[$i] = str_replace(array("%fullname%","%efullname%"),$row["fullname"],$tData[$i]);
                $tData[$i] = str_replace(array("%email%","%eemail%"),$row["email"],$tData[$i]);
                $tData[$i] = str_replace("%rating%",getRatingAVGFromChatId($row["chat_id"]),$tData[$i]);
                $subject = $row["subject"];
                $customs = @unserialize($row["customs"]);
                $fakeSender = "";

                foreach($INPUTS as $index => $input)
                    if($input->Active && $input->Custom && !isset($GROUPS[$row["group_id"]]->TicketInputsHidden[$index]))
                    {
                        $cv="";
                        if($input->Type == "CheckBox")
                            $cv = ((!empty($customs[$input->Name])) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->");
                        else if(!empty($customs[$input->Name]) || $input->Type == "ComboBox")
                            $cv = $input->GetClientValue(@$customs[$input->Name]);
                        $tData[$i] = str_replace("%custom".$index."%",$cv,$tData[$i]);
                    }

                $tData[$i] = applyReplacements($tData[$i]);
                $tData[$i] = Mailbox::FinalizeEmail($tData[$i],$i==1);
            }
            $mailbox=null;
            if(!empty($row["group_id"]) && isset($GROUPS[$row["group_id"]]) && !empty($GROUPS[$row["group_id"]]->ChatEmailOut))
                $mailbox = Mailbox::GetById($GROUPS[$row["group_id"]]->ChatEmailOut);

            $mailbox = (!empty($mailbox)) ? $mailbox : $defmailbox;

			if((!empty($CONFIG["gl_soct"]) || $_custom) && !empty($row["transcript_receiver"]))
				sendMail($mailbox,$row["transcript_receiver"],$mailbox->Email,$tData[0],$tData[1],$subject);

			if(!empty($CONFIG["gl_scto"]) && !$_custom)
			{
				initData(array("INTERNAL"));
				$receivers = array();
				$resulti = queryDB(true,"SELECT `sender`,`receiver` FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='". DBManager::RealEscape($row["chat_id"])."';");
				if($resulti)
					while($rowi = DBManager::FetchArray($resulti))
					{
						if(!empty($INTERNAL[$rowi["sender"]]) && !in_array($rowi["sender"],$receivers))
							$receivers[] = $rowi["sender"];
						else if(!empty($INTERNAL[$rowi["receiver"]]) && !in_array($rowi["receiver"],$receivers))
							$receivers[] = $rowi["receiver"];
						else
							continue;
						sendMail($mailbox,$INTERNAL[$receivers[count($receivers)-1]]->Email,$mailbox->Email,$tData[0],$tData[1],$subject);
					}
			}
			if(!empty($CONFIG["gl_sctg"]) && !$_custom)
			{
				initData(array("GROUPS"));
				sendMail($mailbox,$GROUPS[$row["group_id"]]->Email,$mailbox->Email,$tData[0],$tData[1],$subject);
			}

			if(!empty($mailbox) && !empty($CONFIG["gl_scct"]))
            {
                if(!empty($CONFIG["gl_uvec"]))
                {
                    if(Mailbox::IsValidEmail($row["transcript_receiver"]))
                        $fakeSender = $row["transcript_receiver"];
                    else if(Mailbox::IsValidEmail($row["email"]))
                        $fakeSender = $row["email"];
                }
				sendMail($mailbox,$CONFIG["gl_scct"],$mailbox->Email,$tData[0],$tData[1],$subject,false,null,$fakeSender);
            }
			
			if(!empty($row["voucher_id"]))
			{
				$ticket = new CommercialChatVoucher(null,$row["voucher_id"]);
				$ticket->Load();
				$ticket->SendStatusEmail();
			}
		}
	if(!empty($CONFIG["gl_rm_chats"]) && $CONFIG["gl_rm_chats_time"] == 0)
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `transcript_sent` = '1';");
}

function getNoName($_basename)
{
    $mod = 111;
    for ($i = 0; $i < strlen($_basename); $i++)
    {
        $digit = substr($_basename,$i,1);

        if(is_numeric($digit))
        {
            $mod = ($mod + ($mod * (16 + $digit)) % 1000);
            if ($mod % 10 == 0)
                $mod += 1;
        }
    }
    return substr($mod,strlen($mod)-4,4);
}

function getRatingAVGFromChatId($_chatId,$ratav = "-")
{
    $resultr = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE `chat_id`='". DBManager::RealEscape($_chatId)."' LIMIT 1;");
    if($resultr)
        if($rowr = DBManager::FetchArray($resultr))
            $ratav = round((($rowr["qualification"]+$rowr["politeness"])/2),1) . "/5 (" . $rowr["comment"] . ")";
    return $ratav;
}

function getResource($_id)
{
	if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `id`='".DBManager::RealEscape($_id)."' LIMIT 1;"))
		if($row = DBManager::FetchArray($result))
			return $row;
	return null;
}

function getDirectory($_dir,$_oddout,$_ignoreSource=false)
{
	$files = array();
	if(!@is_dir($_dir))
		return $files;
	$handle=@opendir($_dir);
	while ($filename = @readdir ($handle)) 
	   	if ($filename != "." && $filename != ".." && ($_oddout == false || !stristr($filename,$_oddout)))
			if($_oddout != "." || ($_oddout == "." && @is_dir($_dir . "/" . $filename)))
	       		$files[]=$filename;
	@closedir($handle);
	return $files;
}

function getValueId($_database,$_column,$_value,$_canBeNumeric=true,$_maxlength=null)
{
	if(!$_canBeNumeric && is_numeric($_value))
		return $_value;
		
	if($_maxlength != null && strlen($_value) > $_maxlength)
		$_value = substr($_value,0,$_maxlength);

	queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.$_database."` (`id`, `".$_column."`) VALUES (NULL, '".DBManager::RealEscape($_value)."');");
	$row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.$_database."` WHERE `".$_column."`='".DBManager::RealEscape($_value)."';"));
	
	if(is_numeric($row["id"]) || $_value == "INVALID_DATA")
		return $row["id"];
	else
		return getValueId($_database,$_column,"INVALID_DATA",$_canBeNumeric,$_maxlength);
}

function getIdValue($_database,$_column,$_id,$_unknown=false,$_returnIdOnFailure=false)
{
	$row = DBManager::FetchArray(queryDB(true,"SELECT `".$_column."` FROM `".DB_PREFIX.$_database."` WHERE `id`='".DBManager::RealEscape($_id)."' LIMIT 1;"));
	if($_unknown && empty($row[$_column]))
		return "<!--lang_stats_unknown-->";
    else if($_returnIdOnFailure && empty($row[$_column]))
        return $_id;
	return $row[$_column];
}

function jokerCompare($_template,$_comparer)
{
	if($_template=="*")
		return true;
		
	$spacer = md5(rand());
	$_template = str_replace("?",$spacer,strtolower($_template));
	$_comparer = str_replace("?",$spacer,strtolower($_comparer));
	$_template = str_replace("*","(.*)",$_template);
	return (preg_match("(".$spacer.$_template.$spacer.")",$spacer.$_comparer.$spacer)>0);
}

function processResource($_userId,$_resId,$_value,$_type,$_title,$_disc,$_parentId,$_rank,$_size=0,$_tags="")
{
	if($_size == 0)
		$_size = strlen($_title);

	$result = queryDB(true,"SELECT `id`,`value` FROM `".DB_PREFIX.DATABASE_RESOURCES."` WHERE `id`='".DBManager::RealEscape($_resId)."'");
	if(DBManager::GetRowCount($result) == 0)
    {
        if(!$_disc)
            queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_RESOURCES."` (`id`,`owner`,`editor`,`value`,`edited`,`title`,`created`,`type`,`discarded`,`parentid`,`rank`,`size`,`tags`) VALUES ('".DBManager::RealEscape($_resId)."','".DBManager::RealEscape($_userId)."','".DBManager::RealEscape($_userId)."','".DBManager::RealEscape($_value)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($_title)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($_type)."',".intval(0).",'".DBManager::RealEscape($_parentId)."','".DBManager::RealEscape($_rank)."','".DBManager::RealEscape($_size)."','".DBManager::RealEscape($_tags)."')");
    }
    else
	{
		$row = DBManager::FetchArray($result);
		queryDB(true,$result = "UPDATE `".DB_PREFIX.DATABASE_RESOURCES."` SET `value`='".DBManager::RealEscape($_value)."',`editor`='".DBManager::RealEscape($_userId)."',`tags`='".DBManager::RealEscape($_tags)."',`title`='".DBManager::RealEscape($_title)."',`edited`=".intval(time()).",`discarded`='".DBManager::RealEscape(parseBool($_disc,false))."',`parentid`='".DBManager::RealEscape($_parentId)."',`rank`='".DBManager::RealEscape($_rank)."',`size`='".DBManager::RealEscape($_size)."' WHERE id='".DBManager::RealEscape($_resId)."' LIMIT 1");
		if(!empty($_disc) && ($_type == RESOURCE_TYPE_FILE_INTERNAL || $_type == RESOURCE_TYPE_FILE_EXTERNAL) && @file_exists("./uploads/" . $row["value"]) && strpos($row["value"],"..")===false)
			@unlink("./uploads/" . $row["value"]);
	}
}

function getBrowserLocalization($country = "")
{
	global $LANGUAGES,$COUNTRIES;
	initData(array("LANGUAGES","COUNTRIES"));
	$base = @$_SERVER["HTTP_ACCEPT_LANGUAGE"];
	
	$language = str_replace(array(",","_"," "),array(";","-",""),((!empty($_GET[GET_EXTERN_USER_LANGUAGE])) ? strtoupper(base64UrlDecode($_GET[GET_EXTERN_USER_LANGUAGE])) : ((!empty($base)) ? strtoupper($base) : "")));
	if(strlen($language) > 5 || strpos($language,";") !== false)
	{
		$parts = explode(";",$language);
		if(count($parts) > 0)
			$language = $parts[0];
		else
			$language = substr($language,0,5);
	}
	if(strlen($language) >= 2)
	{
		$parts = explode("-",$language);
		if(!isset($LANGUAGES[$language]))
		{
			$language = $parts[0];
			if(!isset($LANGUAGES[$language]))
				$language = "";
		}
		if(count($parts)>1 && isset($COUNTRIES[$parts[1]]))
			$country = $parts[1];
	}
	else if(strlen($language) < 2)
		$language = "";
	return array($language,$country);
}

function createFileBaseFolders($_owner,$_internal)
{
	if($_internal)
	{
		processResource($_owner,3,"%%_Files_%%",0,"%%_Files_%%",0,1,1);
		processResource($_owner,4,"%%_Internal_%%",0,"%%_Internal_%%",0,3,2);
	}
	else
	{
		processResource($_owner,3,"%%_Files_%%",0,"%%_Files_%%",0,1,1);
		processResource($_owner,5,"%%_External_%%",0,"%%_External_%%",0,3,2);
	}
}

function getSystemTimezone()
{
	global $CONFIG;
	
	if(!empty($CONFIG["gl_tizo"]))
		return $CONFIG["gl_tizo"];

    $iTime = time();
    $arr = @localtime($iTime);
    $arr[5] += 1900;
    $arr[4]++;
	
	if(!empty($arr[8]))
		$arr[2]--;

    $iTztime = @gmmktime($arr[2], $arr[1], $arr[0], $arr[4], $arr[3], $arr[5]);
    $offset = doubleval(($iTztime-$iTime)/(60*60));
    $zonelist =
    array
    (
        'Kwajalein' => -12.00,
        'Pacific/Midway' => -11.00,
        'Pacific/Honolulu' => -10.00,
        'America/Anchorage' => -9.00,
        'America/Los_Angeles' => -8.00,
        'America/Denver' => -7.00,
        'America/Tegucigalpa' => -6.00,
        'America/New_York' => -5.00,
        'America/Bogota' => -5.00,
        'America/Caracas' => -4.30,
        'America/Halifax' => -4.00,
        'America/St_Johns' => -3.30,
        'America/Argentina/Buenos_Aires' => -3.00,
        'America/Sao_Paulo' => -3.00,
        'Atlantic/South_Georgia' => -2.00,
        'Atlantic/Azores' => -1.00,
        'Europe/Dublin' => 0,
        'Europe/Belgrade' => 1.00,
        'Europe/Minsk' => 2.00,
        'Asia/Kuwait' => 3.00,
        'Asia/Tehran' => 3.30,
        'Asia/Muscat' => 4.00,
        'Asia/Yekaterinburg' => 5.00,
        'Asia/Kolkata' => 5.30,
        'Asia/Katmandu' => 5.45,
        'Asia/Dhaka' => 6.00,
        'Asia/Rangoon' => 6.30,
        'Asia/Krasnoyarsk' => 7.00,
        'Asia/Brunei' => 8.00,
        'Asia/Seoul' => 9.00,
        'Australia/Darwin' => 9.30,
        'Australia/Canberra' => 10.00,
        'Asia/Magadan' => 11.00,
        'Pacific/Fiji' => 12.00,
        'Pacific/Tongatapu' => 13.00
    );
    $index = array_keys($zonelist, $offset);
    if(sizeof($index)!=1)
        return false;
    return $index[0];
}

function isnull($_var)
{
	return empty($_var);
}

function isint($_int)
{
    return (preg_match( '/^\d*$/'  , $_int) == 1);
}

function getObjectId($_field,$_database)
{
	$result = queryDB(true,"SELECT `".$_field."`,(SELECT MAX(`id`) FROM `".DB_PREFIX.$_database."`) as `used_".$_field."` FROM `".DB_PREFIX.DATABASE_INFO."`");
	$row = DBManager::FetchArray($result);
	$max = max($row[$_field],$row["used_" . $_field]);
	$tid = $max+1;
	queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_INFO."` SET `".$_field."`='".DBManager::RealEscape($tid)."';");
	return $tid;
}

function formatTimeSpan($_seconds,$_negative=false)
{
	if($_seconds < 0)
	{
		$_negative = true;
		$_seconds *= -1;
	}
	
	$days = floor($_seconds / 86400);
	$_seconds = $_seconds - ($days * 86400);
	$hours = floor($_seconds / 3600);
	$_seconds = $_seconds - ($hours * 3600);
	$minutes = floor($_seconds / 60);
	$_seconds = $_seconds - ($minutes * 60);
	
	$string = "";
	if($days > 0)$string .= $days.".";
	if($hours >= 10)$string .= $hours.":";
	else if($hours < 10)$string .= "0".$hours.":";
	if($minutes >= 10)$string .= $minutes.":";
	else if($minutes < 10)$string .= "0".$minutes.":";
	if($_seconds >= 10)$string .= $_seconds;
	else if($_seconds < 10)$string .= "0".$_seconds;
	
	if($_negative)
		return "-" . $string;
	return $string;
}

function GetUniqueMessageTime($_database,$_column)
{
    $time = time();
    while(true)
    {
        $result=queryDB(true,"SELECT `".$_column."` FROM `".DB_PREFIX.$_database."` WHERE `".$_column."`=".DBManager::RealEscape($time).";");
        if(DBManager::GetRowCount($result) > 0)
            $time++;
        else
            break;
    }
    return $time;
}

function hexDarker($_color,$_change=30,$rgb="")
{
    $_color = str_replace("#", "", $_color);
    if(strlen($_color) != 6)
        return "#000000";
    for ($x=0;$x<3;$x++)
    {
        $c = hexdec(substr($_color,(2*$x),2)) - $_change;
        $c = ($c < 0) ? 0 : dechex($c);
        $rgb .= (strlen($c) < 2) ? "0".$c : $c;
    }
    return "#".$rgb;
}

function sendPushMessages()
{
    global $CONFIG;
    if(!empty($CONFIG["gl_mpm"]) && DB_CONNECTION && defined("IS_PUSH_MESSAGE"))
    {
        $count=0;
        $result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` WHERE `sent`=0 ORDER BY `created` ASC LIMIT 10;");
        if($result)
        {
            $data = array();
            while($row = @DBManager::FetchArray($result))
                $data = array_merge($data,array('p_app_os_' . $count => $row["device_os"], 'p_device_id_' . $count => $row["device_id"], 'p_message_type_' . $count => $row["push_key"], 'p_message_' . $count => base64UrlEncode($row["push_value"]), 'p_chatpartner_id_' . $count => $row["chat_partner_id"], 'p_chat_id_' . $count++ => $row["chat_id"]));

            queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` SET `sent`=1 ORDER BY `created` ASC LIMIT 10;");
            if(!empty($data))
            {
                $opts = array('http' => array('method'  => 'POST','header'  => 'Content-type: application/x-www-form-urlencoded','content' => http_build_query($data)));
                $context  = stream_context_create($opts);
                $result = file_get_contents(CONFIG_LIVEZILLA_PUSH, false, $context);
                if($result!=="1")
                    handleError("116", " Push Message Error: " . $result,CONFIG_LIVEZILLA_PUSH,0);
            }
        }
    }
}

function disableMagicQuotes()
{
    if (function_exists("get_magic_quotes_gpc") && get_magic_quotes_gpc())
    {
        $process = array(&$_GET, &$_POST, &$_COOKIE, &$_REQUEST);
        while (list($key, $val) = each($process)) {
            foreach ($val as $k => $v) {
                unset($process[$key][$k]);
                if (is_array($v)) {
                    $process[$key][stripslashes($k)] = $v;
                    $process[] = &$process[$key][stripslashes($k)];
                } else {
                    $process[$key][stripslashes($k)] = stripslashes($v);
                }
            }
        }
        unset($process);
    }
}

function getBrightness($hex)
{
    $hex = str_replace('#', '', $hex);
    $c_r = hexdec(substr($hex, 0, 2));
    $c_g = hexdec(substr($hex, 2, 2));
    $c_b = hexdec(substr($hex, 4, 2));
    $val = (($c_r * 299) + ($c_g * 587) + ($c_b * 114)) / 1000;
    return $val;
}

function defineURL($_file)
{
    global $CONFIG;
    if(!empty($_SERVER['REQUEST_URI']) && !empty($CONFIG["gl_root"]))
    {
        $parts = parse_url($_SERVER['REQUEST_URI']);
        $host = $CONFIG["gl_host"];
        $path = @$parts["path"];
    }
    else
    {
        $host = @$_SERVER["HTTP_HOST"];
        $path = $_SERVER["PHP_SELF"];
    }
    if(!empty($path) && !endsWith(strtolower($path),strtolower($_file)) && strpos(strtolower($path),strtolower($_file)) !== false)
        exit("err 888383");

    define("LIVEZILLA_URL",getScheme() . $host . str_replace($_file,"",htmlentities($path,ENT_QUOTES,"UTF-8")));
}

function requireDynamic($_file,$_trustedFolder)
{
    global $CONFIG, $_CONFIG, $LZLANG; // ++
    if(strpos($_file, "..") !== false && strpos(LIVEZILLA_PATH, "..") === false)
        return false;

    if(strpos(realpath($_file),realpath($_trustedFolder)) !== 0)
        return false;

    if(file_exists($_file))
    {
        require($_file);
        return true;
    }
    return false;
}

function getIdent()
{
    if(isset($_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID]))
        return getOParam(POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32,false,false);
    else if(isset($_GET[GET_TRACK_BROWSERID]))
        return getOParam(GET_TRACK_BROWSERID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
    else if(isset($_POST[POST_EXTERN_USER_BROWSERID]))
        return getOParam(POST_EXTERN_USER_BROWSERID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
    return "";
}

function getRuntime($_token=null)
{
    global $RUDB;
    if($_token==null)
    {
        $_token = getId(10);
        $RUDB[$_token] = microtime(true);
        return $_token;
    }
    else
    {
        $time_end = microtime(true);
        return $execution_time = ($time_end - $RUDB[$_token]);
    }

}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }
    return (substr($haystack, -$length) === $needle);
}

function parseURL($_string)
{
    return preg_replace('%(https?|ftp)://([-A-Z0-9./_*?&;=#]+)%i','<a target="blank" href="$0" target="_blank">$0</a>', $_string);
}

disableMagicQuotes();
loadConfig();
?>
