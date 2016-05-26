<?php
/****************************************************************************************
* LiveZilla functions.index.inc.php
* 
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
* Improper changes to this file may cause critical errors.
***************************************************************************************/ 

if(!defined("IN_LIVEZILLA"))
	die();

function getFolderPermissions()
{
	$message = "";
	$directories = Array(PATH_UPLOADS,PATH_LOG,PATH_STATS,PATH_STATS."day/",PATH_STATS."month/",PATH_STATS."year/");
	foreach($directories as $dir)
	{
		$result = IOStruct::IsWriteable($dir);
			if(!$result)
				$message .= "Insufficient write access" . " (" . $dir . ")<br>";
	}
	if(!empty($message))
		$message = "<span class=\"lz_index_error_cat\">Write Access:<br></span> <span class=\"lz_index_orange\">" . $message . "</span><a href=\"".CONFIG_LIVEZILLA_FAQ."en/?fid=changepermissions#changepermissions\" class=\"lz_index_helplink\" target=\"_blank\">Learn how to fix this problem</a>";
	return $message;
}

function getMySQL($error="")
{
	if(!empty(Server::$Configuration->File["gl_db_host"]))
	{
		require(LIVEZILLA_PATH . "_lib/functions.internal.man.inc.php");
        $extension = (!empty(Server::$Configuration->File["gl_db_ext"])) ? Server::$Configuration->File["gl_db_ext"] : "";
		$error = ServerManager::ValidateDatabase(Server::$Configuration->File["gl_db_host"],Server::$Configuration->File["gl_db_user"],Server::$Configuration->File["gl_db_pass"],Server::$Configuration->File["gl_db_name"],Server::$Configuration->File["gl_db_prefix"],$extension,true,Server::$Configuration->File["gl_db_eng"]);
	}

	if(!function_exists("mysql_real_escape_string") && !function_exists("mysqli_real_escape_string"))
		$error = "MySQL PHP extension is not available.";
	
	if(empty($error))
		return null;
	else 
		return "<span class=\"lz_index_error_cat\">MySQL:<br></span><span class=\"lz_index_orange\">" . $error ."</span>";
}

function getPhpVersion()
{
	$message = null;
	if(!Server::CheckPhpVersion(PHP_NEEDED_MAJOR,PHP_NEEDED_MINOR,PHP_NEEDED_BUILD))
		$message = "<span class=\"lz_index_error_cat\">PHP-Version:<br></span> <span class=\"lz_index_orange\">" . str_replace("<!--version-->",PHP_NEEDED_MAJOR . "." . PHP_NEEDED_MINOR . "." . PHP_NEEDED_BUILD,"LiveZilla requires PHP <!--version--> or greater.<br>Installed version is " . @phpversion()) . ".</span>";
	return $message;
}

function getDisabledFunctions()
{
    Server::InitDataBlock(array("INTERNAL","GROUPS"));
    $currentMIV = @ini_get("max_input_vars");
    $currentMIVText = $currentMIV;
    if(empty($currentMIV))
    {
        $currentMIV = 1000;
        $currentMIVText = "unknown (default=1000)";
    }

    $message = null;
    if(count(Server::$Operators) > 0 && ($miv = ((count(Server::$Groups)+count(Server::$Operators))*75)) > $currentMIV)
        $message .= "<span class=\"lz_index_error_cat\">PHP Configuration:<br></span> <span class=\"lz_index_orange\">PHP configuration \"max_input_vars\" (see php.ini) must be increased to ".$miv." (or greater).<br><br>Your current configuration is ".$currentMIVText.".</span><br><br>";
    if(!function_exists("file_get_contents") && ini_get('allow_url_fopen'))
		$message .= "<span class=\"lz_index_error_cat\">Disabled function: file_get_contents<br></span> <span class=\"lz_index_orange\">LiveZilla requires the PHP function file_get_contents to be activated.</span><br><br>";
	if(!function_exists("fsockopen"))
		$message .= "<span class=\"lz_index_error_cat\">Disabled function: fsockopen<br></span> <span class=\"lz_index_orange\">LiveZilla requires the PHP function fsockopen to be activated in order to send and receive emails and to send PUSH Messages to APPs.</span><br><br>";
    if(!function_exists("iconv_mime_decode"))
        $message .= "<span class=\"lz_index_error_cat\">Missing PHP extension: ICONV<br></span> <span class=\"lz_index_orange\">LiveZilla requires the PHP extension ICONV to parse incoming emails. Please add the ICONV package to your PHP configuration.</span><br><br>";
    if(!ini_get('allow_url_fopen'))
        $message .= "<span class=\"lz_index_error_cat\">Disabled wrapper: allow_url_fopen<br></span> <span class=\"lz_index_orange\">LiveZilla requires allow_url_fopen to be activated in order to send PUSH Messages to APPs and to send/receive Social Media updates.</span><br><br>";
    if(!empty(Server::$Configuration->File["gl_ldap"]) && !function_exists("ldap_connect"))
        $message .= "<span class=\"lz_index_error_cat\">Missing PHP extension: LDAP<br></span> <span class=\"lz_index_orange\">LiveZilla requires the PHP extension LDAP to authenticate against directories. Please add the LDAP package (extension=php_ldap.dll) to your PHP configuration.</span><br><br>";

    if(ini_get('allow_url_fopen') && function_exists("fsockopen"))
    {
        if(!empty(Server::$Configuration->File["gl_mpm"]))
        {
            $opts = array('http' => array('method'  => 'POST', 'header'  => 'Content-type: application/x-www-form-urlencoded','content' => http_build_query(array())));
            $context  = stream_context_create($opts);
            $result = file_get_contents(CONFIG_LIVEZILLA_PUSH . "validate.php", false, $context);
            if($result != 'CONNECTION_SUCCESSFUL')
                $message .= "<span class=\"lz_index_error_cat\">Can't connect to push server ".CONFIG_LIVEZILLA_PUSH." on Port 443.<br></span> <span class=\"lz_index_orange\">Blocked by firewall or missing Open SSL package (extension=php_openssl.dll). Outgoing connection to push server is required in order to send PUSH Messages to APPs.</span><br><br>";
        }
    }
    return $message;
}
?>
