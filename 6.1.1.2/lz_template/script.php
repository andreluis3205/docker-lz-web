<?php
/****************************************************************************************
 * LiveZilla script.php
 *
 * Copyright 2016 LiveZilla GmbH
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

Server::DefineURL("print.php");
@set_error_handler("handleError");
if(Server::InitDataProvider())
{
    if(!empty($_GET["id"]))
    {
        $code = Configuration::GetCodeById($_GET["id"]);
        if($code != null)
            echo "var code = '".base64_encode($code)."', sid='".$_GET["id"]."';";
        else
            exit();
    }
    else
        exit();
}
else
    exit();
?>
function scrb64d(r){var e,n,a,t,f,d,h,i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",o="",c=0;for(r=r.replace(/[^A-Za-z0-9\+\/\=]/g,"");c<r.length;)t=i.indexOf(r.charAt(c++)),f=i.indexOf(r.charAt(c++)),d=i.indexOf(r.charAt(c++)),h=i.indexOf(r.charAt(c++)),e=t<<2|f>>4,n=(15&f)<<4|d>>2,a=(3&d)<<6|h,o+=String.fromCharCode(e),64!=d&&(o+=String.fromCharCode(n)),64!=h&&(o+=String.fromCharCode(a));return o=o}
if(window.addEventListener)window.addEventListener('load', inscr)
else window.attachEvent('onload', inscr)
function inscr(){
    var container = document.createElement("div");
    container.innerHTML = scrb64d(code);
    if(document.getElementById(sid))
        document.getElementById(sid).parentNode.appendChild(container);
    else
        document.body.appendChild(container);
    if(document.getElementById('lz_r_scr')!=null)
        eval(document.getElementById('lz_r_scr').innerHTML);
    if(document.getElementById('lz_textlink')!=null){
        var newScript = document.createElement("script");
        newScript.src = document.getElementById('lz_textlink').src;
        newScript.async = true;
        document.head.appendChild(newScript);
    }
};