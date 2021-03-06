/****************************************************************************************
 * LiveZilla ChatArchiveClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatArchiveClass() {

}

ChatArchiveClass.prototype.createArchive = function() {
    var that = this;
    var chatArchive = lzm_chatServerEvaluation.chatArchive;
    $('#archive-headline').html('<h3>' + t('Chat Archive') + '</h3>');
    $('#archive-headline2').html(that.createArchiveHeaderControls(lzm_chatPollServer.chatArchivePage, chatArchive.q, chatArchive.p, chatArchive.t,
        lzm_chatPollServer.chatArchiveFilter, lzm_chatPollServer.chatArchiveQuery)).trigger('create');
    $('#archive-body').html(that.createArchiveHtml(chatArchive.chats));
    $('#archive-footline').html(that.createArchivePagingHtml(lzm_chatPollServer.chatArchivePage, chatArchive.q, chatArchive.p));
    if (lzm_chatPollServer.chatArchiveQuery != '') {
        that.styleArchiveClearBtn();
    }

    if (lzm_chatPollServer.chatArchiveQuery != '') {
        $('#archive-filter').addClass('ui-disabled');
    } else {
        $('#archive-filter').removeClass('ui-disabled');
    }

    $('#search-archive').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('archive', chatArchive.chats, e);
    });
    $('#clear-archive-search').click(function() {
        $('#search-archive').val('');
        $('#search-archive').keyup();
    });
};

ChatArchiveClass.prototype.updateArchive = function() {
    var chatArchive = lzm_chatServerEvaluation.chatArchive, that = this;
    if ($('#matching-chats-inner').length == 0) {
        $('#archive-body').html(that.createArchiveHtml(chatArchive.chats));
        $('#archive-footline').html(that.createArchivePagingHtml(lzm_chatPollServer.chatArchivePage, chatArchive.q, chatArchive.p));
    } else {
        var selectedChatId = $('#matching-chats-table').data('selected-chat-id');
        selectedChatId = (selectedChatId != '') ? selectedChatId : (chatArchive.chats.length > 0) ? chatArchive.chats[0].cid : '';
        $('#matching-chats-inner').html('<legend>' + t('Chats') + '</legend>' +
            that.createArchiveHtml(chatArchive.chats, selectedChatId, true));
        selectArchivedChat(selectedChatId);
    }
    if ($('#visitor-info-placeholder').length > 0) {
        var numberOfChats = lzm_chatServerEvaluation.chatArchive.chats.length;
        $('#visitor-info-placeholder-tab-4').html(t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', numberOfChats]]));
        $('#visitor-info-placeholder-tab-4').removeClass('ui-disabled');
    }
};

ChatArchiveClass.prototype.styleArchiveClearBtn = function() {
    var ctsBtnWidth = $('#clear-archive-search').width(), that = this;
    var ctsBtnHeight =  $('#clear-archive-search').height();
    var ctsBtnPadding = Math.floor((18-ctsBtnHeight)/2)+'px ' +  Math.floor((18-ctsBtnWidth)/2)+'px ' + Math.ceil((18-ctsBtnHeight)/2)+'px ' +  Math.ceil((18-ctsBtnWidth)/2)+'px';
    $('#clear-archive-search').css({padding: ctsBtnPadding});
};

ChatArchiveClass.prototype.showArchivedChat = function(chats, cpId, cpName, chatId, chatType) {
    var that = this;
    var menuEntry = t('Matching Chats: <!--cp_name-->', [['<!--cp_name-->', cpName]]);
    var headerString = t('Matching Chats');
    var footerString = lzm_displayHelper.createButton('cancel-matching-chats', '', '', t('Close'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = '<div style="margin-top: 5px;" id="matching-chats-placeholder"></div>';
    var tableString = '<div style="margin: 5px 0px 10px;">' + lzm_displayHelper.createButton('send-chat-transcript', '', '', t('Send transcript to...').substr(0, 30),
        'img/061-forward.png', 'lr', {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        '</div>' + that.createMatchingChats(chatId) +
        '<div id="chat-content-inner-div"><fieldset style="margin-top: 5px;" class="lzm-fieldset" data-role="none" id="chat-content-inner">' +
        '<legend>' + t('Text') + '</legend></fieldset></div>';
    var dialogData = {'cp-id': cpId, 'cp-name': cpName, 'chat-type': chatType, menu: menuEntry, reload: ['chats']};
    var dialogid = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'matching-chats', {}, {}, {}, {}, '',
        dialogData, true, true);
    lzm_displayHelper.createTabControl('matching-chats-placeholder', [{name: headerString, content: tableString}]);
    lzm_displayLayout.resizeArchivedChat();

    $('#send-chat-transcript').click(function() {
        var chatId = $('#matching-chats-table').data('selected-chat-id');
        lzm_displayHelper.minimizeDialogWindow(dialogid, 'matching-chats', dialogData, '', false);
        sendChatTranscriptTo(chatId, dialogid);
    });

    $('#cancel-matching-chats').click(function() {
        lzm_chatPollServer.stopPolling();
        var archiveFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
        try {
            lzm_chatPollServer.chatArchiveFilter = window['tmp-chat-archive-values'].filter;
            lzm_chatPollServer.chatArchivePage = window['tmp-chat-archive-values'].page;
            lzm_chatPollServer.chatArchiveLimit = window['tmp-chat-archive-values'].limit;
            lzm_chatPollServer.chatArchiveQuery = window['tmp-chat-archive-values'].query;
        } catch (e) {
            lzm_chatPollServer.chatArchiveFilter = '012';
            lzm_chatPollServer.chatArchivePage = 1;
            lzm_chatPollServer.chatArchiveLimit = 20;
            lzm_chatPollServer.chatArchiveQuery = '';
        }
        lzm_chatPollServer.chatArchiveFilterGroup = '';
        lzm_chatPollServer.chatArchiveFilterInternal = '';
        lzm_chatPollServer.chatArchiveFilterExternal = '';
        lzm_chatPollServer.resetChats = true;
        lzm_chatPollServer.startPolling();
        lzm_displayHelper.removeDialogWindow('matching-chats');
    })
};

ChatArchiveClass.prototype.createArchiveHtml = function(chatArchive, chatId, inDialog) {
    chatId = (typeof chatId != 'undefined' && chatId != '') ? chatId : (chatArchive.length > 0) ? chatArchive[0].cid : '';
    var i, that = this;
    var tableId = (inDialog) ? 'matching-chats-table' : 'chat-archive-table';
    var archiveHtml = '<table id="' + tableId + '" class="visitor-list-table alternating-rows-table lzm-unselectable"' +
        ' data-selected-chat-id="' + chatId + '"  style="width: 100%;">' +
        '<thead><tr>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.archive.length; i++) {
        if (lzm_chatDisplay.mainTableColumns.archive[i].display == 1) {
            archiveHtml += '<th style="white-space: nowrap;">' + t(lzm_chatDisplay.mainTableColumns.archive[i].title) + '</th>';
        }
    }
    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        var myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111 && myCustomInput.display.archive) {
            archiveHtml += '<th>' + myCustomInput.name + '</th>';
        }
    }
    archiveHtml += '</tr></thead><tbody>';
    for (i=0; i<chatArchive.length; i++) {
        archiveHtml += that.createArchiveListLine(chatArchive[i], chatId, inDialog);
    }
    archiveHtml += '</tbody></table>';

    return archiveHtml;
};

ChatArchiveClass.prototype.createArchiveListLine = function(aChat, selectedChatId, inDialog) {
    var name = '', operatorName = '-', groupName = '-', that = this;
    var date = lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(aChat.ts * 1000, true), '', lzm_chatDisplay.userLanguage);
    var duration = lzm_commonTools.getHumanTimeSpan(parseInt(aChat.te) - parseInt(aChat.ts));
    var opId, cpId, qId;
    if (aChat.t == 0) {
        var opList = aChat.iid.split('-');
        var myPosition = $.inArray(lzm_chatDisplay.myId, opList);
        if (myPosition != -1) {
            opId = opList[myPosition];
            cpId = opList[1 - myPosition];
        } else {
            opId = opList[0];
            cpId = opList[1];
        }
        qId = aChat.iid;
    } else {
        opId = aChat.iid;
        cpId = (aChat.eid != '') ? aChat.eid : aChat.gid;
        qId = cpId;
    }
    try {
        name = (aChat.t == 0) ? lzm_chatServerEvaluation.operators.getOperator(cpId).name : (aChat.t == 1) ?
            lzm_commonTools.htmlEntities(aChat.en) : (aChat.gid == 'everyoneintern') ? t('All operators') : capitalize(aChat.gid);
    } catch (e) {}
    try {
        var operator = lzm_chatServerEvaluation.operators.getOperator(opId);
        operatorName = (operator != null) ? operator.name : '-';
    } catch (e) {}
    try {
        groupName = (aChat.gid != '') ? (aChat.gid != 'everyoneintern') ? lzm_chatServerEvaluation.groups.getGroup(aChat.gid).name : t('All operators') : '-';
    } catch (e) {groupName = aChat.gid;}
    var area = (aChat.ac != '') ? aChat.ac : '-';
    var waitingTime = (aChat.t == 1) ? lzm_commonTools.getHumanTimeSpan(parseInt(aChat.wt)) : '-';
    var result = (aChat.t == 1) ? (aChat.sr == 0) ? t('Missed') : (aChat.sr == 1) ? t('Accepted') : t('Declined') : '-';
    var endedBy = (aChat.t == 1) ? (aChat.er == 0) ? t('User') : t('Operator') : '-';
    var callBack = (aChat.t == 1) ? (aChat.cmb != 0) ? t('Yes') : t('No') : '-';
    var email = (aChat.em != '') ? lzm_commonTools.htmlEntities(aChat.em) : '-';
    var company = (aChat.co != '') ? lzm_commonTools.htmlEntities(aChat.co) : '-';
    var language = (aChat.il != '') ? aChat.il : '-';
    var langName = (typeof lzm_chatDisplay.availableLanguages[language.toLowerCase()] != 'undefined') ?
        lzm_chatDisplay.availableLanguages[language.toLowerCase()] :
        (typeof lzm_chatDisplay.availableLanguages[language.toLowerCase().split('-')[0]] != 'undefined') ?
        lzm_chatDisplay.availableLanguages[language.toLowerCase().split('-')[0]] :
        language;
    var country = (aChat.ic != '') ? aChat.ic : '-';
    var ipAddress = (aChat.ip != '') ? aChat.ip : '-';
    var host = (aChat.ho != '') ? aChat.ho : '-';
    var phone = (aChat.cp != '') ? lzm_commonTools.htmlEntities(aChat.cp) : '-';
    var action = ' onclick="selectArchivedChat(\'' + aChat.cid + '\', true);"';
    if (!inDialog) {
        var onclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ' onclick="selectArchivedChat(\'' + aChat.cid + '\', false);"' :
            ' onclick="openArchiveListContextMenu(event, \'' + aChat.cid + '\');"';
        var ondblclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
            ' ondblclick="showArchivedChat(\'' + qId + '\', \'' + name + '\', \'' + aChat.cid + '\', \'' + aChat.t + '\');"' : '';
        var oncontextmenuAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
            ' oncontextmenu="openArchiveListContextMenu(event, \'' + aChat.cid + '\');"' : '';
        action = onclickAction + ondblclickAction + oncontextmenuAction;
        /*action = (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) ?
            ' onclick="showArchivedChat(\'' + qId + '\', \'' + name + '\', \'' + aChat.cid + '\', \'' + aChat.t + '\');"' :
            ' onclick="selectArchivedChat(\'' + aChat.cid + '\', false);"' +
                ' ondblclick="showArchivedChat(\'' + qId + '\', \'' + name + '\', \'' + aChat.cid + '\', \'' + aChat.t + '\');"';*/
    }
    var pageUrl = (typeof aChat.u != 'undefined' && aChat.u != '') ? aChat.u : '-';
    var columnContents = [{cid: 'date', contents: date}, {cid: 'chat_id', contents: aChat.cid},
        {cid: 'name', contents: name}, {cid: 'operator', contents: operatorName}, {cid: 'group', contents: groupName},
        {cid: 'email', contents: email}, {cid: 'company', contents: company}, {cid: 'language', contents: langName},
        {cid: 'country', contents: country}, {cid: 'ip', contents: ipAddress}, {cid: 'host', contents: host},
        {cid: 'duration', contents: duration}, {cid: 'area_code', contents: area}, {cid: 'page_url', contents: pageUrl},
        {cid: 'waiting_time', contents: waitingTime},
        {cid: 'result', contents: result}, {cid: 'ended_by', contents: endedBy}, {cid: 'callback', contents: callBack},
        {cid: 'phone', contents: phone}];
    var selectedClass = (aChat.cid == selectedChatId) ? ' selected-table-line' : '';
    var lineAttributes = (inDialog) ?
        ' data-chat-id="' + aChat.cid + '" id="dialog-archive-list-line-' + aChat.cid + '" class="archive-list-line' + selectedClass + '"' :
        ' id="archive-list-line-' + aChat.cid + '" class="archive-list-line"';
    var archiveLineHtml = '<tr' + action + lineAttributes + ' style="cursor:pointer;">';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.archive.length; i++) {
        for (j=0; j<columnContents.length; j++) {
            if (lzm_chatDisplay.mainTableColumns.archive[i].cid == columnContents[j].cid && lzm_chatDisplay.mainTableColumns.archive[i].display == 1) {
                archiveLineHtml += '<td style="white-space: nowrap">' + columnContents[j].contents + '</td>';
            }
        }
    }
    for (var i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        var myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111 && myCustomInput.display.archive) {
            var inputText = '';
            for (var j=0; j<aChat.cc.length; j++) {
                if (aChat.cc[j].cuid == myCustomInput.name) {
                    inputText = (myCustomInput.type != 'CheckBox') ? lzm_commonTools.htmlEntities(aChat.cc[j].text) :
                        (aChat.cc[j].text == 1) ? t('Yes') : t('No');
                }
                inputText = (inputText != '') ? inputText : '-';
            }
            archiveLineHtml += '<td>' + inputText + '</td>';
        }
    }
    archiveLineHtml += '</tr>';

    return archiveLineHtml;
};

ChatArchiveClass.prototype.createArchivePagingHtml = function(page, amount, amountPerPage) {
    var numberOfPages = Math.max(1, Math.ceil(amount / amountPerPage)), that = this;
    var pagingHtml = '<span id="archive-paging">';
    var leftDisabled = (page == 1) ? ' ui-disabled' : '';
    var rightDisabled = (page == numberOfPages) ? ' ui-disabled' : '';
    if (!isNaN(numberOfPages)) {
        pagingHtml += lzm_displayHelper.createButton('archive-page-all-backward', 'archive-list-page-button' + leftDisabled, 'pageArchiveList(1);', '', 'img/415-skip_backward.png', 'l',
            {'cursor': 'pointer', 'padding': '4px 15px'}) +
            lzm_displayHelper.createButton('archive-page-one-backward', 'archive-list-page-button' + leftDisabled, 'pageArchiveList(' + (page - 1) + ');', '', 'img/414-rewind.png', 'r',
                {'cursor': 'pointer', 'padding': '4px 15px'}) +
            '<span style="padding: 0px 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_displayHelper.createButton('archive-page-one-forward', 'archive-list-page-button' + rightDisabled, 'pageArchiveList(' + (page + 1) + ');', '', 'img/420-fast_forward.png', 'l',
                {'cursor': 'pointer', 'padding': '4px 15px'}) +
            lzm_displayHelper.createButton('archive-page-all-forward', 'archive-list-page-button' + rightDisabled, 'pageArchiveList(' + numberOfPages + ');', '', 'img/419-skip_forward.png', 'r',
                {'cursor': 'pointer', 'padding': '4px 15px'});
    }
    pagingHtml += '</span>';

    return pagingHtml;
};

ChatArchiveClass.prototype.createArchiveHeaderControls = function(page, amount, amountPerPage, totalAmount, filter, query) {
    var controlHtml = '', that = this;
    if ($(window).width() > 500) {
        controlHtml += '<span style="font-size: 11px; font-weight: normal; float: left; margin-top: 8px; margin-left: 6px;">';
        if (query != '' || filter != '012') {
            controlHtml += t('<!--total_amount--> total entries, <!--amount--> matching filter', [['<!--total_amount-->', totalAmount], ['<!--amount-->', amount]]);
        } else {
            controlHtml += t('<!--total_amount--> total entries, no filter selected', [['<!--total_amount-->', totalAmount]]);
        }
        controlHtml += '</span>';
    }
    var displayClearBtn = (query == '') ? 'none' : 'inline';
    controlHtml += lzm_displayHelper.createButton('archive-filter', '', 'openArchiveFilterMenu(event, \'' + filter + '\')', t('Filter'), 'img/103-options2.png', 'lr',
        {'margin-right': '8px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '', 10) +
        '<span>' +
        '<input placeholder="' + t('Search') + '" type="text" id="search-archive" value="' + query + '" data-role="none" />' +
        '<span id="clear-archive-search" style="margin-left: -2px; margin-right: 6px;' +
        ' background-image: url(\'js/jquery_mobile/images/icons-18-white.png\'); background-repeat: no-repeat;' +
        ' background-position: -73px -1px; border-radius: 9px; background-color: rgba(0,0,0,0.4); cursor: pointer;' +
        ' display: ' + displayClearBtn + ';">&nbsp;</span>' +
        '</span>';

    return controlHtml;
};

ChatArchiveClass.prototype.createMatchingChats = function(chatId) {
    var that = this;
    var matchingChatsHtml = '<div id="matching-chats-inner-div"><fieldset class="lzm-fieldset" data-role="none" id="matching-chats-inner">' +
        '<legend>' + t('Matching Chats') + '</legend>' +
        that.createArchiveHtml([], chatId, true) +
        '</fieldset></div>';

    return matchingChatsHtml;
};

ChatArchiveClass.prototype.sendChatTranscriptTo = function(chatId, dialogId) {
    var headerString = t('Send to');
    var bodyString = '<div id="send-transcript-placeholder" style="margin-top: 5px;"></div>';
    var footerString = lzm_displayHelper.createButton('send-transcript', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('cancel-transcript', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});

    var tabContentString = '<fieldset id="send-transcript-to-inner" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Email') + '</legend>' +
        '<label for="send-transcript-to-email" style="font-size: 12px;">' + t('Email addresses: (separate by comma)') + '</label><br />' +
        '<input type="text" data-role="none" id="send-transcript-to-email" class="lzm-text-input" style="margin-top: 5px;" />' +
        '</fieldset>';

    var dialogData = {};
    var myDialogId = (typeof dialogId != 'undefined' && dialogId != '') ? dialogId + '-transcript' : '';
    var showFullscreen = (typeof dialogId != 'undefined' && dialogId != '')
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'send-transcript-to', {}, {}, {}, {}, '', dialogData, true, showFullscreen, myDialogId);
    if (typeof dialogId != 'undefined' && dialogId != '') {
        $('#cancel-transcript').data('exit-to-dialog', dialogId);
    }
    lzm_displayHelper.createTabControl('send-transcript-placeholder', [{name: t('Email'), content: tabContentString}]);
    lzm_displayLayout.resizeSendTranscriptDialog();

    $('#send-transcript').click(function() {
        lzm_chatPollServer.pollServerSpecial({em: $('#send-transcript-to-email').val(), cid: chatId}, 'send-chat-transcript');
        $('#cancel-transcript').click();
    });

    $('#cancel-transcript').click(function() {
        var safedDialogId = (typeof $('#cancel-transcript').data('exit-to-dialog') != 'undefined') ? $('#cancel-transcript').data('exit-to-dialog') : '';
        $('#send-transcript-to-container').remove();
        if (safedDialogId != '') {
            lzm_displayHelper.maximizeDialogWindow(safedDialogId);
        }
    });
};
