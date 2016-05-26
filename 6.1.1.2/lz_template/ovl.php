<?php
/****************************************************************************************
* LiveZilla ovl.php
* 
* Copyright 2015 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
@ini_set('session.use_cookies', '0');
@error_reporting(E_ALL);

require_once(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

@set_time_limit(Server::$Configuration->File["timeout_chats"]);
if(!isset($_GET["file"]))
	@set_error_handler("handleError");
if(!isset($_GET[GET_TRACK_BROWSERID]))
	exit();

LocalizationManager::AutoLoad();
Server::InitDataBlock(array("INTERNAL","GROUPS","FILTERS","INPUTS"));

$OVERLAY = new OverlayChat();
$USER = VisitorMonitoring::$Visitor;
$USER->Browsers[0] = new VisitorChat($USER->UserId,$USER->UserId . "_OVL");
$USER->Browsers[1] = VisitorMonitoring::$Browser;

$OVERLAY->GroupBuilder = new GroupBuilder($USER->Browsers[0]->DesiredChatGroup,$USER->Browsers[0]->DesiredChatPartner,false);
$OVERLAY->GroupBuilder->Generate(null,true);

$USER->Browsers[0]->Overlay = true;
$USER->Browsers[0]->Load();
$USER->Browsers[0]->LoadUserData();

if($USER->Browsers[0]->FirstCall)
	$USER->AddFunctionCall("lz_chat_init_data_change(null);",false);

$OVERLAY->KnowledgebaseSearch();

if(IS_FILTERED && !FILTER_ALLOW_CHATS)
{
	$USER->Browsers[0]->CloseChat();
	$USER->Browsers[0]->Destroy();

    if(!FILTER_ALLOW_TICKETS)
	    $USER->AddFunctionCall("lz_tracking_remove_overlay_chat();",true);
}

if(!$USER->FirstCall)
    $USER->Browsers[0]->LoadForward(false);

if(!empty($USER->Browsers[0]->Forward) && (!Server::$Groups[$USER->Browsers[0]->Forward->TargetGroupId]->IsHumanAvailable(true,true) || (!empty($USER->Browsers[0]->Forward->TargetSessId) && @Server::$Operators[$USER->Browsers[0]->Forward->TargetSessId]->UserStatus >= USER_STATUS_OFFLINE)))
{
	$USER->Browsers[0]->Forward->Destroy();
	$USER->Browsers[0]->Forward = null;
	$USER->Browsers[0]->ExternalClose();
    if(VisitorMonitoring::$CreateUserObject)
	    $USER->Browsers[0]->Save();
	$USER->Browsers[0]->Load();
}

$OVERLAY->DefineTargets();
$OVERLAY->DefineModes();

if(defined("IGNORE_WM") && (empty($USER->Browsers[0]->DesiredChatGroup) || !$OVERLAY->Human))
	$USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);",false);

$OVERLAY->IsHumanChatAvailable = $OVERLAY->OperatorCount > 0;
$OVERLAY->CreateChatTemplate();
$USER->Browsers[0]->ReplaceLoginDetails($USER);

if(($USER->Browsers[0]->Status > CHAT_STATUS_OPEN || !empty($USER->Browsers[0]->InitChatWith) || $USER->Browsers[0]->Waiting) && !$USER->Browsers[0]->Closed)
	Visitor::$IsActiveOverlayChat = $OVERLAY->IsHumanChatAvailable = !$USER->Browsers[0]->Declined;
else if($USER->Browsers[0]->Closed && $USER->Browsers[0]->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) || !empty($_GET["mi0"]))
	Visitor::$IsActiveOverlayChat = !$USER->Browsers[0]->Declined;

if(!empty($USER->Browsers[0]->DesiredChatGroup) && !(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS))
{
	$changed = (Visitor::$PollCount!=1) ? $USER->Browsers[0]->ApplyOverlayInputValues() : false;
	if(empty($USER->Browsers[0]->UserData->Text) && !empty($_GET["mp0"]))
	{
        $USER->Browsers[0]->UserData->Text = Str::Cut(Encoding::Base64UrlDecode($_GET["mp0"]),255);
		$changed = true;
	}

    if(Communication::ReadParameter("tc",-1) != -1)
        $changed = true;

	if($changed)
	{
		$USER->Browsers[0]->ApplyUserData();
        $USER->Browsers[1]->UserData = $USER->Browsers[0]->UserData;
        $USER->Browsers[1]->ApplyUserData(true);

        if(!$USER->Browsers[0]->Closed)
            $USER->Browsers[0]->UpdateArchive((Communication::ReadParameter("tc",-1) == 1) ? $USER->Browsers[0]->UserData->Email : "");
    }

    if(Visitor::$PollCount == 1)
    {
        $ovlw = Communication::ReadParameter("ovlw",300);
        $ovlh = Communication::ReadParameter("ovlh",DataInput::GetMaxHeight());
        $text = ($OVERLAY->IsHumanChatAvailable) ? Communication::GetParameter("ovlt",LocalizationManager::$TranslationStrings["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES) : Communication::GetParameter("ovlto",LocalizationManager::$TranslationStrings["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES);
        VisitorMonitoring::$Response .= "lz_tracking_add_overlay_chat('".base64_encode($OVERLAY->ChatHTML)."','".base64_encode(Encoding::Base64UrlDecode($text))."',".$ovlw.",".$ovlh.",".Communication::GetParameter("ovlml",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".Communication::GetParameter("ovlmt",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".Communication::GetParameter("ovlmr",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".Communication::GetParameter("ovlmb",0,$nu,FILTER_SANITIZE_NUMBER_INT).",'".Communication::ReadParameter("ovlp",22)."',true,".To::BoolString($OVERLAY->IsHumanChatAvailable).");";
        $eca = Communication::GetParameter("eca",0,$nu,FILTER_VALIDATE_INT);
        $ecb = Communication::ReadParameter("ecslw",2);
        $ecp = false;
        if(!empty($_GET["eca"]) && !(!empty($_GET["echm"]) && VisitorMonitoring::$IsMobile && !VisitorMonitoring::$IsTablet))
        {
            $ecw = Communication::ReadParameter("ecw",$ovlw);
            $ech = Communication::ReadParameter("ech",100);

            if($eca==1)
            {
                $catcher = IOStruct::GetFile(TEMPLATE_HTML_EYE_CATCHER_BUBBLE);
                $tOperatorId = "";
                if(isset($_GET["ecsp"]) && !Visitor::$IsActiveOverlayChat)
                {
                    $USER->Browsers[0]->FindOperator(VisitorChat::$Router,$USER,$OVERLAY->Botmode,$OVERLAY->Botmode,null,true,$USER->Browsers[0]->Forward != null);
                    if(Server::$Configuration->File["gl_alloc_mode"] == ALLOCATION_MODE_ALL && !empty(VisitorChat::$Router->OperatorsAvailable))
                        $USER->Browsers[0]->DesiredChatPartner = array_rand(VisitorChat::$Router->OperatorsAvailable,1);

                    if(empty($USER->Browsers[0]->DesiredChatPartner) && !empty(VisitorChat::$Router->OperatorsBusy))
                        $USER->Browsers[0]->DesiredChatPartner = array_rand(VisitorChat::$Router->OperatorsBusy,1);
                }

                if(isset($_GET["ecsp"]) && !empty($USER->Browsers[0]->DesiredChatPartner))
                {
                    $catcher = str_replace("<!--left_margin-->",82 + $ecb,$catcher);
                    $catcher = str_replace("<!--avatar_src-->",LIVEZILLA_URL.Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->GetOperatorPictureFile(),$catcher);
                    $catcher = str_replace("<!--avatar_border-->",Communication::ReadParameter("ecfe","#d3f299"),$catcher);
                    $catcher = str_replace("<!--avatar_bg_height-->",$ech-28,$catcher);
                    $catcher = str_replace("<!--avatar_visible-->","block",$catcher);
                    $catcher = str_replace("<!--border-->",$ecb,$catcher);
                    $ecp = true;

                    if(!isset($_GET["echst"]))
                        $USER->AddFunctionCall("lz_ec_sub_header='".Encoding::Base64UrlEncode(str_replace("<!--operator_name-->",Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->Fullname,LocalizationManager::$TranslationStrings["client_ec_sub_text_personal"]))."';",false);

                    if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL)
                        $USER->AddFunctionCall("lz_desired_operator='".Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->UserId."';",false);
                }
                else
                {
                    $catcher = str_replace("<!--left_margin-->",10,$catcher);
                    $catcher = str_replace("<!--avatar_visible-->","none",$catcher);
                }

                $catcher = str_replace("<!--width-->",$ecw,$catcher);
                $catcher = str_replace("<!--height-->",$ech,$catcher);
                $catcher = str_replace("<!--header_padding-->",Communication::ReadParameter("echp",16),$catcher);
                $catcher = str_replace("<!--header_sub_padding-->",Communication::ReadParameter("echsp",41),$catcher);
                $catcher = str_replace("<!--header_color-->",Communication::ReadParameter("echc","#6ea30c"),$catcher);
                $catcher = str_replace("<!--avatar_src-->","",$catcher);
            }
            else
                $catcher = IOStruct::GetFile(TEMPLATE_HTML_EYE_CATCHER_IMAGE);
            VisitorMonitoring::$Response .= "lz_tracking_add_eye_catcher('".base64_encode($catcher)."',".$ecw.",".$ech.",".$ovlw.",".$ovlh.",".Communication::ReadParameter("ovlml",0).",".Communication::GetParameter("ovlmr",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".Communication::ReadParameter("ecmb",29).",'".Communication::ReadParameter("ovlp",22)."','".Communication::GetParameter("ecsa",0,$nu,FILTER_VALIDATE_INT)."','".Communication::GetParameter("ecsb",5,$nu,FILTER_VALIDATE_INT)."','".Communication::GetParameter("ecsx",3,$nu,FILTER_VALIDATE_INT)."','".Communication::GetParameter("ecsy",3,$nu,FILTER_VALIDATE_INT)."','".Communication::ReadParameter("ecsc","#464646")."','".Communication::ReadParameter("ecsgs","#659f2a")."','".Communication::ReadParameter("ecsge","#659f2a")."',".$ecb.",'".Communication::ReadParameter("ecfs","#f0ffd5")."','".Communication::ReadParameter("ecfe","#d3f299")."',".Communication::GetParameter("ecfi",0,$nu,FILTER_VALIDATE_INT).",".Communication::ReadParameter("ecfo",0).",".To::BoolString($ecp).");";
        }
    }
    if(Communication::ReadParameter("clch","")=="1")
	{
        $USER->Browsers[0]->ExternalClose();
        $USER->Browsers[0]->Destroy();
        $USER->AddFunctionCall("lz_leave_chat=false;lz_closed=false;lz_tracking_poll_server();",false);
	}

    $showWidgets = true;
    if(isset($_GET["ovlio"]) && !($OVERLAY->IsHumanChatAvailable && !empty($USER->Browsers[1]->ChatRequest)))
        $showWidgets = false;
    else if(isset($_GET["ovloo"]) && !$OVERLAY->IsHumanChatAvailable)
        $showWidgets = false;

    $USER->AddFunctionCall("lz_tracking_set_widget_visibility(".To::BoolString($showWidgets).");",false);

    $declined = false;
    $OVERLAY->LastPostReceived = "null";
	$OVERLAY->LastMessageReceived = "null";
	$OVERLAY->IsChatAvailable = $OVERLAY->Botmode;
	$OVERLAY->FullLoad = (!empty($_GET["full"]));
	$OVERLAY->Flags["LPR"] = Communication::ReadParameter("lpr","");
	$OVERLAY->Flags["LMR"] = Communication::ReadParameter("lmr","");
	$OVERLAY->LastPoster = Communication::ReadParameter("lp","");

	if($USER->Browsers[0]->Declined)
		$OVERLAY->IsChatAvailable = false;
	else if($USER->Browsers[0]->Status > CHAT_STATUS_OPEN && !$USER->Browsers[0]->Closed)
	{
		$OVERLAY->IsChatAvailable = true;
		if(!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
			if(($OVERLAY->OperatorCount > 0 && !$OVERLAY->Botmode) && !$USER->Browsers[0]->ExternalClosed)
			{
				foreach($USER->Browsers[0]->Members as $sid => $member)
					if(!Server::$Operators[$sid]->IsBot)
						$USER->Browsers[0]->LeaveChat($sid);

				$USER->Browsers[0]->ExternalClose();
				$USER->Browsers[0]->Closed = true;
			}
		if($USER->Browsers[0]->Activated == CHAT_STATUS_ACTIVE && $USER->Browsers[0]->Status != CHAT_STATUS_ACTIVE)
			$USER->Browsers[0]->SetStatus(CHAT_STATUS_ACTIVE);

        $action = $USER->Browsers[0]->GetMaxWaitingTimeAction(false);
        if($action == "MESSAGE" || ($action == "FORWARD" && !$USER->Browsers[0]->CreateAutoForward($USER)))
        {
            $declined = true;
        }
	}
	else
		$OVERLAY->IsChatAvailable = $OVERLAY->OperatorCount > 0;

	if(!$OVERLAY->IsChatAvailable)
    {
        $USER->AddFunctionCall("lz_chat_set_connecting(false,'".$USER->Browsers[0]->SystemId."',false,null,0);",false);
        $OVERLAY->SetHost(null);
    }

	$OVERLAY->ProcessPosts();
	$OVERLAY->Listen();

    if($declined)
    {
        $USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);",false);
        $OVERLAY->AddHTML(str_replace("<!--message-->",$OVERLAY->GetDeclinedMessage(),IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","");
        $USER->Browsers[0]->ExternalClose();
    }

	if(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Invite && !empty($USER->Browsers[0]->Forward->TargetGroupId) && !$USER->Browsers[0]->Forward->Processed)
	{
		if(!$USER->Browsers[0]->Forward->Processed)
		{
			$USER->Browsers[0]->LeaveChat($USER->Browsers[0]->Forward->InitiatorSystemId);
			$USER->Browsers[0]->Forward->Save(true);
			$USER->Browsers[0]->ExternalClose();
			$USER->Browsers[0]->DesiredChatGroup = $USER->Browsers[0]->Forward->TargetGroupId;
			$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->Forward->TargetSessId;
			$USER->Browsers[0]->FirstActive=time();
			$USER->Browsers[0]->Save(true);
			$USER->Browsers[0]->SetCookieGroup();


            $USER->AddFunctionCall("lz_chat_set_group('".base64_encode($USER->Browsers[0]->Forward->TargetGroupId)."');",false);
            $OVERLAY->SetHost(null);

		}
		if(!empty(Server::$Operators[$USER->Browsers[0]->Forward->SenderSystemId]) && $USER->Browsers[0]->InternalActivation)
        {
			if(!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
                $USER->AddFunctionCall("lz_chat_set_talk_to_human(true,true);",false);
            else
                $OVERLAY->AddHTML($OVERLAY->GetLeaveChatHTML(true,Server::$Operators[$USER->Browsers[0]->Forward->SenderSystemId]->Fullname,"&nbsp;" . LocalizationManager::$TranslationStrings["client_forwarding"]),"sys","");
        }
        Visitor::$IsActiveOverlayChat = !$USER->Browsers[0]->Declined;
	}
	else if($OVERLAY->IsChatAvailable && ((empty($USER->Browsers[0]->Forward) && !(!empty($USER->Browsers[1]->ChatRequest) && !$USER->Browsers[1]->ChatRequest->Closed) && empty($USER->Browsers[0]->OperatorId) && !$USER->Browsers[0]->Waiting) || (!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot && $OVERLAY->Flags["LMR"]=="ONM01") || $OVERLAY->FullLoad))
	{
		if(($OVERLAY->Flags["LMR"]!="ONM01" || $OVERLAY->FullLoad) && (!$OVERLAY->Botmode || (!empty($USER->Browsers[0]->OperatorId) && !Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot) || (!empty($USER->Browsers[1]->ChatRequest) && !$USER->Browsers[1]->ChatRequest->Closed)))
		{
            if(!$OVERLAY->Botmode && (!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !$USER->Browsers[0]->Closed && !$USER->Browsers[0]->Declined && !$USER->Browsers[0]->Waiting))
                $OVERLAY->AddHTML(str_replace("<!--message-->",LocalizationManager::$TranslationStrings["client_int_is_connected"],IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
            else if($USER->Browsers[0]->Status == CHAT_STATUS_OPEN && !$USER->Browsers[0]->Waiting)
                $OVERLAY->AddHTML(str_replace("<!--message-->",LocalizationManager::$TranslationStrings["client_chat_available"],IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");

            if(!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Invite && !empty($USER->Browsers[0]->Forward->TargetGroupId) && $USER->Browsers[0]->Forward->Processed)
				$OVERLAY->AddHTML(str_replace("<!--message-->",(LocalizationManager::$TranslationStrings["client_forwarding"]),IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
		}
		else if($OVERLAY->Botmode && (($OVERLAY->Flags["LMR"]!="OBM01" || $OVERLAY->FullLoad) && ( (empty($USER->Browsers[0]->OperatorId) && empty($OVERLAY->CurrentOperatorId)) || (!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot))))
		{
            $USER->Browsers[0]->FindOperator(VisitorChat::$Router,$USER,true,true);
			if(!empty(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]) && Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->IsBot)
			{
				$text = ($OVERLAY->Human) ? @LocalizationManager::$TranslationStrings["client_now_speaking_to_va"] : @LocalizationManager::$TranslationStrings["client_now_speaking_to_va_offline"];
                $USER->AddFunctionCall("lz_chat_input_bot_state(true,false);",false);
				$OVERLAY->AddHTML($OVERLAY->GetPostHTML(str_replace("<!--operator_name-->",Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->Fullname,$text),"",true,true,Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->Fullname,time(),$USER->Browsers[0]->DesiredChatPartner,Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->IsBot),"sys","OBM01");
                $OVERLAY->SetHost($USER->Browsers[0]->DesiredChatPartner);
            }
		}
	}

    if(!$OVERLAY->Botmode && empty($_GET["tth"]) && ($USER->Browsers[0]->Status > CHAT_STATUS_OPEN || isset($_GET["mi0"])))
        $USER->AddFunctionCall("lz_chat_set_talk_to_human(true,true);",false);

	$OVERLAY->BotTitle = ($OVERLAY->Botmode && !empty(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]) && Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->IsBot) ? base64_encode(str_replace(array("%name%","%operator_name%"),Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->Fullname,LocalizationManager::$TranslationStrings["client_bot_overlay_title"])) : "";
    if($OVERLAY->IsChatAvailable && !Visitor::$OpenChatExternal && !empty($USER->Browsers[1]->ChatRequest) && Server::$Operators[$USER->Browsers[1]->ChatRequest->SenderSystemId]->IsExternal(Server::$Groups,null,null))
    {
        if(!isset($_GET["hinv"]) && !$USER->Browsers[1]->ChatRequest->Closed && !$USER->Browsers[1]->ChatRequest->Accepted)
        {
            $sound = (!empty(Server::$Configuration->File["gl_cips"]) && !$USER->Browsers[1]->ChatRequest->Displayed) ? "lz_chat_play_sound(\'wind\');" : "";
            if($OVERLAY->FullLoad)
                $USER->Browsers[1]->ChatRequest->Displayed = false;

            if(!$USER->Browsers[1]->ChatRequest->Displayed)
            {
                $USER->Browsers[1]->ChatRequest->Load();
                $OVERLAY->AddHTML($OVERLAY->GetInviteHTML($USER->Browsers[1]->ChatRequest->SenderSystemId,$USER->Browsers[1]->ChatRequest->Text,$USER->Browsers[1]->ChatRequest->Id),"sys","");
                $USER->AddFunctionCall("lz_desired_operator='".Server::$Operators[$USER->Browsers[1]->ChatRequest->SenderSystemId]->UserId."';",false);
                $USER->AddFunctionCall("lz_chat_invite_timer=setTimeout('lz_chat_change_state(false,false);".$sound."',2500);",false);
                $USER->AddFunctionCall("lz_chat_set_group('".base64_encode($USER->Browsers[1]->ChatRequest->SenderGroupId)."');",false);
                $USER->AddFunctionCall("lz_chat_set_talk_to_human(true,false);",false);
                $USER->AddFunctionCall("lz_chat_prepare_data_form();",false);
                $USER->Browsers[1]->ChatRequest->SetStatus(true,false,false);
                $USER->Browsers[1]->ChatRequest->Displayed=true;
            }

            if(!empty($_GET["mi0"]))
            {
                $USER->Browsers[1]->ChatRequest->SetStatus(true,true,false,true);
                $USER->Browsers[1]->ForceUpdate();
            }
        }
    }

	$tymes = (!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->Typing==$USER->Browsers[0]->SystemId) ? "'".base64_encode(str_replace("<!--operator_name-->",Server::$Operators[$USER->Browsers[0]->OperatorId]->Fullname,LocalizationManager::$TranslationStrings["client_representative_is_typing"]))."'" : "null";
	$USER->AddFunctionCall("lz_chat_set_typing(".$tymes.",false);",false);
	$OVERLAY->BuildElements();

	if($OVERLAY->FullLoad)
		$OVERLAY->OperatorPostCount=0;

	if($OVERLAY->Flags["LPP"] == $USER->Browsers[0]->SystemId)
		$OVERLAY->OperatorPostCount=-1;
		
	if(!empty($OVERLAY->SpeakingToHTML) && !$OVERLAY->SpeakingToAdded)
		$OVERLAY->AddHTML($OVERLAY->SpeakingToHTML,"sys","SPKT" . Server::$Operators[$USER->Browsers[0]->OperatorId]->SystemId);
	
	if(!empty($OVERLAY->PostHTML))
		$OVERLAY->AddHTML($OVERLAY->PostHTML,$OVERLAY->Flags["LPP"]);

	if(!empty($OVERLAY->LastPost))
		$USER->AddFunctionCall("lz_chat_set_last_post('".base64_encode(trim(html_entity_decode($OVERLAY->LastPost,ENT_COMPAT,"UTF-8")))."');",false);
	
	if($OVERLAY->PlaySound)
		$USER->AddFunctionCall("lz_chat_play_sound('message');",false);

	if(!empty($_GET["tid"]))
    {
		if($ticket = $USER->SaveTicket(Communication::GetParameter("eg","",$c),$USER->GeoCountryISO2,false,true,BaseURL::GetInputURL()))
        {
            $USER->Browsers[1]->ForceUpdate();
            $ticket->SendAutoresponder($USER,$USER->Browsers[0]);
        }
    }

	$OVERLAY->OverlayHTML = str_replace("<!--server-->",LIVEZILLA_URL,$OVERLAY->OverlayHTML);
	
	if($OVERLAY->LanguageRequired)
		$OVERLAY->OverlayHTML = Server::Replace($OVERLAY->OverlayHTML,$OVERLAY->LanguageRequired,false);

	if(!empty($OVERLAY->OverlayHTML))
		$USER->AddFunctionCall("lz_chat_add_html_element('".base64_encode($OVERLAY->OverlayHTML)."',true,".$OVERLAY->LastPostReceived.",".$OVERLAY->LastMessageReceived.",'".base64_encode($OVERLAY->LastPoster)."','".base64_encode(Communication::ReadParameter("lp",""))."',".$OVERLAY->OperatorPostCount.");",false);

    $USER->AddFunctionCall("lz_chat_set_connecting(".To::BoolString(!$OVERLAY->Botmode && (!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !$USER->Browsers[0]->Closed && !$USER->Browsers[0]->Declined)).",'".$USER->Browsers[0]->SystemId."',".To::BoolString(!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->Status==USER_STATUS_AWAY).",".$OVERLAY->GetWaitingMessage().",".intval(Server::$Configuration->File["gl_wmes"]).");",false);

	if($OVERLAY->RepollRequired)
		$USER->AddFunctionCall("lz_tracking_poll_server(1211);",false);

    if($USER->Browsers[0]->TranslationSettings != null)
        $USER->AddFunctionCall("lz_chat_set_translation(". $USER->Browsers[0]->TranslationSettings[0] . ",'". base64_encode($USER->Browsers[0]->TranslationSettings[1]) . "','" . base64_encode($USER->Browsers[0]->TranslationSettings[2]) . "');",false);
    else
        $USER->AddFunctionCall("lz_chat_set_translation(null,null,null);",false);

    if($OVERLAY->FullLoad)
        $USER->AddFunctionCall("lz_chat_load_input_values();",false);

    $USER->ReloadGroups(true,Visitor::$PollCount == 1);

    if(!empty($USER->Browsers[0]->DesiredChatGroup))
        $USER->AddFunctionCall("lz_chat_set_input_fields();",false);
    else
        $USER->AddFunctionCall(false,false,false,false);

    $USER->AddFunctionCall("lz_chat_set_application(".To::BoolString($OVERLAY->IsChatAvailable).",".To::BoolString($OVERLAY->Botmode).",".To::BoolString($OVERLAY->HumanGeneral).",'".$OVERLAY->BotTitle."',".$OVERLAY->GetChatStatus().",".To::BoolString($USER->Browsers[0]->Declined).");",false);

    if(Visitor::$PollCount == 1)
        $USER->AddFunctionCall("lz_chat_set_focus();",false);
}
OverlayChat::$Response = $USER->Response;
?>
