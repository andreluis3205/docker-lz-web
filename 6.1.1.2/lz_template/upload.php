<?php
/****************************************************************************************
 * LiveZilla knowledgebase.php
 *
 * Copyright 2015 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

define("IN_LIVEZILLA",true);
header('Content-Type: text/html; charset=utf-8');
if(!defined("LIVEZILLA_PATH"))
    define("LIVEZILLA_PATH","./");

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

@set_error_handler("handleError");
if(!empty($_REQUEST["cid"]) && Server::InitDataProvider())
{
    $chat = VisitorChat::GetByChatId(Communication::ReadParameter("cid",0));
    if($chat != null)
    {
        if($chat->Closed)
        {
            exit("lz_chat_file_stop();");
        }
        else
        {
            $visitor = new Visitor($chat->UserId);
            $visitor->Load();
            if(isset($_FILES["form_userfile"]))
            {
                if(StoreFile($visitor,$chat->BrowserId,$chat->DesiredChatPartner,$chat->UserData->Fullname,$chat->ChatId))
                    exit("lz_chat_file_ready();");
                else
                    exit("lz_chat_file_error(2);");
            }
            else
            {
                if(Communication::GetIP() == $visitor->IP)
                {
                    if(!empty($_POST["p_fu_a"]))
                    {
                        exit(AbortFileUpload($chat,$_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME]));
                    }
                    if(!empty($_POST["p_iu"]))
                    {
                        exit(RequestFileUpload($visitor,$chat,$_POST[POST_EXTERN_USER_FILE_UPLOAD_NAME]));
                    }
                    else
                    {
                        $html = IOStruct::GetFile(PATH_TEMPLATES . "upload.tpl");
                        $html = str_replace("<!--upload-->",IOStruct::GetFile(PATH_TEMPLATES . "file_upload.tpl"),$html);
                        $html = str_replace("<!--action-->","lz_chat_file_init_upload();",$html);
                        $html = str_replace("<!--connector_script-->",IOStruct::GetFile(TEMPLATE_SCRIPT_CONNECTOR),$html);
                        $html = str_replace("<!--cid-->",Encoding::Base64UrlEncode($chat->ChatId),$html);
                        $html = str_replace("<!--mwidth-->","max-width:90%;",$html);
                        $html = str_replace("<!--chat_id-->",Encoding::Base64UrlEncode($chat->ChatId),$html);
                        exit(Server::Replace($html));
                    }
                }
            }
        }
    }
}

function StoreFile($_visitor,$_browserId,$_partner,$_fullname,$_chatId)
{
    $filename = IOStruct::GetNamebase($_FILES['form_userfile']['name']);
    if(!IOStruct::IsValidUploadFile($filename))
        return false;
    if(empty($_fullname))
        $_fullname = Visitor::GetNoName($_visitor->UserId.Communication::GetIP());

    $fileid = md5($filename . $_visitor->UserId . $_browserId);
    $fileurid = EX_FILE_UPLOAD_REQUEST . "_" . $fileid;
    $filemask = $_visitor->UserId . "_" . $fileid;

    $request = new FileUploadRequest($fileurid,$_partner,$_chatId);
    $request->Load();

    if($request->Permission == PERMISSION_FULL)
    {
        if(move_uploaded_file($_FILES["form_userfile"]["tmp_name"], PATH_UPLOADS . $request->FileMask))
        {
            KnowledgeBase::CreateFolders($_partner,false);
            KnowledgeBase::Process($_partner,$_visitor->UserId,$_fullname,0,$_fullname,0,5,3);
            KnowledgeBase::Process($_partner,$fileid,$filemask,4,$_FILES["form_userfile"]["name"],0,$_visitor->UserId,4,$_FILES["form_userfile"]["size"]);

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

function RequestFileUpload($_user,$_chat,$_filename,$response="")
{
    $fileid = md5(IOStruct::GetNamebase($_filename) . $_chat->UserId . $_chat->BrowserId);
    $filemask = $_chat->UserId . "_" . $fileid;
    $fileurid = EX_FILE_UPLOAD_REQUEST . "_" . $fileid;
    $request = new FileUploadRequest($fileurid,$_chat->DesiredChatPartner,$_chat->ChatId);
    $request->SenderUserId = $_chat->UserId;
    $request->FileName = htmlentities(IOStruct::GetNamebase($_filename));
    $request->FileMask = $filemask;
    $request->FileId = $fileid;
    $request->SenderBrowserId = $_chat->BrowserId;
    $request->Load();

    if(!$request->FirstCall && !$request->Closed)
    {
        if($request->Permission == PERMISSION_FULL)
        {
            $response .= "lz_chat_file_start_upload();";
        }
        else if($request->Permission == PERMISSION_NONE)
        {
            $response .= "lz_chat_file_stop(true);";
            $response .= "lz_chat_file_error(1);";
            $request->Close();
        }
    }
    else
    {
        $request->FirstCall = true;
        $request->Error = false;
        $request->Closed = false;
        $request->Permission = PERMISSION_VOID;
        if(!IOStruct::IsValidUploadFile($_filename))
            $response .= "lz_chat_file_error(2);";
        else
        {
            $request->Save();
        }
    }
    return $response;
}

function AbortFileUpload($_chat,$_filename,$_error=FILE_ACTION_ERROR,$response="")
{
    $fileid = md5(IOStruct::GetNamebase($_filename) . $_chat->UserId . $_chat->BrowserId);
    $request = new FileUploadRequest(EX_FILE_UPLOAD_REQUEST . "_" . $fileid, $_chat->DesiredChatPartner,$_chat->ChatId);
    $request->Load();
    if(!$request->Closed)
    {
        $request->Error = $_error;
        $request->Save();
    }
    else
    {
        $response .= "lz_chat_file_reset();";
    }
    return $response;
}

?>