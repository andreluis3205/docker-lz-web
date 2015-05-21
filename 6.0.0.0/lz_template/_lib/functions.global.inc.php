<?php

/****************************************************************************************
* LiveZilla functions.global.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

require_once(LIVEZILLA_PATH . "_lib/objects.global.users.inc.php");

function handleError($_errno, $_errstr, $_errfile, $_errline)
{
	if(error_reporting()!=0)
    {
        $estr = date("d.m.y H:i:s") . " " . $_SERVER["REMOTE_ADDR"] . " ERR# " . $_errno . " " . $_errstr . " ".$_errfile . " IN LINE ". $_errline."\r\n";
        Logging::ErrorLog($estr);
    }
}

function ignoreError($_errno, $_errstr, $_errfile, $_errline)
{
}

function getParam($_getParam)
{
	if(isset($_GET[$_getParam]))
		return Encoding::Base64UrlEncode(Encoding::Base64UrlDecode($_GET[$_getParam]));
	else
		return null;
}

function getParams($_getParams="",$_allowed=null)
{
	foreach($_GET as $key => $value)
		if($key != "template" && !($_allowed != null && !isset($_allowed[$key])))
		{
            if(Encoding::IsBase64Encoded($value,true))
            {
			    $value = !($_allowed != null && !$_allowed[$key]) ? Encoding::Base64UrlEncode(Encoding::Base64UrlDecode($value)) : Encoding::Base64UrlEncode($value);
			    $_getParams.=((strlen($_getParams) == 0) ? $_getParams : "&") . urlencode($key) ."=" . $value;
            }
		}
	return $_getParams;
}

function getCustomArray($_getCustomParams=null)
{
	Server::InitDataBlock(array("INPUTS"));
	
	if(empty($_getCustomParams))
		$_getCustomParams = array('','','','','','','','','','');

	for($i=0;$i<=9;$i++)
	{
		if(isset($_GET["cf" . $i]))
			$_getCustomParams[$i] = Encoding::Base64UrlDecode($_GET["cf" . $i]);
		else if(isset($_POST["p_cf" . $i]) && !empty($_POST["p_cf" . $i]))
			$_getCustomParams[$i] = Encoding::Base64UrlDecode($_POST["p_cf" . $i]);
		else if(isset($_POST["form_" . $i]) && !empty($_POST["form_" . $i]))
			$_getCustomParams[$i] = $_POST["form_" . $i];

		//else if(!Is::Null(Cookie::Get("cf_" . $i)) && Server::$Inputs[$i]->Cookie)
		//	$_getCustomParams[$i] = Cookie::Get("cf_" . $i);

		else if((Server::$Inputs[$i]->Type == "CheckBox" || Server::$Inputs[$i]->Type == "ComboBox") && empty($_getCustomParams[$i]))
			$_getCustomParams[$i] = "0";
	}
	return $_getCustomParams;
}

function b64dcode(&$_a,$_b)
{
	$_a = base64_decode($_a);
}

function b64ecode(&$_a,$_b)
{
	$_a = base64_encode($_a);
}

function cutString($_string,$_maxlength,$_addDots=false)
{
    if(function_exists("mb_strlen"))
    {
        if(mb_strlen($_string,'utf-8')>$_maxlength)
        {
            if($_addDots)
                return mb_substr($_string,0,$_maxlength-3,'utf-8')."...";
            else
                return mb_substr($_string,0,$_maxlength,'utf-8');
        }
    }
    else
    {
        if(strlen($_string)>$_maxlength)
        {
            if($_addDots)
                return substr($_string,0,$_maxlength-3)."...";
            else
                return substr($_string,0,$_maxlength);
        }
    }
    return $_string;
}

function operatorsAvailable($_amount=0, $_exclude=null, $include_group=null, $include_user=null, $_allowBots=false)
{
	
	if(!DB_CONNECTION)
		return 0;
    Server::InitDataBlock(array("INTERNAL","GROUPS"));
	if(!empty($include_user))
		$include_group = Server::$Operators[Operator::GetSystemId($include_user)]->GetGroupList(true);

	foreach(Server::$Operators as $internaluser)
	{
		$isex = $internaluser->IsExternal(Server::$Groups, $_exclude, $include_group);
		if($isex && $internaluser->Status < USER_STATUS_OFFLINE)
		{
			if($_allowBots || !$internaluser->IsBot)
				$_amount++;
		}
	}
	return $_amount;
}

function getOperatorList()
{
	
	$array = array();
    Server::InitDataBlock(array("INTERNAL","GROUPS"));
	foreach(Server::$Operators as $internaluser)
		if($internaluser->IsExternal(Server::$Groups))
			$array[utf8_decode($internaluser->Fullname)] = $internaluser->Status;
	return $array;
}

function getOperators()
{
	
	$array = array();
    Server::InitDataBlock(array("INTERNAL","GROUPS"));
	foreach(Server::$Operators as $sysId => $internaluser)
	{
		$internaluser->IsExternal(Server::$Groups);
		$array[$sysId] = $internaluser;
	}
	return $array;
}

function getAlertTemplate()
{
	
	$html = str_replace("<!--server-->",LIVEZILLA_URL,IOStruct::GetFile(TEMPLATE_SCRIPT_ALERT));
	$html = str_replace("<!--title-->",Server::$Configuration->File["gl_site_name"],$html);
	return $html;
}

function getId($_length,$start=0)
{
	$id = md5(uniqid(rand(),1));
	if($_length != 32)
		$start = rand(0,(31-$_length));
	$id = substr($id,$start,$_length);
	return $id;
}

function correctLineBreaks($_input)
{
    $rand = getId(32);
    $_input = str_replace("\r\n", $rand, $_input);
    $_input = str_replace("\r", $rand, $_input);
    $_input = str_replace("\n", $rand, $_input);
    $_input = str_replace($rand, "\r\n", $_input);
    return $_input;
}

function mimeHeaderDecode($_string)
{
    if(strpos($_string,"?") !== false && strpos($_string,"=") !== false)
    {
        if(function_exists("iconv_mime_decode"))
            return iconv_mime_decode($_string,2,"UTF-8");
        else if(strpos(strtolower($_string),"utf-8") !== false)
        {
            mb_internal_encoding("UTF-8");
            return mb_decode_mimeheader($_string);
        }
        else
            return utf8_encode(mb_decode_mimeheader($_string));
    }
    return utf8_encode($_string);
}

function jokerCompare($_template,$_comparer,$_ignoreStartAndEnd=false)
{
	if($_template=="*")
		return true;

    if(!$_ignoreStartAndEnd)
    {
        $spacer = md5(rand());
        $_template = str_replace("?",$spacer,strtolower($_template));
        $_comparer = str_replace("?",$spacer,strtolower($_comparer));
    }
    else
        $spacer = "";

	$_template = str_replace("*","(.*)",$_template);
	return (preg_match("(".$spacer.$_template.$spacer.")",$spacer.$_comparer.$spacer)>0);
}

function endsWith($haystack, $needle)
{
    $length = strlen($needle);
    if ($length == 0) {
        return true;
    }
    return (substr($haystack, -$length) === $needle);
}

function parseURL($_string)
{
    return preg_replace('%(https?|ftp)://([-A-Z0-9./_*?&;=#]+)%i','<a target="blank" href="$0" target="_blank">$0</a>', $_string);
}

function logit($v)
{
    Logging::DebugLog($v);
}

Server::DisableMagicQuotes();
Server::InitConfiguration();
?>
