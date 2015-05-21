<?php
/****************************************************************************************
 * LiveZilla admin.php
 *
 * Copyright 2015 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

require './php/common/functions.php';

function lzmBase64UrlDecode($str) {
    $str = str_replace('_', '=', $str);
    $str = str_replace('-', '+', $str);
    $str = str_replace(',', '/', $str);
    $str = base64_decode($str);

    return $str;
}

function lzmGetCleanRequestParam($param) {
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1) {
        return htmlentities($param,ENT_QUOTES,'UTF-8');
    } else {
        return '';
    }
}

$language = (!empty($_GET['lang'])) ? $_GET['lang'] : 'ZW4_';

define("LIVEZILLA_PATH","./../");
require "./../language.php";
$jsLanguageData = getLanguageJS(lzmBase64UrlDecode($language));

?>
<!DOCTYPE HTML>
<html manifest="lzmadmin.appcache">
<head>
    <title>
        Livezilla Mobile
    </title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Admin.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Controls.css" />
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <script type="text/javascript" src="./js/jquery-2.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>

    <script type="text/javascript" src="./js/jsglobal.js"></script>
    <script type="text/javascript" src="./js/md5.js"></script>
    <script type="text/javascript" src="./js/sha1.js"></script>
    <script type="text/javascript" src="./js/sha256.js"></script>

    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonPermissionClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonServerEvaluationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js"></script>

    <script type="text/javascript" src="./js/lzm/classes/AdminDisplayLayoutClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/AdminUserManagementClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/AdminPollServerClass.js"></script>

    <script type="text/javascript" src="./js/lzm/classes/ChatObjectClasses.js"></script>

    <script type="text/javascript" src="./js/lzm/admin.js"></script>
    <script type="text/javascript">
        window.addEventListener('load', function(e) {
            window.applicationCache.addEventListener('error', handleCacheError, false);
            window.applicationCache.addEventListener('checking', handleCacheEvent, false);
            window.applicationCache.addEventListener('cached', handleCacheEvent, false);
            window.applicationCache.addEventListener('downloading', handleCacheEvent, false);
            window.applicationCache.addEventListener('noupdate', handleCacheEvent, false);
            window.applicationCache.addEventListener('obsolete', handleCacheEvent, false);
            window.applicationCache.addEventListener('progress', handleCacheEvent, false);
            window.applicationCache.addEventListener('updateready', handleCacheEvent, false);
        }, false);

        var handleCacheError = function(e) {
            //logit('Error updating the app cache');
            //logit(e);
        };

        var handleCacheEvent = function(e) {
            //logit('Cache event');
            switch (e.type) {
                case 'noupdate':
                    //console.log('NOUPDATE');
                    break;
                case 'downloading':
                    //console.log('DOWNLOADING');
                    break;
                case 'checking':
                    //console.log('CHECKING');
                    break;
                case 'progress':
                    //console.log('PROGRESS');
                    break;
                case 'updateready':
                    //console.log('UPDATEREADY');
                    try {
                        window.applicationCache.swapCache();
                    } catch(e) {
                        //console.log(e.stack);
                    }
                    window.location.reload();
                    break;
                default:
                    //console.log('UKNOWN CACHE STATUS: ' + e.type);
                    break;
            }
        };

        var logit = function(logString) {
            try {
                console.log(logString)
            } catch(ex) {}
        }
    </script>

    <script type="text/javascript">
        var translationData = <?php echo $jsLanguageData; ?>;
        var language = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($language)."'"; ?>);
        $(document).ready(function() {
            <?php
            if (!empty($_GET['type']) && $_GET['type'] == 'user_management') {
                echo "loadUserManagement();\r\n";
            }
            ?>
        });
    </script>
</head>
<body>

<?php
$adminTypes = Array('user_management');
if (!empty($_GET['acid']) && !empty($_GET['type']) && in_array($_GET['type'], $adminTypes)) {
    $pageContent = readHtmlTemplate('adminuser.tpl', false, false);
} else {
    $pageContent = readHtmlTemplate('adminclose.tpl', false, false);
}
echo $pageContent;
?>

</body>
</html>