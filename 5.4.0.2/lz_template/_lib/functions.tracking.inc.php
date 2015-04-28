<?php
/****************************************************************************************
* LiveZilla functions.tracking.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
function abortTracking($_code)
{
	exit("lz_tracking_stop_tracking(".$_code.");");
}

function triggerEvents()
{
	global $BROWSER,$EVENTS,$EXTERNALUSER,$STATS,$GROUPS;

	if(count($EVENTS)==0)
		return;

	$actionData = "";
	$url = $BROWSER->History[count($BROWSER->History)-1];
	$previous = (count($BROWSER->History) > 1) ? $BROWSER->History[count($BROWSER->History)-2]->Url->GetAbsoluteUrl() : "";
	$EXTERNALUSER->GetChatRequestResponses();
	
	foreach($EVENTS->Events as $event)
	{
		if(!$event->IsActive || empty($url))
			continue;

		$urlor = (count($event->FunnelUrls) == 0 && $event->MatchesURLCriterias($url->Url->GetAbsoluteUrl(),$url->Referrer->GetAbsoluteUrl(),$previous,time()-($url->Entrance)));
		$urlfunnel = (count($event->FunnelUrls) > 0 && $event->MatchesURLFunnelCriterias($BROWSER->History));
		$global = $event->MatchesGlobalCriterias(count($BROWSER->History),($EXTERNALUSER->ExitTime-$EXTERNALUSER->FirstActive),$EXTERNALUSER->HasAcceptedChatRequest,$EXTERNALUSER->HasDeclinedChatRequest,$EXTERNALUSER->WasInChat(),$BROWSER->Query);

		if($global && ($urlfunnel || $urlor))
		{
			foreach(array($event->Goals,$event->Actions) as $elements)
				foreach($elements as $action)
				{
					$EventTrigger = new EventTrigger(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Id,time(),1);
					$EventTrigger->Load();
					$aexists = $action->Exists(CALLER_USER_ID,CALLER_BROWSER_ID);
					if(!$EventTrigger->Exists || ($EventTrigger->Exists && $event->MatchesTriggerCriterias($EventTrigger)))
					{
						if(!$aexists)
						{
							if($event->SaveInCookie)
							{
								if(!isnull(getCookieValue("ea_" . $action->Id)))
									continue;
								else
									setCookieValue("ea_" . $action->Id,time());
							}
							$EventTrigger->Save($event->Id);
							if($action->Type < 2)
							{
								foreach($action->GetInternalReceivers() as $user_id)
								{
									$intaction = new EventActionInternal($user_id, $EventTrigger->Id);
									$intaction->Save();
								}
							}
							else if($action->Type == 2 && !defined("EVENT_INVITATION"))
							{
								$sender = getActionSender($action->Invitation->Senders,true);
								initData(array("GROUPS"));
								if(!empty($sender) && !empty($GROUPS[$sender->GroupId]) && $GROUPS[$sender->GroupId]->IsHumanAvailable(false) && !($BROWSER->ChatRequest != null && !$BROWSER->ChatRequest->Closed) && !$EXTERNALUSER->IsInChat(false,null,true))
								{
									define("EVENT_INVITATION",true);
									$chatrequest = new ChatRequest($sender->UserSystemId,$sender->GroupId,CALLER_USER_ID,CALLER_BROWSER_ID,getActionText($sender,$action));
									$chatrequest->EventActionId = $action->Id;
									$chatrequest->Save();
									if(!$chatrequest->Displayed)
										$BROWSER->ForceUpdate();
                                    $BROWSER->ChatRequest = $chatrequest;
								}
							}
							else if($action->Type == 3 && !defined("EVENT_ALERT"))
							{
								define("EVENT_ALERT",true);
								$alert = new Alert(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Value);
								$alert->EventActionId = $action->Id;
								$alert->Save();
								$BROWSER->LoadAlerts();
							}
							else if($action->Type == 4 && !defined("EVENT_WEBSITE_PUSH"))
							{
								define("EVENT_WEBSITE_PUSH",true);
								$sender = getActionSender($action->WebsitePush->Senders,false);
								$websitepush = new WebsitePush($sender->UserSystemId,$sender->GroupId,CALLER_USER_ID,CALLER_BROWSER_ID,getActionText($sender,$action),$action->WebsitePush->Ask,$action->WebsitePush->TargetURL);
								$websitepush->EventActionId = $action->Id;
								$websitepush->Save();
								$BROWSER->LoadWebsitePush();
							}
							else if($action->Type == 5 && !defined("EVENT_OVERLAY_BOX"))
							{
								define("EVENT_OVERLAY_BOX",true);
								$overlaybox = new OverlayBox(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Value);
								$overlaybox->EventActionId = $action->Id;
								$overlaybox->Save();
								$BROWSER->LoadOverlayBoxes();
							}
							else if($action->Type == 9 && STATS_ACTIVE)
							{
								$STATS->ProcessAction(ST_ACTION_GOAL,array(CALLER_USER_ID,$action->Id,(($EXTERNALUSER->Visits==1)?1:0),$BROWSER->GetQueryId(getCookieValue("sp"),null,255,true)));
							}
						}
					}
					if($EventTrigger->Exists && $aexists)
						$EventTrigger->Update();
				}
		}
	}
	return $actionData;
}

function getActionSender($_senders,$_checkOnline,$maxPriority=0,$minChats=100)
{
	global $CONFIG,$INTERNAL,$GROUPS;
	initData(array("INTERNAL","GROUPS"));
	foreach($_senders as $sender)
		if(isset($INTERNAL[$sender->UserSystemId]) && (!$_checkOnline || (($INTERNAL[$sender->UserSystemId]->LastActive > (time()-$CONFIG["timeout_clients"])) && $INTERNAL[$sender->UserSystemId]->Status == USER_STATUS_ONLINE)))
		{
			$maxPriority = max($maxPriority,$sender->Priority);
			if($maxPriority == $sender->Priority)
			{
				$INTERNAL[$sender->UserSystemId]->GetExternalObjects();
				$minChats = min($minChats, count($INTERNAL[$sender->UserSystemId]->ExternalChats));
				$asenders[] = $sender;
			}
		}
	if(!empty($asenders) && count($asenders)==1)
		return $asenders[0];
	else if(empty($asenders))
		return null;
	foreach($asenders as $sender)
		if($minChats == count($INTERNAL[$sender->UserSystemId]->ExternalChats))
			$fsenders[] = $sender;
	return $fsenders[array_rand($fsenders,1)];
}

function getActionText($_sender,$_action,$break=false,$sel_message = null)
{
	global $EXTERNALUSER,$INTERNAL,$GROUPS,$BROWSER;
	if(!empty($_action->Value))
		return $_action->Value;

	$available = array($INTERNAL[$_sender->UserSystemId]->PredefinedMessages,$GROUPS[$_sender->GroupId]->PredefinedMessages);
	foreach($available as $list)
	{
		foreach($list as $message)
		{
			if(($message->IsDefault && (empty($EXTERNALUSER->Language))) || ($EXTERNALUSER->Language == $message->LangISO))
			{
				$sel_message = $message;
				$break = true;
				break;
			}
			else if($message->IsDefault && empty($_action->Value))
			{
				$sel_message = $message;
			}
		}
		if($break)
			break;
	}



	if($_action->Type == 2 && $sel_message != null)
		$_action->Value = $sel_message->InvitationAuto;
	else if($_action->Type == 4)
	{
		$_action->Value = $sel_message->WebsitePushAuto;
		$_action->Value = str_replace("%target_url%",$_action->WebsitePush->TargetURL,$_action->Value);
	}

    $_action->Value = $GROUPS[$_sender->GroupId]->TextReplace($_action->Value,$message->LangISO);
    $_action->Value = $EXTERNALUSER->TextReplace($_action->Value);
    $_action->Value = $BROWSER->TextReplace($_action->Value);
    $_action->Value = $INTERNAL[$_sender->UserSystemId]->TextReplace($_action->Value);
    $_action->Value = configTextReplace($_action->Value);
	return $_action->Value;
}

function processActions($actionData = "", $_chatsExternal)
{
	global $BROWSER,$CONFIG,$INTERNAL,$EVENTS,$GROUPS;
	if(!empty($BROWSER->ChatRequest))
	{
		initData(array("INTERNAL","GROUPS"));
		if(($INTERNAL[$BROWSER->ChatRequest->SenderSystemId]->LastActive < (time()-$CONFIG["timeout_clients"])) || $INTERNAL[$BROWSER->ChatRequest->SenderSystemId]->Status != USER_STATUS_ONLINE || !$INTERNAL[$BROWSER->ChatRequest->SenderSystemId]->IsExternal($GROUPS, null, null) || $BROWSER->ChatRequest->Closed || !empty($BROWSER->ChatRequest->Canceled))
		{
			if(!$BROWSER->ChatRequest->Closed)
			{
				$BROWSER->ChatRequest->SetStatus(false,false,empty($BROWSER->ChatRequest->Canceled),true);
				$BROWSER->ForceUpdate();
			}
			$actionData .= "top.lz_tracking_close_request('".$BROWSER->ChatRequest->Id."');";
		}
		else if(isset($_GET["decreq"]) || isset($_GET["accreq"]))
		{
			if(isset($_GET["decreq"]))
				$BROWSER->ChatRequest->SetStatus(false,false,true,true);
			if(isset($_GET["accreq"]))
				$BROWSER->ChatRequest->SetStatus(false,true,false,true);
			if(isset($_GET["clreq"]))
				$actionData .= "top.lz_tracking_close_request();";
			if(!$BROWSER->ChatRequest->Closed)
				$BROWSER->ForceUpdate();
		}
		else if(!$BROWSER->ChatRequest->Accepted && !$BROWSER->ChatRequest->Declined)
		{
			if(!empty($_GET["ovlc"]) && !$_chatsExternal)
			{

			}
			else if(empty($BROWSER->ChatRequest->EventActionId))
			{
				$invitationSettings = @unserialize(base64_decode($CONFIG["gl_invi"]));
				array_walk($invitationSettings,"b64dcode");
				$invitationHTML = applyReplacements($BROWSER->ChatRequest->CreateInvitationTemplate($invitationSettings[13],$CONFIG["gl_site_name"],$CONFIG["wcl_window_width"],$CONFIG["wcl_window_height"],LIVEZILLA_URL,$INTERNAL[$BROWSER->ChatRequest->SenderSystemId],$invitationSettings[0]));
				$BROWSER->ChatRequest->Invitation = new Invitation($invitationHTML,$BROWSER->ChatRequest->Text,$invitationSettings);
			}
			else if(!isnull($action = $EVENTS->GetActionById($BROWSER->ChatRequest->EventActionId)))
			{
				$invitationHTML = applyReplacements($BROWSER->ChatRequest->CreateInvitationTemplate($action->Invitation->Style,$CONFIG["gl_site_name"],$CONFIG["wcl_window_width"],$CONFIG["wcl_window_height"],LIVEZILLA_URL,$INTERNAL[$BROWSER->ChatRequest->SenderSystemId],$action->Invitation->CloseOnClick));
				$BROWSER->ChatRequest->Invitation = $action->Invitation;
				$BROWSER->ChatRequest->Invitation->Text = $BROWSER->ChatRequest->Text;
				$BROWSER->ChatRequest->Invitation->HTML = $invitationHTML;
			}
			if(!$BROWSER->ChatRequest->Displayed)
			{
				$BROWSER->ForceUpdate();
				$BROWSER->ChatRequest->SetStatus(true,false,false,false);
			}
			if(!empty($BROWSER->ChatRequest->Invitation) && (!$BROWSER->OverlayContainer || $_chatsExternal))
			{
				$actionData .= $BROWSER->ChatRequest->Invitation->GetCommand($BROWSER->ChatRequest->Id);
			}
		}
	}
	if(!empty($BROWSER->WebsitePush))
	{
		if(isset($_GET[GET_TRACK_WEBSITE_PUSH_DECLINED]))
		{
			$BROWSER->WebsitePush->SetStatus(false,false,true);
		}
		else if(isset($_GET[GET_TRACK_WEBSITE_PUSH_ACCEPTED]) || (!$BROWSER->WebsitePush->Ask && !$BROWSER->WebsitePush->Displayed))
		{
			$BROWSER->WebsitePush->SetStatus(false,true,false);
			$actionData .= $BROWSER->WebsitePush->GetExecCommand();
		}
		else if($BROWSER->WebsitePush->Ask && !$BROWSER->WebsitePush->Accepted && !$BROWSER->WebsitePush->Declined)
		{
			$BROWSER->WebsitePush->SetStatus(true,false,false);
			$actionData .= $BROWSER->WebsitePush->GetInitCommand();
		}
	}
	if(!empty($BROWSER->Alert) && !$BROWSER->Alert->Accepted)
	{
		if(isset($_GET["confalert"]))
			$BROWSER->Alert->SetStatus(false,true);
		else
			$actionData .= $BROWSER->Alert->GetCommand();
	}
	if(!empty($BROWSER->OverlayBox) && !$BROWSER->OverlayBox->Closed && !isnull($action = $EVENTS->GetActionById($BROWSER->OverlayBox->EventActionId)))
	{
		if(isset($_GET["confol"]))
			$BROWSER->OverlayBox->SetStatus(true);
		else
		{
			$boxHTML = applyReplacements($BROWSER->OverlayBox->CreateOverlayTemplate($action->OverlayBox->Style,$CONFIG["gl_site_name"],$action->OverlayBox->Width,$action->OverlayBox->Height,LIVEZILLA_URL));
			$BROWSER->OverlayBox->OverlayElement = $action->OverlayBox;
			$BROWSER->OverlayBox->OverlayElement->HTML = $boxHTML;
			$actionData .= $BROWSER->OverlayBox->OverlayElement->GetCommand();
		}
	}
	return $actionData;
}

function getMonitoringPollFrequency($_chat,$_botChat)
{
	global $CONFIG;
    if($_botChat && !$_chat && empty($_GET["tth"]))
        return min($CONFIG["timeout_chats"]-2,$CONFIG["poll_frequency_tracking"]);
	if($_chat || !empty($_GET["tth"]))
        return $CONFIG["poll_frequency_clients"];
    if(empty($CONFIG["gl_vmac"]))
        return 86400*365;
	return $CONFIG["poll_frequency_tracking"];
}

function getJSCustomArray($_getCustomParams="",$_fromHistory=null)
{
	global $INPUTS;
	initData(array("INPUTS"));
	$valArray=array();
	foreach($INPUTS as $index => $input)
	{
		if($input->Active && $input->Custom)
		{
			if(isset($_GET["cf".$input->Index]))
				$valArray[$index] = "'" . getParam("cf".$input->Index) . "'";
			else if(!isnull(getCookieValue("cf_" . $input->Index)) && $input->Cookie)
				$valArray[$index] = "'" . base64UrlEncode(getCookieValue("cf_" . $input->Index)) . "'";
			else if(is_array($_fromHistory) && isset($_fromHistory[$input->Index]) && !empty($_fromHistory[$input->Index]))
				$valArray[$index] = "'" . base64UrlEncode($_fromHistory[$input->Index]) . "'";
			else
				$valArray[$index] = "''";
		}
		else if($input->Custom)
			$valArray[$index] = "''";
	}
	ksort($valArray);
	foreach($valArray as $param)
	{
		if(!empty($_getCustomParams))
			$_getCustomParams .= ",";
		$_getCustomParams .= $param;
	}
	return $_getCustomParams;
}

?>