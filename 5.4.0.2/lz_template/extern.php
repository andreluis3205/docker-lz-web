<?php
/****************************************************************************************
* LiveZilla extern.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
require(LIVEZILLA_PATH . "_lib/objects.external.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");

if(isset($_POST[POST_EXTERN_SERVER_ACTION]))
{
	languageSelect();
	initData(array("FILTERS","INPUTS"));

    $ROUTER = new ChatRouter();
	
	$externalUser = new Visitor(base64UrlDecode($_POST[POST_EXTERN_USER_USERID]));
	$externalUser->ExtendSession = true;
	$externalUser->Load();

	array_push($externalUser->Browsers,new VisitorChat($externalUser->UserId,base64UrlDecode($_POST[POST_EXTERN_USER_BROWSERID])));
    define("IS_FILTERED",$FILTERS->Match(getIP(),formLanguages(((!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"])) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "")),base64UrlDecode($_POST[POST_EXTERN_USER_USERID]),$externalUser->GeoCountryISO2));
	define("IS_FLOOD",($externalUser->Browsers[0]->FirstCall && Filter::IsFlood(getIP(),@$_POST[POST_EXTERN_USER_USERID],true)));

    initData(array("INTERNAL","GROUPS"));

    $externalUser->Browsers[0]->Load();

    if($externalUser->Browsers[0]->Status == CHAT_STATUS_OPEN && IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS)
    {
        $error=buildLoginErrorField();
        $externalUser->AddFunctionCall("lz_chat_release(true,'".$error."');",false);
    }
    else
    {

        if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_LISTEN)
            $externalUser = listen($externalUser);
        else if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_MAIL)
        {
            if(($ticket = $externalUser->SaveTicket(base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),$externalUser->GeoCountryISO2,isset($_GET["cmb"]),true,getOParam("p_url","",$nu,FILTER_SANITIZE_URL))) !== false && ($CONFIG["gl_scom"] != null || $CONFIG["gl_sgom"] != null))
                $ticket->SendAutoresponder($externalUser,$externalUser->Browsers[0]);
            $externalUser->Browsers[0]->SaveLoginData();
        }
        else if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_RATE)
        {
            $externalUser->SaveRate(base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]),$CONFIG, $externalUser->Browsers[0]->ChatId);
        }
        else
        {
            if($externalUser->Browsers[0]->Status != CHAT_STATUS_OPEN || $externalUser->Browsers[0]->Waiting)
            {
                $externalUser->Browsers[0]->CloseChat(7);
                $externalUser->Browsers[0] = new VisitorChat($externalUser->UserId,base64UrlDecode(@$_POST[POST_EXTERN_USER_BROWSERID]),$externalUser->Browsers[0]->Fullname,$externalUser->Browsers[0]->Email,$externalUser->Browsers[0]->Company,$externalUser->Browsers[0]->Question,$externalUser->Browsers[0]->Customs,$externalUser->Browsers[0]->DesiredChatGroup,$externalUser->Browsers[0]->DesiredChatPartner,$externalUser->Browsers[0]->Phone);
            }
            else
            {
                $externalUser->Browsers[0]->ChatId = base64UrlDecode(@$_POST[POST_EXTERN_CHAT_ID]);
            }

            $externalUser->Browsers[0]->Waiting = false;
            $externalUser->Browsers[0]->WaitingMessageDisplayed = null;

            if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_RELOAD_GROUPS)
            {
                if($INPUTS[111]->IsServerInput() && isnull(getCookieValue("form_111")))
                    $externalUser->Browsers[0]->Fullname = $INPUTS[111]->GetServerInput();

                if($INPUTS[112]->IsServerInput())
                    $externalUser->Browsers[0]->Email = $INPUTS[112]->GetServerInput();

                if($INPUTS[113]->IsServerInput())
                    $externalUser->Browsers[0]->Company = $INPUTS[113]->GetServerInput();

                if($INPUTS[114]->IsServerInput())
                    $externalUser->Browsers[0]->Question = $INPUTS[114]->GetServerInput();

                $externalUser->Browsers[0]->Customs = getCustomArray($externalUser->Browsers[0]->Customs);
                $externalUser = replaceLoginDetails($externalUser);
                $externalUser = reloadGroups($externalUser);
            }
            else
            {
                $externalUser->Browsers[0]->CloseWindow();
                exit();
            }
        }

        if(!isset($_POST[POST_EXTERN_RESOLUTION_WIDTH]))
            $externalUser->KeepAlive();
        else
            $externalUser->Save($CONFIG,array(getOParam(POST_EXTERN_RESOLUTION_WIDTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(POST_EXTERN_RESOLUTION_HEIGHT,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32)),getOParam(POST_EXTERN_COLOR_DEPTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(POST_EXTERN_TIMEZONE_OFFSET,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),getOParam(GEO_LATITUDE,-522,$nu,FILTER_VALIDATE_FLOAT),getOParam(GEO_LONGITUDE,-522,$nu,FILTER_VALIDATE_FLOAT),getOParam(GEO_COUNTRY_ISO_2,"",$nu,null,null,32),getOParam(GEO_CITY,"",$nu,null,null,255),getOParam(GEO_REGION,"",$nu,null,null,255),getOParam(GEO_TIMEZONE,"",$nu,null,null,24),getOParam(GEO_ISP,"",$nu,null,null,255),getOParam(GEO_SSPAN,0,$nu,FILTER_VALIDATE_INT),getOParam(GEO_RESULT_ID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32));

        if($externalUser->SignatureMismatch)
        {
            $externalUser->AddFunctionCall("lz_chat_set_signature(\"".$externalUser->UserId."\");",true);
            $externalUser->AddFunctionCall("lz_chat_reload_groups();",false);
        }
        else
        {
            $externalUser->Browsers[0]->VisitId = $externalUser->VisitId;
            if(isset($_GET[GET_TRACK_SPECIAL_AREA_CODE]))
                $externalUser->Browsers[0]->Code = base64UrlDecode($_GET[GET_TRACK_SPECIAL_AREA_CODE]);
            if(IS_FILTERED && !FILTER_ALLOW_CHATS)
                $externalUser->Browsers[0]->CloseChat(8);
            else if(!$externalUser->Browsers[0]->Closed)
                $externalUser->Browsers[0]->Save();
            if(empty($externalUser->Host) && $externalUser->FirstCall)
                $externalUser->ResolveHost();
        }
    }
	$EXTERNSCRIPT = $externalUser->Response;
}
?>
