/****************************************************************************************
 * LiveZilla CommonDialogClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDialogClass() {
    this.alertDialogWidth = 0;
    this.alertDialogHeight = 0;
}

CommonDialogClass.prototype.createAlertDialog = function(errorMessage, buttons) {
    try {
        lzm_displayHelper.unblockUi();
    } catch (ex) {}
    var doInitEditorOnClose = '0';
    if (typeof chatMessageEditorIsPresent != 'undefined' && chatMessageEditorIsPresent) {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            saveChatInput(lzm_chatDisplay.active_chat_reco);
            removeEditor();
            doInitEditorOnClose = '1';
        }
    }
    var dialogHtml = '<div class="lzm-alert-dialog-container" id="lzm-alert-dialog-container">';
    var dialogInnerHtml = '<div class="lzm-alert-dialog" id="lzm-alert-dialog" data-do-init-editor-on-close="' + doInitEditorOnClose + '">' +
        '<div style="margin: 10px 8px;">' + errorMessage + '</div>' +
        '<div style="margin: 14px 8px; text-align: right;">';
    for (var i=0; i<buttons.length; i++) {
        dialogInnerHtml += '<span class="alert-button" id="alert-btn-' + buttons[i].id + '" data-id="' + buttons[i].id + '">' + buttons[i].name + '</span>';
    }
    dialogInnerHtml += '</div>' +
        '</div>';
    dialogHtml += dialogInnerHtml + '</div>';
    $('body').append('<div id="dialog-test-size-div" style="position: absolute; left: -2000px; top: -2000px; width: 1800px; height: 1800px;"></div>').trigger('create');
    $('#dialog-test-size-div').html(dialogInnerHtml.replace(/id="lzm-alert/, 'id="test-lzm-alert').replace(/id="alert-btn-/, 'id="test-alert-btn-')).trigger('create');
    var myWindowWidth = $(window).width();
    this.alertDialogWidth = Math.min(Math.round(myWindowWidth * 0.9), 300);
    $('#test-lzm-alert-dialog').css({width: this.alertDialogWidth+'px'});
    this.alertDialogHeight = $('#test-lzm-alert-dialog').height();
    $('#dialog-test-size-div').remove();

    $('body').append(dialogHtml).trigger('create');
    this.resizeAlertDialog();
};

CommonDialogClass.prototype.removeAlertDialog = function() {
    var doInitEditorOnClose = $('#lzm-alert-dialog').data('do-init-editor-on-close');
    $('#lzm-alert-dialog-container').remove();
    if (doInitEditorOnClose == '1') {
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
        }
    }
};

CommonDialogClass.prototype.changePassword = function(caller, password, callback) {
    var that = this;
    password = (typeof password != 'undefined') ? password : '';
    callback = (typeof callback != 'undefined') ? callback : null;
    try {
        lzm_chatDisplay.showUsersettingsHtml = false;
    } catch(ex) {}
    $('#usersettings-menu').css({'display': 'none'});
    var headerString = t('Change Password');
    var footerString = lzm_displayHelper.createButton('change-password-ok', 'ui-disabled', '', t('Ok'), '', 'lr',
        {'margin-left': '6px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('change-password-cancel', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '6px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = this.createPasswordChangeHtml();
    var dialogData = {};

    var showMinimizeIcon = (caller != 'index');
    that.createDialogWindow(headerString, bodyString, footerString, 'change-password', {}, {}, {}, {}, '', dialogData, showMinimizeIcon, false, 'change_password');
    that.resizePasswordChange();

    $('#new-password').keyup(function() {
        that.checkPasswordStrength($(this).val());
        if ($(this).val().length > 0) {
            $('#change-password-ok').removeClass('ui-disabled');
        } else {
            $('#change-password-ok').addClass('ui-disabled');
        }
    });

    var validatePasswordInput = function(cp, np, rp) {
        if (typeof lzm_chatPollServer != 'undefined' && sha256(md5(cp)) != lzm_chatPollServer.chosenProfile.login_passwd) {
            return 1;
        } else if (typeof lzm_chatPollServer == 'undefined' && cp != password) {
            return 1;
        } else if (np == cp) {
            return 2;
        } else if (np != rp) {
            return 3;
        } else {
            return 0;
        }
    };

    $('#change-password-ok').click(function() {
        var pwVal = validatePasswordInput($('#previous-password').val(), $('#new-password').val(), $('#confirm-password').val());
        if (pwVal == 0) {
            if (caller != 'index') {
                savePasswordChange($('#new-password').val());
            } else {
                newPassword = $('#new-password').val();
                if (callback != null) {
                    eval(callback);  // Fixme: Fix callback function call, when needed
                }
            }
            $('#change-password-cancel').click();
        } else {
            var alertMessage = '';
            if (pwVal == 1) {
                alertMessage = t('Old password is not correct.');
            } else if (pwVal == 2) {
                alertMessage = t('New password must be different from old password.');
            } else if (pwVal == 3) {
                alertMessage = t('New password does not match with password repetition.');
            }
            that.createAlertDialog(alertMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                that.removeAlertDialog();
            });
        }
    });

    $('#change-password-cancel').click(function() {
        that.removeDialogWindow('change-password');
        if (caller != 'index') {
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
                initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
            }
        }
    });
};

CommonDialogClass.prototype.createPasswordChangeHtml = function() {
    var myHtml = '<fieldset id="change-password-inner" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Change Password') + '</legend>' +
        '<div>' + t('To change your password, enter your previous password and confirm the new password.') + '</div>' +
        '<div style="margin-top: 20px;"><label for="previous-password">' + t('Current password:') + '</label><br/>' +
        '<input type="password" id="previous-password" class="lzm-text-input change-password-input" data-role="none" /></div>' +
        '<div style="margin-top: 10px;"><label for="new-password">' + t('New password:') + '</label><br/>' +
        '<input type="password" id="new-password" class="lzm-text-input change-password-input" data-role="none" /></div>' +
        '<div style="margin-top: 10px;"><label for="confirm-password">' + t('New password repetition:') + '</label><br/>' +
        '<input type="password" id="confirm-password" class="lzm-text-input change-password-input" data-role="none" /></div>' +
        '<div style="margin-top: 20px;"><table style="width: 100%"><tr>' +
        '<td style="padding-right: 10px;"><div id="password-strength-0" class="password-strength" style="background-color: #f1f1f1;">&nbsp;</div></td>' +
        '<td style="padding-right: 10px;"><div id="password-strength-1" class="password-strength" style="background-color: #f1f1f1;">&nbsp;</div></td>' +
        '<td style="padding-right: 10px;"><div id="password-strength-2" class="password-strength" style="background-color: #f1f1f1;">&nbsp;</div></td>' +
        '<td style="padding-right: 10px;"><div id="password-strength-3" class="password-strength" style="background-color: #f1f1f1;">&nbsp;</div></td>' +
        '</tr></table></div>' +
        '</fieldset>';

    return myHtml;
};

CommonDialogClass.prototype.checkPasswordStrength = function(password) {
    var cat = [
        password.match(/[a-z]/),
        password.match(/[A-Z]/),
        password.match(/[0-9]/),
        password.match(/[^a-z^A-Z^0-9]/)
    ];
    var noc = 0, pl = password.length;
    for (var i=0; i<cat.length; i++) {
        noc += (cat[i] != null) ? 1 : 0;
    }
    $('.password-strength').css({'background-color': '#f1f1f1'});
    if ((noc == 1 && pl < 10) || (noc != 1 && pl < 6)) {
        $('#password-strength-0').css({'background-color': '#DB0000'});
    } else if ((noc == 1 && pl >= 10) || (noc == 2 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#DB8B00'});
        $('#password-strength-1').css({'background-color': '#DB8B00'});
    } else if ((noc == 2 && pl >= 10) || (noc >= 3 && pl >= 6 && pl < 10)) {
        $('#password-strength-0').css({'background-color': '#DBCE00'});
        $('#password-strength-1').css({'background-color': '#DBCE00'});
        $('#password-strength-2').css({'background-color': '#DBCE00'});
    } else {
        $('#password-strength-0').css({'background-color': '#4EDB00'});
        $('#password-strength-1').css({'background-color': '#4EDB00'});
        $('#password-strength-2').css({'background-color': '#4EDB00'});
        $('#password-strength-3').css({'background-color': '#4EDB00'});
    }
};

CommonDialogClass.prototype.resizeAlertDialog = function() {
    if ($('#lzm-alert-dialog-container').length > 0) {
        var windowWidth = $(window).width(), windowHeight = $(window).height();
        var dialogLeft = Math.round(0.5 * (windowWidth - this.alertDialogWidth));
        var dialogTop = Math.round(0.5 * (windowHeight - this.alertDialogHeight));
        var myContainerCss = {width: windowWidth+'px', height: windowHeight+'px'};
        var myCss = {left: dialogLeft+'px', top: dialogTop+'px', width: this.alertDialogWidth+'px', height: this.alertDialogHeight+'px'};
        $('#lzm-alert-dialog-container').css(myContainerCss);
        $('#lzm-alert-dialog').css(myCss);
    }
};

CommonDialogClass.prototype.resizePasswordChange = function() {
    if ($('#change-password').length > 0) {
        var bodyHeight = $('#change-password-body').height();
        var bodyWidth = $('#change-password-body').width();
        var inputWidth = Math.min(300, bodyWidth - 32);

        $('#change-password-inner').css({'min-height': (bodyHeight - 22)+'px'});
        $('.change-password-input').css({'min-width': '0px', width: inputWidth+'px'});
    }
};

CommonDialogClass.prototype.createDialogWindow = function(headerString, bodyString, footerString, id,
                                                          defaultCss, desktopBrowserCss, mobileBrowserCss, appCss,
                                                          position, data, showMinimizeIcon, fullscreen, dialogId) {
    position = (typeof position != 'undefined' && position != '') ? position : 'absolute';
    try {
        lzm_chatDisplay.dialogData = (typeof data != 'undefined') ? data : {};
    } catch(ex) {}
    showMinimizeIcon = (typeof showMinimizeIcon != 'undefined') ? showMinimizeIcon : true;
    fullscreen = (typeof fullscreen != 'undefinedd') ? fullscreen : false;
    var classnameExtension = (fullscreen) ? '-fullscreen' : '';
    dialogId = (typeof dialogId != 'undefined') ? dialogId : '';
    try {
        while (dialogId == '' || $.inArray(dialogId, lzm_chatDisplay.StoredDialogIds) != -1) {
            dialogId = md5('' + Math.random());
        }
        lzm_chatServerEvaluation.settingsDialogue = true;
    } catch(ex) {}
    var key;

    var htmlContents = '<div id="' + id + '-container" class="dialog-window-container">' +
        '<div id="' + id + '" class="dialog-window' + classnameExtension + '">' +
        '<div id="' + id + '-headline" class="dialog-window-headline' + classnameExtension + '">' +
        headerString;
    if (showMinimizeIcon) {
        htmlContents += '<span id="minimize-dialog" ' +
            'onclick="minimizeDialogWindow(\'' + dialogId + '\', \'' + id + '\')"><i class="fa fa-chevron-up"></i></span>';
    } else {
        htmlContents += '<span id="close-dialog" onclick="' + this.getMyObjectName() + '.removeDialogWindow();"></span>'
    }
    htmlContents += '</div>' +
        '<div id="' + id + '-body" class="dialog-window-body' + classnameExtension + '">' +
        bodyString +
        '</div>' +
        '<div id="' + id + '-footline" class="dialog-window-footline' + classnameExtension + '">' +
        footerString +
        '</div>' +
        '</div>' +
        '</div>';

    var chatPage = $('#chat_page');
    if (chatPage.length == 0) {
        chatPage = $('#login_page');
    }
    chatPage.append(htmlContents).trigger('create');

    try {
        if (lzm_chatDisplay.selected_view == 'external') {
            $('#visitor-list-table').remove();
        }
    } catch(ex) {}

    try {
        lzm_chatDisplay.dialogWindowCss.position = position;
        $('#' + id + '-container').css(lzm_chatDisplay.dialogWindowContainerCss);
        if (fullscreen) {
            $('#' + id).css(lzm_chatDisplay.FullscreenDialogWindowCss);
            $('#' + id + '-headline').css(lzm_chatDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + id + '-body').css(lzm_chatDisplay.FullscreenDialogWindowBodyCss);
            $('#' + id + '-footline').css(lzm_chatDisplay.FullscreenDialogWindowFootlineCss);
        } else {
            $('#' + id).css(lzm_chatDisplay.dialogWindowCss);
            $('#' + id + '-headline').css(lzm_chatDisplay.dialogWindowHeadlineCss);
            $('#' + id + '-body').css(lzm_chatDisplay.dialogWindowBodyCss);
            $('#' + id + '-footline').css(lzm_chatDisplay.dialogWindowFootlineCss);
        }
    } catch (ex) {
        lzm_commonDisplay.dialogWindowCss.position = position;
        $('#' + id + '-container').css(lzm_commonDisplay.dialogWindowContainerCss);
        if (fullscreen) {
            $('#' + id).css(lzm_commonDisplay.FullscreenDialogWindowCss);
            $('#' + id + '-headline').css(lzm_commonDisplay.FullscreenDialogWindowHeadlineCss);
            $('#' + id + '-body').css(lzm_commonDisplay.FullscreenDialogWindowBodyCss);
            $('#' + id + '-footline').css(lzm_commonDisplay.FullscreenDialogWindowFootlineCss);
        } else {
            $('#' + id).css(lzm_commonDisplay.dialogWindowCss);
            $('#' + id + '-headline').css(lzm_commonDisplay.dialogWindowHeadlineCss);
            $('#' + id + '-body').css(lzm_commonDisplay.dialogWindowBodyCss);
            $('#' + id + '-footline').css(lzm_commonDisplay.dialogWindowFootlineCss);
        }
    }

    if (typeof defaultCss != 'undefined') {
        for (key in defaultCss) {
            if (defaultCss.hasOwnProperty(key))
                $('#' + key).css(defaultCss[key]);
        }
    }
    try {
        if (typeof desktopBrowserCss != 'undefined' && !lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            for (key in desktopBrowserCss) {
                if (desktopBrowserCss.hasOwnProperty(key))
                    $('#' + key).css(desktopBrowserCss[key]);
            }
        }
        if (typeof mobileBrowserCss != 'undefined' && lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            for (key in mobileBrowserCss) {
                if (mobileBrowserCss.hasOwnProperty(key))
                    $('#' + key).css(mobileBrowserCss[key]);
            }
        }
        if (typeof appCss != 'undefined' && lzm_chatDisplay.isApp) {
            for (key in appCss) {
                if (appCss.hasOwnProperty(key))
                    $('#' + key).css(appCss[key]);
            }
        }
    } catch(ex) {}

    return dialogId;
};

CommonDialogClass.prototype.removeDialogWindow = function(id){
    if (typeof id != 'undefined' && id != '') {
        $('#' + id + '-container').remove();
    } else {
        $('.dialog-window-container').remove();
    }
    try {
        lzm_chatServerEvaluation.settingsDialogue = false;
        lzm_chatDisplay.createChatWindowLayout(true);
        if (lzm_chatDisplay.selected_view == 'external') {
            lzm_chatDisplay.visitorDisplay.createVisitorList();
            selectVisitor(null, $('#visitor-list').data('selected-visitor'));
        }
    } catch(ex) {}
};

CommonDialogClass.prototype.getMyObjectName = function() {
    for (var name in window) {
        if (window[name] == this) {
            return name;
        }
    }
    return '';
};
