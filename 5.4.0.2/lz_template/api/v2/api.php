<?php
/****************************************************************************************
*
* API version 2.0
*
* Copyright 2014 LiveZilla GmbH
* All rights reserved.
* LiveZilla is a registered trademark.
* 
***************************************************************************************/

define("IN_LIVEZILLA",true);
define("IN_API",true);
define("LIVEZILLA_PATH","../../");

@set_time_limit(30);

require(LIVEZILLA_PATH . "_definitions/definitions.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.global.users.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.global.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.dynamic.inc.php");
require(LIVEZILLA_PATH . "_definitions/definitions.protocol.inc.php");
require(LIVEZILLA_PATH . "_lib/functions.internal.inc.php");
require(LIVEZILLA_PATH . "_lib/objects.internal.inc.php");

@set_error_handler("handleError");
@error_reporting(E_ALL);

header("Pragma: no-cache");
header("Cache-Control: no-cache, must-revalidate");
header("Keep-Alive: timeout=5, max=100");

initDataProvider();
initData(array("INTERNAL","INPUTS","DBCONFIG"));
validate(true);

if(isValidated() && is("CALLER_SYSTEM_ID"))
{
    if($INTERNAL[CALLER_SYSTEM_ID]->GetPermission(46) != PERMISSION_NONE)
    {
        require("objects.apiv2.inc.php");
        $apiv2 = new ApiV2(isset($_POST["p_json_pretty"]));
        if($apiv2->RunActions() && empty($apiv2->ErrorField) && !empty($apiv2->JSONOutput))
        {
            exit($apiv2->JSONOutput);
        }
        else
        {
            header("HTTP/1.1 400 Bad Request");
            exit("HTTP/1.1 400 Bad Request" . $apiv2->GetErrorCodes());
        }
    }
}
header("HTTP/1.1 403 Forbidden");
exit("HTTP/1.1 403 Forbidden");
?>