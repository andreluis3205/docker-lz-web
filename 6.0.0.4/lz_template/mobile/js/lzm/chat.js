/****************************************************************************************
 * LiveZilla chat.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
var lzm_commonConfig = {};
var lzm_commonTools = {};
lzm_commonPermissions = {};
var lzm_commonStorage = {};
var lzm_chatTimeStamp = {};
var lzm_chatDisplay = {};
var lzm_displayHelper = {};
var lzm_displayLayout = {};
var lzm_chatServerEvaluation = {};
var lzm_chatPollServer = {};
var lzm_chatUserActions = {};
var lzm_commonDialog = {};
var lzm_t = {};
var loopCounter = 0;
var lzm_chatInputEditor;
var messageEditor;
var qrdTextEditor;
var visitorsStillNeeded = [];
var deviceId = 0;
var debugBackgroundMode = false;
var debuggingLogContent = '';
var debuggingFoo = '';
var ticketLineClicked = 0;
var mobile;
var lastTypingEvent = 0;
var controlPressed = false;
var runningInIframe = false;
var cookieCredentialsAreSet = false;
var chatMessageEditorIsPresent = false;
var errorLogs = [];
var vsPanelTouchPos = null;
var doBlinkTitle = true;
var blinkTitleStatus = 0;
var blinkTitleMessage = '';
var printWindow = null;
var shortCutResources = [];
var lastOpListClick = [null, 0];
var quickSearchReady = false;

var iframeEnabled = false;

var debuggingGetDate = function() {
    var myDate = new Date();
    return myDate.getSeconds() * 1000 + myDate.getMilliseconds();
};

var views = [];

var debuggingDisplayHeight = 0;
if ((app == 1) && (appOs == 'ios' || appOs == 'windows')) {
    var console = {};
    console.log = function(myString) {
        try {
            lzm_deviceInterface.jsLog(myString, 'log');
        } catch(ex) {

        }
    };
    console.info = function(myString) {
        try {
            lzm_deviceInterface.jsLog(myString, 'info');
        } catch(ex) {
        }
    };
    console.warn = function(myString) {
        try {
            lzm_deviceInterface.jsLog(myString, 'warn');
        } catch(ex) {
        }
    };
    console.error = function(myString) {
        try {
            lzm_deviceInterface.jsLog(myString, 'error');
        } catch(ex) {
        }
    };
}

/**************************************** Device interface functions ****************************************/
var windowsCallbackFunction = function (myCallbackString) {
    myCallbackString = myCallbackString.replace(/\n/g, '').replace(/\r/g, '');
    eval(myCallbackString);
};

var windowsGetPollDataObject = function() {
    var postUrl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url + '/server.php?acid=' +
        lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
    if (multiServerId != '') {
        postUrl += '&ws=' + multiServerId;
    }
    var myJsonDataObject = JSON.stringify(lzm_chatPollServer.fillDataObject());
    return lz_global_base64_encode(postUrl) + '~' + lz_global_base64_encode(myJsonDataObject);
};

var savePreviousChats = function(action, userChats) {
    var rtValue = 'error';
    if (action == 'backup') {
        userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
        var backupChats = {};
        for (var x in userChats) {
            if (userChats.hasOwnProperty(x)) {
                if (userChats[x].status != 'left' && userChats[x].status != 'declined') {
                    backupChats[x] = userChats[x];
                }
            }
        }
        rtValue = JSON.stringify(backupChats);
    } else if (action == 'restore') {
        userChats = JSON.parse(userChats);
        lzm_chatServerEvaluation.userChats.restoreUserChats(userChats);
        rtValue = 'restored';
    }
    return rtValue;
};

// functions called by iOs app
function webAppHasLoadedCorrectly() {
    return 'LiveZilla';
}

/**************************************** Hash functions ****************************************/
if (typeof CryptoJS.SHA256 != 'undefined') {
    var sha256 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.SHA256(str).toString();
    };
}

if (typeof CryptoJS.SHA1 != 'undefined') {
    var sha1 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.SHA1(str).toString();
    };
}

if (typeof CryptoJS.MD5 != 'undefined') {
    var md5 = function(str) {
        str = (typeof str == 'undefined') ? 'undefined' : (str == null) ? 'null' : str.toString();
        return CryptoJS.MD5(str).toString();
    };
}

/**************************************** Debugging functions ****************************************/
function forceResizeNow() {
    lzm_chatDisplay.createViewSelectPanel();
    lzm_chatDisplay.createChatWindowLayout(true);
}

function debuggingEditorClicked() {
    logit('Click!');
}

function debuggingStartStopPolling() {
    var tmpDate = lzm_chatTimeStamp.getLocalTimeObject();
    var tmpHumanTime = lzm_commonTools.getHumanDate(tmpDate, 'time', lzm_chatDisplay.userLanguage);
    if (lzm_chatPollServer.poll_regularly) {
        lzm_chatPollServer.stopPolling();
        logit(tmpHumanTime + ' - Polling stopped!');
        debugBackgroundMode = true;
    } else {
        lzm_chatPollServer.startPolling();
        logit(tmpHumanTime + ' - Polling started!');
        debugBackgroundMode = false;
    }
}

function debuggingResetViewSelectPanel() {
    lzm_chatDisplay.viewSelectArray = [{"id":"archive","name":"Chat-Archiv"},{"id":"mychats","name":"Meine Chats"},
        {"id":"tickets","name":"Tickets"},{"id":"external","name":"Besucher"},
        {"id":"internal","name":"Operatoren"},{"id":"qrd","name":"Knowledgebase"}];
    lzm_chatDisplay.showViewSelectPanel = {"mychats":1,"tickets":1,"external":1,"internal":0,"qrd":0,"archive":0};
    lzm_chatDisplay.createViewSelectPanel('mychats')
}

function logit(myObject, myLevel) {
    var myError = (new Error).stack;
    var callerFile = '', callerLine = '';
    try {
        var callerInfo = myError.split('\n')[2].split('(')[1].split(')')[0].split(':');
        callerFile = callerInfo[0] + ':' + callerInfo[1];
        callerLine = callerInfo[2];
    } catch(e) {}
    if(debug) {
        try {
            console.log(myObject);
            console.log('at line ' + callerLine + ' in ' + callerFile);
        } catch(e) {}
        myLevel = (typeof myLevel != 'undefined') ? myLevel.toUpperCase() : 'WARNING';
        if (debuggingLogContent == '') {
            debuggingLogContent = myObject;
        }
        var message = 'Not readable object content';
        try {
            message = JSON.stringify(myObject);
        } catch(e) {
            if (typeof myObject.outerHTML != 'undefined') {
                message = JSON.stringify(myObject.outerHTML);
            }
        }

        var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
        var postUrl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url +
                '/mobile/logit.php?acid=' + acid;
        var myDataObject = {'time': lzm_chatTimeStamp.getServerTimeString(null, true), 'level': myLevel, 'message': message, 'file': callerFile, 'line': callerLine};
        $.ajax({
            type: "POST",
            url: postUrl,
            data: myDataObject,
            timeout: lzm_commonConfig.pollTimeout,
            success: function (data) {},
            error: function (jqXHR, textStatus, errorThrown) {
                try {
                    console.log('Error while sending log to the server!');
                } catch(e) {}
            },
            dataType: 'text'
        });
    } else {
        try {
            console.log(myObject);
            console.log('at line ' + callerLine + ' in ' + callerFile);
        } catch(e) {}
    }
    return null;
}

/**************************************** Some general functions ****************************************/
function showAppIsSyncing() {
    lzm_displayHelper.blockUi({message: t('Syncing data...')});
}

function chatInputEnterPressed() {
    var useResource = '';
    for (var i=0; i<shortCutResources.length; i++) {
        if (shortCutResources[i].complete) {
            useResource = shortCutResources[i].id;
            break;
        }
    }
    var edContent = grabEditorContents();
    if (useResource != '') {
        var resource = lzm_chatServerEvaluation.cannedResources.getResource(useResource);
        if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) &&
            lzm_chatUserActions.active_chat_reco != '') {
            sendQrdPreview(useResource, lzm_chatUserActions.active_chat_reco);
        } else if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) &&
            lzm_chatUserActions.active_chat_reco == '') {

        } else {
            useEditorQrdPreview(useResource);
        }
    } else if (!quickSearchReady && edContent.indexOf('/') == 0) {

    } else {
        quickSearchReady = false;
        var cpId = $('#chat-input-body').data('cp-id');
        sendTranslatedChat(edContent, cpId);
    }
}

function doNothing() {
    // Dummy function that does nothing!
    // Needed for editor events
}

function chatInputBodyClicked() {
    var id, b_id, user_id, name;
    if(lzm_chatDisplay.active_chat_reco.indexOf('~') != -1) {
        id = lzm_chatDisplay.active_chat_reco.split('~')[0];
        b_id = lzm_chatDisplay.active_chat_reco.split('~')[1];
        viewUserData(id, b_id, 0, true);
    } else {
        if (lzm_chatDisplay.active_chat_reco == "everyoneintern") {
            id = lzm_chatDisplay.active_chat_reco;
            user_id = lzm_chatDisplay.active_chat_reco;
            name = lzm_chatDisplay.active_chat_realname;
        } else if(typeof lzm_chatDisplay.thisUser.userid == 'undefined') {
            id = lzm_chatDisplay.active_chat_reco;
            user_id = lzm_chatDisplay.active_chat_reco;
            name = lzm_chatDisplay.active_chat_reco;
        } else {
            id = lzm_chatDisplay.active_chat_reco;
            user_id = lzm_chatDisplay.thisUser.userid;
            name = lzm_chatDisplay.thisUser.name;
        }
        chatInternalWith(id, user_id, name);
    }
}

function chatInputTyping(e) {
    var i = 0;
    if (typeof e != 'undefined' && (typeof e.which == 'undefined' || (e.which != 13 && e.which != 0)) &&
        (typeof e.keyCode == 'undefined' || (e.keyCode != 13 && e.keyCode != 0))) {
        lastTypingEvent = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        if (lzm_chatDisplay.qrdAutoSearch == 1) {
            quickSearchReady = false;
            shortCutResources = [];
            setTimeout(function() {
                var typingNow = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                $('#chat-qrd-preview').html('');
                if (typingNow - lastTypingEvent > 450) {
                    var editorContents = grabEditorContents().replace(/<.*?>/g, '');
                    if (editorContents.length > 1) {
                        var frequentlyUsedResources = lzm_chatServerEvaluation.cannedResources.getResourceList('usage_counter', {ty: '1,2,3,4', text: editorContents, ti: editorContents, s: editorContents});
                        var maxIterate = Math.min(10, frequentlyUsedResources.length), furHtml = '';
                        if ($('#chat-progress').height() > 200 && frequentlyUsedResources.length > 0) {
                            furHtml += '<table style="width: 100%">';
                            for (i=0; i<maxIterate; i++) {
                                var resourceText = (frequentlyUsedResources[i].ty == 1) ? frequentlyUsedResources[i].text.replace(/<.*?>/g, '') :
                                    (frequentlyUsedResources[i].ty == 2) ? frequentlyUsedResources[i].ti + ' (' + frequentlyUsedResources[i].text + ')' :
                                    frequentlyUsedResources[i].ti.replace(/<.*?>/g, '');
                                if (editorContents.indexOf('/') == 0 && ('/' + frequentlyUsedResources[i].s.toLowerCase()).indexOf(editorContents.toLowerCase()) == 0) {
                                    resourceText = '<td class="editor-preview-shortcut" id="editor-preview-shortcut-' + frequentlyUsedResources[i].rid +'">' +
                                        frequentlyUsedResources[i].s + '&nbsp;</td>' +
                                        '<td class="editor-preview-cell"><div class="editor-preview-inner">' + resourceText + '</div></td>';
                                    shortCutResources.push({id: frequentlyUsedResources[i].rid, complete: false});
                                } else {
                                    resourceText = '<td colspan="2" class="editor-preview-cell"><div class="editor-preview-inner">' + resourceText +'</div></td>';
                                }
                                furHtml += '<tr class="lzm-unselectable" style="cursor: pointer;" onclick="useEditorQrdPreview(\'' + frequentlyUsedResources[i].rid + '\');">' +
                                    resourceText + '</tr>';
                            }
                            furHtml += '</table>';
                            $('#chat-qrd-preview').html(furHtml);
                            lzm_chatDisplay.createChatWindowLayout(true);
                            var previewHeight = $('#chat-qrd-preview').height();
                            $('#chat-progress').css({'bottom': (80 + previewHeight) + 'px'});
                            $('#chat-progress').scrollTop($('#chat-progress')[0].scrollHeight);
                            $('.editor-preview-inner').css({'max-width': ($('#chat-qrd-preview').width() - $('.editor-preview-shortcut').width() - 14)+'px'});
                            for (i=0; i<shortCutResources.length; i++) {
                                var resource = lzm_chatServerEvaluation.cannedResources.getResource(shortCutResources[i].id);
                                if (resource != null && '/' + resource.s == editorContents) {
                                    $('#editor-preview-shortcut-' + shortCutResources[i].id).css({color: '#5197ff'});
                                    shortCutResources[i].complete = true;
                                } else {
                                    $('#editor-preview-shortcut-' + shortCutResources[i].id).css({color: '#333333'});
                                    shortCutResources[i].complete = false;
                                }
                            }
                            quickSearchReady = true;
                        } else {
                            $('#chat-progress').css({'bottom': '80px'});
                            shortCutResources = [];
                            quickSearchReady = true;
                        }
                    } else {
                        $('#chat-progress').css({'bottom': '80px'});
                        shortCutResources = [];
                        quickSearchReady = true;
                    }
                }
            }, 500);
        }
        lzm_chatPollServer.typingPollCounter = 0;
        lzm_chatPollServer.typingChatPartner = lzm_chatDisplay.active_chat_reco;
    } else if (typeof e != 'undefined' && (typeof e.which == 'undefined' || e.which != 0) &&
        (typeof e.keyCode == 'undefined' || e.keyCode != 0)) {
        $('#chat-qrd-preview').html('');
        $('#chat-progress').css({'bottom': '80px'});
        shortCutResources = [];
        quickSearchReady = true;
        lzm_chatDisplay.createChatWindowLayout(true);
    }
}

function slowDownPolling(doSlowDown, secondCall) {
    secondCall = (typeof secondCall != 'undefined') ? secondCall : false;
    if (doSlowDown) {
        if (lzm_chatPollServer.slowDownPolling1 > lzm_chatPollServer.slowDownPolling2) {
            lzm_chatPollServer.slowDownPolling = true;
            lzm_chatPollServer.startPolling();
        } else if (!secondCall) {
            lzm_chatPollServer.slowDownPolling1 = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
            setTimeout(function() {
                slowDownPolling(true, true);
            }, 20000);
        }
    } else {
        lzm_chatPollServer.slowDownPolling = false;
        lzm_chatPollServer.slowDownPolling2 = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        lzm_chatPollServer.startPolling();
    }
}

function setAppBackground(isInBackground) {
    if (isInBackground) {
        lzm_chatPollServer.appBackground = 1;
        lzm_chatPollServer.startPolling();
    } else {
        lzm_chatPollServer.appBackground = 0;
        lzm_chatPollServer.startPolling();
    }
}

function setAppVersion(versionName) {
    lzm_commonConfig.lz_app_version = versionName;
}

function startBackgroundTask() {
    try {
        lzm_deviceInterface.startBackgroundTask();
    } catch(ex) {}
}

function setLocation(latitude, longitude) {
    lzm_chatPollServer.location = {latitude: latitude, longitude: longitude};
}

function stopPolling() {
    lzm_chatPollServer.stopPolling();
}

function startPolling() {
    lzm_chatPollServer.startPolling();
}

function resetWebApp() {
    showAppIsSyncing();
    lzm_chatServerEvaluation.resetWebApp();
    lzm_chatUserActions.resetWebApp();
    lzm_chatPollServer.resetWebApp();
    lzm_chatDisplay.resetWebApp();
    lzm_chatDisplay.createViewSelectPanel();

    lzm_chatPollServer.lastCorrectServerAnswer = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
}

function logout(askBeforeLogout, logoutFromDeviceKey, e) {
    if (typeof e != 'undefined') {
        e.stopPropagation()
    }
    logoutFromDeviceKey = (typeof logoutFromDeviceKey != 'undefined') ? logoutFromDeviceKey : false;
    lzm_chatDisplay.showUsersettingsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    var doLogoutNow = function() {
        lzm_chatDisplay.stopRinging([]);
        lzm_commonStorage.saveValue('qrd_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatServerEvaluation.cannedResources.getResourceList()));
        lzm_commonStorage.saveValue('qrd_request_time_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatServerEvaluation.resourceLastEdited));
        lzm_commonStorage.saveValue('qrd_id_list_' + lzm_chatServerEvaluation.myId, JSON.stringify([]));
        lzm_commonStorage.saveValue('ticket_max_read_time_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketMaxRead));
        lzm_commonStorage.saveValue('ticket_read_array_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.ticketReadArray));
        lzm_commonStorage.saveValue('ticket_unread_array_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.ticketUnreadArray));
        lzm_commonStorage.saveValue('ticket_filter_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketFilter));
        lzm_commonStorage.saveValue('ticket_filter_channel_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketFilterChannel));
        lzm_commonStorage.saveValue('ticket_sort_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketSort));
        lzm_commonStorage.saveValue('email_read_array_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.emailReadArray));
        lzm_commonStorage.saveValue('accepted_chats_' + lzm_chatServerEvaluation.myId, lzm_chatUserActions.acceptedChatCounter);
        lzm_commonStorage.saveValue('qrd_search_categories_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.resourcesDisplay.qrdSearchCategories));
        lzm_commonStorage.saveValue('qrd_recently_used_' + lzm_chatServerEvaluation.myId, JSON.stringify([]));
        lzm_commonStorage.deleteKeyValuePair('qrd_recently_used' + lzm_chatServerEvaluation.myId);
        lzm_commonStorage.saveValue('qrd_selected_tab_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.resourcesDisplay.selectedResourceTab));
        lzm_commonStorage.saveValue('archive_filter_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.chatArchiveFilter));
        lzm_commonStorage.saveValue('first_visible_view_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.firstVisibleView));
        lzm_commonStorage.saveValue('ticket_filter_personal_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketFilterPersonal));
        lzm_commonStorage.saveValue('ticket_filter_group_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatPollServer.ticketFilterGroup));
        lzm_commonStorage.saveValue('show_offline_operators_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.showOfflineOperators));
        lzm_commonStorage.saveValue('last_phone_protocol_' + lzm_chatServerEvaluation.myId, JSON.stringify(lzm_chatDisplay.ticketDisplay.lastPhoneProtocol));
        lzm_chatDisplay.askBeforeUnload = false;
        lzm_displayHelper.blockUi({message: t('Signing off...')});
        lzm_chatPollServer.logout();
        setTimeout(function() {
            if (!lzm_chatPollServer.serverSentLogoutResponse) {
                lzm_chatPollServer.finishLogout();
            }
        }, 10000);
    };
    var showConfirmDialog = function(confirmText) {
        lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function() {
            doLogoutNow();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    };
    if (askBeforeLogout) {
        if (logoutFromDeviceKey) {
            if (lzm_chatDisplay.openChats.length == 0) {
                showConfirmDialog(t('Do you really want to log out?'));
            } else {
                showConfirmDialog(t('There are still open chats, do you want to leave them?'));
            }
        } else {
            if (lzm_chatDisplay.openChats.length != 0) {
                showConfirmDialog(t('There are still open chats, do you want to leave them?'));
            } else {
                doLogoutNow();
            }
        }
    } else {
        doLogoutNow();
    }
}

function catchEnterButtonPressed(e) {
        lzm_chatDisplay.catchEnterButtonPressed(e);
}

function doMacMagicStuff() {
    if (app == 0) {
        $(window).trigger('resize');
        setTimeout(function() {
            lzm_chatDisplay.createHtmlContent(lzm_chatPollServer.thisUser, lzm_chatDisplay.active_chat_reco);
            lzm_chatDisplay.createViewSelectPanel();
            lzm_chatDisplay.createChatWindowLayout(true);
        }, 10);
    }
}

function preventDefaultContextMenu(e) {
    e.stopPropagation();
    e.preventDefault();
}

function testDrag(change) {
    var thisVisitorList = $('#visitor-list');
    if (typeof change == 'undefined' || change == '' || change == 0) {
        var y = window.event.pageY;
        lzm_chatDisplay.visitorListHeight = thisVisitorList.height() + $('#chat').position().top + thisVisitorList.position().top - y + 11;
    } else {
        var newHeight = lzm_chatDisplay.visitorListHeight + change;
        if (newHeight >= 62) {
            lzm_chatDisplay.visitorListHeight = newHeight;
        }
    }
    lzm_chatDisplay.createViewSelectPanel();
    lzm_chatDisplay.createChatWindowLayout(true);
    if (lzm_chatDisplay.selected_view == 'external') {
        lzm_chatDisplay.visitorDisplay.createVisitorList();
    }
    lzm_chatDisplay.createChatHtml(lzm_chatDisplay.thisUser, lzm_chatDisplay.active_chat_reco);
    return false;
}

function t(translateString, placeholderArray) {
    return lzm_t.translate(translateString, placeholderArray);
}

function closeOrMinimizeDialog() {
    $('#minimize-dialog').click();
    $('#close-dialog').click()
}

function fillStringsFromTranslation() {
    if (loopCounter > 49 || lzm_t.translationArray.length != 0) {
        for (var i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
            //Use untranslated strings here. The translation is done when creating the panel!
            if (lzm_chatDisplay.viewSelectArray[i].id == 'mychats')
                lzm_chatDisplay.viewSelectArray[i].name = 'Chats';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'tickets')
                lzm_chatDisplay.viewSelectArray[i].name = 'Tickets';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'external')
                lzm_chatDisplay.viewSelectArray[i].name = 'Visitors';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'archive')
                lzm_chatDisplay.viewSelectArray[i].name = 'Chat Archive';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'internal')
                lzm_chatDisplay.viewSelectArray[i].name = 'Operators';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'qrd')
                lzm_chatDisplay.viewSelectArray[i].name = 'Knowledgebase';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'filter')
                lzm_chatDisplay.viewSelectArray[i].name = 'Filter';
            if (lzm_chatDisplay.viewSelectArray[i].id == 'world')
                lzm_chatDisplay.viewSelectArray[i].name = 'Map';
        }
        lzm_chatDisplay.createViewSelectPanel();
    } else {
        loopCounter++;
        setTimeout(function() {fillStringsFromTranslation();}, 50);
    }
}

function openLink(url, e) {
    if (typeof e != 'undefined') {
        e.preventDefault();
    }
    if (app == 1) {
        try {
            lzm_deviceInterface.openExternalBrowser(url);
        } catch(ex) {
            logit('Opening device browser failed');
        }
    } else if (web == 1) {
        window.open(url, '_blank');
    }
}

function downloadFile(address) {
    if (app == 1) {
        try {
            lzm_deviceInterface.openFile(address);
        } catch(ex) {
            logit('Downloading file in device failed');
        }
    } else if (web == 1) {
        window.open(address, '_blank');
    }
}

function tryNewLogin(logoutOtherInstance) {
    lzm_chatPollServer.stopPolling();
    lzm_chatPollServer.pollServerlogin(lzm_chatPollServer.chosenProfile.server_protocol,lzm_chatPollServer.chosenProfile.server_url, logoutOtherInstance);
}

function minimizeDialogWindow(dialogId, windowId) {
    try {
        if (typeof lzm_chatDisplay.dialogData.editors != 'undefined') {
            for (var i=0; i<lzm_chatDisplay.dialogData.editors.length; i++) {
                if (typeof window[lzm_chatDisplay.dialogData.editors[i].instanceName] != 'undefined') {
                    lzm_chatDisplay.dialogData.editors[i].text = window[lzm_chatDisplay.dialogData.editors[i].instanceName].grabHtml();
                    window[lzm_chatDisplay.dialogData.editors[i].instanceName].removeEditor();
                }
            }
        }
    } catch(e) {}
    var selectedView = (lzm_chatDisplay.dialogData['no-selected-view'] == true) ? '' : lzm_chatDisplay.selected_view;
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
    if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
        var chatText = loadChatInput(lzm_chatDisplay.active_chat_reco);
        initEditor(chatText, 'minimzeDialogWindow', lzm_chatDisplay.active_chat_reco);
    }

    lzm_displayHelper.minimizeDialogWindow(dialogId, windowId, lzm_chatDisplay.dialogData, selectedView);
}

function maximizeDialogWindow(dialogId) {
    lzm_displayHelper.maximizeDialogWindow(dialogId);
}


function blinkPageTitle(message) {
    doBlinkTitle = true;
    blinkTitleMessage = message;
    blinkTitleStatus = 0;
}

function debuggingShowDisplayHeight() {
    if ($(window).height() != debuggingDisplayHeight) {
        debuggingDisplayHeight = $(window).height();
        if (app == 1) {
            lzm_deviceInterface.showToast($(window).height());
        } else {
            logit($(window).height());
        }
    }
}

function getCredentials() {
    var cookieName = 'lzm-credentials';
    var cookieValue = document.cookie;
    var cookieStart = (cookieValue.indexOf(" " + cookieName + "=") != -1) ? cookieValue.indexOf(" " + cookieName + "=") : cookieValue.indexOf(cookieName + "=");
    var cookieEnd = 0;
    if (cookieStart == -1) {
        cookieValue = {'login_name': '', 'login_passwd': ''};
    } else {
        cookieStart = cookieValue.indexOf("=", cookieStart) + 1;
        cookieEnd = (cookieValue.indexOf(";", cookieStart) != -1) ? cookieValue.indexOf(";", cookieStart) : cookieValue.length;
        cookieValue = cookieValue.substring(cookieStart,cookieEnd);
        if (cookieValue.indexOf('%7E') != -1) {
            cookieCredentialsAreSet = (lz_global_base64_url_decode(cookieValue.split('%7E')[0]) != '' && cookieValue.split('%7E')[1] != '');
            cookieValue = {
                'login_name': lz_global_base64_url_decode(cookieValue.split('%7E')[0]),
                'login_passwd': cookieValue.split('%7E')[1]
            };
        } else {
            var ln = '', lp = '';
            if (typeof chosenProfile.lzmvcode != 'undefined' && chosenProfile.lzmvcode != '') {
                cookieCredentialsAreSet = true;
                ln = lz_global_base64_url_decode(lz_global_base64_url_decode(chosenProfile.lzmvcode).split('~')[0]);
                lp = lz_global_base64_url_decode(chosenProfile.lzmvcode).split('~')[1];
                }
            cookieValue = {'login_name': ln, 'login_passwd': lp};
        }
    }

    chosenProfile.login_name = cookieValue.login_name;
    chosenProfile.login_passwd = cookieValue.login_passwd;

    // Call this twice for some unknown reason...
    deleteCredentials();
    deleteCredentials();
}

function deleteCredentials() {
    var cookieName = 'lzm-credentials';
    var completeCookieValue = document.cookie;
    var cookieStart = (completeCookieValue.indexOf(" " + cookieName + "=") != -1) ? completeCookieValue.indexOf(" " + cookieName + "=") : completeCookieValue.indexOf(cookieName + "=");
    var cookieEnd = 0;
    if (cookieStart == -1) {
        return false;
    } else {
        cookieStart = completeCookieValue.indexOf("=", cookieStart) + 1;
        cookieEnd = (completeCookieValue.indexOf(";", cookieStart) != -1) ? completeCookieValue.indexOf(";", cookieStart) : completeCookieValue.length;
        var cookieValue = completeCookieValue.substring(cookieStart,cookieEnd);
        var pattern = new RegExp(cookieName + '=' + cookieValue,'');
        completeCookieValue = completeCookieValue.replace(pattern, cookieName + '=0');
        document.cookie = completeCookieValue;

        return true;
    }
}

function handleContextMenuClick(e) {
    e.stopPropagation();
}

function showNotMobileMessage() {
    var alertText =  t('This functionality is not available on mobile devices.');
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showNotOnDevice() {
    var alertText = t('This functionality is not available on your device.');
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showNoPermissionMessage() {
    var alertText =  t('You have no permission for this action. Permissions can be granted in the User Management panel (LiveZilla Server Admin)');
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showNoAdministratorMessage() {
    var alertText =  t('You need to be a Server Administrator for this action.');
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function showOutsideOpeningMessage(groupName) {
    var alertText = (typeof groupName == 'undefined' || groupName == '') ? t('This action cannot be performed outside of opening hours.') :
        t('<!--group_name--> is outside of opening hours. Please select another group.', [['<!--group_name-->', groupName]]);
    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);

    $('#alert-btn-ok').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function handleWindowResize(scrollDown) {
    lzm_chatDisplay.createViewSelectPanel();
    lzm_chatDisplay.createChatWindowLayout(true);
    var thisChatProgress = $('#chat-progress');
    if (scrollDown) {
        setTimeout(function() {
            thisChatProgress.scrollTop(thisChatProgress[0].scrollHeight);
        }, 10);
    }
}

// Extend the standard regexp functionality
RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function capitalize(myString) {
    myString = myString.replace(/^./, function (char) {
        return char.toUpperCase();
    });
    return myString;
}

/**************************************** Resources functions ****************************************/
function useEditorQrdPreview(resourceId) {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId), resourceHtmlText;
    if (resource != null) {
        lzm_chatServerEvaluation.cannedResources.riseUsageCounter(resourceId);
        switch (resource.ty) {
            case '1':
                resourceHtmlText = ((app == 1) || isMobile) ? resource.text.replace(/<.*?>/g, '') : resource.text;
                break;
            case '2':
                var linkHtml = '<a href="' + resource.text + '" class="lz_chat_link" target="_blank">' + resource.ti + '</a>';
                resourceHtmlText = ((app == 1) || isMobile) ? resource.text : linkHtml;
                break;
            default:
                var urlFileName = encodeURIComponent(resource.ti.replace(/ /g, '+').replace(/<.*?>/g, ''));
                var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
                var fileId = resource.text.split('_')[1];
                var thisServer = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url;
                var thisFileUrl = thisServer + '/getfile.php?';
                if (multiServerId != '') {
                    thisFileUrl += 'ws=' + multiServerId + '&';
                }
                thisFileUrl += 'acid=' + acid + '&file=' + urlFileName + '&id=' + fileId;
                var fileHtml = '<a ' +
                    'href="' + thisFileUrl + '" ' +
                    'class="lz_chat_file" target="_blank">' + resource.ti.replace(/<.*?>/g, '') + '</a>';
                resourceHtmlText = ((app == 1) || isMobile) ? thisFileUrl : fileHtml;
                break;
        }
        setEditorContents(resourceHtmlText);
        setFocusToEditor();
        shortCutResources = [];
    }
    $('#chat-qrd-preview').html('');
}

function openOrCloseFolder(resourceId, onlyOpenFolders) {
    var folderDiv = $('#folder-' + resourceId);
    if (folderDiv.html() != "") {
        var markDiv = $('#resource-' + resourceId + '-open-mark');
        if (folderDiv.css('display') == 'none') {
            folderDiv.css('display', 'block');
            markDiv.html('<i class="fa fa-minus-square-o"></i>');
            if ($.inArray(resourceId, lzm_chatDisplay.resourcesDisplay.openedResourcesFolder) == -1) {
                lzm_chatDisplay.resourcesDisplay.openedResourcesFolder.push(resourceId);
            }
        } else if (!onlyOpenFolders) {
            folderDiv.css('display', 'none');
            markDiv.html('<i class="fa fa-plus-square-o"></i>');
            var tmpOpenedFolder = [];
            for (var i=0; i<lzm_chatDisplay.resourcesDisplay.openedResourcesFolder.length; i++) {
                if (resourceId != lzm_chatDisplay.resourcesDisplay.openedResourcesFolder[i]) {
                    tmpOpenedFolder.push(lzm_chatDisplay.resourcesDisplay.openedResourcesFolder[i]);
                }
            }
            lzm_chatDisplay.resourcesDisplay.openedResourcesFolder = tmpOpenedFolder;
        }
    }
}

function handleResourceClickEvents(resourceId, onlyOpenFolders) {
    removeQrdContextMenu();
    onlyOpenFolders = (typeof onlyOpenFolders != 'undefined') ? onlyOpenFolders : false;
    lzm_chatDisplay.selectedResource = resourceId;
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId);
    if (resource != null) {
        var parentFolder = lzm_chatServerEvaluation.cannedResources.getResource(resource.pid);
        $('.resource-div').removeClass('selected-resource-div');
        $('.qrd-search-line').removeClass('selected-table-line');
        $('.qrd-recently-line').removeClass('selected-table-line');
        $('.resource-open-mark').removeClass('resource-open-mark-selected');
        $('.resource-icon-and-text').removeClass('resource-icon-and-text-selected');
        lzm_chatDisplay.resourcesDisplay.highlightSearchResults(lzm_chatServerEvaluation.cannedResources.getResourceList(), false);
        $('#resource-' + resourceId).addClass('selected-resource-div');
        $('#qrd-search-line-' + resourceId).addClass('selected-table-line');
        $('#qrd-recently-line-' + resourceId).addClass('selected-table-line');
        $('#resource-' + resourceId + '-open-mark').addClass('resource-open-mark-selected');
        $('#resource-' + resourceId + '-icon-and-text').addClass('resource-icon-and-text-selected');
        $('.qrd-change-buttons').addClass('ui-disabled');
        switch (parseInt(resource.ty)) {
            case 0:
                openOrCloseFolder(resourceId, onlyOpenFolders);
                if (resourceId != '1' && lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_chatDisplay.resourcesDisplay.selectedResourceTab == 0 && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-qrd').removeClass('ui-disabled');
                }
                if (resourceId != '1' && lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            case 1:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');
                $('#preview-qrd').removeClass('ui-disabled');
                $('#send-qrd-preview').removeClass('ui-disabled');
                $('#insert-qrd-preview').removeClass('ui-disabled');
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', resource)) {
                    $('#add-or-edit-qrd').removeClass('ui-disabled');
                }
                if (lzm_chatDisplay.resourcesDisplay.selectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder)) {
                    $('#add-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            case 2:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#edit-qrd').removeClass('ui-disabled');
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#view-qrd').removeClass('ui-disabled');
                $('#preview-qrd').removeClass('ui-disabled');
                $('#send-qrd-preview').removeClass('ui-disabled');
                $('#insert-qrd-preview').removeClass('ui-disabled');
                if (lzm_chatDisplay.resourcesDisplay.selectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder)) {
                    $('#add-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').addClass('ui-disabled');
                break;
            default:
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
                    $('#show-qrd-settings').removeClass('ui-disabled');
                }
                if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'delete', resource)) {
                    $('#delete-qrd').removeClass('ui-disabled');
                }
                $('#preview-qrd').removeClass('ui-disabled');
                $('#send-qrd-preview').removeClass('ui-disabled');
                $('#insert-qrd-preview').removeClass('ui-disabled');
                if (lzm_chatDisplay.resourcesDisplay.selectedResourceTab == 0 && parentFolder != null && lzm_commonPermissions.checkUserPermissions('', 'resources', 'add', parentFolder)) {
                    $('#add-qrd').removeClass('ui-disabled');
                }
                $('#add-qrd-attachment').removeClass('ui-disabled');
                break;
        }
    }
}

function addQrd() {
    var storedPreviewId = '';
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'add-resource' &&
                typeof lzm_chatDisplay.StoredDialogs[key].data['resource-id'] != 'undefined' &&
                lzm_chatDisplay.StoredDialogs[key].data['resource-id'] == lzm_chatDisplay.selectedResource) {
                storedPreviewId = key;
            }
        }
    }
    if (storedPreviewId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
    } else {
        lzm_chatUserActions.addQrd();
    }
}

function addQrdToChat(qrdType) {
    if ((!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) || qrdType == 'link') {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        removeEditor();
        var dialogId = 'add-qrd-to-chat-' + md5(Math.random().toString());
        var visBro = lzm_chatServerEvaluation.visitors.getVisitorBrowser(lzm_chatDisplay.active_chat_reco);
        var cpName = (visBro[1] != null && visBro[1].cname != '') ? lzm_commonTools.escapeHtml(visBro[1].cname) :
            (visBro[0] != null) ? visBro[0].unique_name :
            lzm_chatDisplay.active_chat_realname;
        lzm_chatUserActions.addQrd('', false, false, {type: qrdType, dialog_id: dialogId, chat_partner: lzm_chatDisplay.active_chat_reco, cp_name: cpName}, '');
    } else {
        showNotMobileMessage();
    }
}

function deleteQrd() {
    removeQrdContextMenu();
    var confirmText = t('Do you want to delete this entry including subentries irrevocably?');
    lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
    $('#alert-btn-ok').click(function() {
        lzm_chatUserActions.deleteQrd();
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-cancel').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });
}

function renameQrd() {
    // Perhaps not needed
}

function editQrd() {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null) {
        if (lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
            if ((lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) && resource.ty == 1) {
                showNotMobileMessage();
            } else {
                var storedPreviewId = '';
                for (var key in lzm_chatDisplay.StoredDialogs) {
                    if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                        if (lzm_chatDisplay.StoredDialogs[key].type == 'edit-resource' &&
                            typeof lzm_chatDisplay.StoredDialogs[key].data['resource-id'] != 'undefined' &&
                            lzm_chatDisplay.StoredDialogs[key].data['resource-id'] == lzm_chatDisplay.selectedResource) {
                            storedPreviewId = key;
                        }
                    }
                }
                if (storedPreviewId != '') {
                    lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
                } else {
                    lzm_chatUserActions.editQrd(resource);
                }
            }
        } else {
            showNoPermissionMessage();
        }
    }
}

function previewQrd(chatPartner, qrdId, inDialog, menuEntry) {
    var storedPreviewId = '';
    chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
    qrdId = (typeof qrdId != 'undefined') ? qrdId : lzm_chatDisplay.selectedResource;
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'preview-resource' &&
                typeof lzm_chatDisplay.StoredDialogs[key].data['resource-id'] != 'undefined' &&
                lzm_chatDisplay.StoredDialogs[key].data['resource-id'] == qrdId) {
                storedPreviewId = key;
            }
        }
    }
    if (storedPreviewId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
    } else {
        $('#preview-qrd').addClass('ui-disabled');
        lzm_chatUserActions.previewQrd(chatPartner, qrdId, inDialog, menuEntry);
    }
}

function getQrdDownloadUrl(resource) {
    var downloadUrl = lzm_chatServerEvaluation.serverProtocol + lzm_chatServerEvaluation.serverUrl + '/getfile.php?';
    if (multiServerId != '') {
        downloadUrl += 'ws=' + multiServerId + '&';
    }
    downloadUrl += 'a=' + lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5) +
        '&file=' + resource.ti + '&id=' + resource.rid;
    return downloadUrl;
}

function showQrd(chatPartner, caller) {
    saveChatInput(lzm_chatDisplay.active_chat_reco);
    removeEditor();
    var storedPreviewId = '';
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'qrd-tree' &&
                typeof lzm_chatDisplay.StoredDialogs[key].data['chat-partner'] != 'undefined' &&
                lzm_chatDisplay.StoredDialogs[key].data['chat-partner'] == chatPartner) {
                storedPreviewId = key;
            }
        }
    }
    if (storedPreviewId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
    } else {
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(lzm_chatServerEvaluation.cannedResources.getResourceList(), chatPartner);
    }
}

function cancelQrd(closeToTicket) {
    cancelQrdPreview(0);
    lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
    if (closeToTicket != '') {
        var dialogId = lzm_chatDisplay.ticketDialogId[closeToTicket] + '_reply';
        if (typeof lzm_chatDisplay.ticketDialogId[closeToTicket] == 'undefined' || closeToTicket.indexOf('_reply') != -1) {
            dialogId = closeToTicket;
        }

        lzm_displayHelper.maximizeDialogWindow(dialogId);
    }
    openLastActiveChat();
}

function cancelQrdPreview(animationTime) {
    $('#preview-qrd').removeClass('ui-disabled');
    $('#qrd-preview-container').remove();
}

function sendQrdPreview(resourceId, chatPartner) {
    resourceId = (resourceId != '') ? resourceId : lzm_chatDisplay.selectedResource;
    var resourceHtmlText;
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId);
    if (resource != null) {
        lzm_chatServerEvaluation.cannedResources.riseUsageCounter(resourceId);
        switch (resource.ty) {
            case '1':
                resourceHtmlText = resource.text;
                break;
            case '2':
                if (resource.text.indexOf('mailto:') == 0) {
                    var linkHtml = '<a href="' + resource.text + '" class="lz_chat_mail" target="_blank">' + resource.ti + '</a>';
                } else {
                    var linkHtml = '<a href="' + resource.text + '" class="lz_chat_link" target="_blank">' + resource.ti + '</a>';
                }
                resourceHtmlText = linkHtml;
                break;
            default:
                var urlFileName = encodeURIComponent(resource.ti.replace(/ /g, '+'));
                var acid = lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5);
                var fileId = resource.text.split('_')[1];
                var thisServer = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url;
                var fileHtml = '<a ' +
                    'href="' + thisServer + '/getfile.php?';
                if (multiServerId != '') {
                    fileHtml += 'ws=' + multiServerId + '&';
                }
                fileHtml += 'acid=' + acid +
                    '&file=' + urlFileName +
                    '&id=' + fileId + '" ' +
                    'class="lz_chat_file" target="_blank">' + resource.ti + '</a>';
                resourceHtmlText = fileHtml;
                break;
        }
        var chatText = loadChatInput(chatPartner);
        if ((app == 1) || isMobile) {
            chatText = (chatText != '') ? chatText + ' ' : chatText;
            if ($.inArray(resource.ty, ['2', '3', '4']) != -1) {
                sendChat(resourceHtmlText, chatPartner, '');
            } else {
                var resourceTextText = resourceHtmlText.replace(/(<br>|<br\/>|<br \/>|<\/p>|<\/div>)+/g, ' ').
                    replace(/<a.*?href="(.*?)".*?>(.*?)<\/a.*?>/gi, '$2 ($1)').replace(/<.*?>/g, '').replace(/&[a-zA-Z0-9#]*?;/g, ' ').
                    replace(/ +/g, ' ');
                saveChatInput(chatPartner, chatText + resourceTextText);
            }
        } else {
            chatText = (chatText != '') ? '<div>' + chatText + '</div>' : chatText;
            saveChatInput(chatPartner, chatText + resourceHtmlText);
        }
        cancelQrd();
        $('#qrd-tree-body').remove();
        $('#qrd-tree-footline').remove();
    }
}

function showQrdSettings(resourceId, caller, editorText) {
    resourceId = (resourceId == '') ? lzm_chatDisplay.selectedResource : resourceId;
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId);
    if (resource == null) {
        resource = {t: ''};
        if (resourceId == 'FOLDER') {
            resource.ty = 0;
        }
    }
    if (resource != null) {
        if (resourceId == 'TEXT_FILE_URL' || resourceId == 'FOLDER' || lzm_commonPermissions.checkUserPermissions('', 'resources', 'edit', resource)) {
            var storedPreviewId = '';
            for (var key in lzm_chatDisplay.StoredDialogs) {
                if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                    if (lzm_chatDisplay.StoredDialogs[key].type == 'resource-settings' &&
                        typeof lzm_chatDisplay.StoredDialogs[key].data['resource-id'] != 'undefined' &&
                        lzm_chatDisplay.StoredDialogs[key].data['resource-id'] == lzm_chatDisplay.selectedResource) {
                        storedPreviewId = key;
                    }
                }
            }
            if (storedPreviewId != '') {
                lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
            } else {
                lzm_chatDisplay.resourcesDisplay.showQrdSettings(resource, editorText, caller);
            }
        } else {
            showNoPermissionMessage();
        }
    }
}

function changeFile() {
    var maxFileSize = lzm_chatServerEvaluation.global_configuration.php_cfg_vars.upload_max_filesize;
    var file = $('#file-upload-input')[0].files[0];
    if(!file) {
        $('#file-upload-name').html('');
        $('#file-upload-size').html('');
        $('#file-upload-type').html('');
        $('#file-upload-progress').css({display: 'none'});
        $('#file-upload-numeric').html('');
        $('#file-upload-error').html('');
        $('#cancel-file-upload-div').css({display: 'none'});
        return;
    }

    var thisUnit = (file.size <= 10000) ? 'B' : (file.size <= 10240000) ? 'kB' : 'MB';
    var thisFileSize = (file.size <= 10000) ? file.size : (file.size <= 1024000) ? file.size / 1024 : file.size / 1048576;
    thisFileSize = Math.round(thisFileSize * 10) / 10;
    $('#file-upload-name').html(t('File name: <!--file_name-->', [['<!--file_name-->', file.name]]));
    $('#file-upload-size').html(t('File size: <!--file_size--> <!--unit-->', [['<!--file_size-->', thisFileSize],['<!--unit-->', thisUnit]]));
    $('#file-upload-type').html(t('File type: <!--file_type-->', [['<!--file_type-->', file.type]]));
    $('#file-upload-progress').css({display: 'none'});
    $('#file-upload-numeric').html('0%');
    $('#file-upload-error').html('');
    $('#cancel-file-upload-div').css({display: 'block'});

    if (file.size > maxFileSize) {
        $('#file-upload-input').val('');
        $('#file-upload-error').html(t('File size too large'));
    }
}

function uploadFile(fileType, parentId, rank, toAttachment, sendToChat) {
    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;
    var file = $('#file-upload-input')[0].files[0];
    if (typeof file != 'undefined') {
        $('#save-new-qrd').addClass('ui-disabled');
        $('#cancel-new-qrd').addClass('ui-disabled');
        $('#file-upload-progress').css({display: 'block'});
        $('#cancel-file-upload').css({display: 'inline'});//removeClass('ui-disabled');

        lzm_chatPollServer.uploadFile(file, fileType, parentId, rank, toAttachment, sendToChat);
    } else {
        $('#cancel-new-qrd').click();
    }
}

function cancelFileUpload() {
    lzm_chatPollServer.fileUploadClient.abort();
    $('#cancel-file-upload').css({display: 'none'});//addClass('ui-disabled');
}

function openQrdContextMenu(e, chatPartner, resourceId) {
    handleResourceClickEvents(resourceId, true);
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId);
    var scrolledDownY = $('#qrd-tree-body').scrollTop();
    var scrolledDownX = $('#qrd-tree-body').scrollLeft();
    var parentOffset = $('#qrd-tree-body').offset();
    var yValue = e.pageY - parentOffset.top;
    var xValue = e.pageX - parentOffset.left;
    if (resource != null) {
        resource.chatPartner = chatPartner;

        lzm_chatDisplay.showContextMenu('qrd-tree', resource, xValue + scrolledDownX, yValue + scrolledDownY);
        e.preventDefault();
    }
}

function removeQrdContextMenu() {
    $('#qrd-tree-context').remove();
}

/**************************************** Chat functions ****************************************/
function createActiveChatHtml() {
    if (lzm_chatDisplay.lastChatSendingNotification == '' && lzm_chatDisplay.active_chat_reco != '') {
        lzm_chatDisplay.createChatHtml(null, lzm_chatDisplay.active_chat_reco);
    } else if (lzm_chatDisplay.lastChatSendingNotification != '') {
        openLastActiveChat('panel');
    }
    lzm_displayHelper.removeBrowserNotification();
}

function openLastActiveChat(caller) {
    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    if (now - lzm_chatDisplay.lastActiveCalledAt > 1000 || lzm_chatDisplay.lastActiveCallCounter < 5) {
        lzm_chatDisplay.lastActiveCalledAt = now;
        lzm_chatDisplay.lastActiveCallCounter++;
        var chatToOpen = '';
        if (typeof caller != 'undefined' && caller == 'notification') {
            chatToOpen = lzm_chatDisplay.lastChatSendingNotification;
        } else if (typeof caller != 'undefined' && caller == 'panel' && lzm_chatDisplay.lastChatSendingNotification != '') {
            chatToOpen = lzm_chatDisplay.lastChatSendingNotification;
        } else if (lzm_chatDisplay.lastActiveChat != '') {
            chatToOpen = lzm_chatDisplay.lastActiveChat;
        } else {
            chatToOpen = getNextChatInRow();
        }
        lzm_chatDisplay.lastChatSendingNotification = '';
        var id, b_id, chat_id, userid, name, userChat = lzm_chatServerEvaluation.userChats.getUserChat(chatToOpen), operator = null, group = null;
        if (typeof chatToOpen != 'undefined' && chatToOpen != '' && (userChat != null && (userChat.status == 'new' ||
            userChat.status == 'read' || $.inArray(chatToOpen, lzm_chatDisplay.closedChats) == -1)) || chatToOpen == 'LIST') {
            if (chatToOpen == 'LIST') {
                showAllchatsList(true);
            } else if (chatToOpen.indexOf('~') != -1) {
                id = chatToOpen.split('~')[0];
                b_id = chatToOpen.split('~')[1];
                chat_id = lzm_chatServerEvaluation.userChats.getUserChat(chatToOpen).chat_id;
                viewUserData(id, b_id, chat_id, true);
            } else {
                id = chatToOpen;
                operator = lzm_chatServerEvaluation.operators.getOperator(id);
                group = lzm_chatServerEvaluation.groups.getGroup(id);
                if (operator != null) {
                    userid = operator.userid;
                    name = operator.name;
                } else if (group != null) {
                    userid = group.id;
                    name = group.name;
                } else if (id == 'everyoneintern') {
                    userid = id;
                    name = t('All operators');
                } else {
                    userid = id;
                    name = id;
                }
                //setTimeout(function() {chatInternalWith(id, userid, name);}, 5);
                chatInternalWith(id, userid, name);
            }
            setTimeout(function() {
                setFocusToEditor();
                lzm_chatDisplay.lastActiveCallCounter = 0;
            },150);
        } else {
            var lastActiveUserChat = lzm_chatServerEvaluation.userChats.getLastActiveUserChat();
            if (lastActiveUserChat != null) {
                if (typeof lastActiveUserChat.b_id != 'undefined') {
                    viewUserData(lastActiveUserChat.id, lastActiveUserChat.b_id, lastActiveUserChat.chat_id, true);
                } else {
                    id = lastActiveUserChat.id;
                    operator = lzm_chatServerEvaluation.operators.getOperator(id);
                    group = lzm_chatServerEvaluation.groups.getGroup(id);
                    if (operator != null) {
                        userid = operator.userid;
                        name = operator.name;
                    } else if (group != null) {
                        userid = group.id;
                        name = group.name;
                    } else if (id == 'everyoneintern') {
                        userid = id;
                        name = t('All operators');
                    } else {
                        userid = id;
                        name = id;
                    }
                    chatInternalWith(id, userid, name);
                }
            }
        }
    }
}

function chatInternalWith(id, userid, name, fromOpList) {

    if (lzm_chatDisplay.lastActiveChat != id) {
        $('#chat-qrd-preview').html('');
    }
    fromOpList = (typeof fromOpList != 'undefined') ? fromOpList : false;
    var group = lzm_chatServerEvaluation.groups.getGroup(id);
    var i = 0, myAction = 'chat', meIsInGroup = false;
    if (group != null && typeof group.members != 'undefined') {
        for (i=0; i<group.members.length; i++) {
            if (group.members[i].i == lzm_chatServerEvaluation.myId) {
                meIsInGroup = true;
            }
        }
        if (meIsInGroup) {
            myAction = 'chat';
        } else if (lzm_commonPermissions.checkUserPermissions(lzm_chatServerEvaluation.myId, 'group', '', group)) {
            myAction = 'join';
        } else {
            myAction = 'no_perm';
        }
    }
    if (myAction == 'no_perm') {
        showNoPermissionMessage();
    } else {
        var tmpArray = [];
        for (i=0; i<lzm_chatDisplay.closedChats.length; i++) {
            if (lzm_chatDisplay.closedChats[i] != id) {
                tmpArray.push(lzm_chatDisplay.closedChats[i]);
            }
        }
        lzm_chatDisplay.closedChats = tmpArray;
        lzm_chatDisplay.lastActiveChat = id;
        hideAllchatsList();
        lzm_chatUserActions.chatInternalWith(id, userid, name, fromOpList);
        if (myAction == 'join') {
            lzm_chatUserActions.saveDynamicGroup('add', group.id, '', lzm_chatServerEvaluation.myId, {});
        }
    }
}

function viewUserData(id, b_id, chat_id, freeToChat) {
    if (lzm_chatDisplay.lastActiveChat != id + '~' + b_id) {
        $('#chat-qrd-preview').html('');
    }
    lzm_chatDisplay.lastActiveChat = id + '~' + b_id;
    hideAllchatsList();
    lzm_chatUserActions.viewUserData(id, b_id, chat_id, freeToChat);
}

function handleUploadRequest(fuprId, fuprName, id, b_id, type, chatId) {
    lzm_chatUserActions.handleUploadRequest(fuprId, fuprName, id, b_id, type, chatId);
}

function selectOperatorForForwarding(id, b_id, chat_id, forward_id, forward_name, forward_group, forward_text, chat_no) {
    lzm_chatUserActions.selectOperatorForForwarding(id, b_id, chat_id, forward_id, forward_name, forward_group,
        forward_text, chat_no);
}

function loadChatInput(active_chat_reco) {
    return lzm_chatUserActions.loadChatInput(active_chat_reco);
}

function saveChatInput(active_chat_reco, text) {
    lzm_chatUserActions.saveChatInput(active_chat_reco, text);
}

function showTranslateOptions(visitorChat, language) {
    if (lzm_chatServerEvaluation.otrs != '' && lzm_chatServerEvaluation.otrs != null) {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        removeEditor();
        lzm_chatDisplay.visitorDisplay.showTranslateOptions(visitorChat, language);
    } else {
        var noGTranslateKeyWarning1 = t('LiveZilla can translate your conversations in real time. This is based upon Google Translate.');
        var noGTranslateKeyWarning2 = t('To use this functionality, you have to add a Google API key.');
        var noGTranslateKeyWarning3 = t('For further information, see LiveZilla Server Admin -> LiveZilla Server Configuration.');
        var noGTranslateKeyWarning = t('<!--phrase1--><br /><br /><!--phrase2--><br /><!--phrase3-->',
            [['<!--phrase1-->', noGTranslateKeyWarning1], ['<!--phrase2-->', noGTranslateKeyWarning2], ['<!--phrase3-->', noGTranslateKeyWarning3]]);
        lzm_commonDialog.createAlertDialog(noGTranslateKeyWarning, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function sendTranslatedChat(chatMessage, chatReco) {
    chatMessage = (typeof chatMessage != 'undefined') ? chatMessage : grabEditorContents();
    chatReco = (typeof chatReco != 'undefined' && chatReco != '') ? chatReco : (typeof lzm_chatDisplay.active_chat_reco != 'undefined' && lzm_chatDisplay.active_chat_reco != '') ? lzm_chatDisplay.active_chat_reco : lzm_chatDisplay.lastActiveChat;
    var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(chatReco), visitorChat = chatReco + '~00000';
    if (visitorBrowser[1] != null) {
        visitorChat = visitorBrowser[0].id + '~' + visitorBrowser[1].id + '~' + visitorBrowser[1].chat.id;
    }
    if (lzm_chatServerEvaluation.otrs != '' && lzm_chatServerEvaluation.otrs != null &&
        typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null &&
        lzm_chatDisplay.chatTranslations[visitorChat].tmm.translate &&
        lzm_chatDisplay.chatTranslations[visitorChat].tmm.sourceLanguage != lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage) {
        lzm_chatUserActions.translateTextAndSend(visitorChat, chatMessage, chatReco);
    } else {
        sendChat(chatMessage, chatReco);
    }
}

function sendChat(chatMessage, chat_reco, translatedChatMessage, visitorChat) {
    translatedChatMessage = (typeof translatedChatMessage != 'undefined') ? translatedChatMessage : '';
    visitorChat = (typeof visitorChat != 'undefined') ? visitorChat : chat_reco + '~00000';
    if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat) != null ||
        lzm_chatServerEvaluation.userChats.getUserChat(chat_reco) != null) {
        lzm_chatUserActions.deleteChatInput(chat_reco);
        try {
            lzm_chatServerEvaluation.userChatObjects.setUserChat(chat_reco, {status: 'read'});
        } catch(e) {}
        chatMessage = (typeof chatMessage != 'undefined' && chatMessage != '') ? chatMessage : grabEditorContents();
        if (chatMessage != '') {
            lzm_chatPollServer.typingChatPartner = '';
            var new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = lzm_chatServerEvaluation.myId;
            new_chat.rec = '';
            new_chat.reco = chat_reco;
            var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
            lzm_chatServerEvaluation.chatMessageCounter++;
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
            var chatText = chatMessage.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, "<br />");
            chatText = chatText.replace(/<script/g,'&lt;script').replace(/<\/script/g,'&lt;/script');
            chatText = lzm_commonTools.addLinksToChatInput(chatText);
            new_chat.text = lzm_commonTools.replaceChatPlaceholders(chat_reco, chatText);
            if (translatedChatMessage != '') {
                var translatedText = translatedChatMessage.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, "<br />");
                translatedText = translatedText.replace(/<script/g,'&lt;script').replace(/<\/script/g,'&lt;/script');
                //translatedText = lzm_chatServerEvaluation.addLinks(translatedText);
                translatedText = lzm_commonTools.addLinksToChatInput(translatedText);
                new_chat.tr = translatedText;
            }
            var os = '';
            if (isMobile) {
                os = mobileOS;
            }
            if (chat_reco == lzm_chatDisplay.active_chat_reco) {
                clearEditorContents(os, lzm_chatDisplay.browserName, 'send');
            }
            lzm_chatUserActions.sendChatMessage(new_chat, translatedChatMessage, visitorChat);

            lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
            if (chat_reco == lzm_chatDisplay.active_chat_reco) {
                lzm_chatDisplay.createChatHtml(lzm_chatPollServer.thisUser, chat_reco);
                lzm_chatDisplay.createViewSelectPanel();
                lzm_chatDisplay.createChatWindowLayout(true);
            }
        }
    } else {
        inviteExternalUser(lzm_chatDisplay.thisUser.id, lzm_chatDisplay.thisUser.b_id);
    }
    if(isMobile || app == 1) {
        setTimeout(function() {doMacMagicStuff();}, 5);
    }
}

function showAllchatsList(userAction) {
    userAction = (typeof userAction != 'undefined') ? userAction : false;
    if (userAction) {
        if (lzm_chatUserActions.active_chat_reco != '') {
            lzm_chatUserActions.saveChatInput(lzm_chatUserActions.active_chat_reco);
            removeEditor();
        }
        lzm_chatUserActions.setActiveChat('LIST', 'LIST', '', { id:'', b_id:'', b_chat:{ id:'' } });
        lzm_chatDisplay.lastActiveChat = 'LIST';
        $('#chat-allchats').css({'display': 'block'});
    } else {
        if (lzm_chatUserActions.active_chat_reco == '' || lzm_chatUserActions.active_chat_reco == 'LIST') {
            $('#chat-allchats').css({'display': 'block'});
        }
    }
    lzm_chatDisplay.createActiveChatPanel(false,false, false);
    lzm_chatDisplay.allchatsDisplay.updateAllChats();
}

function hideAllchatsList() {
    $('#chat-allchats').css({'display': 'none'});
}

function selectChatLine(chatId) {
    $('.allchats-line').removeClass('selected-table-line');
    $('#allchats-line-' + chatId).addClass('selected-table-line');
    $('#all-chats-list').data('selected-line', chatId);
}

function openChatLineContextMenu(chatId, isBotChat, e) {
    removeAllChatsFilterMenu();
    selectChatLine(chatId);
    var scrolledDownY, scrolledDownX, parentOffset, place = 'all-chats';
    scrolledDownY = $('#' + place +'-body').scrollTop();
    scrolledDownX = $('#' + place +'-body').scrollLeft();
    parentOffset = $('#' + place +'-body').offset();
    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;

    var chat = null;
    if (lzm_chatDisplay.allchatsDisplay.allchatsFilter == 'active') {
        chat = lzm_commonTools.clone(lzm_chatDisplay.allchatsDisplay.allChats[chatId]);
        chat.missed = false;
    } else {
        chat = lzm_commonTools.clone(lzm_chatDisplay.allchatsDisplay.missedChats[chatId]);
        chat.missed = true;
    }
    if (chat != null && typeof chat != 'undefined') {
        chat.isBotChat = isBotChat;
        lzm_chatDisplay.showContextMenu(place, chat, xValue, yValue);
        e.stopPropagation();
    }
    e.preventDefault();
}

function removeChatLineContextMenu() {
    $('#all-chats-context').remove();
}

function addJoinedMessageToChat(chat_reco, visitorName, groupName) {
    groupName = (typeof groupName != 'undefined') ? groupName : '';
    var chatText = (groupName != '') ? t('<!--vis_name--> joins <!--group_name-->.',[['<!--vis_name-->', visitorName], ['<!--group_name-->', groupName]]) :
        t('<!--vis_name--> joins the chat.',[['<!--vis_name-->', visitorName]]);
    var new_chat = {};
    new_chat.id = md5(String(Math.random())).substr(0, 32);
    new_chat.rp = '';
    new_chat.sen = '0000000';
    new_chat.rec = '';
    new_chat.reco = chat_reco;
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
    new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
    lzm_chatServerEvaluation.chatMessageCounter++;
    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
    new_chat.text = chatText;
    lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);

}

function addLeftMessageToChat(chat_reco, visitorName, groupName) {
    groupName = (typeof groupName != 'undefined') ? groupName : '';
    var chatText = (groupName != '') ? t('<!--vis_name--> has left <!--group_name-->.',[['<!--vis_name-->', visitorName], ['<!--group_name-->', groupName]]) :
        t('<!--vis_name--> has left the chat.',[['<!--vis_name-->', visitorName]]);
    var new_chat = {};
    new_chat.id = md5(String(Math.random())).substr(0, 32);
    new_chat.rp = '';
    new_chat.sen = '0000000';
    new_chat.rec = '';
    new_chat.reco = chat_reco;
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
    new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
    lzm_chatServerEvaluation.chatMessageCounter++;
    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
    new_chat.text = chatText;
    lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
}

function addOpLeftMessageToChat(chat_reco, members, newIdList) {
    for (var i=0; i<members.length; i++) {
        if (members[i].id != lzm_chatServerEvaluation.myId && members[i].st == 1 &&
            $.inArray(members[i].id, newIdList) == -1) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(members[i].id);
            if (operator != null) {
                var new_chat = {};
                new_chat.id = md5(String(Math.random())).substr(0, 32);
                new_chat.rp = '';
                new_chat.sen = '0000000';
                new_chat.rec = '';
                new_chat.reco = chat_reco;
                var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
                new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
                new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
                lzm_chatServerEvaluation.chatMessageCounter++;
                new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
                new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
                new_chat.text = t('<!--this_op_name--> has left the chat.', [['<!--this_op_name-->', operator.name]]);
                lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
            }
        }
    }
    lzm_chatServerEvaluation.setChatAccepted(chat_reco, true);
}

function addDeclinedMessageToChat(id, b_id, chatPartners) {
    var userChat = lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id);
    for (var i=0; i<chatPartners.past.length; i++) {
        if ($.inArray(chatPartners.past[i], chatPartners.present) == -1) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(chatPartners.past[i]);
            if (operator != null) {
                var new_chat = {};
                new_chat.id = md5(String(Math.random())).substr(0, 32);
                new_chat.rp = '';
                new_chat.sen = '0000000';
                new_chat.rec = '';
                new_chat.reco = id + '~' + b_id;
                var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
                new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
                new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
                lzm_chatServerEvaluation.chatMessageCounter++;
                new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
                new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
                new_chat.text = t('<!--this_op_name--> has declined the chat.', [['<!--this_op_name-->', operator.name]]);
                lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
            }
            if (chatPartners.past[i] == lzm_chatServerEvaluation.myId) {
                if (userChat != null) {
                    lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'declined'});
                    lzm_chatDisplay.createActiveChatPanel(false, true);
                    if (lzm_chatDisplay.active_chat_reco == id + '~' + b_id) {
                        lzm_chatDisplay.removeSoundPlayed(id + '~' + b_id);
                        lzm_chatUserActions.viewUserData(id, b_id, userChat.chat_id);
                    }
                }
            }
        }
    }
}

function addOpJoinedMessageToChat(chat_reco, newMembers, oldMembers) {
    for (var i=0; i<newMembers.length; i++) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(newMembers[i]);
        if (operator != null) {
            var oldMemberString = '';
            for (var j=0; j< oldMembers.length; j++) {
                var op2 = lzm_chatServerEvaluation.operators.getOperator(oldMembers[j]);
                if (op2 != null)
                    oldMemberString += op2.name + ', ';
            }
            var visitor = lzm_chatServerEvaluation.visitors.getVisitor(chat_reco.split('~')[0]);
            if (visitor != null)
                oldMemberString += (visitor.name != '-') ? visitor.name : visitor.unique_name;
            var new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = '0000000';
            new_chat.rec = '';
            new_chat.reco = chat_reco;
            var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
            lzm_chatServerEvaluation.chatMessageCounter++;
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
            new_chat.text = t('<!--this_op_name--> has joined the chat with <!--existing_chat_partners-->.',
                [['<!--this_op_name-->', operator.name], ['<!--existing_chat_partners-->', oldMemberString]]);
            lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
        }
    }
}

function removeFromOpenChats(chat, deleteFromChat, resetActiveChat, member, caller) {
    var i, new_chat;
    var inChatWith = [], mainChatPartner = '';
    for (i=0; i<member.length; i++) {
        if (member[i].st == 0) {
            mainChatPartner = member[i].id;
        }
        inChatWith.push(member[i].id);
    }
    if (inChatWith.length != 0 && $.inArray(lzm_chatServerEvaluation.myId, inChatWith) == -1 && lzm_chatServerEvaluation.userChats.getUserChat(chat).status != 'left') {
        var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
        if (inChatWith.length == 1 && inChatWith[0] == mainChatPartner) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(mainChatPartner);
            var opName = (operator != null) ? operator.name : t('Another operator');
            new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = '0000000';
            new_chat.rec = '';
            new_chat.reco = chat;
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
            lzm_chatServerEvaluation.chatMessageCounter++;
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
            new_chat.text = t('<!--this_op_name--> has accepted the chat.', [['<!--this_op_name-->',opName]]);
            lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
        }
        new_chat = {};
        new_chat.id = md5(String(Math.random())).substr(0, 32);
        new_chat.rp = '';
        new_chat.sen = '0000000';
        new_chat.rec = '';
        new_chat.reco = chat;
        new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
        new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
        lzm_chatServerEvaluation.chatMessageCounter++;
        new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
        new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
        new_chat.text = t('<!--this_op_name--> has left the chat.', [['<!--this_op_name-->', lzm_chatServerEvaluation.myName]]);
        lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
    }
    if (deleteFromChat && $.inArray(lzm_chatServerEvaluation.myId, inChatWith) == -1) {
        lzm_chatServerEvaluation.userChats.setUserChat(chat, {status: 'left'});
    }
    var visBro = lzm_chatServerEvaluation.visitors.getVisitorBrowser(chat);
    var chatIsAccepted = (visBro[1] != null && visBro[1].chat.id != '') ? (visBro[1].chat.pn.acc == 1) : false;
    if ($.inArray(lzm_chatServerEvaluation.myId, inChatWith) == -1 || !chatIsAccepted) {
        var tmpOpenchats = [];
        for (i=0; i<lzm_chatDisplay.openChats.length; i++) {
            if (chat != lzm_chatDisplay.openChats[i]) {
                tmpOpenchats.push(lzm_chatDisplay.openChats[i]);
            }
        }
        lzm_chatDisplay.openChats = tmpOpenchats;
        lzm_chatUserActions.open_chats = tmpOpenchats;
    }
    if (resetActiveChat) {
        if (lzm_chatDisplay.active_chat_reco == chat) {
            setTimeout(function() {
                lzm_chatUserActions.viewUserData(chat.split('~')[0], chat.split('~')[1], 0, true);
            }, 20);
        }
    }
}

function leaveAllChatsOfVisitor(id) {
    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
    if (visitor != null) {
        for (var i=0; i<visitor.b.length; i++) {
            if (visitor.b[i].chat.id != '') {
                markVisitorAsLeft(id, visitor.b[i].id);
            }
        }
    }
}

function markVisitorAsLeft(id, b_id) {
    var userChat = lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id);
    if ($.inArray(userChat.status, ['left','declined']) == -1) {
        var visBro = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id);
        var visitorName = (visBro[1] != null && visBro[1].cname != '') ? visBro[1].cname : (visBro[0] != null) ? visBro[0].unique_name : id;
        addLeftMessageToChat(id + '~' + b_id, lzm_commonTools.htmlEntities(visitorName));
    }
    lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'left'});
    if (lzm_chatDisplay.active_chat_reco == id + '~' + b_id) {
        removeFromOpenChats(id + '~' + b_id, false, true, [], 'markVisitorAsLeft');
    }
}

function markVisitorAsBack(id, b_id, chat_id, member) {
    var chatIsMine = false, visitorName = '';
    for (var j=0; j<member.length; j++) {
        if (member[j].id == lzm_chatServerEvaluation.myId) {
            chatIsMine = true;
            break;
        }
    }
    if (chatIsMine) {
        removeFromOpenChats(id + '~' + b_id, false, true, member, 'markVisitorAsBack');
        addChatInfoBlock(id, b_id);
        lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'new'});

        var tmpClosedChats = [];
        for (var i=0; i<lzm_chatDisplay.closedChats.length; i++) {
            if (lzm_chatDisplay.closedChats[i] != id + '~' + b_id) {
                tmpClosedChats.push(lzm_chatDisplay.closedChats[i]);
            }
        }
        lzm_chatDisplay.closedChats = tmpClosedChats;

        visBro = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id);
        visitorName = (visBro[1] != null && visBro[1].cname != '') ? visBro[1].cname : (visBro[0] != null) ? visBro[0].unique_name : id;

        var new_chat = {};
        new_chat.id = md5(String(Math.random())).substr(0, 32);
        new_chat.rp = '';
        new_chat.sen = '0000000';
        new_chat.rec = '';
        new_chat.reco = id + '~' + b_id;
        var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
        new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
        new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
        lzm_chatServerEvaluation.chatMessageCounter++;
        new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', lzm_chatDisplay.userLanguage);
        new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', lzm_chatDisplay.userLanguage);
        new_chat.text = t('<!--this_vis_name--> is in chat with <!--this_op_name-->',
            [['<!--this_vis_name-->', lzm_commonTools.htmlEntities(visitorName)],['<!--this_op_name-->', lzm_chatServerEvaluation.myName]]);
        lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);

        lzm_chatServerEvaluation.browserChatIdList.push(chat_id);
        if (isAutoAcceptActive()) {
            if (visitor != null) {
                lzm_chatUserActions.acceptChat(id, b_id, chat_id,
                    id + '~' + b_id, visitor.lang);
            }
        }
    } else {
        if (lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).my_chat) {
            removeFromOpenChats(id + '~' + b_id, false, true, member, 'markVisitorAsBack');
            var visBro = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id);
            visitorName = (visBro[1] != null && visBro[1].cname != '') ? visBro[1].cname : (visBro[0] != null) ? visBro[0].unique_name : id;
            if (lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).status != 'left')
                addLeftMessageToChat(id + '~' + b_id, lzm_commonTools.htmlEntities(visitorName));
            lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat: false, my_chat_old: true, status: 'new'});
        } else {
            lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'new'});
        }
    }
}

function addChatInfoBlock(id, b_id) {
    if (b_id != '') {
        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
        if (visitor != null) {
            for (var j=0; j<visitor.b.length; j++) {
                if (visitor.b[j].id == b_id) {
                    if (typeof visitor.b[j].chat != 'undefined') {
                        var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(visitor.b[j].chat.f * 1000, true);

                        var tUoperators = '';
                        var operators = lzm_chatServerEvaluation.operators.getOperatorList();
                        for (var i=0; i<operators.length; i++) {
                            if (typeof visitor.b[j].chat != 'undefined' && typeof visitor.b[j].chat.pn != 'undefined' &&
                                typeof visitor.b[j].chat.pn.memberIdList != 'undefined' &&
                                $.inArray(operators[i].id, visitor.b[j].chat.pn.memberIdList) != -1) {
                                tUoperators +=  operators[i].name + ', ';
                            }
                        }
                        tUoperators = tUoperators.replace(/, *$/,'');
                        var name = (visitor.b[j].cname != '') ? visitor.b[j].cname : visitor.unique_name;
                        var customFields = '';
                        for (var key in visitor.b[j].chat.cf) {
                            if (visitor.b[j].chat.cf.hasOwnProperty(key)) {
                                var inputText = (lzm_chatServerEvaluation.inputList.getCustomInput(key).type != 'CheckBox') ?
                                    lzm_commonTools.htmlEntities(visitor.b[j].chat.cf[key]) :
                                    (visitor.b[j].chat.cf[key] == 1) ? t('Yes') : t('No');
                                customFields += '<tr><td style="white-space: nowrap; vertical-align: top;">' +
                                    lzm_chatServerEvaluation.inputList.getCustomInput(key).name + '</td>' +
                                    '<td>' + inputText + '</td></tr>';
                            }
                        }

                        var chatArea = (visitor.b[j].h2.length > 0 && visitor.b[j].h2[visitor.b[j].h2.length - 1].code != '') ? visitor.b[j].h2[visitor.b[j].h2.length - 1].code : '&#8203;';
                        var chatUrl = (visitor.b[j].h2.length > 0 && visitor.b[j].h2[visitor.b[j].h2.length - 1].url != '') ? visitor.b[j].h2[visitor.b[j].h2.length - 1].url : '&#8203;';
                        if (visitor.b[j].h2.length == 0) {
                            var lastOpened = 0;
                            for (var k=0; k<visitor.b.length; k++) {
                                if (visitor.b[k].h2.length > 0 && visitor.b[k].h2[visitor.b[k].h2.length - 1].time > lastOpened && visitor.b[k].chat.id == '') {
                                    chatUrl = (visitor.b[k].h2[visitor.b[k].h2.length - 1].url != '') ? visitor.b[k].h2[visitor.b[k].h2.length - 1].url : '&#8203;';
                                    chatArea = (visitor.b[k].h2[visitor.b[k].h2.length - 1].code != '') ? visitor.b[k].h2[visitor.b[k].h2.length - 1].code : '&#8203;';
                                    lastOpened = visitor.b[k].h2[visitor.b[k].h2.length - 1].time;
                                }
                            }
                        }
                        var new_chat = {
                            date: visitor.b[j].chat.f,
                            cmc: lzm_chatServerEvaluation.chatMessageCounter,
                            id : md5(String(Math.random())).substr(0, 32),
                            rec: id + '~' + b_id,
                            reco: lzm_chatDisplay.myId,
                            rp: '0',
                            sen: id + '~' + b_id,
                            sen_id: id,
                            sen_b_id: b_id,
                            text: '',
                            date_human: lzm_commonTools.getHumanDate(tmpDate, 'date', lzm_chatDisplay.userLanguage),
                            time_human: lzm_commonTools.getHumanDate(tmpDate, 'time', lzm_chatDisplay.userLanguage),
                            info_header: {
                                group: visitor.b[j].chat.gr,
                                operators: tUoperators,
                                name: name,
                                mail: visitor.b[j].cemail,
                                company: visitor.b[j].ccompany,
                                phone: visitor.b[j].cphone,
                                question: visitor.b[j].chat.eq,
                                chat_id: visitor.b[j].chat.id,
                                area_code: chatArea,
                                url: chatUrl,
                                cf: customFields
                            }
                        };
                        lzm_chatServerEvaluation.chatMessageCounter++;
                    }
                    break;
                }
            }
        }
        lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
    }
}

function isAutoAcceptActive () {
    if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {}) ||
        (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) && lzm_chatDisplay.autoAcceptChecked == 1)) {
        return true;
    } else {
        return false;
    }
}

function playIncomingMessageSound(sender, receivingChat, chatId, text) {
    receivingChat = (typeof receivingChat != 'undefined' && receivingChat != '') ? receivingChat : sender;
    lzm_chatDisplay.lastChatSendingNotification = receivingChat;
    chatId = (typeof chatId != 'undefined') ? chatId : '';
    text = (typeof text != 'undefined') ? text : '';
    if (lzm_chatDisplay.playNewMessageSound == 1 &&
        ($.inArray(sender, lzm_chatDisplay.openChats) != -1 || sender.indexOf('~') == -1 || lzm_chatDisplay.playNewChatSound != 1 )) {
        lzm_chatDisplay.playSound('message', sender, text);
    }
    var notificationSound;
    if (lzm_chatDisplay.playNewMessageSound != 1) {
        notificationSound = 'DEFAULT'
    } else {
        notificationSound = 'NONE'
    }
    text = (typeof text != 'undefined') ? text : '';
    var i, senderId, senderBid, senderName = t('Visitor');
    if (sender.indexOf('~') != -1) {
        senderId = sender.split('~')[0];
        senderBid = sender.split('~')[1];
        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(senderId);
        if (visitor != null) {
            for (var j=0; j<visitor.b.length; j++) {
                if (visitor.b[j].id == senderBid) {
                    senderName = (typeof visitor.b[j].cname != 'undefined' && visitor.b[j].cname != '') ? visitor.b[j].cname : visitor.unique_name;
                }
            }
        }

    } else {
        senderId = sender;
        var operator = lzm_chatServerEvaluation.operators.getOperator(senderId);
        senderName = (operator != null) ? operator.name : senderName;
    }
    text = text.replace(/<.*?>/g,'').replace(/<\/.*?>/g,'');
    var notificationText = t('<!--sender-->: <!--text-->',[['<!--sender-->',senderName],['<!--text-->',text]]).substr(0, 250);
    if (typeof lzm_deviceInterface != 'undefined') {
        try {
            lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, sender, receivingChat, "1");
        } catch(ex) {
            try {
                lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, sender, receivingChat);
            } catch(e) {
                logit('Error while showing notification');
            }
        }
    }
    if (lzm_chatDisplay.selected_view != 'mychats' || $('.dialog-window-container').length > 0) {
        if (sender.indexOf('~') == -1 ||
            ((lzm_chatServerEvaluation.userChats.getUserChat(sender) != null && lzm_chatServerEvaluation.userChats.getUserChat(sender).accepted) ||
                isAutoAcceptActive())) {
            lzm_displayHelper.showBrowserNotification({
                text: notificationText,
                subject: t('New Chat Message'),
                action: 'openChatFromNotification(\'' + receivingChat + '\'); closeOrMinimizeDialog();',
                timeout: 10
            });
        }
    }
}

function openChatFromNotification(chatPartner, type) {
    type = (typeof type != 'undefined') ? type : '';
    selectView('mychats');
    if (typeof chatPartner != 'undefined' && chatPartner != '') {
        lzm_chatDisplay.lastChatSendingNotification = chatPartner;
    }
    if (lzm_chatDisplay.lastChatSendingNotification != '') {
        openLastActiveChat('notification');
    }
    if (type == 'push') {
        showAppIsSyncing();
    }
}

function leaveChat(chatId) {
    if (typeof chatId != 'undefined') {
        var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser('', '', chatId);
        if (visitorBrowser[0] != null && visitorBrowser[1] != null) {
            lzm_chatUserActions.setActiveChat(visitorBrowser[0].id, visitorBrowser[0].id + '~' + visitorBrowser[1].id, visitorBrowser[0].name, visitorBrowser[0]);
        }
    }
    var leaveChat = false, i = 0, myVbId = lzm_chatDisplay.active_chat_reco;
    removeEditor();
    if (lzm_chatDisplay.thisUser.b_id != '') {
        lzm_chatServerEvaluation.setChatAccepted(lzm_chatDisplay.active_chat_reco, false);
        var thisBId = lzm_chatDisplay.active_chat_reco.split('~')[1];
        for (i=0; i<lzm_chatDisplay.thisUser.b.length; i++) {
            if (lzm_chatDisplay.thisUser.b[i].id == thisBId) {
                lzm_chatDisplay.thisUser.b_id = lzm_chatDisplay.thisUser.b[i].id;
                lzm_chatDisplay.thisUser.b_chat = lzm_chatDisplay.thisUser.b[i].chat;
                break;
            }
        }
        if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco) != null) {
            var isMainChat = true, chatAccepted = (typeof lzm_chatDisplay.thisUser.b_chat.pn != 'undefined' && lzm_chatDisplay.thisUser.b_chat.pn.acc == 1);
            var chatMember = (typeof lzm_chatDisplay.thisUser.b_chat.pn != 'undefined') ? lzm_chatDisplay.thisUser.b_chat.pn.member : [];
            for (var l=0; l<chatMember.length; l++) {
                if (chatAccepted && chatMember.length > 1 && chatMember[l].id == lzm_chatDisplay.myId && chatMember[l].st != 0) {
                    isMainChat = false;
                }
            }
            var closeOrLeave = (isMainChat) ? 'close' : 'leave';
            if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco).status == 'declined') {
                lzm_chatDisplay.closedChats.push(lzm_chatDisplay.active_chat_reco);
                lzm_chatUserActions.setActiveChat('', '', '', { id:'', b_id:'', b_chat:{ id:'' } });
                lzm_chatDisplay.createActiveChatPanel(false, true, false);
                lzm_chatDisplay.createHtmlContent(lzm_chatDisplay.thisUser, lzm_chatDisplay.active_chat_reco);
                leaveChat = true;
            } else if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco).status == 'left' ||
                lzm_chatDisplay.thisUser.is_active == false || !isMainChat || !lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco).my_chat) {
                lzm_chatDisplay.closedChats.push(lzm_chatDisplay.active_chat_reco);
                lzm_chatUserActions.leaveExternalChat(lzm_chatDisplay.thisUser.id, lzm_chatDisplay.thisUser.b_id, lzm_chatDisplay.thisUser.b_chat.id, 0, closeOrLeave);
                leaveChat = true;
            } else {
                lzm_commonDialog.createAlertDialog(t('Do you really want to close this Chat?'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_chatDisplay.closedChats.push(lzm_chatDisplay.active_chat_reco);
                    lzm_chatUserActions.leaveExternalChat(lzm_chatDisplay.thisUser.id, lzm_chatDisplay.thisUser.b_id, lzm_chatDisplay.thisUser.b_chat.id, 0, closeOrLeave);
                    leaveChat = true;
                    $('#alert-btn-cancel').click();
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        }
    } else {
        lzm_chatDisplay.closedChats.push(lzm_chatDisplay.active_chat_reco);
        lzm_chatUserActions.leaveInternalChat(lzm_chatDisplay.thisUser.id, lzm_chatDisplay.thisUser.userid, lzm_chatDisplay.thisUser.name);
        leaveChat = true;
    }

    if (leaveChat) {
        lzm_chatDisplay.lastActiveChat = getNextChatInRow();
        lzm_chatDisplay.lastActiveCallCounter = 0;
        openLastActiveChat();
        var tmpCmbList = [];
        for (i=0; i<lzm_chatUserActions.chatCallBackList.length; i++) {
            if (lzm_chatUserActions.chatCallBackList[i] != myVbId) {
                tmpCmbList.push(lzm_chatUserActions.chatCallBackList[i]);
            }
        }
        lzm_chatUserActions.chatCallBackList = tmpCmbList;
    }
}

function closeAllInactiveChats() {
    var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
    for (var uc in userChats) {
        if (userChats.hasOwnProperty(uc)) {
            var chat = lzm_chatServerEvaluation.userChats.getUserChat(uc);
            if (chat != null) {
                var op = lzm_chatServerEvaluation.operators.getOperator(uc);
                var gr = lzm_chatServerEvaluation.groups.getGroup(uc);
                if ((op != null || gr != null || chat.status == 'left' || chat.status == 'declined') && $.inArray(uc, lzm_chatDisplay.closedChats) == -1) {
                    var vb = lzm_chatServerEvaluation.visitors.getVisitorBrowser(uc);
                    var addToCloseList = false, cpDoesExist = false;
                    if (vb[0] != null) {
                        cpDoesExist = true;
                        if (!vb[0].is_active) {
                            addToCloseList = true;
                        }
                    } else if (vb[1] != null) {
                        cpDoesExist = true;
                        if (!vb[1].is_active) {
                            addToCloseList = true;
                        }

                    }
                    if (op != null) {
                        cpDoesExist = true;
                        if (op.status == '2') {
                            addToCloseList = true;
                            lzm_chatServerEvaluation.userChats.setUserChat(uc, {status: 'left'});
                        }
                    }
                    if (gr != null) {
                        cpDoesExist = true;
                        if (!gr.is_active) {
                            addToCloseList = true;
                        }
                    }
                    if (chat.status == 'left' || chat.status == 'declined' || (typeof chat.my_chat != 'undefined' && !chat.my_chat)) {
                        addToCloseList = true;
                    }
                    if (addToCloseList || !cpDoesExist) {
                        lzm_chatDisplay.closedChats.push(uc);
                        lzm_chatDisplay.createActiveChatPanel(false, true, true, 'close-all');
                    }
                }
            }
        }
    }
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatUserActions.active_chat_reco);
    if (activeUserChat != null && activeUserChat.status == 'left' || activeUserChat.status == 'declined') {
        lzm_chatUserActions.setActiveChat('LIST', 'LIST', '', { id:'', b_id:'', b_chat:{ id:'' } });
        lzm_chatDisplay.lastActiveChat = 'LIST';
        showAllchatsList();
    }
}

function getNextChatInRow() {
    var senders = Object.keys(lzm_chatServerEvaluation.userChats.getUserChatList());
    var newActiveChat = 'LIST', myChat = null;
    for (var j=(senders.length - 1); j>=0; j--) {
        myChat = lzm_chatServerEvaluation.userChats.getUserChat(senders[j]);
        if (myChat != null && $.inArray(senders[j], lzm_chatDisplay.closedChats) == -1 &&
            $.inArray(myChat.status, ['left', 'declined']) == -1 &&
            ((typeof myChat.my_chat != 'undefined' && myChat.my_chat) ||
                (typeof myChat.type != 'undefined' && myChat.type == 'internal'))) {
            newActiveChat = senders[j];
            break;
        }
    }
    myChat = null;
    if (newActiveChat == 'LIST') {
        for (var k=(senders.length - 1); k>=0; k--) {
            myChat = lzm_chatServerEvaluation.userChats.getUserChat(senders[k]);
            if (myChat != null && myChat.type == 'external' &&
                $.inArray(senders[k], lzm_chatDisplay.closedChats) == -1 &&
                typeof myChat.my_chat != 'undefined' && myChat.my_chat) {
                newActiveChat = senders[k];
                break;
            }
        }
    }

    return newActiveChat;
}

function takeChat(visitorId, browserId, chatId, groupId, askBeforeTake) {
    var mayTake = lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'take_over', null);
    askBeforeTake = (typeof askBeforeTake != 'undefined') ? askBeforeTake : false;
    removeChatLineContextMenu();

    var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(visitorId, browserId);
    var isBotChat = false;
    if (visitorBrowser[1] != null && typeof visitorBrowser[1].chat.pn != 'undefined' && visitorBrowser[1].chat.pn.member.length == 1) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(visitorBrowser[1].chat.pn.member[0].id);
        if (operator != null && operator.isbot == 1) {
            isBotChat = true;
        }
    }
    if (visitorBrowser[1] != null && $.inArray(lzm_chatDisplay.myId, visitorBrowser[1].chat.pn.memberIdList) != -1) {
        viewUserData(visitorId, browserId, visitorBrowser[1].chat.id, true);
    } else {
        if (!mayTake) {
            showNoPermissionMessage();
        } else if (visitorBrowser[1] != null && (visitorBrowser[1].chat.pn.acc != 1 || isBotChat)) {
            groupId = ($.inArray(groupId, lzm_chatDisplay.myGroups) != -1) ? groupId : lzm_chatDisplay.myGroups[0];
            if (askBeforeTake) {
                var errorMessage = t('Do you want to take this chat?');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId}, 'take-chat');
                    lzm_commonDialog.removeAlertDialog();
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            } else {
                lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId}, 'take-chat');
            }
        } else if (visitorBrowser[1] != null && visitorBrowser[1].chat.pn.acc == 1) {
            if (askBeforeTake) {
                var errorMessage = t('Do you want to take this chat?');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId, takeover: true,
                        o: visitorBrowser[1].chat.dcp}, 'take-chat');
                    lzm_commonDialog.removeAlertDialog();
                });
                $('#alert-btn-cancel').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            } else {
                lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId, g: groupId, takeover: true,
                    o: visitorBrowser[1].chat.dcp}, 'take-chat');
            }
        }
    }
}

function joinChat(visitorId, browserId, chatId, joinInvisible, joinAfterInvitation) {
    joinInvisible = (typeof joinInvisible != 'undefined') ? joinInvisible : false;
    joinAfterInvitation = (typeof joinAfterInvitation != 'undefined') ? joinAfterInvitation : false;
    if (!lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join', {})) {
        showNoPermissionMessage();
    } else {
        var myChat = lzm_chatServerEvaluation.userChats.getUserChat(visitorId + '~' + browserId);
        if (myChat != null) {
            myChat.my_chat = false;
            myChat.status = 'read';
        }
        if (joinInvisible) {
            if (!lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join_invisible', {})) {
                showNoPermissionMessage();
            } else {
                lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat-invisible');
            }
        } else if (joinAfterInvitation) {
            lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat');
        } else  {
            if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'join_after_invitation', {})) {
                showNoPermissionMessage();
            } else {
                lzm_chatPollServer.pollServerSpecial({v: visitorId, b: browserId, c: chatId}, 'join-chat');
            }
        }
    }
}

function openAllChatsFilterMenu(e) {
    e.stopPropagation();
    removeChatLineContextMenu();
    var filter = lzm_chatDisplay.allchatsDisplay.allchatsFilter;
    if (lzm_chatDisplay.allchatsDisplay.showAllchatsFilterMenu) {
        removeAllChatsFilterMenu();
    } else {
        var parentOffset = $('#allchats-filter').offset();
        var xValue = parentOffset.left - 13;
        var yValue = parentOffset.top + 24 - 23;
        lzm_chatDisplay.allchatsDisplay.showAllchatsFilterMenu = true;
        lzm_chatDisplay.showContextMenu('allchats-filter', {filter: filter}, xValue, yValue);
        e.preventDefault();
    }
}

function removeAllChatsFilterMenu() {
    lzm_chatDisplay.allchatsDisplay.showAllchatsFilterMenu = false;
    $('#allchats-filter-context').remove();
}

function toggleAllchatsFilter(filter) {
    lzm_chatDisplay.allchatsDisplay.allchatsFilter = filter;
    lzm_chatDisplay.allchatsDisplay.updateAllChats();
    removeAllChatsFilterMenu();
}

function enableChatButtons() {
    $('.disabled-chat-button').removeClass('ui-disabled');
    $('.disabled-chat-button').removeClass('disabled-chat-button');
}

function forwardChat(chatId, type) {
    type = (typeof type != 'undefined') ? type : 'forward';
    var thisUser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(null, null, chatId);
    if (thisUser[0] != null && thisUser[1] != null) {
        var id = thisUser[0].id, b_id = thisUser[1].id;
        if (lzm_commonPermissions.checkUserPermissions('', 'chats', 'forward', {})) {
            var storedForwardId = '';
            for (var key in lzm_chatDisplay.StoredDialogs) {
                if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                    if (lzm_chatDisplay.StoredDialogs[key].type == 'operator-invitation' &&
                        typeof lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] != 'undefined' &&
                        lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] == id + '~' + b_id) {
                        storedForwardId = key;
                    }
                }
            }
            if (storedForwardId != '') {
                lzm_displayHelper.maximizeDialogWindow(storedForwardId);
            } else {
                var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
                if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                    saveChatInput(lzm_chatDisplay.active_chat_reco);
                    removeEditor();
                }
                lzm_chatDisplay.createOperatorInviteHtml(type, thisUser[0], id, b_id, chatId);
            }
        } else {
            showNoPermissionMessage();
        }
    }
}

function showInvitedMessage(newForward) {
    var operator = lzm_chatServerEvaluation.operators.getOperator(newForward.i);
    var visitor = lzm_chatServerEvaluation.visitors.getVisitorBrowser(newForward.u);
    var userChat = lzm_chatServerEvaluation.userChats.getUserChat(newForward.u);
    if (visitor[0] != null && visitor[1] != null && operator != null && userChat != null && !lzm_chatDisplay.showOpInviteDialog) {
        lzm_chatDisplay.showOpInviteDialog = true;
        var visName = (visitor[1].cname != '') ? visitor[1].cname : visitor[0].unique_name;
        visName = lzm_commonTools.escapeHtml(visName);
        var errorMessage = t('<!--op_name--> invites you to join his chat with <!--visitor_name-->.',
            [['<!--op_name-->', operator.name], ['<!--visitor_name-->', visName]]) + '<br />';
        errorMessage += t('In additon, the following information was given:') + '<br />';
        errorMessage +='<div id="add-info-box" style="height:50px; overflow-y: auto; border: 1px solid #ccc; padding: 2px 4px; margin-top: 5px;">' + newForward.t + '</div>';
        lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'join', name: t('Join Chat')}, {id: 'decline', name: t('Decline')}]);
        $('#alert-btn-join').click(function() {
            joinChat(visitor[0].id, visitor[1].id, visitor[1].chat.id, false, true);
            lzm_chatDisplay.showOpInviteDialog = false;
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-decline').click(function() {
            lzm_chatDisplay.showOpInviteDialog = false;
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function showVisitorChatActionContextMenu(chatReco, button, e) {
    e.stopPropagation();
    if (button == 'panel') {
        e.preventDefault();
    }
    if (lzm_chatDisplay.showChatActionsMenu) {
        removeVisitorChatActionContextMenu();
    } else {
        lzm_chatDisplay.showChatActionsMenu = true;
        var userChat = lzm_chatServerEvaluation.userChats.getUserChat(chatReco);
        userChat.button = button;
        var parentOffset = $('#chat-container').offset();
        var xValue, yValue;
        if (button == 'actions') {
            var buttonOffset = $('#visitor-chat-actions').offset();
            xValue = buttonOffset.left - parentOffset.left - 1;
            yValue = e.pageY - parentOffset.top;
        } else {
            xValue = e.pageX - parentOffset.left;
            yValue = e.pageY - parentOffset.top;
        }

        lzm_chatDisplay.showContextMenu('chat-actions', userChat, xValue, yValue, 'chat-actions');
    }
}

function removeVisitorChatActionContextMenu() {
    lzm_chatDisplay.showChatActionsMenu = false;
    $('#chat-actions-context').remove();
}

/**************************************** Operator settings ****************************************/
function setUserStatus(statusValue, myName, myUserId, e) {
    e.stopPropagation();
    var previousStatusValue = lzm_chatPollServer.user_status;
    lzm_chatDisplay.setUserStatus(statusValue, myName, myUserId);
    if (statusValue != 2 && previousStatusValue != 2 && statusValue != previousStatusValue) {
        lzm_chatPollServer.startPolling();
    }
    if (typeof lzm_deviceInterface != 'undefined') {
        try {
            lzm_deviceInterface.setOperatorStatus(parseInt(statusValue));
        } catch(e) {}
    }
}

function manageUsersettings(e) {
    e.stopPropagation();
    saveChatInput(lzm_chatDisplay.active_chat_reco);
    var storedSettingsId = '';
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'settings') {
                storedSettingsId = key;
            }
        }
    }
    if (storedSettingsId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedSettingsId);
    } else {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            saveChatInput(lzm_chatDisplay.active_chat_reco);
            removeEditor();
        }
        lzm_chatDisplay.settingsDisplay.manageUsersettings();
    }
}

function saveUserSettings() {
    var firstVisibleView = null;
    var showViewSelectPanel = {
        'home': $('#show-home').prop('checked') ? 1 : 0,
        'world': $('#show-world').prop('checked') ? 1 : 0,
        'mychats': $('#show-mychats').prop('checked') ? 1 : 0,
        'tickets': $('#show-tickets').prop('checked') ? 1 : 0,
        'external': $('#show-external').prop('checked') ? 1 : 0,
        'internal': $('#show-internal').prop('checked') ? 1 : 0,
        'qrd': $('#show-qrd').prop('checked') ? 1 : 0,
        'archive': $('#show-archive').prop('checked') ? 1 : 0,
        'reports': $('#show-reports').prop('checked') ? 1 : 0
    };
    var viewSelectArray = [], viewSelectObject = {}, i = 0, thisColumn, columnIsVisible;
    var allViewsArray = Object.keys(lzm_chatDisplay.allViewSelectEntries);
    for (i=0; i<allViewsArray.length; i++) {
        viewSelectObject[allViewsArray[i]] =
        {name: lzm_chatDisplay.allViewSelectEntries[allViewsArray[i]].title, icon: lzm_chatDisplay.allViewSelectEntries[allViewsArray[i]].icon};
    }
    $('.show-view-div').each(function() {
        var viewId = $(this).data('view-id');
        if (firstVisibleView == null && showViewSelectPanel[viewId] != 0) {
            firstVisibleView = viewId;
        }
        viewSelectArray.push({id: viewId, name: viewSelectObject[viewId].name, icon: viewSelectObject[viewId].icon});
    });
    lzm_chatDisplay.viewSelectArray = viewSelectArray;
    var tableNames = ['visitor', 'archive', 'ticket', 'allchats'];
    var tableColumns = {};
    for (var j=0; j<tableNames.length; j++) {
        tableColumns[tableNames[j]] = {general: [], custom: []};
        for (i=0; i<lzm_chatDisplay.mainTableColumns[tableNames[j]].length; i++) {
            thisColumn = lzm_chatDisplay.mainTableColumns[tableNames[j]][i];
            thisColumn.display = ($('#display-' + tableNames[j] + '-column-' + thisColumn.cid).prop('checked')) ? 1 : 0;
            tableColumns[tableNames[j]].general.push(thisColumn);
        }
        for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
            var myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
            if (myCustomInput != null && parseInt(myCustomInput.id) < 111 && myCustomInput.active == '1') {
                columnIsVisible = ($('#display-' + tableNames[j] + '-column-custom-' + myCustomInput.id).prop('checked')) ? 1 : 0;
                thisColumn = {cid: myCustomInput.id, display: columnIsVisible};
                tableColumns[tableNames[j]].custom.push(thisColumn);
            }
        }
    }
    var settings = {
        volume: $('#volume-slider').val(),
        awayAfterTime: $('#away-after-time').val(),
        playNewMessageSound: $('#sound-new-message').prop('checked') ? 1 : 0,
        playNewChatSound: $('#sound-new-chat').prop('checked') ? 1 : 0,
        repeatNewChatSound: $('#sound-repeat-new-chat').prop('checked') ? 1 : 0,
        backgroundMode: $('#background-mode').prop('checked') ? 1 : 0,
        saveConnections: $('#save-connections').prop('checked') ? 1 : 0,
        ticketsRead: $('#tickets-read').prop('checked') ? 1 : 0,
        playNewTicketSound: $('#sound-new-ticket').prop('checked') ? 1 : 0,
        showViewSelectPanel: showViewSelectPanel,
        viewSelectArray: viewSelectArray,
        autoAccept: $('#auto-accept').prop('checked') ? 1 : 0,
        tableColumns: tableColumns,
        vibrateNotifications: $('#vibrate-notifications').prop('checked') ? 1 : 0,
        qrdAutoSearch: $('#qrd-auto-search').prop('checked') ? 1 : 0,
        alertNewFilter: $('#alert-new-filter').prop('checked') ? 1 : 0
    };
    if (appOs == 'blackberry') {
        settings.backgroundMode = 1;
    }
    lzm_chatUserActions.saveUserSettings(settings, multiServerId, app==1);
    lzm_chatDisplay.createViewSelectPanel(firstVisibleView);
    if (lzm_chatDisplay.selected_view == 'internal') {
        lzm_chatDisplay.visitorDisplay.createVisitorList();
    }
    lzm_chatDisplay.allchatsDisplay.createAllchats();
    if (lzm_chatDisplay.selected_view == 'mychats') {
        $('#chat-qrd-preview').html('');
        lzm_chatDisplay.createChatWindowLayout(true);
    }
}

function finishSettingsDialogue() {
    lzm_chatServerEvaluation.settingsDialogue = false;
    lzm_chatDisplay.settingsDialogue = false;
    $('#usersettings-container').css({display: 'none'});
    if (lzm_chatDisplay.selected_view == 'mychats') {
        initEditor(loadChatInput(lzm_chatDisplay.active_chat_reco), 'finishSettings');
    }
}

function showUserManagement(e) {
    e.stopPropagation();
    if (lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId).level == 1) {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        var storedSettingsId = '';
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if (lzm_chatDisplay.StoredDialogs[key].type == 'user-management') {
                    storedSettingsId = key;
                }
            }
        }
        if (storedSettingsId != '') {
            lzm_displayHelper.maximizeDialogWindow(storedSettingsId);
        } else {
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                saveChatInput(lzm_chatDisplay.active_chat_reco);
                removeEditor();
            }
            lzm_chatDisplay.settingsDisplay.createUserManagement();
        }
    } else {
        showNoAdministratorMessage();
    }
}

function setUserManagementTitle(newTitle) {
    if (lzm_chatDisplay.settingsDisplay.userManagementAction == 'list') {
        $('#save-usermanagement').css({visibility: 'hidden'});
        $('#cancel-usermanagement-text').html(t('Close'));
    } else {
        $('#save-usermanagement').css({visibility: 'visible'});
        $('#cancel-usermanagement-text').html(t('Cancel'));
    }
    var oldTitle = $('#user-management-dialog-headline-text').html();
    $('#user-management-dialog-headline-text').html(newTitle);

    return oldTitle;
}

function removeUserManagement() {
    lzm_displayHelper.removeDialogWindow('user-management-dialog');
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
    if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
        var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
        initEditor(myText, 'CancelUserManagement', lzm_chatDisplay.active_chat_reco);
    }
}

function closeOperatorGroupConfiguration() {
    document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.hideEditDialog();
    lzm_chatDisplay.settingsDisplay.userManagementAction = 'list';
    setUserManagementTitle(lzm_chatDisplay.settingsDisplay.userManagementDialogTitle);
}

function closeOperatorSignatureTextInput() {
    var umg = document.getElementById('user-management-iframe').contentWindow.lzm_userManagement;
    umg.hideInputDialog();
    lzm_chatDisplay.settingsDisplay.userManagementAction = (umg.selectedListTab == 'user') ? 'operator' : 'group';
}

function showTranslationEditor(e) {
    e.stopPropagation();
    if (lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId).level == 1) {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        var storedSettingsId = '';
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if (lzm_chatDisplay.StoredDialogs[key].type == 'translation-editor') {
                    storedSettingsId = key;
                }
            }
        }
        if (storedSettingsId != '') {
            lzm_displayHelper.maximizeDialogWindow(storedSettingsId);
        } else {
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                saveChatInput(lzm_chatDisplay.active_chat_reco);
                removeEditor();
            }
            lzm_chatDisplay.translationEditor.loadTranslationLanguages();
            if (lzm_chatDisplay.translationEditor.serverStrings.length == 0) {
                var useEn = false, useDefault = false, useBrowser = false, useShortBrowser = false;
                var trLanguages = lzm_commonTools.clone(lzm_chatServerEvaluation.translationLanguages);
                var defLang = lzm_chatServerEvaluation.defaultLanguage;
                var brLang = lzm_t.language;
                var brSLang = lzm_t.language.split('-')[0];
                for (var i=0; i<trLanguages.length; i++) {
                    useEn = (trLanguages[i].key == 'en' && trLanguages[i].m == 0) ? true : useEn;
                    useDefault = (trLanguages[i].key == defLang && trLanguages[i].m == 0) ? true : useDefault;
                    useBrowser = (trLanguages[i].key == brLang && trLanguages[i].m == 0) ? true : useBrowser;
                    useShortBrowser = (trLanguages[i].key == brSLang && trLanguages[i].m == 0) ? true : useShortBrowser;
                }
                var origStringLanguage = (useEn) ? 'en' : (useDefault) ? defLang : (useBrowser) ? brLang : (useShortBrowser) ? brSLang : (trLanguages.length > 0) ? trLanguages[0].key : '';
                showTranslationStringsLoadingDiv();
                lzm_chatPollServer.pollServerSpecial({l: origStringLanguage, m: 0, o: 0}, 'load-translation');
            }
        }
    } else {
        showNoAdministratorMessage();
    }
}

function selectTranslationLanguage(language, langName, langEdit, changed, translationTab, isNew) {
    isNew = (typeof isNew != 'undefined') ? isNew : false;
    var idPrefix = (translationTab == 'server') ? 'srv-' : '';
    if (translationTab == 'server') {
        lzm_chatDisplay.translationEditor.selectedLanguages.server = language;
    } else if (translationTab == 'mobile_client') {
        lzm_chatDisplay.translationEditor.selectedLanguages.mobile = language;
    }
    if (language != '') {
        changed = (typeof changed != 'undefined') ? changed : 0;
        try {
            selectTranslationLine('');
        } catch(ex) {}
        if (idPrefix == '' && $.inArray(language, lzm_chatDisplay.translationEditor.defaultLanguages) != -1) {
            $('#' + idPrefix + 'translation-language-delete').html(t('Reset'));
            $('#' + idPrefix + 'translation-language-delete').attr('title', t('Reset Translation'));
        } else {
            $('#' + idPrefix + 'translation-language-delete').html(t('Delete'));
            $('#' + idPrefix + 'translation-language-delete').attr('title', t('Delete Language'));
        }
        if ((idPrefix == '' && langEdit == 1) ||
            (idPrefix != '' && language.toLowerCase() != lzm_chatServerEvaluation.defaultLanguage.toLowerCase())) {
            $('#' + idPrefix + 'translation-language-delete').removeClass('ui-disabled');
        } else {
            $('#' + idPrefix + 'translation-language-delete').addClass('ui-disabled');
        }
        $('#' + idPrefix + 'translation-language-edit').removeClass('ui-disabled');
        lzm_chatDisplay.translationEditor.languageCode = language;
        lzm_chatDisplay.translationEditor.languageName = langName;
        $('.translation-language-line').removeClass('selected-table-line');
        $('#' + idPrefix + 'translation-language-line-' + language).addClass('selected-table-line');
        lzm_chatDisplay.translationEditor.selectedTranslationTab = translationTab;
        var myPollDataObject = {l: (language != 'en' || langEdit == 1) ? language : 'orig', m: (translationTab == 'server') ? 0 : 1, o: 1 - langEdit};
        var saveTranslations = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations);
        if (typeof saveTranslations[idPrefix + language] == 'undefined' ||
            typeof saveTranslations[idPrefix + language].strings == 'undefined' ||
            saveTranslations[idPrefix + language].strings.length == 0) {
            showTranslationStringsLoadingDiv();
            lzm_chatPollServer.pollServerSpecial(myPollDataObject, 'load-translation');
        } else {
            if (!isNew)
                lzm_chatDisplay.translationEditor.showTranslationStrings();
            else
                downloadTranslationLanguage(translationTab);
        }
    } else {
        $('.translation-language-line').removeClass('selected-table-line');
        lzm_chatDisplay.translationEditor.showTranslationStrings();
    }
}

function showTranslationStringsLoadingDiv() {
    var loadingHtml = '<div id="translation-strings-loading"></div>';
    $('#translation-editor-body').append(loadingHtml).trigger('create');
    var myWidth = $('#translation-editor-body').width() + 10;
    var myHeight = $('#translation-editor-body').height() + 10;
    $('#translation-strings-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
        'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
        'background-position': 'center', 'z-index': 1000, opacity: 0.85});
}

function removeTranslationStringsLoadingDiv() {
    $('#translation-strings-loading').remove();
}

function selectTranslationLine(myKey) {
    if (typeof $('#translation-string-table').data('selected-line') != 'undefined' && typeof $('#translation-string-input').val() != 'undefined') {
        var languageCode = (lzm_chatDisplay.translationEditor.selectedTranslationTab == 'mobile_client') ?
            lzm_chatDisplay.translationEditor.languageCode : 'srv-' + lzm_chatDisplay.translationEditor.languageCode;
        var languageStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings);
        var translation = $('#translation-string-input').val();
        var selectedLine = $('#translation-string-table').data('selected-line');
        for (var i=0; i<languageStrings.length; i++) {
            if (languageStrings[i].key == selectedLine) {
                if (languageStrings[i].editedValue != translation) {
                    lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings[i].editedValue = translation;
                    $('#save-translation-editor').removeClass('ui-disabled');
                    lzm_chatDisplay.translationEditor.saveTranslations[languageCode].edit = 1;
                }
                $('#translation-translated-string-' + selectedLine).html(translation.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                var translationIcon = (translation != languageStrings[i].editedValue || translation != languageStrings[i].orig ||
                    languageCode == 'en' || languageCode == 'srv-en') ? '<i class="fa fa-check-circle" style="color: #73be28;"></i>' :
                    '<i class="fa fa-warning" style="color: #e34e4e;"></i>';
                $('#translation-icon-' + languageStrings[i].key).html(translationIcon).trigger('create');
            }
        }

    }
    $('.translation-line').removeClass('selected-table-line');
    if (myKey != '') {
        $('#translation-line-' + myKey).addClass('selected-table-line');
        $('#translation-string-table').data('selected-line', myKey);
    }
}

function editTranslationString(myKey, e) {
    e.stopPropagation();
    selectTranslationLine(myKey);
    var languageCode = (lzm_chatDisplay.translationEditor.selectedTranslationTab == 'mobile_client') ?
        lzm_chatDisplay.translationEditor.languageCode : 'srv-' + lzm_chatDisplay.translationEditor.languageCode;
    var languageStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[languageCode].strings);
    for (var i=0; i<languageStrings.length; i++) {
        if (languageStrings[i].key == myKey) {
            var existingTranslation = languageStrings[i].editedValue;
            var columnWidth = (lzm_chatDisplay.translationEditor.selectedTranslationTab == 'mobile_client') ?
                $('#translation-translated-column').width() : $('#srv-translation-translated-column').width();
            var inputFieldHtml = '<input type="text" id="translation-string-input"' +
                ' onclick="doNotSelectTranslationLine(event);" onkeyup="translationEditorEnterPressed(event);"' +
                ' data-role="none" class="lzm-text-input" style="min-width: 0px; width: ' + (columnWidth - 20) + 'px;"/>';
            $('#translation-translated-string-' + myKey).html(inputFieldHtml).trigger('create');
            $('#translation-string-input').val(existingTranslation);
        }
    }
}

function doNotSelectTranslationLine(e) {
    e.stopPropagation();
}

function translationEditorEnterPressed(e) {
    var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
    if (keyCode == 13) {
        selectTranslationLine('');
    }
}

function addTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.addTranslationLanguage('add', myTab);
}

function editTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.addTranslationLanguage('edit', myTab);
}

function saveTranslations() {
    selectTranslationLine('');
    lzm_chatDisplay.translationEditor.saveTranslationFiles();
}

function deleteTranslationLanguage(myTab) {
    lzm_chatDisplay.translationEditor.deleteTranslationLanguage(myTab);
}

function suggestTranslationLanguage(myTab) {
    var lng = lzm_chatDisplay.translationEditor.languageCode, idPrefix = (myTab == 'server') ? 'srv-' : '';
    var postParams = {iso: lng.toUpperCase(), sid: lzm_chatPollServer.loginId,
        version: lzm_commonConfig.lz_version};
    if (myTab == 'server') {
        postParams.upload = 1;
    } else {
        postParams.mobile_upload = 1;
    }
    var translationStrings = lzm_commonTools.clone(lzm_chatDisplay.translationEditor.saveTranslations[idPrefix + lng].strings);
    for (var i=0; i<translationStrings.length; i++) {
        //FIXME: Add this check again after uploading the EN translation data
        if (translationStrings[i].key.indexOf('client_custom_') != 0 && translationStrings[i].editedValue.replace(/^ +/, '') != ''/* &&
            (lzm_chatDisplay.translationEditor.origStringLanguage != 'en' || translationStrings[i].editedValue != translationStrings[i].orig)*/)
            postParams['tk_' + translationStrings[i].key] = translationStrings[i].editedValue;
    }
    lzm_chatDisplay.translationEditor.contactLzTranslationServer(myTab, 'upload', postParams);
}

function downloadTranslationLanguage(myTab) {
    var idPrefix = (myTab == 'server') ? 'srv-' : '';
    $('#translation-string-table').remove();
    var lng = lzm_chatDisplay.translationEditor.languageCode;
    var postParams = {iso: lng.toUpperCase(), sid: lzm_chatPollServer.loginId};
    if (myTab == 'server') {
        postParams.download = 1;
    } else {
        postParams.mobile_download = 1;
    }
    lzm_chatDisplay.translationEditor.contactLzTranslationServer(myTab, 'download', postParams);
}

function translationSearchFieldKeyUp(myTab) {
    var idPrefix = (myTab == 'server') ? 'srv-' : '';
    var searchString = $('#' + idPrefix + 'translation-search-string').val();
    lzm_chatDisplay.translationEditor.lastSearchCharacterTyped = lzm_chatTimeStamp.getServerTimeString(null, true, 1);
    setTimeout(function() {
        var now = lzm_chatTimeStamp.getServerTimeString(null, true, 1);
        if (now - lzm_chatDisplay.translationEditor.lastSearchCharacterTyped > 500) {
            if (lzm_chatDisplay.translationEditor.languageCode != '' && lzm_chatDisplay.translationEditor.selectedTranslationTab == myTab) {
                lzm_chatDisplay.translationEditor.showTranslationStrings(searchString);
            }
        }
    }, 505);
}

function changePassword(e) {
    e.stopPropagation();
    saveChatInput(lzm_chatDisplay.active_chat_reco);
    var storedSettingsId = '';
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'change-password') {
                storedSettingsId = key;
            }
        }
    }
    if (storedSettingsId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedSettingsId);
    } else {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            saveChatInput(lzm_chatDisplay.active_chat_reco);
            removeEditor();
        }
        lzm_commonDialog.changePassword('chat');
    }
}

function savePasswordChange(newPassword) {
    lzm_chatPollServer.pollServerSpecial({i: lzm_chatDisplay.myId, p: newPassword}, 'change-password');
}

function showUserSettingsMenu(e) {
    e.stopPropagation();
    var thisUsersettingsMenu = $('#usersettings-menu');
    if (lzm_chatDisplay.showUsersettingsHtml == false) {
        lzm_chatDisplay.showUsersettingsMenu();
        thisUsersettingsMenu.css({'display':'block'});
        lzm_chatDisplay.showUsersettingsHtml = true;
    } else {
        thisUsersettingsMenu.css({'display':'none'});
        lzm_chatDisplay.showUsersettingsHtml = false;
    }
    if (!mobile && app != 1) {
        delete messageEditor;
    }
    $('#chat-invitation-container').remove();
}

function showUserStatusMenu(e) {
    e.stopPropagation();
    var thisUserstatusMenu = $('#userstatus-menu');
    if (lzm_chatDisplay.showUserstatusHtml == false) {
        lzm_chatDisplay.showUserstatusMenu(lzm_chatPollServer.user_status, lzm_chatServerEvaluation.myName,
            lzm_chatServerEvaluation.myUserId);
        thisUserstatusMenu.css({'display':'block'});
        lzm_chatDisplay.showUserstatusHtml = true;
    } else {
        thisUserstatusMenu.css({'display':'none'});
        lzm_chatDisplay.showUserstatusHtml = false;
    }
    if (!mobile && app != 1) {
        delete messageEditor;
    }
    $('#chat-invitation-container').remove();
}

/**************************************** Visitor functions ****************************************/
function showVisitorInvitation(id) {
    if (!lzm_commonPermissions.checkUserPermissions('', 'chats', 'send_invites', {})) {
        showNoPermissionMessage();
    } else if (lzm_chatDisplay.allMyGroupsAreOffline) {
        showOutsideOpeningMessage();
    } else {
        var doShowInvitationDialog = function() {
            var storedInvitationId = '';
            for (var key in lzm_chatDisplay.StoredDialogs) {
                if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                    if (lzm_chatDisplay.StoredDialogs[key].type == 'visitor-invitation' &&
                        typeof lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] != 'undefined' &&
                        lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] == id) {
                        storedInvitationId = key;
                    }
                }
            }
            if (storedInvitationId != '') {
                lzm_displayHelper.maximizeDialogWindow(storedInvitationId);
            } else {
                var aVisitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
                aVisitor = (aVisitor != null) ? aVisitor : {id: '', b_id: ''};
                lzm_chatDisplay.visitorDisplay.showVisitorInvitation(aVisitor);
            }
        };
        if (visitorHasNotCanceled(id)) {
            doShowInvitationDialog();
        } else {
            var confirmText = t('This visitor has already declined an invitation.') + '<br />' + t('Invite this visitor again?');
            lzm_commonDialog.createAlertDialog(confirmText.replace(/\n/g, '<br />'), [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
            $('#alert-btn-ok').click(function() {
                doShowInvitationDialog();
                lzm_commonDialog.removeAlertDialog();
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
}

function startVisitorChat(id) {
    if (!lzm_commonPermissions.checkUserPermissions('', 'chats', 'start_new', {})) {
        showNoPermissionMessage();
    } else if (lzm_chatDisplay.allMyGroupsAreOffline) {
        showOutsideOpeningMessage();
    } else {
        lzm_chatPollServer.pollServerSpecial({visitorId: id, browserId: id + '_OVL'}, 'start_overlay');
    }
}

function visitorHasNotCanceled(id) {
    var rtValue = true;
    var aVisitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
    aVisitor = (aVisitor != null) ? aVisitor : {id: '', b_id: ''};
    if (typeof aVisitor.r != 'undefined' && aVisitor.r.length > 0) {
        for (var i=0; i< aVisitor.r.length; i++) {
            if (aVisitor.r[i].de == 1) {
                rtValue = false;
            }
        }
    }
    return rtValue;
}

function inviteExternalUser(id, b_id, text) {
    lzm_chatUserActions.inviteExternalUser(id, b_id, text);
}

function cancelInvitation(id) {
    var inviter = '';
    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
    try {
        inviter = visitor.r[0].s;
    } catch(e) {}
    if ((lzm_commonPermissions.checkUserPermissions('', 'chats', 'cancel_invites', {}) && lzm_commonPermissions.checkUserPermissions('', 'chats', 'cancel_invites_others', {})) ||
        (lzm_commonPermissions.checkUserPermissions('', 'chats', 'cancel_invites', {}) && (inviter == lzm_chatDisplay.myId || inviter == ''))) {
        lzm_chatUserActions.cancelInvitation(id);
    } else {
        showNoPermissionMessage();
    }
}

function selectVisitor(e, visitorId) {
    lzm_chatGeoTrackingMap.selectedVisitor = visitorId;
    $('#visitor-list').data('selected-visitor', visitorId);
    $('.visitor-list-line').removeClass('selected-table-line');
    $('#visitor-list-row-' + visitorId).addClass('selected-table-line');
}

function showVisitorInfo(userId, userName,  chatId, activeTab) {
    activeTab = (typeof activeTab != 'undefined') ? activeTab : 0;
    userName = (typeof userName != 'undefined') ? userName : '';
    chatId = (typeof chatId != 'undefined') ? chatId : '';
    var chatFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
    lzm_chatServerEvaluation.expectArchiveChanges = true;
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    window['tmp-chat-archive-values'] = {page: lzm_chatPollServer.chatArchivePage,
        limit: lzm_chatPollServer.chatArchiveLimit, query: lzm_chatPollServer.chatArchiveQuery,
        filter: lzm_chatPollServer.chatArchiveFilter};
    window['tmp-ticket-values'] = {page: lzm_chatPollServer.ticketPage, limit: lzm_chatPollServer.ticketLimit,
        query: lzm_chatPollServer.ticketQuery, filter: lzm_chatPollServer.ticketFilter,
        filterChannel: lzm_chatPollServer.ticketFilterChannel, sort: lzm_chatPollServer.ticketSort};
    lzm_chatPollServer.chatArchivePage = 1;
    lzm_chatPollServer.chatArchiveLimit = 1000;
    lzm_chatPollServer.chatArchiveQuery = '';
    lzm_chatPollServer.chatArchiveFilter = '';
    lzm_chatPollServer.chatArchiveFilterExternal = userId;
    lzm_chatPollServer.ticketPage = 1;
    lzm_chatPollServer.ticketLimit = 1000;
    lzm_chatPollServer.ticketQuery = userId;
    lzm_chatPollServer.ticketFilter = '0123';
    lzm_chatPollServer.ticketSort = '';
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.resetChats = true;
    var storedDialogId = '';
    for (var key in lzm_chatDisplay.StoredDialogs) {
        if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
            if (lzm_chatDisplay.StoredDialogs[key].type == 'visitor-information' &&
                typeof lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] != 'undefined' &&
                lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] == userId) {
                storedDialogId = key;
                if (typeof lzm_chatDisplay.StoredDialogs[key + '-transcript'] != 'undefined')
                    storedDialogId = key + '-transcript';
                if (typeof lzm_chatDisplay.StoredDialogs[key + '_linker'] != 'undefined')
                    storedDialogId = key + '_linker';
            }
        }
    }
    if (storedDialogId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedDialogId);
    } else {
        var thisUser = {id: userId, unique_name: userName};
        if (typeof userId != 'undefined') {
            var visitor = lzm_chatServerEvaluation.visitors.getVisitor(userId);
            thisUser = (visitor != null) ? visitor : thisUser;
        }

        if (typeof userId != 'undefined' && userId != '') {
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                saveChatInput(lzm_chatDisplay.active_chat_reco);
                removeEditor();
            }
            lzm_chatDisplay.infoUser = thisUser;
            lzm_chatDisplay.visitorDisplay.showVisitorInformation(thisUser, chatId, activeTab);
            switchTicketListPresentation(ticketFetchTime, 0);
            switchArchivePresentation(chatFetchTime, 0);
        }
    }
    lzm_chatPollServer.startPolling();
}

function addVisitorComment(visitorId, menuEntry) {
    lzm_chatDisplay.visitorDisplay.addVisitorComment(visitorId, menuEntry);
}

function showFilterCreation(visitorId, chatId, filterId, inDialog) {
    if (!lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'create_filter', {})) {
        showNoPermissionMessage();
    } else {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (!inDialog && lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            saveChatInput(lzm_chatDisplay.active_chat_reco);
            removeEditor();
        }
        var visitor = null, filter = null;
        inDialog = (typeof inDialog != 'undefined') ? inDialog :  false;
        if (typeof chatId != 'undefined' && chatId != '') {
            visitor  = lzm_chatServerEvaluation.visitors.getVisitor(chatId, 'chat_id');
        } else if (typeof visitorId != 'undefined' && visitorId != '') {
            visitor = lzm_chatServerEvaluation.visitors.getVisitor(visitorId, 'id');
        }
        if (typeof filterId != 'undefined' && filterId != '') {
            filter = lzm_chatServerEvaluation.filters.getFilter(filterId);
        }
        if (inDialog) {
            removeFiltersListContextMenu();
        }
        lzm_chatDisplay.visitorDisplay.showFilterCreation(visitor, filter, inDialog);
    }
}

function deleteFilter(filterId) {
    if (!lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'create_filter', {})) {
        showNoPermissionMessage();
    } else {
        var loadingHtml = '<div id="filter-list-loading"></div>';
         $('#filter-list-body').append(loadingHtml).trigger('create');
         var myWidth = $('#filter-list-body').width() + 10;
         var myHeight = $('#filter-list-body').height() + 10;
         $('#filter-list-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
         'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
         'background-position': 'center', 'z-index': 1000, opacity: 0.85});
        var alertMessage = t('Do you really want to remove all selected items irrevocably?');
        lzm_commonDialog.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
        removeFiltersListContextMenu();
        var filter = lzm_chatServerEvaluation.filters.getFilter(filterId);
        if (filter != null) {
            var postDataObject = {creator: filter.creator, editor: filter.editor, vip: filter.ip, vid: filter.userid,
                expires: filter.expires, fname: filter.filtername, freason: filter.reason, fid: filter.filterid,
                state: filter.active, type: 2, exertion: filter.exertion, lang: filter.languages, countries: filter.c,
                allow_chats: filter.ac, allow_tickets: filter.at, allow_monitoring: filter.atr};
            lzm_chatPollServer.pollServerSpecial(postDataObject, 'visitor-filter');
        }
    }
}

function saveFilter(type) {
    type = (type == 'add') ? 0 : (type == 'edit') ? 1 : 2;
    var filterId = (type == 0) ? md5(Math.random().toString()) : $('#filter-filterid').val();
    var activeCheck = ($('#filter-active').attr('checked') == 'checked') ? 1 : 0;
    var ipCheck = ($('#filter-ip-check').attr('checked') == 'checked') ? 1 : 0;
    var idCheck = ($('#filter-id-check').attr('checked') == 'checked') ? 1 : 0;
    var lgCheck = ($('#filter-lg-check').attr('checked') == 'checked') ? 1 : 0;
    var coCheck = ($('#filter-co-check').attr('checked') == 'checked') ? 1 : 0;
    var allowChats = ($('#filter-chat-check').attr('checked') == 'checked') ? 0 : 1;
    var allowTickets = ($('#filter-ticket-check').attr('checked') == 'checked') ? 0 : 1;
    var allowMonitoring = ($('#filter-monitoring-check').attr('checked') == 'checked') ? 0 : 1;
    var expires = (!isNaN(parseInt($('#filter-expire-after').val()))) ? parseInt($('#filter-expire-after').val()) : 7;
    expires = expires * 24 * 60 * 60;// + lzm_chatTimeStamp.getServerTimeString(null, true);
    expires = ($('#filter-exp-check').attr('checked') == 'checked') ? expires : -1;
    var languages = (lgCheck == 1) ? $('#filter-lg').val().replace(/ +/g, '').toUpperCase() : '';
    var countries = (coCheck == 1) ? $('#filter-co').val().replace(/ +/g, '').toUpperCase() : '';
    var userId = (idCheck == 1) ? $('#filter-id').val() : '';
    var userIp = (ipCheck == 1) ? $('#filter-ip').val() : '';
    var filter = {creator: lzm_chatDisplay.myId, editor: lzm_chatDisplay.myId, vip: userIp, vid: userId,
        expires: expires, fname: $('#filter-name').val(), freason: $('#filter-reason').val(), fid: filterId,
        state: activeCheck, type: type, exertion: $('#filter-type').val(), lang: languages, countries: countries, allow_chats: allowChats,
        allow_tickets: allowTickets, allow_monitoring: allowMonitoring};
    lzm_chatPollServer.pollServerSpecial(filter, 'visitor-filter');
}

function loadCoBrowsingContent(vb, noActiveBrowserPresent) {
    $('#visitor-cobrowse-inner').addClass('ui-disabled');
    vb = (typeof vb != 'undefined') ? vb : lzm_chatServerEvaluation.visitors.getVisitorBrowser($('#visitor-cobrowse-iframe').data('browser'));
    noActiveBrowserPresent = (typeof noActiveBrowserPresent != 'undefined') ? noActiveBrowserPresent : false;
    var iframeHeight = $('#visitor-cobrowse-iframe').height();
    var iframeWidth = $('#visitor-cobrowse-iframe').width();
    if (!noActiveBrowserPresent && vb[1] != null) {
        var browserUrl = vb[1].h2[vb[1].h2.length - 1].url;
        var urlParts = browserUrl.split('#');
        var paramDivisor = (urlParts[0].indexOf('?') == -1) ? '?' : '&';
        var acid = md5(Math.random().toString()).substr(0, 5);
        urlParts[0] += paramDivisor + 'lzcobrowse=true&lzmobile=true&acid=' + acid;
        var coBrowseUrl = urlParts.join('#');
        $('#visitor-cobrowse-iframe').data('browser-url', browserUrl);
        //$('#visitor-cobrowse-iframe').attr('src', coBrowseUrl);
        var oldIframeDataBrowser = $('#visitor-cobrowse-iframe').data('browser');
        var oldIframeDataBrowserUrl = $('#visitor-cobrowse-iframe').data('browser-url');
        var oldIframeDataLanguage = $('#visitor-cobrowse-iframe').data('language');
        var oldIframeDataAction = $('#visitor-cobrowse-iframe').data('action');
        var oldIframeDataVisible = $('#visitor-cobrowse-iframe').data('visible');
        var newIframeHtml = '<iframe id="visitor-cobrowse-iframe"' +
            ' data-browser="' + oldIframeDataBrowser + '"' +
            ' data-browser-url="' + oldIframeDataBrowserUrl + '"' +
            ' data-action="' + oldIframeDataAction + '"' +
            ' data-language="' + oldIframeDataLanguage + '"' +
            ' data-visible="' + oldIframeDataVisible + '"' +
            ' style="border: 1px solid #ccc;" src="' + coBrowseUrl + '"></iframe>';
        $('#visitor-cobrowse-iframe').replaceWith(newIframeHtml).trigger('create');
        lzm_displayLayout.resizeVisitorDetails();
        var serverUrlParts = lzm_chatPollServer.chosenProfile.server_url.split('/');
        var serverAddress = (serverUrlParts[0].indexOf(':') == -1) ? serverUrlParts[0] : serverUrlParts[0].split(':')[0];
        var browserUrlParts = browserUrl.split('://');
        var browserProtocol = browserUrlParts[0] + '://';
        browserUrlParts = (browserUrlParts.length > 1) ? browserUrlParts[1].split('/') : [''];
        var browserAddress = (browserUrlParts[0].indexOf(':') == -1) ? browserUrlParts[0] : browserUrlParts[0].split(':')[0];
        $('#visitor-cobrowse-iframe').load(function() {
            iframeEnabled = false;
            toggleIframeBlockedState(0, browserProtocol, browserAddress);
        });
    } else if (noActiveBrowserPresent) {
        enableCobrowsingIframe();
        $('#visitor-cobrowse-iframe').data('browser-url', '');
        $('#visitor-cobrowse-iframe').attr('src', '');
        var fontSize = (iframeWidth < 400) ? 18 : 22;
        var marginTop = Math.floor((iframeHeight - fontSize - 2) / 2);
        setTimeout(function() {
            $('#visitor-cobrowse-iframe').contents().find('body').html('<div style="text-align: center; background: #fff; font-weight: bold;' +
                ' font-size: ' + fontSize + 'px; color: #bbb; font-family: Arial,Helvetica,Liberation Sans,DejaVu Sans,sans-serif;">' +
                '<span>' + t('The visitor has left the website') + '</span></div>');
            $('#visitor-cobrowse-iframe').contents().find('body').css({'margin-top': marginTop+'px'});
        }, 20);
    }
}

function toggleIframeBlockedState(counter, browserProtocol, browserAddress) {
    if (!iframeEnabled && counter < 20) {
        counter++;
        try {
            if ($('#visitor-cobrowse-iframe').data('action') == 0) {
                $('#visitor-cobrowse-iframe')[0].contentWindow.postMessage('block_page', browserProtocol + browserAddress);
            } else {
                $('#visitor-cobrowse-iframe')[0].contentWindow.postMessage('unblock_page', browserProtocol + browserAddress);
            }
        } catch(ex) {}
        setTimeout(function() {
            toggleIframeBlockedState(counter, browserProtocol, browserAddress);
        }, 250);
    }
}

function enableCobrowsingIframe() {
    $('#visitor-cobrowse-inner').removeClass('ui-disabled');
}

function pushVisitorToWebsite(visitorBrowser, url, askBeforePushing, text, group, hasTargetBlank) {
    var dialogText = t('Do you really want to forward the visitor to this url?') + '<br /><br />' + url;
    lzm_commonDialog.createAlertDialog(dialogText, [{id: 'yes', name: t('Yes')}, {id: 'no', name: t('No')}]);
    $('#alert-btn-yes').click(function() {
        lzm_commonDialog.removeAlertDialog();
        var browserUrlParts = url.split('://');
        var browserProtocol = browserUrlParts[0] + '://';
        browserUrlParts = (browserUrlParts.length > 1) ? browserUrlParts[1].split('/') : [''];
        var browserAddress = (browserUrlParts[0].indexOf(':') == -1) ? browserUrlParts[0] : browserUrlParts[0].split(':')[0];
        var serverAddress = browserProtocol + lzm_chatServerEvaluation.hostName;
        if (hasTargetBlank) {
            dialogText = t('This URL shall be opened in a new window. You cannot open new windows on visitor side.');
            lzm_commonDialog.createAlertDialog(dialogText, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        } else if (serverAddress != browserProtocol + browserAddress) {
            dialogText = t('This link refers to another host. After pushing the visitor to this host, you cannot follow him any more.');
            lzm_commonDialog.createAlertDialog(dialogText, [{id: 'yes', name: t('Yes')}, {id: 'no', name: t('No')}]);
            $('#alert-btn-yes').click(function() {
                lzm_commonDialog.removeAlertDialog();
                doPush();
            });
            $('#alert-btn-no').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        } else {
            doPush();
        }
    });
    $('#alert-btn-no').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });

    var doPush = function() {
        var pushObject = {
            vid: visitorBrowser.split('~')[0],
            ask: askBeforePushing,
            url: url,
            bid: visitorBrowser.split('~')[1],
            text: text,
            gr: group
        };
        lzm_chatPollServer.pollServerSpecial(pushObject, 'website-push');
    }
}

function openVisitorListContextMenu(e, visitorId, isChatting, wasDeclined, invitationStatus) {
    e.stopPropagation();
    lzm_chatGeoTrackingMap.selectedVisitor = visitorId;
    $('#visitor-list').data('selected-visitor', visitorId);
    $('.visitor-list-line').removeClass('selected-table-line');
    $('#visitor-list-row-' + visitorId).addClass('selected-table-line');

    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(visitorId);
    visitor = (visitor != null) ? visitor : {};
    var invitationLogo = (invitationStatus == 'requested') ? 'img/632-skills_not.png' : 'img/632-skills.png';
    if (lzm_chatDisplay.visitorDisplay.showVisitorListContextMenu) {
        removeVisitorListContextMenu();
    } else {
        var scrolledDownY = $('#visitor-list-table-div').scrollTop();
        var scrolledDownX = $('#visitor-list-table-div').scrollLeft();
        var parentOffset = $('#visitor-list-table-div').offset();
        var yValue = e.pageY - parentOffset.top + scrolledDownY;
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        lzm_chatDisplay.visitorDisplay.showVisitorListContextMenu = true;
        lzm_chatDisplay.showContextMenu('visitor-list-table-div', {visitor: visitor, chatting: isChatting, declined: wasDeclined,
            status: invitationStatus, logo: invitationLogo}, xValue, yValue);
    }
    e.preventDefault();
}

function removeVisitorListContextMenu() {
    lzm_chatDisplay.visitorDisplay.showVisitorListContextMenu = false;
    $('#visitor-list-table-div-context').remove();
}

function isVisitorNeededInGui(id) {
    var visitorIsNeeded = false;
    var visitorAlreadyInList = false;
    var removeVisitorFromList = false;
    for (var i=0; i<visitorsStillNeeded.length; i++) {
        if (visitorsStillNeeded[i].id == id) {
            visitorAlreadyInList = true;
            if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - visitorsStillNeeded[i].time < 120000) {
                visitorIsNeeded = true;
            } else {
                removeVisitorFromList = true;
            }
        }
    }
    if (!visitorAlreadyInList) {
        visitorIsNeeded = true;
        visitorsStillNeeded.push({id: id, time: lzm_chatTimeStamp.getServerTimeString(null, false, 1)});
    }
    var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
    for (var key in userChats) {
        if (userChats.hasOwnProperty(key)) {
            var openChatId = key.split('~')[0];
            if (openChatId == id && $.inArray(key, lzm_chatDisplay.closedChats) == -1) {
                visitorIsNeeded = true;
            }
        }
    }

    if (lzm_chatDisplay.ShowVisitorId == id) {
        visitorIsNeeded = true;
    }

    if (!visitorIsNeeded && removeVisitorFromList) {
        var tmpList = [];
        for (var j=0; j<visitorsStillNeeded.length; j++) {
            if (visitorsStillNeeded[j].id != id) {
                tmpList.push(visitorsStillNeeded[j]);
            }
        }
        visitorsStillNeeded = tmpList;
    }
    return visitorIsNeeded;
}

function handleVisitorCommentClick(selectedLine) {
    var thisUser = $('#visitor-information').data('visitor');
    var commentText = thisUser.c[selectedLine].text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />');
    $('#visitor-comment-list').data('selected-row', selectedLine);
    $('.visitor-comment-line').removeClass('selected-table-line');
    $('#visitor-comment-line-' + selectedLine).addClass('selected-table-line');
    $('#visitor-comment-text').html('<legend>' + t('Comment') + '</legend>' + lzm_commonTools.escapeHtml(commentText));
}

function blockVisitorListUpdate() {
    setTimeout(function() {
        if (lzm_chatDisplay.visitorListScrollingWasBlocked && $('.dialog-window-container').length == 0) {
            lzm_chatDisplay.visitorDisplay.updateVisitorList();
        }
    },2000);
}

function showFilterList(e) {
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
    if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        removeEditor();
    }
    lzm_chatDisplay.visitorDisplay.showFilterList();
}

function openFiltersListContextMenu(e, filterId) {
    e.preventDefault();
    selectFiltersLine(e, filterId);
    if (lzm_chatDisplay.visitorDisplay.showFilterListContextMenu) {
        removeFiltersListContextMenu();
    } else {
        var filter = lzm_chatServerEvaluation.filters.getFilter(filterId);
        if (filter != null) {
            e.stopPropagation();
            lzm_chatDisplay.visitorDisplay.showFilterListContextMenu = true;
            var scrolledDownY = $('#filter-list-body').scrollTop();
            var scrolledDownX = $('#filter-list-body').scrollLeft();
            var parentOffset = $('#filter-list-body').offset();
            var yValue = e.pageY - parentOffset.top + scrolledDownY;
            var xValue = e.pageX - parentOffset.left + scrolledDownX;
            lzm_chatDisplay.showContextMenu('filter-list', filter, xValue, yValue);
        }
    }
}

function removeFiltersListContextMenu() {
    lzm_chatDisplay.visitorDisplay.showFilterListContextMenu = false;
    $('#filter-list-context').remove();
}

function selectFiltersLine(e, filterId) {
    var filter = lzm_chatServerEvaluation.filters.getFilter(filterId);
    if (filter != null) {
        $('#filter-list').data('selected-filter', filterId);
        $('.filters-list-line').removeClass('selected-table-line');
        $('#filters-list-line-' + filterId).addClass('selected-table-line');
    }
}

function showNewFilterMessage(newFilters) {
    if (!lzm_chatDisplay.visitorDisplay.filterMessageIsVisible && lzm_chatDisplay.alertNewFilter == 1) {
        lzm_chatDisplay.visitorDisplay.filterMessageIsVisible = true;
        var opArray = [];
        for (var i=0; i<newFilters.length; i++) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(newFilters[i].creator);
            if (operator != null) {
                opArray.push(operator.name);
            }
        }
        var displayMessage = t('A new global Filter was added by <!--op_names-->. Please assure that this new Filter does not contain any unwanted restrictions.',
            [['<!--op_names-->', opArray.join(', ')]]);

        lzm_commonDialog.createAlertDialog(displayMessage, [{id: 'ok', name: t('Ok')}]);

        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
            lzm_chatDisplay.visitorDisplay.filterMessageIsVisible = false;
        });
    }
}

/**************************************** General control creation functions ****************************************/
function createUserControlPanel() {
    var counter=1;
    var repeatThis = setInterval(function() {
        /*lzm_chatDisplay.createUserControlPanel(lzm_chatPollServer.user_status, lzm_chatServerEvaluation.myName,
            lzm_chatServerEvaluation.myUserId);*/
        counter++;
        if (counter >= 60 || lzm_chatServerEvaluation.myName != '' || lzm_chatServerEvaluation.myUserId != '') {
            clearInterval(repeatThis);
            lzm_displayHelper.unblockUi();
        }
    },250);
}

function showSubMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    lzm_chatDisplay.showSubMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight);
}

function showSuperMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    lzm_chatDisplay.showSuperMenu(place, category, objectId, contextX, contextY, menuWidth, menuHeight);
}

function selectView(id) {
    if (id != lzm_chatDisplay.selected_view) {
        var oldSelectedView = lzm_chatDisplay.selected_view;
        lzm_chatDisplay.selected_view = id;
        lzm_displayHelper.removeBrowserNotification();
        if (oldSelectedView == 'mychats') {
            lzm_chatUserActions.saveChatInput(lzm_chatUserActions.active_chat_reco);
            removeEditor();
        }
        //lzm_chatDisplay.createHtmlContent(lzm_chatPollServer.thisUser, lzm_chatDisplay.active_chat_reco, 'panel');
        if (lzm_chatDisplay.selected_view == 'internal') {
            lzm_chatDisplay.createOperatorList();
        }
        if (lzm_chatDisplay.selected_view == 'mychats') {
            lzm_chatDisplay.createActiveChatPanel(false, true, true, 'panel');
            lzm_chatDisplay.createChatHtml(lzm_chatPollServer.thisUser, lzm_chatDisplay.active_chat_reco);
        }
        if (oldSelectedView == 'qrd') {
            cancelQrdPreview();
            $('#qrd-tree-body').remove();
            $('#qrd-tree-footline').remove();
        }
        if (lzm_chatDisplay.selected_view == 'tickets') {
            lzm_chatDisplay.ticketDisplay.createTicketList(lzm_chatServerEvaluation.tickets, lzm_chatServerEvaluation.ticketGlobalValues,
                lzm_chatPollServer.ticketPage, lzm_chatPollServer.ticketSort, lzm_chatPollServer.ticketQuery, lzm_chatPollServer.ticketFilter,
                false);
        }
        if (lzm_chatDisplay.selected_view != 'mychats') {
            lzm_chatUserActions.setActiveChat('', '', '', { id:'', b_id:'', b_chat:{ id:'' } });
        }
        if (lzm_chatDisplay.selected_view == 'external' && !lzm_chatDisplay.VisitorListCreated && $('.dialog-window-container').length == 0) {
            lzm_chatDisplay.visitorDisplay.updateVisitorList();
        }
        if (lzm_chatDisplay.selected_view == 'archive') {
            if ($('#chat-archive-table').length == 0) {
                lzm_chatDisplay.archiveDisplay.createArchive();
            } else {
                lzm_chatDisplay.archiveDisplay.updateArchive();
            }
        }
        if (lzm_chatDisplay.selected_view == 'reports') {
            lzm_chatDisplay.reportsDisplay.createReportList();
        }
        finishSettingsDialogue();
        lzm_chatDisplay.toggleVisibility();
        if (lzm_chatDisplay.selected_view == 'qrd') {
            lzm_chatDisplay.resourcesDisplay.createQrdTree('view-select-panel', lzm_chatDisplay.lastActiveChat);
        }
        if (lzm_chatDisplay.selected_view == 'mychats') {
            //createActiveChatHtml();
            lzm_chatDisplay.allchatsDisplay.updateAllChats();
        }
        if (lzm_chatDisplay.selected_view != 'external') {
            if (!mobile && app != 1) {
                delete messageEditor;
            }
            $('#chat-invitation-container').remove();
        }
        if (lzm_chatDisplay.selected_view == 'world') {
            lzm_displayLayout.resizeGeotrackingMap();
            setTimeout(function() {lzm_displayLayout.resizeGeotrackingMap();}, 20);
            if ($('#geotracking-body').data('src') == '') {
                var gtKey = (lzm_chatServerEvaluation.crc3 != null) ? lzm_chatServerEvaluation.crc3[6] : '';
                var myServerAddress = 'https://ssl.livezilla.net';
                var geoTrackingUrl = 'https://ssl.livezilla.net/geo/map/index.php?web=1&pvc=' + lzm_commonConfig.lz_version + '&key=' + gtKey;
                $('#geotracking-body').data('src', geoTrackingUrl);
                $('#geotracking-iframe').attr('src', geoTrackingUrl);
                lzm_chatGeoTrackingMap.setIframe($('#geotracking-iframe')[0]);
                lzm_chatGeoTrackingMap.setReceiver(myServerAddress);
            }
            if (!lzm_chatGeoTrackingMap.delayAddIsInProgress)
                lzm_chatGeoTrackingMap.addOrQueueVisitor();
            if (lzm_chatGeoTrackingMap.selectedVisitor != null) {
                lzm_chatGeoTrackingMap.setSelection(lzm_chatGeoTrackingMap.selectedVisitor, '');
            }
        }
        if (lzm_chatDisplay.selected_view == 'external' && typeof $('#visitor-list').data('selected-visitor') != 'undefined') {
            selectVisitor(null, $('#visitor-list').data('selected-visitor'));
        }

        lzm_chatDisplay.lastChatSendingNotification = '';
        lzm_chatDisplay.createViewSelectPanel();
        lzm_displayLayout.resizeAll();
    }
}

function moveViewSelectPanel(target) {
    if (target == 'left' || target == 'right') {
        try {
            for (var i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
                var j = 0;
                if (lzm_chatDisplay.firstVisibleView == lzm_chatDisplay.viewSelectArray[i].id) {
                    if (target == 'left') {
                        target = lzm_chatDisplay.viewSelectArray[i].id;
                        for (j=i-1; j>=0; j--) {
                            if (lzm_chatDisplay.showViewSelectPanel[lzm_chatDisplay.viewSelectArray[j].id] != 0 &&
                                (lzm_chatDisplay.viewSelectArray[j].id != 'world' || lzm_chatServerEvaluation.crc3 == null || lzm_chatServerEvaluation.crc3[2] != -2)) {
                                target = lzm_chatDisplay.viewSelectArray[j].id;
                                break;
                            }
                        }
                    } else {
                        target = lzm_chatDisplay.viewSelectArray[i].id;
                        for (j=i+1; j<lzm_chatDisplay.viewSelectArray.length; j++) {
                            if (lzm_chatDisplay.showViewSelectPanel[lzm_chatDisplay.viewSelectArray[j].id] != 0 &&
                                (lzm_chatDisplay.viewSelectArray[j].id != 'world' || lzm_chatServerEvaluation.crc3 == null || lzm_chatServerEvaluation.crc3[2] != -2)) {
                                target = lzm_chatDisplay.viewSelectArray[j].id;
                                break;
                            }
                        }
                    }
                }
            }
        } catch(e) {}
    }
    lzm_chatDisplay.firstVisibleView = target;
    lzm_chatDisplay.createViewSelectPanel(target);
}

/**************************************** Ticket functions ****************************************/
function openTicketContextMenu(e, ticketId, inDialog) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    removeTicketFilterMenu();
    selectTicket(ticketId, false, inDialog);
    var scrolledDownY, scrolledDownX, parentOffset;
    var place = (!inDialog) ? 'ticket-list' : 'visitor-information';
    scrolledDownY = $('#' + place +'-body').scrollTop();
    scrolledDownX = $('#' + place +'-body').scrollLeft();
    parentOffset = $('#' + place +'-body').offset();
    var xValue = e.pageX - parentOffset.left + scrolledDownX;
    var yValue = e.pageY - parentOffset.top + scrolledDownY;

    var ticket = {};
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    lzm_chatDisplay.showTicketContextMenu = true;
    lzm_chatDisplay.showContextMenu(place, ticket, xValue, yValue);
    e.stopPropagation();
    e.preventDefault();
}

function removeTicketContextMenu() {
    lzm_chatDisplay.showTicketContextMenu = false;
    $('#ticket-list-context').remove();
    $('#visitor-information-context').remove();
}

function openTicketFilterMenu(e, filter) {
    e.stopPropagation();
    removeTicketContextMenu();
    if (lzm_chatDisplay.showTicketFilterMenu) {
        removeTicketFilterMenu();
    } else {
        var parentOffset = $('#ticket-filter').offset();
        var xValue = parentOffset.left;
        var yValue = parentOffset.top + 21;
        lzm_chatDisplay.showTicketFilterMenu = true;
        lzm_chatDisplay.showContextMenu('ticket-filter', {filter: filter,
            filter_personal: lzm_chatPollServer.ticketFilterPersonal,
            filter_group: lzm_chatPollServer.ticketFilterGroup}, xValue, yValue);
        e.preventDefault();
    }
}

function removeTicketFilterMenu() {
    lzm_chatDisplay.showTicketFilterMenu = false;
    $('#ticket-filter-context').remove();
}

function openTicketMessageContextMenu(e, ticketId, messageNumber, fromButton) {
    if (messageNumber != '') {
        handleTicketMessageClick(ticketId, messageNumber);
    } else {
        messageNumber = $('#ticket-history-table').data('selected-message');
    }
    var ticket = {}, xValue, yValue;
    var parentOffset = null;
    var buttonPressed = '';
    if(!fromButton) {
        parentOffset = $('#ticket-history-placeholder-content-0').offset();
        xValue = e.pageX - parentOffset.left + $('#ticket-history-placeholder-content-0').scrollLeft();
        yValue = e.pageY - parentOffset.top;
    } else {
        parentOffset = $('#ticket-details-footline').offset();
        var eltOffset = $('#ticket-actions').offset();
        xValue = eltOffset.left - parentOffset.left;
        yValue = e.pageY - parentOffset.top;
        buttonPressed = 'ticket-message-actions';
    }
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
        }
    }

    lzm_chatDisplay.showTicketMessageContextMenu = true;
    lzm_chatDisplay.showContextMenu('ticket-details', {ti: ticket, msg: messageNumber}, xValue, yValue, buttonPressed);
    e.preventDefault();
}

function removeTicketMessageContextMenu() {
    lzm_chatDisplay.showTicketMessageContextMenu = false;
    $('#ticket-details-context').remove();
}

function toggleTicketFilter(status, e) {
    e.stopPropagation();
    removeTicketFilterMenu();
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    var filterList = lzm_chatPollServer.ticketFilter.split('');
    if ($.inArray(status.toString(), filterList) != -1) {
        var pattern = new RegExp(status.toString());
        lzm_chatPollServer.ticketFilter = lzm_chatPollServer.ticketFilter.replace(pattern, '');
    } else {
        filterList.push(status);
        filterList.sort();
        lzm_chatPollServer.ticketFilter = filterList.join('');
    }
    if (lzm_chatPollServer.ticketFilter == '') {
        lzm_chatPollServer.ticketFilter = '0123';
    }
    lzm_chatPollServer.ticketPage = 1;
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function toggleTicketFilterPersonal(type, e) {
    e.stopPropagation();
    removeTicketFilterMenu();
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    if (type == 0) {
        lzm_chatPollServer.ticketFilterPersonal = !lzm_chatPollServer.ticketFilterPersonal;
        lzm_chatPollServer.ticketFilterGroup = (lzm_chatPollServer.ticketFilterPersonal) ? false : lzm_chatPollServer.ticketFilterGroup;
        /*if (lzm_chatPollServer.dataObject.p_dt_fp == '1') {
            lzm_chatPollServer.removePropertyFromDataObject('p_dt_fp');
        } else {
            lzm_chatPollServer.addPropertyToDataObject('p_dt_fp', '1');
            lzm_chatPollServer.removePropertyFromDataObject('p_dt_fg');
        }*/
    } else if (type == 1) {
        lzm_chatPollServer.ticketFilterGroup = !lzm_chatPollServer.ticketFilterGroup;
        lzm_chatPollServer.ticketFilterPersonal = (lzm_chatPollServer.ticketFilterGroup) ? false : lzm_chatPollServer.ticketFilterPersonal;
        /*if (lzm_chatPollServer.dataObject.p_dt_fg == '1') {
            lzm_chatPollServer.removePropertyFromDataObject('p_dt_fg');
        } else {
            lzm_chatPollServer.addPropertyToDataObject('p_dt_fg', '1');
            lzm_chatPollServer.removePropertyFromDataObject('p_dt_fp');
        }*/
    }
    lzm_chatPollServer.ticketPage = 1;
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function toggleTicketFilterChannel(channel, e) {
    e.stopPropagation();
    removeTicketFilterMenu();
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    var filterList = lzm_chatPollServer.ticketFilterChannel.split('');
    if ($.inArray(channel.toString(), filterList) != -1) {
        var pattern = new RegExp(channel.toString());
        lzm_chatPollServer.ticketFilterChannel = lzm_chatPollServer.ticketFilterChannel.replace(pattern, '');
    } else {
        filterList.push(channel);
        filterList.sort();
        lzm_chatPollServer.ticketFilterChannel = filterList.join('');
    }
    if (lzm_chatPollServer.ticketFilterChannel == '') {
        lzm_chatPollServer.ticketFilterChannel = '01234567';
    }
    lzm_chatPollServer.ticketPage = 1;
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function pageTicketList(page) {
    $('.ticket-list-page-button').addClass('ui-disabled');
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    lzm_chatPollServer.ticketPage = page;
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function switchTicketListPresentation(ticketFetchTime, counter, ticketId) {
    var loadingHtml, myWidth, myHeight;
    if (counter == 0) {
        if ($('#matching-tickets-table').length == 0) {
            loadingHtml = '<div id="ticket-list-loading"></div>';
            $('#ticket-list-body').append(loadingHtml).trigger('create');
            myWidth = $('#ticket-list-body').width() + 10;
            myHeight = $('#ticket-list-body').height() + 10;
            $('#ticket-list-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
                'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
                'background-position': 'center', 'z-index': 1000, opacity: 0.85});
        } else {
            loadingHtml = '<div id="matching-ticket-list-loading"></div>';
            $('#visitor-info-placeholder-content-6').append(loadingHtml).trigger('create');
            myWidth = $('#visitor-info-placeholder-content-6').width() + 28;
            myHeight = $('#visitor-info-placeholder-content-6').height() + 48;
            $('#matching-ticket-list-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
                'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
                'background-position': 'center', 'z-index': 1000, opacity: 0.85});
        }
    }
    if (ticketFetchTime != lzm_chatServerEvaluation.ticketFetchTime || counter >= 40) {
        if (typeof ticketId != 'undefined') {
            changeTicketReadStatus(ticketId, 'read', true, true);
        }
        if ($('#matching-tickets-table').length == 0) {
            lzm_chatDisplay.ticketDisplay.createTicketList(lzm_chatServerEvaluation.tickets,  lzm_chatServerEvaluation.ticketGlobalValues,
                lzm_chatPollServer.ticketPage, lzm_chatPollServer.ticketSort, lzm_chatPollServer.ticketQuery, lzm_chatPollServer.ticketFilter,
                false);
        } else {
            $('#matching-ticket-list-loading').remove();
            selectTicket('', true, true);
        }
    } else {
        counter++;
        var delay = (counter <= 5) ? 200 : (counter <= 11) ? 500 : (counter <= 21) ? 1000 : 2000;
        setTimeout(function() {switchTicketListPresentation(ticketFetchTime, counter, ticketId);}, delay);
    }
}

function showTicketDetails(ticketId, fromContext, emailId, chatId, dialogId) {
    var email = {id: ''}, chat = {cid: ''}, i;
    dialogId = (typeof dialogId != 'undefined') ? dialogId : '';
    if (typeof emailId != 'undefined' && emailId != '') {
        for (i=0; i<lzm_chatServerEvaluation.emails.length; i++) {
            if (lzm_chatServerEvaluation.emails[i].id == emailId) {
                email = lzm_chatServerEvaluation.emails[i];
                email['dialog-id'] = dialogId
            }
        }
    }
    if (typeof chatId != 'undefined' && chatId != '') {
        for (i=0; i<lzm_chatServerEvaluation.chatArchive.chats.length; i++) {
            if (lzm_chatServerEvaluation.chatArchive.chats[i].cid == chatId) {
                chat = lzm_chatServerEvaluation.chatArchive.chats[i];
                chat['dialog-id'] = dialogId;
            }
        }
    }
    if (ticketId != '') {
        selectTicket(ticketId);
        changeTicketReadStatus(ticketId, 'read', false, true);
    }
    if (!fromContext && lzm_chatDisplay.showTicketContextMenu) {
        removeTicketContextMenu();
    } else {
        removeTicketContextMenu();
        var storedPreviewId = '';
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if (lzm_chatDisplay.StoredDialogs[key].type == 'ticket-details' &&
                    typeof lzm_chatDisplay.StoredDialogs[key].data['ticket-id'] != 'undefined' &&
                    lzm_chatDisplay.StoredDialogs[key].data['ticket-id'] == ticketId) {
                    storedPreviewId = key;
                }
            }
        }
        if (storedPreviewId != '') {
            lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
        } else {
            var ticket = {};
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                    ticket = lzm_chatDisplay.ticketListTickets[i];
                }
            }
            var isNew = (ticketId == '') ? true : false;
            lzm_chatDisplay.ticketDialogId[ticketId] = lzm_chatDisplay.ticketDisplay.showTicketDetails(ticket, isNew, email, chat, dialogId);
        }
    }
}

function showMessageForward(ticketId, messageNo) {
    removeTicketMessageContextMenu();
    var message = {}, ticketSender = '', group = '';
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            message = lzm_chatDisplay.ticketListTickets[i].messages[messageNo];
            ticketSender = lzm_chatDisplay.ticketListTickets[i].messages[0].fn;
            group = (typeof lzm_chatDisplay.ticketListTickets[i].editor != 'undefined' && lzm_chatDisplay.ticketListTickets[i].editor != false) ?
                lzm_chatDisplay.ticketListTickets[i].editor.g : lzm_chatDisplay.ticketListTickets[i].gr;
        }
    }
    lzm_chatDisplay.ticketDisplay.showMessageForward(message, ticketId, ticketSender, group);
}

function sendForwardedMessage(message, text, emailAddresses, emailSubject, ticketId, group, messageNo) {
    removeTicketMessageContextMenu();
    if (message.id == '') {
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                message = lzm_chatDisplay.ticketListTickets[i].messages[messageNo];
                text = message.mt;
                emailAddresses = message.em;
                emailSubject = (typeof message.s != 'undefined') ? message.s : '';
                group = (typeof lzm_chatDisplay.ticketListTickets[i].editor != 'undefined' && lzm_chatDisplay.ticketListTickets[i].editor != false) ?
                lzm_chatDisplay.ticketListTickets[i].editor.g : lzm_chatDisplay.ticketListTickets[i].gr;
            }
        }
    }
    var ticket = {mid: message.id, gr: group, em: emailAddresses, su: emailSubject, text: text, id: ticketId};
    lzm_chatPollServer.pollServerTicket(ticket, [], 'forward-to');
}

function moveMessageToNewTicket(ticketId, messageNo) {
    removeTicketMessageContextMenu();
    var message = {};
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            message = lzm_chatDisplay.ticketListTickets[i].messages[messageNo];
        }
    }
    var ticket = {mid: message.id, id: ticketId};
    lzm_chatPollServer.pollServerTicket(ticket, [], 'move-message');
}

function showTicketMsgTranslator(ticketId, msgNo) {
    removeTicketMessageContextMenu();
    if (lzm_chatServerEvaluation.otrs != '' && lzm_chatServerEvaluation.otrs != null) {
        var ticket = null;
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                ticket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
                break;
            }
        }
        if (ticket != null && ticket.messages.length > msgNo) {
            lzm_chatDisplay.ticketDisplay.showTicketMsgTranslator(ticket, msgNo);
        }
    } else {
        var noGTranslateKeyWarning1 = t('LiveZilla can translate your conversations in real time. This is based upon Google Translate.');
        var noGTranslateKeyWarning2 = t('To use this functionality, you have to add a Google API key.');
        var noGTranslateKeyWarning3 = t('For further information, see LiveZilla Server Admin -> LiveZilla Server Configuration.');
        var noGTranslateKeyWarning = t('<!--phrase1--><br /><br /><!--phrase2--><br /><!--phrase3-->',
            [['<!--phrase1-->', noGTranslateKeyWarning1], ['<!--phrase2-->', noGTranslateKeyWarning2], ['<!--phrase3-->', noGTranslateKeyWarning3]]);
        lzm_commonDialog.createAlertDialog(noGTranslateKeyWarning, [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
    }
}

function showTicketLinker(firstId, secondId, firstType, secondType, inChatDialog) {
    removeTicketMessageContextMenu();
    inChatDialog = (typeof inChatDialog != 'undefined') ? inChatDialog : false;
    var maximizeInsteadOfOpen = (secondType == 'chat' && secondId != '' && !inChatDialog), storedDialogId = '';
    if (maximizeInsteadOfOpen) {
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if (lzm_chatDisplay.StoredDialogs[key].type == 'link-ticket' &&
                    typeof lzm_chatDisplay.StoredDialogs[key].data['cid'] != 'undefined' &&
                    lzm_chatDisplay.StoredDialogs[key].data['cid'] == secondId) {
                    storedDialogId = key;
                }
            }
        }
    }
    if (storedDialogId != '') {
        lzm_displayHelper.maximizeDialogWindow(storedDialogId);
    } else {
        var firstObject = null, secondObject = null, i = 0;
        if (firstId != '' && firstType == 'ticket') {
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == firstId) {
                    firstObject = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
                }
            }
        }
        if (secondId != '' && secondType == 'chat') {
            for (i=0; i<lzm_chatServerEvaluation.chatArchive.chats.length; i++) {
                if (lzm_chatServerEvaluation.chatArchive.chats[i].cid == secondId) {
                    secondObject = lzm_commonTools.clone(lzm_chatServerEvaluation.chatArchive.chats[i]);
                }
            }
        } else if (secondId != '' && secondType == 'ticket') {
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == secondId) {
                    secondObject = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
                }
            }
        }
        if (firstObject != null || secondObject != null) {
            lzm_chatDisplay.ticketDisplay.showTicketLinker(firstObject, secondObject, firstType, secondType, inChatDialog);
        }
    }
}

function linkTicket(type, firstId, secondId) {
    lzm_chatPollServer.pollServerSpecial({fo: type.split('~')[0], so: type.split('~')[1], fid: firstId, sid: secondId}, 'link-ticket');
}

function selectTicket(ticketId, noUserInteraction, inDialog) {
    noUserInteraction = (typeof noUserInteraction != 'undefined') ? noUserInteraction : false;
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    var ticket, messageText, i;
    if (!inDialog) {
        if ($.inArray(ticketId, ['next', 'previous']) != -1) {
            if (lzm_chatDisplay.selectedTicketRow != '') {
                for (var j=0; j<lzm_chatDisplay.ticketListTickets.length; j++) {
                    if (lzm_chatDisplay.ticketListTickets[j].id == lzm_chatDisplay.selectedTicketRow) {
                        try {
                            ticketId = (ticketId == 'next') ?  lzm_chatDisplay.ticketListTickets[j + 1].id : lzm_chatDisplay.ticketListTickets[j - 1].id;
                        } catch(e) {
                            ticketId = lzm_chatDisplay.ticketListTickets[j].id;
                        }
                    }
                }
            } else {
                try {
                    ticketId = lzm_chatDisplay.ticketListTickets[0].id
                } catch(ex) {
                    ticketId = '';
                }
            }
        }
    } else {
        try {
            ticketId = (ticketId != '') ? ticketId : lzm_chatDisplay.ticketListTickets[0].id;
        } catch (e) {}
    }
    removeTicketContextMenu(inDialog);
    $('.ticket-list-row').removeClass('selected-table-line');
    if (ticketId != '' && !noUserInteraction && !lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile &&
        lzm_chatDisplay.selectedTicketRow == ticketId &&
        lzm_commonTools.checkTicketReadStatus(ticketId, lzm_chatDisplay.ticketReadArray) == -1 &&
        lzm_chatTimeStamp.getServerTimeString(null, false, 1) - ticketLineClicked >= 500) {
        changeTicketReadStatus(ticketId, 'read', false, true);
    }
    ticketLineClicked = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    lzm_chatDisplay.selectedTicketRow = ticketId;
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            lzm_chatDisplay.selectedTicketRowNo = i;
        }
    }
    ticket = {};
    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    if (!inDialog) {
        $('#ticket-list-row-' + ticketId).addClass('selected-table-line');
        if ($(window).width() > 1000) {
            try {
                messageText = lzm_commonTools.htmlEntities(ticket.messages[ticket.messages.length - 1].mt)
                    .replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />');
                $('#ticket-list-right').html(messageText);
            } catch(e) {}
        }
    } else/* if ($('#matching-ticket-list-row-' + ticketId).length > 0)*/ {
        $('#matching-ticket-list-row-' + ticketId).addClass('selected-table-line');
        messageText = '';
        try {
            messageText = lzm_commonTools.htmlEntities(ticket.messages[ticket.messages.length - 1].mt)
                .replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />');
        } catch (e) {}
        try {
            $('#ticket-content-inner').html('<legend>' + t('Text') + '</legend>' + messageText);
        } catch(e) {}
    }
}

function handleTicketMessageClick(ticketId, messageNumber) {
    if ($('#ticket-history-table').data('selected-message') != messageNumber && $('#message-details-inner').data('edit')) {
        toggleMessageEditMode();
    }
    removeTicketMessageContextMenu();
    if (!$('#message-details-inner').data('edit')) {
        var ticket = {}, i;
        for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                ticket = lzm_chatDisplay.ticketListTickets[i];
            }
        }
        $('.message-line').removeClass('selected-table-line');
        $('#ticket-history-table').data('selected-message', messageNumber);
        $('#message-line-' + ticketId + '_' + messageNumber).addClass('selected-table-line');

        var attachmentsHtml = lzm_chatDisplay.ticketDisplay.createTicketAttachmentTable(ticket, {id:''}, messageNumber, false);
        var commentsHtml = lzm_chatDisplay.ticketDisplay.createTicketCommentTable(ticket, messageNumber, '');
        var detailsHtml = lzm_chatDisplay.ticketDisplay.createTicketMessageDetails(ticket.messages[messageNumber], {id: ''}, false, {cid: ''}, false);
        var messageHtml = lzm_commonTools.htmlEntities(ticket.messages[messageNumber].mt).replace(/\n/g, '<br />');
        $('#ticket-message-text').html('<legend>' + t('Message') + '</legend>' + messageHtml);
        $('#ticket-message-details').html('<legend>' + t('Details') + '</legend>' + detailsHtml);
        $('#ticket-attachment-list').html('<legend>' + t('Attachments') + '</legend>' + attachmentsHtml);
        $('#ticket-comment-list').html('<legend>' + t('Comments') + '</legend>' + commentsHtml);

        $('#message-details-inner').data('message', ticket.messages[messageNumber]);
        $('#message-details-inner').data('email', {id: ''});
        $('#message-details-inner').data('is-new', false);
        $('#message-details-inner').data('chat', {cid: ''});
        $('#message-details-inner').data('edit', false);
    }
}

function toggleMessageEditMode(ticketId, messageNumber, apply) {
    if (typeof ticketId != 'undefined' && ticketId != null && typeof messageNumber != 'undefined' && messageNumber != null) {
        handleTicketMessageClick(ticketId, messageNumber);
    }
    var message = $('#message-details-inner').data('message');
    var edit = !$('#message-details-inner').data('edit');

    if (typeof apply != 'undefined' && apply) {
        message.fn = $('#change-message-name').val();
        message.em = $('#change-message-email').val();
        message.co = $('#change-message-company').val();
        message.s = $('#change-message-subject').val();
        message.p = $('#change-message-phone').val();
        message.mt = $('#change-message-text').val();
    }

    var detailsHtml = '<legend>' + t('Details') + '</legend>' + lzm_chatDisplay.ticketDisplay.createTicketMessageDetails(message, {id: ''}, false, {cid: ''}, edit);
    var messageHtml = (edit) ? '<legend>' + t('Message') + '</legend><textarea id="change-message-text" data-role="none">' + message.mt + '</textarea>' :
        '<legend>' + t('Message') + '</legend>' + lzm_commonTools.htmlEntities(message.mt).replace(/\n/g, '<br />');
    $('#ticket-message-details').html(detailsHtml);
    $('#ticket-message-text').html(messageHtml);
    if (edit) {
        $('#ticket-message-details').css({'background-color': '#ffffe1'});
        $('#ticket-message-text').css({'background-color': '#ffffe1'});
        $('#change-message-text').css({width: '99%', height: ($('.ticket-details-placeholder-content').height() - 48)+'px',
            'border-radius': '4px', padding: '4px', border: '1px solid #ccc'});
    } else {
        $('#ticket-message-details').css({'background-color': '#ffffff'});
        $('#ticket-message-text').css({'background-color': '#ffffff'});
    }

    $('#message-details-inner').data('message', message);
    $('#message-details-inner').data('email', {id: ''});
    $('#message-details-inner').data('is-new', false);
    $('#message-details-inner').data('chat', {cid: ''});
    $('#message-details-inner').data('edit', edit);
    if (parseInt($('#ticket-details-placeholder-tabs-row').data('selected-tab')) >= 2) {
        $('#ticket-details-placeholder-tab-1').click();
    }
}

function handleTicketCommentClick(commentNo, commentText) {
    $('.comment-text-line').remove();
    var commentTextHtml = '<tr class="comment-text-line"><td colspan="3">' + lzm_commonTools.escapeHtml(lz_global_base64_decode(commentText)) + '</td></tr>';
    $('.comment-line').removeClass('selected-table-line');
    $('#comment-line-' + commentNo).addClass('selected-table-line');
    $('#comment-table').data('selected-comment', commentNo);
    $('#comment-line-' + commentNo).after(commentTextHtml);
    $('#comment-table').trigger('create');

}

function handleTicketAttachmentClick(attachmentNo) {
    $('.attachment-line').removeClass('selected-table-line');
    $('#attachment-line-' + attachmentNo).addClass('selected-table-line');
    $('#attachment-table').data('selected-attachment', attachmentNo);
    $('#message-attachment-table').data('selected-attachment', attachmentNo);
    $('#remove-attachment').removeClass('ui-disabled');
}

function saveTicketDetails(ticket, channel, status, group, editor, language, name, email, company, phone, message, attachments, comments, customFields, chat, mc) {
    mc = (typeof mc != 'undefined') ? mc : '';
    chat = (typeof chat != 'undefined' && chat != null) ? chat : {cid: ''};
    status = status.toString();
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    var isStatusChange = (status.indexOf('change~') != -1);
    status = (status.indexOf('change~') == -1) ? parseInt(status) : parseInt(status.split('~')[1]);
    lzm_chatUserActions.saveTicketDetails(ticket, channel, status, group, editor, language, name, email, company, phone, message, attachments, comments, customFields, chat, mc);
    if (!isStatusChange && chat.cid == '') {
        switchTicketListPresentation(ticketFetchTime, 0, ticket.id);
    }
}

function saveTicketTranslationText(myTicket, msgNo, text, type) {
    if (typeof type == 'undefined' || type != 'comment') {
        if (myTicket != null) {
            var ticketGroup = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.g : myTicket.gr;
            var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
            var ticketOperator = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ed : '';
            var changedMessage = $('#message-details-inner').data('message');
            var mc = {tid: myTicket.id, mid: myTicket.messages[msgNo].id, n: myTicket.messages[msgNo].fn, e: myTicket.messages[msgNo].em,
                c: myTicket.messages[msgNo].co, p: myTicket.messages[msgNo].p, s: myTicket.messages[msgNo].s, t: text,
                custom: []};
            for (var i=0; i<myTicket.messages[msgNo].customInput.length; i++) {
                mc.custom.push({id: myTicket.messages[msgNo].customInput[i].id, value: myTicket.messages[msgNo].customInput[i].text});
            }
            saveTicketDetails(myTicket, myTicket.t, ticketStatus, ticketGroup, ticketOperator, myTicket.l, null, null, null, null, null, null, null, null, null, mc);
        }
    } else {
        if (myTicket != null) {
            lzm_chatUserActions.saveTicketComment(myTicket.id, myTicket.messages[msgNo].id, text);
        }
    }
}

function setTicketOperator(ticketId, operatorId) {
    var myTicket = null, i = 0;
    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            myTicket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    if (myTicket != null) {
        var ticketGroup = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.g : myTicket.gr;
        var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
        saveTicketDetails(myTicket, myTicket.t, ticketStatus, ticketGroup, operatorId, myTicket.l, '', '', '', '', '');
    }
}

function setTicketGroup(ticketId, groupId) {
    var myTicket = null, i = 0;
    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            myTicket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    if (myTicket != null) {
        var ticketEditor = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.ed : '';
        var ticketStatus = (typeof myTicket.editor != 'undefined' && myTicket.editor != false) ? myTicket.editor.st : 0;
        saveTicketDetails(myTicket, myTicket.t, ticketStatus, groupId, ticketEditor, myTicket.l, '', '', '', '', '');
    }
}

function changeTicketStatus(myStatus, fromKey, inDialog) {
    removeTicketContextMenu();
    if (lzm_chatDisplay.selectedTicketRow != '') {
        fromKey = (typeof fromKey != 'undefined') ? fromKey : false;
        inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
        if (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'change_ticket_status', {}) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_open', {}) && myStatus == 0) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_progress', {}) && myStatus == 1) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_closed', {}) && myStatus == 2) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_deleted', {}) && myStatus == 3)) {
            showNoPermissionMessage();
        } else {
            var myTicket = {}, i = 0;
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == lzm_chatDisplay.selectedTicketRow) {
                    myTicket = lzm_chatDisplay.ticketListTickets[i];
                }
            }
            var ticketGroup = myTicket.gr;
            var ticketEditor = -1;
            if (typeof myTicket.editor != 'undefined' && myTicket.editor != false) {
                ticketGroup = myTicket.editor.g;
                ticketEditor = myTicket.editor.ed;
            }
            var previousTicketStatus = (typeof myTicket.editor != 'undefined') ? myTicket.editor.st : 0;
            if (!fromKey) {
                saveTicketDetails(myTicket, myTicket.t, 'change~' + myStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '');
            } else {
                var deleteTicketMessage1 = t('Do you really want to remove this ticket irrevocably?');
                var deleteTicketMessage2 = t('You have replied to this request. Do you really want to remove this ticket?');
                var deleteTicketMessage3 = t('You have replied to this request. Do you really want to remove this ticket irrevocably?');
                var opHasAnswered = false, deletionConfirmed = false;
                if (myTicket.messages != 'undefined') {
                    for (i=0; i<myTicket.messages.length; i++) {
                        if (myTicket.messages[i].t == 1) {
                            opHasAnswered = true;
                        }
                    }
                }
                if (myStatus != 3) {
                    saveTicketDetails(myTicket, myTicket.t, 'change~' + myStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '');
                    deletionConfirmed = true;
                } else if (myStatus == 3 && previousTicketStatus != 3 && !opHasAnswered) {
                    saveTicketDetails(myTicket, myTicket.t, 'change~' + myStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '');
                    deletionConfirmed = true;
                } else if (myStatus == 3 && previousTicketStatus != 3 && opHasAnswered) {
                    lzm_commonDialog.createAlertDialog(deleteTicketMessage2, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                    $('#alert-btn-ok').click(function() {
                        saveTicketDetails(myTicket, myTicket.t, 'change~' + myStatus, ticketGroup, ticketEditor, myTicket.l, '', '', '', '', '');
                        deletionConfirmed = true;
                        lzm_commonDialog.removeAlertDialog();
                        if (fromKey)
                            handleTicketDeletion(myStatus);
                    });
                    $('#alert-btn-cancel').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                    });
                } else if (myStatus == 3 && previousTicketStatus == 3 && !opHasAnswered) {
                    lzm_commonDialog.createAlertDialog(deleteTicketMessage1, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                    $('#alert-btn-ok').click(function() {
                        lzm_chatUserActions.deleteTicket(myTicket.id);
                        deletionConfirmed = true;
                        lzm_commonDialog.removeAlertDialog();
                        if (fromKey)
                            handleTicketDeletion(myStatus);
                    });
                    $('#alert-btn-cancel').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                    });
                } else if (myStatus == 3 && previousTicketStatus == 3 && opHasAnswered) {
                    lzm_commonDialog.createAlertDialog(deleteTicketMessage3, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
                    $('#alert-btn-ok').click(function() {
                        lzm_chatUserActions.deleteTicket(myTicket.id);
                        deletionConfirmed = true;
                        lzm_commonDialog.removeAlertDialog();
                        if (fromKey)
                            handleTicketDeletion(myStatus);
                    });
                    $('#alert-btn-cancel').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                        if (fromKey)
                            handleTicketDeletion(myStatus);
                    });
                }
            }
            if (fromKey && myStatus == 3 && deletionConfirmed) {
                handleTicketDeletion(myStatus);
            }

        }
    }
}

function handleTicketDeletion(myStatus) {
    var selectedTicketIndex = 0;
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == lzm_chatDisplay.selectedTicketRow) {
            selectedTicketIndex = i;
            var myTicket = lzm_chatDisplay.ticketListTickets[i];
            if (typeof myTicket.editor == 'undefined' || myTicket.editor == false) {
                var myTime = lzm_chatTimeStamp.getServerTimeString(null, true);
                lzm_chatDisplay.ticketListTickets[i].editor = {ed: "",g: myTicket.gr, id: myTicket.id,
                    st: myStatus, ti: myTime, u: myTime, w: 2000000000};
            } else {
                lzm_chatDisplay.ticketListTickets[i].editor.st = myStatus;
            }
        }
    }
    if (selectedTicketIndex < lzm_chatDisplay.ticketListTickets.length - 1) {
        lzm_chatDisplay.selectedTicketRow = lzm_chatDisplay.ticketListTickets[selectedTicketIndex + 1].id;
    } else if (selectedTicketIndex > 0) {
        lzm_chatDisplay.selectedTicketRow = lzm_chatDisplay.ticketListTickets[selectedTicketIndex - 1].id;
    }
    lzm_chatDisplay.ticketDisplay.updateTicketList(lzm_chatDisplay.ticketListTickets, lzm_chatDisplay.ticketGlobalValues,
        lzm_chatPollServer.ticketPage, lzm_chatPollServer.ticketSort, lzm_chatPollServer.ticketQuery,
        lzm_chatPollServer.ticketFilter, true);
}

function sendTicketMessage(ticket, receiver, bcc, subject, message, comment, attachments, messageId, previousMessageId) {
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatUserActions.sendTicketReply(ticket, receiver, bcc, subject, message, comment, attachments, messageId, previousMessageId);
    switchTicketListPresentation(ticketFetchTime, 0, ticket.id);
}

function addOrEditResourceFromTicket(ticketId) {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null) {
        if (resource.ty == 0) {
            lzm_chatUserActions.addQrd(ticketId, true);
        } else if (resource.ty == 1) {
            resource.text = lzm_chatDisplay.ticketResourceText[ticketId];
            lzm_chatUserActions.editQrd(resource, ticketId, true);
        }
    }
}

function saveQrdFromTicket(resourceId, resourceText) {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(resourceId);
    if (resource != null) {
        resource.text = resourceText.replace(/\n/g, '<br />');
        lzm_chatPollServer.pollServerResource(resource);
    }
}

function addQrdAttachment(closeToTicket) {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null) {
        lzm_chatServerEvaluation.cannedResources.riseUsageCounter(lzm_chatDisplay.selectedResource);
        cancelQrd(closeToTicket);
        var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
        var resources2 = $('#ticket-details-placeholder-content-1').data('selected-resources');
        var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2 : [];
        resources.push(resource);
        $('#reply-placeholder-content-1').data('selected-resources', resources);
        $('#ticket-details-placeholder-content-1').data('selected-resources', resources);
        lzm_chatDisplay.ticketDisplay.updateAttachmentList();
    }
}

function insertQrdIntoTicket(ticketId) {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null) {
        lzm_chatServerEvaluation.cannedResources.riseUsageCounter(lzm_chatDisplay.selectedResource);
        lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
        lzm_displayHelper.maximizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticketId] + '_reply');
        var replyText = '';//$('#ticket-reply-input').val();
        switch(resource.ty) {
            case '1':
                replyText += resource.text
                    .replace(/^<p>/gi,'').replace(/^<div>/gi,'')
                    .replace(/<p>/gi,'<br>').replace(/<div>/gi,'<br>')
                    .replace(/<br>/gi,'\n').replace(/<br \/>/gi, '\n');
                if (replyText.indexOf('openLink') != -1) {
                    replyText = replyText.replace(/<a.*openLink\('(.*?)'\).*>(.*?)<\/a>/gi, '$2 ($1)');
                } else {
                    replyText = replyText.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, '$2 ($1)');
                }
                replyText = replyText.replace(/<.*?>/g, '').replace(/&nbsp;/gi, ' ')
                    .replace(/&.*?;/g, '');
                break;
            case '2':
                replyText += resource.ti + ':\n' + resource.text;
                break;
            default:
                var urlFileName = encodeURIComponent(resource.ti.replace(/ /g, '+'));
                var fileId = resource.text.split('_')[1];
                var urlParts = lzm_commonTools.getUrlParts(lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url, 0);
                var thisServer = ((urlParts.protocol == 'http://' && urlParts.port == 80) || (urlParts.protocol == 'https://' && urlParts.port == 443)) ?
                    urlParts.protocol + urlParts.urlBase + urlParts.urlRest : urlParts.protocol + urlParts.urlBase + ':' + urlParts.protocol + urlParts.urlRest;
                replyText += thisServer + '/getfile.php?';
                if (multiServerId != '') {
                    replyText += 'ws=' + multiServerId + '&';
                }
                replyText += 'file=' + urlFileName + '&id=' + fileId;
        }

        //$('#ticket-reply-input').val(replyText);
        insertAtCursor('ticket-reply-input', replyText);
        $('#ticket-reply-input-resource').val(resource.rid);

        if (/*resource.oid == lzm_chatDisplay.myId && */resource.ty == 1) {
            $('#ticket-reply-input-save').removeClass('ui-disabled');
        } else {
            $('#ticket-reply-input-save').addClass('ui-disabled');
        }
    }
}

function setAllTicketsRead() {
    lzm_chatPollServer.stopPolling();
    /*var maxTicketUpdated = 0;
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        maxTicketUpdated = Math.max(lzm_chatDisplay.ticketListTickets[i].u, maxTicketUpdated);
    }*/
    var maxTicketUpdated = lzm_chatPollServer.lastPollTime;
    if (parseInt(maxTicketUpdated) > parseInt(lzm_chatPollServer.ticketMaxRead)) {
        lzm_chatPollServer.ticketMaxRead = maxTicketUpdated;
        lzm_chatDisplay.ticketGlobalValues.mr = maxTicketUpdated;
    }
    lzm_chatPollServer.resetTickets = true;
    lzm_chatDisplay.ticketReadArray = [];
    lzm_chatDisplay.ticketUnreadArray = [];
    lzm_chatDisplay.ticketDisplay.updateTicketList(lzm_chatDisplay.ticketListTickets, lzm_chatDisplay.ticketGlobalValues,
        lzm_chatPollServer.ticketPage, lzm_chatPollServer.ticketSort, lzm_chatPollServer.ticketQuery, lzm_chatPollServer.ticketFilter,
        true);
    lzm_chatPollServer.startPolling();
}

function changeTicketReadStatus(ticketId, status, doNotUpdate, forceRead) {
    removeTicketContextMenu();
    doNotUpdate = (typeof doNotUpdate != 'undefined') ? doNotUpdate : false;
    forceRead = (typeof forceRead != 'undefined') ? forceRead : false;
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    var ticket = {id: '', u: 0}, i;
    for (i=0; i<lzm_chatServerEvaluation.tickets.length; i++) {
        if (lzm_chatServerEvaluation.tickets[i].id == ticketId) {
            ticket = lzm_chatServerEvaluation.tickets[i];
        }
    }
    if ((ticket.id != '' && status == 'read' && ticket.u > lzm_chatPollServer.ticketMaxRead) ||
        (ticket.id != '' && status != 'read' && true)) {
        if (ticket.id == '') {
            for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
                if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                    ticket = lzm_chatDisplay.ticketListTickets[i];
                }
            }
        }
        if (status == 'read') {
            var timestamp = Math.max(lzm_chatTimeStamp.getServerTimeString(null, true), ticket.u);
            if (forceRead) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticketId, lzm_chatDisplay.ticketReadArray);
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(ticket,
                    lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets, false);
            } else if (ticket.u > lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketReadArray) == -1) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(ticket,
                    lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets, false);
            } else {
                lzm_chatDisplay.ticketUnreadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticket.id, lzm_chatDisplay.ticketUnreadArray);
            }
        } else {
            if (ticket.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketUnreadArray) == -1) {
                lzm_chatDisplay.ticketUnreadArray.push({id: ticket.id, timestamp: lzm_chatTimeStamp.getServerTimeString(null, true)});
            } else {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticket.id, lzm_chatDisplay.ticketReadArray);
            }
        }
        if (!doNotUpdate) {
            lzm_chatDisplay.ticketDisplay.updateTicketList(lzm_chatDisplay.ticketListTickets, lzm_chatDisplay.ticketGlobalValues,
                lzm_chatPollServer.ticketPage, lzm_chatPollServer.ticketSort, lzm_chatPollServer.ticketQuery, lzm_chatPollServer.ticketFilter,
                true);
        }
    }
}

function sortTicketsBy(sortCriterium) {
    if (sortCriterium != lzm_chatPollServer.ticketSort) {
        $('.ticket-list-page-button').addClass('ui-disabled');
        var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
        lzm_chatServerEvaluation.expectTicketChanges = true;
        lzm_chatPollServer.stopPolling();
        lzm_chatPollServer.ticketSort = sortCriterium;
        lzm_chatPollServer.resetTickets = true;
        lzm_chatPollServer.startPolling();
        switchTicketListPresentation(ticketFetchTime, 0);
    }
}

function searchTickets(searchString) {
    var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
    lzm_chatServerEvaluation.expectTicketChanges = true;
    lzm_chatPollServer.stopPolling();
    lzm_chatPollServer.ticketQuery = searchString;
    lzm_chatPollServer.ticketPage = 1;
    lzm_chatPollServer.resetTickets = true;
    lzm_chatPollServer.startPolling();
    switchTicketListPresentation(ticketFetchTime, 0);
}

function cancelTicketReply(windowId, dialogId) {
    lzm_displayHelper.removeDialogWindow(windowId);
    lzm_displayHelper.maximizeDialogWindow(dialogId);
    $('#reply-ticket-details').removeClass('ui-disabled');
    //$('.ticket-buttons').removeClass('ui-disabled');
    //$('#ticket-reply').remove();
}

function showMessageReply(ticketId, messageNo, groupId) {
    var i, ticket;
    for (i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
        }
    }
    var selectedGroup = lzm_chatServerEvaluation.groups.getGroup(groupId);

    lzm_chatDisplay.ticketDisplay.showMessageReply(ticket, messageNo, selectedGroup);
}

function deleteSalutationString(e, salutationField, salutationString) {
    e.stopPropagation();
    lzm_commonTools.deleteTicketSalutation(salutationField, salutationString);
}

function addComment(ticketId, menuEntry) {
    var messageNo = $('#ticket-history-table').data('selected-message');
    var ticket = {}, message = {};
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            ticket = lzm_chatDisplay.ticketListTickets[i];
            message = ticket.messages[messageNo];
        }
    }
    lzm_chatDisplay.ticketDisplay.addMessageComment(ticket.id, message, menuEntry);
}

function toggleEmailList() {
    if ($('#email-list-container').length == 0) {
        var storedPreviewId = '';
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if (lzm_chatDisplay.StoredDialogs[key].type == 'email-list') {
                    storedPreviewId = key;
                }
            }
        }
        if (storedPreviewId != '') {
            lzm_displayHelper.maximizeDialogWindow(storedPreviewId);
        } else {
            lzm_chatDisplay.ticketDisplay.showEmailList();
            lzm_chatPollServer.stopPolling();
            lzm_chatPollServer.emailUpdateTimestamp = 0;
            lzm_chatPollServer.addPropertyToDataObject('p_de_a', lzm_chatPollServer.emailAmount);
            lzm_chatPollServer.addPropertyToDataObject('p_de_s', 0);
            lzm_chatPollServer.startPolling();
        }
    } else {
        lzm_chatPollServer.stopPolling();
        lzm_chatPollServer.removePropertyFromDataObject('p_de_a');
        lzm_chatPollServer.removePropertyFromDataObject('p_de_s');
        lzm_chatPollServer.emailAmount = 20;
        lzm_chatPollServer.startPolling();
    }
}

function deleteEmail() {
    var emailId = $('#email-placeholder').data('selected-email-id');
    var emailNo = $('#email-placeholder').data('selected-email');
    lzm_chatDisplay.emailDeletedArray.push(emailId);
    $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-remove" style="color: #cc0000;"></i>');
    $('#reset-emails').removeClass('ui-disabled');
    $('#delete-email').addClass('ui-disabled');
    $('#create-ticket-from-email').addClass('ui-disabled');
    if ($('#email-list-line-' + (emailNo + 1)).length > 0) {
        $('#email-list-line-' + (emailNo + 1)).click();
    }
}

function saveEmailListChanges(emailId, assign) {
    var i, emailChanges = [], ticketsCreated = [], emailListObject = {};
    if (emailId != '') {
        var editorId = (assign) ? lzm_chatDisplay.myId : '';
        if (emailId instanceof Array) {
            for (i=0; i<emailId.length; i++) {
                emailChanges.push({id: emailId[i], status: '0', editor: editorId})
            }
        } else {
            emailChanges = [{
                id: emailId, status: '0', editor: editorId
            }];
        }
    } else {
        for (i=0; i<lzm_chatServerEvaluation.emails.length; i++) {
            emailListObject[lzm_chatServerEvaluation.emails[i].id] = lzm_chatServerEvaluation.emails[i];
        }

        for (i=0; i<lzm_chatDisplay.emailDeletedArray.length; i++) {
            emailChanges.push({id: lzm_chatDisplay.emailDeletedArray[i], status: '1', editor: ''})
        }

        for (i=0; i<lzm_chatDisplay.ticketsFromEmails.length; i++) {
            var thisEmail = emailListObject[lzm_chatDisplay.ticketsFromEmails[i]['email-id']];
            emailChanges.push({id: thisEmail.id, status: '1', editor: ''});
            ticketsCreated.push({
                name: thisEmail.n,
                email: thisEmail.e,
                subject: thisEmail.s,
                //text: thisEmail.text,
                text: lzm_chatDisplay.ticketsFromEmails[i].message,
                group: lzm_chatDisplay.ticketsFromEmails[i].group,
                cid: thisEmail.id,
                channel: lzm_chatDisplay.ticketsFromEmails[i].channel,
                company: lzm_chatDisplay.ticketsFromEmails[i].company,
                phone: lzm_chatDisplay.ticketsFromEmails[i].phone,
                language: lzm_chatDisplay.ticketsFromEmails[i].language,
                status: lzm_chatDisplay.ticketsFromEmails[i].status,
                editor: (lzm_chatDisplay.ticketsFromEmails[i].editor != -1) ? lzm_chatDisplay.ticketsFromEmails[i].editor : '',
                attachment: thisEmail.attachment,
                comment: lzm_chatDisplay.ticketsFromEmails[i].comment,
                custom: lzm_chatDisplay.ticketsFromEmails[i].custom
            });
        }
    }
    lzm_chatUserActions.saveEmailChanges(emailChanges, ticketsCreated);
}

function showHtmlEmail(emailIdEnc) {
    removeTicketMessageContextMenu();
    var htmlEmailUrl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url + '/email.php?ws=' + multiServerId + '&id=' + emailIdEnc;
    openLink(htmlEmailUrl);
}

function printTicketMessage(ticketId, msgNo) {
    removeTicketMessageContextMenu();
    if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
        showNotMobileMessage();
    } else {
        var myTicket = null;
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                myTicket = lzm_chatDisplay.ticketListTickets[i];
            }
        }
        if (myTicket != null && myTicket.messages.length > msgNo) {
            lzm_commonTools.printContent('message', {ticket: myTicket, msgNo: msgNo});
        }
    }
}

function showPhoneCallDialog(objectId, lineNo, caller) {
    if (caller == 'ticket') {
        var ticket = null;
        var messageNo = parseInt(lineNo);
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == objectId) {
                ticket = lzm_chatDisplay.ticketListTickets[i];
            }
        }

        if (ticket != null && ticket.messages.length > messageNo) {
            lzm_chatDisplay.openPhoneCallDialog(ticket, messageNo, caller);
        }
    } else if (caller == 'chat') {
        var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(objectId);
        if (visitorBrowser[1] != null) {
            lzm_chatDisplay.openPhoneCallDialog(visitorBrowser, -1, caller);
        }
    }
}

function startPhoneCall(protocol, phoneNumber) {
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
        window.open(protocol + phoneNumber, '_blank', 'height=400, width=500, menubar=no, status=no');
    } else {
        try {
            if (typeof lzm_deviceInterface.startPhoneCall != 'undefined') {
                lzm_deviceInterface.startPhoneCall(protocol, phoneNumber);
            } else {
                protocol = (protocol == 'skype:') ? 'skype:' : 'tel:';
                phoneNumber = (protocol == 'skype:') ? phoneNumber + '?call' : phoneNumber;
                lzm_deviceInterface.openExternalBrowser(protocol + phoneNumber);
            }
        } catch (e) {
            showNotOnDevice();
        }
    }
}

/**************************************** Archive functions ****************************************/
function pageArchiveList(page) {
    $('.archive-list-page-button').addClass('ui-disabled');
    lzm_chatPollServer.stopPolling();
    var archiveFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
    lzm_chatServerEvaluation.expectArchiveChanges = true;
    lzm_chatPollServer.chatArchivePage = page;
    lzm_chatPollServer.resetChats = true;
    lzm_chatPollServer.startPolling();
    switchArchivePresentation(archiveFetchTime, 0);
}

function searchArchive(searchString) {
    $('.archive-list-page-button').addClass('ui-disabled');
    lzm_chatPollServer.stopPolling();
    var archiveFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
    lzm_chatServerEvaluation.expectArchiveChanges = true;
    lzm_chatPollServer.chatArchiveQuery = searchString.replace(/^ +/, '').replace(/ +$/, '').toLowerCase();
    lzm_chatPollServer.chatArchivePage = 1;
    lzm_chatPollServer.resetChats = true;
    lzm_chatPollServer.startPolling();
    switchArchivePresentation(archiveFetchTime, 0);
}

function openArchiveFilterMenu(e, filter) {
    filter = (filter != '') ? filter : lzm_chatPollServer.chatArchiveFilter;
    e.stopPropagation();
    if (lzm_chatDisplay.showArchiveFilterMenu) {
        removeArchiveFilterMenu();
    } else {
        var parentOffset = $('#archive-filter').offset();
        var xValue = parentOffset.left;
        var yValue = parentOffset.top + 21;
        lzm_chatDisplay.showArchiveFilterMenu = true;
        lzm_chatDisplay.showContextMenu('archive-filter', {filter: filter}, xValue, yValue);
        e.preventDefault();
    }
}

function showArchivedChat(cpId, cpName, chatId, chatType) {
    if (chatType == 1) {
        showVisitorInfo(cpId, cpName, chatId, 5);
    } else {
        var storedDialogId = '';
        for (var key in lzm_chatDisplay.StoredDialogs) {
            if (lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                if ((lzm_chatDisplay.StoredDialogs[key].type == 'matching-chats' || lzm_chatDisplay.StoredDialogs[key].type == 'send-transcript-to-body') &&
                    typeof lzm_chatDisplay.StoredDialogs[key].data['cp-id'] != 'undefined' &&
                    lzm_chatDisplay.StoredDialogs[key].data['cp-id'] == cpId) {
                    storedDialogId = key;
                    if (typeof lzm_chatDisplay.StoredDialogs[key + '-transcript'] != 'undefined')
                        storedDialogId = key + '-transcript';
                    if (typeof lzm_chatDisplay.StoredDialogs[key + '_linker'] != 'undefined')
                        storedDialogId = key + '_linker';
                }
            }
        }
        if (storedDialogId != '') {
            lzm_displayHelper.maximizeDialogWindow(storedDialogId);
        } else {
            var chatFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
            lzm_chatServerEvaluation.expectArchiveChanges = true;
            lzm_chatPollServer.stopPolling();
            window['tmp-chat-archive-values'] = {page: lzm_chatPollServer.chatArchivePage,
                limit: lzm_chatPollServer.chatArchiveLimit, query: lzm_chatPollServer.chatArchiveQuery,
                filter: lzm_chatPollServer.chatArchiveFilter};
            lzm_chatPollServer.chatArchivePage = 1;
            lzm_chatPollServer.chatArchiveLimit = 1000;
            lzm_chatPollServer.chatArchiveQuery = '';
            lzm_chatPollServer.chatArchiveFilter = '';
            if (chatType == 0) {
                lzm_chatPollServer.chatArchiveFilterInternal = cpId
            } else {
                lzm_chatPollServer.chatArchiveFilterGroup = cpId
            }
            lzm_chatPollServer.resetChats = true;
            lzm_chatDisplay.archiveDisplay.showArchivedChat(lzm_chatServerEvaluation.chatArchive.chats, cpId, cpName, chatId, chatType);
            switchArchivePresentation(chatFetchTime, 0);
            lzm_chatPollServer.startPolling();
        }
    }
}

function selectArchivedChat(chatId, inDialog) {
    $('.archive-list-line').removeClass('selected-table-line');
    $('#dialog-archive-list-line-' + chatId).addClass('selected-table-line');
    $('#archive-list-line-' + chatId).addClass('selected-table-line');
    if (inDialog) {
        $('#matching-chats-table').data('selected-chat-id', chatId);
        var thisChat = {};
        for (var i=0; i<lzm_chatServerEvaluation.chatArchive.chats.length; i++) {
            if (lzm_chatServerEvaluation.chatArchive.chats[i].cid == chatId) {
                thisChat = lzm_chatServerEvaluation.chatArchive.chats[i];
            }
        }
        var chatHtml;
        try {
            chatHtml = '<legend>' + t('Text') + '</legend>' +
                '<div style="margin-top: -10px; margin-left: -10px;">' + thisChat.chtml.replace(/\.\/images\//g, 'img/') + '</div>';
        } catch(e) {
            chatHtml = '<legend>' + t('Text') + '</legend>';
        }
        if (chatId != '') {
            $('#create-ticket-from-chat').removeClass('ui-disabled');
        }
        chatHtml = lzm_commonTools.replaceLinksInChatView(chatHtml);
        $('#chat-content-inner').html(chatHtml);
    }
}

function removeArchiveFilterMenu() {
    lzm_chatDisplay.showArchiveFilterMenu = false;
    $('#archive-filter-context').remove();
}

function toggleArchiveFilter(filter, e) {
    e.stopPropagation();
    $('.archive-list-page-button').addClass('ui-disabled');
    lzm_chatPollServer.stopPolling();
    var archiveFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
    lzm_chatServerEvaluation.expectArchiveChanges = true;
    removeArchiveFilterMenu();
    var filterList = lzm_chatPollServer.chatArchiveFilter.split('');
    if ($.inArray(filter.toString(), filterList) != -1) {
        var pattern = new RegExp(filter.toString());
        lzm_chatPollServer.chatArchiveFilter = lzm_chatPollServer.chatArchiveFilter.replace(pattern, '');
    } else {
        filterList.push(filter);
        filterList.sort();
        lzm_chatPollServer.chatArchiveFilter = filterList.join('');
    }
    if (lzm_chatPollServer.chatArchiveFilter == '') {
        lzm_chatPollServer.chatArchiveFilter = '012';
    }
    lzm_chatPollServer.chatArchivePage = 1;
    lzm_chatPollServer.startPolling();
    lzm_chatPollServer.resetChats = true;
    switchArchivePresentation(archiveFetchTime, 0);
}

function switchArchivePresentation(archiveFetchTime, counter) {
    var loadingHtml, myWidth, myHeight;
    if (counter == 0) {
        if ($('#matching-chats-table').length == 0) {
            loadingHtml = '<div id="archive-loading"></div>';
            $('#archive-body').append(loadingHtml).trigger('create');
            myWidth = $('#archive-body').width() + 10;
            myHeight = $('#archive-body').height() + 10;
            $('#archive-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
                'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
                'background-position': 'center', 'z-index': 1000, opacity: 0.85});
        } else {
            loadingHtml = '<div id="matching-archive-loading"></div>';
            $('#visitor-info-placeholder-content-5').append(loadingHtml).trigger('create');
            myWidth = $('#visitor-info-placeholder-content-5').width() + 28;
            myHeight = $('#visitor-info-placeholder-content-5').height() + 48;
            $('#matching-archive-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
                'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
                'background-position': 'center', 'z-index': 1000, opacity: 0.85});
        }
    }
    if (archiveFetchTime != lzm_chatServerEvaluation.archiveFetchTime || counter >= 40) {
        if ($('#matching-chats-table').length == 0) {
            lzm_chatDisplay.archiveDisplay.createArchive();
            $('#archive-loading').remove();
        } else {
            $('#matching-archive-loading').remove();
            selectArchivedChat($('#matching-chats-table').data('selected-chat-id'), true);
        }
    } else {
        counter++;
        var delay = (counter <= 5) ? 200 : (counter <= 11) ? 500 : (counter <= 21) ? 1000 : 2000;
        setTimeout(function() {switchArchivePresentation(archiveFetchTime, counter);}, delay);
    }
}

function openArchiveListContextMenu(e, chatId) {
    e.preventDefault();
    selectArchivedChat(chatId, false);
    if (lzm_chatDisplay.showArchiveListContextMenu) {
        removeArchiveListContextMenu();
    } else {
        var archivedChat = null;
        for (var i=0; i<lzm_chatServerEvaluation.chatArchive.chats.length; i++) {
            if (lzm_chatServerEvaluation.chatArchive.chats[i].cid == chatId) {
                archivedChat = lzm_commonTools.clone(lzm_chatServerEvaluation.chatArchive.chats[i]);
            }
        }
        if (archivedChat != null) {
            lzm_chatDisplay.showArchiveListContextMenu = true;
            e.stopPropagation();
            var parentOffset = $('#archive-body').offset();

            var xValue = e.pageX - parentOffset.left + $('#ticket-history-placeholder-content-0').scrollLeft();
            var yValue = e.pageY - parentOffset.top + $('#ticket-history-placeholder-content-0').scrollTop();

            lzm_chatDisplay.showContextMenu('archive', archivedChat, xValue, yValue);
        }
    }
}

function removeArchiveListContextMenu() {
    lzm_chatDisplay.showArchiveListContextMenu = false;
    $('#archive-context').remove();
}

function sendChatTranscriptTo(chatId, dialogId, windowId, dialogData) {
    lzm_chatDisplay.archiveDisplay.sendChatTranscriptTo(chatId, dialogId, windowId, dialogData);
}

function printArchivedChat(chatId) {
    removeArchiveListContextMenu();
    if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
        showNotMobileMessage();
    } else {
        var myChat = null;
        for (var i=0; i<lzm_chatServerEvaluation.chatArchive.chats.length; i++) {
            if (lzm_chatServerEvaluation.chatArchive.chats[i].cid == chatId) {
                myChat = lzm_chatServerEvaluation.chatArchive.chats[i];
            }
        }
        if (myChat != null) {
            lzm_commonTools.printContent('chat', {chat: myChat});
        }
    }
}

/**************************************** Report functions ****************************************/
function pageReportList(page) {
    $('#report-list-table').data('selected-report', '');
    $('.report-list-page-button').addClass('ui-disabled');
    $('#report-filter').addClass('ui-disabled');
    var reportFetchTime = lzm_chatServerEvaluation.reportFetchTime;
    lzm_chatServerEvaluation.expectReportChanges = true;
    lzm_chatPollServer.stopPolling();
    lzm_chatPollServer.reportPage = page;
    lzm_chatPollServer.resetReports = true;
    lzm_chatPollServer.startPolling();
    switchReportListPresentation(reportFetchTime, 0);
}

function switchReportListPresentation(reportFetchTime, counter) {
    var loadingHtml, myWidth, myHeight;
    if (counter == 0) {
        loadingHtml = '<div id="report-list-loading"></div>';
        $('#report-list-body').append(loadingHtml).trigger('create');
        myWidth = $('#report-list-body').width() + 28;
        myHeight = $('#report-list-body').height() + 48;
        $('#report-list-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
            'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
            'background-position': 'center', 'z-index': 1000, opacity: 0.85});
    }
    if (reportFetchTime != lzm_chatServerEvaluation.reportFetchTime || counter >= 40) {
        lzm_chatDisplay.reportsDisplay.createReportList();
    } else {
        counter++;
        var delay = (counter <= 5) ? 200 : (counter <= 11) ? 500 : (counter <= 21) ? 1000 : 2000;
        setTimeout(function() {switchReportListPresentation(reportFetchTime, counter);}, delay);
    }
}

function openReportContextMenu(e, reportId, canBeReCalculated) {
    e.stopPropagation();
    e.preventDefault();
    removeReportFilterMenu();
    selectReport(reportId);
    if (lzm_chatDisplay.showReportContextMenu) {
        removeReportContextMenu();
    } else {
        var scrolledDownY, scrolledDownX, parentOffset;
        var place = 'report-list';
        scrolledDownY = $('#' + place +'-body').scrollTop();
        scrolledDownX = $('#' + place +'-body').scrollLeft();
        parentOffset = $('#' + place +'-body').offset();
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        var yValue = e.pageY - parentOffset.top + scrolledDownY;

        var report = lzm_chatServerEvaluation.reports.getReport(reportId);
        report.canBeReCalculated = canBeReCalculated;
        if (report != null) {
            lzm_chatDisplay.showReportContextMenu = true;
            lzm_chatDisplay.showContextMenu(place, report, xValue, yValue);
        }
    }
}

function openReportFilterMenu(e) {
    var filter = lzm_chatPollServer.reportFilter;
    e.stopPropagation();
    if (lzm_chatDisplay.showReportFilterMenu) {
        removeReportFilterMenu();
    } else {
        var parentOffset = $('#report-filter').offset();
        var xValue = parentOffset.left;
        var yValue = parentOffset.top + 21;
        lzm_chatDisplay.showReportFilterMenu = true;
        lzm_chatDisplay.showContextMenu('report-filter', {filter: filter}, xValue, yValue);
        e.preventDefault();
    }
}

function removeReportFilterMenu() {
    lzm_chatDisplay.showReportFilterMenu = false;
    $('#report-filter-context').remove();
}

function removeReportContextMenu() {
    lzm_chatDisplay.showReportContextMenu = false;
    $('#report-list-context').remove();
}

function selectReport(reportId) {
    $('#report-list-table').data('selected-report', reportId);
    $('.report-list-line').removeClass('selected-table-line');
    $('#report-list-line-' + reportId).addClass('selected-table-line');
}

function recalculateReport(reportId) {
    removeReportContextMenu();
    if (!lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'reports', 'recalculate', {})) {
        showNoPermissionMessage();
    } else {
        var report = lzm_chatServerEvaluation.reports.getReport(reportId);
        if (report != null) {
            lzm_chatPollServer.pollServerSpecial({year: report.y, month: report.m, day: report.d, time: report.t, mtime: report.mt}, 'recalculate-report');
        }
    }
}

function loadReport(reportId, type) {
    var report = lzm_chatServerEvaluation.reports.getReport(reportId);
    if (report != null) {
        var reportUrl = lzm_chatServerEvaluation.chosen_profile.server_protocol + lzm_chatServerEvaluation.chosen_profile.server_url;
        if (type == 'report') {
            reportUrl += '/report.php?h=' + report.i + '&y=' + report.y + '&m=' + report.m + '&d=' + report.d;
            if (multiServerId != '') {
                reportUrl += '&ws=' + multiServerId;
            }
        } else if (type == 'visitors') {
            reportUrl += '/report.php?h=' + report.i + '&y=' + report.y + '&m=' + report.m + '&d=' + report.d + '&u=1';
            if (multiServerId != '') {
                reportUrl += '&ws=' + multiServerId;
            }
        }
        openLink(reportUrl);
    }
}

function toggleReportFilter(filter, e) {
    e.stopPropagation();
    $('.report-list-page-button').addClass('ui-disabled');
    $('#report-filter').addClass('ui-disabled');
    lzm_chatPollServer.stopPolling();
    var reportFetchTime = lzm_chatServerEvaluation.reportFetchTime;
    lzm_chatServerEvaluation.expectReportChanges = true;
    removeReportFilterMenu();
    lzm_chatPollServer.reportFilter = filter;
    lzm_chatPollServer.reportPage = 1;
    lzm_chatPollServer.startPolling();
    lzm_chatPollServer.resetReports = true;
    switchReportListPresentation(reportFetchTime, 0);
}

/**************************************** Operator and group functions ****************************************/
function createDynamicGroup() {
    if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', {o: lzm_chatDisplay.myId})) {
        lzm_chatDisplay.createDynamicGroup();
    } else {
        showNoPermissionMessage();
    }
}

function saveNewDynamicGroup() {
    var newGroupName = $('#new-dynamic-group-name').val().replace(/^ */, '').replace(/ *$/, '');
    lzm_chatDisplay.doNotUpdateOpList = false;
    if (newGroupName != '') {
        lzm_chatUserActions.saveDynamicGroup('create', '', newGroupName, '');
        $('#operator-list-line-new-' + lzm_chatDisplay.newDynGroupHash).html('<th class="lzm-unselectable" colspan="2"' +
            ' style="text-align: left; cursor: pointer; padding: 3px 8px 3px 4px;">' +
            '<span class="operator-list-icon" style="background-image: url(\'img/lz_group_dynamic.png\'); background-size: 14px 14px;">' +
            '</span>&nbsp;&nbsp;' + newGroupName + '</th>');
    } else {
        $('#operator-list-line-new-' + lzm_chatDisplay.newDynGroupHash).remove();
        lzm_chatDisplay.createOperatorList();
    }
}

function deleteDynamicGroup(id) {
    var group = lzm_chatServerEvaluation.groups.getGroup(id);
    if (group != null && typeof group.members != 'undefined') {
        if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', group)) {
            lzm_chatUserActions.saveDynamicGroup('delete', id, '', '');
            lzm_chatServerEvaluation.groups.setGroupProperty(id, 'is_active', false);
            if (lzm_chatDisplay.selected_view == 'internal') {
                lzm_chatDisplay.createOperatorList();
            } else if (lzm_chatDisplay.selected_view == 'mychats') {
                lzm_chatDisplay.createActiveChatPanel(false, true);
            }
        } else {
            showNoPermissionMessage();
        }
    }
}

function addToDynamicGroup(id, browserId, chatId) {
    if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', {o: lzm_chatDisplay.myId})) {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            saveChatInput(lzm_chatDisplay.active_chat_reco);
            removeEditor();
        }
        lzm_chatDisplay.addToDynamicGroup(id, browserId, chatId);
    } else {
        showNoPermissionMessage();
    }
}

function removeFromDynamicGroup(id, groupId) {
    if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', lzm_chatServerEvaluation.groups.getGroup(groupId))) {
        var browserId = '', isGroupOwner = false;
        if (id.indexOf('~') != -1) {
            browserId = id.split('~')[1];
            id = id.split('~')[0];
        }
        var group = lzm_chatServerEvaluation.groups.getGroup((groupId));
        if (group != null && group.o == id) {
            isGroupOwner = true;
        }
        if (!isGroupOwner) {
            lzm_chatUserActions.saveDynamicGroup('remove', groupId, '', id, {browserId: browserId});
        } else {
            var alertText =  t('The owner of a group must be member of the group.');
            lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    } else {
        showNoPermissionMessage();
    }
}

function selectDynamicGroup(groupId) {
    $('.dynamic-group-line').removeClass('selected-table-line');
    $('#dynamic-group-line-' + groupId).addClass('selected-table-line');
    $('#dynamic-group-table').data('selected-group', groupId);
}

function openOperatorListContextMenu(e, type, id, groupId, lineCounter) {
    e.stopPropagation();
    var chatPartner = null, browser = {}, lineId = id + '_' + lineCounter;
    switch (type) {
        case 'group':
            if (id != 'everyoneintern') {
                chatPartner = lzm_chatServerEvaluation.groups.getGroup(id);
            } else {
                chatPartner = {id: id, name: t('All operators')};
            }
            break;
        case 'operator':
            chatPartner = lzm_chatServerEvaluation.operators.getOperator(id);
            break;
        case 'visitor':
            chatPartner = lzm_chatServerEvaluation.visitors.getVisitor(id.split('~')[0]);
            if (typeof chatPartner.b != 'undefined') {
                for (var i=0; i<chatPartner.b.length; i++) {
                    if (chatPartner.b[i].id == id.split('~')[1]) {
                        browser = chatPartner.b[i];
                    }
                }
            } else {
                browser = {id: ''};
            }
            break;
    }
    if (chatPartner != null) {
        selectOperatorLine(id, lineCounter, e);
        var scrolledDownY = $('#operator-list-body').scrollTop();
        var scrolledDownX = $('#operator-list-body').scrollLeft();
        var parentOffset = $('#operator-list-body').offset();
        var yValue = e.pageY - parentOffset.top + scrolledDownY;
        var xValue = e.pageX - parentOffset.left + scrolledDownX;
        lzm_chatDisplay.showContextMenu('operator-list', {type: type, 'chat-partner': chatPartner, groupId: groupId,
            'browser': browser, 'line-id': lineId}, xValue, yValue);
    }
    e.preventDefault();
}

function selectOperatorLine(id, lineCounter, userid, name, fromOpList) {
    try {
    name = lz_global_base64_url_decode(name);
    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    var internalChatsAreDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (var i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && (typeof myGr.internal == 'undefined' || myGr.internal == '1')) {
            internalChatsAreDisabled = false;
        }
    }
    if (!internalChatsAreDisabled && !lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp && lastOpListClick[0] == id && now - lastOpListClick[1] < 500 &&
        typeof userid != 'undefined' && typeof name != 'undefined' && typeof fromOpList != 'undefined') {
        chatInternalWith(id, userid, name, fromOpList)
    } else {
        lastOpListClick = [id, now];
        var lineId = id.replace(/~/, '_') + '_' + lineCounter;
        setTimeout(function() {
            $('.operator-list-line').removeClass('selected-op-table-line');
            $('#operator-list-line-' + lineId).addClass('selected-op-table-line');
        }, 1);
    }
    } catch(ex) {}
}

function removeOperatorListContextMenu() {
    $('#operator-list-context').remove();
    lzm_chatDisplay.createOperatorList();
}

function disableInternalChat(chatId) {
    var userChat = lzm_chatServerEvaluation.userChats.getUserChat(chatId);
    if (userChat != null) {
        var tmpArray = [];
        for (var i=0; i<lzm_chatServerEvaluation.myDynamicGroups.length; i++) {
            if (lzm_chatServerEvaluation.myDynamicGroups[i] != chatId) {
                tmpArray.push(lzm_chatServerEvaluation.myDynamicGroups[i]);
            }
        }
        lzm_chatServerEvaluation.myDynamicGroups = tmpArray;
        lzm_chatServerEvaluation.userChats.setUserChat(chatId, {status: 'left'});
        if (lzm_chatDisplay.active_chat_reco == chatId) {
            var group = lzm_chatServerEvaluation.groups.getGroup(chatId);
            if (group != null) {
                chatInternalWith(group.id, group.id, group.name);
            }
        }
    }
}

function toggleIndividualGroupStatus(groupId, action) {
    lzm_chatDisplay.newGroupsAway = (lzm_chatDisplay.newGroupsAway != null) ?
        lzm_commonTools.clone(lzm_chatDisplay.newGroupsAway) :
        (lzm_chatDisplay.myGroupsAway != null) ? lzm_commonTools.clone(lzm_chatDisplay.myGroupsAway) : [];
    if (action == 'add') {
        if ($.inArray(groupId, lzm_chatDisplay.newGroupsAway) == -1) {
            lzm_chatDisplay.newGroupsAway.push(groupId);
        }
    } else {
        var tmpArray = [];
        for (var i=0;i<lzm_chatDisplay.newGroupsAway.length; i++) {
            if (lzm_chatDisplay.newGroupsAway[i] != groupId) {
                tmpArray.push(lzm_chatDisplay.newGroupsAway[i]);
            }
        }
        lzm_chatDisplay.newGroupsAway = lzm_commonTools.clone(tmpArray);
    }
    lzm_chatServerEvaluation.operators.setOperatorProperty(lzm_chatDisplay.myId, 'groupsAway', lzm_chatDisplay.newGroupsAway);
    removeOperatorListContextMenu();
}

function signOffOperator(operatorId) {
    if (lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId).level == 1) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(operatorId);
        if (operator != null) {
            lzm_chatPollServer.pollServerSpecial({oid: operator.id, ouid: operator.userid}, 'operator-sign-off');
        }
    } else {
        showNoAdministratorMessage();
    }
}

function hideOfflineOperators() {
    lzm_chatDisplay.showOfflineOperators = !lzm_chatDisplay.showOfflineOperators;
    lzm_chatDisplay.createOperatorList();
}

/**************************************** Editor functions ****************************************/
function initEditor(myText, caller, cpId) {
    cpId = (typeof cpId != 'undefined' && cpId != '') ? cpId : lzm_chatDisplay.active_chat_reco
    if ((app == 1) || isMobile) {
        setEditorContents(myText)
    } else {
        chatMessageEditorIsPresent = true;
        lzm_chatInputEditor.init(myText, 'initEditor_' + caller, cpId);
    }
}

function removeEditor() {
    if ((app == 1) || isMobile) {
        // do nothing here
    } else {
        chatMessageEditorIsPresent = false;
        lzm_chatInputEditor.removeEditor();
     }
}

function setFocusToEditor() {
    if ((app == 1) || isMobile) {
        $('#chat-input').focus();
    }
}

function grabEditorContents() {
    if ((app == 1) || isMobile) {
        return $('#chat-input').val();
    } else {
        return lzm_chatInputEditor.grabHtml();
    }
}

function setEditorContents(myText) {
    if ((app == 1) || isMobile) {
        $('#chat-input').val(myText)
    } else {
        lzm_chatInputEditor.setHtml(myText)
    }
}

function clearEditorContents(os, browser, caller) {
    if ((app == 1) || isMobile) {
        if (appOs != 'blackberry') {
            $('#chat-input').val('');
        } else if (typeof caller != 'undefined' && caller == 'send') {
            var activeChat = lzm_chatDisplay.active_chat_reco, cpId = '', cpUserId = '', cpName = '', cpChatId = '';
            var operator = lzm_chatServerEvaluation.operators.getOperator(activeChat);
            var group = lzm_chatServerEvaluation.groups.getGroup(activeChat);
            var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(activeChat);
            if (activeChat == 'everyoneintern') {
                cpId = activeChat; cpUserId = activeChat; cpName = t('All operators');
            } else if (operator != null) {
                cpId = operator.id; cpUserId = operator.userid; cpName = operator.name;
            } else if(group != null) {
                cpId = group.id; cpUserId = group.id; cpName = group.name;
            } else if (visitorBrowser[1] != null) {
                cpId = visitorBrowser[0].id; cpUserId = visitorBrowser[1].id; cpChatId = visitorBrowser[1].chat.id;
            }
            chatInternalWith('', '', '');
            saveChatInput(activeChat, null);
            if (cpChatId == '') {
                chatInternalWith(cpId, cpUserId, cpName);
            } else {
                viewUserData(cpId, cpUserId, cpChatId, true);
            }
        }
    } else {
        lzm_chatInputEditor.clearEditor(os, browser);
    }
}

function setEditorDisplay(myDisplay) {
    if ((app == 1) || isMobile) {
        $('#chat-input').css({display: myDisplay});
    } else {
        $('#chat-input-body').css({display: myDisplay});
    }
}

function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}

function insertAtCursor(myField, myValue) {
    myField = document.getElementById(myField);
    //IE support
    if (document.selection) {
        myField.focus();
        var sel = document.selection.createRange();
        sel.text = myValue;
    }
    //MOZILLA and others
    else if (myField.selectionStart || myField.selectionStart == '0') {
        var startPos = myField.selectionStart;
        var endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

/**************************************** Geotracking map functions ****************************************/
var lzmMessageReceiver = null;

function setMapType(myType) {
    lzm_chatGeoTrackingMap.setMapType(myType);
    var buttonId = myType.toLowerCase() + '-map';
    lzm_chatGeoTrackingMap.selectedMapType = myType;
    $('#geotracking-footline').html(lzm_displayHelper.createGeotrackingFootline());
}

function zoomMap(direction) {
    lzm_chatGeoTrackingMap.zoom(direction);
}

/**************************************** Some stuff done on load of the chat page ****************************************/
$(document).ready(function () {
    try {
        runningInIframe = (window.self !== window.top);
    } catch (e) {}
    lzm_displayHelper = new ChatDisplayHelperClass();
    lzm_inputControls = new CommonInputControlsClass();
    lzm_displayLayout = new ChatDisplayLayoutClass();
    getCredentials();
    lzm_displayHelper.blockUi({message: null});

    // initiate lzm class objects
    if ((app == 1) && typeof lzm_deviceInterface == 'undefined') {
        if (appOs == 'windows') {
            lzm_deviceInterface = new CommonWindowsDeviceInterfaceClass();
        } else {
            lzm_deviceInterface = new CommonDeviceInterfaceClass();
        }
    }
    if (app == 1) {
        var tmpDeviceId = lzm_deviceInterface.loadDeviceId();
        if (tmpDeviceId != 0) {
            deviceId = tmpDeviceId;
        }
    }
    if (app == 1 || isMobile) {
        var chatInputTextArea = document.getElementById("chat-input");
        chatInputTextArea.onfocus = function() {
            moveCaretToEnd(chatInputTextArea);
            // Work around Chrome's little problem
            window.setTimeout(function() {
                moveCaretToEnd(chatInputTextArea);
            }, 1);
        };
    }
    lzm_commonConfig = new CommonConfigClass();
    lzm_commonTools = new CommonToolsClass();
    lzm_commonPermissions = new CommonPermissionClass();
    lzm_commonStorage = new CommonStorageClass(localDbPrefix, (app == 1));
    lzm_chatTimeStamp = new ChatTimestampClass(0);
    var userConfigData = {
        userVolume: chosenProfile.user_volume,
        awayAfter: (typeof chosenProfile.user_away_after != 'undefined') ? chosenProfile.user_away_after : 0,
        playIncomingMessageSound: (typeof chosenProfile.play_incoming_message_sound != 'undefined') ? chosenProfile.play_incoming_message_sound : 0,
        playIncomingChatSound: (typeof chosenProfile.play_incoming_chat_sound != 'undefined') ? chosenProfile.play_incoming_chat_sound : 0,
        repeatIncomingChatSound: (typeof chosenProfile.repeat_incoming_chat_sound != 'undefined') ? chosenProfile.repeat_incoming_chat_sound : 0,
        playIncomingTicketSound: (typeof chosenProfile.play_incoming_ticket_sound != 'undefined') ? chosenProfile.play_incoming_ticket_sound : 0,
        language: (typeof chosenProfile.language != 'undefined') ? chosenProfile.language : 'en',
        backgroundMode: (typeof chosenProfile.background_mode != 'undefined') ? chosenProfile.background_mode : 1
    };
    lzm_chatInputEditor = new ChatEditorClass('chat-input', isMobile, (app == 1), (web == 1));
    lzm_chatDisplay = new ChatDisplayClass(lzm_chatTimeStamp.getServerTimeString(), lzm_commonConfig, lzm_commonTools,
        lzm_chatInputEditor, (web == 1), (app == 1), isMobile, messageTemplates, userConfigData, multiServerId);
    lzm_commonDialog = new CommonDialogClass();
    lzm_chatServerEvaluation = new ChatServerEvaluationClass(lzm_commonTools, chosenProfile, lzm_chatTimeStamp);
    lzm_chatPollServer = new ChatPollServerClass(lzm_commonConfig, lzm_commonTools, lzm_chatDisplay,
        lzm_chatServerEvaluation, lzm_commonStorage, chosenProfile, userStatus, web, app, isMobile, multiServerId);
    lzm_t = new CommonTranslationClass(chosenProfile.server_protocol, chosenProfile.server_url, chosenProfile.mobile_dir, false, chosenProfile.language);
    lzm_t.setTranslationData(translationData);
    lzm_chatUserActions = new ChatUserActionsClass(lzm_commonTools, lzm_chatPollServer, lzm_chatDisplay,
        lzm_chatServerEvaluation, lzm_t, lzm_commonStorage, lzm_chatInputEditor, chosenProfile);
    lzm_chatGeoTrackingMap = new ChatGeotrackingMapClass();
    lzmMessageReceiver = function(_event) {
        if (typeof _event.data.cobrowse != 'undefined' && _event.data.cobrowse) {
            if (typeof _event.data.blocked != 'undefined') {
                iframeEnabled = true;
                enableCobrowsingIframe();
                if (!_event.data.blocked) {
                    if (typeof _event.data.link_url != 'undefined') {
                        var targetUrl = _event.data.link_url;
                        var askBeforePushing = ($('#visitor-cobrowse-iframe').data('action') == 1) ? 1 : 0;
                        var visitorBrowser = $('#visitor-cobrowse-iframe').data('browser');
                        var selectedLanguage = $('#visitor-cobrowse-iframe').data('language');
                        var pushTextGroup = (selectedLanguage.split('~')[1] == 'group') ?
                            (selectedLanguage.split('~').length > 2) ? lz_global_base64_url_decode(selectedLanguage.split('~')[2]) :
                            lzm_chatDisplay.myGroups[0] : '';
                        var pushTextUser = (selectedLanguage.split('~')[1] == 'user') ? lzm_chatDisplay.myId : '';
                        var pushText = lzm_chatUserActions.getChatPM(visitorBrowser.split('~')[0], visitorBrowser.split('~')[1],
                            'wpm', selectedLanguage.split('~')[0].toUpperCase(), pushTextGroup, pushTextUser)['wpm'];
                        pushVisitorToWebsite(visitorBrowser, targetUrl, askBeforePushing, pushText, lzm_chatDisplay.myGroups[0], _event.data.has_target_blank);
                    }
                }
            }
        } else if (_event.origin == lzm_chatGeoTrackingMap.receiver) {
            switch(_event.data.function) {
                case 'get-url':
                lzm_chatGeoTrackingMap.urlIsSet = true;
                    break;
                case 'get-visitor':
                    lzm_chatGeoTrackingMap.selectedVisitor = _event.data.params;
                    $('#visitor-list').data('selected-visitor', _event.data.params);
                    $('#geotracking-footline').html(lzm_displayHelper.createGeotrackingFootline());
                    break;
                case 'get-zoomlevel':
                    lzm_chatGeoTrackingMap.zoomLevel = _event.data.params;
                    break;
                default:
                    logit('Unknown message received: ' + JSON.stringify(_event.data));
                    break;
            }
        }
    };
    if (window.addEventListener) {
        window.addEventListener('message', lzmMessageReceiver, false);
    } else {
        window.attachEvent('onmessage', lzmMessageReceiver);
    }
    lzm_chatServerEvaluation.setUserLanguage(lzm_t.language);
    lzm_chatDisplay.userLanguage = lzm_t.language;
    lzm_chatUserActions.userLanguage = lzm_t.language;

    if (lzm_chatDisplay.viewSelectArray.length == 0) {
        lzm_chatDisplay.viewSelectArray = [];
        var viewSelectIdArray = Object.keys(lzm_chatDisplay.allViewSelectEntries);
        for (var i=0; i<viewSelectIdArray.length; i++) {
            lzm_chatDisplay.viewSelectArray.push({id: viewSelectIdArray[i], name: lzm_chatDisplay.allViewSelectEntries[viewSelectIdArray[i]].title,
                icon: lzm_chatDisplay.allViewSelectEntries[viewSelectIdArray[i]].icon});
        }
    }
    lzm_chatDisplay.createMainMenuPanel();
    lzm_chatDisplay.createViewSelectPanel();
    lzm_chatDisplay.createChatWindowLayout(false);
    if (lzm_chatDisplay.mainTableColumns.visitor.length == 0) {
        lzm_displayHelper.fillColumnArray('visitor', 'general', []);
    }
    if (lzm_chatDisplay.mainTableColumns.archive.length == 0) {
        lzm_displayHelper.fillColumnArray('archive', 'general', []);
    }
    if (lzm_chatDisplay.mainTableColumns.ticket.length == 0) {
        lzm_displayHelper.fillColumnArray('ticket', 'general', []);
    }
    if (lzm_chatDisplay.mainTableColumns.allchats.length == 0) {
        lzm_displayHelper.fillColumnArray('allchats', 'general', []);
    }

    lzm_chatPollServer.pollServerlogin(lzm_chatPollServer.chosenProfile.server_protocol,
        lzm_chatPollServer.chosenProfile.server_url);

    //createUserControlPanel();
    fillStringsFromTranslation();

    mobile = (isMobile) ? 1 : 0;

    // do things on window resize
    $(window).resize(function () {
        setTimeout(function() {
            /*lzm_chatDisplay.createUserControlPanel(lzm_chatPollServer.user_status, lzm_chatServerEvaluation.myName,
                lzm_chatServerEvaluation.myUserId);*/
            lzm_chatDisplay.createViewSelectPanel();
            if (lzm_chatDisplay.selected_view == 'external') {
                lzm_chatDisplay.visitorDisplay.createVisitorList();
            }
            if (lzm_chatDisplay.selected_view == 'mychats') {
                lzm_chatDisplay.createActiveChatPanel(false, false);
            }
            lzm_chatDisplay.createChatWindowLayout(false, false);
            var resizeTimeout = (isMobile || (app == 1)) ? 100 : 100;
            setTimeout(function() {
                handleWindowResize(true);
                    setTimeout(function() {
                        handleWindowResize(true);
                    }, 500);
                if (isMobile || (app == 1)) {
                    setTimeout(function() {
                        handleWindowResize(false);
                    }, 2500);
                    setTimeout(function() {
                        handleWindowResize(false);
                    }, 10000);
                }
            }, resizeTimeout);
        }, 10);
    });

    $('.logout_btn').click(function () {
        logout(true);
    });

    $('#stop_polling').click(function () {
        stopPolling();
    });

    $('#userstatus-button').click(function (e) {
        showUserStatusMenu(e);
    });

    $('#usersettings-button').click(function (e) {
        showUserSettingsMenu(e);
    });

    $('#wishlist-button').click(function() {
        openLink('http://wishlistmobile.livezilla.net/');
    });

    $('#blank-button').click(function() {
        if(debug) {
            debuggingStartStopPolling();
        }
    });

    $('.lzm-button').mouseenter(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#f6f6f6,#e0e0e0)'));
    });

    $('.lzm-button').mouseleave(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#ffffff,#f1f1f1)'));
    });

    //$('body').mouseover(function(){lzm_chatPollServer.wakeupFromAutoSleep();});

    $('body').click(function(e) {
        // Hide user settings menu
        $('#usersettings-menu').css({'display':'none'});
        lzm_chatDisplay.showUsersettingsHtml = false;
        // Hide user status menu
        $('#userstatus-menu').css({'display':'none'});
        lzm_chatDisplay.showUserstatusHtml = false;
        // Hide minimized dialogs menu
        lzm_displayHelper.showMinimizedDialogsMenu(true);
        // Remove all kinds of context menus
        removeTicketContextMenu();
        removeArchiveFilterMenu();
        removeQrdContextMenu();
        removeTicketMessageContextMenu();
        removeTicketFilterMenu();
        removeVisitorListContextMenu();
        removeOperatorListContextMenu();
        removeReportFilterMenu();
        removeReportContextMenu();
        removeChatLineContextMenu();
        removeAllChatsFilterMenu();
        removeFiltersListContextMenu();
        removeVisitorChatActionContextMenu();
        removeArchiveListContextMenu();
        if ($('.operator-list-line-new').length > 0) {
            saveNewDynamicGroup();
        }
    });

    $('body').keyup(function(e) {
        var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
        if (keyCode == 17) {
            controlPressed = false;
        }
        if ($('#email-list').length > 0 && (keyCode == 46)) {
            deleteEmail();
        }
        if ($('#ticket-list-body').length > 0 && $('.dialog-window-container').length == 0 && !controlPressed) {
            var newStatus = 0;
            switch(keyCode) {
                case 79:
                    changeTicketStatus(0);
                    break;
                case 80:
                    changeTicketStatus(1);
                    break;
                case 67:
                    changeTicketStatus(2);
                    break;
                case 46:
                case 68:
                    changeTicketStatus(3, true);
                    break;
                case 40:
                    selectTicket('next');
                    break;
                case 38:
                    selectTicket('previous');
                    break;
            }
        }
    });
    $('body').keydown(function(e) {
        var keyCode = (typeof e.which != 'undefined') ? e.which : e.keyCode;
        if (keyCode == 17) {
            controlPressed = true;
        }
    });

    $('#new-view-select-panel').on('touchstart', function(e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        vsPanelTouchPos = touch.pageX;
    });
    $('#new-view-select-panel').on('touchend', function(e) {
        if (vsPanelTouchPos != null) {
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            var xPos = touch.pageX;
            var xMove = vsPanelTouchPos - xPos;
            vsPanelTouchPos = null;
            if (xMove > 50) {
                moveViewSelectPanel('right');
            } else if (xMove < -50) {
                moveViewSelectPanel('left');
            }
        }
    });

    $(window).on('beforeunload', function(){
        if (lzm_chatDisplay.askBeforeUnload)
            return t('Are you sure you want to leave or reload the client? You may lose data because of that.');
    });

    $(window).mousemove(function() {
        doBlinkTitle = false;
        blinkTitleMessage = '';
        blinkTitleStatus = 0;
    });

    if (app == 0 && mobile == 0) {
        setInterval(function() {
            if (doBlinkTitle && blinkTitleMessage != '') {
                var newTitle = (blinkTitleStatus == 0)
                    ? t('<!--site_name--> (<!--message-->)', [['<!--site_name-->',lzm_chatServerEvaluation.siteName], ['<!--message-->', blinkTitleMessage]])
                    : lzm_chatServerEvaluation.siteName;
                $('title').html(newTitle);
                blinkTitleStatus = 1 - blinkTitleStatus;
            } else {
                $('title').html(lzm_chatServerEvaluation.siteName);
            }
        }, 1800);
    }
});
