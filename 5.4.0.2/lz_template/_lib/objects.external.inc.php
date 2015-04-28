<?php
/****************************************************************************************
* LiveZilla objects.external.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
class GroupBuilder
{
	public $InternalGroups;
	public $InternalUsers;
	public $Config;
	public $GroupAvailable = false;
	public $GroupValues = array();
	public $Result;
	public $ErrorHTML = "''";
	public $ReqGroup;
	public $ReqOperator;
	public $Parameters;
	
	function GroupBuilder($_internalUsers,$_internalGroups,$_config,$_reqGroup="",$_reqOperator="",$allowCom=true)
	{
        $reqGroup = UserGroup::ReadParams();
		$this->ReqGroup = (!empty($reqGroup)) ? $reqGroup : $_reqGroup;
		$this->ReqOperator = (!empty($_GET[GET_EXTERN_INTERN_USER_ID])) ? base64UrlDecode($_GET[GET_EXTERN_INTERN_USER_ID]) : $_reqOperator;
		$this->InternalUsers = $_internalUsers;
		$this->InternalGroups = $_internalGroups;
		$this->Config = $_config;
		$this->GroupValues["groups_online"] = Array();
		$this->GroupValues["groups_offline"] = Array();
		$this->GroupValues["groups_online_amounts"] = Array();
		$this->GroupValues["groups_output"] = Array();
		$this->GroupValues["groups_hidden"] = Array();
		$this->GroupValues["set_by_get_user"] = null;
		$this->GroupValues["set_by_get_group"] = null;
		$this->GroupValues["set_by_cookie"] = null;
		$this->GroupValues["set_by_standard"] = null;
		$this->GroupValues["set_by_online"] = null;
		$this->GroupValues["req_for_user"] = !empty($this->ReqOperator);
		$this->GroupValues["req_for_group"] = !empty($this->ReqGroup);
		$this->Parameters = getTargetParameters($allowCom);

		if($this->Parameters["include_group"] != null || $this->Parameters["include_user"] != null)
		{
			foreach($_internalGroups as $gid => $group)
				if(!($this->Parameters["include_group"] != null && in_array($gid,$this->Parameters["include_group"])))
				{
					if(!($this->Parameters["include_user"] != null && in_array($gid,$_internalUsers[Operator::GetSystemId($this->Parameters["include_user"])]->GetGroupList(false))))
						$this->GroupValues["groups_hidden"][] = $gid;
				}
		}
		if($this->Parameters["exclude"] != null)
			$this->GroupValues["groups_hidden"] = $this->Parameters["exclude"];
	}
	
	function GetTargetGroup(&$_operatorCount,$_prInternalId="",$_prGroupId="",$offdef = null,$offdefocunt=0)
	{
		$groups = array_merge($this->GroupValues["groups_output"],$this->GroupValues["groups_offline"]);
		if(!empty($_prInternalId) && !empty($this->InternalUsers[$_prInternalId]) && $this->InternalUsers[$_prInternalId]->Status < USER_STATUS_OFFLINE)
        {
            if(!empty($_prGroupId) && $this->InternalUsers[$_prInternalId]->IsInGroup($_prGroupId))
                if($this->InternalGroups[$_prGroupId]->IsExternal && !in_array($_prGroupId,$this->GroupValues["groups_hidden"]) && $this->InternalGroups[$_prGroupId]->IsOpeningHour(false))
                {
                    $_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$_prGroupId])) ? $this->GroupValues["groups_online_amounts"][$_prGroupId] : 0;
                    return $_prGroupId;
                }

			foreach($this->InternalUsers[$_prInternalId]->GetGroupList(true) as $id)
				if($this->InternalGroups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && $this->InternalGroups[$id]->IsOpeningHour(false))
				{
					$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;

                    return $id;
				}
        }

		if(defined("IGNORE_WM") || empty($this->GroupValues["set_by_get_group"]))
		{
			$_operatorCount = 0;
			foreach($groups as $id => $values)
				if($this->InternalGroups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && $this->InternalGroups[$id]->IsOpeningHour(false) && $this->InternalGroups[$id]->IsHumanAvailable(false) /*&& !$this->InternalGroups[$id]->HasWelcomeManager()*/)
				{
					$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                    return $id;
				}
		}

		$_operatorCount = 0;
		foreach($groups as $id => $values)
			if($this->InternalGroups[$id]->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]) && $this->InternalGroups[$id]->IsOpeningHour(false))
			{
				$_operatorCount = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                return $id;
			}
			else if($this->InternalGroups[$id]->IsStandard || empty($offdef))
			{
				$offdefocunt = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                $offdef = $id;
			}
		$_operatorCount = $offdefocunt;
		return $offdef;
	}
	
	function GetHTML($_language)
	{
		$html_groups = "";
		foreach($this->InternalGroups as $id => $group)
			if($group->IsExternal && !in_array($id,$this->GroupValues["groups_hidden"]))
				$html_groups .= "<option value=\"".$id."\">".$group->GetDescription($_language)."</option>";
		return $html_groups;
	}
	
	function Generate($_user=null,$_allowBots=false)
	{
        global $GROUPS;
		foreach($this->InternalUsers as $internaluser)
		{
			if($internaluser->LastActive > (time()-$this->Config["timeout_clients"]) && $internaluser->Status < USER_STATUS_OFFLINE && ($_allowBots || !$internaluser->IsBot) && !$internaluser->MobileSleep())
			{
				$igroups = $internaluser->GetGroupList(true);
				for($count=0;$count<count($igroups);$count++)
				{
					if($internaluser->UserId == $this->ReqOperator)
						if(!($this->GroupValues["req_for_group"] && $igroups[$count] != $this->ReqGroup) || (isset($_GET[GET_EXTERN_PREFERENCE]) && base64UrlDecode($_GET[GET_EXTERN_PREFERENCE]) == "user"))
							$this->GroupValues["set_by_get_user"] = $igroups[$count];

					if(!isset($this->GroupValues["groups_online_amounts"][$igroups[$count]]))
						$this->GroupValues["groups_online_amounts"][$igroups[$count]] = 0;

					if($internaluser->IsBot)
						$this->GroupValues["groups_online_amounts"][$igroups[$count]]+=1;
					else if(isset($GROUPS[$igroups[$count]]))
                    {
                        if($internaluser->GetMaxChatAmountStatus($GROUPS[$igroups[$count]]) != USER_STATUS_AWAY)
						    $this->GroupValues["groups_online_amounts"][$igroups[$count]]+=2;
                    }
				}
			}
		}
		$counter = 0;
        if(is_array($this->InternalGroups))
		    foreach($this->InternalGroups as $id => $group)
            {
                if(!$group->IsExternal)
                    continue;

                $used = false;
                $amount = (isset($this->GroupValues["groups_online_amounts"]) && is_array($this->GroupValues["groups_online_amounts"]) && array_key_exists($id,$this->GroupValues["groups_online_amounts"]) && $group->IsOpeningHour()) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
                $transport = base64_encode($id) . "," . base64_encode($amount) . "," . base64_encode($group->GetDescription((($_user != null) ? $_user->Language : ""))) . "," . base64_encode($group->Email);

                if($this->GroupValues["req_for_group"] && $id == $this->ReqGroup)
                    {$this->GroupValues["set_by_get_group"] = $id;$used=true;}
                elseif(getCookieValue("login_group") != null && $id == getCookieValue("login_group") && !isset($requested_group))
                    {$this->GroupValues["set_by_cookie"] = $id;$used=true;}
                elseif($group->IsStandard)
                    {$this->GroupValues["set_by_standard"] = $id;$used=true;}
                elseif(empty($this->GroupValues["set_by_online"]))
                    {$this->GroupValues["set_by_online"] = $id;$used=true;}

                if(!in_array($id,$this->GroupValues["groups_hidden"]) && ($group->IsExternal || $used))
                {
                    $counter++;
                    if($amount > 0)
                    {
                        $this->GroupAvailable = true;
                        $this->GroupValues["groups_online"][$id] = $transport;
                    }
                    else
                    {
                        if($group->IsStandard)
                        {
                            $na[$id] = $transport;
                            $na = array_merge($na,$this->GroupValues["groups_offline"]);
                            $this->GroupValues["groups_offline"] = $na;
                        }
                        else
                            $this->GroupValues["groups_offline"][$id] = $transport;
                    }
                }
            }
		if(isset($_GET[GET_EXTERN_PREFERENCE]) && base64UrlDecode($_GET[GET_EXTERN_PREFERENCE]) == "group")
		{
			if(isset($this->GroupValues["groups_online_amounts"][$this->ReqGroup]) && $this->GroupValues["groups_online_amounts"][$this->ReqGroup] > 0)
			{
				$this->GroupValues["set_by_get_user"] = null;
				$this->GroupValues["req_for_user"] = false;
			}
		}

		if(!empty($this->GroupValues["set_by_get_user"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_get_user"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_user"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_get_user"]];
		else if(!empty($this->GroupValues["set_by_get_group"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_get_group"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_group"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_get_group"]];
		else if(!empty($this->GroupValues["set_by_cookie"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_cookie"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_cookie"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_cookie"]];
		else if(!empty($this->GroupValues["set_by_standard"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_standard"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_standard"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_standard"]];
		else if(!empty($this->GroupValues["set_by_online"]) && isset($this->GroupValues["groups_online"][$this->GroupValues["set_by_online"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_online"]] = $this->GroupValues["groups_online"][$this->GroupValues["set_by_online"]];
		else if(!empty($this->GroupValues["set_by_cookie"]) && empty($this->GroupValues["groups_output"]) && !empty($this->GroupValues["groups_offline"][$this->GroupValues["set_by_cookie"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_cookie"]] = $this->GroupValues["groups_offline"][$this->GroupValues["set_by_cookie"]];
		else if(!empty($this->GroupValues["set_by_get_group"]) && empty($this->GroupValues["groups_output"]) && !empty($this->GroupValues["groups_offline"][$this->GroupValues["set_by_get_group"]]))
			$this->GroupValues["groups_output"][$this->GroupValues["set_by_get_group"]] = $this->GroupValues["groups_offline"][$this->GroupValues["set_by_get_group"]];
		
		foreach($this->GroupValues["groups_online"] as $id => $transport)
			if(!isset($this->GroupValues["groups_output"][$id]))
				$this->GroupValues["groups_output"][$id] = $transport;

		if(empty($this->GroupValues["set_by_get_group"]) || empty($this->GroupValues["groups_online_amounts"][$this->GroupValues["set_by_get_group"]]) /*|| (!empty($this->GroupValues["groups_online_amounts"][$this->GroupValues["set_by_get_group"]]) && $this->GroupValues["groups_online_amounts"][$this->GroupValues["set_by_get_group"]] == )1*/)
		{
			$ngroups = array();
			foreach($this->GroupValues["groups_output"] as $id => $group)
			{
				$ngroups[$id] = (!empty($this->GroupValues["groups_online_amounts"][$id])) ? $this->GroupValues["groups_online_amounts"][$id] : 0;
				
				if($id == $this->GroupValues["set_by_standard"])
					$ngroups[$id] = 10000;
			}
			arsort($ngroups);
			$nsgroups = array();
			foreach($ngroups as $id => $amount)
				$nsgroups[$id] = $this->GroupValues["groups_output"][$id];
			$this->GroupValues["groups_output"] = $nsgroups;
		}

		$result = array_merge($this->GroupValues["groups_output"],$this->GroupValues["groups_offline"]);
		
		foreach($result as $key => $value)
		{
			$chat_input_fields = "new Array(";
			$count = 0;
			foreach($this->InternalGroups[$key]->ChatInputsHidden as $index)
			{
				if($count > 0)$chat_input_fields.=",";
				$chat_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($chat_input_fields . ");");
			$chat_input_fields = "new Array(";
			$count = 0;
			foreach($this->InternalGroups[$key]->ChatInputsMandatory as $index)
			{
				if($count > 0)$chat_input_fields.=",";
				$chat_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($chat_input_fields . ");");
		
			$ticket_input_fields = "new Array(";
			$count = 0;
			foreach($this->InternalGroups[$key]->TicketInputsHidden as $index)
			{
				if($count > 0)$ticket_input_fields.=",";
				$ticket_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($ticket_input_fields . ");");
			$ticket_input_fields = "new Array(";
			$count = 0;
			foreach($this->InternalGroups[$key]->TicketInputsMandatory as $index)
			{
				if($count > 0)$ticket_input_fields.=",";
				$ticket_input_fields.="'".$index."'";
				$count++;
			}
			$value .= ",".base64_encode($ticket_input_fields . ");");
			$mes = getPredefinedMessage($this->InternalGroups[$key]->PredefinedMessages,(($_user != null) ? $_user->Language : ""));
			if($mes != null)
			{
				$value .= ",".base64_encode($mes->ChatInformation);
				$value .= ",".base64_encode($mes->CallMeBackInformation);
				$value .= ",".base64_encode($mes->TicketInformation);
			}
			else
			{
				$value .= ",".base64_encode("");
				$value .= ",".base64_encode("");
				$value .= ",".base64_encode("");
			}
			
			$count = 0;
			$com_tickets_allowed = "new Array(";
			foreach($this->InternalGroups[$key]->ChatVouchersRequired as $cttid)
			{
				if($count > 0)$com_tickets_allowed.=",";
				$com_tickets_allowed.="'".$cttid."'";
				$count++;
			}
			$value .= ",".base64_encode($com_tickets_allowed. ");");
			
			if(!empty($this->Result))
				$this->Result .= ";" . $value;
			else
				$this->Result = $value;
		}
		if($counter == 0)
			$this->ErrorHTML = "lz_chat_data.Language.ClientErrorGroups";
	}
}

class ChatRouter
{
    public $OperatorsBusy;
    public $OperatorsAvailable;
    public $TargetGroupId;
    public $TargetOperatorSystemId;
    public $PreviousOperatorSystemId;
    public $WasTarget = false;
    public $IsPredefined = false;

    function FindOperator($_user,$_allowBots=false,$_requireBot=false,$_exclude=null)
    {
        global $CONFIG,$INTERNAL,$GROUPS,$WELCOME_MANAGER;
        $util=0;
        $this->OperatorsAvailable = array();
        $this->OperatorsBusy = 0;
        $backup_target = null;
        $fromCookie = null;
        $result = true;
        $fromDepartment = $fromDepartmentBusy = false;
        $this->TargetOperatorSystemId = $this->PreviousOperatorSystemId;
        $predefined = $this->GetPredefinedOperator($_user,$fromCookie,$_allowBots,$_requireBot);
        $this->WasTarget = (!empty($this->PreviousOperatorSystemId) || !empty($predefined));

        foreach($GROUPS as $id => $group)
            $utilization[$id] = 0;

        foreach($INTERNAL as $sessId => $internal)
        {
            if(!empty($_exclude) && in_array($sessId,$_exclude))
                continue;

            if(!$internal->Deactivated && !$internal->MobileSleep($_user->Browsers[0]) && !$internal->PrioritySleep($this->TargetGroupId) && $internal->Status != USER_STATUS_OFFLINE && ($_allowBots || !$internal->IsBot) && (!$_requireBot || $internal->IsBot))
            {
                $group_chats[$sessId] = $internal->GetExternalChatAmount();
                $group_names[$sessId] = $internal->Fullname;
                $group_available[$sessId] = GROUP_STATUS_UNAVAILABLE;
                if(in_array($this->TargetGroupId,$internal->GetGroupList(true)))
                {
                    $intstatus = $internal->GetMaxChatAmountStatus($GROUPS[$this->TargetGroupId]);
                    if($WELCOME_MANAGER && $internal->IsBot && $internal->WelcomeManager)
                        $this->TargetOperatorSystemId = $sessId;
                    if($intstatus == USER_STATUS_ONLINE && ($internal->LastChatAllocation < (time()-10) || $internal->IsBot))
                        $group_available[$sessId] = GROUP_STATUS_AVAILABLE;
                    elseif($intstatus == USER_STATUS_BUSY || ($internal->LastChatAllocation >= (time()-10) && !$internal->IsBot))
                    {
                        $group_available[$sessId] = GROUP_STATUS_BUSY;
                        $this->OperatorsBusy++;

                        if(empty($fromCookie) && $predefined == $sessId)
                        {
                            if($this->TargetOperatorSystemId != $predefined)
                            {
                                $this->TargetOperatorSystemId = $predefined;
                                $this->IsPredefined = true;
                            }
                        }
                    }
                }
                else
                {
                    $intstatus = $internal->GetMaxChatAmountStatus();
                    if($intstatus == USER_STATUS_ONLINE)
                        $backup_target = $internal;
                    else if($intstatus == USER_STATUS_BUSY && empty($backup_target))
                        $backup_target = $internal;

                    if(!$this->IsPredefined && !empty($this->TargetOperatorSystemId) && $this->TargetOperatorSystemId == $sessId)
                        $this->TargetOperatorSystemId = null;
                }
                $igroups = $internal->GetGroupList(true);
                for($count=0;$count<count($igroups);$count++)
                {
                    if($this->TargetGroupId == $igroups[$count])
                    {
                        if(!is_array($utilization[$igroups[$count]]))
                            $utilization[$igroups[$count]] = Array();
                        if($group_available[$sessId] == GROUP_STATUS_AVAILABLE)
                            $utilization[$igroups[$count]][$sessId] = $group_chats[$sessId];
                    }
                }
            }
        }
        if(isset($utilization[$this->TargetGroupId]) && is_array($utilization[$this->TargetGroupId]))
        {
            arsort($utilization[$this->TargetGroupId]);
            reset($utilization[$this->TargetGroupId]);
            $util = end($utilization[$this->TargetGroupId]);
            $this->OperatorsAvailable = $utilization[$this->TargetGroupId];
        }
        if(isset($group_available) && is_array($group_available) && in_array(GROUP_STATUS_AVAILABLE,$group_available))
            $fromDepartment = true;
        elseif(isset($group_available) && is_array($group_available) && in_array(GROUP_STATUS_BUSY,$group_available))
            $fromDepartmentBusy = true;

        if(isset($group_chats) && is_array($group_chats) && isset($fromDepartment) && $fromDepartment)
            foreach($group_chats as $sessId => $amount)
                if(($group_available[$sessId] == GROUP_STATUS_AVAILABLE && $amount <= $util) || ((!empty($_user->Browsers[0]->Forward) && $_user->Browsers[0]->Forward->Processed) && isset($predefined) && $sessId == $predefined))
                    $available_internals[] = $sessId;

        if($fromDepartment && sizeof($available_internals) > 0)
        {
            if(is_array($available_internals))
            {
                if(!empty($predefined) && (in_array($predefined,$available_internals) || $INTERNAL[$predefined]->Status == USER_STATUS_ONLINE))
                    $matching_internal = $predefined;
                else
                {
                    if(!isnull($inv_sender = $_user->Browsers[0]->GetLastInvitationSender()) && in_array($inv_sender,$available_internals))
                    {
                        $matching_internal = $inv_sender;
                    }
                    else
                    {
                        $available_internals_prio = array();
                        $available_internals_prio_max = array();
                        $maxp = 0;

                        foreach($available_internals as $sessId)
                        {
                            $available_internals_prio[$sessId] = $GROUPS[$this->TargetGroupId]->GetChatPriority($sessId);
                            $maxp = max($maxp,$available_internals_prio[$sessId]);
                        }

                        foreach($available_internals_prio as $sessId => $prio)
                        {
                            if($prio == $maxp)
                            {
                                $available_internals_prio_max[$sessId] = $prio;
                            }
                        }

                        if($maxp > 0)
                        {
                            $matching_internal = array_rand($available_internals_prio_max,1);
                        }
                        else
                        {
                            $matching_internal = array_rand($available_internals,1);
                            $matching_internal = $available_internals[$matching_internal];
                        }
                    }
                }
            }

            if(!$this->IsPredefined && $CONFIG["gl_alloc_mode"] != ALLOCATION_MODE_ALL || $fromCookie == $matching_internal || $INTERNAL[$matching_internal]->IsBot)
                $this->TargetOperatorSystemId = $matching_internal;

        }
        else if($fromDepartmentBusy)
        {
            if(!$_user->Browsers[0]->Waiting)
                $_user->Browsers[0]->Waiting = true;
        }
        else
        {
            $result = false;
            $this->OperatorsAvailable = array();
        }
        if(!$this->IsPredefined && $CONFIG["gl_alloc_mode"] == ALLOCATION_MODE_ALL && (!empty($CONFIG["gl_iada"]) || !empty($CONFIG["gl_imda"])))
        {
            if(!empty($this->TargetOperatorSystemId) && count($_user->ChatRequests)>0 && !$INTERNAL[$this->TargetOperatorSystemId]->IsBot)
            {
                if((!empty($CONFIG["gl_iada"]) && !empty($_user->ChatRequests[0]->EventActionId)) || (!empty($CONFIG["gl_imda"]) && empty($_user->ChatRequests[0]->EventActionId)))
                {
                    $result = true;
                    $this->TargetOperatorSystemId = null;
                }
            }
        }
        return $result;
    }

    function GetPredefinedOperator($_user,&$fromCookie,$_allowBots,$_requireBot,$desired="")
    {
        global $INTERNAL,$CONFIG;
        if(!empty($this->TargetOperatorSystemId) && isset($INTERNAL[$this->TargetOperatorSystemId]) && $INTERNAL[$this->TargetOperatorSystemId]->Status < USER_STATUS_OFFLINE)
        {
            if(!(!empty($this->TargetGroupId) && !in_array($this->TargetGroupId,$INTERNAL[$this->TargetOperatorSystemId]->GetGroupList(true))))
                $desired = $this->TargetOperatorSystemId;
        }
        else
        {
            $this->TargetOperatorSystemId = null;
            $opParam = Operator::ReadParams();
            if(!empty($opParam))
                $desired = Operator::GetSystemId($opParam);
            else if(!isnull(getCookieValue("internal_user")) && !empty($CONFIG["gl_save_op"]))
            {
                $desired = Operator::GetSystemId(getCookieValue("internal_user"));
                if(!empty($INTERNAL[$desired]) && !(!empty($this->TargetGroupId) && !in_array($this->TargetGroupId,$INTERNAL[$desired]->GetGroupList(true))))
                    $fromCookie = $desired;
                else
                    $desired = "";
            }
            else if(empty($desired) && !empty($CONFIG["gl_save_op"]))
            {
                $desired = $_user->GetLastChatOperator(true);
            }
        }

        if(!empty($desired) && $INTERNAL[$desired]->MobileSleep($_user->Browsers[0]))
            $this->TargetOperatorSystemId = $desired = "";
        else if(!empty($desired) && !$_allowBots && $INTERNAL[$desired]->IsBot)
            $this->TargetOperatorSystemId = $desired = "";
        else if(!empty($desired) && $_requireBot && !$INTERNAL[$desired]->IsBot)
            $this->TargetOperatorSystemId = $desired = "";

        return $desired;
    }

    function GetQueuePosition($_targetGroup,$_startTime=0,$_position = 1)
    {
        global $CONFIG,$USER;
        $USER->Browsers[0]->SetStatus(CHAT_STATUS_OPEN);
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `qpenalty`=`qpenalty`+60 WHERE `last_active`>".(time()-$CONFIG["timeout_chats"])." AND `status`=0 AND `exit`=0 AND `last_active`<" . DBManager::RealEscape(time()-max(20,($CONFIG["poll_frequency_clients"]*2))));
        $result = queryDB(true,"SELECT `priority`,`request_operator`,`request_group`,`chat_id`,`first_active`,`qpenalty`+`first_active` as `sfirst` FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `status`='0' AND `exit`='0' AND `chat_id`>0 AND `last_active`>".(time()-$CONFIG["timeout_chats"])." ORDER BY `priority` DESC,`sfirst` ASC;");
        if($result)
        {
            while($row = DBManager::FetchArray($result))
            {
                if($row["chat_id"] == $USER->Browsers[0]->ChatId)
                {
                    $_startTime = $row["sfirst"];
                    break;
                }
                else if($row["request_group"]==$_targetGroup && $row["request_operator"]==$USER->Browsers[0]->DesiredChatPartner)
                {
                    $_position++;
                }
                else if($row["request_group"]==$_targetGroup && ($row["request_operator"]!=$USER->Browsers[0]->DesiredChatPartner && empty($row["request_operator"])))
                {
                    $_position++;
                }
                else if(!empty($USER->Browsers[0]->DesiredChatPartner) && $USER->Browsers[0]->DesiredChatPartner==$row["request_operator"])
                {
                    $_position++;
                }
            }
        }
        define("CHAT_START_TIME",$_startTime);
        return $_position;
    }

    function GetQueueWaitingTime($_position,$min=1)
    {
        global $CONFIG;
        if($this->OperatorsBusy == 0)
            $this->OperatorsBusy++;
        $result = queryDB(true,"SELECT AVG(`endtime`-`time`) AS `waitingtime` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` AS `db1` INNER JOIN `".DB_PREFIX.DATABASE_OPERATORS."` as `db2` ON `db1`.`internal_id`=`db2`.`system_id` WHERE `chat_type`=1 AND `bot`=0 AND `endtime`>0 AND `endtime`>`time` AND `endtime`-`time` < 3600;");
        if($result)
        {
            $row = DBManager::FetchArray($result);
            if(!empty($row["waitingtime"]))
                $min = ($row["waitingtime"]/60)/$this->OperatorsBusy;
            else
                $min = $min/$this->OperatorsBusy;

            $minb = $min;
            for($i = 1;$i < $_position; $i++)
            {
                $minb *= 0.9;
                $min += $minb;
            }
            $min /= $CONFIG["gl_sim_ch"];
            $min -= abs((time() - CHAT_START_TIME) / 60);
            if($min <= 0)
                $min = 1;
        }
        return min(10,ceil($min));
    }
}

class RatingGenerator
{
	public $Fields;
	
	function RatingGenerator()
	{
		$this->Generate();
	}
	
	function Generate()
	{
		$this->Fields = array(4);
		for($int = 0;$int < 4;$int++)
			$this->Fields[$int]= str_replace("<!--box_id-->",$int,getFile(TEMPLATE_HTML_RATEBOX));
	}
}
?>
