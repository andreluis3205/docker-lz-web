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
	


class InternalXMLBuilder
{
	public $Caller;
	public $InternalUsers;
	public $InternalGroups;

	public $XMLProfilePictures = "";
	public $XMLWebcamPictures = "";
	public $XMLProfiles = "";
	public $XMLInternal = "";
	public $XMLTyping = "";
	public $XMLGroups = "";

	function InternalXMLBuilder($_caller,$_internalusers,$_internalgroups)
	{
		$this->Caller = $_caller;
		$this->InternalUsers = $_internalusers;
		$this->InternalGroups = $_internalgroups;
	}

	function Generate()
	{
        global $CONFIG;
        initData(array("DBCONFIG"));
        $objects = array("group"=>$this->InternalGroups,"operator"=>$this->InternalUsers);
        foreach($objects as $type => $list)
            foreach($list as $sysId => $object)
            {
                $arxml="";
                if(!$object->IsDynamic && !(SERVERSETUP || $this->InternalUsers[CALLER_SYSTEM_ID]->GetPermission(20) == PERMISSION_NONE || (!$this->InternalUsers[CALLER_SYSTEM_ID]->IsInGroupWith($object) && $this->InternalUsers[CALLER_SYSTEM_ID]->GetPermission(20) != PERMISSION_FULL)))
                {
                    $object->LoadAutoReplies();
                    foreach($object->AutoReplies as $reply)
                        $arxml .= $reply->GetXML();
                }

                if($type=="group")
                {
                    if(!SERVERSETUP && in_array($sysId,$this->InternalUsers[CALLER_SYSTEM_ID]->GroupsHidden))
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
                        if(!empty($CONFIG["db"]["gl_sm"]))
                            foreach($CONFIG["db"]["gl_sm"] as $channel)
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

                    if($sysId != CALLER_SYSTEM_ID && !empty($this->InternalUsers[$sysId]->WebcamPicture))
                    {
                        if($this->InternalUsers[$sysId]->WebcamPictureTime >= $sessiontime)
                            $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".$this->InternalUsers[$sysId]->WebcamPicture."\" />\r\n";
                    }
                    else
                        $this->XMLWebcamPictures .= "<v os=\"".$b64sysId."\" content=\"".base64_encode("")."\" />\r\n";

                    $DEAC = ($this->InternalUsers[$sysId]->Deactivated) ? " deac=\"".base64_encode(1)."\"" : "";
                    $CPONL = ($this->InternalUsers[CALLER_SYSTEM_ID]->Level==USER_LEVEL_ADMIN) ? " cponl=\"".base64_encode(($object->PasswordChangeRequest) ? 1 : 0)."\"" : "";
                    $PASSWORD = (SERVERSETUP) ? " pass=\"".base64_encode($this->InternalUsers[$sysId]->Password)."\"" : "";
                    $WSCONFIG = $this->InternalUsers[$sysId]->WebsitesConfig;array_walk($WSCONFIG,"b64ecode");
                    $WSUSERS = $this->InternalUsers[$sysId]->WebsitesUsers;array_walk($WSUSERS,"b64ecode");
                    $botatts = ($this->InternalUsers[$sysId]->IsBot) ? " isbot=\"".base64_encode($this->InternalUsers[$sysId]->IsBot ? "1" : "0")."\" wm=\"".base64_encode($this->InternalUsers[$sysId]->WelcomeManager ? "1" : "0")."\" wmohca=\"".base64_encode($this->InternalUsers[$sysId]->WelcomeManagerOfferHumanChatAfter)."\"" : "";

                    $this->XMLInternal .= "<v status=\"".base64_encode($this->InternalUsers[$sysId]->Status)."\" id=\"".$b64sysId."\" userid=\"".base64_encode($this->InternalUsers[$sysId]->UserId)."\"".$botatts." lang=\"".base64_encode($this->InternalUsers[$sysId]->Language)."\" email=\"".base64_encode($this->InternalUsers[$sysId]->Email)."\" websp=\"".base64_encode($this->InternalUsers[$sysId]->Webspace)."\" name=\"".base64_encode($this->InternalUsers[$sysId]->Fullname)."\" desc=\"".base64_encode($this->InternalUsers[$sysId]->Description)."\" perms=\"".base64_encode($this->InternalUsers[$sysId]->PermissionSet)."\" ip=\"".base64_encode($this->InternalUsers[$sysId]->IP)."\" lipr=\"".base64_encode($this->InternalUsers[$sysId]->LoginIPRange)."\" aac=\"".base64_encode($this->InternalUsers[$sysId]->CanAutoAcceptChats)."\" ws_users=\"".base64_encode(base64_encode(serialize($WSUSERS)))."\" ws_config=\"".base64_encode(base64_encode(serialize($WSCONFIG)))."\" mc=\"".base64_encode($this->InternalUsers[$sysId]->MaxChats)."\" level=\"".base64_encode($this->InternalUsers[$sysId]->Level)."\" ".$DEAC." ".$CPONL." ".$PASSWORD.">\r\n";

                    if(!empty($this->InternalUsers[$sysId]->ProfilePicture))
                        $this->XMLInternal .= "<pp>".$this->InternalUsers[$sysId]->ProfilePicture."</pp>\r\n";

                    foreach($this->InternalUsers[$sysId]->Groups as $groupid)
                        $this->XMLInternal .= "<gr>".base64_encode($groupid)."</gr>\r\n";

                    foreach($this->InternalUsers[$sysId]->GroupsHidden as $groupid)
                        $this->XMLInternal .= "<gh>".base64_encode($groupid)."</gh>\r\n";

                    foreach($this->InternalUsers[$sysId]->MobileExtends as $sid)
                        $this->XMLInternal .= "<me>".base64_encode($sid)."</me>\r\n";

                    foreach($this->InternalGroups as $groupid => $group)
                        if($group->IsDynamic)
                            foreach($group->Members as $member => $persistent)
                                if($member == $sysId)
                                    $this->XMLInternal .= "<gr p=\"".base64_encode($persistent ? "1" : "0")."\">".base64_encode($groupid)."</gr>\r\n";

                    if(!empty($this->InternalUsers[$sysId]->GroupsAway))
                        foreach($this->InternalUsers[$sysId]->GroupsAway as $groupid)
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
                        $this->XMLTyping .= "<v id=\"".$b64sysId."\" tp=\"".base64_encode((($this->InternalUsers[$sysId]->Typing==CALLER_SYSTEM_ID)?1:0))."\" />\r\n";

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

	function ExternalXMLBuilder($_caller,$_visitors,$_getall,$_external)
	{
		$this->Caller = $_caller;
		$this->Visitors = $_visitors;
		$this->GetAll = $_getall;
		$this->IsExternal = $_external;
	}
	
	function SetDiscardedObject($_base)
	{
		global $CONFIG,$INTERNAL;
		$this->DiscardedObjects = $_base;
		if(!empty($this->SessionFileSizes))
			foreach($this->SessionFileSizes as $sfs_userid => $sfs_browsers)
            {
				if(!empty($sfs_browsers) && isset($this->Visitors[$sfs_userid]))
				{
					$filtered = ($this->Visitors[$sfs_userid]->IsInChatWith($INTERNAL[CALLER_SYSTEM_ID])) ? false : $INTERNAL[CALLER_SYSTEM_ID]->IsVisitorFiltered($this->Visitors[$sfs_userid]);
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
					if($browser->LastActive < (time()-$CONFIG["timeout_track"]))
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
		global $BROWSER,$USER,$CONFIG,$INTERNAL,$GROUPS,$RVISITOR;
		if(is_array($this->Visitors))
			foreach($this->Visitors as $userid => $USER)
			{
				$icw = $USER->IsInChatWith($INTERNAL[CALLER_SYSTEM_ID]);
                if(!$icw)
				{

					if($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_MONITORING) == PERMISSION_RELATED)
						continue;

					if($INTERNAL[CALLER_SYSTEM_ID]->IsVisitorFiltered($USER))
						continue;
				}

				if($icw || !(!empty($CONFIG["gl_hvjd"]) && empty($USER->Javascript)))
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
						if($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) != PERMISSION_FULL)
							foreach($GROUPS as $group)
								if(!empty($group->Members[CALLER_SYSTEM_ID]) && !empty($group->Members[$BROWSER->SystemId]))
									$iproom = true;

  						if($BROWSER->Type == BROWSER_TYPE_CHAT && (!empty($iproom) || ($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_FULL || ($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_RELATED && in_array($BROWSER->DesiredChatGroup,$INTERNAL[CALLER_SYSTEM_ID]->Groups)) || ($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(PERMISSION_CHATS) == PERMISSION_NONE && !empty($BROWSER->Members[CALLER_SYSTEM_ID])))))
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
		global $USER,$BROWSER,$INTERNAL;
		initData(array("INPUTS"));
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
		
		if(!empty($BROWSER->DesiredChatPartner) && !empty($INTERNAL[$BROWSER->DesiredChatPartner]) && !in_array($BROWSER->DesiredChatGroup,$INTERNAL[$BROWSER->DesiredChatPartner]->Groups))
			$BROWSER->DesiredChatPartner = "";

		$visitorDetails["waiting"] = ($BROWSER->Type == BROWSER_TYPE_CHAT && $BROWSER->Waiting && in_array($BROWSER->DesiredChatGroup,$INTERNAL[CALLER_SYSTEM_ID]->Groups) && (empty($BROWSER->DesiredChatPartner) || $BROWSER->DesiredChatPartner == CALLER_SYSTEM_ID)) ? " w=\"".base64_encode(1)."\"" : "";
		if(!in_array($USER->UserId,$this->AddedVisitors) /*|| (!empty($BROWSER->ChatRequest) && $BROWSER->ChatRequest == $USER->ActiveChatRequest)*/)
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
		global $USER,$BROWSER,$GROUPS,$INPUTS;
		initData(array("INPUTS"));
		if($this->CurrentResponseType == DATA_RESPONSE_TYPE_KEEP_ALIVE)
			$this->CurrentResponseType = DATA_RESPONSE_TYPE_BASIC;
		if($this->GetAll)
			$this->CurrentResponseType = DATA_RESPONSE_TYPE_STATIC;

		if(!$BROWSER->Closed && ($BROWSER->Status > CHAT_STATUS_OPEN || $BROWSER->Waiting))
		{
			if(!empty($BROWSER->DesiredChatGroup))
			{
				$pra = (!empty($BROWSER->Members[CALLER_SYSTEM_ID])) ? " pra=\"".base64_encode($BROWSER->PostsReceived(CALLER_SYSTEM_ID))."\"" : "";
				$cti = "";

				$USER->IsChat = true;
				$this->XMLCurrentChat =  "<chat id=\"".base64_encode($BROWSER->ChatId)."\" d=\"".base64_encode(!empty($BROWSER->Declined) ? 1 : 0)."\" p=\"".base64_encode($BROWSER->Priority)."\" f=\"".base64_encode($BROWSER->FirstActive)."\" q=\"".base64_encode(($BROWSER->Status > CHAT_STATUS_OPEN) ? "0" : "1")."\" cmb=\"".base64_encode($BROWSER->CallMeBack)."\" st=\"".base64_encode($BROWSER->Activated)."\" fn=\"" . base64_encode($BROWSER->GetInputData(111)) . "\" em=\"" . base64_encode($BROWSER->GetInputData(112)) . "\" eq=\"" . base64_encode($BROWSER->GetInputData(114)) . "\" gr=\"".base64_encode($BROWSER->DesiredChatGroup)."\" dcp=\"".base64_encode($BROWSER->DesiredChatPartner)."\" at=\"".base64_encode($BROWSER->AllocatedTime)."\" cp=\"" . base64_encode($BROWSER->GetInputData(116))."\" co=\"" . base64_encode($BROWSER->GetInputData(113)) . "\"".$pra.$cti.">\r\n";
				
				foreach($GROUPS as $groupid => $group)
					if($group->IsDynamic)
						foreach($group->Members as $member => $persistent)
							if($member == $BROWSER->SystemId)
								$this->XMLCurrentChat .= "<gr p=\"".base64_encode($persistent ? "1" : "0")."\">".base64_encode($groupid)."</gr>\r\n";
				
				if(is_array($BROWSER->Customs))
					foreach($BROWSER->Customs as $index => $value)
						if($INPUTS[$index]->Active && $INPUTS[$index]->Custom)
                        {
                            $value = ($INPUTS[$index]->Type == "Text") ? $BROWSER->GetInputData($index) : $value;
							$this->XMLCurrentChat .=  "   <cf index=\"" . base64_encode($index) . "\">".base64_encode($INPUTS[$index]->GetClientValue($value))."</cf>\r\n";
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
							$BROWSER->RepostChatHistory(3,$BROWSER->ChatId,CALLER_SYSTEM_ID,0,0,"","","",false,false);
							$BROWSER->Forward->Destroy();
						}
						else
						{
							$BROWSER->RepostChatHistory(3,$BROWSER->ChatId,CALLER_SYSTEM_ID,0,0,"","","",false,false);
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
