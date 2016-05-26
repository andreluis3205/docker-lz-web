<?php
/****************************************************************************************
* LiveZilla functions.tracking.inc.php
* 
* Copyright 2015 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

class VisitorMonitoring
{
    public static $Visitor;
    public static $Browser;
    public static $Response;
    public static $IsMonitoringActive = true;
    public static $CreateUserObject;
    public static $IsMobile;
    public static $IsTablet;
    public static $HideElement;

    static function Abort($_code)
    {
        exit("lz_tracking_stop_tracking(".$_code.");");
    }

    static function GetPollFrequency($_chat,$_botChat)
    {
        if(empty($_GET["tth"]) && $_botChat && !$_chat)
            return min(Server::$Configuration->File["timeout_chats"]-2,Server::$Configuration->File["poll_frequency_tracking"]);
        if($_chat || !empty($_GET["tth"]))
            return Server::$Configuration->File["poll_frequency_clients"];
        if(empty($_GET["ovlc"]) && empty(Server::$Configuration->File["gl_vmac"]))
            return 86400*365;
        return Server::$Configuration->File["poll_frequency_tracking"];
    }

    static function LoadOverlayChat()
    {
        global $USER,$OVERLAY; //++
        if(!empty($_GET["ovlc"]) && !VisitorMonitoring::$HideElement)
        {
            require_once(LIVEZILLA_PATH . "ovl.php");
            Visitor::$IsActiveOverlayChat = false;
            VisitorMonitoring::$Response .= OverlayChat::$Response;
        }
    }

    static function TriggerEvents($_url,$actionData = "")
    {
        if(count(Server::$Events)==0)
            return $actionData = "";

        $url = $_url;
        $previous = (count(VisitorMonitoring::$Browser->History) > 1) ? VisitorMonitoring::$Browser->History[count(VisitorMonitoring::$Browser->History)-2]->Url->GetAbsoluteUrl() : "";

        foreach(Server::$Events->Events as $event)
        {
            if(!$event->IsActive || empty($url))
                continue;

            $urlor = (count($event->FunnelUrls) == 0 && $event->MatchesURLCriterias($url->Url->GetAbsoluteUrl(),$url->Referrer->GetAbsoluteUrl(),$previous,time()-($url->Entrance)));
            $urlfunnel = (count($event->FunnelUrls) > 0 && $event->MatchesURLFunnelCriterias(VisitorMonitoring::$Browser->History));
            $global = $event->MatchVisitorConditions(count(VisitorMonitoring::$Browser->History),(VisitorMonitoring::$Visitor->ExitTime-VisitorMonitoring::$Visitor->FirstActive),VisitorMonitoring::$Visitor->HasAcceptedChatRequest,VisitorMonitoring::$Visitor->HasDeclinedChatRequest,VisitorMonitoring::$Visitor->WasInChat(),VisitorMonitoring::$Browser->Query,(VisitorMonitoring::$IsMobile||VisitorMonitoring::$IsTablet),VisitorMonitoring::$Visitor->GeoCountryISO2);
            $dataCondition = $event->MatchDataConditions(VisitorMonitoring::$Browser);
            if($global && $dataCondition && ($urlfunnel || $urlor) || (Communication::ReadParameter("fe","")==$event->Id))
            {
                foreach(array($event->Goals,$event->Actions) as $elements)
                    foreach($elements as $action)
                    {
                        $EventTrigger = new EventTrigger(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Id,time(),1);
                        $EventTrigger->Load();
                        $aexists = $action->Exists(CALLER_USER_ID,CALLER_BROWSER_ID);
                        if(!$EventTrigger->Exists || ($EventTrigger->Exists && $event->MatchesTriggerCriterias($EventTrigger,Visitor::$PollCount==1)))
                        {
                            if(!$aexists)
                            {
                                if($event->SaveInCookie)
                                {
                                    if(!Is::Null(Cookie::Get("ea_" . $action->Id)))
                                        continue;
                                    else
                                        Cookie::Set("ea_" . $action->Id,time());
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
                                    if(isset($_GET[GET_EXTERN_GROUP]) && ($senderGroup=$action->Invitation->GetGroupSender()) != "" && Encoding::Base64UrlDecode($_GET[GET_EXTERN_GROUP]) != $senderGroup)
                                        continue;

                                    $sender = VisitorMonitoring::GetActionSender($action->Invitation->GetSenders(),true);
                                    Server::InitDataBlock(array("GROUPS"));
                                    if(!empty($sender) && !empty(Server::$Groups[$sender->GroupId]) && Server::$Groups[$sender->GroupId]->IsHumanAvailable(false) && !(VisitorMonitoring::$Browser->ChatRequest != null && !VisitorMonitoring::$Browser->ChatRequest->Closed) && !VisitorMonitoring::$Visitor->IsInChat(false,null,true))
                                    {
                                        define("EVENT_INVITATION",true);
                                        $chatrequest = new ChatRequest($sender->UserSystemId,$sender->GroupId,CALLER_USER_ID,CALLER_BROWSER_ID,VisitorMonitoring::GetActionText($sender,$action));
                                        $chatrequest->EventActionId = $action->Id;
                                        $chatrequest->Save();
                                        if(!$chatrequest->Displayed)
                                            VisitorMonitoring::$Browser->ForceUpdate();
                                        VisitorMonitoring::$Browser->ChatRequest = $chatrequest;
                                    }
                                }
                                else if($action->Type == 3 && !defined("EVENT_ALERT"))
                                {
                                    define("EVENT_ALERT",true);
                                    $alert = new Alert(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Value);
                                    $alert->EventActionId = $action->Id;
                                    $alert->Save();
                                    VisitorMonitoring::$Browser->LoadAlerts();
                                }
                                else if($action->Type == 4 && !defined("EVENT_WEBSITE_PUSH"))
                                {
                                    define("EVENT_WEBSITE_PUSH",true);
                                    $sender = VisitorMonitoring::GetActionSender($action->WebsitePush->Senders,false);
                                    $websitepush = new WebsitePush($sender->UserSystemId,$sender->GroupId,CALLER_USER_ID,CALLER_BROWSER_ID,VisitorMonitoring::GetActionText($sender,$action),$action->WebsitePush->Ask,$action->WebsitePush->TargetURL);
                                    $websitepush->EventActionId = $action->Id;
                                    $websitepush->Save();
                                    VisitorMonitoring::$Browser->LoadWebsitePush();
                                }
                                else if($action->Type == 5 && !defined("EVENT_OVERLAY_BOX"))
                                {
                                    define("EVENT_OVERLAY_BOX",true);
                                    $overlaybox = new OverlayBox(CALLER_USER_ID,CALLER_BROWSER_ID,$action->Value);
                                    $overlaybox->EventActionId = $action->Id;
                                    $overlaybox->Save();
                                    VisitorMonitoring::$Browser->LoadOverlayBoxes();
                                }
                                else if($action->Type == 6)
                                {
                                    VisitorMonitoring::$Response .= "lz_tracking_add_tag('" . base64_encode($action->Value) . "');";
                                }
                                else if($action->Type == 9 && STATS_ACTIVE)
                                {
                                    Server::$Statistic->ProcessAction(ST_ACTION_GOAL,array(CALLER_USER_ID,$action->Id,((VisitorMonitoring::$Visitor->Visits==1)?1:0),VisitorMonitoring::$Browser->GetQueryId(Cookie::Get("sp"),null,255,true)));
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

    static function GetFloatingButtonSelector($_shadow,$_online,$content="",$height=80,$params="")
    {
        require_once(LIVEZILLA_PATH . "_lib/objects.external.inc.php");

        if(isset($_GET["ifs_oc"]))
        {
            $content = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_chat.tpl");
            $height+=60;
        }

        if(isset($_GET["ifs_opi"]) || isset($_GET["ifs_opo"]))
        {
            if(!empty($content))
                $content .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_devider_h.tpl");
            $content .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_phone.tpl");
            $content = str_replace("<!--number-->",Encoding::Base64UrlDecode($_GET["ifs_pin"]),$content);
            $content = str_replace("<!--info-->",Encoding::Base64UrlDecode($_GET["ifs_pii"]),$content);
            $content = str_replace("<!--show_opi-->",isset($_GET["ifs_opi"]) ? "" : "none",$content);
            $content = str_replace("<!--show_opo-->",isset($_GET["ifs_opo"]) ? "" : "none",$content);
            $content = str_replace("<!--button_text-->",($_online) ? "<!--lang_client_call_me_now-->" : "<!--lang_client_call_me_later-->",$content);

            if(isset($_GET["ifs_opi"]) && isset($_GET["ifs_opo"]))
                $height += 120;
            else if(isset($_GET["ifs_opi"]))
                $height += 100;
            else if(isset($_GET["ifs_opo"]))
                $height += 60;
        }

        if(isset($_GET["ifs_opo"]))
            $params .= "&cmb=MQ__";

        if(isset($_GET["ifs_ot"]))
        {
            if(!empty($content))
                $content .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_devider_h.tpl");
            $content .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_ticket.tpl");
            $height+=60;
        }

        if(isset($_GET["ifs_okb"]))
        {
            if(!empty($content))
                $content .= IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_devider_h.tpl");
            if(Server::$Configuration->File["gl_kbin"]==0)
                $link = "href=\"javascript:lz_tracking_init_floating_button_selector(null);lz_tracking_init_external_window('','','','&t=a2I<!--addition-->',false);\"";
            else if(Server::$Configuration->File["gl_kbin"]==1)
                $link = "href=\"".KnowledgeBase::GetExternalURL()."\" target=\"_blank\" onclick=\"lz_tracking_init_floating_button_selector(null);\"";
            else
                $link = "href=\"".LocalizationManager::Replace(Server::$Configuration->File["gl_kurl"])."\"";
            $content .= str_replace("<!--url-->",$link,IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_knowledgebase.tpl"));
            $height+=60;
        }

        $links = array();
        for($i=1;$i<4;$i++)
            if(isset($_GET["ifs_cl".$i]))
                $links[$i] = str_replace("a href=","a target=\"_blank\" a href=",Encoding::Base64UrlDecode($_GET["ifs_cl".$i]));

        $contents = "";
        $contentsn = "";

        if(!empty($_GET["ifs_osf"]))
            $contentsn .= str_replace("<!--url-->",Encoding::Base64UrlDecode($_GET["ifs_osf"]),IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_social_fb.tpl"));
        if(!empty($_GET["ifs_ost"]))
            $contentsn .= str_replace("<!--url-->",Encoding::Base64UrlDecode($_GET["ifs_ost"]),IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_social_tw.tpl"));
        if(!empty($_GET["ifs_osg"]))
            $contentsn .= str_replace("<!--url-->",Encoding::Base64UrlDecode($_GET["ifs_osg"]),IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_social_gp.tpl"));
        if(!empty($contentsn))
        {
            $contents = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/module_social.tpl");
            $height+=45;
        }

        $contents = str_replace("<!--networks-->",$contentsn,$contents);
        $template = IOStruct::GetFile(TEMPLATE_SCRIPT_OVERLAYS . "fbv2/content.tpl");

        if(!empty($links))
        {
            $template = str_replace("<!--module_links-->",implode($links),$template);
            $height+=30;
        }
        $template = str_replace("<!--module_rows-->",$content.str_replace("<!--class-->","lz_fbv2_vlink",@Server::$Configuration->File["gl_cpab"]),$template);
        $template = str_replace("<!--module_social-->",$contents,$template);
        $template = str_replace("<!--server-->",LIVEZILLA_URL,$template);
        $template = str_replace("<!--custom_html-->",Encoding::Base64UrlDecode($_GET["ifs_cht"]),$template);
        $template = str_replace("<!--color-->",Communication::ReadParameter("etc","#448800"),$template);
        $aParams = Encoding::Base64UrlDecode($_GET["ifs_add"]);
        $params = (!empty($aParams)) ? $params.$aParams : $params;
        $template = str_replace("<!--addition-->",$params,$template);
        return "lz_tracking_add_floating_button_selector('".base64_encode(Server::Replace($template,true,false))."',".$_shadow.",".$height.");";
    }

    static function GetAllowedParameters()
    {
        $allowed = array("fe"=>true,"epc"=>true,"etc"=>true,"grot"=>true,"deactr"=>true,"hinv"=>true,"ckf"=>true,"prv"=>true,"ecsgs"=>true,"hots"=>true,"oets"=>true,"hott"=>true,"oett"=>true,"hcgs"=>true,"htgs"=>true,"ecsge"=>true,"ecsc"=>true,"ecsy"=>true,"ecsx"=>true,"ecsb"=>true,"ecsa"=>true,"ecslw"=>true,"echc"=>true,"ecfs"=>true,"ecfe"=>true,"echt"=>true,"echst"=>true,"ecoht"=>true,"ecohst"=>true,"ovlto"=>true,"ovlt"=>true,"ovlp"=>true,"ovloe"=>true,"ovlml"=>true,"ovlmr"=>true,"ovlhm"=>true,"ovlmt"=>true,"ovlmb"=>true,"ovls"=>true,"ovloo"=>true,"ovlio"=>true,"ovlc"=>true,"ovlch"=>true,"ovlts"=>true,"ovlapo"=>true,"ovlct"=>true,"ovltwo"=>true,"ovlw"=>true,"ovlh"=>true,GET_EXTERN_GROUP=>true,"intid"=>true,"pref"=>true,"cboo"=>true,"hg"=>true,"fbpos"=>false,"fbw"=>false,"fbh"=>false,"fbshx"=>true,"fbshy"=>true,"fbshb"=>true,"fbshc"=>true,"fbmt"=>false,"fbmr"=>false,"fbmb"=>false,"fbml"=>false,"fboo"=>false,"eca"=>true,"ecw"=>true,"ech"=>true,"echm"=>true,"ecmb"=>true,"ecfi"=>true,"ecfo"=>true,"ecml"=>true,"ecsp"=>true,"cf0"=>true,"cf1"=>true,"cf2"=>true,"cf3"=>true,"cf4"=>true,"cf5"=>true,"cf6"=>true,"cf7"=>true,"cf8"=>true,"cf9"=>true);
        return Communication::GetTargetParameterString("",$allowed);
    }

    static function GetActionText($_sender,$_action,$break=false,$sel_message=null,$def_message=null)
    {
        if(empty($_action->Value))
        {
            $available = array(Server::$Operators[$_sender->UserSystemId]->PredefinedMessages,Server::$Groups[$_sender->GroupId]->PredefinedMessages);
            foreach($available as $list)
            {
                foreach($list as $message)
                {
                    if((isset($_GET[GET_EXTERN_USER_LANGUAGE]) && strtoupper(Communication::ReadParameter(GET_EXTERN_USER_LANGUAGE)) == strtoupper($message->LangISO)))
                    {
                        $sel_message = $message;
                        $break = true;
                        break;
                    }
                    else if(strtoupper(VisitorMonitoring::$Visitor->Language) == strtoupper($message->LangISO))
                    {
                        $sel_message = $message;
                        $break = true;
                    }

                    if($message->IsDefault && empty($_action->Value))
                    {
                        $def_message = $message;
                    }
                }
                if($break)
                    break;
            }

            if($sel_message == null && $def_message != null)
                $sel_message = $def_message;

            if($_action->Type == 2 && $sel_message != null)
                $_action->Value = $sel_message->InvitationAuto;
            else if($_action->Type == 4)
            {
                $_action->Value = $sel_message->WebsitePushAuto;
                $_action->Value = str_replace("%target_url%",$_action->WebsitePush->TargetURL,$_action->Value);
            }
        }

        $_action->Value = Server::$Groups[$_sender->GroupId]->TextReplace($_action->Value,($sel_message != null) ? $sel_message->LangISO : Server::$Configuration->File["gl_default_language"]);
        $_action->Value = VisitorMonitoring::$Visitor->TextReplace($_action->Value);
        $_action->Value = VisitorMonitoring::$Browser->TextReplace($_action->Value);
        $_action->Value = Server::$Operators[$_sender->UserSystemId]->TextReplace($_action->Value);
        $_action->Value = Configuration::Replace($_action->Value);
        return $_action->Value;
    }

    static function GetActionSender($_senders,$_checkOnline,$maxPriority=0,$minChats=100)
    {
        Server::InitDataBlock(array("INTERNAL","GROUPS"));
        foreach($_senders as $sender)
            if(isset(Server::$Operators[$sender->UserSystemId]) && (!$_checkOnline || ((Server::$Operators[$sender->UserSystemId]->LastActive > (time()-Server::$Configuration->File["timeout_clients"])) && Server::$Operators[$sender->UserSystemId]->Status == USER_STATUS_ONLINE)))
            {
                $maxPriority = max($maxPriority,$sender->Priority);
                if($maxPriority == $sender->Priority)
                {
                    Server::$Operators[$sender->UserSystemId]->GetExternalObjects();
                    $minChats = min($minChats, count(Server::$Operators[$sender->UserSystemId]->ExternalChats));
                    $asenders[] = $sender;
                }
            }
        if(!empty($asenders) && count($asenders)==1)
            return $asenders[0];
        else if(empty($asenders))
            return null;
        foreach($asenders as $sender)
            if($minChats == count(Server::$Operators[$sender->UserSystemId]->ExternalChats))
                $fsenders[] = $sender;
        return $fsenders[array_rand($fsenders,1)];
    }

    static function Replace($_toReplace)
    {
        $host = @$_SERVER["HTTP_HOST"];
        if(!empty($host))
            $_toReplace = str_replace("%domain%",$host,$_toReplace);
        else
            $_toReplace = str_replace("%domain%",Server::$Configuration->File["gl_host"],$_toReplace);
        return $_toReplace;
    }

    static function ProcessActions($actionData = "", $_chatsExternal)
    {
        global $OVERLAY;
        if(!empty(VisitorMonitoring::$Browser->ChatRequest) && !isset($_GET["hinv"]))
        {
            Server::InitDataBlock(array("INTERNAL","GROUPS"));
            if((Server::$Operators[VisitorMonitoring::$Browser->ChatRequest->SenderSystemId]->LastActive < (time()-Server::$Configuration->File["timeout_clients"])) || Server::$Operators[VisitorMonitoring::$Browser->ChatRequest->SenderSystemId]->Status != USER_STATUS_ONLINE || !Server::$Operators[VisitorMonitoring::$Browser->ChatRequest->SenderSystemId]->IsExternal(Server::$Groups, null, null) || VisitorMonitoring::$Browser->ChatRequest->Closed || !empty(VisitorMonitoring::$Browser->ChatRequest->Canceled))
            {
                if(!VisitorMonitoring::$Browser->ChatRequest->Closed)
                {
                    VisitorMonitoring::$Browser->ChatRequest->SetStatus(false,false,empty(VisitorMonitoring::$Browser->ChatRequest->Canceled),true);
                    VisitorMonitoring::$Browser->ForceUpdate();
                }
                $actionData .= "top.lz_tracking_close_request('".VisitorMonitoring::$Browser->ChatRequest->Id."');";
            }
            else if(isset($_GET["decreq"]) || isset($_GET["accreq"]))
            {
                if(isset($_GET["decreq"]))
                    VisitorMonitoring::$Browser->ChatRequest->SetStatus(false,false,true,true);
                if(isset($_GET["accreq"]))
                    VisitorMonitoring::$Browser->ChatRequest->SetStatus(false,true,false,true);
                if(isset($_GET["clreq"]))
                    $actionData .= "top.lz_tracking_close_request();";
                if(!VisitorMonitoring::$Browser->ChatRequest->Closed)
                    VisitorMonitoring::$Browser->ForceUpdate();
            }
            else if(!VisitorMonitoring::$Browser->ChatRequest->Accepted && !VisitorMonitoring::$Browser->ChatRequest->Declined)
            {
                if(!empty($_GET["ovlc"]) && !$_chatsExternal)
                {

                }
                else if(empty(VisitorMonitoring::$Browser->ChatRequest->EventActionId))
                {
                    $invitationSettings = @unserialize(base64_decode(Server::$Configuration->File["gl_invi"]));
                    array_walk($invitationSettings,"b64dcode");
                    $invitationHTML = Server::Replace(VisitorMonitoring::$Browser->ChatRequest->CreateInvitationTemplate($invitationSettings[13],Server::$Configuration->File["gl_site_name"],Server::$Configuration->File["wcl_window_width"],Server::$Configuration->File["wcl_window_height"],LIVEZILLA_URL,Server::$Operators[VisitorMonitoring::$Browser->ChatRequest->SenderSystemId],$invitationSettings[0]));
                    VisitorMonitoring::$Browser->ChatRequest->Invitation = new Invitation($invitationHTML,VisitorMonitoring::$Browser->ChatRequest->Text,$invitationSettings);
                }
                else if(!Is::Null($action = Server::$Events->GetActionById(VisitorMonitoring::$Browser->ChatRequest->EventActionId)))
                {
                    $invitationHTML = Server::Replace(VisitorMonitoring::$Browser->ChatRequest->CreateInvitationTemplate($action->Invitation->Style,Server::$Configuration->File["gl_site_name"],Server::$Configuration->File["wcl_window_width"],Server::$Configuration->File["wcl_window_height"],LIVEZILLA_URL,Server::$Operators[VisitorMonitoring::$Browser->ChatRequest->SenderSystemId],$action->Invitation->CloseOnClick));
                    VisitorMonitoring::$Browser->ChatRequest->Invitation = $action->Invitation;
                    VisitorMonitoring::$Browser->ChatRequest->Invitation->Text = VisitorMonitoring::$Browser->ChatRequest->Text;
                    VisitorMonitoring::$Browser->ChatRequest->Invitation->HTML = $invitationHTML;
                }
                if(!VisitorMonitoring::$Browser->ChatRequest->Displayed)
                {
                    VisitorMonitoring::$Browser->ForceUpdate();
                    VisitorMonitoring::$Browser->ChatRequest->SetStatus(true,false,false,false);
                }
                if(!empty(VisitorMonitoring::$Browser->ChatRequest->Invitation) && (!VisitorMonitoring::$Browser->OverlayContainer || $_chatsExternal))
                {
                    $actionData .= VisitorMonitoring::$Browser->ChatRequest->Invitation->GetCommand(VisitorMonitoring::$Browser->ChatRequest->Id);
                }
            }
        }
        if(!empty(VisitorMonitoring::$Browser->WebsitePush))
        {
            if(isset($_GET[GET_TRACK_WEBSITE_PUSH_DECLINED]))
            {
                VisitorMonitoring::$Browser->WebsitePush->SetStatus(false,false,true);
            }
            else if(isset($_GET[GET_TRACK_WEBSITE_PUSH_ACCEPTED]) || (!VisitorMonitoring::$Browser->WebsitePush->Ask && !VisitorMonitoring::$Browser->WebsitePush->Displayed))
            {
                VisitorMonitoring::$Browser->WebsitePush->SetStatus(false,true,false);
                $actionData .= VisitorMonitoring::$Browser->WebsitePush->GetExecCommand();
            }
            else if(VisitorMonitoring::$Browser->WebsitePush->Ask && !VisitorMonitoring::$Browser->WebsitePush->Accepted && !VisitorMonitoring::$Browser->WebsitePush->Declined)
            {
                VisitorMonitoring::$Browser->WebsitePush->SetStatus(true,false,false);
                $actionData .= VisitorMonitoring::$Browser->WebsitePush->GetInitCommand();
            }
        }
        if(!empty(VisitorMonitoring::$Browser->Alert) && !VisitorMonitoring::$Browser->Alert->Accepted)
        {
            $actionData .= VisitorMonitoring::$Browser->Alert->GetCommand();
            VisitorMonitoring::$Browser->Alert->SetStatus(false,true);
        }
        if(!empty(VisitorMonitoring::$Browser->OverlayBox) && !VisitorMonitoring::$Browser->OverlayBox->Closed)
        {
            $action = Server::$Events->GetActionById(VisitorMonitoring::$Browser->OverlayBox->EventActionId);
            $template = null;

            if(!Is::Null($action))
                $template = $action->OverlayBox;
            else if(empty(VisitorMonitoring::$Browser->OverlayBox->EventActionId))
            {
                $template = $OVERLAY->GetFeedbackTemplate();
            }

            if($template != null)
            {
                if(isset($_GET["confol"]))
                    VisitorMonitoring::$Browser->OverlayBox->SetStatus(true);
                else
                {
                    $boxHTML = Server::Replace(VisitorMonitoring::$Browser->OverlayBox->CreateOverlayTemplate($template->Style,Server::$Configuration->File["gl_site_name"],$template->Width,$template->Height,LIVEZILLA_URL));
                    VisitorMonitoring::$Browser->OverlayBox->OverlayElement = $template;
                    VisitorMonitoring::$Browser->OverlayBox->OverlayElement->HTML = $boxHTML;
                    $actionData .= VisitorMonitoring::$Browser->OverlayBox->OverlayElement->GetCommand();
                }
            }
        }
        return $actionData;
    }

    static function GetJSCustomArray($_historyCustoms=null,$getCustomParams="")
    {
        Server::InitDataBlock(array("INPUTS"));
        $valArray=array();
        foreach(Server::$Inputs as $index => $input)
        {
            if($input->Active && $input->Custom)
            {
                if(isset($_GET["cf".$input->Index]))
                    $valArray[$index] = "'" . getParam("cf".$input->Index) . "'";
                else if(is_array($_historyCustoms) && isset($_historyCustoms[$input->Index]) && !empty($_historyCustoms[$input->Index]))
                    $valArray[$index] = "'" . Encoding::Base64UrlEncode($_historyCustoms[$input->Index]) . "'";
                else
                    $valArray[$index] = "''";
            }
            else if($input->Custom)
                $valArray[$index] = "''";
        }
        ksort($valArray);
        foreach($valArray as $param)
        {
            if(!empty($getCustomParams))
                $getCustomParams .= ",";
            $getCustomParams .= $param;
        }
        return $getCustomParams;
    }
}

?>