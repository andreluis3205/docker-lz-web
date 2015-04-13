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
    $acid = rand(10000, 99999);

    $emptyPage = "<!DOCTYPE HTML><html manifest='lzm.appcache'><head><title>Livezilla Mobile</title><meta http-equiv='Content-Type' content='text/html; charset=utf-8'/>" .
        "<script type='text/javascript'> window.addEventListener('load', function(e) { var myReloadUrl = document.URL, subsiteName = '', indexPage = '', acid = '" . $acid . "'; " .
        "var urlParts = myReloadUrl.split('#'); if (myReloadUrl.indexOf('#') != -1) { subsiteName = '#' + urlParts[1]; } " .
        "if (myReloadUrl.indexOf('index.php') == -1) { indexPage = '/index.php'; } " .
        "myReloadUrl = (urlParts[0].indexOf('?') == -1) ? urlParts[0] + indexPage + '?acid=' + acid : urlParts[0] + indexPage + '&acid=' + acid; " .
        "myReloadUrl = myReloadUrl.replace(/:\/\//g, ':~~').replace(/\/\//g, '/').replace(/:~~/g, '://')  + subsiteName; " .
        "document.location = myReloadUrl; });</script></head><body><noscript><div id='no-js-warning' style='display: block;'>" .
        "<div style='position: fixed; top: 0px; left: 0px; width: 100%; background-color: #111; border: 1px solid #333; color: #fff'>" .
        "<h1 style='font-size: 1.5em; margin: 5px; text-align: center;'>LiveZilla Mobile</h1>" .
        "</div><div style='margin-top: 69px; padding:42px; background: url(\"img/logo.png\"); background-position: center; background-repeat: no-repeat;'></div>" .
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

    <link rel="stylesheet" type="text/css" href="./js/jquery_mobile/jquery.mobile-1.3.0.min.css"/>
    <link rel="stylesheet" type="text/css" href="./css/livezilla.css"/>
    <link rel="shortcut icon" href="../images/favicon.ico" type="image/x-icon">

    <script type="text/javascript" src="./js/jquery-2.1.0.min.js"></script>
    <script type="text/javascript" src="./js/jquery-migrate-1.2.1.min.js"></script>
    <script type="text/javascript" src="./js/jquery_mobile/jquery.mobile-1.3.0.min.js"></script>

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
    <script type="text/javascript" src="./js/lzm/classes/CommonTranslationClass.js"></script>
    <script type="text/javascript" src="./js/lzm/index.js"></script>
    <script type="text/javascript">
        var translationData = <?php echo $jsLanguageData; ?>;

        var detectedLanguage = <?php echo "'".$language."'"; ?>;
        <?php
        #var translationData = [{"key": 'mobile_app_load_error1', "orig": 'An error occured while loading the web application.', "de": 'Beim Laden der Web-Anwendung ist ein Fehler aufgetreten.'}, {"key": 'mobile_app_load_error2', "orig": 'Check your server and the connection of your mobile device.', "de": 'Überprüfen Sie Ihren Server und die Netzwerkverbindung Ihres Mobilgerätes.'}, {"key": 'mobile_ok', "orig": 'Ok', "de": 'OK'}, {"key": 'mobile_app_load_error3', "orig": 'Loading the web application timed out.', "de": 'Das Laden der Web-Anwendung benötigte zu lange.'}, {"key": 'mobile_username2', "orig": 'Username:', "de": 'Anmeldename:'}, {"key": 'mobile_password2', "orig": 'Password:', "de": 'Passwort:'}, {"key": 'mobile_username', "orig": 'Username', "de": 'Anmeldename'}, {"key": 'mobile_password', "orig": 'Password', "de": 'Passwort'}, {"key": 'mobile_save_login_data', "orig": 'Save login data', "de": 'Anmelde-Daten speichern'}, {"key": 'mobile_auto_login', "orig": 'Autologin', "de": 'Bei jedem Start anmelden'}, {"key": 'mobile_login', "orig": 'Log in', "de": 'Anmelden'}, {"key": 'mobile_headline', "orig": 'LiveZilla Mobile', "de": 'LiveZilla Mobil'}, {"key": 'mobile_no_profile', "orig": 'No profile selected', "de": 'Kein Profil ausgewählt'}, {"key": 'mobile_xml_structure1', "orig": 'The server response had an invalid structure.', "de": 'Der Server lieferte eine ungültige Antwort.'}, {"key": 'mobile_xml_structure2', "orig": 'Either the server URL is wrong (presumably) or the server is not working properly.', "de": 'Entweder ist die URL des Servers nicht korrekt oder der Server antwortet nicht ordnungsgemäß.'}, {"key": 'mobile_server_not_responding', "orig": 'The server did not respond for more then <!--number_of_seconds--> seconds.', "de": 'Der Server antwortet nicht seit mehr als <!--number_of_seconds--> Sekunden.'}, {"key": 'mobile_connection_error1', "orig": 'Cannot connect to the LiveZilla Server. The target URI seems to be wrong or your network is down.', "de": 'Der LiveZilla-Server konnte nicht erreicht werden, die Ziel-URL ist falsch oder Ihr Netzwerk ist inaktiv.'}, {"key": 'mobile_connection_error2', "orig": 'Please check / validate the URI (Server Profile)', "de": 'WICHTIG: Überprüfen Sie die URL (Server-Profile)'}, {"key": 'mobile_connection_error3', "orig": 'Further information', "de": 'Weitere Informationen'}, {"key": 'mobile_connection_error4', "orig": 'The remote server has returned an error: (<!--http_error-->) <!--http_error_text-->', "de": 'Der Remoteserver hat einen Fehler zurückgegeben: (<!--http_error-->) <!--http_error_text-->'}, {"key": 'mobile_connection_error5', "orig": 'You need at least LiveZilla server version <!--config_version--> to run this app.', "de": 'Sie benötigen den LiveZilla-Server mindestens in Version <!--config_version-->, um diese App zu nutzen.'}, {"key": 'mobile_wrong_login_data', "orig": 'Wrong username or password.', "de": 'Benutzername oder Passwort falsch.'}, {"key": 'mobile_operator_logged_in', "orig": 'The operator <!--op_login_name--> is already logged in.', "de": 'Der Operator <!--op_login_name--> ist bereits angemeldet.'}, {"key": 'mobile_log_off_other', "orig": 'Do you want to log off the other instance?', "de": 'Möchten Sie sich trotzdem anmelden und den anderen Benutzer abmelden?'}, {"key": 'mobile_cancel', "orig": 'Cancel', "de": 'Abbrechen'}, {"key": 'mobile_logged_off', "orig": 'You\'ve been logged off by another operator!', "de": 'Sie wurden durch einen anderen Operator abgemeldet.'}, {"key": 'mobile_session_timeout', "orig": 'Session timed out.', "de": 'Die Session ist abgelaufen.'}, {"key": 'mobile_change_passwd_request', "orig": 'Your password has expired. Please enter a new password.', "de": 'Ihr Passwort ist abgelaufen. Bitte geben Sie ein neues Passwort ein.'}, {"key": 'mobile_not_admin', "orig": 'You are not an administrator.', "de": 'Sie sind kein Administrator.'}, {"key": 'mobile_server_deactivated1', "orig": 'This LiveZilla server has been deactivated by the administrator.', "de": 'Dieser LiveZilla-Server wurde vom Administrator deaktiviert.'}, {"key": 'mobile_server_deactivated2', "orig": 'If you are the administrator, please activate this server under LiveZilla Server Admin -> Server Configuration -> Server.', "de": 'Wenn Sie der Administrator sind, aktivieren Sie diesen Server bitte unter LiveZilla Server Admin -> Server Konfiguration -> Server.'}, {"key": 'mobile_db_connection_problem', "orig": 'There are problems with the database connection.', "de": 'Es bestehen Probleme mit der Datenbank-Verbindung.'}, {"key": 'mobile_server_only_https', "orig": 'This server requires secure connection (SSL). Please activate HTTPS in the server profile and try again.', "de": 'Dieser Server erlaubt keine unverschlüsselten Verbindungen. Bitte aktivieren Sie SSL (HTTPS) im Serverprofil.'}, {"key": 'mobile_account_deactivated', "orig": 'Your account has been deactivated by an administrator.', "de": 'Ihr Konto wurde durch einen Administrator deaktiviert.'}, {"key": 'mobile_no_mobile_access', "orig": 'No mobile access permitted.', "de": 'Der Mobil-Zugang ist nicht erlaubt.'}, {"key": 'mobile_max_op_number_reached', "orig": 'Maximum number of concurrent operators reached.', "de": 'Die maximale Anzahl an Operatoren ist bereits angemeldet.'}, {"key": 'mobile_local_storage_disabled', "orig": 'Your browser seems to have its local storage/cookies disabled.', "de": 'Bei Ihrem Browser sind der lokale Speicher bzw. die Cookies deaktiviert.'}, {"key": 'mobile_local_storag_and_cookies_warning', "orig": 'Since local storage and cookies are needed for this application, you have to enable the local storage/cookies in your browser settings and reload this page.', "de": 'Da der lokale Speicher und die Cookies für diese Anwendung benötigt werden, müssen Sie den lokalen Speicher/die Cookies in Ihren Browser-Einstellungen aktivieren und diese Seite neu laden.'}, {"key": 'mobile_new_profile', "orig": 'New profile', "de": 'Profil anlegen'}, {"key": 'mobile_edit_profile', "orig": 'Edit profile', "de": 'Profil ändern'}, {"key": 'mobile_delete_profile', "orig": 'Delete profile', "de": 'Profil löschen'}, {"key": 'mobile_server_profiles', "orig": 'Server Profiles', "de": 'Server-Profile'}, {"key": 'mobile_save_profile', "orig": 'Save profile', "de": 'Profil speichern'}, {"key": 'mobile_profile_name', "orig": 'Profile Name:', "de": 'Profilname:'}, {"key": 'mobile_server_protocol', "orig": 'Server Protocol', "de": 'Server-Protokoll'}, {"key": 'mobile_server_url', "orig": 'Server Url:', "de": 'Server-Url:'}, {"key": 'mobile_mobile_dir', "orig": 'Mobile Directory:', "de": 'Mobil-Verzeichnis:'}, {"key": 'mobile_server_port', "orig": 'Port', "de": ''}, {"key": 'mobile_server_version', "orig": 'Server version', "de": 'Server-Version'}, {"key": 'mobile_available', "orig": 'Available', "de": 'Verfügbar'}, {"key": 'mobile_busy', "orig": 'Busy', "de": 'Beschäftigt'}, {"key": 'mobile_offline', "orig": 'Offline', "de": 'Abgemeldet'}, {"key": 'mobile_away', "orig": 'Away', "de": 'Abwesend'}, {"key": 'mobile_message', "orig": 'Message', "de": 'Nachricht'}, {"key": 'mobile_change_password', "orig": 'Change Password', "de": 'Password ändern'}, {"key": 'mobile_old_pw_incorrect', "orig": 'Old password is not correct.', "de": 'Das bisherige Passwort ist inkorrekt.'}, {"key": 'mobile_new_pw_different_old_pw', "orig": 'New password must be different from old password.', "de": 'Das neue Passwort muss sich vom bisherigen unterscheiden.'}, {"key": 'mobile_pw_repetition_match', "orig": 'New password does not match with password repetition.', "de": 'Das neue Passwort stimmt nicht mit der Passwort-Wiederholung überein'}, {"key": 'mobile_change_pw_explanation', "orig": 'To change your password, enter your previous password and confirm the new password.', "de": 'Um das Passwort zu ändern, geben Sie das bisherige Passwort ein, geben Sie ein neues Passwort ein und wiederholen Sie dieses.'}, {"key": 'mobile_current_password', "orig": 'Current password:', "de": 'Bisheriges Passwort:'}, {"key": 'mobile_new_password', "orig": 'New password:', "de": 'Neues Passwort:'}, {"key": 'mobile_new_password_repetition', "orig": 'New password repetition:', "de": 'Neues Passwort (Wiederholung):'}, {"key": 'mobile_january', "orig": 'January', "de": 'Januar'}, {"key": 'mobile_february', "orig": 'February', "de": 'Februar'}, {"key": 'mobile_march', "orig": 'March', "de": 'März'}, {"key": 'mobile_april', "orig": 'April', "de": 'April'}, {"key": 'mobile_may', "orig": 'May', "de": 'Mai'}, {"key": 'mobile_june', "orig": 'June', "de": 'Juni'}, {"key": 'mobile_july', "orig": 'July', "de": 'Juli'}, {"key": 'mobile_august', "orig": 'August', "de": 'August'}, {"key": 'mobile_september', "orig": 'September', "de": 'September'}, {"key": 'mobile_october', "orig": 'October', "de": 'Oktober'}, {"key": 'mobile_november', "orig": 'November', "de": 'November'}, {"key": 'mobile_december', "orig": 'December', "de": 'Dezember'}, {"key": 'mobile_short_date', "orig": '<!--year-->-<!--month-->-<!--day-->', "de": '<!--day-->.<!--month-->.<!--year-->'}, {"key": 'mobile_long_date', "orig": '<!--month_name--> <!--day-->, <!--year-->', "de": '<!--day-->. <!--month_name--> <!--year-->'}, {"key": 'mobile_salutation_content', "orig": 'Hi', "de": 'Guten Tag'}, {"key": 'mobile_intro_phrase_content', "orig": 'Thanks for getting in touch with us.', "de": 'vielen Dank für Ihre Anfrage.'}, {"key": 'mobile_closing_phrase_content', "orig": 'If you have any questions, do not hesitate to contact us.', "de": 'Für weitere Fragen stehen wir Ihnen jederzeit zur Verfügung.'}, {"key": 'mobile_no_bg_mode1', "orig": 'Your LiveZilla app is not allowed to run, while the app is in the background.', "de": 'Ihre LiveZilla-App ist nicht berechtigt im Hintergrund zu laufen.'}, {"key": 'mobile_no_bg_mode2', "orig": 'Please change your device\'s Battery Saver settings.', "de": 'Bitte ändern Sie den Stromsparmodus-Einstellungen Ihres Gerätes.'}, {"key": 'mobile_no_bg_mode3', "orig": 'Otherwise you won\'t receive any chats, while your app is in the background.', "de": 'Sonst werden Sie keine eingehenden Nachrichten und Chats empfangen, wenn die App im Hintergrund läuft.'}];
        #var detectedLanguage = 'en';
        #if (typeof navigator.language != 'undefined') {
        #    detectedLanguage = navigator.language;
        #} else if (typeof navigator.userLanguage != 'undefined') {
        #    detectedLanguage = navigator.userLanguage;
        #}
        #if (detectedLanguage.indexOf('-') != -1) {
        #    detectedLanguage = detectedLanguage.split('-')[0] + '-' + detectedLanguage.split('-')[1].toLowerCase();
        #} else if (detectedLanguage.indexOf('_') != -1) {
        #    detectedLanguage = detectedLanguage.split('_')[0] + '-' + detectedLanguage.split('_')[1].toLowerCase();
        #}
        ?>
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
    <div style="position: fixed; top: 0px; left: 0px; width: 100%; background-color: #111; border: 1px solid #333; color: #fff">
        <h1 style="font-size: 1.5em; margin: 5px; text-align: center;">LiveZilla Mobile</h1>
    </div>
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
<div id="login_page" data-role="page" style="display: none;">
    <header id="header_login" data-role="header" data-position="fixed">
        <h1 id="headline1" style="margin: 0.6em;"></h1>
    </header>
    <div id="content_login" data-role="content" style="overflow: visible;"> <!--article-->
        <div id="logo-container"></div>
        <div class="lzg-form" id="input-container">
            <div class="login-data" style="display: block;" id="login-data-container"></div>
            <div class="login-data" style="display: block; margin-top: 20px; text-align: right;" id="login-button-container"></div>
        </div>
        <form id="data-submit-form" method="post" data-ajax="false">
        </form>
    </div> <!--article-->
</div>

</body>
</html>
