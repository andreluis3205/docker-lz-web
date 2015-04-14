<?php
/****************************************************************************************
* LiveZilla ovl.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
@ini_set('session.use_cookies', '0');
@error_reporting(E_ALL);
$content_frames = array("lz_chat_frame.3.2.lgin.1.0","lz_chat_frame.3.2.mail.1.0","lz_chat_frame.3.2.chat.1.0","lz_chat_frame.3.2.chat.0.0","lz_chat_frame.3.2.chat.2.0");

require_once(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

@set_time_limit($CONFIG["timeout_chats"]);
if(!isset($_GET["file"]))
	@set_error_handler("handleError");
if(!isset($_GET[GET_TRACK_BROWSERID]))
	exit();

languageSelect();
initData(array("INTERNAL","GROUPS","FILTERS","INPUTS"));

$ROUTER = new ChatRouter();
$USER = new Visitor(base64UrlDecode(getParam(GET_TRACK_USERID)));
$USER->Load();

array_push($USER->Browsers,new VisitorChat($USER->UserId,$USER->UserId . "_OVL"));
array_push($USER->Browsers,$BROWSER);

$GroupBuilder = new GroupBuilder($INTERNAL,$GROUPS,$CONFIG,$USER->Browsers[0]->DesiredChatGroup,$USER->Browsers[0]->DesiredChatPartner,false);
$GroupBuilder->Generate(null,true);

$USER->Browsers[0]->Overlay = true;
$USER->Browsers[0]->Load();

if($USER->Browsers[0]->FirstCall)
	$USER->AddFunctionCall("lz_chat_init_data_change(null,null);",false);

if(IS_FILTERED && !FILTER_ALLOW_CHATS)
{
	$USER->Browsers[0]->CloseChat();
	$USER->Browsers[0]->Destroy();

    if(!FILTER_ALLOW_TICKETS)
	    $USER->AddFunctionCall("lz_tracking_remove_overlay_chat();",true);
}

$USER->Browsers[0]->LoadForward(false);
$USER->LoadChatRequests();

if(!empty($USER->Browsers[0]->Forward) && (!$GROUPS[$USER->Browsers[0]->Forward->TargetGroupId]->IsHumanAvailable(true,true) || (!empty($USER->Browsers[0]->Forward->TargetSessId) && @$INTERNAL[$USER->Browsers[0]->Forward->TargetSessId]->UserStatus >= USER_STATUS_OFFLINE)))
{
	$USER->Browsers[0]->Forward->Destroy();
	$USER->Browsers[0]->Forward = null;
	$USER->Browsers[0]->ExternalClose();
	$USER->Browsers[0]->Save();
	$USER->Browsers[0]->Load();
}

if(!empty($_GET["tth"]) || $USER->IsInChat(true,$USER->Browsers[0]) || $openChatExternal)
    define("IGNORE_WM",true);

if(defined("IGNORE_WM") && !empty($USER->Browsers[0]->DesiredChatPartner) && $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->IsBot)
	$USER->Browsers[0]->DesiredChatPartner = "";

if(!empty($USER->Browsers[1]->ChatRequest) && $USER->Browsers[1]->ChatRequest->Closed && !$USER->Browsers[1]->ChatRequest->Accepted && @$INTERNAL[$USER->Browsers[1]->ChatRequest->SenderSystemId]->UserStatus < USER_STATUS_OFFLINE && $INTERNAL[$USER->Browsers[1]->ChatRequest->SenderSystemId]->IsExternal($GROUPS,null,array($USER->Browsers[1]->ChatRequest->SenderGroupId)))
{
	$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[1]->ChatRequest->SenderSystemId;
	$USER->Browsers[0]->DesiredChatGroup = $USER->Browsers[1]->ChatRequest->SenderGroupId;
	$OPERATOR_COUNT = 1;
}
else if(!(!empty($USER->Browsers[0]->Forward) && !empty($USER->Browsers[0]->DesiredChatGroup)))
{
	if(!empty($_GET[GET_EXTERN_INTERN_USER_ID]))
		$USER->Browsers[0]->DesiredChatPartner = Operator::GetSystemId(base64UrlDecode(getParam(GET_EXTERN_INTERN_USER_ID)));
	if(!empty($USER->Browsers[0]->InitChatWith))
		$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InitChatWith;
	if(!empty($USER->Browsers[0]->Forward))
		$USER->Browsers[0]->DesiredChatPartner = "";
	if(!(!empty($USER->Browsers[0]->DesiredChatPartner) && !empty($USER->Browsers[0]->DesiredChatGroup) && !empty($USER->Browsers[0]->InternalUser)))
		$USER->Browsers[0]->DesiredChatGroup = $GroupBuilder->GetTargetGroup($OPERATOR_COUNT,$USER->Browsers[0]->DesiredChatPartner,$USER->Browsers[0]->DesiredChatGroup);
	else
		$OPERATOR_COUNT = 1;
}
else
	$OPERATOR_COUNT = 1;

$HUMAN = $HUMAN_GENERAL = false;
$BOTMODE = empty($USER->Browsers[0]->Forward) && !$openChatExternal;
$WELCOME_MANAGER = false;
$REPOLL = false;

$count = 0;
foreach($INTERNAL as $sysId => $internaluser)
{
	$isex = $internaluser->IsExternal($GROUPS, null, array($USER->Browsers[0]->DesiredChatGroup), $USER->Browsers[0]->DesiredChatPartner==$sysId, ($USER->Browsers[0]->DesiredChatPartner==$sysId && !empty($USER->Browsers[0]->Forward)));
    if($isex && $internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated && (!$internaluser->IsBot || !$openChatExternal))
	{
        if(!$internaluser->IsBot)
            $HUMAN_GENERAL = true;
		$count++;
		if(!$internaluser->IsBot && !$WELCOME_MANAGER)
			$BOTMODE = false;
		if($internaluser->IsBot && $internaluser->WelcomeManager && !defined("IGNORE_WM"))
			$BOTMODE = $WELCOME_MANAGER = true;
		if(!$internaluser->IsBot)
		{
			$HUMAN = true;
			if(!empty($USER->Browsers[0]->InitChatWith) && $sysId == $USER->Browsers[0]->InitChatWith)
			{
				$BOTMODE = $WELCOME_MANAGER = false;
				break;
			}
		}

	}
    else if($internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated && !$internaluser->IsBot && $internaluser->IsExternal($GROUPS))
        $HUMAN_GENERAL = true;
}
if($count == 0)
{
	$BOTMODE = false;
	$HUMAN = false;
	$OPERATOR_COUNT = 0;
}

if(defined("IGNORE_WM") && (empty($USER->Browsers[0]->DesiredChatGroup) || !$HUMAN))
	$USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);",false);

$ponline = !empty($_GET["ca"]);
$conline = $OPERATOR_COUNT > 0;
$icw = false;
$chat = "";

if(!empty($_GET["pc"]) && $_GET["pc"] == 1)
{
	$chat = str_replace("<!--server-->",LIVEZILLA_URL,getFile(TEMPLATE_HTML_OVERLAY_CHAT));
    $chat = str_replace("<!--dir-->",$LANG_DIR,$chat);
    $chat = getChatLoginInputs($chat,MAX_INPUT_LENGTH_OVERLAY,true);
    $chat = str_replace("<!--tr_vis-->",((strlen($CONFIG["gl_otrs"])>1) ? "''" : "none"),$chat);
    $chat = str_replace("<!--overlay_input_max_length-->",MAX_INPUT_LENGTH_OVERLAY,$chat);
    $chat = applyReplacements($chat,true,false);
	$chat = str_replace("<!--bgc-->",base64UrlDecode($_GET["ovlc"]),$chat);
    $chat = str_replace("<!--bgcd-->",hexDarker(str_replace("#","",base64UrlDecode($_GET["ovlc"])),50),$chat);
	$chat = str_replace("<!--tc-->",base64UrlDecode($_GET["ovlct"]),$chat);
	$chat = str_replace("<!--apo-->",((!empty($_GET["ovlapo"])) ? "" : "display:none;"),$chat);
	$chat = str_replace("<!--offer_transcript-->",((!empty($CONFIG["gl_soct"])) ? "":"DISABLED"),$chat);
    $chat = str_replace("<!--activate_transcript-->",((empty($CONFIG["gl_soct"])) ? "":"CHECKED"),$chat);
    $chat = str_replace("<!--param-->",@$CONFIG["gl_cpas"],$chat);
    $mylang = getBrowserLocalization();
    $tlanguages = getLanguageSelects(getBrowserLocalization());
    $chat = str_replace("<!--languages-->",$tlanguages,$chat);
    replaceLoginDetails($USER);
}

if(($USER->Browsers[0]->Status > CHAT_STATUS_OPEN || !empty($USER->Browsers[0]->InitChatWith) || $USER->Browsers[0]->Waiting) && !$USER->Browsers[0]->Closed)
	$ACTIVE_OVLC = $conline = !$USER->Browsers[0]->Declined;
else if($USER->Browsers[0]->Closed && $USER->Browsers[0]->LastActive > (time()-$CONFIG["timeout_chats"]) || !empty($_GET["mi0"]))
	$ACTIVE_OVLC = !$USER->Browsers[0]->Declined;

if(!empty($USER->Browsers[0]->DesiredChatGroup) && !(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS))
{
	$changed = $USER->Browsers[0]->ApplyOverlayInputValues($USER->Browsers[1]);
    if(isset($_GET["tc"]))
        $changed = true;
	
	if(empty($USER->Browsers[0]->Question) && !empty($_GET["mp0"]))
	{
		$USER->Browsers[0]->Question = cutString(base64UrlDecode($_GET["mp0"]),255);
		$changed = true;
	}

	if($changed)
	{
		$USER->Browsers[0]->SaveLoginData();
		$USER->Browsers[1]->SaveLoginData();
		$USER->UpdateOverlayDetails();
	}

    if(!$conline && !empty($_GET["ovloo"]))
        $USER->AddFunctionCall("if(lz_session.OVLCState == '0')lz_tracking_remove_overlay_chat();",false);
    else if(!empty($_GET["pc"]) && $_GET["pc"] == 1)
    {
        $text = ($conline) ? getOParam("ovlt",$LZLANG["client_overlay_title_online"],$c,FILTER_HTML_ENTITIES) : getOParam("ovlto",$LZLANG["client_overlay_title_offline"],$c,FILTER_HTML_ENTITIES);
        $TRACKINGSCRIPT .= "lz_tracking_add_overlay_chat('".base64_encode($chat)."','".base64_encode(base64UrlDecode($text))."',280,".DataInput::GetMaxHeight().",".getOParam("ovlml",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".getOParam("ovlmt",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".getOParam("ovlmr",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".getOParam("ovlmb",0,$nu,FILTER_SANITIZE_NUMBER_INT).",'".getOParam("ovlp",21,$nu,FILTER_SANITIZE_NUMBER_INT)."',true,".parseBool($conline).");";
        $eca = getOParam("eca",0,$nu,FILTER_VALIDATE_INT);

        if(!empty($_GET["eca"]) && !(!empty($_GET["echm"]) && $isMobile && !$isTablet))
        {
            $ecw = getOParam("ecw",280,$nu,FILTER_VALIDATE_INT);
            $ech = getOParam("ech",100,$nu,FILTER_VALIDATE_INT);

            if($eca==1)
            {
                $catcher = getFile(TEMPLATE_HTML_EYE_CATCHER_BUBBLE);
                $catcher = str_replace("<!--width-->",$ecw,$catcher);
                $catcher = str_replace("<!--height-->",$ech,$catcher);
                $catcher = str_replace("<!--header_padding-->",getOParam("echp",16,$nu,FILTER_VALIDATE_INT),$catcher);
                $catcher = str_replace("<!--header_sub_padding-->",getOParam("echsp",43,$nu,FILTER_VALIDATE_INT),$catcher);
                $catcher = str_replace("<!--header_color-->",getOParam("echc","#FFFFFF",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR))),$catcher);
            }
            else
                $catcher = getFile(TEMPLATE_HTML_EYE_CATCHER_IMAGE);

            $TRACKINGSCRIPT .= "lz_tracking_add_eye_catcher('".base64_encode($catcher)."',".$ecw.",".$ech.",".getOParam("ovlml",0,$nu,FILTER_VALIDATE_INT).",".getOParam("ovlmr",0,$nu,FILTER_SANITIZE_NUMBER_INT).",".getOParam("ecmb",27,$nu,FILTER_VALIDATE_INT).",'".getOParam("ovlp",21,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecsa",0,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecsb",5,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecsx",3,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecsy",3,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecsc","#464646",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)))."','".getOParam("ecsgs","#659f2a",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)))."','".getOParam("ecsge","#7dbd3c",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)))."','".getOParam("ecslw",2,$nu,FILTER_VALIDATE_INT)."','".getOParam("ecfs","#73be28",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)))."','".getOParam("ecfe","#659f2a",$nu,FILTER_VALIDATE_REGEXP,array("options"=>array("regexp"=>FILTER_VALIDATE_REGEXP_HEXCOLOR)))."',".getOParam("ecfi",0,$nu,FILTER_VALIDATE_INT).",".getOParam("ecfo",0,$nu,FILTER_VALIDATE_INT).");";
        }
    }
    if(!empty($_GET[GET_TRACK_CLOSE_CHAT_WINDOW]) && $_GET[GET_TRACK_CLOSE_CHAT_WINDOW]=="1")
	{
        $USER->Browsers[0]->ExternalClose();
        $USER->Browsers[0]->Destroy();
        $USER->AddFunctionCall("lz_tracking_poll_server();",false);
	}

	$lpr = "null";
	$LMR = "null";

	$chat_available = $BOTMODE;
	$FULL = (!empty($_GET["full"]));
	
	$LPRFLAG = (!empty($_GET["lpr"])) ? base64UrlDecode($_GET["lpr"]) : "";
	$LMRFLAG = (!empty($_GET["lmr"])) ? base64UrlDecode($_GET["lmr"]) : "";
	$LASTPOSTER = (!empty($_GET["lp"])) ? base64UrlDecode($_GET["lp"]) : "";

	if($USER->Browsers[0]->Declined)
		$chat_available = false;
	else if($USER->Browsers[0]->Status > CHAT_STATUS_OPEN && !$USER->Browsers[0]->Closed)
	{
        if($changed)
		    $USER->Browsers[0]->UpdateArchive(((!empty($_GET["tc"])) ? $USER->Browsers[0]->Email : ""),$USER->Browsers[0]->Email,$USER->Browsers[0]->Fullname);

		$chat_available = true;
		if(!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->IsBot)
			if(($OPERATOR_COUNT > 0 && !$BOTMODE) && !$USER->Browsers[0]->ExternalClosed)
			{
				foreach($USER->Browsers[0]->Members as $sid => $member)
					if(!$INTERNAL[$sid]->IsBot)
						$USER->Browsers[0]->LeaveChat($sid);

				$USER->Browsers[0]->ExternalClose();
				$USER->Browsers[0]->Closed = true;
			}
		if($USER->Browsers[0]->Activated == CHAT_STATUS_ACTIVE && $USER->Browsers[0]->Status != CHAT_STATUS_ACTIVE)
			$USER->Browsers[0]->SetStatus(CHAT_STATUS_ACTIVE);

        $action = $USER->Browsers[0]->GetMaxWaitingTimeAction(false);

        if($action == "MESSAGE" || ($action == "FORWARD" && !$USER->Browsers[0]->CreateAutoForward($USER)))
        {
            $USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);lz_mode_create_ticket=true;",false);
            $USER->Browsers[0]->InternalDecline($USER->Browsers[0]->InternalUser->SystemId);
        }
	}
	else
		$chat_available = $OPERATOR_COUNT > 0;

	$LANGUAGE = false;
	
	if(!$chat_available)
		$USER->AddFunctionCall("lz_chat_set_connecting(false,'".$USER->Browsers[0]->SystemId."',false,null,0);lz_chat_set_host(null,'".$USER->Browsers[0]->ChatId."','','',null);",false);
	
	$pc = 0;
	if(!empty($USER->Browsers[0]->QueuedPosts))
	{
		if(!$USER->Browsers[0]->Waiting)
		{
			while(!empty($_GET["mi".$pc])){$pc++;}
			foreach($USER->Browsers[0]->QueuedPosts as $id => $postar)
			{
				$_GET["mp".$pc] = $postar[0];
				$_GET["mi".$pc] = base64UrlEncode($id);
				$_GET["mrid".$pc] = $id;
				$_GET["mc".$pc++] = $postar[1];

				queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `id`='".DBManager::RealEscape($id)."' LIMIT 1;");
			}
			$pc = 0;
			$USER->Browsers[0]->QueuedPosts = array();
		}
	}
    $HTML = "";
	if(!empty($_GET["mi".$pc]) || $USER->Browsers[0]->Waiting || !empty($USER->Browsers[0]->InitChatWith) || (!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Received && $USER->Browsers[0]->Forward->Processed))
	{
		if($USER->Browsers[0]->Waiting && $BOTMODE && !empty($USER->Browsers[0]->QueuedPosts))
			$USER->Browsers[0]->QueuedPosts = array();
		else if(!$openChatExternal)
			initChat();

		if(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Received && $USER->Browsers[0]->Forward->Processed)
		{
			$USER->Browsers[0]->Forward->Save(true,true);
			$ACTIVE_OVLC = !$USER->Browsers[0]->Declined;
		}
	}

	if(!empty($USER->Browsers[0]->ChatId))
		$USER->AddFunctionCall("lz_chat_id='".$USER->Browsers[0]->ChatId."';",false);

	$USER->Browsers[0]->VisitId = $USER->VisitId;
	while(!empty($_GET["mi".$pc]))
	{
		$id = (!empty($_GET["mrid".$pc])) ? $_GET["mrid".$pc] : md5($USER->Browsers[0]->SystemId . $USER->Browsers[0]->ChatId . $_GET["mi".$pc]);
        $senderName = (!empty($USER->Browsers[0]->Fullname)) ? $USER->Browsers[0]->Fullname : ($LZLANG["client_guest"] . " " . getNoName($USER->UserId.getIP()));
		$post = new Post($id,$USER->Browsers[0]->SystemId,"",base64UrlDecode($_GET["mp".$pc]),((!empty($_GET["mc".$pc]))?$_GET["mc".$pc]:time()),$USER->Browsers[0]->ChatId,$senderName);
		$post->BrowserId = $BROWSER->BrowserId;

        if(!empty($_GET["mpti".$pc]))
        {
            $post->Translation = base64UrlDecode($_GET["mpt".$pc]);
            $post->TranslationISO = base64UrlDecode($_GET["mpti".$pc]);
        }

		$saved = false;
			
		if(!$USER->Browsers[0]->Waiting)
		{
			foreach($GROUPS as $groupid => $group)
				if($group->IsDynamic && $USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE && isset($group->Members[$USER->Browsers[0]->SystemId]))
				{
					foreach($group->Members as $member => $persistent)
						if($member != $USER->Browsers[0]->SystemId)
						{
							if(!empty($INTERNAL[$member]))
								processPost($id,$post,$member,$pc,$groupid,$USER->Browsers[0]->ChatId);
							else
								processPost($id,$post,$member,$pc,$groupid,getValueBySystemId($member,"chat_id",""));
							$saved = true;
						}
					$pGroup=$group;
				}
	
			foreach($USER->Browsers[0]->Members as $systemid => $member)
			{
				if(!empty($member->Declined))
					continue;
				if(!empty($INTERNAL[$systemid]) && isset($pGroup->Members[$systemid]))
					continue;
				if(!(!empty($pGroup) && !empty($INTERNAL[$systemid])))
					$saved = processPost($id,$post,$systemid,$pc,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId,$INTERNAL[$systemid]->IsBot);
			}
	
			if(!empty($USER->Browsers[0]->InternalUser) && ($USER->Browsers[0]->InternalUser->IsBot || $USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE))
			{
				$rpost = new Post($id = getId(32),$USER->Browsers[0]->InternalUser->SystemId,$USER->Browsers[0]->SystemId,$answer=$USER->Browsers[0]->InternalUser->GetAutoReplies($post->Text." ".$post->Translation,$USER->Browsers[0]),time(),$USER->Browsers[0]->ChatId,$USER->Browsers[0]->InternalUser->Fullname);
                if(!empty($answer))
                {
                    if($USER->Browsers[0]->InternalUser->IsBot)
                    {
                        sleep(1);
                        $USER->AddFunctionCall("lz_chat_input_bot_state(true,false);",false);
                    }

                    $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $USER->Browsers[0]->SystemId;
                    $rpost->Save();
                    $saved = true;
                    foreach($USER->Browsers[0]->Members as $opsysid => $member)
                    {
                        if($opsysid != $USER->Browsers[0]->InternalUser->SystemId || !$USER->Browsers[0]->InternalUser->IsBot)
                        {
                            $rpost = new Post($id,$USER->Browsers[0]->InternalUser->SystemId,$opsysid,$answer,time(),$USER->Browsers[0]->ChatId,$INTERNAL[$systemid]->Fullname);
                            $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $USER->Browsers[0]->SystemId;
                            $rpost->Save();
                        }
                    }
                }
			}
            if($saved)
				$USER->AddFunctionCall("lz_chat_release_post('".base64UrlDecode($_GET["mi".$pc])."');",false);
		}
		else
		{
			processPost($id,$post,"",$pc,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId,false);
			$USER->Browsers[0]->QueuedPosts[$id] = array(0=>$_GET["mp".$pc],1=>time(),2=>$BROWSER->BrowserId);
			$USER->AddFunctionCall("lz_chat_release_post('".base64UrlDecode($_GET["mi".$pc])."');",false);
		}
		$pc++;
	}

    if(!empty($USER->Browsers[0]->InternalUser) && empty($pc) && !$USER->Browsers[0]->InternalUser->IsBot)
    {
        $autoReply=$USER->Browsers[0]->InternalUser->GetAutoReplies("",$USER->Browsers[0]);
        if(!empty($autoReply))
            ChatAutoReply::SendAutoReply($autoReply,$USER,$USER->Browsers[0]->InternalUser);
    }
	
	$startTime = 0;
	$isOp = false;
	if($USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE)
	{
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id`='".DBManager::RealEscape($USER->Browsers[0]->ChatId)."' ORDER BY `status` DESC, `dtime` DESC;");
		while($row = DBManager::FetchArray($result))
			if(isset($INTERNAL[$row["user_id"]]))
			{
				$ChatMember = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);
				if($ChatMember->Status == 1 && $ChatMember->Joined >= $USER->Browsers[0]->LastActive)
				{
					$isOp = true;
					addHTML(str_replace("<!--message-->",str_replace("<!--intern_name-->",$INTERNAL[$ChatMember->SystemId]->Fullname,$LZLANG["client_intern_arrives"]),getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","LMMJ".$ChatMember->SystemId);
				}
				else if(($ChatMember->Status == 9 || $ChatMember->Status == 2) && $ChatMember->Left >= $USER->Browsers[0]->LastActive && $ChatMember->Joined > 0)
				{
					addHTML(leaveChatHTML(false,$INTERNAL[$ChatMember->SystemId]->Fullname),"sys","LCM01".$ChatMember->SystemId);
				}
				if($ChatMember->Status == 0)
				{
					$startTime = $ChatMember->Joined;
					$isOp = true;
				}
			}
	}
	else
		$isOp = true;
		
	$startTime = max($startTime,$USER->Browsers[0]->AllocatedTime);
	
	$USER->Browsers[0]->Typing = isset($_GET["typ"]);

	if(!$USER->Browsers[0]->Declined)
		$USER->Browsers[0]->Save();

    $opId = getOParam("op","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
	if(($USER->Browsers[0]->Waiting && $BOTMODE) || (empty($USER->Browsers[0]->InternalUser) && !empty($opId) && isset($INTERNAL[$opId]) && !$INTERNAL[$opId]->IsBot) || (!empty($opId) && empty($USER->Browsers[0]->ChatId) && !$BOTMODE) || !$isOp || $USER->Browsers[0]->Closed || (!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->Status == USER_STATUS_OFFLINE))
	{
		if(!$USER->Browsers[0]->ExternalClosed)
		{
			$USER->Browsers[0]->ExternalClose();
			$USER->Browsers[0]->Save();
			$USER->Browsers[0]->Load();
		}
		$USER->Browsers[0]->Members = array();
		if(!empty($opId) && !empty($INTERNAL[$opId]) && $isOp)
		{
			addHTML(leaveChatHTML(true,$INTERNAL[$opId]->Fullname),"sys","LCM01" . $opId);
			$LMRFLAG = "null";
			$USER->Browsers[0]->InternalUser = null;
            $opId = "";
			$REPOLL = true;
		}
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
			$USER->AddFunctionCall("lz_chat_set_host(null,'".$USER->Browsers[0]->ChatId."','','',null);",false);
		}
		if(!empty($INTERNAL[$USER->Browsers[0]->Forward->SenderSystemId]) && $USER->Browsers[0]->InternalActivation)
        {
			if(!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->IsBot)
                $USER->AddFunctionCall("lz_chat_set_talk_to_human(true,true);",false);
            else
                addHTML(leaveChatHTML(true,$INTERNAL[$USER->Browsers[0]->Forward->SenderSystemId]->Fullname,"&nbsp;" . $LZLANG["client_forwarding"]),"sys","LCM02");
        }
        $ACTIVE_OVLC = !$USER->Browsers[0]->Declined;
	}
	else if($chat_available && ((empty($USER->Browsers[0]->Forward) && !(!empty($USER->Browsers[1]->ChatRequest) && !$USER->Browsers[1]->ChatRequest->Closed) && empty($USER->Browsers[0]->InternalUser) && !$USER->Browsers[0]->Waiting) || (!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->IsBot && $LMRFLAG=="ONM01") || $FULL))
	{
		if(($LMRFLAG!="ONM01" || $FULL) && (!$BOTMODE || (!empty($USER->Browsers[0]->InternalUser) && !$USER->Browsers[0]->InternalUser->IsBot) || (!empty($USER->Browsers[1]->ChatRequest) && !$USER->Browsers[1]->ChatRequest->Closed)))
		{
            if(!$BOTMODE && (!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !$USER->Browsers[0]->Closed && !$USER->Browsers[0]->Declined && !$USER->Browsers[0]->Waiting))
                addHTML(str_replace("<!--message-->",$LZLANG["client_int_is_connected"],getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
            else if($USER->Browsers[0]->Status == CHAT_STATUS_OPEN && !$USER->Browsers[0]->Waiting)
                addHTML(str_replace("<!--message-->",$LZLANG["client_chat_available"],getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");

            if(!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Invite && !empty($USER->Browsers[0]->Forward->TargetGroupId) && $USER->Browsers[0]->Forward->Processed)
				addHTML(str_replace("<!--message-->",($LZLANG["client_forwarding"]),getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","ONM01");
		}
		else if($BOTMODE && (($LMRFLAG!="OBM01" || $FULL) && ( (empty($USER->Browsers[0]->InternalUser) && empty($opId)) || (!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->IsBot))))
		{
            $USER->Browsers[0]->FindOperator($USER,true,true);
			if(!empty($INTERNAL[$USER->Browsers[0]->DesiredChatPartner]) && $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->IsBot)
			{
				$text = ($HUMAN) ? @$LZLANG["client_now_speaking_to_va"] : @$LZLANG["client_now_speaking_to_va_offline"];
                $USER->AddFunctionCall("lz_chat_input_bot_state(true,false);",false);
				addHTML(postHTML(str_replace("<!--operator_name-->",$INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Fullname,$text),"",true,true,$INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Fullname,time(),$USER->Browsers[0]->DesiredChatPartner),"sys","OBM01");
				$USER->AddFunctionCall("lz_chat_set_host('" . $USER->Browsers[0]->DesiredChatPartner . "','".$USER->Browsers[0]->ChatId."','".$USER->Browsers[0]->DesiredChatGroup."','','".strtoupper($INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Language)."');",false);
			}
		}
	}

    if(!$BOTMODE && empty($_GET["tth"]) && ($USER->Browsers[0]->Status > CHAT_STATUS_OPEN || isset($_GET["mi0"])))
        $USER->AddFunctionCall("lz_chat_set_talk_to_human(true,true);",false);

	$bottitle = ($BOTMODE && !empty($INTERNAL[$USER->Browsers[0]->DesiredChatPartner]) && $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->IsBot) ? base64_encode(str_replace(array("%name%","%operator_name%"),$INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Fullname,$LZLANG["client_bot_overlay_title"])) : "";
    if($chat_available && !$openChatExternal && !empty($USER->Browsers[1]->ChatRequest) && $INTERNAL[$USER->Browsers[1]->ChatRequest->SenderSystemId]->IsExternal($GROUPS,null,null))
    {
        if(!$USER->Browsers[1]->ChatRequest->Closed && !$USER->Browsers[1]->ChatRequest->Accepted)
        {
            $sound = (!empty($CONFIG["gl_cips"]) && !$USER->Browsers[1]->ChatRequest->Displayed) ? "lz_chat_play_sound(\'wind\');" : "";
            if($FULL)
                $USER->Browsers[1]->ChatRequest->Displayed = false;

            if(!$USER->Browsers[1]->ChatRequest->Displayed)
            {
                $USER->Browsers[1]->ChatRequest->Load();
                addHTML(inviteHTML($USER->Browsers[1]->ChatRequest->SenderSystemId,$USER->Browsers[1]->ChatRequest->Text,$USER->Browsers[1]->ChatRequest->Id),"sys","");
                $USER->AddFunctionCall("lz_desired_operator='".$INTERNAL[$USER->Browsers[1]->ChatRequest->SenderSystemId]->UserId."';",false);
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
	
	$tymes = (!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->Typing==$USER->Browsers[0]->SystemId) ? "'".base64_encode(str_replace("<!--operator_name-->",$USER->Browsers[0]->InternalUser->Fullname,$LZLANG["client_representative_is_typing"]))."'" : "null";
	$USER->AddFunctionCall("lz_chat_set_typing(".$tymes.",false);",false);
	
	$maxposts = 50;
	$spkthtml = speakingToHTML($opId);
	$posthtml = "";
	$pstrchngreq = $psound = $spkt = false;
	
	$oppostcount = 0;
	$LASTPOST = "";
	$lppflag = $LASTPOSTER;
	$rand = rand();

	if(!$USER->Browsers[0]->Declined && $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($USER->Browsers[0]->ChatId)."' AND `chat_id`!='' AND `chat_id`!='0' AND (`receiver`='".DBManager::RealEscape($USER->Browsers[0]->SystemId)."' OR (`sender`='".DBManager::RealEscape($USER->Browsers[0]->SystemId)."' AND `repost`=0)) GROUP BY `id` ORDER BY `time` ASC, `micro` ASC;"))
	{
		$all = DBManager::GetRowCount($result);
		$toshow = min($maxposts,$all);
		if($all > 0)
		{
			$count = $maxposts-$all;
			while($row = DBManager::FetchArray($result))
			{
				if($count++ >= 0)
				{
					$postobj = new Post($row);
					if(empty($INTERNAL[$postobj->Sender]))
                    {
						$postobj->Text = htmlentities($postobj->Text,ENT_QUOTES,'UTF-8');
                        $postobj->Translation = htmlentities($postobj->Translation,ENT_QUOTES,'UTF-8');
                    }

					if($USER->Browsers[0]->AllocatedTime > 0 && $USER->Browsers[0]->AllocatedTime && !$spkt)
					{
						$lppflag = "sys";
						$posthtml .= $spkthtml;
						$spkt = true;
					}

					$post = postHTML($postobj->Text,$postobj->Translation,($lppflag != $postobj->Sender || $pstrchngreq),$postobj->Sender != $USER->Browsers[0]->SystemId,(($postobj->Sender != $USER->Browsers[0]->SystemId) ? $postobj->SenderName : htmlentities($USER->Browsers[0]->Fullname,ENT_QUOTES,"UTF-8")),$postobj->Created,$postobj->Sender);
				
					$pstrchngreq = false;
					if($postobj->Sender != $USER->Browsers[0]->SystemId)
						$oppostcount++;
						
					if(!$postobj->Received && $postobj->Sender != $USER->Browsers[0]->SystemId)
						$psound = true;
					
					$postobj->MarkReceived($USER->Browsers[0]->SystemId);
					if($FULL || $postobj->Sender != $USER->Browsers[0]->SystemId || $postobj->BrowserId != $BROWSER->BrowserId)
						$lppflag = $postobj->Sender;
					if(empty($_GET["full"]) && $postobj->Id == $LPRFLAG)
					{
						$psound = false;
						$posthtml = $spkthtml;
						$spkt = true;
						$oppostcount = 0;
						$lppflag = (!empty($spkthtml)) ? "sys" : $LASTPOSTER;
						if($USER->Browsers[0]->AllocatedTime > 0 && $postobj->Created < $USER->Browsers[0]->AllocatedTime)
							$pstrchngreq = true;
					}
					else
					{
						if($FULL || $postobj->Sender != $USER->Browsers[0]->SystemId || $postobj->BrowserId != $BROWSER->BrowserId)
							$posthtml .= $post;
					}
						
					$lpr = "'".base64_encode($postobj->Id)."'";
					
					if($postobj->Sender == $USER->Browsers[0]->SystemId)
						$LASTPOST = $postobj->Text;
				}
			}
		}
	}

	if($FULL)
		$oppostcount=0;

	if($lppflag == $USER->Browsers[0]->SystemId)
		$oppostcount=-1;
		
	if(!empty($spkthtml) && !$spkt)
		addHTML($spkthtml,"sys","SPKT" . $USER->Browsers[0]->InternalUser->SystemId);
	
	if(!empty($posthtml))
		addHTML($posthtml,$lppflag);

	if(!empty($LASTPOST))
		$USER->AddFunctionCall("lz_chat_set_last_post('".base64_encode(trim(html_entity_decode($LASTPOST,ENT_COMPAT,"UTF-8")))."');",false);
	
	if($psound)
		$USER->AddFunctionCall("lz_chat_play_sound('message');",false);

	if(!empty($_GET["tid"]))
    {
		if($ticket = $USER->SaveTicket(getOParam("eg","",$c),$USER->GeoCountryISO2,false,true,BaseURL::GetInputURL()))
		{
			$USER->Browsers[0]->SaveLoginData();
            $ticket->SendAutoresponder($USER,$USER->Browsers[0]);
		}
    }

	$HTML = str_replace("<!--server-->",LIVEZILLA_URL,$HTML);
	
	if($LANGUAGE)
		$HTML = applyReplacements($HTML,$LANGUAGE,false);

	if(!empty($HTML))
		$USER->AddFunctionCall("lz_chat_add_html_element('".base64_encode($HTML)."',true,".$lpr.",".$LMR.",'".base64_encode($LASTPOSTER)."','".@$_GET["lp"]."',".$oppostcount.");",false);

    $wmsg = "null";
    if(!empty($CONFIG["gl_wmes"]) && $CONFIG["gl_wmes"]>-1 && empty($_GET["ovlntwo"]))
    {
        $wmsg = $LZLANG["client_still_waiting_int"];
        $wmsg .= " <a href=\"javascript:lz_chat_require_leave_message();\"><b>" . $LZLANG["client_leave_message"] . "</b></a>";
        $wmsg .= " " . $LZLANG["client_thank_you"];
        $wmsg = "'".base64_encode(statusHTML($wmsg))."'";
    }

    $USER->AddFunctionCall("lz_chat_set_connecting(".parseBool(!$BOTMODE && (!empty($USER->Browsers[0]->ChatId) && !$USER->Browsers[0]->InternalActivation && !$USER->Browsers[0]->Closed && !$USER->Browsers[0]->Declined)).",'".$USER->Browsers[0]->SystemId."',".parseBool(!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->Status==USER_STATUS_AWAY).",".$wmsg.",".intval($CONFIG["gl_wmes"]).");",false);

	if($REPOLL)
		$USER->AddFunctionCall("lz_tracking_poll_server(1211);",false);

    if($USER->Browsers[0]->TranslationSettings != null)
        $USER->AddFunctionCall("lz_chat_set_translation(". $USER->Browsers[0]->TranslationSettings[0] . ",'". base64_encode($USER->Browsers[0]->TranslationSettings[1]) . "','" . base64_encode($USER->Browsers[0]->TranslationSettings[2]) . "');",false);
    else
        $USER->AddFunctionCall("lz_chat_set_translation(null,null,null);",false);

    if($FULL)
        $USER->AddFunctionCall("lz_chat_load_input_values();",false);

    reloadGroups($USER,true,@$_GET["pc"] == 1);

    if(!empty($USER->Browsers[0]->DesiredChatGroup))
        $USER->AddFunctionCall("lz_chat_set_input_fields();",false);
    else
        $USER->AddFunctionCall(false,false,false,false);

    if($USER->Browsers[0]->Declined)
        $chatst = 0;
    else if($BOTMODE && !empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->IsBot)
        $chatst = 1;
    else if($USER->Browsers[0]->Waiting || $USER->Browsers[0]->Status>0)
        $chatst=max($USER->Browsers[0]->Status,$USER->Browsers[0]->Waiting);
    else
        $chatst = 0;

    $USER->AddFunctionCall("lz_chat_set_application(".parseBool($chat_available).",".parseBool($BOTMODE).",".parseBool($HUMAN_GENERAL).",'".$bottitle."',".$chatst.",".parseBool($USER->Browsers[0]->Declined).");",false);

    if(@$_GET["pc"] == 1)
        $USER->AddFunctionCall("lz_chat_set_focus();",false);
}
$OVLPAGE = $USER->Response;

function postHTML($_text,$_translation,$_add,$_operator,$_name,$_time,$_senderId)
{
	global $LZLANG,$INTERNAL,$USER;
	$post = ($_add) ? ((!$_operator) ? getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_EXTERN) : getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_OPERATOR)) : ((!$_operator) ? getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_ADD) : getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_OPERATOR_ADD));

    if($_operator && !empty($USER->Browsers[0]->DesiredChatPartner) && isset($INTERNAL[$USER->Browsers[0]->DesiredChatPartner]) && isset($INTERNAL[$_senderId]))
        $image = "<img class=\"lz_overlay_chat_operator_picture\" src=\"".LIVEZILLA_URL . $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->GetOperatorPictureFile()."\" width=\"52\" height=\"39\">";
    else
        $image = "";

    $post = str_replace("<!--name-->",($_operator) ? $_name : ((!empty($_name)) ? $_name : $LZLANG["client_guest"]),$post);
	$post = str_replace("<!--time-->",$_time,$post);
    $post = str_replace("<!--picture-->",$image,$post);
    $post = str_replace("<!--lang_client_edit-->",strtoupper($LZLANG["client_edit"]),$post);
    $color = getBrightness(base64UrlDecode($_GET["ovlc"])) > getBrightness(base64UrlDecode($_GET["ovlct"])) ? $_GET["ovlct"] : $_GET["ovlc"];
    $post = str_replace("<!--color-->",($_operator) ? hexDarker(str_replace("#","",base64UrlDecode($color)),50) : "#000000",$post);
    $_text = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_text,"<a><br><b><ul><li><ol><b><i><u><strong><img>"));
    if(!empty($_translation))
    {
        $_translation = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_translation,"<a><br><b><ul><li><ol><b><i><u><strong><img>"));
        $_text = $_translation . "<div class='lz_overlay_translation'>" . $_text . "</div>";
    }
    return str_replace("<!--message-->",$_text,$post);
}

function speakingToHTML($_opId)
{
	global $USER,$LZLANG,$INTERNAL;
	$html = "";
	
	if(!empty($USER->Browsers[0]->InternalUser))
	{
		if(!empty($_opId) && $_opId != $USER->Browsers[0]->InternalUser->SystemId)
            $_opId="";
				
		if($USER->Browsers[0]->DesiredChatPartner != $USER->Browsers[0]->InternalUser->SystemId)
		{
			$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InternalUser->SystemId;
			$USER->Browsers[0]->Save();
		}
		if(!$USER->Browsers[0]->Closed && $USER->Browsers[0]->InternalActivation && empty($_opId))
		{
			$text = $LZLANG["client_now_speaking_to"];
			if($USER->Browsers[0]->InternalUser->IsBot)
				return;
		
			$html .= statusHTML(str_replace("<!--operator_name-->",$USER->Browsers[0]->InternalUser->Fullname,$text));
			if(!$USER->Browsers[0]->ExternalActivation)
				$USER->Browsers[0]->ExternalActivate();
			$USER->AddFunctionCall("lz_chat_set_host('" . $USER->Browsers[0]->InternalUser->SystemId . "','".$USER->Browsers[0]->ChatId."','".$USER->Browsers[0]->DesiredChatGroup."','" . $USER->Browsers[0]->InternalUser->UserId . "','".strtoupper($INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Language)."');",false);
		}
	}
	return $html;
}

function addHTML($_html,$_poster,$_lmr="")
{
	global $LASTPOSTER,$HTML,$LMRFLAG,$LMR;
	if(!empty($_lmr) && $_lmr == $LMRFLAG)
		return;
	else if(!empty($_lmr))
		$LMR = "'".base64_encode($_lmr)."'";
	$HTML .= $_html;
	$LASTPOSTER = $_poster;
}

function statusHTML($_text)
{
	$body = getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);
	return str_replace("<!--message-->",$_text,$body);
}

function inviteHTML($_operatorID,$_text,$_crid)
{
	global $INTERNAL,$LANGUAGE;
	$html = getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_INVITE);
	$html = str_replace("<!--display_image-->","''",$html);
	$html = str_replace("<!--image-->","<img class=\"lz_overlay_chat_operator_picture\" align=\"left\" src=\"".LIVEZILLA_URL.$INTERNAL[$_operatorID]->GetOperatorPictureFile()."\" width=\"52\" height=\"39\">",$html);
	$html = str_replace("<!--font_color-->","#000000",$html);
	$html = str_replace("<!--id-->",$_crid,$html);
	$LANGUAGE = true;
	return str_replace("<!--message-->",str_replace("<!--intern_name-->",$INTERNAL[$_operatorID]->Fullname,$_text),$html);
}

function leaveChatHTML($_host,$_name,$_add="")
{
	global $LZLANG,$USER;
	$html = getFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);
	if($_host)
		$USER->AddFunctionCall("lz_chat_set_host(null,'".$USER->Browsers[0]->ChatId."','','',null);",false);
	return str_replace("<!--message-->",str_replace("<!--intern_name-->",$_name,$LZLANG["client_intern_left"]).$_add,$html);
}

function initChat()
{
	global $INTERNAL,$USER,$ROUTER,$CONFIG,$BOTMODE,$GROUPS,$LZLANG;
	if(empty($USER->Browsers[0]->ChatId))
	{
		$USER->Browsers[0]->SetChatId();
		$USER->AddFunctionCall("lz_closed=false;lz_chat_id='".$USER->Browsers[0]->ChatId."';",false);
	}

	if($USER->Browsers[0]->Status == CHAT_STATUS_OPEN)
	{
		if(!empty($USER->Browsers[0]->InitChatWith))
        {
			$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InitChatWith;
            $USER->AddFunctionCall("lz_chat_input_bot_state(false,false);",false);
        }
		if(!empty($USER->Browsers[0]->DesiredChatPartner) && $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->IsBot && !$BOTMODE)
			$USER->Browsers[0]->DesiredChatPartner = null;

        $USER->Browsers[0]->FindOperator($USER,$BOTMODE,$BOTMODE);

		if((count($ROUTER->OperatorsAvailable) + $ROUTER->OperatorsBusy) > 0)
		{
			$chatPosition = $ROUTER->GetQueuePosition($USER->Browsers[0]->DesiredChatGroup);
            $chatWaitingTime = $ROUTER->GetQueueWaitingTime($chatPosition);

			$USER->Browsers[0]->SetWaiting(!$BOTMODE && !($chatPosition == 1 && count($ROUTER->OperatorsAvailable) > 0 && !(!empty($USER->Browsers[0]->InternalUser) && $USER->Browsers[0]->InternalUser->Status == USER_STATUS_BUSY)));
			if(!$USER->Browsers[0]->Waiting)
			{
				if($CONFIG["gl_alloc_mode"] != ALLOCATION_MODE_ALL || !empty($USER->Browsers[0]->DesiredChatPartner))
				{
					$USER->Browsers[0]->CreateChat($INTERNAL[$USER->Browsers[0]->DesiredChatPartner],$USER,true,"","",false);
				}
				else
				{
					foreach($ROUTER->OperatorsAvailable as $intid => $am)
						$USER->Browsers[0]->CreateChat($INTERNAL[$intid],$USER,false,"","",false);
				}
				$USER->Browsers[0]->LoadMembers();

                if(!empty($GROUPS[$USER->Browsers[0]->DesiredChatGroup]->PostJS))
                    $USER->AddFunctionCall("lz_chat_execute('".base64_encode($GROUPS[$USER->Browsers[0]->DesiredChatGroup]->PostJS)."');",false);
			}
			else
            {
                if($USER->Browsers[0]->IsMaxWaitingTime(true))
                {
                    $USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);lz_mode_create_ticket=true;",false);
                    $USER->Browsers[0]->UpdateUserStatus(false,false,true,false,false);
                }

                $qtext = (!empty($CONFIG["gl_sho_qu_inf"]) ? $LZLANG["client_ints_are_busy"]." ".$LZLANG["client_queue_message"] : $LZLANG["client_ints_are_busy"]);

                $USER->Browsers[0]->ShowQueueInformation($USER,$chatPosition,$chatWaitingTime,statusHTML($qtext));
                $gqmt = $USER->Browsers[0]->ShowGroupQueueInformation($USER,$USER->Browsers[0]->QueueMessageShown);
                if(!empty($gqmt))
                    addHTML(statusHTML($gqmt),"sys","GQM");

                if(!$ROUTER->WasTarget && !empty($USER->Browsers[0]->DesiredChatPartner))
                    $USER->Browsers[0]->DesiredChatPartner = "";

                $USER->Browsers[0]->CreateArchiveEntry(null,$USER);
            }
		}
	}
	else
	{
		if(!$USER->Browsers[0]->ArchiveCreated && !empty($USER->Browsers[0]->DesiredChatPartner))
			$USER->Browsers[0]->CreateChat($INTERNAL[$USER->Browsers[0]->DesiredChatPartner],$USER,true);
	}
}

?>
