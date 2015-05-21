<?php
/****************************************************************************************
 * LiveZilla resource.php
 *
 * Copyright 2015 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 * Improper changes to this file may cause critical errors.
 ***************************************************************************************/

$paramIndex = 1;
$code = "";
while(isset($_REQUEST[$paramIndex]))
{
    if(strtolower($_REQUEST[$paramIndex])=="style.min.css")
        $code .= file_get_contents("./templates/style.min.css");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chat/style.min.css")
        $code .= file_get_contents("./templates/overlays/chat/style.min.css");
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jsglobal.min.js")
        $code .= file_get_contents("./templates/jscript/jsglobal.min.js");
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jsbox.min.js")
        $code .= file_get_contents("./templates/jscript/jsbox.min.js");
    else if(strtolower($_REQUEST[$paramIndex])=="jscript/jstrack.min.js")
        $code .= file_get_contents("./templates/jscript/jstrack.min.js");
    else if(strtolower($_REQUEST[$paramIndex])=="overlays/chat/jscript/jsextern.min.js")
        $code .= file_get_contents("./templates/overlays/chat/jscript/jsextern.min.js");

    $paramIndex++;
}
if($_REQUEST["t"]=="css")
    header("Content-Type: text/css;");
else
    header("Content-Type: application/javascript;");
header("Cache-Control: max-age=864000");
exit($code);
?>