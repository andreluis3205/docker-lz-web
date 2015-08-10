<?php
/****************************************************************************************
* LiveZilla chat.php
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
	
@ini_set('session.use_cookies', '0');
@error_reporting(E_ALL);


$html = "";

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");

require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

Server::DefineURL(FILE_CHAT);
Server::InitDataProvider();
LocalizationManager::AutoLoad();

$browserId = getId(USER_ID_LENGTH);

if(!isset($_GET[GET_EXTERN_TEMPLATE]))
{
	@set_time_limit(Server::$Configuration->File["timeout_chats"]);
	if(!isset($_GET["file"]))
		@set_error_handler("handleError");

	define("SESSION",getSessionId());

	if(empty(Server::$Configuration->File["gl_om_pop_up"]) && Server::$Configuration->File["gl_om_mode"] == 1)
	{
        Server::InitDataBlock(array("INTERNAL","GROUPS","FILTERS"));
		$groupbuilder = new GroupBuilder();
		$groupbuilder->Generate();
		if(!$groupbuilder->GroupAvailable)
			exit("<html><script language=\"JavaScript\">if(typeof(window.opener != null) != 'undefined')window.opener.location = \"".Server::$Configuration->File["gl_om_http"]."\";window.close();</script></html>");
	}
	else
		Server::InitDataBlock(array("FILTERS"));

	if((isset($_POST["company"]) && !empty($_POST["company"])) || (isset($_POST["email"]) && !empty($_POST["email"])) || (isset($_POST["name"]) && !empty($_POST["name"])) || (isset($_POST["text"]) && !empty($_POST["text"])))
		exit(Filter::CreateFloodFilter(Communication::GetIP(),null));
}

header("Content-Type: text/html; charset=utf-8");
if(!isset($_GET[GET_EXTERN_TEMPLATE]))
{
	define("IS_FLOOD",Filter::IsFlood(Communication::GetIP(),null,true));
	define("IS_FILTERED",DataManager::$Filters->Match(Communication::GetIP(),LocalizationManager::ImplodeLanguages(((!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"])) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "")),SESSION));

    require(LIVEZILLA_PATH . "_lib/trdp/mobde.php");
    $MobileDetect = new Mobile_Detect();

    Server::InitDataBlock(array("INTERNAL","DBCONFIG"));
    VisitorChat::ApplyDynamicGroup();
	$html = IOStruct::GetFile(TEMPLATE_HTML_CHAT);
	$html = str_replace("<!--extern_script-->",IOStruct::GetFile(TEMPLATE_SCRIPT_EXTERN).IOStruct::GetFile(TEMPLATE_SCRIPT_DATA).IOStruct::GetFile(TEMPLATE_SCRIPT_CHAT).IOStruct::GetFile(TEMPLATE_SCRIPT_FRAME),$html);
	$html = str_replace("<!--server_id-->",substr(md5(Server::$Configuration->File["gl_lzid"]),5,5),$html);
	$html = str_replace("<!--connector_script-->",IOStruct::GetFile(TEMPLATE_SCRIPT_CONNECTOR),$html);
	$html = str_replace("<!--group_script-->",IOStruct::GetFile(TEMPLATE_SCRIPT_GROUPS),$html);
	$html = str_replace("<!--global_script-->",IOStruct::GetFile(TEMPLATE_SCRIPT_GLOBAL),$html);
	$html = str_replace("<!--browser_id-->",$browserId,$html);
	$html = str_replace("<!--extern_timeout-->",min(Server::$Configuration->File["timeout_chats"],Server::$Configuration->File["timeout_track"]),$html);
    $html = str_replace("<!--show_oib-->",To::BoolString(!empty(Server::$Configuration->File["gl_soib"]) && empty($_GET[GET_EXTERN_DYNAMIC_GROUP])),$html);
	$html = str_replace("<!--window_width-->",Server::$Configuration->File["wcl_window_width"],$html);
	$html = str_replace("<!--window_height-->",Server::$Configuration->File["wcl_window_height"],$html);
	$html = str_replace("<!--window_resize-->",To::BoolString(Server::$Configuration->File["gl_hrol"]),$html);
    $html = str_replace("<!--feedback_on_exit-->",To::BoolString(Server::$Configuration->File["gl_fboe"]),$html);
    $html = str_replace("<!--switch_to_kb-->",To::BoolString(Communication::ReadParameter("t","")=="kb" && empty($_GET["hfk"])),$html);
    $html = str_replace("<!--kb_only-->",To::BoolString(!empty($_REQUEST["kbo"])),$html);
    $html = str_replace("<!--is_small-->",To::BoolString(!empty($_GET["s"])),$html);
    $html = str_replace("<!--is_logo-->",To::BoolString(!empty(Server::$Configuration->File["gl_cali"]) || !empty(Server::$Configuration->File["gl_cahi"])),$html);
    $html = str_replace("<!--is_mobile-->",To::BoolString($MobileDetect->isMobile() && !$MobileDetect->isTablet()),$html);
    $html = str_replace("<!--ticket_file_uploads-->",To::BoolString(true),$html);
    $html = str_replace("<!--kb_suggest-->",To::BoolString(Server::$Configuration->File["gl_knbs"]),$html);
    $html = str_replace("<!--kb_query_min_length-->",intval(Server::$Configuration->File["gl_kbml"]),$html);
	$html = str_replace("<!--show_waiting_message-->",To::BoolString(strlen(Server::$Configuration->File["gl_wmes"])>0),$html);
	$html = str_replace("<!--waiting_message_time-->",Server::$Configuration->File["gl_wmes"],$html);
	$html = str_replace("<!--extern_frequency-->",Server::$Configuration->File["poll_frequency_clients"],$html);
	$html = str_replace("<!--cbcd-->",To::BoolString(Server::$Configuration->File["gl_cbcd"]),$html);
	$html = str_replace("<!--bookmark_name-->",base64_encode(Server::$Configuration->File["gl_site_name"]),$html);
	$html = str_replace("<!--user_id-->",SESSION,$html);
	$html = str_replace("<!--connection_error_span-->",CONNECTION_ERROR_SPAN,$html);
	$html = GeoTracking::Replace($html);
	$html = str_replace("<!--requested_intern_userid-->",base64_encode((!empty($_GET[GET_EXTERN_INTERN_USER_ID]) && isset(Server::$Operators[Operator::GetSystemId(Encoding::Base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID]))])) ? (Encoding::Base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID])):""),$html);
    $html = str_replace("<!--requested_intern_fullname-->",base64_encode((!empty($_GET[GET_EXTERN_INTERN_USER_ID]) && isset(Server::$Operators[Operator::GetSystemId(Encoding::Base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID]))])) ? Server::$Operators[Operator::GetSystemId(Encoding::Base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID]))]->Fullname:""),$html);
    $html = str_replace("<!--debug-->",To::BoolString(!empty($_GET["debug"])),$html);
    $html = str_replace("<!--geo_resolute-->",To::BoolString(!empty(Server::$Configuration->File["gl_use_ngl"]) && !(Cookie::Get("geo_data") != null && Cookie::Get("geo_data") > (time()-2592000)) && !GeoTracking::SpanExists()),$html);
    $html = str_replace("<!--chat_id-->",((!empty($_GET["cid"])) ? getParam("cid") : ""),$html);
	$html = str_replace("<!--gtv2_api_key-->",((strlen(Server::$Configuration->File["gl_otrs"])>1) ? Server::$Configuration->File["gl_otrs"] : ""),$html);
	$html = str_replace("<!--template_message_intern-->",base64_encode(str_replace("<!--color-->",ExternalChat::ReadBackgroundColor(),str_replace("<!--dir-->",LocalizationManager::$Direction,IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_INTERN)))),$html);
	$html = str_replace("<!--template_message_extern-->",base64_encode(str_replace("<!--dir-->",LocalizationManager::$Direction,IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_EXTERN))),$html);
	$html = str_replace("<!--template_message_add-->",base64_encode(str_replace("<!--dir-->",LocalizationManager::$Direction,IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_ADD))),$html);
	$html = str_replace("<!--template_message_add_alt-->",base64_encode(str_replace("<!--dir-->",LocalizationManager::$Direction,IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_ADD_ALTERNATE))),$html);
    $html = str_replace("<!--primary_color-->",ExternalChat::ReadBackgroundColor(),$html);
    $html = str_replace("<!--secondary_color-->",ExternalChat::ReadTextColor(),$html);
    $html = str_replace("<!--direct_login-->",To::BoolString((isset($_GET[GET_EXTERN_USER_NAME]) && !isset($_GET[GET_EXTERN_RESET])) || isset($_GET["dl"])),$html);
    $html = str_replace("<!--preselect_ticket-->",To::BoolString(isset($_GET["pt"])),$html);
    $html = str_replace("<!--is_ie-->",To::BoolString((!empty($_SERVER['HTTP_USER_AGENT']) && (strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') !== false))),$html);
    $html = str_replace("<!--is_ios-->",To::BoolString($MobileDetect->isIOS()),$html);
	$html = str_replace("<!--setup_error-->",base64_encode(buildLoginErrorField()),$html);
	$html = str_replace("<!--offline_message_mode-->",Server::$Configuration->File["gl_om_mode"],$html);
	$html = str_replace("<!--offline_message_http-->",Server::$Configuration->File["gl_om_http"],$html);
    $html = str_replace("<!--checkout_url-->",(!empty(Server::$Configuration->Database["ccpp"]["Custom"])) ? Server::$Configuration->Database["ccpp"]["Custom"]->URL : "",$html);
	$html = str_replace("<!--checkout_only-->",To::BoolString(!empty($_GET["co"]) && !empty($_GET[GET_EXTERN_GROUP])),$html);
	$html = str_replace("<!--checkout_extend_success-->",To::BoolString(!empty($_GET["co"]) && !empty($_GET["vc"])),$html);
    $html = str_replace("<!--function_callback-->",To::BoolString(empty(VisitorChat::$DynamicGroup) && (!empty($_GET["cmb"]) || !empty($_GET["ofc"]))),$html);
    $html = str_replace("<!--function_ticket-->",To::BoolString(empty($_GET["nct"])),$html);
    $html = str_replace("<!--function_chat-->",To::BoolString(empty($_GET["hfc"])),$html);
    $html = str_replace("<!--function_knowledgebase-->",To::BoolString(empty($_GET["hfk"]) && !empty(Server::$Configuration->File["gl_knba"])),$html);
    $html = str_replace("<!--hide_group_select_chat-->",To::BoolString(Communication::GetParameter("hcgs",0,$nu,FILTER_VALIDATE_INT)=="1" || !empty($_GET[GET_EXTERN_DYNAMIC_GROUP])),$html);
    $html = str_replace("<!--hide_group_select_ticket-->",To::BoolString(Communication::GetParameter("htgs",0,$nu,FILTER_VALIDATE_INT)=="1"),$html);
    $html = str_replace("<!--require_group_selection-->",To::BoolString(Communication::GetParameter("rgs",0,$nu,FILTER_VALIDATE_INT)=="1"),$html);
    $html = str_replace("<!--offline_message_pop-->",To::BoolString(!empty(Server::$Configuration->File["gl_om_pop_up"]) || empty(Server::$Configuration->File["gl_om_mode"])),$html);
    $html = str_replace("<!--dynamic_group-->",(!empty(VisitorChat::$DynamicGroup)) ? base64_encode(Server::$Groups[VisitorChat::$DynamicGroup]->Descriptions["EN"]) : "",$html);
}
else
{
	if($_GET[GET_EXTERN_TEMPLATE] == "lz_chat_frame_lgin")
	{
		$html = IOStruct::GetFile(PATH_FRAMES.$_GET[GET_EXTERN_TEMPLATE].".tpl");
		$html = (isset(Server::$Configuration->File["gl_site_name"])) ? str_replace("<!--config_name-->",Server::$Configuration->File["gl_site_name"],$html) : str_replace("<!--config_name-->","LiveZilla",$html);
		$html = getChatLoginInputs($html,MAX_INPUT_LENGTH);
		$html = str_replace("<!--alert-->",getAlertTemplate(),$html);
		$html = str_replace("<!--com_chats-->",getChatVoucherTemplate(),$html);
		$html = str_replace("<!--ssl_secured-->",((Communication::GetScheme() == SCHEME_HTTP_SECURE && !empty(Server::$Configuration->File["gl_sssl"])) ? "" : "display:none;"),$html);
        $html = str_replace("<!--bgc-->",$color=Communication::ReadParameter("epc","#73be28"),$html);
        $html = str_replace("<!--color-->",Colors::TransformHEX($color,30),$html);
    }
	else if($_GET[GET_EXTERN_TEMPLATE] == "lz_chat_frame_chat")
	{
		$html = IOStruct::GetFile(PATH_FRAMES.$_GET[GET_EXTERN_TEMPLATE].".tpl");
		$html = str_replace("<!--alert-->",getAlertTemplate(),$html);
        $tlanguages = "";
        if(strlen(Server::$Configuration->File["gl_otrs"])>1)
        {
            $mylang = LocalizationManager::GetBrowserLocalization();
            $tlanguages = getLanguageSelects(LocalizationManager::GetBrowserLocalization());
        }
        $html = str_replace("<!--languages-->",$tlanguages,$html);
        Server::InitDataBlock(array("GROUPS"));
        $groupid = $_POST["intgroup"];

        if(!empty($groupid) && isset(Server::$Groups[$groupid]))
        {
            $html = str_replace("<!--SM_HIDDEN-->",((empty(Server::$Groups[$groupid]->ChatFunctions[0])) ? "none" : ""),$html);
            $html = str_replace("<!--SO_HIDDEN-->",((empty(Server::$Groups[$groupid]->ChatFunctions[1])) ? "none" : ""),$html);
            $html = str_replace("<!--PR_HIDDEN-->",((empty(Server::$Groups[$groupid]->ChatFunctions[2])) ? "none" : ""),$html);
            $html = str_replace("<!--FV_HIDDEN-->",((empty(Server::$Groups[$groupid]->ChatFunctions[4])) ? "none" : ""),$html);
            $html = str_replace("<!--FU_HIDDEN-->",((empty(Server::$Groups[$groupid]->ChatFunctions[5]) || !empty($_GET[GET_EXTERN_DYNAMIC_GROUP])) ? "none" : ""),$html);
            $html = str_replace("<!--post_chat_js-->",base64_encode(Server::$Groups[$groupid]->PostJS),$html);
        }
        $html = str_replace("<!--TR_HIDDEN-->",((strlen(Server::$Configuration->File["gl_otrs"])>1)?"":"none"),$html);
        $html = str_replace("<!--ET_HIDDEN-->",((!empty(Server::$Configuration->File["gl_retr"]) && !empty(Server::$Configuration->File["gl_soct"]))? "" :"none"),$html);
	}
}

$header = IOStruct::GetFile(PATH_TEMPLATES."header.tpl");
if(isset($_GET[GET_EXTERN_USER_HEADER]) && !empty($_GET[GET_EXTERN_USER_HEADER]))
    $header = str_replace("<!--logo-->","<img src=\"".Encoding::Base64UrlDecode($_GET[GET_EXTERN_USER_HEADER])."\" border=\"0\"><br>",$header);
else if(!empty(Server::$Configuration->File["gl_cali"]))
    $header = str_replace("<!--logo-->","<img src=\"".Server::$Configuration->File["gl_cali"]."\" border=\"0\"><br>",$header);
if(!empty(Server::$Configuration->File["gl_cahi"]))
    $header = str_replace("<!--background-->","<img src=\"".Server::$Configuration->File["gl_cahi"]."\" border=\"0\"><br>",$header);

$html = str_replace("<!--param-->",@Server::$Configuration->File["gl_cpar"],$html);
$html = str_replace("<!--header-->",$header,$html);
$html = str_replace("<!--server-->",LIVEZILLA_URL,$html);
$html = str_replace("<!--html-->","<html dir=\"".LocalizationManager::$Direction."\">", $html);
$html = str_replace("<!--rtl-->",To::BoolString(LocalizationManager::$Direction=="rtl"), $html);
$html = str_replace("<!--dir-->",LocalizationManager::$Direction, $html);
$html = str_replace("<!--url_get_params-->",getParams(),$html);
Server::UnloadDataProvider();
exit(Server::Replace($html));

?>
