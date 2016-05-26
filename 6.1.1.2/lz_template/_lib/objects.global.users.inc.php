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

	function __construct($_userid)
   	{
		$this->UserId = $_userid;
   	}
	function AppendPersonalData()
	{

	}
}

class ChatMember
{
	public $SystemId;
	public $Status;
	public $Declined;
	public $Joined;
	public $Left;
	
	function __construct($_systemId, $_status, $_declined=false, $_joined=0, $_left=0)
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
    public $ChatInputsMasked;
    public $ChatInputsCapitalized;
    public $ChatPriorities;
    public $ChatPrioritySleep;
	public $TicketInputsHidden;
	public $TicketInputsMandatory;
    public $TicketInputsMasked;
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
    public $Position = 0;

	function __construct()
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

                    if(isset($row["position"]))
                        $this->Position = $row["position"];
						
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
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."';");
		if($result)
			while($row = DBManager::FetchArray($result))
				$this->Members[$row["user_id"]] = !empty($row["persistent"]);
	}

    function IsOpeningHour($_ignoreBots=true)
    {
        Server::InitDataBlock(array("INTERNAL"));

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
		foreach(Server::$Operators as $internaluser)
			if(in_array($this->Id,$internaluser->Groups) && !$internaluser->IsBot)
			{
				$isex = $internaluser->IsExternal(Server::$Groups, null, array($this->Id), $_ignoreExternal,$_ignoreOpeningHours);
				if($isex && $internaluser->Status < USER_STATUS_OFFLINE)
					return true;
			}
		return false;
	}

    function ContainsBot()
    {
        
        foreach(Server::$Operators as $internaluser)
            if(in_array($this->Id,$internaluser->Groups) && $internaluser->IsBot && !$internaluser->Deactivated)
                return true;
        return false;
    }

	function HasWelcomeManager()
	{
		
		foreach(Server::$Operators as $internaluser)
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
			$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PREDEFINED."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."'");
			if($result)
				while($row = DBManager::FetchArray($result))
					$this->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row["lang_iso"],$row);
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
        if(Is::Defined("DB_CONNECTION"))
        {
            $this->Signatures = array();
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_SIGNATURES."` WHERE `group_id`='".DBManager::RealEscape($this->Id)."'");
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
			$xml = "<v oh=\"".base64_encode($this->IsOpeningHour() ? "1" : "0")."\" id=\"".base64_encode($this->Id)."\" p=\"".base64_encode($this->Position)."\" desc=\"".base64_encode($this->DescriptionArray)."\" created=\"".base64_encode($this->Created)."\"  email=\"".base64_encode($this->Email)."\" pocjs=\"".base64_encode($this->PostJS)."\" prcjs=\"".base64_encode($this->PreJS)."\" mc=\"".base64_encode($this->MaxChats)."\" ps=\"".base64_encode($this->ChatPrioritySleep ? "1" : "0")."\" external=\"".base64_encode($this->IsExternal)."\"  internal=\"".base64_encode($this->IsInternal)."\" standard=\"".base64_encode($this->IsStandard)."\" teo=\"".base64_encode($this->TicketEmailOut)."\" ceo=\"".base64_encode($this->ChatEmailOut)."\" thue=\"".base64_encode($this->TicketHandleUnknownEmails)."\">\r\n";
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
			DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_GROUPS."` (`id`, `name`, `owner`,`dynamic`, `description`, `opening_hours`,`chat_inputs_hidden`, `ticket_inputs_hidden`, `chat_inputs_required`, `ticket_inputs_required`, `chat_inputs_masked`, `ticket_inputs_masked`, `chat_inputs_cap`, `ticket_inputs_cap`,`visitor_filters`,`chat_vouchers_required`,`pre_chat_js`,`post_chat_js`,`ticket_email_in`,`ticket_assignment`,`priorities`,`priority_sleep`,`position`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Descriptions["EN"])."','".DBManager::RealEscape($this->Owner)."',1,'','','','','','','','','','','','','','','','','',0,0);");
		//else
		//	DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_GROUPS."` (`id`, `dynamic`, `description`, `external`, `internal`, `created`, `email`, `opening_hours`, `functions`, `chat_inputs_hidden`, `ticket_inputs_hidden`, `max_chats`, `chat_inputs_required`, `ticket_inputs_required`, `visitor_filters`, `chat_vouchers_required`) VALUES ('".DBManager::RealEscape($this->Id)."',0, '".DBManager::RealEscape(serialize($this->Descriptions))."',1,".(($this->IsInternal) ? 1 : 0).",".$this->Created.",'".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape(serialize($this->OpeningHours))."','".DBManager::RealEscape($this->ChatFunctions)."','a:0:{}','a:0:{}',-1,'a:0:{}','a:0:{}','".DBManager::RealEscape(serialize($this->VisitorFilters))."','".DBManager::RealEscape(serialize($this->ChatVouchersRequired))."');");
	}
	
	function Destroy()
	{
		DBManager::Execute(false,"DELETE FROM `".DB_PREFIX.DATABASE_GROUPS."` WHERE `id` = '".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
	
	function RemoveMember($_id)
	{
        if(strpos($_id,"~")!==false)
        {
            $_id = explode("~",$_id);
            $_id = $_id[0];
        }
		DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `user_id` LIKE '%".DBManager::RealEscape($_id)."%' AND `group_id` = '".DBManager::RealEscape($this->Id)."';");
	    CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

	function AddMember($_id,$_persistant=false)
	{
		DBManager::Execute(true,"REPLACE INTO `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` (`user_id`, `group_id`, `persistent`) VALUES ('".DBManager::RealEscape($_id)."', '".DBManager::RealEscape($this->Id)."', ".(($_persistant) ? "1" : "0").");");
        CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

    function GetWaitingLinks($_question,$_language, $html="", $count=0)
    {
        $knowledgebase = false;

        $answers = ChatAutoReply::GetMatches($this->AutoReplies, $_question, $_language, null, null);
        if(!empty(Server::$Configuration->File["gl_knbq"]) && count($answers) == 0)
        {
            $root = Communication::ReadParameter("ckf","");
            $answers = KnowledgeBase::GetMatches($root,$_question,Visitor::$BrowserLanguage);
            $knowledgebase = true;
            $color = ExternalChat::ReadTextColor();
        }

        if(count($answers)>0)
        {
            foreach($answers as $qa)
            {
                if((!empty($qa->ResourceId) || !empty($qa->Answer)) && $qa->Waiting)
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);
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
                else if($knowledgebase)
                {
                    $ehtml = trim($qa->GetHTML($color,true,false));
                    if(!empty($ehtml))
                        $html .= $ehtml;
                }

                if(++$count > 5)
                    break;
            }
            if(!empty($html))
            {
                $html = "<div id=\"lz_chat_waiting_links\">" . LocalizationManager::$TranslationStrings["client_while_waiting"] . "<ul>" . $html . "</ul></div>";
                return $html;
            }
        }
        return "";
    }

    function GetDescription($_language="")
    {
        if(!empty($_language) && isset($this->Descriptions[strtoupper($_language)]))
            return base64_decode($this->Descriptions[strtoupper($_language)]);
        else if(isset($this->Descriptions[strtoupper(Server::$Configuration->File["gl_default_language"])]))
           return base64_decode($this->Descriptions[strtoupper(Server::$Configuration->File["gl_default_language"])]);
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
        DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `user_id`='".DBManager::RealEscape($_id)."' AND `persistent`=0;");
        if(DBManager::GetAffectedRowCount()>0)
            CacheManager::FlushKey(DATA_CACHE_KEY_GROUPS);
    }

    static function IsDynamicGroup()
    {
        foreach(Server::$Groups as $group)
            if($group->IsDynamic)
                return true;
        return false;
    }

    static function PersistentJoin($_userId,$_systemId,$joined=false)
    {
        if(UserGroup::IsDynamicGroup())
        {
            if(!empty(VisitorChat::$DynamicGroup))
            {
                if(isset(Server::$Groups[VisitorChat::$DynamicGroup]))
                {
                    Server::$Groups[VisitorChat::$DynamicGroup]->AddMember($_systemId,false);
                    Server::$Groups[VisitorChat::$DynamicGroup]->LoadMembers();
                    $joined = true;
                }
            }
            else
            {
                $gToJoin = array();
                $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_GROUP_MEMBERS."` WHERE `persistent`=1 AND `user_id` LIKE '%".DBManager::RealEscape($_userId)."%';");
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
                            Server::$Groups[$gid]->AddMember($_systemId,true);
                            Server::$Groups[$gid]->LoadMembers();
                            $joined = true;
                        }
                }
            }
        }
        return $joined;
    }

    static function RemoveFromAllDynamicGroups($_systemId)
    {
        foreach(Server::$Groups as $group)
        {
            if($group->IsDynamic && isset($group->Members[$_systemId]))
            {
                $group->RemoveMember($_systemId);
            }
        }
    }

    static function ReadParams()
    {
        if(!empty($_GET["eg"]))
            return Communication::GetParameter("eg","",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        if(!empty($_GET[GET_EXTERN_GROUP]))
            return Communication::GetParameter(GET_EXTERN_GROUP,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
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
	public $GroupsAway = array();
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
    public $LDAP = false;

	function __construct()
   	{
        if(func_num_args() == 2)
        {
            $this->LastActive = 0;
            $this->SystemId = func_get_arg(0);
            $this->UserId = func_get_arg(1);
            $this->ExternalChats = array();
            $this->Type = 1;
            $this->VisitorFileSizes = array();
            $this->GroupsHidden = array();
            $this->VisitorStaticReload = array();
            $this->Reposts = array();
            $this->WebsitesUsers = array();
            $this->WebsitesConfig = array();

            if(defined("FILE_CHAT"))
            {
                $this->PictureFile = $this->GetOperatorPictureFile();
                $this->ChatFile = FILE_CHAT . "?intid=".Encoding::Base64UrlEncode($this->UserId)."&amp;mp=true";
            }
        }
   	}
	
	function SignOff($_init=true)
	{
        
        if($_init && ($this->LastActive < (time()-Server::$Configuration->File["timeout_clients"])))
            DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=0,`status`=2,`token`='' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
        else if($_init && $this->Status != USER_STATUS_OFFLINE)
            DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=1,`status`=2,`token`='' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
        else if(!$_init)
            DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `sign_off`=0 WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
    }
	
	function GetAutoReplies($_question,$_chat)
	{
		$_question = str_replace(array("!",",",".","?","=",")","(","-","_",":","#","~","�"),"",strtolower($_question));
        $merged = array_merge($this->AutoReplies,Server::$Groups[$_chat->DesiredChatGroup]->AutoReplies);

        if($this->IsBot)
        {
            $root = Communication::ReadParameter("ckf","");
            $kbresults = KnowledgeBase::GetMatches($root,$_question,Visitor::$BrowserLanguage,true);
            $merged = array_merge($merged,$kbresults);
        }

        $answers = ChatAutoReply::GetMatches($merged, $_question, Visitor::$BrowserLanguage, $_chat, $this);

        if($this->IsBot)
            return $this->FormatBotAutoReplies($_chat,$answers);
        else
            return $this->FormatHumanAutoReplies($answers,$_chat);
	}

    function FormatHumanAutoReplies($_answers,$_chat)
    {
        
        foreach($_answers as $qa)
            if($qa->Send || $qa->SendInactivityTimeInternal > -1 || $qa->SendInactivityTimeExternal > -1)
            {
                $html = "";
                if(!empty($qa->ResourceId))
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);
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

                $html = Server::$Groups[$_chat->DesiredChatGroup]->TextReplace($html,Visitor::$BrowserLanguage);
                $html = $_chat->TextReplace($html);
                $html = $this->TextReplace($html);
                $html = Configuration::Replace($html);
                return $html;
            }
        return null;
    }

    function FormatBotAutoReplies($_chat,$_answers,$_alternate=true,$html="",$single="")
    {
        $tth = ".";
        $bind = " " . LocalizationManager::$TranslationStrings["client_or"] . " ";

        if(!empty(Server::$Groups[$_chat->DesiredChatGroup]) && Server::$Groups[$_chat->DesiredChatGroup]->IsHumanAvailable())
        {
            $resultpc = DBManager::Execute(false,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($_chat->ChatId)."' AND `repost`=0 AND `receiver`='".DBManager::RealEscape($this->SystemId)."';");
            if($this->WelcomeManager && DBManager::GetRowCount($resultpc) >= $this->WelcomeManagerOfferHumanChatAfter)
            {
                $tth = " " . LocalizationManager::$TranslationStrings["client_or"] . " <a class=\"lz_chat_human\" onclick=\"var _this = this;lz_chat_set_talk_to_human(true,true);this.className='';this.style.cursor='wait';setTimeout(function(){_this.style.cursor='default'; },3000);\">".LocalizationManager::$TranslationStrings["client_talk_to_human"]."</a>.";
                $bind = ", ";
            }
        }

        $lm = (empty(Server::$Configuration->File["gl_dtfbc"])) ? ($bind . " <a class=\"lz_chat_mail\" onclick=\"lz_chat_require_leave_message();\">" . LocalizationManager::$TranslationStrings["client_leave_a_message"]. "</a>") : "";
        if(count($_answers)==0)
        {
            return LocalizationManager::$TranslationStrings["client_bot_no_result_found"] . $lm . $tth;
        }
        else if(count($_answers)>0)
        {
            $html .= LocalizationManager::$TranslationStrings["client_your_result"] . "<br>";
            $html .= "<ul class=\"lz_chat_bot_resource\">";
            foreach($_answers as $qa)
            {
                if(!empty($qa->ResourceId))
                {
                    $res = KnowledgeBaseEntry::GetById($qa->ResourceId);
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

        $html = Server::$Groups[$_chat->DesiredChatGroup]->TextReplace($html,Visitor::$BrowserLanguage);
        $html = $_chat->TextReplace($html);
        $html = $this->TextReplace($html);
        $html = Configuration::Replace($html);
        return $html . (($_alternate) ? (LocalizationManager::$TranslationStrings["client_bot_result_found"] . $lm . $tth) : "");
    }
	
	function Save($_create=false)
	{
		if($_create)
			DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_OPERATORS."` (`id`, `system_id`, `fullname`, `email`, `permissions`,`webspace`,`password`, `status`, `level`, `ip`, `typing`, `visitor_file_sizes`, `groups_status`, `reposts`, `groups`, `languages`, `groups_hidden`, `websites_users`, `websites_config`, `mobile_ex`) VALUES ('".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->SystemId)."','".DBManager::RealEscape($this->Fullname)."','".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape($this->PermissionSet)."','".DBManager::RealEscape($this->Webspace)."','".DBManager::RealEscape($this->Password)."', '".DBManager::RealEscape($this->Status)."', '".DBManager::RealEscape($this->Level)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($this->Typing)."', '".DBManager::RealEscape(serialize($this->VisitorFileSizes))."', '".DBManager::RealEscape(serialize($this->GroupsAway))."','".DBManager::RealEscape(serialize($this->Reposts))."','".DBManager::RealEscape(base64_encode(serialize($this->Groups)))."','".DBManager::RealEscape($this->Language)."','YTowOnt9','YTowOnt9','YTowOnt9','a:0:{}');");
		else
		{
			$ca = (count($this->ExternalChats)==0) ? ",`last_chat_allocation`=0" : "";
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `first_active`='".DBManager::RealEscape($this->FirstActive)."',`visitor_file_sizes`='".DBManager::RealEscape(serialize($this->VisitorFileSizes))."',`groups_status`='".DBManager::RealEscape(serialize($this->GroupsAway))."',`reposts`='".DBManager::RealEscape(serialize($this->Reposts))."',`typing`='".DBManager::RealEscape($this->Typing)."',`level`='".DBManager::RealEscape($this->Level)."',`status`='".DBManager::RealEscape($this->Status)."',`ip`='".DBManager::RealEscape($this->IP)."',`lweb`='".DBManager::RealEscape($this->ClientWeb?1:0)."',`lapp`='".DBManager::RealEscape($this->AppClient?1:0)."',`last_active`='".DBManager::RealEscape(time())."'".$ca." WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
	    }
	}

    function Delete()
    {
        DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
    }

    function SetDynamicValues($_row)
    {
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
        $this->FirstActive = ($_row["first_active"]<(time()-Server::$Configuration->File["timeout_clients"]))?time():$_row["first_active"];
        $this->LastChatAllocation = $_row["last_chat_allocation"];
        $this->Status = $_row["status"];
        if($_row["status"] != USER_STATUS_OFFLINE)
            if(!empty($_row["mobile_device_id"]) && !empty($_row["mobile_os"]) && $_row["last_active"]>(time()-(30*86400)) && Server::IsAvailable())
                $this->LastActive = time();
            else if($_row["last_active"]<(time()-Server::$Configuration->File["timeout_clients"]) && !$this->IsBot)
                $this->Status = USER_STATUS_OFFLINE;
        $this->Reposts = @unserialize(@$_row["reposts"]);
        $this->PasswordChangeRequest = !empty($_row["password_change_request"]);
    }

    function SetValues($_row)
    {
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
        $this->FirstCall = ($_row["first_active"]<(time()-Server::$Configuration->File["timeout_clients"]));
        $this->Password = $_row["password"];
        $this->SetDynamicValues($_row);
        $this->Level = $_row["level"];
        $this->IP = $_row["ip"];
        $this->LDAP = !empty($_row["ldap"]);
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

        if(empty($this->GroupsAway))
            $this->GroupsAway = array();
    }
	
	function Load()
	{
		$this->LoadPredefinedMessages();
        $this->LoadSignatures();
	}

    function LoadUnCacheables()
    {
        if(Is::Defined("DB_CONNECTION"))
        {
            $result = DBManager::Execute(false,"SELECT * FROM `".DB_PREFIX.DATABASE_OPERATORS."` WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."';");
            if($result && $row = DBManager::FetchArray($result))
                $this->SetDynamicValues($row);
        }
    }
	
	function SetLastChatAllocation()
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `last_chat_allocation`='".DBManager::RealEscape(time())."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
	}
	
	function SetRepostTime($_systemId,$_time)
	{
		if(empty($this->Reposts[$_systemId]))
			$this->Reposts[$_systemId] = 0;
		$this->Reposts[$_systemId] = max($this->Reposts[$_systemId],$_time);
	}

	function GetExternalObjects()
	{
		$result = DBManager::Execute(false,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t2`.`status`<9 AND `t2`.`user_id`='".DBManager::RealEscape($this->SystemId)."';");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				$chat = new VisitorChat($row);
				if($chat->LastActive<(time()-Server::$Configuration->File["timeout_chats"]) && !(!empty($chat->OperatorId) && Server::$Operators[$chat->OperatorId]->IsBot))
					$chat->ExternalClose();
				else
					$this->ExternalChats[$chat->SystemId] = $chat;
			}
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FILES."` ORDER BY `created` ASC;");
		if($result)
			while($row = DBManager::FetchArray($result))
			{
				$request = new FileUploadRequest($row);
				$rsid = $request->SenderUserId . "~" . $request->SenderBrowserId;
				if(isset($this->ExternalChats[$rsid]) && $this->ExternalChats[$rsid]->ChatId == $row["chat_id"])
				{
					$this->ExternalChats[$rsid]->FileUploadRequest[] = $request;
				}
			}
	}

    function HasAccessToTicket($_ticket)
    {
        return ($this->GetPermission(PERMISSION_TICKETS) != PERMISSION_NONE && ($this->IsInGroup($_ticket->Group) || $this->GetPermission(PERMISSION_TICKETS) == PERMISSION_FULL));
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

    function IsInGroup($_groupId)
    {
        return in_array($_groupId,$this->Groups);
    }

    function IsAvailableForChat()
    {
        return $this->Status < USER_STATUS_OFFLINE && ($this->LastActive > (time()-Server::$Configuration->File["timeout_clients"]));
    }

    function PrioritySleep($_groupId)
    {
        

        if($this->IsBot)
            return false;

        if(isset(Server::$Groups[$_groupId]) && Server::$Groups[$_groupId]->ChatPrioritySleep)
        {
            $myPrio = (isset(Server::$Groups[$_groupId]->ChatPriorities[$this->SystemId])) ? Server::$Groups[$_groupId]->ChatPriorities[$this->SystemId] : 0;
            foreach(Server::$Groups[$_groupId]->ChatPriorities as $systemId => $prio)
            {
                if($systemId == $this->SystemId || Server::$Operators[$systemId]->IsBot)
                    continue;
                if($prio > $myPrio && Server::$Operators[$systemId]->IsAvailableForChat() && Server::$Operators[$systemId]->GetMaxChatAmountStatus(Server::$Groups[$_groupId]) != USER_STATUS_AWAY)
                    return true;
            }
        }
        return false;
    }

    function MobileSleep($externalChat=null)
    {
        if($this->IsBot)
            return false;

        if(!empty($this->MobileExtends))
        {
            foreach($this->MobileExtends as $sid)
                if(isset(Server::$Operators[$sid]) && Server::$Operators[$sid]->LastActive > (time()-Server::$Configuration->File["timeout_clients"]) && Server::$Operators[$sid]->Status != USER_STATUS_OFFLINE)
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
	
	function IsExternal($_groupList, $_exclude = null, $_include = null, $_ignoreExternal = false, $_ignoreOpeningHours = false)
	{
        if($this->IsBot)
            $_ignoreOpeningHours = true;

        if($this->Deactivated)
            return false;

		Server::InitDataBlock(array("GROUPS"));
        if(!empty($this->Groups))
            foreach($this->Groups as $groupid)
                if(isset(Server::$Groups[$groupid]) && !Server::$Groups[$groupid]->IsDynamic)
                    if((((Server::$Groups[$groupid]->IsOpeningHour()||$_ignoreOpeningHours) && !in_array($groupid,$this->GroupsAway) && $this->GetMaxChatAmountStatus(Server::$Groups[$groupid]) != USER_STATUS_AWAY)))
                    {
                        $group_incl = !empty($_include) && in_array($groupid,$_include);
                        $group_excl = (!empty($_exclude) && in_array($groupid,$_exclude)) || (!$group_incl && empty($_exclude) && !empty($_include));
                        if(!empty($_groupList[$groupid]) && ($_groupList[$groupid]->IsExternal || $_ignoreExternal) && ($group_incl || !$group_excl))
                        {
                            $this->InExternalGroup = true;
                            if($this->MobileSleep())
                                return false;

                            if(!empty(VisitorChat::$DynamicGroup))
                                if(isset(Server::$Groups[VisitorChat::$DynamicGroup]) && !isset(Server::$Groups[VisitorChat::$DynamicGroup]->Members[$this->SystemId]))
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
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` AS `t2` ON `t1`.`chat_id`=`t2`.`chat_id` WHERE `t1`.`exit`=0 AND `t1`.`internal_declined`=0 AND `t2`.`status`<9 AND `t2`.`user_id`='".DBManager::RealEscape($this->SystemId)."';");
		if($result)
			return $this->ExternalChatCount = DBManager::GetRowCount($result);
		return $this->ExternalChatCount = 0;
	}
	
	function LoadPredefinedMessages()
	{
		if(DB_CONNECTION)
		{
			$this->PredefinedMessages = array();
			$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_PREDEFINED."` WHERE `internal_id`='".DBManager::RealEscape($this->SystemId)."'");
			if($result)
				while($row = DBManager::FetchArray($result))
					$this->PredefinedMessages[strtolower($row["lang_iso"])] = new PredefinedMessage($row["lang_iso"],$row);
		}
	}

    function LoadSignatures()
    {
        if(DB_CONNECTION)
        {
            $this->Signatures = array();
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_SIGNATURES."` WHERE `operator_id`='".DBManager::RealEscape($this->SystemId)."'");
            if($result)
                while($row = DBManager::FetchArray($result))
                    $this->Signatures[strtolower($row["id"])] = new Signature($row);
        }
    }
	
	function IsVisitorFiltered($_visitor, $urlmatch=false)
	{
        $filtered = empty(Server::$Configuration->File["gl_vmac"]) && !$_visitor->IsInChat(true);
        if(!$filtered && !empty(Server::$Configuration->File["gl_hide_inactive"]))
            $filtered = !$_visitor->IsActivity(null,true,false);

		foreach($this->Groups as $groupid)
		{
			if(empty(Server::$Groups[$groupid]->VisitorFilters))
				return $filtered;
			foreach(Server::$Groups[$groupid]->VisitorFilters as $value => $filter)
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
					if(Communication::GetIP(true) == trim($range) || OperatorRequest::IPMatch(Communication::GetIP(true),trim($range)))
						$match = true;
				if(!$match)
					return false;
			}
            if(!empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]))
            {
                $result = DBManager::Execute(true,"SELECT `id`,`password` FROM `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` WHERE `ip`='".DBManager::RealEscape(Communication::GetIP(true))."' AND `user_id`='".DBManager::RealEscape($this->UserId)."' AND `time` > '".DBManager::RealEscape(time()-86400)."';");
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
        DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `client_system_id`='".DBManager::RealEscape($this->ClientSystemId)."',`token`='".DBManager::RealEscape($this->Token)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
    }

    function ValidateLoginAuthentication()
    {
        if(isset($_POST["p_ldap"]) && !empty(Server::$Configuration->File["gl_ldap"]) && !empty($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]) && Server::$Operators[$this->SystemId]->LDAP)
        {
            require_once(LIVEZILLA_PATH . "_lib/objects.ldap.inc.php");
            $ldapAuth = LDAPManager::ValidateUser($this->UserId,Encoding::Base64UrlDecode($_POST[POST_INTERN_AUTHENTICATION_PASSWORD]));
            if($ldapAuth === true)
            {
                define("VALIDATED_FULL_LOGIN",true);
                return true;
            }
        }
        else if(!empty($this->Password))
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
        if(Is::Defined("DB_CONNECTION"))
            DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` (`id` ,`user_id` ,`ip` ,`time` ,`password`) VALUES ('".DBManager::RealEscape(getId(32))."', '".DBManager::RealEscape($this->UserId)."', '".DBManager::RealEscape(Communication::GetIP(true))."', '".DBManager::RealEscape(time())."', '".DBManager::RealEscape($_password)."');");
    }
	
	function DeleteLoginAttempts()
	{
		if(Is::Defined("DB_CONNECTION"))
			DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_OPERATOR_LOGINS."` WHERE `time`<".(time()-86400)." AND `ip`='".DBManager::RealEscape(Communication::GetIP(true))."' AND `user_id`='".DBManager::RealEscape($this->UserId)."';");
	}
	
	function ChangePassword($_password)
	{
		if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN"))
		{
            Logging::SecurityLog("Operator->ChangePassword",$_password,Is::Defined("CALLER_SYSTEM_ID"));
            $this->PasswordChangeRequest = false;
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `password_change_request`=0,`password`='".DBManager::RealEscape($_password)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
        }
	}
	
	function SetPasswordChangeNeeded()
	{
        if(OperatorRequest::IsValidated() && Is::Defined("VALIDATED_FULL_LOGIN"))
		{
            Logging::SecurityLog("Operator->SetPasswordChangeNeeded","",Is::Defined("CALLER_SYSTEM_ID"));
			$this->PasswordChangeRequest = true;
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `password_change_request`=1 WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1;");
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
		$url = "picture.php?intid=".Encoding::Base64UrlEncode($this->UserId);
		return $url;
	}

	function GetLoginReply($_extern,$_time,$_oocount=0)
	{
		foreach(Server::$Operators as $internaluser)
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
                    DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` WHERE `device_hash`='".DBManager::RealEscape(md5($this->AppDeviceId))."'; ");

                DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OPERATORS."` SET `mobile_os`='".DBManager::RealEscape($cos)."',`mobile_device_id`='".DBManager::RealEscape($cdi)."',`mobile_background`='".DBManager::RealEscape($cbg)."' WHERE `system_id`='".DBManager::RealEscape($this->SystemId)."' LIMIT 1; ");
            }
        }
    }

    function AddPushMessage($_chatId, $_chatPartnerId, $_chatPartnerName, $_pushKey, $_pushValue="")
    {
        if(!empty(Server::$Configuration->File["gl_mpm"]) && ($this->LastActiveDB<(time()-Server::$Configuration->File["poll_frequency_clients"]*3)) && $this->Status != 2)
        {
            if(!defined("IS_PUSH_MESSAGE"))
                define("IS_PUSH_MESSAGE",true);

            $text = ($_pushKey == 0) ? ($_chatPartnerName . " wants to chat with you.") : ($_chatPartnerName . ": " . $_pushValue);
            $text = Str::Cut($text,90,true);
            DBManager::Execute(true,"DELETE FROM `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` WHERE `sent`=1 AND `created` < " . DBManager::RealEscape(time()-120));
            DBManager::Execute(false,"INSERT INTO `".DB_PREFIX.DATABASE_PUSH_MESSAGES."` (`id`, `created`, `device_id`, `device_hash`, `device_os`, `chat_id`, `chat_partner_id`, `push_key`, `push_value`, `IP`) VALUES ('".DBManager::RealEscape(getId(32))."', ".time().", '".DBManager::RealEscape($this->AppDeviceId)."', '".DBManager::RealEscape(md5($this->AppDeviceId))."',  '".DBManager::RealEscape($this->AppOS)."', '".DBManager::RealEscape($_chatId)."', '".DBManager::RealEscape($_chatPartnerId)."', '".DBManager::RealEscape($_pushKey)."', '".DBManager::RealEscape($text)."', '".DBManager::RealEscape(Communication::GetIP())."');");
        }
    }

    function GetInputMaskLevel($_inputIndex,$_chat=true)
    {
        $lvl = 100;
        foreach($this->Groups as $groupid)
            if(isset(Server::$Groups[$groupid]))
            {
                if(Server::$Groups[$groupid]->IsDynamic)
                    continue;
                if($_chat)
                    $lvl = (isset(Server::$Groups[$groupid]->ChatInputsMasked[$_inputIndex])) ? min($lvl,Server::$Groups[$groupid]->ChatInputsMasked[$_inputIndex]) : 0;
                else
                    $lvl = (isset(Server::$Groups[$groupid]->TicketInputsMasked[$_inputIndex])) ? min($lvl,Server::$Groups[$groupid]->TicketInputsMasked[$_inputIndex]) : 0;
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
        foreach(Server::$Operators as $sysId => $intern)
            if($intern->UserId == $_userId)
                return $sysId;
        return null;
    }

    static function GetUserId($_systemId)
    {
        foreach(Server::$Operators as $sysId => $intern)
            if($sysId == $_systemId)
                return $intern->UserId;
        return null;
    }

    static function IPValidate()
    {
        foreach(Server::$Operators as $op)
            if(Communication::GetIP() == $op->IP && !empty($op->IP))
                return true;
        return false;
    }

    static function PrepareConnection()
    {
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
            Server::$Response = new Response();
            if(!isset($_POST[POST_INTERN_ADMINISTRATE]))
            {
                header("Content-Type: text/xml; charset=UTF-8");
                if(!Server::IsAvailable() && $_POST[POST_INTERN_SERVER_ACTION]==INTERN_ACTION_LOGIN && !isset($_POST[POST_INTERN_ACCESSTEST]))
                {
                    Server::$Response->SetValidationError(LOGIN_REPLY_DEACTIVATED);
                    exit(Server::$Response->GetXML());
                }
            }
        }
    }

    static function ReadParams()
    {
        if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]))
            return Communication::GetParameter(POST_EXTERN_REQUESTED_INTERNID,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        else if(!empty($_GET[GET_EXTERN_INTERN_USER_ID]))
            return Communication::GetParameter(GET_EXTERN_INTERN_USER_ID,"",$c,FILTER_SANITIZE_SPECIAL_CHARS,null,32);
        return "";
    }
}

class Visitor extends BaseUser
{
	public $Browsers;
    public $ChatRequests = null;
	public $Response;
	public $IsChat = false;
	public $SystemInfo;
	public $Resolution;
	public $Host;
	public $Visits = 1;
	public $VisitsDay = 1;
	public $VisitId;
	public $VisitLast;
	public $GeoCity;
	public $GeoCountryName;
	public $GeoCountryISO2;
	public $GeoRegion;
	public $GeoLongitude = -522;
	public $GeoLatitude = -522;
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

    public static $IsActiveOverlayChat;
    public static $OpenChatExternal;
    public static $BrowserLanguage;
    public static $PollCount = -1;

	function __construct()
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
                $result = DBManager::Execute(true,"SELECT `entrance`,`visit_id` FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `visit_id`!='".DBManager::RealEscape($this->VisitId)."' AND `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC;");
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
			$result = DBManager::Execute(true,"SELECT *,(SELECT count(*) FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."') as `dcount` FROM `".DB_PREFIX.DATABASE_VISITORS."` WHERE `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC;");
			if(DBManager::GetRowCount($result) >= 1)
				$this->SetDetails(DBManager::FetchArray($result),true);
		}
	}
	
	function SetDetails($_data,$_self)
	{
		$this->FirstCall = ($_data["last_active"] < (time()-((!empty($_data["js"])) ? Server::$Configuration->File["timeout_track"] : 7200)) && !$this->ExtendSession);
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

        if($_self && $_data["last_active"] == $_data["entrance"] && !empty($_data["entrance"]))
            $this->ExitTime = time();

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
		$this->Browsers = array();
        $limiter = (!$_expired) ? " AND `last_active` > ".(time()-Server::$Configuration->File["timeout_track"])." " : "";
        if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `visit_id`='".DBManager::RealEscape($this->VisitId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."'".$limiter."ORDER BY `created` ASC;"))
        {
            $this->FullyLoaded = true;
            while($row = DBManager::FetchArray($result))
            {
                $browser = $this->CreateBrowser($row,$_expired);
                $this->Browsers[count($this->Browsers)] = $browser;
            }
		}
	}

    function CreateBrowser($_row,$_loadHistory=false,$_loadChat=true)
    {
        if(empty($_row["is_chat"]))
        {
            $browser = new VisitorBrowser($_row["id"],$_row["visitor_id"],$_loadHistory);
            $browser->Query = (!empty($_row["query"])) ? CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_QUERIES,"query",$_row["query"]) : "";
            $browser->LastUpdate = $_row["last_update"];
        }
        else
        {
            $browser = new VisitorChat($_row["visitor_id"],$_row["id"],false);
            if($_loadChat)
            {
                $browser->Load();
                if($browser->LastActive<(time()-Server::$Configuration->File["timeout_chats"]) && !empty($browser->OperatorId) && !Server::$Operators[$browser->OperatorId]->IsBot)
                {
                    $browser->CloseChat();
                    $browser->CloseWindow();
                }
            }
        }
        $browser->UserData = new UserData();

        if(isset($_row["h_fullname"]))
            $browser->UserData->SetDetails($_row);

        $browser->Created = $_row["created"];
        $browser->Overlay = !empty($_row["overlay"]);
        $browser->OverlayContainer = !empty($_row["overlay_container"]);
        $browser->LastActive = $_row["last_active"];
        return $browser;
    }

    function LoadComments()
    {
        $this->Comments = array();
        if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_COMMENTS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` ASC;"))
            while($row = DBManager::FetchArray($result))
                $this->Comments[$row["id"]] = array("created"=>$row["created"],"operator_id"=>$row["operator_id"],"comment"=>$row["comment"]);
    }

    function SaveComment($_operatorId,$_comment)
    {
        DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_COMMENTS."` (`id`, `visitor_id`, `created`, `operator_id`, `comment`) VALUES ('".DBManager::RealEscape(getId(32))."','".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($_operatorId)."','".DBManager::RealEscape($_comment)."');");
        $this->ForceUpdate();
    }

    function ForceUpdate()
    {
        if(count($this->Browsers)==0)
        {
            $this->Load();
            $this->LoadBrowsers();
        }
        foreach($this->Browsers as $browser)
            if($browser->LastActive > (time()-Server::$Configuration->File["timeout_track"]))
                $browser->ForceUpdate();
    }

	function IsInChatWith($_operator)
	{
		
		foreach($this->Browsers as $browser)
			if($browser->Type == BROWSER_TYPE_CHAT && $browser->LastActive > (time()-Server::$Configuration->File["timeout_track"]) && !$browser->Closed)
				if(isset($browser->Members[$_operator->SystemId]))
					return true;
		return false;
	}
	
	function KeepAlive()
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `last_active`='".DBManager::RealEscape(time())."' WHERE `id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `entrance` DESC LIMIT 1;");
	}
	
	function Save($_resolution,$_color,$_timezone,$_lat,$_long,$_countryiso2,$_city,$_region,$_geotimezone,$_isp,$_geosspan,$_grid,$_js=true,$_fromCookie=false)
	{
		if(!$this->FirstCall)
		{
			$this->KeepAlive();
		}
		else
		{
			if(!Is::Null(Cookie::Get("visits")) && $this->Visits==1)
				$this->Visits = Cookie::Get("visits")+1;
			Cookie::Set("visits",$this->Visits);
			if(!Is::Null(Cookie::Get("last_visit")))
				$this->VisitLast = Cookie::Get("last_visit");
			Cookie::Set("last_visit",time());

			$this->IP = Communication::GetIP();
    		$this->SystemInfo = ((isset($_SERVER["HTTP_USER_AGENT"])) ? trim($_SERVER["HTTP_USER_AGENT"]) : "");
			
			$localization = LocalizationManager::GetBrowserLocalization();
			$this->Language = $localization[0];
			
			if(!empty($localization[1]))
				$this->GeoCountryISO2 = $localization[1];

			$this->Resolution = (!empty($_resolution) && count($_resolution) == 2 && !empty($_resolution[0]) && !empty($_resolution[1])) ? $_resolution[0] . " x " . $_resolution[1] : "";
			$this->Resolution .= (!empty($_color)) ? " (" . $_color . " Bit)" : "";
			$this->GeoTimezoneOffset = SystemTime::GetLocalTimezone($_timezone);
			$this->GeoResult = 0;

			if(!empty($_geosspan))
				GeoTracking::SpanCreate($_geosspan);

			if(!empty(Server::$Configuration->File["gl_use_ngl"]) && $_js)
			{
                if(!Is::Null(Cookie::Get("geo_data")) && !Is::Null(Cookie::Get(GEO_LATITUDE)))
                {
                    $this->GeoLatitude = Cookie::Get(GEO_LATITUDE);
                    $this->GeoLongitude = Cookie::Get(GEO_LONGITUDE);
                    $this->GeoCountryISO2 = Cookie::Get(GEO_COUNTRY_ISO_2);
                    $this->GeoCity = Cookie::Get(GEO_CITY);
                    $this->GeoRegion = Cookie::Get(GEO_REGION);
                    $this->GeoTimezoneOffset = Cookie::Get(GEO_TIMEZONE);
                    $this->GeoISP = Cookie::Get(GEO_ISP);
                    $_fromCookie = true;
                }
				else if(!empty($_lat) && $_lat > -180)
				{
					Cookie::Set(GEO_LATITUDE,$this->GeoLatitude = $_lat);
					Cookie::Set(GEO_LONGITUDE,$this->GeoLongitude = $_long);
					Cookie::Set(GEO_COUNTRY_ISO_2,$this->GeoCountryISO2 = $_countryiso2);
					Cookie::Set(GEO_CITY,$this->GeoCity = $_city);
					Cookie::Set(GEO_REGION,$this->GeoRegion = $_region);
					Cookie::Set(GEO_TIMEZONE,$this->GeoTimezoneOffset = $_geotimezone);
					Cookie::Set(GEO_ISP,$this->GeoISP = $_isp);
					Cookie::Set("geo_data",time());
				}
				else if(!empty($_lat))
				{
					$this->GeoLatitude = $_lat;
					$this->GeoLongitude = $_long;
				}

				GeoTracking::SpanRemove(false);
				if($_fromCookie)
					$this->GeoResultId = 6;
				else if(!Is::Null($span=GeoTracking::SpanExists()))
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
				
			Server::InitDataBlock(array("COUNTRIES"));
			if(isset(Server::$CountryAliases[$this->GeoCountryISO2]))
				$this->GeoCountryISO2 = Server::$CountryAliases[$this->GeoCountryISO2];

			$detector = new DeviceDetector();
			$detector->DetectBrowser($this->Host);
			if($detector->AgentType == AGENT_TYPE_BROWSER || $detector->AgentType == AGENT_TYPE_UNKNOWN)
			{
				$detector->DetectOperatingSystem($this->Host);
				$bid = $this->GetBrowserId($detector->Browser,$detector->AgentType);
				$oid = $this->GetOSId($detector->OperatingSystem);
				$this->CreateSignature();

                DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITORS."` (`id`, `entrance`,`last_active`, `host`,`ip`,`system`,`browser`, `visits`,`visit_id`,`visit_last`,`resolution`, `language`, `country`, `city`, `region`, `isp`, `timezone`, `latitude`, `longitude`, `geo_result`, `js`, `signature`) VALUES ('".DBManager::RealEscape($this->UserId)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape(time())."', '".DBManager::RealEscape($this->Host)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($oid)."','".DBManager::RealEscape($bid)."', '".DBManager::RealEscape($this->Visits)."', '".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape($this->VisitLast)."', '".DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_RESOLUTIONS,"resolution",$this->Resolution, false, 32))."', '".DBManager::RealEscape(substr(strtoupper($this->Language),0,5))."','".DBManager::RealEscape($this->GeoCountryISO2)."', '".DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_CITIES,"city",$this->GeoCity,false))."', '".DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_REGIONS,"region",$this->GeoRegion,false))."', '".DBManager::RealEscape(CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_ISPS,"isp",utf8_encode($this->GeoISP),false))."', '".DBManager::RealEscape($this->GeoTimezoneOffset)."', '".DBManager::RealEscape($this->GeoLatitude)."', '".DBManager::RealEscape($this->GeoLongitude)."', '".DBManager::RealEscape($this->GeoResultId)."', '".DBManager::RealEscape($_js?1:0)."', '".DBManager::RealEscape($this->Signature)."');");
                if($this->VisitsDay > 1 && DBManager::GetAffectedRowCount() == 1)
                    DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `visit_latest`=0 WHERE `id`='".DBManager::RealEscape($this->UserId)."' AND `visit_id`!='".DBManager::RealEscape($this->VisitId)."';");
			}
			else if(STATS_ACTIVE)
			{
				$this->IsCrawler = true;
				Server::$Statistic->ProcessAction(ST_ACTION_LOG_CRAWLER_ACCESS,array($this->GetCrawlerId($detector->Browser),null));
			}
		}
	}
	
	function ResolveHost()
	{
		$this->Host = Communication::GetHost();
		//if(!empty($this->Host) && $this->Host != $this->IP)
			//DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITORS."` SET `host`='".DBManager::RealEscape($this->Host)."' WHERE `id`='".DBManager::RealEscape($this->UserId)."' AND `visit_latest`=1;");
	}
	
	function CreateSignature($rrow=null)
	{
		$sig = @$_SERVER["HTTP_USER_AGENT"].@$_SERVER["HTTP_ACCEPT"].@$_SERVER["HTTP_ACCEPT_LANGUAGE"].@$_SERVER["HTTP_ACCEPT_CHARSET"];
		$this->Signature = md5(Communication::GetIP() . $sig);

        /*
		if(empty($_GET["ovlc"]) && Is::Null(Cookie::Get("userid")))
		{
			$result = DBManager::Execute(true,"SELECT `t1`.`city`,`t1`.`region`,`t1`.`isp`,`t1`.`timezone`,`t1`.`id`,`t2`.`data_id` FROM `".DB_PREFIX.DATABASE_VISITORS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t2` ON `t1`.`id`=`t2`.`visitor_id` WHERE `t1`.`signature`='".DBManager::RealEscape($this->Signature)."';");
			while($row = DBManager::FetchArray($result))
			{
				$rrow = $row;
				if(!empty($row["fullname"]))
					return $rrow;
			}
			return $rrow;
		}
		return null;
        */
	}
	
	function GetCrawlerId($_crawler)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_CRAWLERS,"crawler",$_crawler);

        /*
		DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_CRAWLERS."` (`id`, `crawler`) VALUES (NULL, '".DBManager::RealEscape($_crawler)."');");
		$row = DBManager::FetchArray(DBManager::Execute(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_CRAWLERS."` WHERE `crawler`='".DBManager::RealEscape($_crawler)."';"));
		return $row["id"];
        */
	}

	function GetOSId($_osname)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_SYSTEMS,"system",$_osname);

        /*
		DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` (`id`, `system`) VALUES (NULL, '".DBManager::RealEscape($_osname)."');");
		$row = DBManager::FetchArray(DBManager::Execute(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` WHERE `system`='".DBManager::RealEscape($_osname)."';"));
		return $row["id"];
        */
	}
	
	function GetBrowserId($_browser)
	{
        return CacheManager::GetDataTableIdFromValue(DATABASE_VISITOR_DATA_BROWSERS,"browser",$_browser);

        /*
		DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` (`id`, `browser`) VALUES (NULL, '".DBManager::RealEscape($_browser)."');");
		$row = DBManager::FetchArray(DBManager::Execute(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` WHERE `browser`='".DBManager::RealEscape($_browser)."';"));
		return $row["id"];
        */
	}

	function UpdateOverlayDetails()
	{
		//$lu = substr(md5(time()),0,2);
		//DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `customs`='".DBManager::RealEscape($this->Browsers[0]->Customs)."',`fullname`='".DBManager::RealEscape($this->Browsers[0]->Fullname)."',`email`='".DBManager::RealEscape($this->Browsers[0]->Email)."',`last_update`='".DBManager::RealEscape($lu)."' WHERE `visit_id`='".DBManager::RealEscape($this->VisitId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND (overlay=1 OR overlay_container=1);");
	}

	function SaveTicket($_group,$_country,$_cmb=false,$_custom=true,$_url="",$changed=false)
	{
        $isSpam = (!empty(Server::$Configuration->File["gl_sft"]) && Visitor::CreateSPAMFilter($this->UserId));
		$ticket = new Ticket(CacheManager::GetObjectId("ticket_id",DATABASE_TICKETS),strtoupper((!empty($this->Language)) ? $this->Language : Server::$Configuration->File["gl_default_language"]));
		$ticket->Messages[0]->Id = $ticket->Id;
		$ticket->Messages[0]->IP = Communication::GetIP();
        $group = Server::$Groups[$_group];

		if(!isTicketFlood() && !$isSpam)
		{
			Server::InitDataBlock(array("INPUTS"));
			$ticket->SenderUserId = $ticket->Messages[0]->SenderUserId = $this->UserId;
			$ticket->Group = $_group;
            $ticket->Channel = ($_cmb) ? 2 : 0;
			$ticket->Messages[0]->Fullname = $this->Browsers[0]->Fullname = $group->GetServerInput(Server::$Inputs[111],false,"",$changed);
			$ticket->Messages[0]->Email = $this->Browsers[0]->Email = $group->GetServerInput(Server::$Inputs[112],false,"",$changed);
			$ticket->Messages[0]->Company = $this->Browsers[0]->Company = $group->GetServerInput(Server::$Inputs[113],false,"",$changed);
			$ticket->Messages[0]->Phone = $this->Browsers[0]->Phone = $group->GetServerInput(Server::$Inputs[116],false,"",$changed);
			$ticket->Messages[0]->Text = $group->GetServerInput(Server::$Inputs[114],false,"",$changed);
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
				foreach(Server::$Inputs as $index => $input)
				{
 					if($input->Active && $input->Custom)
					{
                        $value = $group->GetServerInput($input,false,"",$changed);
						if($input->Type != "File" && !empty($value) && !in_array($index,$group->TicketInputsHidden))
    					    $ticket->Messages[0]->Customs[$index] = $this->Browsers[0]->Customs[$index] = $value;
                        else if($input->Type == "File" && isset($_FILES["p_cf".$index]) && !in_array($index,$group->TicketInputsHidden))
                            $ticket->Messages[0]->Customs[$index] = $this->Browsers[0]->Customs[$index] = $ticket->Messages[0]->AppendPostFile("p_cf".$index,$this->UserId);

					}

                    $ud = new UserData($ticket->Messages[0]->Fullname,$ticket->Messages[0]->Email,$ticket->Messages[0]->Company,$ticket->Messages[0]->Phone,$ticket->Messages[0]->Customs);
                    $ud->Save();
                    $ud->SaveToCookie();
				}

			if(Server::$Configuration->File["gl_adct"] == 1 || !(!empty(Server::$Configuration->File["gl_rm_om"]) && Server::$Configuration->File["gl_rm_om_time"] == 0))
            {
				$ticket->Save();
                $ticket->AutoAssignEditor();
                $ticket->SetLastUpdate(time());
            }

			$this->AddFunctionCall("lz_chat_mail_callback(true);",false);

            if(!empty($_POST[POST_EXTERN_REQUESTED_INTERNID]) && !empty(Server::$Operators[Operator::GetSystemId(Encoding::Base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]))]))
            {
                $TicketEditor = new TicketEditor($ticket->Id);
                $TicketEditor->Editor = Operator::GetSystemId(Encoding::Base64UrlDecode($_POST[POST_EXTERN_REQUESTED_INTERNID]));
                $TicketEditor->Status = 0;
                $TicketEditor->GroupId = $ticket->Group;
                $TicketEditor->Save();
            }

            if(!empty(Server::$Configuration->File["gl_mpm"]))
                foreach(Server::$Operators as $operator)
                    if($operator->IsInPushMessageState())
                        if($operator->HasAccessToTicket($ticket))
                            $operator->AddPushMessage($ticket->Id, $this->SystemId, $ticket->Messages[0]->Fullname, 2, $ticket->Messages[0]->Text);

			return $ticket;
		}
		else
			$this->AddFunctionCall("lz_chat_mail_callback(false);",false);
		return false;
	}
	
	function AddFunctionCall($_call,$_overwrite=false,$_prepend=false)
	{
		if(empty($this->Response))
			$this->Response = "";
        if($_prepend)
            $this->Response = $_call . $this->Response;
		else if($_overwrite)
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
	
	function IsActivity($_browser,$_noBotChats=false,$_fromDatabase=true)
	{
		if($this->IsInChat($_noBotChats,null,$_fromDatabase))
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
        if(!$_fromDatabase)
        {
            foreach($this->Browsers as $browser)
            {
                if($browser->Type == BROWSER_TYPE_CHAT && $browser->LastActive > (time()-Server::$Configuration->File["timeout_chats"]) && ($browser->Status > 0 || $browser->Waiting) && !$browser->Declined)
                {
                    if(!$_noBotChats || (!empty($browser->OperatorId) && !Server::$Operators[$browser->OperatorId]->IsBot) || $browser->Waiting)
                        if(!(!empty($_browser) && $_browser->BrowserId == $browser->BrowserId) || substr($browser->BrowserId, strlen($browser->BrowserId)-strlen("_OVL")) === "_OVL")
                            return true;
                }
            }
        }
        else
        {
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `last_active` > ".(time()-Server::$Configuration->File["timeout_chats"])." AND (`status` > 0 OR `waiting`=1) AND `internal_declined`=0 AND `exit`=0;");
            while($row = DBManager::FetchArray($result))
            {
                if(!$_noBotChats || (!empty(Server::$Operators[$row["request_operator"]]) && !Server::$Operators[$row["request_operator"]]->IsBot) || !empty($row["waiting"]))
                    if(!(!empty($_browser) && $_browser->BrowserId == $row["browser_id"]) || substr($row["browser_id"], strlen($row["browser_id"])-strlen("_OVL")) === "_OVL")
                        return true;
            }
        }
		return false;
	}

    function GetLastChatOperator($_noBotChats=false)
    {
        $result = DBManager::Execute(true,"SELECT `chat_id`,`internal_id` FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `external_id` = '".DBManager::RealEscape($this->UserId)."';");
        while($row = DBManager::FetchArray($result))
            if(!$_noBotChats || (!empty(Server::$Operators[$row["internal_id"]]) && !Server::$Operators[$row["internal_id"]]->IsBot))
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
		if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `closed` ASC,`created` DESC;"))
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
            if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` DESC;"))
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
        Server::InitDataBlock(array("COUNTRIES"));
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        $_text = str_replace("%location_city%",CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_CITIES,"city",$this->GeoCity,false,true),$_text);
        $_text = str_replace("%location_country_iso%",$this->GeoCountryISO2,$_text);
        $_text = str_replace("%location_country%",@Server::$Countries[$this->GeoCountryISO2],$_text);
        $_text = str_replace("%location_region%",CacheManager::GetDataTableValueFromId(DATABASE_VISITOR_DATA_REGIONS,"region",$this->GeoRegion,false,true),$_text);
        return $_text;
    }

    function ReloadGroups($_overlay=false,$_preSelect=true)
    {
        Server::InitDataBlock(array("INTERNAL","FILTERS"));
        $grParam = UserGroup::ReadParams();
        $opParam = Operator::ReadParams();

        if(!empty($grParam) && empty($this->Browsers[0]->DesiredChatGroup))
            $this->Browsers[0]->DesiredChatGroup = $grParam;

        if(!empty($opParam))
            $this->Browsers[0]->DesiredChatPartner = Operator::GetSystemId($opParam);

        $groupbuilder = new GroupBuilder($this->Browsers[0]->DesiredChatGroup,$this->Browsers[0]->DesiredChatPartner);
        $groupbuilder->Generate($this);

        if(!empty($opParam))
            $this->Browsers[0]->DesiredChatPartner = Operator::GetSystemId($opParam);

        $groupsAvailable = To::BoolString(($groupbuilder->GroupAvailable || (isset($_POST[GET_EXTERN_RESET]) && strlen($groupbuilder->ErrorHTML) <= 2)));
        $_preSelect = ($_preSelect) ? Encoding::Base64UrlEncode($this->Browsers[0]->DesiredChatGroup) : "";

        $this->AddFunctionCall("lz_chat_set_groups(" . $groupsAvailable . ",\"" . $groupbuilder->Result . "\" ,". $groupbuilder->ErrorHTML .",'".$_preSelect."');",false,$_overlay);

        if(!$_overlay)
            $this->AddFunctionCall("lz_chat_release(" . $groupsAvailable . ",".$groupbuilder->ErrorHTML.");",false);
    }

    static function CreateSPAMFilter($_userId,$_base64=true)
    {
        if(!empty(Server::$Configuration->File["gl_sfa"]))
        {
            $filterkeys = array(0=>Server::$Configuration->File["gl_sfv"]);
            if(strpos(Server::$Configuration->File["gl_sfv"],",") !== -1)
                $filterkeys = explode(",",Server::$Configuration->File["gl_sfv"]);

            foreach($filterkeys as $fvalue)
            {
                $fvalue = trim($fvalue);
                foreach($_GET as $gvalue)
                {
                    $ivalue = ($_base64) ? Encoding::Base64UrlDecode($gvalue) : $gvalue;
                    if(Is::WildcardMatch($fvalue,$ivalue,true))
                    {
                        Filter::Create(Communication::GetIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
                        return true;
                    }
                }
                foreach($_POST as $pvalue)
                {
                    $ivalue = ($_base64) ? Encoding::Base64UrlDecode($pvalue) : $pvalue;
                    if(Is::WildcardMatch($fvalue,$ivalue,true))
                    {
                        Filter::Create(Communication::GetIP(),$_userId,"AUTO SPAM Filter: " . $fvalue);
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

    static function GetLastURLFromVisitor($_visitorId)
    {
        $result = DBManager::Execute(true,"SELECT `untouched` FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` AS `t2` ON `t1`.`id`=`t2`.`browser_id` WHERE `t1`.`is_chat`=0 AND `t1`.`visitor_id`='".DBManager::RealEscape($_visitorId)."' ORDER BY `t2`.`entrance` DESC LIMIT 1;");
        while($row = DBManager::FetchArray($result))
            return $row["untouched"];
        return "";
    }

    static function Build($_fullList=false,$_sqlwhere="",$_limit="",$_created=0)
    {
        Server::InitDataBlock(array("COUNTRIES"));
        if(!$_fullList && !empty(CacheManager::$ActiveManager) && CacheManager::$ActiveManager->GetData(DATA_CACHE_KEY_VISITORS,Server::$Visitors))
            return count(Server::$Visitors);

        Server::$Visitors = $tvisitors = $tbrowsers = array();

        if(!$_fullList)
            $_sqlwhere = " WHERE `last_active`>".DBManager::RealEscape(time()-Server::$Configuration->File["timeout_track"]);

        $result = DBManager::Execute(true,"SELECT *,`t1`.`id` AS `id` FROM `".DB_PREFIX.DATABASE_VISITORS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_BROWSERS."` AS `t2` ON `t1`.`browser`=`t2`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_CITIES."` AS `t3` ON `t1`.`city`=`t3`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_REGIONS."` AS `t4` ON `t1`.`region`=`t4`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_ISPS."` AS `t5` ON `t1`.`isp`=`t5`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_SYSTEMS."` AS `t6` ON `t1`.`system`=`t6`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_RESOLUTIONS."` AS `t8` ON `t1`.`resolution`=`t8`.`id`".$_sqlwhere." ORDER BY `entrance` ASC".$_limit.";");
        if($result)
        {
            while($row = DBManager::FetchArray($result))
            {
                $fa = $row["entrance"];
                if(isset($tvisitors[$row["id"]]))
                    $fa = min($tvisitors[$row["id"]]->FirstActive,$fa);
                if(!empty(Server::$Countries[$row["country"]]))
                    $row["countryname"] = Server::$Countries[$row["country"]];
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

            if($_fullList)
                $result = DBManager::Execute(true,$d = "SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `created` > ".intval($_created)." ORDER BY `created` ASC;");
            else
                $result = DBManager::Execute(true,$d = "SELECT `t1`.*,`t2`.`h_fullname`,`t2`.`h_email`,`t2`.`h_company`,`t2`.`h_phone`,`t2`.`h_customs`,`t2`.`h_text` FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t2` ON `t1`.`data_id`=`t2`.`id` WHERE `last_active` > ".intval(time()-Server::$Configuration->File["timeout_track"])." ORDER BY `created` ASC;");

            if($result)
                while($row = DBManager::FetchArray($result))
                {
                    if(isset($tvisitors[$row["visitor_id"]]) && ($tvisitors[$row["visitor_id"]]->VisitId == $row["visit_id"] || $_fullList))
                    {
                        $browser = $tvisitors[$row["visitor_id"]]->CreateBrowser($row,false,false);
                        $tbrowsers[$browser->BrowserId] = $browser;
                        $minEntrance = min($minEntrance,$row["created"]);
                    }
                }

            if($_fullList)
            {
                if($result = DBManager::Execute(true,"SELECT `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`browser_id`,`".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`title` as `url_title`,`treftitle`.`title` as `ref_title`,`turldom`.`domain` as `url_dom`,`turlpath`.`path` as `url_path`,`trefdom`.`domain` as `ref_dom`,`trefpath`.`path` as `ref_path`,`entrance`,`params`,`untouched`,`ref_untouched` FROM (SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` ORDER BY `entrance` ASC) AS `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` AS `turl` ON `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`url`=`turl`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` AS `tref` ON `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."_sorted`.`referrer`=`tref`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` AS `trefdom` ON `tref`.`domain`=`trefdom`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` AS `turldom` ON `turl`.`domain`=`turldom`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."` AS `trefpath` ON `tref`.`path`=`trefpath`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_PATHS."` AS `turlpath` ON `turl`.`path`=`turlpath`.`id` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` AS `treftitle` ON `tref`.`title`=`treftitle`.`id`;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row);
            }
            else
            {
                if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE (`status`>0 OR `waiting`=1) ORDER BY `first_active` ASC;"))
                {
                    while($row = DBManager::FetchArray($result))
                    {
                        if(isset($tbrowsers[$row["browser_id"]]) && get_class($tbrowsers[$row["browser_id"]]) == "VisitorChat")
                        {
                            $tbrowsers[$row["browser_id"]]->Status = CHAT_STATUS_OPEN;
                            $tbrowsers[$row["browser_id"]]->LastActive = time();
                            $tbrowsers[$row["browser_id"]]->Members = array();

                            if(empty($row["external_close"]))
                            {
                                $tbrowsers[$row["browser_id"]]->FirstCall = !empty($row["exit"]);
                                $tbrowsers[$row["browser_id"]]->SetValues($row,false);
                            }
                            else
                                $tbrowsers[$row["browser_id"]]->SetValues($row,true);

                            if($tbrowsers[$row["browser_id"]]->Status>CHAT_STATUS_OPEN)
                                $tbrowsers[$row["browser_id"]]->LoadMembers();
                        }
                    }
                }

                if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `entrance` >= ".intval($minEntrance)." ORDER BY `entrance` ASC;"))
                    while($row = DBManager::FetchArray($result))
                        if(isset($tbrowsers[$row["browser_id"]]))
                        {
                            $tbrowsers[$row["browser_id"]]->History[] = new HistoryURL($row,true);
                        }
            }

            foreach($tbrowsers as $i => $browser)
            {
                $tbrowsers[$i]->SetFirstCall(count($browser->History)==0);
                if(isset($tvisitors[$browser->UserId]))
                {
                    if($_fullList && count($browser->History)==0)
                        continue;

                    $tvisitors[$browser->UserId]->Browsers[count($tvisitors[$browser->UserId]->Browsers)] = $browser;
                }
            }

            foreach($tvisitors as $vid => $visitor)
                if(count($visitor->Browsers)>0)
                    Server::$Visitors[$vid] = $visitor;

            if(!$_fullList && !empty(CacheManager::$ActiveManager))
            {
                CacheManager::$ActiveManager->SetData(DATA_CACHE_KEY_VISITORS,Server::$Visitors,true);
            }
        }
        return count($tvisitors);
    }

    static function GetNoName($_basename)
    {
        $mod = 111;
        for ($i = 0; $i < strlen($_basename); $i++)
        {
            $digit = substr($_basename,$i,1);

            if(is_numeric($digit))
            {
                $mod = ($mod + ($mod * (16 + $digit)) % 1000);
                if ($mod % 10 == 0)
                    $mod += 1;
            }
        }
        return substr($mod,strlen($mod)-4,4);
    }

    static function CloseAllOverlays($_visitorId)
    {
        DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` SET `displayed`=1,`closed`=1 WHERE `receiver_user_id`='".DBManager::RealEscape($_visitorId)."';");
    }
}

class VisitorBrowser
{
    public $UserData;
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
    public $FirstActive;
	public $LastUpdate;
    public $LastActive;
	public $Overlay;
	public $OverlayContainer;
    public $UpdateParams = array();
    public $Created;

    private $FirstCall = true;

    function __construct($_browserid,$_userid,$_history=true)
    {
        $this->UserData = new UserData();
        $this->BrowserId = $_browserid;
        $this->UserId = $_userid;
        $this->SystemId = $this->UserId . "~" . $this->BrowserId;

        if($_history)
        {
            $this->LoadHistory();
            $this->FirstCall = (count($this->History)==0);
        }
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
        if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`.`browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."`.`entrance` ASC;"))
            while($row = DBManager::FetchArray($result))
            {
                $hu = new HistoryURL($row, true);
    			$this->History[] = $hu;
            }
	}

	function LoadAlerts()
	{
		if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_ALERTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `accepted` ASC,`created` ASC;"))
			if($row = DBManager::FetchArray($result))
				$this->Alert = new Alert($row);
	}
	
	function LoadWebsitePush()
	{
		if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `displayed` ASC,`accepted` ASC,`declined` ASC,`created` ASC LIMIT 1;"))
			if($row = DBManager::FetchArray($result))
				$this->WebsitePush = new WebsitePush($row);
	}
	
	function LoadOverlayBoxes()
	{
		if($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `displayed` ASC,`created` ASC LIMIT 1;"))
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
					if(Is::WildcardMatch($engine,$parts["host"]))
                    {
						$issearchengine = true;
                    }

					if($issearchengine && $parammatch)
					{
						if(empty($encoding))
							foreach(HistoryUrl::$SearchEngineEncodings as $enc => $eengines)
								foreach($eengines as $eengine)
									if($eengine==$engine)
										$encoding = $enc;
						$this->Query = (empty($encoding)) ? urldecode(trim($kv[1])) : html_entity_decode(@iconv($encoding,"UTF-8",urldecode(trim($kv[1]))), ENT_QUOTES, 'UTF-8');
						
						if(!empty($this->Query) && Is::Null(Cookie::Get("sp")))
							Cookie::Set("sp",$this->Query);

                        $this->UpdateParams["query"] = $this->GetQueryId($this->Query,$_referrer);

						DBManager::Execute(true,$d="UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `query`='".DBManager::RealEscape($this->UpdateParams["query"])."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' LIMIT 1;");
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
		
		$result = DBManager::Execute(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."` (`id`, `query`) VALUES (NULL, '".DBManager::RealEscape($_query)."');");
		if(!$_self && !empty($_query) && !$result && !Is::Null(DBManager::GetErrorCode()) && DBManager::GetErrorCode() != 1062)
			$this->GetQueryId(utf8_encode(urldecode($_query)),$_referrer,$_maxlength,true);

		$row = DBManager::FetchArray(DBManager::Execute(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_QUERIES."` WHERE `query`='".DBManager::RealEscape($_query)."';"));
		return $row["id"];
	}
	
	function ForceUpdate($_write=true)
	{
        $nkey = substr(md5(time()),0,2);

        if($nkey == $this->LastUpdate)
            return;

        $this->LastUpdate = $nkey;

        if(!$_write)
            $this->UpdateParams["last_update"] = $this->LastUpdate;
        else
		    DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_update`='".DBManager::RealEscape($this->LastUpdate)."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
    }

    function LoadUserData()
    {
        $result = DBManager::Execute(true,"SELECT `t2`.* FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_USER_DATA."` AS `t2` ON `t1`.`data_id`=`t2`.`id` WHERE `t1`.`visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `t1`.`id`='".DBManager::RealEscape($this->BrowserId)."';");
        if($result)
            while($row = DBManager::FetchArray($result))
            {

                $this->UserData = new UserData();
                $this->UserData->SetDetails($row);
                return !$this->UserData->IsEmpty();
            }
        return false;
    }

    function ApplyUserData($_write=false)
    {
        if(!$_write)
            $this->UpdateParams["data_id"] = $this->UserData->Save();
        else
            DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `data_id`='".DBManager::RealEscape($this->UserData->Save())."' WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
        $this->UserData->SaveToCookie();
    }
	
	function Save()
	{
        if($this->FirstCall)
            $this->ApplyUserData();
        $nkey = substr(md5(time()),0,2);

		if($this->FirstCall && $res = DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` (`id`, `visitor_id`, `visit_id`, `data_id`, `created`, `last_active`, `last_update`, `is_chat`,`pre_message`,`overlay`,`overlay_container`) VALUES ('".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape($this->UserData->Save())."','".DBManager::RealEscape(time())."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($nkey)."','".DBManager::RealEscape($this->Type)."','',".($this->Overlay?1:0).",".($this->OverlayContainer?1:0).");"))
        {
            $this->LastUpdate = $nkey;
        }
        else if(!$this->FirstCall)
        {
            $this->UpdateParams["visit_id"] = $this->VisitId;

            $fields="";
            foreach($this->UpdateParams as $field => $value)
                $fields .= ",`".$field."`='" . DBManager::RealEscape($value)."'";

            DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_active`=".time().$fields." WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' LIMIT 1;");
        }
    }
	
	function Destroy()
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` SET `last_active`=`last_active`-".DBManager::RealEscape(Server::$Configuration->File["timeout_track"])." WHERE `id`='".DBManager::RealEscape($this->BrowserId)."' LIMIT 1;");
	}
	
    function IsActivity()
    {
        if(count($this->History)==0)
            $this->LoadHistory();
        if(count($this->History) > 0 && $this->History[count($this->History)-1]->Entrance >= (time()-((Server::$Configuration->File["gl_inti"]*60))))
            return true;
        return false;
    }

    function TextReplace($_text)
    {
        
        $_text = str_replace(array("%external_name%","%USERNAME%"),$this->UserData->Fullname,$_text);
        $nameparts = explode(" ",$this->UserData->Fullname);

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

        $_text = str_replace(array("%external_email%","%USEREMAIL%"),$this->UserData->Email,$_text);
        $_text = str_replace(array("%external_company%","%USERCOMPANY%"),$this->UserData->Company,$_text);
        $_text = str_replace("%searchstring%",$this->Query,$_text);
        $_text = str_replace("%external_phone%",$this->UserData->Phone,$_text);
        $_text = str_replace(array("%question%","%USERQUESTION%","%mailtext%"),$this->UserData->Text,$_text);


        foreach(Server::$Inputs as $index => $input)
            if($input->Active && $input->Custom)
            {
                if($input->Type == "CheckBox")
                    $_text = str_replace("%custom".($index)."%",((!empty($this->UserData->Customs[$index])) ? LocalizationManager::$TranslationStrings["client_yes"] : LocalizationManager::$TranslationStrings["client_no"]),$_text);
                else if(!empty($this->UserData->Customs[$index]))
                    $_text = str_replace("%custom".($index)."%",$input->GetClientValue($this->UserData->Customs[$index]),$_text);
                else
                    $_text = str_replace("%custom".($index)."%","",$_text);
            }
            else
                $_text = str_replace("%custom".($index)."%","",$_text);

        return $_text;
    }

    function GetInputData($_inputIndex,$_chat=true)
    {
        $data = array(111=>$this->UserData->Fullname,112=>$this->UserData->Email,113=>$this->UserData->Company,114=>$this->UserData->Text,116=>$this->UserData->Phone);
        if(isset($data[$_inputIndex]))
            $value = $data[$_inputIndex];
        else if(isset($this->UserData->Customs[$_inputIndex]))
            $value = $this->UserData->Customs[$_inputIndex];
        else
            return "";
        if(isset(Server::$Operators[CALLER_SYSTEM_ID]))
        {
            $lvl = Server::$Operators[CALLER_SYSTEM_ID]->GetInputMaskLevel($_inputIndex,$_chat);
            if($lvl > 0)
                return OperatorRequest::MaskData($value,$lvl);
        }
        return $value;
    }

    function GetXML($_chatXML="",$_visitorDetails=null,$_history=false)
    {
        if($_visitorDetails==null)
            $_visitorDetails=array("ka"=>"","waiting"=>"");
        $referrer = ($this->History[0]->Referrer != null) ? " ref=\"".base64_encode($this->History[0]->Referrer->GetAbsoluteUrl())."\"" : "";
        $sstring = (!$this->Overlay) ? " ss=\"".base64_encode($this->Query)."\"" : "";
        $personal = " cname=\"".base64_encode($this->GetInputData(111))."\"";
        $personal .= " cemail=\"".base64_encode($this->GetInputData(112))."\"";
        $personal .= " ccompany=\"".base64_encode($this->GetInputData(113))."\"";
        $personal .= " cphone=\"".base64_encode($this->GetInputData(116))."\"";
        $lastactive = ($_history) ? " l=\"".base64_encode($this->LastActive)."\"" : "";
        if(is_array($this->UserData->Customs))
            foreach($this->UserData->Customs as $index => $value)
                if(Server::$Inputs[$index]->Active && Server::$Inputs[$index]->Custom)
                {
                    $value = (Server::$Inputs[$index]->Type == "Text") ? $this->GetInputData($index) : $value;
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

    function ReplaceLoginDetails($_user,$values="",$keys="",$comma="")
    {
        Server::InitDataBlock(array("INPUTS"));
        foreach(Server::$Inputs as $index => $input)
        {
            $data = ($index!=114) ? $input->GetValue($this) : "";
            $data = (!empty($data)) ? $data : $input->GetServerInput();
            $values .= $comma . $input->GetJavascript($data);
            $keys .= $comma . "'".$index."'";
            $comma = ",";
        }
        $_user->AddFunctionCall("if(lz_chat_data.InputFieldIndices==null)lz_chat_data.InputFieldIndices = new Array(".$keys.");",false);
        $_user->AddFunctionCall("if(lz_chat_data.InputFieldValues==null)lz_chat_data.InputFieldValues = new Array(".$values.");",false);

        return $_user;
    }

    static function FromCache($_uid,$_bid)
    {
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
	public $ArchiveCreated = 0;
	public $Activated;
	public $Closed;
	public $Declined = 0;
	public $InternalActivation;
	public $ExternalActivation;
	public $ExternalClosed;
	public $InternalClosed;
	public $OperatorId;
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
    public $Typing;
    public $Status;
    public $HistoryCounts;
    public $DynamicGroupChat;

    public static $DynamicGroup;
    public static $Router;

	function __construct()
   	{
        $loadParentHistory=true;
		if(func_num_args() == 2)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->FirstCall = true;
			$this->QueuedPosts = array();
		}
        else if(func_num_args() == 3)
        {
            $this->UserId = func_get_arg(0);
            $this->BrowserId = func_get_arg(1);
            $this->FirstCall = false;
            $this->QueuedPosts = array();
            $loadParentHistory = false;
        }
		else if(func_num_args() == 10)
		{
			$this->UserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);

            if(empty($this->UserData))
                $this->UserData = new UserData();

			$this->UserData->Fullname = func_get_arg(2);
			$this->UserData->Email = func_get_arg(3);
			$this->UserData->Company = func_get_arg(4);
			$this->UserData->Text = func_get_arg(5);
            $this->UserData->Customs = func_get_arg(6);

			$this->DesiredChatGroup = func_get_arg(7);
			$this->DesiredChatPartner = func_get_arg(8);
			$this->FirstCall = true;
            $this->UserData->Phone = func_get_arg(9);
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
		parent::__construct($this->BrowserId,$this->UserId,$loadParentHistory);
   	}
	
	function GetParent()
	{
		return parent;
	}

    function SetTranslation($_value)
    {
        DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `translation`='".DBManager::RealEscape($_value)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
    }
	
	function SetCookieGroup()
	{
		if(!empty($this->DesiredChatGroup))
			Cookie::Set("login_group",$this->DesiredChatGroup);
	}

	function SetCallMeBackStatus($_cmb)
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `call_me_back`=".intval($_cmb)." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `call_me_back`=".intval($_cmb)." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function Load()
	{
		$this->Status = CHAT_STATUS_OPEN;
    	$this->LastActive = time();
		$this->Members = array();
        $historyEntry = false;
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `first_active` DESC LIMIT 2;");
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

                if($historyEntry && empty(Server::$Configuration->File["gl_save_op"]))
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
		Server::InitDataBlock(array("INTERNAL"));
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `status`<9 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' ORDER BY `status` DESC, `dtime` DESC;");
		while($row = DBManager::FetchArray($result))
			if(isset(Server::$Operators[$row["user_id"]]))
			{
				$this->Members[$row["user_id"]] = new ChatMember($row["user_id"],$row["status"],!empty($row["declined"]),$row["jtime"],$row["ltime"]);

                if($row["status"] < 2)
					$this->OperatorId = $row["user_id"];
				$this->Declined = $row["dtime"];
			}
	}

    function GetLastOperator()
    {
        if(!empty($this->OperatorId))
            return $this->OperatorId;
        else
        {
            $this->LoadForward(false,false);
            if($this->Forward != null)
                return $this->Forward->SenderSystemId;
        }
        return "";
    }

    function GetTotalWaitingTime(&$_startMarker,&$_endMarker)
    {
        if(!empty($this->Declined))
        {
            $_startMarker = 2;
            $waitingTime = $this->Declined-$this->FirstActive;
        }
        else if($this->InternalActivation)
        {
            $_startMarker = 1;
            $waitingTime = $this->AllocatedTime-$this->FirstActive;
        }
        else
        {
            $_startMarker = 0;
            $waitingTime = $this->LastActive-$this->FirstActive;
        }

        if(($this->InternalActivation && $this->InternalClosed) || $this->Declined)
            $_endMarker = 1;

        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' AND `visit_id`='".DBManager::RealEscape($this->VisitId)."' AND `archive_created`=2 AND `first_active`<".intval($this->FirstActive).";");
        while($row = DBManager::FetchArray($result))
            $waitingTime += $row["last_active"]-$row["first_active"];
        return max($waitingTime,0);
    }

    function GetTotalDuration()
    {
        return ($this->AllocatedTime>0 && $this->LastActive>$this->AllocatedTime) ? $this->LastActive-$this->AllocatedTime : $this->LastActive-$this->FirstActive;
    }
	
	function SetValues($row, $_dataOnly=false)
	{
        if(empty($this->Code))
            $this->Code = $row["area_code"];

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
            $this->HistoryCounts = $row["history"];
            $this->DynamicGroupChat = $row["dgc"];
            $this->QueueMessageShown = !empty($row["queue_message_shown"]);
            $this->Activated = (($this->ExternalActivation && $this->InternalActivation) ? CHAT_STATUS_ACTIVE : (($this->ExternalActivation || $this->InternalActivation) ? CHAT_STATUS_WAITING : CHAT_STATUS_OPEN));
            $this->TranslationSettings = (!empty($row["translation"])) ? explode(",",$row["translation"]) : null;
        }
    }
	
	function SetChatId()
	{
		if(isset($_POST[POST_EXTERN_CHAT_ID]) && $this->Status != CHAT_STATUS_OPEN)
		{
			$this->ChatId = Encoding::Base64UrlDecode($_POST[POST_EXTERN_CHAT_ID]);
		}
		else
		{
			$result = DBManager::Execute(true,"SELECT `chat_id` FROM `".DB_PREFIX.DATABASE_INFO."`");
			$row = DBManager::FetchArray($result);
			$cid = $row["chat_id"]+1;
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_INFO."` SET `chat_id`='".DBManager::RealEscape($cid)."' WHERE `chat_id`='".DBManager::RealEscape($row["chat_id"])."'");
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
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `last_active`='".DBManager::RealEscape(time())."',`first_active`='".DBManager::RealEscape(time())."',`chat_id`='".DBManager::RealEscape($this->ChatId)."' WHERE `exit`=0 AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' ORDER BY `first_active` DESC LIMIT 1;");
		return $this->ChatId;
	}
	
	function SetStatus($_status)
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `last_active`='".DBManager::RealEscape(time())."',`status`='".DBManager::RealEscape($_status)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}

    function UnsetDynamicGroup()
    {
        DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `dgc`='' WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."';");
    }
	
	function SetWaiting($_waiting)
	{
		$this->Waiting=$_waiting;
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `waiting`='".DBManager::RealEscape((($_waiting)?1:0))."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}
	
	function UpdateArchive($_tcemail)
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `transcript_receiver`='".DBManager::RealEscape($_tcemail)."' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
	}
	
	function LoadForward($_checkReceived=true,$_loadInvites=false)
	{
		$this->Forward = null;
		$_checkReceived = ($_checkReceived) ? " AND `received`=0" : "";
		$_loadInvites = (!$_loadInvites) ? " AND `invite`=0" : "";
		$result = DBManager::Execute(false,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE  `closed`=0 AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."'".$_checkReceived.$_loadInvites." ORDER BY `created` DESC LIMIT 1;");
		if($result)
            while($row = DBManager::FetchArray($result))
                $this->Forward = new Forward($row);
	}
	
	function JoinChat($_internalUser,$_invisible=false,$_rePost=false)
	{
        if(!empty($this->ChatId))
        {
            DBManager::Execute(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`jtime`,`status`,`alloc`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($_internalUser)."',".(($_invisible) ? 0 : time()).",".(($_invisible) ? 2 : 1).",0);");
            if(DBManager::GetAffectedRowCount() != 1)
            {
                $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
                if($row = DBManager::FetchArray($result))
                {
                    $jtime = ($_invisible && ($row["status"] == 1 || $row["status"] == 0)) ? "`jtime`" : (($_invisible) ? 0 : time());
                    DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `ltime`=".(($_invisible) ? time() : 0).",`jtime`=".$jtime.",`dtime`=0,`declined`=0,`status`=".(($_invisible) ? 2 : 1)." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
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

		DBManager::Execute(false,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' AND `status`=2 LIMIT 1;");
        if(!empty($this->ChatId))
            DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=9,`ltime`=".time()." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
	}

    function ValidateOperator()
    {
        if(!empty(VisitorChat::$DynamicGroup))
            return;

        if(count($this->Members) == 1 && Server::$Operators[$this->OperatorId]->Status == USER_STATUS_OFFLINE)
            $this->CloseChat(4);
        else
        {
            foreach($this->Members as $sid => $member)
                if(Server::$Operators[$sid]->Status == USER_STATUS_OFFLINE)
                    $this->LeaveChat($sid);

            if($this->OperatorId != $this->DesiredChatPartner)
                $this->DesiredChatPartner = $this->OperatorId;
        }
    }
	
	function SetHost($_internalUser)
	{
        if(!empty($this->ChatId))
        {
		    DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0 WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
		    if(DBManager::GetAffectedRowCount() != 1)
			    DBManager::Execute(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`status`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($_internalUser)."',0);");
            DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=1 WHERE `status`=0 AND `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`!='".DBManager::RealEscape($_internalUser)."';");
	    }
    }
	
	function SetPriority($_priority)
	{
		DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `priority`='".DBManager::RealEscape($_priority)."' WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function SetTargetOperator($_internalUser)
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `request_operator`='".DBManager::RealEscape($_internalUser)."' WHERE `chat_id`=".DBManager::RealEscape($this->ChatId)." LIMIT 1;");
	}
	
	function RequestInitChat($_internalUser)
	{
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `init_chat_with`='".DBManager::RealEscape($_internalUser)."' WHERE `browser_id` = '".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id` = '".DBManager::RealEscape($this->UserId)."';");
	}
	
	function SetTargetGroup($_groupId)
	{
		DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `request_group`='".DBManager::RealEscape($_groupId)."' WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
	function TakeChat($_internalUser,$_groupId)
	{
		$this->SetHost($_internalUser);
		$_groupId = (!empty($_groupId)) ? ",`request_group`='".DBManager::RealEscape($_groupId)."'" : "";
		DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0,`declined`=0,`dtime`=0,`ltime`=0,`jtime`=".time()." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internalUser)."' LIMIT 1;");
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `status`=1,`waiting`=0,`request_operator`='".DBManager::RealEscape($_internalUser)."'".$_groupId." WHERE `chat_id` = '".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
	}
	
    function ApplyOverlayInputValues()
    {
        $group = Server::$Groups[$this->DesiredChatGroup];
        $newData = (!empty($this->UserData)) ? new UserData($this->UserData->Fullname,$this->UserData->Email,$this->UserData->Company,$this->UserData->Phone,$this->UserData->Customs,$this->UserData->Text) : new UserData();
        $newData->LoadFromLogin($group);
        if($this->UserData->IsDifference($newData))
        {
            $this->UserData = $newData;
            return true;
        }
        return false;
    }

    function ExternalWindowActivate()
    {
        global $USER;
        $this->ExternalActivate();
        if(!empty($this->OperatorId))
        {
            if(!empty(Server::$Configuration->File["gl_save_op"]))
                Cookie::Set("internal_user",Server::$Operators[$this->OperatorId]->UserId);
            $this->DesiredChatPartner = Server::$Operators[$this->OperatorId]->SystemId;
        }
        $USER->AddFunctionCall("lz_chat_set_status(lz_chat_data.STATUS_ACTIVE);",false);
        $USER->AddFunctionCall("lz_chat_shout(1);",false);
        if($this->CallMeBack == 2)
            $USER->AddFunctionCall("lz_chat_call_back_info('".base64_encode(LocalizationManager::$TranslationStrings["client_thank_you"]." ".str_replace(array("<b>","</b>"),"",str_replace("<!--operator_name-->",Server::$Operators[$this->OperatorId]->Fullname,LocalizationManager::$TranslationStrings["client_now_speaking_to"])."</b>"))."');",false);
        else if($this->CallMeBack > 0)
            $USER->AddFunctionCall("lz_chat_activate();",false);
    }

    function RemoteActivate($_internalUser)
    {
        if(!Is::Defined("CALLER_SYSTEM_ID"))
        {
            define("CALLER_SYSTEM_ID",$_internalUser->SystemId);
            $this->InternalActivate();

            if($_internalUser->IsBot)
                $this->ExternalActivate();
            else
                $this->ExternalWindowActivate();

            $this->SetStatus(CHAT_STATUS_ACTIVE);
        }
    }

    function CreateSPAMFilter()
    {
        if(!empty(Server::$Configuration->File["gl_sfc"]) && Visitor::CreateSPAMFilter($this->UserId))
            return true;
        return false;
    }
	
	function CreateChat($_internalUser, $_visitor, $_host=false, $custom="", $etpl="", $_customsInTranscript=true, $_externalSelf=true, $pdm=null)
	{
        if(empty($this->ChatId))
            return false;

        if(!empty($_internalUser))
        {
            UserGroup::RemoveFromAllDynamicGroups($this->SystemId);
            $this->LoadForward();

            if(UserGroup::PersistentJoin($this->UserId, $this->SystemId))
                $this->RemoteActivate($_internalUser);

		    $this->OperatorId = $_internalUser->SystemId;
            $_internalUser->SetLastChatAllocation();
        }
        else
            $this->OperatorId = "";

		$this->SetStatus(CHAT_STATUS_WAITING);
		Server::InitDataBlock(array("INPUTS"));
	    DBManager::Execute(false,"INSERT INTO `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` (`chat_id`,`user_id`,`jtime`,`status`) VALUES ('".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($this->OperatorId)."',".time().",".(($_host) ? 0 : 1).");");
		
        $this->CreateArchiveEntry($_internalUser, $_visitor, $custom, $etpl, $_customsInTranscript, $pdm);

		if($_internalUser->IsBot)
		{
			$this->RemoteActivate($_internalUser);
		}
		else if(!empty($_internalUser->AppDeviceId) && $_internalUser->AppBackgroundMode)
        {
            $name = (!empty($this->UserData->Fullname)) ? $this->UserData->Fullname : Visitor::GetNoName($this->UserId.Communication::GetIP());
            $_internalUser->AddPushMessage($this->ChatId, $this->SystemId, $name, 0);
        }

		if(!empty($_GET["acid"]))
		{
			$pchatid = Encoding::Base64UrlDecode($_GET["acid"]);
			$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `chat_id`='".DBManager::RealEscape($pchatid)."' AND (`exit` > ".(time()-30)." OR `exit`=0) LIMIT 1;");
			if($result && DBManager::GetRowCount($result) == 1)
			{
				$row = DBManager::FetchArray($result);
				if(empty($row["waiting"]))
					$this->RepostChatHistory(2,$pchatid,$this->OperatorId,0,0,$this->UserId."~".$this->UserId."_OVL",$this->ChatId,$this->SystemId,true,false,$_externalSelf);
			}
		}
        return true;
	}

    function CreateArchiveEntry($_internalUser, $_visitor, $custom="", $etpl="", $_customsInTranscript=true, $pdm=null)
    {
        if(!empty($this->ArchiveCreated))
            return;

        if(Server::$Inputs[111]->Active)
            $custom .= strip_tags(Server::$Inputs[111]->Caption) . " %efullname%\r\n";
        if(Server::$Inputs[112]->Active)
            $custom .= strip_tags(Server::$Inputs[112]->Caption) . " %eemail%\r\n";
        if(!empty($this->Company) && Server::$Inputs[113]->Active)
            $custom .= strip_tags(Server::$Inputs[113]->Caption) . " " . trim($this->UserData->Company) . "\r\n";
        if(!empty($this->Question) && Server::$Inputs[114]->Active)
            $custom .= strip_tags(Server::$Inputs[114]->Caption) . " " . trim($this->UserData->Text) . "\r\n";
        if(!empty($this->Phone) && Server::$Inputs[116]->Active)
            $custom .= strip_tags(Server::$Inputs[116]->Caption) . " " . trim($this->UserData->Phone) . "\r\n";
        if(!empty($this->ChatVoucherId))
            $custom .= strip_tags(LocalizationManager::$TranslationStrings["client_voucher_id"]) . " " . trim($this->ChatVoucherId) . "\r\n";

        $customs = array();
        if(is_array($this->UserData->Customs))
            foreach($this->UserData->Customs as $cind => $value)
                if(Server::$Inputs[$cind]->Active && Server::$Inputs[$cind]->Custom)
                {
                    $customs[Server::$Inputs[$cind]->Name] = $value;
                    if(!isset(Server::$Groups[$this->DesiredChatGroup]->ChatInputsHidden[$cind]) && $_customsInTranscript)
                    {
                        if(Server::$Inputs[$cind]->Type == "CheckBox")
                            $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . ((!empty($value)) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->") . "\r\n";
                        else if(Server::$Inputs[$cind]->Type == "ComboBox")
                            $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . Server::$Inputs[$cind]->GetClientValue($value) . "\r\n";
                        else
                            $custom .= strip_tags(Server::$Inputs[$cind]->Caption). " " . $value . "\r\n";
                    }
                }

        $tsData = array("","");
        if(!empty(Server::$Groups[$this->DesiredChatGroup]->PredefinedMessages))
        {
            $pdm = PredefinedMessage::GetByLanguage(Server::$Groups[$this->DesiredChatGroup]->PredefinedMessages,$_visitor->Language);
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
            $tsData[$i] = str_replace("%external_company%",$this->UserData->Company,$tsData[$i]);
            $tsData[$i] = str_replace("%external_phone%",$this->UserData->Phone,$tsData[$i]);
            $tsData[$i] = str_replace("%question%",$this->UserData->Text,$tsData[$i]);
            $tsData[$i] = str_replace("%feedback_link%",Feedback::GetLink("cid=" . Encoding::Base64UrlEncode($this->ChatId)),$tsData[$i]);
            $tsData[$i] = Server::$Groups[$this->DesiredChatGroup]->TextReplace($tsData[$i],$_visitor->Language);
            if(!empty($this->OperatorId))
                $tsData[$i] = Server::$Operators[$this->OperatorId]->TextReplace($tsData[$i]);
            $tsData[$i] = $_visitor->TextReplace($tsData[$i]);
            $tsData[$i] = Configuration::Replace($tsData[$i]);
        }

        $subject = ($pdm != null) ? $pdm->SubjectChatTranscript : "";
        $subject = Mailbox::GetSubject($subject,$this->UserData->Email,$this->UserData->Fullname,$this->DesiredChatGroup,$this->ChatId,$this->UserData->Company,$this->UserData->Phone,Communication::GetIP(),$this->UserData->Text,Server::$Groups[$this->DesiredChatGroup]->GetDescription($_visitor->Language),$this->UserData->Customs);
        $internal = ($_internalUser != null && $_internalUser->IsBot) ? $_internalUser->SystemId : "";

        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';");
        if($result && DBManager::GetRowCount($result) == 0)
        {
            if(Server::$Configuration->File["gl_adct"] == 1 || (!empty(Server::$Configuration->File["gl_rm_chats_time"]) || empty(Server::$Configuration->File["gl_rm_chats"])))
            {
                $url = Visitor::GetLastURLFromVisitor($this->UserId);
                if(!(($result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."';")) && $row = DBManager::FetchArray($result)))
                    DBManager::Execute(true,"INSERT INTO `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` (`time`,`endtime`,`closed`,`chat_id`,`external_id`,`fullname`,`internal_id`,`group_id`,`area_code`,`html`,`plaintext`,`transcript_text`,`transcript_html`,`email`,`company`,`iso_language`,`iso_country`,`host`,`ip`,`gzip`,`transcript_sent`,`transcript_receiver`,`question`,`customs`,`subject`,`voucher_id`,`ref_url`) VALUES ('".DBManager::RealEscape($this->FirstActive)."',0,0,'".DBManager::RealEscape($this->ChatId)."','".DBManager::RealEscape($this->UserId)."','','".DBManager::RealEscape($internal)."','','".DBManager::RealEscape($this->Code)."','','','".DBManager::RealEscape($tsData[0])."','".DBManager::RealEscape($tsData[1])."','','','".DBManager::RealEscape($_visitor->Language)."','".DBManager::RealEscape($_visitor->GeoCountryISO2)."','".DBManager::RealEscape($_visitor->Host)."','".DBManager::RealEscape($_visitor->IP)."',0,0,'".DBManager::RealEscape($this->UserData->Email)."','','".DBManager::RealEscape(@serialize($customs))."','".DBManager::RealEscape($subject)."','".DBManager::RealEscape($this->ChatVoucherId)."','".DBManager::RealEscape($url)."');");
            }
            $this->ArchiveCreated = 1;
            ChatRequest::AcceptAll($this->UserId);
        }
    }

	function RepostChatHistory($_caller,$_chatId,$_internalSystemId,$_from=0,$_last=0,$_receiverGroup="",$_targetChatId="",$_targetReceiverGroup="",$_external=false,$_botonly=false,$_externalSelf=true)
	{
		if(empty($_receiverGroup))
			$_receiverGroup = $this->SystemId;
			
		if(!empty(Server::$Operators[$_internalSystemId]->Reposts[$this->SystemId]))
			$_from = Server::$Operators[$_internalSystemId]->Reposts[$this->SystemId];
			
		if(empty($_targetChatId))
			$cidcrit = (!empty($_chatId)) ? " `chat_id` != '".DBManager::RealEscape($_chatId)."' AND" : "";
		else
			$cidcrit = (!empty($_chatId)) ? " `chat_id` = '".DBManager::RealEscape($_chatId)."' AND" : "";
			
		$reccrit = ($_external) ? "" : " AND `received`=1";
		$result = DBManager::Execute(true,$d = "SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE".$cidcrit." `repost`=0".$reccrit." AND `receiver_group`='".DBManager::RealEscape($_receiverGroup)."' AND `time`>".$_from." GROUP BY `id`;");

		if($result)
			while($row = DBManager::FetchArray($result))
			{
				if($_botonly)
					if(!(isset(Server::$Operators[$row["receiver_original"]]) && Server::$Operators[$row["receiver_original"]]->IsBot) && !(isset(Server::$Operators[$row["sender"]]) && Server::$Operators[$row["sender"]]->IsBot))
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
		Server::$Operators[$_internalSystemId]->Reposts[$this->SystemId] = max($_last,$_from);
	}
	
	function PostsReceived($_sender)
	{
		$result = DBManager::Execute(true,"SELECT COUNT(*) as `pcount`,SUM(received) as `rcount` FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `sender`='".DBManager::RealEscape($_sender)."' AND `receiver`='".DBManager::RealEscape($this->SystemId)."' AND `repost`=0");
		if($result)
			while($row = DBManager::FetchArray($result))
				return $row["pcount"]+$row["rcount"];
		return true;
	}
	
	function GetLastInvitationSender()
	{
		$result = DBManager::Execute(true,"SELECT `sender_system_id` FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `created` DESC LIMIT 1");
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
        if(empty($this->UserId))
            return;

		$_new = (func_num_args() > 0) ? func_get_arg(0) : false;
		if($_new)
		{
			$this->FirstCall = true;
			$this->Status = CHAT_STATUS_OPEN;
		}

        if(empty($this->ChatId) && empty(Server::$Configuration->File["gl_save_op"]))
            $this->DesiredChatPartner = "";

		if(empty($this->FirstActive))
			$this->FirstActive = time();

		if($this->FirstCall){
            $pdbc = ChatArchive::GetMatchCount($this->UserId);
            $pdbt = Ticket::GetMatchCount($this->UserId);
            $hc = $pdbc.";".$pdbt;
			DBManager::Execute(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_CHATS."` (`visitor_id`,`browser_id`,`visit_id`,`priority`,`call_me_back`, `typing` ,`area_code` ,`first_active` ,`last_active` ,`request_operator` ,`request_group` , `chat_ticket_id`, `queue_posts`, `history`, `dgc`) VALUES ('".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->VisitId)."','".DBManager::RealEscape($this->Priority)."',".DBManager::RealEscape(($this->CallMeBack) ? 1 : 0).",0,'".DBManager::RealEscape($this->Code)."','".DBManager::RealEscape($this->FirstActive)."','".DBManager::RealEscape($this->LastActive)."','".DBManager::RealEscape($this->DesiredChatPartner)."','".DBManager::RealEscape($this->DesiredChatGroup)."','".DBManager::RealEscape($this->ChatVoucherId)."','".DBManager::RealEscape(serialize($this->QueuedPosts))."','".DBManager::RealEscape($hc)."','".DBManager::RealEscape(VisitorChat::$DynamicGroup)."');");
        }
        else
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `typing`='".DBManager::RealEscape(($this->Typing)?1:0)."',`queue_message_shown`='".DBManager::RealEscape(($this->QueueMessageShown)?1:0)."',`archive_created`=".intval($this->ArchiveCreated).",`queue_posts`='".DBManager::RealEscape(serialize($this->QueuedPosts))."',`request_operator`='".DBManager::RealEscape($this->DesiredChatPartner)."',`chat_ticket_id`='".DBManager::RealEscape($this->ChatVoucherId)."',`request_group`='".DBManager::RealEscape($this->DesiredChatGroup)."',`last_active`='".DBManager::RealEscape(time())."' WHERE `browser_id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");

        parent::Save();

		if(count($this->History) == 0)
		{
            $url = Visitor::GetLastURLFromVisitor($this->UserId);
            if(empty($url))
			    $this->History[0] = new HistoryUrl(LIVEZILLA_URL . FILE_CHAT,$this->Code,Server::$Configuration->File["gl_site_name"],"",$this->FirstActive);
            else
                $this->History[0] = new HistoryUrl($url,"","","",$this->FirstActive);

			$this->History[0]->Save($this->BrowserId,true);
		}
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

		DBManager::Execute(false,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `declined`=1,`dtime`=".time().",`ltime`=".time()." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape($_internal)."' LIMIT 1;");
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
		DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `time`='".DBManager::RealEscape(time())."' WHERE `closed`=0 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
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

    function SetExternalClosed()
    {
        DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `external_close`='1' WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
    }
	
	function UpdateUserStatus($_internalActivated,$_internalClosed,$_internalDeclined,$_externalActivated,$_externalClose)
	{
		if(!empty($this->ChatId))
		{
			$this->Status = ($_externalClose || $_internalDeclined || $_internalClosed) ? CHAT_CLOSED : $this->Status;
			if($_internalActivated)
			{
				DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET `internal_active`='1',`allocated`='".DBManager::RealEscape(time())."' WHERE `internal_active`=0 AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
				if(DBManager::GetAffectedRowCount() == 1)
				{
					DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=0 WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`='".DBManager::RealEscape(CALLER_SYSTEM_ID)."';");
					DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHAT_OPERATORS."` SET `status`=9,`ltime`=".time().",`jtime`=0 WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `user_id`!='".DBManager::RealEscape(CALLER_SYSTEM_ID)."' AND `status`<=1;");
				}
			}
			else
			{
				if($_externalClose && empty($this->InternalClosed))
					$update = "`external_close`=1,`status`=2,`waiting`=0,`exit`=".intval(time()+1);
				else if($_externalClose && !empty($this->InternalClosed))
					$update = "`external_close`='1'";
				else if($_internalClosed && empty($this->InternalClosed))
					$update = "`internal_closed`='1',`exit`=".intval(time()+1);
				else if($_internalDeclined && empty($this->InternalDeclined))
					$update = "`internal_declined`='1'";
				else
					$update = "`external_active`='1'";
					
				if(($_internalClosed || $_externalClose) && !empty($this->AllocatedTime))
				{
                    UserGroup::RemoveNonPersistantMember($this->SystemId);
					$params = $this->CalculateChatResponseTime();
					$update .= ",`response_time`=" . abs($params[0]) . ",`chat_posts`=" . abs($params[1]);
				}
				DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_CHATS."` SET ".$update." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
			}
			DBManager::Execute(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` SET `endtime`=".$this->LastActive.((!empty($this->AllocatedTime)) ? (",`time`=" . $this->AllocatedTime) : "")." WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' LIMIT 1;");
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
		$result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' ORDER BY `time` ASC;");
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
        if(!$_queue)
        {
            if(!empty(Server::$Configuration->File["gl_mcwt"]) && $this->Status == CHAT_STATUS_WAITING && is_array($this->Members) && empty($this->InternalActivation))
                foreach($this->Members as $member)
                    if((time()-$member->Joined) > Server::$Configuration->File["gl_mcwt"])
                    {
                        return true;
                    }
        }
        else
        {
            if(!empty(Server::$Configuration->File["gl_mqwt"]) && (time()-$this->FirstActive) > (Server::$Configuration->File["gl_mqwt"]*60))
                return true;
        }
        return false;
    }

    function GetForwards()
    {
        $list = array();
        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `target_group_id`='". DBManager::RealEscape($this->DesiredChatGroup)."' AND `visitor_id`='". DBManager::RealEscape($this->UserId)."' AND `browser_id`='". DBManager::RealEscape($this->BrowserId)."' ORDER BY `created` ASC;");
        while($row = DBManager::FetchArray($result))
            $list[] = new Forward($row);
        return $list;
    }

    function GetMaxWaitingTimeAction($_queue=false)
    {
        if($this->IsMaxWaitingTime($_queue))
        {
            if(!empty(Server::$Configuration->File["gl_mcwf"]))
                return "FORWARD";
            else
                return "MESSAGE";
        }
        return false;
    }

    function GetLastActiveChatId()
    {
        $result = DBManager::Execute(true,"SELECT `chat_id` FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id`>0 AND `status`>1 AND `browser_id`='".DBManager::RealEscape($this->BrowserId)."' AND `visitor_id`='".DBManager::RealEscape($this->UserId)."' ORDER BY `chat_id` DESC LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return $row["chat_id"];
        return 0;
    }

    function FindOperator($_router,$_user,$_allowBots=false,$_requireBot=false,$_exclude=null,$_closeOnError=true,$_isForward=false)
    {
        $_router->TargetGroupId = $this->DesiredChatGroup;
        $_router->PreviousOperatorSystemId = $this->DesiredChatPartner;
        $result = $_router->Find($_user,$_allowBots,$_requireBot,$_exclude,$_isForward);
        $this->DesiredChatPartner = $_router->TargetOperatorSystemId;

        if(!$result && $_closeOnError)
            $this->CloseChat(3);

        if($_router->IsPredefined)
            $this->SetTargetOperator($this->DesiredChatPartner);



        return $result;
    }

    function CorrectInvalidTarget($_botmode)
    {
        if(!empty($this->DesiredChatPartner) && Server::$Operators[$this->DesiredChatPartner]->IsBot && !$_botmode)
            $this->DesiredChatPartner = null;
    }

    function SetTargetOperatorId($_router,$_user,$_allowBots=false,$_requireBot=false,$_exclude=null,$_closeOnError=true,$_isForward=false,$_botmode=false)
    {
        $this->CorrectInvalidTarget($_botmode);
        $this->FindOperator($_router,$_user,$_allowBots,$_requireBot,$_exclude,$_closeOnError,$_isForward);

        // forward
        if($this->Forward != null && !empty($this->Forward->TargetSessId) && Server::$Operators[$this->Forward->TargetSessId]->Status < USER_STATUS_OFFLINE)
        {
            $this->DesiredChatPartner = $this->Forward->TargetSessId;
        }
        // running chat
        else if($this->Status > CHAT_STATUS_OPEN && !$this->Closed)
        {
            $this->DesiredChatPartner = $this->OperatorId;
        }
        // init chat
        else if(!empty($this->InitChatWith) && Server::$Operators[$this->InitChatWith]->Status < USER_STATUS_OFFLINE)
        {
            $_user->AddFunctionCall("lz_chat_input_bot_state(false,false);",false);
            $this->DesiredChatPartner = $this->InitChatWith;
        }
        // chat invite
        else if($_user->Browsers[1]->ChatRequest != null && !$_user->Browsers[1]->ChatRequest->Closed)
        {
            $this->DesiredChatPartner = $_user->Browsers[1]->ChatRequest->SenderSystemId;
        }
        // default allocation
        else
        {
            // just dont ovwr
        }
    }

    function CreateAutoForward($_user)
    {
        $this->LoadForward(false,false);
        if(!($this->Forward != null && !$this->Forward->Processed))
        {

            $allForwards = $this->GetForwards();
            $targets = array();
            $currentOperator = $this->DesiredChatPartner;
            $this->FindOperator(VisitorChat::$Router,$_user,false,false,array($this->DesiredChatPartner=>$this->DesiredChatPartner),false,$this->Forward != null);
            $isTargetAvailable = (count(VisitorChat::$Router->OperatorsAvailable)>=2 || (count(VisitorChat::$Router->OperatorsAvailable)==1 && !empty($currentOperator) && !isset(VisitorChat::$Router->OperatorsAvailable[$currentOperator])));

            if($isTargetAvailable)
            {
                $forwardedToCount = array();
                foreach(VisitorChat::$Router->OperatorsAvailable as $opsysId => $ccount)
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

                if(!empty(Server::$Configuration->File["gl_mcfc"]) && is_numeric(Server::$Configuration->File["gl_mcfc"]))
                    if(Server::$Configuration->File["gl_mcfc"] <= $forwardedToCount)
                        return false;

                if(!empty($targets))
                {
                    asort($targets);
                    foreach($targets as $targetsysid => $time)
                    {
                        if($targetsysid != $currentOperator)
                        {
                            $forward = new Forward($this->ChatId,$this->DesiredChatPartner);
                            $forward->InitiatorSystemId = $currentOperator;
                            $forward->ReceiverUserId = $this->UserId;
                            $forward->ReceiverBrowserId = $this->BrowserId;
                            $forward->TargetSessId = $targetsysid;
                            $forward->TargetGroupId = $this->DesiredChatGroup;
                            $forward->Invite = false;
                            $forward->Auto = true;
                            $forward->Save();
                            $this->ArchiveCreated = 2;
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
        $pdm = PredefinedMessage::GetByLanguage(Server::$Groups[$this->DesiredChatGroup]->PredefinedMessages,($_visitor != null) ? $_visitor->Language : "");
        if($pdm != null && !empty($pdm->QueueMessage) && (time()-$this->FirstActive) > $pdm->QueueMessageTime && !$_shown)
        {
            $message = Server::$Groups[$this->DesiredChatGroup]->TextReplace($pdm->QueueMessage,$_visitor->Language);
            $message = $_visitor->TextReplace($message);
            $message = $this->TextReplace($message);
            $message = Configuration::Replace($message);
            $this->QueueMessageShown = true;
            return $message;
        }
        return "";
    }

    function ShowConnecting($_visitor,$_resume=false)
    {
        if($_resume)
            $_visitor->AddFunctionCall("lz_chat_show_connected(false,true);",false);
        else
            $_visitor->AddFunctionCall("lz_chat_show_connected(".To::BoolString(empty(VisitorChat::$DynamicGroup)).",false);",false);
    }

    function TextReplace($_text)
    {
        $_text = parent::TextReplace($_text);
        $_text = str_replace(array("%chat_id%","%CHATID%"),$this->ChatId,$_text);
        return $_text;
    }

    static function FromCache($_uid,$_bid)
    {
        if(!empty(CacheManager::$ActiveManager))
        {
            Server::InitDataBlock(array("VISITOR"));
            if(isset(Server::$Visitors[$_uid]))
            {
                foreach(Server::$Visitors[$_uid]->Browsers as $browser)
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

    static function GetRelatedChatVouchers($_groupId,$_ticket)
    {
        $vouchers = array();
        Server::InitDataBlock(array("DBCONFIG"));
        $result = DBManager::Execute(true,$d = "SELECT *,`t1`.`id` AS `voucherid` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`id`='".DBManager::RealEscape($_ticket->Id)."' OR (`t1`.`paid`=1 AND `voided`=0 AND (`t1`.`id`='".DBManager::RealEscape($_ticket->Id)."' OR `t1`.`extends`='".DBManager::RealEscape($_ticket->Id)."' OR `t1`.`id`='".DBManager::RealEscape($_ticket->Extends)."' OR (`t1`.`extends`!='' AND `t1`.`extends`='".DBManager::RealEscape($_ticket->Extends)."'))) ORDER BY `created` DESC;");

        while($row = @DBManager::FetchArray($result))
        {
            if(!empty(Server::$Configuration->Database["cct"][$row["tid"]]))
            {
                $ticket = new CommercialChatVoucher($row);
                $ticket->CheckForVoid();
                if($_ticket->Id == $ticket->Id || (!$ticket->Voided && in_array($row["tid"],Server::$Groups[$_groupId]->ChatVouchersRequired)))
                    $vouchers[] = $ticket;
            }
        }
        return $vouchers;
    }

    static function GetMatchingVoucher($_groupId,$_voucherid)
    {
        Server::InitDataBlock(array("GROUPS","DBCONFIG"));
        $ticket = new CommercialChatVoucher("",$_voucherid);
        $ticket->Load();

        $result = DBManager::Execute(true,$d = "SELECT *,`t1`.`id` AS `voucherid`, SUM(`chat_time_max`) AS `chat_time_max`, SUM(`chat_time`) AS `chat_time`, SUM(`chat_sessions`) AS `chat_sessions`, SUM(`chat_sessions_max`) AS `chat_sessions_max`, MAX(`expires`) AS `expires` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`id`='".DBManager::RealEscape($_voucherid)."' ORDER BY `created` ASC;");

        while($row = @DBManager::FetchArray($result))
        {
            if(!empty(Server::$Configuration->Database["cct"][$row["tid"]]))
            {
                $ticket = new CommercialChatVoucher($row);
                if(in_array($row["tid"],Server::$Groups[$_groupId]->ChatVouchersRequired))
                {
                    return $ticket;
                }
            }
        }
        return null;
    }

    static function GetByChatId($_chatId)
    {
        if(!empty($_chatId))
        {
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `chat_id`='".DBManager::RealEscape($_chatId)."';");
            if($result)
                if($row = DBManager::FetchArray($result))
                    return new VisitorChat($row);
        }
        return null;
    }

    static function GetBySystemId($_systemId)
    {
        $parts = explode("~",$_systemId);
        if(count($parts)==2)
        {
            $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_CHATS."` WHERE `visitor_id`='".DBManager::RealEscape($parts[0])."' AND `browser_id`='".DBManager::RealEscape($parts[1])."' ORDER BY `chat_id` DESC;");
            if($result)
                if($row = DBManager::FetchArray($result))
                    return new VisitorChat($row);
        }
        return null;
    }

    static function IsChatBrowserIdAvailable($_browserId, $_allowExisting=true)
    {
        if(empty($_browserId))
            return false;

        $result = DBManager::Execute(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` WHERE `id`='".DBManager::RealEscape($_browserId)."';");
        if($result)
            if($row = DBManager::FetchArray($result))
            {
                if(!$_allowExisting)
                    return false;

                if(!empty($row["overlay_container"]) || empty($row["is_chat"]))
                    return false;
            }

        return true;
    }

    static function ApplyDynamicGroup($_chatObj=null)
    {
        if(!empty($_GET[GET_EXTERN_DYNAMIC_GROUP]))
        {
            if($_chatObj != null && empty($_chatObj->Forward))
                $_chatObj->LoadForward();

            if($_chatObj != null && !empty($_chatObj->Forward))
                return;

            $tgroup = Communication::ReadParameter(GET_EXTERN_DYNAMIC_GROUP,"");
            if(isset(Server::$Groups[$tgroup]) && Server::$Groups[$tgroup]->IsDynamic)
                VisitorChat::$DynamicGroup = $tgroup;
        }
    }
}
?>