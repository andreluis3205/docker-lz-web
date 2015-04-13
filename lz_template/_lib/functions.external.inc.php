<?php
/****************************************************************************************
* LiveZilla functions.external.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/

if(!defined("IN_LIVEZILLA"))
	die();

function listen($_user,$init=false)
{
	global $CONFIG,$GROUPS,$INTERNAL,$USER,$ROUTER,$VOUCHER,$DEFAULT_BROWSER_LANGUAGE,$LZLANG;
	$USER = $_user;
	if(!(IS_FILTERED && !FILTER_ALLOW_CHATS))
	{
		if(!empty($_POST["p_tid"]))
		{
			$VOUCHER = VisitorChat::GetMatchingVoucher(base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),base64UrlDecode($_POST["p_tid"]));
			if($VOUCHER != null)
				$USER->Browsers[0]->ChatVoucherId = $VOUCHER->Id;
		}
		if(empty($USER->Browsers[0]->ChatId))
		{
			$USER->Browsers[0]->SetChatId();
			$init = true;
		}

		if($USER->Browsers[0]->Status == CHAT_STATUS_OPEN)
		{
			initData(array("INTERNAL"));
			if(!empty($_POST[POST_EXTERN_USER_GROUP]) && (empty($USER->Browsers[0]->DesiredChatGroup) || $init))
				$USER->Browsers[0]->DesiredChatGroup = base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]);

			$USER->Browsers[0]->SetCookieGroup();
            $result = $USER->Browsers[0]->FindOperator($USER);

			if(!$result && $ROUTER->OperatorsBusy == 0)
			{
				$USER->AddFunctionCall("lz_chat_add_system_text(8,null);",false);
				$USER->AddFunctionCall("lz_chat_stop_system();",false);
			}
			else if((count($ROUTER->OperatorsAvailable) + $ROUTER->OperatorsBusy) > 0)
			{
				$USER->AddFunctionCall("lz_chat_set_id('".$USER->Browsers[0]->ChatId."');",false);
				$chatPosition = $ROUTER->GetQueuePosition($USER->Browsers[0]->DesiredChatGroup);
				$chatWaitingTime = $ROUTER->GetQueueWaitingTime($chatPosition);
                login($GROUPS[$USER->Browsers[0]->DesiredChatGroup]);
				$USER->Browsers[0]->SetWaiting(!($chatPosition == 1 && count($ROUTER->OperatorsAvailable) > 0 && !(!empty($USER->Browsers[0]->DesiredChatPartner) && $INTERNAL[$USER->Browsers[0]->DesiredChatPartner]->Status == USER_STATUS_BUSY)));
				if(!$USER->Browsers[0]->Waiting)
				{
					$USER->AddFunctionCall("lz_chat_show_connected();",false);
					$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_ALLOCATED);",false);
					if($CONFIG["gl_alloc_mode"] != ALLOCATION_MODE_ALL || !empty($USER->Browsers[0]->DesiredChatPartner))
					{
						$USER->Browsers[0]->CreateChat($INTERNAL[$USER->Browsers[0]->DesiredChatPartner],$USER,true);
					}
					else
					{
						$run=0;
						foreach($ROUTER->OperatorsAvailable as $intid => $am)
							$USER->Browsers[0]->CreateChat($INTERNAL[$intid],$USER,false,"","",true,($run++==0));
					}
				}
				else
				{
 					if(!empty($_GET["acid"]))
					{
                        $USER->AddFunctionCall("lz_chat_show_connected();",false);
						$pchatid = base64UrlDecode($_GET["acid"]);
						$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($USER->Browsers[0]->UserId)."' AND `chat_id`='".DBManager::RealEscape($pchatid)."' AND (`exit` > ".(time()-30)." OR `exit`=0) LIMIT 1;");
						if($result && DBManager::GetRowCount($result) == 1)
						{
							$row = DBManager::FetchArray($result);
							if(!empty($row["waiting"]))
							{
								$posts = unserialize($row["queue_posts"]);
								foreach($posts as $post)
									$USER->AddFunctionCall("lz_chat_repost_from_queue('".$post[0]."');",false);
								$USER->AddFunctionCall("lz_chat_data.QueuePostsAdded = true;",false);
							}
						}
					}
					if($USER->Browsers[0]->IsMaxWaitingTime(true))
					{
						displayDeclined();
						return $USER;
					}
                    if(empty($_GET["acid"]))
                    {
                        $USER->Browsers[0]->ShowQueueInformation($USER,$chatPosition,$chatWaitingTime,$LZLANG["client_queue_message"]);
                        $gqmt = $USER->Browsers[0]->ShowGroupQueueInformation($USER,$USER->Browsers[0]->QueueMessageShown);
                        if(!empty($gqmt))
                            $USER->AddFunctionCall("lz_chat_add_system_text(99,'".base64_encode($gqmt)."');",false);
                    }

                    if(!$ROUTER->WasTarget && !empty($USER->Browsers[0]->DesiredChatPartner))
                        $USER->Browsers[0]->DesiredChatPartner = "";

                    $USER->Browsers[0]->CreateArchiveEntry(null,$USER);
				}
			}
		}
		else
		{
            $action = $USER->Browsers[0]->GetMaxWaitingTimeAction(false);
            if($action == "MESSAGE" || ($action == "FORWARD" && !$USER->Browsers[0]->CreateAutoForward($USER)))
            {
                $USER->Browsers[0]->InternalDecline($USER->Browsers[0]->InternalUser->SystemId);
                displayDeclined();
            }
            else
            {
                if(!$USER->Browsers[0]->ArchiveCreated && !empty($USER->Browsers[0]->DesiredChatPartner))
                    $USER->Browsers[0]->CreateChat($INTERNAL[$USER->Browsers[0]->DesiredChatPartner],$USER,true);
                activeListen();
            }
		}

        if($USER->Browsers[0]->Status <= CHAT_STATUS_WAITING && empty($_POST["p_wls"]))
            $USER->AddFunctionCall("lz_chat_show_waiting_links('".base64_encode($wl = $GROUPS[$USER->Browsers[0]->DesiredChatGroup]->GetWaitingLinks($USER->Browsers[0]->Question,$DEFAULT_BROWSER_LANGUAGE))."');",false);
	}
	else
		displayFiltered();
	return $USER;
}

function activeListen($runs=1,$isPost=false)
{
	global $CONFIG,$USER,$VOUCHER;
	$USER->Browsers[0]->Typing = isset($_POST[POST_EXTERN_TYPING]);
	
	if(isset($_POST["p_tc_declined"]))
		$USER->Browsers[0]->UpdateArchive("");
	else if(isset($_POST["p_tc_email"]))
		$USER->Browsers[0]->UpdateArchive(base64UrlDecode($_POST["p_tc_email"]));
	
	if($USER->Browsers[0]->InternalUser->Status == USER_STATUS_OFFLINE)
		$USER->Browsers[0]->CloseChat(4);
	else
	{
		foreach($USER->Browsers[0]->Members as $sid => $member)
			if($USER->Browsers[0]->InternalUser->Status == USER_STATUS_OFFLINE)
				$USER->Browsers[0]->LeaveChat($sid);
				
		if($USER->Browsers[0]->InternalUser->SystemId != $USER->Browsers[0]->DesiredChatPartner)
			$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InternalUser->SystemId;
	}
	

    processForward();
    if(!empty($USER->Browsers[0]->Declined))
    {
        if($USER->Browsers[0]->Declined < (time()-($CONFIG["poll_frequency_clients"]*2)))
            displayDeclined();
        return $USER;
    }
    else if($USER->Browsers[0]->Closed || empty($USER->Browsers[0]->InternalUser))
    {
        displayQuit();
        return $USER;
    }
    else if($USER->Browsers[0]->Activated == CHAT_STATUS_WAITING && !(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
        beginnConversation();

    if($USER->Browsers[0]->Activated >= CHAT_STATUS_WAITING && !(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
    {
        refreshPicture();
        processTyping();
    }

    if($runs == 1 && isset($_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME]) && !isset($_POST[POST_EXTERN_USER_FILE_UPLOAD_ERROR]) && !(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
        $USER = $USER->Browsers[0]->RequestFileUpload($USER,base64UrlDecode($_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME]));
    else if($runs == 1 && isset($_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME]) && isset($_POST[POST_EXTERN_USER_FILE_UPLOAD_ERROR]))
        $USER = $USER->Browsers[0]->AbortFileUpload($USER,namebase(base64UrlDecode($_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME])),base64UrlDecode($_POST[POST_EXTERN_USER_FILE_UPLOAD_ERROR]));

    if(isset($_POST[POST_GLOBAL_SHOUT]))
        processPosts();
    else if(!empty($USER->Browsers[0]->InternalUser))
    {
        $autoReply=$USER->Browsers[0]->InternalUser->GetAutoReplies("",$USER->Browsers[0]);
        if(!empty($autoReply))
            ChatAutoReply::SendAutoReply($autoReply,$USER,$USER->Browsers[0]->InternalUser);
    }

    if($USER->Browsers[0]->Activated == CHAT_STATUS_ACTIVE)
    {
        $isPost = getNewPosts();
        $USER->Browsers[0]->SetStatus(CHAT_STATUS_ACTIVE);
        if(!empty($VOUCHER))
        {
            if((time()-$USER->Browsers[0]->LastActive) > 0)
                $VOUCHER->UpdateVoucherChatTime(time()-$USER->Browsers[0]->LastActive);
            if(!(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
                $VOUCHER->UpdateVoucherChatSessions($USER->Browsers[0]->ChatId);
            $vouchers = VisitorChat::GetRelatedChatVouchers(base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),$VOUCHER);
            $USER->AddFunctionCall("lz_chat_add_update_vouchers_init('".base64_encode(getChangeVoucherHTML($vouchers))."');",false);

            foreach($vouchers as $tonlist)
                $USER->AddFunctionCall("lz_chat_add_available_voucher('".$tonlist->Id."',".$tonlist->ChatTime.",".$tonlist->ChatTimeMax.",".$tonlist->ChatSessions.",".$tonlist->ChatSessionsMax.",".$tonlist->VoucherAutoExpire.",".parseBool($tonlist->VoucherAutoExpire < time()).");",false);
        }
        else
            $USER->AddFunctionCall("lz_chat_add_update_vouchers_init('".base64_encode("")."');",false);
    }

    if($USER->Browsers[0]->TranslationSettings != null)
    {
        $USER->AddFunctionCall("lz_chat_set_translation(". $USER->Browsers[0]->TranslationSettings[0] . ",'". base64_encode($USER->Browsers[0]->TranslationSettings[1]) . "','" . base64_encode($USER->Browsers[0]->TranslationSettings[2]) . "');",false);
    }

    if(isset($_POST[POST_GLOBAL_SHOUT]) || isset($_POST[POST_GLOBAL_NO_LONG_POLL]) || $isPost || (!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
    {
        //break;
    }
    else if(md5($USER->Response) != base64UrlDecode($_POST[POST_GLOBAL_XMLCLIP_HASH_ALL]))
    {
        $_POST[POST_GLOBAL_XMLCLIP_HASH_ALL] = md5($USER->Response);
        $USER->AddFunctionCall("lz_chat_listen_hash('". md5($USER->Response) . "','".getId(5)."');",false);
        //break;
    }
    else
    {
        $USER->Response = "";
        //break;
    }

}

function getChangeVoucherHTML($_vouchers)
{
	global $VOUCHER;
	$voucherHTML = getFile(PATH_TEMPLATES . "chat_voucher_change_item.tpl");
	$tableHTML = getFile(PATH_TEMPLATES . "chat_voucher_change_table.tpl");
	$vouchersHTML = "";
	
	foreach($_vouchers as $voucher)
	{
		$vouchersHTML .= $voucherHTML;
		$vouchersHTML = str_replace("<!--id-->",(($voucher->Id == $VOUCHER->Id) ? "<b>".$voucher->Id."</b>" : $voucher->Id),$vouchersHTML);
		$vouchersHTML = str_replace("<!--selected-->",(($voucher->Id == $VOUCHER->Id) ? "CHECKED" : ""),$vouchersHTML);
		if($voucher->ChatSessionsMax > -1)
			$vouchersHTML = str_replace("<!--sessions-->",($voucher->ChatSessions . " / " . $voucher->ChatSessionsMax),$vouchersHTML);
		else
			$vouchersHTML = str_replace("<!--display_sessions-->","none",$vouchersHTML);
			
		if($voucher->ChatTimeMax > -1)
			$vouchersHTML = str_replace("<!--time-->",formatTimeSpan($voucher->ChatTimeRemaining),$vouchersHTML);
		else
			$vouchersHTML = str_replace("<!--display_time-->","none",$vouchersHTML);
			
		if($voucher->VoucherAutoExpire > -1)
		{
			$parts = explode(date("Y",$voucher->VoucherAutoExpire),date("r",$voucher->VoucherAutoExpire));
			$vouchersHTML = str_replace("<!--expires-->",$parts[0] . date("Y",$voucher->VoucherAutoExpire),$vouchersHTML);
		}
		else
			$vouchersHTML = str_replace("<!--display_expires-->","none",$vouchersHTML);
			
		if(($voucher->ChatSessionsMax - $voucher->ChatSessions) > 0)
			$vouchersHTML = str_replace("<!--class_sessions-->","lz_chat_com_chat_panel_value",$vouchersHTML);
		else if(($voucher->ChatSessionsMax - $voucher->ChatSessions) <= 0)
			$vouchersHTML = str_replace("<!--class_sessions-->","lz_chat_com_chat_panel_value_over",$vouchersHTML);
			
		if($voucher->ChatTimeRemaining > 0)
			$vouchersHTML = str_replace("<!--class_time-->","lz_chat_com_chat_panel_value",$vouchersHTML);
		else if($voucher->ChatTimeRemaining <= 0)
			$vouchersHTML = str_replace("<!--class_time-->","lz_chat_com_chat_panel_value_over",$vouchersHTML);
			
		if($voucher->VoucherAutoExpire > time())
			$vouchersHTML = str_replace("<!--class_expires-->","lz_chat_com_chat_panel_value",$vouchersHTML);
		else if($voucher->VoucherAutoExpire > 0)
			$vouchersHTML = str_replace("<!--class_expires-->","lz_chat_com_chat_panel_value_over",$vouchersHTML);
			
		$vouchersHTML = str_replace("<!--display_sessions-->","''",$vouchersHTML);
		$vouchersHTML = str_replace("<!--display_time-->","''",$vouchersHTML);
		$vouchersHTML = str_replace("<!--display_expires-->","''",$vouchersHTML);
	}

	$tableHTML = str_replace("<!--vouchers-->",$vouchersHTML,$tableHTML);
	$tableHTML = str_replace("<!--server-->",LIVEZILLA_URL,$tableHTML);
	$tableHTML = str_replace("<!--vouchers-->",$vouchersHTML,$tableHTML);
	return applyReplacements($tableHTML,true,false);
}

function processForward()
{
	global $USER,$GROUPS,$VOUCHER;
	$USER->Browsers[0]->LoadForward();

	if(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Invite && !empty($USER->Browsers[0]->Forward->TargetGroupId) && !$USER->Browsers[0]->Forward->Processed)
	{

		if(!empty($VOUCHER) && !in_array($VOUCHER->TypeId ,$GROUPS[$USER->Browsers[0]->Forward->TargetGroupId]->ChatVouchersRequired))
			$USER->AddFunctionCall("lz_chat_switch_com_chat_box(false);",false);
		else if(!empty($GROUPS[$USER->Browsers[0]->Forward->TargetGroupId]->ChatVouchersRequired))
		{
			$VOUCHER = VisitorChat::GetMatchingVoucher($USER->Browsers[0]->Forward->TargetGroupId,base64UrlDecode($_POST["p_tid"]));
			if($VOUCHER != null)
				$USER->AddFunctionCall("lz_chat_switch_com_chat_box(true);",false);
		}

		$USER->AddFunctionCall("lz_chat_initiate_forwarding('".base64_encode($USER->Browsers[0]->Forward->TargetGroupId)."',".parseBool($USER->Browsers[0]->Forward->Auto).");",false);
		$USER->Browsers[0]->LeaveChat($USER->Browsers[0]->Forward->InitiatorSystemId);
		$USER->Browsers[0]->Forward->Save(true);
		$USER->Browsers[0]->ExternalClose();
		$USER->Browsers[0]->DesiredChatGroup = $USER->Browsers[0]->Forward->TargetGroupId;
		$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->Forward->TargetSessId;
		$USER->Browsers[0]->FirstActive=time();
		$USER->Browsers[0]->Save(true);
		$USER->Browsers[0]->SetCookieGroup();
	}
}

function getNewPosts()
{
	global $USER,$LZLANG;
	$isPost = false;
	foreach($USER->Browsers[0]->GetPosts($USER->Browsers[0]->ChatId) as $post)
	{
		$senderName = (!empty($post->SenderName)) ? $post->SenderName : ($LZLANG["client_guest"] . " " . getNoName($USER->UserId.getIP()));
		$USER->AddFunctionCall($post->GetCommand($senderName),false);
		$isPost = true;
	}
	return $isPost;
}

function processPosts($counter=0)
{
	global $USER,$STATS,$GROUPS,$INTERNAL,$LZLANG;
	while(isset($_POST["p_p" . $counter]))
	{
		if(STATS_ACTIVE)
			$STATS->ProcessAction(ST_ACTION_EXTERNAL_POST);

		$id = md5($USER->Browsers[0]->SystemId . getOParam(POST_EXTERN_CHAT_ID,0,$nu,FILTER_SANITIZE_NUMBER_INT) . base64UrlDecode($_POST["p_i" . $counter]));
        $senderName = (!empty($USER->Browsers[0]->Fullname)) ? $USER->Browsers[0]->Fullname : ($LZLANG["client_guest"] . " " . getNoName($USER->UserId.getIP()));
		$post = new Post($id,$USER->Browsers[0]->SystemId,"",base64UrlDecode($_POST["p_p" . $counter]),time(),$USER->Browsers[0]->ChatId,$senderName);

		foreach($GROUPS as $groupid => $group)
        {
			if($group->IsDynamic && isset($group->Members[$USER->Browsers[0]->SystemId]))
			{
				foreach($group->Members as $member => $persistent)
					if($member != $USER->Browsers[0]->SystemId)
					{
						if(!empty($INTERNAL[$member]))
							processPost($id,$post,$member,$counter,$groupid,$USER->Browsers[0]->ChatId);
						else
							processPost($id,$post,$member,$counter,$groupid,getValueBySystemId($member,"chat_id",""));
					}
				$pGroup=$group;
			}
        }
		foreach($USER->Browsers[0]->Members as $systemid => $member)
		{
			if(!empty($member->Declined))
				continue;
				
			if(!empty($INTERNAL[$systemid]) && isset($pGroup->Members[$systemid]))
				continue;
				
			if(!(!empty($pGroup) && !empty($INTERNAL[$systemid])))
				processPost($id,$post,$systemid,$counter,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId);
		}

        $autoReply=$USER->Browsers[0]->InternalUser->GetAutoReplies($post->Text,$USER->Browsers[0]);
        if(!empty($autoReply))
            ChatAutoReply::SendAutoReply($autoReply,$USER,$INTERNAL[$systemid]);

		$USER->AddFunctionCall("lz_chat_release_post('".base64UrlDecode($_POST["p_i" . $counter])."');",false);
		$counter++;
	}
	
	$counter=0;
	while(isset($_POST["pr_i" . $counter]))
	{
		$post = new Post(base64UrlDecode($_POST["pr_i" . $counter]),"","","","","","");
		$post->MarkReceived($USER->Browsers[0]->SystemId);
		$USER->AddFunctionCall("lz_chat_message_set_received('".base64UrlDecode($_POST["pr_i" . $counter])."');",false);
		$counter++;
	}

}

function processPost($id,$post,$systemid,$counter,$rgroup,$chatid,$_received=false)
{
    global $USER,$CONFIG;
	$post->Id = $id;

	if(isset($_POST["p_pt" . $counter]))
	{
		$post->Translation = base64UrlDecode($_POST["p_pt" . $counter]);
		$post->TranslationISO = base64UrlDecode($_POST["p_ptiso" . $counter]);
	}
	$post->ChatId = $chatid;
	$post->ReceiverOriginal =
	$post->Receiver = $systemid;
	$post->ReceiverGroup = $rgroup;
	$post->Received=$_received;
	$post->Save();

    if((!empty($CONFIG["gl_sfc"]) && Visitor::CreateSPAMFilter($USER->UserId)))
        return false;

	return true;
}

function login($_group)
{
	global $USER,$INPUTS;
	initData(array("INPUTS"));

	if(!$INPUTS[111]->IsServerInput() && !isnull(getCookieValue("form_111")) && $INPUTS[111]->Cookie)
		$USER->Browsers[0]->Fullname = cutString(getCookieValue("form_111"),255);
	else if(!empty($_POST[POST_EXTERN_USER_NAME]))
		$USER->Browsers[0]->Fullname = cutString($_group->GetServerInput($INPUTS[111]),255);
		
	if(!$INPUTS[112]->IsServerInput() && !isnull(getCookieValue("form_112")) && $INPUTS[112]->Cookie)
		$USER->Browsers[0]->Email = cutString(getCookieValue("form_112"),255);
	else
		$USER->Browsers[0]->Email = cutString($_group->GetServerInput($INPUTS[112]),255);
		
	if(!$INPUTS[113]->IsServerInput() && !isnull(getCookieValue("form_113")) && $INPUTS[113]->Cookie)
		$USER->Browsers[0]->Company = cutString(getCookieValue("form_113"),255);
	else
		$USER->Browsers[0]->Company = cutString($_group->GetServerInput($INPUTS[113]),255);
		
	if(!$INPUTS[114]->IsServerInput() && !isnull(getCookieValue("form_114")) && $INPUTS[114]->Cookie)
		$USER->Browsers[0]->Question = cutString(getCookieValue("form_114"),MAX_INPUT_LENGTH);
	else
		$USER->Browsers[0]->Question = cutString($_group->GetServerInput($INPUTS[114]),MAX_INPUT_LENGTH);
		
	if(!$INPUTS[116]->IsServerInput() && !isnull(getCookieValue("form_116")) && $INPUTS[116]->Cookie)
		$USER->Browsers[0]->Phone = cutString(getCookieValue("form_116"),255);
	else
		$USER->Browsers[0]->Phone = cutString($_group->GetServerInput($INPUTS[116]),255);

	$USER->Browsers[0]->CallMeBack = !empty($_POST["p_cmb"]);
	$USER->Browsers[0]->ApplyInputValues($_group);
	$USER->Browsers[0]->SaveLoginData();
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_INIT);",false);
}

function replaceLoginDetails($_user,$values="",$keys="",$comma="")
{
	global $INPUTS;
	initData(array("INPUTS"));
	foreach($INPUTS as $index => $input)
	{
		$data = $input->GetValue($_user->Browsers[0]);
		$data = (!empty($data)) ? $data : (($input->Cookie && !isnull($input->GetCookieValue())) ? $input->GetCookieValue() : $input->GetServerInput());
        $values .= $comma . $input->GetJavascript($data);
		$keys .= $comma . "'".$index."'";
		$comma = ",";
	}
    $_user->AddFunctionCall("if(lz_chat_data.InputFieldIndices==null)lz_chat_data.InputFieldIndices = new Array(".$keys.");",false);
    $_user->AddFunctionCall("if(lz_chat_data.InputFieldValues==null)lz_chat_data.InputFieldValues = new Array(".$values.");",false);
    return $_user;
}

function getChatLoginInputs($_html,$_maxlength,$_overlay=false,$inputshtml="")
{
	global $INPUTS;
	initData(array("INPUTS"));
	foreach($INPUTS as $index => $dinput)
	{
        if($index == 115)
            $dinput->InfoText ="<!--lang_client_start_chat_comm_information-->";
		$inputshtml .= $dinput->GetHTML($_maxlength,($index == 115 || ($index == 116 && !empty($_GET["cmb"]))) ? true : $dinput->Active);
	}
	return str_replace("<!--chat_login_inputs-->",$inputshtml,$_html);
}

function refreshPicture()
{
	global $CONFIG,$USER;
	if(!empty($USER->Browsers[0]->InternalUser->WebcamPicture))
		$edited = $USER->Browsers[0]->InternalUser->WebcamPictureTime;
	else if(!empty($USER->Browsers[0]->InternalUser->ProfilePicture))
		$edited = $USER->Browsers[0]->InternalUser->ProfilePictureTime;
	else
		$edited = 0;
	$USER->AddFunctionCall("lz_chat_set_intern_image(".$edited.",'" . $USER->Browsers[0]->InternalUser->GetOperatorPictureFile() . "',false);",false);
	$USER->AddFunctionCall("lz_chat_set_config(".$CONFIG["timeout_chats"].",".$CONFIG["poll_frequency_clients"].");",false);
}

function processTyping($_dgroup="")
{
	global $USER,$GROUPS,$INTERNAL,$LZLANG;
	$groupname = addslashes($GROUPS[$USER->Browsers[0]->DesiredChatGroup]->GetDescription($USER->Language));
	foreach($GROUPS as $group)
		if($group->IsDynamic && isset($group->Members[$USER->Browsers[0]->SystemId]))
		{
			$_dgroup = $group->Descriptions["EN"];
			foreach($group->Members as $member => $persistent)
				if($member != $USER->Browsers[0]->SystemId)
				{
					if(!empty($INTERNAL[$member]))
					{
						if($INTERNAL[$member]->Status==USER_STATUS_OFFLINE)
							continue;
						$name = $INTERNAL[$member]->Fullname;
					}
					else
                    {
						$name = getValueBySystemId($member,"fullname",$LZLANG["client_guest"]);
                        if(empty($name))
                            $name = $LZLANG["client_guest"];
                    }
                    if($USER->Browsers[0]->DesiredChatPartner != $member && (!$persistent || $member == $USER->Browsers[0]->SystemId))
					    $USER->AddFunctionCall("lz_chat_set_room_member('".base64_encode($member)."','".base64_encode($name)."');",false);
				}
		}
	foreach($USER->Browsers[0]->Members as $sysid => $chatm)
		if($chatm->Status < 2 && empty($chatm->Declined))
			$USER->AddFunctionCall("lz_chat_set_room_member('".base64_encode($sysid)."','".base64_encode($INTERNAL[$sysid]->Fullname)."');",false);
	$USER->AddFunctionCall("lz_chat_set_host(\"".base64_encode($USER->Browsers[0]->InternalUser->UserId)."\",\"".base64_encode(addslashes($USER->Browsers[0]->InternalUser->Fullname))."\",\"". base64_encode($groupname)."\",\"".strtolower($USER->Browsers[0]->InternalUser->Language)."\",".parseBool($USER->Browsers[0]->InternalUser->Typing==$USER->Browsers[0]->SystemId).",".parseBool(!empty($USER->Browsers[0]->InternalUser->Profile) && $USER->Browsers[0]->InternalUser->Profile->Public).",\"". base64_encode($_dgroup)."\");",false);
}

function beginnConversation()
{
	global $USER,$CONFIG,$LZLANG;
	$USER->Browsers[0]->ExternalActivate();
	if(!empty($CONFIG["gl_save_op"]))
		setCookieValue("internal_user",$USER->Browsers[0]->InternalUser->UserId);
	$USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InternalUser->SystemId;
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_ACTIVE);",false);
	$USER->AddFunctionCall("lz_chat_shout(1);",false);

    if($CONFIG["gl_rddt"] > -1)
        $USER->AddFunctionCall("lz_chat_init_rating_drop_down(".($CONFIG["gl_rddt"]*60).");",false);

    if(!empty($_GET["cmb"]))
        $USER->AddFunctionCall("lz_chat_call_back_info('".base64_encode($LZLANG["client_thank_you"]." ".str_replace(array("<b>","</b>"),"",str_replace("<!--operator_name-->",$USER->Browsers[0]->InternalUser->Fullname,$LZLANG["client_now_speaking_to"])."</b>"))."');",false);
}

function displayFiltered()
{
	global $FILTERS,$USER;
	$USER->Browsers[0]->CloseChat(0);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'');",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(4,'".base64_encode("&nbsp;<b>".$FILTERS->Filters[ACTIVE_FILTER_ID]->Reason."</b>")."');",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function displayQuit()
{
	global $USER;
	$USER->Browsers[0]->CloseChat(1);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'');",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(3,null);",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function displayDeclined()
{
	global $USER;
	$USER->Browsers[0]->CloseChat(2);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'');",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(4,null);",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function buildLoginErrorField($error="",$addition = "")
{
	global $FILTERS,$LZLANG,$CONFIG;
	if(!getAvailability())
		return $LZLANG["client_error_deactivated"];
		
	if(!DB_CONNECTION || !empty($CONFIG["gl_stmo"]))
		return $LZLANG["client_error_unavailable"];

	if(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS)
	{
		$error = $LZLANG["client_error_unavailable"];
		if(isset($FILTERS->Message) && strlen($FILTERS->Message) > 0)
			$addition = "<br><br>" . $FILTERS->Message;
	}
	return $error . $addition;
}

function reloadGroups($_user,$_overlay=false,$_preSelect=true,$_declined=false)
{
	global $CONFIG,$INTERNAL,$GROUPS;
	initData(array("INTERNAL","FILTERS"));

    $grParam = UserGroup::ReadParams();
    $opParam = Operator::ReadParams();

    if(!empty($grParam) && empty($_user->Browsers[0]->DesiredChatGroup))
        $_user->Browsers[0]->DesiredChatGroup = $grParam;

    if(!empty($opParam))
		$_user->Browsers[0]->DesiredChatPartner = Operator::GetSystemId($opParam);

	$groupbuilder = new GroupBuilder($INTERNAL,$GROUPS,$CONFIG,$_user->Browsers[0]->DesiredChatGroup,$_user->Browsers[0]->DesiredChatPartner);
	$groupbuilder->Generate($_user);

    if(!empty($opParam))
		$_user->Browsers[0]->DesiredChatPartner = Operator::GetSystemId($opParam);

    $groupsAvailable = parseBool(($groupbuilder->GroupAvailable || (isset($_POST[GET_EXTERN_RESET]) && strlen($groupbuilder->ErrorHTML) <= 2)));
    $_preSelect = ($_preSelect) ? base64UrlEncode($_user->Browsers[0]->DesiredChatGroup) : "";

	$_user->AddFunctionCall("lz_chat_set_groups(" . $groupsAvailable . ",\"" . $groupbuilder->Result . "\" ,". $groupbuilder->ErrorHTML .",'".$_preSelect."');",false);

    if(!$_overlay)
	    $_user->AddFunctionCall("lz_chat_release(" . $groupsAvailable . ",".$groupbuilder->ErrorHTML.");",false);

	return $_user;
}

function getSessionId()
{
	if(!isnull(getCookieValue("userid")))
		$session = getCookieValue("userid");
	else if(!empty($_GET[GET_TRACK_USERID]))
		$session = base64UrlDecode(getParam(GET_TRACK_USERID));
	else
		setCookieValue("userid",$session = Visitor::IDValidate());
	return Visitor::IDValidate($session);
}

function getLanguageSelects($_mylang,$tlanguages="")
{
    global $LANGUAGES,$CONFIG;
    foreach($LANGUAGES as $iso => $langar)
        if($langar[1])
            $tlanguages .= "<option value=\"".strtolower($iso)."\"".(($_mylang[0]==$iso || (strtolower($iso) == strtolower($CONFIG["gl_default_language"]) && (empty($_mylang[0]) || (!empty($_mylang[0]) && isset($LANGUAGES[$_mylang[0]]) && !$LANGUAGES[$_mylang[0]][1]))))?" SELECTED":"").">".$langar[0]."</option>";
    return $tlanguages;

}

function isTicketFlood()
{
	$result = queryDB(true,"SELECT count(id) as ticket_count FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE time>".DBManager::RealEscape(time()-86400)." AND ip='".DBManager::RealEscape(getIP())."';");
	if($result)
	{
		$row = DBManager::FetchArray($result);
		return ($row["ticket_count"] > MAX_MAIL_PER_DAY);
	}
	else
		return true;
}

function getChatVoucherTemplate($html = "")
{
	global $CONFIG,$COUNTRIES,$LZLANG;
    initData(array("DBCONFIG"));
	if(!is("DB_CONNECTION") || !empty($CONFIG["db"]["ccpp"]["Custom"]))
		return "";
	
	if(!empty($CONFIG["gl_ccac"]))
		foreach($CONFIG["db"]["cct"] as $type)
			$html .= $type->GetTemplate();

	$cchtml = getFile(PATH_TEMPLATES . "chat_voucher_checkout.tpl");
	$mycountry = "";
	$replacements = array("<!--lp_company-->"=>"","<!--lp_firstname-->"=>"","<!--lp_email-->"=>"","<!--lp_lastname-->"=>"","<!--lp_taxid-->"=>"","<!--lp_business_type-->"=>"","<!--lp_address_1-->"=>"","<!--lp_address_2-->"=>"","<!--lp_city-->"=>"","<!--lp_state-->"=>"","<!--lp_country-->"=>"","<!--lp_phone-->"=>"","<!--lp_zip-->"=>"");
	$prefillco = (!empty($_GET["co"])) ? " OR id='".DBManager::RealEscape(base64URLDecode($_GET["co"]))."'" : "";
	
	if(!isnull(getCookieValue("userid")) || !empty($prefillco))
	{
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` WHERE `visitor_id`='".DBManager::RealEscape(getCookieValue("userid"))."'".$prefillco." ORDER BY `created` DESC LIMIT 1;");
		if($result)
		{
			if($row = DBManager::FetchArray($result))
			{
				$replacements = array("<!--lp_company-->"=>$row["company"],"<!--lp_firstname-->"=>$row["firstname"],"<!--lp_lastname-->"=>$row["lastname"],"<!--lp_taxid-->"=>$row["tax_id"],"<!--lp_email-->"=>$row["email"],"<!--lp_business_type-->"=>$row["business_type"],"<!--lp_address_1-->"=>$row["address_1"],"<!--lp_address_2-->"=>$row["address_2"],"<!--lp_city-->"=>$row["city"],"<!--lp_state-->"=>$row["state"],"<!--lp_country-->"=>$row["country"],"<!--lp_phone-->"=>$row["phone"],"<!--lp_zip-->"=>$row["zip"]);
				$mycountry = $row["country"];
			}
		}
	}
	$clist = $COUNTRIES;
	asort($clist);
	$countrieshtml = "";
	foreach($clist as $isokey => $value)
		if(!empty($isokey))
			$countrieshtml .= ($isokey == $mycountry) ? "<option value=\"".$isokey."\" SELECTED>".utf8_encode($value)."</option>" : "<option value=\"".$isokey."\">".utf8_encode($value)."</option>";
	$cchtml = str_replace("<!--countries-->",$countrieshtml,$cchtml);
	
	foreach($replacements as $key => $value)
		$cchtml = str_replace($key,$value,$cchtml);
	
	$cchtml = str_replace("<!--show_VAT-->",(!empty($CONFIG["gl_ccsv"])) ? "''" : "none",$cchtml);
	$cchtml = str_replace("<!--voucher_form-->",$html,$cchtml);
	
	if(!empty($CONFIG["db"]["ccpp"]["PayPal"]->LogoURL))
		$cchtml = str_replace("<!--pp_logo_url-->"," src=\"".$CONFIG["db"]["ccpp"]["PayPal"]->LogoURL."\"",$cchtml);
	else
		$cchtml = str_replace("<!--pp_logo_url-->","",$cchtml);
	
	$cchtml = str_replace("<!--extends_voucher-->",((!empty($_GET["co"]) && strlen(base64UrlDecode($_GET["co"])) == 16) ? base64UrlDecode($_GET["co"]) : ""),$cchtml);
    $cchtml = str_replace("<!--ofc-->",((!empty($_GET["ofc"])) ? "MQ__" : ""),$cchtml);

    $cchtml = str_replace("<!--VAT-->",str_replace("<!--VAT-->",$CONFIG["gl_ccva"],$LZLANG["client_voucher_include_vat"]),$cchtml);
	return $cchtml;
}
?>
