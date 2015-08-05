<?php
/****************************************************************************************
 * LiveZilla index.php
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

if (empty($_GET['acid'])) {
    $acid = substr(md5(mt_rand()), 0, 6);

    $emptyPage = "<!DOCTYPE HTML><html manifest='empty.appcache'><head><title>Livezilla Mobile</title><meta http-equiv='Content-Type' content='text/html; charset=utf-8'/>" .
        "<script type='text/javascript'> window.addEventListener('load', function(e) { var myReloadUrl = document.URL, subsiteName = '', indexPage = '', acid = '" . $acid . "'; " .
        "document.getElementById('refreshing-message').innerHTML = 'Refreshing login page...'; " .
        "var urlParts = myReloadUrl.split('#'); if (myReloadUrl.indexOf('#') != -1) { subsiteName = '#' + urlParts[1]; } " .
        "if (myReloadUrl.indexOf('index.php') == -1) { indexPage = '/index.php'; } " .
        "myReloadUrl = (urlParts[0].indexOf('?') == -1) ? urlParts[0] + indexPage + '?acid=' + acid : urlParts[0] + indexPage + '&acid=' + acid; " .
        "myReloadUrl = myReloadUrl.replace(/:\/\//g, ':~~').replace(/\/\//g, '/').replace(/:~~/g, '://')  + subsiteName; " .
        "document.location = myReloadUrl; });</script></head><body><div id='refreshing-message'></div><noscript><div id='no-js-warning' style='display: block;'>" .
        "<div style='margin-top: 69px; padding:42px; background: url(\"img/logo.png\"); background-position: center; background-repeat: no-repeat;'></div>" .
        "<p style='padding: 0px 20px; font-size: 1.5em;'>Your browser seems to have Javascript disabled.<br />" .
        "Since Javascript is needed for this application, you have to enable Javascript in your browser settings and reload this page.</p>" .
        "</div></noscript></body></html>";

    exit($emptyPage);
}
$language = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
$language = explode(',', $language);
$language = strtolower($language[0]);

define("LIVEZILLA_PATH","./../");
require "./../language.php";
$jsLanguageData = getLanguageJS($language);

function lzmGetCleanRequestParam($param) {
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1) {
        return htmlentities($param,ENT_QUOTES,'UTF-8');
    } else {
        return '';
    }
}

function lzmBase64UrlDecode($str) {
    return $str;
}

?>

<!DOCTYPE HTML>
<html manifest="lzm.appcache">
<head>
    <title>
        Livezilla Mobile
    </title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="apple-itunes-app" content="app-id=710516100">

    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Login.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Controls.css" />
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <script type="text/javascript" src="./js/jquery-2.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>

    <script type="text/javascript" src="./js/jsglobal.js"></script>
    <script type="text/javascript" src="./js/md5.js"></script>
    <script type="text/javascript" src="./js/sha1.js"></script>
    <script type="text/javascript" src="./js/sha256.js"></script>

    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonWindowsDeviceInterfaceClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonConfigClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonStorageClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayHelperClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDisplayLayoutClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/index.js"></script>
    <?php
    #<script type="text/javascript" src="./js/lzm/translationData.js"></script>
    ?>
    <script type="text/javascript">
        var translationData = <?php echo $jsLanguageData; ?>;

        var detectedLanguage = <?php echo "'".$language."'"; ?>;
        var logit = function(myString) {
            try {
                console.log(myString);
            } catch(e) {}
        };

        window.addEventListener('load', function(e) {
            //logit('Load event');
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
                    //hideCacheIsUpdating();
                    break;
                case 'downloading':
                    //console.log('DOWNLOADING');
                    //showCacheIsUpdating();
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
                        //hideCacheIsUpdating();
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

        var showCacheIsUpdating = function() {
            var bodyHeight = $(window).height();
            var bodyWidth = $(window).width();
            var updatingDiv = '<div id="application-updating" style="position: absolute; left: 0px; top: 0px;' +
                ' width: ' + bodyWidth + 'px; height: ' + bodyHeight + 'px; background: #ffffff; opacity: 0.85;' +
                ' background-image: url(\'../images/chat_loading.gif\'); background-repeat: no-repeat;' +
                ' background-position: center;"></div>';

            $('body').append(updatingDiv);
        };

        var hideCacheIsUpdating = function() {
            $('#application-updating').remove();
        };
    </script>
</head>
<body>
<noscript>
<div id="no-js-warning" style="display: block;">
    <div style="margin-top: 69px; padding:42px; background: url('img/logo.png'); background-position: center; background-repeat: no-repeat;"></div>
    <p style="padding: 0px 20px; font-size: 1.5em;">
        Your browser seems to have Javascript disabled.<br />
        Since Javascript is needed for this application, you have to enable Javascript in your browser settings and reload this page.
    </p>
</div>
</noscript>
<div id="no-storage-warning" style="display: none;">
    <h1>No Cookies/local Storage available</h1>
</div>
<div id="headline"><div id="headline-logo"></div></div>
<div id="login-container">
    <div id="login-headline"><i class="fa fa-lock"></i> <span id="login-headline-text">Enter your login data here</span></div>
    <div id="login-form"></div>
</div>
<div id="login-copyright-link"></div>
<form id="data-submit-form" method="post" data-ajax="false">
</form>

</body>
</html>
