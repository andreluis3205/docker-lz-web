<?php
/****************************************************************************************
* LiveZilla objects.global.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();


class BaseObject
{
	public $Id;
	public $Created;
	public $Edited;
	public $Creator;
	public $Editor;
	public $Status;
    public $Fullname;
    public $Company;
    public $Phone;
    public $Question;
    public $Email;
    public $Customs;
    public $IP;
    public $MaxChats = 9999;
    public $MaxChatAmount = 9999;
    public $MaxChatsStatus = GROUP_STATUS_BUSY;

    function GetInputData($_inputIndex,$_chat=true)
    {
        global $INTERNAL;
        $data = array(111=>$this->Fullname,112=>$this->Email,113=>$this->Company,114=>$this->Question,116=>$this->Phone);
        if(isset($data[$_inputIndex]))
            $value = $data[$_inputIndex];
        else if(isset($this->Customs[$_inputIndex]))
            $value = $this->Customs[$_inputIndex];
        else
            return "";
        if(isset($INTERNAL[CALLER_SYSTEM_ID]))
        {
            $lvl = $INTERNAL[CALLER_SYSTEM_ID]->GetInputMaskLevel($_inputIndex,$_chat);
            if($lvl > 0)
                return maskData($value,$lvl);
        }
        return $value;
    }

    function IsMaxChatAmount()
    {
        return ($this->MaxChatAmount < 9999 && $this->MaxChatAmount > -1);
    }
}

class Action extends BaseObject
{
	public $URL = "";
	public $ReceiverUserId;
	public $ReceiverBrowserId;
	public $SenderSystemId;
	public $SenderUserId;
	public $SenderGroupId;
	public $Text;
	public $BrowserId;
	public $Status;
	public $TargetFile;
	public $Extension;
	public $Created;
	public $Displayed;
	public $Accepted;
	public $Declined;
	public $Closed;
	public $Exists;
	public $EventActionId = "";
}

class Post extends BaseObject
{
	public $Receiver;
	public $ReceiverGroup;
	public $ReceiverOriginal;
	public $Sender;
	public $SenderName;
	public $Persistent = false;
	public $Repost = false;
	public $ChatId;
	public $Translation = "";
	public $TranslationISO = "";
	public $HTML;
	public $Received;
	public $BrowserId = "";
	
	function Post()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
			$this->Id = $row["id"];
			$this->Sender = $row["sender"];
			$this->SenderName = $row["sender_name"];
			$this->Receiver = $row["receiver"];
			$this->ReceiverOriginal = $row["receiver_original"];
			$this->ReceiverGroup = $row["receiver_group"];
			$this->Received = !empty($row["received"]);
			$this->Text = $row["text"];
			$this->Created = $row["time"];
			$this->ChatId = $row["chat_id"];
			$this->Repost = !empty($row["repost"]);
			$this->Translation = $row["translation"];
			$this->TranslationISO = $row["translation_iso"];
			$this->BrowserId = $row["browser_id"];
		}
		else if(func_num_args() >= 4)
		{
			$this->Id = func_get_arg(0);
			$this->Sender = func_get_arg(1);
			$this->Receiver = 
			$this->ReceiverOriginal = func_get_arg(2);
			$this->Text = func_get_arg(3);
			$this->Created = func_get_arg(4);
			$this->ChatId = func_get_arg(5);
			$this->SenderName = func_get_arg(6);
		}
   	}
	
	function GetXml()
	{
		$translation = (!empty($this->Translation)) ? " tr=\"".base64_encode($this->Translation)."\" triso=\"".base64_encode($this->TranslationISO)."\"" : "";
		return "<val id=\"".base64_encode($this->Id)."\" rp=\"".base64_encode(($this->Repost) ? 1 : 0)."\" sen=\"".base64_encode($this->Sender)."\" rec=\"".base64_encode($this->ReceiverGroup)."\" reco=\"".base64_encode($this->ReceiverOriginal)."\" date=\"".base64_encode($this->Created)."\"".$translation.">".base64_encode($this->Text)."</val>\r\n";
	}
	
	function GetCommand($_name)
	{
		global $LZLANG;
		if($this->Repost && empty($_name))
			$_name = $LZLANG["client_guest"];
	
		if(!empty($this->Translation))
			return "lz_chat_add_internal_text(\"".base64_encode($this->Translation."<div class=\"lz_message_translation\">".$this->Text."</div>")."\" ,\"".base64_encode($this->Id)."\",\"".base64_encode($_name)."\", ".parseBool($this->Repost).");";
		else
			return "lz_chat_add_internal_text(\"".base64_encode($this->Text)."\" ,\"".base64_encode($this->Id)."\",\"".base64_encode($_name)."\", ".parseBool($this->Repost).");";
	}
	
	function Save($_mTime=0)
	{
        global $INTERNAL;
		if($_mTime==0)
		{
			$_mTime = mTime();
			$this->Created = $_mTime[1];
		}

        if($this->Receiver==$this->ReceiverOriginal && isset($INTERNAL[$this->Receiver]) && !empty($INTERNAL[$this->Receiver]->AppDeviceId) && $INTERNAL[$this->Receiver]->AppBackgroundMode)
            $INTERNAL[$this->Receiver]->AddPushMessage("", $this->Sender, $this->SenderName, 1, strip_tags($this->Text));

		queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_POSTS."` (`id`,`chat_id`,`time`,`micro`,`sender`,`receiver`,`receiver_group`,`receiver_original`,`text`,`translation`,`translation_iso`,`received`,`persistent`,`repost`,`sender_name`,`browser_id`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->ChatId)."',".DBManager::RealEscape($this->Created).",".DBManager::RealEscape($_mTime[0]).",'".DBManager::RealEscape($this->Sender)."','".DBManager::RealEscape($this->Receiver)."','".DBManager::RealEscape($this->ReceiverGroup)."','".DBManager::RealEscape($this->ReceiverOriginal)."','".DBManager::RealEscape($this->Text)."','".DBManager::RealEscape($this->Translation)."','".DBManager::RealEscape($this->TranslationISO)."','".DBManager::RealEscape($this->Received?1:0)."','".DBManager::RealEscape($this->Persistent?1:0)."','".DBManager::RealEscape($this->Repost?1:0)."','".DBManager::RealEscape($this->SenderName)."','".DBManager::RealEscape($this->BrowserId)."');");
    }

    function SaveHistory($type = 0,$iid="",$gid="")
    {
        global $INTERNAL,$GROUPS;
        $baseId = date("Y").date("m").date("d");
        if(isset($INTERNAL[$this->Sender]) && isset($INTERNAL[$this->Receiver]))
        {
            $type = 0;
            $id = $baseId.strtoupper(min($this->Sender,$this->Receiver).max($this->Sender,$this->Receiver));
            $iid = min($this->Sender,$this->Receiver)."-".max($this->Sender,$this->Receiver);
        }
        else if(isset($GROUPS[$this->Receiver]) || GROUP_EVERYONE_INTERN == $this->Receiver)
        {
            $type = 2;
            $id = $baseId.strtoupper($this->Receiver);
            $gid = $this->Receiver;
        }
        $id = substr(md5($id),0,8);
        if($type!=1)
        {
            $cf = new Chat();
            if(($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($id)."';")) && $row = DBManager::FetchArray($result))
                queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` (`time`,`endtime`,`closed`,`chat_id`,`internal_id`,`group_id`,`html`,`plaintext`,`transcript_text`,`customs`,`subject`,`chat_type`) VALUES (".$row["time"].",".time().",".$row["closed"].",'".DBManager::RealEscape($id)."','".DBManager::RealEscape($iid)."','".DBManager::RealEscape($gid)."','".DBManager::RealEscape($row["html"].$cf->GetHTMLPost($this->Text,"",time(),$this->SenderName,$this->Sender))."','".DBManager::RealEscape($row["plaintext"]."\n".$cf->GetPlainPost($this->Text,"",time(),$this->SenderName))."','','','',".$type.");");
            else
                queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` (`time`,`endtime`,`chat_id`,`internal_id`,`group_id`,`html`,`plaintext`,`transcript_text`,`customs`,`subject`,`chat_type`) VALUES (".time().",".time().",'".DBManager::RealEscape($id)."','".DBManager::RealEscape($iid)."','".DBManager::RealEscape($gid)."','".DBManager::RealEscape($cf->GetHTMLPost($this->Text,"",time(),$this->SenderName,$this->Sender))."','".DBManager::RealEscape($cf->GetPlainPost($this->Text,"",time(),$this->SenderName))."','','','',".$type.");");
        }
    }
	
	function MarkReceived($_systemId)
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_POSTS."` SET `received`='1',`persistent`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' AND `receiver`='".DBManager::RealEscape($_systemId)."';");
	}
}

class Chat extends BaseObject
{
    public $Closed = 0;
    public $ChatId;
    public $TimeStart;
    public $TimeEnd;
    public $Language;
    public $OperatorId;
    public $VisitorId;
    public $Group;
    public $PlainText = "";
    public $HTML = "";
    public $Fullname = "";
    public $Email = "";
    public $Company = "";
    public $Phone = "";
    public $IP = "";
    public $Question = "";
    public $FirstPost;
    public $Host;
    public $AreaCode;
    public $Country;
    public $ChatType = 1;
    public $Wait;
    public $Accepted;
    public $ElementCount = 0;
    public $VoucherId;
    public $Ended;
    public $CallMeBack;
    public $ReferenceURL ="";
    public static $SpacerStyle = "margin:10px 6px 6px 6px;width:100%";

    function Chat()
    {
        if(func_num_args() == 1)
            $this->Id = func_get_arg(0);
    }

    function Load()
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($this->ChatId)."' AND `closed`>0 LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
            $this->SetValues($row);
    }

    function SetValues($_row,$_api=false)
    {
        $this->ChatId = $_row["chat_id"];
        $this->TimeStart = $_row["time"];
        $this->TimeEnd = max($_row["closed"],$_row["endtime"]);
        $this->Closed = $_row["closed"];
        if($_row["chat_type"]==1 && $_api)
            $this->OperatorId = Operator::GetUserId($_row["internal_id"]);
        else
            $this->OperatorId = $_row["internal_id"];
        $this->Language = strtoupper($_row["iso_language"]);
        $this->VisitorId = $_row["external_id"];
        $this->Group = $_row["group_id"];
        $this->HTML = $_row["html"];
        $this->PlainText = $_row["plaintext"];
        $this->IP = $_row["ip"];
        $this->Fullname = $_row["fullname"];
        $this->Question = $_row["question"];
        $this->Email = $_row["email"];
        $this->Company = $_row["company"];
        $this->Phone = $_row["phone"];
        $this->ChatType = $_row["chat_type"];
        $this->Country = $_row["iso_country"];
        $this->Accepted = $_row["accepted"];
        $this->Wait = $_row["wait"];
        $this->Ended = $_row["ended"];
        $this->Host = $_row["host"];
        $this->VoucherId = $_row["voucher_id"];
        $this->AreaCode = $_row["area_code"];
        $this->CallMeBack = $_row["call_me_back"];
        $this->CallMeBack = $_row["call_me_back"];
        $this->Customs = (!empty($_row["customs"])) ? @unserialize($_row["customs"]) : array();
        $this->ReferenceURL = $_row["ref_url"];
    }

    function GetXML($_permission,$_plain=true,$_showReduced=true,$xml="")
    {
        global $INPUTS;
        if($_permission || $_showReduced)
        {
            $xml = "<c full=\"".base64_encode("true")."\" u=\"".base64_encode($this->ReferenceURL)."\" q=\"".base64_encode($this->Question)."\" t=\"".base64_encode($this->ChatType)."\" cid=\"".base64_encode($this->ChatId)."\" v=\"".base64_encode($this->VoucherId)."\" iid=\"".base64_encode($this->OperatorId)."\" gid=\"".base64_encode($this->Group)."\" cmb=\"".base64_encode($this->CallMeBack)."\" eid=\"".base64_encode($this->VisitorId)."\" en=\"".base64_encode($this->Fullname)."\" ts=\"".base64_encode($this->TimeStart)."\" cl=\"".base64_encode($last = $this->Closed)."\" te=\"".base64_encode($this->TimeEnd)."\" em=\"".base64_encode($this->Email)."\" cp=\"".base64_encode($this->Phone)."\" ac=\"".base64_encode($this->AreaCode)."\" co=\"".base64_encode($this->Company)."\" il=\"".base64_encode($this->Language)."\" ic=\"".base64_encode($this->Country)."\" ho=\"".base64_encode($this->Host)."\" ip=\"".base64_encode($this->IP)."\" wt=\"".base64_encode($this->Wait)."\" sr=\"".base64_encode($this->Accepted)."\" er=\"".base64_encode($this->Ended)."\">\r\n";
            if($_permission)
            {
                $html = (strpos($this->HTML,Chat::$SpacerStyle)===false) ? "<div style=\"".Chat::$SpacerStyle."\">" .$this->HTML. "</div>" : $this->HTML;
                $xml .= "<chtml>".base64_encode($html)."</chtml>\r\n";
                if($_plain)
                    $xml .= "<cplain>".base64_encode($this->PlainText)."</cplain>\r\n";
                if(!empty($this->Customs))
                    foreach($this->Customs as $custname => $value)
                        foreach($INPUTS as $input)
                            if($input->Name == $custname && $input->Active && $input->Custom)
                                $xml .= "<cc cuid=\"".base64_encode($custname)."\">".base64_encode($input->GetClientValue($value))."</cc>\r\n";
            }
            $xml .= "</c>\r\n";
        }
        return $xml;
    }

    function Permission($_operatorId)
    {
        global $INTERNAL;
        $permission = false;
        if(isset($INTERNAL[$_operatorId]))
        {
            if($this->ChatType=="1")
                $permission = ($INTERNAL[$_operatorId]->GetPermission(2) == PERMISSION_FULL || ($INTERNAL[$_operatorId]->GetPermission(2) == PERMISSION_NONE && $_operatorId == $this->OperatorId) || ($INTERNAL[$_operatorId]->GetPermission(2) == PERMISSION_RELATED && in_array($this->Group,$INTERNAL[$_operatorId]->GetGroupList(true))));
            else if($this->ChatType=="2")
                $permission = ($INTERNAL[$_operatorId]->GetPermission(36) == PERMISSION_FULL || (in_array($this->Group,$INTERNAL[$_operatorId]->GetGroupList(true)) || GROUP_EVERYONE_INTERN == $this->Group));
            else if($this->ChatType=="0")
                $permission = ($INTERNAL[$_operatorId]->GetPermission(36) == PERMISSION_FULL || (strpos($this->OperatorId,$_operatorId)!==false));
        }
        return $permission;
    }

    function GetPlainPost($_post,$_translation,$_time,$_senderName)
    {
        $post = (empty($_translation)) ? $_post : $_translation." (".$_post.")";
        $post = str_replace("<br>","\r\n",trim($post));
        preg_match_all("/<a.*href=\"([^\"]*)\".*>(.*)<\/a>/iU", $post, $matches);
        $count = 0;
        foreach($matches[0] as $match)
        {
            if(strpos($matches[1][$count],"javascript:")===false)
                $post = str_replace($matches[0][$count],$matches[2][$count] . " (" . $matches[1][$count].") ",$post);
            $count++;
        }
        $post = html_entity_decode(strip_tags($post),ENT_COMPAT,"UTF-8");
        return "| " . date("d.m.Y H:i:s",$_time) . " | " . $_senderName .  ": " . trim($post);
    }

    function GetHTMLPost($_post,$_translation,$_time,$_senderName,$_senderId)
    {
        global $INTERNAL;
        $post = (empty($_translation)) ? $_post : $_translation."<div class=\"lz_message_translation\">".$_post."</div>";
        $file = (empty($INTERNAL[$_senderId])) ? getFile(TEMPLATE_HTML_MESSAGE_INTERN) : getFile(TEMPLATE_HTML_MESSAGE_EXTERN);
        $html = str_replace("<!--dir-->","ltr",$file);
        $html = str_replace("<!--message-->",$post,$html);
        $html = str_replace("<!--color-->","#73be28",$html);
        $html = str_replace("<!--name-->",htmlentities($_senderName,ENT_QUOTES,'UTF-8'),$html);
        $html = str_replace("<!--time-->",date(DATE_RFC822,$_time),$html);
        return $html;
    }

    function GetPlainFile($_permission,$_download,$_externalFullname,$_fileCreated,$_fileName,$_fileId)
    {
        $result = (($_permission==PERMISSION_VOID)?" (<!--lang_client_rejected-->)":($_permission!=PERMISSION_FULL && empty($_download))?" (<!--lang_client_rejected-->)":" (" . LIVEZILLA_URL . "getfile.php?id=" . $_fileId . ")");
        return "| " . date("d.m.Y H:i:s",$_fileCreated) . " | " . $_externalFullname .  ": " . html_entity_decode(strip_tags($_fileName),ENT_COMPAT,"UTF-8") . $result;
    }

    function GetHTMLFile($_permission,$_download,$_externalFullname,$_fileCreated,$_fileName,$_fileId)
    {
        $post = (($_permission==PERMISSION_VOID)?" (<!--lang_client_rejected-->)":($_permission!=PERMISSION_FULL && empty($_download))? $_fileName . " (<!--lang_client_rejected-->)":"<a class=\"lz_chat_file\" href=\"". LIVEZILLA_URL . "getfile.php?id=" . $_fileId ."\" target=_\"blank\">" . $_fileName. "</a>");
        $file = getFile(TEMPLATE_HTML_MESSAGE_INTERN);
        $html = str_replace("<!--dir-->","ltr",$file);
        $html = str_replace("<!--message-->",$post,$html);
        $html = str_replace("<!--color-->","#73be28",$html);
        $html = str_replace("<!--name-->",$_externalFullname,$html);
        $html = str_replace("<!--time-->",date(DATE_RFC822,$_fileCreated),$html);
        return $html;
    }

    function GetPlainForward($_created,$_targetOperatorId,$_targetGroupId)
    {
        global $GROUPS,$INTERNAL,$DEFAULT_BROWSER_LANGUAGE;
        if(!empty($INTERNAL[$_targetOperatorId]))
            return "| " . date("d.m.Y H:i:s",$_created) . " | <!--lang_client_forwarding_to--> " . $INTERNAL[$_targetOperatorId]->Fullname . " ...";
        else
            return "| " . date("d.m.Y H:i:s",$_created) . " | <!--lang_client_forwarding_to--> " . $GROUPS[$_targetGroupId]->GetDescription() . " ...";
    }

    function GetHTMLForward($_created,$_senderOperatorId,$_targetOperatorId,$_targetGroupId)
    {
        global $GROUPS,$INTERNAL;
        if(!empty($INTERNAL[$_targetOperatorId]))
            $post = "<!--lang_client_forwarding_to--> " . $INTERNAL[$_targetOperatorId]->Fullname . " ...";
        else
            $post = "<!--lang_client_forwarding_to--> " . $GROUPS[$_targetGroupId]->GetDescription() . " ...";

        $file = getFile(TEMPLATE_HTML_MESSAGE_EXTERN);
        $html = str_replace("<!--dir-->","ltr",$file);
        $html = str_replace("<!--message-->",$post,$html);
        $html = str_replace("<!--name-->",$INTERNAL[$_senderOperatorId]->Fullname,$html);
        $html = str_replace("<!--time-->",date(DATE_RFC822,$_created),$html);
        return $html;
    }

    function Generate($_chatId,$_externalFullname,$_plain=false,$_html=false,$_question="",$_startTime=0, $firstpost="")
    {
        $this->FirstPost = time();
        $entries_html = array();
        $entries_plain = array();

        if(!empty($_question))
            $_question = htmlentities($_question,ENT_NOQUOTES,"UTF-8");

        $result_posts = queryDB(true,"SELECT `sender_name`,`text`,`sender`,`time`,`micro`,`translation` FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `repost`=0 AND `receiver`=`receiver_original` AND `chat_id` = '". DBManager::RealEscape($_chatId)."' GROUP BY `id` ORDER BY `time` ASC, `micro` ASC LIMIT 500;");
        while($row_post = DBManager::FetchArray($result_posts))
        {
            $this->ElementCount++;
            $this->FirstPost = min($this->FirstPost,$row_post["time"]);
            $sender_name = (empty($row_post["sender_name"])) ? "<!--lang_client_guest-->" : $row_post["sender_name"];

            if(strpos($row_post["sender"],"~")!==false)
            {
                $row_post["text"] = htmlentities($row_post["text"],ENT_NOQUOTES,"UTF-8");
                $row_post["translation"] = htmlentities($row_post["translation"],ENT_NOQUOTES,"UTF-8");
            }

            $firstpost = (empty($firstpost)) ? $row_post["text"] : $firstpost;

            if($_plain)
                $entries_plain[$row_post["time"]."apost".str_pad($row_post["micro"],10,"0",STR_PAD_LEFT)] = $this->GetPlainPost($row_post["text"],$row_post["translation"],$row_post["time"],$sender_name);
            if($_html)
                $entries_html[$row_post["time"]."apost".str_pad($row_post["micro"],10,"0",STR_PAD_LEFT)] = $this->GetHTMLPost($row_post["text"],$row_post["translation"],$row_post["time"],$sender_name,$row_post["sender"]);
        }

        $result_files = queryDB(true,"SELECT `created`,`file_name`,`file_id`,`permission`,`download` FROM `".DB_PREFIX.DATABASE_CHAT_FILES."` WHERE `chat_id` = '". DBManager::RealEscape($_chatId)."' ORDER BY `created` ASC LIMIT 500;");
        while($row_file = DBManager::FetchArray($result_files))
        {
            $this->ElementCount++;
            $this->FirstPost = min($this->FirstPost,$row_file["created"]);
            if($_plain)
                $entries_plain[$row_file["created"]."bfile"] = $this->GetPlainFile($row_file["permission"],$row_file["download"],$_externalFullname,$row_file["created"],$row_file["file_name"],$row_file["file_id"]);
            if($_html)
                $entries_html[$row_file["created"]."bfile"] = $this->GetHTMLFile($row_file["permission"],$row_file["download"],$_externalFullname,$row_file["created"],$row_file["file_name"],$row_file["file_id"]);
        }

        $result_forwards = queryDB(true,"SELECT `initiator_operator_id`,`invite`,`target_group_id`,`target_operator_id`,`created` FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `auto`=0 AND `invite`=0 AND `chat_id` = '". DBManager::RealEscape($_chatId)."' ORDER BY `created` ASC LIMIT 500;");
        while($row_forward = DBManager::FetchArray($result_forwards))
        {
            $this->ElementCount++;
            $this->FirstPost = min($this->FirstPost,$row_forward["created"]);
            if($_plain)
                $entries_plain[$row_forward["created"]."zforward"] = $this->GetPlainForward($row_forward["created"],$row_forward["target_operator_id"],$row_forward["target_group_id"]);
            if($_html)
                $entries_html[$row_forward["created"]."zforward"] = $this->GetHTMLForward($row_forward["created"],$row_forward["initiator_operator_id"],$row_forward["target_operator_id"],$row_forward["target_group_id"]);
        }

        ksort($entries_plain);
        foreach($entries_plain as $row)
        {
            if(!empty($this->PlainText))
                $this->PlainText .= "\r\n";
            $this->PlainText .= trim($row);
        }

        ksort($entries_html);
        foreach($entries_html as $row)
        {
            if(!empty($this->HTML))
                $this->HTML .= "<br>";
            $this->HTML .= trim($row);
        }

        if(!empty($_question) && $firstpost != $_question && !empty($_externalFullname))
            $this->HTML = $this->GetHTMLPost($_question,"",$_startTime,$_externalFullname,$_externalFullname) . $this->HTML;
    }

    static function GetLastPost($_chatId,$_internal)
    {
        global $INTERNAL;
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `chat_id`='".DBManager::RealEscape($_chatId)."' ORDER BY `time` DESC;");
        while($row = DBManager::FetchArray($result))
        {
            if(($_internal && isset($INTERNAL[$row["sender"]])) || (!$_internal && !isset($INTERNAL[$row["sender"]])))
                 return new Post($row);
        }
        return null;
    }

    static function GetPermissionSQL($_operatorId)
    {
        global $INTERNAL;
        if(isset($INTERNAL[$_operatorId]))
        {
            $excap = $INTERNAL[$_operatorId]->GetPermission(2);
            $incap = $INTERNAL[$_operatorId]->GetPermission(36);

            if($excap == PERMISSION_FULL && $incap == PERMISSION_FULL)
                return "";
            else if($excap == PERMISSION_FULL && $incap == PERMISSION_RELATED)
                return " AND (`chat_type`=1 OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",$INTERNAL[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".$_operatorId."%'))";

            else if($excap == PERMISSION_RELATED && $incap == PERMISSION_FULL)
                return " AND (`chat_type`<>1 OR (`group_id` IN ('".implode("','",$INTERNAL[$_operatorId]->Groups)."')))";
            else if($excap == PERMISSION_RELATED && $incap == PERMISSION_RELATED)
                return " AND ((`chat_type`=1 AND `group_id` IN ('".implode("','",$INTERNAL[$_operatorId]->Groups)."')) OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",$INTERNAL[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".$_operatorId."%'))";

            else if($excap == PERMISSION_NONE && $incap == PERMISSION_FULL)
                return " AND (`chat_type`<>1 OR (`internal_id`= '".DBManager::RealEscape($_operatorId)."'))";
            else if($excap == PERMISSION_NONE && $incap == PERMISSION_RELATED)
                return " AND ((`chat_type`=1 AND (`internal_id`= '".DBManager::RealEscape($_operatorId)."')) OR (`chat_type`=2 AND (`group_id` IN ('".implode("','",$INTERNAL[$_operatorId]->Groups)."') OR `group_id`='".GROUP_EVERYONE_INTERN."')) OR (`chat_type`=0 AND `internal_id` LIKE '%".$_operatorId."%'))";
        }
        return "";
    }

    static function Destroy($_chatId)
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape($_chatId)."' LIMIT 1;");
    }

    static function GetPosts($_receiver, $_chatId)
    {
        $posts = array();
        $_chatId = (!empty($_chatId)) ? " AND `chat_id`='".DBManager::RealEscape($_chatId)."'" : "";
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_POSTS."` WHERE `receiver`='".DBManager::RealEscape($_receiver)."' AND `received`=0".$_chatId." ORDER BY `time` ASC, `micro` ASC;"))
            while($row = DBManager::FetchArray($result))
                $posts[] = $row;
        return $posts;
    }
}

class Filter extends BaseObject
{
    public $IP;
    public $Expiredate;
    public $Userid;
    public $Reason;
    public $Filtername;
    public $Activestate;
    public $Exertion;
    public $Languages;
    public $Countries;
    public $AllowChats;
    public $AllowTickets;
    public $AllowTracking;

    function Filter($_id)
    {
        $this->Id = $_id;
        $this->Edited = time();
    }

    function GetXML()
    {
        return "<val active=\"".base64_encode($this->Activestate)."\" atr=\"".base64_encode(($this->AllowTracking) ? "1" : "0")."\" at=\"".base64_encode(($this->AllowTickets) ? "1" : "0")."\" ac=\"".base64_encode(($this->AllowChats) ? "1" : "0")."\" edited=\"".base64_encode($this->Edited)."\" editor=\"".base64_encode($this->Editor)."\" c=\"".base64_encode($this->Countries)."\" expires=\"".base64_encode($this->Expiredate)."\" creator=\"".base64_encode($this->Creator)."\" created=\"".base64_encode($this->Created)."\" userid=\"".base64_encode($this->Userid)."\" ip=\"".base64_encode($this->IP)."\" filtername=\"".base64_encode($this->Filtername)."\" filterid=\"".base64_encode($this->Id)."\" reason=\"".base64_encode($this->Reason)."\" exertion=\"".base64_encode($this->Exertion)."\" languages=\"".base64_encode($this->Languages)."\" />\r\n";
    }

    function Load()
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_FILTERS."` WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
            $this->SetValues($row);
    }

    function SetValues($_row)
    {
        $this->Creator = $_row["creator"];
        $this->Created = $_row["created"];
        $this->Editor = $_row["editor"];
        $this->Edited = $_row["edited"];
        $this->IP = $_row["ip"];
        $this->Expiredate = $_row["expiredate"];
        $this->Userid = $_row["visitor_id"];
        $this->Reason = $_row["reason"];
        $this->Filtername = $_row["name"];
        $this->Id = $_row["id"];
        $this->Activestate = $_row["active"];
        $this->Exertion = $_row["exertion"];
        $this->Languages = $_row["languages"];
        $this->Countries = $_row["countries"];
        $this->AllowChats = !empty($_row["allow_chats"]);
        $this->AllowTickets = !empty($_row["allow_tickets"]);
        $this->AllowTracking = !empty($_row["allow_tracking"]);
    }

    function Save()
    {
        $this->Destroy();
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_FILTERS."` (`creator`, `created`, `editor`, `edited`, `ip`, `expiredate`, `visitor_id`, `reason`, `name`, `id`, `active`, `exertion`, `languages`, `countries`, `allow_chats`, `allow_tickets`, `allow_tracking`) VALUES ('".DBManager::RealEscape($this->Creator)."', '".DBManager::RealEscape($this->Created)."','".DBManager::RealEscape($this->Editor)."', '".DBManager::RealEscape($this->Edited)."','".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($this->Expiredate)."','".DBManager::RealEscape($this->Userid)."', '".DBManager::RealEscape($this->Reason)."','".DBManager::RealEscape($this->Filtername)."', '".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Activestate)."', '".DBManager::RealEscape($this->Exertion)."','".DBManager::RealEscape($this->Languages)."', '".DBManager::RealEscape($this->Countries)."', ".intval(($this->AllowChats) ? 1 : 0).", ".intval(($this->AllowTickets) ? 1 : 0).", ".intval(($this->AllowTracking) ? 1 : 0).");");
    }

    function Destroy()
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_FILTERS."` WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    static function IsFlood($_ip,$_userId)
    {
        global $CONFIG;
        if(empty($CONFIG["gl_atflt"]))
            return false;
        $sql = "SELECT * FROM `".DB_PREFIX.DATABASE_VISITORS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_VISITOR_BROWSERS."` AS t2 ON t1.id=t2.visitor_id WHERE t1.`ip`='".DBManager::RealEscape($_ip)."' AND `t2`.`created`>".(time()-FLOOD_PROTECTION_TIME) . " AND `t1`.`visit_latest`=1";
        if($result = queryDB(true,$sql));
        if(DBManager::GetRowCount($result) >= FLOOD_PROTECTION_SESSIONS)
        {
            Filter::CreateFloodFilter($_ip,$_userId);
            return true;
        }
        return false;
    }

    static function CreateFloodFilter($_ip,$_userId)
    {
        global $FILTERS;
        initData(array("FILTERS"));
        foreach($FILTERS->Filters as $currentFilter)
            if($currentFilter->IP == $_ip && !empty($currentFilter->IP) && $currentFilter->Activestate == 1)
                return;
        Filter::Create($_ip,$_userId,"AUTO FLOOD FILTER");
    }

    static function Create($_ip,$_userId,$_reason,$_expireDays=2,$_cookie=false,$_chats=false)
    {
        $filter = new Filter(md5(uniqid(rand())));
        $filter->Creator = "SYSTEM";
        $filter->Created = time();
        $filter->Editor = "SYSTEM";
        $filter->Edited = time();
        $filter->IP = $_ip;
        $filter->Expiredate = $_expireDays*86400;
        $filter->Userid = $_userId;
        $filter->Reason = "";
        $filter->Filtername = $_reason;
        $filter->Activestate = 1;
        $filter->Exertion = 0;
        $filter->Languages = "";
        $filter->Countries = "";
        $filter->AllowChats = $_chats;
        $filter->Save();
        if($_cookie)
            setCookieValue(OO_TRACKING_FILTER_NAME,"1");
    }
}

class FilterList
{
	public $Filters;
	public $Message;
	
	function FilterList()
   	{
		$this->Filters = Array();
   	}
	
	function Populate()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_FILTERS."`;"))
			while($row = DBManager::FetchArray($result))
			{
				$filter = new Filter($row["id"]);
				$filter->SetValues($row);
				$this->Filters[$filter->Id] = $filter;
			}
	}
	
	function Match($_ip,$_languages,$_userid,$_country="")
	{
        global $DEFAULT_BROWSER_LANGUAGE;
		foreach($this->Filters as $filter)
		{
			if($filter->Activestate == FILTER_TYPE_INACTIVE)
				continue;

			$this->Message = $filter->Reason;
			$compare["match_ip"] = jokerCompare($filter->IP,$_ip);

			if(empty($DEFAULT_BROWSER_LANGUAGE))
				$compare["match_lang"] = $this->IsoListCompare($_languages,$filter->Languages);
			else
				$compare["match_lang"] = $this->IsoListCompare($DEFAULT_BROWSER_LANGUAGE,$filter->Languages);

            $compare["match_country"] = $this->IsoListCompare($_country,$filter->Countries);
			$compare["match_id"] = ($filter->Userid == $_userid);

			if($compare["match_ip"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->IP))
				define("ACTIVE_FILTER_ID",$filter->Id);
			else if(!$compare["match_ip"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->IP))
				define("ACTIVE_FILTER_ID",$filter->Id);
			else if($compare["match_lang"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Languages))
				define("ACTIVE_FILTER_ID",$filter->Id);
			else if(!$compare["match_lang"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Languages))
				define("ACTIVE_FILTER_ID",$filter->Id);

            else if($compare["match_country"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Countries))
                define("ACTIVE_FILTER_ID",$filter->Id);
            else if(!$compare["match_country"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Countries))
                define("ACTIVE_FILTER_ID",$filter->Id);

			else if($compare["match_id"] && $filter->Exertion == FILTER_EXERTION_BLACK && !empty($filter->Userid))
				define("ACTIVE_FILTER_ID",$filter->Id);
			else if(!$compare["match_id"] && $filter->Exertion == FILTER_EXERTION_WHITE && !empty($filter->Userid))
				define("ACTIVE_FILTER_ID",$filter->Id);

			if(defined("ACTIVE_FILTER_ID"))
            {
                define("FILTER_ALLOW_TICKETS",$filter->AllowTickets);
                define("FILTER_ALLOW_TRACKING",$filter->AllowTracking);
                define("FILTER_ALLOW_CHATS",$filter->AllowChats);
				return true;
            }
		}
		return false;
	}
	
	function IpCompare($_ip, $_comparer)
	{
		$array_ip = explode(".",$_ip);
		$array_comparer = explode(".",$_comparer);
		if(count($array_ip) == 4 && count($array_comparer) == 4)
		{
			foreach($array_ip as $key => $octet)
			{
				if($array_ip[$key] != $array_comparer[$key])
				{
					if($array_comparer[$key] == -1)
						return true;
					return false;
				}
			}
			return true;
		}
		else
			return false;
	}
	
	function IsoListCompare($_lang, $_comparer)
	{
		$array_lang = explode(",",$_lang);
		$array_comparer = explode(",",$_comparer);
		foreach($array_lang as $key => $lang)
			foreach($array_comparer as $langc)
				if(strtoupper($array_lang[$key]) == strtoupper($langc))
					return true;
		return false;
	}
}

class EventList
{
	public $Events;
	
	function EventList()
   	{
		$this->Events = Array();
   	}
	function GetActionById($_id)
	{
		foreach($this->Events as $event)
		{
			foreach($event->Actions as $action)
				if($action->Id == $_id)
					return $action;
		}
		return null;
	}
}

class HistoryUrl
{
    public $Url;
    public $Referrer;
    public $Entrance;
    public static $SearchEngines = array("s"=>array("*nigma*"),"blocked"=>array("*doubleclick.net*"),"q"=>array("*search.*","*searchatlas*","*suche.*","*google.*","*bing.*","*ask*","*alltheweb*","*altavista*","*gigablast*"),"p"=>array("*search.yahoo*"),"query"=>array("*hotbot*","*lycos*"),"key"=>array("*looksmart*"),"text"=>array("*yandex*"),"wd"=>array("*baidu.*"),"searchTerm"=>array("*search.*"),"debug"=>array("*127.0.0.1*"));
    public static $SearchEngineEncodings = array("gb2312"=>array("*baidu.*"));
    public static $ExternalCallers = array("*.google.*","*.googleusercontent.*","*.translate.ru*","*.youdao.com*","*.bing.*","*.yahoo.*");

    function HistoryURL()
    {
        if(func_num_args() == 1)
        {
            $_row = func_get_arg(0);
            $this->Url = new BaseURL($_row["url_dom"],$_row["url_path"],"",$_row["url_title"]);
            $this->Url->Params = $_row["params"];
            $this->Url->Untouched = $_row["untouched"];
            $this->Url->MarkInternal();
            $this->Referrer = new BaseURL($_row["ref_dom"],$_row["ref_path"],"",$_row["ref_title"]);
            $this->Referrer->Untouched = $_row["ref_untouched"];
            $this->Entrance = $_row["entrance"];
        }
        else if(func_num_args() == 2)
        {
            $_row = func_get_arg(0);
            $this->Url = new BaseURL();
            $this->Url->AreaCode = $_row["area_code"];
            $this->Url->Params = $_row["params"];
            $this->Url->Untouched = $_row["untouched"];
            $this->Referrer = new BaseURL();
            $this->Referrer->Untouched = $_row["ref_untouched"];
            $this->Entrance = $_row["entrance"];
            $this->Url->PageTitle = $_row["title"];
        }
        else
        {
            $this->Url = new BaseURL(func_get_arg(0));
            $this->Url->AreaCode = func_get_arg(1);
            $this->Url->PageTitle = cutString(func_get_arg(2),255);
            $this->Url->MarkInternal();
            $this->Referrer = new BaseURL(func_get_arg(3));
            $this->Entrance = func_get_arg(4);
        }
    }

    function Destroy($_browserId)
    {
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` WHERE `browser_id`='".DBManager::RealEscape($_browserId)."' AND `entrance`='".DBManager::RealEscape($this->Entrance)."' LIMIT 1;");
    }

    function Save($_browserId,$_entrance)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` SET `is_exit`=0 WHERE `browser_id`='".DBManager::RealEscape($_browserId)."';");
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_BROWSER_URLS."` (`browser_id`, `entrance`, `referrer`, `url`, `params`, `untouched`, `title`, `ref_untouched`, `is_entrance`, `is_exit`, `area_code`) VALUES ('".DBManager::RealEscape($_browserId)."', '".DBManager::RealEscape($this->Entrance)."', '".DBManager::RealEscape($this->Referrer->Save())."', '".DBManager::RealEscape($this->Url->Save())."', '".DBManager::RealEscape($this->Url->Params)."', '".DBManager::RealEscape($this->Url->Untouched)."', '".DBManager::RealEscape($this->Url->PageTitle)."', '".DBManager::RealEscape($this->Referrer->Untouched)."', ".DBManager::RealEscape($_entrance ? 1 : 0).", 1, '".DBManager::RealEscape($this->Url->AreaCode)."');");
    }
}

class BaseURL
{
    public $Path = "";
    public $Params = "";
    public $Domain = "";
    public $AreaCode = "";
    public $PageTitle = "";
    public $IsExternal = true;
    public $IsSearchEngine = false;
    public $Excluded;
    public $Untouched = "";

    function BaseURL()
    {
        global $CONFIG;
        if(func_num_args() == 1)
        {
            if(!isnull(func_get_arg(0)))
            {
                $this->Untouched = func_get_arg(0);
                $parts = $this->ParseURL($this->Untouched);
                $this->Domain = $parts[0];
                $this->Path = substr($parts[1],0,255);
                $this->Params = $parts[2];
            }
            else
                $this->MarkInternal();
        }
        else if(func_num_args() == 0)
        {
            return;
        }
        else if(func_num_args() == 4)
        {
            $this->Domain = func_get_arg(0);
            $this->Path = func_get_arg(1);
            $this->AreaCode = func_get_arg(2);
            $this->PageTitle = cutString(func_get_arg(3),255);
        }

        $domains = explode(",",$CONFIG["gl_doma"]);
        if(!empty($CONFIG["gl_doma"]) && !empty($this->Domain) && is_array($domains))
        {
            foreach($domains as $bldom)
            {
                $match = jokerCompare($bldom,$this->Domain);
                if((!empty($CONFIG["gl_bldo"]) && $match) || (empty($CONFIG["gl_bldo"]) && !$match))
                {
                    $this->Excluded = true;
                    break;
                }
            }
        }
    }

    function GetAbsoluteUrl()
    {
        if(!empty($this->Untouched))
            return $this->Untouched;
        else
            return $this->Domain . $this->Path;
    }

    function Save()
    {
        if($this->IsExternal)
            $pid = getValueId(DATABASE_VISITOR_DATA_PATHS,"path",$this->Path.$this->Params,false,255);
        else
            $pid = getValueId(DATABASE_VISITOR_DATA_PATHS,"path",$this->Path,false,255);
        $did = $this->GetDomainId();
        $tid = $this->GetTitleId($did,$pid,0);
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` (`id`,`path`,`domain`,`title`) VALUES (NULL, '".DBManager::RealEscape($pid)."',  '".DBManager::RealEscape($did)."',  '".DBManager::RealEscape($tid)."');");
        $row = DBManager::FetchArray(queryDB(true,"SELECT `id`,`title` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` WHERE `path`='".DBManager::RealEscape($pid)."' AND `domain`='".DBManager::RealEscape($did)."';"));
        if(STATS_ACTIVE && $tid != $row["title"])
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_DATA_PAGES."` SET `title`=(SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` WHERE id='".DBManager::RealEscape($tid)."' OR id='".DBManager::RealEscape($row["title"])."' ORDER BY `confirmed` DESC LIMIT 1) WHERE `path`='".DBManager::RealEscape($pid)."' AND `domain`='".DBManager::RealEscape($did)."';");
        return $row["id"];
    }

    function MarkInternal()
    {
        foreach(HistoryUrl::$ExternalCallers as $value)
            if(jokerCompare($value,$this->Domain))
                return;
        $this->IsExternal = false;
    }

    function MarkSearchEngine()
    {
        $this->IsSearchEngine = true;
        $this->Params =
        $this->Path = "";
    }

    function GetTitleId()
    {
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` (`id`, `title`) VALUES (NULL, '".DBManager::RealEscape($this->PageTitle)."');");
        if(STATS_ACTIVE && !empty($this->PageTitle))
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` SET `confirmed`=`confirmed`+1 WHERE `title`='".DBManager::RealEscape($this->PageTitle)."' LIMIT 1;");
        $row = DBManager::FetchArray(queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_TITLES."` WHERE `title`='".DBManager::RealEscape($this->PageTitle)."';"));
        return $row["id"];
    }

    function GetDomainId()
    {
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` (`id`, `domain`, `search`) VALUES (NULL, '".DBManager::RealEscape($this->Domain)."', '".DBManager::RealEscape((!$this->IsExternal && $this->IsSearchEngine)?1:0)."');");
        if(!$this->IsExternal)
        {
            $row = DBManager::FetchArray(queryDB(true,"SELECT `id`,`external`,`search` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` WHERE `domain`='".DBManager::RealEscape($this->Domain)."';"));
            if(!empty($row["external"]))
            {
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` SET `external`=0 WHERE `domain`='".DBManager::RealEscape($this->Domain)."';");
            }
        }
        else
        {
            $row = DBManager::FetchArray(queryDB(true,"SELECT `id`,`search` FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` WHERE `domain`='".DBManager::RealEscape($this->Domain)."';"));
        }
        if($this->IsExternal && $this->IsSearchEngine && empty($row["search"]))
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` SET `search`=1 WHERE `domain`='".DBManager::RealEscape($this->Domain)."';");
        return $row["id"];
    }

    function IsInternalDomain()
    {
        $row = DBManager::FetchArray($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_VISITOR_DATA_DOMAINS."` WHERE `domain`='".DBManager::RealEscape($this->Domain)."';"));
        if(DBManager::GetRowCount($result) == 1 && empty($row["external"]))
            return true;
        return false;
    }

    function ParseURL($_url,$allowedParams="",$cutParams="",$domain="",$path="")
    {
        $allowed = (STATS_ACTIVE) ? StatisticProvider::$AllowedParameters : array();
        $igfilenames = (STATS_ACTIVE) ? StatisticProvider::$HiddenFilenames : array();
        $parts = parse_url(str_replace("///","//",$_url));
        $uparts = explode("?",$_url);
        if(count($allowed)>0 && count($uparts)>1)
        {
            $pparts = explode("&",$uparts[1]);
            foreach($pparts as $part)
            {
                $paramparts = explode("=",$part);
                if(in_array(strtolower($paramparts[0]),$allowed))
                {
                    if(empty($allowedParams))
                        $allowedParams .= "?";
                    else
                        $allowedParams .= "&";

                    $allowedParams .= $paramparts[0];
                    if(count($paramparts)>1)
                        $allowedParams .= "=".$paramparts[1];
                }
                else
                {
                    if(!empty($cutParams))
                        $cutParams .= "&";
                    $cutParams .= $paramparts[0];
                    if(count($paramparts)>1)
                        $cutParams .= "=".$paramparts[1];
                }
            }
        }
        if(!empty($cutParams) && empty($allowedParams))
            $cutParams = "?" . $cutParams;
        else if(!empty($cutParams) && !empty($allowedParams))
            $cutParams = "&" . $cutParams;
        else if(empty($cutParams) && empty($allowedParams) && count($uparts) > 1)
            $cutParams = "?" . $uparts[1];

        $partsb = @explode($parts["host"],$_url);

        if(!isset($parts["host"]))
            $parts["host"] = "localhost";

        $domain = $partsb[0].$parts["host"];
        $path = substr($uparts[0],strlen($domain),strlen($uparts[0])-strlen($domain));
        $path = str_replace($igfilenames,"",$path);
        return array($domain,$path.$allowedParams,$cutParams);
    }

    static function IsInputURL()
    {
        return !empty($_GET[GET_TRACK_URL]) || !empty($_GET["u"]);
    }

    static function GetInputURL()
    {
        if(!empty($_GET[GET_TRACK_URL]))
            return base64UrlDecode(getOParam(GET_TRACK_URL,"",$nu,FILTER_SANITIZE_URL,null,2056));
        // comp < 5.3.x
        else if(!empty($_GET["u"]))
            return getOParam("u","",$nu,FILTER_SANITIZE_URL,null,2056);
        return "";
    }
}

class Rating extends Action
{
	public $Fullname = "";
	public $Email="";
	public $Company="";
	public $OperatorSystemId="";
	public $UserId="";
	public $RateQualification=0;
	public $RatePoliteness=0;
	public $RateComment=0;
    public $ChatId=0;

	function Rating()
	{
		$this->Id = func_get_arg(0);
		if(func_num_args() == 2)
		{
			$row = func_get_arg(1);
			$this->RateComment = $row["comment"];
			$this->RatePoliteness = $row["politeness"];
			$this->RateQualification = $row["qualification"];
			$this->Fullname = $row["fullname"];
			$this->Email = $row["email"];
			$this->Company = $row["company"];
			$this->OperatorSystemId = $row["internal_id"];
			$this->UserId = $row["user_id"];
			$this->Created = $row["time"];
            $this->ChatId = $row["chat_id"];
		}
	}
	
	function GetXML($_internal,$_full)
	{
		if($_full)
		{
			$intern = (isset($_internal[Operator::GetSystemId($this->OperatorSystemId)])) ? $_internal[Operator::GetSystemId($this->OperatorSystemId)]->Fullname : $this->OperatorSystemId;
			return "<val id=\"".base64_encode($this->Id)."\" cr=\"".base64_encode($this->Created)."\" rc=\"".base64_encode($this->RateComment)."\" rp=\"".base64_encode($this->RatePoliteness)."\" rq=\"".base64_encode($this->RateQualification)."\" fn=\"".base64_encode($this->Fullname)."\" em=\"".base64_encode($this->Email)."\" co=\"".base64_encode($this->Company)."\" ii=\"".base64_encode($intern)."\" ui=\"".base64_encode($this->UserId)."\" />\r\n";
		}
		else
			return "<val id=\"".base64_encode($this->Id)."\" cr=\"".base64_encode($this->Created)."\" />\r\n";
	}

    function Save($_chatId)
    {
        global $CONFIG;
        $time = time();
        while(true)
        {
            queryDB(true,"SELECT `time` FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE `time`=".DBManager::RealEscape($time).";");
            if(DBManager::GetAffectedRowCount() > 0)
                $time++;
            else
                break;
        }

        if(!empty($CONFIG["gl_anra"]))
            $this->Company = $this->Email = $this->Fullname = $this->UserId = $_chatId = $this->OperatorSystemId = "?";

        queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_RATINGS."` (`id` ,`time` ,`user_id` ,`internal_id` ,`fullname` ,`email` ,`company` ,`qualification` ,`politeness` ,`comment`, `ip`, `chat_id`) VALUES ('".DBManager::RealEscape($this->Id)."', ".DBManager::RealEscape($time)." , '".DBManager::RealEscape($this->UserId)."', '".DBManager::RealEscape($this->OperatorSystemId)."', '".DBManager::RealEscape($this->Fullname)."', '".DBManager::RealEscape($this->Email)."', '".DBManager::RealEscape($this->Company)."', '".DBManager::RealEscape($this->RateQualification)."', '".DBManager::RealEscape($this->RatePoliteness)."', '".DBManager::RealEscape($this->RateComment)."', '".DBManager::RealEscape(getIP())."', '".DBManager::RealEscape($_chatId)."');");
    }

    static function IsFlood()
    {
        $result = queryDB(true,"SELECT count(id) AS `rating_count` FROM `".DB_PREFIX.DATABASE_RATINGS."` WHERE `time`>".DBManager::RealEscape(time()-86400)." AND `ip`='".DBManager::RealEscape(getIP())."';");
        if($result)
        {
            $row = DBManager::FetchArray($result);
            return ($row["rating_count"] >= MAX_RATES_PER_DAY);
        }
        else
            return true;
    }
}

class TicketEditor extends BaseObject
{
    public $GroupId = "";
    public $TicketId = "";

	function TicketEditor()
	{
        if(func_num_args()>0)
        {
            $this->Id = func_get_arg(0);
            if(func_num_args() == 2)
            {
                $row = func_get_arg(1);
                $this->Editor = $row["editor_id"];
                $this->GroupId = $row["group_id"];
                $this->Status =  $row["status"];
                $this->Edited =  $row["time"];
            }
        }
	}
	
	function GetXML($_waitBegin=0,$_lastUpdate=0)
	{
		return "<cl id=\"".base64_encode($this->Id)."\" w=\"".base64_encode($_waitBegin)."\" u=\"".base64_encode($_lastUpdate)."\" st=\"".base64_encode($this->Status)."\" ed=\"".base64_encode($this->Editor)."\" g=\"".base64_encode($this->GroupId)."\" ti=\"".base64_encode($this->Edited)."\"/>\r\n";
	}
	
	function Save()
	{
		queryDB(false,"UPDATE `".DB_PREFIX.DATABASE_TICKET_EDITORS."` SET `editor_id`='".DBManager::RealEscape($this->Editor)."',`group_id`='".DBManager::RealEscape($this->GroupId)."',`status`='".DBManager::RealEscape($this->Status)."',`time`='".DBManager::RealEscape(time())."' WHERE `ticket_id`='".DBManager::RealEscape($this->Id)."';");
		if(DBManager::GetAffectedRowCount() <= 0)
			queryDB(false,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_TICKET_EDITORS."` (`ticket_id` ,`editor_id` ,`group_id` ,`status`,`time`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Editor)."','".DBManager::RealEscape($this->GroupId)."', '".DBManager::RealEscape($this->Status)."', '".DBManager::RealEscape(time())."');");
	}

    function Destroy()
    {
        queryDB(false,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_EDITORS."` WHERE `ticket_id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    static function GetTicketCountByEditor($_systemId)
    {
        $result = queryDB(true,"SELECT COUNT(*) AS `open_tickets` FROM `".DB_PREFIX.DATABASE_TICKET_EDITORS."` WHERE `editor_id`='".DBManager::RealEscape($_systemId)."' AND `status` < 2;");
        if($result && $row = DBManager::FetchArray($result))
            return $row["open_tickets"];
        return 0;
    }
}

class TicketChat extends TicketMessage
{
    function TicketChat()
    {
        $this->Id = func_get_arg(1);
        if(func_num_args() == 3)
        {
            $this->ChannelId = func_get_arg(0);
            $this->Type = "2";
        }
        else
        {
            $row = func_get_arg(0);
            $this->Text = str_replace(array("%eemail%","%efullname%"),array($row["email"],$row["fullname"]),$row["plaintext"]);
            $this->Type = "2";
            $this->Fullname = $row["fullname"];
            $this->Email = $row["email"];
            $this->Company = $row["company"];
            $this->ChannelId = $row["chat_id"];
            $this->IP = $row["ip"];
            $this->SenderUserId = $row["external_id"];
            $this->Edited = time();
            $this->Created = $row["time"];
            $this->Country = $row["iso_country"];
            $this->Phone = $row["phone"];
            $this->Subject = $row["question"];
        }
    }
}

class TicketMessage extends Action
{
	public $Type = 0;
	public $Customs= "";
	public $Country= "";
	public $CallMeBack = false;
	public $ChannelId = "";
	public $Attachments = array();
    public $Edited = 0;
    public $Hash = "";
    public $Subject = "";
    public $Comments = array();
    public $TicketId;

	function TicketMessage()
	{
		if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
		}
		else if(func_num_args() > 0)
		{
			$row = func_get_arg(0);
            $this->SetValues($row);
		}
	}

    function SetValues($_row)
    {
        $this->Id = $_row["id"];
        $this->Text = $_row["text"];
        $this->Type = $_row["type"];
        $this->Fullname = $_row["fullname"];
        $this->Email = $_row["email"];
        $this->Company = $_row["company"];
        $this->ChannelId = $_row["channel_id"];
        $this->TicketId = $_row["ticket_id"];
        $this->IP = $_row["ip"];
        $this->Edited = $_row["time"];
        $this->Created = $_row["created"];
        $this->Country = $_row["country"];
        $this->Phone = $_row["phone"];
        $this->Hash = $_row["hash"];
        $this->SenderUserId = $_row["sender_id"];
        $this->CallMeBack = !empty($_row["call_me_back"]);
        $this->Subject = $_row["subject"];
    }
	
    function AddComment($_operatorId, $_ticketId, $_text)
    {
        $time=GetUniqueMessageTime(DATABASE_TICKET_COMMENTS,"created");
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` (`id`, `created`, `time`, `ticket_id`, `message_id`, `operator_id`, `comment`) VALUES ('".DBManager::RealEscape(getId(32))."', '".DBManager::RealEscape($time)."','".DBManager::RealEscape($time)."', '".DBManager::RealEscape($_ticketId)."',  '".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($_operatorId)."', '".DBManager::RealEscape($_text)."');");
    }
	
	function Save($_ticketId,$_overwrite=false,$_time=null,$_ticket=null)
	{
		global $INPUTS,$INTERNAL,$CONFIG;
        $time=($_time==null)?GetUniqueMessageTime(DATABASE_TICKET_MESSAGES,"time"):$_time;
        if(empty($this->Created))
            $this->Created = $time;
        $do = ($_overwrite) ? "REPLACE" : "INSERT";
        $errorCode = -1;
        $result = queryDB(true, $do . " INTO `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` (`id` ,`time` ,`created` ,`ticket_id` ,`text` ,`fullname` ,`email` ,`company` ,`ip`, `phone` ,`call_me_back`,`country`,`type`,`sender_id`,`channel_id`,`hash`,`subject`) VALUES ('".DBManager::RealEscape($this->Id)."', ".DBManager::RealEscape($time).",".DBManager::RealEscape($this->Created).", '".DBManager::RealEscape($_ticketId)."', '".DBManager::RealEscape($this->Text)."', '".DBManager::RealEscape($this->Fullname)."', '".DBManager::RealEscape($this->Email)."', '".DBManager::RealEscape($this->Company)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($this->Phone)."', ". (($this->CallMeBack) ? 1 : 0).", '".DBManager::RealEscape($this->Country)."', '".DBManager::RealEscape($this->Type)."', '".DBManager::RealEscape($this->SenderUserId)."', '".DBManager::RealEscape($this->ChannelId)."', '".DBManager::RealEscape($this->Hash)."', '".DBManager::RealEscape($this->Subject)."');",false,$errorCode);
        if(!$result && $errorCode == 1366)
            $result = queryDB(true, $do . " INTO `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` (`id` ,`time` ,`created` ,`ticket_id` ,`text` ,`fullname` ,`email` ,`company` ,`ip`, `phone` ,`call_me_back`,`country`,`type`,`sender_id`,`channel_id`,`hash`,`subject`) VALUES ('".DBManager::RealEscape($this->Id)."', ".DBManager::RealEscape($time).",".DBManager::RealEscape($this->Created).", '".DBManager::RealEscape($_ticketId)."', '".DBManager::RealEscape(utf8_encode($this->Text))."', '".DBManager::RealEscape($this->Fullname)."', '".DBManager::RealEscape($this->Email)."', '".DBManager::RealEscape($this->Company)."', '".DBManager::RealEscape($this->IP)."', '".DBManager::RealEscape($this->Phone)."', ". (($this->CallMeBack) ? 1 : 0).", '".DBManager::RealEscape($this->Country)."', '".DBManager::RealEscape($this->Type)."', '".DBManager::RealEscape($this->SenderUserId)."', '".DBManager::RealEscape($this->ChannelId)."', '".DBManager::RealEscape($this->Hash)."', '".DBManager::RealEscape($this->Subject)."');",false,$errorCode);
        if($result)
        {
         	if(is_array($this->Customs))
				foreach($this->Customs as $i => $value)
				    queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` (`ticket_id` ,`message_id`, `custom_id` ,`value`) VALUES ('".DBManager::RealEscape($_ticketId)."','".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($INPUTS[$i]->Name)."', '".DBManager::RealEscape($value)."');");

            if($_ticket != null && !empty($CONFIG["gl_mpm"]))
                foreach($INTERNAL as $operator)
                    if($operator->IsInPushMessageState())
                        if($operator->HasAccessToTicket($_ticket))
                            $operator->AddPushMessage($_ticketId, "", (!empty($this->Fullname) ? $this->Fullname : $this->Email), 3, $this->Text);
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function ApplyCustomFromPost($_count,$_change=false,$_ticket=null,$_operatorId="")
    {
        global $INPUTS;
        foreach($INPUTS as $index => $input)
        {
            $cid = 0;
            while(isset($_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_count . "_vd_" . $cid]))
            {
                $value = $_POST[POST_INTERN_PROCESS_TICKET_ACTIONS . "_" . $_count . "_vd_" . $cid++];
                if(strpos($value,"[cf".$index."]") === 0)
                {
                    $value = base64_decode(str_replace("[cf".$index."]","",$value));
                    if($input->Custom && $input->Active)
                    {
                        $compare = (isset($this->Customs[$index])) ? $input->GetClientIndex($this->Customs[$index]) : "";
                        if($_change && $compare != $value)
                            $this->ChangeValue($_ticket,$index+16,$_operatorId,$compare,$value);
                        $this->Customs[$index] = $value;
                    }
                }
            }
        }
    }
	
	function LoadAttachments()
	{
        $this->Attachments = array();
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` INNER JOIN `".DB_PREFIX.DATABASE_RESOURCES."` ON `".DB_PREFIX.DATABASE_RESOURCES."`.`id`=`".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."`.`res_id` WHERE `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."`.`parent_id`='".DBManager::RealEscape($this->Id)."';");
		if($result)
			while($rowc = DBManager::FetchArray($result))
				$this->Attachments[$rowc["res_id"]] = $rowc["title"];
	}

    function SaveAttachments()
    {
        foreach($this->Attachments as $rid => $title)
            $this->ApplyAttachment($rid);
    }

    function ApplyAttachment($_id)
    {
        queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` (`parent_id`,`res_id`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($_id)."');");
    }

    function LoadComments($_parent=null)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` WHERE `".DB_PREFIX.DATABASE_TICKET_COMMENTS."`.`message_id`='".DBManager::RealEscape($this->Id)."';");
        if($result)
            while($rowc = DBManager::FetchArray($result))
                $this->Comments[$rowc["id"]] = array("time"=>$rowc["time"],"operator_id"=>$rowc["operator_id"],"comment"=>$rowc["comment"]);
        if($_parent != null)
            $_parent->LastUpdated = max($_parent->LastUpdated,$rowc["time"],$rowc["created"]);
    }

    function SaveComments($_ticketId)
    {
        if(is_array($this->Comments))
            foreach($this->Comments as $com)
                $this->AddComment($com["operator_id"],$_ticketId,$com["comment"]);
    }
	
	function LoadCustoms($_nameBased=false)
	{
		global $INPUTS;
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` WHERE `message_id`='".DBManager::RealEscape($this->Id)."';");
		if($result)
			while($rowc = DBManager::FetchArray($result))
				foreach($INPUTS as $input)
					if($input->Name == $rowc["custom_id"] && $input->Active)
                        if($_nameBased)
                            $this->Customs[$input->Name] = $input->GetClientValue($rowc["value"]);
                        else
                            $this->Customs[$input->Index] = $input->GetClientValue($rowc["value"]);
	}

    function Load($_indexBased=false)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `id`='".DBManager::RealEscape($this->Id)."';");
        if($result && $row = DBManager::FetchArray($result))
        {
            $this->SetValues($row);
            $this->LoadCustoms($_indexBased);
            $this->LoadAttachments();
            $this->LoadComments();
        }
    }

    function GetQuoteFormat($_html)
    {
        if(empty($this->Text))
            return "";

        $array = preg_split("/\r\n|\n|\r/", $this->Text);
        $qText = "";
        foreach($array as $line)
            if(!empty($line) && strpos(trim($line),">")!==0)
                $qText .= "\r\n> " . trim($line);

        $qText = $_html ? trim($qText) : nl2br(trim($qText));
        return $qText;
    }

    function ChangeValue($_ticket,$_logId,$_operatorId,&$_member,$_newValue)
    {
        if($_member != $_newValue)
            $_ticket->Log($_logId,$_operatorId,$_newValue,$_member,$this->Id);
        $_member = $_newValue;
    }

    function Forward($_groupId,$_toEmail,$_subject="",$_text="")
    {
        global $GROUPS;
        $att = array();
        $mailbox = Mailbox::GetById($GROUPS[$_groupId]->TicketEmailOut,true);
        foreach($this->Attachments as $resid => $title)
            $att[] = $resid;

        if(empty($_text) && !empty($this->Text))
            $_text = $this->Text;

        if($mailbox != null)
            sendMail($mailbox,str_replace(";",",",$_toEmail),$mailbox->Email,$_text,"",$_subject,false,$att);
    }
    
    function GetXML($_demand=false)
    {
        global $INPUTS;
        $xml = "<m id=\"".base64_encode($this->Id)."\" s=\"".base64_encode($this->Subject)."\" sid=\"".base64_encode($this->SenderUserId)."\" t=\"".base64_encode($this->Type)."\" c=\"".base64_encode($this->Country)."\" ci=\"".base64_encode($this->ChannelId)."\" ct=\"".base64_encode($this->Created)."\" e=\"".base64_encode($this->Edited)."\" p=\"".base64_encode($this->GetInputData(116,false))."\" cmb=\"".base64_encode(($this->CallMeBack) ? 1 : 0)."\" mt=\"".base64_encode($this->Text)."\" fn=\"".base64_encode($this->GetInputData(111,false))."\" em=\"".base64_encode($this->GetInputData(112,false))."\" co=\"".base64_encode($this->GetInputData(113,false))."\" ui=\"".base64_encode($this->SenderUserId)."\" ip=\"".base64_encode($this->IP)."\">\r\n";
        if(is_array($this->Customs))
            foreach($this->Customs as $i => $value)
            {
                $xml .= "<c id=\"".base64_encode($INPUTS[$i]->Name)."\">".base64_encode($value)."</c>\r\n";
            }

        if(is_array($this->Attachments))
            foreach($this->Attachments as $i => $value)
                $xml .= "<a id=\"".base64_encode($i)."\">".base64_encode($value)."</a>\r\n";

        if($_demand && is_array($this->Comments))
            foreach($this->Comments as $id => $value)
                $xml .= "<co i=\"".base64_encode($id)."\" t=\"".base64_encode($value["time"])."\" o=\"".base64_encode($value["operator_id"])."\">".base64_encode($value["comment"])."</co>\r\n";
        return $xml . "</m>";
    }

    function AppendPostFile($_postKey,$_userId)
    {
        if(!empty($_FILES[$_postKey]) && true)
        {
            $filename = namebase($_FILES[$_postKey]['name']);
            if(!isValidUploadFile($filename))
                return $filename;
            $fileId = getId(32);
            $fileurid = $_userId . "_" . $fileId;

            if(move_uploaded_file($_FILES[$_postKey]["tmp_name"], PATH_UPLOADS . $fileurid))
            {
                processResource("SYSTEM",$fileId,$fileurid,3,$filename,0,100,$_FILES[$_postKey]["size"]);
                $this->ApplyAttachment($fileId);
                return $filename;
            }
        }
    }

    function TextReplace($_text,$_group)
    {
        global $INPUTS,$GROUPS;
        $details=$cv="";

        if($INPUTS[111]->Active && !empty($this->Fullname))
            $details .= strip_tags($INPUTS[111]->Caption) ." " . $this->Fullname . "\r\n";
        if($INPUTS[112]->Active && !empty($this->Email))
            $details .= strip_tags($INPUTS[112]->Caption) ." " . $this->Email . "\r\n";
        if($INPUTS[113]->Active && !empty($this->Company))
            $details .= strip_tags($INPUTS[113]->Caption) ." " . $this->Company . "\r\n";
        if(($INPUTS[116]->Active || $this->CallMeBack) && !empty($this->Phone))
            $details .= strip_tags($INPUTS[116]->Caption) ." " . $this->Phone . "\r\n";

        $_text = str_replace("%external_phone%",$this->Phone,$_text);
        $_text = str_replace("%external_name%",$this->Fullname,$_text);
        $_text = str_replace("%external_email%",$this->Email,$_text);
        $_text = str_replace("%external_company%",$this->Company,$_text);
        $_text = str_replace("%external_phone%",$this->Phone,$_text);
        $_text = str_replace("%external_ip%",$this->IP,$_text);
        $_text = str_replace("%ticket_id%",$this->Id,$_text);
        $_text = str_replace("%subject%",$this->Subject,$_text);

        foreach($INPUTS as $index => $input)
            if($input->Active && $input->Custom && !isset($GROUPS[$_group]->TicketInputsHidden[$index]))
            {
                if($input->Type == "CheckBox")
                    $details .= strip_tags($input->Caption). " " . ($cv = ((!empty($this->Customs[$index])) ? "<!--lang_client_yes-->" : "<!--lang_client_no-->")) . "\r\n";
                else if(!empty($this->Customs[$index]))
                    $details .= strip_tags($input->Caption). " " . ($cv = $input->GetClientValue($this->Customs[$index])) . "\r\n";
                $_text = str_replace("%custom".$index."%",$cv,$_text);
            }

        $_text = str_replace("%details%",$details,$_text);
        return $_text;
    }

    function SetChannelId($_cId)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` SET `channel_id`='".DBManager::RealEscape($_cId)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    static function Exists($_id)
    {
        $result = queryDB(true,"SELECT `channel_id` FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `channel_id`='".DBManager::RealEscape($_id)."';");
        if($result && DBManager::GetRowCount($result) > 0)
            return true;
        return false;
    }
}

class TicketEmail
{
    public $Id = "";
    public $Name = "";
    public $Email = "";
    public $Subject = "";
    public $Body = "";
    public $BodyHTML = "";
    public $Created = 0;
    public $Deleted = false;
    public $MailboxId = "";
    public $Edited = "";
    public $GroupId = "";
    public $ReplyTo = "";
    public $ReceiverEmail = "";
    public $Attachments = array();
    public $EditorId = "";

    function TicketEmail()
    {
        if(func_num_args() == 3)
        {
            $this->Id = func_get_arg(0);
            $this->Deleted = func_get_arg(1);
            $this->EditorId = func_get_arg(2);
        }
        else if(func_num_args() == 1)
        {
            $row = func_get_arg(0);
            $this->Id = $row["email_id"];
            $this->Name = $row["sender_name"];
            $this->Email = $row["sender_email"];
            $this->Subject = $row["subject"];
            $this->Body = $row["body"];
            $this->Created = $row["created"];
            $this->Deleted = !empty($row["deleted"]);
            $this->MailboxId = $row["mailbox_id"];
            $this->Edited = $row["edited"];
            $this->GroupId = $row["group_id"];
            $this->ReplyTo = $row["sender_replyto"];
            $this->ReceiverEmail = $row["receiver_email"];
            $this->EditorId = $row["editor_id"];
        }
    }

    function LoadAttachments()
    {
        $this->Attachments = array();
        $result = queryDB(true,"SELECT `res_id` FROM `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` WHERE `parent_id`='".DBManager::RealEscape($this->Id)."';");
        if($result)
            while($row = DBManager::FetchArray($result))
                $this->Attachments[$row["res_id"]] = getResource($row["res_id"]);
    }

    function SaveAttachment($_id)
    {
        queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` (`res_id`, `parent_id`) VALUES ('".DBManager::RealEscape($_id)."','".DBManager::RealEscape($this->Id)."');");
    }

    function SetStatus()
    {
        $ownership = (!empty($this->EditorId)) ? "(editor_id='".DBManager::RealEscape($this->EditorId)."' OR editor_id='') AND " : "";
        $time=GetUniqueMessageTime(DATABASE_TICKET_EMAILS,"edited");
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_EMAILS."` SET `deleted`=".($this->Deleted ? 1 : 0).",`edited`=".($time).",`editor_id`='".DBManager::RealEscape($this->EditorId)."' WHERE ".$ownership."`email_id`='" . DBManager::RealEscape($this->Id) . "' LIMIT 1;");
    }

    function GetXML($_full=true)
    {
        if($this->Deleted)
            $xml = "<e id=\"".base64_encode($this->Id)."\" ed=\"".base64_encode($this->Edited)."\" ei=\"".base64_encode($this->EditorId)."\" d=\"".base64_encode($this->Deleted)."\">\r\n";
        else if($_full)
        {
            $xml = "<e id=\"".base64_encode($this->Id)."\" ei=\"".base64_encode($this->EditorId)."\" r=\"".base64_encode($this->ReceiverEmail)."\" g=\"".base64_encode($this->GroupId)."\" e=\"".base64_encode($this->Email)."\" rt=\"".base64_encode($this->ReplyTo)."\" ed=\"".base64_encode($this->Edited)."\" s=\"".base64_encode($this->Subject)."\" n=\"".base64_encode($this->Name)."\" c=\"".base64_encode($this->Created)."\" d=\"".base64_encode($this->Deleted)."\" m=\"".base64_encode($this->MailboxId)."\"><c>".base64_encode($this->Body)."</c>\r\n";
            foreach($this->Attachments as $res)
                $xml .= "<a n=\"".base64_encode($res["title"])."\">".base64_encode($res["id"])."</a>\r\n";
        }
        else
            $xml = "<e id=\"".base64_encode($this->Id)."\" ed=\"".base64_encode($this->Edited)."\">\r\n";

        return $xml . "</e>\r\n";
    }

    function Load()
    {
        $result = queryDB(true,"SELECT `created` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `email_id`='".DBManager::RealEscape($this->Id)."';");
        if($result && $row = DBManager::FetchArray($result))
            $this->Created = $row["created"];
    }

    function Save()
    {
        if ($this->Deleted)
            $this->Destroy();
        else
        {
            $time=GetUniqueMessageTime(DATABASE_TICKET_EMAILS,"edited");
            queryDB(true, "REPLACE INTO `" . DB_PREFIX . DATABASE_TICKET_EMAILS . "` (`email_id`, `mailbox_id`, `sender_email`, `sender_name`,`sender_replyto`,`receiver_email`, `created`, `edited`, `deleted`, `subject`, `body`, `body_html`, `group_id`) VALUES ('" . DBManager::RealEscape($this->Id) . "', '" . DBManager::RealEscape($this->MailboxId) . "', '" . DBManager::RealEscape($this->Email) . "', '" . DBManager::RealEscape($this->Name) . "', '" . DBManager::RealEscape($this->ReplyTo) . "','" . DBManager::RealEscape($this->ReceiverEmail) . "', '" . DBManager::RealEscape($this->Created) . "', '" . DBManager::RealEscape($time) . "', '" . DBManager::RealEscape($this->Deleted ? 1 : 0) . "', '" . DBManager::RealEscape($this->Subject) . "', '" . DBManager::RealEscape($this->Body) . "','" . DBManager::RealEscape($this->BodyHTML) . "', '" . DBManager::RealEscape($this->GroupId) . "');");
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_EMAILS);
    }

    function Destroy()
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_EMAILS."` SET `deleted`=1,`edited`='".time()."' WHERE `email_id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
        queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` WHERE `parent_id`='".DBManager::RealEscape($this->Id)."';");
    }

    static function Exists($_id,$_inEmails=true,$_inMessages=true)
    {
        if($_inEmails)
        {
            $result = queryDB(true,"SELECT `email_id` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `email_id`='".DBManager::RealEscape($_id)."';");
            if($result && DBManager::GetRowCount($result) > 0)
                return true;
        }
        if($_inMessages)
        {
            $result = queryDB(true,"SELECT `channel_id` FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `channel_id`='".DBManager::RealEscape($_id)."';");
            if($result && DBManager::GetRowCount($result) > 0)
                return true;
        }
        return false;
    }

    static function GetHTML($_id)
    {
        $result = queryDB(true,"SELECT `body_html` FROM `".DB_PREFIX.DATABASE_TICKET_EMAILS."` WHERE `email_id`='".DBManager::RealEscape($_id)."' LIMIT 1;");
        if($result)
            if($row = DBManager::FetchArray($result))
                return $row["body_html"];
    }
}

class Ticket extends Action
{
	public $Messages = array();
	public $Group = "";
	public $CreationType = 0;
    public $Language = "";
    public $Deleted = false;
    public $LastUpdated = 0;
    public $WaitBegin = 0;
    public $Editor = null;
    public $ChannelId = "";
    public $ChannelConversationId = "";

	function Ticket()
	{
        if(func_num_args() == 1)
        {
            $row = func_get_arg(0);
            $this->Id = $row["ticket_id"];
            $this->SetValues($row);
            $this->Messages[0] = new TicketMessage($row);
        }
        else if(func_num_args() == 2)
        {
            $this->Id = func_get_arg(0);
            $this->Messages[0] = new TicketMessage(getId(32),true);
            $this->Language = strtoupper(func_get_arg(1));
        }
        else if(func_num_args() == 3)
        {
            $row = func_get_arg(0);
            if(!empty($row["ticket_id"]))
                $this->Id = $row["ticket_id"];
            else
                $this->Id = $row["id"];
            $this->SetValues($row);
            $this->LoadMessages(func_get_arg(1)!=null);
            $this->LoadStatus(func_get_arg(1)!=null);
        }

        if(!empty($row) && $row["last_update"]==0 && $row["wait_begin"]==TICKET_NO_WT)
        {
            $uticket = new Ticket($this->Id,true);
            $uticket->LoadMessages();
            $uticket->LoadStatus();
            $uticket->SetLastUpdate();
            $this->LastUpdated = $uticket->LastUpdated;
            $this->WaitBegin = $uticket->WaitBegin;
        }
	}

    function SetValues($_row)
    {
        $this->Group = $_row["target_group_id"];
        $this->CreationType = $_row["creation_type"];
        $this->LastUpdated = $_row["last_update"];
        $this->Language = $_row["iso_language"];
        $this->Deleted = !empty($_row["deleted"]);
        $this->WaitBegin = $_row["wait_begin"];
        $this->ChannelId = $_row["channel_id"];
        $this->ChannelConversationId = $_row["channel_conversation_id"];
    }

    function Load($_loadStatus=true,$_loadMessages=true)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` WHERE `id`='".DBManager::RealEscape($this->Id)."';");
        if($result && $row = DBManager::FetchArray($result))
        {
            $this->SetValues($row);

            if($_loadStatus)
                $this->LoadStatus();

            if($_loadMessages)
                $this->LoadMessages();

            return true;
        }
        return false;
    }

    function LoadStatus($_json=false)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_EDITORS."` WHERE `ticket_id`='".DBManager::RealEscape($this->Id)."' LIMIT ".DBManager::RealEscape(DATA_ITEM_LOADS).";");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $this->Editor = new TicketEditor($this->Id,$row);
                $this->LastUpdated = max($this->LastUpdated,$this->Editor->Edited);
            }

        if($_json)
        {
            if($this->Editor!=null)
                $this->Editor->Editor = Operator::GetUserId($this->Editor->Editor);
            $this->Editor = array("TicketEditor"=>$this->Editor);
        }
    }

    function LoadMessages($_json=false)
    {
        $this->Messages = array();
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `ticket_id`='".DBManager::RealEscape($this->Id)."' ORDER BY `time` ASC;");
        if($result)
            while($row = DBManager::FetchArray($result))
            {
                $message = new TicketMessage($row);
                $this->LastUpdated = max($this->LastUpdated,$message->Created,$message->Edited);
                $message->LoadAttachments();
                $message->LoadCustoms($_json);
                $message->LoadComments($this);
                if($_json)
                    $this->Messages[count($this->Messages)] = array("TicketMessage"=>$message);
                else
                    $this->Messages[count($this->Messages)] = $message;
            }
    }

    function SetLastUpdate($_set=0,$_wt=true)
    {
        if(!empty($_set))
            $this->LastUpdated = $_set;

        if($this->LastUpdated == 0)
            $this->LastUpdated = 1;

        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKETS."` SET `last_update`='".DBManager::RealEscape($this->LastUpdated)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");

        if($_wt)
            $this->SetWaitBegin();
    }

    function SetWaitBegin($lastm = null)
    {
        if($this->Editor != null && $this->Editor->Status == TICKET_STATUS_CLOSED)
        {
            $this->WaitBegin = TICKET_NO_WT;
        }
        else
            foreach($this->Messages as $message)
            {
                if($message->Type < 1 || $message->Type > 2)
                {
                    $this->WaitBegin = max($this->WaitBegin,min($message->Edited,$message->Created));
                }
                $lastm = $message;
            }

        if($lastm != null && ($lastm->Type == 1 || $lastm->Type == 2))
            $this->WaitBegin = TICKET_NO_WT;

        if($this->WaitBegin == 0)
            $this->WaitBegin = TICKET_NO_WT;

       queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKETS."` SET `wait_begin`='".DBManager::RealEscape($this->WaitBegin)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

	function GetHash($_brackets=false,$_html=false)
	{
		global $CONFIG;

        if(is_numeric($this->Id))
            $hash = substr(strtoupper(md5($this->Id.$CONFIG["gl_lzid"])),0,12);
        else
            return $this->Id;

        if($_html)
            return "<!--[" . $hash . "]-->";

        return ($_brackets) ? "[" . $hash . "]" : $hash;
	}

    function GetLastOutgoingMessageId()
    {
        $id = "";
        foreach($this->Messages as $message)
           if($message->Type == 1)
               $id = $message->Id;
        return $id;
    }

	function GetXML($_full,$_demand=false)
	{
		if($_full)
		{
			$xml = "<val id=\"".base64_encode($this->Id)."\" u=\"".base64_encode($this->LastUpdated)."\" w=\"".base64_encode($this->WaitBegin)."\" del=\"".base64_encode($this->Deleted ? "1" : "0")."\" gr=\"".base64_encode($this->Group)."\" l=\"".base64_encode($this->Language)."\" h=\"".base64_encode($this->GetHash())."\" t=\"".base64_encode($this->CreationType)."\">\r\n";

            if($_demand && $this->Editor != null)
                $xml .= $this->Editor->GetXml($this->WaitBegin,$this->LastUpdated);

            foreach($this->Messages as $message)
				$xml .= $message->GetXML($_demand);
			$xml .= "</val>\r\n";
		}
		else
		{
			foreach($this->Messages as $message)
			{
				$xml = "<val id=\"".base64_encode($this->Id)."\" e=\"".base64_encode($message->Edited)."\" />\r\n";
				break;
			}
		}
		return $xml;
	}

    function LinkChat($_chatId, $messageId)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_ARCHIVE."` WHERE `chat_id`='".DBManager::RealEscape(trim($_chatId))."' AND `closed`>0 LIMIT 1;");
        if($row = DBManager::FetchArray($result))
            $chatref = new TicketChat($row, $messageId);
        else
            $chatref = new TicketChat($_chatId, $messageId, true);

        $chatref->Save($this->Id,true);
    }

    function LinkTicket($_linkTicketId)
    {
        $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKETS."` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` ON `".DB_PREFIX.DATABASE_TICKETS."`.`id`=`".DB_PREFIX.DATABASE_TICKET_MESSAGES."`.`ticket_id` WHERE `ticket_id` = '".DBManager::RealEscape($_linkTicketId)."'");
        while($result && $row = DBManager::FetchArray($result))
        {
            $Ticket = new Ticket($row);
            if(!$Ticket->Deleted)
            {
                $tm = $Ticket->Messages[0];
                $nid = getId(32);

                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` SET `message_id`='".DBManager::RealEscape($nid)."' WHERE `message_id` = '".DBManager::RealEscape($tm->Id)."';");
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_ATTACHMENTS."` SET `parent_id`='".DBManager::RealEscape($nid)."' WHERE `parent_id` = '".DBManager::RealEscape($tm->Id)."';");
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` SET `message_id`='".DBManager::RealEscape($nid)."' WHERE `message_id` = '".DBManager::RealEscape($tm->Id)."';");

                $tm->Id = $nid;
                if($tm->Type==2)
                    $tm->ChannelId = $tm->ChannelId . "_" . getId(1);
                else
                    $tm->ChannelId = getId(32);

                $tm->Save($this->Id);

                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_LOGS."` SET `time`='".DBManager::RealEscape(time())."',`ticket_id`='".DBManager::RealEscape($this->Id)."' WHERE `ticket_id` = '".DBManager::RealEscape($_linkTicketId)."';");
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_CUSTOMS."` SET `ticket_id`='".DBManager::RealEscape($this->Id)."' WHERE `ticket_id` = '".DBManager::RealEscape($_linkTicketId)."';");
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_COMMENTS."` SET `time`='".DBManager::RealEscape(time())."',`ticket_id`='".DBManager::RealEscape($this->Id)."' WHERE `ticket_id` = '".DBManager::RealEscape($_linkTicketId)."';");

                $Ticket->Destroy();
            }
        }
        $this->Log(4,CALLER_SYSTEM_ID,$this->Id,$_linkTicketId);

    }

    function SendEditorReply($_messageId, $_email, $_qMessageId="")
    {
        global $GROUPS,$INTERNAL;
        $tsData = array("","");
        $reply = new TicketMessage($_messageId,false);
        $reply->Load();

        $pdm = getPredefinedMessage($GROUPS[$this->Group]->PredefinedMessages,$this->Language);
        if($pdm != null && $this->CreationType < 6)
        {
            if(!empty($pdm->EmailTicketReplyBodyPlaintext))
                $tsData[0] = $pdm->EmailTicketReplyBodyPlaintext;
            if(!empty($pdm->EmailTicketReplyBodyHTML))
                $tsData[1] = $pdm->EmailTicketReplyBodyHTML;
        }
        if(!empty($_qMessageId))
        {
            $quote = new TicketMessage($_qMessageId,false);
            $quote->Load();
        }
        else
            $quote = null;

        for($i=0;$i<count($tsData);$i++)
        {
            if($i==1 && empty($tsData[1]))
                continue;

            $lb = ($i==0) ? "\r\n\r\n" : "<br><br>";

            if(empty($tsData[$i]) || strpos($tsData[$i],"%mailtext%")===false)
                $tsData[$i] .= $lb . "%mailtext%";

            if($this->CreationType < 6)
            {
                if(empty($tsData[$i]) || strpos($tsData[$i],"%quote%")===false)
                    $tsData[$i] .= $lb . "%quote%";

                if(empty($tsData[$i]) || strpos($tsData[$i],"%ticket_hash%")===false)
                    $tsData[$i] .= $lb . "%ticket_hash%";
            }

            $qText = (!empty($quote)) ? "\r\n\r\n" . $quote->GetQuoteFormat($i==0) : "";
            $tText = (($i!=1) ? strip_tags($reply->Text) : $reply->Text);
            $tText = (($i==0) ? $tText : nl2br($tText)).$lb.$lb."<!--lz_ref_link-->";
            $tsData[$i] = str_replace(array($this->GetHash(false),$this->GetHash(true)),"",$tsData[$i]);
            $tsData[$i] = $this->TextReplace($tsData[$i]);
            $tsData[$i] = $INTERNAL[$reply->SenderUserId]->TextReplace($tsData[$i]);
            $tsData[$i] = $GROUPS[$this->Group]->TextReplace($tsData[$i],$this->Language);
            $tsData[$i] = configTextReplace($tsData[$i]);
            $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);
            $tsData[$i] = str_replace("%quote%",trim($qText),$tsData[$i]);
            $tsData[$i] = str_replace("%ticket_hash%",$this->GetHash(true,$i==1),$tsData[$i]);
            $tsData[$i] = Mailbox::FinalizeEmail($tsData[$i],$i==1,$this->CreationType >= 6);
        }
        if(empty($reply->Subject))
        {
            $reply->Subject = ($pdm != null) ? $pdm->SubjectTicketReply : "";
            $reply->Subject = str_replace("%ticket_hash%",$this->GetHash(true),$reply->Subject);
        }

        if($this->CreationType >= 6 && !empty($this->ChannelId))
        {
            $channel = SocialMediaChannel::GetChannelById($this->ChannelId);
            if($channel != null)
                $channel->SendReply($this,$reply,str_replace($this->GetHash(true),"",trim($tsData[0])),$quote);
        }

        $mailbox = Mailbox::GetById($GROUPS[$this->Group]->TicketEmailOut,true);
        if($mailbox != null)
            sendMail($mailbox,str_replace(";",",",$_email),$mailbox->Email,$tsData[0],$tsData[1],getSubject($reply->Subject,$_email,$this->Messages[0]->Fullname,$this->Group,"",$this->Messages[0]->Company,$this->Messages[0]->Phone,$this->Messages[0]->IP,$this->Messages[0]->Text,$GROUPS[$this->Group]->GetDescription($this->Language),$this->Messages[0]->Customs),false,$reply->Attachments);
    }

    function SendAutoresponder($_visitor=null, $_browser=null, $_message=null)
    {
        global $CONFIG,$GROUPS;
        if(empty($_message))
            $_message = $this->Messages[0];

        $tsData = array("","","");
        if(!empty($GROUPS[$this->Group]->PredefinedMessages))
        {
            $pdm = getPredefinedMessage($GROUPS[$this->Group]->PredefinedMessages,$this->Language);
            if($pdm != null)
            {
                if(!empty($pdm->EmailTicketResponderBodyPlaintext))
                    $tsData[0] = $pdm->EmailTicketResponderBodyPlaintext;
                if(!empty($pdm->EmailTicketResponderBodyHTML))
                    $tsData[1] = $pdm->EmailTicketResponderBodyHTML;
                $tsData[2] = $pdm->SubjectTicketResponder;
            }
        }
        for($i=0;$i<count($tsData);$i++)
        {
            $tText = (($i!=1) ? $_message->Text : nl2br($_message->Text))."<!--lz_ref_link-->";
            $tsData[$i] = str_replace("%mailtext%",$tText,$tsData[$i]);
            $tsData[$i] = $_message->TextReplace($tsData[$i],$this->Group);
            $tsData[$i] = $this->TextReplace($tsData[$i]);
            $tsData[$i] = $GROUPS[$this->Group]->TextReplace($tsData[$i],$this->Language);

            if(!empty($_visitor))
                $tsData[$i] = $_visitor->TextReplace($tsData[$i]);
            if(!empty($_browser))
                $tsData[$i] = $_browser->TextReplace($tsData[$i]);

            $tsData[$i] = configTextReplace($tsData[$i]);
            $tsData[$i] = Mailbox::FinalizeEmail($tsData[$i],$i==1);
            $tsData[$i] = applyReplacements($tsData[$i]);
        }
        $mailbox = Mailbox::GetDefaultOutgoing();
        if($mailbox != null)
        {
            $mb = clone $mailbox;
            $replytoint = (Mailbox::IsValidEmail($_message->Email)) ? $_message->Email : $mb->Email;
            $replytoex = $mb->Email;
            $fakeSender = "";
            if(!empty($CONFIG["gl_usmasend"]) && Mailbox::IsValidEmail($_message->Email))
                $fakeSender = $_message->Email;
            if(!empty($CONFIG["gl_scom"]))
                sendMail($mb,$CONFIG["gl_scom"],$replytoint,$tsData[0],$tsData[1],$tsData[2],false,null,$fakeSender);
            if(!empty($CONFIG["gl_sgom"]))
                sendMail($mb,$GROUPS[$this->Group]->Email,$replytoint,$tsData[0],$tsData[1],$tsData[2],false,null,$fakeSender);
            if(!empty($CONFIG["gl_ssom"]) && Mailbox::IsValidEmail($_message->Email))
                sendMail($mb,str_replace(";",",",$_message->Email),$replytoex,$tsData[0],$tsData[1],$tsData[2],false,null,$fakeSender);
        }
    }

	function Save($_hash="",$_saveMessages=true)
	{
        if(empty($_hash))
            $_hash = $this->GetHash();

		if(queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_TICKETS."` (`id`,`user_id`,`target_group_id`,`hash`,`creation_type`,`iso_language`,`channel_id`,`channel_conversation_id`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->SenderUserId)."', '".DBManager::RealEscape($this->Group)."', '".DBManager::RealEscape($_hash)."', '".DBManager::RealEscape($this->CreationType)."', '".DBManager::RealEscape($this->Language)."', '".DBManager::RealEscape($this->ChannelId)."', '".DBManager::RealEscape($this->ChannelConversationId)."');"))
        {
            if($_saveMessages && count($this->Messages) > 0)
            {
                $this->Messages[0]->Hash = $_hash;
                $this->Messages[0]->Save($this->Id,false,null,$this);
            }
        }
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
	}

    function AutoAssignEditor($editor="")
    {
        global $GROUPS,$INTERNAL;
        if(isset($GROUPS[$this->Group]) && !empty($GROUPS[$this->Group]->TicketAssignment))
        {
            $load = array();
            $sumtickets = 0;
            $sumpriorities = 0;
            foreach($GROUPS[$this->Group]->TicketAssignment as $sysid => $priority)
            {
                if(isset($INTERNAL[$sysid]))
                {
                    $load[$sysid] = TicketEditor::GetTicketCountByEditor($sysid);
                    $sumtickets += $load[$sysid];
                    $sumpriorities += ($priority*10);
                }
            }

            foreach($GROUPS[$this->Group]->TicketAssignment as $sysid => $priority)
            {
                if(isset($INTERNAL[$sysid]))
                    $load[$sysid] = $load[$sysid] - ($sumtickets*($priority*10/$sumpriorities));
            }

            if(!empty($load))
            {
                asort($load);
                if(min($load) == max($load))
                    for($i=0;$i<rand(0,(count($load)-1));$i++)
                        next($load);
                $editor = key($load);
            }

            if(!empty($editor))
            {
                $teditor = new TicketEditor($this->Id);
                $teditor->Editor = $editor;
                $teditor->Status = 0;
                $teditor->GroupId = $this->Group;
                $teditor->Save();
            }
        }
    }

    function Reactivate()
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_EDITORS."` SET `status`=1,`time`=".GetUniqueMessageTime(DATABASE_TICKET_EDITORS,"time")." WHERE `status`>=2 AND `ticket_id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
        CacheManager::SetDataUpdateTime(DATA_UPDATE_KEY_TICKETS);
    }

    function UpdateMessageTime()
    {
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `ticket_id`='".DBManager::RealEscape($this->Id)."';"))
            while($row = DBManager::FetchArray($result))
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` SET `time`=".GetUniqueMessageTime(DATABASE_TICKET_MESSAGES,"time")." WHERE `id` = '".DBManager::RealEscape($row["id"])."' LIMIT 1;");
    }

    function SetLanguage($_language)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKETS."` SET `iso_language` = '".DBManager::RealEscape($_language)."' WHERE `id`= '".DBManager::RealEscape($this->Id)."';");
        $this->UpdateMessageTime();
    }

    function SetGroup($_group)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKETS."` SET `target_group_id` = '".DBManager::RealEscape($_group)."' WHERE `id`= '".DBManager::RealEscape($this->Id)."';");
        $this->UpdateMessageTime();
    }

    function Destroy()
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_TICKETS."` SET `deleted`=1 WHERE `id` = '".DBManager::RealEscape($this->Id)."' LIMIT 1;");
        $this->UpdateMessageTime();
    }

    function TextReplace($_text)
    {
        $_text = $this->Messages[0]->TextReplace($_text,$this->Group);
        $_text = str_replace("%ticket_hash%",$this->GetHash(true),$_text);
        return $_text;
    }

    function Log($_action,$_operatorId,$_newValue,$_oldValue="",$_messageId="")
    {
        queryDB(true,"INSERT IGNORE INTO `".DB_PREFIX.DATABASE_TICKET_LOGS."` (`created`,`time`,`ticket_id`,`operator_id`,`action`,`value_old`,`value_new`,`message_id`) VALUES ('".DBManager::RealEscape($time=GetUniqueMessageTime(DATABASE_TICKET_LOGS,"time"))."','".$time."','".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($_operatorId)."', '".DBManager::RealEscape($_action)."', '".DBManager::RealEscape($_oldValue)."', '".DBManager::RealEscape($_newValue)."', '".DBManager::RealEscape($_messageId)."');");
    }

    static function GetMessageCount($_ticketId)
    {
        $result = queryDB(true,"SELECT count(*) AS `mcount` FROM `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` WHERE `ticket_id` = '".DBManager::RealEscape($_ticketId)."'");
        while($result && $row = DBManager::FetchArray($result))
            return $row["mcount"];
        return 0;
    }

    static function Exists($_hash, &$id, &$group, &$language)
    {
        $_hash = strtoupper(str_replace(array("[","]"),"",$_hash));
        $result = queryDB(true,"SELECT `dbt`.`id`,`dbt`.`target_group_id`,`dbt`.`iso_language` FROM `".DB_PREFIX.DATABASE_TICKETS."` AS `dbt` INNER JOIN `".DB_PREFIX.DATABASE_TICKET_MESSAGES."` AS `dbm` ON `dbt`.`id`=`dbm`.`ticket_id` WHERE (`dbt`.`hash`='".DBManager::RealEscape($_hash)."' OR `dbm`.`hash`='".DBManager::RealEscape($_hash)."') AND `deleted`=0 LIMIT 1;");
        if($result && $row = DBManager::FetchArray($result))
        {
            $id=$row["id"];
            $group=$row["target_group_id"];
            $language=$row["iso_language"];
        }
        return (DBManager::GetRowCount($result) == 1);
    }
}

class Response
{
	public $XML = "";
	public $Internals="";
	public $Groups="";
	public $InternalProfilePictures="";
	public $InternalWebcamPictures="";
	public $InternalVcards="";
	public $Typing="";
	public $Exceptions="";
	public $Filter="";
	public $Events="";
	public $EventTriggers="";
	public $Authentications="";
	public $Posts="";
	public $Login;
	public $Ratings="";
	public $Messages="";
    public $Reports=null;
	public $Archive="";
	public $Resources="";
	public $ChatVouchers="";
	public $GlobalHash;
	public $Actions="";
	public $Goals="";
	public $Forwards="";
	
	function SetStandardResponse($_code,$_sub)
	{
		$this->XML = "<response><value id=\"".base64_encode($_code)."\" />" . $_sub . "</response>";
	}
	
	function SetValidationError($_code,$_addition="")
	{
		if(!empty($_addition))
			$this->XML = "<validation_error value=\"".base64_encode($_code)."\" error=\"".base64_encode($_addition)."\" />";
		else
			$this->XML = "<validation_error value=\"".base64_encode($_code)."\" />";
	}
	
	function GetXML($_operator=false)
	{
        if($_operator)
        {
            $this->GlobalHash = substr(md5($this->XML),0,5);
            if($_POST[POST_INTERN_SERVER_ACTION] != INTERN_ACTION_LISTEN || (isset($_POST[POST_GLOBAL_XMLCLIP_HASH_ALL]) && $_POST[POST_GLOBAL_XMLCLIP_HASH_ALL] != $this->GlobalHash))
                $this->XML = str_replace("<!--gl_all-->",base64_encode(substr(md5($this->XML),0,5)),$this->XML);
            else
                return "";
            return str_replace("<!--execution_time-->",base64_encode(floor(getRuntime(ACCESSTIME))),$this->GetXML());
        }
		return "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><livezilla_xml><livezilla_version>".base64_encode(VERSION)."</livezilla_version>" . $this->XML . "</livezilla_xml>";
	}
}

class FileEditor
{
	public $Result;
	public $TargetFile;
	
	function FileEditor($_file)
	{
		$this->TargetFile = $_file;
	}
	
	function Load()
	{
		if(file_exists($this->TargetFile))
		{
			$handle = @fopen ($this->TargetFile, "r");
			while (!@feof($handle))
	   			$this->Result .= @fgets($handle, 4096);
			
			$length = strlen($this->Result);
			$this->Result = @unserialize($this->Result);
			@fclose($handle);
		}
	}

	function Save($_data)
	{
		if(strpos($this->TargetFile,"..") === false)
		{
			$handle = @fopen($this->TargetFile, "w");
			if(!empty($_data))
				$length = @fputs($handle,serialize($_data));
			@fclose($handle);
		}
	}
}

class FileUploadRequest extends Action
{
	public $Error = false;
	public $Download = false;
	public $FileName;
	public $FileMask;
	public $FileId;
	public $Permission = PERMISSION_VOID;
	public $FirstCall = true;
	public $ChatId;
	public $Closed;
	
	function FileUploadRequest()
	{
		if(func_num_args() == 3)
		{
			$this->Id = func_get_arg(0);
			$this->ReceiverUserId = func_get_arg(1);
            $this->ChatId = func_get_arg(2);
			$this->Load();
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
	}
	    
	function Save()
	{
		if($this->FirstCall)
			queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_CHAT_FILES."`  (`id` ,`created`,`file_name` ,`file_mask` ,`file_id` ,`chat_id`,`visitor_id` ,`browser_id` ,`operator_id`,`error` ,`permission` ,`download`,`closed`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape(time())."', '".DBManager::RealEscape($this->FileName)."', '".DBManager::RealEscape($this->FileMask)."', '".DBManager::RealEscape($this->FileId)."', '".DBManager::RealEscape($this->ChatId)."', '".DBManager::RealEscape($this->SenderUserId)."', '".DBManager::RealEscape($this->SenderBrowserId)."', '".DBManager::RealEscape($this->ReceiverUserId)."','".DBManager::RealEscape(($this->Error)?1:0)."', '".DBManager::RealEscape($this->Permission)."', '".DBManager::RealEscape(($this->Download)?1:0)."', ".DBManager::RealEscape(($this->Closed)?1:0).");");
		else
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_FILES."` SET `download`='".DBManager::RealEscape(($this->Download)?1:0)."',`error`='".DBManager::RealEscape(($this->Error) ? 1 : 0)."',`permission`='".DBManager::RealEscape($this->Permission)."' WHERE `created`='".DBManager::RealEscape($this->Created)."' ORDER BY `created` DESC LIMIT 1; ");
	}
	
	function Close()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_FILES."` SET `closed`=1 WHERE `id`='".DBManager::RealEscape($this->Id)."' AND `created`='".DBManager::RealEscape($this->Created)."';");
	}
	
	function Load()
	{
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FILES."` WHERE `id`='".DBManager::RealEscape($this->Id)."' AND `chat_id`='".DBManager::RealEscape($this->ChatId)."' ORDER BY `created` DESC LIMIT 1;");
		if($result && $row = DBManager::FetchArray($result))
		{
			$this->SetValues($row);
		}
		else
			$this->FirstCall = true;
	}
	
	function SetValues($row)
	{	
		$this->FirstCall = false;
		$this->Id = $row["id"];
		$this->FileName = $row["file_name"];
		$this->FileMask = $row["file_mask"];
		$this->FileId = $row["file_id"];
		$this->ChatId = $row["chat_id"];
		$this->SenderUserId = $row["visitor_id"];
		$this->SenderBrowserId = $row["browser_id"];
		$this->ReceiverUserId = $row["operator_id"];
		$this->Error = !empty($row["error"]);
		$this->Permission = $row["permission"];
		$this->Download = !empty($row["download"]);
		$this->Closed = !empty($row["closed"]);
		$this->Created = $row["created"];
	}
	
	function GetFile()
	{
		return PATH_UPLOADS . $this->FileMask;
	}
}

class Forward extends Action
{
	public $InitiatorSystemId;
	public $TargetSessId;
	public $TargetGroupId;
	public $Processed = false;
	public $Invite = false;
	public $ChatId;
    public $Auto;

	function Forward()
	{
		$this->Id = getId(32);
		if(func_num_args() == 2)
		{
			$this->ChatId = func_get_arg(0);
			$this->SenderSystemId = func_get_arg(1);
			$this->Load();
		}
		else if(func_num_args() == 1)
		{
			$this->SetValues(func_get_arg(0));
		}
	} 
	
	function Save($_processed=false,$_received=false)
	{
		if(!$_processed)
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` (`id`, `created`, `initiator_operator_id`,`sender_operator_id`, `target_operator_id`, `target_group_id`, `chat_id`,`visitor_id`,`browser_id`, `info_text`, `invite`, `auto`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->InitiatorSystemId)."','".DBManager::RealEscape($this->SenderSystemId)."', '".DBManager::RealEscape($this->TargetSessId)."', '".DBManager::RealEscape($this->TargetGroupId)."', '".DBManager::RealEscape($this->ChatId)."', '".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->ReceiverBrowserId)."', '".DBManager::RealEscape($this->Text)."', '".DBManager::RealEscape(($this->Invite) ? "1" : "0")."', '".DBManager::RealEscape(($this->Auto) ? "1" : "0")."');");
        else
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` SET `processed`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1; ");
        if($_received)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` SET `received`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1; ");
	}
	
	function Load()
	{
		$result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` WHERE `closed`=0 AND `id`='".DBManager::RealEscape($this->Id)."' AND `received`=0 LIMIT 1;");
		if($result && $row = DBManager::FetchArray($result))
			$this->SetValues($row);
	}
	
	function SetValues($_row)
	{
		$this->Id = $_row["id"];
		$this->InitiatorSystemId = $_row["initiator_operator_id"];
		$this->SenderSystemId = $_row["sender_operator_id"];
		$this->TargetSessId = $_row["target_operator_id"];
		$this->TargetGroupId = $_row["target_group_id"];
		$this->ReceiverUserId = $_row["visitor_id"];
		$this->ReceiverBrowserId = $_row["browser_id"];
		$this->ChatId = $_row["chat_id"];
		$this->Created = $_row["created"];
		$this->Received = $_row["received"];
		$this->Text = $_row["info_text"];
		$this->Processed = !empty($_row["processed"]);
		$this->Invite = !empty($_row["invite"]);
        $this->Auto = !empty($_row["auto"]);
        $this->Closed = !empty($_row["closed"]);
	}
	
	function GetXml()
	{
		return "<fw id=\"".base64_encode($this->Id)."\" pr=\"".base64_encode(($this->Processed) ? "1" : "0")."\" cr=\"".base64_encode($this->Created)."\" u=\"".base64_encode($this->ReceiverUserId."~".$this->ReceiverBrowserId)."\" c=\"".base64_encode($this->ChatId)."\" i=\"".base64_encode($this->InitiatorSystemId)."\" s=\"".base64_encode($this->SenderSystemId)."\" t=\"".base64_encode($this->Text)."\" r=\"".base64_encode($this->TargetSessId)."\"  g=\"".base64_encode($this->TargetGroupId)."\" inv=\"".base64_encode(($this->Invite) ?  "1" : "0")."\" />\r\n";
	}
	
	function Destroy()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_FORWARDS."` SET `closed`=1 WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
}

class WebsitePush extends Action
{
	public $TargetURL;
	public $Ask;
	public $ActionId;
	public $Senders;
	
	function WebsitePush()
	{
		if(func_num_args() == 7)
		{
			$this->Id = getId(32);
			$this->SenderSystemId = func_get_arg(0);
			$this->SenderGroupId = func_get_arg(1);
			$this->ReceiverUserId = func_get_arg(2);
			$this->BrowserId = func_get_arg(3);
			$this->Text = func_get_arg(4);
			$this->Ask = func_get_arg(5);
			$this->TargetURL = func_get_arg(6);
			$this->Senders = array();
		}
		else if(func_num_args() == 3)
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
			$this->TargetURL = func_get_arg(1);
			$this->Ask = func_get_arg(2);
			$this->Senders = array();
		}
		else if(func_num_args() == 2)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->Ask = $_row["ask"];
			$this->TargetURL = $_row["target_url"];
			$this->Senders = array();
		}
		else
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->SenderSystemId = $_row["sender_system_id"];
			$this->ReceiverUserId = $_row["receiver_user_id"];
			$this->BrowserId = $_row["receiver_browser_id"];
			$this->Text = $_row["text"];
			$this->Ask = $_row["ask"];
			$this->TargetURL = $_row["target_url"];
			$this->Accepted = $_row["accepted"];
			$this->Declined = $_row["declined"];
			$this->Displayed = $_row["displayed"];
			$this->Senders = array();
		}
	}

	function SaveEventConfiguration()
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_WEBSITE_PUSHS."` (`id`, `action_id`, `target_url`,`ask`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->ActionId)."','".DBManager::RealEscape($this->TargetURL)."','".DBManager::RealEscape($this->Ask)."');");
	}
	
	function SetStatus($_displayed,$_accepted,$_declined)
	{
		if($_displayed)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` SET `displayed`='1',`accepted`='0',`declined`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		else if($_accepted)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` SET `displayed`='1',`accepted`='1',`declined`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		else if($_declined)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` SET `displayed`='1',`accepted`='0',`declined`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
	
	function Save()
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_WEBSITE_PUSHS."` (`id`, `created`, `sender_system_id`, `receiver_user_id`, `receiver_browser_id`, `text`, `ask`, `target_url`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->SenderSystemId)."','".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->Text)."','".DBManager::RealEscape($this->Ask)."','".DBManager::RealEscape($this->TargetURL)."');");
	}

	function GetInitCommand()
	{
		return "lz_tracking_init_website_push('".base64_encode(str_replace("%target_url%",$this->TargetURL,$this->Text))."',".time().");";
	}
	
	function GetExecCommand()
	{
		return "lz_tracking_exec_website_push('".base64_encode($this->TargetURL)."');";
	}
	
	function GetXML()
	{
		$xml = "<evwp id=\"".base64_encode($this->Id)."\" url=\"".base64_encode($this->TargetURL)."\" ask=\"".base64_encode($this->Ask)."\">\r\n";
		
		foreach($this->Senders as $sender)
			$xml .= $sender->GetXML();

		return $xml . "</evwp>\r\n";
	}
}

class EventActionInternal extends Action
{
	public $TriggerId;
	function EventActionInternal()
	{
		if(func_num_args() == 2)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->TriggerId = func_get_arg(1);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->TriggerId = $_row["trigger_id"];
			$this->EventActionId = $_row["action_id"];
		}
	}

	function Save()
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_INTERNALS."` (`id`, `created`, `trigger_id`, `receiver_user_id`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape(time())."', '".DBManager::RealEscape($this->TriggerId)."', '".DBManager::RealEscape($this->ReceiverUserId)."');");
	}

	function GetXml()
	{
		return "<ia time=\"".base64_encode(time())."\" aid=\"".base64_encode($this->EventActionId)."\" />\r\n";
	}
}

class Alert extends Action
{
	function Alert()
	{
		if(func_num_args() == 3)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$this->Text = func_get_arg(2);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ReceiverUserId = $_row["receiver_user_id"];
			$this->BrowserId = $_row["receiver_browser_id"];
			$this->Text = $_row["text"];
			$this->EventActionId = $_row["event_action_id"];
			$this->Displayed = !empty($_row["displayed"]);
			$this->Accepted = !empty($_row["accepted"]);
		}
	}

	function Save()
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_ALERTS."` (`id`, `created`, `receiver_user_id`, `receiver_browser_id`,`event_action_id`, `text`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->EventActionId)."','".DBManager::RealEscape($this->Text)."');");
	}
	
	function SetStatus($_displayed,$_accepted)
	{
		if($_displayed)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_ALERTS."` SET `displayed`='1',`accepted`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		else if($_accepted)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_ALERTS."` SET `displayed`='1',`accepted`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}

	function GetCommand()
	{
		return "lz_tracking_send_alert('".$this->Id."','".base64_encode($this->Text)."');";
	}
}

class OverlayBox extends Action
{
	public $OverlayElement;

	function OverlayBox()
   	{
		if(func_num_args() == 3)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->BrowserId = func_get_arg(1);
			$parts = func_get_arg(2);
			$parts = explode(";",$parts);
			if($parts[0] == "1")
				$this->Text = base64_decode($parts[1]);
			else
				$this->URL = base64_decode($parts[1]);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ReceiverUserId = $_row["receiver_user_id"];
			$this->BrowserId = $_row["receiver_browser_id"];
			$this->EventActionId = $_row["event_action_id"];
			$this->Text = $_row["content"];
			$this->URL = $_row["url"];
			$this->Displayed = !empty($_row["displayed"]);
			$this->Closed = !empty($_row["closed"]);
		}
	}
	
	function Save()
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` (`id`, `created`, `receiver_user_id`,`receiver_browser_id`,`event_action_id`, `url`,`content`, `displayed`, `closed`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->EventActionId)."','".DBManager::RealEscape($this->URL)."','".DBManager::RealEscape($this->Text)."',0,0);");
	}
	
	function CreateOverlayTemplate($_style,$_siteName,$_cwWidth,$_cwHeight,$_serverURL)
	{
		global $CONFIG;
		$fheight = (empty($CONFIG["gl_cpar"])) ? 0 : 20;
		$bheight = 17;
		$template = getFile(TEMPLATE_SCRIPT_OVERLAYS . $_style . "/content.tpl");
		$template = str_replace("<!--site_name-->",$_siteName,$template);
		$template = str_replace("<!--template-->",$_style,$template);
		$template = str_replace("<!--width-->",$_cwWidth-46,$template);
		$template = str_replace("<!--height-->",$_cwHeight,$template);
		$template = str_replace("<!--server-->",$_serverURL,$template);
		$content = "<table cellpadding=\"0\" cellspacing=\"0\" style=\"height:".($_cwHeight-$bheight)."px;width:100%;\"><tr><td style=\"height:".($_cwHeight-$fheight-$bheight)."px;vertical-align:top;\"><!--content--></td></tr><tr><td height=\"".$fheight."\" style=\"text-align:center;\">" . @$CONFIG["gl_cpar"] ."</td></tr></table>";
		if(!empty($this->URL))
			$template = str_replace(base64_decode("PCEtLWNvbnRlbnQtLT4="),str_replace(base64_decode("PCEtLWNvbnRlbnQtLT4="),"<iframe frameBorder=\"0\" style=\"padding:0px;margin:0px;border:0px;height:".($_cwHeight-$fheight-$bheight)."px;width:100%;\" src=\"".$this->URL."\"></iframe>",$content),$template);
		else
			$template = str_replace(base64_decode("PCEtLWNvbnRlbnQtLT4="),str_replace(base64_decode("PCEtLWNvbnRlbnQtLT4="),$this->Text,$content),$template);
		return $template;
	}
	
	function SetStatus($_closed=true)
	{
		if($_closed)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_OVERLAY_BOXES."` SET `displayed`='1',`closed`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
}

class ChatRequest extends Action
{
	public $Invitation;
	public $Canceled;
	function ChatRequest()
   	{
        global $CONFIG;
		if(func_num_args() == 5)
		{
			$this->Id = getId(32);
			$this->SenderSystemId = func_get_arg(0);
			$this->SenderGroupId = func_get_arg(1);
			$this->ReceiverUserId = func_get_arg(2);
			$this->BrowserId = func_get_arg(3);
			$this->Text = func_get_arg(4);
		}
		else if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
			$this->Load();
		}
		else
		{
			$row = func_get_arg(0);
			$this->SetValues($row);
		}

        if(!empty($CONFIG["gl_itim"]) && !empty($this->Created) && $this->Created < (time()-$CONFIG["gl_itim"]))
            if(empty($this->Canceled) && !$this->Closed)
                $this->Cancel("Timeout");
   	}
	
	function SetStatus($_displayed,$_accepted,$_declined,$_closed=false)
	{
		$_closed = ($_accepted || $_declined || $_closed);
		if($_displayed)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` SET `displayed`='1',`accepted`='0',`declined`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		if($_accepted)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` SET `displayed`='1',`accepted`='1' WHERE `declined`=0 AND `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		else if($_declined)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` SET `displayed`='1',`declined`='1' WHERE `accepted`=0 AND `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		if($_closed)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` SET `closed`='1' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}

    function Cancel($_user)
    {
        if(!$this->Closed && empty($this->Canceled) && !$this->Accepted && !$this->Declined)
        {
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` SET `closed`=1,`canceled`='".DBManager::RealEscape($_user)."' WHERE `canceled`='' AND `closed`=0 AND `accepted`=0 AND `declined`=0 AND `id`='".DBManager::RealEscape($this->Id)."';");
            if(DBManager::GetAffectedRowCount() > 0)
            {
                $this->Canceled = $_user;
                $browser = new VisitorBrowser($this->BrowserId,$this->ReceiverUserId,false);
                $browser->ForceUpdate();
            }
        }
    }

	function SetValues($_row)
	{
		$this->Id = $_row["id"];
		$this->SenderSystemId = $_row["sender_system_id"];
		$this->SenderUserId = $_row["sender_system_id"];
		$this->SenderGroupId = $_row["sender_group_id"];
		$this->ReceiverUserId = $_row["receiver_user_id"];
		$this->BrowserId = $_row["receiver_browser_id"];
		$this->EventActionId = $_row["event_action_id"];
		$this->Created = $_row["created"];
		$this->Text = $_row["text"];
		$this->Displayed = !empty($_row["displayed"]);
		$this->Accepted = !empty($_row["accepted"]);
		$this->Declined = !empty($_row["declined"]);
		$this->Closed = !empty($_row["closed"]);
		$this->Canceled = $_row["canceled"];
	}
	
	function Load()
	{
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `id`='".DBManager::RealEscape($this->Id)."';"))
			if($row = DBManager::FetchArray($result))
				$this->SetValues($row);
	}
	
	function Save()
	{
		global $INTERNAL,$GROUPS;
		if($INTERNAL[$this->SenderSystemId]->IsExternal($GROUPS,null,null))
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` (`id`, `created`, `sender_system_id`, `sender_group_id`,`receiver_user_id`, `receiver_browser_id`,`event_action_id`, `text`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->SenderSystemId)."','".DBManager::RealEscape($this->SenderGroupId)."','".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->BrowserId)."','".DBManager::RealEscape($this->EventActionId)."','".DBManager::RealEscape($this->Text)."');");
	}
	
	function Destroy()
	{
		queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}

    function GetXML()
    {
        return "<r i=\"".base64_encode($this->Id)."\" c=\"".base64_encode($this->Created)."\" ca=\"".base64_encode($this->Canceled)."\" s=\"".base64_encode($this->SenderSystemId)."\" b=\"".base64_encode($this->BrowserId)."\" e=\"".base64_encode($this->EventActionId)."\" d=\"".base64_encode($this->Displayed ? 1 : 0)."\" a=\"".base64_encode($this->Accepted ? 1 : 0)."\" de=\"".base64_encode($this->Declined ? 1 : 0)."\" g=\"".base64_encode($this->SenderGroupId)."\" cl=\"".base64_encode($this->Closed ? 1 : 0)."\">".base64_encode($this->Text)."</r>\r\n";
    }

	function CreateInvitationTemplate($_style,$_siteName,$_cwWidth,$_cwHeight,$_serverURL,$_sender,$_closeOnClick)
	{
		global $CONFIG;
		$template = ((!empty($CONFIG["gl_caii"])) && @file_exists(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation_header.tpl")) ? getFile(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation_header.tpl") : getFile(TEMPLATE_SCRIPT_INVITATION . $_style . "/invitation.tpl");
		$template = str_replace("<!--logo-->","<img src=\"". $CONFIG["gl_caii"]."\" border=\"0\">",$template);
		$template = str_replace("<!--site_name-->",$_siteName,$template);
		$template = str_replace("<!--intern_name-->",$_sender->Fullname,$template);
		$template = str_replace("<!--template-->",$_style,$template);
		$template = str_replace("<!--group_id-->",base64UrlEncode($this->SenderGroupId),$template);
		$template = str_replace("<!--user_id-->",base64UrlEncode($_sender->UserId),$template);
		$template = str_replace("<!--width-->",$_cwWidth,$template);
		$template = str_replace("<!--height-->",$_cwHeight,$template);
		$template = str_replace("<!--server-->",$_serverURL,$template);
		$template = str_replace("<!--intern_image-->",$_sender->GetOperatorPictureFile(),$template);
		$template = str_replace("<!--close_on_click-->",$_closeOnClick,$template);
		return $template;
	}

    public static function AcceptAll($_userId)
    {
        if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($_userId)."';"))
            while($row = DBManager::FetchArray($result))
            {
                $request = new ChatRequest($row);
                $request->SetStatus(false,true,false,true);
                $browser = new VisitorBrowser($row["receiver_browser_id"],$_userId,false);
                $browser->ForceUpdate();
            }
    }
}

class OverlayElement extends BaseObject
{
	public $DisplayPosition = "11";
	public $Speed = 8;
	public $Effect = 5;
	public $Width;
	public $Height;
	public $Margin;
	public $CloseOnClick;
	public $HTML;
	public $Style = "classic";
	public $Shadow;
	public $ShadowPositionX;
	public $ShadowPositionY;
	public $ShadowBlur;
	public $ShadowColor;
	public $Background;
	public $BackgroundColor;
	public $BackgroundOpacity;
	
	function OverlayElement()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Style = $_row["style"];
			$this->Id = $_row["id"];
			$this->Position = $_row["position"];
			$this->Margin = Array($_row["margin_left"],$_row["margin_top"],$_row["margin_right"],$_row["margin_bottom"]);
			$this->Speed = $_row["speed"];
			$this->Effect = $_row["slide"];
			$this->CloseOnClick = $_row["close_on_click"];
			$this->Shadow = !empty($_row["shadow"]);
			$this->ShadowPositionX = $_row["shadow_x"];
			$this->ShadowPositionY = $_row["shadow_x"];
			$this->ShadowBlur = $_row["shadow_blur"];
			$this->ShadowColor = @$_row["shadow_color"];
			$this->Width = $_row["width"];
			$this->Height = $_row["height"];
			$this->Background = !empty($_row["background"]);
			$this->BackgroundColor = $_row["background_color"];
			$this->BackgroundOpacity = $_row["background_opacity"];
		}
		else if(func_num_args() == 20)
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
			$this->Position = func_get_arg(1);
			$this->Margin = Array(func_get_arg(2),func_get_arg(3),func_get_arg(4),func_get_arg(5));
			$this->Speed = func_get_arg(6);
			$this->Style = func_get_arg(7);
			$this->Effect = func_get_arg(8);
			$this->CloseOnClick = func_get_arg(9);
			$this->Shadow = func_get_arg(10);
			$this->ShadowPositionX = func_get_arg(11);
			$this->ShadowPositionY = func_get_arg(12);
			$this->ShadowBlur = func_get_arg(13);
			$this->ShadowColor = func_get_arg(14);
			$this->Width = func_get_arg(15);
			$this->Height = func_get_arg(16);
			$this->Background = !isnull(func_get_arg(17));
			$this->BackgroundColor = func_get_arg(18);
			$this->BackgroundOpacity = func_get_arg(19);
		}
	}
	
	function GetXML()
	{
		return "<evolb id=\"".base64_encode($this->Id)."\" bgo=\"".base64_encode($this->BackgroundOpacity)."\" bgc=\"".base64_encode($this->BackgroundColor)."\" bg=\"".base64_encode($this->Background)."\" h=\"".base64_encode($this->Height)."\" w=\"".base64_encode($this->Width)."\" ml=\"".base64_encode($this->Margin[0])."\" mt=\"".base64_encode($this->Margin[1])."\" mr=\"".base64_encode($this->Margin[2])."\" mb=\"".base64_encode($this->Margin[3])."\" pos=\"".base64_encode($this->Position)."\" speed=\"".base64_encode($this->Speed)."\" eff=\"".base64_encode($this->Effect)."\" style=\"".base64_encode($this->Style)."\" coc=\"".base64_encode($this->CloseOnClick)."\" sh=\"".base64_encode($this->Shadow)."\"  shpx=\"".base64_encode($this->ShadowPositionX)."\"  shpy=\"".base64_encode($this->ShadowPositionY)."\"  shb=\"".base64_encode($this->ShadowBlur)."\"  shc=\"".base64_encode($this->ShadowColor)."\" />\r\n";
	}
	
	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_OVERLAYS."` (`id`, `action_id`, `position`, `speed`, `slide`, `margin_left`, `margin_top`, `margin_right`, `margin_bottom`, `style`, `close_on_click`, `shadow`, `shadow_x`, `shadow_y`, `shadow_blur`, `shadow_color`, `width`, `height`, `background`, `background_color`, `background_opacity`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->ActionId)."','".DBManager::RealEscape($this->Position)."', '".DBManager::RealEscape($this->Speed)."', '".DBManager::RealEscape($this->Effect)."', '".DBManager::RealEscape($this->Margin[0])."', '".DBManager::RealEscape($this->Margin[1])."', '".DBManager::RealEscape($this->Margin[2])."', '".DBManager::RealEscape($this->Margin[3])."', '".DBManager::RealEscape($this->Style)."', '".DBManager::RealEscape($this->CloseOnClick)."', '".DBManager::RealEscape(($this->Shadow)?"1":"0")."', '".DBManager::RealEscape($this->ShadowPositionX)."', '".DBManager::RealEscape($this->ShadowPositionY)."', '".DBManager::RealEscape($this->ShadowBlur)."', '".DBManager::RealEscape($this->ShadowColor)."', '".DBManager::RealEscape($this->Width)."', '".DBManager::RealEscape($this->Height)."', '".DBManager::RealEscape($this->Background ? 1 : 0)."', '".DBManager::RealEscape($this->BackgroundColor)."', '".DBManager::RealEscape($this->BackgroundOpacity)."');";
	}
	
	function GetCommand($_id=null)
	{
		return "lz_tracking_add_overlay_box('".base64_encode($this->Id)."','".base64_encode($this->HTML)."',".$this->Position.",".$this->Speed."," . $this->Effect . ",".parseBool($this->Shadow)."," . $this->ShadowBlur . "," . $this->ShadowPositionX . "," . $this->ShadowPositionY . ",'" . $this->ShadowColor . "',".$this->Margin[0].",".$this->Margin[1].",".$this->Margin[2].",".$this->Margin[3].",".$this->Width.",".$this->Height.",".parseBool($this->Background).",'".$this->BackgroundColor."',".$this->BackgroundOpacity.");";
	}
}

class Invitation extends OverlayElement
{
	public $ActionId;
	public $Senders;
	public $Text;
	
	function Invitation()
	{
		global $CONFIG;
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Style = $_row["style"];
			$this->Id = $_row["id"];
			$this->Position = $_row["position"];
			$this->Margin = Array($_row["margin_left"],$_row["margin_top"],$_row["margin_right"],$_row["margin_bottom"]);
			$this->Speed = $_row["speed"];
			$this->Effect = $_row["slide"];
			$this->CloseOnClick = $_row["close_on_click"];
			$this->Shadow = $_row["shadow"];
			$this->ShadowPositionX = @$_row["shadow_x"];
			$this->ShadowPositionY = @$_row["shadow_x"];
			$this->ShadowBlur = @$_row["shadow_blur"];
			$this->ShadowColor = $_row["shadow_color"];
			$this->Background = !empty($_row["background"]);
			$this->BackgroundColor = @$_row["background_color"];
			$this->BackgroundOpacity = @$_row["background_opacity"];
		}
		else if(func_num_args() == 2)
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
            $values = func_get_arg(1);
            $this->CloseOnClick = $values[0];
            $this->Position = $values[1];
            $this->Margin = Array($values[2],$values[3],$values[4],$values[5]);
            $this->Effect = $values[6];
            $this->Shadow = $values[7];
            $this->ShadowBlur = $values[8];
            $this->ShadowColor = $values[9];
            $this->ShadowPositionX = $values[10];
            $this->ShadowPositionY = $values[11];
            $this->Speed = $values[12];
            $this->Style = $values[13];
            $this->Background = $values[14];
            $this->BackgroundColor = $values[15];
            $this->BackgroundOpacity = str_replace(",",".",$values[16]);
		}
		else
		{
			$this->HTML = func_get_arg(0);
			$this->Text = func_get_arg(1);
			$values = func_get_arg(2);
           	$this->CloseOnClick = $values[0];
            $this->Position = $values[1];
            $this->Margin = Array($values[2],$values[3],$values[4],$values[5]);
            $this->Effect = $values[6];
            $this->Shadow = $values[7];
            $this->ShadowBlur = $values[8];
            $this->ShadowColor = $values[9];
            $this->ShadowPositionX = $values[10];
			$this->ShadowPositionY = $values[11];
            $this->Speed = $values[12];
            $this->Style = $values[13];
			$this->Background = $values[14];
			$this->BackgroundColor = $values[15];
			$this->BackgroundOpacity = str_replace(",",".",$values[16]);
		}
		
		if(!empty($this->Style))
		{
			$dimensions = (!empty($CONFIG["gl_caii"]) && @file_exists(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions_header.txt")) ? explode(",",getFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions_header.txt")) : explode(",",getFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/dimensions.txt"));
			$this->Width = @$dimensions[0];
			$this->Height = @$dimensions[1];

			$settings_string = (@file_exists(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/settings.txt")) ? getFile(TEMPLATE_SCRIPT_INVITATION . $this->Style . "/settings.txt") : "";
			
			if(strpos($settings_string,"noshadow") !== false)
				$this->Shadow = false;
		}
		
		
		$this->Senders = Array();
	}

	function GetXML()
	{
		$xml = "<evinv id=\"".base64_encode($this->Id)."\" bgo=\"".base64_encode($this->BackgroundOpacity)."\" bgc=\"".base64_encode($this->BackgroundColor)."\" bg=\"".base64_encode($this->Background)."\" ml=\"".base64_encode($this->Margin[0])."\" mt=\"".base64_encode($this->Margin[1])."\" mr=\"".base64_encode($this->Margin[2])."\" mb=\"".base64_encode($this->Margin[3])."\" pos=\"".base64_encode($this->Position)."\" speed=\"".base64_encode($this->Speed)."\" eff=\"".base64_encode($this->Effect)."\" style=\"".base64_encode($this->Style)."\" coc=\"".base64_encode($this->CloseOnClick)."\" sh=\"".base64_encode($this->Shadow)."\"  shpx=\"".base64_encode($this->ShadowPositionX)."\"  shpy=\"".base64_encode($this->ShadowPositionY)."\"  shb=\"".base64_encode($this->ShadowBlur)."\"  shc=\"".base64_encode($this->ShadowColor)."\">\r\n";
		
		foreach($this->Senders as $sender)
			$xml .= $sender->GetXML();
			
		return $xml . "</evinv>\r\n";
	}
	
	function GetCommand($_id=null)
	{
		return "lz_tracking_request_chat('" . base64_encode($_id) . "','". base64_encode($this->Text) ."','". base64_encode($this->HTML) ."',".$this->Width.",".$this->Height.",".$this->Margin[0].",".$this->Margin[1].",".$this->Margin[2].",".$this->Margin[3].",'" . $this->Position . "',".$this->Speed."," . $this->Effect . "," . parseBool($this->Shadow) . "," . $this->ShadowBlur . "," . $this->ShadowPositionX . "," . $this->ShadowPositionY . ",'" . $this->ShadowColor . "',".parseBool($this->Background).",'".$this->BackgroundColor."',".$this->BackgroundOpacity.");";
	}
}

class EventTrigger
{
	public $Id;
	public $ActionId;
	public $ReceiverUserId;
	public $ReceiverBrowserId;
	public $Triggered;
	public $TriggerTime;
	public $Exists = false;
	
	function EventTrigger()
	{
		if(func_num_args() == 5)
		{
			$this->Id = getId(32);
			$this->ReceiverUserId = func_get_arg(0);
			$this->ReceiverBrowserId = func_get_arg(1);
			$this->ActionId = func_get_arg(2);
			$this->TriggerTime = func_get_arg(3);
			$this->Triggered = func_get_arg(4);
		}
		else
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ReceiverUserId = $_row["receiver_user_id"];
			$this->ReceiverBrowserId = $_row["receiver_browser_id"];
			$this->ActionId = $_row["action_id"];
			$this->Triggered = $_row["triggered"];
			$this->TriggerTime = $_row["time"];
		}
	}
	
	function Load()
	{
		$this->Exists = false;
		if($result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` WHERE `receiver_user_id`='".DBManager::RealEscape($this->ReceiverUserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($this->ReceiverBrowserId)."' AND `action_id`='".DBManager::RealEscape($this->ActionId)."' ORDER BY `time` ASC;"))
			if($row = DBManager::FetchArray($result))
			{
				$this->Id = $row["id"];
				$this->TriggerTime = $row["time"];
				$this->Triggered = $row["triggered"];
				$this->Exists = true;
			}
	}
	
	function Update()
	{
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` SET `time`='".DBManager::RealEscape(time())."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}

	function Save()
	{
		if(!$this->Exists)
			queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` (`id`, `receiver_user_id`, `receiver_browser_id`, `action_id`, `time`, `triggered`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->ReceiverUserId)."', '".DBManager::RealEscape($this->ReceiverBrowserId)."','".DBManager::RealEscape($this->ActionId)."', '".DBManager::RealEscape($this->TriggerTime)."','".DBManager::RealEscape($this->Triggered)."');");
		else
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_EVENT_TRIGGERS."` SET `triggered`=`triggered`+1, `time`='".DBManager::RealEscape(time())."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
}

class EventAction
{
	public $Id = "";
	public $EventId = "";
	public $Type = "";
	public $Value = "";
	public $Invitation;
	public $OverlayBox;
	public $WebsitePush;
	public $Receivers;
	
	function EventAction()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->EventId = $_row["eid"];
			$this->Type = $_row["type"];
			$this->Value = $_row["value"];
		}
		else if(func_num_args() == 2)
		{
			$this->Id = func_get_arg(0);
			$this->Type = func_get_arg(1);
		}
		else
		{
			$this->EventId = func_get_arg(0);
			$this->Id = func_get_arg(1);
			$this->Type = func_get_arg(2);
			$this->Value = func_get_arg(3);
		}
		$this->Receivers = Array();
	}
	
	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTIONS."` (`id`, `eid`, `type`, `value`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->EventId)."','".DBManager::RealEscape($this->Type)."', '".DBManager::RealEscape($this->Value)."');";
	}

	function GetXML()
	{
		$xml =  "<evac id=\"".base64_encode($this->Id)."\" type=\"".base64_encode($this->Type)."\" val=\"".base64_encode($this->Value)."\">\r\n";
		
		if(!empty($this->Invitation))
			$xml .= $this->Invitation->GetXML();
		
		if(!empty($this->OverlayBox))
			$xml .= $this->OverlayBox->GetXML();
			
		if(!empty($this->WebsitePush))
			$xml .= $this->WebsitePush->GetXML();
			
		foreach($this->Receivers as $receiver)
			$xml .= $receiver->GetXML();
			
		return $xml . "</evac>\r\n";
	}
	
	function Exists($_receiverUserId,$_receiverBrowserId)
	{
		if($this->Type == 2)
		{
			if($result = queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_CHAT_REQUESTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($_receiverUserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($_receiverBrowserId)."' AND `event_action_id`='".DBManager::RealEscape($this->Id)."' AND `accepted`='0' AND `declined`='0' LIMIT 1;"))
				if($row = DBManager::FetchArray($result))
					return true;
		}
		else if($this->Type == 3)
		{
			if($result = queryDB(true,"SELECT `id` FROM `".DB_PREFIX.DATABASE_ALERTS."` WHERE `receiver_user_id`='".DBManager::RealEscape($_receiverUserId)."' AND `receiver_browser_id`='".DBManager::RealEscape($_receiverBrowserId)."' AND `event_action_id`='".DBManager::RealEscape($this->Id)."' AND `accepted`='0' LIMIT 1;"))
				if($row = DBManager::FetchArray($result))
					return true;
		}
		return false;
	}
	
	function GetInternalReceivers()
	{
		$receivers = array();
		if($result = queryDB(true,"SELECT `receiver_id` FROM `".DB_PREFIX.DATABASE_EVENT_ACTION_RECEIVERS."` WHERE `action_id`='".DBManager::RealEscape($this->Id)."';"))
			while($row = DBManager::FetchArray($result))
				$receivers[]=$row["receiver_id"];
		return $receivers;
	}
}

class EventActionSender
{
	public $Id = "";
	public $ParentId = "";
	public $UserSystemId = "";
	public $GroupId = "";
	public $Priority = "";
	
	function EventActionSender()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ParentId = $_row["pid"];
			$this->UserSystemId = $_row["user_id"];
			$this->GroupId = $_row["group_id"];
			$this->Priority = $_row["priority"];
		}
		else if(func_num_args() == 4)
		{
			$this->Id = getId(32);
			$this->ParentId = func_get_arg(0);
			$this->UserSystemId = func_get_arg(1);
			$this->GroupId = func_get_arg(2);
			$this->Priority = func_get_arg(3);
		}
	}
	
	function SaveSender()
	{
		return queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_SENDERS."` (`id`, `pid`, `user_id`, `group_id`, `priority`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->ParentId)."','".DBManager::RealEscape($this->UserSystemId)."','".DBManager::RealEscape($this->GroupId)."', '".DBManager::RealEscape($this->Priority)."');");
	}

	function GetXML()
	{
		return "<evinvs id=\"".base64_encode($this->Id)."\" userid=\"".base64_encode($this->UserSystemId)."\" groupid=\"".base64_encode($this->GroupId)."\" priority=\"".base64_encode($this->Priority)."\" />\r\n";
	}
}

class EventActionReceiver
{
	public $Id = "";
	public $ReceiverId = "";
	
	function EventActionReceiver()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->ActionId = $_row["action_id"];
			$this->ReceiverId = $_row["receiver_id"];
		}
		else
		{
			$this->Id = getId(32);
			$this->ActionId = func_get_arg(0);
			$this->ReceiverId = func_get_arg(1);
		}
	}
	
	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENT_ACTION_RECEIVERS."` (`id`, `action_id`, `receiver_id`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->ActionId)."', '".DBManager::RealEscape($this->ReceiverId)."');";
	}

	function GetXML()
	{
		return "<evr id=\"".base64_encode($this->Id)."\" rec=\"".base64_encode($this->ReceiverId)."\" />\r\n";
	}
}

class EventURL
{
	public $Id = "";
	public $EventId = "";
	public $URL = "";
	public $Referrer = "";
	public $TimeOnSite = "";
	public $Blacklist;
	
	function EventURL()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->URL = $_row["url"];
			$this->Referrer = $_row["referrer"];
			$this->TimeOnSite = $_row["time_on_site"];
			$this->Blacklist = !empty($_row["blacklist"]);
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->EventId = func_get_arg(1);
			$this->URL = strtolower(func_get_arg(2));
			$this->Referrer = strtolower(func_get_arg(3));
			$this->TimeOnSite = func_get_arg(4);
			$this->Blacklist = func_get_arg(5);
		}
	}
	
	function GetSQL()
	{
		return "INSERT IGNORE INTO `".DB_PREFIX.DATABASE_EVENT_URLS."` (`id`, `eid`, `url`, `referrer`, `time_on_site`, `blacklist`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->EventId)."','".DBManager::RealEscape($this->URL)."', '".DBManager::RealEscape($this->Referrer)."', '".DBManager::RealEscape($this->TimeOnSite)."', '".DBManager::RealEscape($this->Blacklist)."');";
	}

	function GetXML()
	{
		return "<evur id=\"".base64_encode($this->Id)."\" url=\"".base64_encode($this->URL)."\" ref=\"".base64_encode($this->Referrer)."\" tos=\"".base64_encode($this->TimeOnSite)."\" bl=\"".base64_encode($this->Blacklist)."\" />\r\n";
	}
}

class Event extends BaseObject
{
	public $Name = "";
	public $PagesVisited = "";
	public $TimeOnSite = "";
	public $Receivers;
	public $URLs;
	public $Actions;
	public $NotAccepted;
	public $NotDeclined;
	public $TriggerTime;
	public $SearchPhrase = "";
	public $TriggerAmount;
	public $NotInChat;
	public $Priority;
	public $IsActive;
	public $SaveInCookie;
	public $Goals;
	public $FunnelUrls;

	function Event()
	{
		$this->FunnelUrls = array();
		$this->Goals = array();
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			
			$this->Id = $_row["id"];
			$this->Name = $_row["name"];
			$this->Edited = $_row["edited"];
			$this->Editor = $_row["editor"];
			$this->Created = $_row["created"];
			$this->Creator = $_row["creator"];
			$this->TimeOnSite = $_row["time_on_site"];
			$this->PagesVisited = $_row["pages_visited"];
			$this->NotAccepted = $_row["not_accepted"];
			$this->NotDeclined = $_row["not_declined"];
			$this->NotInChat = $_row["not_in_chat"];
			$this->TriggerAmount = $_row["max_trigger_amount"];
			$this->TriggerTime = $_row["trigger_again_after"];
			$this->SearchPhrase = $_row["search_phrase"];
			$this->Priority = $_row["priority"];
			$this->IsActive = !empty($_row["is_active"]);
			$this->SaveInCookie = !empty($_row["save_cookie"]);
			$this->URLs = array();
			$this->Actions = array();
			$this->Receivers = array();
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->Name = func_get_arg(1);
			$this->Edited = func_get_arg(2);
			$this->Created = func_get_arg(3);
			$this->Editor = func_get_arg(4);
			$this->Creator = func_get_arg(5);
			$this->TimeOnSite = func_get_arg(6);
			$this->PagesVisited = func_get_arg(7);
			$this->NotAccepted = func_get_arg(8);
			$this->NotDeclined = func_get_arg(9);
			$this->TriggerTime = func_get_arg(10);
			$this->TriggerAmount = func_get_arg(11);
			$this->NotInChat = func_get_arg(12);
			$this->Priority = func_get_arg(13);
			$this->IsActive = func_get_arg(14);
			$this->SearchPhrase = func_get_arg(15);
			$this->SaveInCookie = func_get_arg(16);
		}
	}
	
	function MatchesTriggerCriterias($_trigger)
	{
		$match = true;
		if($this->TriggerTime > 0 && $_trigger->TriggerTime >= (time()-$this->TriggerTime))
			$match = false;
		else if($this->TriggerAmount == 0 || ($this->TriggerAmount > 0 && $_trigger->Triggered > $this->TriggerAmount))
			$match = false;
		return $match;
	}
	
	function MatchesGlobalCriterias($_pageCount,$_timeOnSite,$_invAccepted,$_invDeclined,$_inChat,$_searchPhrase="")
	{
		$match = true;
		if($_timeOnSite<0)
			$_timeOnSite = 0;

        $_result = array("pv"=>($this->PagesVisited > 0 && $_pageCount < $this->PagesVisited));
        $_result["tos"] = ($this->TimeOnSite > 0 && $_timeOnSite < $this->TimeOnSite);
        $_result["inva"] = (!empty($this->NotAccepted) && $_invAccepted);
        $_result["invd"] = (!empty($this->NotDeclined) && $_invDeclined);
        $_result["nic"] = (!empty($this->NotInChat) && $_inChat);

		if($this->PagesVisited > 0 && $_pageCount < $this->PagesVisited)
			$match = false;
		else if($this->TimeOnSite > 0 && $_timeOnSite < $this->TimeOnSite)
			$match = false;
		else if(!empty($this->NotAccepted) && $_invAccepted)
			$match = false;
		else if(!empty($this->NotDeclined) && $_invDeclined)
			$match = false;
		else if(!empty($this->NotInChat) && $_inChat)
			$match = false;
			
		if(!empty($this->SearchPhrase))
		{
			if(empty($_searchPhrase))
				$match = false;
			else
			{
				$spmatch=false;
				$phrases = explode(",",$this->SearchPhrase);
				foreach($phrases as $phrase)
					if(jokerCompare($phrase,$_searchPhrase))
					{
						$spmatch = true;
						break;
					}
				if(!$spmatch)
					$match = false;
			}
		}
		return $match;
	}
	
	function MatchesURLFunnelCriterias($_history)
	{
		$startpos = -1;
		$count = 0;
		$pos = 0;
		foreach($_history as $hurl)
		{
			$fuid = $this->FunnelUrls[$count];
			if($this->MatchUrls($this->URLs[$fuid],$hurl->Url->GetAbsoluteUrl(),$hurl->Referrer->GetAbsoluteUrl(),time()-($hurl->Entrance)) === true)
			{
				if($startpos==-1)
					$startpos = $pos;
					
				if($startpos+$count==$pos)
					$count++;
				else
				{
					$count = 0;
					$startpos=-1;
				}
				if($count==count($this->FunnelUrls))
					break;
			}
			else
			{
				$count = 0;
				$startpos=-1;
			}
			$pos++;
		}
		return $count==count($this->FunnelUrls);
	}

	function MatchesURLCriterias($_url,$_referrer,$_previous,$_timeOnUrl)
	{
		if(count($this->URLs) == 0)
			return true;
		$_url = @strtolower($_url);
		$_referrer = @strtolower($_referrer);
		$_previous = @strtolower($_previous);

        $match = false;
    	foreach($this->URLs as $url)
		{
			$umatch = $this->MatchUrls($url,$_url,$_referrer,$_timeOnUrl);
            $rmatch = $this->MatchUrls($url,$_url,$_previous,$_timeOnUrl);
            if($umatch === false || $rmatch === false)
				return false;
			if($umatch === true || $rmatch === true)
				$match = true;
		}
		return $match;
	}
	
	function MatchUrls($_eurl,$_url,$_referrer,$_timeOnUrl)
	{
		if($_eurl->TimeOnSite > 0 && $_eurl->TimeOnSite > $_timeOnUrl)
			return -1;
		$valid = true;
		if(!empty($_eurl->URL))
			$valid=jokerCompare($_eurl->URL,$_url);
		if((!empty($_eurl->URL) && $valid || empty($_eurl->URL)) && !empty($_eurl->Referrer))
    		$valid=jokerCompare($_eurl->Referrer,$_referrer);
        if($valid)
			return !$_eurl->Blacklist;
		else
			return -1;
	}

	function GetSQL()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_EVENTS."` (`id`, `name`, `created`, `creator`, `edited`, `editor`, `pages_visited`, `time_on_site`, `max_trigger_amount`, `trigger_again_after`, `not_declined`, `not_accepted`, `not_in_chat`, `priority`, `is_active`, `search_phrase`, `save_cookie`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->Created)."','".DBManager::RealEscape($this->Creator)."','".DBManager::RealEscape($this->Edited)."', '".DBManager::RealEscape($this->Editor)."', '".DBManager::RealEscape($this->PagesVisited)."','".DBManager::RealEscape($this->TimeOnSite)."','".DBManager::RealEscape($this->TriggerAmount)."','".DBManager::RealEscape($this->TriggerTime)."', '".DBManager::RealEscape($this->NotDeclined)."', '".DBManager::RealEscape($this->NotAccepted)."', '".DBManager::RealEscape($this->NotInChat)."', '".DBManager::RealEscape($this->Priority)."', '".DBManager::RealEscape($this->IsActive)."', '".DBManager::RealEscape($this->SearchPhrase)."', '".DBManager::RealEscape(($this->SaveInCookie) ? 1 : 0)."');";
	}

	function GetXML()
	{
		$xml = "<ev id=\"".base64_encode($this->Id)."\" sc=\"".base64_encode($this->SaveInCookie)."\" nacc=\"".base64_encode($this->NotAccepted)."\" ndec=\"".base64_encode($this->NotDeclined)."\" name=\"".base64_encode($this->Name)."\" prio=\"".base64_encode($this->Priority)."\" created=\"".base64_encode($this->Created)."\" nic=\"".base64_encode($this->NotInChat)."\" creator=\"".base64_encode($this->Creator)."\" editor=\"".base64_encode($this->Editor)."\" edited=\"".base64_encode($this->Edited)."\" tos=\"".base64_encode($this->TimeOnSite)."\" ta=\"".base64_encode($this->TriggerAmount)."\" tt=\"".base64_encode($this->TriggerTime)."\" pv=\"".base64_encode($this->PagesVisited)."\" ia=\"".base64_encode($this->IsActive)."\" sp=\"".base64_encode($this->SearchPhrase)."\">\r\n";
		
		foreach($this->Actions as $action)
			$xml .= $action->GetXML();
		
		foreach($this->URLs as $url)
			$xml .= $url->GetXML();
			
		foreach($this->Goals as $act)
			$xml .= "<evg id=\"".base64_encode($act->Id)."\" />";
			
		foreach($this->FunnelUrls as $ind => $uid)
			$xml .= "<efu id=\"".base64_encode($uid)."\">".base64_encode($ind)."</efu>";

		return $xml . "</ev>\r\n";
	}
}

class Goal
{
	public $Id;
	public $Title;
	public $Description;
	public $Conversion;
	
	function Goal()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->Id = $_row["id"];
			$this->Title = $_row["title"];
			$this->Description = $_row["description"];
			$this->Conversion = !empty($_row["conversion"]);
		}
		else
		{
			$this->Id = func_get_arg(0);
			$this->Title = func_get_arg(1);
			$this->Description = func_get_arg(2);
			$this->Conversion = func_get_arg(3);
		}
	}
	
	function Save()
	{
		return "INSERT INTO `".DB_PREFIX.DATABASE_GOALS."` (`id`, `title`, `description`, `conversion`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Title)."','".DBManager::RealEscape($this->Description)."', '".DBManager::RealEscape($this->Conversion)."');";
	}

	function GetXML()
	{
		return "<tgt id=\"".base64_encode($this->Id)."\" title=\"".base64_encode($this->Title)."\" desc=\"".base64_encode($this->Description)."\" conv=\"".base64_encode($this->Conversion)."\" />\r\n";
	}
}

class Signature
{
    public $Id;
    public $Name;
    public $Signature;
    public $Default;
    public $Deleted;
    public $OperatorId;
    public $GroupId;

    function Signature()
    {
        if(func_num_args() == 1)
        {
            $_row = func_get_arg(0);
            $this->Id = $_row["id"];
            $this->Name = $_row["name"];
            $this->Signature = $_row["signature"];
            $this->OperatorId = $_row["operator_id"];
            $this->GroupId = $_row["group_id"];
            $this->Default = $_row["default"];
        }
    }

    function Save($_prefix)
    {
        queryDB(true,"DELETE FROM `".$_prefix.DATABASE_SIGNATURES."` WHERE `operator_id`='".DBManager::RealEscape($this->OperatorId)."' AND `group_id`='".DBManager::RealEscape($this->GroupId)."' AND `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
        if(!$this->Deleted)
            queryDB(true,"INSERT INTO `".$_prefix.DATABASE_SIGNATURES."` (`id` ,`name` ,`signature` ,`operator_id`,`group_id`,`default`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->Signature)."', '".DBManager::RealEscape($this->OperatorId)."', '".DBManager::RealEscape($this->GroupId)."', '".DBManager::RealEscape($this->Default)."');");
    }

    function XMLParamAlloc($_param,$_value)
    {
        if($_param =="a")
            $this->Id = $_value;
        else if($_param =="b")
            $this->Default = $_value;
        else if($_param =="c")
            $this->Deleted = $_value;
        else if($_param =="d")
            $this->Name = $_value;
        else if($_param =="e")
            $this->Signature = $_value;
        else if($_param =="f")
            $this->OperatorId = $_value;
        else if($_param =="g")
            $this->GroupId = $_value;
    }

    function GetXML()
    {
        return "<sig i=\"".base64_encode($this->Id)."\" n=\"".base64_encode($this->Name)."\" o=\"".base64_encode($this->OperatorId)."\" g=\"".base64_encode($this->GroupId)."\" d=\"".base64_encode($this->Default ? 1 : 0)."\">".base64_encode($this->Signature)."</sig>\r\n";
    }
}

class Mailbox
{
    public $Type = "IMAP";
    public $Id = "";
    public $Username = "";
    public $Password = "";
    public $Port = 110;
    public $Host = "";
    public $ExecOperatorId = "";
    public $Delete = 2;
    public $Email = "";
    public $SSL = false;
    public $Authentication = "";
    public $SenderName = "";
    public $Default = false;
    public $ConnectFrequency = 15;
    public $LastConnect = 0;
    public $Framework = "ZEND";

    function Mailbox()
    {
        if(func_num_args() == 2)
        {
            $this->Id = $_POST["p_cfg_es_i_" . func_get_arg(0)];
            $this->Email = $_POST["p_cfg_es_e_" . func_get_arg(0)];
            $this->Host = $_POST["p_cfg_es_h_" . func_get_arg(0)];
            $this->Username = $_POST["p_cfg_es_u_" . func_get_arg(0)];
            $this->Password = $_POST["p_cfg_es_p_" . func_get_arg(0)];
            $this->Port = $_POST["p_cfg_es_po_" . func_get_arg(0)];
            $this->SSL = $_POST["p_cfg_es_s_" . func_get_arg(0)];
            $this->Authentication = $_POST["p_cfg_es_a_" . func_get_arg(0)];
            $this->Delete = !empty($_POST["p_cfg_es_d_" . func_get_arg(0)]);
            $this->Type = $_POST["p_cfg_es_t_" . func_get_arg(0)];
            $this->SenderName = $_POST["p_cfg_es_sn_" . func_get_arg(0)];
            $this->Default = !empty($_POST["p_cfg_es_de_" . func_get_arg(0)]);
            $this->ConnectFrequency = $_POST["p_cfg_es_c_" . func_get_arg(0)];
            $this->Framework = $_POST["p_cfg_es_fw_" . func_get_arg(0)];
        }
        else
        {
            $row = func_get_arg(0);
            $this->Id = $row["id"];
            $this->Type = $row["type"];
            $this->Email = $row["email"];
            $this->Username = $row["username"];
            $this->Password = $row["password"];
            $this->Port = $row["port"];
            $this->Host = $row["host"];
            $this->ExecOperatorId = $row["exec_operator_id"];
            $this->Delete = !empty($row["delete"]);
            $this->SenderName = $row["sender_name"];
            $this->Authentication = $row["authentication"];
            $this->SSL = $row["ssl"];
            $this->Default = !empty($row["default"]);
            $this->ConnectFrequency = $row["connect_frequency"];
            $this->LastConnect = $row["last_connect"];

            if(isset($row["framework"]))
                $this->Framework = $row["framework"];
        }
    }

    function GetXML($_groupId="")
    {
        return "<tes g=\"".base64_encode($_groupId)."\" f=\"".base64_encode($this->Framework)."\" e=\"".base64_encode($this->Email)."\" c=\"".base64_encode($this->ConnectFrequency)."\" i=\"".base64_encode($this->Id)."\" a=\"".base64_encode($this->Authentication)."\" s=\"".base64_encode($this->SSL)."\" de=\"".base64_encode($this->Default ? "1" : "0")."\" sn=\"".base64_encode($this->SenderName)."\" t=\"".base64_encode($this->Type)."\" u=\"".base64_encode($this->Username)."\" p=\"".base64_encode($this->Password)."\" po=\"".base64_encode($this->Port)."\" d=\"".base64_encode(1)."\" h=\"".base64_encode($this->Host)."\" />\r\n";
    }

    function Save()
    {
        queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_MAILBOXES."` (`id`,`email`,`exec_operator_id`,`username`,`password`,`type`,`host`,`port`,`delete`,`authentication`,`sender_name`,`ssl`,`default`,`last_connect`,`connect_frequency`,`framework`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Email)."', '".DBManager::RealEscape($this->ExecOperatorId)."', '".DBManager::RealEscape($this->Username)."', '".DBManager::RealEscape($this->Password)."', '".DBManager::RealEscape($this->Type)."', '".DBManager::RealEscape($this->Host)."', '".DBManager::RealEscape($this->Port)."',1, '".DBManager::RealEscape($this->Authentication)."', '".DBManager::RealEscape($this->SenderName)."',".abs(intval($this->SSL)).",".intval($this->Default ? 1 : 0).",".intval($this->LastConnect).",".intval($this->ConnectFrequency).",'".DBManager::RealEscape($this->Framework)."');");
    }

    function SetLastConnect($_time)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_MAILBOXES."` SET `last_connect`=".$_time." WHERE `id`='".DBManager::RealEscape($this->Id)."'");
    }

    function Download(&$_reload, $_delete, $_test=false)
    {
        initData(array("DBCONFIG"));
        require_once(LIVEZILLA_PATH . "_lib/objects.mail.inc.php");
        $ms = new MailSystem($this);
        $mails = array();

        try
        {
            $mails = $ms->ReceiveEmails($_reload, $_delete, $_test);
        }
        catch (Exception $e)
        {
            if($_test)
                throw $e;
            else
                handleError("111",$this->Host . " " . $this->Type . " mailbox connection error: " . $e->getMessage(),"functions.global.inc.php",0);
            return $mails;
        }
        return $mails;
    }

    static function GetDefaultOutgoing()
    {
        global $CONFIG;
        initData(array("DBCONFIG"));
        if(!empty($CONFIG["db"]["gl_email"]))
            foreach($CONFIG["db"]["gl_email"] as $box)
                if($box->Default && $box->Type != 'POP' && $box->Type != 'IMAP')
                    return $box;
        return null;
    }

    static function GetById($_id,$_defaultOutgoing=false)
    {
        global $CONFIG;
        initData(array("DBCONFIG"));
        if(!empty($CONFIG["db"]["gl_email"]))
            foreach($CONFIG["db"]["gl_email"] as $box)
                if($box->Id == $_id)
                    return $box;
        if($_defaultOutgoing)
            return Mailbox::GetDefaultOutgoing();
        return null;
    }

    static function IsValidEmail($_email)
    {
        return preg_match('/^([*+!.&#$?\'\\%\/0-9a-z^_`{}=?~:-]+)@(([0-9a-z-]+\.)+[0-9a-z]{2,4})$/i', $_email);
    }

    static function FinalizeEmail($_text,$_html,$_remove=false)
    {
        global $CONFIG;
        if($_remove)
            $_text = str_replace("<!--lz_ref_link-->","",$_text);
        else if($_html)
            $_text = str_replace("<!--lz_ref_link-->","<br><br>".parseURL(@$CONFIG["gl_cpae"]),$_text);
        else
            $_text = str_replace("<!--lz_ref_link-->","\r\n\r\n".@$CONFIG["gl_cpae"],$_text);
        return $_text;
    }
}

class PredefinedMessage
{
	public $Id = 0;
	public $LangISO = "";
	public $InvitationAuto = "";
	public $InvitationManual = "";
	public $Welcome = "";
	public $WebsitePushAuto = "";
	public $WebsitePushManual = "";
	public $IsDefault;
	public $AutoWelcome;
	public $GroupId = "";
	public $UserId = "";
	public $Editable;
	public $TicketInformation = "";
	public $ChatInformation = "";
	public $CallMeBackInformation = "";
	public $QueueMessage = "";
	public $QueueMessageTime = 120;
	public $WelcomeCallMeBack = "";
	public $Deleted = false;
    public $SubjectChatTranscript = "";
    public $SubjectTicketResponder = "";
    public $SubjectTicketReply = "";
    public $EmailChatTranscriptBodyPlaintext = "";
    public $EmailTicketResponderBodyPlaintext = "";
    public $EmailTicketReplyBodyPlaintext = "";
    public $EmailChatTranscriptBodyHTML = false;
    public $EmailTicketResponderBodyHTML = false;
    public $EmailTicketReplyBodyHTML = false;

	function PredefinedMessage()
	{
		if(func_num_args() == 1)
		{
			$_row = func_get_arg(0);
			$this->LangISO = $_row["lang_iso"];
			$this->InvitationAuto = @$_row["invitation_auto"];
			$this->InvitationManual = @$_row["invitation_manual"];
			$this->Welcome = $_row["welcome"];
			
			if(!empty($_row["welcome_call_me_back"]))
				$this->WelcomeCallMeBack = $_row["welcome_call_me_back"];
				
			$this->WebsitePushAuto = @$_row["website_push_auto"];
			$this->WebsitePushManual = @$_row["website_push_manual"];
			$this->IsDefault = !empty($_row["is_default"]);
			$this->AutoWelcome = !empty($_row["auto_welcome"]);
			$this->Editable = !empty($_row["editable"]);
			$this->TicketInformation = @$_row["ticket_info"];
			$this->ChatInformation = @$_row["chat_info"];
			$this->CallMeBackInformation = @$_row["call_me_back_info"];
			$this->EmailChatTranscriptBodyPlaintext = @$_row["email_chat_transcript"];
			$this->EmailTicketResponderBodyPlaintext = @$_row["email_ticket_responder"];
            $this->EmailTicketReplyBodyPlaintext = @$_row["email_ticket_reply"];
			$this->QueueMessage = @$_row["queue_message"];
			$this->QueueMessageTime = @$_row["queue_message_time"];
            $this->SubjectChatTranscript = @$_row["subject_chat_transcript"];
            $this->SubjectTicketResponder = @$_row["subject_ticket_responder"];
            $this->SubjectTicketReply = @$_row["subject_ticket_reply"];
            $this->EmailChatTranscriptBodyHTML = @$_row["email_chat_transcript_html"];
            $this->EmailTicketResponderBodyHTML = @$_row["email_ticket_responder_html"];
            $this->EmailTicketReplyBodyHTML = @$_row["email_ticket_reply_html"];
		}
		else if(func_num_args() == 17)
		{
			$this->Id = func_get_arg(0);
			$this->UserId = func_get_arg(1);
			$this->GroupId = func_get_arg(2);
			$this->LangISO = func_get_arg(3);
			$this->InvitationManual = func_get_arg(4);
			$this->InvitationAuto = func_get_arg(5);
			$this->Welcome = func_get_arg(6);
			$this->WebsitePushManual = func_get_arg(7);
			$this->WebsitePushAuto = func_get_arg(8);
			$this->ChatInformation = func_get_arg(9);
			$this->TicketInformation = func_get_arg(10);
			$this->IsDefault = func_get_arg(12)==1;
			$this->AutoWelcome = func_get_arg(13)==1;
			$this->Editable = func_get_arg(14)==1;
			$this->EmailChatTranscriptBodyPlaintext = func_get_arg(15);
			$this->EmailTicketResponderBodyPlaintext = func_get_arg(16);
            $this->EmailTicketReplyBodyPlaintext = func_get_arg(24);
			$this->WelcomeCallMeBack = func_get_arg(20);
			$this->CallMeBackInformation = func_get_arg(21);
            $this->SubjectChatTranscript = func_get_arg(22);
            $this->SubjectTicketResponder = func_get_arg(23);
            $this->SubjectTicketReply = func_get_arg(25);
            $this->EmailChatTranscriptBodyHTML = func_get_arg(26);
            $this->EmailTicketResponderBodyHTML = func_get_arg(27);
            $this->EmailTicketReplyBodyHTML = func_get_arg(28);
		}
	}
	
	function XMLParamAlloc($_param,$_value)
	{
		if($_param =="inva")
			$this->InvitationAuto = base64_decode($_value);
		else if($_param =="invm")
        {
			$this->InvitationManual = base64_decode($_value);
        }
		else if($_param =="wpa")
			$this->WebsitePushAuto = base64_decode($_value);
		else if($_param =="wpm")
			$this->WebsitePushManual = base64_decode($_value);
		else if($_param =="wel")
			$this->Welcome = base64_decode($_value);
		else if($_param =="welcmb")
			$this->WelcomeCallMeBack = base64_decode($_value);
		else if($_param =="def")
			$this->IsDefault = $_value;
		else if($_param =="aw")
			$this->AutoWelcome = $_value;
		else if($_param =="edit")
			$this->Editable = $_value;
		else if($_param =="ci")
			$this->ChatInformation = base64_decode($_value);
		else if($_param =="ccmbi")
			$this->CallMeBackInformation = base64_decode($_value);
		else if($_param =="ti")
			$this->TicketInformation = base64_decode($_value);

		else if($_param =="qm")
			$this->QueueMessage = base64_decode($_value);
		else if($_param =="qmt")
			$this->QueueMessageTime = $_value;
		else if($_param =="del")
			$this->Deleted = !empty($_value);

        else if($_param =="sct")
            $this->SubjectChatTranscript = base64_decode($_value);
        else if($_param =="st")
            $this->SubjectTicketResponder = base64_decode($_value);
        else if($_param =="str")
            $this->SubjectTicketReply = base64_decode($_value);

        else if($_param =="hct")
            $this->EmailChatTranscriptBodyHTML = base64_decode($_value);
        else if($_param =="ht")
            $this->EmailTicketResponderBodyHTML = base64_decode($_value);
        else if($_param =="htr")
            $this->EmailTicketReplyBodyHTML = base64_decode($_value);

        else if($_param =="ect")
            $this->EmailChatTranscriptBodyPlaintext = base64_decode($_value);
        else if($_param =="et")
            $this->EmailTicketResponderBodyPlaintext = base64_decode($_value);
        else if($_param =="etr")
            $this->EmailTicketReplyBodyPlaintext = base64_decode($_value);
	}
	
	function Save($_prefix)
	{
        if($this->Deleted)
		    queryDB(true,"DELETE FROM `".$_prefix.DATABASE_PREDEFINED."` WHERE `internal_id`='".DBManager::RealEscape($this->UserId)."' AND `group_id`='".DBManager::RealEscape($this->GroupId)."' AND `lang_iso`='".DBManager::RealEscape($this->LangISO)."' LIMIT 1;");
		else
			queryDB(true,$x = "REPLACE INTO `".$_prefix.DATABASE_PREDEFINED."` (`id` ,`internal_id` ,`group_id` ,`lang_iso` ,`invitation_manual`,`invitation_auto` ,`welcome` ,`welcome_call_me_back`,`website_push_manual` ,`website_push_auto`,`chat_info`,`call_me_back_info`,`ticket_info` ,`browser_ident` ,`is_default` ,`auto_welcome`,`editable`,`email_chat_transcript`,`email_ticket_responder`,`email_ticket_reply`,`queue_message`,`queue_message_time`,`subject_chat_transcript`,`subject_ticket_responder`,`subject_ticket_reply`,`email_chat_transcript_html`,`email_ticket_responder_html`,`email_ticket_reply_html`) VALUES ('".DBManager::RealEscape($this->Id)."', '".DBManager::RealEscape($this->UserId)."','".DBManager::RealEscape($this->GroupId)."', '".DBManager::RealEscape($this->LangISO)."', '".DBManager::RealEscape($this->InvitationManual)."', '".DBManager::RealEscape($this->InvitationAuto)."','".DBManager::RealEscape($this->Welcome)."','".DBManager::RealEscape($this->WelcomeCallMeBack)."', '".DBManager::RealEscape($this->WebsitePushManual)."', '".DBManager::RealEscape($this->WebsitePushAuto)."',  '".DBManager::RealEscape($this->ChatInformation)."',  '".DBManager::RealEscape($this->CallMeBackInformation)."', '".DBManager::RealEscape($this->TicketInformation)."','".DBManager::RealEscape('1')."', '".DBManager::RealEscape($this->IsDefault ? '1' : '0')."', '".DBManager::RealEscape($this->AutoWelcome ? '1' : '0')."', '".DBManager::RealEscape($this->Editable ? '1' : '0')."', '".DBManager::RealEscape($this->EmailChatTranscriptBodyPlaintext)."', '".DBManager::RealEscape($this->EmailTicketResponderBodyPlaintext)."','".DBManager::RealEscape($this->EmailTicketReplyBodyPlaintext)."', '".DBManager::RealEscape($this->QueueMessage)."', '".DBManager::RealEscape($this->QueueMessageTime)."', '".DBManager::RealEscape($this->SubjectChatTranscript)."', '".DBManager::RealEscape($this->SubjectTicketResponder)."', '".DBManager::RealEscape($this->SubjectTicketReply)."', '".DBManager::RealEscape($this->EmailChatTranscriptBodyHTML)."', '".DBManager::RealEscape($this->EmailTicketResponderBodyHTML)."', '".DBManager::RealEscape($this->EmailTicketReplyBodyHTML)."');");
    }

	function GetXML($_serversetup=true)
	{
        if($_serversetup)
            return "<pm et=\"".base64_encode($this->EmailTicketResponderBodyPlaintext)."\" etr=\"".base64_encode($this->EmailTicketReplyBodyPlaintext)."\" ect=\"".base64_encode($this->EmailChatTranscriptBodyPlaintext)."\" ti=\"".base64_encode($this->TicketInformation)."\" ci=\"".base64_encode($this->ChatInformation)."\" st=\"".base64_encode($this->SubjectTicketResponder)."\" str=\"".base64_encode($this->SubjectTicketReply)."\" sct=\"".base64_encode($this->SubjectChatTranscript)."\" ccmbi=\"".base64_encode($this->CallMeBackInformation)."\" lang=\"".base64_encode($this->LangISO)."\" invm=\"".base64_encode($this->InvitationManual)."\" inva=\"".base64_encode($this->InvitationAuto)."\" wel=\"".base64_encode($this->Welcome)."\" welcmb=\"".base64_encode($this->WelcomeCallMeBack)."\" wpa=\"".base64_encode($this->WebsitePushAuto)."\" wpm=\"".base64_encode($this->WebsitePushManual)."\" bi=\"".base64_encode(1)."\" def=\"".base64_encode($this->IsDefault)."\" aw=\"".base64_encode($this->AutoWelcome)."\" edit=\"".base64_encode($this->Editable)."\" qm=\"".base64_encode($this->QueueMessage)."\" qmt=\"".base64_encode($this->QueueMessageTime)."\" hct=\"".base64_encode($this->EmailChatTranscriptBodyHTML)."\" ht=\"".base64_encode($this->EmailTicketResponderBodyHTML)."\" htr=\"".base64_encode($this->EmailTicketReplyBodyHTML)."\" />\r\n";
        else
		    return "<pm lang=\"".base64_encode($this->LangISO)."\" invm=\"".base64_encode($this->InvitationManual)."\" wel=\"".base64_encode($this->Welcome)."\" welcmb=\"".base64_encode($this->WelcomeCallMeBack)."\" wpa=\"".base64_encode($this->WebsitePushAuto)."\" bi=\"".base64_encode(1)."\" def=\"".base64_encode($this->IsDefault)."\" aw=\"".base64_encode($this->AutoWelcome)."\" edit=\"".base64_encode($this->Editable)."\" />\r\n";
	}
}

class ChatAutoReply
{
	public $Id;
	public $ResourceId;
	public $Tags;
	public $SearchType = 0;
	public $Answer;
	public $Languages;
	public $NewWindow = false;
    public $Waiting = false;
    public $Send = true;
    public $SendInactivityTimeInternal = -1;
    public $SendInactivityTimeExternal = -1;
    public $CloseChat = false;
    public $Title = "";
	
	function ChatAutoReply()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
            $this->Id = $row["id"];
            $this->ResourceId = $row["resource_id"];
            $this->Tags = $row["tags"];
			$this->Languages = $row["language"];
			$this->SearchType = $row["search_type"];
			$this->Answer = $row["answer"];
			$this->NewWindow = !empty($row["new_window"]);
            $this->Waiting = !empty($row["waiting"]);
            $this->Send = !empty($row["send"]);
            $this->SendInactivityTimeInternal = $row["inactivity_internal"];
            $this->SendInactivityTimeExternal = $row["inactivity_external"];
            $this->CloseChat = !empty($row["inactivity_close"]);
            $this->Title = $row["title"];
		}
		else if(func_num_args() == 13)
		{
            $this->Id = func_get_arg(0);
            $this->ResourceId = func_get_arg(1);
            $this->Tags = func_get_arg(2);
            $this->SearchType = func_get_arg(3);
			$this->Answer = func_get_arg(4);
			$this->NewWindow = func_get_arg(5);
			$this->Languages = func_get_arg(6);
            $this->Send = func_get_arg(7);
            $this->Waiting = func_get_arg(8);
            $this->SendInactivityTimeInternal = func_get_arg(9);
            $this->SendInactivityTimeExternal = func_get_arg(10);
            $this->CloseChat = func_get_arg(11);
            $this->Title = func_get_arg(12);
		}
   	}
	
	function GetXML()
	{
		return "<bf i=\"".base64_encode($this->Id)."\" t=\"".base64_encode($this->Title)."\" ti=\"".base64_encode($this->SendInactivityTimeInternal)."\" te=\"".base64_encode($this->SendInactivityTimeExternal)."\" c=\"".base64_encode($this->CloseChat ? 1 : 0)."\" l=\"".base64_encode($this->Languages)."\" n=\"".base64_encode($this->NewWindow ? 1 : 0)."\" ds=\"".base64_encode($this->Send ? 1 : 0)."\" w=\"".base64_encode($this->Waiting ? 1 : 0)."\" r=\"".base64_encode($this->ResourceId)."\" s=\"".base64_encode($this->SearchType)."\" a=\"".base64_encode($this->Answer)."\">".base64_encode($this->Tags)."</bf>\r\n";
	}

	function Save($_botId)
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_AUTO_REPLIES."` (`id` ,`resource_id` ,`owner_id` ,`tags` ,`search_type`,`answer`,`new_window`,`language`,`send`,`waiting`,`inactivity_internal`,`inactivity_external`,`inactivity_close`,`title`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->ResourceId)."','".DBManager::RealEscape($_botId)."','".DBManager::RealEscape($this->Tags)."','".DBManager::RealEscape($this->SearchType)."','".DBManager::RealEscape($this->Answer)."','".DBManager::RealEscape($this->NewWindow ? 1 : 0)."','".DBManager::RealEscape($this->Languages)."','".DBManager::RealEscape($this->Send ? 1 : 0)."','".DBManager::RealEscape($this->Waiting ? 1 : 0)."','".DBManager::RealEscape($this->SendInactivityTimeInternal)."','".DBManager::RealEscape($this->SendInactivityTimeExternal)."','".DBManager::RealEscape($this->CloseChat ? 1 : 0)."','".DBManager::RealEscape($this->Title)."');");
	}

    function MatchesLanguage($_language)
    {
        if(empty($_language))
            return (empty($this->Languages));
        return !(strpos(strtolower($this->Languages),strtolower($_language))===false && !empty($this->Languages));
    }

    static function GetMatches($_list, $_question, $_language, $_chat, $_internal, $lmsi=false, $lmse=false, $lpi=null, $lpe=null)
    {
        $answers = array();
        foreach($_list as $reply)
        {
            if($_chat != null)
                $reply->Answer = $_chat->TextReplace($reply->Answer);

            if($_internal != null)
                $reply->Answer = $_internal->TextReplace($reply->Answer);

            if($reply->SearchType != 5)
                $reply->Tags = str_replace(array("!",".","?","=",")","(","-","_",":","#","~","?"),"",strtolower($reply->Tags));
            if(!$reply->MatchesLanguage($_language))
                continue;
            if(empty($_chat->AllocatedTime) && !$reply->Waiting)
            {
                if(!($_internal != null && $_internal->IsBot))
                    continue;
            }

            $tags = explode(",", $reply->Tags);
            $count=0;

            if(!empty($_chat))
            {
                if($lmsi === false && ($reply->SendInactivityTimeInternal > -1 || $reply->SendInactivityTimeExternal > -1))
                {
                    $lpi = Chat::GetLastPost($_chat->ChatId,true);
                    $lpe = Chat::GetLastPost($_chat->ChatId,false);
                    $lmsi = ($lpi != null) ? $lpi->Created : 0;
                    $lmse = ($lpe != null) ? $lpe->Created : 0;
                }

                $lm = max($lmsi,$lmse);
                $lastMessageExternal = ($lmse > $lmsi && !empty($lm));
                $lastMessageInternal = ($lmsi >= $lmse);

                if(empty($lm))
                    $lm = $_chat->AllocatedTime;

                if(!empty($lm))
                {
                    if($reply->SendInactivityTimeInternal > -1 && $lastMessageExternal && $lmsi > 0)
                        if((time()-$lm) > $reply->SendInactivityTimeInternal)
                            $answers[$count."-".count($answers)] = $reply;
                    if($reply->SendInactivityTimeExternal > -1 && $lastMessageInternal)
                        if((time()-$lm) > $reply->SendInactivityTimeExternal)
                            if(!($lpi != null && $reply->Answer == $lpi->Text))
                                $answers[$count."-".count($answers)] = $reply;
                    if($reply->CloseChat && !empty($_chat) && !empty($_internal))
                        if(count($answers)>0 && isset($answers["0-0"]) && $answers["0-0"] == $reply)
                            $_chat->InternalClose($_internal->SystemId);
                }
            }

            if($reply->SendInactivityTimeInternal == -1 && $reply->SendInactivityTimeExternal == -1)
            {
                foreach($tags as $tag)
                    if($reply->SearchType == 5)
                    {
                        if(@preg_match($reply->Tags, $_question) === 1)
                            $count++;
                    }
                    else if(($reply->SearchType < 4 && strpos($_question,$tag)!==false) || jokerCompare($tag,$_question))
                        $count++;
                    if(($reply->SearchType==0 && $count==(substr_count($reply->Tags,",")+1)) || ($reply->SearchType>0 && $count >=$reply->SearchType) || ($reply->SearchType>=4 && $count>0))
                    {
                        if(empty($reply->Answer))
                        {
                            if(getResource($reply->ResourceId) !== null)
                                $answers[$count."-".count($answers)] = $reply;
                        }
                        else
                        {
                            $answers = array();
                            $answers[$count."-".count($answers)] = $reply;
                            break;
                        }
                    }
            }
        }
        return $answers;
    }

    static function SendAutoReply($_reply,$_user,$_sender)
    {
        $arpost = new Post($id = getId(32),$_user->Browsers[0]->InternalUser->SystemId,$_user->Browsers[0]->SystemId,$_reply,time(),$_user->Browsers[0]->ChatId,$_user->Browsers[0]->InternalUser->Fullname);
        $arpost->ReceiverOriginal = $arpost->ReceiverGroup = $_user->Browsers[0]->SystemId;
        $arpost->Save();
        foreach($_user->Browsers[0]->Members as $opsysid => $member)
        {
            $rpost = new Post($id,$_user->Browsers[0]->InternalUser->SystemId,$opsysid,$_reply,time(),$_user->Browsers[0]->ChatId,$_sender->Fullname);
            $rpost->ReceiverOriginal = $rpost->ReceiverGroup = $_user->Browsers[0]->SystemId;
            $rpost->Save();
        }
    }
}

class Profile
{
	public $LastEdited;
	public $Firstname;
	public $Name;
	public $Email;
	public $Company;
	public $Phone;
	public $Fax;
	public $Department;
	public $Street;
	public $City;
	public $ZIP;
	public $Country;
	public $Languages;
	public $Comments;
	public $Public;
	
	function Profile()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
            $this->Firstname = $row["first_name"];
            $this->Name = $row["last_name"];
            $this->Email = $row["email"];
            $this->Company = $row["company"];
            $this->Phone = $row["phone"];
            $this->Fax = $row["fax"];
            $this->Department = $row["department"];
            $this->Street = $row["street"];
            $this->City = $row["city"];
            $this->ZIP = $row["zip"];
            $this->Country = $row["country"];
            $this->Languages = $row["languages"];
            $this->Gender = $row["gender"];
            $this->Comments = $row["comments"];
			$this->Public = $row["public"];
			$this->LastEdited = $row["edited"];
		}
		else
		{
            $this->Firstname = func_get_arg(0);
            $this->Name = func_get_arg(1);
            $this->Email = func_get_arg(2);
            $this->Company = func_get_arg(3);
            $this->Phone = func_get_arg(4);
            $this->Fax = func_get_arg(5);
            $this->Department = func_get_arg(6);
            $this->Street = func_get_arg(7);
            $this->City = func_get_arg(8);
            $this->ZIP = func_get_arg(9);
            $this->Country = func_get_arg(10);
            $this->Languages = func_get_arg(11);
            $this->Gender = func_get_arg(12);
            $this->Comments = func_get_arg(13);
			$this->Public = func_get_arg(14);
		}
   	}
	
	function GetXML($_userId)
	{
		return "<p os=\"".base64_encode($_userId)."\" fn=\"".base64_encode($this->Firstname)."\" n=\"".base64_encode($this->Name)."\" e=\"".base64_encode($this->Email)."\" co=\"".base64_encode($this->Company)."\" p=\"".base64_encode($this->Phone)."\" f=\"".base64_encode($this->Fax)."\" d=\"".base64_encode($this->Department)."\" s=\"".base64_encode($this->Street)."\" z=\"".base64_encode($this->ZIP)."\" c=\"".base64_encode($this->Country)."\" l=\"".base64_encode($this->Languages)."\" ci=\"".base64_encode($this->City)."\" g=\"".base64_encode($this->Gender)."\" com=\"".base64_encode($this->Comments)."\" pu=\"".base64_encode($this->Public)."\" />\r\n";
	}

	function Save($_userId)
	{
		queryDB(false,"INSERT INTO `".DB_PREFIX.DATABASE_PROFILES."` (`id` ,`edited` ,`first_name` ,`last_name` ,`email` ,`company` ,`phone`  ,`fax` ,`street` ,`zip` ,`department` ,`city` ,`country` ,`gender` ,`languages` ,`comments` ,`public`) VALUES ('".DBManager::RealEscape($_userId)."','".DBManager::RealEscape(time())."','".DBManager::RealEscape($this->Firstname)."','".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->Email)."','".DBManager::RealEscape($this->Company)."','".DBManager::RealEscape($this->Phone)."','".DBManager::RealEscape($this->Fax)."','".DBManager::RealEscape($this->Street)."','".DBManager::RealEscape($this->ZIP)."','".DBManager::RealEscape($this->Department)."','".DBManager::RealEscape($this->City)."','".DBManager::RealEscape($this->Country)."','".DBManager::RealEscape($this->Gender)."','".DBManager::RealEscape($this->Languages)."','".DBManager::RealEscape($this->Comments)."','".DBManager::RealEscape($this->Public)."');");
	}
}

class DataInput
{
	public $Index;
	public $Caption = "";
    public $InfoText = "";
	public $Type;
	public $Active;
	public $InputValue = "";
	public $Cookie;
	public $Custom;
	public $Name;
	public $Position;
	public $Validate;
	public $ValidationURL;
	public $ValidationTimeout = 15;
	public $ValidationContinueOnTimeout;
    public $AutoCapitalize = false;

	function DataInput($_values)
	{
		global $LZLANG;
		if($_values != null)
		{
			$_values = @unserialize(base64_decode($_values));
			array_walk($_values,"b64dcode");
			$this->Index = $_values[0];
			$this->Caption = (strpos($_values[1],"<!--lang") !== false) ? applyReplacements($_values[1],true,false) : $_values[1];
			$this->Name = $_values[2];
			$this->Type = $_values[3];
			$this->Active = (empty($_GET["ofc"]) || $this->Index!=116) ? !empty($_values[4]) : true;
			$this->Cookie = !empty($_values[5]);
			$this->Position = $_values[6];
			$this->InputValue = (strpos($_values[7],"<!--lang") !== false) ? applyReplacements($_values[7],true,false) : $_values[7];
			$this->Custom = ($this->Index<100);
			$this->Validate = !empty($_values[8]);
			$this->ValidationURL = $_values[9];
			$this->ValidationTimeout = $_values[10];
			$this->ValidationContinueOnTimeout = !empty($_values[11]);

            if(count($_values) > 12)
                $this->InfoText = $_values[12];
		}
		else
		{
			$this->Index = 115;
			$this->Caption = @$LZLANG["client_voucher_id"];
			$this->Name = "chat_voucher_id";
			$this->Custom = false;
			$this->Position = 10000;
			$this->Cookie = false;
			$this->Active = true;
			$this->Validate = false;
			$this->Type = "Text";
		}
	}
	
	function GetHTML($_maxlength,$_active)
	{
		$template = (($this->Type == "Text") ? getFile(PATH_TEMPLATES . "login_input.tpl") : (($this->Type == "TextArea") ? getFile(PATH_TEMPLATES . "login_area.tpl") : (($this->Type == "ComboBox") ? getFile(PATH_TEMPLATES . "login_combo.tpl") : (($this->Type == "File") ? getFile(PATH_TEMPLATES . "login_file.tpl") : getFile(PATH_TEMPLATES . "login_check.tpl")))));
		$template = str_replace("<!--maxlength-->",$_maxlength,$template);
		$template = str_replace("<!--caption-->",$this->Caption,$template);
        $template = str_replace("<!--info_text-->",$this->InfoText,$template);
		$template = str_replace("<!--name-->",$this->Index,$template);

		$template = str_replace("<!--active-->",parseBool($_active),$template);
		if($this->Type == "ComboBox")
		{
			$options = "";
			$parts = explode(";",$this->InputValue);
			foreach($parts as $ind => $part)
				$options .= "<option value=\"".$ind."\">".$part."</option>";
			$template = str_replace("<!--options-->",$options,$template);
		}
		return $template;
	}
	
	function GetValue($_browser)
	{
		if($this->Custom && !empty($_browser->Customs[$this->Index]))
			return $_browser->Customs[$this->Index];
		else if($this->Index == 111)
			return $_browser->Fullname;
		else if($this->Index == 112)
			return $_browser->Email;
		else if($this->Index == 113)
			return $_browser->Company;
		else if($this->Index == 114)
			return $_browser->Question;
		else if($this->Index == 116)
			return $_browser->Phone;
		else
			return "";
	}

    function GetServerInput($_default="",&$_changed=false,$_capitalize=false)
    {
        $rValue="";
        if(isset($_GET["f" . $this->Index]) && base64UrlDecode($_GET["f" . $this->Index]) != "")
            $rValue = base64UrlDecode($_GET["f" . $this->Index]);
        else if(isset($_POST["p_cf" . $this->Index]) && base64UrlDecode($_POST["p_cf" .  $this->Index]) != "")
            $rValue =  base64UrlDecode($_POST["p_cf" . $this->Index]);
        else if(isset($_GET["cf" . $this->Index]) && base64UrlDecode($_GET["cf" . $this->Index]) != "")
            $rValue =  base64UrlDecode($_GET["cf" . $this->Index]);
        else if($this->GetIndexName() != null && isset($_GET[$this->GetIndexName()]) && base64UrlDecode($_GET[$this->GetIndexName()]) != "")
            $rValue =  base64UrlDecode($_GET[$this->GetIndexName()]);
        else if($this->PostIndexName() != null && isset($_POST[$this->PostIndexName()]) && base64UrlDecode($_POST[$this->PostIndexName()]) != "")
            $rValue =  base64UrlDecode($_POST[$this->PostIndexName()]);

        if($_capitalize)
            $rValue = ucwords(strtolower($rValue));

        if($rValue!=$_default && !empty($rValue))
            $_changed = true;

        return $rValue;
    }

    function IsServerInput()
    {
        $v=$this->GetServerInput();
        return !empty($v);
    }

    function IsCookie()
    {
        return !isnull(getCookieValue("form_" . $this->Index));
    }
	
	function GetClientValue($_userInput)
	{
        // index -> value
		if($this->Type == "ComboBox" && !empty($this->InputValue) && is_numeric($_userInput))
		{
			$parts = explode(";",$this->InputValue);
			return $parts[$_userInput];
		}
		return $_userInput;
	}

    function GetClientIndex($_userInput)
    {
        // value -> index
        if($this->Type == "ComboBox" && !empty($this->InputValue) && !is_numeric($_userInput))
        {
            $parts = explode(";",$this->InputValue);
            foreach($parts as $index => $part)
                if($part == $_userInput)
                    return $index;
            return 0;
        }
        return $_userInput;
    }
	
	function GetJavascript($_value)
	{
		return "new lz_chat_input(".$this->Index.",".parseBool($this->Active).",'".base64_encode($this->Caption)."','".base64_encode($this->InfoText)."','".base64_encode($this->Name)."','".$this->Type."','".base64_encode($this->GetPreselectionValue($_value))."',".parseBool($this->Validate).",'".base64_encode($this->ValidationURL)."',".$this->ValidationTimeout.",".parseBool($this->ValidationContinueOnTimeout).")";
	}
	
	function GetIndexName()
	{
		$getIndex = array(111=>GET_EXTERN_USER_NAME,112=>GET_EXTERN_USER_EMAIL,113=>GET_EXTERN_USER_COMPANY,114=>GET_EXTERN_USER_QUESTION,115=>"vc",116=>"ep");
		if(isset($getIndex[$this->Index]))
			return $getIndex[$this->Index];
		else
			return null;
	}

    function PostIndexName()
    {
        $postIndex = array(111=>POST_EXTERN_USER_NAME,112=>POST_EXTERN_USER_EMAIL,113=>POST_EXTERN_USER_COMPANY,114=>"p_question",115=>"p_vc",116=>"p_phone");
        if(isset($postIndex[$this->Index]))
            return $postIndex[$this->Index];
        else
            return null;
    }

    function GetHeight()
    {
        return ($this->Type == "TextArea") ? 120 : 30;
    }
	
	function GetPreselectionValue($_value)
	{
		if($this->Type == "CheckBox" || $this->Type == "ComboBox")
		{
			return (!empty($_value)) ? $_value : "0";
		}
		else
		{
			if(empty($_value) && !empty($this->InputValue))
				return $this->InputValue;
			return $_value;
		}
	}
	
	function GetCookieValue()
	{
		return ((!$this->Custom) ? getCookieValue("form_" . $this->Index) : getCookieValue("cf_" . $this->Index));
	}

    static function ToIndexBased($_nameBased)
    {
        global $INPUTS;
        $indexBased = array();
        foreach($INPUTS as $index => $input)
            if(isset($_nameBased[$input->Name]))
                $indexBased[$index] = $_nameBased[$input->Name];
        return $indexBased;
    }

    static function GetMaxHeight()
    {
        global $INPUTS;
        $max = 0;
        foreach($INPUTS as $input)
            if($input->Active)
                $max += $input->GetHeight();

        return (max(450,($max+250)));
    }

    static function Build($count=0)
    {
        global $CONFIG,$INPUTS;
        if(!empty($CONFIG["gl_input_list"]))
        {
            foreach($CONFIG["gl_input_list"] as $values)
            {
                $input = new DataInput($values);
                if($input->Index == 111 && true)
                    $input->AutoCapitalize = true;

                $sorter[($input->Position+10)."-".$count++] = $input;
            }
            $sorter[($input->Position+10)."-".$count++] = new DataInput(null); //+ DNC
            ksort($sorter);
            foreach($sorter as $input)
                $INPUTS[$input->Index] = $input;
        }
    }
}


class CommercialChatPaymentProvider extends BaseObject
{
	public $Name;
	public $Account;
	public $URL;
	public $LogoURL;
	
	function CommercialChatPaymentProvider()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
			$this->Id = $row["id"];
            $this->Name = $row["name"];
            $this->Account = $row["account"];
			$this->URL = $row["URL"];
			$this->LogoURL = $row["logo"];
		}
		else
		{
            $this->Id = func_get_arg(0);
            $this->Name = func_get_arg(1);
            $this->Account = func_get_arg(2);
            $this->URL = func_get_arg(3);
			$this->LogoURL = func_get_arg(4);
		}
   	}
	
	function GetXML()
	{
		return "<ccpp id=\"".base64_encode($this->Id)."\" n=\"".base64_encode($this->Name)."\" l=\"".base64_encode($this->LogoURL)."\" a=\"".base64_encode($this->Account)."\" u=\"".base64_encode($this->URL)."\" />\r\n";
	}

	function Save()
	{
		$result = queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_PROVIDERS."` (`id`, `name`, `account`, `URL`, `logo`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->Account)."','".DBManager::RealEscape($this->URL)."','".DBManager::RealEscape($this->LogoURL)."');");
		if(DBManager::GetAffectedRowCount() <= 0)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_PROVIDERS."` SET `name`='".DBManager::RealEscape($this->Name)."',`account`='".DBManager::RealEscape($this->Account)."', `URL`='".DBManager::RealEscape($this->URL)."', `logo`='".DBManager::RealEscape($this->LogoURL)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
}


class CommercialChatVoucherLocalization extends BaseObject
{
	public $LanguageISOTwoLetter;
	public $Title;
	public $Description;
	public $Terms;
	public $EmailVoucherCreated;
	public $EmailVoucherPaid;
	public $EmailVoucherUpdate;
	public $ExtensionRequest;
	
	function CommercialChatVoucherLocalization()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
			$this->Id = $row["id"];
            $this->LanguageISOTwoLetter = $row["language"];
            $this->Title = $row["title"];
			$this->Description = $row["description"];
			$this->Terms = $row["terms"];
			$this->EmailVoucherCreated = $row["email_voucher_created"];
			$this->EmailVoucherPaid = $row["email_voucher_paid"];
			$this->EmailVoucherUpdate = $row["email_voucher_update"];
			$this->ExtensionRequest = $row["extension_request"];
		}
		else
		{
            $this->Id = func_get_arg(0);
            $this->LanguageISOTwoLetter = func_get_arg(1);
            $this->Title = func_get_arg(2);
			$this->Description = func_get_arg(3);
			$this->Terms = func_get_arg(4);
			$this->EmailVoucherCreated = func_get_arg(5);
			$this->EmailVoucherPaid = func_get_arg(6);
			$this->EmailVoucherUpdate = func_get_arg(7);
			$this->ExtensionRequest = func_get_arg(8);
		}
   	}
	
	function GetXML()
	{
		return "<cctl id=\"".base64_encode($this->Id)."\" litl=\"".base64_encode($this->LanguageISOTwoLetter)."\" t=\"".base64_encode($this->Title)."\" d=\"".base64_encode($this->Description)."\" emvc=\"".base64_encode($this->EmailVoucherCreated)."\" exr=\"".base64_encode($this->ExtensionRequest)."\" emvp=\"".base64_encode($this->EmailVoucherPaid)."\" emvu=\"".base64_encode($this->EmailVoucherUpdate)."\">".base64_encode($this->Terms)."</cctl>";
	}

	function Save($_parentId)
	{
		queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_LOCALIZATIONS."` (`id`, `tid`, `language`, `title`, `description`, `terms`, `email_voucher_created`, `email_voucher_paid`,`email_voucher_update`, `extension_request`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($_parentId)."','".DBManager::RealEscape($this->LanguageISOTwoLetter)."','".DBManager::RealEscape($this->Title)."','".DBManager::RealEscape($this->Description)."','".DBManager::RealEscape($this->Terms)."','".DBManager::RealEscape($this->EmailVoucherCreated)."','".DBManager::RealEscape($this->EmailVoucherPaid)."','".DBManager::RealEscape($this->EmailVoucherUpdate)."','".DBManager::RealEscape($this->ExtensionRequest)."');");
	}
}

class CommercialChatBillingType extends BaseObject
{
	public $Localizations;
	public $ChatSessionsMax;
	public $ChatTimeMax;
	public $VoucherAutoExpire;
	public $VoucherTimeVoidByOperator;
	public $VoucherSessionVoidByOperator;
	public $VoucherExpireVoidByOperator;
	public $CurrencyISOThreeLetter;
	public $Price;
	public $VAT = 0;
	
	function CommercialChatBillingType()
   	{
		if(func_num_args() == 1)
		{
			$row = func_get_arg(0);
			$this->Localizations = array();
			$this->Id = $row["typeid"];
            $this->ChatSessionsMax = $row["number_of_chats"];
            $this->ChatTimeMax = $row["total_length"];
            $this->VoucherAutoExpire = $row["auto_expire"];
            $this->VoucherTimeVoidByOperator = !empty($row["total_length_void"]);
			$this->VoucherSessionVoidByOperator = !empty($row["number_of_chats_void"]);
			$this->VoucherExpireVoidByOperator = !empty($row["auto_expire_void"]);
			$this->CurrencyISOThreeLetter = $row["currency"];
            $this->Price = $row["price"];
		}
		else
		{
            $this->Id = func_get_arg(0);
            $this->ChatSessionsMax = func_get_arg(1);
            $this->ChatTimeMax = func_get_arg(2);
            $this->VoucherAutoExpire = func_get_arg(3);
            $this->VoucherTimeVoidByOperator = !isnull(func_get_arg(4));
			$this->VoucherSessionVoidByOperator = !isnull(func_get_arg(5));
			$this->VoucherExpireVoidByOperator = !isnull(func_get_arg(6));
			$this->CurrencyISOThreeLetter = func_get_arg(7);
			$price = func_get_arg(8);
            $this->Price = str_replace(",",".",$price);
		}
   	}
	
	function GetLocalization($_language="")
	{
		global $CONFIG,$DEFAULT_BROWSER_LANGUAGE;
		$loc = null;
		if(!empty($DEFAULT_BROWSER_LANGUAGE) && isset($this->Localizations[strtoupper($DEFAULT_BROWSER_LANGUAGE)]))
			$loc = $this->Localizations[strtoupper($DEFAULT_BROWSER_LANGUAGE)];
		else if(!empty($_language) && isset($this->Localizations[strtoupper($_language)]))
			$loc = $this->Localizations[strtoupper($_language)];
		else if(isset($this->Localizations[strtoupper($CONFIG["gl_default_language"])]))
			$loc = $this->Localizations[strtoupper($CONFIG["gl_default_language"])];
		else
		{
			foreach($this->Localizations as $localization)
			{
				$loc = $localization;
				break;
			}
		}
		return $loc;
	}
	
	function GetTemplate()
	{
		global $CONFIG;
		$loc = $this->GetLocalization();
		$html = str_replace("<!--title-->",$loc->Title,getFile(PATH_TEMPLATES . "chat_voucher_type.tpl"));
		$html = str_replace("<!--price-->",number_format($this->Price,2),$html);
		$html = str_replace("<!--vat_amount-->",number_format(((!empty($CONFIG["gl_ccsv"])) ? ($this->GetVAT()) : 0),2),$html);
		$html = str_replace("<!--price_unformatted-->",$this->Price,$html);
		$html = str_replace("<!--description-->",$loc->Description,$html);
		$html = str_replace("<!--terms-->",base64_encode($loc->Terms),$html);
		$html = str_replace("<!--currency-->",$this->CurrencyISOThreeLetter,$html);
		$html = str_replace("<!--id-->",$this->Id,$html);
		return $html;
	}
	
	function GetXML()
	{
		$xml = "<cctt id=\"".base64_encode($this->Id)."\" citl=\"".base64_encode($this->CurrencyISOThreeLetter)."\" p=\"".base64_encode($this->Price)."\" mnoc=\"".base64_encode($this->ChatSessionsMax)."\" mtl=\"".base64_encode($this->ChatTimeMax)."\" tae=\"".base64_encode($this->VoucherAutoExpire)."\" svbo=\"".base64_encode(($this->VoucherSessionVoidByOperator) ? "1" : "0")."\" tvbo=\"".base64_encode(($this->VoucherTimeVoidByOperator) ? "1" : "0")."\" evbo=\"".base64_encode(($this->VoucherExpireVoidByOperator) ? "1" : "0")."\">\r\n";
		foreach($this->Localizations as $loki)
			$xml .= $loki->GetXML();
		return $xml . "</cctt>\r\n";
	}

	function Save()
	{
		$result = queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` (`id`, `number_of_chats`,`number_of_chats_void`, `total_length`, `total_length_void`, `auto_expire`,`auto_expire_void`, `delete`, `price`, `currency`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->ChatSessionsMax)."','".DBManager::RealEscape(($this->VoucherSessionVoidByOperator) ? 1 : 0)."','".DBManager::RealEscape($this->ChatTimeMax)."','".DBManager::RealEscape(($this->VoucherTimeVoidByOperator) ? 1 : 0)."','".DBManager::RealEscape($this->VoucherAutoExpire)."','".DBManager::RealEscape(($this->VoucherExpireVoidByOperator) ? 1 : 0)."','0','".DBManager::RealEscape($this->Price)."','".DBManager::RealEscape($this->CurrencyISOThreeLetter)."');");
		if(DBManager::GetAffectedRowCount() <= 0)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` SET `number_of_chats`='".DBManager::RealEscape($this->ChatSessionsMax)."',`total_length`='".DBManager::RealEscape($this->ChatTimeMax)."', `auto_expire`='".DBManager::RealEscape($this->VoucherAutoExpire)."', `currency`='".DBManager::RealEscape($this->CurrencyISOThreeLetter)."',`price`='".DBManager::RealEscape($this->Price)."', `auto_expire_void`='".DBManager::RealEscape(($this->VoucherExpireVoidByOperator) ? 1 : 0)."', `total_length_void`='".DBManager::RealEscape(($this->VoucherTimeVoidByOperator) ? 1 : 0)."', `number_of_chats_void`='".DBManager::RealEscape(($this->VoucherSessionVoidByOperator) ? 1 : 0)."', `delete`='0' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}

    function GetVAT()
    {
        global $CONFIG;
        $np = round($this->Price / (($CONFIG["gl_ccva"]/100)+1),2);
        return $this->Price - $np;
    }
}

class CommercialChatVoucher extends CommercialChatBillingType
{
	public $Voided;
	public $ChatTime;
	public $ChatDays;
	public $ChatSessions;
	public $ChatTimeRemaining;
	public $ChatDaysRemaining;
	public $ChatSessionsMax;
	public $ChatIdList;
	public $TypeId;
	public $Created;
	public $Edited;
	public $Email;
	public $LastUsed;
	public $FirstUsed;
	public $VisitorId;
	public $BusinessType;
	public $Company;
	public $TaxID;
	public $Paid;
	public $Firstname;
	public $Lastname;
	public $TransactionId;
	public $Address1;
	public $Address2;
	public $ZIP;
	public $State;
	public $Country;
	public $Phone;
	public $City;
	public $PayerId;
	public $PaymentDetails;
	public $Language;
	public $Extends;
	
	function CommercialChatVoucher()
   	{
		if(func_num_args() == 1)
		{
			$this->SetDetails(func_get_arg(0));
		}
		else if(func_num_args() == 2)
		{
			$this->TypeId = func_get_arg(0);
			$this->Id = func_get_arg(1);
		}
	}
	
	function SetDetails($row)
	{
		$this->Id = $row["voucherid"];
		$this->Created = $row["created"];
		$this->LastUsed = $row["last_used"];
		$this->FirstUsed = $row["first_used"];
		$this->TypeId = $row["id"];
		$this->Email = $row["email"];
		$this->Language = $row["language"];
		$this->Voided = !empty($row["voided"]);
		$this->Edited = $row["edited"];
		$this->Extends = $row["extends"];
		if(!empty($row["chat_time_max"]))
		{
			$this->ChatTimeRemaining = $row["chat_time_max"]-$row["chat_time"];
			$this->ChatTimeMax = $row["chat_time_max"];
		}
		else
		{
			$this->ChatTimeMax = -1;
			$this->ChatTimeRemaining = -1;
		}
		
		if(!empty($row["chat_sessions_max"]))
		{
			$this->ChatSessionsMax = $row["chat_sessions_max"];
		}
		else
		{
			$this->ChatSessionsMax = -1;
		}
			
		if(!empty($row["expires"]))
		{
			$this->ChatDaysRemaining = floor(($row["expires"]-time())/86400);
			$this->VoucherAutoExpire = $row["expires"];
		}
		else
		{
			$this->ChatDaysRemaining =
			$this->VoucherAutoExpire = -1;
		}
		$this->ChatDays = floor((time()-$row["created"])/86400);
		$this->ChatTime = $row["chat_time"];
		$this->ChatSessions = $row["chat_sessions"];
		
		$this->Voided = !empty($row["voided"]);
		$this->Paid = !empty($row["paid"]);
		$this->ChatIdList = @unserialize($row["chat_list"]);
		
        $this->VoucherTimeVoidByOperator = !empty($row["total_length_void"]);
		$this->VoucherSessionVoidByOperator = !empty($row["number_of_chats_void"]);
		$this->VoucherExpireVoidByOperator = !empty($row["auto_expire_void"]);
		$this->VisitorId = $row["visitor_id"];
		$this->BusinessType = $row["business_type"];
		$this->Company = $row["company"];
		$this->TaxID = $row["tax_id"];
		$this->Firstname = $row["firstname"];
		$this->Lastname = $row["lastname"];
		$this->Address1 = $row["address_1"];
		$this->Address2 = $row["address_2"];
		$this->TransactionId = $row["tn_id"];
		$this->ZIP = $row["zip"];
		$this->Price = $row["price"];
		$this->VAT = $row["vat"];
		$this->State = $row["state"];
		$this->Country = $row["country"];
		$this->Phone = $row["phone"];
		$this->City = $row["city"];
		$this->PayerId = $row["payer_id"];
		$this->PaymentDetails = $row["payment_details"];
		$this->CurrencyISOThreeLetter = $row["currency"];
	}
	
	function Load()
	{
		if($result = queryDB(true,"SELECT *,`t1`.`id` AS `voucherid` FROM `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` AS `t1` INNER JOIN `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_TYPES."` AS `t2` ON `t1`.`tid`=`t2`.`id` WHERE `t1`.`id`='".DBManager::RealEscape($this->Id)."';"))
			while($row = DBManager::FetchArray($result))
			{
				$this->SetDetails($row);
				return true;
			}
		return false;
	}

	function Save()
	{
		$result = queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` (`id`, `extends`, `tid`, `email`, `info`, `created`, `expires`, `edited`, `chat_sessions_max`, `chat_time_max`,
		`chat_list`, `visitor_id`, `company`, `tax_id`, `firstname`, `lastname`, `address_1`, `address_2`, `zip`, `state`, `phone`, `city`, `country`, `tn_id`, `price`, `currency`, `vat`, `payment_details`, `language`) 
		VALUES (
		'".DBManager::RealEscape($this->Id)."',
		'".DBManager::RealEscape($this->Extends)."',
		'".DBManager::RealEscape($this->TypeId)."',
		'".DBManager::RealEscape($this->Email)."',
		'".DBManager::RealEscape("")."',
		'".DBManager::RealEscape(time())."',
		'".DBManager::RealEscape(0)."',
		'".DBManager::RealEscape(time())."',
		'".DBManager::RealEscape($this->ChatSessionsMax)."',
		'".DBManager::RealEscape($this->ChatTimeMax)."',
		'".DBManager::RealEscape(@serialize($this->ChatIdList))."',
		'".DBManager::RealEscape($this->VisitorId)."',
		'".DBManager::RealEscape($this->Company)."',
		'".DBManager::RealEscape($this->TaxID)."',
		'".DBManager::RealEscape($this->Firstname)."',
		'".DBManager::RealEscape($this->Lastname)."',
		'".DBManager::RealEscape($this->Address1)."',
		'".DBManager::RealEscape($this->Address2)."',
		'".DBManager::RealEscape($this->ZIP)."',
		'".DBManager::RealEscape($this->State)."',
		'".DBManager::RealEscape($this->Phone)."',
		'".DBManager::RealEscape($this->City)."',
		'".DBManager::RealEscape($this->Country)."',
		'".DBManager::RealEscape($this->TransactionId)."',
		'".DBManager::RealEscape($this->Price)."',
		'".DBManager::RealEscape(strtoupper($this->CurrencyISOThreeLetter))."',
		'".DBManager::RealEscape($this->VAT)."',
		'".DBManager::RealEscape($this->PaymentDetails)."',
		'".DBManager::RealEscape(strtolower($this->Language))."');");
        return (DBManager::GetAffectedRowCount() == 1);
	}
	
	function GetXml($_reduced=false)
	{
		if($_reduced)
			return "<val id=\"".base64_encode($this->Id)."\" />";
		else
		return "<val 
		id=\"".base64_encode($this->Id)."\" 
		ex=\"".base64_encode($this->Extends)."\" 
		pd=\"".base64_encode(($this->Paid) ? 1 : 0)."\" 
		vid=\"".base64_encode($this->VisitorId)."\" 
		bt=\"".base64_encode($this->BusinessType)."\" 
		cp=\"".base64_encode($this->Company)."\" 
		txid=\"".base64_encode($this->TaxID)."\" 
		fn=\"".base64_encode($this->Firstname)."\" 
		ln=\"".base64_encode($this->Lastname)."\" 
		a1=\"".base64_encode($this->Address1)."\" 
		a2=\"".base64_encode($this->Address2)."\" 
		zip=\"".base64_encode($this->ZIP)."\" 
		st=\"".base64_encode($this->State)."\" 
		ph=\"".base64_encode($this->Phone)."\" 
		cty=\"".base64_encode($this->City)."\" 
		ctry=\"".base64_encode($this->Country)."\" 
		cr=\"".base64_encode($this->Created)."\" 
		fu=\"".base64_encode($this->FirstUsed)."\" 
		lu=\"".base64_encode($this->LastUsed)."\" 
		ed=\"".base64_encode($this->Edited)."\" 
		em=\"".base64_encode($this->Email)."\" 
		tae=\"".base64_encode($this->VoucherAutoExpire)."\" 
		mtcl=\"".base64_encode($this->ChatTimeMax)."\" 
		tv=\"".base64_encode(($this->Voided) ? 1 : 0)."\" 
		tid=\"".base64_encode($this->TypeId)."\" 
		cd=\"".base64_encode($this->ChatDays)."\" 
		ct=\"".base64_encode($this->ChatTime)."\" 
		cs=\"".base64_encode($this->ChatSessions)."\" 
		cdr=\"".base64_encode($this->ChatDaysRemaining)."\" 
		ctr=\"".base64_encode($this->ChatTimeRemaining)."\" 
		txnid=\"".base64_encode($this->TransactionId)."\" 
		pr=\"".base64_encode($this->Price)."\" 
		pyi=\"".base64_encode($this->PayerId)."\" 
		vat=\"".base64_encode($this->VAT)."\" 
		cur=\"".base64_encode($this->CurrencyISOThreeLetter)."\" 
		csr=\"".base64_encode($this->ChatSessionsMax)."\">".base64_encode($this->PaymentDetails)."</val>\r\n";
	}
	
	function UpdateVoucherChatTime($_timeToAdd,$_firstUse=false)
	{
		if(is_numeric($_timeToAdd))
		{
			$this->ChatTimeRemaining -= $_timeToAdd;
			$this->ChatTime += $_timeToAdd;
			if(!empty($_timeToAdd))
				queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `chat_time`=`chat_time`+".$_timeToAdd." WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
			
			if(empty($_timeToAdd) || ($this->Edited < (time()-180)))
			{
				queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `edited`=UNIX_TIMESTAMP() WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
			}
			if($_firstUse)
				queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `first_used`=UNIX_TIMESTAMP() WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		}
	}
	
	function UpdateVoucherChatSessions($_chatId)
	{
		if(is_array($this->ChatIdList) && !empty($this->ChatIdList[$_chatId]))
			return;
			
		$this->ChatIdList[$_chatId] = true;
		if(!empty($this->ChatSessionsMax))
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `edited`=UNIX_TIMESTAMP(),`last_used`=UNIX_TIMESTAMP(),`chat_sessions`=`chat_sessions`+1,`chat_list`='".DBManager::RealEscape(@serialize($this->ChatIdList))."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
	
	function CheckForVoid()
	{
		global $CONFIG;
        initData(array("DBCONFIG"));
		if(!$this->Voided)
		{
			if(($this->ChatSessionsMax-$this->ChatSessions) <= 0 && $this->ChatSessionsMax > -1 && !$this->VoucherSessionVoidByOperator)
				$this->Void();
			else if($this->ChatTime >= $this->ChatTimeMax && $this->ChatTimeMax > 0 && !$this->VoucherTimeVoidByOperator)
				$this->Void();
			else if($this->VoucherAutoExpire <= time() && $this->VoucherAutoExpire > 0 && !$this->VoucherExpireVoidByOperator)
				$this->Void();
		}
		if($this->VoucherAutoExpire <= 0 && !empty($CONFIG["db"]["cct"][$this->TypeId]->VoucherAutoExpire))
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `expires`=".($this->VoucherAutoExpire=(time()+(86400*$CONFIG["db"]["cct"][$this->TypeId]->VoucherAutoExpire)))." WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		return $this->Voided;
	}
	
	function Void()
	{
		CommercialChatVoucher::SetVoucherParams(true,$this->Paid);
		$this->Voided = true;
	}
	
	function GetVoucherChatURL($_purchasedForGroup="")
	{
		global $CONFIG;
		if(!empty($_purchasedForGroup))
			$_purchasedForGroup = "&intgroup=" . base64UrlEncode($_purchasedForGroup);
		$ws = (empty($CONFIG["gl_root"])) ? "&ws=" . base64UrlEncode($CONFIG["gl_host"]) : "";
		return LIVEZILLA_URL . FILE_CHAT . "?vc=" .  base64UrlEncode($this->Id) . $_purchasedForGroup . $ws;
	}
	
	function SendPaidEmail($_purchasedForGroup="")
	{
		global $CONFIG,$LZLANG;
        initData(array("DBCONFIG"));
		$loc = $CONFIG["db"]["cct"][$this->TypeId]->GetLocalization($this->Language);
		if($loc != null && !empty($loc->EmailVoucherPaid))
		{
			$email = $loc->EmailVoucherPaid;
			$email = str_replace("%buyer_first_name%",$this->Firstname,$email);
			$email = str_replace("%buyer_last_name%",$this->Lastname,$email);
			$email = str_replace("%voucher_code%",$this->Id,$email);
			$email = str_replace("%website_name%",$CONFIG["gl_site_name"],$email);
			$email = str_replace("%chat_url%",$this->GetVoucherChatURL($_purchasedForGroup),$email);
			languageSelect($loc->LanguageISOTwoLetter);
            $defmailbox=Mailbox::GetDefaultOutgoing();
            if($defmailbox != null)
			    sendMail($defmailbox,$this->Email,$defmailbox->Email,$email,"",$LZLANG["client_voucher_email_subject_paid"]);
		}
	}
	
	function SendCreatedEmail()
	{
		global $CONFIG,$LZLANG;
        initData(array("DBCONFIG"));
		$loc = $CONFIG["db"]["cct"][$this->TypeId]->GetLocalization($this->Language);
		if($loc != null && !empty($loc->EmailVoucherCreated))
		{
			$email = $loc->EmailVoucherCreated;
			$email = str_replace("%buyer_first_name%",$this->Firstname,$email);
			$email = str_replace("%buyer_last_name%",$this->Lastname,$email);
			$email = str_replace("%voucher_code%",$this->Id,$email);
			$email = str_replace("%website_name%",$CONFIG["gl_site_name"],$email);
			$email = str_replace("%chat_url%",$this->GetVoucherChatURL(""),$email);
            $defmailbox=Mailbox::GetDefaultOutgoing();
            if($defmailbox != null)
			    sendMail($defmailbox,$this->Email,$defmailbox->Email,$email,"",$LZLANG["client_voucher_email_subject_created"]);
		}
	}
	
	function SendStatusEmail()
	{
		global $CONFIG,$LZLANG;
        initData(array("DBCONFIG"));
		if(!empty($CONFIG["db"]["cct"][$this->TypeId]))
		{
			$loc = $CONFIG["db"]["cct"][$this->TypeId]->GetLocalization($this->Language);
			if($loc != null && !empty($loc->EmailVoucherUpdate))
			{
				$email = $loc->EmailVoucherUpdate;
				$email = str_replace("%buyer_first_name%",$this->Firstname,$email);
				$email = str_replace("%buyer_last_name%",$this->Lastname,$email);
				$email = str_replace("%voucher_code%",$this->Id,$email);
				$email = str_replace("%voucher_remaining_time%",(($this->ChatTimeRemaining == -1) ? "-" : (($this->ChatTimeRemaining >=0) ? formatTimeSpan($this->ChatTimeRemaining) : formatTimeSpan(0))),$email);
				$email = str_replace("%voucher_remaining_sessions%",(($this->ChatSessionsMax == -1) ? "-" : (($this->ChatSessionsMax-$this->ChatSessions >=0) ? $this->ChatSessionsMax-$this->ChatSessions : 0)),$email);
				$email = str_replace("%voucher_expiration_date%",(($this->VoucherAutoExpire == -1) ? "-" : date("r",$this->VoucherAutoExpire)),$email);
				$email = str_replace("%website_name%",$CONFIG["gl_site_name"],$email);
                $defmailbox=Mailbox::GetDefaultOutgoing();
                if($defmailbox != null)
				    sendMail($defmailbox,$this->Email,$defmailbox->Email,$email,"",$LZLANG["client_voucher_email_subject_status_update"]);
			}
		}
	}
	
	function SetVoucherParams($_void=true, $_paid=false, $_addHour=false, $_addSession=false, $_addDay=false, $_email=false, $_purchasedForGroup="")
	{
		global $CONFIG;
        initData(array("DBCONFIG"));
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `voided`=".(($_void) ? 1 : 0).",`paid`=".(($_paid) ? 1 : 0).",`edited`=UNIX_TIMESTAMP() WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		if($_addHour)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `chat_time_max`=`chat_time_max`+3600,`edited`=UNIX_TIMESTAMP() WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		if($_addSession)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `chat_sessions_max`=`chat_sessions_max`+1,`edited`=UNIX_TIMESTAMP() WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		if($_addDay)
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `expires`=`expires`+86400,`edited`=UNIX_TIMESTAMP() WHERE `expires`>0 AND `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	
		if($_email)
			$this->SendPaidEmail($_purchasedForGroup);
		
		if($_paid && !$this->Paid && !empty($this->Extends))
		{
			$ex = ($this->VoucherAutoExpire <= 0 && !empty($CONFIG["db"]["cct"][$this->TypeId]->VoucherAutoExpire)) ? ",`expires`=".($this->VoucherAutoExpire=(time()+(86400*$CONFIG["db"]["cct"][$this->TypeId]->VoucherAutoExpire))) : "";
			queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `first_used`=UNIX_TIMESTAMP()".$ex." WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
		}
	}
	
	function SetPaymentDetails($_transactionId,$_payerId,$_details)
	{
		$_details = $this->PaymentDetails . date("r") . ":\r\n..............................................................................................................................................\r\n" . $_details . "\r\n\r\n";
		queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_COMMERCIAL_CHAT_VOUCHERS."` SET `edited`=UNIX_TIMESTAMP(),`tn_id`='".DBManager::RealEscape($_transactionId)."',`payer_id`='".DBManager::RealEscape($_payerId)."',`payment_details`='".DBManager::RealEscape($_details)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
	}
}

class CacheManager
{
    public $BaseId = null;
    public $BaseMemId = null;
    public $Data = array();
    public $Encryption = false;
    public $Compression = true;
    public $TTL = 4;
    public $PerformWrite = false;
    public $Fields;
    public $Provider;
    public static $Engine;

    function CacheManager($_baseId,$_TTL,$_fields,$_configEncryption=true)
    {
        $this->Fields = $_fields;
        $this->TTL = $_TTL;
        $this->BaseId = $_baseId;
        $this->BaseMemId = substr(base_convert($_baseId,16,10),0,4);
        if(function_exists("mcrypt_encrypt") && defined("MCRYPT_RIJNDAEL_256") && defined("MCRYPT_MODE_ECB"))
            $this->Encryption = $_configEncryption;

        if(CacheManager::$Engine=="MEMCACHED")
        {
            $this->Provider = new Memcached();
            $this->Provider->addServer('127.0.0.1', 11211);
        }
        else if(CacheManager::$Engine=="MEMCACHE")
        {
            $this->Provider = new Memcache();
            $this->Provider->connect('127.0.0.1', 11211);
        }
        else if(CacheManager::$Engine=="MYSQL")
        {
            $this->Encryption = false;
        }
    }

    function UnsetData($_key)
    {
        unset($this->Data[$_key]);
        if(CacheManager::$Engine=="PSHM")
        {
            $shmid = @shmop_open($this->BaseMemId . $_key, "w", 0666, 0);
            if($shmid)
            {
                @shmop_delete($shmid);
                @shmop_close($shmid);
            }
        }
        else if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
        {
            $this->Provider->flush();
        }
        else if(CacheManager::$Engine=="APC")
        {
            apc_delete($this->BaseMemId . $_key);
        }
        else if(CacheManager::$Engine=="MYSQL")
        {
            queryDB(true,"DELETE FROM `".DB_PREFIX.DATABASE_DATA_CACHE."` WHERE `key`='".DBManager::RealEscape($_key)."';");
        }
    }

    function SetData($_key,$_value,$_allowEmpty=false)
    {
        if($_value!=null || $_allowEmpty)
        {
            $this->Data[$_key] = array();
            $this->Data[$_key][0] = time();
            $this->Data[$_key][1] = $_value;
            $this->Data[$_key][2] = true;
            $this->Data[$_key][3] = getIdent();
        }
    }

    function GetData($_key,&$_storage,$_mustBeNull=true)
    {
        if((empty($_storage)||!$_mustBeNull) && isset($this->Data[$_key]) && is_array($this->Data[$_key]) && count($this->Data[$_key])==4)
        {
            $_storage = $this->Data[$_key][1];
            return true;
        }
        return false;
    }

    function Close()
    {
        $this->Write();
    }

    function Write()
    {
        if(is("IS_FILTERED"))
            return;

        foreach($this->Data as $key => $value)
        {
            if($value[2])
            {
                $data = @serialize($value);
                if($this->Encryption)
                {
                    $data = mcrypt_encrypt(MCRYPT_RIJNDAEL_256, $this->BaseId, $data, MCRYPT_MODE_ECB, mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_ECB), MCRYPT_RAND));
                    $data = base64_encode($data);
                    $data = strlen($data)."_".$data;
                }

                if($this->Compression && function_exists("gzcompress"))
                    $data = base64_encode(gzcompress($data,5));

                if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
                {
                    $this->Provider->delete($this->BaseMemId . $key);
                    $this->Provider->set($this->BaseMemId . $key, $data);
                }
                else if(CacheManager::$Engine=="PSHM")
                {
                    if(function_exists("mb_strlen"))
                        $flength = mb_strlen($data, 'UTF-8');
                    else
                        $flength = strlen($data);
                    $shmid = @shmop_open($this->BaseMemId . $key, "w", 0666, 0);
                    if($shmid)
                    {
                        @shmop_delete($shmid);
                        @shmop_close($shmid);
                    }
                    $Shmid = @shmop_open($this->BaseMemId . $key, "c", 0666, $flength);
                    @shmop_write($Shmid, $data, 0);
                    @shmop_close($Shmid);
                }
                else if(CacheManager::$Engine=="APC")
                {
                    apc_delete($this->BaseMemId . $key);
                    apc_store($this->BaseMemId . $key, $data);
                }
                else if(CacheManager::$Engine=="MYSQL")
                {
                    queryDB(true,"REPLACE INTO `".DB_PREFIX.DATABASE_DATA_CACHE."` (`key`, `data`, `time`) VALUES ('".DBManager::RealEscape($key)."','".DBManager::RealEscape($data)."',".time().");");
                }
            }
        }
    }

    function Read()
    {
        $loadedKeys = array();
        foreach($this->Fields as $key => $name)
        {
            $data="";
            if(CacheManager::$Engine=="PSHM")
            {
                $Shmid = @shmop_open($this->BaseMemId . $key, "a", 0666, 0);
                if($Shmid)
                {
                    $shm_size = @shmop_size($Shmid);
                    $data = @shmop_read($Shmid, 0, $shm_size);
                }
                @shmop_close($Shmid);
            }
            else if(CacheManager::$Engine=="APC")
            {
                $data = apc_fetch($this->BaseMemId . $key);
            }
            else if(CacheManager::$Engine=="MEMCACHED" || CacheManager::$Engine=="MEMCACHE")
            {
                $data = $this->Provider->get($this->BaseMemId . $key);
            }
            else if(CacheManager::$Engine=="MYSQL")
            {
                if(empty($loadedKeys) && $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_DATA_CACHE."`;"))
                    while($row = DBManager::FetchArray($result))
                        $loadedKeys[$row["key"]] = $row["data"];
                if(isset($loadedKeys[$key]))
                    $data = $loadedKeys[$key];
            }
            if(!empty($data))
            {
                if($this->Compression && function_exists("gzuncompress"))
                    $data = @gzuncompress(base64_decode($data));

                if($this->Encryption)
                {
                    $upos = strpos($data,"_");
                    if($upos !== false)
                    {
                        $data = base64_decode(substr($data,$upos+1,strlen($data)-($upos+1)));
                        $data = mcrypt_decrypt(MCRYPT_RIJNDAEL_256, $this->BaseId, $data, MCRYPT_MODE_ECB, mcrypt_create_iv(mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_ECB), MCRYPT_RAND));
                    }
                    else
                        continue;
                }

                $arra = @unserialize($data);
                if(!empty($arra) && is_array($arra))
                {
                    if(!(!empty($arra[3]) && getIdent()!="" && $arra[3]==getIdent()) || !empty($this->Fields[$key][3]))
                    {
                        if(($arra[0] > (time()-$this->TTL)) || (isset($this->Fields[$key][2]) && ($arra[0] > (time()-$this->Fields[$key][2]))))
                        {
                            $this->Data[$key] = $arra;
                            $this->Data[$key][2] = false;
                        }
                    }
                }
            }
        }
    }

    static function CachingAvailable($_config)
    {
        if(!empty($_config))
        {
            $avail = array("APC"=>false,"PSHM"=>false,"MEMCACHED"=>false,"MEMCACHE"=>false);
            if(function_exists("apc_store") && !(is("PHP_SAPI") && strpos(strtoupper(PHP_SAPI),"CGI")!==false && strpos(strtoupper(PHP_SAPI),"FAST")===false))
                $avail["APC"]=true;
            if(function_exists("shmop_open") && !(is("PHP_OS") && strtoupper(substr(PHP_OS, 0, 3)) === "WIN"))
                $avail["PSHM"]=true;
            if(class_exists("Memcached"))
                $avail["MEMCACHED"]=true;
            if(class_exists("Memcache"))
                $avail["MEMCACHE"]=true;

            if($_config==2 && $avail["PSHM"])
                return CacheManager::$Engine = "PSHM";
            else if($_config==1)
                return CacheManager::$Engine = "MYSQL";
            else if($_config==3 && $avail["MEMCACHED"])
                return CacheManager::$Engine = "MEMCACHED";
            else if($_config==4 && $avail["MEMCACHE"])
                return CacheManager::$Engine = "MEMCACHE";
            else if($_config==5 && $avail["APC"])
                return CacheManager::$Engine = "APC";
        }
        return false;
    }

    static function Flush()
    {
        if(CacheManager::$Engine=="APC" && function_exists("apc_clear_cache"))
        {
            @apc_clear_cache();
            @apc_clear_cache('user');
            @apc_clear_cache('opcode');
        }
    }

    static function SetDataUpdateTime($_areaIndex,$_reload=false)
    {
        global $DUTU;
        $mt=round(microtime(true) * 1000);
        if(!(isset($DUTU[$_areaIndex]) && $DUTU[$_areaIndex]==$mt))
        {
            $DUTU[$_areaIndex]=$mt;
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_DATA_UPDATES."`;");
            if(DBManager::GetRowCount($result) == 0 && !$_reload)
            {
                queryDB(true,"TRUNCATE `".DB_PREFIX.DATABASE_DATA_UPDATES."`;");
                queryDB(true,"INSERT INTO `".DB_PREFIX.DATABASE_DATA_UPDATES."` (`update_tickets`, `update_archive`, `update_ratings`, `update_emails`, `update_events`, `update_vouchers`, `update_filters`, `update_reports`) VALUES ('0', '0', '0', '0', '0', '0', '0', '0');");
                CacheManager::SetDataUpdateTime($_areaIndex,true);
            }
            else
                queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_DATA_UPDATES."` SET `".$_areaIndex."`=".$mt.";");
        }
    }

    static function GetDataUpdateTimes()
    {
        global $DUT,$CM;
        if(!empty($CM) && $CM->GetData(118,$DUT))
            return;

        $DUT = array(DATA_UPDATE_KEY_TICKETS=>0,DATA_UPDATE_KEY_EMAILS=>0,DATA_UPDATE_KEY_EVENTS=>0,DATA_UPDATE_KEY_CHATS=>0,DATA_UPDATE_KEY_REPORTS=>0);
        if(DB_CONNECTION)
        {
            $result = queryDB(true,"SELECT * FROM `".DB_PREFIX.DATABASE_DATA_UPDATES."`;");
            if($result && $row = DBManager::FetchArray($result))
                $DUT = array(DATA_UPDATE_KEY_TICKETS=>$row[DATA_UPDATE_KEY_TICKETS],DATA_UPDATE_KEY_EMAILS=>$row[DATA_UPDATE_KEY_EMAILS],DATA_UPDATE_KEY_EVENTS=>$row[DATA_UPDATE_KEY_EVENTS],DATA_UPDATE_KEY_CHATS=>$row[DATA_UPDATE_KEY_CHATS],DATA_UPDATE_KEY_REPORTS=>$row[DATA_UPDATE_KEY_REPORTS]);
        }
        if(!empty($CM))
            $CM->SetData(118,$DUT);
    }
}

class DBManager
{
    public static $Extension = "mysql";
    public static $Connected = false;
    public static $Prefix;
    public static $Provider;
    
    public $Username;
    public $Password;
    public $Database;
    public $Host;

    function DBManager($_username,$_password,$_host,$_database,$_prefix="")
    {
        $this->Username = $_username;
        $this->Password = $_password;
        $this->Host = $_host;
        $this->Database = $_database;
        DBManager::$Prefix = $_prefix;
    }

    function InitConnection()
    {
        if(DBManager::$Extension=="mysql")
            DBManager::$Provider = @mysql_connect($this->Host, $this->Username, $this->Password);
        else if(DBManager::$Extension=="mysqli")
            DBManager::$Provider = @mysqli_connect($this->Host, $this->Username, $this->Password);

        if(DBManager::$Provider)
        {
            $this->SetEncoding();
            if(!empty($this->Database))
            {
                if($this->SelectDatabase(DBManager::RealEscape($this->Database)))
                    DBManager::$Connected = true;
            }
        }
        return DBManager::$Connected;
    }

    function SetEncoding()
    {
        $this->Query(false,"SET character_set_results = 'utf8', character_set_client = 'utf8', character_set_connection = 'utf8', character_set_database = 'utf8', character_set_server = 'utf8'");
        //$this->Query(false,"SET NAMES 'utf8'");
    }

    function Query($_log,$_sql,&$_errorCode=-1)
    {
        if(DBManager::$Extension=="mysql")
            $result = @mysql_query($_sql, DBManager::$Provider);
        else if(DBManager::$Extension=="mysqli")
            $result = @mysqli_query(DBManager::$Provider , $_sql);

        $ignore = array("1146","1045","2003","1213","");
        if(!$result && !in_array(DBManager::GetErrorCode(),$ignore))
        {
            $_errorCode = DBManager::GetErrorCode();
            if($_log)logit(time() . " - " . $_errorCode . ": " . DBManager::GetError() . "\r\n\r\nSQL: " . $_sql . "\r\n",FILE_SQL_ERROR_LOG);
        }
        return $result;
    }

    function SelectDatabase($_dbName)
    {
        if(DBManager::$Extension=="mysql")
            return @mysql_select_db($_dbName, DBManager::$Provider);
        else if(DBManager::$Extension=="mysqli")
            return @mysqli_select_db(DBManager::$Provider, $_dbName);
    }

    static function Close()
    {
        if(DBManager::$Extension=="mysql" && DBManager::$Provider)
            @mysql_close(DBManager::$Provider);
        else if(DBManager::$Extension=="mysqli" && DBManager::$Provider)
            @mysqli_close(DBManager::$Provider);
    }

    static function RealEscape($_toEscape)
    {
        if(DBManager::$Extension=="mysql" && DBManager::$Provider)
            return @mysql_real_escape_string($_toEscape);
        else if(DBManager::$Extension=="mysqli" && DBManager::$Provider)
            return @mysqli_real_escape_string(DBManager::$Provider,$_toEscape);
        return $_toEscape;
    }

    static function FetchArray($_result)
    {
        if(DBManager::$Extension=="mysql")
            return @mysql_fetch_array($_result, MYSQL_BOTH);
        else if(DBManager::$Extension=="mysqli")
            return @mysqli_fetch_array($_result, MYSQLI_BOTH);
    }

    static function GetRowCount($_result)
    {
        if(DBManager::$Extension=="mysql")
            return @mysql_num_rows($_result);
        else if(DBManager::$Extension=="mysqli")
            return @mysqli_num_rows($_result);
        return 0;
    }

    static function GetAffectedRowCount()
    {
        if(DBManager::$Extension=="mysql")
            return mysql_affected_rows();
        else if(DBManager::$Extension=="mysqli")
            return mysqli_affected_rows(DBManager::$Provider);
        return 0;
    }

    static function GetErrorCode()
    {
        if(DBManager::$Extension=="mysql")
            return mysql_errno();
        else if(DBManager::$Extension=="mysqli" && DBManager::$Provider)
            return mysqli_errno(DBManager::$Provider);
        return "";
    }

    static function GetError()
    {
        if(DBManager::$Extension=="mysql")
            return mysql_error();
        else if(DBManager::$Extension=="mysqli" && DBManager::$Provider)
            return mysqli_error(DBManager::$Provider);
        return "";
    }
}

class SocialMediaChannel
{
    public $GroupId;
    public $Deleted;
    public $LastConnect = 0;
    public $DataSince = "";
    public $ConnectFrequency = 0;
    public $Id;
    public $Type;
    public $PageId;
    public $TokenId;
    public $TokenExpires;
    public $Name;
    public $StreamType;
    public $Track;

    function SocialMediaChannel($_groupId)
    {
        $this->GroupId = $_groupId;
    }

    function SetValues($_row)
    {
        $this->LastConnect = $_row["last_connect"];
        $this->DataSince = $_row["data_since"];
        $this->ConnectFrequency = $_row["connect_frequency"];
        $this->GroupId = $_row["group_id"];
        $this->Id = $_row["id"];
        $this->PageId = $_row["page_id"];
        $this->TokenId = $_row["token"];
        $this->Name = $_row["name"];
        $this->StreamType = $_row["stream_type"];
        $this->Track = $_row["track"];
    }

    function Connect($_data, $_action)
    {
        if(function_exists("gzuncompress"))
            $_data["p_zip"] = "1";

        $opts = array('http' => array('method'  => 'POST','header'  => 'Content-type: application/x-www-form-urlencoded','content' => http_build_query($_data)));
        $context  = stream_context_create($opts);
        $result = file_get_contents(CONFIG_LIVEZILLA_SOCIAL . strtolower(SocialMediaChannel::GetChannelTypeName($this->Type)) . "/?a=" . $_action, false, $context);

        if(!empty($result) && !empty($_data["p_zip"]))
            $result = gzuncompress(base64_decode($result));

        if(!empty($result) && is_string(json_decode($result)) && strpos(json_decode($result),"ERR")===0)
            handleError("123", "Error connecting social channel: " . $this->Name . " (" . json_Decode($result) . ")","",0);
        else
            return $result;

        return "";
    }

    function Download($_data)
    {
        return $this->Connect($_data,"cd");
    }

    function Reply($_data)
    {
        return $this->Connect($_data,"sr");
    }

    function SetLastConnect($_time)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_SOCIAL_MEDIA_CHANNELS."` SET `last_connect`=".$_time." WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    function GetXML()
    {
        return "<value i=\"".base64_encode($this->Id)."\" s=\"".base64_encode($this->StreamType)."\" n=\"".base64_encode($this->Name)."\" tr=\"".base64_encode($this->Track)."\" t=\"".base64_encode($this->Type)."\" d=\"".base64_encode($this->DataSince)."\" c=\"".base64_encode($this->ConnectFrequency)."\" p=\"".base64_encode($this->PageId)."\">".base64_encode($this->TokenId)."</value>\r\n";
    }

    function XMLParamAlloc($_param,$_value)
    {
        if($_param == "a")
            $this->PageId = $_value;
        else if($_param == "b")
            $this->TokenId = $_value;
        else if($_param == "c")
            $this->TokenExpires = $_value;
        else if($_param == "d")
            $this->Name = $_value;
        else if($_param == "e")
            $this->ConnectFrequency = $_value;
        else if($_param == "f")
            $this->DataSince = $_value;
        else if($_param == "g")
            $this->Id = $_value;
        else if($_param == "h")
            $this->StreamType = $_value;
        else if($_param == "i")
            $this->Type = $_value;
        else if($_param == "j")
            $this->Track = base64_decode($_value);
    }

    function Save($_prefix)
    {
        queryDB(true,"INSERT INTO `".$_prefix.DATABASE_SOCIAL_MEDIA_CHANNELS."` (`id` ,`name`, `page_id`,`group_id` ,`type` ,`stream_type` ,`token`,`token_expire`,`last_connect`,`data_since`,`connect_frequency`,`track`) VALUES ('".DBManager::RealEscape($this->Id)."','".DBManager::RealEscape($this->Name)."','".DBManager::RealEscape($this->PageId)."', '".DBManager::RealEscape($this->GroupId)."',".intval($this->Type).",".intval($this->StreamType).", '".DBManager::RealEscape($this->TokenId)."', '".DBManager::RealEscape($this->TokenExpires)."', ".intval($this->LastConnect).",'".DBManager::RealEscape($this->DataSince)."',".intval($this->ConnectFrequency).",'".DBManager::RealEscape($this->Track)."');");
    }

    function IsSince()
    {
        return !($this->Type == 6 && $this->StreamType == 1);
    }

    static function DeleteByGroup($_prefix,$_groupId)
    {
        queryDB(true,"DELETE FROM `".$_prefix.DATABASE_SOCIAL_MEDIA_CHANNELS."` WHERE `group_id`='".DBManager::RealEscape($_groupId)."';");
    }

    static function GetChannelById($_id)
    {
        global $CONFIG;
        initData(array("DBCONFIG"));
        foreach($CONFIG["db"]["gl_sm"] as $channel)
            if($channel->Id == $_id)
                return $channel;
        return null;
    }

    static function GetChannelTypeName($_typeId)
    {
        $types = array("6"=>"Facebook","7"=>"Twitter");
        return $types[$_typeId];
    }
}

class FacebookChannel extends SocialMediaChannel
{
    function FacebookChannel($_groupId)
    {
        $this->Type = 6;
        $this->GroupId = $_groupId;
    }

    function Download($_data=null)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_dut"] = $this->DataSince;
        $data["p_st"] = $this->StreamType;
        $result = parent::Download($data);
        $messages = array();
        if(!empty($result) && $result=json_decode($result,true))
        {
            if(is_array($result))
            {
                foreach($result as $hash => $msgdata)
                    $messages[$hash] = @unserialize(base64_decode($msgdata));
            }
        }
        return $messages;
    }

    function SetLastUpdate($_time)
    {
        if($this->StreamType == 1)
            $_time = max($this->DataSince,(time()-(15*86400)));
        if($_time > $this->DataSince)
            queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_SOCIAL_MEDIA_CHANNELS."` SET `data_since`='".DBManager::RealEscape($_time)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    function SendReply($_ticket,$_message,$_text,$_quote)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_text"] = $_text;
        $data["p_ci"] = $_ticket->ChannelConversationId;
        $data["p_st"] = $this->StreamType;
        $data["p_cci"] = $_quote->ChannelId;
        $channelId = json_decode(parent::Reply($data));
        $_message->SetChannelId($channelId);
    }
}

class TwitterChannel extends SocialMediaChannel
{
    function TwitterChannel($_groupId)
    {
        $this->Type = 7;
        $this->GroupId = $_groupId;
    }

    function Download($_data=null)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_dut"] = $this->DataSince;
        $data["p_st"] = $this->StreamType;
        $data["p_tr"] = $this->Track;
        $result = parent::Download($data);
        $messages = array();
        if(!empty($result) && $result=json_decode($result,true))
        {
            if(is_array($result))
            {
                foreach($result as $hash => $msgdata)
                    $messages[$hash] = @unserialize(base64_decode($msgdata));
            }
        }
        return $messages;
    }

    function SendReply($_ticket,$_message,$_text,$_quote)
    {
        $data["p_llt"] = $this->TokenId;
        $data["p_pid"] = $this->PageId;
        $data["p_text"] = $_text;
        $data["p_cci"] = $_quote->ChannelId;
        $data["p_st"] = $this->StreamType;
        $data["p_rid"] = $_quote->Email;
        $channelId = json_decode(parent::Reply($data));
        $_message->SetChannelId($channelId);
    }

    function SetLastUpdate($_sinceId)
    {
        queryDB(true,"UPDATE `".DB_PREFIX.DATABASE_SOCIAL_MEDIA_CHANNELS."` SET `data_since`='".DBManager::RealEscape($_sinceId)."' WHERE `id`='".DBManager::RealEscape($this->Id)."' LIMIT 1;");
    }

    function AddScreenName($_text,$_screenName)
    {
        if(strpos(strtolower($_text),strtolower($_screenName . " ")) !== 0)
            return $_screenName . " " . $_text;
        return $_text;
    }
}
?>