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
    this.showAllchatsFilterMenu = false;
    this.allchatsFilter = 'active';
}

ChatAllchatsClass.prototype.createAllchats = function() {
    var that = this, allChats = that.getAllchatsList();
    that.allchatsFilter = 'active';
    var headline2Html = '<span id="allchats-counter" style="position: absolute; top: 10px; left: 6px; font-size: 11px; font-weight: normal;">' +
        t('Active Chats: <!--number_active--> (<!--number_queue--> in queue)',
        [['<!--number_active-->', that.chatCounter.a], ['<!--number_queue-->', that.chatCounter.q]]) + '</span>' +
        lzm_displayHelper.createButton('allchats-filter', '', 'openAllChatsFilterMenu(event)',
            t('Active Chats'), '<i class="fa fa-filter"></i>', 'lr', {position: 'absolute', top: '4px', right: '4px'});
    var bodyHtml = that.createAllchatsHtml(allChats.data);
    $('#chat-allchats').html('<div id="all-chats-headline2"></div><div id="all-chats-body"></div>').trigger('create');
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
                that.updateTimeFileds(allChats.data);
            }
            if (selectedLine != '') {
                $('#allchats-line-' + selectedLine).addClass('selected-table-line');
            }
        }
    }
};

ChatAllchatsClass.prototype.createAllchatsHtml = function(allChats) {
    var that = this, i = 0;
    var bodyHtml = '<table id="all-chats-list" class="lzm-unselectable visitor-list-table alternating-rows-table" style="width: 100%;">' +
        '<thead><tr>' +
        '<th style="width: 20px !important;"><span style="padding: 0px 10px;"></span></th>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.allchats.length; i++) {
        var thisAllchatsColumn = lzm_chatDisplay.mainTableColumns.allchats[i];
        if (thisAllchatsColumn.display == 1) {
            var cellId = (typeof thisAllchatsColumn.cell_id != 'undefined') ? ' id="' + thisAllchatsColumn.cell_id + '"' : '';
            var cellClass = (typeof thisAllchatsColumn.cell_class != 'undefined') ? ' class="' + thisAllchatsColumn.cell_class + '"' : '';
            var cellStyle = (typeof thisAllchatsColumn.cell_style != 'undefined') ? ' style="white-space: nowrap; ' + thisAllchatsColumn.cell_style + '"' : ' style="white-space: nowrap;"';
            var cellOnclick = (typeof thisAllchatsColumn.cell_onclick != 'undefined') ? ' onclick="' + thisAllchatsColumn.cell_onclick + '"' : '';
            bodyHtml += '<th' + cellId + cellClass + cellStyle + cellOnclick + '>' + t(thisAllchatsColumn.title) + '</th>';
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
    var waitingTime = (chat.browser.chat.at == 0) ? that.getTimeDifference(chat.browser.chat.f, endTime) :
        that.getTimeDifference(chat.browser.chat.f, chat.browser.chat.at);
    var previousChats = '';
    var group = lzm_chatServerEvaluation.groups.getGroup(chat.browser.chat.gr);
    var groupName = (group != null) ? group.name : chat.browser.chat.gr;
    var operators = that.getOperatorNameList(chat.browser.chat.pn.member, chat.browser.chat.dcp);
    var chatPriorities = [];
    var iconNumber = (waitingTime[1] <= 180) ? 2 : (waitingTime[1] <= 300) ? 3 : 4;
    var iconColor = (chat.browser.chat.pn.acc == 0) ? '_gray' : '';
    var icon = 'img/217-quote' + iconNumber + iconColor + '.png';
    if (chat.browser.chat.q == 1) {
        icon = 'img/031-clock' + iconNumber + '.png';
    }
    var isBotChat = 0;
    if (chat.browser.chat.pn.member.length == 1) {
        var operator = lzm_chatServerEvaluation.operators.getOperator(chat.browser.chat.pn.member[0].id);
        if (operator != null && operator.isbot == 1) {
            icon = 'img/643-ic.png';
            isBotChat = 1;
        }
    }
    /* Keep the following images in the release package:
    img/217-quote2.png img/217-quote2_gray.png img/217-quote3.png img/217-quote3_gray.png img/217-quote4.png img/217-quote4_gray.png
    img/031-clock2.png img/031-clock3.png  img/031-clock4.png*/
    var onclickAction = ' onclick="';
    onclickAction += (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? 'selectChatLine(\'' + chat.browser.chat.id + '\')' :
        'openChatLineContextMenu(\'' + chat.browser.chat.id + '\', ' + isBotChat + ', event)';
    onclickAction += ';"';
    var ondblclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ' ondblclick="takeChat(\'' + chat.visitor.id + '\', \'' + chat.browser.id + '\', \'' + chat.browser.chat.id + '\', \'' + chat.browser.chat.gr + '\', true);"' : '';
    var oncontextmenuAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ' oncontextmenu="openChatLineContextMenu(\'' + chat.browser.chat.id + '\', ' + isBotChat + ', event);"' : '';
    var columnContents = [{cid: 'status', contents: chatStatus}, {cid: 'chat_id', contents: chat.browser.chat.id},
        {cid: 'type', contents: chatType}, {cid: 'duration', contents: duration[0], cell_id: 'allchats-duration-' + chat.browser.chat.id},
        {cid: 'start_time', contents: startTime}, {cid: 'waiting_time', contents: waitingTime[0], cell_id: 'allchats-waitingtime-' + chat.browser.chat.id},
        {cid: 'name', contents: lzm_commonTools.htmlEntities(chat.browser.cname)}, {cid: 'question', contents: lzm_commonTools.htmlEntities(chat.browser.chat.eq)},
        {cid: 'previous_chats', contents: previousChats}, {cid: 'priority', contents: chat.browser.chat.p},
        {cid: 'group', contents: groupName}, {cid: 'operators', contents: operators},
        {cid: 'email', contents: lzm_commonTools.htmlEntities(chat.browser.cemail)}, {cid: 'company', contents: lzm_commonTools.htmlEntities(chat.browser.ccompany)}];
    var lineHtml = '<tr class="allchats-line" id="allchats-line-' + chat.browser.chat.id + '"' + onclickAction + ondblclickAction + oncontextmenuAction + ' style="cursor: pointer;">' +
        '<td id="allchats-icon-' + chat.browser.chat.id + '" class="icon-column"' +
        ' style="background-image: url(\'' + icon + '\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;"></td>';
    for (var i=0; i<lzm_chatDisplay.mainTableColumns.allchats.length; i++) {
        for (var j=0; j<columnContents.length; j++) {
            if(lzm_chatDisplay.mainTableColumns.allchats[i].cid == columnContents[j].cid && lzm_chatDisplay.mainTableColumns.allchats[i].display == 1) {
                var cellId = (typeof columnContents[j].cell_id != 'undefined') ? ' id="' + columnContents[j].cell_id + '"' : '';
                lineHtml += '<td' + cellId + '>' + columnContents[j].contents + '</td>';
            }
        }

    }
    lineHtml += '</tr>';

    return lineHtml;
};

ChatAllchatsClass.prototype.updateTimeFileds = function(allChats) {
    var that = this;
    for (var i=0; i<allChats.length; i++) {
        var chat = allChats[i];
        var duration = that.getTimeDifference(chat.browser.chat.f);
        var waitingTime = (chat.browser.chat.at == 0) ? that.getTimeDifference(chat.browser.chat.f) :
            that.getTimeDifference(chat.browser.chat.f, chat.browser.chat.at);
        var iconNumber = (waitingTime[1] <= 180) ? 2 : (waitingTime[1] <= 300) ? 3 : 4;
        var iconColor = (chat.browser.chat.pn.acc == 0) ? '_gray' : '';
        var icon = 'img/217-quote' + iconNumber + iconColor + '.png';
        if (chat.browser.chat.q == 1) {
            icon = 'img/031-clock' + iconNumber + '.png';
        }
        if (chat.browser.chat.pn.member.length == 1) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(chat.browser.chat.pn.member[0].id);
            if (operator != null && operator.isbot == 1) {
                icon = 'img/643-ic.png';
            }
        }
        $('#allchats-duration-' + chat.browser.chat.id).html(duration[0]);
        $('#allchats-waitingtime-' + chat.browser.chat.id).html(waitingTime[0]);
        $('#allchats-icon-' + chat.browser.chat.id).css({'background-image': 'url(\'' + icon + '\')'});
    }
};

/********** Helper functions **********/
ChatAllchatsClass.prototype.getAllchatsList = function() {
    var that = this, allChats = [], allChatsObject = {}, visitors = lzm_chatServerEvaluation.visitors.getVisitorList();
    var chatCounter = {a: 0, q: 0};
    for (var i=0; i<visitors.length; i++) {
        for (var j=0; j<visitors[i].b.length; j++) {
            var userChat = lzm_chatServerEvaluation.userChats.getUserChat(visitors[i].id + '~' + visitors[i].b[j].id);
            if (visitors[i].b[j].chat.id != '' && userChat != null && userChat.status != 'left') {
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
                    allChats.push({visitor: visitors[i], browser: visitors[i].b[j]});
                    allChatsObject[visitors[i].b[j].chat.id] = {visitor: visitors[i], browser: visitors[i].b[j]};
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
    if (lzm_chatDisplay.numberOfRunningChats != numberOfRunningChats) {
        lzm_chatDisplay.numberOfRunningChats = numberOfRunningChats;
        lzm_chatDisplay.createViewSelectPanel(lzm_chatDisplay.firstVisibleView);
    }
    that.allChats = allChatsObject;
    that.chatCounter = chatCounter;
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
        if (operator != null && members[i].st != 2)
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
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-allchats-details" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Details') + '</span></div><hr />';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', false);';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-comment lzm-ctxt-left-fa"></i>' +
        '<span id="join-allchats" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 4px;' +
        ' cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Join') + '</span></div>';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', true);';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-comment-o lzm-ctxt-left-fa"></i>' +
        '<span id="join-allchats-invisible" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 4px;' +
        ' cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Join (invisible)') + '</span></div><hr />';

    disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
    onclickAction = 'takeChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', \'' + myObject.browser.chat.gr + '\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="take-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Take') + '</span></div><hr />';
    disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(lzm_chatDisplay.myId, myObject.browser.chat.pn.memberIdList) == -1) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'leaveChat(\'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="leave-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Leave') + '</span></div>';
    disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="forward-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Forward') + '</span></div>';
    disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
    onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\', \'invite\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="invite-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Invite Operator') + '</span></div><hr />';
    disabledClass = '';
    onclickAction = 'showVisitorInfo(\'' + myObject.visitor.id + '\', \'' + myObject.visitor.name + '\', \'' + myObject.browser.chat.id + '\', 5);';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-archive" style="padding-left: 4px;"></i>' +
        '<span id="show-allchats-archive" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 4px;' +
        ' cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Archive') + '</span></div><hr />';
    disabledClass = '';
    onclickAction = 'showFilterCreation(\'\', \'' + myObject.browser.chat.id + '\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="ban-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
        t('Ban (add filter)') + '</span></div>';
    return contextMenuHtml;
};

ChatAllchatsClass.prototype.createAllChatsFilterMenu = function(myObject) {
    var myVisibility = '', contextMenuHtml = '';
    myVisibility = (myObject.filter == 'active') ? 'visible' : 'hidden';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-allchats-active" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'active\', event)" style="padding-left: 0px;">' +
        '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Active Chats') + '</span></div>';
    myVisibility = (myObject.filter == 'missed') ? 'visible' : 'hidden';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-allchats-missed" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'missed\', event)" style="padding-left: 0px;">' +
        '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Missed Chats') + '</span></div>';
    return contextMenuHtml;
};
