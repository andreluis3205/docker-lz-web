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

function activeListen($runs=1,$isPost=false)
{
	global $USER,$VOUCHER;
	$USER->Browsers[0]->Typing = isset($_POST[POST_EXTERN_TYPING]);
	
	if(isset($_POST["p_tc_declined"]))
		$USER->Browsers[0]->UpdateArchive("");
	else if(isset($_POST["p_tc_email"]))
		$USER->Browsers[0]->UpdateArchive(Encoding::Base64UrlDecode($_POST["p_tc_email"]));

    $USER->Browsers[0]->ValidateOperator();

    processForward();
    if(!empty($USER->Browsers[0]->Declined))
    {
        if($USER->Browsers[0]->Declined < (time()-(Server::$Configuration->File["poll_frequency_clients"]*2)))
            displayDeclined();
        return $USER;
    }
    else if($USER->Browsers[0]->Closed || empty($USER->Browsers[0]->OperatorId))
    {
        displayQuit();
        return $USER;
    }
    else if($USER->Browsers[0]->Activated == CHAT_STATUS_WAITING && !(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
        $USER->Browsers[0]->ExternalWindowActivate();

    if($USER->Browsers[0]->Activated >= CHAT_STATUS_WAITING && !(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
    {
        refreshPicture();
        updateMembers();
    }

    if(isset($_POST[POST_GLOBAL_SHOUT]))
        processPosts();
    else if(!empty($USER->Browsers[0]->OperatorId))
    {
        $autoReply=Server::$Operators[$USER->Browsers[0]->OperatorId]->GetAutoReplies("",$USER->Browsers[0]);
        if(!empty($autoReply))
            ChatAutoReply::SendAutoReply($autoReply,$USER,$USER->Browsers[0]->OperatorId);
    }

    if($USER->Browsers[0]->Activated == CHAT_STATUS_ACTIVE)
    {
        $isPost = receivePosts();
        $USER->Browsers[0]->SetStatus(CHAT_STATUS_ACTIVE);
        if(!empty($VOUCHER))
        {
            if((time()-$USER->Browsers[0]->LastActive) > 0)
                $VOUCHER->UpdateVoucherChatTime(time()-$USER->Browsers[0]->LastActive);
            if(!(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Processed))
                $VOUCHER->UpdateVoucherChatSessions($USER->Browsers[0]->ChatId);
            $vouchers = VisitorChat::GetRelatedChatVouchers(Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),$VOUCHER);
            $USER->AddFunctionCall("lz_chat_add_update_vouchers_init('".base64_encode(getChangeVoucherHTML($vouchers))."');",false);

            foreach($vouchers as $tonlist)
                $USER->AddFunctionCall("lz_chat_add_available_voucher('".$tonlist->Id."',".$tonlist->ChatTime.",".$tonlist->ChatTimeMax.",".$tonlist->ChatSessions.",".$tonlist->ChatSessionsMax.",".$tonlist->VoucherAutoExpire.",".To::BoolString($tonlist->VoucherAutoExpire < time()).");",false);
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
        $USER->AddFunctionCall("lz_chat_listen_hash('','".getId(5)."');",false);
    }
    else if(md5($USER->Response) != Encoding::Base64UrlDecode($_POST[POST_GLOBAL_XMLCLIP_HASH_ALL]))
    {
        $_POST[POST_GLOBAL_XMLCLIP_HASH_ALL] = md5($USER->Response);
        $USER->AddFunctionCall("lz_chat_listen_hash('". md5($USER->Response) . "','".getId(5)."');",false);
    }
    else
    {
        $USER->Response = "";
    }

}

function getChangeVoucherHTML($_vouchers)
{
	global $VOUCHER;
	$voucherHTML = IOStruct::GetFile(PATH_TEMPLATES . "chat_voucher_change_item.tpl");
	$tableHTML = IOStruct::GetFile(PATH_TEMPLATES . "chat_voucher_change_table.tpl");
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
			$vouchersHTML = str_replace("<!--time-->",SystemTime::FormatTimeSpan($voucher->ChatTimeRemaining),$vouchersHTML);
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
	return Server::Replace($tableHTML,true,false);
}

function processForward()
{
	global $USER,$VOUCHER;
	$USER->Browsers[0]->LoadForward();

	if(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Invite && !empty($USER->Browsers[0]->Forward->TargetGroupId) && !$USER->Browsers[0]->Forward->Processed)
	{
		if(!empty($VOUCHER) && !in_array($VOUCHER->TypeId ,Server::$Groups[$USER->Browsers[0]->Forward->TargetGroupId]->ChatVouchersRequired))
			$USER->AddFunctionCall("lz_chat_switch_com_chat_box(false);",false);
		else if(!empty(Server::$Groups[$USER->Browsers[0]->Forward->TargetGroupId]->ChatVouchersRequired))
		{
			$VOUCHER = VisitorChat::GetMatchingVoucher($USER->Browsers[0]->Forward->TargetGroupId,Encoding::Base64UrlDecode($_POST["p_tid"]));
			if($VOUCHER != null)
				$USER->AddFunctionCall("lz_chat_switch_com_chat_box(true);",false);
		}

		$USER->AddFunctionCall("lz_chat_initiate_forwarding('".base64_encode($USER->Browsers[0]->Forward->TargetGroupId)."',".To::BoolString($USER->Browsers[0]->Forward->Auto).");",false);
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

function receivePosts()
{
	global $USER;
	$isPost = false;
	foreach(Chat::GetMyPosts($USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId) as $post)
	{
		$senderName = (!empty($post->SenderName)) ? $post->SenderName : (LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($USER->UserId.Communication::GetIP()));
		$USER->AddFunctionCall($post->GetCommand($senderName),false);
		$isPost = true;
	}
	return $isPost;
}

function processPosts($counter=0)
{
	global $USER;
	while(isset($_POST["p_p" . $counter]))
	{
		if(STATS_ACTIVE)
			Server::$Statistic->ProcessAction(ST_ACTION_EXTERNAL_POST);

		$id = md5($USER->Browsers[0]->SystemId . Communication::GetParameter(POST_EXTERN_CHAT_ID,0,$nu,FILTER_SANITIZE_NUMBER_INT) . Encoding::Base64UrlDecode($_POST["p_i" . $counter]));
        $USER->Browsers[0]->UserData = UserData::FromSystemId($USER->Browsers[0]->SystemId);
        $senderName = (!empty($USER->Browsers[0]->UserData->Fullname)) ? $USER->Browsers[0]->UserData->Fullname : (LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($USER->UserId.Communication::GetIP()));
        $post = new Post($id,$USER->Browsers[0]->SystemId,"",Encoding::Base64UrlDecode($_POST["p_p" . $counter]),time(),$USER->Browsers[0]->ChatId,$senderName);

		foreach(Server::$Groups as $groupid => $group)
        {
			if($group->IsDynamic && isset($group->Members[$USER->Browsers[0]->SystemId]))
			{
				foreach($group->Members as $member => $persistent)
					if($member != $USER->Browsers[0]->SystemId)
					{
						if(!empty(Server::$Operators[$member]))
							processPost($id,$post,$member,$counter,$groupid,$USER->Browsers[0]->ChatId);
						else
							processPost($id,$post,$member,$counter,$groupid,CacheManager::GetValueBySystemId($member,"chat_id",""));
					}
				$pGroup=$group;
			}
        }
		foreach($USER->Browsers[0]->Members as $systemid => $member)
		{
			if(!empty($member->Declined))
				continue;
				
			if(!empty(Server::$Operators[$systemid]) && isset($pGroup->Members[$systemid]))
				continue;
				
			if(!(!empty($pGroup) && !empty(Server::$Operators[$systemid])))
				processPost($id,$post,$systemid,$counter,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId);
		}

        $autoReply=Server::$Operators[$USER->Browsers[0]->OperatorId]->GetAutoReplies($post->Text,$USER->Browsers[0]);
        if(!empty($autoReply))
            ChatAutoReply::SendAutoReply($autoReply,$USER,Server::$Operators[$systemid]);

		$USER->AddFunctionCall("lz_chat_release_post('".Encoding::Base64UrlDecode($_POST["p_i" . $counter])."');",false);
		$counter++;
	}
	
	$counter=0;
	while(isset($_POST["pr_i" . $counter]))
	{
		$post = new Post(Encoding::Base64UrlDecode($_POST["pr_i" . $counter]),"","","","","","");
		$post->MarkReceived($USER->Browsers[0]->SystemId);
		$USER->AddFunctionCall("lz_chat_message_set_received('".Encoding::Base64UrlDecode($_POST["pr_i" . $counter])."');",false);
		$counter++;
	}

}

function processPost($id,$post,$systemid,$counter,$rgroup,$chatid,$_received=false)
{
    global $USER;
	$post->Id = $id;

	if(isset($_POST["p_pt" . $counter]))
	{
		$post->Translation = Encoding::Base64UrlDecode($_POST["p_pt" . $counter]);
		$post->TranslationISO = Encoding::Base64UrlDecode($_POST["p_ptiso" . $counter]);
	}
	$post->ChatId = $chatid;
	$post->ReceiverOriginal =
	$post->Receiver = $systemid;
	$post->ReceiverGroup = $rgroup;
	$post->Received=$_received;
	$post->Save();

    if((!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter($USER->UserId)))
        return false;

	return true;
}

function getChatLoginInputs($_html,$_maxlength,$_overlay=false,$inputshtml="")
{
	Server::InitDataBlock(array("INPUTS"));
	foreach(Server::$Inputs as $index => $dinput)
	{
        if($index == 115)
            $dinput->InfoText ="<!--lang_client_start_chat_comm_information-->";
		$inputshtml .= $dinput->GetHTML($_maxlength,($index == 115 || ($index == 116 && !empty($_GET["cmb"]))) ? true : $dinput->Active,$_overlay);
	}
	return str_replace("<!--chat_login_inputs-->",$inputshtml,$_html);
}

function refreshPicture()
{
	global $USER;
	if(!empty(Server::$Operators[$USER->Browsers[0]->OperatorId]->WebcamPicture))
		$edited = Server::$Operators[$USER->Browsers[0]->OperatorId]->WebcamPictureTime;
	else if(!empty(Server::$Operators[$USER->Browsers[0]->OperatorId]->ProfilePicture))
		$edited = Server::$Operators[$USER->Browsers[0]->OperatorId]->ProfilePictureTime;
	else
		$edited = 0;
	$USER->AddFunctionCall("lz_chat_set_intern_image(".$edited.",'" . Server::$Operators[$USER->Browsers[0]->OperatorId]->GetOperatorPictureFile() . "',false);",false);
	$USER->AddFunctionCall("lz_chat_set_config(".Server::$Configuration->File["timeout_chats"].",".Server::$Configuration->File["poll_frequency_clients"].");",false);
}

function updateMembers($_dgroup="")
{
	global $USER;
    Server::InitDataBlock(array("DBCONFIG"));
	$groupname = addslashes(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->GetDescription($USER->Language));
	foreach(Server::$Groups as $group)
		if($group->IsDynamic && isset($group->Members[$USER->Browsers[0]->SystemId]))
		{
			$_dgroup = $group->Descriptions["EN"];
			foreach($group->Members as $member => $persistent)
				if(true || $member != $USER->Browsers[0]->SystemId)
				{
                    $isOperator = false;
                    $isBusyAway = false;
					if(!empty(Server::$Operators[$member]))
					{
                        $isOperator = true;
						if(Server::$Operators[$member]->Status==USER_STATUS_OFFLINE)
							continue;
                        if(Server::$Operators[$member]->Status != USER_STATUS_ONLINE || Server::$Operators[$member]->IsBot)
                            $isBusyAway = true;
						$name = Server::$Operators[$member]->Fullname;
					}
					else
                    {
						$data = UserData::FromSystemId($member);
                        $name = $data->Fullname;
                        if(empty($name))
                            $name = LocalizationManager::$TranslationStrings["client_guest"];

                        if($member != $USER->Browsers[0]->SystemId)
                        {
                            $chatobj = VisitorChat::GetBySystemId($member);
                            if(!($chatobj != null && !$chatobj->ExternalClosed && !$chatobj->InternalClosed))
                                continue;
                        }
                    }
				    $USER->AddFunctionCall("lz_chat_set_room_member('".base64_encode($member)."','".base64_encode($name)."',".To::BoolString($isOperator).",".To::BoolString($isBusyAway).",true);",false);
				}
		}
	foreach($USER->Browsers[0]->Members as $sysid => $chatm)
		if($chatm->Status < 2 && empty($chatm->Declined) && Server::$Operators[$sysid]->Status!=USER_STATUS_OFFLINE)
			$USER->AddFunctionCall("lz_chat_set_room_member('".base64_encode($sysid)."','".base64_encode(Server::$Operators[$sysid]->Fullname)."',true,".To::BoolString(Server::$Operators[$sysid]->Status!=USER_STATUS_ONLINE).",false);",false);

    $fb = !empty(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->ChatFunctions[3]) && !empty(Server::$Configuration->Database["gl_fb"]);
	$USER->AddFunctionCall("lz_chat_set_host(\"".base64_encode(Server::$Operators[$USER->Browsers[0]->OperatorId]->UserId)."\",\"".base64_encode(addslashes(Server::$Operators[$USER->Browsers[0]->OperatorId]->Fullname))."\",\"". base64_encode($groupname)."\",\"".strtolower(Server::$Operators[$USER->Browsers[0]->OperatorId]->Language)."\",".To::BoolString(Server::$Operators[$USER->Browsers[0]->OperatorId]->Typing==$USER->Browsers[0]->SystemId).",".To::BoolString(!empty(Server::$Operators[$USER->Browsers[0]->OperatorId]->Profile) && Server::$Operators[$USER->Browsers[0]->OperatorId]->Profile->Public).",\"". base64_encode($_dgroup)."\",".To::BoolString($fb).");",false);
}

function displayFiltered()
{
	global $USER;
	$USER->Browsers[0]->CloseChat(0);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'',true);",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(4,'".base64_encode("&nbsp;<b>".DataManager::$Filters->Filters[ACTIVE_FILTER_ID]->Reason."</b>")."');",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function displayQuit()
{
	global $USER;
	$USER->Browsers[0]->CloseChat(1);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'',true);",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(3,null);",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function displayDeclined()
{
	global $USER;
	$USER->Browsers[0]->CloseChat(2);
	$USER->AddFunctionCall("lz_chat_set_host('','','','',false,false,'',true);",false);
	$USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_STOPPED);",false);
	$USER->AddFunctionCall("lz_chat_add_system_text(4,null);",false);
	$USER->AddFunctionCall("lz_chat_stop_system();",false);
}

function buildLoginErrorField($error="",$addition = "")
{
	if(!Server::IsAvailable())
		return LocalizationManager::$TranslationStrings["client_error_deactivated"];
		
	if(!DB_CONNECTION || !empty(Server::$Configuration->File["gl_stmo"]))
		return LocalizationManager::$TranslationStrings["client_error_unavailable"];

	if(IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS)
	{
		$error = LocalizationManager::$TranslationStrings["client_error_unavailable"];
		if(isset(DataManager::$Filters->Message) && strlen(DataManager::$Filters->Message) > 0)
			$addition = "<br><br>" . DataManager::$Filters->Message;
	}
	return $error . $addition;
}

function getSessionId()
{
	if(!Is::Null(Cookie::Get("userid")))
		$session = Cookie::Get("userid");
	else if(!empty($_GET[GET_TRACK_USERID]))
		$session = Encoding::Base64UrlDecode(getParam(GET_TRACK_USERID));
	else
		Cookie::Set("userid",$session = Visitor::IDValidate());
	return Visitor::IDValidate($session);
}

function getLanguageSelects($_mylang,$tlanguages="")
{
    foreach(Server::$Languages as $iso => $langar)
        if($langar[1])
            $tlanguages .= "<option value=\"".strtolower($iso)."\"".(($_mylang[0]==$iso || (strtolower($iso) == strtolower(Server::$Configuration->File["gl_default_language"]) && (empty($_mylang[0]) || (!empty($_mylang[0]) && isset(Server::$Languages[$_mylang[0]]) && !Server::$Languages[$_mylang[0]][1]))))?" SELECTED":"").">".$langar[0]."</option>";
    return $tlanguages;

}

function isTicketFlood()
{
	$result = DBManager::Execute(true,"SELECT count(id) as ticket_count FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE time>".DBManager::RealEscape(time()-86400)." AND ip='".DBManager::RealEscape(Communication::GetIP())."';");
	if($result)
	{
        $row = DBManager::FetchArray($result);
		return ($row["ticket_count"] > MAX_TICKETS_PER_DAY);
	}
	else
		return true;
}

function getChatVoucherTemplate($html = "")
{
    Server::InitDataBlock(array("DBCONFIG"));
	if(!Is::Defined("DB_CONNECTION") || !empty(Server::$Configuration->Database["ccpp"]["Custom"]))
		return "";
	
	if(!empty(Server::$Configuration->File["gl_ccac"]))
		foreach(Server::$Configuration->Database["cct"] as $type)
			$html .= $type->GetTemplate();

	$cchtml = IOStruct::GetFile(PATH_TEMPLATES . "chat_voucher_checkout.tpl");
	$mycountry = "";
	$replacements = array("<!--lp_company-->"=>"","<!--lp_firstname-->"=>"","<!--lp_email-->"=>"","<!--lp_lastname-->"=>"","<!--lp_taxid-->"=>"","<!--lp_business_type-->"=>"","<!--lp_address_1-->"=>"","<!--lp_address_2-->"=>"","<!--lp_city-->"=>"","<!--lp_state-->"=>"","<!--lp_country-->"=>"","<!--lp_phone-->"=>"","<!--lp_zip-->"=>"");
	$prefillco = (!empty($_GET["co"])) ? " OR id='".DBManager::RealEscape(Encoding::Base64UrlDecode($_GET["co"]))."'" : "";
	
	if(!Is::Null(Cookie::Get("userid")) || !empty($prefillco))
	{
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` WHERE `visitor_id`='".DBManager::RealEscape(Cookie::Get("userid"))."'".$prefillco." ORDER BY `created` DESC LIMIT 1;");
		if($result)
		{
			if($row = DBManager::FetchArray($result))
			{
				$replacements = array("<!--lp_company-->"=>$row["company"],"<!--lp_firstname-->"=>$row["firstname"],"<!--lp_lastname-->"=>$row["lastname"],"<!--lp_taxid-->"=>$row["tax_id"],"<!--lp_email-->"=>$row["email"],"<!--lp_business_type-->"=>$row["business_type"],"<!--lp_address_1-->"=>$row["address_1"],"<!--lp_address_2-->"=>$row["address_2"],"<!--lp_city-->"=>$row["city"],"<!--lp_state-->"=>$row["state"],"<!--lp_country-->"=>$row["country"],"<!--lp_phone-->"=>$row["phone"],"<!--lp_zip-->"=>$row["zip"]);
				$mycountry = $row["country"];
			}
		}
	}
	$clist = Server::$Countries;
	asort($clist);
	$countrieshtml = "";
	foreach($clist as $isokey => $value)
		if(!empty($isokey))
			$countrieshtml .= ($isokey == $mycountry) ? "<option value=\"".$isokey."\" SELECTED>".utf8_encode($value)."</option>" : "<option value=\"".$isokey."\">".utf8_encode($value)."</option>";
	$cchtml = str_replace("<!--countries-->",$countrieshtml,$cchtml);
	
	foreach($replacements as $key => $value)
		$cchtml = str_replace($key,$value,$cchtml);
	
	$cchtml = str_replace("<!--show_VAT-->",(!empty(Server::$Configuration->File["gl_ccsv"])) ? "''" : "none",$cchtml);
	$cchtml = str_replace("<!--voucher_form-->",$html,$cchtml);
	
	if(!empty(Server::$Configuration->Database["ccpp"]["PayPal"]->LogoURL))
		$cchtml = str_replace("<!--pp_logo_url-->"," src=\"".Server::$Configuration->Database["ccpp"]["PayPal"]->LogoURL."\"",$cchtml);
	else
		$cchtml = str_replace("<!--pp_logo_url-->","",$cchtml);
	
	$cchtml = str_replace("<!--extends_voucher-->",((!empty($_GET["co"]) && strlen(Encoding::Base64UrlDecode($_GET["co"])) == 16) ? Encoding::Base64UrlDecode($_GET["co"]) : ""),$cchtml);
    $cchtml = str_replace("<!--ofc-->",((!empty($_GET["ofc"])) ? "MQ__" : ""),$cchtml);

    $cchtml = str_replace("<!--VAT-->",str_replace("<!--VAT-->",Server::$Configuration->File["gl_ccva"],LocalizationManager::$TranslationStrings["client_voucher_include_vat"]),$cchtml);
	return $cchtml;
}


class ExternalChat
{
    static function ReadTextColor()
    {
        return Communication::ReadParameter("etc","#448800");
    }

    static function ReadBackgroundColor()
    {
        return Communication::ReadParameter("epc","#73be28");
    }

    static function Login($_user,$_group)
    {
        Server::InitDataBlock(array("INPUTS"));
        $_user->Browsers[0]->UserData->LoadFromLogin($_group);
        if(!empty($_POST["p_cmb"]))
        {
            $_user->Browsers[0]->CallMeBack = true;
            $_user->Browsers[0]->SetCallMeBackStatus(1);
        }

        $_user->Browsers[0]->ApplyUserData();
        $_user->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_INIT);",false);
    }

    static function Listen($_user,$init=false)
    {
        global $USER,$VOUCHER;
        $USER = $_user;
        if(!(IS_FILTERED && !FILTER_ALLOW_CHATS))
        {
            if(!empty($_POST["p_tid"]))
            {
                $VOUCHER = VisitorChat::GetMatchingVoucher(Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),Encoding::Base64UrlDecode($_POST["p_tid"]));
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
                Server::InitDataBlock(array("INTERNAL"));
                if(!empty($_POST[POST_EXTERN_USER_GROUP]) && (empty($USER->Browsers[0]->DesiredChatGroup) || $init))
                    $USER->Browsers[0]->DesiredChatGroup = Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]);

                $USER->Browsers[0]->SetCookieGroup();
                $result = $USER->Browsers[0]->FindOperator(VisitorChat::$Router,$USER);

                if(!$result && VisitorChat::$Router->OperatorsBusy == 0)
                {
                    $USER->AddFunctionCall("lz_chat_add_system_text(8,null);",false);
                    $USER->AddFunctionCall("lz_chat_stop_system();",false);
                }
                else if((count(VisitorChat::$Router->OperatorsAvailable) + VisitorChat::$Router->OperatorsBusy) > 0)
                {
                    $USER->AddFunctionCall("lz_chat_set_id('".$USER->Browsers[0]->ChatId."');",false);
                    $chatPosition = VisitorChat::$Router->GetQueuePosition($USER->Browsers[0]->DesiredChatGroup);
                    $chatWaitingTime = VisitorChat::$Router->GetQueueWaitingTime($chatPosition);
                    ExternalChat::Login($USER,Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]);
                    $USER->Browsers[0]->SetWaiting(empty(VisitorChat::$DynamicGroup) && !($chatPosition == 1 && count(VisitorChat::$Router->OperatorsAvailable) > 0 && !(!empty($USER->Browsers[0]->DesiredChatPartner) && Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->Status == USER_STATUS_BUSY)));

                    if(!$USER->Browsers[0]->Waiting)
                    {
                        $USER->Browsers[0]->ShowConnecting($USER);
                        $USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_ALLOCATED);",false);
                        if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL || !empty($USER->Browsers[0]->DesiredChatPartner) || !empty(VisitorChat::$DynamicGroup))
                        {
                            $USER->Browsers[0]->CreateChat(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner],$USER,true);
                        }
                        else
                        {
                            $run=0;
                            foreach(VisitorChat::$Router->OperatorsAvailable as $intid => $am)
                                $USER->Browsers[0]->CreateChat(Server::$Operators[$intid],$USER,false,"","",true,($run++==0));
                        }
                    }
                    else
                    {
                        if(!empty($_GET["acid"]))
                        {
                            $USER->Browsers[0]->ShowConnecting($USER);
                            $pchatid = Encoding::Base64UrlDecode($_GET["acid"]);
                            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($USER->Browsers[0]->UserId)."' AND `chat_id`='".DBManager::RealEscape($pchatid)."' AND (`exit` > ".(time()-30)." OR `exit`=0) LIMIT 1;");
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
                            $USER->Browsers[0]->ShowQueueInformation($USER,$chatPosition,$chatWaitingTime,LocalizationManager::$TranslationStrings["client_queue_message"]);
                            $gqmt = $USER->Browsers[0]->ShowGroupQueueInformation($USER,$USER->Browsers[0]->QueueMessageShown);
                            if(!empty($gqmt))
                                $USER->AddFunctionCall("lz_chat_add_system_text(99,'".base64_encode($gqmt)."');",false);
                        }

                        if(!VisitorChat::$Router->WasTarget && !empty($USER->Browsers[0]->DesiredChatPartner))
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
                    $USER->Browsers[0]->InternalDecline(Server::$Operators[$USER->Browsers[0]->OperatorId]->SystemId);
                    displayDeclined();
                }
                else
                {
                    if(empty($USER->Browsers[0]->ArchiveCreated) && !empty($USER->Browsers[0]->DesiredChatPartner))
                        $USER->Browsers[0]->CreateChat(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner],$USER,true);
                    activeListen();
                }
            }

            if($USER->Browsers[0]->Status <= CHAT_STATUS_WAITING && empty($_POST["p_wls"]) && empty(VisitorChat::$DynamicGroup))
                $USER->AddFunctionCall("lz_chat_show_waiting_links('".base64_encode($wl = Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->GetWaitingLinks($USER->Browsers[0]->UserData->Text,Visitor::$BrowserLanguage))."');",false);
        }
        else
            displayFiltered();
        return $USER;
    }
}

class OverlayChat
{
    public $Botmode;
    public $Human;
    public $HumanGeneral;
    public $RepollRequired;
    public $OperatorCount;
    public $Flags;
    public $LastMessageReceived;
    public $LastPostReceived;
    public $IsHumanChatAvailable;
    public $IsChatAvailable;
    public $ChatHTML;
    public $OverlayHTML;
    public $PostHTML;
    public $FullLoad;
    public $LanguageRequired = false;
    public $LastPoster;
    public $LastPost;
    public $GroupBuilder;
    public $CurrentOperatorId;
    public $BotTitle;
    public $OperatorPostCount;
    public $PlaySound;
    public $SpeakingToHTML;
    public $SpeakingToAdded;

    public static $MaxPosts = 50;
    public static $Response;

    function OverlayChat()
    {
        $this->Flags = array();
        VisitorChat::$Router = new ChatRouter();
    }

    function GetChatStatus()
    {
        global $USER;
        if($USER->Browsers[0]->Declined)
            return 0;
        else if($this->Botmode && !empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
            return 1;
        else if($USER->Browsers[0]->Waiting || $USER->Browsers[0]->Status>0)
            return max($USER->Browsers[0]->Status,$USER->Browsers[0]->Waiting);
        else
            return 0;
    }

    function GetWaitingMessage()
    {
        $wmsg = "null";
        if(!empty(Server::$Configuration->File["gl_wmes"]) && Server::$Configuration->File["gl_wmes"]>-1 && empty($_GET["ovlntwo"]))
        {
            $wmsg = LocalizationManager::$TranslationStrings["client_still_waiting_int"];
            $wmsg .= " <a href=\"javascript:lz_chat_require_leave_message();\"><b>" . LocalizationManager::$TranslationStrings["client_leave_a_message"] . "</b></a>";
            $wmsg .= ". " . LocalizationManager::$TranslationStrings["client_thank_you"];
            $wmsg = "'".base64_encode($this->GetStatusHTML($wmsg))."'";
        }
        return $wmsg;
    }

    function Init()
    {
        global $USER;
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
            if(!empty($USER->Browsers[0]->DesiredChatPartner) && Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->IsBot && !$this->Botmode)
                $USER->Browsers[0]->DesiredChatPartner = null;

            $USER->Browsers[0]->FindOperator(VisitorChat::$Router,$USER,$this->Botmode,$this->Botmode);

            if((count(VisitorChat::$Router->OperatorsAvailable) + VisitorChat::$Router->OperatorsBusy) > 0)
            {
                $chatPosition = VisitorChat::$Router->GetQueuePosition($USER->Browsers[0]->DesiredChatGroup);
                $chatWaitingTime = VisitorChat::$Router->GetQueueWaitingTime($chatPosition);

                $USER->Browsers[0]->SetWaiting(!$this->Botmode && !($chatPosition == 1 && count(VisitorChat::$Router->OperatorsAvailable) > 0 && !(!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->Status == USER_STATUS_BUSY)));
                if(!$USER->Browsers[0]->Waiting)
                {
                    if(Server::$Configuration->File["gl_alloc_mode"] != ALLOCATION_MODE_ALL || !empty($USER->Browsers[0]->DesiredChatPartner))
                    {
                        $USER->Browsers[0]->CreateChat(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner],$USER,true,"","",false);
                    }
                    else
                    {
                        foreach(VisitorChat::$Router->OperatorsAvailable as $intid => $am)
                            $USER->Browsers[0]->CreateChat(Server::$Operators[$intid],$USER,false,"","",false);
                    }
                    $USER->Browsers[0]->LoadMembers();

                    if(!empty(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->PostJS))
                        $USER->AddFunctionCall("lz_chat_execute('".base64_encode(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->PostJS)."');",false);
                }
                else
                {
                    if($USER->Browsers[0]->IsMaxWaitingTime(true))
                    {
                        $USER->AddFunctionCall("lz_chat_set_talk_to_human(false,false);lz_mode_create_ticket=true;",false);
                        $USER->Browsers[0]->UpdateUserStatus(false,false,true,false,false);
                    }

                    $qtext = (!empty(Server::$Configuration->File["gl_sho_qu_inf"]) ? LocalizationManager::$TranslationStrings["client_ints_are_busy"]." ".LocalizationManager::$TranslationStrings["client_queue_message"] : LocalizationManager::$TranslationStrings["client_ints_are_busy"]);

                    $USER->Browsers[0]->ShowQueueInformation($USER,$chatPosition,$chatWaitingTime,$this->GetStatusHTML($qtext));
                    $gqmt = $USER->Browsers[0]->ShowGroupQueueInformation($USER,$USER->Browsers[0]->QueueMessageShown);
                    if(!empty($gqmt))
                        $this->AddHTML($this->GetStatusHTML($gqmt),"sys","GQM");

                    if(!VisitorChat::$Router->WasTarget && !empty($USER->Browsers[0]->DesiredChatPartner))
                        $USER->Browsers[0]->DesiredChatPartner = "";

                    $USER->Browsers[0]->CreateArchiveEntry(null,$USER);
                }
            }
        }
        else
        {
            if(empty($USER->Browsers[0]->ArchiveCreated) && !empty($USER->Browsers[0]->DesiredChatPartner))
                $USER->Browsers[0]->CreateChat(Server::$Operators[$USER->Browsers[0]->DesiredChatPartner],$USER,true);

            if(!empty(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->PostJS))
                $USER->AddFunctionCall("lz_chat_execute('".base64_encode(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->PostJS)."');",false);
        }
    }

    function BuildElements()
    {
        global $USER;
        $this->SpeakingToHTML = $this->GetSpeakingToHTML($this->CurrentOperatorId);
        $this->PostHTML = "";
        $pstrchngreq = $this->PlaySound = $this->SpeakingToAdded = false;

        $this->OperatorPostCount = 0;
        $this->LastPost = "";
        $this->Flags["LPP"] = $this->LastPoster;

        if(!$USER->FirstCall && !$USER->Browsers[0]->Declined && $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($USER->Browsers[0]->ChatId)."' AND `chat_id`!='' AND `chat_id`!='0' AND (`receiver`='".DBManager::RealEscape($USER->Browsers[0]->SystemId)."' OR (`sender`='".DBManager::RealEscape($USER->Browsers[0]->SystemId)."' AND `repost`=0)) GROUP BY `id` ORDER BY `time` ASC, `micro` ASC;"))
        {
            $all = DBManager::GetRowCount($result);
            if($all > 0)
            {
                $count = OverlayChat::$MaxPosts-$all;
                while($row = DBManager::FetchArray($result))
                {
                    if($count++ >= 0)
                    {
                        $postobj = new Post($row);
                        if(empty(Server::$Operators[$postobj->Sender]))
                        {
                            $postobj->Text = htmlentities($postobj->Text,ENT_QUOTES,'UTF-8');
                            $postobj->Translation = htmlentities($postobj->Translation,ENT_QUOTES,'UTF-8');
                        }

                        if($USER->Browsers[0]->AllocatedTime > 0 && $USER->Browsers[0]->AllocatedTime && !$this->SpeakingToAdded)
                        {
                            $this->Flags["LPP"] = "sys";
                            $this->PostHTML .= $this->SpeakingToHTML;
                            $this->SpeakingToAdded = true;
                        }

                        $post = $this->GetPostHTML($postobj->Text,$postobj->Translation,($this->Flags["LPP"] != $postobj->Sender || $pstrchngreq),$postobj->Sender != $USER->Browsers[0]->SystemId,(($postobj->Sender != $USER->Browsers[0]->SystemId) ? $postobj->SenderName : htmlentities($USER->Browsers[0]->UserData->Fullname,ENT_QUOTES,"UTF-8")),$postobj->Created,$postobj->Sender);

                        $pstrchngreq = false;
                        if($postobj->Sender != $USER->Browsers[0]->SystemId)
                            $this->OperatorPostCount++;

                        if(!$postobj->Received && $postobj->Sender != $USER->Browsers[0]->SystemId)
                            $this->PlaySound = true;

                        $postobj->MarkReceived($USER->Browsers[0]->SystemId);
                        if($this->FullLoad || $postobj->Sender != $USER->Browsers[0]->SystemId || $postobj->BrowserId != VisitorMonitoring::$Browser->BrowserId)
                            $this->Flags["LPP"] = $postobj->Sender;
                        if(empty($_GET["full"]) && $postobj->Id == $this->Flags["LPR"])
                        {
                            $this->PlaySound = false;
                            $this->PostHTML = $this->SpeakingToHTML;
                            $this->SpeakingToAdded = true;
                            $this->OperatorPostCount = 0;
                            $this->Flags["LPP"] = (!empty($this->SpeakingToHTML)) ? "sys" : $this->LastPoster;
                            if($USER->Browsers[0]->AllocatedTime > 0 && $postobj->Created < $USER->Browsers[0]->AllocatedTime)
                                $pstrchngreq = true;
                        }
                        else
                        {
                            if($this->FullLoad || $postobj->Sender != $USER->Browsers[0]->SystemId || $postobj->BrowserId != VisitorMonitoring::$Browser->BrowserId)
                                $this->PostHTML .= $post;
                        }

                        $this->LastPostReceived = "'".base64_encode($postobj->Id)."'";

                        if($postobj->Sender == $USER->Browsers[0]->SystemId)
                            $this->LastPost = $postobj->Text;
                    }
                }
            }
        }
    }

    function CreateChatTemplate()
    {
        $this->ChatHTML = "";
        if(Visitor::$PollCount == 1)
        {
            $this->ChatHTML = str_replace("<!--server-->",LIVEZILLA_URL,IOStruct::GetFile(TEMPLATE_HTML_OVERLAY_CHAT));
            $this->ChatHTML = str_replace("<!--file_upload_template-->",IOStruct::GetFile(PATH_TEMPLATES."file_upload.tpl"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--dir-->",LocalizationManager::$Direction,$this->ChatHTML);
            $this->ChatHTML = getChatLoginInputs($this->ChatHTML,MAX_INPUT_LENGTH_OVERLAY,true);
            $this->ChatHTML = str_replace("<!--tr_vis-->",((strlen(Server::$Configuration->File["gl_otrs"])>1) ? "block" : "none"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--overlay_input_max_length-->",MAX_INPUT_LENGTH_OVERLAY,$this->ChatHTML);
            $this->ChatHTML = Server::Replace($this->ChatHTML,true,false);
            $this->ChatHTML = OverlayChat::ReplaceColors($this->ChatHTML,false);
            $this->ChatHTML = str_replace("<!--tc-->",Communication::ReadParameter("ovlct","#ffffff"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--apo-->",((!empty($_GET["ovlapo"])) ? "" : "display:none;"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--et_vis-->",((!empty(Server::$Configuration->File["gl_retr"]) && !empty(Server::$Configuration->File["gl_soct"])) ? "block":"none"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--activate_transcript-->",((empty(Server::$Configuration->File["gl_soct"])) ? "":"CHECKED"),$this->ChatHTML);
            $this->ChatHTML = str_replace("<!--param-->",@Server::$Configuration->File["gl_cpas"],$this->ChatHTML);
            $tlanguages = getLanguageSelects(LocalizationManager::GetBrowserLocalization());
            $this->ChatHTML = str_replace("<!--languages-->",$tlanguages,$this->ChatHTML);
        }
    }

    function DefineModes()
    {
        global $USER;
        $count = 0;
        foreach(Server::$Operators as $sysId => $internaluser)
        {
            $isex = $internaluser->IsExternal(Server::$Groups, null, array($USER->Browsers[0]->DesiredChatGroup), $USER->Browsers[0]->DesiredChatPartner==$sysId, ($USER->Browsers[0]->DesiredChatPartner==$sysId && !empty($USER->Browsers[0]->Forward)));
            if($isex && $internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated && (!$internaluser->IsBot || !Visitor::$OpenChatExternal))
            {
                if(!$internaluser->IsBot)
                    $this->HumanGeneral = true;
                $count++;
                if(!$internaluser->IsBot && !ChatRouter::$WelcomeManager)
                    $this->Botmode = false;
                if($internaluser->IsBot && $internaluser->WelcomeManager && !defined("IGNORE_WM"))
                    $this->Botmode = ChatRouter::$WelcomeManager = true;
                if(!$internaluser->IsBot)
                {
                    $this->Human = true;
                    if(!empty($USER->Browsers[0]->InitChatWith) && $sysId == $USER->Browsers[0]->InitChatWith)
                    {
                        $this->Botmode = ChatRouter::$WelcomeManager = false;
                        break;
                    }
                }
            }
            else if($internaluser->Status < USER_STATUS_OFFLINE && !$internaluser->Deactivated && !$internaluser->IsBot && $internaluser->IsExternal(Server::$Groups))
                $this->HumanGeneral = true;
        }
        if($count == 0)
        {
            $this->Botmode = false;
            $this->Human = false;
            $this->OperatorCount = 0;
        }
    }

    function DefineTargets()
    {
        global $USER;
        if(!empty($_GET["tth"]) || $USER->IsInChat(true,$USER->Browsers[0]) || Visitor::$OpenChatExternal)
            define("IGNORE_WM",true);

        if(defined("IGNORE_WM") && !empty($USER->Browsers[0]->DesiredChatPartner) && Server::$Operators[$USER->Browsers[0]->DesiredChatPartner]->IsBot)
            $USER->Browsers[0]->DesiredChatPartner = "";

        if(!empty($USER->Browsers[1]->ChatRequest) && $USER->Browsers[1]->ChatRequest->Closed && !$USER->Browsers[1]->ChatRequest->Accepted && @Server::$Operators[$USER->Browsers[1]->ChatRequest->SenderSystemId]->UserStatus < USER_STATUS_OFFLINE && Server::$Operators[$USER->Browsers[1]->ChatRequest->SenderSystemId]->IsExternal(Server::$Groups,null,array($USER->Browsers[1]->ChatRequest->SenderGroupId)))
        {
            $USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[1]->ChatRequest->SenderSystemId;
            $USER->Browsers[0]->DesiredChatGroup = $USER->Browsers[1]->ChatRequest->SenderGroupId;
            $this->OperatorCount = 1;
        }
        else if(!(!empty($USER->Browsers[0]->Forward) && !empty($USER->Browsers[0]->DesiredChatGroup)))
        {
            if(!empty($_GET[GET_EXTERN_INTERN_USER_ID]))
                $USER->Browsers[0]->DesiredChatPartner = Operator::GetSystemId(Encoding::Base64UrlDecode(getParam(GET_EXTERN_INTERN_USER_ID)));
            if(!empty($USER->Browsers[0]->InitChatWith))
                $USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->InitChatWith;
            if(!empty($USER->Browsers[0]->Forward))
                $USER->Browsers[0]->DesiredChatPartner = "";
            if(!(!empty($USER->Browsers[0]->DesiredChatPartner) && !empty($USER->Browsers[0]->DesiredChatGroup) && !empty($USER->Browsers[0]->OperatorId)))
                $USER->Browsers[0]->DesiredChatGroup = $this->GroupBuilder->GetTargetGroup($this->OperatorCount,$USER->Browsers[0]->DesiredChatPartner,$USER->Browsers[0]->DesiredChatGroup);
            else
                $this->OperatorCount = 1;
        }
        else
            $this->OperatorCount = 1;

        ChatRouter::$WelcomeManager = false;
        $this->Human =
        $this->HumanGeneral = false;
        $this->Botmode = empty($USER->Browsers[0]->Forward) && !Visitor::$OpenChatExternal;
        $this->RepollRequired = false;

    }

    function SetHost($_systemId)
    {
        global $USER;
        $groupId = (!empty($_systemId)) ? "'".base64_encode($USER->Browsers[0]->DesiredChatGroup)."'" : "null";
        $groupDescription = (!empty($_systemId)) ? "'".base64_encode(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->GetDescription($USER->Language))."'" : "null";
        $userId = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->UserId)."'" : "null";
        $fullname = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->Fullname)."'" : "null";
        $language = (!empty($_systemId)) ? "'".base64_encode(Server::$Operators[$_systemId]->Language)."'" : "null";
        $image = (!empty($_systemId)) ? "'".base64_encode(LIVEZILLA_URL . Server::$Operators[$_systemId]->GetOperatorPictureFile())."'" : "null";
        $functions = (!empty($_systemId) && is_array(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->ChatFunctions)) ? "[".implode(",",Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->ChatFunctions)."]" : "null";
        $_systemId = (!empty($_systemId)) ? "'".base64_encode($_systemId)."'" : "null";
        $USER->AddFunctionCall("lz_chat_set_host(".$_systemId.",'".base64_encode($USER->Browsers[0]->ChatId)."',".$groupId.",".$groupDescription.",".$userId.",".$language.",".$image.",".$fullname.",".$functions.");",false);
    }

    function AddHTML($_html,$_poster,$_lmr="")
    {
        if(!empty($_lmr) && $_lmr == $this->Flags["LMR"])
        {
            return;
        }
        else if(!empty($_lmr))
            $this->LastMessageReceived = "'".base64_encode($_lmr)."'";
        $this->OverlayHTML .= $_html;
        $this->LastPoster = $_poster;
    }

    function GetPostHTML($_text,$_translation,$_add,$_operator,$_name,$_time,$_senderId)
    {
        $bot = (!empty($_senderId) && isset(Server::$Operators[$_senderId]) && Server::$Operators[$_senderId]->IsBot);
        $post = ($_add) ? ((!$_operator) ? IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_EXTERN) : IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_OPERATOR)) : ((!$_operator) ? IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_ADD) : IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_OPERATOR_ADD));
        $image = ($bot) ? "<td style=\"vertical-align:top;\"><img style=\"border-radius:2px;margin:4px 0 0 4px;\" src=\"".LIVEZILLA_URL.Server::$Operators[$_senderId]->GetOperatorPictureFile()."\" width=\"60\" height=\"45\"></td>" : "";
        $post = str_replace("<!--name-->",($_operator) ? $_name : ((!empty($_name)) ? $_name : LocalizationManager::$TranslationStrings["client_guest"]),$post);
        $post = str_replace("<!--time-->",$_time,$post);
        $post = str_replace("<!--picture-->",$image,$post);
        $post = str_replace("<!--lang_client_edit-->",strtoupper(LocalizationManager::$TranslationStrings["client_edit"]),$post);
        $post = OverlayChat::ReplaceColors($post,$_operator);
        $_text = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_text,"<a><br><b><ul><li><ol><b><i><u><strong><img>"));
        if(!empty($_translation))
        {
            $_translation = preg_replace('/(<(?!img)\w+[^>]+)(style="[^"]+")([^>]*)(>)/', '${1}${3}${4}', strip_tags($_translation,"<a><br><b><ul><li><ol><b><i><u><strong><img>"));
            $_text = $_translation . "<div class='lz_overlay_translation'>" . $_text . "</div>";
        }
        return str_replace("<!--message-->",$_text,$post);
    }

    function GetStatusHTML($_text)
    {
        $body = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);
        return str_replace("<!--message-->",$_text,$body);
    }

    function GetLeaveChatHTML($_host,$_name,$_add="")
    {
        $html = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS);

        if($_host)
            $this->SetHost(null);

        return str_replace("<!--message-->",str_replace("<!--intern_name-->",$_name,LocalizationManager::$TranslationStrings["client_intern_left"]).$_add,$html);
    }

    function GetSpeakingToHTML($_opId)
    {
        global $USER;
        $html = "";
        if(!empty($USER->Browsers[0]->OperatorId))
        {
            if(!empty($_opId) && $_opId != $USER->Browsers[0]->OperatorId)
                $_opId="";

            if($USER->Browsers[0]->DesiredChatPartner != $USER->Browsers[0]->OperatorId)
            {
                $USER->Browsers[0]->DesiredChatPartner = $USER->Browsers[0]->OperatorId;
                $USER->Browsers[0]->Save();
            }
            if(!$USER->Browsers[0]->Closed && $USER->Browsers[0]->InternalActivation && empty($_opId))
            {
                $text = LocalizationManager::$TranslationStrings["client_now_speaking_to"];
                if(Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
                    return "";

                $html .= $this->GetStatusHTML(str_replace("<!--operator_name-->",Server::$Operators[$USER->Browsers[0]->OperatorId]->Fullname,$text));
                if(!$USER->Browsers[0]->ExternalActivation)
                    $USER->Browsers[0]->ExternalActivate();

                $this->SetHost($USER->Browsers[0]->OperatorId);
            }
        }
        return $html;
    }

    function GetInviteHTML($_operatorID,$_text,$_crid)
    {
        $this->LanguageRequired = true;
        $html = IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_INVITE);
        $html = str_replace("<!--display_image-->","''",$html);
        $html = str_replace("<!--image-->","<img style=\"border-radius:2px;\" align=\"left\" src=\"".LIVEZILLA_URL.Server::$Operators[$_operatorID]->GetOperatorPictureFile()."\" width=\"80\" height=\"60\">",$html);
        $html = str_replace("<!--font_color-->","#000000",$html);
        $html = str_replace("<!--id-->",$_crid,$html);
        $html = OverlayChat::ReplaceColors($html,true);
        return str_replace("<!--message-->",str_replace("<!--intern_name-->",Server::$Operators[$_operatorID]->Fullname,$_text),$html);
    }

    function ProcessPosts()
    {
        global $USER;
        $pc = 0;
        if(!empty($USER->Browsers[0]->QueuedPosts))
        {
            if(!$USER->Browsers[0]->Waiting)
            {
                while(!empty($_GET["mi".$pc])){$pc++;}
                foreach($USER->Browsers[0]->QueuedPosts as $id => $postar)
                {
                    $_GET["mp".$pc] = $postar[0];
                    $_GET["mrid".$pc] =
                    $_GET["mi".$pc] = Encoding::Base64UrlEncode($id);
                    $_GET["mc".$pc++] = Encoding::Base64UrlEncode($postar[1]);

                    DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `id`='".DBManager::RealEscape($id)."' LIMIT 1;");
                }
                $pc = 0;
                $USER->Browsers[0]->QueuedPosts = array();
            }
        }
        $this->OverlayHTML = "";
        if(!empty($_GET["mi".$pc]) || $USER->Browsers[0]->Waiting || !empty($USER->Browsers[0]->InitChatWith) || (!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Received && $USER->Browsers[0]->Forward->Processed))
        {
            if($USER->Browsers[0]->Waiting && $this->Botmode && !empty($USER->Browsers[0]->QueuedPosts))
                $USER->Browsers[0]->QueuedPosts = array();
            else if(!Visitor::$OpenChatExternal)
                $this->Init();

            if(!empty($USER->Browsers[0]->Forward) && !$USER->Browsers[0]->Forward->Received && $USER->Browsers[0]->Forward->Processed)
            {
                $USER->Browsers[0]->Forward->Save(true,true);
                Visitor::$IsActiveOverlayChat = !$USER->Browsers[0]->Declined;
            }
        }

        if(!empty($USER->Browsers[0]->ChatId))
            $USER->AddFunctionCall("lz_chat_id='".$USER->Browsers[0]->ChatId."';",false);

        $USER->Browsers[0]->VisitId = $USER->VisitId;

        while(!empty($_GET["mi".$pc]))
        {
            $id = Communication::ReadParameter("mrid".$pc,md5($USER->Browsers[0]->SystemId . $USER->Browsers[0]->ChatId . $_GET["mi".$pc]));

            $senderName = (!empty($USER->Browsers[0]->UserData->Fullname)) ? $USER->Browsers[0]->UserData->Fullname : (LocalizationManager::$TranslationStrings["client_guest"] . " " . Visitor::GetNoName($USER->UserId.Communication::GetIP()));
            $post = new Post($id,$USER->Browsers[0]->SystemId,"",Encoding::Base64UrlDecode($_GET["mp".$pc]),Communication::ReadParameter("mc".$pc,time()),$USER->Browsers[0]->ChatId,$senderName);
            $post->BrowserId = VisitorMonitoring::$Browser->BrowserId;

            if(!empty($_GET["mpti".$pc]))
            {
                $post->Translation = Encoding::Base64UrlDecode($_GET["mpt".$pc]);
                $post->TranslationISO = Encoding::Base64UrlDecode($_GET["mpti".$pc]);
            }

            $saved = false;

            if(!$USER->Browsers[0]->Waiting)
            {
                foreach(Server::$Groups as $groupid => $group)
                    if($group->IsDynamic && $USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE && isset($group->Members[$USER->Browsers[0]->SystemId]))
                    {
                        foreach($group->Members as $member => $persistent)
                            if($member != $USER->Browsers[0]->SystemId)
                            {
                                if(!empty(Server::$Operators[$member]))
                                    processPost($id,$post,$member,$pc,$groupid,$USER->Browsers[0]->ChatId);
                                else
                                    processPost($id,$post,$member,$pc,$groupid,CacheManager::GetValueBySystemId($member,"chat_id",""));
                                $saved = true;
                            }
                        $pGroup=$group;
                    }

                foreach($USER->Browsers[0]->Members as $systemid => $member)
                {
                    if(!empty($member->Declined))
                        continue;
                    if(!empty(Server::$Operators[$systemid]) && !empty($pGroup) && isset($pGroup->Members[$systemid]))
                        continue;
                    if(!(!empty($pGroup) && !empty(Server::$Operators[$systemid])))
                        $saved = processPost($id,$post,$systemid,$pc,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId,Server::$Operators[$systemid]->IsBot);
                }

                if(!empty($USER->Browsers[0]->OperatorId) && (Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot || $USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE))
                {
                    $rpost = new Post($id = getId(32),Server::$Operators[$USER->Browsers[0]->OperatorId]->SystemId,$USER->Browsers[0]->SystemId,$answer=Server::$Operators[$USER->Browsers[0]->OperatorId]->GetAutoReplies($post->Text." ".$post->Translation,$USER->Browsers[0]),time(),$USER->Browsers[0]->ChatId,Server::$Operators[$USER->Browsers[0]->OperatorId]->Fullname);
                    if(!empty($answer))
                    {
                        if(Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
                        {
                            sleep(1);
                            $USER->AddFunctionCall("lz_chat_input_bot_state(true,false);",false);
                        }

                        $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $USER->Browsers[0]->SystemId;
                        $rpost->Save();
                        $saved = true;
                        foreach($USER->Browsers[0]->Members as $opsysid => $member)
                        {
                            if($opsysid != Server::$Operators[$USER->Browsers[0]->OperatorId]->SystemId || !Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
                            {
                                $rpost = new Post($id,Server::$Operators[$USER->Browsers[0]->OperatorId]->SystemId,$opsysid,$answer,time(),$USER->Browsers[0]->ChatId,Server::$Operators[$opsysid]->Fullname);
                                $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $USER->Browsers[0]->SystemId;
                                $rpost->Save();
                            }
                        }
                    }
                }
                if($saved)
                    $USER->AddFunctionCall("lz_chat_release_post('".Encoding::Base64UrlDecode($_GET["mi".$pc])."');",false);
            }
            else
            {
                processPost($id,$post,"",$pc,$USER->Browsers[0]->SystemId,$USER->Browsers[0]->ChatId,false);
                $USER->Browsers[0]->QueuedPosts[$id] = array(0=>$_GET["mp".$pc],1=>time(),2=>VisitorMonitoring::$Browser->BrowserId);
                $USER->AddFunctionCall("lz_chat_release_post('".Encoding::Base64UrlDecode($_GET["mi".$pc])."');",false);
            }
            $pc++;
        }

        if(!empty($USER->Browsers[0]->OperatorId) && empty($pc) && !Server::$Operators[$USER->Browsers[0]->OperatorId]->IsBot)
        {
            $autoReply=Server::$Operators[$USER->Browsers[0]->OperatorId]->GetAutoReplies("",$USER->Browsers[0]);
            if(!empty($autoReply))
                ChatAutoReply::SendAutoReply($autoReply,$USER,$USER->Browsers[0]->OperatorId);
        }
    }

    function InitFeedback($_userInitiated=true)
    {
        global $USER;
        Server::InitDataBlock(array("DBCONFIG"));
        if(empty(Server::$Configuration->Database["gl_fb"]))
        {
            return;
        }

        $cid = $USER->Browsers[0]->GetLastActiveChatId();
        if($_userInitiated || !empty($cid))
        {
            if($_userInitiated || Feedback::GetByChatId($cid)==null)
            {
                $value = "0;".base64_encode(LIVEZILLA_URL . "feedback.php?cid=" . Encoding::Base64UrlEncode($cid));
                $fovl = new OverlayBox(CALLER_USER_ID,CALLER_BROWSER_ID,$value);
                $fovl->Id = md5($cid);
                $fovl->Save();
                $fovl->SetStatus(false);
            }
        }
    }

    function GetFeedbackTemplate()
    {
        global $USER;
        Server::InitDataBlock(array("DBCONFIG"));
        $template = new OverlayElement();
        $template->Style = "rounded";
        $template->Height = 180;

        foreach(Server::$Configuration->Database["gl_fb"] as $fc)
            $template->Height += $fc->GetHeight();

        $template->Id = md5($USER->Browsers[0]->ChatId);
        return $template;
    }

    function Listen()
    {
        global $USER;
        $isOp = false;
        if($USER->Browsers[0]->Status == CHAT_STATUS_ACTIVE)
        {
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id`='".DBManager::RealEscape($USER->Browsers[0]->ChatId)."' ORDER BY `status` DESC, `dtime` DESC;");
            while($row = DBManager::FetchArray($result))
                if(isset(Server::$Operators[$row["user_id"]]))
                {
                    $ChatMember = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);
                    if($ChatMember->Status == 1 && $ChatMember->Joined >= $USER->Browsers[0]->LastActive)
                    {
                        $isOp = true;
                        $this->AddHTML(str_replace("<!--message-->",str_replace("<!--intern_name-->",Server::$Operators[$ChatMember->SystemId]->Fullname,LocalizationManager::$TranslationStrings["client_intern_arrives"]),IOStruct::GetFile(TEMPLATE_HTML_MESSAGE_OVERLAY_CHAT_STATUS)),"sys","LMMJ".$ChatMember->SystemId);
                    }
                    else if(($ChatMember->Status == 9 || $ChatMember->Status == 2) && $ChatMember->Left >= $USER->Browsers[0]->LastActive && $ChatMember->Joined > 0)
                    {
                        $this->AddHTML($this->GetLeaveChatHTML(false,Server::$Operators[$ChatMember->SystemId]->Fullname),"sys","LCM01".$ChatMember->SystemId);
                    }
                    if($ChatMember->Status == 0)
                    {
                        $isOp = true;
                    }
                }
        }
        else
            $isOp = true;

        if(Communication::ReadParameter("ovlif"))
            $this->InitFeedback();

        $USER->Browsers[0]->Typing = isset($_GET["typ"]);

        if(!$USER->Browsers[0]->Declined)
            $USER->Browsers[0]->Save();

        $USER->Browsers[0]->ValidateOperator();

        $this->CurrentOperatorId = Communication::GetParameter("op","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        if(($USER->Browsers[0]->Waiting && $this->Botmode) || (empty($USER->Browsers[0]->OperatorId) && !empty($this->CurrentOperatorId) && isset(Server::$Operators[$this->CurrentOperatorId]) && !Server::$Operators[$this->CurrentOperatorId]->IsBot) || (!empty($this->CurrentOperatorId) && empty($USER->Browsers[0]->ChatId) && !$this->Botmode) || !$isOp || $USER->Browsers[0]->Closed /*|| (!empty($USER->Browsers[0]->OperatorId) && Server::$Operators[$USER->Browsers[0]->OperatorId]->Status == USER_STATUS_OFFLINE)*/)
        {
            if(!$USER->Browsers[0]->ExternalClosed)
            {
                $USER->Browsers[0]->ExternalClose();
                $USER->Browsers[0]->Save();
                $USER->Browsers[0]->Load();
            }
            $USER->Browsers[0]->Members = array();
            if(!empty($this->CurrentOperatorId) && !empty(Server::$Operators[$this->CurrentOperatorId]) && $isOp)
            {
                $this->AddHTML($this->GetLeaveChatHTML(true,Server::$Operators[$this->CurrentOperatorId]->Fullname),"sys","LCM01" . $this->CurrentOperatorId);

                if(!empty(Server::$Configuration->File["gl_fboe"]) && Communication::ReadParameter("po",0)==0 && !Server::$Operators[$this->CurrentOperatorId]->IsBot)
                    if(!empty(Server::$Groups[$USER->Browsers[0]->DesiredChatGroup]->ChatFunctions[3]))
                        $this->InitFeedback(false);

                $this->Flags["LMR"] = "null";
                $USER->Browsers[0]->OperatorId = null;
                $this->CurrentOperatorId = "";
                $this->RepollRequired = true;
            }
        }
    }

    function KnowledgebaseSearch()
    {
        global $USER;
        if(!empty($_GET["skb"]))
        {
            $c = count(KnowledgeBase::GetMatches(Communication::ReadParameter("skb",""),Visitor::$BrowserLanguage));
            $USER->AddFunctionCall("lz_chat_search_result(".$c.");",false);
        }
    }

    static function ReplaceColors($_html,$_operator)
    {
        $primary = Communication::ReadParameter("ovlc","#73be28");
        $secondary = Communication::ReadParameter("ovlct","#ffffff");
        $textshadow = Communication::ReadParameter("ovlts",1);
        //$textheader = Communication::ReadParameter("ovlch","#ffffff");
        $_html = str_replace("<!--bgc-->",$primary,$_html);
        $_html = str_replace("<!--bgcm-->",Colors::TransformHEX($primary,30),$_html);
        $_html = str_replace("<!--bgcd-->",Colors::TransformHEX($primary,50),$_html);
        $_html = str_replace("<!--tc-->",$secondary,$_html);
        $_html = str_replace("<!--tch-->",$secondary,$_html);
        $_html = str_replace("<!--ts-->",($textshadow==1) ? "text-shadow:1px 1px 0 #6b6b6b;" : "",$_html);
        return str_replace("<!--color-->",($_operator) ? Colors::TransformHEX($secondary,20) : "#000000",$_html);
    }
}

?>
