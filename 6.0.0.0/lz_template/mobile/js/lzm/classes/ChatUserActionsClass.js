/****************************************************************************************
 * LiveZilla ChatUserActionsClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatUserActionsClass(lzm_commonTools, lzm_chatPollServer, lzm_chatDisplay, lzm_chatServerEvaluation,
                              lzm_commonTranslation, lzm_commonStorage, lzm_chatInputEditor, chosenProfile) {

    // variables defined here, controlling the application
    this.open_chats = [];
    this.active_chat = 'LIST';
    this.active_chat_reco = 'LIST';
    this.forwardData = {};

    // variables passed to this class as parameters
    this.lzm_commonTools = lzm_commonTools;
    this.lzm_chatPollServer = lzm_chatPollServer;
    this.lzm_chatDisplay = lzm_chatDisplay;
    this.lzm_chatServerEvaluation = lzm_chatServerEvaluation;
    this.lzm_commonTranslation = lzm_commonTranslation;
    this.lzm_commonStorage = lzm_commonStorage;
    this.chosenProfile = chosenProfile;
    this.lzm_chatInputEditor = lzm_chatInputEditor;

    this.userLanguage = '';
    this.gTranslateLanguage = '';

    this.acceptedChatCounter = 0;

    this.ChatInputValues = {};

    this.isApp = this.lzm_chatDisplay.isApp;
    this.isMobile = this.lzm_chatDisplay.isMobile;

    this.chatCallBackList = [];
}


/**************************************** General functions ****************************************/
ChatUserActionsClass.prototype.resetWebApp = function() {
    //this.open_chats = [];
    //this.forwardData = {};
    //this.ChatInputValues = {};
    //this.setActiveChat('', '', '', { id:'', b_id:'', b_chat:{ id:'' } });
};

ChatUserActionsClass.prototype.sendChatMessage = function (new_chat, translated_chat, visitorChat) {
    var chatText = new_chat.text;
    this.lzm_chatPollServer.stopPolling();
    var pPostsVObject = {
        a: chatText,
        b:new_chat.reco,
        c:new_chat.id,
        d: '',
        e: ''
    };

    if (translated_chat != '' && lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage != '') {
        pPostsVObject.d = translated_chat;
        pPostsVObject.e = lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage.toUpperCase();
    }
    this.lzm_chatPollServer.addToOutboundQueue('p_posts_v', pPostsVObject);

    this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');
};

ChatUserActionsClass.prototype.getTranslationLanguages = function(target) {
    var that = this;
    if (lzm_chatServerEvaluation.otrs != '' && lzm_chatServerEvaluation.otrs != null) {
        var gUrl = 'https://www.googleapis.com/language/translate/v2/languages';
        try {
            target = (typeof target != 'undefined') ? target : lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId).lang.toLowerCase();
        } catch(ex) {
            target = 'en';
        }
        var dataObject = {key: lzm_chatServerEvaluation.otrs, target: target};
        $.ajax({
            type: "GET",
            url: gUrl,
            data: dataObject,
            success: function (data) {
                that.gTranslateLanguage = target;
                lzm_chatDisplay.translationLanguages = lzm_commonTools.clone(data.data.languages);
                lzm_chatDisplay.translationLangCodes = [];
                for (var i=0; i<data.data.languages.length; i++) {
                    lzm_chatDisplay.translationLangCodes.push(data.data.languages[i].language);
                }
                lzm_chatDisplay.translationServiceError = null;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (target.indexOf('-') != -1) {
                    target = target.split('-')[0];
                    that.getTranslationLanguages(target);
                } else if (target != 'en') {
                    that.getTranslationLanguages('en');
                } else {
                    logit(jqXHR);
                    logit(textStatus);
                    logit(errorThrown);
                    lzm_chatDisplay.translationServiceError = 'Google API Failure'
                }
            },
            dataType: 'json'
        });
    }
};

ChatUserActionsClass.prototype.saveTranslationSettings = function(visitorChat, tmm, tvm) {
    var visitor = visitorChat.split('~');
    var myObject = {visitorId: visitor[0], browserId: visitor[1], chatId: visitor[2], sourceLanguage: '', targetLanguage: ''};
    if (typeof lzm_chatDisplay.chatTranslations[visitorChat] == 'undefined') {
        lzm_chatDisplay.chatTranslations[visitorChat] = {tmm: null, tvm: null};
    }
    var translate = tmm.translate && (tmm.sourceLanguage != tmm.targetLanguage);
    lzm_chatDisplay.chatTranslations[visitorChat].tmm = {translate: translate, sourceLanguage: tmm.sourceLanguage,
        targetLanguage: tmm.targetLanguage};
    translate = tvm.translate && (tvm.sourceLanguage != tvm.targetLanguage);
    lzm_chatDisplay.chatTranslations[visitorChat].tvm = {translate: translate, sourceLanguage: tvm.sourceLanguage,
        targetLanguage: tvm.targetLanguage};
    if (tvm.translate) {
        myObject.sourceLanguage = tvm.sourceLanguage;
        myObject.targetLanguage = tvm.targetLanguage;
    }
    lzm_chatPollServer.pollServerSpecial(myObject, 'set-translation');
    if ((tmm.translate && tmm.sourceLanguage != tmm.targetLanguage) || (tvm.translate && tvm.sourceLanguage != tvm.targetLanguage)) {
        $('#translate-chat').css({'background-color': '#5197ff', color: '#ffffff', 'border-color': '#4888e3'});
        $('#translate-chat i.fa').css({color: '#ffffff'});
    } else {
        $('#translate-chat').css({'background-color': '#e8e8e8', color: '#666666', 'border-color': '#cccccc'});
        $('#translate-chat i.fa').css({color: '#666666'});
    }
};

ChatUserActionsClass.prototype.translateTextAndSend = function(visitorChat, chatMessage, chatReco) {
    var gUrl = 'https://www.googleapis.com/language/translate/v2';
    var dataObject = {key: lzm_chatServerEvaluation.otrs, source: lzm_chatDisplay.chatTranslations[visitorChat].tmm.sourceLanguage,
        target: lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage, q: chatMessage};
    $.ajax({
        type: "GET",
        url: gUrl,
        data: dataObject,
        success: function (data) {
            var translatedChatMessage = data.data.translations[0].translatedText;
            sendChat(chatMessage, chatReco, translatedChatMessage, visitorChat);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            logit(jqXHR);
            logit(textStatus);
            logit(errorThrown);
            sendChat(chatMessage, chatReco, '', visitorChat);
        },
        dataType: 'json'
    });
};

ChatUserActionsClass.prototype.setActiveChat = function (active_chat, active_chat_reco, active_chat_realname, thisUser) {
    this.lzm_chatDisplay.active_chat = active_chat;
    this.lzm_chatServerEvaluation.active_chat = active_chat;
    this.active_chat = active_chat;
    this.lzm_chatDisplay.active_chat_reco = active_chat_reco;
    this.lzm_chatServerEvaluation.active_chat_reco = active_chat_reco;
    this.active_chat_reco = active_chat_reco;
    this.lzm_chatDisplay.active_chat_realname = active_chat_realname;
    this.lzm_chatPollServer.thisUser = thisUser;
    this.lzm_chatDisplay.thisUser = thisUser;
};

ChatUserActionsClass.prototype.removeForwardFromList = function (id, b_id) {
    var tmp_external_forwards = [];
    //var tmp_extForwardIdList = [];
    var removeExternalForwardId = [];
    for (var extFwdIndex = 0; extFwdIndex < this.lzm_chatServerEvaluation.external_forwards.length; extFwdIndex++) {
        if (this.lzm_chatServerEvaluation.external_forwards[extFwdIndex].u != id + '~' + b_id) {
            tmp_external_forwards.push(this.lzm_chatServerEvaluation.external_forwards[extFwdIndex]);
        } else {
            removeExternalForwardId.push(this.lzm_chatServerEvaluation.external_forwards[extFwdIndex].id);
        }
    }
    /*for (var extFwdIdIndex = 0; extFwdIdIndex < this.lzm_chatServerEvaluation.extForwardIdList.length; extFwdIdIndex++) {
        if ($.inArray(this.lzm_chatServerEvaluation.extForwardIdList[extFwdIdIndex], removeExternalForwardId) == -1) {
            tmp_extForwardIdList.push(this.lzm_chatServerEvaluation.extForwardIdList[extFwdIdIndex]);
        }
    }*/
    this.lzm_chatServerEvaluation.external_forwards = tmp_external_forwards;
    //this.lzm_chatServerEvaluation.extForwardIdList = tmp_extForwardIdList;
};

ChatUserActionsClass.prototype.saveUserSettings = function(settings, multiServerId, isApp) {
    this.chosenProfile.user_volume = settings.volume;
    this.lzm_chatDisplay.volume = settings.volume;
    this.chosenProfile.user_away_after = settings.awayAfterTime;
    this.lzm_chatDisplay.awayAfterTime = settings.awayAfterTime;
    this.chosenProfile.play_incoming_message_sound = settings.playNewMessageSound;
    this.lzm_chatDisplay.playNewMessageSound = settings.playNewMessageSound;
    this.chosenProfile.play_incoming_chat_sound = settings.playNewChatSound;
    this.lzm_chatDisplay.playNewChatSound = settings.playNewChatSound;
    this.chosenProfile.repeat_incoming_chat_sound = settings.repeatNewChatSound;
    this.lzm_chatDisplay.repeatNewChatSound = settings.repeatNewChatSound;
    this.chosenProfile.background_mode = settings.backgroundMode;
    this.lzm_chatDisplay.backgroundModeChecked = settings.backgroundMode;
    this.chosenProfile.save_connections = settings.saveConnections;
    this.lzm_chatDisplay.saveConnections = settings.saveConnections;
    this.chosenProfile.tickets_read = settings.ticketsRead;
    this.lzm_chatDisplay.ticketReadStatusChecked = settings.ticketsRead;
    this.chosenProfile.play_incoming_ticket_sound = settings.playNewTicketSound;
    lzm_chatDisplay.playNewTicketSound = settings.playNewTicketSound;
    this.chosenProfile.vibrate_notifications = settings.vibrateNotifications;
    lzm_chatDisplay.vibrateNotifications = settings.vibrateNotifications;
    this.chosenProfile.show_view_select_panel = JSON.stringify(settings.showViewSelectPanel);
    lzm_chatDisplay.showViewSelectPanel = settings.showViewSelectPanel;
    this.chosenProfile.ato_accept = settings.autoAccept;
    lzm_chatDisplay.autoAcceptChecked = settings.autoAccept;
    this.chosenProfile.qrd_auto_search = settings.qrdAutoSearch;
    lzm_chatDisplay.qrdAutoSearch = settings.qrdAutoSearch;
    this.chosenProfile.alert_new_filter = settings.alertNewFilter;
    lzm_chatDisplay.alertNewFilter = settings.alertNewFilter;

    var tableNames = ['visitor', 'archive', 'ticket', 'allchats'], i = 0;
    for (i=0; i<tableNames.length; i++) {
        var tableColumns = {}, j = 0;
        for (j=0; j<settings.tableColumns[tableNames[i]].general.length; j++) {
            tableColumns[settings.tableColumns[tableNames[i]].general[j].cid] = settings.tableColumns[tableNames[i]].general[j].display;
        }
        lzm_commonStorage.saveValue(tableNames[i] + '_column_table_' + lzm_chatServerEvaluation.myId, JSON.stringify(tableColumns));
        lzm_displayHelper.fillColumnArray(tableNames[i], 'general', tableColumns);
        tableColumns = {};
        for (j=0; j<settings.tableColumns[tableNames[i]].custom.length; j++) {
            tableColumns[settings.tableColumns[tableNames[i]].custom[j].cid] = settings.tableColumns[tableNames[i]].custom[j].display;
        }
        lzm_commonStorage.saveValue('custom_' + tableNames[i] + '_column_table_' + lzm_chatServerEvaluation.myId, JSON.stringify(tableColumns));
        lzm_displayHelper.fillColumnArray(tableNames[i], 'custom', tableColumns);
    }
    lzm_commonStorage.saveValue('show_view_select_panel_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.showViewSelectPanel));
    lzm_commonStorage.saveValue('view_select_array_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.viewSelectArray));
    lzm_commonStorage.saveValue('auto_accept_chat_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.autoAccept));
    lzm_commonStorage.saveValue('save_connections_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.saveConnections));
    lzm_commonStorage.saveValue('vibrate_notifications_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.vibrateNotifications));
    lzm_commonStorage.saveValue('tickets_read_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.ticketsRead));
    lzm_commonStorage.saveValue('qrd_auto_search_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.qrdAutoSearch));
    lzm_commonStorage.saveValue('alert_new_filter_' + lzm_chatServerEvaluation.myId, JSON.stringify(settings.alertNewFilter));
    if (lzm_chatDisplay.isApp && typeof lzm_deviceInterface != 'undefined') {
        try {
            lzm_deviceInterface.setVibrateOnNotifications(settings.vibrateNotifications);
        } catch(e) {}
    }

    this.lzm_commonStorage.loadProfileData();
    var tmpProfile = this.lzm_commonTools.clone(this.chosenProfile);
    if (this.chosenProfile.server_url.indexOf(':') != -1) {
        var tmpUrlArray = this.chosenProfile.server_url.split(':');
        var tmpUrl = tmpUrlArray[0];
        tmpUrlArray = tmpUrlArray[1].split('/');
        for (i=1; i< tmpUrlArray.length; i++) {
            tmpUrl += '/' + tmpUrlArray[i];
        }
        tmpUrl = (isApp && multiServerId != '') ? tmpUrl + '#' + lz_global_base64_url_decode(multiServerId) : tmpUrl;
        tmpProfile.server_url = tmpUrl;
    }
    tmpProfile.keepPassword = true;
    var savedIndex = this.lzm_commonStorage.saveProfile(tmpProfile);
    if (app == 1 && typeof lzm_deviceInterface != 'undefined') {
        lzm_commonStorage.saveValue('play_incoming_ticket_sound_' + String(savedIndex), settings.playNewTicketSound);
        if (typeof lzm_deviceInterface.keepActiveInBackgroundMode != 'undefined') {
            lzm_deviceInterface.keepActiveInBackgroundMode(settings.backgroundMode == 1);
        }
    }


};

ChatUserActionsClass.prototype.replaceLinks = function(myText) {
    var links = myText.match(/href="#" onclick="openLink\('.*?'\)"/);
    if (typeof links != 'undefined' && links != null) {
        for (var i=0; i<links.length; i++) {
            var address = links[i].replace(/href="#" onclick="openLink\('/,'').replace(/'\)"/,'');
            var replacement = 'href="' + address + '" target="_blank"';
            myText = myText.replace(links[i],replacement);
        }
    }
    return myText;
};

/**************************************** Operator, Group and Operator chat functions ****************************************/
ChatUserActionsClass.prototype.chatInternalWith = function (id, userid, name, fromOpList) {
    var thisClass = this;
    thisClass.saveChatInput(thisClass.active_chat_reco);
    this.lzm_chatDisplay.selected_view = 'mychats';

    var i;
    var thisUser = { id:'', b_id:'', b_chat:{ id:'' } };
    if (id == 'everyoneintern') {
        thisUser = {id: 'everyoneintern', b_id: '', b_chat: {id: ''}, name: name, logo: 'img/lz_group.png'};
    } else {
        if (id != userid) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(id);
            if (operator != null) {
                lzm_chatServerEvaluation.operators.setLogo(operator.id, operator.status_logo);
                thisUser = operator;
                thisUser.b_id = '';
                thisUser.b_chat = {id: ''};
            }
        } else {
            var group = lzm_chatServerEvaluation.groups.getGroup(id);
            if (group != null) {
                thisUser = group;
                thisUser.b_id = '';
                thisUser.b_chat = {id: ''};
            }
        }
    }
    this.setActiveChat(id, id, name, thisUser);
    var loadedValue = thisClass.loadChatInput(thisClass.active_chat_reco);

    this.lzm_chatDisplay.toggleVisibility();
    this.lzm_chatDisplay.createViewSelectPanel(this.lzm_chatDisplay.firstVisibleView);

    if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat) == null) {
        lzm_chatServerEvaluation.userChats.setUserChat(lzm_chatDisplay.active_chat, {status:'read', type:'internal',
            id: id, b_id:'', group_chat: false});
    }
    var userChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat);
    var enableButtons;
    if (userChat.status != 'left' || fromOpList) {
        initEditor(loadedValue, 'chatInternalWith', id);
        enableButtons = true;
        lzm_chatServerEvaluation.userChats.setUserChat(lzm_chatDisplay.active_chat, {status: 'read'});
    } else {
        enableButtons = false;
        removeEditor();
    }

    this.lzm_chatDisplay.createChatWindowLayout(true);
    this.lzm_chatDisplay.showInternalChat(this.lzm_chatPollServer.thisUser, enableButtons);

    $('#send-qrd').click(function() {
        showQrd(id, 'chat');
    });

    this.lzm_chatDisplay.removeSoundPlayed(id);
};

ChatUserActionsClass.prototype.leaveInternalChat = function(id, userid, name) {
    this.deleteChatInput(this.active_chat_reco);
    lzm_chatServerEvaluation.userChats.setUserChat(lzm_chatDisplay.active_chat, {status: 'left'});
    this.setActiveChat('','','',{ id:'', b_id:'', b_chat:{ id:'' } });
    this.lzm_chatDisplay.createActiveChatPanel(false, true);
    this.lzm_chatDisplay.finishLeaveChat();
    this.lzm_chatDisplay.showLeaveChat(lzm_chatPollServer.thisUser);
};

ChatUserActionsClass.prototype.saveDynamicGroup = function(action, groupId, groupName, memberId, additionalData) {
    var dynamicGroupObject = {}, pollType = '', memberUserId = '', memberBrowserId = '', memberChatId = '',
        memberIsPersistent = 1, newGroup = {}, newGroupId, i = 0;
    var group = lzm_chatServerEvaluation.groups.getGroup(groupId);
    var operator = lzm_chatServerEvaluation.operators.getOperator(memberId);
    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(memberId);
    if (operator != null) {
        memberUserId = operator.userid;
    }
    if (visitor != null) {
        memberUserId = visitor.id;
        memberBrowserId = additionalData.browserId;
        memberChatId = additionalData.chatId;
        memberIsPersistent = (additionalData.isPersistent) ? '1' : '0';
        memberId = memberId + '~' + memberBrowserId;
    }
    switch (action) {
        case 'create':
            newGroupId = md5('' + Math.random());
            newGroup = {i: newGroupId, id: newGroupId, is_active: true, logo: 'img/lz_group.png', members: [{i: lzm_chatServerEvaluation.myId}],
                n: groupName, name: groupName, o: lzm_chatServerEvaluation.myId, pm: [], sig: [], humanReadableDescription: {},
                status_logo: 'img/lz_group.png'};
            lzm_chatServerEvaluation.groups.setGroup(newGroup);
            dynamicGroupObject.myUserId = lzm_chatServerEvaluation.myUserId;
            dynamicGroupObject.myId = lzm_chatServerEvaluation.myId;
            dynamicGroupObject.groupId = newGroupId;
            dynamicGroupObject.groupName = groupName;
            pollType = 'dynamic-group-create';
            break;
        case 'delete':
            dynamicGroupObject.myUserId = lzm_chatServerEvaluation.myUserId;
            dynamicGroupObject.myId = lzm_chatServerEvaluation.myId;
            dynamicGroupObject.groupId = groupId;
            if (group != null && typeof group.members != 'undefined') {
                for (i=0; i<group.members.length; i++) {
                    if (group.members[i].i.indexOf('~') != -1 && lzm_chatServerEvaluation.userChats.getUserChat(group.members[i].i) != null) {
                        lzm_chatServerEvaluation.userChats.setUserChat(group.members[i].i, {group_chat: false});
                    }
                }
            }
            pollType = 'dynamic-group-delete';
            break;
        case 'create-add':
            newGroupId = md5('' + Math.random());
            newGroup = {i: newGroupId, id: newGroupId, is_active: true, logo: 'img/lz_group.png', members: [{i: lzm_chatServerEvaluation.myId}],
                n: groupName, name: groupName, o: lzm_chatServerEvaluation.myId, pm: [], sig: [], humanReadableDescription: {},
                status_logo: 'img/lz_group.png'};
            lzm_chatServerEvaluation.groups.setGroup(newGroup);
            dynamicGroupObject.myUserId = lzm_chatServerEvaluation.myUserId;
            dynamicGroupObject.myId = lzm_chatServerEvaluation.myId;
            dynamicGroupObject.groupId = newGroupId;
            dynamicGroupObject.groupName = groupName;
            dynamicGroupObject.operatorUserId = memberUserId;
            dynamicGroupObject.operatorId = memberId;
            dynamicGroupObject.isPersistent = memberIsPersistent;
            dynamicGroupObject.browserId = memberBrowserId;
            dynamicGroupObject.chatId = memberChatId;
            if (memberId.indexOf('~') != -1 && lzm_chatServerEvaluation.userChats.getUserChat(memberId) != null) {
                lzm_chatServerEvaluation.userChats.setUserChat(memberId, {group_chat: true});
                chatInternalWith(newGroupId, newGroupId, groupName);
            }
            pollType = 'dynamic-group-create-add';
            break;
        case 'add':
            dynamicGroupObject.groupId = groupId;
            dynamicGroupObject.operatorUserId = memberUserId;
            dynamicGroupObject.browserId = memberBrowserId;
            dynamicGroupObject.chatId = memberChatId;
            dynamicGroupObject.operatorId = memberId;
            dynamicGroupObject.isPersistent = memberIsPersistent;
            if (memberId.indexOf('~') != -1 && lzm_chatServerEvaluation.userChats.getUserChat(memberId) != null) {
                lzm_chatServerEvaluation.userChats.setUserChat(memberId, {group_chat: true});
                chatInternalWith(groupId, groupId, groupName);
            }
            pollType = 'dynamic-group-add';
            break;
        case 'remove':
            dynamicGroupObject.groupId = groupId;
            dynamicGroupObject.operatorUserId = memberUserId;
            dynamicGroupObject.operatorId = memberId;
            if (group != null && typeof group.members != 'undefined') {
                for (i=0; i<group.members.length; i++) {
                    if (group.members[i].i.indexOf('~') != -1 && group.members[i].i == memberId &&
                        lzm_chatServerEvaluation.userChats.getUserChat(group.members[i].i) != null) {
                        lzm_chatServerEvaluation.userChats.setUserChat(group.members[i].i, {group_chat: false});
                    }
                }
            }
            pollType = 'dynamic-group-remove';
            break;
    }
    lzm_chatPollServer.pollServerSpecial(dynamicGroupObject, pollType);
    lzm_chatDisplay.createOperatorList();
};

/**************************************** Visitor and Visitor chat functions ****************************************/
ChatUserActionsClass.prototype.inviteExternalUser = function (id, b_id, text) {
    lzm_chatPollServer.stopPolling();

    lzm_chatPollServer.addToOutboundQueue('p_requests_va', id, 'nonumber');
    lzm_chatPollServer.addToOutboundQueue('p_requests_vb', b_id, 'nonumber');
    lzm_chatPollServer.addToOutboundQueue('p_requests_vc', lzm_chatServerEvaluation.myName, 'nonumber');
    lzm_chatPollServer.addToOutboundQueue('p_requests_vd', lzm_chatServerEvaluation.myUserId, 'nonumber');
    lzm_chatPollServer.addToOutboundQueue('p_requests_ve', lz_global_base64_encode(text), 'nonumber');
    lzm_chatPollServer.addToOutboundQueue('p_requests_vf', lzm_chatServerEvaluation.myGroup, 'nonumber');

    lzm_chatPollServer.pollServer(lzm_chatPollServer.fillDataObject(), 'shout');

    lzm_chatServerEvaluation.visitors.setVisitorValue(id, 'invitation', {tbid: b_id, status: 'requested', req: lzm_chatServerEvaluation.myId, logo: 'img/632-skills.png'});
    lzm_chatServerEvaluation.visitors.setVisitorValue(id, 'tbid', b_id);
    lzm_chatServerEvaluation.visitors.setVisitorValue(id, 'req', lzm_chatServerEvaluation.myId);

    lzm_chatDisplay.visitorDisplay.updateVisitorList();
};

ChatUserActionsClass.prototype.cancelInvitation = function(id) {
    this.lzm_chatPollServer.stopPolling();

    this.lzm_chatPollServer.addToOutboundQueue('p_cncl_inv', id, 'nonumber');
    this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');
};

ChatUserActionsClass.prototype.getChatPM = function(visitorId, browserId, pmId, language, groupId, userId) {
    var groupIdWasGiven = (typeof groupId != 'undefined' && groupId != '') ? true : false;
    var userIdWasGiven = (typeof userId != 'undefined' && userId != '') ? true : false;
    var i, j;
    var chatGroup = '', visitorName = '', visitorEmail = '', visitorCompany = '', visitorPhone = '';
    var visitorIp = '', visitorQuestion = '', visitorChatId = '', visitorUrl = '', visitorPageTitle = '';
    var visitorSearchString = '';
    var pm = {}, fallbackPm = {}, fallbackPm2 = {}, userPm = {}, userFallbackPm = {}, userFallbackPm2 = {}, pm2 = {}, userPm2 = {}, pm3 = {}, userPm3 = {};
    var chatLang = lzm_chatServerEvaluation.defaultLanguage.toUpperCase();
    var chatLangShort = chatLang.substr(0,2);
    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(visitorId);
    if (visitor != null) {
        for (j=0; j<visitor.b.length; j++) {
            if (browserId == visitor.b[j].id) {
                if (typeof visitor.b[j].chat != 'undefined' &&
                    typeof visitor.b[j].chat.gr != 'undefined') {
                    chatGroup = visitor.b[j].chat.gr;
                }
                if (typeof visitor.b[j].cname != 'undefined') {
                    visitorName = lzm_commonTools.htmlEntities(visitor.b[j].cname);
                }
                if (typeof visitor.b[j].cemail != 'undefined') {
                    visitorEmail = lzm_commonTools.htmlEntities(visitor.b[j].cemail);
                }
                if (typeof visitor.b[j].ccompany != 'undefined') {
                    visitorCompany = lzm_commonTools.htmlEntities(visitor.b[j].ccompany);
                }
                if (typeof visitor.b[j].cphone != 'undefined') {
                    visitorPhone = lzm_commonTools.htmlEntities(visitor.b[j].cphone);
                }
                if (typeof visitor.b[j].chat.eq != 'undefined') {
                    visitorQuestion = lzm_commonTools.htmlEntities(visitor.b[j].chat.eq);
                }
                if (visitor.b[j].chat.id != '') {
                    visitorChatId = visitor.b[j].chat.id;
                }
                break;
            }
        }
        try {
            for (j=0; j<visitor.b.length; j++) {
                if (browserId.indexOf('_OVL') == -1) {
                    var hLast = visitor.b[j].h2.length - 1;
                    if (typeof visitor.b[j].h2[hLast].url != 'undefined') {
                        visitorUrl = visitor.b[j].h2[hLast].url;
                    }
                    if (typeof visitor.b[j].h2[hLast].title != 'undefined') {
                        visitorPageTitle = visitor.b[j].h2[hLast].title;
                    }
                    if (typeof visitor.b[j].ss != 'undefined') {
                        visitorSearchString = visitor.b[j].ss;
                    }
                    break;
                }
            }
        } catch(ex) {}
        if (typeof visitor.lang != 'undefined' &&
            visitor.lang != '') {
            chatLang = visitor.lang;
        }
        if (typeof visitor.ip != 'undefined') {
            visitorIp = visitor.ip;
        }
    }

    var pmLanguages = this.getPmLanguages(chatGroup);
    var globalDefaultLanguage = pmLanguages['default'][1];
    if (typeof language != 'undefined' && language != '') {
        chatLang = language;
        chatLangShort = language.substr(0,2);
    }
    if (!groupIdWasGiven) {
        userId = (typeof userId != 'undefined') ? userId : lzm_chatServerEvaluation.myId;
        var operator = lzm_chatServerEvaluation.operators.getOperator(userId);
        if (operator != null && typeof operator.pm != 'undefined' && operator.pm.length > 0) {
            for (j=0; j<operator.pm.length; j++) {
                if (chatLang == operator.pm[j].lang) {
                    userPm = this.lzm_commonTools.clone(operator.pm[j]);
                }
                if (chatLangShort == operator.pm[j].lang) {
                    userPm2 = this.lzm_commonTools.clone(operator.pm[j]);
                }
                if (chatLangShort == operator.pm[j].shortlang) {
                    userPm3 = this.lzm_commonTools.clone(operator.pm[j]);
                }
                if (globalDefaultLanguage == operator.pm[j].lang) {
                    userFallbackPm = this.lzm_commonTools.clone(operator.pm[j]);
                }
                if (globalDefaultLanguage == operator.pm[j].shortlang) {
                    userFallbackPm2 = this.lzm_commonTools.clone(operator.pm[j]);
                }
            }
        }
    }
    if (!userIdWasGiven) {
        groupId = (typeof groupId != 'undefined' && groupId != '') ? groupId : chatGroup;
        var group = lzm_chatServerEvaluation.groups.getGroup(groupId);
        if (group != null) {
            for (j=0; j<group.pm.length; j++) {
                if (chatLang == group.pm[j].lang) {
                    pm = lzm_commonTools.clone(group.pm[j]);
                }
                if (chatLangShort == group.pm[j].lang) {
                    pm2 = lzm_commonTools.clone(group.pm[j]);
                }
                if (chatLangShort == group.pm[j].shortlang) {
                    pm3 = lzm_commonTools.clone(group.pm[j]);
                }
                if (globalDefaultLanguage == group.pm[j].lang) {
                    fallbackPm = lzm_commonTools.clone(group.pm[j]);
                }
                if (globalDefaultLanguage == group.pm[j].shortlang) {
                    fallbackPm2 = lzm_commonTools.clone(group.pm[j]);
                }
            }
        }
    }

    fallbackPm = (typeof userFallbackPm[pmId] != 'undefined' && userFallbackPm[pmId] != '') ? userFallbackPm : fallbackPm;
    fallbackPm2 = (typeof userFallbackPm2[pmId] != 'undefined' && userFallbackPm2[pmId] != '') ? userFallbackPm2 : fallbackPm2;
    fallbackPm = (typeof userFallbackPm[pmId] != 'undefined' && userFallbackPm[pmId] != '') ? fallbackPm : fallbackPm2;
    pm = (typeof pm[pmId] != 'undefined' && pm[pmId] != '') ? pm : (typeof pm2[pmId] != 'undefined' && pm2[pmId] != '') ? pm2 : pm3;
    userPm = (typeof userPm[pmId] != 'undefined' && userPm[pmId] != '') ? userPm : (typeof userPm2[pmId] != 'undefined' && userPm2[pmId] != '') ? userPm2 : userPm3;
    pm = (typeof userPm[pmId] != 'undefined' && userPm[pmId] != '') ? userPm : pm;
    pm = (typeof pm[pmId] != 'undefined' && pm[pmId] != '') ? pm : fallbackPm;


    var nameParts = visitorName.split(' ');
    var visitorFirstName = (nameParts.length > 0) ? nameParts.shift() : '';
    var visitorLastName = (nameParts.length > 0) ? nameParts.join(' ') : '';
    var visitorNameWithBlank = (visitorName != '') ? ' ' + visitorName : '';
    if (typeof pm[pmId] != 'undefined') {
        pm[pmId] = pm[pmId].replace(/ %external_name%/, visitorNameWithBlank)
            .replace(/%external_name%/, visitorName)
            .replace(/%external_firstname%/, visitorFirstName)
            .replace(/%external_lastname%/, visitorLastName)
            .replace(/%question%/, visitorQuestion)
            .replace(/%external_ip%/, visitorIp)
            .replace(/%chat_id%/, visitorChatId)
            .replace(/%searchstring%/, visitorSearchString)
            .replace(/%url%/, visitorUrl)
            .replace(/%page_title%/, visitorPageTitle)
            .replace(/%external_email%/, visitorEmail)
            .replace(/%external_phone%/, visitorPhone)
            .replace(/%external_company%/, visitorCompany)
            .replace(/%name%/, this.lzm_chatServerEvaluation.myName)
            .replace(/%operator_name%/, this.lzm_chatServerEvaluation.myName);
    } else {
        pm[pmId] = '';
    }
    return pm;
};

ChatUserActionsClass.prototype.getPmLanguages = function(groupId) {
    var pmLanguages = {group: [], user:[], all: [], default: []};
    var i, j;
    var group = (groupId != '') ? lzm_chatServerEvaluation.groups.getGroup(groupId) : lzm_chatServerEvaluation.groups.getGroupList()[0];
    if (group != null) {
        for (j=0; j<group.pm.length; j++) {
            pmLanguages.group.push(group.pm[j].lang);
            pmLanguages.all.push(group.pm[j].lang);
            if (group.pm[j].def == '1') {
                pmLanguages.default = ['group', group.pm[j].lang];
            }
        }
    }
    var operator = lzm_chatServerEvaluation.operators.getOperator(lzm_chatServerEvaluation.myId);
    if (operator != null) {
        try {
            for (j=0; j<operator.pm.length; j++) {
                if ($.inArray(operator.pm[j].lang, pmLanguages) == -1) {
                    pmLanguages.user.push(operator.pm[j].lang);
                    pmLanguages.all.push(operator.pm[j].lang);
                    if (operator.pm[j].def == '1') {
                        pmLanguages.default = ['user', operator.pm[j].lang];
                    }
                }
            }
        } catch(ex) {}
    }
    return pmLanguages;
};

ChatUserActionsClass.prototype.saveChatInput = function(active_chat_reco, text) {
    if (typeof active_chat_reco != 'undefined' && active_chat_reco != '') {
        var chatInput = '';
        if (typeof text != 'undefined' && text != '' && text != null) {
            chatInput = text;
        } else if (typeof text != 'undefined' && text == null) {
            chatInput = null;
        } else {
            var tmpInput = grabEditorContents();
            chatInput = tmpInput.replace(/^ */,'').replace(/ *$/,'');
        }
        if (chatInput == null) {
            this.ChatInputValues[active_chat_reco] = '';
        } else if (chatInput != '') {
            this.ChatInputValues[active_chat_reco] = chatInput;
        }
    }
};

ChatUserActionsClass.prototype.loadChatInput = function(active_chat_reco) {
    var rtValue = '';
    if (typeof active_chat_reco != 'undefined' && active_chat_reco != '' && typeof this.ChatInputValues[active_chat_reco] != 'undefined') {
        rtValue = this.ChatInputValues[active_chat_reco];
    }
    return rtValue;
};

ChatUserActionsClass.prototype.deleteChatInput = function(active_chat_reco) {
    if (typeof active_chat_reco != 'undefined' && active_chat_reco != '' && typeof this.ChatInputValues[active_chat_reco] != 'undefined') {
        delete this.ChatInputValues[active_chat_reco];
    }
};

ChatUserActionsClass.prototype.viewUserData = function (id, b_id, chat_id, freeToChat, newlyAcceptedChat) {
    var thisClass = this;
    thisClass.open_chats = thisClass.lzm_chatDisplay.openChats;
    thisClass.saveChatInput(thisClass.active_chat_reco);

    freeToChat = (typeof freeToChat == 'undefined' && freeToChat != false) ? true : false;
    newlyAcceptedChat = (typeof newlyAcceptedChat != 'undefined') ? newlyAcceptedChat : false;

    var thisUser = { id:'', b_id:'', b_chat:{ id:'' } };
    var active_chat = '';
    var active_chat_reco = '';
    var active_chat_realname = '';
    var visitorLangString = '';
    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(id);
    if (visitor != null) {
        thisUser = visitor;
        active_chat = visitor.id;
        visitorLangString = visitor.lang;
        if (visitor.b_id != b_id) {
            for (var j=0; j<visitor.b.length; j++) {
                if (visitor.b[j].id == b_id) {
                    thisUser.b_id = visitor.b[j].id;
                    thisUser.b_chat = visitor.b[j].chat;
                    active_chat_reco = visitor.id + '~' + visitor.b[j].id;
                    if (typeof visitor.b[j].cname != 'undefined' && visitor.b[j].cname != '') {
                        active_chat_realname = visitor.b[j].cname;
                    } else if (typeof visitor.unique_name != 'undefined') {
                        active_chat_realname = visitor.unique_name;
                    } else {
                        active_chat_realname = visitor.id;
                    }
                    break;
                }
            }
        } else {
            active_chat_reco = id + '~' + b_id;
            active_chat_realname = (typeof thisUser.name != 'undefined' && thisUser.name != '') ? thisUser.name :
                (typeof thisUser.unique_name != 'undefined') ? thisUser.unique_name : thisUser.id;
        }
    }
    thisClass.lzm_chatDisplay.selected_view = 'mychats';

    if (chat_id == 0) {
        chat_id = thisUser.b_chat.id;
    }
    thisClass.setActiveChat(active_chat, active_chat_reco, active_chat_realname, thisUser);

    thisClass.lzm_chatDisplay.toggleVisibility();
    thisClass.lzm_chatDisplay.createViewSelectPanel(thisClass.lzm_chatDisplay.firstVisibleView);

    if ($.inArray(id + '~' + b_id, thisClass.open_chats) != -1 &&
        (lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id) == null ||
            !lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).group_chat)) {
        thisClass.lzm_chatDisplay.showActiveVisitorChat(thisUser);
        var loadedValue = thisClass.loadChatInput(thisClass.active_chat_reco);
        initEditor(loadedValue, 'viewUserData');
        if (newlyAcceptedChat) {
            setFocusToEditor();
        }
        thisClass.chatExternalWith(id, b_id, chat_id, 0);
        thisClass.lzm_chatDisplay.removeSoundPlayed(id + '~' + b_id);
    } else {
        removeEditor();
        thisClass.lzm_chatDisplay.showPassiveVisitorChat(thisUser, id, b_id);
        thisClass.lzm_chatDisplay.showPassiveVisitorChat(thisUser, id, b_id);
        thisClass.lzm_chatDisplay.createChatHtml(thisUser, active_chat_reco);

        $('#accept-chat').click(function () {
            thisClass.acceptChat(id, b_id, chat_id, active_chat_reco, visitorLangString);
            thisClass.viewUserData(id, b_id, chat_id, freeToChat, true);
            var vb = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id);
            if (vb[1] != null && vb[1].chat.id != '' && vb[1].chat.cmb == 1 && vb[1].cphone != '' && $.inArray(id + '~' + b_id, thisClass.chatCallBackList) == -1) {
                showPhoneCallDialog(id + '~' + b_id, -1, 'chat');
            }
        });
        $('#decline-chat').click(function () {
            if (lzm_commonPermissions.checkUserPermissions('', 'chats', 'decline', {})) {
                thisClass.refuseExternalChat(id, b_id, chat_id, 0);
                thisClass.lzm_chatDisplay.removeSoundPlayed(id + '~' + b_id);
                thisClass.viewUserData(id, b_id, chat_id, freeToChat);
            } else {
                showNoPermissionMessage();
            }
        });
        $('#forward-chat').click(function () {
            if (lzm_commonPermissions.checkUserPermissions('', 'chats', 'forward', {})) {
                var storedForwardId = '';
                for (var key in thisClass.lzm_chatDisplay.StoredDialogs) {
                    if (thisClass.lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                        if (thisClass.lzm_chatDisplay.StoredDialogs[key].type == 'operator-invitation' &&
                            typeof thisClass.lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] != 'undefined' &&
                            thisClass.lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] == id + '~' + b_id) {
                            storedForwardId = key;
                        }
                    }
                }
                if (storedForwardId != '') {
                    lzm_displayHelper.maximizeDialogWindow(storedForwardId);
                } else {
                    thisClass.lzm_chatDisplay.createOperatorInviteHtml('forward', lzm_chatPollServer.thisUser, id, b_id, chat_id);
                }
            } else {
                showNoPermissionMessage();
            }
        });
    }
    thisClass.lzm_chatDisplay.createChatWindowLayout(true);
};

ChatUserActionsClass.prototype.acceptChat = function(id, b_id, chat_id, active_chat_reco, visitorLangString, showSalutation) {
    showSalutation = (typeof showSalutation != 'undefined') ? showSalutation : true;
    var thisClass = this;
    if ($.inArray(id + '~' + b_id, thisClass.open_chats) == -1) {
        var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id);
        var isNewChat = (visitorBrowser[1] != null && visitorBrowser[1].chat.id != '' && visitorBrowser[1].chat.pn.acc == 1) ? false : true;
        thisClass.acceptedChatCounter += 1;
        var new_chat = {};
        new_chat.id = md5(String(Math.random())).substr(0, 32);
        new_chat.rp = '';
        new_chat.sen = '0000000';
        new_chat.rec = '';
        new_chat.reco = active_chat_reco;
        var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
        new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
        new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
        lzm_chatServerEvaluation.chatMessageCounter++;
        new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', thisClass.userLanguage);
        new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', thisClass.userLanguage);
        new_chat.text = '';
        if (isNewChat) {
            new_chat.text = t('<!--this_op_name--> has accepted the chat.',
                [['<!--this_op_name-->',thisClass.lzm_chatServerEvaluation.myName]]);
        } else {
            var oldMembers = visitorBrowser[1].chat.pn.oldMemberIdList;
            if (typeof oldMembers == "object" && oldMembers instanceof Array && oldMembers.length > 0) {
                var oldMemberString = '';
                for (var j=0; j<oldMembers.length; j++) {
                    var op2 = lzm_chatServerEvaluation.operators.getOperator(oldMembers[j]);
                    if (op2 != null)
                        oldMemberString += op2.name + ', ';
                }
                oldMemberString += (visitorBrowser[0].name != '-') ? visitorBrowser[0].name : visitorBrowser[0].unique_name;
                new_chat.text = t('<!--this_op_name--> has joined the chat with <!--existing_chat_partners-->.',
                    [['<!--this_op_name-->', lzm_chatDisplay.myName], ['<!--existing_chat_partners-->', oldMemberString]]);
            }
        }

        if (new_chat.text != '') {
            lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
        }

        thisClass.lzm_chatPollServer.stopPolling();

        thisClass.lzm_chatPollServer.addToOutboundQueue('p_ca_0_va', id, 'nonumber');
        thisClass.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vb', b_id, 'nonumber');
        thisClass.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vc', chat_id, 'nonumber');
        thisClass.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vd', 'AcceptChat', 'nonumber');

        thisClass.lzm_chatPollServer.pollServer(thisClass.lzm_chatPollServer.fillDataObject(), 'shout');

        thisClass.open_chats.push(id + '~' + b_id);
        thisClass.lzm_chatDisplay.openChats = thisClass.open_chats;
        var pm = null, pmId = 'wel';
        try {
            if (visitorBrowser[1] != null && visitorBrowser[1].chat.id != '' && visitorBrowser[1].chat.cmb == 1 && visitorBrowser[1].cphone != '') {
                pmId = 'welcmb';
            } else {
                pmId = 'wel';
            }
        } catch(ex) {}
        try {
            pm = thisClass.getChatPM(id, b_id, pmId, visitorLangString);
        } catch(ex) {}
        if (pm != null && typeof pm.aw != 'undefined' && pm.aw == 1 && showSalutation) {
            var pmMessage = pm[pmId];
            if (typeof pm.edit != 'undefined' && pm.edit == 0) {
                setTimeout(function() {sendTranslatedChat(pmMessage);}, 1000);
            } else {
                thisClass.ChatInputValues[id + '~' + b_id] = pmMessage;
            }
        }

        var tmpArray = [];
        for (var i=0; i<lzm_chatDisplay.ringSenderList.length; i++) {
            if (lzm_chatDisplay.ringSenderList[i] != id + '~' + b_id) {
                tmpArray.push(lzm_chatDisplay.ringSenderList[i]);
            }
        }
        lzm_chatDisplay.ringSenderList = tmpArray;
    }
};

ChatUserActionsClass.prototype.chatExternalWith = function (id, b_id, chat_id, chat_no) {
    var thisClass = this;
    thisClass.removeForwardFromList(id, b_id);

    if (lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatServerEvaluation.active_chat_reco).status == 'new') {
        lzm_chatServerEvaluation.userChats.setUserChat(lzm_chatServerEvaluation.active_chat_reco, {status: 'read'});
    }
    $('#chat-action').css('display', 'block');
    $('#chat-progress').css('display', 'block');
    $('#chat-qrd-preview').css('display', 'block');
    thisClass.lzm_chatDisplay.createChatHtml(lzm_chatPollServer.thisUser, lzm_chatServerEvaluation.active_chat_reco);
    thisClass.lzm_chatDisplay.createActiveChatPanel(false, true);

    var thisInviteOperator = $('#invite-operator');
    var thisForwardChat = $('#forward-chat');

    thisInviteOperator.click(function () {
        thisClass.lzm_chatDisplay.createOperatorInviteHtml('invite', lzm_chatPollServer.thisUser, id, b_id, chat_id);
    });

    thisForwardChat.click(function () {
        if (lzm_commonPermissions.checkUserPermissions('', 'chats', 'forward', {})) {
            var storedForwardId = '';
            for (var key in thisClass.lzm_chatDisplay.StoredDialogs) {
                if (thisClass.lzm_chatDisplay.StoredDialogs.hasOwnProperty(key)) {
                    if (thisClass.lzm_chatDisplay.StoredDialogs[key].type == 'operator-invitation' &&
                        typeof thisClass.lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] != 'undefined' &&
                        thisClass.lzm_chatDisplay.StoredDialogs[key].data['visitor-id'] == id + '~' + b_id) {
                        storedForwardId = key;
                    }
                }
            }
            if (storedForwardId != '') {
                lzm_displayHelper.maximizeDialogWindow(storedForwardId);
            } else {
                thisClass.lzm_chatDisplay.createOperatorInviteHtml('forward', lzm_chatPollServer.thisUser, id, b_id, chat_id);
            }
        } else {
            showNoPermissionMessage();
        }
    });

    $('#add-visitor-to-dynamic-group').click(function () {
        if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', {o: lzm_chatDisplay.myId})) {
            addToDynamicGroup(id, b_id, chat_id);
        } else {
            showNoPermissionMessage();
        }
    });

    $('#send-qrd').click(function() {
        showQrd(id + '~' + b_id, 'chat');
    });
};

ChatUserActionsClass.prototype.refuseExternalChat = function (id, b_id, chat_id, chat_no) {
    this.removeForwardFromList(id, b_id);

    lzm_chatServerEvaluation.userChats.setUserChat(this.active_chat_reco, {status: 'declined'});

    this.lzm_chatPollServer.stopPolling();

    this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_va', id, 'nonumber');
    this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vb', b_id, 'nonumber');
    this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vc', chat_id, 'nonumber');
    this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vd', 'DeclineChat', 'nonumber');

    this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');

    this.lzm_chatDisplay.showRefusedChat(lzm_chatPollServer.thisUser);
};

ChatUserActionsClass.prototype.leaveExternalChat = function (id, b_id, chat_id, chat_no, closeOrLeave) {
    this.deleteChatInput(id * '~' + b_id);

    this.removeForwardFromList(id, b_id);
    if ($.inArray(id + '~' + b_id, this.lzm_chatDisplay.openChats) != -1 && lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).status != 'left') {
        if (lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).my_chat) {
            if (closeOrLeave == 'close') {
                lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'left'});
            } else {
                lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat: false, my_chat_old: false});
            }
            this.lzm_chatPollServer.stopPolling();
            this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_va', id, 'nonumber');
            this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vb', b_id, 'nonumber');
            this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vc', chat_id, 'nonumber');
            if (closeOrLeave == 'close') {
                this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vd', 'CloseChat', 'nonumber');
            } else {
                this.lzm_chatPollServer.addToOutboundQueue('p_ca_0_vd', 'LeaveChat', 'nonumber');
                lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat: false});
            }
            this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');
        } else {
            lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat_old: false});
        }
    } else {
        try {
            if (lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id).my_chat) {
                if (closeOrLeave == 'close') {
                    lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {status: 'left'});
                } else {
                    lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat: false, my_chat_old: false});
                }
            } else {
                lzm_chatServerEvaluation.userChats.setUserChat(id + '~' + b_id, {my_chat_old: false});
            }
        } catch(ex) {}
    }

    var new_chat = {};
    new_chat.id = md5(String(Math.random())).substr(0, 32);
    new_chat.rp = '';
    new_chat.sen = '0000000';
    new_chat.rec = '';
    new_chat.reco = this.lzm_chatServerEvaluation.active_chat_reco;
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
    new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
    lzm_chatServerEvaluation.chatMessageCounter++;
    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', this.userLanguage);
    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', this.userLanguage);
    new_chat.text = t('<!--this_op_name--> has left the chat.',
        [['<!--this_op_name-->',this.lzm_chatServerEvaluation.myName]]);

    lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);
    clearEditorContents();
    var tmp_openchats = [];
    for (var i = 0; i < this.open_chats.length; i++) {
        if (this.open_chats[i] != id + '~' + b_id) {
            tmp_openchats.push(this.open_chats[i]);
        }
    }
    this.open_chats = tmp_openchats;
    this.lzm_chatDisplay.openChats = this.open_chats;

    this.setActiveChat('', '', '', { id:'', b_id:'', b_chat:{ id:'' } });

    this.lzm_chatDisplay.showLeaveChat(lzm_chatPollServer.thisUser);
};

ChatUserActionsClass.prototype.forwardChat = function (thisUser, type) {
    thisUser = (typeof thisUser != 'undefined' && thisUser != null) ? thisUser : lzm_chatPollServer.thisUser;
    type = (typeof type != 'undefined') ? type : 'forward';
    if (typeof this.forwardData.id != 'undefined') {
        this.deleteChatInput(this.active_chat_reco);
        this.removeForwardFromList(this.forwardData.id, this.forwardData.b_id);
        this.lzm_chatDisplay.createOperatorInviteHtml(type, thisUser);
        this.lzm_chatPollServer.stopPolling();

        var pForwardsVObject = {
            a_: this.forwardData.chat_id,
            b_: this.forwardData.forward_id,
            c_: this.forwardData.forward_text,
            d_: this.lzm_chatServerEvaluation.myId,
            e_: this.forwardData.forward_group,
            f_: this.forwardData.id,
            g_: this.forwardData.b_id,
            h_: (type == 'forward') ? 0 : 1
        };
        this.lzm_chatPollServer.addToOutboundQueue('p_forwards_v', pForwardsVObject);

        this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');

        if (type == 'forward') {
            var extUserName = '';
            var visitor = lzm_chatServerEvaluation.visitors.getVisitor(this.forwardData.id);
            if (visitor != null) {
                for (var browserIndex=0; browserIndex<visitor.b.length; browserIndex++) {
                    if (visitor.b[browserIndex].id == this.forwardData.b_id) {
                        extUserName = (visitor.b[browserIndex].cname != '') ? visitor.b[browserIndex].cname : visitor.unique_name;
                    }
                }
            }
            extUserName = lzm_commonTools.htmlEntities(extUserName);
            var new_chat = {};
            new_chat.id = md5(String(Math.random())).substr(0, 32);
            new_chat.rp = '';
            new_chat.sen = '0000000';
            new_chat.rec = '';
            new_chat.reco = this.lzm_chatServerEvaluation.active_chat_reco;
            var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
            new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
            new_chat.cmc = lzm_chatServerEvaluation.chatMessageCounter;
            lzm_chatServerEvaluation.chatMessageCounter++;
            new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', this.userLanguage);
            new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', this.userLanguage);
            new_chat.text = t('Forwarding <!--visitor_name--> to <!--op_name--> ... (this may take a second)',
                [['<!--visitor_name-->','<b>'+extUserName+'</b>'],['<!--op_name-->','<b>'+this.forwardData.forward_name+'</b>']]);
            lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);

            var tmp_openchats = [];
            for (var i = 0; i < this.open_chats.length; i++) {
                if (this.open_chats[i] != this.forwardData.id + '~' + this.forwardData.b_id) {
                    tmp_openchats.push(this.open_chats[i]);
                }
            }
            this.open_chats = tmp_openchats;
            this.lzm_chatDisplay.openChats = this.open_chats;
        }
    }
};

ChatUserActionsClass.prototype.selectOperatorForForwarding = function (id, b_id, chat_id, forward_id, forward_name, forward_group, forward_text, chat_no) {
    this.forwardData = {id:id, b_id:b_id, chat_id:chat_id, forward_id:forward_id, forward_name:forward_name,
        forward_group:forward_group, forward_text:forward_text, chat_no:chat_no};
};

ChatUserActionsClass.prototype.handleUploadRequest = function(fuprId, fuprName, id, b_id, type, chatId) {
    if (fuprName.indexOf('<') != -1 || fuprName.indexOf('>') != -1 || fuprName.indexOf('"') != -1) {
        fuprName = this.lzm_commonTools.htmlEntities(fuprName);
    }
    var numericType = 0;
    if (type == 'allow') {
        numericType = 2;
    } else if (type == 'deny') {
        numericType = 0;
    }
    this.lzm_chatPollServer.stopPolling();
    this.lzm_chatPollServer.addToOutboundQueue('p_permissions_va', fuprId, 'nonumber');
    this.lzm_chatPollServer.addToOutboundQueue('p_permissions_vb', numericType, 'nonumber');
    this.lzm_chatPollServer.addToOutboundQueue('p_permissions_vc', chatId, 'nonumber');

    var date = lzm_chatTimeStamp.getServerTimeString(null, true);
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject(date, true);
    var new_chat = {id: md5(String(Math.random())).substr(0, 32),
        date: date,
        cmc: lzm_chatServerEvaluation.chatMessageCounter,
        date_human: this.lzm_commonTools.getHumanDate(tmpdate, 'date', this.userLanguage),
        time_human: this.lzm_commonTools.getHumanDate(tmpdate, 'time', this.userLanguage),
        rec: '', rp: '', sen: '0000000',
        text: t('The visitor was allowed to upload <!--file_name--> to the server.',
            [['<!--file_name-->','<b>' + fuprName + '</b>']]) + ' ' +
            t('As soon as the file has been uploaded to the server you will get the possibility to download the file.'),
        reco: id + '~' + b_id
    };
    lzm_chatServerEvaluation.chatMessageCounter++;
    lzm_chatServerEvaluation.userChats.setUserChatMessage(new_chat);

    lzm_chatServerEvaluation.userChats.setUserChat(this.active_chat_reco, {fuprDone: fuprId});
    this.lzm_chatPollServer.pollServer(this.lzm_chatPollServer.fillDataObject(), 'shout');
};

ChatUserActionsClass.prototype.saveVisitorComment = function(visitorId, commentText) {
    commentText = commentText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n');
    lzm_chatPollServer.pollServerSpecial({id: visitorId, t: commentText}, 'visitor-comment');
};

/**************************************** Resource functions ****************************************/
ChatUserActionsClass.prototype.editQrd = function(myResource, ticketId, inDialog) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    var thisClass = this;
    var resource = {};
    if (typeof myResource != 'undefined' && myResource != false) {
        resource = myResource
    } else {
        resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    }
    if (resource != null) {
        var newRid = resource.rid;
        var newPid = resource.pid;
        var newRank = resource.ra;
        newType = resource.ty;
        var newTitle, newType, newText, newSize, newTags;

        thisClass.lzm_chatDisplay.resourcesDisplay.editQrd(resource, ticketId, inDialog);

        var editResource = $('.qrd-edit-resource');
        var editHtmlResource = $('.qrd-edit-html-resource');
        var editLinkResource = $('.qrd-edit-link-resource');
        var editFolderResource = $('.qrd-edit-folder-resource');
        switch(parseInt(newType)) {
            case 0: // Folder
                editResource.css('display', 'none');
                editFolderResource.css('display', 'block');
                break;
            case 1: // HTML resource
                if(!this.isApp && !this.isMobile) {
                    editResource.css('display', 'none');
                    editHtmlResource.css('display', 'block');
                    qrdTextEditor = new ChatEditorClass('qrd-edit-text', isMobile, (app == 1), (web == 1));
                    qrdTextEditor.init(resource.text, 'editQrd');
                } else {
                    showNotMobileMessage();
                }
                break;
            case 2: // URL
                editResource.css('display', 'none');
                editLinkResource.css('display', 'block');
                break;
        }
        lzm_displayLayout.resizeEditResources();
    }

    $('#edited-qrd-settings').click(function() {
        var editorText = (newType == 1) ? qrdTextEditor.grabHtml() : '';
        showQrdSettings('', 'edit-resource', editorText);
    });

    $('#save-edited-qrd').click(function() {
        var editTitle = $('#qrd-edit-title').val();
        var editTags = $('#edit-resource').data('tags');//$('#qrd-edit-tags').val();
        newTitle = editTitle;
        switch (parseInt(newType)) {
            case 0:
                newText = editTitle;
                newTags = '';
                newSize = newTitle.length;
                break;
            case 1:
                if (!thisClass.isMobile && !thisClass.isApp) {
                    newText = qrdTextEditor.grabHtml();
                    delete qrdTextEditor;
                }
                newSize = newText.length + newTitle.length;
                newTags = editTags;
                break;
            case 2:
                newText = $('#qrd-edit-url-protocol').val() + $('#qrd-edit-url').val();
                newSize = newText.length + newTitle.length;
                newTags = editTags;
                break;
        }
        var isPublic = $('#edit-resource').data('is_public');
        var fullTextSearch = $('#edit-resource').data('full_text_search');
        var shortcutWord = $('#edit-resource').data('shorcut_word');
        var allowBotAccess = $('#edit-resource').data('allow_bot');
        var languages = $('#edit-resource').data('languages');

        if (inDialog) {
            lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
            var dialogContainerHtml = '<div id="qrd-tree-dialog-container" class="dialog-window-container"></div>';
            $('#chat_page').append(dialogContainerHtml).trigger('create');
            $('#qrd-tree-dialog-container').css(thisClass.lzm_chatDisplay.dialogWindowContainerCss);
            $('#qrd-tree-dialog-container').replaceWith(lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId]);
            delete lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId];
            cancelQrd(ticketId);
        } else {
            lzm_displayHelper.removeDialogWindow('qrd-edit');
        }
        thisClass.lzm_chatPollServer.pollServerResource({
            rid: newRid,
            pid: newPid,
            ra: newRank,
            ti: newTitle,
            ty: newType,
            text: newText,
            si: newSize,
            t: newTags,
            di: 0,
            isPublic: isPublic,
            fullTextSearch: fullTextSearch,
            shortcutWord: shortcutWord,
            allowBotAccess: allowBotAccess,
            languages: languages
        });
        $('#resource-' + newRid).find('span.qrd-title-span').html(newTitle);
    });

    $('#cancel-edited-qrd').click(function() {

        if (inDialog) {
            lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
            var dialogContainerHtml = '<div id="qrd-tree-dialog-container" class="dialog-window-container"></div>';
            $('#chat_page').append(dialogContainerHtml).trigger('create');
            $('#qrd-tree-dialog-container').css(lzm_chatDisplay.dialogWindowContainerCss);
            $('#qrd-tree-dialog-container').replaceWith(lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId]);
            delete lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId];
            cancelQrd(ticketId);
        } else {
            lzm_displayHelper.removeDialogWindow('qrd-edit');
        }
    });
};

ChatUserActionsClass.prototype.previewQrd = function (chatPartner, qrdId, inDialog, menuEntry) {
    var thisClass = this;
    qrdId = (typeof qrdId != 'undefined' && qrdId != '') ? qrdId : thisClass.lzm_chatDisplay.selectedResource;
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(qrdId);
    if (resource != null) {
        var thisChatPartner = lzm_displayHelper.getChatPartner(chatPartner);
        var chatPartnerName = thisChatPartner['name'];
        var chatPartnerUserid = thisChatPartner['userid'];
        //resource.text = thisClass.lzm_chatServerEvaluation.replaceLinks(resource.text);
        thisClass.lzm_chatDisplay.resourcesDisplay.previewQrd(resource, chatPartner, chatPartnerName, chatPartnerUserid, inDialog, menuEntry);
    }
};

ChatUserActionsClass.prototype.addQrd = function(ticketId, inDialog, toAttachment, sendToChat, menuEntry) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    toAttachment = (typeof toAttachment != 'undefined') ? toAttachment : false;
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;
    var resourceText = (ticketId != '') ? this.lzm_chatDisplay.ticketResourceText[ticketId] : '';

    var thisClass = this;
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    resource = (resource != null) ? resource : {rid: 100, ra: 0};
    var newRid = md5(Math.random().toString());
    var newPid = (sendToChat != null) ? '' : (resource.ty == 0) ? resource.rid : resource.pid;
    var newRank = (resource.ty == 0) ? parseInt(resource.ra) + 1 : parseInt(resource.ra);
    var newTitle, newType, newText, newSize, newTags;

    thisClass.lzm_chatDisplay.resourcesDisplay.addQrd(resource, ticketId, inDialog, toAttachment, sendToChat, menuEntry);

    var typeSelection = $('#qrd-add-type');
    var addResource = $('.qrd-add-resource');
    var addHtmlResource = $('.qrd-add-html-resource');
    var addLinkResource = $('.qrd-add-link-resource');
    var addFolderResource = $('.qrd-add-folder-resource');
    var addFileResource = $('.qrd-add-file-resource');
    var addTitle = $('#qrd-add-title');
    typeSelection.change(function() {
        switch (parseInt(typeSelection.val())) {
            case -1: // Nothing selected
                addResource.css('display', 'none');
                $('#save-new-qrd').addClass('ui-disabled');
                $('#new-qrd-settings').addClass('ui-disabled');
                break;
            case 0: // Folder
                addResource.css('display', 'none');
                addFolderResource.css('display', 'block');
                addTitle.val(t('New Folder'));
                $('#save-new-qrd').removeClass('ui-disabled');
                $('#new-qrd-settings').removeClass('ui-disabled');
                break;
            case 1: // HTML resource
                if(!thisClass.isApp && !thisClass.isMobile) {
                    addResource.css('display', 'none');
                    addHtmlResource.css('display', 'block');
                    addTitle.val(t('New Text'));
                    qrdTextEditor = new ChatEditorClass('qrd-add-text', thisClass.isMobile,thisClass.isApp, thisClass.isWeb);
                    qrdTextEditor.init('', 'addQrd');
                    $('#save-new-qrd').removeClass('ui-disabled');
                    $('#new-qrd-settings').removeClass('ui-disabled');
                } else {
                    showNotMobileMessage();
                }
                break;
            case 2: // URL
                addResource.css('display', 'none');
                addLinkResource.css('display', 'block');
                addTitle.val(t('New Link Resource'));
                $('#save-new-qrd').removeClass('ui-disabled');
                $('#new-qrd-settings').removeClass('ui-disabled');
                break;
            case 3: // File
                if(!thisClass.isApp && !thisClass.isMobile) {
                    addResource.css('display', 'none');
                    addFileResource.css('display', 'block');
                    addTitle.val(t('New File Resource'));
                    $('#save-new-qrd').removeClass('ui-disabled');
                    $('#new-qrd-settings').removeClass('ui-disabled');
                } else {
                    showNotMobileMessage();
                }
        }
        lzm_displayLayout.resizeAddResources();
    });
    if (typeof ticketId != 'undefined' && ticketId != '') {
        addResource.css('display', 'none');
        addHtmlResource.css('display', 'block');
        addTitle.val(t('New Text'));
        if(!this.isApp && !this.isMobile) {
            qrdTextEditor = new ChatEditorClass('qrd-add-text', this.isMobile,this.isApp, this.isWeb);
            qrdTextEditor.init(resourceText, 'addQrd');
        } else {
            $('#qrd-add-text').val(resourceText);
        }
    }
    if (toAttachment) {
        addResource.css('display', 'none');
        addFileResource.css('display', 'block');
        addTitle.val(t('New File Resource'));
    }

    $('#new-qrd-settings').click(function() {
        newType = typeSelection.val();
        var editorText = (newType == 1) ? qrdTextEditor.grabHtml() : '';
        var resourceId = (newType == 0) ? 'FOLDER' : 'TEXT_FILE_URL';
        showQrdSettings(resourceId, 'add-resource', editorText)
    });

    $('#save-new-qrd').click(function() {
        var addTitle = $('#qrd-add-title').val(), newUrl = '';
        var addTags = $('#add-resource').data('tags');//$('#qrd-add-tags').val();
        newTitle = addTitle;
        newType = typeSelection.val();
        if (newType != 3) {
            switch (parseInt(typeSelection.val())) {
                case 0:
                    newText = addTitle;
                    newTags = '';
                    newSize = newTitle.length;
                    break;
                case 1:
                    if (!thisClass.isMobile && !thisClass.isApp) {
                        newText = qrdTextEditor.grabHtml();
                        delete qrdTextEditor;
                    } else {
                        newText = $('#qrd-add-text').val();
                    }
                    newSize = newText.length + newTitle.length;
                    newTags = addTags;
                    break;
                case 2:
                    newUrl = $('#qrd-add-url').val();
                    newText = $('#qrd-add-url-protocol').val() + $('#qrd-add-url').val();
                    newSize = newText.length + newTitle.length;
                    newTags = addTags;
                    break;
            }
            var isPublic = $('#add-resource').data('is_public');
            var fullTextSearch = $('#add-resource').data('full_text_search');
            var shortcutWord = $('#add-resource').data('shorcut_word');
            var allowBotAccess = $('#add-resource').data('allow_bot');
            var languages = $('#add-resource').data('languages');
            if (inDialog) {
                lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
                var dialogContainerHtml = '<div id="qrd-tree-dialog-container" class="dialog-window-container"></div>';
                $('#chat_page').append(dialogContainerHtml).trigger('create');
                $('#qrd-tree-dialog-container').css(lzm_chatDisplay.dialogWindowContainerCss);
                $('#qrd-tree-dialog-container').replaceWith(lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId]);
                delete lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId];
                cancelQrd(ticketId);
                $('#ticket-reply-input-save').removeClass('ui-disabled');
                $('#ticket-reply-input-resource').val(newRid);
            } else {
                lzm_displayHelper.removeDialogWindow('qrd-add');
                var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
                if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                    var chatText = loadChatInput(lzm_chatDisplay.active_chat_reco);
                    initEditor(chatText, 'minimzeDialogWindow', lzm_chatDisplay.active_chat_reco);
                }
            }
            if (sendToChat == null) {
                thisClass.lzm_chatPollServer.pollServerResource({
                    rid: newRid,
                    pid: newPid,
                    ra: newRank,
                    ti: newTitle,
                    ty: newType,
                    text: newText,
                    si: newSize,
                    t: newTags,
                    di: 0,
                    isPublic: isPublic,
                    fullTextSearch: fullTextSearch,
                    shortcutWord: shortcutWord,
                    allowBotAccess: allowBotAccess,
                    languages: languages
                });
                var newResource = {di: 0, ed: lzm_chatTimeStamp.getServerTimeString(null, true), eid: lzm_chatServerEvaluation.myId,
                    md5: '', oid: lzm_chatServerEvaluation.myId, pid: newPid, ra: newRank, rid: newRid, si: newSize, t: newTags,
                    text: newText, ti: newTitle, ty: newType};
                lzm_chatServerEvaluation.cannedResources.setResource(newResource);
                var onclickAction = 'onclick="handleResourceClickEvents(\'' + newRid + '\')"';
                var onDoubleClickAction = '';
                var onConetxtMenuAction = ' oncontextmenu="openQrdContextMenu(event, \'\', \'' + newRid + '\'); return false;"';
                if (newType != 0) {
                    onDoubleClickAction = ' ondblclick="previewQrd(\'\', \'' + newRid + '\');"';
                }
                var newEntryHtml = '<div id="resource-' + newRid + '" class="resource-div" ' +
                    'style="padding-left: ' + (20 * newRank) + 'px; margin: 4px 0px;">';
                if (newType == 0) {
                    newEntryHtml += '<span id="resource-' + newRid + '-open-mark" style=\'display: inline-block; width: 7px; ' +
                        'height: 7px; border: 1px solid #aaa; background-color: #f1f1f1; ' +
                        lzm_displayHelper.addBrowserSpecificGradient('background-image: url("img/plus.png")') + '; ' +
                        'background-position: center; background-repeat: no-repeat; margin-right: 4px; cursor: pointer;\'';
                    newEntryHtml += onclickAction + onDoubleClickAction + onConetxtMenuAction;
                    newEntryHtml += '></span>';
                } else {
                    newEntryHtml += '<span style="display: inline-block; width: 9px; height: 9px; margin-right: 4px;"></span>';
                }
                newEntryHtml += '<span style=\'background-image: url("' + lzm_chatDisplay.resourcesDisplay.getResourceIcon(newType) + '"); ' +
                    'background-position: left center; background-repeat: no-repeat; padding: 2px;\'>' +
                    '<span class="qrd-title-span" style="padding-left: 20px; cursor: pointer;" ' + onclickAction + onDoubleClickAction + onConetxtMenuAction + '>' +
                    newTitle + '</span>' +
                    '</span></div>';
                if (newType == 0) {
                    newEntryHtml += '<div id="folder-' + newRid + '" style="display: none;"></div>';
                }
            } else {
                var userChat = lzm_chatServerEvaluation.userChats.getUserChat(sendToChat.chat_partner);
                if (userChat != null) {
                    try {
                        newTitle = (newTitle == '') ? newUrl : newTitle;
                        var chatMessage = (newText.indexOf('mailto:') == -1) ? '<a class=lz_chat_link href="' + newText + '" target=_blank>' + newTitle + '</a>&nbsp;' :
                            '<a class=lz_chat_mail href="' + newText + '" target=_blank>' + newTitle + '</a>&nbsp;';
                        if (newUrl != '') {
                            sendChat(chatMessage, sendToChat.chat_partner);
                        } else {
                            $('#cancel-new-qrd').click();
                        }
                    } catch(ex) {}
                }
            }
        } else {
            if (sendToChat == null) {
                uploadFile('user_file', newPid, newRank, toAttachment, null);
            } else {
                uploadFile('user_file', null, null, false, sendToChat);
            }
        }
        lzm_chatDisplay.resourcesDisplay.updateResources();
        handleResourceClickEvents(newPid, true);
    });

    $('#cancel-new-qrd').click(function() {
        if (inDialog) {
            if (toAttachment) {
                lzm_displayHelper.removeDialogWindow('ticket-details');
                lzm_displayHelper.maximizeDialogWindow(toAttachment);
            } else {
                lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
                var dialogContainerHtml = '<div id="qrd-tree-dialog-container" class="dialog-window-container"></div>';
                $('#chat_page').append(dialogContainerHtml).trigger('create');
                $('#qrd-tree-dialog-container').css(lzm_chatDisplay.dialogWindowContainerCss);
                $('#qrd-tree-dialog-container').replaceWith(lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId]);
                delete lzm_chatDisplay.resourcesDisplay.qrdTreeDialog[ticketId];
                cancelQrd(ticketId);
            }
        } else {
            lzm_displayHelper.removeDialogWindow('qrd-add');
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                var chatText = loadChatInput(lzm_chatDisplay.active_chat_reco);
                initEditor(chatText, 'minimzeDialogWindow', lzm_chatDisplay.active_chat_reco);
            }
        }
    });

};

ChatUserActionsClass.prototype.deleteQrd = function() {
    var resource = lzm_chatServerEvaluation.cannedResources.getResource(lzm_chatDisplay.selectedResource);
    if (resource != null) {
        resource.di = 1;
        this.lzm_chatPollServer.pollServerResource(resource);
        $('#resource-' + resource.rid).remove();
        if (resource.ty == 0) {
            $('#folder-' + resource.rid).remove();
        }
    }
};

/**************************************** Ticket functions ****************************************/
ChatUserActionsClass.prototype.deleteTicket = function(ticketId) {
    if (lzm_commonPermissions.checkUserPermissions('','tickets', 'delete_tickets', {})) {
        this.lzm_chatPollServer.pollServerTicket({id: ticketId}, [], 'delete-ticket');
        lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(ticketId, lzm_chatDisplay.ticketReadArray);
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
                lzm_chatDisplay.ticketListTickets[i].del = 1;
                break;
            }
        }
        $('#ticket-list-row-' + ticketId).remove();
    } else {
        showNoPermissionMessage();
    }
};

ChatUserActionsClass.prototype.saveTicketDetails = function(ticket, channel, status, group, editor, language, name,
                                        email, company, phone, message, attachments, comments, customFields, chat, mc) {
    editor = (editor != -1) ? editor : '';
    var id = '', oe = '', os = '', og = '', ol = '';
    if (typeof ticket.id != 'undefined') {
        id = ticket.id;
        og = ticket.gr;
        ol = ticket.l;
        if (ticket.editor != false) {
            og = ticket.editor.g;
            oe = ticket.editor.ed;
            os = ticket.editor.st;
        }
        this.lzm_chatPollServer.pollServerTicket({
            id: id, ne: editor, ns: status, ng: group, oe: oe, os: os, og: og, nl: language, ol: ol, mc: mc
        }, [], 'save-details');
    } else {
        this.lzm_chatPollServer.pollServerTicket({
            nn: name, nem: email, nc: company, np: phone, nm: message, ne: editor, ns: status, ng: group, nl: language,
            nch: channel, at: attachments, co: comments, cf: customFields
        }, [], 'new-ticket', chat);
    }
};

ChatUserActionsClass.prototype.sendTicketReply = function(ticket, receiver, bcc, subject, message, comment, attachments, messageId, previousMessageId) {
    this.lzm_chatPollServer.pollServerTicket({
        id: ticket.id, ed: this.lzm_chatDisplay.myId, me: message, re: receiver, bcc: bcc, lg: ticket.l, gr: ticket.gr,
        su: subject, mid: messageId, comment: comment, attachments: attachments, pmid: previousMessageId
    }, [], 'send-message');
};

ChatUserActionsClass.prototype.saveTicketComment = function(ticketId, messageId, commentText) {
    this.lzm_chatPollServer.pollServerTicket({id: ticketId, mid: messageId, text: commentText}, [], 'add-comment');
};

ChatUserActionsClass.prototype.saveEmailChanges = function(emailChanges, ticketsCreated) {
    var emails = [emailChanges, ticketsCreated];
    this.lzm_chatPollServer.pollServerTicket({}, emails, 'email-changes');
};
