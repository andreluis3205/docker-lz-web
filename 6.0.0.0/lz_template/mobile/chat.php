<?php
/****************************************************************************************
 * LiveZilla chat.php
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function lzmBase64UrlDecode($str) {
    $str = str_replace('_', '=', $str);
    $str = str_replace('-', '+', $str);
    $str = str_replace(',', '/', $str);
    $str = base64_decode($str);

    return $str;
}

function lzmBase64UrlEncode($str) {
    $str = base64_encode($str);
    $str = str_replace('=', '_', $str);
    $str = str_replace('+', '-', $str);
    $str = str_replace('/', ',', $str);

    return $str;
}

function lzmHash($str) {
    $str = md5($str);
    $str = hash('sha256', $str);

    return $str;
}

function lzmBase64UrlDecodeAndHash($str) {
    $str = lzmBase64UrlDecode($str);
    $str = lzmHash($str);

    return $str;
}

function lzmGetCleanRequestParam($param) {
    if (preg_match('/^[a-zA-Z0-9_,-]*$/', $param) == 1) {
        return htmlentities($param,ENT_QUOTES,'UTF-8');
    } else {
        return '';
    }
}

require './php/common/functions.php';

$requestDataString = serialize($_REQUEST);

if (!empty($_REQUEST['index'])) {
    $index = !empty($_REQUEST['index']) ? $_REQUEST['index'] : '';
    $login_name = !empty($_REQUEST['login']) ? $_REQUEST['login'] : '';
    $login_passwd = !empty($_REQUEST['password']) ? $_REQUEST['password'] : '';
    $server_port = !empty($_REQUEST['port']) ? $_REQUEST['port'] : '';
    $server_profile = !empty($_REQUEST['profile']) ? $_REQUEST['profile'] : '';
    $server_protocol = !empty($_REQUEST['protocol']) ? $_REQUEST['protocol'] : '';
    $server_url = !empty($_REQUEST['url']) ? $_REQUEST['url'] : '';
    $mobile_dir = !empty($_REQUEST['mobile_dir']) ? $_REQUEST['mobile_dir'] : 'bW9iaWxl';
    $status = !empty($_REQUEST['status']) ? $_REQUEST['status'] : '';
    $app = !empty($_REQUEST['app']) ? $_REQUEST['app'] : 0;
    $web = !empty($_REQUEST['web']) ? $_REQUEST['web'] : 0;
    $volume = !empty($_REQUEST['volume']) ? $_REQUEST['volume'] : 'NjA_';
    $awayAfter = !empty($_REQUEST['away_after']) ? $_REQUEST['away_after'] : 'MA__';
    $playIncomingMessageSound = !empty($_REQUEST['play_incoming_message_sound']) ? $_REQUEST['play_incoming_message_sound'] : 'MQ__';
    $playIncomingChatSound = !empty($_REQUEST['play_incoming_chat_sound']) ? $_REQUEST['play_incoming_chat_sound'] : 'MQ__';
    $repeatIncomingChatSound = !empty($_REQUEST['repeat_incoming_chat_sound']) ? $_REQUEST['repeat_incoming_chat_sound'] : 'MQ__';
    $playIncomingTicketSound = !empty($_REQUEST['play_incoming_ticket_sound']) ? $_REQUEST['play_incoming_ticket_sound'] : 'LQ__';
    $language = !empty($_REQUEST['language']) ? $_REQUEST['language'] : '';
    $backgroundMode = !empty($_REQUEST['background_mode']) ? $_REQUEST['background_mode'] : 'MQ__';
    $loginId = !empty($_REQUEST['loginid']) ? $_REQUEST['loginid'] : '';
    $localDbPrefix = !empty($_REQUEST['local_db_prefix']) ? $_REQUEST['local_db_prefix'] : '';
    $appOs = !empty($_REQUEST['appOs']) ? $_REQUEST['appOs'] : '';
    //$deviceId = !empty($_REQUEST['device_id']) ? $_REQUEST['device_id'] : '';
    $debug = !empty($_REQUEST['debug']) ? $_REQUEST['debug'] : 0;
    $multiServerId = !empty($_REQUEST['multi_server_id']) ? $_REQUEST['multi_server_id'] : '';
    $lzmVcode = !empty($_REQUEST['password']) ? $_REQUEST['password'] : '';
} else {
    $index = !empty($_REQUEST['ndx']) ? $_REQUEST['ndx'] : '';
    $login_name = !empty($_REQUEST['lgn']) ? $_REQUEST['lgn'] : '';
    $login_passwd = !empty($_REQUEST['psswrd']) ? $_REQUEST['psswrd'] : '';
    $server_port = !empty($_REQUEST['prt']) ? $_REQUEST['prt'] : '';
    $server_profile = !empty($_REQUEST['prfl']) ? $_REQUEST['prfl'] : '';
    $server_protocol = !empty($_REQUEST['prtcl']) ? $_REQUEST['prtcl'] : '';
    $server_url = !empty($_REQUEST['rl']) ? $_REQUEST['rl'] : '';
    $mobile_dir = !empty($_REQUEST['mbl_dr']) ? $_REQUEST['mbl_dr'] : 'bW9iaWxl';
    $status = !empty($_REQUEST['stts']) ? $_REQUEST['stts'] : '';
    $app = !empty($_REQUEST['pp']) ? $_REQUEST['pp'] : 0;
    $web = !empty($_REQUEST['wb']) ? $_REQUEST['wb'] : 0;
    $volume = !empty($_REQUEST['vlm']) ? $_REQUEST['vlm'] : 'NjA_';
    $awayAfter = !empty($_REQUEST['w_ftr']) ? $_REQUEST['w_ftr'] : 'MA__';
    $playIncomingMessageSound = !empty($_REQUEST['pl_ncmng_mssg_snd']) ? $_REQUEST['pl_ncmng_mssg_snd'] : 'MQ__';
    $playIncomingChatSound = !empty($_REQUEST['pl_ncmng_cht_snd']) ? $_REQUEST['pl_ncmng_cht_snd'] : 'MQ__';
    $repeatIncomingChatSound = !empty($_REQUEST['rpt_ncmng_cht_snd']) ? $_REQUEST['rpt_ncmng_cht_snd'] : 'MQ__';
    $playIncomingTicketSound = !empty($_REQUEST['pl_ncmng_tckt_snd']) ? $_REQUEST['pl_ncmng_tckt_snd'] : 'LQ__';
    $language = !empty($_REQUEST['lngg']) ? $_REQUEST['lngg'] : '';
    $loginId = !empty($_REQUEST['lgnd']) ? $_REQUEST['lgnd'] : '';
    $backgroundMode = !empty($_REQUEST['bckgrnd_md']) ? $_REQUEST['bckgrnd_md'] : 'MQ__';
    $localDbPrefix = !empty($_REQUEST['lcl_db_prfx']) ? $_REQUEST['lcl_db_prfx'] : '';
    $appOs = (!empty($_REQUEST['pps'])) ? $_REQUEST['pps'] : '';
    //$deviceId = !empty($_REQUEST['dvc_d']) ? $_REQUEST['dvc_d'] : '';
    $debug = !empty($_REQUEST['dbg']) ? $_REQUEST['dbg'] : 0;
    $multiServerId = !empty($_REQUEST['mlt_srvr_d']) ? $_REQUEST['mlt_srvr_d'] : '';
    $lzmVcode = !empty($_REQUEST['psswrd']) ? $_REQUEST['psswrd'] : '';
}

setcookie('lzm-credentials', htmlentities($login_name,ENT_QUOTES,'UTF-8') . '~' . lzmBase64UrlDecodeAndHash($login_passwd));
$lzmVcode = lzmBase64UrlEncode($login_name . '~' . lzmBase64UrlDecodeAndHash($lzmVcode));

$protocolMode = (!empty($_REQUEST['p'])) ? $_REQUEST['p'] : '';

$mobileInformation = getMobileInformation();
$messageInternal = readHtmlTemplate('messageinternal.tpl');
$messageExternal = readHtmlTemplate('messageexternal.tpl');
$messageAdd = readHtmlTemplate('messageadd.tpl');
$messageAddAlt = readHtmlTemplate('messageaddalt.tpl');
$messageRepost = readHtmlTemplate('messagerepost.tpl');
$messageHeader = readHtmlTemplate('header.tpl');

$langFileTemplate = readHtmlTemplate('langFile.tpl', false, true);

define("LIVEZILLA_PATH","./../");
require "./../language.php";
$jsLanguageData = getLanguageJS(lzmBase64UrlDecode($language));

?>
<!DOCTYPE HTML>
<html manifest="lzm.appcache">
<head>
    <title>
        Livezilla Mobile
    </title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="google" content="notranslate">
    <meta name="format-detection" content="telephone=no">

    <link rel="stylesheet" type="text/css" href="../fonts/font-awesome.min.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Chat.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6Controls.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla6TemplateAndServer.css" />
    <link rel="stylesheet" type="text/css" href="./css/livezilla.css"/>
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <script type="text/javascript" src="./js/jquery-2.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery.blockUI.js"></script>

    <script type="text/javascript" src="js/md5.js"></script>
    <script type="text/javascript" src="js/sha1.js"></script>
    <script type="text/javascript" src="js/sha256.js"></script>
    <script type="text/javascript" src="js/jsglobal.js"></script>
    <script type="text/javascript" src="js/wyzz/wyzz.js"></script>

    <script type="text/javascript">
        var chosenProfile = {};
        var userStatus = 0;
        var isMobile = <?php echo $mobileInformation['isMobile']; ?>;
        var isTablet = <?php echo $mobileInformation['isTablet']; ?>;
        var localDbPrefix = <?php echo "'".lzmGetCleanRequestParam($localDbPrefix)."'"; ?>;
        var mobileOS = <?php echo "'".$mobileInformation['mobileOS']."'"; ?>;
        var mobileVersion = <?php echo "'".$mobileInformation['mobileVersion']."'"; ?>;
        var mobileIsSufficient = <?php echo "'".$mobileInformation['mobileIsSufficient']."'"; ?>;
        var messageTemplates = {'internal': <?php echo "'".$messageInternal."'"; ?>,
            'external': <?php echo "'".$messageExternal."'"; ?>,
            'add': <?php echo "'".$messageAdd."'"; ?>,
            'addalt': <?php echo "'".$messageAddAlt."'"; ?>,
            'repost': <?php echo "'".$messageRepost."'"; ?>,
            'header': <?php echo "'".$messageHeader."'"; ?>
        };
        var langFileTemplate = <?php echo "'".$langFileTemplate."'"; ?>;
        var web = <?php echo lzmGetCleanRequestParam($web); ?>;
        var app = <?php echo lzmGetCleanRequestParam($app); ?>;
        var appOs = <?php echo "'".lzmGetCleanRequestParam($appOs)."'"; ?>;
        var phpDebug = <?php echo lzmGetCleanRequestParam($debug); ?>;
        var debug = (phpDebug == 1) ? true : false;
        var multiServerId = <?php echo "'".lzmGetCleanRequestParam($multiServerId)."'"; ?>;
        var translationData = <?php echo $jsLanguageData; ?>;

        $(document).ready(function() {
            //alert('Mobile: ' + isMobile + ',\nTablet: ' + isTablet + ',\nMobile OS: ' + mobileOS + ',\nVersion: ' + mobileVersion + ',\nSufficient: ' + mobileIsSufficient);
            var volume = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($volume)."'"; ?>);
            var server_url = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($server_url)."'"; ?>);
            var mobile_dir = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($mobile_dir)."'"; ?>);
            var server_port = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($server_port)."'"; ?>);
            var loginId = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($loginId)."'"; ?>);
            var language = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($language)."'"; ?>);
            var backgroundMode = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($backgroundMode)."'"; ?>);
            var urlParts = server_url.split('/');
            var urlBase = urlParts[0];
            var urlRest = '';
            for (var i=1; i<urlParts.length; i++) {
                urlRest += '/' + urlParts[i];
            }
            server_url = urlBase + ':' + server_port + urlRest;

            var protocolMode = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($protocolMode)."'"; ?>);
            var serverProtocol = '';
            if (protocolMode == '1') {
                serverProtocol = 'https://';
            } else if (protocolMode == '0') {
                serverProtocol = 'http://';
            } else {
                serverProtocol = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($server_protocol)."'"; ?>)
            }

            chosenProfile = {
                index: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($index)."'"; ?>),
                login_name: '',
                login_passwd: '',
                server_port: server_port,
                server_profile: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($server_profile)."'"; ?>),
                server_protocol: serverProtocol,
                server_url: server_url,
                mobile_dir: mobile_dir,
                user_volume: volume,
                user_away_after: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($awayAfter)."'"; ?>),
                play_incoming_message_sound: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($playIncomingMessageSound)."'"; ?>),
                play_incoming_chat_sound: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($playIncomingChatSound)."'"; ?>),
                repeat_incoming_chat_sound: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($repeatIncomingChatSound)."'"; ?>),
                play_incoming_ticket_sound: lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($playIncomingTicketSound)."'"; ?>),
                fake_mac_address: loginId,
                language: language,
                background_mode: backgroundMode,
                login_id: loginId,
                lzmvcode: <?php echo "'".lzmGetCleanRequestParam($lzmVcode)."'"; ?>
            };
            userStatus = lz_global_base64_url_decode(<?php echo "'".lzmGetCleanRequestParam($status)."'"; ?>);
            if (isMobile && mobileOS == 'iOS') {
                $('#chat_page').css({'overflow-y': 'visible'});
            }

        });
    </script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDeviceInterfaceClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonWindowsDeviceInterfaceClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatTranslationEditorClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatReportsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatSettingsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatStartpageClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatResourcesClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatArchiveClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatVisitorClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatTicketClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatAllchatsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonConfigClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonToolsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonPermissionClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonStorageClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatServerEvaluationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatPollServerClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatUserActionsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatDisplayClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatDisplayHelperClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonInputControlsClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatDisplayLayoutClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatEditorClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatObjectClasses.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonDialogClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/ChatGeotrackingMapClass.js"></script>
    <script type="text/javascript" src="./js/lzm/classes/CommonServerEvaluationClass.js"></script>
    <script type="text/javascript" src="js/lzm/chat.js"></script>
</head>
<body style="overflow-y: hidden;">

<audio id="sound-message" preload='auto'>
    <source src="../sound/message.ogg" type="audio/ogg">
    <source src="../sound/message.mp3" type="audio/mpeg">
</audio>

<audio id="sound-ringtone" preload='auto'>
    <source src="sounds/ringtone.ogg" type="audio/ogg">
    <source src="sounds/ringtone.mp3" type="audio/mpeg">
</audio>

<audio id="sound-ticket" preload="auto">
    <source src="../sound/wind.ogg" type="audio/ogg">
    <source src="../sound/wind.mp3" type="audio/mpeg">
</audio>

<div id="chat_page" data-role="page">
    <div id="content_chat" data-role="content" style="overflow: visible;"> <!--article-->
        <div id="debugging-messages"></div>

        <div id="main-menu-panel"></div>

        <div id="userstatus-menu" class="mouse-menu panel-menu" style="display:none;"></div>
        <div id="usersettings-menu" class="mouse-menu panel-menu" style="display:none;"></div>
        <div id="minified-dialogs-menu" class="mouse-menu" style="display:none;"></div>

        <div class="lz-menu" id="new-view-select-panel"></div>

        <div class="lz-main" style="text-align:center;" id="chatframe">
            <div id="chat">

                <div id="chat-container" class="lzm-dialog">
                    <div id="chat-container-headline" class="lzm-dialog-headline"></div>
                    <div id="active-chat-panel">
                        <div id="switch-center-page" style="display: none;"></div>
                    </div>
                    <div id="chat-table"  class="lzm-dialog-body">
                        <div id="chat-progress" style="text-align: left; display: none;"></div>
                        <div id="chat-qrd-preview" style="text-align: left; display: none; max-height: 100px;"></div>
                        <div id="chat-buttons" style="display: none;"></div>
                        <div id="chat-action" style="display: none;">
                            <div id="chat-input-controls"></div>
                            <div id="chat-input-body">
                                <label for="chat-input" style="display: none;">Chat-Input</label>
                                <textarea data-role="none" id="chat-input" onkeypress="return catchEnterButtonPressed(event);" onkeyup="chatInputTyping(event);" onblur="doMacMagicStuff()"></textarea><br>
                            </div>
                        </div>
                        <div id="chat-title" style="display: none;"></div>
                        <div id="chat-allchats" style="display: none;"></div>
                    </div>
                </div>
                <div id="qrd-tree" class="lzm-dialog">
                    <div id="qrd-tree-headline" class="lzm-dialog-headline"></div>
                    <div id="qrd-tree-body" class="lzm-dialog-body"></div>
                    <div id="qrd-tree-footline" class="lzm-dialog-footline"></div>
                </div>
                <div id="operator-list" class="lzm-dialog">
                    <div id="operator-list-headline" class="lzm-dialog-headline"></div>
                    <div id="operator-list-body" class="lzm-dialog-body"></div>
                </div>
                <div id="ticket-list" class="lzm-dialog">
                    <div id="ticket-list-headline" class="lzm-dialog-headline"></div>
                    <div id="ticket-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="ticket-list-body" class="lzm-dialog-body"></div>
                    <div id="ticket-list-footline" class="lzm-dialog-footline"></div>
                </div>
                <div id="visitor-list" class="lzm-dialog">
                    <div id="visitor-list-headline" class="lzm-dialog-headline"></div>
                    <div id="visitor-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="visitor-list-table-div" class="lzm-dialog-body"></div>
                </div>
                <div id="archive" class="lzm-dialog">
                    <div id="archive-headline" class="lzm-dialog-headline"></div>
                    <div id="archive-headline2" class="lzm-dialog-headline2"></div>
                    <div id="archive-body" class="lzm-dialog-body"></div>
                    <div id="archive-footline" class="lzm-dialog-footline"></div>
                </div>
                <div id="startpage" class="lzm-dialog">
                    <div id="startpage-headline" class="lzm-dialog-headline"></div>
                    <div id="startpage-body" class="lzm-dialog-body"></div>
                </div>
                <div id="geotracking" class="lzm-dialog">
                    <div id="geotracking-headline" class="lzm-dialog-headline"></div>
                    <div id="geotracking-body" class="lzm-dialog-body"></div>
                    <div id="geotracking-footline" class="lzm-dialog-footline"></div>
                </div>
                <div id="report-list" class="lzm-dialog">
                    <div id="report-list-headline" class="lzm-dialog-headline"></div>
                    <div id="report-list-headline2" class="lzm-dialog-headline2"></div>
                    <div id="report-list-body" class="lzm-dialog-body"></div>
                    <div id="report-list-footline" class="lzm-dialog-footline"></div>
                </div>
            </div>
            <div id="errors" style="text-align:left;display:none;"></div>
        </div>
        <div id="test-length-div" style="visibility:hidden;"></div>
    </div> <!--article-->
</div>

<div id="minimized-window-menu" style="display: none;">
    <div id="minimized-window-list"></div>
    <div id="minimized-window-button" onclick="lzm_displayHelper.showMinimizedDialogsMenu(false, event);">
        <span id="minimized-window-button-inner"><i class="fa fa-chevron-down"></i></span>
    </div>
</div>

</body>
</html>