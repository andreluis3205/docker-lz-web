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
if(isset($_GET["id"]))
{
    define("IN_LIVEZILLA",true);
    header('Content-Type: text/html; charset=utf-8');
    if(!defined("LIVEZILLA_PATH"))
        define("LIVEZILLA_PATH","./");

    require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
    require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
    require(LIVEZILLA_PATH . "_lib/functions.external.inc.php");
    require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
    require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");

    @set_error_handler("handleError");
    Server::InitDataProvider();
    Server::DefineURL("knowledgebase.php");
    LocalizationManager::AutoLoad();
    $color = ExternalChat::ReadTextColor();

    $entry = KnowledgeBaseEntry::GetById(Communication::ReadParameter("id",""),true);
    if(!empty($entry))
    {
        $html = IOStruct::GetFile(PATH_TEMPLATES . "kb_entry.tpl");
        if(!empty(Server::$Configuration->File["gl_kcss"]))
            $html = str_replace("<!--custom_css-->","<link rel=\"stylesheet\" type=\"text/css\" href=\"".Server::$Configuration->File["gl_kcss"]."\">",$html);

        if(Server::$Configuration->File["gl_knbr"])
        {
            $rresult = $entry->GetRateResult();
            if(($rate=Communication::ReadParameter("h",-1))!= -1)
            {
                $html = str_replace("<!--rate_text-->","<br><div id=\"lz_chat_dialog_kb_rate\">".$LZLANG["client_feedback_success"]."</div>",$html);
                $entry->SaveRateResult($rate);
            }
            else
            {
                $bhtml = "<a href=\"./knowledgebase.php?id=<!--id-->&h=MQ__\"><!--lang_client_yes--></a><a href=\"./knowledgebase.php?id=<!--id-->&h=MA__\"><!--lang_client_no--></a>";
                $fhtml = ($rresult[0] > 0) ? str_replace("<!--users-->",$rresult[0],str_replace("<!--total-->",$rresult[1],$LZLANG["client_found_helpful"]))." " : "";
                $html = str_replace("<!--rate_text-->","<br><div id=\"lz_chat_dialog_kb_rate\">".$fhtml.$LZLANG["client_was_helpful"].$bhtml."</div>",$html);
            }
        }
        else
            $html = str_replace("<!--rate_text-->","",$html);

        if($entry->Type == 1)
            $html = str_replace("<!--html-->",$entry->Value,$html);
        else if($entry->Type == 2)
            $html = str_replace("<!--html-->","<script>window.location.replace('".$entry->Value."');</script>",$html);
        $html = str_replace("<!--color-->",$color,$html);
        $html = str_replace(array("<!--title-->","<!--header-->"),$entry->Title,$html);
        $html = str_replace("<!--id-->",$_GET["id"],$html);
    }
    exit(Server::Replace($html));
}
else
{
    $_REQUEST["hfk"] = "";
    $_REQUEST["t"] = "a2I_";
    $_REQUEST["kbo"] = "MQ_";
    require("chat.php");
}
?>