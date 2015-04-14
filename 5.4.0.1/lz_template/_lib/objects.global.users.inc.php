<?php
/****************************************************************************************
* LiveZilla objects.global.users.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
require(LIVEZILLA_PATH . "_lib/objects.global.inc.php");

class BaseUser extends BaseObject
{
	public $SessId;
	public $UserId;
	public $Language;
	public $SystemId;
	public $Messages = array();
	public $Status = 2;
	public $Type;
	public $Folder;
	public $SessionFile;
	public $FirstActive;
	public $LastActive;
    public $IsDynamic = false;
	public $Typing = false;
    public $AutoReplies = array();
    public $FullyLoaded = false;

	function BaseUser($_userid)
   	{
		$this->UserId = $_userid;
   	}
	function GetPosts($_chatId="")
	{
		$messageFileCount = 0;
		$rows = Chat::GetPosts($this->SystemId, $_chatId);
		$posts = array();
		foreach($rows as $row)
		{
			array_push($posts,new Post($row));
			if(++$messageFileCount >= DATA_ITEM_LOADS && $posts[count($posts)-1]->Receiver == $posts[count($posts)-1]->ReceiverOriginal)
				break;
		}
		return $posts;
	}
	function AppendPersonalData()
	{
        global $INPUTS;
        initData(array("INPUTS"));
		if(!$INPUTS[111]->IsCookie())
			$this->Fullname = $INPUTS[111]->GetServerInput();
        if(!$INPUTS[112]->IsCookie())
			$this->Email = $INPUTS[112]->GetServerInput();
        if(!$INPUTS[113]->IsCookie())
			$this->Company = $INPUTS[113]->GetServerInput();
        if(!$INPUTS[114]->IsCookie())
			$this->Question = $INPUTS[114]->GetServerInput();
        if(!$INPUTS[116]->IsCookie())
			$this->Phone = $INPUTS[116]->GetServerInput();
		
		if(empty($this->Email) && !isnull(getCookieValue("form_112")))
			$this->Email = (getCookieValue("form_112"));
		if(empty($this->Fullname) && !isnull(getCookieValue("form_111")))
			$this->Fullname = (getCookieValue("form_111"));
		if(empty($this->Company) && !isnull(getCookieValue("form_113")))
			$this->Company = (getCookieValue("form_113"));
		if(empty($this->Phone) && !isnull(getCookieValue("form_116")))
			$this->Phone = (getCookieValue("form_116"));

        foreach($INPUTS as $index => $input)
        {
            if($input->Custom && $input->Active)
            {
                if(isnull(getCookieValue("cf_".$index)) && !empty($_GET["cf".$index]))
                    $this->Customs[$index] = base64UrlDecode(getParam("cf".$index));
                if(empty($this->Customs[$index]) && !isnull(getCookieValue("cf_".$index)))
                    $this->Customs[$index] = getCookieValue("cf_".$index);
            }
        }
	}
    function LoadAutoReplies()
    {
        /*
         * deprecated

        $this->AutoReplies = array();
        $result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_AUTO_REPLIES."` WHERE `owner_id`='".DBManager::RealEscape($this->SystemId)."' ORDER BY `search_type` DESC, `tags` ASC;");
        if($result)
            while($row = DBManager::FetchArray($result))
                $this->AutoReplies[] = new ChatAutoReply($row);
        */
    }
}

class ChatMember
{
	public $SystemId;
	public $Status;
	public $Declined;
	public $Joined;
	public $Left;
	
	function ChatMember($_systemId, $_status, $_declined=false, $_joined=0, $_left=0)
	{
		$this->SystemId = $_systemId;
		$this->Status = $_status;
		$this->Declined = $_declined;
		$this->Joined = $_joined;
		$this->Left = $_left;
	}
}

class UserGroup extends BaseUser
{
	public $Descriptions;
	public $DescriptionArray;
	public $IsExternal;
	public $IsInternal;
	public $IsStandard;
	public $PredefinedMessages = array();
    public $Signatures = array();
	public $Created;
	public $Email;
	public $ChatFunctions;
	public $VisitorFilters;
	public $ChatInputsHidden;
	public $ChatInputsMandatory;
    public $ChatPriorities;
    public $ChatPrioritySleep;
	public $TicketInputsHidden;
	public $TicketInputsMandatory;
    public $ChatInputsMasked;
    public $TicketInputsMasked;
    public $ChatInputsCapitalized;
    public $TicketInputsCapitalized;
    public $TicketAssignment;
	public $ChatVouchersRequired;
	public $OpeningHours = array();
	public $Members;
	public $Owner;
	public $PostJS = "";
	public $PreJS = "";
    public $TicketEmailOut;
    public $TicketEmailIn = array();
    public $TicketHandleUnknownEmails;
    public $ChatEmailOut;

	function UserGroup()
	{
		if(func_num_args() > 0)
		{
			$this->Id = $this->SystemId = func_get_arg(0);
			$row = (func_num_args() > 1) ? func_get_arg(1) : null;
			
			if(!empty($row))
			{
				if(!empty($row["dynamic"]))
				{
					$this->Owner = $row["owner"];
					$this->IsDynamic = true;
					$this->Descriptions["EN"] = $row["name"];
					$this->LoadMembers();
				}
				else
				{
					$this->Descriptions = @unserialize($row["description"]);
					$this->DescriptionArray = $row["description"];

					$this->IsInternal = !empty($row["internal"]);
					$this->IsExternal = !empty($row["external"]);
					$this->IsStandard = !empty($row["standard"]);

                    if($row["max_chats"] < 1)
                        $this->MaxChatAmount = 9999;
                    else if($row["max_chats"] > 30)
                    {
                        $this->MaxChatsStatus = USER_STATUS_AWAY;
                        $this->MaxChatAmount = $row["max_chats"]-30;
                    }
                    else
                        $this->MaxChatAmount = $row["max_chats"];

                    $this->MaxChats = $row["max_chats"];
					$this->Created = $row["created"];
					$this->OpeningHours = @unserialize($row["opening_hours"]);
					$this->Email = $row["email"];
                    $this->ChatPrioritySleep = !empty($row["priority_sleep"]);

					if(!empty($row["pre_chat_js"]))
						$this->PreJS = $row["pre_chat_js"];
					if(!empty($row["post_chat_js"]))
						$this->PostJS = $row["post_chat_js"];
						
					$this->VisitorFilters = (!empty($row["visitor_filters"])) ? @unserialize($row["visitor_filters"]) : array();
					$this->ChatFunctions = str_split($row["functions"]);
					$this->ChatInputsHidden = @unserialize($row["chat_inputs_hidden"]);
					$this->ChatInputsMandatory = @unserialize($row["chat_inputs_required"]);
					$this->TicketInputsHidden = @unserialize($row["ticket_inputs_hidden"]);
					$this->TicketInputsMandatory = @unserialize($row["ticket_inputs_required"]);
                    $this->ChatInputsMasked = (!empty($row["chat_inputs_masked"])) ? @unserialize($row["chat_inputs_masked"]) : array();
                    $this->TicketInputsMasked = (!empty($row["ticket_inputs_masked"])) ? @unserialize($row["ticket_inputs_masked"]) : array();
                    $this->ChatInputsCapitalized = (!empty($row["chat_inputs_cap"])) ? @unserialize($row["chat_inputs_cap"]) : array();
                    $this->TicketInputsCapitalized = (!empty($row["ticket_inputs_cap"])) ? @unserialize($row["ticket_inputs_cap"]) : array();
                    $this->ChatPriorities = (!empty($row["priorities"])) ? @unserialize($row["priorities"]) : array();
                    $this->TicketAssignment = (!empty($row["ticket_assignment"])) ? @unserialize($row["ticket_assignment"]) : array();
					$this->ChatVouchersRequired = @unserialize($row["chat_vouchers_required"]);
                    $this->TicketEmailIn = @unserialize(@$row["ticket_email_in"]);
                    $this->TicketEmailOut = @$row["ticket_email_out"];
                    $this->TicketHandleUnknownEmails = @$row["ticket_handle_unknown"];
                    $this->ChatEmailOut = @$row["chat_email_out"];
				}
			}
		}
	}

	function LoadMembers()
	{
        $this->Members = array();
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."';");
		if($result)
			while($row = DBManager::FetchArray($result))
				$this->Members[$row["user_id"]] = !empty($row["persistent"]);
	}
	
	function IsOpeningHour($_ignoreBots=true)
	{
		initData(array("INTERNAL"));

        if(!$_ignoreBots && $this->ContainsBot())
            return true;

		$sofday = time() - mktime(0,0,0);
		foreach($this->OpeningHours as $hour)
		{
			if(date("N") == $hour[0])
			{
				if($sofday >= $hour[1] && $sofday <= $hour[2])
					return true;
			}
		}
		return (count($this->OpeningHours) == 0);
	}

	function IsHumanAvailable($_ignoreExternal=false,$_ignoreOpeningHours=false)
	{
		global $INTERNAL,$GROUPS;
		foreach($INTERNAL as $internaluser)
			if(in_array($this->Id,$internaluser->Groups) && !$internaluser->IsBot)
			{
				$isex = $internaluser->IsExternal($GROUPS, null, array($this->Id), $_ignoreExternal,$_ignoreOpeningHours);
				if($isex && $internaluser->Status < USER_STATUS_OFFLINE)
					return true;
			}
		return false;
	}

    function ContainsBot()
    {
        global $INTERNAL;
        foreach($INTERNAL as $internaluser)
            if(in_array($this->Id,$internaluser->Groups) && $internaluser->IsBot && !$internaluser->Deactivated)
                return true;
        return false;
    }

	function HasWelcomeManager()
	{
		global $INTERNAL;
		foreach($INTERNAL as $internaluser)
		{
			if(in_array($this->Id,$internaluser->Groups) && $internaluser->IsBot && $internaluser->WelcomeManager && !$internaluser->Deactivated)
				return true;
		}
		return false;
	}
	
	function LoadPredefinedMessages()
	{
		if(DB_CONNECTION)
		{
			$this->PredefinedMessages = array();
			$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PREDEFINED."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."'");
			if($result)
				while($row = DBManager::FetchArray($result))
					$this->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row);
            $this->SetDefaultPredefinedMessage();
        }
	}

    function SetDefaultPredefinedMessage()
    {
        $isdefault = false;
        foreach($this->PredefinedMessages as $message)
            if($message->IsDefault)
                $isdefault = true;
        if(!$isdefault)
            if(!empty($this->PredefinedMessages["en"]))
                $this->PredefinedMessages["en"]->IsDefault = true;
    }

    function LoadSignatures()
    {
        if(is("DB_CONNECTION"))
        {
            $this->Signatures = array();
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_SIGNATURES."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."'");
            if($result)
                while($row = DBManager::FetchArray($result))
                    $this->Signatures[strtolower($row["id"])] = new Signature($row);
        }
    }

    function Load()
    {
        $this->LoadPredefinedMessages();
        $this->LoadSignatures();
    }

	function GetXML()
	{
		if($this->IsDynamic)
		{
			$xml = "<v i=\"".base64_encode($this->Id)."\" n=\"".base64_encode($this->Descriptions["EN"])."\" o=\"".base64_encode($this->Owner)."\">";
			foreach($this->Members as $member => $persistent)
				$xml .= "<crm i=\"".base64_encode($member)."\" />";
		}
		else
		{
			$xml = "<v oh=\"".base64_encode($this->IsOpeningHour() ? "1" : "0")."\" id=\"".base64_encode($this->Id)."\" desc=\"".base64_encode($this->DescriptionArray)."\" created=\"".base64_encode($this->Created)."\"  email=\"".base64_encode($this->Email)."\" pocjs=\"".base64_encode($this->PostJS)."\" prcjs=\"".base64_encode($this->PreJS)."\" mc=\"".base64_encode($this->MaxChats)."\" ps=\"".base64_encode($this->ChatPrioritySleep ? "1" : "0")."\" external=\"".base64_encode($this->IsExternal)."\"  internal=\"".base64_encode($this->IsInternal)."\" standard=\"".base64_encode($this->IsStandard)."\" teo=\"".base64_encode($this->TicketEmailOut)."\" ceo=\"".base64_encode($this->ChatEmailOut)."\" thue=\"".base64_encode($this->TicketHandleUnknownEmails)."\">\r\n";
			if(is_array($this->VisitorFilters))
				foreach($this->VisitorFilters as $filt => $ex)
					$xml .= "<vfilt ex=\"".base64_encode((is_array($ex))?serialize($ex):$ex)."\">".$filt."</vfilt>\r\n";
			
			if(is_array($this->ChatVouchersRequired))
				foreach($this->ChatVouchersRequired as $tid)
					$xml .= "<ctr id=\"".base64_encode($tid)."\" />\r\n";

            if(is_array($this->TicketEmailIn))
                foreach($this->TicketEmailIn as $teid)
                    $xml .= "<tei id=\"".base64_encode($teid)."\" />\r\n";
					
			if(is_array($this->PredefinedMessages))
				foreach($this->PredefinedMessages as $premes)
					$xml .= $premes->GetXML();

            if(is_array($this->Signatures))
                foreach($this->Signatures as $sig)
                    $xml .= $sig->GetXML();

			if(is_array($this->OpeningHours))
				foreach($this->OpeningHours as $hour)
					$xml .= "<oh open=\"".base64_encode($hour[1])."\" close=\"".base64_encode($hour[2])."\">".base64_encode($hour[0])."</oh>\r\n";
		}
		return $xml;
	}
	
	function Save()
	{
		if($this->IsDynamic)
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_GROUPS."` (`id`, `name`, `owner`,`dynamic`, `description`, `opening_hours`,`chat_inputs_hidden`,`ticket_inputs_hidden`,`chat_inputs_required`,`ticket_inputs_required`,`chat_inputs_masked`,`ticket_inputs_masked`,`visitor_filters`,`chat_vouchers_required`,`pre_chat_js`,`post_chat_js`,`ticket_email_in`,`ticket_assignment`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Descriptions["EN"])."','".DBManager::RealEscape($this->Owner)."',1,'','','','','','','','','','','','','','');");
		else
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_GROUPS."` (`id`, `dynamic`, `description`, `external`, `internal`, `created`, `email`, `opening_hours`, `functions`, `chat_inputs_hidden`, `ticket_inputs_hidden`, `max_chats`, `chat_inputs_required`, `ticket_inputs_required`, `visitor_filters`, `chat_vouchers_required`) VALUES ('".DBManager::RealEscape($this->Id)."',0, '".DBManager::RealEscape(serialize($this->Descriptions))."',1,".(($this->IsInternal) ? 1 : 0).",".$this->Created.",'".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape(serialize($this->OpeningHours))."','".DBManager::RealEscape($this->ChatFunctions)."','a:0:{}','a:0:{}',-1,'a:0:{}','a:0:{}','".DBManager::RealEscape(serialize($this->VisitorFilters))."','".DBManager::RealEscape(serialize($this->ChatVouchersRequired))."');");
	}
	
	function Destroy()
	{
		queryDB(false,"DELETE FROM `".DB_PREFIX.DATABASE_GROUPS."` WHERE `id` = '".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
	
	function RemoveMember($_id)
	{
        if(strpos($_id,"~")!==false)
        {
            $_id = explode("~",$_id);
            $_id = $_id[0];
        }
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `user_id` LIKE '%".DBManager::RealEscape($_id)."%' AND `group_id` = '".DBManager::RealEscape($this->Id)."';");
	}

	function AddMember($_id,$_persistant=false)
	{
		queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` (`user_id`, `group_id`, `persistent`) VALUES ('".DBManager::RealEscape($_id)."', '".DBManager::RealEscape($this->Id)."', ".(($_persistant) ? "1" : "0").");");
	}

    function GetWaitingLinks($_question,$_language, $html="")
    {
        global $LZLANG;
        $this->LoadAutoReplies();
        $answers = ChatAutoReply::GetMatches($this->AutoReplies, $_question, $_language, null, null);
        if(count($answers)>0)
        {
            foreach($answers as $qa)
            {
                if((!empty($qa->ResourceId) || !empty($qa->Answer)) && $qa->Waiting)
                {
                    $res = getResource($qa->ResourceId);
                    $target = ($qa->NewWindow) ? "target=\"_blank\" " : "";
                    $html .= "<li>";

                    if($res==null)
                        $html .= $qa->Answer;
                    else if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= "<b>" . $res["title"]. "</b><br>" . str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));

                    $html .= "</li>";
                }
            }
            if(!empty($html))
            {
                $html = "<div id=\"lz_chat_waiting_links\">" . $LZLANG["client_while_waiting"] . "<ul>" . $html . "</ul></div>";
                return $html;
            }
        }
        return "";
    }

    function GetDescription($_language="")
    {
        global $CONFIG;
        if(!empty($_language) && isset($this->Descriptions[strtoupper($_language)]))
            return base64_decode($this->Descriptions[strtoupper($_language)]);
        else if(isset($this->Descriptions[strtoupper($CONFIG["gl_default_language"])]))
           return base64_decode($this->Descriptions[strtoupper($CONFIG["gl_default_language"])]);
        else if(isset($this->Descriptions["EN"]))
            return base64_decode($this->Descriptions["EN"]);
        else if(is_array($this->Descriptions))
            return base64_decode(current($this->Descriptions));
        else
            return $this->Id;
    }

    function GetServerInput($_input,$_chat=true,$default="",&$changed=false)
    {
        $cap = (($_chat) ? isset($this->ChatInputsCapitalized[$_input->Index]) : isset($this->TicketInputsCapitalized[$_input->Index]));
        return $_input->GetServerInput($default,$changed,$cap);
    }

    function GetChatPriority($_operatorId)
    {
        if(!empty($this->ChatPriorities) && isset($this->ChatPriorities[$_operatorId]))
            return $this->ChatPriorities[$_operatorId];
        return 0;
    }

    function TextReplace($_text,$_language)
    {
        $_text = str_replace(array("%group_name%","%group_id%","%TARGETGROUP%"),$this->Id,$_text);
        $_text = str_replace(array("%group_description%","%group_title%"),$this->GetDescription($_language),$_text);
        return $_text;
    }

    static function RemoveNonPersistantMember($_id)
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `user_id`='".DBManager::RealEscape($_id)."' AND `persistent`=0;");
    }

    static function IsDynamicGroup()
    {
        global $GROUPS;
        foreach($GROUPS as $group)
            if($group->IsDynamic)
                return true;
        return false;
    }

    static function PersistentJoin($_userId,$_systemId,$joined=false)
    {
        global $GROUPS;
        if(UserGroup::IsDynamicGroup())
        {
            if(!empty($_GET[GET_EXTERN_DYNAMIC_GROUP]))
            {
                $tgroup = getOParam(GET_EXTERN_DYNAMIC_GROUP,"");
                if(isset($GROUPS[$tgroup]))
                {
                    $GROUPS[$tgroup]->AddMember($_systemId,true);
                    $GROUPS[$tgroup]->LoadMembers();
                    $joined = true;
                }
            }
            else
            {
                $gToJoin = array();
                $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `persistent`=1 AND `user_id` LIKE '%".DBManager::RealEscape($_userId)."%';");
                if($result)
                {
                    while($row = DBManager::FetchArray($result))
                        if($row["user_id"] != $_systemId)
                        {
                            if(!isset($gToJoin[$row["group_id"]]))
                                $gToJoin[$row["group_id"]] = true;
                        }
                        else
                        {
                            $gToJoin[$row["group_id"]] = false;
                            $joined = true;
                        }

                    foreach($gToJoin as $gid => $join)
                        if($join)
                        {
                            $GROUPS[$gid]->AddMember($_systemId,true);
                            $GROUPS[$gid]->LoadMembers();
                            $joined = true;
                        }
                }
            }
        }
        return $joined;
    }

    static function ReadParams()
    {
        if(!empty($_GET["eg"]))
            return getOParam("eg","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        if(!empty($_GET[GET_EXTERN_GROUP]))
            return getOParam(GET_EXTERN_GROUP,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        return "";
    }
}

class Operator extends BaseUser
{
	public $Level = 0;
	public $Webspace = 0;
	public $ClientSystemId;
    public $Token;
	public $Password;
	public $PasswordChangeRequest;
	public $Description;
	public $LCAFile;
	public $Profile;
	public $ServerSetup = false;
	public $Authenticated = false;
	public $VisitorFileSizes;
	public $VisitorStaticReload;
	public $ExternalChats;
    public $ExternalChatCount = -1;
	public $PermissionSet;
	public $Groups;
	public $GroupsArray;
	public $GroupsAway;
	public $GroupsHidden;
	public $PredefinedMessages = array();
    public $Signatures = array();
	public $InExternalGroup;
	public $ProfilePicture;
	public $ProfilePictureTime;
	public $WebcamPicture;
	public $WebcamPictureTime;
	public $LastChatAllocation;
    public $LastActiveDB;
	public $CanAutoAcceptChats;
	public $LoginIPRange = "";
	public $Reposts;
	public $WebsitesUsers;
	public $WebsitesConfig;
	public $SignOffRequest;
	public $IsBot = false;
	public $WelcomeManager = false;
	public $WelcomeManagerOfferHumanChatAfter = 0;
    public $Deactivated;
    public $ClientWeb = false;
    public $AppClient = false;
    public $AppDeviceId = "testid";
    public $AppBackgroundMode = true;
    public $AppOS = "";
    public $MobileExtends = array();
    public $FirstCall = true;
    public $PictureFile;
    public $ChatFile;

	function Operator()
   	{
        if(func_num_args() == 2)
        {
            $this->LastActive = 0;
            $this->SystemId = func_get_arg(0);
            $this->UserId = func_get_arg(1);
            $this->ExternalChats = array();
            $this->Type = 1;
            $this->VisitorFileSizes = array();
            $this->GroupsAway = array();
            $this->GroupsHidden = array();
            $this->VisitorStaticReload = array();
            $this->Reposts = array();
            $this->WebsitesUsers = array();
            $this->WebsitesConfig = array();

            if(defined("FILE_CHAT"))
            {
                $this->PictureFile = $this->GetOperatorPictureFile();
                $this->ChatFile = FILE_CHAT . "?intid=".base64UrlEncode($this->UserId)."&amp;mp=true";
            }
        }
   	}
	
	function SignOff($_init=true)
	{
        global $CONFIG;
        if($_init && ($this->LastActive < (time()-$CONFIG["timeout_clients"])))
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=0,`status`=2,`token`='' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
        else if($_init && $this->Status != USER_STATUS_OFFLINE)
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=1,`status`=2,`token`='' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
        else if(!$_init)
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=0 WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
    }
	
	function GetAutoReplies($_question,$_chat)
	{
		global $DEFAULT_BROWSER_LANGUAGE,$GROUPS;
		$_question = str_replace(array("!",",",".","?","=",")","(","-","_",":","#","~","�"),"",strtolower($_question));
        $this->LoadAutoReplies();
        $GROUPS[$_chat->DesiredChatGroup]->LoadAutoReplies();
        $merged = array_merge($this->AutoReplies,$GROUPS[$_chat->DesiredChatGroup]->AutoReplies);
        $answers = ChatAutoReply::GetMatches($merged, $_question, $DEFAULT_BROWSER_LANGUAGE, $_chat, $this);
        if($this->IsBot)
            return $this->FormatBotAutoReplies($_chat,$answers);
        else
            return $this->FormatHumanAutoReplies($answers, $_chat);
	}

    function FormatHumanAutoReplies($_answers,$_chat)
    {
        global $DEFAULT_BROWSER_LANGUAGE,$GROUPS;
        foreach($_answers as $qa)
            if($qa->Send || $qa->SendInactivityTimeInternal > -1 || $qa->SendInactivityTimeExternal > -1)
            {
                $html = "";
                if(!empty($qa->ResourceId))
                {
                    $res = getResource($qa->ResourceId);
                    $target = ($qa->NewWindow) ? "target=\"_blank\" " : "";

                    if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));
                }
                else
                    $html = $qa->Answer;

                $html = $GROUPS[$_chat->DesiredChatGroup]->TextReplace($html,$DEFAULT_BROWSER_LANGUAGE);
                $html = $_chat->TextReplace($html);
                $html = $this->TextReplace($html);
                $html = configTextReplace($html);
                return $html;
            }
        return null;
    }

    function FormatBotAutoReplies($_chat,$_answers,$_alternate=true,$html="",$single="")
    {
        global $LZLANG,$GROUPS,$CONFIG,$DEFAULT_BROWSER_LANGUAGE;
        $tth = ".";
        $bind = " " . $LZLANG["client_or"] . " ";

        if(!empty($GROUPS[$_chat->DesiredChatGroup]) && $GROUPS[$_chat->DesiredChatGroup]->IsHumanAvailable())
        {
            $resultpc = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($_chat->ChatId)."' AND `repost`=0 AND `receiver`='".DBManager::RealEscape($this->SystemId)."';");
            if($this->WelcomeManager && DBManager::GetRowCount($resultpc) >= $this->WelcomeManagerOfferHumanChatAfter)
            {
                $tth = " " . $LZLANG["client_or"] . " <a class=\"lz_chat_human\" onclick=\"var _this = this;lz_chat_set_talk_to_human(true,true);this.className='';this.style.cursor='wait';setTimeout(function(){_this.style.cursor='default'; },3000);\">".$LZLANG["client_talk_to_human"]."</a>.";
                $bind = ", ";
            }
        }

        $lm = (empty($CONFIG["gl_dtfbc"])) ? ($bind . " <a class=\"lz_chat_mail\" onclick=\"lz_chat_require_leave_message();\">" . $LZLANG["client_leave_a_message"]. "</a>") : "";
        if(count($_answers)==0)
        {
            return $LZLANG["client_bot_no_result_found"] . $lm . $tth;
        }
        else if(count($_answers)>0)
        {
            $html .= $LZLANG["client_your_result"] . "<br>";
            $html .= "<ul class=\"lz_chat_bot_resource\">";
            foreach($_answers as $qa)
            {
                if(!empty($qa->ResourceId))
                {
                    $res = getResource($qa->ResourceId);
                    $target = ($qa->NewWindow) ? "target=\"_blank\" " : "";
                    $html .= "<li>";
                    if($res["type"] == 2)
                        $html .= "<a class=\"lz_chat_link\" href=\"". $res["value"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else if($res["type"] == 3 || $res["type"] == 4)
                        $html .= "<a class=\"lz_chat_link\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $res["id"]. "\" ".$target.">" . $res["title"]. "</a>";
                    else
                        $html .= "<b>" . $res["title"]. "</b><br><br>" . str_replace("<a ", "<a ".$target,str_replace("<A","<a",$res["value"]));
                    $html .= "</li>";


                }
                else if(!empty($qa->Answer))
                {
                    $single = $qa->Answer . "<br><br>";
                    break;
                }
            }
            $html .= "</ul>";
        }

        if(!empty($single))
            $html = $single;

        $html = $GROUPS[$_chat->DesiredChatGroup]->TextReplace($html,$DEFAULT_BROWSER_LANGUAGE);
        $html = $_chat->TextReplace($html);
        $html = $this->TextReplace($html);
        $html = configTextReplace($html);
        return $html . (($_alternate) ? ($LZLANG["client_bot_result_found"] . $lm . $tth) : "");
    }
	
	function Save($_create=false)
	{
		if($_create)
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_OPERATORS."` (`id`, `system_id`, `fullname`, `email`, `permissions`,`webspace`,`password`, `status`, `level`, `ip`, `typing`, `visitor_file_sizes`, `groups_status`, `reposts`, `groups`, `languages`, `groups_hidden`, `websites_users`, `websites_config`, `mobile_ex`) VALUES ('".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->SystemId)."','".DBManager::RealEscape($this->Fullname)."','".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape($this->PermissionSet)."','".DBManager::RealEscape($this->Webspace)."','".DBManager::RealEscape($this->Password)."', '".DBManager::RealEscape($this->Status)."', '".DBManager::RealEscape($this->Level)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($this->Typing)."', '".DBManager::RealEscape(serialize($this->VisitorFileSizes))."', '".DBManager::RealEscape(serialize($this->GroupsAway))."','".DBManager::RealEscape(serialize($this->Reposts))."','".DBManager::RealEscape(base64_encode(serialize($this->Groups)))."','".DBManager::RealEscape($this->Language)."','YTowOnt9','YTowOnt9','YTowOnt9','a:0:{}');");
		else
		{
			$ca = (count($this->ExternalChats)==0) ? ",`last_chat_allocation`=0" : "";
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `first_active`='".DBManager::RealEscape($this->FirstActive)."',`visitor_file_sizes`='".DBManager::RealEscape(serialize($this->VisitorFileSizes))."',`groups_status`='".DBManager::RealEscape(serialize($this->GroupsAway))."',`reposts`='".DBManager::RealEscape(serialize($this->Reposts))."',`typing`='".DBManager::RealEscape($this->Typing)."',`level`='".DBManager::RealEscape($this->Level)."',`status`='".DBManager::RealEscape($this->Status)."',`ip`='".DBManager::RealEscape($this->IP)."',`lweb`='".DBManager::RealEscape($this->ClientWeb?1:0)."',`lapp`='".DBManager::RealEscape($this->AppClient?1:0)."',`last_active`='".DBManager::RealEscape(time())."'".$ca." WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
	    }
	}

    function Delete()
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
    }

    function SetDynamicValues($_row)
    {
        global $CONFIG;
        $this->AppClient = !empty($_row["lapp"]);
        $this->AppBackgroundMode = !empty($_row["mobile_background"]);
        $this->AppDeviceId = @$_row["mobile_device_id"];
        $this->AppOS = @$_row["mobile_os"];
        $this->ClientWeb = !empty($_row["lweb"]);
        $this->ClientSystemId = @$_row["client_system_id"];
        $this->Token = @$_row["token"];
        $this->LastActiveDB =
        $this->LastActive = $_row["last_active"];
        $this->Deactivated = ($_row["sign_off"]==2);
        $this->SignOffRequest = !empty($_row["sign_off"]);
        if(!empty($_row["mobile_ex"]))
            $this->MobileExtends = @unserialize($_row["mobile_ex"]);
        $this->Typing = $_row["typing"];
        $this->VisitorFileSizes = @unserialize($_row["visitor_file_sizes"]);
        $this->FirstActive = ($_row["first_active"]<(time()-$CONFIG["timeout_clients"]))?time():$_row["first_active"];
        $this->LastChatAllocation = $_row["last_chat_allocation"];
        $this->Status = $_row["status"];
        if($_row["status"] != USER_STATUS_OFFLINE)
            if(!empty($_row["mobile_device_id"]) && !empty($_row["mobile_os"]) && $_row["last_active"]>(time()-(30*86400)) && getAvailability())
                $this->LastActive = time();
            else if($_row["last_active"]<(time()-$CONFIG["timeout_clients"]) && !$this->IsBot)
                $this->Status = USER_STATUS_OFFLINE;

        $this->Reposts = @unserialize(@$_row["reposts"]);
        $this->PasswordChangeRequest = !empty($_row["password_change_request"]);
    }

    function SetValues($_row)
    {
        global $CONFIG;
        $this->Email = $_row["email"];
        $this->Webspace = $_row["webspace"];
        $this->Level = $_row["level"];
        $this->Description = $_row["description"];
        $this->Fullname = $_row["fullname"];
        $this->Language = $_row["languages"];
        $this->Groups = @unserialize(base64_decode($_row["groups"]));

        if(isset($_row["max_chats"]))
        {
            if($_row["max_chats"] < 1)
                $this->MaxChatAmount = 9999;
            else if($_row["max_chats"] > 30)
            {
                $this->MaxChatsStatus = USER_STATUS_AWAY;
                $this->MaxChatAmount = $_row["max_chats"]-30;
            }
            else
                $this->MaxChatAmount = $_row["max_chats"];
            $this->MaxChats = $_row["max_chats"];
        }

        if(!empty($this->Groups))
            array_walk($this->Groups,"b64dcode");
        $this->GroupsHidden = @unserialize(base64_decode($_row["groups_hidden"]));
        if(!empty($this->GroupsHidden))
            array_walk($this->GroupsHidden,"b64dcode");

        $this->GroupsArray = $_row["groups"];
        $this->PermissionSet = $_row["permissions"];
        $this->CanAutoAcceptChats = (isset($_row["auto_accept_chats"])) ? $_row["auto_accept_chats"] : 1;
        $this->LoginIPRange = $_row["login_ip_range"];
        $this->IsBot = !empty($_row["bot"]);
        $this->FirstCall = ($_row["first_active"]<(time()-$CONFIG["timeout_clients"]));
        $this->Password = $_row["password"];

        $this->SetDynamicValues($_row);

        $this->Level = $_row["level"];
        $this->IP = $_row["ip"];

        if(!empty($_row["groups_status"]))
            $this->GroupsAway = @unserialize($_row["groups_status"]);

        $this->WebsitesUsers = @unserialize(base64_decode(@$_row["websites_users"]));
        if(!empty($this->WebsitesUsers))
            array_walk($this->WebsitesUsers,"b64dcode");
        $this->WebsitesConfig = @unserialize(base64_decode(@$_row["websites_config"]));
        if(!empty($this->WebsitesConfig))
            array_walk($this->WebsitesConfig,"b64dcode");

        if($this->IsBot)
        {
            $this->FirstCall =
            $this->FirstActive =
            $this->LastActive = time();
            $this->Status = USER_STATUS_ONLINE;
            $this->WelcomeManager = !empty($_row["wm"]);
            $this->WelcomeManagerOfferHumanChatAfter = $_row["wmohca"];
        }
    }
	
	function Load()
	{
		$this->LoadPredefinedMessages();
        $this->LoadSignatures();
	}

    function LoadUnCacheables()
    {
        if(is("DB_CONNECTION"))
        {
            $result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_OPERATORS."` WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."';");
            if($result && $row = DBManager::FetchArray($result))
                $this->SetDynamicValues($row);
        }
    }
	
	function SetLastChatAllocation()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `last_chat_allocation`='".DBManager::RealEscape(time())."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
	}
	
	function SetRepostTime($_systemId,$_time)
	{
		if(empty($this->Reposts[$_systemId]))
			$this->Reposts[$_systemId] = 0;
		$this->Reposts[$_systemId] = max($this->Reposts[$_systemId],$_time);
	}

	function GetExternalObjects()
	{
		global $CONFIG;
		$result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t2`.`status`<9 AND `t2`.`user_id`='".DBManager::RealEscape($this->SystemId)."';");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				$chat = new VisitorChat($row);
				if($chat->LastActive<(time()-$CONFIG["timeout_chats"]) && !($chat->InternalUser != null && $chat->InternalUser->IsBot))
					$chat->ExternalClose();
				else
					$this->ExternalChats[$chat->SystemId] = $chat;
			}
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FILES."` ORDER BY `created` ASC;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				$request = new FileUploadRequest($row);
				$rsid = $request->SenderUserId . "~" . $request->SenderBrowserId;
				if(isset($this->ExternalChats[$rsid]))
				{
					$this->ExternalChats[$rsid]->FileUploadRequest[] = $request;
				}
			}
	}

    function IsInGroup($_groupId)
    {
        return in_array($_groupId,$this->Groups);
    }

    function HasAccessToTicket($_ticket)
    {
        return ($this->GetPermission(PERMISSION_MESSAGES) != PERMISSION_NONE && ($this->IsInGroup($_ticket->Group) || $this->GetPermission(PERMISSION_MESSAGES) == PERMISSION_FULL));
    }

    function HasAccessToEmail($_group)
    {
        return ($this->GetPermission(22) != PERMISSION_NONE && ($this->IsInGroup($_group) || $this->GetPermission(22) == PERMISSION_FULL));
    }

    function IsInPushMessageState()
    {
        return (!empty($this->AppDeviceId) && $this->AppBackgroundMode);
    }
	
	function IsInGroupWith($_comparer)
	{
        if(!isset($_comparer->Groups))
            return in_array($_comparer->SystemId,$this->Groups);
		foreach($this->Groups as $gid)
			if(in_array($gid,$_comparer->Groups))
				return true;
		return false;
	}

    function IsAvailableForChat()
    {
        global $CONFIG;
        return $this->Status < USER_STATUS_OFFLINE && ($this->LastActive > (time()-$CONFIG["timeout_clients"]));
    }

    function PrioritySleep($_groupId)
    {
        global $GROUPS,$INTERNAL;

        if($this->IsBot)
            return false;

        if(isset($GROUPS[$_groupId]) && $GROUPS[$_groupId]->ChatPrioritySleep)
        {
            $myPrio = (isset($GROUPS[$_groupId]->ChatPriorities[$this->SystemId])) ? $GROUPS[$_groupId]->ChatPriorities[$this->SystemId] : 0;
            foreach($GROUPS[$_groupId]->ChatPriorities as $systemId => $prio)
            {
                if($systemId == $this->SystemId || $INTERNAL[$systemId]->IsBot)
                    continue;
                if($prio > $myPrio && $INTERNAL[$systemId]->IsAvailableForChat() && $INTERNAL[$systemId]->GetMaxChatAmountStatus($GROUPS[$_groupId]) != USER_STATUS_AWAY)
                    return true;
            }
        }
        return false;
    }

    function MobileSleep($externalChat=null)
    {
        global $INTERNAL,$CONFIG;

        if($this->IsBot)
            return false;

        if(!empty($this->MobileExtends))
        {
            foreach($this->MobileExtends as $sid)
                if(isset($INTERNAL[$sid]) && $INTERNAL[$sid]->LastActive > (time()-$CONFIG["timeout_clients"]) && $INTERNAL[$sid]->Status != USER_STATUS_OFFLINE)
                {
                    if($externalChat != null)
                    {
                        $externalChat->LoadForward();
                        if( $externalChat->Forward != null && $externalChat->Forward->TargetSessId == $this->SystemId)
                            return false;
                    }
                    return true;
                }
        }
        return false;
    }

    function GetMaxChatAmountStatus($_group=null)
    {
        if($this->IsMaxChatAmount() && $this->GetExternalChatAmount() >= $this->MaxChatAmount)
        {
            return $this->MaxChatsStatus;
        }
        else if($_group != null && $_group->IsMaxChatAmount() && $this->GetExternalChatAmount() >= $_group->MaxChatAmount)
        {
            return $_group->MaxChatsStatus;
        }
        return $this->Status;
    }
	
	function IsExternal($_groupList, $_exclude=null, $_include=null, $_ignoreExternal=false, $_ignoreOpeningHours=false)
	{
		global $GROUPS;

        if($this->IsBot)
            $_ignoreOpeningHours = true;

		initData(array("GROUPS"));
            if(!empty($this->Groups))
                foreach($this->Groups as $groupid)
                    if(isset($GROUPS[$groupid]) && !$GROUPS[$groupid]->IsDynamic)
                        if(((($GROUPS[$groupid]->IsOpeningHour()||$_ignoreOpeningHours) && !in_array($groupid,$this->GroupsAway) && $this->GetMaxChatAmountStatus($GROUPS[$groupid]) != USER_STATUS_AWAY)))
                        {
                            $group_incl = !empty($_include) && in_array($groupid,$_include);
                            $group_excl = (!empty($_exclude) && in_array($groupid,$_exclude)) || (!$group_incl && empty($_exclude) && !empty($_include));
                            if(!empty($_groupList[$groupid]) && ($_groupList[$groupid]->IsExternal || $_ignoreExternal) && ($group_incl || !$group_excl))
                            {
                                $this->InExternalGroup = true;
                                if($this->MobileSleep())
                                    return false;

                                return true;
                            }
                        }
		return $this->InExternalGroup=false;
	}
	
	function GetGroupList($_excludeAwayGroups=false)
	{
		if(!$_excludeAwayGroups)
			return $this->Groups;
		else
		{
			$groupl = array();
			foreach($this->Groups as $groupid)
				if(!in_array($groupid,$this->GroupsAway))
					$groupl[] = $groupid;
			return $groupl;
		}
	}

    function GetChatPriority($_groupObj)
    {
        if($this->IsInGroup($_groupObj->Id))
            return $_groupObj->GetChatPriority($this->SystemId);
        return 0;
    }
	
	function GetExternalChatAmount()
	{
        if($this->ExternalChatCount > -1)
            return $this->ExternalChatCount;
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t1`.`internal_declined`=0 AND `t2`.`status`<9 AND `t2`.`user_id`='".DBManager::RealEscape($this->SystemId)."';");
		if($result)
			return $this->ExternalChatCount = DBManager::GetRowCount($result);
		return $this->ExternalChatCount = 0;
	}
	
	function LoadPredefinedMessages()
	{
		if(DB_CONNECTION)
		{
			$this->PredefinedMessages = array();
			$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PREDEFINED."` WHERE `internal_id`='".DBManager::RealEscape($this->SystemId)."'");
			if($result)
				while($row = DBManager::FetchArray($result))
					$this->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row);
		}
	}

    function LoadSignatures()
    {
        if(DB_CONNECTION)
        {
            $this->Signatures = array();
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_SIGNATURES."` WHERE `operator_id`='".DBManager::RealEscape($this->SystemId)."'");
            if($result)
                while($row = DBManager::FetchArray($result))
                    $this->Signatures[strtolower($row["id"])] = new Signature($row);
        }
    }
	
	function IsVisitorFiltered($_visitor, $urlmatch=false)
	{
		global $GROUPS, $CONFIG;
        $filtered = empty($CONFIG["gl_vmac"]) && !$_visitor->IsInChat(true);
        if(!$filtered && !empty($CONFIG["gl_hide_inactive"]))
            $filtered = !$_visitor->IsActivity(null,true);

		foreach($this->Groups as $groupid)
		{
			if(empty($GROUPS[$groupid]->VisitorFilters))
				return $filtered;
			foreach($GROUPS[$groupid]->VisitorFilters as $value => $filter)
			{
				foreach($_visitor->Browsers as $BROWSER)
				{
					if(count($BROWSER->History)==0)
						$BROWSER->LoadHistory();
						
					for($i = 0;$i < count($BROWSER->History);$i++)
					{
						if(strpos(strtolower($BROWSER->History[$i]->Url->GetAbsoluteUrl()),strtolower(base64_decode($value))) !== false)
						{
							$urlmatch = true;
							if($filter=="Blacklist")
							{
								return true;
							}
						}
					}
				}
				if($filter=="Whitelist" && !$urlmatch)
				{
					return true;
				}
			}
		}
		return $filtered;
	}
	
	function ValidateLoginAttempt($_clear=false)
	{
		if(DB_CONNECTION)
		{
			if(!empty($this->LoginIPRange))
			{
				$match = false;
				$ranges = explode(",",$this->LoginIPRange);
				foreach($ranges as $range)
					if(getIP(true) == trim($range) || ipIsInRange(getIP(true),trim($range)))
						$match = true;
				if(!$match)
					return false;
			}
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
            {
                $result = queryDB(true,"SELECT `id`,`password` FROM `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` WHERE `ip`='".DBManager::RealEscape(getIP(true))."' AND `user_id`='".DBManager::RealEscape($this->UserId)."' AND `time` > '".DBManager::RealEscape(time()-86400)."';");
                if(DBManager::GetRowCount($result) >= MAX_LOGIN_ATTEMPTS)
                {
                    if(!$_clear)
                    {
                        $this->DeleteLoginAttempts();
                        return $this->ValidateLoginAttempt(true);
                    }
                    return false;
                }
            }
		}
		return true;
	}

    function ValidateUpdateSession($_token,$_clientSystemId)
    {
        $this->Token = $_token;
        $this->ClientSystemId = $_clientSystemId;
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `client_system_id`='".DBManager::RealEscape($this->ClientSystemId)."',`token`='".DBManager::RealEscape($this->Token)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
    }

    function ValidateLoginAuthentication()
    {
        if(!empty($this->Password))
        {
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
            {
                if(!empty($this->Password))
                {

                    if($this->Password == md5($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
                    {
                        // v1 login < 5.4.x.; deprecated
                        define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }

                    if(sha1($this->Password) == $_POST[POST_INTERN_AUTHENTICATION_PASSWORD])
                    {
                        // v1.1 mobile login < 5.4.x.; deprecated
                        define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }

                    if($this->Password == $_POST[POST_INTERN_AUTHENTICATION_PASSWORD])
                    {
                        // v2 api login >= 5.4.x.;
                        // define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }

                    if(hash("sha256",$this->Password) == $_POST[POST_INTERN_AUTHENTICATION_PASSWORD])
                    {
                        // v2 login >= 5.4.x.;
                        define("VALIDATED_FULL_LOGIN",true);
                        return true;
                    }
                }
            }
            if(!empty($this->Token) && !empty($_POST[POST_INTERN_AUTHENTICATION_TOKEN]))
            {
                if(hash("sha256",$this->Token) == $_POST[POST_INTERN_AUTHENTICATION_TOKEN])
                {
                    define("VALIDATED_TOKEN",true);
                    return true;
                }
            }
        }
        return false;
    }

    function SaveLoginAttempt($_password)
    {
        if(is("DB_CONNECTION"))
            queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` (`id` ,`user_id` ,`ip` ,`time` ,`password`) VALUES ('".DBManager::RealEscape(getId(32))."', '".DBManager::RealEscape($this->UserId)."', '".DBManager::RealEscape(getIP(true))."', '".DBManager::RealEscape(time())."', '".DBManager::RealEscape($_password)."');");
    }
	
	function DeleteLoginAttempts()
	{
		if(is("DB_CONNECTION"))
			queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` WHERE `time`<".(time()-86400)." AND `ip`='".DBManager::RealEscape(getIP(true))."' AND `user_id`='".DBManager::RealEscape($this->UserId)."';");
	}
	
	function ChangePassword($_password)
	{
		if(isValidated() && is("VALIDATED_FULL_LOGIN"))
		{
            administrationLog("ChangePassword",$_password,CALLER_SYSTEM_ID);
            $this->PasswordChangeRequest = false;
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `password_change_request`=0,`password`='".DBManager::RealEscape($_password)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
        }
	}
	
	function SetPasswordChangeNeeded()
	{
        if(isValidated() && is("VALIDATED_FULL_LOGIN"))
		{
			$this->PasswordChangeRequest = true;
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `password_change_request`=1 WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
		}
	}
	
	function GetPermission($_type,$_fallBack=PERMISSION_NONE)
	{
        if(strlen($this->PermissionSet)>$_type)
		    return substr($this->PermissionSet,$_type,1);
        return $_fallBack;
	}
	
	function GetOperatorPictureFile()
	{
		global $CONFIG;
		$url = "picture.php?intid=".base64UrlEncode($this->UserId);
		if(empty($CONFIG["gl_root"]))
			$url .= "&ws=" . base64UrlEncode($CONFIG["gl_host"]);
		return $url;
	}

	function GetLoginReply($_extern,$_time,$_oocount=0)
	{
		global $INTERNAL;
		foreach($INTERNAL as $internaluser)
			if($internaluser->Status != USER_STATUS_OFFLINE && $internaluser->SystemId != CALLER_SYSTEM_ID)
				$_oocount++;
		return "<login>\r\n<login_return t=\"".base64_encode($this->Token)."\" oo=\"".base64_encode($_oocount)."\" group=\"".base64_encode($this->GroupsArray)."\" name=\"".base64_encode($this->Fullname)."\" loginid=\"".base64_encode($this->ClientSystemId)."\" level=\"".base64_encode($this->Level)."\" sess=\"".base64_encode($this->SystemId)."\" extern=\"".base64_encode($_extern)."\" timediff=\"".base64_encode($_time)."\" time=\"".base64_encode(time())."\" perms=\"".base64_encode($this->PermissionSet)."\" sm=\"".base64_encode(SAFE_MODE)."\" phpv=\"".base64_encode(@phpversion())."\" sip=\"".base64_encode(@$_SERVER["SERVER_ADDR"])."\" uip=\"".base64_encode(@$_SERVER["REMOTE_ADDR"])."\" /></login>";
	}

    function SaveMobileParameters()
    {
        if(!SERVERSETUP)
        {
            $cos = (!empty($_POST["p_app_os"])) ? $_POST["p_app_os"] : "";
            $cbg = (!empty($_POST["p_app_background"])) ? 1 : 0;
            $cdi = (!empty($_POST["p_app_device_id"])) ? $_POST["p_app_device_id"] : "";
            if($this->AppDeviceId != $cdi || empty($this->AppBackgroundMode)!=empty($cbg) || $this->AppOS!=$cos)
            {
                if(empty($this->AppBackgroundMode)!=empty($cbg) && empty($cbg))
                    queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` WHERE `device_hash`='".DBManager::RealEscape(md5($this->AppDeviceId))."'; ");

                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `mobile_os`='".DBManager::RealEscape($cos)."',`mobile_device_id`='".DBManager::RealEscape($cdi)."',`mobile_background`='".DBManager::RealEscape($cbg)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
            }
        }
    }

    function AddPushMessage($_chatId, $_chatPartnerId, $_chatPartnerName, $_pushKey, $_pushValue="")
    {
        global $CONFIG;
        if(!empty($CONFIG["gl_mpm"]) && ($this->LastActiveDB<(time()-$CONFIG["poll_frequency_clients"]*3)) && $this->Status != 2)
        {
            if(!defined("IS_PUSH_MESSAGE"))
                define("IS_PUSH_MESSAGE",true);
            $text = ($_pushKey == 0) ? ($_chatPartnerName . " wants to chat with you.") : ($_chatPartnerName . ": " . $_pushValue);
            $text = cutString($text,90,true);
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` WHERE `sent`=1 AND `created` < " . DBManager::RealEscape(time()-300));
            queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` (`id`, `created`, `device_id`, `device_hash`, `device_os`, `chat_id`, `chat_partner_id`, `push_key`, `push_value`, `IP`) VALUES ('".DBManager::RealEscape(getId(32))."', ".time().", '".DBManager::RealEscape($this->AppDeviceId)."', '".DBManager::RealEscape(md5($this->AppDeviceId))."',  '".DBManager::RealEscape($this->AppOS)."', '".DBManager::RealEscape($_chatId)."', '".DBManager::RealEscape($_chatPartnerId)."', '".DBManager::RealEscape($_pushKey)."', '".DBManager::RealEscape($text)."', '".DBManager::RealEscape(getIP())."');");
        }
    }

    function GetInputMaskLevel($_inputIndex,$_chat=true)
    {
        global $GROUPS;
        $lvl = 100;
        foreach($this->Groups as $groupid)
            if(isset($GROUPS[$groupid]))
            {
                if($_chat)
                    $lvl = (isset($GROUPS[$groupid]->ChatInputsMasked[$_inputIndex])) ? min($lvl,$GROUPS[$groupid]->ChatInputsMasked[$_inputIndex]) : 0;
                else
                    $lvl = (isset($GROUPS[$groupid]->TicketInputsMasked[$_inputIndex])) ? min($lvl,$GROUPS[$groupid]->TicketInputsMasked[$_inputIndex]) : 0;
            }
        return ($lvl==100) ? 0 : $lvl;
    }

    function TextReplace($_text)
    {
        $_text = str_replace(array("%operator_name%","%name%"),$this->Fullname,$_text);
        $_text = str_replace(array("%id%","%operator_id%"),$this->UserId,$_text);
        $_text = str_replace(array("%operator_email%"),$this->Email,$_text);
        return $_text;
    }

    function AffectsStatistic($_allowBot=false)
    {
        return (($_allowBot || !$this->IsBot) /*&& $this->GetPermission(46) == PERMISSION_NONE*/);
    }

    static function GetSystemId($_userId)
    {
        global $INTERNAL;
        foreach($INTERNAL as $sysId => $intern)
            if($intern->UserId == $_userId)
                return $sysId;
        return null;
    }

    static function GetUserId($_systemId)
    {
        global $INTERNAL;
        foreach($INTERNAL as $sysId => $intern)
            if($sysId == $_systemId)
                return $intern->UserId;
        return null;
    }

    static function IPValidate()
    {
        global $INTERNAL;
        foreach($INTERNAL as $op)
            if(getIP() == $op->IP && !empty($op->IP))
                return true;
        return false;
    }

    static function PrepareConnection()
    {
        global $RESPONSE;
        if(!empty($_GET["iau"]))
        {
            $_POST[POST_INTERN_AUTHENTICATION_USER] = base64_decode($_GET["iau"]);
            $_POST[POST_INTERN_AUTHENTICATION_TOKEN] = base64_decode($_GET["iat"]);
            $_POST[POST_INTERN_FILE_TYPE] = base64_decode($_GET["ift"]);
            $_POST[POST_INTERN_REQUEST] = base64_decode($_GET["r"]);
            $_POST[POST_INTERN_SERVER_ACTION] = base64_decode($_GET["isa"]);
            $_POST[POST_INTERN_AUTHENTICATION_CLIENT_SYSTEM_ID] = base64_decode($_GET["li"]);
        }

        if(isset($_POST[POST_INTERN_REQUEST]) && $_POST[POST_INTERN_REQUEST]==CALLER_TYPE_INTERNAL)
        {
            $RESPONSE = new Response();
            if(!isset($_POST[POST_INTERN_ADMINISTRATE]))
            {
                header("Content-Type: text/xml; charset=UTF-8");
                if(getIdle())
                {
                    $RESPONSE->SetValidationError(LOGIN_REPLY_IDLE);
                    exit($RESPONSE->GetXML());
                }
                if(!getAvailability() && $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN && !isset($_POST[POST_INTERN_ACCESSTEST]))
                {
                    $RESPONSE->SetValidationError(LOGIN_REPLY_DEACTIVATED);
                    exit($RESPONSE->GetXML());
                }
            }
        }
    }

    static function ReadParams()
    {
        if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]))
            return getOParam(POST_EXTERN_REQUESTED_INTERNID,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        else if(!empty($_GET[GET_EXTERN_INTERN_USER_ID]))
            return getOParam(GET_EXTERN_INTERN_USER_ID,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        return "";
    }
}

class Visitor extends BaseUser
{
	public $Browsers;
    public $ChatRequests = null;
	public $Response;
	public $IsChat = false;
	public $ActiveChatRequest;
	public $SystemInfo;
	public $Resolution;
	public $Host;
	public $Email;
	public $Company;
	public $Visits = 1;
	public $VisitsDay = 1;
	public $VisitId;
	public $VisitLast;
	public $GeoCity;
	public $GeoCountryName;
	public $GeoCountryISO2;
	public $GeoRegion;
	public $GeoLongitude= -522;
	public $GeoLatitude= -522;
	public $GeoTimezoneOffset = "+00:00";
	public $GeoISP;
	public $GeoResultId = 0;
	public $StaticInformation = false;
	public $ExitTime;
	public $Browser;
	public $OperatingSystem;
	public $Javascript;
	public $Signature;
	public $SignatureMismatch;
	public $IsCrawler;
	public $ExtendSession = false;
	public $HasAcceptedChatRequest;
	public $HasDeclinedChatRequest;
	public $Comments = null;
    public $RecentVisits = null;
    public $FirstCall = true;

	function Visitor()
   	{
		$this->VisitId = getId(7);
		$this->Browsers = array();
		$this->UserId = func_get_arg(0);
		$this->FirstActive = time();
		$this->VisitLast = time();
   	}

    function GetRecentXML($_full=false,$xml="")
    {
        if($_full)
        {
            $xml = "<rv f=\"".base64_encode(1)."\" v=\"".base64_encode($this->UserId)."\" vi=\"".base64_encode($this->VisitId)."\">\r\n";
            foreach($this->Browsers as $browser)
                $xml .= $browser->GetXML("",null,true);
            return $xml . "</rv>";
        }
        else
        {
            foreach($this->RecentVisits as $entrance => $visit_id)
                $xml .= " <rv f=\"".base64_encode(0)."\" id=\"".base64_encode($visit_id)."\" e=\"".base64_encode($entrance)."\" />\r\n";
            $this->RecentVisits = array();
            return $xml;
        }
    }

    function LoadRecentVisits($_full=false,$_visitId="")
    {
        if(!is_array($this->RecentVisits))
        {
            $this->RecentVisits = array();
            if(!$_full)
            {
                $result = queryDB(true,"SELECT `entrance`,`visit_id` FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `visit_id`!='".DBManager::RealEscape($this->VisitId)."' AND `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC;");
                while($row = DBManager::FetchArray($result))
                    $this->RecentVisits[$row["entrance"]] = $row["visit_id"];
            }
            else
            {
                $this->VisitId = $_visitId;
                $this->LoadBrowsers(true);
            }
        }
    }
	
	function Load()
	{
		if(func_num_args() == 1)
		{
			$this->SetDetails(func_get_arg(0),false);
		}
		else
		{
			$result = queryDB(true,"SELECT *,(SELECT count(*) FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."') as `dcount` FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC;");
			if(DBManager::GetRowCount($result) >= 1)
				$this->SetDetails(DBManager::FetchArray($result),true);
		}
	}
	
	function SetDetails($_data,$_self)
	{
		global $CONFIG;
		$this->FirstCall = ($_data["last_active"] < (time()-((!empty($_data["js"])) ? $CONFIG["timeout_track"] : 7200)) && !$this->ExtendSession);
		$this->VisitId = $_data["visit_id"];
		
		if($_self && $this->FirstCall)
		{
			$this->Visits = $_data["visits"]+1;
			$this->VisitId = $_data["visit_id"]=getId(7);
			$this->VisitsDay = $_data["dcount"]+1;
			$this->FirstActive = time();
		}
		else
		{
			$this->Visits =	$_data["visits"];
			$this->VisitsDay = $_data["dcount"];
			$this->FirstActive = $_data["entrance"];
		}
		$this->VisitLast = $_data["visit_last"];
		$this->ExitTime = $_data["last_active"];
		$this->IP = $_data["ip"];
		$this->SystemInfo = $_data["system"];
		$this->Language = $_data["language"];
		$this->Resolution = $_data["resolution"];
		$this->Host = $_data["host"];
		$this->GeoTimezoneOffset = $_data["timezone"];
		
		if(!empty($_data["longitude"]))
		{
			$this->GeoLongitude = $_data["longitude"];
			$this->GeoLatitude = $_data["latitude"];
		}
		if(!empty($_data["city"]))
			$this->GeoCity = $_data["city"];
		
		$this->GeoCountryISO2 = $_data["country"];
		if(isset($_data["countryname"]))
			$this->GeoCountryName = $_data["countryname"];
		$this->GeoRegion = $_data["region"];

		$this->GeoResultId = $_data["geo_result"];
		$this->GeoISP = $_data["isp"];

		$this->Browser = $_data["browser"];
		$this->OperatingSystem = $_data["system"];
		$this->Javascript = $_data["js"];
	}
	
	function LoadBrowsers($_expired=false)
	{
		global $CONFIG;
		$this->Browsers = array();
        $limiter = (!$_expired) ? " AND `last_active` > ".(time()-$CONFIG["timeout_track"])." " : "";
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `visit_id`='".DBManager::RealEscape($this->VisitId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."'".$limiter."ORDER BY `created` ASC;"))
        {
            $this->FullyLoaded = true;
            while($row = DBManager::FetchArray($result))
            {
                $browser = $this->CreateBrowser($row,$_expired);
                $this->Browsers[count($this->Browsers)] = $browser;
            }
		}
	}

    function CreateBrowser($_row,$_loadHistory=false)
    {
        global $CONFIG;
        if(empty($_row["is_chat"]))
        {
            $browser = new VisitorBrowser($_row["id"],$_row["visitor_id"],$_loadHistory);
            $browser->Query = (!empty($_row["query"])) ? getIdValue(DATABASE_VISITOR_DATA_QUERIES,"query",$_row["query"]) : "";
            $browser->Email = $_row["email"];
            $browser->Fullname = $_row["fullname"];
            $browser->Company = $_row["company"];
            $browser->Customs = @unserialize($_row["customs"]);
            $browser->LastUpdate = $_row["last_update"];
        }
        else
        {
            $browser = new VisitorChat($_row["visitor_id"],$_row["id"]);
            $browser->Load();
            if($browser->LastActive<(time()-$CONFIG["timeout_chats"]) && !empty($browser->InternalUser) && !$browser->InternalUser->IsBot)
            {
                $browser->CloseChat();
                $browser->CloseWindow();
            }
        }
        $browser->Overlay = !empty($_row["overlay"]);
        $browser->OverlayContainer = !empty($_row["overlay_container"]);
        $browser->LastActive = $_row["last_active"];
        return $browser;
    }

    function LoadComments()
    {
        $this->Comments = array();
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_COMMENTS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` ASC;"))
            while($row = DBManager::FetchArray($result))
                $this->Comments[$row["id"]] = array("created"=>$row["created"],"operator_id"=>$row["operator_id"],"comment"=>$row["comment"]);
    }

    function SaveComment($_operatorId,$_comment)
    {
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_COMMENTS."` (`id`, `visitor_id`, `created`, `operator_id`, `comment`) VALUES ('".DBManager::RealEscape(getId(32))."','".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($_operatorId)."','".DBManager::RealEscape($_comment)."');");
        $this->ForceUpdate();
    }

    function ForceUpdate()
    {
        global $CONFIG;
        if(count($this->Browsers)==0)
        {
            $this->Load();
            $this->LoadBrowsers();
        }
        foreach($this->Browsers as $browser)
            if($browser->LastActive > (time()-$CONFIG["timeout_track"]))
                $browser->ForceUpdate();
    }

	function IsInChatWith($_operator)
	{
		global $CONFIG;
		foreach($this->Browsers as $browser)
			if($browser->Type == BROWSER_TYPE_CHAT && $browser->LastActive > (time()-$CONFIG["timeout_track"]) && !$browser->Closed)
				if(isset($browser->Members[$_operator->SystemId]))
					return true;
		return false;
	}
	
	function KeepAlive()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `last_active`='".DBManager::RealEscape(time())."' WHERE `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC LIMIT 1;");
	}
	
	function Save($_config,$_resolution,$_color,$_timezone,$_lat,$_long,$_countryiso2,$_city,$_region,$_geotimezone,$_isp,$_geosspan,$_grid,$_js=true,$_fromCookie=false)
	{
		global $STATS,$COUNTRY_ALIASES;
		if(!$this->FirstCall)
		{
			$this->KeepAlive();
		}
		else
		{
			if(!isnull(getCookieValue("visits")) && $this->Visits==1)
				$this->Visits = getCookieValue("visits")+1;
			setCookieValue("visits",$this->Visits);
			if(!isnull(getCookieValue("last_visit")))
				$this->VisitLast = getCookieValue("last_visit");
			setCookieValue("last_visit",time());

			$this->IP = getIP();
			$this->SystemInfo = ((!empty($_SERVER["HTTP_USER_AGENT"])) ? $_SERVER["HTTP_USER_AGENT"] : "");
			
			$localization = getBrowserLocalization();
			$this->Language = $localization[0];
			
			if(!empty($localization[1]))
				$this->GeoCountryISO2 = $localization[1];

			$this->Resolution = (!empty($_resolution) && count($_resolution) == 2 && !empty($_resolution[0]) && !empty($_resolution[1])) ? $_resolution[0] . " x " . $_resolution[1] : "";
			$this->Resolution .= (!empty($_color)) ? " (" . $_color . " Bit)" : "";
			$this->GeoTimezoneOffset = getLocalTimezone($_timezone);
			$this->GeoResult = 0;
			
			if(!empty($_geosspan))
				createSSpanFile($_geosspan);

			if(!empty($_config["gl_pr_ngl"]) && $_js)
			{
                if(!isnull(getCookieValue("geo_data")) && !isnull(getCookieValue(GEO_LATITUDE)))
                {
                    $this->GeoLatitude = getCookieValue(GEO_LATITUDE);
                    $this->GeoLongitude = getCookieValue(GEO_LONGITUDE);
                    $this->GeoCountryISO2 = getCookieValue(GEO_COUNTRY_ISO_2);
                    $this->GeoCity = getCookieValue(GEO_CITY);
                    $this->GeoRegion = getCookieValue(GEO_REGION);
                    $this->GeoTimezoneOffset = getCookieValue(GEO_TIMEZONE);
                    $this->GeoISP = getCookieValue(GEO_ISP);
                    $_fromCookie = true;
                }
				else if(!empty($_lat) && $_lat > -180)
				{
					setCookieValue(GEO_LATITUDE,$this->GeoLatitude = $_lat);
					setCookieValue(GEO_LONGITUDE,$this->GeoLongitude = $_long);
					setCookieValue(GEO_COUNTRY_ISO_2,$this->GeoCountryISO2 = $_countryiso2);
					setCookieValue(GEO_CITY,$this->GeoCity = $_city);
					setCookieValue(GEO_REGION,$this->GeoRegion = $_region);
					setCookieValue(GEO_TIMEZONE,$this->GeoTimezoneOffset = $_geotimezone);
					setCookieValue(GEO_ISP,$this->GeoISP = $_isp);
					setCookieValue("geo_data",time());
				}
				else if(!empty($_lat))
				{
					$this->GeoLatitude = $_lat;
					$this->GeoLongitude = $_long;
				}

				removeSSpanFile(false);
				if($_fromCookie)
					$this->GeoResultId = 6;
				else if(!isnull($span=getSpanValue()))
				{
					if($span > (time()+CONNECTION_ERROR_SPAN))
						$this->GeoResultId = 5;
					else
						$this->GeoResultId = 4;
				}
				else
				{
					if($_lat == -777)
						$this->GeoResultId = 5;
					else if($_lat == -522)
						$this->GeoResultId = 2;
					else if($_grid != 4)
						$this->GeoResultId = 3;
					else
						$this->GeoResultId = $_grid;
				}
			}
			else
				$this->GeoResultId = 7;
				
			initData(array("COUNTRIES"));
			if(isset($COUNTRY_ALIASES[$this->GeoCountryISO2]))
				$this->GeoCountryISO2 = $COUNTRY_ALIASES[$this->GeoCountryISO2];

			$detector = new DeviceDetector();
			$detector->DetectBrowser($this->Host);
			if($detector->AgentType == AGENT_TYPE_BROWSER || $detector->AgentType == AGENT_TYPE_UNKNOWN)
			{
				$detector->DetectOperatingSystem($this->Host);
				$bid = $this->GetBrowserId($detector->Browser,$detector->AgentType);
				$oid = $this->GetOSId($detector->OperatingSystem);
				$row = $this->CreateSignature();

				if(is_array($row) && $row["id"] != $this->UserId)
				{
					$this->UserId = $row["id"];
					$this->SignatureMismatch = true;
				}
				else
				{	
					queryDB(DEBUG_MODE,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITORS."` (`id`, `entrance`,`last_active`, `host`,`ip`,`system`,`browser`, `visits`,`visit_id`,`visit_last`,`resolution`, `language`, `country`, `city`, `region`, `isp`, `timezone`, `latitude`, `longitude`, `geo_result`, `js`, `signature`) VALUES ('".DBManager::RealEscape($this->UserId)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape(time())."', '".DBManager::RealEscape($this->Host)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($oid)."','".DBManager::RealEscape($bid)."', '".DBManager::RealEscape($this->Visits)."', '".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape($this->VisitLast)."', '".DBManager::RealEscape(getValueId(DATABASE_VISITOR_DATA_RESOLUTIONS,"resolution",$this->Resolution, false, 32))."', '".DBManager::RealEscape(substr(strtoupper($this->Language),0,5))."','".DBManager::RealEscape($this->GeoCountryISO2)."', '".DBManager::RealEscape(getValueId(DATABASE_VISITOR_DATA_CITIES,"city",$this->GeoCity,false))."', '".DBManager::RealEscape(getValueId(DATABASE_VISITOR_DATA_REGIONS,"region",$this->GeoRegion,false))."', '".DBManager::RealEscape(getValueId(DATABASE_VISITOR_DATA_ISPS,"isp",utf8_encode($this->GeoISP),false))."', '".DBManager::RealEscape($this->GeoTimezoneOffset)."', '".DBManager::RealEscape($this->GeoLatitude)."', '".DBManager::RealEscape($this->GeoLongitude)."', '".DBManager::RealEscape($this->GeoResultId)."', '".DBManager::RealEscape($_js?1:0)."', '".DBManager::RealEscape($this->Signature)."');");
					if(DBManager::GetAffectedRowCount() == 1)
                    {
						queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `visit_latest`=0 WHERE `id`='".DBManager::RealEscape($this->UserId)."' AND `visit_id`!='".DBManager::RealEscape($this->VisitId)."';");
				    }
                }
			}
			else if(STATS_ACTIVE)
			{
				$this->IsCrawler = true;
				$STATS->ProcessAction(ST_ACTION_LOG_CRAWLER_ACCESS,array($this->GetCrawlerId($detector->Browser),null));
			}
		}
	}
	
	function ResolveHost()
	{
		$this->Host = getHost();
		if(!empty($this->Host) && $this->Host != $this->IP)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `host`='".DBManager::RealEscape($this->Host)."' WHERE `id`='".DBManager::RealEscape($this->UserId)."' AND `visit_latest`=1;");
	}
	
	function CreateSignature($rrow=null)
	{
		$sig = @$_SERVER["HTTP_USER_AGENT"].@$_SERVER["HTTP_ACCEPT"].@$_SERVER["HTTP_ACCEPT_LANGUAGE"].@$_SERVER["HTTP_ACCEPT_CHARSET"];
		$this->Signature = md5(getIP() . $sig);
		
		if(empty($_GET["ovlc"]) && isnull(getCookieValue("userid")))
		{
			$result = queryDB(true,"SELECT `t1`.`city`,`t1`.`region`,`t1`.`isp`,`t1`.`timezone`,`t1`.`id`,`t2`.`customs`,`t2`.`fullname`,`t2`.`email`,`t2`.`company` FROM `".DB_PREFIX.DATABASE_VISITORS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t2` ON `t1`.`id`=`t2`.`visitor_id` WHERE `t1`.`signature`='".DBManager::RealEscape($this->Signature)."';");
			while($row = DBManager::FetchArray($result))
			{
				$rrow = $row;
				if(!empty($row["fullname"]))
					return $rrow;
			}
			return $rrow;
		}
		return null;
	}
	
	function GetCrawlerId($_crawler)
	{
		queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_CRAWLERS."` (`id`, `crawler`) VALUES (NULL, '".DBManager::RealEscape($_crawler)."');");
		$row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_CRAWLERS."` WHERE `crawler`='".DBManager::RealEscape($_crawler)."';"));
		return $row["id"];
	}

	function GetOSId($_osname)
	{
		queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` (`id`, `system`) VALUES (NULL, '".DBManager::RealEscape($_osname)."');");
		$row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` WHERE `system`='".DBManager::RealEscape($_osname)."';"));
		return $row["id"];
	}
	
	function GetBrowserId($_browser)
	{
		queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` (`id`, `browser`) VALUES (NULL, '".DBManager::RealEscape($_browser)."');");
		$row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` WHERE `browser`='".DBManager::RealEscape($_browser)."';"));
		return $row["id"];
	}

	function UpdateOverlayDetails()
	{
		$lu = substr(md5(time()),0,2);
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `customs`='".DBManager::RealEscape($this->Browsers[0]->Customs)."',`fullname`='".DBManager::RealEscape($this->Browsers[0]->Fullname)."',`email`='".DBManager::RealEscape($this->Browsers[0]->Email)."',`last_update`='".DBManager::RealEscape($lu)."' WHERE `visit_id`='".DBManager::RealEscape($this->VisitId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND (overlay=1 OR overlay_container=1);");
	}

	function SaveTicket($_group,$_country,$_cmb=false,$_custom=true,$_url="",$changed=false)
	{
		global $INPUTS,$CONFIG,$INTERNAL,$GROUPS;
        $isSpam = (!empty($CONFIG["gl_sft"]) && Visitor::CreateSPAMFilter($this->UserId));
		$ticket = new Ticket(getObjectId("ticket_id",DATABASE_TICKETS),strtoupper((!empty($this->Language)) ? $this->Language : $CONFIG["gl_default_language"]));
		$ticket->Messages[0]->Id = $ticket->Id;
		$ticket->Messages[0]->IP = getIP();
        $group = $GROUPS[$_group];

		if(!isTicketFlood() && !$isSpam)
		{
			initData(array("INPUTS"));
			$ticket->SenderUserId = $ticket->Messages[0]->SenderUserId = $this->UserId;
			$ticket->Group = $_group;
			$ticket->Messages[0]->Fullname = $this->Browsers[0]->Fullname = $group->GetServerInput($INPUTS[111],false,"",$changed);
			$ticket->Messages[0]->Email = $this->Browsers[0]->Email = $group->GetServerInput($INPUTS[112],false,"",$changed);
			$ticket->Messages[0]->Company = $this->Browsers[0]->Company = $group->GetServerInput($INPUTS[113],false,"",$changed);
			$ticket->Messages[0]->Phone = $this->Browsers[0]->Phone = $group->GetServerInput($INPUTS[116],false,"",$changed);
			$ticket->Messages[0]->Text = $group->GetServerInput($INPUTS[114],false,"",$changed);
			$ticket->Messages[0]->CallMeBack = $_cmb;
			$ticket->Messages[0]->Country = $_country;
			$ticket->Messages[0]->EmailId = getId(32);
            $ticket->Messages[0]->ChannelId = getId(32);
            $ticket->Messages[0]->Edited = $ticket->Messages[0]->Created = time();

            if(empty($_url))
                $_url = Visitor::GetLastURLFromVisitor($this->UserId);

            $ticket->Messages[0]->Subject = $_url;
			$this->Browsers[0]->DesiredChatGroup = $ticket->Group;
			$this->Browsers[0]->SetCookieGroup();
			
			if($_custom)
				foreach($INPUTS as $index => $input)
				{
 					if($input->Active && $input->Custom)
					{
                        $value = $group->GetServerInput($input,false,"",$changed);
						if($input->Type != "File" && !empty($value) && !in_array($index,$group->TicketInputsHidden))
    					    $ticket->Messages[0]->Customs[$index] = $this->Browsers[0]->Customs[$index] = $value;
                        else if($input->Type == "File" && isset($_FILES["p_cf".$index]) && !in_array($index,$group->TicketInputsHidden))
                            $ticket->Messages[0]->Customs[$index] = $this->Browsers[0]->Customs[$index] = $ticket->Messages[0]->AppendPostFile("p_cf".$index,$this->UserId);
                        if($input->Cookie && !empty($ticket->Messages[0]->Customs[$index]) && $input->Type != "File")
							setCookieValue("cf_" . $index,$ticket->Messages[0]->Customs[$index]);
					}
					else if($input->Active)
					{
						if($input->Index == 111 && $input->Cookie)
							setCookieValue("form_111",$ticket->Messages[0]->Fullname);
						else if($input->Index == 112 && $input->Cookie)
							setCookieValue("form_112",$ticket->Messages[0]->Email);
						else if($input->Index == 113 && $input->Cookie)
							setCookieValue("form_113",$ticket->Messages[0]->Company);
						else if($input->Index == 114 && $input->Cookie)
							setCookieValue("form_114",$ticket->Messages[0]->Text);
						else if($input->Index == 116 && $input->Cookie)
							setCookieValue("form_116",$ticket->Messages[0]->Phone);
					}
				}

			if($CONFIG["gl_adct"] == 1 || !(!empty($CONFIG["gl_rm_om"]) && $CONFIG["gl_rm_om_time"] == 0))
            {
				$ticket->Save();
                $ticket->AutoAssignEditor();
                $ticket->SetLastUpdate(time());
            }

			$this->AddFunctionCall("lz_chat_mail_callback(true);",false);

            if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]) && !empty($INTERNAL[Operator::GetSystemId(base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]))]))
            {
                $TicketEditor = new TicketEditor($ticket->Id);
                $TicketEditor->Editor = Operator::GetSystemId(base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]));
                $TicketEditor->Status = 0;
                $TicketEditor->GroupId = $ticket->Group;
                $TicketEditor->Save();
            }

            if(!empty($CONFIG["gl_mpm"]))
                foreach($INTERNAL as $operator)
                    if($operator->IsInPushMessageState())
                        if($operator->HasAccessToTicket($ticket))
                            $operator->AddPushMessage($ticket->Id, $this->SystemId, $ticket->Messages[0]->Fullname, 2, $ticket->Messages[0]->Text);

			return $ticket;
		}
		else
			$this->AddFunctionCall("lz_chat_mail_callback(false);",false);
		return false;
	}
	
	function StoreFile($_browserId,$_partner,$_fullname,$_chatId)
	{
		$filename = namebase($_FILES['userfile']['name']);
		if(!isValidUploadFile($filename))
			return false;
        if(empty($_fullname))
            $_fullname = getNoName($this->UserId.getIP());

		$fileid = md5($filename . $this->UserId . $_browserId);
		$fileurid = EX_FILE_UPLOAD_REQUEST . "_" . $fileid;
		$filemask = $this->UserId . "_" . $fileid;

		$request = new FileUploadRequest($fileurid,$_partner,$_chatId);
		$request->Load();

		if($request->Permission == PERMISSION_FULL)
		{
			if(move_uploaded_file($_FILES["userfile"]["tmp_name"], PATH_UPLOADS . $request->FileMask))
			{
				createFileBaseFolders($_partner,false);
				processResource($_partner,$this->UserId,$_fullname,0,$_fullname,0,5,3);
				processResource($_partner,$fileid,$filemask,4,$_FILES["userfile"]["name"],0,$this->UserId,4,$_FILES["userfile"]["size"]);
				
				$request->Download = true;
				$request->Save();
				return true;
			}
			else
			{
				$request->Error = true;
				$request->Save();
			}
		}
		return false;
	}
	
	function SaveRate($_internalId,$_config, $_chatId)
	{
        global $CONFIG;
        $isSpam = (!empty($CONFIG["gl_sfc"]) && Visitor::CreateSPAMFilter($this->UserId));
		$rate = new Rating(time() . "_" . getIP());
		if(!Rating::IsFlood() && !$isSpam)
		{
			$rate->RateComment = base64UrlDecode($_POST[POST_EXTERN_RATE_COMMENT]);
			$rate->RatePoliteness = base64UrlDecode($_POST[POST_EXTERN_RATE_POLITENESS]);
			$rate->RateQualification = base64UrlDecode($_POST[POST_EXTERN_RATE_QUALIFICATION]);
			$rate->Fullname = base64UrlDecode($_POST[POST_EXTERN_USER_NAME]);
			$rate->Email = base64UrlDecode($_POST[POST_EXTERN_USER_EMAIL]);
			$rate->Company = base64UrlDecode($_POST[POST_EXTERN_USER_COMPANY]);
			$rate->UserId = base64UrlDecode($_POST[POST_EXTERN_USER_USERID]);
			$rate->OperatorSystemId = $_internalId;
			if($_config["gl_adct"] == 1 || !(!empty($_config["gl_rm_rt"]) && $_config["gl_rm_rt_time"] == 0))
                $rate->Save($_chatId);
			$this->AddFunctionCall("lz_chat_send_rate_callback(true);",false);
		}
		else
			$this->AddFunctionCall("lz_chat_send_rate_callback(false);",false);
	}
	
	function AddFunctionCall($_call,$_overwrite)
	{
		if(empty($this->Response))
			$this->Response = "";
		if($_overwrite)
			$this->Response = $_call;
		else
			$this->Response .= $_call;
	}

    function AddBrowser($_browser)
    {
        for($i=0;$i<count($this->Browsers);$i++)
        {
            if($this->Browsers[$i]->BrowserId == $_browser->BrowserId)
            {
                $this->Browsers[$i] = $_browser;
                return;
            }
        }
        $this->Browsers[$i] = $_browser;
    }

    function GetBrowser($_bid)
    {
        for($i=0;$i<count($this->Browsers);$i++)
        {
            if($this->Browsers[$i]->BrowserId == $_bid)
            {
                return $this->Browsers[$i];
            }
        }
        return null;
    }
	
	function IsActivity($_browser,$_noBotChats=false)
	{
		if($this->IsInChat($_noBotChats,null,true))
			return true;
		if($_browser != null && $_browser->IsActivity())
			return true;
        else if($_browser == null)
            foreach($this->Browsers as $browser)
                if($browser->IsActivity())
                    return true;
		return false;
	}
	
	function IsInChat($_noBotChats=false,$_browser=null,$_fromDatabase=false)
	{
		global $CONFIG,$INTERNAL;
        if(!$_fromDatabase)
        {
            foreach($this->Browsers as $browser)
            {
                if($browser->LastActive > (time()-$CONFIG["timeout_chats"]) && $browser->Type == BROWSER_TYPE_CHAT && ($browser->Status > 0 || $browser->Waiting) && !$browser->Declined)
                {
                    if(!$_noBotChats || (!empty($browser->InternalUser) && !$browser->InternalUser->IsBot) || $browser->Waiting)
                        if(!(!empty($_browser) && $_browser->BrowserId != $browser->BrowserId) || substr($browser->BrowserId, strlen($browser->BrowserId)-strlen("_OVL")) === "_OVL")
                            return true;
                }
            }
        }
        else
        {
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `last_active` > ".(time()-$CONFIG["timeout_chats"])." AND (`status` > 0 OR `waiting`=1) AND `internal_declined`=0;");
            while($row = DBManager::FetchArray($result))
            {
                if(!$_noBotChats || (!empty($INTERNAL[$row["request_operator"]]) && !$INTERNAL[$row["request_operator"]]->IsBot) || !empty($row["waiting"]))
                    if(!(!empty($_browser) && $_browser->BrowserId != $row["browser_id"]) || substr($row["browser_id"], strlen($row["browser_id"])-strlen("_OVL")) === "_OVL")
                        return true;
            }
        }
		return false;
	}

    function GetLastChatOperator($_noBotChats=false)
    {
        global $INTERNAL;
        $result = queryDB(true,"SELECT `chat_id`,`internal_id` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `external_id` = '".DBManager::RealEscape($this->UserId)."';");
        while($row = DBManager::FetchArray($result))
            if(!$_noBotChats || (!empty($INTERNAL[$row["internal_id"]]) && !$INTERNAL[$row["internal_id"]]->IsBot))
                return $row["internal_id"];
        return "";
    }

	function WasInChat($_noBotChats=false)
	{
        $lco = $this->GetLastChatOperator($_noBotChats);
        if(!empty($lco))
            return true;
		return $this->IsInChat($_noBotChats,null,true);
	}
	
	function GetChatRequestResponses()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `closed` ASC,`created` DESC;"))
		{
			while($row = DBManager::FetchArray($result))
			{
				if(!empty($row["declined"]))
					$this->HasDeclinedChatRequest = true;
				if(!empty($row["accepted"]))
					$this->HasAcceptedChatRequest = true;
			}
		}
	}

    function LoadChatRequests($_timeout=false)
    {
        if(!is_array($this->ChatRequests))
        {
            $this->ChatRequests = array();
            if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` DESC;"))
                while($row = DBManager::FetchArray($result))
                {
                    if(!empty($row["declined"]))
                        $this->HasDeclinedChatRequest = true;
                    if(!empty($row["accepted"]))
                        $this->HasAcceptedChatRequest = true;
                    $request = new ChatRequest($row);

                    $found=false;
                    foreach($this->Browsers as $browser)
                        if($browser->BrowserId == $row["receiver_browser_id"])
                        {
                            if($browser->ChatRequest == null)
                                $browser->ChatRequest = $request;
                            $found=true;
                        }

                    if($_timeout && !$found && empty($this->Canceled) && !$request->Closed)
                        $request->Cancel("Timeout","1");

                    $this->ChatRequests[] = $request;
                }
        }
    }

    function TextReplace($_text)
    {
        global $COUNTRIES;
        initData(array("COUNTRIES"));
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        $_text = str_replace("%location_city%",getIdValue(DATABASE_VISITOR_DATA_CITIES,"city",$this->GeoCity,false,true),$_text);
        $_text = str_replace("%location_country_iso%",$this->GeoCountryISO2,$_text);
        $_text = str_replace("%location_country%",@$COUNTRIES[$this->GeoCountryISO2],$_text);
        $_text = str_replace("%location_region%",getIdValue(DATABASE_VISITOR_DATA_REGIONS,"region",$this->GeoRegion,false,true),$_text);
        return $_text;
    }

    static function CreateSPAMFilter($_userId)
    {
        global $CONFIG;
        if(!empty($CONFIG["gl_sfa"]))
        {
            $filterkeys = array(0=>$CONFIG["gl_sfv"]);
            if(strpos($CONFIG["gl_sfv"],",") !== -1)
                $filterkeys = explode(",",$CONFIG["gl_sfv"]);

            foreach($filterkeys as $fvalue)
            {
                foreach($_GET as $gvalue)
                {
                    if(jokerCompare($fvalue,base64UrlDecode($gvalue)))
                    {
                        Filter::Create(getIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
                        return true;
                    }
                }

                foreach($_POST as $pvalue)
                {
                    if(jokerCompare($fvalue,base64UrlDecode($pvalue)))
                    {
                        Filter::Create(getIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    static function IDValidate($_id="")
    {
        if(empty($_id))
            return getId(USER_ID_LENGTH);
        else if(strlen($_id) != USER_ID_LENGTH)
            return getId(USER_ID_LENGTH);
        else if(function_exists("ctype_alnum") && !ctype_alnum($_id))
            return getId(USER_ID_LENGTH);
        return $_id;
    }

    static function FromCache($_id)
    {
        /*
        global $CM,$VISITOR;
        if(!empty($CM))
        {
            initData(array("VISITOR"));
            if(isset($VISITOR[$_id]))
            {
                return $VISITOR[$_id];
            }
        }
        */
        $v = new Visitor(CALLER_USER_ID);
        $v->Load();
        return $v;
    }

    static function GetLastURLFromVisitor($_visitorId)
    {
        $result = queryDB(true,"SELECT `untouched` FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` AS `t2` ON `t1`.`id`=`t2`.`browser_id` WHERE `t1`.`is_chat`=0 AND `t1`.`visitor_id`='".DBManager::RealEscape($_visitorId)."' ORDER BY `t2`.`entrance` DESC LIMIT 1;");
        while($row = DBManager::FetchArray($result))
            return $row["untouched"];
        return "";
    }

    static function Build($_fullList=false,$_sqlwhere="",$_limit="")
    {
        global $VISITOR,$CONFIG,$COUNTRIES,$CM;
        if(!$_fullList && !empty($CM) && $CM->GetData(111,$VISITOR))
            return;

        $VISITOR = $tvisitors = $tbrowsers = array();

        if(!$_fullList)
            $_sqlwhere = " WHERE `last_active`>".DBManager::RealEscape(time()-$CONFIG["timeout_track"]);

        $result = queryDB(true,"SELECT *,`t1`.`id` AS `id` FROM `".DB_PREFIX.DATABASE_VISITORS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` AS `t2` ON `t1`.`browser`=`t2`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."` AS `t3` ON `t1`.`city`=`t3`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."` AS `t4` ON `t1`.`region`=`t4`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."` AS `t5` ON `t1`.`isp`=`t5`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` AS `t6` ON `t1`.`system`=`t6`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_RESOLUTIONS."` AS `t8` ON `t1`.`resolution`=`t8`.`id`".$_sqlwhere." ORDER BY `entrance` ASC".$_limit.";");
        if($result)
        {
            initData(array("COUNTRIES"));
            while($row = DBManager::FetchArray($result))
            {
                $fa = $row["entrance"];
                if(isset($tvisitors[$row["id"]]))
                    $fa = min($tvisitors[$row["id"]]->FirstActive,$fa);
                if(!empty($COUNTRIES[$row["country"]]))
                    $row["countryname"] = $COUNTRIES[$row["country"]];
                if(!isset($vcount[$row["id"]]))
                    $vcount[$row["id"]]=0;

                $vcount[$row["id"]]++;
                $row["dcount"] = $vcount[$row["id"]];
                $visitor = new Visitor($row["id"]);
                $visitor->Load($row);
                $visitor->FirstActive = $fa;
                $tvisitors[$row["id"]] = $visitor;
                $tvisitors[$row["id"]]->FirstActive = min($tvisitors[$row["id"]]->FirstActive,$row["entrance"]);
            }

            $minEntrance = time();
            $limiter = (!$_fullList) ? " WHERE `last_active` > ".(time()-$CONFIG["timeout_track"])." " : "";
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."`".$limiter."ORDER BY `created` ASC;");
            if($result)
                while($row = DBManager::FetchArray($result))
                    if(isset($tvisitors[$row["visitor_id"]]) && ($tvisitors[$row["visitor_id"]]->VisitId == $row["visit_id"] || $_fullList))
                    {
                        $browser = $tvisitors[$row["visitor_id"]]->CreateBrowser($row);
                        $tbrowsers[$browser->BrowserId] = $browser;
                        $minEntrance = min($minEntrance,$row["created"]);
                    }

            if($_fullList)
            {
                if($result = queryDB(true,"SELECT `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`browser_id`,`".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`title` as `url_title`,`treftitle`.`title` as `ref_title`,`turldom`.`domain` as `url_dom`,`turlpath`.`path` as `url_path`,`trefdom`.`domain` as `ref_dom`,`trefpath`.`path` as `ref_path`,`entrance`,`params`,`untouched`,`ref_untouched` FROM (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` ORDER BY `entrance` ASC) AS `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` AS `turl` ON `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`url`=`turl`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` AS `tref` ON `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`referrer`=`tref`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` AS `trefdom` ON `tref`.`domain`=`trefdom`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` AS `turldom` ON `turl`.`domain`=`turldom`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."` AS `trefpath` ON `tref`.`path`=`trefpath`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."` AS `turlpath` ON `turl`.`path`=`turlpath`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` AS `treftitle` ON `tref`.`title`=`treftitle`.`id`;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row);
            }
            else
            {
                if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `entrance` >= ".$minEntrance." ORDER BY `entrance` ASC;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row,true);
            }

            foreach($tbrowsers as $i => $browser)
            {
                $tbrowsers[$i]->SetFirstCall(count($browser->History)==0);
                if(isset($tvisitors[$browser->UserId]))
                    $tvisitors[$browser->UserId]->Browsers[count($tvisitors[$browser->UserId]->Browsers)] = $browser;
            }

            foreach($tvisitors as $vid => $visitor)
                if($_fullList || count($visitor->Browsers)>0)
                    $VISITOR[$vid] = $visitor;

            if(!$_fullList && !empty($CM))
                $CM->SetData(111,$VISITOR,true);
        }
    }
}

class VisitorBrowser extends BaseUser
{
    public $DesiredChatGroup;
    public $DesiredChatPartner;
	public $BrowserId;
	public $History;
	public $ChatRequest;
	public $WebsitePush;
	public $OverlayBox;
	public $Alert;
	public $Type = BROWSER_TYPE_BROWSER;
	public $Query;
    public $Code = "";
	public $VisitId;
	public $LastUpdate;
	public $Overlay;
	public $OverlayContainer;
    private $FirstCall = true;

    function VisitorBrowser($_browserid,$_userid,$_history=true)
    {
        $this->BrowserId = $_browserid;
        $this->UserId = $_userid;
        $this->SystemId = $this->UserId . "~" . $this->BrowserId;

        if($_history)
            $this->LoadHistory();

        $this->FirstCall = (count($this->History)==0);
    }
	
	function GetFirstCall()
	{
		return $this->FirstCall;
	}

    function SetFirstCall($_value)
    {
        $this->FirstCall = $_value;
    }

	function LoadHistory()
	{
        $this->History = array();
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`.`browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`.`entrance` ASC;"))
            while($row = DBManager::FetchArray($result))
            {
                $hu = new HistoryURL($row, true);
    			$this->History[] = $hu;
            }
	}

	function LoadAlerts()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_ALERTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `accepted` ASC,`created` ASC;"))
			if($row = DBManager::FetchArray($result))
				$this->Alert = new Alert($row);
	}
	
	function LoadWebsitePush()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `displayed` ASC,`accepted` ASC,`declined` ASC,`created` ASC LIMIT 1;"))
			if($row = DBManager::FetchArray($result))
				$this->WebsitePush = new WebsitePush($row);
	}
	
	function LoadOverlayBoxes()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `displayed` ASC,`created` ASC LIMIT 1;"))
			if($row = DBManager::FetchArray($result))
				$this->OverlayBox = new OverlayBox($row);
	}
	
	function SetQuery($_referrer,$issearchengine=false,$parammatch=false,$encoding="")
	{
		$parts = parse_url(strtolower($_referrer));
		$uparts = explode("&",@$parts["query"]);
		foreach(HistoryUrl::$SearchEngines as $sparam => $engines)
			foreach($uparts as $param)
			{
				$kv = explode("=",$param);
				$parammatch = ($kv[0] == $sparam && !empty($kv[1]));
				
				foreach($engines as $engine)
				{
					if(jokerCompare($engine,$parts["host"]))
						$issearchengine = true;
						
					if($issearchengine && $parammatch)
					{
						if(empty($encoding))
							foreach(HistoryUrl::$SearchEngineEncodings as $enc => $eengines)
								foreach($eengines as $eengine)
									if($eengine==$engine)
										$encoding = $enc;
						$this->Query = (empty($encoding)) ? urldecode(trim($kv[1])) : html_entity_decode(@iconv($encoding,"UTF-8",urldecode(trim($kv[1]))), ENT_QUOTES, 'UTF-8');
						
						if(!empty($this->Query) && isnull(getCookieValue("sp")))
							setCookieValue("sp",$this->Query);
							
						queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `query`='".DBManager::RealEscape($this->GetQueryId($this->Query,$_referrer))."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' LIMIT 1;");
						return true;
					}
				}
			}
		return $issearchengine;
	}
	
	function GetQueryId($_query,$_referrer,$_maxlength=255,$_self=false)
	{
		if(empty($_query))
			$_query = "";
	
		if(!$_self && $_maxlength != null && strlen($_query) > $_maxlength)
			$_query = substr($_query,0,$_maxlength);
		
		$result = queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."` (`id`, `query`) VALUES (NULL, '".DBManager::RealEscape($_query)."');");
		if(!$_self && !empty($_query) && !$result && !isnull(DBManager::GetErrorCode()) && DBManager::GetErrorCode() != 1062)
			$this->GetQueryId(utf8_encode(urldecode($_query)),$_referrer,$_maxlength,true);

		$row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."` WHERE `query`='".DBManager::RealEscape($_query)."';"));
		return $row["id"];
	}
	
	function ForceUpdate()
	{
		$this->LastUpdate = substr(md5(time()),0,2);
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_update`='".DBManager::RealEscape($this->LastUpdate)."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
    }
	
	function Save()
	{
		if(!($this->FirstCall && $res = queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` (`id`, `visitor_id`, `visit_id`, `created`, `last_active`, `last_update`, `is_chat`,`customs`,`fullname`,`email`,`company`,`phone`,`pre_message`,`overlay`,`overlay_container`) VALUES ('".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape(time())."','".DBManager::RealEscape(substr(md5(time()),0,2))."','".DBManager::RealEscape($this->Type)."','".DBManager::RealEscape(serialize($this->Customs))."','".DBManager::RealEscape($this->Fullname)."','".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape($this->Company)."','".DBManager::RealEscape($this->Phone)."','',".($this->Overlay?1:0).",".($this->OverlayContainer?1:0).");")))
			if(!$this->FirstCall)
					queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_active`=".time().",`visit_id`='".DBManager::RealEscape($this->VisitId)."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
    }
	
	function Destroy()
	{
		global $CONFIG;
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_active`=`last_active`-".DBManager::RealEscape($CONFIG["timeout_track"])." WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' LIMIT 1;");
	}
	
	function SaveLoginData()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `customs`='".DBManager::RealEscape(serialize($this->Customs))."',`fullname`='".DBManager::RealEscape($this->Fullname)."',`email`='".DBManager::RealEscape($this->Email)."',`company`='".DBManager::RealEscape($this->Company)."',`phone`='".DBManager::RealEscape($this->Phone)."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."';");
	}

    function IsActivity()
    {
        global $CONFIG;
        if(count($this->History)==0)
            $this->LoadHistory();
        if(count($this->History) > 0 && $this->History[count($this->History)-1]->Entrance >= (time()-(($CONFIG["gl_inti"]*60))))
            return true;
        return false;
    }

    function TextReplace($_text)
    {
        global $INPUTS,$LZLANG;
        $_text = str_replace(array("%external_name%","%USERNAME%"),$this->Fullname,$_text);
        $nameparts = explode(" ",$this->Fullname);

        if(count($nameparts)>2)
        {
            $_text = str_replace(array("%external_firstname%"),trim($nameparts[0]),$_text);
            $nameparts[0] = "";
            $_text = str_replace(array("%external_lastname%"),trim(implode(" ",$nameparts)),$_text);
        }
        else if(count($nameparts)==2)
        {
            $_text = str_replace(array("%external_firstname%"),trim($nameparts[0]),$_text);
            $_text = str_replace(array("%external_lastname%"),trim($nameparts[1]),$_text);
        }
        else if(count($nameparts)==1)
        {
            $_text = str_replace(array("%external_firstname%","%USERNAME%"),trim($nameparts[0]),$_text);
            $_text = str_replace(array("%external_lastname%","%USERNAME%"),"",$_text);
        }
        else
        {
            $_text = str_replace(array("%external_firstname%","%USERNAME%"),"",$_text);
            $_text = str_replace(array("%external_lastname%","%USERNAME%"),"",$_text);
        }

        if(count($this->History) > 0)
        {
            $_text = str_replace("%page_title%",$this->History[count($this->History)-1]->Url->PageTitle,$_text);
            $_text = str_replace("%url%",$this->History[count($this->History)-1]->Url->GetAbsoluteUrl(),$_text);
        }

        $_text = str_replace(array("%external_email%","%USEREMAIL%"),$this->Email,$_text);
        $_text = str_replace(array("%external_company%","%USERCOMPANY%"),$this->Company,$_text);
        $_text = str_replace("%searchstring%",$this->Query,$_text);
        $_text = str_replace("%external_phone%",$this->Phone,$_text);
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        $_text = str_replace(array("%question%","%USERQUESTION%","%mailtext%"),$this->Question,$_text);


        foreach($INPUTS as $index => $input)
            if($input->Active && $input->Custom)
            {
                if($input->Type == "CheckBox")
                    $_text = str_replace("%custom".($index)."%",((!empty($this->Customs[$index])) ? $LZLANG["client_yes"] : $LZLANG["client_no"]),$_text);
                else if(!empty($this->Customs[$index]))
                    $_text = str_replace("%custom".($index)."%",$input->GetClientValue($this->Customs[$index]),$_text);
                else
                    $_text = str_replace("%custom".($index)."%","",$_text);
            }
            else
                $_text = str_replace("%custom".($index)."%","",$_text);

        return $_text;
    }

    function GetXML($_chatXML="",$_visitorDetails=null,$_history=false)
    {
        global $INPUTS;
        if($_visitorDetails==null)
            $_visitorDetails=array("ka"=>"","waiting"=>"");
        $referrer = ($this->History[0]->Referrer != null) ? " ref=\"".base64_encode($this->History[0]->Referrer->GetAbsoluteUrl())."\"" : "";
        $sstring = (!$this->Overlay) ? " ss=\"".base64_encode($this->Query)."\"" : "";
        $personal = " cname=\"".base64_encode($this->GetInputData(111))."\"";
        $personal .= " cemail=\"".base64_encode($this->GetInputData(112))."\"";
        $personal .= " ccompany=\"".base64_encode($this->GetInputData(113))."\"";
        $personal .= " cphone=\"".base64_encode($this->GetInputData(116))."\"";
        $lastactive = ($_history) ? " l=\"".base64_encode($this->LastActive)."\"" : "";
        if(is_array($this->Customs))
            foreach($this->Customs as $index => $value)
                if($INPUTS[$index]->Active && $INPUTS[$index]->Custom)
                {
                    $value = ($INPUTS[$index]->Type == "Text") ? $this->GetInputData($index) : $value;
                    $personal .= " cf".$index."=\"".base64_encode($value)."\"";
                }
        $xml = "<b id=\"".base64_encode($this->BrowserId)."\" ol=\"".base64_encode($this->Overlay?1:0)."\" olc=\"".base64_encode($this->OverlayContainer?1:0)."\"".$sstring.$_visitorDetails["ka"].$referrer.$_visitorDetails["waiting"].$personal.$lastactive.">\r\n";



        if(!$this->Overlay)
        {
            for($i = 0;$i < count($this->History);$i++)
            {
                if($i == count($this->History)-1 || $this->Type != BROWSER_TYPE_CHAT)
                {
                    $xml .=  "<h time=\"".base64_encode($this->History[$i]->Entrance)."\" url=\"".base64_encode($this->History[$i]->Url->GetAbsoluteUrl())."\" title=\"".base64_encode(@$this->History[$i]->Url->PageTitle)."\" code=\"".base64_encode( ($this->Type == BROWSER_TYPE_CHAT) ? $this->Code : $this->History[$i]->Url->AreaCode )."\" cp=\"".base64_encode($this->Type)."\" />\r\n";

                }
            }
        }
        if(!empty($_chatXML))
            $xml .= $_chatXML;
        return $xml . "</b>\r\n";
    }

    static function FromCache($_uid,$_bid)
    {
        global $CM,$VISITOR;
        /*
        if(!empty($CM))
        {
            initData(array("VISITOR"));
            if(isset($VISITOR[$_uid]))
            {
                foreach($VISITOR[$_uid]->Browsers as $browser)
                {
                    if($browser->BrowserId == $_bid)
                    {
                        return $browser;
                    }
                }
            }
        }
        */
        $browser = new VisitorBrowser($_bid,$_uid,true);
        return $browser;
    }
}

class VisitorChat extends VisitorBrowser
{
	public $Forward;
	public $Waiting;
	public $Chat;
	public $Type = BROWSER_TYPE_CHAT;
	public $ConnectingMessageDisplayed = null;
	public $Members;
	public $TranscriptEmail;
	public $ChatId;
	public $ResponseTime;
	public $ArchiveCreated;
	public $Activated;
	public $Closed;
	public $Declined = 0;
	public $InternalActivation;
	public $ExternalActivation;
	public $ExternalClosed;
	public $InternalClosed;
	public $InternalUser;
	public $FileUploadRequest = null;
	public $LastActive = 0;
	public $Priority = 2;
	public $AllocatedTime = 0;
	public $QueueMessageShown = false;
	public $ChatVoucherId = "";
	public $CallMeBack = false;
	public $QueuedPosts;
	public $InitChatWith;
    public $TranslationSettings;
    public $FirstCall = true;

	function VisitorChat()
   	{
		if(func_num_args() == 2)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->FirstCall = true;
			$this->QueuedPosts = array();
		}
		else if(func_num_args() == 10)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->Fullname = func_get_arg(2);
			$this->Email = func_get_arg(3);
			$this->Company = func_get_arg(4);
			$this->Question = func_get_arg(5);
			$this->Customs = func_get_arg(6);
			$this->DesiredChatGroup = func_get_arg(7);
			$this->DesiredChatPartner = func_get_arg(8);
			$this->FirstCall = true;
            $this->Phone = func_get_arg(9);
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
		parent::__construct($this->BrowserId,$this->UserId);
   	}
	
	function GetParent()
	{
		return parent;
	}

    function SetTranslation($_value)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `translation`='".DBManager::RealEscape($_value)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
    }
	
	function SetCookieGroup()
	{
		if(!empty($this->DesiredChatGroup))
			setCookieValue("login_group",$this->DesiredChatGroup);
	}
	
	function RequestFileUpload($_user,$_filename)
	{
		$fileid = md5(namebase($_filename) . $this->UserId . $this->BrowserId);
		$filemask = $this->UserId . "_" . $fileid;
		$fileurid = EX_FILE_UPLOAD_REQUEST . "_" . $fileid;
		$request = new FileUploadRequest($fileurid,$this->DesiredChatPartner,$this->ChatId);
		$request->SenderUserId = $this->UserId;
		$request->FileName = namebase($_filename);
		$request->FileMask = $filemask;
		$request->FileId = $fileid;
		$request->SenderBrowserId = $this->BrowserId;
		$request->Load();

		if(!$request->FirstCall && !$request->Closed)
		{
			if($request->Permission == PERMISSION_FULL)
			{
				$_user->AddFunctionCall("lz_chat_file_start_upload('".$_filename."');",false);
			}
			else if($request->Permission == PERMISSION_NONE)
			{
				$_user->AddFunctionCall("lz_chat_file_stop(true);",false);
				$_user->AddFunctionCall("lz_chat_file_error(1);",false);
				$request->Close();
			}
		}
		else
		{
			$request->FirstCall = true;
			$request->Error = false;
			$request->Closed = false;
			$request->Permission = PERMISSION_VOID;
			if(!isValidUploadFile($_filename))
				$_user->AddFunctionCall("lz_chat_file_error(2);",false);
			else
			{
				$request->Save();
			}
		}
		return $_user;
	}
	
	function SetCallMeBackStatus($_success)
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `call_me_back`='".DBManager::RealEscape($_success)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `call_me_back`='".DBManager::RealEscape($_success)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function AbortFileUpload($_user,$_filename,$_error)
	{
		$fileid = md5(namebase($_filename) . $this->UserId . $this->BrowserId);
		$request = new FileUploadRequest(EX_FILE_UPLOAD_REQUEST . "_" . $fileid, $this->DesiredChatPartner,$this->ChatId);
		$request->Load();
		if(!$request->Closed)
		{
			$request->Error = $_error;
			$request->Save();
		}
		else
		{
			$_user->AddFunctionCall("lz_chat_file_reset();",false);
		}
		return $_user;
	}
	
	function Load()
	{
        global $CONFIG;
		$this->Status = CHAT_STATUS_OPEN;
		$this->LastActive = time();
		$this->Members = array();
        $historyEntry = false;
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `first_active` DESC LIMIT 2;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if(empty($row["external_close"]))
				{
					$this->FirstCall = !empty($row["exit"]);
					$this->SetValues($row,false);
				}
				else
                    $this->SetValues($row,true);

                if($historyEntry && empty($CONFIG["gl_save_op"]))
                    continue;

				if(!empty($row["request_operator"]) && empty($this->DesiredChatPartner))
					$this->DesiredChatPartner = $row["request_operator"];

				if(!empty($row["request_group"]) && empty($this->DesiredChatGroup))
					$this->DesiredChatGroup = $row["request_group"];

                $historyEntry = true;
			}
		$this->LoadMembers();
	}
	
	function LoadMembers()
	{
		global $INTERNAL;
		initData(array("INTERNAL"));

		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `status`<9 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' ORDER BY `status` DESC, `dtime` DESC;");
		while($row = DBManager::FetchArray($result))
			if(isset($INTERNAL[$row["user_id"]]))
			{
				$this->Members[$row["user_id"]] = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);

                if($row["status"] < 2)
					$this->InternalUser = $INTERNAL[$row["user_id"]];
				$this->Declined = $row["dtime"];
			}
	}

    function GetLastOperator(&$_waitingTime,&$_startMarker,&$_endMarker)
    {
        if(!empty($this->Declined))
        {
            $_startMarker = 2;
            $_waitingTime = $this->Declined-$this->FirstActive;
        }
        else if($this->InternalActivation)
        {
            $_startMarker = 1;
            $_waitingTime = $this->AllocatedTime-$this->FirstActive;
        }
        else
        {
            $_startMarker = 0;
            $_waitingTime = $this->LastActive-$this->FirstActive;
        }

        if(($this->InternalActivation && $this->InternalClosed) || $this->Declined)
            $_endMarker = 1;

        $_waitingTime = max($_waitingTime,0);

        if(!empty($this->InternalUser))
            return $this->InternalUser->SystemId;
        else
        {
            $this->LoadForward(false,false);
            if($this->Forward != null)
                return $this->Forward->SenderSystemId;
            return "";
        }
    }
	
	function SetValues($row, $_dataOnly=false)
	{
        if(empty($this->Fullname))$this->Fullname = $row["fullname"];
        if(empty($this->Company))$this->Company = $row["company"];
        if(empty($this->Phone))$this->Phone = $row["phone"];
        if(empty($this->Email))$this->Email = $row["email"];
        if(empty($this->Code))$this->Code = $row["area_code"];
        if(empty($this->Question))$this->Question = $row["question"];
        if(empty($this->Customs))$this->Customs = @unserialize($row["customs"]);

        if(!$_dataOnly)
        {
            $this->LastActive = $row["last_active"];
            $this->AllocatedTime = $row["allocated"];
            $this->Waiting = $row["waiting"];
            $this->FirstActive = $row["first_active"];
            $this->Typing = !empty($row["typing"]);
            $this->ChatId = $row["chat_id"];
            $this->VisitId = $row["visit_id"];
            $this->QueuedPosts = @unserialize($row["queue_posts"]);
            $this->DesiredChatPartner = $row["request_operator"];
            $this->DesiredChatGroup = $row["request_group"];
            $this->Priority = $row["priority"];
            $this->ChatVoucherId = $row["chat_ticket_id"];
            $this->ArchiveCreated = $row["archive_created"];
            $this->InternalActivation = !empty($row["internal_active"]);
            $this->Declined = !empty($row["internal_declined"]);
            $this->Closed = !empty($row["exit"]);
            $this->CallMeBack = $row["call_me_back"];
            $this->ExternalActivation = !empty($row["external_active"]);
            $this->ExternalClosed = !empty($row["external_close"]);
            $this->InternalClosed = !empty($row["internal_closed"]);
            $this->LastActive = $row["last_active"];
            $this->InitChatWith = $row["init_chat_with"];
            $this->UserId = $row["visitor_id"];
            $this->BrowserId = $row["browser_id"];
            $this->Status = $row["status"];
            $this->QueueMessageShown = !empty($row["queue_message_shown"]);
            $this->Activated = (($this->ExternalActivation && $this->InternalActivation) ? CHAT_STATUS_ACTIVE : (($this->ExternalActivation || $this->InternalActivation) ? CHAT_STATUS_WAITING : CHAT_STATUS_OPEN));
            $this->TranslationSettings = (!empty($row["translation"])) ? explode(",",$row["translation"]) : null;
        }
    }
	
	function SetChatId()
	{
		if(isset($_POST[POST_EXTERN_CHAT_ID]) && $this->Status != CHAT_STATUS_OPEN)
		{
			$this->ChatId = base64UrlDecode($_POST[POST_EXTERN_CHAT_ID]);
		}
		else
		{
			$result = queryDB(true,"SELECT `chat_id` FROM `".DB_PREFIX.DATABASE_INFO."`");
			$row = DBManager::FetchArray($result);
			$cid = $row["chat_id"]+1;
			$result = queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_INFO."` SET `chat_id`='".DBManager::RealEscape($cid)."' WHERE `chat_id`='".DBManager::RealEscape($row["chat_id"])."'");
			if(DBManager::GetAffectedRowCount() == 0)
			{
				$this->ChatId = $this->SetChatId();
				return;
			}
			else
			{
				$this->ChatId = $cid;
			}
		}
		$this->FirstActive = time();
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `last_active`='".DBManager::RealEscape(time())."',`first_active`='".DBManager::RealEscape(time())."',`chat_id`='".DBManager::RealEscape($this->ChatId)."' WHERE `exit`=0 AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `first_active` DESC LIMIT 1;");
		return $this->ChatId;
	}
	
	function SetStatus($_status)
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `last_active`='".DBManager::RealEscape(time())."',`status`='".DBManager::RealEscape($_status)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}
	
	function SetWaiting($_waiting)
	{
		$this->Waiting=$_waiting;
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `waiting`='".DBManager::RealEscape((($_waiting)?1:0))."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}
	
	function UpdateArchive($_tcemail,$_email="",$_name="")
	{
		if(!empty($_name))
			$_name = ",`fullname`='" . DBManager::RealEscape($_name)."'";
		if(!empty($_email))
			$_email = ",`email`='" . DBManager::RealEscape($_email)."'";
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `transcript_receiver`='".DBManager::RealEscape($_tcemail)."'".$_name.$_email." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}
	
	function LoadForward($_checkReceived=true,$_loadInvites=false)
	{
		$this->Forward = null;
		$_checkReceived = ($_checkReceived) ? " AND `received`=0" : "";
		$_loadInvites = (!$_loadInvites) ? " AND `invite`=0" : "";
		$result = queryDB(false,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE  `closed`=0 AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."'".$_checkReceived.$_loadInvites." ORDER BY `created` DESC LIMIT 1;");
		if($result)
            while($row = DBManager::FetchArray($result))
                $this->Forward = new Forward($row);
	}
	
	function JoinChat($_internalUser,$_invisible=false,$_rePost=false)
	{
        if(!empty($this->ChatId))
        {
            queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`jtime`,`status`,`alloc`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($_internalUser)."',".(($_invisible) ? 0 : time()).",".(($_invisible) ? 2 : 1).",0);");
            if(DBManager::GetAffectedRowCount() != 1)
            {
                $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
                if($row = DBManager::FetchArray($result))
                {
                    $jtime = ($_invisible && ($row["status"] == 1 || $row["status"] == 0)) ? "`jtime`" : (($_invisible) ? 0 : time());
                    queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `ltime`=".(($_invisible) ? time() : 0).",`jtime`=".$jtime.",`dtime`=0,`declined`=0,`status`=".(($_invisible) ? 2 : 1)." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
                }
            }
            if($_rePost)
            {
                $this->RepostChatHistory(1,$this->ChatId,$_internalUser,0,0,"",$this->ChatId);
                return;
            }
        }
	}
	
	function LeaveChat($_internalUser)
	{
		if(count($this->Members)>=2 && !empty($this->Members[$_internalUser]) && $this->Members[$_internalUser]->Status == 0)
			foreach($this->Members as $sysid => $member)
				if($member->Status == 1)
				{
					$this->SetHost($sysid);
					break;
				}

		queryDB(false,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' AND `status`=2 LIMIT 1;");
        if(!empty($this->ChatId))
            queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=9,`ltime`=".time()." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
	}
	
	function SetHost($_internalUser)
	{
        if(!empty($this->ChatId))
        {
		    queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0 WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
		    if(DBManager::GetAffectedRowCount() != 1)
			    queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`status`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($_internalUser)."',0);");
            queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=1 WHERE `status`=0 AND `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`!='".DBManager::RealEscape($_internalUser)."';");
	    }
    }
	
	function SetPriority($_priority)
	{
		queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `priority`='".DBManager::RealEscape($_priority)."' WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function SetTargetOperator($_internalUser)
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `request_operator`='".DBManager::RealEscape($_internalUser)."' WHERE `chat_id`=".DBManager::RealEscape($this->ChatId)." LIMIT 1;");
	}
	
	function RequestInitChat($_internalUser)
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `init_chat_with`='".DBManager::RealEscape($_internalUser)."' WHERE `browser_id` = '".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id` = '".DBManager::RealEscape($this->UserId)."';");
	}
	
	function SetTargetGroup($_groupId)
	{
		queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `request_group`='".DBManager::RealEscape($_groupId)."' WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function TakeChat($_internalUser,$_groupId)
	{
		$this->SetHost($_internalUser);
		$_groupId = (!empty($_groupId)) ? ",`request_group`='".DBManager::RealEscape($_groupId)."'" : "";
		queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0,`declined`=0,`dtime`=0,`ltime`=0,`jtime`=".time()." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `status`=1,`waiting`=0,`request_operator`='".DBManager::RealEscape($_internalUser)."'".$_groupId." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function ApplyInputValues($_group)
	{
		global $INPUTS;
		foreach($INPUTS as $index => $input)
		{
			if($input->Active && $input->Custom)
			{
				if($input->IsServerInput())
				{
					$this->Customs[$index] = $_group->GetServerInput($input);
					if($input->Cookie && $input->Type != "File")
						setCookieValue("cf_".$index,base64UrlDecode($_POST["p_cf".$index]));
				}
			}
			else if($index == 111 && $input->Cookie && $input->IsServerInput())
            	setCookieValue("form_" . $index,$this->Fullname);
			else if($index == 112 && $input->Cookie && $input->IsServerInput())
				setCookieValue("form_" . $index,$this->Email);
			else if($index == 113 && $input->Cookie && $input->IsServerInput())
				setCookieValue("form_" . $index,$this->Company);
			else if($index == 114 && $input->Cookie && $input->IsServerInput())
				setCookieValue("form_" . $index,$this->Question);
			else if($index == 116 && $input->Cookie && $input->IsServerInput())
				setCookieValue("form_" . $index,$this->Phone);
		}
	}

    function ApplyOverlayInputValues($_parent,$_changed = false)
    {
        global $INPUTS,$GROUPS;
        $group = $GROUPS[$this->DesiredChatGroup];
        foreach($INPUTS as $index => $input)
        {
            $changed = false;
            if($input->Active && $input->Custom)
            {
                if(isset($_GET["f".$input->Index]))
                {
                    if(!isset($this->Customs[$index]))
                        $this->Customs[$index] = "";
                    $this->Customs[$index] = getOParam("f".$input->Index,$this->Customs[$index],$changed);
                    if($input->Cookie && $input->Type != "File")
                        setCookieValue("cf_".$index,$this->Customs[$index]);
                }
            }
            else
            {
                $value = "";
                if($index == 111 && $INPUTS[111]->IsServerInput())
                    $value = $_parent->Fullname = $this->Fullname = $group->GetServerInput($INPUTS[111],true,$this->Fullname,$changed);
                if($index == 112 && $INPUTS[112]->IsServerInput())
                    $value = $_parent->Email = $this->Email = $group->GetServerInput($INPUTS[112],true,$this->Email,$changed);
                if($index == 113 && $INPUTS[113]->IsServerInput())
                    $value = $_parent->Company = $this->Company = $group->GetServerInput($INPUTS[113],true,$this->Company,$changed);
                if($index == 114 && $INPUTS[114]->IsServerInput())
                    $value = $_parent->Question = $this->Question = $group->GetServerInput($INPUTS[114],true,$this->Question,$changed);
                if($index == 116 && $INPUTS[116]->IsServerInput())
                    $value = $_parent->Phone = $this->Phone = $group->GetServerInput($INPUTS[116],true,$this->Phone,$changed);
                if($input->Cookie && $input->Type != "File" && $changed && !empty($value))
                    setCookieValue("form_".$index,$value);
            }
            if($changed)
                $_changed = true;
        }
        return $_changed;
    }
	
	function CreateChat($_internalUser, $_visitor, $_host=false, $custom="", $etpl="", $_customsInTranscript=true, $_externalSelf=true, $pdm=null)
	{
        global $CONFIG;
        if((!empty($CONFIG["gl_sfc"]) && Visitor::CreateSPAMFilter($this->UserId)) || empty($this->ChatId))
            return;

        UserGroup::PersistentJoin($this->UserId, $this->SystemId);

		$this->InternalUser = $_internalUser;
        if(!empty($this->InternalUser))
		    $this->InternalUser->SetLastChatAllocation();
		$this->SetStatus(CHAT_STATUS_WAITING);
		initData(array("INPUTS"));
	    queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`jtime`,`status`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($this->InternalUser->SystemId)."',".time().",".(($_host) ? 0 : 1).");");
		
        $this->CreateArchiveEntry($_internalUser, $_visitor, $custom, $etpl, $_customsInTranscript, $pdm);

		if($_internalUser->IsBot)
		{
			define("CALLER_SYSTEM_ID",$_internalUser->SystemId);
			$this->InternalActivate();
			$this->ExternalActivate();
			$this->SetStatus(CHAT_STATUS_ACTIVE);
		}
		else if(!empty($_internalUser->AppDeviceId) && $_internalUser->AppBackgroundMode)
        {
            $name = (!empty($this->Fullname)) ? $this->Fullname : getNoName($this->UserId.getIP());
            $_internalUser->AddPushMessage($this->ChatId, $this->SystemId, $name, 0);
        }

		if(!empty($_GET["acid"]))
		{
			$pchatid = base64UrlDecode($_GET["acid"]);
			$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `chat_id`='".DBManager::RealEscape($pchatid)."' AND (`exit` > ".(time()-30)." OR `exit`=0) LIMIT 1;");
			if($result && DBManager::GetRowCount($result) == 1)
			{
				$row = DBManager::FetchArray($result);
				if(empty($row["waiting"]))
					$this->RepostChatHistory(2,$pchatid,$this->InternalUser->SystemId,0,0,$this->UserId."~".$this->UserId."_OVL",$this->ChatId,$this->SystemId,true,false,$_externalSelf);
			}
		}
	}

    function CreateArchiveEntry($_internalUser, $_visitor, $custom="", $etpl="", $_customsInTranscript=true, $pdm=null)
    {
        global $CONFIG,$INPUTS,$GROUPS,$LZLANG;
        if($this->ArchiveCreated)
            return;

        if($INPUTS[111]->Active)
            $custom .= strip_tags($INPUTS[111]->Caption) . " %efullname%\r\n";
        if($INPUTS[112]->Active)
            $custom .= strip_tags($INPUTS[112]->Caption) . " %eemail%\r\n";
        if(!empty($this->Company) && $INPUTS[113]->Active)
            $custom .= strip_tags($INPUTS[113]->Caption) . " " . trim($this->Company) . "\r\n";
        if(!empty($this->Question) && $INPUTS[114]->Active)
            $custom .= strip_tags($INPUTS[114]->Caption) . " " . trim($this->Question) . "\r\n";
        if(!empty($this->Phone) && $INPUTS[116]->Active)
            $custom .= strip_tags($INPUTS[116]->Caption) . " " . trim($this->Phone) . "\r\n";
        if(!empty($this->ChatVoucherId))
            $custom .= strip_tags($LZLANG["client_voucher_id"]) . " " . trim($this->ChatVoucherId) . "\r\n";

        $customs = array();
        if(is_array($this->Customs))
            foreach($this->Customs as $cind => $value)
                if($INPUTS[$cind]->Active && $INPUTS[$cind]->Custom)
                {
                    $customs[$INPUTS[$cind]->Name] = $value;
                    if(!isset($GROUPS[$this->DesiredChatGroup]->ChatInputsHidden[$cind]) && $_customsInTranscript)
                    {
                        if($INPUTS[$cind]->Type == "CheckBox")
                            $custom .= strip_tags($INPUTS[$cind]->Caption). " " . ((!empty($value)) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->") . "\r\n";
                        else if($INPUTS[$cind]->Type == "ComboBox")
                            $custom .= strip_tags($INPUTS[$cind]->Caption). " " . $INPUTS[$cind]->GetClientValue($value) . "\r\n";
                        else
                            $custom .= strip_tags($INPUTS[$cind]->Caption). " " . $value . "\r\n";
                    }
                }

        $tsData = array("","");
        if(!empty($GROUPS[$this->DesiredChatGroup]->PredefinedMessages))
        {
            $pdm = getPredefinedMessage($GROUPS[$this->DesiredChatGroup]->PredefinedMessages,$_visitor->Language);
            if(!empty($pdm->EmailChatTranscriptBodyPlaintext))
                $tsData[0] = $pdm->EmailChatTranscriptBodyPlaintext;
            if(!empty($pdm->EmailChatTranscriptBodyHTML))
                $tsData[1] = $pdm->EmailChatTranscriptBodyHTML;
        }

        for($i=0;$i<count($tsData);$i++)
        {
            $tsData[$i] = str_replace("%chat_id%",$this->ChatId,$tsData[$i]);
            $tsData[$i] = str_replace("%details%",$custom,$tsData[$i]);
            $tsData[$i] = str_replace("%external_name%","%efullname%",$tsData[$i]);
            $tsData[$i] = str_replace("%external_email%","%eemail%",$tsData[$i]);
            $tsData[$i] = str_replace("%external_company%",$this->Company,$tsData[$i]);
            $tsData[$i] = str_replace("%external_phone%",$this->Phone,$tsData[$i]);
            $tsData[$i] = str_replace("%question%",$this->Question,$tsData[$i]);

            $tsData[$i] = $GROUPS[$this->DesiredChatGroup]->TextReplace($tsData[$i],$_visitor->Language);
            if($this->InternalUser)
                $tsData[$i] = $this->InternalUser->TextReplace($tsData[$i]);
            $tsData[$i] = $_visitor->TextReplace($tsData[$i]);
            $tsData[$i] = configTextReplace($tsData[$i]);
        }

        $subject = ($pdm != null) ? $pdm->SubjectChatTranscript : "";
        $subject = getSubject($subject,$this->Email,$this->Fullname,$this->DesiredChatGroup,$this->ChatId,$this->Company,$this->Phone,getIP(),$this->Question,$GROUPS[$this->DesiredChatGroup]->GetDescription($_visitor->Language),$this->Customs);
        $internal = ($_internalUser != null && $_internalUser->IsBot) ? $_internalUser->SystemId : "";

        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
        if($result && DBManager::GetRowCount($result) == 0)
        {
            if($CONFIG["gl_adct"] == 1 || (!empty($CONFIG["gl_rm_chats_time"]) || empty($CONFIG["gl_rm_chats"])))
            {
                $url = Visitor::GetLastURLFromVisitor($this->UserId);
                queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` (`time`,`endtime`,`closed`,`chat_id`,`external_id`,`fullname`,`internal_id`,`group_id`,`area_code`,`html`,`plaintext`,`transcript_text`,`transcript_html`,`email`,`company`,`iso_language`,`iso_country`,`host`,`ip`,`gzip`,`transcript_sent`,`transcript_receiver`,`question`,`customs`,`subject`,`voucher_id`,`ref_url`) VALUES ('".DBManager::RealEscape($this->FirstActive)."',0,0,'".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($this->UserId)."','','".DBManager::RealEscape($internal)."','','".DBManager::RealEscape($this->Code)."','','','".DBManager::RealEscape($tsData[0])."','".DBManager::RealEscape($tsData[1])."','','','".DBManager::RealEscape($_visitor->Language)."','".DBManager::RealEscape($_visitor->GeoCountryISO2)."','".DBManager::RealEscape($_visitor->Host)."','".DBManager::RealEscape($_visitor->IP)."',0,0,'".DBManager::RealEscape($this->Email)."','','".DBManager::RealEscape(@serialize($customs))."','".DBManager::RealEscape($subject)."','".DBManager::RealEscape($this->ChatVoucherId)."','".DBManager::RealEscape($url)."');");
            }
            $this->ArchiveCreated = true;
            ChatRequest::AcceptAll($this->UserId);
        }
    }

	function RepostChatHistory($_caller,$_chatId,$_internalSystemId,$_from=0,$_last=0,$_receiverGroup="",$_targetChatId="",$_targetReceiverGroup="",$_external=false,$_botonly=false,$_externalSelf=true)
	{
		global $INTERNAL;
		
		if(empty($_receiverGroup))
			$_receiverGroup = $this->SystemId;
			
		if(!empty($INTERNAL[$_internalSystemId]->Reposts[$this->SystemId]))
			$_from = $INTERNAL[$_internalSystemId]->Reposts[$this->SystemId];
			
		if(empty($_targetChatId))
			$cidcrit = (!empty($_chatId)) ? " `chat_id` != '".DBManager::RealEscape($_chatId)."' AND" : "";
		else
			$cidcrit = (!empty($_chatId)) ? " `chat_id` = '".DBManager::RealEscape($_chatId)."' AND" : "";
			
		$reccrit = ($_external) ? "" : " AND `received`=1";
		$result = queryDB(true,$d = "SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE".$cidcrit." `repost`=0".$reccrit." AND `receiver_group`='".DBManager::RealEscape($_receiverGroup)."' AND `time`>".$_from." GROUP BY `id`;");

		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if($_botonly)
					if(!(isset($INTERNAL[$row["receiver_original"]]) && $INTERNAL[$row["receiver_original"]]->IsBot) && !(isset($INTERNAL[$row["sender"]]) && $INTERNAL[$row["sender"]]->IsBot))
						continue;

				$post = new Post(getId(32),$row["sender"],$_internalSystemId,$row["text"],$row["time"],(empty($_targetChatId) ? $row["chat_id"] : $_targetChatId),$row["sender_name"]);
				$post->Translation = $row["translation"];
				$post->ReceiverOriginal = $row["receiver_original"];
				$post->TranslationISO = $row["translation_iso"];
				$post->ReceiverGroup = (empty($_targetReceiverGroup)) ? $row["receiver_group"] : $_targetReceiverGroup;
				$post->Repost = true;
				$post->Save(array(0=>$row["micro"],1=>$row["time"]));
				$_last = max($_last,$row["time"]);
				
				if($_external && $_externalSelf)
				{
					$post->Id = getId(32);
					$post->Receiver = $_targetReceiverGroup;
					$post->Save(array(0=>$row["micro"],1=>$row["time"]));
				}
			}
		$INTERNAL[$_internalSystemId]->Reposts[$this->SystemId] = max($_last,$_from);
	}
	
	function PostsReceived($_sender)
	{
		$result = queryDB(true,"SELECT COUNT(*) as `pcount`,SUM(received) as `rcount` FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `sender`='".DBManager::RealEscape($_sender)."' AND `receiver`='".DBManager::RealEscape($this->SystemId)."' AND `repost`=0");
		if($result)
			while($row = DBManager::FetchArray($result))
				return $row["pcount"]+$row["rcount"];
		return true;
	}
	
	function GetLastInvitationSender()
	{
		$result = queryDB(true,"SELECT `sender_system_id` FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` DESC LIMIT 1");
		if($result)
			while($row = DBManager::FetchArray($result))
				return $row["sender_system_id"];
		return null;
	}
	
	function CloseChat($_reason=0)
	{
		$this->ExternalClose();
		$this->Closed=true;
	}
	
	function CloseWindow()
	{
		$this->ExternalClose();
		$this->Destroy();
	}
	
	function Save()
	{
		global $CONFIG;

        if(empty($this->UserId))
            return;

		$_new = (func_num_args() > 0) ? func_get_arg(0) : false;
		if($_new)
		{
			$this->FirstCall = true;
			$this->Status = CHAT_STATUS_OPEN;
		}

        if(empty($this->ChatId) && empty($CONFIG["gl_save_op"]))
            $this->DesiredChatPartner = "";

		if(empty($this->FirstActive))
			$this->FirstActive = time();

		if($this->FirstCall)
			queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_CHATS."` (`visitor_id` ,`browser_id` ,`visit_id` ,`priority`,`fullname` ,`email` ,`company` , `phone`, `call_me_back`, `typing` ,`area_code` ,`first_active` ,`last_active` ,`request_operator` ,`request_group` ,`question` ,`customs`, `chat_ticket_id`, `queue_posts`) VALUES ('".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape($this->Priority)."','".DBManager::RealEscape($this->Fullname)."','".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape($this->Company)."','".DBManager::RealEscape($this->Phone)."',".DBManager::RealEscape(($this->CallMeBack) ? 1 : 0).",0,'".DBManager::RealEscape($this->Code)."','".DBManager::RealEscape($this->FirstActive)."','".DBManager::RealEscape($this->LastActive)."','".DBManager::RealEscape($this->DesiredChatPartner)."','".DBManager::RealEscape($this->DesiredChatGroup)."','".DBManager::RealEscape($this->Question)."','".DBManager::RealEscape(serialize($this->Customs))."','".DBManager::RealEscape($this->ChatVoucherId)."','".DBManager::RealEscape(serialize($this->QueuedPosts))."');");
        else
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `typing`='".DBManager::RealEscape(($this->Typing)?1:0)."',`queue_message_shown`='".DBManager::RealEscape(($this->QueueMessageShown)?1:0)."',`archive_created`='".DBManager::RealEscape(($this->ArchiveCreated)?1:0)."',`customs`='".DBManager::RealEscape(serialize($this->Customs))."',`queue_posts`='".DBManager::RealEscape(serialize($this->QueuedPosts))."',`request_operator`='".DBManager::RealEscape($this->DesiredChatPartner)."',`chat_ticket_id`='".DBManager::RealEscape($this->ChatVoucherId)."',`request_group`='".DBManager::RealEscape($this->DesiredChatGroup)."',`last_active`='".DBManager::RealEscape(time())."',`email`='".DBManager::RealEscape($this->Email)."' WHERE `browser_id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");

        parent::Save();
		if(count($this->History) == 0)
		{
            $url = Visitor::GetLastURLFromVisitor($this->UserId);
            if(empty($url))
			    $this->History[0] = new HistoryUrl(LIVEZILLA_URL . FILE_CHAT,$this->Code,$CONFIG["gl_site_name"],"",$this->FirstActive);
            else
                $this->History[0] = new HistoryUrl($url,"","","",$this->FirstActive);

			$this->History[0]->Save($this->BrowserId,true);
		}
	}
	
	function SaveLoginData()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `call_me_back`='".DBManager::RealEscape(($this->CallMeBack)?1:0)."',`customs`='".DBManager::RealEscape(serialize($this->Customs))."',`company`='".DBManager::RealEscape($this->Company)."',`phone`='".DBManager::RealEscape($this->Phone)."',`question`='".DBManager::RealEscape($this->Question)."',`email`='".DBManager::RealEscape($this->Email)."',`fullname`='".DBManager::RealEscape($this->Fullname)."',`request_operator`='".DBManager::RealEscape($this->DesiredChatPartner)."',`last_active`='".DBManager::RealEscape(time())."',`request_group`='".DBManager::RealEscape($this->DesiredChatGroup)."' WHERE `browser_id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
		parent::SaveLoginData();
	}
	
	function Destroy()
	{
		parent::Destroy();
	}
	
	function InternalDecline($_internal,$remopcount=0)
	{
		if(!isset($this->Members[$_internal]))
			return;
			
		foreach($this->Members as $member)
			if(empty($member->Left))
				$remopcount++;

        if($this->Activated)
            return;

		queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `declined`=1,`dtime`=".time().",`ltime`=".time()." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internal)."' LIMIT 1;");
		if($remopcount==1 || !isset($this->Members[$_internal]))
			$this->UpdateUserStatus(false,false,true,false,false);
		else if(count($this->Members)>1 && isset($this->Members[$_internal]) && $this->Members[$_internal]->Status==0)
			foreach($this->Members as $sysid => $member)
				if($_internal != $sysid)
				{
					$this->SetHost($sysid);
					break;
				}
	}
	
	function InternalClose()
	{
		$this->UpdateUserStatus(false,true,false,false,false);
	}
	
	function InternalActivate()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `time`='".DBManager::RealEscape(time())."' WHERE `closed`=0 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
		$this->UpdateUserStatus(true,false,false,false,false);
	}
	
	function ExternalActivate()
	{
		$this->UpdateUserStatus(false,false,false,true,false);
	}
		
	function ExternalClose()
	{
		$this->UpdateUserStatus(false,false,false,false,true);
	}
	
	function UpdateUserStatus($_internalActivated,$_internalClosed,$_internalDeclined,$_externalActivated,$_externalClose)
	{
		if(!empty($this->ChatId))
		{
			$this->Status = ($_externalClose || $_internalDeclined || $_internalClosed) ? CHAT_CLOSED : $this->Status;
			if($_internalActivated)
			{
				queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `internal_active`='1',`allocated`='".DBManager::RealEscape(time())."' WHERE `internal_active`=0 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
				if(DBManager::GetAffectedRowCount() == 1)
				{
					queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0 WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."';");
					queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=9,`ltime`=".time().",`jtime`=0 WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`!='".DBManager::RealEscape(CALLER_SYSTEM_ID)."' AND `status`<=1;");
				}
			}
			else
			{
				if($_externalClose && empty($this->InternalClosed))
					$update = "`external_close`='1',`exit`='".DBManager::RealEscape(time()+1)."'";
				else if($_externalClose && !empty($this->InternalClosed))
					$update = "`external_close`='1'";
				else if($_internalClosed && empty($this->InternalClosed))
					$update = "`internal_closed`='1',`exit`='".DBManager::RealEscape(time()+1)."'";
				else if($_internalDeclined && empty($this->InternalDeclined))
					$update = "`internal_declined`='1'";
				else
					$update = "`external_active`='1'";
					
				if(($_internalClosed || $_externalClose) && !empty($this->AllocatedTime))
				{
                    UserGroup::RemoveNonPersistantMember($this->SystemId);
					$params = $this->CalculateChatResponseTime();
					$update .= ",`response_time`=" . $params[0] . ",`chat_posts`=" . $params[1];
				}
				queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET ".$update." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
			}
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `endtime`=".$this->LastActive.((!empty($this->AllocatedTime)) ? (",`time`=" . $this->AllocatedTime) : "")." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
		}
		
		if(!empty($this->ChatVoucherId))
		{
			$ticket = new CommercialChatVoucher(null,$this->ChatVoucherId);
			$ticket->UpdateVoucherChatTime(0);
		}
	}
	
	function CalculateChatResponseTime($start=0,$postcount=0)
	{
		$durations = array();
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' ORDER BY `time` ASC;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if(empty($start) && strpos($row["sender"],"~") !== false)
					$start = max($this->AllocatedTime,$row["time"]);
				else if(strpos($row["sender"],"~") === false)
				{
					$postcount++;
					if(!empty($start))
					{
						$durations[] = $row["time"]-$start;
						$start = 0;
					}
				}
			}
		if(count($durations) > 0)
			return array(0=>floor(array_sum($durations) / count($durations)),1=>$postcount);
		else
			return array(0=>0,1=>$postcount);
	}

    function IsMaxWaitingTime($_queue=false)
    {
        global $CONFIG;
        if(!$_queue)
        {
            if(!empty($CONFIG["gl_mcwt"]) && $this->Status == CHAT_STATUS_WAITING && is_array($this->Members))
                foreach($this->Members as $member)
                    if((time()-$member->Joined) > $CONFIG["gl_mcwt"])
                        return true;
        }
        else
        {
            if(!empty($CONFIG["gl_mqwt"]) && (time()-$this->FirstActive) > ($CONFIG["gl_mqwt"]*60))
                return true;
        }
        return false;
    }

    function GetForwards()
    {
        $list = array();
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `target_group_id`='". DBManager::RealEscape($this->DesiredChatGroup)."' AND `visitor_id`='". DBManager::RealEscape($this->UserId)."' AND `browser_id`='". DBManager::RealEscape($this->BrowserId)."' ORDER BY `created` ASC;");
        while($row = DBManager::FetchArray($result))
            $list[] = new Forward($row);
        return $list;
    }

    function GetMaxWaitingTimeAction($_queue=false)
    {
        global $CONFIG;
        if($this->IsMaxWaitingTime($_queue))
        {
            if(!empty($CONFIG["gl_mcwf"]))
                return "FORWARD";
            else
                return "MESSAGE";
        }
        return false;
    }

    function FindOperator($_user,$_allowBots=false,$_requireBot=false,$_exclude=null,$_closeOnError=true)
    {
        global $ROUTER;
        $ROUTER->TargetGroupId = $this->DesiredChatGroup;
        $ROUTER->PreviousOperatorSystemId = $this->DesiredChatPartner;
        $result = $ROUTER->FindOperator($_user,$_allowBots,$_requireBot,$_exclude);
        $this->DesiredChatPartner = $ROUTER->TargetOperatorSystemId;

        if(!$result && $_closeOnError)
        {
            $this->CloseChat(3);
        }

        if($ROUTER->IsPredefined)
            $this->SetTargetOperator($this->DesiredChatPartner);

        return $result;
    }

    function CreateAutoForward($_user)
    {
        global $ROUTER,$CONFIG;
        $this->LoadForward(false,false);
        if(!($this->Forward != null && !$this->Forward->Processed))
        {
            $allForwards = $this->GetForwards();
            $targets = array();
            $this->FindOperator($_user,false,false,array($this->DesiredChatPartner=>$this->DesiredChatPartner),false);
            $isTargetAvailable = (count($ROUTER->OperatorsAvailable)>=2 || (count($ROUTER->OperatorsAvailable)==1 && !empty($this->DesiredChatPartner) && !isset($ROUTER->OperatorsAvailable[$this->DesiredChatPartner])));
            if($isTargetAvailable)
            {
                $forwardedToCount = array();
                foreach($ROUTER->OperatorsAvailable as $opsysId => $ccount)
                {
                    $lastForwardToTime = $ccount;
                    foreach($allForwards as $forward)
                    {
                        if($forward->TargetSessId == $opsysId)
                        {
                            $lastForwardToTime = max($forward->Created,$lastForwardToTime);
                            if(!isset($forwardedToCount[$opsysId]))
                                $forwardedToCount[$opsysId] = 0;
                            $forwardedToCount[$opsysId]++;
                        }
                    }
                    $targets[$opsysId] = $lastForwardToTime;
                }

                if(count($forwardedToCount)>0)
                    $forwardedToCount = min($forwardedToCount);
                else
                    $forwardedToCount = 0;

                if(!empty($CONFIG["gl_mcfc"]) && is_numeric($CONFIG["gl_mcfc"]))
                    if($CONFIG["gl_mcfc"] <= $forwardedToCount)
                        return false;

                if(!empty($targets))
                {
                    asort($targets);
                    foreach($targets as $targetsysid => $time)
                    {
                        if($targetsysid != $this->DesiredChatPartner)
                        {
                            $forward = new Forward($this->ChatId,$this->DesiredChatPartner);
                            $forward->InitiatorSystemId = $this->DesiredChatPartner;
                            $forward->ReceiverUserId = $this->UserId;
                            $forward->ReceiverBrowserId = $this->BrowserId;
                            $forward->TargetSessId = $targetsysid;
                            $forward->TargetGroupId = $this->DesiredChatGroup;
                            $forward->Invite = false;
                            $forward->Auto = true;
                            $forward->Save();
                            Chat::Destroy($this->ChatId);
                            return true;
                        }
                    }
                }
            }
        }
        return true;
    }

    function ShowQueueInformation($_visitor,$_chatPosition,$_chatWaitingTime,$_html)
    {
        $_visitor->AddFunctionCall("lz_chat_show_queue_position(".$_chatPosition.",".min($_chatWaitingTime,30).",'".base64_encode($_html)."');",false);
    }

    function ShowGroupQueueInformation($_visitor,$_shown)
    {
        global $GROUPS;
        $pdm = getPredefinedMessage($GROUPS[$this->DesiredChatGroup]->PredefinedMessages,($_visitor != null) ? $_visitor->Language : "");
        if($pdm != null && !empty($pdm->QueueMessage) && (time()-$this->FirstActive) > $pdm->QueueMessageTime && !$_shown)
        {
            $message = $GROUPS[$this->DesiredChatGroup]->TextReplace($pdm->QueueMessage,$_visitor->Language);
            $message = $_visitor->TextReplace($message);
            $message = $this->TextReplace($message);
            $message = configTextReplace($message);
            $this->QueueMessageShown = true;
            return $message;
        }
        return "";
    }

    function TextReplace($_text)
    {
        $_text = parent::TextReplace($_text);
        $_text = str_replace(array("%chat_id%","%CHATID%"),$this->ChatId,$_text);
        return $_text;
    }

    static function FromCache($_uid,$_bid)
    {
        global $CM,$VISITOR;
        if(!empty($CM))
        {
            initData(array("VISITOR"));
            if(isset($VISITOR[$_uid]))
            {
                foreach($VISITOR[$_uid]->Browsers as $browser)
                {
                    if($browser->BrowserId == $_bid)
                    {
                        return $browser;
                    }
                }
            }
        }
        $br = new VisitorChat($_uid,$_bid);
        $br->Load();
        return $br;
    }

    public static function GetRelatedChatVouchers($_groupId,$_ticket)
    {
        global $CONFIG,$GROUPS;
        $vouchers = array();
        initData(array("DBCONFIG"));
        $result = queryDB(true,$d = "SELECT *,`t1`.`id` AS `voucherid` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`id`='".DBManager::RealEscape($_ticket->Id)."' OR (`t1`.`paid`=1 AND `voided`=0 AND (`t1`.`id`='".DBManager::RealEscape($_ticket->Id)."' OR `t1`.`extends`='".DBManager::RealEscape($_ticket->Id)."' OR `t1`.`id`='".DBManager::RealEscape($_ticket->Extends)."' OR (`t1`.`extends`!='' AND `t1`.`extends`='".DBManager::RealEscape($_ticket->Extends)."'))) ORDER BY `created` DESC;");

        while($row = @DBManager::FetchArray($result))
        {
            if(!empty($CONFIG["db"]["cct"][$row["tid"]]))
            {
                $ticket = new CommercialChatVoucher($row);
                $ticket->CheckForVoid();
                if($_ticket->Id == $ticket->Id || (!$ticket->Voided && in_array($row["tid"],$GROUPS[$_groupId]->ChatVouchersRequired)))
                    $vouchers[] = $ticket;
            }
        }
        return $vouchers;
    }

    public static function GetMatchingVoucher($_groupId,$_voucherid)
    {
        global $CONFIG,$GROUPS;
        initData(array("GROUPS","DBCONFIG"));
        $ticket = new CommercialChatVoucher("",$_voucherid);
        $ticket->Load();

        $result = queryDB(true,$d = "SELECT *,`t1`.`id` AS `voucherid`, SUM(`chat_time_max`) AS `chat_time_max`, SUM(`chat_time`) AS `chat_time`, SUM(`chat_sessions`) AS `chat_sessions`, SUM(`chat_sessions_max`) AS `chat_sessions_max`, MAX(`expires`) AS `expires` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`id`='".DBManager::RealEscape($_voucherid)."' ORDER BY `created` ASC;");

        while($row = @DBManager::FetchArray($result))
        {
            if(!empty($CONFIG["db"]["cct"][$row["tid"]]))
            {
                $ticket = new CommercialChatVoucher($row);
                if(in_array($row["tid"],$GROUPS[$_groupId]->ChatVouchersRequired))
                {
                    return $ticket;
                }
            }
        }
        return null;
    }
}
?>