/****************************************************************************************
 * LiveZilla ChatSettingsClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatSettingsClass() {
    this.userManagementDialogTitle = '';
    this.userManagementAction = 'list';
}

ChatSettingsClass.prototype.manageUsersettings = function() {
    this.createUsersettingsManagement();
    var viewId = '', viewArray = [], that = this;
    $('.show-view-div').each(function() {
        viewArray.push($(this).data('view-id'));
    });
    viewId = $('.show-view-div:first').data('view-id');
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId);
    });
    $('.settings-placeholder-tab').click(function() {
        lzm_displayLayout.resizeOptions();
    });
    $('.position-change-buttons-up').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
};

ChatSettingsClass.prototype.createUsersettingsManagement = function() {
    var thisClass = this;
    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');

    var headerString = t('Client configuration');
    var bodyString = '<div id="settings-container" style="margin-top: 5px;">' +
        '<div id="settings-placeholder"></div></div>';

    var settingsTabList = this.createSettingsHtml();
    var footerString = lzm_displayHelper.createButton('save-usersettings', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px'})  +
        lzm_displayHelper.createButton('cancel-usersettings', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '6px'});

    var dialogData = {};
    if (lzm_chatDisplay.selected_view == 'mychats' && lzm_chatDisplay.active_chat_reco != '') {
        var thisChatPartner = lzm_displayHelper.getChatPartner(lzm_chatDisplay.active_chat_reco);
        dialogData = {'chat-partner': lzm_chatDisplay.active_chat_reco, 'chat-partner-name': thisChatPartner['name'],
            'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'user-settings-dialog', {}, {}, {}, {}, '', dialogData, true, false);
    lzm_displayHelper.createTabControl('settings-placeholder', settingsTabList);
    lzm_displayLayout.resizeOptions();

    $('#background-mode').change(function() {
        if ($('#background-mode').attr('checked') == 'checked') {
            $('#save-connections-div').removeClass('ui-disabled');
        } else {
            $('#save-connections-div').addClass('ui-disabled');
            if ($('#save-connections').attr('checked') == 'checked') {
                $('#save-connections').click();
            }
        }
    });
    $('#save-usersettings').click(function () {
        saveUserSettings();
        $('#cancel-usersettings').click();
    });
    $('#cancel-usersettings').click(function() {
        lzm_displayHelper.removeDialogWindow('user-settings-dialog');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelUserSettings', lzm_chatDisplay.active_chat_reco);
        }
    });
};

ChatSettingsClass.prototype.createSettingsHtml = function() {
    var i;
    if (lzm_chatDisplay.playNewTicketSound == '-') {
        lzm_commonStorage.loadProfileData();
        for (i=0; i<lzm_commonStorage.storageData.length; i++) {
            if (lzm_commonStorage.storageData[i].index == chosenProfile['index']) {
                try {
                    lzm_chatDisplay.playNewTicketSound = lzm_commonStorage.loadValue('play_incoming_ticket_sound_' + chosenProfile['index']);
                } catch(e) {}
            }
        }
    }

    var newMessageSoundChecked = (lzm_chatDisplay.playNewMessageSound == 1) ? ' checked="checked"' : '';
    var newChatSoundChecked = (lzm_chatDisplay.playNewChatSound == 1) ? ' checked="checked"' : '';
    var repeatChatSoundChecked = (lzm_chatDisplay.repeatNewChatSound == 1) ? ' checked="checked"' : '';
    var backgroundModeChecked = (lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var ticketReadStatusChecked = (lzm_chatDisplay.ticketReadStatusChecked != 0) ? ' checked="checked"' : '';
    var saveConnectionsChecked = (lzm_chatDisplay.saveConnections != 0 && lzm_chatDisplay.backgroundModeChecked != 0) ? ' checked="checked"' : '';
    var saveConnectionsDisabled = (lzm_chatDisplay.backgroundModeChecked != 1) ? ' class="ui-disabled"' : '';
    var newTicketSoundChecked = (lzm_chatDisplay.playNewTicketSound == 1) ? ' checked="checked"' : '';
    var vibrateNotificationsChecked = (lzm_chatDisplay.vibrateNotifications == 1) ? ' checked="checked"' : '';
    var autoAcceptDisabledClass = (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) &&
        !lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {})) ? '' : ' class="ui-disabled"';
    var autoAcceptChat = ((lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'can_auto_accept', {}) &&
        lzm_chatDisplay.autoAcceptChecked == 1) ||
        lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'chats', 'must_auto_accept', {})) ? ' checked="checked"' : '';
    var qrdAutoSearchChecked = (lzm_chatDisplay.qrdAutoSearch != 0) ? ' checked="checked"' : '';
    var newFilterAlertChecked = (lzm_chatDisplay.alertNewFilter == 1) ? ' checked="checked"' : '';

    var notificationSettings = '<fieldset id="notification-settings" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Sounds') + '</legend><div id="notification-settings-div" style="padding: 0px 6px;">';
    if (!lzm_chatDisplay.isApp || (appOs != 'ios' && appOs != 'windows')) {
        notificationSettings += '<div style="padding: 5px 0px;"><div style="margin-bottom: 5px;">' + t('Volume') + '</div>' +
            '<select id="volume-slider" name="volume-slider" class="lzm-select" data-role="none">';
        var volumeStep = 10;
        for (i=0; i<=100; i +=volumeStep) {
            var selectedString = (i <= lzm_chatDisplay.volume && i + volumeStep > lzm_chatDisplay.volume) ? ' selected="selected"' : '';
            notificationSettings += '<option value="' + i + '"' + selectedString + '>' + i + ' %</option>';
        }
        notificationSettings += '</select></div>';
    }
    notificationSettings += '<div style="padding: 5px 0px;">' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="sound-new-message"' + newMessageSoundChecked + ' />' +
        '<label class="lzm-option-checkbox" for="sound-new-message">' + t('New Message') + '</label>' +
        '</div>' +
        '<div style="padding: 5px 0px;">' +
        '<span><input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="sound-new-chat"' + newChatSoundChecked + ' />' +
        '<label class="lzm-option-checkbox" for="sound-new-chat">' + t('New external Chat') + '</label></span><br />' +
        '<span style="padding-left: 20px;"><input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="sound-repeat-new-chat"' + repeatChatSoundChecked + ' />' +
        '<label class="lzm-option-checkbox" for="sound-repeat-new-chat">' + t('Keep ringing until allocated') + '</label></span>' +
        '</div>' +
        '<div style="padding: 5px 0px;">' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="sound-new-ticket"' + newTicketSoundChecked + ' />' +
        '<label class="lzm-option-checkbox" for="sound-new-ticket">' + t('New Ticket') + '</label>' +
        '</div>';
    if (lzm_chatDisplay.isApp && (appOs != 'ios')) {
        notificationSettings += '<div style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="vibrate-notifications"' + vibrateNotificationsChecked + ' />' +
            '<label class="lzm-option-checkbox" for="vibrate-notifications">' + t('Vibrate on Notifications') + '</label>' +
            '</div>';
    }
    notificationSettings += '</div></fieldset>' +
        '<input type="hidden" value="0" id="away-after-time" />';
    /*notificationSettings += '<fieldset id="alert-settings" data-role="none" class="lzm-fieldset" style="margin-top: 5px;">' +
        '<legend>' + t('Warnings') + '</legend><div id="alert-settings-div">' +
        '<div style="padding: 5px 0px;">' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="alert-new-filter"' + newFilterAlertChecked + ' />' +
        '<label class="lzm-option-checkbox" for="alert-new-filter">' + t('Show warning, when a new global filter is created.') + '</label>' +
        '</div>' +
        '</div></fieldset>';*/
    var generalSettings = '<fieldset id="chat-settings"  class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Chats') + '</legend><div style="padding: 5px 0px;"' + autoAcceptDisabledClass + '>' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="auto-accept"' + autoAcceptChat + ' />' +
        '<label class="lzm-option-checkbox" for="auto-accept">' + t('Automatically accept chats') + '</label>' +
        '</div><div style="padding: 5px 0px;">' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="qrd-auto-search"' + qrdAutoSearchChecked + ' />' +
        '<label class="lzm-option-checkbox" for="qrd-auto-search">' + t('Search in resources, while typing chat messages') + '</label>' +
        '</div></fieldset><fieldset id="ticket-settings" class="lzm-fieldset" data-role="none" style="margin-top: 5px;">' +
        '<legend>' + t('Tickets') + '</legend><div style="padding: 5px 0px;">' +
        '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="tickets-read"' + ticketReadStatusChecked + ' />' +
        '<label class="lzm-option-checkbox" for="tickets-read">' + t('Other operator\'s tickets won\'t switch to unread') + '</label>' +
        '</div></fieldset>';
    if (lzm_chatDisplay.isApp && (appOs == 'android' || appOs == 'blackberry')) {
        generalSettings += '<fieldset id="background-settings" class="lzm-fieldset" data-role="none" style="margin-top: 5px;">' +
            '<legend>' + t('Online status') + '</legend><div style="padding: 5px 0px;">';
        if (appOs == 'android') {
            generalSettings += '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="background-mode"' + backgroundModeChecked + ' />' +
                '<label class="lzm-option-checkbox" for="background-mode">' + t('Keep active in background mode') + '</label></div>';
        }
        generalSettings += '<div id="save-connections-div"' + saveConnectionsDisabled + ' style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox" type="checkbox" value="1" data-role="none" id="save-connections"' + saveConnectionsChecked + ' />' +
            '<label class="lzm-option-checkbox" for="save-connections">' + t('Save connections / battery') + '</label>' +
            '</div></fieldset>';
    }
    var viewSelectSettings = '<fieldset id="view-select-settings" class="lzm-fieldset" data-role="none">' +
        this.createViewSelectSettings(lzm_chatDisplay.viewSelectArray, lzm_chatDisplay.showViewSelectPanel) + '</fieldset>';
    var tableSettings = this.createTableSettings();
    var aboutSettings = '<fieldset id="about-settings" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('About LiveZilla') + '</legend>' +
        '<div style="padding: 5px 0px;">' + t('LiveZilla Server Version: <!--lz_server_version-->',
        [['<!--lz_server_version-->', lzm_commonConfig.lz_version]]) + '</div>';
    if (lzm_commonConfig.lz_app_version != '') {
        aboutSettings += '<div style="padding: 5px 0px;">' + t('LiveZilla App Version: <!--lz_app_version-->',
            [['<!--lz_app_version-->', lzm_commonConfig.lz_app_version]]) + '</div>';
    }
    var liveZillaWebsite = t('LiveZilla Website'), kolobokWebsite = t('Kolobok Emoticons');
    aboutSettings += '<div style="padding: 15px 0px 5px 0px;">' + t('Copyright <!--copyright--> LiveZilla GmbH, 2014. All Rights reserved.',
        [['<!--copyright-->', '&#169;']]) + '<br />' +
        '<div style="padding: 5px 0px;">' +
        t('Homepage / Updates: <!--link-->', [['<!--link-->', '<a href="#" onclick="openLink(\'http://www.livezilla.net/\');">' + liveZillaWebsite + '</a>']]) + '</div>' +
        '<div style="padding: 5px 0px;">' +
        t('This product or document is protected by copyright and distributed under licenses restricting its use, copying, distribution and decompilation.') + '</div>' +
        '<div style="padding: 5px 0px;">' +
        t('No part of this product may be reproduced in any form by any means without prior written authorization of LiveZilla and its licensors, if any.') + '</div>' +
        '<div style="padding: 5px 0px;">' +
        t('LiveZilla uses <!--kolobok_link--> - Copyright <!--copyright--> Aiwan.',
            [['<!--kolobok_link-->', '<a href="#" onclick="openLink(\'http://www.en.kolobok.us/\');">' + kolobokWebsite + '</a>'], ['<!--copyright-->', '&#169;']]) + '</div>' +
        '</div>';
    aboutSettings += '</fieldset>';

    var settingsTabList = [{name: t('General'), content: generalSettings}, {name: t('Notifications'), content: notificationSettings},
        {name: t('Panel'), content: viewSelectSettings}, {name: t('Tables'), content: tableSettings},
        {name: t('About LiveZilla'), content: aboutSettings}];

    return settingsTabList;
};

ChatSettingsClass.prototype.createTableSettings = function() {
    var i = 0, columnIsVisible, customInput;
    var tableSettingsHtml = '<fieldset id="visitor-table-columns" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Visitor Table') + '</legend><div style="padding: 0px 6px;">' +
        '<div style="padding-bottom: 5px;">' + t('Select which columns are visible in the visitor table:') + '</div>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.visitor.length; i++) {
        columnIsVisible = (lzm_chatDisplay.mainTableColumns.visitor[i].display == 1) ? ' checked="checked"' : '';
        tableSettingsHtml += '<div style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
            ' id="display-visitor-column-' + lzm_chatDisplay.mainTableColumns.visitor[i].cid + '" data-role="none" />' +
            '<label class="lzm-option-checkbox" for="display-visitor-column-' + lzm_chatDisplay.mainTableColumns.visitor[i].cid + '">' +
            t(lzm_chatDisplay.mainTableColumns.visitor[i].title) + '</label></div>';
    }
    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        customInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        columnIsVisible = (customInput.display.visitor) ? ' checked="checked"' : '';
        if (parseInt(customInput.id) < 111 && customInput.active == 1) {
            tableSettingsHtml += '<div style="padding: 5px 0px;">' +
                '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
                ' id="display-visitor-column-custom-' + customInput.id + '" data-role="none" />' +
                '<label class="lzm-option-checkbox" for="display-visitor-column-custom-' + customInput.id + '">' +
                customInput.name + '</label></div>';
        }
    }
    tableSettingsHtml += '</div></fieldset>' +
        '<fieldset style="margin-top: 5px;" id="archive-table-columns" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Chat Archive Table') + '</legend><div style="padding: 0px 6px;">' +
        '<div style="padding-bottom: 5px;">' + t('Select which columns are visible in the chat archive table:') + '</div>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.archive.length; i++) {
        columnIsVisible = (lzm_chatDisplay.mainTableColumns.archive[i].display == 1) ? ' checked="checked"' : '';
        tableSettingsHtml += '<div style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
            ' id="display-archive-column-' + lzm_chatDisplay.mainTableColumns.archive[i].cid + '" data-role="none" />' +
            '<label class="lzm-option-checkbox" for="display-archive-column-' + lzm_chatDisplay.mainTableColumns.archive[i].cid + '">' +
            t(lzm_chatDisplay.mainTableColumns.archive[i].title) + '</label></div>';
    }
    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        customInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        columnIsVisible = (customInput.display.archive) ? ' checked="checked"' : '';
        if (parseInt(customInput.id) < 111 && customInput.active == 1) {
            tableSettingsHtml += '<div style="padding: 5px 0px;">' +
                '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
                ' id="display-archive-column-custom-' + customInput.id + '" data-role="none" />' +
                '<label class="lzm-option-checkbox" for="display-archive-column-custom-' + customInput.id + '">' +
                customInput.name + '</label></div>';
        }
    }
    tableSettingsHtml += '</div></fieldset>' +
        '<fieldset style="margin-top: 5px;" id="ticket-table-columns" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Ticket Table') + '</legend><div style="padding: 0px 6px;">' +
        '<div style="padding-bottom: 5px;">' + t('Select which columns are visible in the ticket table:') + '</div>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.ticket.length; i++) {
        columnIsVisible = (lzm_chatDisplay.mainTableColumns.ticket[i].display == 1) ? ' checked="checked"' : '';
        tableSettingsHtml += '<div style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
            ' id="display-ticket-column-' + lzm_chatDisplay.mainTableColumns.ticket[i].cid + '" data-role="none" />' +
            '<label class="lzm-option-checkbox" for="display-ticket-column-' + lzm_chatDisplay.mainTableColumns.ticket[i].cid + '">' +
            t(lzm_chatDisplay.mainTableColumns.ticket[i].title) + '</label></div>';
    }
    tableSettingsHtml += '</div></fieldset>' +
        '<fieldset style="margin-top: 5px;" id="allchats-table-columns" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Chats Table') + '</legend><div style="padding: 0px 6px;">' +
        '<div style="padding-bottom: 5px;">' + t('Select which columns are visible in the chats table:') + '</div>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.allchats.length; i++) {
        columnIsVisible = (lzm_chatDisplay.mainTableColumns.allchats[i].display == 1) ? ' checked="checked"' : '';
        tableSettingsHtml += '<div style="padding: 5px 0px;">' +
            '<input class="lzm-option-checkbox"' + columnIsVisible + ' type="checkbox"' +
            ' id="display-allchats-column-' + lzm_chatDisplay.mainTableColumns.allchats[i].cid + '" data-role="none" />' +
            '<label class="lzm-option-checkbox" for="display-allchats-column-' + lzm_chatDisplay.mainTableColumns.allchats[i].cid + '">' +
            t(lzm_chatDisplay.mainTableColumns.allchats[i].title) + '</label></div>';
    }
    tableSettingsHtml += '</div></fieldset>';
    return tableSettingsHtml
};

ChatSettingsClass.prototype.createViewSelectSettings = function(viewSelectArray, showViewSelectPanel) {
    var viewSelectSettings = '<legend>' + t('Panel') + '</legend><div style="padding: 0px 6px;">' +
        '<div style="padding-bottom: 10px;">' + t('Select, which views are visible in the view select panel:') + '</div>';
    for (i=0; i<viewSelectArray.length; i++) {
        var thisViewId = viewSelectArray[i].id;
        var thisViewName = t(viewSelectArray[i].name);
        var showThisViewChecked = (showViewSelectPanel[thisViewId] != 0) ? ' checked="checked"' : '';
        var displayMode = (i == 0) ? 'block' : 'none';
        var cssClasses = 'show-view-div';
        var disabledClass = '';
        if (lzm_chatDisplay.isApp && (appOs == 'android' || appOs == 'blackberry'))
            cssClasses += ' android';
        if (i == 0)
            cssClasses += ' selected-panel-settings-line';
        if (lzm_chatServerEvaluation.crc3 != null && lzm_chatServerEvaluation.crc3[1] == '-2' && thisViewId == 'home') {
            disabledClass = ' ui-disabled';
            showThisViewChecked = ' checked="checked"';
        } else if (lzm_chatServerEvaluation.crc3 != null && lzm_chatServerEvaluation.crc3[2] == '-2' && thisViewId == 'world') {
            disabledClass = ' ui-disabled';
            showThisViewChecked = '';
        }
        viewSelectSettings += '<div style="padding: 5px 0px;" data-view-id="' + thisViewId + '"' +
            ' class="' + cssClasses + '" id="show-view-div-' + thisViewId + '">' +
            '<span class="view-select-settings-checkbox"><input type="checkbox" value="1" data-role="none"' +
            ' class="check-view lzm-option-checkbox' + disabledClass + '" id="show-' + thisViewId + '"' + showThisViewChecked + ' /></span>' +
            '<span>' + thisViewName + '</span>' +
            '<span class="position-change-buttons" id="position-change-buttons-' + thisViewId + '" style="display: ' + displayMode + '">' +
            '<span class="position-change-buttons-up"><i class="fa fa-chevron-up"></i></span>' +
            '<span class="position-change-buttons-down"><i class="fa fa-chevron-down"></i></span>' +
            '</span></div>';
    }
    viewSelectSettings += '</div>';
    return viewSelectSettings;
};

ChatSettingsClass.prototype.orderViewPanel = function(viewArray, selectedViewId) {
    var that = this, viewSelectArray = [], viewSelectObject = {}, i = 0;
    var showViewSelectPanel = {};
    for (i=0; i<lzm_chatDisplay.viewSelectArray.length; i++) {
        viewSelectObject[lzm_chatDisplay.viewSelectArray[i].id] = lzm_chatDisplay.viewSelectArray[i].name;
        showViewSelectPanel[lzm_chatDisplay.viewSelectArray[i].id] =
            ($('#show-' + lzm_chatDisplay.viewSelectArray[i].id).prop('checked')) ? 1 : 0;
    }
    for (i=0; i<viewArray.length; i++) {
        viewSelectArray.push({id: viewArray[i], name : viewSelectObject[viewArray[i]]});
    }
    var settingsHtml = that.createViewSelectSettings(viewSelectArray, showViewSelectPanel);
    $('#view-select-settings').html(settingsHtml).trigger('create');

    var viewId = '';
    $('.show-view-div').click(function() {
        $('.show-view-div').removeClass('selected-panel-settings-line');
        $(this).addClass('selected-panel-settings-line');
        viewId = $(this).data('view-id');
        that.togglePositionChangeButtons(viewId);
    });
    $('.position-change-buttons-up').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != 0) {
            var replaceId = viewArray[myIndex - 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex - 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('.position-change-buttons-down').click(function() {
        var myIndex = $.inArray(viewId, viewArray);
        if (myIndex != viewArray.length - 1) {
            var replaceId = viewArray[myIndex + 1];
            for (var i=0; i<viewArray.length; i++) {
                viewArray[i] = (i == myIndex) ? replaceId : (i == myIndex + 1) ? viewId : viewArray[i];
            }
            that.orderViewPanel(viewArray, viewId);
        }
    });
    $('#show-view-div-' + selectedViewId).click();
};

ChatSettingsClass.prototype.togglePositionChangeButtons = function(viewId) {
    $('.position-change-buttons').css({'display': 'none'});
    $('#position-change-buttons-' + viewId).css({'display': 'block'});
};

ChatSettingsClass.prototype.createUserManagement = function() {
    var that = this;
    lzm_chatDisplay.showUsersettingsHtml = false;
    lzm_chatDisplay.showMinifiedDialogsHtml = false;
    $('#usersettings-menu').css({'display': 'none'});
    $('#minified-dialogs-menu').css('display', 'none');
    var headerString = '<span id="user-management-dialog-headline-text">' + t('User Management (<!--user_count--> Users / <!--group_count--> Groups)',
        [['<!--user_count-->', lzm_chatServerEvaluation.operators.getOperatorCount()], ['<!--group_count-->', lzm_chatServerEvaluation.groups.getGroupCount()]]) +
        '</span>';
    var footerString = lzm_displayHelper.createButton('save-usermanagement', '', '', t('Save'), '', 'lr',
        {'margin-left': '4px', visibility: 'hidden'})  +
        lzm_displayHelper.createButton('cancel-usermanagement', '', '', t('Close'), '', 'lr',
            {'margin-left': '6px'});
    var acid = md5(Math.random().toString()).substr(0, 5);
    var bodyString = '<iframe id="user-management-iframe" src="admin.php?acid=' + acid + '&type=user_management&lang=' +
        lz_global_base64_url_encode(lzm_t.language) + '"></iframe>';

    var dialogData = {};
    if (lzm_chatDisplay.selected_view == 'mychats' && lzm_chatDisplay.active_chat_reco != '') {
        var thisChatPartner = lzm_displayHelper.getChatPartner(lzm_chatDisplay.active_chat_reco);
        dialogData = {'chat-partner': lzm_chatDisplay.active_chat_reco, 'chat-partner-name': thisChatPartner['name'],
            'chat-partner-userid': thisChatPartner['userid']};
    }
    dialogData['no-selected-view'] = true;
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'user-management-dialog', {}, {}, {}, {}, '', dialogData, true, true);
    lzm_displayLayout.resizeUserManagement();

    $('#cancel-usermanagement').click(function() {
        if (that.userManagementAction == 'list') {
            removeUserManagement();
        } else if (that.userManagementAction == 'signature' || that.userManagementAction == 'text' || that.userManagementAction == 'title' ||
            that.userManagementAction == 'smc' || that.userManagementAction == 'oh') {
            document.getElementById('user-management-iframe').contentWindow.removeTextEmailsPlaceholderMenu();
            document.getElementById('user-management-iframe').contentWindow.removeSignaturePlaceholderMenu();
            closeOperatorSignatureTextInput();
        } else {
            closeOperatorGroupConfiguration();
        }
    });

    $('#save-usermanagement').click(function() {
        var handleUserOrGroupSave = false;
        if (that.userManagementAction == 'signature') {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSignature();
        } else if (that.userManagementAction == 'text') {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveText();
        } else if (that.userManagementAction == 'title') {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveGroupTitle();
        } else if (that.userManagementAction == 'smc') {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveSocialMediaChannel();
        } else if (that.userManagementAction == 'oh') {
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveOpeningHours();
        } else {
            handleUserOrGroupSave = true;
            document.getElementById('user-management-iframe').contentWindow.lzm_userManagement.saveUserOrGroup();
        }
        if (!handleUserOrGroupSave) {
            $('#cancel-usermanagement').click();
        }
    });
};
