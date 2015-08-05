<?php
/****************************************************************************************
* LiveZilla visitcard.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

define("IN_LIVEZILLA",true);

if(!defined("LIVEZILLA_PATH"))
	define("LIVEZILLA_PATH","./");
	
require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");

require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");

if(isset($_GET["intid"]) && Server::InitDataProvider())
{
    Server::InitDataBlock(array("INTERNAL"));
	$id = Operator::GetSystemId($_GET["intid"]);
	if(isset(Server::$Operators[$id]))
	{
		$sysid = $_GET["intid"];
		if(!empty(Server::$Operators[$id]->Profile))
		{
			header("Content-Type: application/vcard;");
			header("Content-Disposition: attachment; filename=" . utf8_decode($sysid) . ".vcf");
			$vcard = IOStruct::GetFile("./templates/vcard.tpl");
			$vcard = str_replace("<!--Name-->",qp_encode(Server::$Operators[$id]->Profile->Name),$vcard);
			$vcard = str_replace("<!--Firstname-->",qp_encode(Server::$Operators[$id]->Profile->Firstname),$vcard);
			$vcard = str_replace("<!--Company-->",qp_encode(Server::$Operators[$id]->Profile->Company),$vcard);
			$vcard = str_replace("<!--Comments-->",qp_encode(Server::$Operators[$id]->Profile->Comments),$vcard);
			$vcard = str_replace("<!--Phone-->",qp_encode(Server::$Operators[$id]->Profile->Phone),$vcard);
			$vcard = str_replace("<!--Fax-->",qp_encode(Server::$Operators[$id]->Profile->Fax),$vcard);
			$vcard = str_replace("<!--Street-->",qp_encode(Server::$Operators[$id]->Profile->Street),$vcard);
			$vcard = str_replace("<!--City-->",qp_encode(Server::$Operators[$id]->Profile->City),$vcard);
			$vcard = str_replace("<!--ZIP-->",qp_encode(Server::$Operators[$id]->Profile->ZIP),$vcard);
			$vcard = str_replace("<!--Country-->",qp_encode(Server::$Operators[$id]->Profile->Country),$vcard);
			$vcard = str_replace("<!--URL-->",qp_encode("http://" . Server::$Configuration->File["gl_host"] . str_replace("visitcard.php",FILE_CHAT . "?intid=".Encoding::Base64UrlEncode($_GET["intid"]),htmlentities($_SERVER["PHP_SELF"],ENT_QUOTES,"UTF-8"))),$vcard);
			$vcard = str_replace("<!--Languages-->",qp_encode(Server::$Operators[$id]->Profile->Languages),$vcard);
			$vcard = str_replace("<!--Email-->",Server::$Operators[$id]->Profile->Email,$vcard);
			$vcard = str_replace("<!--Gender-->",qp_encode(Server::$Operators[$id]->Profile->Gender),$vcard);
			$vcard = str_replace("<!--Picture-->",(!empty(Server::$Operators[$id]->ProfilePicture)) ? "\r\nPHOTO;TYPE=JPEG;ENCODING=BASE64:\r\n" . Server::$Operators[$id]->ProfilePicture : "",$vcard);
			exit($vcard);
		}
	}
}

function qp_encode($string) 
{
	$string = str_replace(array('%20', '%0D%0A', '%'), array(' ', "\r\n", '='), rawurlencode(utf8_decode($string)));
	$string = preg_replace('/[^\r\n]{73}[^=\r\n]{2}/', "$0=\r\n", $string);
	return $string;
}
?>
