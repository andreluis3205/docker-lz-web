<?php
/****************************************************************************************
* LiveZilla extern.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();
	
require(LIVEZILLA_PATH . "_lib/objects.external.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");

if(isset($_POST[POST_EXTERN_SERVER_ACTION]))
{
	LocalizationManager::AutoLoad();
	Server::InitDataBlock(array("FILTERS","INPUTS"));
    VisitorChat::$Router = new ChatRouter();

	$externalUser = new Visitor(Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_USERID]));
	$externalUser->ExtendSession = true;
	$externalUser->Load();

	array_push($externalUser->Browsers,new VisitorChat($externalUser->UserId,Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_BROWSERID])));
    array_push($externalUser->Browsers,new VisitorBrowser($externalUser->Browsers[0]->BrowserId,$externalUser->Browsers[0]->UserId));

    define("IS_FILTERED",DataManager::$Filters->Match(Communication::GetIP(),LocalizationManager::ImplodeLanguages(((!empty($_SERVER["HTTP_ACCEPT_LANGUAGE"])) ? $_SERVER["HTTP_ACCEPT_LANGUAGE"] : "")),Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_USERID]),$externalUser->GeoCountryISO2));
	define("IS_FLOOD",($externalUser->Browsers[0]->FirstCall && Filter::IsFlood(Communication::GetIP(),@$_POST[POST_EXTERN_USER_USERID],true)));

    Server::InitDataBlock(array("INTERNAL","GROUPS"));
    VisitorChat::ApplyDynamicGroup($externalUser->Browsers[0]);

    $externalUser->Browsers[0]->Load();
    if($externalUser->Browsers[0]->Status == CHAT_STATUS_OPEN && IS_FILTERED && !FILTER_ALLOW_CHATS && !FILTER_ALLOW_TICKETS)
    {
        $error=buildLoginErrorField();
        $externalUser->AddFunctionCall("lz_chat_release(true,'".$error."');",false);
    }
    else
    {
        if($_POST[POST_EXTERN_SERVER_ACTION] == "search_kb")
        {
            $query = Communication::ReadParameter("p_q","");
            $color = ExternalChat::ReadTextColor();
            $catcount = 0;
            $main = $result = $navcats = "";
            if($query == "%ALL%")
            {
                $matches = KnowledgeBase::GetEntries(Visitor::$BrowserLanguage);
                if(count($matches)==0)
                    $matches = KnowledgeBase::GetEntries();

                if(count($matches)>0)
                {
                    foreach($matches as $match)
                    {
                        $res = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_category.tpl");
                        $res = str_replace("<!--title-->",htmlentities($match->Title,ENT_QUOTES,"UTF-8"),$res);
                        $res = str_replace("<!--id-->",$match->Id,$res);
                        $res = str_replace("<!--color-->",$color,$res);
                        $entries = "";
                        $childcount = 0;
                        if(!empty($match->ChildNodes))
                        {
                            foreach($match->ChildNodes as $child)
                                if($child->Type != 0)
                                {
                                    $entries .= $child->GetHTML($color);
                                    $childcount++;
                                }

                            if(!empty($navcats))
                                $navcats.= "<hr>";
                            $navcats .= "<a href=\"#".$match->Id."\"><div>" . $match->Title."<span>(" . count($match->ChildNodes) . ")</span></div></a>";
                            $catcount++;
                        }
                        $res = str_replace("<!--search-->","false",$res);
                        $res = str_replace("<!--entries-->",$entries,$res);
                        if($childcount>0)
                            $result .= $res;
                    }
                    $main = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_main.tpl");
                    $main = str_replace("<!--show_cats-->",($catcount>1) ? "''" : "none",$main);
                    $main = str_replace("<!--categories-->",($catcount>1) ? $navcats : "",$main);
                    $main = str_replace("<!--content-->",$result,$main);
                }

                if(!empty($result) && !empty($main))
                    $externalUser->AddFunctionCall("lz_chat_search_result('".base64_encode(Server::Replace($main,true,false,false,false))."',0);",false);
                else
                    $externalUser->AddFunctionCall("lz_chat_search_result('".base64_encode("<div><br><br>".LocalizationManager::$TranslationStrings["client_kb_no_entries"]."</div>" . $result)."',0);",false);

            }
            else if(strlen($query)>=3)
            {
                $matches = KnowledgeBase::GetMatches($query,Visitor::$BrowserLanguage);
                if(count($matches)>0)
                {
                    foreach($matches as $match)
                         $result .= $match->GetHTML($color);

                    $res = IOStruct::GetFile(PATH_TEMPLATES . "kb_result_category.tpl");
                    $res = str_replace("<!--title-->","\"".cutString($query,50,true)."\"",$res);
                    $res = str_replace("<!--entries-->",$result,$res);
                    $res = str_replace("<!--search-->","true",$res);
                    $res = str_replace("<!--id-->","sr",$res);
                    $externalUser->AddFunctionCall("lz_chat_search_result('".base64_encode("<div><b>".str_replace("<!--count-->",count($matches),LocalizationManager::$TranslationStrings["client_kb_results_found"])." </b><br><br>" . $res)."',".count($matches).");",false);
                }
                else
                    $externalUser->AddFunctionCall("lz_chat_search_result('".base64_encode("<div><br><br>".LocalizationManager::$TranslationStrings["client_search_no_result"]."</div>" . $result . "")."',0);",false);
            }
            else
                $externalUser->AddFunctionCall("lz_chat_search_result('".base64_encode("<div><br><br>".LocalizationManager::$TranslationStrings["client_search_no_result"]."</div>" . $result . "")."',0);",false);

        }
        else if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_LISTEN)
        {
            $externalUser = ExternalChat::Listen($externalUser);
        }
        else if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_MAIL)
        {
            if(($ticket = $externalUser->SaveTicket(Encoding::Base64UrlDecode($_POST[POST_EXTERN_USER_GROUP]),$externalUser->GeoCountryISO2,isset($_POST["p_cmb"]),true,Communication::GetParameter("p_url","",$nu,FILTER_SANITIZE_URL))) !== false && (Server::$Configuration->File["gl_scom"] != null || Server::$Configuration->File["gl_sgom"] != null))
                $ticket->SendAutoresponder($externalUser,$externalUser->Browsers[0]);
        }
        else
        {
            if($externalUser->Browsers[0]->Status != CHAT_STATUS_OPEN || $externalUser->Browsers[0]->Waiting)
            {
                $externalUser->Browsers[0]->CloseChat(7);
                $externalUser->Browsers[0] = new VisitorChat($externalUser->UserId,Encoding::Base64UrlDecode(@$_POST[POST_EXTERN_USER_BROWSERID]),$externalUser->Browsers[0]->UserData->Fullname,$externalUser->Browsers[0]->UserData->Email,$externalUser->Browsers[0]->UserData->Company,$externalUser->Browsers[0]->UserData->Text,$externalUser->Browsers[0]->UserData->Customs,$externalUser->Browsers[0]->DesiredChatGroup,$externalUser->Browsers[0]->DesiredChatPartner,$externalUser->Browsers[0]->UserData->Phone);
            }
            else
            {
                $externalUser->Browsers[0]->ChatId = Encoding::Base64UrlDecode(@$_POST[POST_EXTERN_CHAT_ID]);
            }

            $externalUser->Browsers[0]->Waiting = false;
            $externalUser->Browsers[0]->WaitingMessageDisplayed = null;

            if($_POST[POST_EXTERN_SERVER_ACTION] == EXTERN_ACTION_RELOAD_GROUPS)
            {
                if(!VisitorChat::IsChatBrowserIdAvailable($externalUser->Browsers[0]->BrowserId, true))
                {
                    Logging::ErrorLog("Invalid Browser ID - trying to change ...");
                    $externalUser->AddFunctionCall("lz_chat_change_browser_id('".getId(USER_ID_LENGTH)."');",true);
                    $externalUser->AddFunctionCall("lz_chat_reload_groups();",false);
                }
                else
                {

                    if(!$externalUser->Browsers[1]->LoadUserData())
                        $externalUser->Browsers[1]->UserData->LoadFromCookie();
                    $externalUser = $externalUser->Browsers[1]->ReplaceLoginDetails($externalUser);
                    $externalUser->ReloadGroups();
                }
            }
            else
            {
                $externalUser->Browsers[0]->CloseWindow();
                exit();
            }
        }

        if(!isset($_POST[POST_EXTERN_RESOLUTION_WIDTH]))
            $externalUser->KeepAlive();
        else
            $externalUser->Save(array(Communication::GetParameter(POST_EXTERN_RESOLUTION_WIDTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(POST_EXTERN_RESOLUTION_HEIGHT,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32)),Communication::GetParameter(POST_EXTERN_COLOR_DEPTH,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(POST_EXTERN_TIMEZONE_OFFSET,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32),Communication::GetParameter(GEO_LATITUDE,-522,$nu,FILTER_VALIDATE_FLOAT),Communication::GetParameter(GEO_LONGITUDE,-522,$nu,FILTER_VALIDATE_FLOAT),Communication::GetParameter(GEO_COUNTRY_ISO_2,"",$nu,null,null,32),Communication::GetParameter(GEO_CITY,"",$nu,null,null,255),Communication::GetParameter(GEO_REGION,"",$nu,null,null,255),Communication::GetParameter(GEO_TIMEZONE,"",$nu,null,null,24),Communication::GetParameter(GEO_ISP,"",$nu,null,null,255),Communication::GetParameter(GEO_SSPAN,0,$nu,FILTER_VALIDATE_INT),Communication::GetParameter(GEO_RESULT_ID,"",$nu,FILTER_SANITIZE_SPECIAL_CHARS,null,32));

        if($externalUser->SignatureMismatch)
        {
            $externalUser->AddFunctionCall("lz_chat_set_signature(\"".$externalUser->UserId."\");",true);
            $externalUser->AddFunctionCall("lz_chat_reload_groups();",false);
        }
        else
        {
            $externalUser->Browsers[0]->VisitId = $externalUser->VisitId;
            if(isset($_GET[GET_TRACK_SPECIAL_AREA_CODE]))
                $externalUser->Browsers[0]->Code = Encoding::Base64UrlDecode($_GET[GET_TRACK_SPECIAL_AREA_CODE]);
            if(IS_FILTERED && !FILTER_ALLOW_CHATS)
                $externalUser->Browsers[0]->CloseChat(8);
            else if(!$externalUser->Browsers[0]->Closed)
                $externalUser->Browsers[0]->Save();
            if(empty($externalUser->Host) && $externalUser->FirstCall)
                $externalUser->ResolveHost();
        }
    }
	$EXTERNSCRIPT = $externalUser->Response;
}
?>
