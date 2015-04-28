/****************************************************************************************
 * LiveZilla ChatDisplayHelperClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatDisplayHelperClass() {
    this.browserName = '';
    this.browserVersion = '';
    this.browserMinorVersion = '';

    this.showBrowserNotificationTime = 0;
    this.showMinimizedDialogMenuButton = false;
}

ChatDisplayHelperClass.prototype.getMyObjectName = function() {
    for (var name in window) {
        if (window[name] == this) {
            return name;
        }
    }
    return '';
};

/*********************************************** Dialog functions **********************************************/
ChatDisplayHelperClass.prototype.createDialogWindow = function(headerString, bodyString, footerString, id,
                                                         defaultCss, desktopBrowserCss, mobileBrowserCss, appCss,
                                                         position, data, showMinimizeIcon, fullscreen, dialogId) {
    return lzm_commonDialog.createDialogWindow(headerString, bodyString, footerString, id, defaultCss, desktopBrowserCss,
        mobileBrowserCss, appCss, position, data, showMinimizeIcon, fullscreen, dialogId);
};

ChatDisplayHelperClass.prototype.removeDialogWindow = function(id) {
    lzm_commonDialog.removeDialogWindow(id);
};

ChatDisplayHelperClass.prototype.minimizeDialogWindow = function(dialogId, windowId, data, selectedView, showStoredIcon) {
    lzm_chatServerEvaluation.settingsDialogue = false;
    showStoredIcon = (typeof showStoredIcon != 'undefined') ? showStoredIcon : true;
    var img = 'img/', title = '', type = '';
    switch (windowId) {
        case 'change-password':
            img += '103-options2.png';
            title = t('Change Password');
            type = 'change-password';
            break;
        case 'translation-editor':
            img += '103-options2.png';
            title = t('Translation Editor');
            type = 'translation-editor';
            break;
        case 'user-settings-dialog':
            img += '103-options2.png';
            title = t('Options');
            type = 'settings';
            break;
        case 'chat-invitation':
            img += '632-skills.png';
            title = t('Chat Invitation');
            type = 'visitor-invitation';
            break;
        case 'qrd-add':
            img += '059-doc_new2.png';
            title = t('Add new Resource');
            type = 'add-resource';
            break;
        case 'qrd-edit':
            img += '048-doc_edit.png';
            title = t('Edit Resource');
            type = 'edit-resource';
            break;
        case 'qrd-preview':
            img += '078-preview.png';
            title = t('Preview Resource');
            type = 'preview-resource';
            break;
        case 'operator-forward-selection':
            img += '291-switch_to_employees.png';
            title = t('Forward chat to operator.');
            type = 'operator-invitation';
            break;
        case 'ticket-details':
            img += '023-email2.png';
            title = t('Ticket Details');
            type = 'ticket-details';
            break;
        case 'qrd-tree-dialog':
            img += '607-cardfile.png';
            title = t('Resources');
            type = 'qrd-tree';
            break;
        case 'email-list':
            img += '023-email4.png';
            title = t('Emails');
            type = 'email-list';
            break;
        case 'visitor-information':
            img += '287-users.png';
            title = t('Visitor Information');
            type = 'visitor-information';
            break;
        case 'matching-chats':
            img += '217-quote.png';
            title = t('Matching Chats');
            type = 'matching-chats';
            break;
        case 'filter-list':
        case 'visitor-filter':
            img += '103-options2.png';
            title = t('Filters');
            type = 'settings';
            break;
        case 'send-transcript-to':
            img += '217-quote.png';
            title = t('Send chat transcript');
            type = 'send-transcript';
            break;
    }
    if (typeof data['exceptional-img'] != 'undefined' && data['exceptional-img'] != '') {
        img = data['exceptional-img'];
    }
    lzm_chatDisplay.StoredDialogIds.push(dialogId);
    var domNode = $('#' + windowId + '-container').detach();
    lzm_chatDisplay.StoredDialogs[dialogId] = {'dialog-id': dialogId, 'window-id': windowId, 'content': domNode, 'data': data,
        'type': type, 'title': title, 'img': img, 'selected-view': selectedView, 'show-stored-icon': showStoredIcon};
    this.createMinimizedDialogsMenu();
    setViewSelectPanel2ImagesAndText();
    if (lzm_chatDisplay.selected_view == 'external') {
        lzm_chatDisplay.visitorDisplay.createVisitorList();
        selectVisitor(null, $('#visitor-list').data('selected-visitor'));
    }
    if (typeof data.reload != 'undefined') {
        lzm_chatPollServer.stopPolling();
        if ($.inArray('chats', data.reload) != -1) {
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
            lzm_chatPollServer.chatArchiveFilterExternal = '';
            lzm_chatPollServer.chatArchiveFilterGroup = '';
            lzm_chatPollServer.chatArchiveFilterInternal = '';
            lzm_chatPollServer.resetChats = true;
        }
        if ($.inArray('tickets', data.reload) != -1) {
            try {
                lzm_chatPollServer.ticketPage = window['tmp-ticket-values'].page;
                lzm_chatPollServer.ticketLimit = window['tmp-ticket-values'].limit;
                lzm_chatPollServer.ticketQuery = window['tmp-ticket-values'].query;
                lzm_chatPollServer.ticketFilter = window['tmp-ticket-values'].filter;
                lzm_chatPollServer.ticketSort = window['tmp-ticket-values'].sort;
            } catch(e) {
                lzm_chatPollServer.ticketPage = 1;
                lzm_chatPollServer.ticketLimit = 20;
                lzm_chatPollServer.ticketQuery = '';
                lzm_chatPollServer.ticketFilter = '012';
                lzm_chatPollServer.ticketSort = 'update';
            }
            lzm_chatPollServer.resetTickets = true;
        }
        lzm_chatPollServer.startPolling();
    }
};

ChatDisplayHelperClass.prototype.maximizeDialogWindow = function(dialogId) {
    var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
    if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
        saveChatInput(lzm_chatDisplay.active_chat_reco);
        removeEditor();
    }
    lzm_chatServerEvaluation.settingsDialogue = true;
    var i = 0;
    if ($.inArray(dialogId, lzm_chatDisplay.StoredDialogIds) != -1) {
        lzm_chatDisplay.selected_view = (lzm_chatDisplay.StoredDialogs[dialogId]['selected-view'] != '') ?
            lzm_chatDisplay.StoredDialogs[dialogId]['selected-view'] : lzm_chatDisplay.selected_view;
        if (lzm_chatDisplay.selected_view != 'qrd') {
            cancelQrdPreview();
            $('#qrd-tree-body').remove();
            $('#qrd-tree-footline').remove();
        }
        lzm_chatDisplay.toggleVisibility();
        lzm_chatDisplay.createViewSelectPanel(lzm_chatDisplay.firstVisibleView);
        if (lzm_chatDisplay.selected_view == 'external') {
            $('#visitor-list-table').remove();
        }
        lzm_chatDisplay.dialogData = lzm_chatDisplay.StoredDialogs[dialogId].data;
        var dialogWindowId = lzm_chatDisplay.StoredDialogs[dialogId]['window-id'];
        var dialogContainerHtml = '<div id="' + dialogWindowId + '-container" class="dialog-window-container"></div>';
        var dialogContent = lzm_chatDisplay.StoredDialogs[dialogId].content;
        $('#chat_page').append(dialogContainerHtml).trigger('create');
        $('#' + dialogWindowId + '-container').css(lzm_chatDisplay.dialogWindowContainerCss);
        $('#' + dialogWindowId + '-container').replaceWith(dialogContent);

        try {
            if (typeof lzm_chatDisplay.StoredDialogs[dialogId].data.editors != 'undefined') {
                for (i=0; i<lzm_chatDisplay.StoredDialogs[dialogId].data.editors.length; i++) {
                    var editorName = lzm_chatDisplay.StoredDialogs[dialogId].data.editors[i].instanceName;
                    var editorId = lzm_chatDisplay.StoredDialogs[dialogId].data.editors[i].id;
                    window[editorName] = new ChatEditorClass(editorId, lzm_chatDisplay.isMobile, lzm_chatDisplay.isApp, lzm_chatDisplay.isWeb);
                    window[editorName].init(lzm_chatDisplay.StoredDialogs[dialogId].data.editors[i].text, 'maximizeDialogWindow');
                }
            }
        } catch(e) {}
        if (lzm_chatDisplay.StoredDialogs[dialogId].data.reload != 'undefined') {
            lzm_chatPollServer.stopPolling();
            if ($.inArray('chats', lzm_chatDisplay.StoredDialogs[dialogId].data.reload) != -1) {
                var eId = (typeof lzm_chatDisplay.StoredDialogs[dialogId].data['visitor-id'] != 'undefined') ?
                    lzm_chatDisplay.StoredDialogs[dialogId].data['visitor-id'] : '';
                var gId = (typeof lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] != 'undefined' &&
                    lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] == 2 &&
                    typeof lzm_chatDisplay.StoredDialogs[dialogId].data['cp-id'] != 'undefined') ?
                    lzm_chatDisplay.StoredDialogs[dialogId].data['cp-id'] : '';
                var iId = (typeof lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] != 'undefined' &&
                    lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] == 0 &&
                    typeof lzm_chatDisplay.StoredDialogs[dialogId].data['cp-id'] != 'undefined') ?
                    lzm_chatDisplay.StoredDialogs[dialogId].data['cp-id'] : '';
                var chatType = (typeof lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] != 'undefined') ?
                    lzm_chatDisplay.StoredDialogs[dialogId].data['chat-type'] : '012';
                var chatFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
                window['tmp-chat-archive-values'] = {page: lzm_chatPollServer.chatArchivePage,
                    limit: lzm_chatPollServer.chatArchiveLimit, query: lzm_chatPollServer.chatArchiveQuery,
                    filter: lzm_chatPollServer.chatArchiveFilter};
                lzm_chatPollServer.chatArchivePage = 1;
                lzm_chatPollServer.chatArchiveLimit = 1000;
                lzm_chatPollServer.chatArchiveQuery = '';
                lzm_chatPollServer.chatArchiveFilter = '';
                lzm_chatPollServer.chatArchiveFilterExternal = eId;
                lzm_chatPollServer.chatArchiveFilterGroup = gId;
                lzm_chatPollServer.chatArchiveFilterInternal = iId;
                lzm_chatPollServer.resetChats = 0;

            }
            if ($.inArray('tickets', lzm_chatDisplay.StoredDialogs[dialogId].data.reload) != -1) {
                var cpId = (typeof lzm_chatDisplay.StoredDialogs[dialogId].data['visitor-id'] != 'undefined') ?
                    lzm_chatDisplay.StoredDialogs[dialogId].data['visitor-id'] : 'xxxxxxxxxx';
                var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
                window['tmp-ticket-values'] = {page: lzm_chatPollServer.ticketPage, limit: lzm_chatPollServer.ticketLimit,
                    query: lzm_chatPollServer.ticketQuery, filter: lzm_chatPollServer.ticketFilter,
                    sort: lzm_chatPollServer.ticketSort};
                lzm_chatPollServer.ticketPage = 1;
                lzm_chatPollServer.ticketLimit = 1000;
                lzm_chatPollServer.ticketQuery = cpId;
                lzm_chatPollServer.ticketFilter = '0123';
                lzm_chatPollServer.ticketSort = '';
                lzm_chatPollServer.resetTickets = true;
            }
            lzm_chatPollServer.startPolling();
        }
        delete lzm_chatDisplay.StoredDialogs[dialogId];
        var tmpStoredDialogIds = [];
        for (var j=0; j<lzm_chatDisplay.StoredDialogIds.length; j++) {
            if (dialogId != lzm_chatDisplay.StoredDialogIds[j]) {
                tmpStoredDialogIds.push(lzm_chatDisplay.StoredDialogIds[j])
            }
        }
        lzm_chatDisplay.StoredDialogIds = tmpStoredDialogIds;

        $('#minb-' + dialogId).remove();
        $('#usersettings-menu').css({'display': 'none'});
    }
    this.createMinimizedDialogsMenu();
    lzm_chatDisplay.createChatWindowLayout(true, true);
};

ChatDisplayHelperClass.prototype.showMinimizedDialogsMenu = function (hideOnly, e) {
    if (typeof e != 'undefined') {
        e.stopPropagation();
    }
    hideOnly = (typeof hideOnly != 'undefined') ? hideOnly : false;
    $('#userstatus-menu').css('display', 'none');
    $('#usersettings-menu').css('display', 'none');
    lzm_chatDisplay.showUserstatusHtml = false;
    lzm_chatDisplay.showUsersettingsHtml = false;
    if (!lzm_chatDisplay.showMinifiedDialogsHtml && !hideOnly) {
        lzm_chatDisplay.showMinifiedDialogsHtml = true;
        $('#minimized-window-list').css({display: 'block'});
        var leftMargin = Math.max(80, $('#minimized-window-menu').width() - 24);
        $('#minimized-window-button').css({'margin-left': leftMargin + 'px', 'background-color': '#e6e6e6'});
        $('#minimized-window-button-inner').css({'background-position': '-180px -1px'});
    } else {
        lzm_chatDisplay.showMinifiedDialogsHtml = false;
        $('#minimized-window-list').css({display: 'none'});
        $('#minimized-window-button').css({'background-color': '#e0e0e0'});
        $('#minimized-window-button-inner').css({'background-position': '-216px -1px'});
    }
};

ChatDisplayHelperClass.prototype.createMinimizedDialogsMenu = function () {
    lzm_chatDisplay.showMinifiedDialogsHtml = false;
    var showMinimizedDialogMenuButton = false;
    var menuListHtml = '<table>';
    for (var i=0; i<lzm_chatDisplay.StoredDialogIds.length; i++) {
        if (lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.StoredDialogIds[i]]['show-stored-icon']) {
            showMinimizedDialogMenuButton = true;
            var menuEntry = lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.StoredDialogIds[i]].title;
            if (typeof lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.StoredDialogIds[i]].data.menu != 'undefined') {
                menuEntry = lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.StoredDialogIds[i]].data.menu;
            }
            menuListHtml += '<tr onclick="maximizeDialogWindow(\'' + lzm_chatDisplay.StoredDialogIds[i] + '\');' +
                ' ' + this.getMyObjectName() + '.showMinimizedDialogsMenu(false, event);" class="cm-click"><td style="padding: 4px;">' +
                '<span style="background-position: left center; background-repeat: no-repeat; padding: 2px 0px 2px 20px;' +
                ' background-image: url(\'' + lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.StoredDialogIds[i]].img + '\');">' +
                menuEntry + '</span></td></tr>';
        }
    }
    menuListHtml += '</table>';
    $('#minimized-window-list').html(menuListHtml).trigger('create');
    var menuCss = {position: 'absolute', top: '0px', right: '60px', 'z-index': 1000};
    var menuListCss = {'background-color': '#e6e6e6', border: '1px solid #ccc', 'border-bottom-left-radius': '4px',
        padding: '2px', display: 'none'};
    var menuButtonCss = {width: '7px', height: '14px', 'background-color': '#E0E0E0', padding: '8px 17px 8px 6px', cursor: 'pointer',
        'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px', 'margin': '-1px 0px 0px 0px',
        'border-left': '1px solid #ccc', 'border-right': '1px solid #ccc', 'border-bottom': '1px solid #ccc'}
    $('#minimized-window-menu').css(menuCss);
    $('#minimized-window-list').css(menuListCss);
    $('#minimized-window-button').css(menuButtonCss);

    if (showMinimizedDialogMenuButton) {
        $('#minimized-window-menu').css({display: 'block'});
        if (!this.showMinimizedDialogMenuButton) {
            $('#minimized-window-button').css({'background-color': '#FFC673'});
            setTimeout(function() {
                $('#minimized-window-button').css({'background-color': '#E0E0E0'});
            }, 2000);
            this.showMinimizedDialogMenuButton = true;
        }
    } else {
        $('#minimized-window-menu').css({display: 'none'});
        this.showMinimizedDialogMenuButton = false;
    }

    var leftMargin = Math.max(80, $('#minimized-window-menu').width() - 24);
    $('#minimized-window-button').css({'margin-left': leftMargin + 'px'});

    var minBtnWidth = $('#minimized-window-button-inner').width();
    var minBtnHeight = $('#minimized-window-button-inner').height();
    var minBtnPadding = Math.floor((18-minBtnHeight)/2)+'px ' + Math.floor((18-minBtnWidth)/2)+'px ' + Math.ceil((18-minBtnHeight)/2)+'px ' + Math.ceil((18-minBtnWidth)/2)+'px';
    var menuButtonInnerCss = {'background-position': '-216px -1px', 'background-repeat': 'no-repeat',
        'background-image': 'url(\'js/jquery_mobile/images/icons-18-white.png\')', 'background-color': 'rgba(0,0,0,.4)',
        padding: minBtnPadding, 'border-radius': '9px'};
    $('#minimized-window-button-inner').css(menuButtonInnerCss);
};

/********************************************* Operator functions **********************************************/
ChatDisplayHelperClass.prototype.createAddToDynamicGroupHtml = function(id, browserId) {
    browserId = (typeof browserId != 'undefined') ? browserId : '';
    var groups = lzm_chatServerEvaluation.groups.getGroupList('name', false, true);
    var tableLines = '', addToChecked = '', addNewChecked = ' checked="checked"', firstGroupId = '';
    for (var i=0; i<groups.length; i++) {
        if (typeof groups[i].members != 'undefined' && $.inArray(id, groups[i].members) == -1) {
            tableLines += '<tr id="dynamic-group-line-' + groups[i].id + '" class="dynamic-group-line" style="cursor: pointer;"' +
                ' onclick="selectDynamicGroup(\'' + groups[i].id + '\');"><td>' + groups[i].name + '</td></tr>';
            addToChecked = ' checked="checked"';
            addNewChecked = '';
            firstGroupId = (firstGroupId == '') ? groups[i].id : firstGroupId;
        }
    }

    var disabledClass = (browserId == '') ? ' class="ui-disabled"' : '';
    var dynGroupHtml = '<fieldset data-role="none" id="add-to-group-form" class="lzm-fieldset"><legend>' + t('Add to existing group') + '</legend>' +
        '<input type="radio" name="add-group-type" id="add-to-existing-group" data-role="none"' + addToChecked + ' />' +
        '<label for="add-to-existing">' + t('Add to existing group') + '</label><br />' +
        '<div style="border: 1px solid #ccc; border-radius: 4px;" id="dynamic-group-table-div">' +
        '<table id="dynamic-group-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"' +
        ' data-selected-group="' + firstGroupId + '"><tbody>' + tableLines + '</tbody></table></div></fieldset>' +
        '<fieldset data-role="none" id="add-new-group-form" class="lzm-fieldset" style="margin-top: 5px;"><legend>' + t('Create new group') + '</legend>' +
        '<input type="radio" name="add-group-type" id="create-new-group" data-role="none"' + addNewChecked + ' />' +
        '<label for="create-new-group">' + t('Create new group for this user') + '</label><br />' +
        '<label for="new-group-name">' + t('Group name:') + '</label>' +
        '<input type="text" id="new-group-name" class="lzm-text-input" data-role="none" /><br />' +
        '</fieldset>' +
        '<fieldset data-role="none" id="add-persistent-member-form" class="lzm-fieldset" style="margin-top: 5px;"><legend>' + t('Persistent Member') + '</legend>' +
        '<div' + disabledClass + ' id="persistent-group-div"><input type="checkbox" id="persistent-group-member" data-role="none" />' +
        '<label for="persistent-group-member">' + t('Persistent Member') + '</label></div>' +
        '</fieldset>';
    return dynGroupHtml;
};

/************************************************* Other views  ************************************************/
ChatDisplayHelperClass.prototype.createViewSelectPanel = function(firstVisibleView, counter) {
    firstVisibleView = (typeof firstVisibleView != 'undefined') ? firstVisibleView : lzm_chatDisplay.firstVisibleView;
    counter = (typeof counter != 'undefined') ? counter : 0;
    var firstVisibleViewIndex, mychatsViewIndex, i, buttonBackground, selectButtonClass, buttonInnerText, buttonInnerStyle;
    var numberOfTextButtons = 0, numberOfIconsButtons = 0, minTextButtonWidth = 0, allViewSelectButtons = [], testHtml;
    var viewSelectArray = lzm_chatDisplay.viewSelectArray, totalWidth = lzm_chatDisplay.userControlPanelWidth + 2, numbersHtml = '';
    var visibleViewSelectButtons = [];
    lzm_chatDisplay.firstVisibleView = firstVisibleView;
    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -1000px; top: -1000px;' +
        ' width: 800px; height: 100px;"></div>').trigger('create');
    var testWidthContainer = $('#test-tab-width-container');

    // Create the button html strings
    for (i=0; i<viewSelectArray.length; i++) {
        if (viewSelectArray[i].id == firstVisibleView) {
            firstVisibleViewIndex = i;
        }
        if (viewSelectArray[i].id == 'mychats') {
            mychatsViewIndex = i;
        }
        if (viewSelectArray[i].icon != '') {
            numberOfIconsButtons++;
            buttonInnerStyle = ' padding-left: 10px; padding-right: 10px';
            buttonInnerText = '<span class="view-select-icon" style="background-image: url(\'' + viewSelectArray[i].icon + '\');' +
                '%IMAGEPADDING%">&nbsp;</span>';
        } else {
            numberOfTextButtons++;
            buttonInnerText = t(viewSelectArray[i].name) + '<!--numbers-->';
            buttonInnerStyle = ' %PADDING%';
        }
        var thisButtonHtml = '<span style="white-space: nowrap; padding-left: 1px; padding-right: 1px;' +
            ' background-color: %BUTTONBACKGROUND%; color: %BUTTONTEXT%"' +
            ' id="view-select-' + viewSelectArray[i].id + '" class="lzm-unselectable %BUTTONCLASS%%BORDERCLASS%"' +
            ' onclick="selectView(\'' + viewSelectArray[i].id + '\');"><span style="white-space: nowrap;' +
            buttonInnerStyle + '" class="view-select-button-inner">' + buttonInnerText + '</span></span>';
        if (viewSelectArray[i].id == 'tickets') {
            var numberOfUnreadTickets = (typeof lzm_chatDisplay.ticketGlobalValues.u != 'undefined') ? lzm_chatDisplay.ticketGlobalValues.u : 0;
            var numberOfEmails = (typeof lzm_chatDisplay.ticketGlobalValues.e != 'undefined') ? lzm_chatDisplay.ticketGlobalValues.e : 0;
            numbersHtml = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
                '<span style="font-weight: normal; font-size: 11px;">(' + numberOfUnreadTickets + '/' + numberOfEmails + ')</span>' :
                '(' + numberOfUnreadTickets + '/' + numberOfEmails + ')';
            thisButtonHtml = thisButtonHtml.replace(/<!--numbers-->/, '&nbsp;' + numbersHtml);
        } else if (viewSelectArray[i].id == 'mychats') {
            numbersHtml = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
                '<span style="font-weight: normal; font-size: 11px;">(' + lzm_chatDisplay.myChatsCounter + ')</span>' :
                '(' + lzm_chatDisplay.myChatsCounter + ')';
            thisButtonHtml = thisButtonHtml.replace(/<!--numbers-->/, '&nbsp;' + numbersHtml);
        } else if (viewSelectArray[i].id == 'archive') {
            numbersHtml = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
                '<span style="font-weight: normal; font-size: 11px;">(' + lzm_chatServerEvaluation.chatArchive.t + ')</span>' :
                '(' + lzm_chatServerEvaluation.chatArchive.t + ')';
            thisButtonHtml = thisButtonHtml.replace(/<!--numbers-->/, '&nbsp;' + numbersHtml);
        } else if (viewSelectArray[i].id == 'external') {
            numbersHtml = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
                '<span style="font-weight: normal; font-size: 11px;">(' + lzm_chatServerEvaluation.visitors.getActiveVisitorCount() + ')</span>' :
                '(' + lzm_chatServerEvaluation.visitors.getActiveVisitorCount() + ')';
            thisButtonHtml = thisButtonHtml.replace(/<!--numbers-->/, '&nbsp;' + numbersHtml);
        } else if (viewSelectArray[i].id == 'reports') {
            numbersHtml = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
                '<span style="font-weight: normal; font-size: 11px;">(' + lzm_chatServerEvaluation.reports.getTotal() + ')</span>' :
                '(' + lzm_chatServerEvaluation.reports.getTotal() + ')';
            thisButtonHtml = thisButtonHtml.replace(/<!--numbers-->/, '&nbsp;' + numbersHtml);
        }
        testHtml = thisButtonHtml.replace(/id="view-select-/, 'id="test-view-select-').
            replace(/class="view-select-button-inner/, 'class="test-view-select-button-inner').replace(/%BORDERCLASS%/, '').
            replace(/%PADDING%/, 'padding-left: 1px; padding-right: 1px').replace(/%IMAGEPADDING%/, '').
            replace(/%BUTTONBACKGROUND%/, '#8C8C8C').
            replace(/%BUTTONTEXT%/, '#FFFFFF').
            replace(/%BUTTONCLASS%/, 'view-select-button');
        testWidthContainer.html(testHtml);
        var thisButtonWidth = $('#test-view-select-' + viewSelectArray[i].id).width() + 2;// + 42;
        if (viewSelectArray[i].icon != '') {
            var thisButtonImageWidth = $('.test-view-select-button-inner').children('span').width();
            var thisButtonImageHeight = $('.test-view-select-button-inner').children('span').height();
            var thisButtonImagePadding = 'padding: ' + Math.floor((18 - thisButtonImageHeight) / 2) + 'px ' + Math.floor((18 - thisButtonImageWidth) / 2) + 'px ' +
                (18 - thisButtonImageHeight - Math.floor((18 - thisButtonImageHeight) / 2)) + 'px ' + (18 - thisButtonImageWidth - Math.floor((18 - thisButtonImageWidth) / 2)) + 'px';
            thisButtonHtml = thisButtonHtml.replace(/%IMAGEPADDING%/, thisButtonImagePadding);
        }
        minTextButtonWidth = Math.max(minTextButtonWidth, thisButtonWidth + 40);

        allViewSelectButtons.push({html: thisButtonHtml, width: thisButtonWidth, id: viewSelectArray[i].id, icon: viewSelectArray[i].icon});
        var showThisView = true;
        if (lzm_chatDisplay.showViewSelectPanel[viewSelectArray[i].id] == 0)
            showThisView = false;
        if (viewSelectArray[i].id == 'world' && lzm_chatServerEvaluation.crc3 != null && lzm_chatServerEvaluation.crc3[2] == '-2')
            showThisView = false;
        if (viewSelectArray[i].id == 'home' && (lzm_chatServerEvaluation.crc3 == null || lzm_chatServerEvaluation.crc3[1] == '-2'))
            showThisView = true;

        if (showThisView) {
            visibleViewSelectButtons.push({html: thisButtonHtml, width: thisButtonWidth, id: viewSelectArray[i].id, icon: viewSelectArray[i].icon});
        }

    }
    // Create the left arrow button html string
    var leftButton = '<span style="padding-left: 1px; padding-right: 1px;' +
        ' background-color: %BUTTONBACKGROUND%; color: %BUTTONTEXT%"' +
        ' id="view-select-left" class="lzm-unselectable %BUTTONCLASS% view-select-left"' +
        ' onclick="moveViewSelectPanel(\'left\');"><span style="padding-left: 10px; padding-right: 10px;" class="view-select-button-inner" id="view-select-inner-left">' +
        '<span class="view-select-arrow view-select-arrow-left" style="%PADDING%">&nbsp;</span></span></span>';
    testHtml = leftButton.replace(/id="view-select-left"/, 'id="test-view-select-left"').replace(/id="view-select-inner-left"/, 'id="test-view-select-inner-left"').
        replace(/%PADDING%/, 'padding-left: 9px; padding-right: 9px').
        replace(/%BUTTONBACKGROUND%/, '#8C8C8C').
        replace(/%BUTTONTEXT%/, '#FFFFFF').
        replace(/%BUTTONCLASS%/, 'view-select-button');
    testWidthContainer.html(testHtml);
    var leftButtonWidth = $('#test-view-select-left').width();
    var leftButtonImageWidth = $('#test-view-select-inner-left').children('span').width();
    var leftButtonImageHeight = $('#test-view-select-inner-left').children('span').height();
    var leftButtonImagePadding = 'padding: ' + Math.floor((18 - leftButtonImageHeight) / 2) + 'px ' + Math.floor((18 - leftButtonImageWidth) / 2) + 'px ' +
        (18 - leftButtonImageHeight - Math.floor((18 - leftButtonImageHeight) / 2)) + 'px ' + (18 - leftButtonImageWidth - Math.floor((18 - leftButtonImageWidth) / 2)) + 'px';
    leftButton = leftButton.replace(/%PADDING%/, leftButtonImagePadding);
    // Create the right arrow button html string
    var rightButton = '<span style="padding-left: 1px; padding-right: 1px;' +
        ' background-color: %BUTTONBACKGROUND%; color: %BUTTONTEXT%"' +
        ' id="view-select-right" class="lzm-unselectable %BUTTONCLASS% view-select-right"' +
        ' onclick="moveViewSelectPanel(\'right\');"><span style="padding-left: 10px; padding-right: 10px;" class="view-select-button-inner" id="view-select-inner-right">' +
        '<span class="view-select-arrow view-select-arrow-right" style="%PADDING%">&nbsp;</span></span><span>';
    testHtml = rightButton.replace(/id="view-select-right"/, 'id="test-view-select-right"').replace(/id="view-select-inner-right"/, 'id="test-view-select-inner-right"').
        replace(/%PADDING%/, 'padding-left: 9px; padding-right: 9px').
        replace(/%BUTTONBACKGROUND%/, '#8C8C8C').
        replace(/%BUTTONTEXT%/, '#FFFFFF').
        replace(/%BUTTONCLASS%/, 'view-select-button');
    testWidthContainer.html(testHtml);
    var rightButtonWidth = $('#test-view-select-right').width();
    var rightButtonImageWidth = $('#test-view-select-inner-right').children('span').width();
    var rightButtonImageHeight = $('#test-view-select-inner-right').children('span').height();
    var rightButtonImagePadding = 'padding: ' + Math.floor((18 - rightButtonImageHeight) / 2) + 'px ' + Math.floor((18 - rightButtonImageWidth) / 2) + 'px ' +
        (18 - rightButtonImageHeight - Math.floor((18 - rightButtonImageHeight) / 2)) + 'px ' + (18 - rightButtonImageWidth - Math.floor((18 - rightButtonImageWidth) / 2)) + 'px';
    rightButton = rightButton.replace(/%PADDING%/, rightButtonImagePadding);

    // Create the panel out of the visible buttons
    var buttonsInPanelFromHere = false, firstButtonInPanel = 0, chatButtonInPanel = 0, lastButtonInPanel = 0,
        lastTextButtonInPanel = 0, panelWidth = 0, iconButtonsCounter = 0, textButtonsCounter = 0;
    for (i=0; i<visibleViewSelectButtons.length; i++) {
        if (visibleViewSelectButtons[i].id == firstVisibleView) {
            buttonsInPanelFromHere = true;
            firstButtonInPanel = i;
        }
        if (visibleViewSelectButtons[i].id == 'mychats') {
            chatButtonInPanel = i;
        }
        if (buttonsInPanelFromHere && panelWidth + minTextButtonWidth < totalWidth) {
            if (visibleViewSelectButtons[i].icon != '') {
                panelWidth += 42;
                iconButtonsCounter++;
            } else {
                panelWidth += minTextButtonWidth;
                textButtonsCounter++;
                lastTextButtonInPanel = i;
            }
            lastButtonInPanel = i;
        }
    }
    panelWidth = 0;
    var viewSelectPanelHtml = '';
    for (i=firstButtonInPanel; i<=lastButtonInPanel; i++) {
        buttonBackground = (lzm_chatDisplay.chatsViewMarked && visibleViewSelectButtons[i].id == 'mychats') ? '#EDA148' :
            (lzm_chatDisplay.selected_view == visibleViewSelectButtons[i].id) ? '#5393c5' : '#8C8C8C';
        var buttonText = '#FFFFFF';
        selectButtonClass = (lzm_chatDisplay.chatsViewMarked && visibleViewSelectButtons[i].id == 'mychats') ? 'view-select-button-marked' :
            (lzm_chatDisplay.selected_view == visibleViewSelectButtons[i].id) ? 'view-select-button-selected' : 'view-select-button';
        var remainingPanelWidth = (firstButtonInPanel == 0 && lastButtonInPanel == visibleViewSelectButtons.length - 1) ? totalWidth :
            (firstButtonInPanel != 0 && lastButtonInPanel != visibleViewSelectButtons.length - 1) ? totalWidth - 84 : totalWidth - 42;
        var textButtonWidth = Math.round((remainingPanelWidth - (iconButtonsCounter * 42)) / textButtonsCounter);
        var lastButtonWidth = remainingPanelWidth - (iconButtonsCounter * 42) - (textButtonsCounter - 1) * textButtonWidth;
        var leftPadding = (i != lastTextButtonInPanel) ? Math.floor((textButtonWidth - visibleViewSelectButtons[i].width) / 2) :
            Math.floor((lastButtonWidth - visibleViewSelectButtons[i].width) / 2);
        var rightPadding = (i != lastTextButtonInPanel) ? Math.ceil((textButtonWidth - visibleViewSelectButtons[i].width) / 2) :
            Math.ceil((lastButtonWidth - visibleViewSelectButtons[i].width) / 2);
        var thisButtonPadding = 'padding-left: ' + leftPadding + 'px; padding-right: ' + rightPadding + 'px';
        var borderClass = (i == 0) ? ' view-select-left' : (i == visibleViewSelectButtons.length - 1) ? ' view-select-right' : '';
        thisButtonHtml = visibleViewSelectButtons[i].html.replace(/%BORDERCLASS%/, borderClass).replace(/%PADDING%/, thisButtonPadding).
            replace(/%BUTTONBACKGROUND%/, buttonBackground /*this.addBrowserSpecificGradient('', buttonBackground)*/).
            replace(/%BUTTONTEXT%/, buttonText).
            replace(/%BUTTONCLASS%/, selectButtonClass);
        viewSelectPanelHtml += thisButtonHtml;
    }
    // Add left button:
    buttonBackground = (chatButtonInPanel < firstButtonInPanel && lzm_chatDisplay.chatsViewMarked) ? '#EDA148' : '#8C8C8C';
    selectButtonClass = (chatButtonInPanel < firstButtonInPanel && lzm_chatDisplay.chatsViewMarked) ? 'view-select-button-marked' : 'view-select-button';
    leftButton = leftButton.replace(/%BUTTONBACKGROUND%/, buttonBackground).
        replace(/%BUTTONTEXT%/, buttonText).
        replace(/%BUTTONCLASS%/, selectButtonClass);
    // Add right button:
    buttonBackground = (chatButtonInPanel > lastButtonInPanel && lzm_chatDisplay.chatsViewMarked) ? '#EDA148' : '#8C8C8C';
    selectButtonClass = (chatButtonInPanel > lastButtonInPanel && lzm_chatDisplay.chatsViewMarked) ? 'view-select-button-marked' : 'view-select-button';
    rightButton = rightButton.replace(/%BUTTONBACKGROUND%/, buttonBackground).
        replace(/%BUTTONTEXT%/, buttonText).
        replace(/%BUTTONCLASS%/, selectButtonClass);
    viewSelectPanelHtml = (firstButtonInPanel != 0) ? leftButton + viewSelectPanelHtml : viewSelectPanelHtml;
    viewSelectPanelHtml = (lastButtonInPanel != visibleViewSelectButtons.length - 1) ? viewSelectPanelHtml + rightButton : viewSelectPanelHtml;

    $('#test-tab-width-container').remove();

    if (firstButtonInPanel > 0 && counter < 20 && iconButtonsCounter * 42 + (textButtonsCounter + 1) * (minTextButtonWidth) < totalWidth) {
        return this.createViewSelectPanel(lzm_chatDisplay.viewSelectArray[firstButtonInPanel - 1].id, counter + 1);
    }
    return viewSelectPanelHtml;
};

ChatDisplayHelperClass.prototype.createMainMenuPanel = function() {
    var statusIcon = lzm_commonConfig.lz_user_states[2].icon;
    for (var i=0; i<lzm_commonConfig.lz_user_states.length; i++) {
        if (lzm_commonConfig.lz_user_states[i].index == lzm_chatPollServer.user_status) {
            statusIcon = lzm_commonConfig.lz_user_states[i].icon;
        }
    }
    var panelHeight = 40, contentTop = Math.floor((panelHeight - 20) / 2);
    var panelHtml = '<div id="main-menu-panel-status" style="position: absolute; left: 0px; top: 0px; cursor: pointer; border-top-left-radius: inherit;' +
        ' width: 50px; height: ' + panelHeight + 'px; border-right: 1px solid #cccccc;" onclick="showUserStatusMenu(event); lzm_displayLayout.resizeMenuPanels();">' +
        '<div style="position: absolute; top: 0px; left: 0px; width: 50px; height: ' + (panelHeight - 1) + 'px;border-top: 1px solid #ffffff;' +
        ' border-radius: inherit; border-color: rgba(255,255,255,0.3);" id="main-menu-panel-status-inner">' +
        '<div id="main-menu-panel-status-icon" style="position: absolute; top: ' + contentTop + 'px; left: 15px; width: 20px;' +
        ' height: 20px; background-image: url(\'' + statusIcon + '\'); background-repeat: no-repeat;' +
        ' background-position: center;"></div></div></div>' +
        '<div id="main-menu-panel-settings" style="position: absolute; left: 51px; top: 0px; cursor: pointer;' +
        ' width: 150px; height: ' + panelHeight + 'px; border-right: 1px solid #cccccc;" onclick="showUserSettingsMenu(event); lzm_displayLayout.resizeMenuPanels();">' +
        '<div style="position: absolute; top: 0px; left: 0px; width: 50px; height: ' + (panelHeight - 1) + 'px;border-top: 1px solid #ffffff;' +
        ' border-radius: inherit; border-color: rgba(255,255,255,0.3);" id="main-menu-panel-settings-inner">' +
        '<div id="main-menu-panel-settings-text" style="position: absolute; top: ' + (contentTop + 1) + 'px; left: 10px; width: 110px;' +
        ' height: 20px; overflow: hidden; text-overflow:ellipsis; font-weight: bold; font-size: 16px;">' +
        lzm_chatDisplay.myName + '</div>' +
        '<div id="main-menu-panel-settings-icon" style="border-radius: 10px; background-color: rgba(0,0,0,0.4);' +
        ' background-image: url(\'img/jqm-down.png\'); background-repeat: no-repeat; background-position: center;' +
        ' position: absolute; top: ' + contentTop + 'px; width: 20px; height: 20px;"></div></div></div>' +
        '<div id="main-menu-panel-blank" style="position: absolute; left: 0px; top: 0px;' +
        ' width: 50px; height: ' + panelHeight + 'px;">' +
        '<div style="position: absolute; top: 0px; left: 0px; width: 50px; height: ' + (panelHeight - 1) + 'px; border-top: 1px solid #ffffff;' +
        ' border-radius: inherit; border-color: rgba(255,255,255,0.3);" id="main-menu-panel-blank-inner"></div></div>' +
        '<div id="main-menu-panel-whishlist" style="position: absolute; right: 0px; top: 0px; cursor: pointer; border-top-right-radius: inherit;' +
        ' width: 40px; height: ' + panelHeight + 'px; border-left: 1px solid #cccccc;" onclick="openLink(\'http://wishlistmobile.livezilla.net/\');">' +
        '<div style="position: absolute; top: 0px; left: 0px; width: 40px; height: ' + (panelHeight - 1) + 'px; border-top: 1px solid #ffffff;' +
        ' border-radius: inherit; border-color: rgba(255,255,255,0.3);" id="main-menu-panel-whishlist-inner">' +
        '<div id="main-menu-panel-whishlist-icon" style="position: absolute; top: ' + contentTop + 'px; left: 10px; width: 20px;' +
        ' height: 20px; background-image: url(\'img/jqm-plus.png\'); background-repeat: no-repeat; background-position: center;' +
        ' border-radius: 10px; background-color: rgba(0,0,0,0.4);"></div></div></div>';

    return panelHtml;
};

ChatDisplayHelperClass.prototype.fillColumnArray = function(table, type, columnArray) {
    var i = 0, newColumnArray = [];
    columnArray = (typeof columnArray != 'undefined') ? columnArray : [];
    if (type == 'general') {
        if (table == 'ticket' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [{cid: 'last_update', title: 'Last Update', display: 1, cell_id: 'ticket-sort-update',
                    cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer; background-image: url(\'img/sort_by_this.png\');' +
                        ' background-position: right center; background-repeat: no-repeat; padding-right: 25px;',
                    cell_onclick: 'sortTicketsBy(\'update\');'}, // t('Last Update')
                    {cid: 'date', title: 'Date', display: 1, cell_id: 'ticket-sort-date', cell_class: 'ticket-list-sort-column',
                        cell_style: 'cursor: pointer; background-image: url(\'img/sort_by_this.png\'); background-position: right center;' +
                            ' background-repeat: no-repeat; padding-right: 25px;', cell_onclick: 'sortTicketsBy(\'\');'}, // t('Date')
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1, cell_id: 'ticket-sort-wait',
                        cell_class: 'ticket-list-sort-column', cell_style: 'cursor: pointer; background-image: url(\'img/sort_by_this.png\');' +
                        ' background-position: right center; background-repeat: no-repeat; padding-right: 25px;',
                        cell_onclick: 'sortTicketsBy(\'wait\');'}, // t('Waiting Time')
                    {cid: 'ticket_id', title: 'Ticket ID', display: 1}, {cid: 'subject', title: 'Subject', display: 1}, // t('Ticket ID')
                    {cid: 'operator', title: 'Operator', display: 1}, {cid: 'name', title: 'Name', display: 1}, // t('Operator')
                    {cid: 'email', title: 'Email', display: 1}, {cid: 'company', title: 'Company', display: 1}, // t('Email')
                    {cid: 'group', title: 'Group', display: 1}, {cid: 'phone', title: 'Phone', display: 1}, // t('Group')
                    {cid: 'hash', title: 'Hash', display: 1}, {cid: 'callback', title: 'Callback', display: 1}, // t('Hash')
                    {cid: 'ip_address', title: 'IP address', display: 1}]; // t('IP address')
            }
        } else if (table == 'visitor' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [{cid: 'online', title: 'Online', display: 1}, // t('Online')
                    {cid: 'last_active', title: 'Last Activity', display: 1}, // t('Last Activity')
                    {cid: 'name', title: 'Name', display: 1}, {cid: 'country', title: 'Country', display: 1}, // t('Name'), t('Country')
                    {cid: 'language', title: 'Language', display: 1}, {cid: 'region', title: 'Region', display: 1}, // t('Language'), t('Region')
                    {cid: 'city', title: 'City', display: 1}, {cid: 'page', title: 'Page', display: 1}, // t('City'), t('Page')
                    {cid: 'search_string', title: 'Search string', display: 1}, {cid: 'host', title: 'Host', display: 1}, // t('Search string'), t('Host')
                    {cid: 'ip', title: 'IP address', display: 1}, {cid: 'email', title: 'Email', display: 1}, // t('IP address'), t('Email')
                    {cid: 'company', title: 'Company', display: 1}, {cid: 'browser', title: 'Browser', display: 1}, // t('Company'), t('Browser')
                    {cid: 'resolution', title: 'Resolution', display: 1}, {cid: 'os', title: 'Operating system', display: 1}, // t('Resolution'), t('Operating system')
                    {cid: 'last_visit', title: 'Last Visit', display: 1}, {cid: 'isp', title: 'ISP', display: 1}]; // t('Last Visit'), t('ISP')
            }
        } else if (table == 'archive' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [{cid: 'date', title: 'Date', display: 1}, {cid: 'chat_id', title: 'Chat ID', display: 1}, // t('Date'), t('Chat ID')
                    {cid: 'name', title: 'Name', display: 1}, {cid: 'operator', title: 'Operator', display: 1}, // t('Name'), t('Operator')
                    {cid: 'group', title: 'Group', display: 1}, {cid: 'email', title: 'Email', display: 1}, // t('Group'), t('Email')
                    {cid: 'company', title: 'Company', display: 1}, {cid: 'language', title: 'Language', display: 1}, // t('Company'), t('Language')
                    {cid: 'country', title: 'Country', display: 1}, {cid: 'ip', title: 'IP', display: 1}, // t('Country'), t('IP')
                    {cid: 'host', title: 'Host', display: 1}, {cid: 'duration', title: 'Duration', display: 1}, // t('Host'), t('Duration')
                    {cid: 'area_code', title: 'Area Code', display: 1}, {cid: 'page_url', title: 'Url', display: 1},
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1}, // t('Area Code'), t('Url'), t('Waiting Time')
                    {cid: 'result', title: 'Result', display: 1}, {cid: 'ended_by', title: 'Ended By', display: 1}, // t('Result'), t('Ended By')
                    {cid: 'callback', title: 'Callback', display: 1}, {cid: 'phone', title: 'Phone', display: 1}]; // t('Callback'), t('Phone')
            }
        } else if (table == 'allchats' && columnArray instanceof Array) {
            if (columnArray instanceof Array && columnArray.length == 0) {
                newColumnArray = [{cid: 'status', title: 'Status', display: 1}, // t('Status')
                    {cid: 'chat_id', title: 'Chat ID', display: 1}, {cid: 'type', title: 'Type', display: 1}, // t('Chat ID'), t('Type')
                    {cid: 'duration', title: 'Duration', display: 1}, {cid: 'start_time', title: 'Start Time', display: 1}, // t('Duration'), t('Start Time')
                    {cid: 'waiting_time', title: 'Waiting Time', display: 1}, {cid: 'name', title: 'Name', display: 1}, // t('Waiting Time'), t('Name')
                    {cid: 'question', title: 'Question', display: 1}, {cid: 'previous_chats', title: 'Previous Chats', display: 1}, // t('Question'), t('Previous Chats')
                    {cid: 'priority', title: 'Priority', display: 1}, {cid: 'group', title: 'Group', display: 1}, // t('Priority'), t('Group')
                    {cid: 'operators', title: 'Operator(s)', display: 1}, {cid: 'email', title: 'Email', display: 1}, // t('Operator(s)'), t('Email')
                    {cid: 'company', title: 'Company', display: 1}]; // t('Company')
            }
        } else {
            newColumnArray = (type == 'general') ? lzm_chatDisplay.mainTableColumns[table] : lzm_chatDisplay.mainTableColumns[table + '_custom'];
            for (i=0; i<newColumnArray.length; i++) {
                newColumnArray[i].display = columnArray[newColumnArray[i].cid];
            }
        }
        lzm_chatDisplay.mainTableColumns[table] = newColumnArray;
    } else {
        if (!(columnArray instanceof Array)) {
            for (var key in columnArray) {
                if (columnArray.hasOwnProperty(key)) {
                    newColumnArray.push({cid: key, display: columnArray[key]});
                }
            }
        }
        lzm_chatDisplay.mainTableColumns[table + '_custom'] = newColumnArray;
        for (i=0; i<newColumnArray.length; i++) {
            if (lzm_chatServerEvaluation.inputList.getCustomInput(newColumnArray[i].cid) != null) {
                var columnIsVisible = (newColumnArray[i].display == 1);
                lzm_chatServerEvaluation.inputList.setDisplay(newColumnArray[i].cid, table, columnIsVisible);
            }
        }
    }

};

ChatDisplayHelperClass.prototype.createGeotrackingFootline = function() {
    var blueButtonBackground = lzm_displayHelper.addBrowserSpecificGradient('', 'blue');
    var normalMapButtonCss = (lzm_chatGeoTrackingMap.selectedMapType == 'SMARTMAP') ?
        {'background-image': blueButtonBackground, color: '#ffffff', cursor: 'pointer'} : {cursor: 'pointer'};
    var satelliteMapButtonCss = (lzm_chatGeoTrackingMap.selectedMapType == 'SATELLITE') ?
    {'background-image': blueButtonBackground, color: '#ffffff', cursor: 'pointer'} : {cursor: 'pointer'};
    var disabledClass = ' ui-disabled', visitorId = '';
    if (lzm_chatGeoTrackingMap.selectedVisitor != null) {
        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(lzm_chatGeoTrackingMap.selectedVisitor);
        if (visitor != null) {
            disabledClass = '';
            visitorId = visitor.id;
        }
    }
    //showVisitorInfo(\'' + visitorId + '\')
    var gtFootlineHtml = '<span style="float: left;">' +
        this.createButton('smartmap-map', 'map-button map-type-button', 'setMapType(\'SMARTMAP\')', t('Normal'), '', 'lr',
            normalMapButtonCss, t('Normal map'), 12) +
        this.createButton('satellite-map', 'map-button map-type-button', 'setMapType(\'SATELLITE\')', t('Satellite'), '', 'lr',
            satelliteMapButtonCss, t('Satellite map'), 12) +
        this.createButton('map-visitor-info', 'map-button' + disabledClass, 'selectView(\'external\');showVisitorInfo(\'' + visitorId + '\');', '',
        'img/215-info.png', 'lr', {'padding-left': '10px', 'padding-right': '10px', cursor: 'pointer'}, t('Show visitor information')) +
        '</span><span>' +
        this.createButton('map-zoom-in', 'map-button', 'zoomMap(1)', '', 'img/087-zoom_in.png', 'lr',
            {'padding-left': '10px', 'padding-right': '10px', cursor: 'pointer'}, t('Zoom in')) +
        this.createButton('map-zoom-out', 'map-button', 'zoomMap(-1)', '', 'img/088-zoom_out.png', 'lr',
            {'padding-left': '10px', 'padding-right': '10px', 'margin-left': '5px', cursor: 'pointer'}, t('Zoom out')) +
        '</span>';

    return gtFootlineHtml;
};

ChatDisplayHelperClass.prototype.getChatPartner = function(chatPartner) {
    var chatPartnerName = '', chatPartnerUserId = '', i;
    if (typeof chatPartner != 'undefined' && chatPartner != '') {
        if (chatPartner.indexOf('~') != -1) {
            var visitor = lzm_chatServerEvaluation.visitors.getVisitor(chatPartner.split('~')[0]);
            for (var j=0; j<visitor.b.length; j++) {
                if (chatPartner.split('~')[1] == visitor.b[j].id) {
                    chatPartnerName = (visitor.b[j].cname != '') ?
                        visitor.b[j].cname : visitor.unique_name;
                }
            }
        } else {
            if (chatPartner == 'everyoneintern') {
                chatPartnerName = t('All operators');
                chatPartnerUserId = chatPartner;
            } else {
                var operator = lzm_chatServerEvaluation.operators.getOperator(chatPartner);
                var group = lzm_chatServerEvaluation.groups.getGroup(chatPartner);
                chatPartnerName = (operator != null) ? operator.name : (group != null) ? group.name : '';
                chatPartnerUserId = (operator != null) ? operator.userid : (group != null) ? group.id : '';
            }
        }
    } else {
        chatPartner = '';
    }
    if (chatPartnerName.length > 13) {
        chatPartnerName = chatPartnerName.substr(0,10) + '...';
    }

    return {name: chatPartnerName, userid: chatPartnerUserId};
};

/**************************************** Some general helper functions ****************************************/

ChatDisplayHelperClass.prototype.createInputControlPanel = function(mode, disabledClass) {
    disabledClass = (typeof disabledClass != 'undefined') ? disabledClass : '';
    var panelHtml = '';
    if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
        panelHtml += this.createButton('editor-bold-btn', disabledClass, 'lzm_chatInputEditor.bold();', '<span style="font-weight: bold;">B</span>', '', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '', -1) +
            this.createButton('editor-italic-btn', disabledClass, 'lzm_chatInputEditor.italic();', '<span style="font-style: italic;">I</span>', '', 'lr',
                {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '', -1) +
            this.createButton('editor-underline-btn', disabledClass, 'lzm_chatInputEditor.underline();', '<span style="text-decoration: underline;">U</span>', '', 'lr',
                {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '', -1);
    }
    if (mode != 'basic') {
        panelHtml +=  this.createButton('send-qrd', disabledClass, '', '', 'img/607-cardfile.png', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, t('Resources'));
    }

    return panelHtml;
};

ChatDisplayHelperClass.prototype.createButton = function(myId, myClass, myAction, myText, myIcon, myType, myCss, myTitle, myTextLength) {
    var showNoText = ($(window).width() < 500);
    myId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    myClass = (typeof myClass != 'undefined') ? myClass : '';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : '';
    myIcon = (typeof myIcon != 'undefined') ? myIcon : '';
    myType = (typeof myType != 'undefined') ? myType : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myTitle = (typeof myTitle != 'undefined') ? ' title="' + myTitle + '"' : '';
    myTextLength = (typeof myTextLength != 'undefined') ? myTextLength : 30;
    if (myTextLength > 4) {
        myText = (myText.length > myTextLength) ? myText.substr(0, myTextLength - 3) + '...' : myText;
    }
    var buttonCss = ' style=\'%IMAGE%';
    for (var cssTag in myCss) {
        if (myCss.hasOwnProperty(cssTag)) {
            buttonCss += ' ' + cssTag + ': ' + myCss[cssTag] + ';';
        }
    }
    buttonCss += '\'';

    switch (myType) {
        case 'l':
            myClass = myClass + ' chat-button-line chat-button-left';
            break;
        case 'r':
            myClass = myClass + ' chat-button-line chat-button-right';
            break;
        case 'm':
            myClass = myClass + ' chat-button-line';
            break;
        default:
            myClass = myClass + ' chat-button-line chat-button-left chat-button-right';
            break;
    }
    myClass += ' lzm-unselectable';
    myClass = (myClass.replace(/^ */, '') != '') ? ' class="' + myClass.replace(/^ */, '') +'"' : '';
    var buttonHtml = '';
    if (myIcon != '' && (myText == '' || showNoText)) {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-image: ' + this.addBrowserSpecificGradient('url("' + myIcon + '")') + '; background-position: center; background-repeat: no-repeat;') +
            myAction + '>&nbsp;&nbsp;</span>';
    } else if (myIcon != '' && (myText != '' && !showNoText)) {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-image: ' + this.addBrowserSpecificGradient('') + ';') +
            myAction + '><span style=\'background-image: ' + 'url("' + myIcon + '")' + '; background-repeat: no-repeat; ' +
            'background-position: left center; padding: 2px 0px 2px 20px;\'>' + myText + '</span></span>';
    } else {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-image: ' + this.addBrowserSpecificGradient('') + ';') + myAction + '>' +
            myText + '</span>';
    }

    return buttonHtml
};

ChatDisplayHelperClass.prototype.createInputMenu = function(replaceElement, inputId, inputClass, width, placeHolder, value, selectList, scrollParent, selectmenuTopCorrection) {
    scrollParent = (typeof scrollParent != 'undefined') ? scrollParent : 'NOPARENTGIVEN';
    selectmenuTopCorrection = (typeof selectmenuTopCorrection != 'undefined') ? selectmenuTopCorrection : 0;
    var widthString = (width != 0) ? ' width: ' + width + 'px;' : '';
    var inputMenu = '<span id="' + inputId + '-box" class="lzm-combobox ' + inputClass + '">' +
        '<input type="text" data-role="none" id="' +  inputId + '"' +
        ' style="padding: 0px; border: 0px;' + widthString + '" placeholder="' + placeHolder + '" value="' + value + '" />' +
        '<span id="' + inputId + '-menu"' +
        ' style=\'padding: 1px 9px 1px; background-image: url("img/sort_by_this.png");' +
        'background-repeat: no-repeat: background-position: center; cursor: pointer;\'></span>' +
        '</span>' +
        '<ul id="' + inputId + '-select" class="lzm-menu-select" style="display: none; border: 1px solid #ccc; border-radius: 4px;' +
        ' position: absolute; list-style: none; padding: 3px; margin: 0px; z-index: 2; background-color: #f9f9f9; line-height: 1.5;">';
    for (var i=0; i<selectList.length; i++) {
        var listValue = (selectList[i].constructor == Array) ? selectList[i][0] : selectList[i];
        inputMenu += '<li class="' + inputId + '-selectoption input-select-combo" style="cursor: default; position: relative;">' + listValue +
            '<span class="delete-menu-item" style="position: absolute; right: 2px; width: 16px; height: 16px;' +
            ' background-image: url(\'img/201-delete2.png\'); background-position: center; background-repeat: no-repeat;"' +
            ' onclick="deleteSalutationString(event, \'' + inputId + '\', \'' + listValue + '\');"></span></li>';
        /*background-color: #ffe1ff;
        float: right;
        width: 16px;
        height: 16px;
        background-image: url('img/jqm-cancel.png');
        background-position: center;
        background-repeat: no-repeat;*/
    }
    inputMenu += '</ul>';
    $('#' + replaceElement).html(inputMenu).trigger('create');
    var eltPos = $('#' + inputId + '-box').position();
    var eltWidth = $('#' + inputId + '-box').width();
    var eltHeight = $('#' + inputId + '-box').height();
    $('#' + inputId + '-select').css({
        left: Math.floor(eltPos.left + 2) + 'px',
        top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection) + 'px',
        width: Math.floor(eltWidth) + 'px'
    });

    $('#' + replaceElement).css({'line-height': 2.5, 'white-space': 'nowrap'});

    $('#' + inputId + '-menu').click(function(e) {
        if ($('#' + inputId + '-select').css('display') == 'block') {
            $('.lzm-menu-select').css('display', 'none');
            $('.lzm-menu-select').data('visible', false);
        } else {
            setTimeout(function() {
                $('.lzm-menu-select').css('display', 'none');
                $('.lzm-menu-select').data('visible', false);
                $('#' + inputId + '-select').css('display', 'block');
                $('#' + inputId + '-select').data('visible', true);
            }, 10);
            var scrollX = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollLeft : 0;
            var scrollY = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollTop : 0;
            $('#' + inputId + '-select').css({
                left: Math.floor(eltPos.left + 2 - scrollX) + 'px',
                top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection - scrollY) + 'px'
            });
        }
    });

    if ($('#' + scrollParent).length > 0) {
        $('#' + scrollParent).on('scrollstop', function() {
            if ($('#' + inputId + '-select').data('visible')) {
                var scrollX = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollLeft : 0;
                var scrollY = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollTop : 0;
                $('#' + inputId + '-select').css({
                    left: Math.floor(eltPos.left + 2 - scrollX) + 'px',
                    top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection - scrollY) + 'px',
                    display: 'block'
                });
            }
        });
        $('#' + scrollParent).on('scrollstart', function() {
            $('#' + inputId + '-select').css({display: 'none'});
        });
    }

    $('.' + inputId + '-selectoption').click(function(e) {
        $('#' + inputId).val($(this).html().replace(/<span class="delete-menu-item".*?span>/, ''));
        $('#' + inputId + '-select').css('display', 'none');
    });
    $('body').click(function() {
        if ($('#' + inputId + '-select').css('display') == 'block') {
            $('#' + inputId + '-select').css('display', 'none');
        }
    });

};

ChatDisplayHelperClass.prototype.createTabControl = function(replaceElement, tabList, selectedTab, placeHolderWidth) {
    var mySelectedTab = (typeof selectedTab != 'undefined' && selectedTab > -1 && selectedTab < tabList.length) ? Math.max(selectedTab, 0) : 0;
    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;
    placeHolderWidth = (typeof placeHolderWidth != 'undefined') ? placeHolderWidth : $('#' + replaceElement).parent().width();
    var allTabsWidth = 0, visibleTabsWidth = 0;
    var closedTabColor = '#E0E0E0';

    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -1000px; top: -1000px;' +
        ' width: 800px; height: 100px;"></div>').trigger('create');

    var tabRowHtml = '';
    var tabRowArray = [];
    var contentRowHtml = '';
    var tabsAreTooWide = false, tabsAreStillTooWide = false;
    var thisTabHtml = '', thisTabWidth = [], firstVisibleTab = 0, lastVisibleTab = 0;

    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> ... </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: inline; text-shadow: none;"> ... </span>';
    $('#test-tab-width-container').html(rightTabHtml).trigger('create');
    var rightTabWidth = $('#' + replaceElement + '-tab-more-right').width() + 22;
    $('#test-tab-width-container').html(leftTabHtml).trigger('create');
    var leftTabWidth = $('#' + replaceElement + '-tab-more-left').width() + 22;

    for (var i=0; i<tabList.length; i++) {
        var dataHash = (typeof tabList[i].hash != 'undefined') ? ' data-hash="' + tabList[i].hash + '"' : '';
        var tabName = (tabList[i].name.length <= 20) ? tabList[i].name : tabList[i].name.substr(0, 17) + '...';
        var tabBackgroundColor = (i != mySelectedTab) ? closedTabColor : '#f5f5f5';
        var tabBorderBottomColor = (i != mySelectedTab) ? '#ccc' : '#f5f5f5';
        var tabOpacity = (i != mySelectedTab) ? ' color: #666;' : '';
        thisTabHtml = '<span class="lzm-tabs ' + replaceElement + '-tab" id="' + replaceElement + '-tab-' + i + '" draggable="true"' +
            ' style="background-color: ' + tabBackgroundColor + '; display: %DISPLAY%; text-shadow: none; border-bottom: 1px solid ' + tabBorderBottomColor +
            tabOpacity + '" data-tab-no="' + i + '"' + dataHash + '>' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;
        if (allTabsWidth + thisTabWidth[i] > placeHolderWidth) {
            tabsAreTooWide = true;
            if (allTabsWidth + rightTabWidth > placeHolderWidth) {
                tabsAreStillTooWide = true;
            }
        }
        if (tabsAreTooWide) {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
            if (tabsAreStillTooWide) {
                var lastTabNo = tabRowArray.length -1;
                tabRowArray[lastTabNo] = tabRowArray[lastTabNo].replace(/inline/, 'none');
            }
        } else {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'inline');
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }

        tabRowArray.push(thisTabHtml);
        tabRowHtml += thisTabHtml;

        var displayString = (i == mySelectedTab) ? 'block' : 'none';
        contentRowHtml += '<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="border: 1px solid #ccc;' +
            ' border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-top-right-radius: 4px;' +
            ' padding: 8px; margin-top: 2px; display: ' + displayString + '; overflow: auto; background-color: #f5f5f5;"' + dataHash + '>' +
            tabList[i].content +
            '</div>';
    }

    tabRowHtml = tabRowArray.join('');
    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }
    if (tabsAreStillTooWide) {
        lastVisibleTab -= 1;
    }
    var tabString = '<div id="' + replaceElement + '-tabs-row" data-selected-tab="' + selectedTab + '">' + tabRowHtml + '</div>' + contentRowHtml;

    $('#test-tab-width-container').remove();
    $('#' + replaceElement).html(tabString).trigger('create');

    this.addTabControlEventHandler(replaceElement, tabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor);

    var moveRightCounter = Math.max(Math.min(selectedTab - lastVisibleTab, 10), 0);
    for (var j=0; j<moveRightCounter; j++) {
        $('#' + replaceElement + '-tab-more-right').click();
    }
};

ChatDisplayHelperClass.prototype.updateTabControl = function(replaceElement, oldTabList) {
    var selectedTab = $('#' + replaceElement + '-tabs-row').data('selected-tab');
    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;
    var i = 0, j = 0, existingTabsArray = [], existingTabsHashArray = [], newTabList = [], lzTabDoesExist = false;
    $('.' + replaceElement + '-tab').each(function() {
        var thisTabHash = $(this).data('hash'), thisTabNo = $(this).data('tab-no'), thisTabHtml = $(this).html();
        existingTabsArray.push({'tab-no': thisTabNo, hash: thisTabHash, html: thisTabHtml});
        existingTabsHashArray.push(thisTabHash);
        if (thisTabHash == 'lz') {
            lzTabDoesExist = true;
        }
    });
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash == 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
            selectedTab += 1;
        }
    }
    for (i=0; i<existingTabsArray.length; i++) {
        var tabWasRemoved = false;
        for (j=0; j<oldTabList.length; j++) {
            if (existingTabsArray[i].hash == oldTabList[j].hash && oldTabList[j].action == 0) {
                tabWasRemoved = true;
                selectedTab = (selectedTab < i) ? selectedTab : (selectedTab > i) ? selectedTab - 1 : 0;
            }
        }
        if (!tabWasRemoved) {
            newTabList.push({name: existingTabsArray[i].html, hash: existingTabsArray[i].hash, content: null});
        }
    }
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash != 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
        }
    }

    var mySelectedTab = Math.max(selectedTab, 0);
    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -2000px; top: -2000px;' +
        ' width: 1800px; height: 100px;"></div>').trigger('create');
    var placeHolderWidth = $('#' + replaceElement).parent().width();
    var thisTabHtml = '', tabsAreTooWide = false, allTabsWidth = 0, lastVisibleTab = 0, tabRowHtml = '', thisTabWidth = [],
        firstVisibleTab = 0, visibleTabsWidth = 0, closedTabColor = '#E0E0E0';
    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> ... </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: inline; text-shadow: none;"> ... </span>';
    $('#test-tab-width-container').html(leftTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var leftTabWidth = $('#' + replaceElement + '-test-tab-more-left').width() + 22;
    $('#test-tab-width-container').html(rightTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var rightTabWidth = $('#' + replaceElement + '-test-tab-more-right').width() + 22;
    for (i=0; i<newTabList.length; i++) {
        var tabName = (newTabList[i].name.length <= 20) ? newTabList[i].name : newTabList[i].name.substr(0, 17) + '...';
        var tabBackgroundColor = (i != mySelectedTab) ? closedTabColor : '#f5f5f5';
        var tabBorderBottomColor = (i != mySelectedTab) ? '#ccc' : '#f5f5f5';
        var tabOpacity = (i != mySelectedTab) ? ' color: #666;' : '';
        thisTabHtml = '<span class="lzm-tabs ' + replaceElement + '-tab" id="' + replaceElement + '-tab-' + i + '" draggable="true"' +
            ' style="background-color: ' + tabBackgroundColor + '; display: %DISPLAY%; text-shadow: none; border-bottom: 1px solid ' + tabBorderBottomColor +
            tabOpacity + '" data-tab-no="' + i + '" data-hash="' + newTabList[i].hash + '">' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;
        if (allTabsWidth + thisTabWidth[i] > placeHolderWidth) {
            tabsAreTooWide = true;
        }
        if (tabsAreTooWide) {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
        } else {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'inline');
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }
        tabRowHtml += thisTabHtml;
    }
    $('#test-tab-width-container').remove();


    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }
    $('#' + replaceElement + '-tabs-row').html(tabRowHtml).trigger('create');

    $('.' + replaceElement + '-content').css('display', 'none');
    for (i=0; i<existingTabsArray.length; i++) {
        $('#' + replaceElement + '-content-' + existingTabsArray[i]['tab-no']).attr('id', replaceElement + '-content-' + existingTabsArray[i].hash);
    }
    var lastVisibleElement = replaceElement + '-tabs-row';
    for (i=0; i<newTabList.length; i++) {
        if (newTabList[i].content == null) {
            $('#' + replaceElement + '-content-' + newTabList[i].hash).attr('id', replaceElement + '-content-' + i);
            lastVisibleElement = replaceElement + '-content-' + i;
        } else {
            $('#' + lastVisibleElement).after('<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="border: 1px solid #ccc;' +
            ' border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-top-right-radius: 4px;' +
            ' padding: 8px; margin-top: 2px; display: none; overflow: auto; background-color: #f5f5f5;" data-hash="' + newTabList[i].hash + '"></div>');
            lastVisibleElement = replaceElement + '-content-' + i;
            $('#' + lastVisibleElement).html(newTabList[i].content).css('display', 'none');
        }
    }
    $('#' + replaceElement + '-content-' + mySelectedTab).css('display', 'block');
    $('#' + replaceElement + '-tabs-row').data('selected-tab', selectedTab);

    this.addTabControlEventHandler(replaceElement, newTabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor);
};

ChatDisplayHelperClass.prototype.addTabControlEventHandler = function(replaceElement, tabList, firstVisibleTab, lastVisibleTab,
                                                                      thisTabWidth, leftTabWidth, rightTabWidth,
                                                                      visibleTabsWidth, placeHolderWidth, closedTabColor) {
    for (i=0; i<tabList.length; i++) {
        $('#' + replaceElement + '-tab-' + i).click(function() {
            var tabNo = parseInt($(this).data('tab-no'));
            $('.' + replaceElement + '-tab').css({'background-color': closedTabColor});
            $('.' + replaceElement + '-tab').css({'color': '#666'});
            $('.' + replaceElement + '-tab').css({'border-bottom': '1px solid #ccc'});
            $('#' + replaceElement + '-tab-' + tabNo).css({'background-color': '#f5f5f5'});
            $('#' + replaceElement + '-tab-' + tabNo).css({'color': '#333'});
            $('#' + replaceElement + '-tab-' + tabNo).css({'border-bottom': '1px solid #f5f5f5'});
            $('.' + replaceElement + '-content').css({display: 'none'});
            $('#' + replaceElement + '-content-' + tabNo).css({display: 'block'});
            $('#' + replaceElement + '-tabs-row').data('selected-tab', tabNo);
        });
        try {
            $('#' + replaceElement + '-tab-' + i)[0].addEventListener('dragstart', function(e) {
                e.preventDefault();
            });
        } catch(e) {}
    }
    $('#' + replaceElement + '-tab-more-right').click(function() {
        var counter = 0;
        var extraTabWidth = rightTabWidth;
        if (lastVisibleTab < tabList.length - 1) {
            $('#' + replaceElement + '-tab-' + firstVisibleTab).css('display', 'none');
            firstVisibleTab++;
            $('#' + replaceElement + '-tab-' + (lastVisibleTab + 1)).css('display', 'inline');
            lastVisibleTab++;
            visibleTabsWidth = 0;
            for (var j=firstVisibleTab; j<lastVisibleTab + 1; j++) {
                visibleTabsWidth += thisTabWidth[j];
            }
            $('#' + replaceElement + '-tab-more-left').css('display', 'inline');
            while (visibleTabsWidth + rightTabWidth + leftTabWidth > placeHolderWidth && counter < 10) {
                counter++;
                $('#' + replaceElement + '-tab-' + firstVisibleTab).css('display', 'none');
                visibleTabsWidth -= thisTabWidth[firstVisibleTab];
                firstVisibleTab++;
            }
            if (lastVisibleTab == tabList.length - 1) {
                $('#' + replaceElement + '-tab-more-right').css('display', 'none');
                extraTabWidth = 0;
            }
            counter = 0;
            while (visibleTabsWidth + thisTabWidth[firstVisibleTab - 1] + leftTabWidth + extraTabWidth < placeHolderWidth && counter < 10) {
                counter++;
                firstVisibleTab--;
                $('#' + replaceElement + '-tab-' + (firstVisibleTab)).css('display', 'inline');
                visibleTabsWidth += thisTabWidth[firstVisibleTab];
            }
        }
        //$('#' + replaceElement + '-tab-' + lastVisibleTab).click();
    });
    try {
        $('#' + replaceElement + '-tab-more-right')[0].addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    } catch(e) {}
    $('#' + replaceElement + '-tab-more-left').click(function() {
        var counter = 0;
        var extraTabWidth = leftTabWidth;
        if (firstVisibleTab > 0) {
            $('#' + replaceElement + '-tab-' + (firstVisibleTab - 1)).css('display', 'inline');
            firstVisibleTab--;
            $('#' + replaceElement + '-tab-' + lastVisibleTab).css('display', 'none');
            lastVisibleTab--;
            visibleTabsWidth = 0;
            for (var j=firstVisibleTab; j<lastVisibleTab + 1; j++) {
                visibleTabsWidth += thisTabWidth[j];
            }
            $('#' + replaceElement + '-tab-more-right').css('display', 'inline');
            while (visibleTabsWidth + rightTabWidth + leftTabWidth > placeHolderWidth && counter < 10) {
                counter++;
                $('#' + replaceElement + '-tab-' + lastVisibleTab).css('display', 'none');
                visibleTabsWidth -= thisTabWidth[lastVisibleTab];
                lastVisibleTab--;
            }
            if (firstVisibleTab == 0) {
                $('#' + replaceElement + '-tab-more-left').css('display', 'none');
                extraTabWidth = 0;
            }
            counter = 0;
            while (visibleTabsWidth + thisTabWidth[lastVisibleTab + 1] + rightTabWidth  + extraTabWidth < placeHolderWidth && counter < 10) {
                counter++;
                lastVisibleTab++;
                $('#' + replaceElement + '-tab-' + (lastVisibleTab)).css('display', 'inline');
                visibleTabsWidth += thisTabWidth[lastVisibleTab];
            }
        }
        //$('#' + replaceElement + '-tab-' + firstVisibleTab).click();
    });
    try {
        $('#' + replaceElement + '-tab-more-left')[0].addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    } catch(e) {}
};

ChatDisplayHelperClass.prototype.addBrowserSpecificGradient = function(imageString, color) {
    var a, b;
    switch (color) {
        case 'darkorange':
            a = '#FDB867';
            b = '#EDA148';
            break;
        case 'orange':
            a = '#FFCC73';
            b = '#FDB867';
            break;
        case 'darkgray':
            a = '#F6F6F6';
            b = '#E0E0E0';
            break;
        case 'blue':
            a = '#5393c5';
            b = '#6facd5';
            break;
        case 'background':
            a = '#e9e9e9';
            b = '#dddddd';
            break;
        case 'darkViewSelect':
            a = '#999999';
            b = '#797979';
            break;
        case 'selectedViewSelect':
            a = '#6facd5';
            b = '#5393c5';
            break;
        case 'tabs':
            a = '#d9d9d9';
            b = '#898989';
            break;
        default:
            a = '#FFFFFF';
            b = '#F1F1F1';
            break;
    }
    var gradientString = imageString;
    var cssTag = '';
    switch (this.browserName) {
        case 'ie':
            cssTag = '-ms-linear-gradient';
            break;
        case 'safari':
            cssTag = '-webkit-linear-gradient';
            break;
        case 'chrome':
            if (this.browserVersion >= 25)
                cssTag = 'linear-gradient';
            else
                cssTag = '-webkit-linear-gradient';
            break;
        case 'opera':
            cssTag = '-o-linear-gradient';
            break;
        case 'mozilla':
            cssTag = '-moz-linear-gradient';
            break;
        default:
            cssTag = 'linear-gradient';
            break;
    }
    if ((this.browserName == 'ie' && this.browserVersion >= 10) ||
        (this.browserName == 'chrome' && this.browserVersion >= 18) ||
        (this.browserName == 'safari' && this.browserVersion >= 5) ||
        (this.browserName == 'opera' && this.browserVersion >= 12) ||
        (this.browserName == 'mozilla' && this.browserVersion >= 10)){
        switch (imageString) {
            case '':
                gradientString = cssTag + '(' + a + ',' + b + ')';
                break;
            case 'text':
                gradientString = 'background-image: ' + cssTag + '(' + a + ',' + b + ')';
                break;
            default:
                gradientString += ', ' + cssTag + '(' + a + ',' + b + ')';
                break;
        }
    }
    return gradientString
};

ChatDisplayHelperClass.prototype.getScrollBarWidth = function() {
    var htmlString = '<div id="get-scrollbar-width-div" style="position: absolute; left: 0px; top: -9999px;' +
        'width: 100px; height:100px; overflow-y:scroll;"></div>';
    $('body').append(htmlString).trigger('create');
    var getScrollbarWidthDiv = $('#get-scrollbar-width-div');
    var scrollbarWidth = getScrollbarWidthDiv[0].offsetWidth - getScrollbarWidthDiv[0].clientWidth;
    getScrollbarWidthDiv.remove();

    return scrollbarWidth;
}

ChatDisplayHelperClass.prototype.getScrollBarHeight = function() {
    var htmlString = '<div id="get-scrollbar-height-div" style="position: absolute; left: 0px; top: -9999px;' +
        'width: 100px; height:100px; overflow-x:scroll;"></div>';
    $('body').append(htmlString).trigger('create');
    var getScrollbarHeightDiv = $('#get-scrollbar-height-div');
    var scrollbarHeight = getScrollbarHeightDiv[0].offsetHeight - getScrollbarHeightDiv[0].clientHeight;
    getScrollbarHeightDiv.remove();

    return scrollbarHeight;
};

ChatDisplayHelperClass.prototype.checkIfScrollbarVisible = function(id, position) {
    position = (typeof position != 'undefined') ? position : 'vertical';
    var myElement = $('#' + id);
    var padding;
    if (position == 'vertical') {
        padding = parseInt($(myElement).css('padding-top')) + parseInt($(myElement).css('padding-bottom'));
    } else {
        padding = parseInt($(myElement).css('padding-right')) + parseInt($(myElement).css('padding-left'));
    }
    try {
        if (position == 'vertical') {
            return (myElement[0].scrollHeight > (myElement.height() + padding));
        } else {
            return (myElement[0].scrollWidth > (myElement.width() + padding));
        }
    } catch(e) {
        return false;
    }
};

ChatDisplayHelperClass.prototype.replaceSmileys = function(text) {
    var previousSigns = [{pt: ' ', rp: ' '}, {pt: '>', rp: '>'}, {pt: '&nbsp;', rp: '&nbsp;'}, {pt: '^', rp: ''}];
    var shorts = [':-)','::smile',':)',':-(','::sad',':(',':-]','::lol',';-)','::wink',';)',
        ':\'-(','::cry',':-O','::shocked',':-\\\\','::sick',':-p','::tongue',':-P',':?','::question','8-)',
        '::cool','zzZZ','::sleep',':-|','::neutral'];
    var images = ["smile","smile","smile","sad","sad","sad","lol","lol","wink","wink","wink","cry","cry",
        "shocked","shocked","sick","sick","tongue","tongue","tongue","question","question","cool","cool","sleep",
        "sleep","neutral","neutral"];
    for (var i=0; i<previousSigns.length; i++) {
        for (var j=0; j<shorts.length; j++) {
            var myRegExp = new RegExp(previousSigns[i].pt + RegExp.escape(shorts[j]), 'g');
            var rplString = previousSigns[i].rp + '<span style="padding:3px 10px 2px 10px;' +
                ' background: url(\'../images/smilies/' + images[j] + '.gif\'); background-position: center;' +
                ' background-repeat: no-repeat;">&nbsp;</span>';
            text = text.replace(myRegExp, rplString);
        }
    }
    return text;
};

ChatDisplayHelperClass.prototype.showBrowserNotification = function(params) {
    var thisClass = this;
    params = (typeof  params != 'undefined') ? params : {};
    if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - this.showBrowserNotificationTime > 10000) {
        this.showBrowserNotificationTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        var text = (typeof params.text != 'undefined') ? params.text : '';
        text = (text.length > 71) ? text.substr(0, 68) + '...' : text;
        var subject = (typeof params.subject != 'undefined') ? params.subject : '';
        var onclickAction = (typeof params.action != 'undefined' && params.action != '') ?
            ' onclick="' + params.action + '; ' + this.getMyObjectName() + '.removeBrowserNotification();"' : '';
        var notificationHtml = '<div id="browser-notification" class="lzm-notification"' + onclickAction + '>' +
            '<div id="browser-notification-body" class="lzm-notification-body">' +
            '<p style="font-weight: bold;">' + subject + '</p>' +
            '<p>' + text + '</p>' +
            '</div>' +
            '<div id="close-notification" class="lzm-notification-close" onclick="' + this.getMyObjectName() + '.removeBrowserNotification(event);"></div>' +
            '</div>';
        $('body').append(notificationHtml);

        if (typeof params.timeout == 'number' && params.timeout > 0) {
            setTimeout(function() {thisClass.removeBrowserNotification();}, params.timeout * 1000);
        }
    }
};

ChatDisplayHelperClass.prototype.removeBrowserNotification = function(e) {
    if (typeof e != 'undefined' && e != null) {
        e.stopPropagation();
    }
    $('#browser-notification').remove();
};

ChatDisplayHelperClass.prototype.blockUi = function(params) {
    var that = this;
    if ($('#lzm-alert-dialog-container').length == 0) {
        this.unblockUi();
        var rd = Math.floor(Math.random() * 9999);
        params.message = (typeof params.message != 'undefined') ? params.message : '';
        var myHeight = $(window).height();
        var myWidth = $(window).width();
        var messageWidth = Math.min(500, Math.floor(0.9 * myWidth)) - 80;

        var blockHtml = '<div class="lzm-block" id="lzm-block-' + rd + '"' +
            ' style="position: absolute; top: 0px; left: 0px; width: ' + myWidth + 'px; height: ' + myHeight + 'px;' +
            ' z-index: 2147483647; background-color: rgba(0,0,0,0.7); overflow-y: auto;">';
        if (params.message != null) {
            blockHtml += '<div class="lzm-block-message" id="lzm-block-message-' + rd + '"' +
                ' style="background-color: #f1f1f1; position: absolute; padding: 20px; border: 5px solid #aaa;' +
                ' border-radius: 4px; width: ' + messageWidth + 'px; overflow: hidden;">' + params.message +
                '</div>';
        }
        blockHtml += '</div>';
        $('body').append(blockHtml);

        if (params.message != null) {
            var messageHeight = $('#lzm-block-message-' + rd).height();
            var messageLeft = Math.max(20, Math.floor((myWidth - messageWidth - 50) / 2));
            var messageTop = Math.max(20, Math.floor((myHeight - messageHeight - 50) / 2));
            $('#lzm-block-message-' + rd).css({left: messageLeft+'px', top: messageTop+'px'});
        }
    } else {
        setTimeout(function() {
            that.blockUi(params);
        }, 500);
    }

};

ChatDisplayHelperClass.prototype.unblockUi = function() {
    $('.lzm-block').remove();
};
