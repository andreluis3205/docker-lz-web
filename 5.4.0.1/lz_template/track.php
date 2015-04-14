<?php
/****************************************************************************************
* LiveZilla track.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
require(LIVEZILLA_PATH . "_lib/functions.tracking.inc.php");

if(!getAvailability())
    abortTracking(2);

define("JAVASCRIPT",!(isset($_GET[GET_TRACK_OUTPUT_TYPE]) && $_GET[GET_TRACK_OUTPUT_TYPE] == "nojcrpt") && strpos($_SERVER["QUERY_STRING"],"nojcrpt") === false);

if(!empty($_GET[GET_TRACK_USERID]))
{
	define("CALLER_BROWSER_ID",Visitor::IDValidate(getOParam(GET_TRACK_BROWSERID,"")));
	define("CALLER_USER_ID",Visitor::IDValidate(getOParam(GET_TRACK_USERID,"")));
}
else if(!isnull(getCookieValue("userid")))
{
	define("CALLER_BROWSER_ID",Visitor::IDValidate());
	define("CALLER_USER_ID",Visitor::IDValidate(getCookieValue("userid")));
}

if(!defined("CALLER_USER_ID"))
{
	if(!JAVASCRIPT)
	{
		define("CALLER_USER_ID",substr(md5(getIP()),0,USER_ID_LENGTH));
		define("CALLER_BROWSER_ID",substr(strrev(md5(getIP())),0,USER_ID_LENGTH));
	}
	else
	{
		define("CALLER_USER_ID",Visitor::IDValidate());
		define("CALLER_BROWSER_ID",Visitor::IDValidate());
	}
}

if(getCookieValue("userid") != CALLER_USER_ID)
    setCookieValue("userid",CALLER_USER_ID);

$EXTERNALUSER = Visitor::FromCache(CALLER_USER_ID);
$EXTERNALUSER->AppendPersonalData();

if(empty($EXTERNALUSER->Host) && $EXTERNALUSER->FirstCall)
    $EXTERNALUSER->ResolveHost();

$detector = new DeviceDetector();
$detector->DetectBrowser($EXTERNALUSER->Host);
$MobileDetect = $detector->DetectOperatingSystem($EXTERNALUSER->Host);
$isMobile = $MobileDetect->isMobile();
$isTablet = $MobileDetect->isTablet();

if(!empty($_GET["ovlc"]) && empty($_GET["prv"]) && $detector->BrowserName == "Internet Explorer")
{
    if($detector->BrowserVersion <= 6)
        unset($_GET["ovlc"]);
    else if($detector->BrowserVersion < 9)
        $_GET["ovloe"] = true;
}

$openChatExternal = !empty($_GET["ovloe"]) || ((!empty($CONFIG["gl_moce"]) && $isMobile));
$openTicketExternal = $openChatExternal;
$monitoringActive = !empty($CONFIG["gl_vmac"]) || !empty($_GET["ovlc"]) || !empty($_GET["fbpos"]);

if(isset($_GET[GET_TRACK_OUTPUT_TYPE]) && ($_GET[GET_TRACK_OUTPUT_TYPE] == "jscript" || $_GET[GET_TRACK_OUTPUT_TYPE] == "jcrpt"))
{
	$fullname = base64UrlEncode($EXTERNALUSER->Fullname);
	$email = base64UrlEncode($EXTERNALUSER->Email);
	$company = base64UrlEncode($EXTERNALUSER->Company);
	$question = base64UrlEncode($EXTERNALUSER->Question);
	$phone = base64UrlEncode($EXTERNALUSER->Phone);
	$customs = array();

	if(empty($_GET[GET_TRACK_NO_SEARCH_ENGINE]))
		exit(getFile(TEMPLATE_HTML_SUPPORT));
		
	$row = $EXTERNALUSER->CreateSignature();
	if(is_array($row) && $row["id"] != CALLER_USER_ID)
		$EXTERNALUSER->UserId = $row["id"];

	$TRACKINGSCRIPT = getFile(TEMPLATE_SCRIPT_TRACK);
	$TRACKINGSCRIPT = str_replace("<!--file_chat-->",FILE_CHAT,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--server_id-->",substr(md5($CONFIG["gl_lzid"]),5,5),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--server-->",LIVEZILLA_URL,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--website-->",base64UrlEncode(getOParam("ws","",$nu,null,null,255)),$TRACKINGSCRIPT);
    $TRACKINGSCRIPT = str_replace("<!--area_code-->",getOParam(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255,false,false),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--browser_id-->",htmlentities(CALLER_BROWSER_ID,ENT_QUOTES,"UTF-8"),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_id-->",htmlentities($EXTERNALUSER->UserId,ENT_QUOTES,"UTF-8"),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--connection_error_span-->",CONNECTION_ERROR_SPAN,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--poll_frequency-->",getMonitoringPollFrequency(false,false),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = geoReplacements($TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--geo_resolute-->",parseBool($EXTERNALUSER->UserId == CALLER_USER_ID && !empty($CONFIG["gl_use_ngl"]) && $EXTERNALUSER->FirstCall && !empty($CONFIG["gl_pr_ngl"]) && !(!isnull(getCookieValue("geo_data")) && getCookieValue("geo_data") > time()-2592000) && !isSSpanFile()),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--alert_html-->",base64_encode(getAlertTemplate()),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_company-->",$company,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_question-->",$question,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_phone-->",$phone,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_language-->",getOParam(GET_EXTERN_USER_LANGUAGE,"",$nu,null,null,5,true,true,true,true),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_header-->",getOParam(GET_EXTERN_USER_HEADER,"",$nu,FILTER_SANITIZE_URL,null,0,true,true,true,true),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_customs-->",getJSCustomArray("",$customs),$TRACKINGSCRIPT);
    $TRACKINGSCRIPT = str_replace("<!--is_mobile-->",parseBool($isMobile),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--is_ie-->",parseBool($detector->BrowserName == "Internet Explorer"),$TRACKINGSCRIPT);
    $TRACKINGSCRIPT = str_replace("<!--direct_login-->",parseBool(!empty($_GET["dl"])),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--is_ovlpos-->",parseBool(($detector->BrowserName != "Internet Explorer" || $detector->BrowserVersion > 6)),$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--is_ovlc-->",parseBool(!empty($_GET["ovlc"])),$TRACKINGSCRIPT);
	
	if(!empty($_GET["ovlc"]) && strlen(base64UrlDecode($_GET["ovlc"])) == 7)
	{
        if(!(!empty($_GET["ovlhm"]) && ($isMobile||$isTablet)))
        {
            require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
            $TRACKINGSCRIPT .= getFile(TEMPLATE_SCRIPT_OVERLAY_CHAT);
            $TRACKINGSCRIPT = str_replace("<!--def_trans_into-->",$CONFIG["gl_default_language"],$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--header_offline-->",base64_encode(getOParam("ovlto",$LZLANG["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--header_online-->",base64_encode(getOParam("ovlt",$LZLANG["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
            $color = getBrightness(base64UrlDecode($_GET["ovlc"])) > getBrightness(base64UrlDecode($_GET["ovlct"])) ? $_GET["ovlct"] : $_GET["ovlc"];
            $TRACKINGSCRIPT = str_replace("<!--color-->",hexDarker(str_replace("#","",base64UrlDecode($color)),50),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--tickets_external-->",parseBool($openTicketExternal),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--chats_external-->",parseBool($openChatExternal),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--offline_message_mode-->",$CONFIG["gl_om_mode"],$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--offline_message_http-->",$CONFIG["gl_om_http"],$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--post_html-->",base64_encode(str_replace("<!--color-->","#000000",str_replace("<!--lang_client_edit-->",strtoupper($LZLANG["client_edit"]),getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_EXTERN)))),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--add_html-->",base64_encode(getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_ADD)),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--offline_message_pop-->",parseBool(!empty($CONFIG["gl_om_pop_up"])),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--ec_t-->",$eca=getOParam("eca",0,$nu,FILTER_VALIDATE_INT),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--gtv2_api_key-->",((strlen($CONFIG["gl_otrs"])>1) ? base64_encode($CONFIG["gl_otrs"]) : ""),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--no_ticket_when_online-->",parseBool(!empty($_GET["ovlntwo"])),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--shadow-->",parseBool(!empty($_GET["ovlsc"])),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--shadowx-->",getOParam("ovlsx",0,$nu,FILTER_SANITIZE_NUMBER_INT),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--shadowy-->",getOParam("ovlsy",0,$nu,FILTER_SANITIZE_NUMBER_INT),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--shadowb-->",getOParam("ovlsb",0,$nu,FILTER_SANITIZE_NUMBER_INT),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--shadowc-->",getOParam("ovlsc",0,$nu,FILTER_SANITIZE_SPECIAL_CHARS),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--hide_group_select_chat-->",parseBool(getOParam("hcgs",0,$nu,FILTER_VALIDATE_INT)=="1"),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--hide_group_select_ticket-->",parseBool(getOParam("htgs",0,$nu,FILTER_VALIDATE_INT)=="1"),$TRACKINGSCRIPT);
            $TRACKINGSCRIPT = str_replace("<!--require_group_selection-->",parseBool(getOParam("rgs",0,$nu,FILTER_VALIDATE_INT)=="1"),$TRACKINGSCRIPT);

            if($eca==1)
            {
                $TRACKINGSCRIPT = str_replace("<!--ec_header_text-->",base64UrlEncode(getOParam("echt",@$LZLANG["client_ec_text"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
                $TRACKINGSCRIPT = str_replace("<!--ec_header_sub_text-->",base64UrlEncode(getOParam("echst",@$LZLANG["client_ec_sub_text"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
                $TRACKINGSCRIPT = str_replace("<!--ec_o_header_text-->",base64UrlEncode(getOParam("ecoht",@$LZLANG["client_ec_o_text"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
                $TRACKINGSCRIPT = str_replace("<!--ec_o_header_sub_text-->",base64UrlEncode(getOParam("ecohst",@$LZLANG["client_ec_o_sub_text"],$c,FILTER_HTML_ENTITIES)),$TRACKINGSCRIPT);
            }
            else if($eca==2)
            {
                $TRACKINGSCRIPT = str_replace("<!--ec_image-->",base64UrlEncode(getOParam("eci","",$nu,FILTER_SANITIZE_URL)),$TRACKINGSCRIPT);
                $TRACKINGSCRIPT = str_replace("<!--ec_o_image-->",base64UrlEncode(getOParam("ecio","",$nu,FILTER_SANITIZE_URL)),$TRACKINGSCRIPT);
            }

            $ov = VisitorChat::FromCache($EXTERNALUSER->UserId,$EXTERNALUSER->UserId . "_OVL");
            if(!empty($ov->Fullname))
                $fullname = base64UrlEncode($ov->Fullname);
            if(!empty($ov->Email))
                $email = base64UrlEncode($ov->Email);
            $TRACKINGSCRIPT = applyReplacements($TRACKINGSCRIPT,true,false);
        }
	}

	$TRACKINGSCRIPT = str_replace("<!--user_name-->",$fullname,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--user_email-->",$email,$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--height-->",$CONFIG["wcl_window_height"],$TRACKINGSCRIPT);
	$TRACKINGSCRIPT = str_replace("<!--width-->",$CONFIG["wcl_window_width"],$TRACKINGSCRIPT);
    $TRACKINGSCRIPT = str_replace("<!--get_track_params-->",getParams("",array("ws"=>true,"ecsgs"=>true,"ecsge"=>true,"ecsc"=>true,"ecsy"=>true,"ecsx"=>true,"ecsb"=>true,"ecsa"=>true,"ecslw"=>true,"echc"=>true,"ecfs"=>true,"ecfe"=>true,"echt"=>true,"echst"=>true,"ecoht"=>true,"ecohst"=>true,"ovlto"=>true,"ovlt"=>true,"ovlp"=>true,"ovlml"=>true,"ovlmr"=>true,"ovlmt"=>true,"ovlmb"=>true,"ovls"=>true,"ovloo"=>true,"ovlc"=>true,"ovlapo"=>true,"ovlct"=>true,"ovlntwo"=>true,GET_EXTERN_GROUP=>true,"intid"=>true,"pref"=>true,"cboo"=>true,"hg"=>true,"fbpos"=>false,"fbw"=>false,"fbh"=>false,"fbshx"=>false,"fbshy"=>false,"fbshb"=>false,"fbshc"=>false,"fbmt"=>false,"fbmr"=>false,"fbmb"=>false,"fbml"=>false,"fboo"=>false,"eca"=>true,"ecw"=>true,"ech"=>true,"echm"=>true,"ecmb"=>true,"ecfi"=>true,"ecfo"=>true,"ecml"=>true,"cf0"=>true,"cf1"=>true,"cf2"=>true,"cf3"=>true,"cf4"=>true,"cf5"=>true,"cf6"=>true,"cf7"=>true,"cf8"=>true,"cf9"=>true)),$TRACKINGSCRIPT);
    $TRACKINGSCRIPT = str_replace("<!--server-->",LIVEZILLA_URL,$TRACKINGSCRIPT);
}
else
{
	$TRACKINGSCRIPT = "lz_tracking_set_sessid(\"".base64_encode(CALLER_USER_ID)."\",\"".base64_encode(CALLER_BROWSER_ID)."\");";
	if(BaseURL::IsInputURL() && strpos(BaseURL::GetInputURL(),GET_INTERN_COBROWSE) !== false)
		abortTracking(1);

	$BROWSER = VisitorBrowser::FromCache(CALLER_USER_ID,CALLER_BROWSER_ID);
    $EXTERNALUSER->AddBrowser($BROWSER);

	if($EXTERNALUSER->FirstCall && !$BROWSER->GetFirstCall())
		$EXTERNALUSER->FirstCall = false;

	initData(array("FILTERS","EVENTS"));

	define("IS_FILTERED",$FILTERS->Match(getIP(),formLanguages(((!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"])) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "")),CALLER_USER_ID, $EXTERNALUSER->GeoCountryISO2));
	define("IS_FLOOD",$BROWSER->GetFirstCall() && Filter::IsFlood(getIP(),CALLER_USER_ID));

    initData(array("INTERNAL"));

    if((IS_FILTERED && !FILTER_ALLOW_TRACKING) || IS_FLOOD || !empty($_GET["deactr"]) || getCookieValue(OO_TRACKING_FILTER_NAME) != null)
    {
        if(!IS_FILTERED)
            Filter::Create($_SERVER["REMOTE_ADDR"],CALLER_USER_ID,OO_TRACKING_FILTER_NAME,((isset($_GET["deactr"]) && is_int($_GET["deactr"])) ? $_GET["deactr"] : 365),true,true);

        $monitoringActive=false;
        abortTracking(556);
    }

	$BROWSER->Customs = getCustomArray($BROWSER->Customs);

	if($INPUTS[111]->IsServerInput())
		$BROWSER->Fullname = cutString($INPUTS[111]->GetServerInput(),255);
	else if($INPUTS[111]->Cookie)
		$BROWSER->Fullname = getCookieValue("form_111");

	if($INPUTS[112]->IsServerInput())
		$BROWSER->Email = cutString($INPUTS[112]->GetServerInput(),255);
	else if($INPUTS[112]->Cookie)
		$BROWSER->Email = getCookieValue("form_112");
		
	if($INPUTS[113]->IsServerInput())
		$BROWSER->Company = cutString($INPUTS[113]->GetServerInput(),255);
	else if($INPUTS[113]->Cookie)
		$BROWSER->Company = getCookieValue("form_113");
		
	if($INPUTS[114]->IsServerInput())
		$BROWSER->Question = $INPUTS[114]->GetServerInput();
	else if(isset($INPUTS[114]->Cookie) && $INPUTS[114]->Cookie)
		$BROWSER->Question = getCookieValue("form_114");
		
	if($INPUTS[116]->IsServerInput())
		$BROWSER->Phone = $INPUTS[116]->GetServerInput();
	else if(isset($INPUTS[116]->Cookie) && $INPUTS[116]->Cookie)
		$BROWSER->Phone = getCookieValue("form_116");

	if(JAVASCRIPT)
	{
		if(isset($_GET["pc"]) && is_numeric($_GET["pc"]))
		{
            if($_GET["pc"]<=3)
            {
                if(!BaseURL::IsInputURL())
                    abortTracking(3);

                $currentURL = new HistoryURL(BaseURl::GetInputURL(),getOParam(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255),getOParam(GET_EXTERN_DOCUMENT_TITLE,"",$nu,null,null,255),getOParam(GET_TRACK_REFERRER,"",$nu,FILTER_SANITIZE_URL,null,510),time());

                if($currentURL->Referrer->IsInternalDomain())
                    $currentURL->Referrer = new BaseUrl("");

                if($currentURL->Url->Excluded)
                    abortTracking(4);
            }

            if($monitoringActive)
                //if(isset($_GET[GET_TRACK_TIMEZONE_OFFSET]))
                    $EXTERNALUSER->Save($CONFIG,array(getOParam(GET_TRACK_RESOLUTION_WIDTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(GET_TRACK_RESOLUTION_HEIGHT,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32)),getOParam(GET_TRACK_COLOR_DEPTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(GET_TRACK_TIMEZONE_OFFSET,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(GEO_LATITUDE,-522,$nu,FILTER_VALIDATE_FLOAT,array(),0,true,false),getOParam(GEO_LONGITUDE,-522,$nu,FILTER_VALIDATE_FLOAT,array(),0,true,false),getOParam(GEO_COUNTRY_ISO_2,"",$nu,null,null,32,true,false),getOParam(GEO_CITY,"",$nu,null,null,255,true,false),getOParam(GEO_REGION,"",$nu,null,null,255,true,false),getOParam(GEO_TIMEZONE,"",$nu,null,null,24,true,false),getOParam(GEO_ISP,"",$nu,null,null,255,true,false),getOParam(GEO_SSPAN,0,$nu,FILTER_VALIDATE_INT,array(),0,false,false),getOParam(GEO_RESULT_ID,"",$nu,FILTER_VALIDATE_INT,array(),32,false,false));
        }
	}
	else if(!empty($_SERVER["HTTP_REFERER"]))
	{
		$currentURL = new HistoryURL(getOParam("HTTP_REFERER","",$nu,FILTER_SANITIZE_URL,null,500),getOParam(GET_TRACK_SPECIAL_AREA_CODE,"",$nu,null,null,255),"","",time());
        if($currentURL->Url->Excluded)
			abortTracking(5);
		else if(!$currentURL->Url->IsInternalDomain())
			abortTracking(6);
        if($monitoringActive)
            $EXTERNALUSER->Save($CONFIG,null,"","",-522,-522,"","","","","","","",false);
    }
	else
		abortTracking(-1);

	if($EXTERNALUSER->IsCrawler)
		abortTracking(8);
	else if($EXTERNALUSER->SignatureMismatch)
	{
		$TRACKINGSCRIPT = "lz_tracking_set_sessid(\"".base64_encode($EXTERNALUSER->UserId)."\",\"".base64_encode(CALLER_BROWSER_ID)."\");";
		$TRACKINGSCRIPT .= "lz_tracking_callback(5);";
		$TRACKINGSCRIPT .= "lz_tracking_poll_server();";
	}
	else
	{
		if(isset($_GET[GET_TRACK_CLOSE_CHAT_WINDOW]))
		{
			$chat = VisitorChat::FromCache($EXTERNALUSER->UserId,$_GET[GET_TRACK_CLOSE_CHAT_WINDOW]);
			$chat->ExternalClose();
			$chat->Destroy();
		}
		$BROWSER->LastActive = time();
		$BROWSER->VisitId = $EXTERNALUSER->VisitId;
		
		$parameters = getTargetParameters(false);
		$conline = operatorsAvailable(0,$parameters["exclude"],$parameters["include_group"],$parameters["include_user"],false) > 0;

		$BROWSER->OverlayContainer = !empty($_GET["ovlc"]);

        if($monitoringActive)
            $BROWSER->Save();

		if(isset($currentURL) && (count($BROWSER->History) == 0 || (count($BROWSER->History) > 0 && $BROWSER->History[count($BROWSER->History)-1]->Url->GetAbsoluteUrl() != $currentURL->Url->GetAbsoluteUrl())))
		{
			$BROWSER->History[] = $currentURL;
			if(!isnull($BROWSER->History[count($BROWSER->History)-1]->Referrer->GetAbsoluteUrl()))
				if($BROWSER->SetQuery($BROWSER->History[count($BROWSER->History)-1]->Referrer->GetAbsoluteUrl()))
					$BROWSER->History[count($BROWSER->History)-1]->Referrer->MarkSearchEngine();
					
				if($monitoringActive)
				{
					$BROWSER->History[count($BROWSER->History)-1]->Save(CALLER_BROWSER_ID,count($BROWSER->History)==1);
					$BROWSER->ForceUpdate();
				}
		}
		else if(count($BROWSER->History) == 0)
			abortTracking(11);

		$BROWSER->LoadWebsitePush();
        $EXTERNALUSER->LoadChatRequests();
		$BROWSER->LoadAlerts();
		$BROWSER->LoadOverlayBoxes();
		
		$TRACKINGSCRIPT .= triggerEvents();
		$TRACKINGSCRIPT .= processActions("",$openChatExternal);

		$ACTIVE_OVLC = false;
		if(!empty($_GET["fbpos"]) && !empty($_GET["fbw"]) && is_numeric(base64UrlDecode($_GET["fbw"])))
		{
			$shadow=(!empty($_GET["fbshx"])) ? ("true,".base64UrlDecode($_GET["fbshb"]).",".base64UrlDecode($_GET["fbshx"]).",".base64UrlDecode($_GET["fbshy"]).",'".base64UrlDecode($_GET["fbshc"])."'") : "false,0,0,0,''";
			$margin=(!empty($_GET["fbmt"])) ? (",".base64UrlDecode($_GET["fbml"]).",".base64UrlDecode($_GET["fbmt"]).",".base64UrlDecode($_GET["fbmr"]).",".base64UrlDecode($_GET["fbmb"])) : ",0,0,0,0";

            if(!(!$conline && !empty($_GET["fboo"])))
				$TRACKINGSCRIPT .= "lz_tracking_add_floating_button(".base64UrlDecode($_GET["fbpos"]).",".$shadow.$margin.",".base64UrlDecode($_GET["fbw"]).",".base64UrlDecode($_GET["fbh"]).");";
		}
		if(!empty($_GET["ovlc"]) && strlen(base64UrlDecode($_GET["ovlc"])) == 7)
		{
			require(LIVEZILLA_PATH . "ovl.php");
			$TRACKINGSCRIPT .= @$OVLPAGE;
		}

		if(!empty($_GET["cboo"]) && !operatorsAvailable(0,$parameters["exclude"],$parameters["include_group"],$parameters["include_user"],false))
			$TRACKINGSCRIPT .= "lz_tracking_remove_buttons();";

		$hidevisitor = (empty($CONFIG["gl_vmac"]) || (!empty($CONFIG["gl_hide_inactive"]) && !$EXTERNALUSER->IsActivity($BROWSER)));

        if(!empty($_SERVER['HTTP_DNT']) && $CONFIG["gl_dnt"] && empty($_GET["ovlc"]))
        {
            $BROWSER->Destroy();
            $TRACKINGSCRIPT .= "lz_tracking_stop_tracking(10);";
        }

        if($monitoringActive || !empty($ACTIVE_OVLC))
		{
			if(IS_FLOOD)
            {
                $BROWSER->Destroy();
                abortTracking(14);
            }

            if(!empty($_GET["ovlc"]))
                $TRACKINGSCRIPT .= "lz_tracking_callback(" . getMonitoringPollFrequency($EXTERNALUSER->IsInChat(true),$EXTERNALUSER->IsInChat(false)) . ");";
            else
                $TRACKINGSCRIPT .= "lz_tracking_callback(" . getMonitoringPollFrequency(false,false) . ");";

		}
		else
		{
            $TRACKINGSCRIPT .= "lz_tracking_stop_tracking(13);";
		}
	}
}
?>
