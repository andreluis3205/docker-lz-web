/****************************************************************************************
 * LiveZilla ChatAllchatsClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatAllchatsClass() {
    this.dataHash = '';
    this.allChats = {};
    this.missedChats = {};
    this.chatCounter = {a: 0, q: 0};
    this.totalChatCount = 0;
    this.showAllchatsFilterMenu = false;
    this.allchatsFilter = 'active';
}

ChatAllchatsClass.prototype.createAllchats = function() {
    var that = this, allChats = that.getAllchatsList();
    that.allchatsFilter = 'active';
    var headline2Html = '<span id="allchats-counter" style="float:left;margin-left:4px;">' +
        t('Active Chats: <!--number_active--> (<!--number_queue--> in queue)',
        [['<!--number_active-->', that.chatCounter.a], ['<!--number_queue-->', that.chatCounter.q]]) + '</span><span style="float:right">' +
        lzm_displayHelper.createButton('allchats-filter', '', 'openAllChatsFilterMenu(event)', t('Active Chats'), '<i class="fa fa-filter"></i>', 'lr', {'margin-right':'4px'}) + '</span>';
    var bodyHtml = that.createAllchatsHtml(allChats.data);
    $('#chat-allchats').html('<div id="all-chats-headline2" class="lzm-dialog-footline" style=""></div><div id="all-chats-body"></div>').trigger('create');
    $('#all-chats-headline2').html(headline2Html);
    $('#all-chats-body').html(bodyHtml);
};

ChatAllchatsClass.prototype.updateAllChats = function() {
    var that = this;
    var filterText = (that.allchatsFilter == 'active') ? t('Active Chats') : t('Missed Chats');
    $('#allchats-filter').children('span').html(filterText);
    if ($('#all-chats-list').length == 0) {
        that.createAllchats();
    } else {
        var allChats = that.getAllchatsList();
        if (lzm_chatDisplay.selected_view == 'mychats' && (lzm_chatUserActions.active_chat_reco == '' || lzm_chatUserActions.active_chat_reco == 'LIST')) {
            var selectedLine =  (typeof $('#all-chats-list').data('selected-line') != 'undefined') ? $('#all-chats-list').data('selected-line') : '';
            if (allChats.hash != that.dataHash) {
                that.dataHash = allChats.hash;
                var counterHtml = t('Active Chats: <!--number_active--> (<!--number_queue--> in queue)',
                    [['<!--number_active-->', that.chatCounter.a], ['<!--number_queue-->', that.chatCounter.q]]);
                $('#allchats-counter').html(counterHtml);
                var tableBodyHtml = '';
                for (var i= 0; i<allChats.data.length; i++) {
                    tableBodyHtml += that.createAllchatsListLine(allChats.data[i]);
                }
                $('#all-chats-list').children('tbody').html(tableBodyHtml);
            } else if (that.allchatsFilter == 'active') {
                that.updateTimeFields(allChats.data);
            }
            if (selectedLine != '') {
                $('#allchats-line-' + selectedLine).addClass('selected-table-line');
            }
        }
    }
    lzm_chatDisplay.playQueueSound(that.chatCounter.q);
};

ChatAllchatsClass.prototype.createAllchatsHtml = function(allChats) {
    var that = this, i = 0;
    var bodyHtml = '<table id="all-chats-list" class="lzm-unselectable visitor-list-table alternating-rows-table" style="width: 100%;">' +
        '<thead><tr>' +
        '<th style="width: 20px !important;"><span style="padding: 0px 5px;"></span></th>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.allchats.length; i++) {
        var thisAllchatsColumn = lzm_chatDisplay.mainTableColumns.allchats[i];
        if (thisAllchatsColumn.display == 1) {
            var cellId = (typeof thisAllchatsColumn.cell_id != 'undefined') ? ' id="' + thisAllchatsColumn.cell_id + '"' : '';
            var cellClass = (typeof thisAllchatsColumn.cell_class != 'undefined') ? ' class="' + thisAllchatsColumn.cell_class + '"' : '';
            var cellStyle = (typeof thisAllchatsColumn.cell_style != 'undefined') ? ' style="white-space: nowrap; ' + thisAllchatsColumn.cell_style + '"' : ' style="white-space: nowrap;"';
            var cellOnclick = (typeof thisAllchatsColumn.cell_onclick != 'undefined') ? ' onclick="' + thisAllchatsColumn.cell_onclick + '"' : '';
            bodyHtml += '<th id="'+thisAllchatsColumn.cid+'" ' + cellId + cellClass + cellStyle + cellOnclick + '>' + t(thisAllchatsColumn.title) +'';
            if(typeof thisAllchatsColumn.sort != 'undefined')
                bodyHtml += '<span style="position:absolute;right:4px;"><i class="fa fa-caret-down"></i></span>';
            bodyHtml += '</th>';
        }
    }

    bodyHtml += '</tr></thead><tbody>';
    for (i=0; i<allChats.length; i++) {
        bodyHtml += that.createAllchatsListLine(allChats[i]);
    }
    bodyHtml += '</tbody></table>';

    return bodyHtml;
};

ChatAllchatsClass.prototype.createAllchatsListLine = function(chat) {
    var that = this;
    var chatStatus = (chat.browser.chat.pn.acc == 1) ? t('In Progress') : (chat.browser.chat.q == 1) ? t('In queue') : t('Waiting for operator');
    var chatType = (chat.browser.ol == 1) ? t('Onsite') : t('Offsite');
    var startTimeObject = lzm_chatTimeStamp.getLocalTimeObject(chat.browser.chat.f * 1000, true);
    var startTime = lzm_commonTools.getHumanDate(startTimeObject, 'time', lzm_chatDisplay.userLanguage);
    var endTime = (typeof chat.end_time != 'undefined') ? chat.end_time : lzm_chatTimeStamp.getServerTimeString(null, true, 1000);
    var duration = that.getTimeDifference(chat.browser.chat.f, endTime);
    var waitingTime = (chat.browser.chat.at == 0) ? that.getTimeDifference(chat.browser.chat.f, endTime) : that.getTimeDifference(chat.browser.chat.f, chat.browser.chat.at);
    var previousChats = '';
    var group = lzm_chatServerEvaluation.groups.getGroup(chat.browser.chat.gr);
    var groupName = (group != null) ? group.name : chat.browser.chat.gr;
    var operators = that.getOperatorNameList(chat.browser.chat.pn.member, chat.browser.chat.dcp);
    var active_chat_realname = lzm_chatServerEvaluation.visitors.getVisitorName(chat.visitor);

    var isBotChat = 0;
    if (chat.browser.chat.pn.member.length == 1) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(chat.browser.chat.pn.member[0].id);
        if (operator != null && operator.isbot == 1) {
            icon = 'img/643-ic.png';
            isBotChat = 1;
        }
    }

    var onclickAction = ' onclick="' + ((!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? 'selectChatLine(\'' + chat.browser.chat.id + '\');' : 'openChatLineContextMenu(\'' + chat.browser.chat.id + '\', ' + isBotChat + ', event);')+'"';
    var ondblclickAction = (that.allchatsFilter != 'active') ? '' : ' ondblclick="takeChat(\'' + chat.visitor.id + '\', \'' + chat.browser.id + '\', \'' + chat.browser.chat.id + '\', \'' + chat.browser.chat.gr + '\', true);"';
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(chat.visitor.id + '~' + chat.browser.id);
    var pgid = lzm_chatServerEvaluation.userChats.isInPublicGroupChat(activeUserChat);

    if(pgid){
        groupName = lzm_chatServerEvaluation.groups.getGroup(pgid[0]).name;
        operators = '-';
        if(that.allchatsFilter == 'active')
            ondblclickAction = ' ondblclick="chatInternalWith(\'' + pgid + '\', \'' + pgid + '\', \'DYNGRUPPE\', true);"';
    }

    ondblclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ondblclickAction : '';
    var oncontextmenuAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ' oncontextmenu="openChatLineContextMenu(\'' + chat.browser.chat.id + '\', ' + isBotChat + ', event);"' : '';
    var columnContents = [{cid: 'status', contents: chatStatus}, {cid: 'chat_id', contents: chat.browser.chat.id},
        {cid: 'type', contents: chatType}, {cid: 'duration', contents: duration[0], cell_id: 'allchats-duration-' + chat.browser.chat.id},
        {cid: 'start_time', contents: startTime}, {cid: 'waiting_time', contents: waitingTime[0], cell_id: 'allchats-waitingtime-' + chat.browser.chat.id},
        {cid: 'name', contents: lzm_commonTools.htmlEntities(active_chat_realname)}, {cid: 'question', contents: lzm_commonTools.htmlEntities(chat.browser.chat.eq)},
        {cid: 'previous_chats', contents: previousChats}, {cid: 'priority', contents: chat.browser.chat.p},
        {cid: 'group', contents: groupName}, {cid: 'operators', contents: operators},
        {cid: 'email', contents: lzm_commonTools.htmlEntities(chat.browser.cemail)}, {cid: 'company', contents: lzm_commonTools.htmlEntities(chat.browser.ccompany)}];

    var lineHtml = '<tr class="allchats-line" id="allchats-line-' + chat.browser.chat.id + '"' + onclickAction + ondblclickAction + oncontextmenuAction + ' style="cursor: pointer;">' + that.getIconField(chat);
    for (var i=0; i<lzm_chatDisplay.mainTableColumns.allchats.length; i++) {
        for (var j=0; j<columnContents.length; j++) {
            if(lzm_chatDisplay.mainTableColumns.allchats[i].cid == columnContents[j].cid && lzm_chatDisplay.mainTableColumns.allchats[i].display == 1) {
                var cellId = (typeof columnContents[j].cell_id != 'undefined') ? ' id="' + columnContents[j].cell_id + '"' : '';

                if(lzm_chatDisplay.mainTableColumns.allchats[i].cid == 'waiting_time')
                    lineHtml += that.getWaitingTimeField(chat);
                else
                    lineHtml += '<td' + cellId + '>' + columnContents[j].contents + '</td>';
            }
        }

    }
    lineHtml += '</tr>';
    return lineHtml;
};

ChatAllchatsClass.prototype.getWaitingTimeField = function(chat) {
    var waitingTime = (chat.browser.chat.at == 0) ? this.getTimeDifference(chat.browser.chat.f) : this.getTimeDifference(chat.browser.chat.f, chat.browser.chat.at);
    var bgcolor = (waitingTime[1] <= 120) ? '#f5fff5' : (waitingTime[1] <= 300) ? '#fffbf5' : '#fff5f5';
    var forcolor = (waitingTime[1] <= 120) ? '#5f991d' : (waitingTime[1] <= 300) ? '#ff7800' : '#d40000';
    return '<td id="allchats-waitingtime-' + chat.browser.chat.id + '" style="color:'+forcolor+' !important;background:'+bgcolor+' !important;text-align:center;padding-top:5px;"><b>'+waitingTime[0]+'</b></td>';
}

ChatAllchatsClass.prototype.getIconField = function(chat) {
    var waitingTime = (chat.browser.chat.at == 0) ? this.getTimeDifference(chat.browser.chat.f) : this.getTimeDifference(chat.browser.chat.f, chat.browser.chat.at);
    var bgcolor = (waitingTime[1] <= 120) ? '#f5fff5' : (waitingTime[1] <= 300) ? '#fffbf5' : '#fff5f5';
    var forcolor = (waitingTime[1] <= 120) ? '#5f991d' : (waitingTime[1] <= 300) ? '#ff7800' : '#d40000';
    var icon = (chat.browser.chat.q == 1) ? 'clock-o' : (chat.browser.chat.pn.acc == 0) ? 'bell-o' : 'comments';
    return '<td id="allchats-icon-' + chat.browser.chat.id + '" class="icon-column" style="background:'+bgcolor+' !important;text-align:center;padding-top:5px;"><i class="fa fa-'+icon+'" style="color:'+forcolor+' !important;"></i></td>';
}

ChatAllchatsClass.prototype.updateTimeFields = function(allChats) {
    var that = this;
    for (var i=0; i<allChats.length; i++) {
        var chat = allChats[i];
        $('#allchats-icon-' + chat.browser.chat.id).replaceWith(this.getIconField(chat));
        $('#allchats-waitingtime-' + chat.browser.chat.id).replaceWith(this.getWaitingTimeField(chat));
    }
};

/********** Helper functions **********/
ChatAllchatsClass.prototype.getAllchatsList = function() {
    var that = this, allChats = [], allChatsObject = [], visitors = lzm_chatServerEvaluation.visitors.getVisitorList();
    var chatCounter = {a: 0, q: 0};
    this.totalChatCount = 0;
    for (var i=0; i<visitors.length; i++) {
        for (var j=0; j<visitors[i].b.length; j++) {
            var userChat = lzm_chatServerEvaluation.userChats.getUserChat(visitors[i].id + '~' + visitors[i].b[j].id);

            if (visitors[i].b[j].chat.id != '' && userChat != null /*&& userChat.status != 'left'*/) {
                var visitorIsChatting = false;
                for (var k=0; k<lzm_chatServerEvaluation.global_typing.length; k++) {
                    if (lzm_chatServerEvaluation.global_typing[k].id.indexOf('~') != -1 &&
                        lzm_chatServerEvaluation.global_typing[k].id.split('~')[0] == visitors[i].id &&
                        lzm_chatServerEvaluation.global_typing[k].id.split('~')[1] == visitors[i].b[j].id) {
                        visitorIsChatting = true;
                        break;
                    }
                }
                var visitorWasDeclined = true;
                try {
                    if (visitorIsChatting) {
                        if (visitors[i].b[j].chat.pn.member.length == 0) {
                            visitorWasDeclined = false;
                        }
                        for (var l=0; l<visitors[i].b[j].chat.pn.member.length; l++) {
                            if (visitors[i].b[j].chat.pn.member[l].dec == 0) {
                                visitorWasDeclined = false;
                            }
                        }
                    } else {
                        visitorWasDeclined = false;
                    }
                } catch(ex) {}
                if (visitorIsChatting && !visitorWasDeclined) {
                    allChats.push({visitor: visitors[i], browser: visitors[i].b[j], chatid: visitors[i].b[j].chat.id});
                    allChatsObject[visitors[i].b[j].chat.id.toString()] = {visitor: visitors[i], browser: visitors[i].b[j], chatid: visitors[i].b[j].chat.id};
                }
                if (visitors[i].is_active && !visitorWasDeclined) {
                    if (visitors[i].b[j].chat.q == 0) {
                        chatCounter.a++;
                    } else {
                        chatCounter.q++;
                    }
                }
            }
        }
    }
    var numberOfRunningChats = allChats.length;
    this.totalChatCount = numberOfRunningChats;
    allChats.sort(function(a, b){return b.chatid > a.chatid;});

    that.allChats = allChatsObject;
    that.chatCounter = chatCounter;

    if (lzm_chatDisplay.numberOfRunningChats != numberOfRunningChats) {
        lzm_chatDisplay.numberOfRunningChats = numberOfRunningChats;
        lzm_chatDisplay.createViewSelectPanel(lzm_chatDisplay.firstVisibleView);
    }

    var missedChats = that.getMissedChatsList(allChats);
    if (that.allchatsFilter == 'active') {
        return {data: allChats, hash: md5(JSON.stringify(allChats))};
    } else {
        return {data: missedChats, hash: md5(JSON.stringify(missedChats))};
    }
};

ChatAllchatsClass.prototype.getMissedChatsList = function(allChats) {
    var that = this, missedChats = [], thisChat = null;
    for (var i=0; i<allChats.length; i++) {
        thisChat = lzm_commonTools.clone(allChats[i]);
        if (thisChat.browser.chat.pn.acc == 1 && typeof that.missedChats[thisChat.browser.chat.id] != 'undefined') {
            delete that.missedChats[thisChat.browser.chat.id];
        } else if (thisChat.browser.chat.pn.acc == 0) {
            thisChat.missed = false;
            that.missedChats[thisChat.browser.chat.id] = thisChat;
        }
    }
    for (var chatId in that.missedChats) {
        if (that.missedChats.hasOwnProperty(chatId)) {
            thisChat = that.missedChats[chatId];
            var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(thisChat.visitor.id, thisChat.browser.id);
            var chatWasDeclined = true;
            if (visitorBrowser[1] != null && typeof visitorBrowser[1].chat.pn != 'undefined') {
                var tmpChat = visitorBrowser[1].chat;
                for (var j=0; j<tmpChat.pn.member.length; j++) {
                    if (tmpChat.pn.member[j].dec == 0) {
                        chatWasDeclined = false;
                    }
                }
                if (tmpChat.pn.member.length == 0) {
                    chatWasDeclined = false;
                }
            } else {
                chatWasDeclined = false;
            }
            if (typeof that.allChats[chatId] == 'undefined' && !chatWasDeclined) {
                that.missedChats[chatId].missed = true;
                if (typeof that.missedChats[chatId].end_time == 'undefined') {
                    that.missedChats[chatId].end_time = lzm_chatTimeStamp.getServerTimeString(null, true, 1000);
                }
                missedChats.push(that.missedChats[chatId]);
            }
            if (chatWasDeclined) {
                delete that.missedChats[chatId];
            }
        }
    }
    return missedChats;
};

ChatAllchatsClass.prototype.getOperatorNameList = function(members, dcp) {
    var opList = [];
    for (var i=0; i<members.length; i++) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(members[i].id);
        if (operator != null && members[i].st != 2 && members[i].dec != 1)
            opList.push(operator.name);
    }
    var dcpName = (lzm_chatServerEvaluation.operators.getOperator(dcp) != null) ? lzm_chatServerEvaluation.operators.getOperator(dcp).name : '';
    var nameString = (opList.length > 0) ? opList.join(', ') : (dcpName != '') ? '(' + dcpName + ')' : '';
    return nameString;
};

ChatAllchatsClass.prototype.getTimeDifference = function(intervallStart, intervallEnd) {
    intervallEnd = (typeof intervallEnd != 'undefined') ? intervallEnd : lzm_chatTimeStamp.getServerTimeString(null, true, 1000);
    var duration = intervallEnd - intervallStart;
    var hours = Math.floor(duration / 3600);
    var minutes = Math.floor((duration - hours * 3600)  / 60);
    var seconds = duration - hours * 3600 - minutes * 60;
    return [lzm_commonTools.pad(hours, 2) + ':' + lzm_commonTools.pad(minutes, 2) + ':' + lzm_commonTools.pad(seconds, 2), duration];
};

ChatAllchatsClass.prototype.createAllChatsListContextMenu = function(myObject) {
    var disabledClass = '', onclickAction = '', contextMenuHtml = '';
    onclickAction = 'showVisitorInfo(\'' + myObject.visitor.id + '\', \'' + myObject.visitor.name + '\', \'' + myObject.browser.chat.id + '\', 0);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="show-allchats-details" class="cm-line">' + t('Details') + '</span></div><hr />';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', false);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="join-allchats" class="cm-line cm-click">' + t('Join') + '</span></div>';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', true);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="join-allchats-invisible" class="cm-line">' +
        t('Join (invisible)') + '</span></div><hr />';

    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(myObject.visitor.id + '~' + myObject.browser.id);
    var pgid = lzm_chatServerEvaluation.userChats.isInPublicGroupChat(activeUserChat);

    disabledClass = (myObject.missed || pgid) ? ' class="ui-disabled"' : '';
    onclickAction = 'takeChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', \'' + myObject.browser.chat.gr + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="take-allchats" class="cm-line cm-click">' +
        t('Take') + '</span></div><hr />';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) == -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'leaveChat(\'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="leave-allchats" class="cm-line cm-click">' +
        t('Leave') + '</span></div>';
    disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="forward-allchats" class="cm-line cm-click">' +
        t('Forward') + '</span></div>';
    disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\', \'invite\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="invite-allchats" class="cm-line cm-click">' + t('Invite Operator') + '</span></div><hr />';
    disabledClass = '';
    onclickAction = 'showVisitorInfo(\'' + myObject.visitor.id + '\', \'' + myObject.visitor.name + '\', \'' + myObject.browser.chat.id + '\', 5);';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="show-allchats-archive" class="cm-line cm-click">' + t('Archive') + '</span></div><hr />';
    disabledClass = '';
    onclickAction = 'showFilterCreation(\'\', \'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        '<span id="ban-allchats" class="cm-line cm-click">' +
        t('Ban (add filter)') + '</span></div>';
    return contextMenuHtml;
};

ChatAllchatsClass.prototype.createAllChatsFilterMenu = function(myObject) {
    var myVisibility = '', contextMenuHtml = '';
    myVisibility = (myObject.filter == 'active') ? 'visible' : 'hidden';
    contextMenuHtml += '<div>' +
        '<span id="toggle-allchats-active" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'active\', event)" style="padding-left: 0px;">' +
        '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Active Chats') + '</span></div>';
    myVisibility = (myObject.filter == 'missed') ? 'visible' : 'hidden';
    contextMenuHtml += '<div>' +
        '<span id="toggle-allchats-missed" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'missed\', event)" style="padding-left: 0px;">' +
        '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Missed Chats') + '</span></div>';
    return contextMenuHtml;
};
