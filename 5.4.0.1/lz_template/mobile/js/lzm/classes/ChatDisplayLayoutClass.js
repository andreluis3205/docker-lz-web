/****************************************************************************************
 * LiveZilla ChatDisplayLayoutClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatDisplayLayoutClass() {
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.maxWindowHeight = 0;
    this.chatPageHeight = 0;
    this.chatPageLeft = 0;
    this.chatPageTop = 0;
    this.mainMenuPosition = {top: 13, left: 15};
    this.mainMenuHeight = 40;
    this.mainMenuWidth = 0;
    this.viewSelectPanelHeight = 31;
    this.viewContainerHeight = 0;
    this.viewContainerWidth = 0;
    this.viewContainerLeft = 0;
    this.viewContainerTop = 0;

    this.viewContainerCss = {};
}

ChatDisplayLayoutClass.prototype.resizeAll = function() {
    this.windowWidth = $(window).width();
    this.windowHeight = $(window).height();
    this.mainMenuWidth = this.windowWidth - 32;
    if (this.windowHeight > this.maxWindowHeight) {
        this.maxWindowHeight = this.windowHeight;
    }
    this.chatPageHeight = this.windowHeight;
    this.chatPageLeft = this.mainMenuPosition.left;
    this.chatPageTop = this.mainMenuPosition.top + this.mainMenuHeight + this.viewSelectPanelHeight + 10;
    if (lzm_chatDisplay.isApp && this.windowHeight < 390) {
        this.chatPageHeight = Math.min(390, this.maxWindowHeight);
    }
    this.viewContainerHeight = this.chatPageHeight - this.chatPageTop - 27;
    this.viewContainerWidth = this.mainMenuWidth - 10;

    this.viewContainerCss = {position: 'absolute', width: this.viewContainerWidth+'px', height: this.viewContainerHeight+'px',
        padding: '5px 5px 5px 5px', left: '0px', top: '2px', display: 'block', border: '1px solid #cccccc', 'border-radius': '4px',
        overflow: 'hidden', background: '#ffffff'};

    this.resizeStartPage();
    this.resizeGeoTracking();
    this.resizeMychats();
    this.resizeTicketList();
    this.resizeArchive();
    this.resizeQrdTree();
    this.resizeOperatorList();
    this.resizeVisitorList();
    this.resizeFilter();
    this.resizeAllChats();
    this.resizeReportList();

    //this.resizeUserControlPanel();
    this.resizeTicketDetails();
    this.resizeEmailDetails();
    this.resizeOptions();
    this.resizeResources();
    this.resizeAddResources();
    this.resizeEditResources();
    this.resizeTicketReply();
    this.resizeVisitorDetails();
    this.resizeVisitorInvitation();
    this.resizeOperatorForwardSelection();
    this.resizeMessageForwardDialog();
    this.resizeArchivedChat();
    this.resizeDynamicGroupDialogs();
    this.resizeTranslateOptions();
    this.resizeGeotrackingMap();
    this.resizeChatView();
    this.resizeTranslationEditor();
    this.resizeFilterCreation();
    this.resizeFilterList();
    this.resizeSendTranscriptDialog();

    this.resizeMenuPanels();

    try {
        lzm_commonDialog.resizeAlertDialog();
        lzm_commonDialog.resizePasswordChange();
    } catch(ex) {}
};

ChatDisplayLayoutClass.prototype.resizeTicketDetails = function() {
    var myHeight = Math.max($('#ticket-details-body').height(), $('#email-list-body').height());
    myHeight = Math.max(myHeight, $('#visitor-information-body').height());
    var myWidth = Math.max($('#ticket-details-body').width(), $('#email-list-body').width());
    myWidth = Math.max(myWidth, $('#visitor-information-body').width());
    if (myHeight > 0) {
        var historyHeight, detailsHeight;
        if (myHeight > 600) {
            historyHeight = 245;
            detailsHeight = myHeight - historyHeight - 90;
        } else {
            detailsHeight = (myHeight > 535) ? 265 : (myHeight > 340) ? 200 : 120;
            historyHeight = myHeight - detailsHeight - 90;
        }
        var newInputHeight = Math.max(detailsHeight - 48, 150);
        var commentInputHeight = Math.max(140, myHeight - 48);
        $('.ticket-history-placeholder-content').css({height: historyHeight + 'px'});
        $('.ticket-details-placeholder-content').css({height: detailsHeight + 'px'});
        $('#ticket-comment-list').css({'min-height': (detailsHeight - 22) + 'px'});
        $('#ticket-message-text').css({'min-height': (detailsHeight - 22) + 'px'});
        $('#ticket-message-details').css({'min-height': (detailsHeight - 22) + 'px'});
        $('#ticket-attachment-list').css({'min-height': (detailsHeight - 22) + 'px'});
        $('#ticket-message-list').css({'min-height': (historyHeight - 22) + 'px'});
        $('#ticket-ticket-details').css({'min-height': (historyHeight - 22) + 'px'});
        $('#ticket-new-input').css({height: newInputHeight + 'px'});
        $('#comment-text').css({'min-height': (myHeight - 22)+'px'});
        $('#comment-input').css({width: (myWidth - 32)+'px', height: commentInputHeight + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeTicketReply = function() {
    if ($('#ticket-details-body').length > 0) {
        var displayViews = {'reply': 2, 'preview': 1};
        var tabControlWidth = 0, ticketDetailsBodyHeight = $('#ticket-details-body').height();
        for (var view in displayViews) {
            if (displayViews.hasOwnProperty(view)) {
                if ($('#' + view + '-placeholder-content-' + displayViews[view]).css('display') == 'block') {
                    tabControlWidth = $('#' + view + '-placeholder-content-' + displayViews[view]).width();
                }
            }
        }
        $('.reply-placeholder-content').css({height: (ticketDetailsBodyHeight - 40) + 'px'});
        $('#message-comment-text').css({'min-height': (ticketDetailsBodyHeight - 62) + 'px'});
        $('#message-attachment-list').css({'min-height': (ticketDetailsBodyHeight - 62) + 'px'});
        if (tabControlWidth != 0) {
            $('#preview-comment-text').css({'min-height': (ticketDetailsBodyHeight - 62) + 'px'});
            $('#new-message-comment').css({width: (tabControlWidth - 32) + 'px',
                height: (ticketDetailsBodyHeight - 89) + 'px'});
        }
        $('#ticket-reply-cell').children('div').css({'min-height': (ticketDetailsBodyHeight - 66)+'px'});
        var replyTextHeight = ($('#ticket-reply-files').height() != null) ?
            $('#ticket-details-body').height() - $('#ticket-reply-files').height() - 245 : $('#ticket-details-body').height() - 200;
        $('#ticket-reply-text').css({'min-height': replyTextHeight+'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeEmailDetails = function() {
    if ($('#email-list-body').length > 0) {
        var myHeight = $('#email-list-body').height() + 10;
        var listHeight = Math.floor(Math.max(myHeight / 2, 175) - 45);
        var contentHeight = (myHeight - listHeight) - 93;
        var contentWidth = $('#email-list-body').width() + 10;
        $('.email-list-placeholder-content').css({height: listHeight + 'px'});
        $('.email-placeholder-content').css({height: contentHeight + 'px'});
        $('#incoming-email-list').css({'min-height': (listHeight - 22) + 'px'});
        $('#email-text').css({'min-height': ($('.email-placeholder-content').height() - 95) + 'px'});
        $('#email-content').css({'min-height': (contentHeight - 22) + 'px'});
        $('#email-html').css({'min-height': (contentHeight - 22) + 'px'});
        $('.html-email-iframe').css({width: (contentWidth - 52) + 'px', height: (contentHeight - 40) + 'px'});
        $('#email-attachment-list').css({'min-height': (contentHeight - 22) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeOptions = function() {
    if ($('#user-settings-dialog-body').length > 0) {
        var tabContentHeight = $('#user-settings-dialog-body').height() - 40;
        $('.settings-placeholder-content').css({height: tabContentHeight+'px'});
        /*$('#notification-settings').css({'min-height': Math.max(35, Math.floor(tabContentHeight * (2/3)) - 22) + 'px'});
        $('#alert-settings').css({'min-height': Math.max(35, Math.floor(tabContentHeight * (1/3)) - 27) + 'px'});*/
        $('#notification-settings').css({'min-height': (tabContentHeight - 22) + 'px'});
        $('#view-select-settings').css({'min-height': (tabContentHeight - 22) + 'px'});
        $('#about-settings').css({'min-height': (tabContentHeight - 22) + 'px'});
        var chatSettingsHeight = Math.max(35, Math.floor(tabContentHeight / 2) - 22);
        var ticketSettingsHeight = Math.max(35, Math.floor(tabContentHeight / 2) - 27);
        var backgroundSettingsHeight = 0;
        if (lzm_chatDisplay.isApp && (appOs == 'android' || appOs == 'blackberry')) {
            chatSettingsHeight = Math.max(35, Math.floor(tabContentHeight / 3) - 22);
            ticketSettingsHeight = Math.max(35, Math.floor(tabContentHeight / 3) - 27);
            backgroundSettingsHeight = Math.max(35, Math.floor(tabContentHeight / 3) - 28);
        }
        $('#chat-settings').css({'min-height': chatSettingsHeight + 'px'});
        $('#ticket-settings').css({'min-height': ticketSettingsHeight + 'px'});
        if (lzm_chatDisplay.isApp && (appOs == 'android' || appOs == 'blackberry')) {
            $('#background-settings').css({'min-height': backgroundSettingsHeight + 'px'});
        }
        var posBtnWidth = 0, posBtnHeight = 0;
        $('.position-change-buttons-up').each(function() {
            posBtnWidth = Math.max(posBtnWidth, $(this).width());
            posBtnHeight = Math.max(posBtnHeight, $(this).height());
        });
        var positionButtonPadding = Math.floor((18 - posBtnHeight) / 2) + 'px ' +
            Math.ceil((18 - posBtnWidth) / 2) + 'px ' +
            Math.ceil((18 - posBtnHeight) / 2) + 'px ' +
            Math.floor((18 - posBtnWidth) / 2) + 'px';
        $('.position-change-buttons-up').css('padding', positionButtonPadding);
        $('.position-change-buttons-down').css('padding', positionButtonPadding);
    }
};

ChatDisplayLayoutClass.prototype.resizeUserControlPanel = function() {
    var userstatusButtonWidth = 50;
    var usersettingsButtonWidth = 150;
    var mainArticleWidth = $('#content_chat').width();
    if (mainArticleWidth > 380) {
        usersettingsButtonWidth = 250;
    } else if (mainArticleWidth > 355) {
        usersettingsButtonWidth = 225;
    } else if (mainArticleWidth > 330) {
        usersettingsButtonWidth = 200;
    } else if (mainArticleWidth > 305) {
        usersettingsButtonWidth = 175;
    }
    var wishlistButtonWidth = 40;
    lzm_chatDisplay.blankButtonWidth = mainArticleWidth - userstatusButtonWidth - usersettingsButtonWidth - wishlistButtonWidth - 5;
    $('#userstatus-button').css({width: userstatusButtonWidth+'px'});
    $('#usersettings-button').css({width: usersettingsButtonWidth+'px'});
    $('#wishlist-button').css({width: wishlistButtonWidth+'px'});
    $('#blank-button').css({width: lzm_chatDisplay.blankButtonWidth+'px'});
    $('#wishlist-button').children('.ui-btn-inner').css({'padding-left': '0px'});
    $('#blank-button').find('.ui-btn-inner').css({'padding-left': '3px', 'padding-right': '5px'});
    if (lzm_chatDisplay.debuggingDisplayWidth != mainArticleWidth) {
        lzm_chatDisplay.debuggingDisplayWidth = mainArticleWidth;
    }
};

ChatDisplayLayoutClass.prototype.resizeResources = function() {
    var resultListHeight;
    if ($('#qrd-tree-body').children('div').length > 0) {
        $('.qrd-tree-placeholder-content').css({height: ($('#qrd-tree-body').height() - 48) + 'px'});
        resultListHeight = $('#qrd-tree-body').height() - $('#search-input').height() - 97;
        $('#search-results').css({'min-height': resultListHeight + 'px'});
        $('#recently-results').css({'min-height': ($('#qrd-tree-body').height() - 70) + 'px'});
        $('#all-resources').css({'min-height': ($('#qrd-tree-body').height() - 70) + 'px'});
    } else if($('#qrd-tree-dialog-body').length > 0) {
        $('.qrd-tree-placeholder-content').css({height: ($('#qrd-tree-dialog-body').height() - 40) + 'px'});
        resultListHeight = $('#qrd-tree-dialog-body').height() - $('#search-input').height() - 89;
        $('#search-results').css({'min-height': resultListHeight + 'px'});
        $('#recently-results').css({'min-height': ($('#qrd-tree-dialog-body').height() - 62) + 'px'});
        $('#all-resources').css({'min-height': ($('#qrd-tree-dialog-body').height() - 62) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeAddResources = function() {
    if ($('#qrd-add-body').length > 0 || $('#qrd-tree-dialog-body').length > 0 || $('#ticket-details-body').length > 0) {
        var qrdTextHeight = Math.max((lzm_chatDisplay.FullscreenDialogWindowHeight - 312), 100);
        var textWidth = $('#qrd-add').width() - 50 - lzm_displayHelper.getScrollBarWidth();
        var thisQrdTextInnerCss = {
            width: (textWidth - 2)+'px', height:  (qrdTextHeight - 20)+'px', border: '1px solid #ccc',
            'background-color': '#f5f5f5'
        };
        var thisQrdTextInputCss = {
            width: (textWidth - 2)+'px', height: (qrdTextHeight - 20)+'px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'
        };
        var thisQrdTextInputControlsCss;
        thisQrdTextInputControlsCss = {
            width: (textWidth - 2)+'px', height: '15px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '7px 0px', 'text-align': 'left'
        };
        var thisTextInputBodyCss = {
            width: (textWidth - 2)+'px', height: (qrdTextHeight - 51)+'px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px',
            'background-color': '#ffffff', 'overflow-y': 'hidden', 'border-top': '1px solid #ccc'
        };
        var myHeight = Math.max($('#qrd-add-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
        $('#add-resource').css({'min-height': (myHeight - 61) +'px'});
        $('#qrd-add-text-inner').css(thisQrdTextInnerCss);
        $('#qrd-add-text-controls').css(thisQrdTextInputControlsCss);
        $('#qrd-add-text').css(thisQrdTextInputCss);
        $('#qrd-add-text-body').css(thisTextInputBodyCss);
        var uiWidth = Math.min(textWidth - 10, 300);
        var selectWidth = uiWidth + 10;
        $('.short-ui').css({width: uiWidth + 'px'});
        $('select.short-ui').css({width: selectWidth + 'px'});
        $('.long-ui').css({width: (textWidth - 10) + 'px'});
        var protSelWidth = $('#qrd-add-url-protocol').width();
        $('#qrd-add-url').css({width: (textWidth - 17 - protSelWidth) + 'px'});
        $('select.long-ui').css({width: textWidth + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeEditResources = function() {
    if ($('#qrd-edit-body').length > 0) {
        var qrdTextHeight = Math.max((lzm_chatDisplay.FullscreenDialogWindowHeight - 256), 100);
        var textWidth = $('#qrd-edit').width() - 50 - lzm_displayHelper.getScrollBarWidth();
        var thisQrdTextInnerCss = {
            width: (textWidth - 2)+'px', height:  (qrdTextHeight - 20)+'px', border: '1px solid #ccc',
            'background-color': '#f5f5f5'
        };
        var thisQrdTextInputCss = {
            width: (textWidth - 2)+'px', height: (qrdTextHeight - 20)+'px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'
        };
        var thisQrdTextInputControlsCss;
        thisQrdTextInputControlsCss = {
            width: (textWidth - 2)+'px', height: '15px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '7px 0px', 'text-align': 'left'
        };
        var thisTextInputBodyCss = {
            width: (textWidth - 2)+'px', height: (qrdTextHeight - 51)+'px',
            'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px',
            'background-color': '#ffffff', 'overflow-y': 'hidden', 'border-top': '1px solid #ccc'
        };
        var myHeight = Math.max($('#qrd-edit-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
        $('#edit-resource').css({'min-height': (myHeight - 61) +'px'});
        $('#edit-resource-inner').css({width: textWidth + 'px'});
        $('#qrd-edit-text-inner').css(thisQrdTextInnerCss);
        $('#qrd-edit-text-controls').css(thisQrdTextInputControlsCss);
        $('#qrd-edit-text').css(thisQrdTextInputCss);
        $('#qrd-edit-text-body').css(thisTextInputBodyCss);
        var uiWidth = Math.min(textWidth - 10, 300);
        var selectWidth = uiWidth + 10;
        $('.short-ui').css({width: uiWidth + 'px'});
        $('select.short-ui').css({width: selectWidth + 'px'});
        $('.long-ui').css({width: (textWidth - 10) + 'px'});
        var protSelWidth = $('#qrd-edit-url-protocol').width();
        $('#qrd-edit-url').css({width: (textWidth - 17 - protSelWidth) + 'px'});
        $('select.long-ui').css({width: textWidth + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeVisitorDetails = function() {
    if ($('#visitor-information-body').length > 0) {
        var visBodyheight = $('#visitor-information-body').height();
        var visBodyWidth = $('#visitor-information-body').width();
        var contentHeight = visBodyheight - 40;
        var upperFieldsetHeight = Math.floor(contentHeight / 3);
        var lowerFieldsetHeight = contentHeight - upperFieldsetHeight - 49;
        var inputHeight = Math.max(140, visBodyheight - 44);
        var scrollbarHeight = 0;
        $('.visitor-info-placeholder-content').css({height: contentHeight + 'px'});
        $('#visitor-comment-list').css({'min-height': upperFieldsetHeight + 'px'});
        $('#visitor-comment-text').css({'min-height': lowerFieldsetHeight + 'px'});
        $('#visitor-invitation-list').css({'min-height': (contentHeight - 22) + 'px'});
        $('#visitor-history-list').css({'min-height': (contentHeight - 22) + 'px'});
        $('#visitor-details-list').css({'min-height': (contentHeight - 22) + 'px'});
        $('#comment-text').css({'min-height': (visBodyheight - 22) + 'px'});
        $('#comment-input').css({width: (visBodyWidth - 28)+'px', height: inputHeight + 'px'});
        scrollbarHeight = (lzm_displayHelper.checkIfScrollbarVisible('visitor-info-placeholder-content-4', 'horizontal')) ?
            lzm_displayHelper.getScrollBarHeight() : 0;
        $('#matching-chats-inner-div').css({'overflow-y': 'auto', height: (upperFieldsetHeight + 6 - scrollbarHeight) + 'px'});
        $('#matching-chats-inner').css({'min-height': (upperFieldsetHeight - 16 - scrollbarHeight) + 'px'});
        $('#chat-content-inner-div').css({'overflow-y': 'auto', height: (lowerFieldsetHeight + 12) + 'px'});
        $('#chat-content-inner').css({'min-height': (lowerFieldsetHeight - 15) + 'px'});
        scrollbarHeight = (lzm_displayHelper.checkIfScrollbarVisible('visitor-info-placeholder-content-5', 'horizontal')) ?
            lzm_displayHelper.getScrollBarHeight() : 0;
        $('#matching-tickets-inner').css({'min-height': (upperFieldsetHeight - 15 - scrollbarHeight) + 'px'});
        $('#ticket-content-inner').css({'min-height': (lowerFieldsetHeight + 15) + 'px'});
        $('.browser-history-container').css({'min-height': (contentHeight - 75) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeVisitorInvitation = function() {
    if ($('#chat-invitation-body').length > 0) {
        var invTextHeight = Math.max((lzm_chatDisplay.dialogWindowHeight - 235), 100);
        var textWidth = lzm_chatDisplay.dialogWindowWidth - 39;
        if (lzm_displayHelper.checkIfScrollbarVisible('chat-invitation-body')) {
            textWidth -= lzm_displayHelper.getScrollBarWidth();
        }

        var thisInvitationTextCss = {width: textWidth+'px', height:  invTextHeight+'px'};
        var thisInvitationTextInnerCss = {width: textWidth+'px', height:  (invTextHeight - 20)+'px'};
        var thisTextInputCss = {width: (textWidth - 4)+'px', height: (invTextHeight - 24)+'px'};
        var thisTextInputControlsCss;
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            thisTextInputControlsCss = {width: textWidth+'px', height: '15px'};
        }
        var thisTextInputBodyCss = {width: textWidth+'px', height: (invTextHeight - 50)+'px'};

        $('#user-invite-form').css({'min-height': ($('#chat-invitation-body').height() - 22) + 'px'});
        $('#invitation-text-div').css(thisInvitationTextCss);
        $('#invitation-text-inner').css(thisInvitationTextInnerCss);
        $('#invitation-text').css(thisTextInputCss);
        $('#invitation-text-controls').css(thisTextInputControlsCss);
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            $('#invitation-text-body').css(thisTextInputBodyCss);
        }
        var langSelWidth = $('#language-selection').parent().width();
        var groupSelWidth = $('#group-selection').parent().width();
        var browserSelWidth = $('#browser-selection').parent().width();
        $('#language-selection').css({width: langSelWidth + 'px'});
        $('#group-selection').css({width: groupSelWidth + 'px'});
        $('#browser-selection').css({width: browserSelWidth + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeOperatorForwardSelection = function() {
    if ($('#operator-forward-selection-body').length > 0) {
        var fwdTextHeight = Math.max((lzm_chatDisplay.dialogWindowHeight - 205), 100);
        var selWidth = lzm_chatDisplay.dialogWindowWidth - 42;
        if (lzm_displayHelper.checkIfScrollbarVisible('operator-forward-selection')) {
            selWidth -= lzm_displayHelper.getScrollBarWidth();
        }
        $('#forward-text').css({width: selWidth + 'px', height: fwdTextHeight + 'px'});
        $('#fwd-container').css({'min-height':  ($('#operator-forward-selection-body').height() - 22) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeMessageForwardDialog = function() {
    if ($('#message-forward-placeholder').length > 0) {
        var contentHeigth = $('#ticket-details-body').height() - 40;
        $('.message-forward-placeholder-content').css({height: contentHeigth + 'px'});
        var inputMaxWidth = $('#message-forward-placeholder-content-0').width() - 18;
        if (lzm_displayHelper.checkIfScrollbarVisible('message-forward-placeholder-content-0')) {
            inputMaxWidth -= lzm_displayHelper.getScrollBarWidth();
        }
        var filesHeight = (!isNaN(parseInt($('#forward-files').height()))) ? $('#forward-files').height() + 45 : 0;
        var inputWidth = Math.min(500, inputMaxWidth);
        var textareaHeight = Math.max(100, $('#message-forward-placeholder-content-0').height() - 170 - filesHeight);
        $('#forward-email-addresses').css({width: inputWidth});
        $('#forward-subject').css({width: inputWidth});
        $('#forward-text').css({width: (inputMaxWidth - 16) + 'px', height: textareaHeight + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeArchivedChat = function() {
    if ($('#matching-chats-body').length > 0) {
        var myBodyHeight = $('#matching-chats-body').height();
        var listHeight = Math.max(200, Math.floor((myBodyHeight - 39) / 2));
        var contentHeight = myBodyHeight - listHeight - 44;
        var listScrollbarHeight = (lzm_displayHelper.checkIfScrollbarVisible('matching-chats-placeholder-content-0', 'horizontal')) ?
            lzm_displayHelper.getScrollBarHeight() : 0;
        $('.matching-chats-placeholder-content').css({'height': (myBodyHeight - 39) + 'px'});
        $('#matching-chats-inner-div').css({'overflow-y': 'auto', height: (listHeight - 10 -listScrollbarHeight) + 'px'});
        $('#matching-chats-inner').css({'min-height': (listHeight - 32 - listScrollbarHeight) + 'px'});
        $('#chat-content-inner-div').css({'overflow-y': 'auto', height: (contentHeight - 17) + 'px'});
        $('#chat-content-inner').css({'min-height': (contentHeight - 44) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeFilterCreation = function() {
    if ($('#visitor-filter-body').length > 0) {
        var myHeight = $('#visitor-filter-body').height();
        var mainTableHeight = $('#visitor-filter-main-table').height();
        var baseTableHeight = $('#visitor-filter-base-table').height();
        var appliesTableHeight = $('#visitor-filter-applies-table').height();
        var fieldsetAddedheight = Math.floor((myHeight - 20 - 38 - (mainTableHeight + 22) - (baseTableHeight + 22) - (appliesTableHeight + 22)) / 3);
        var mainFieldsetHeight = mainTableHeight + fieldsetAddedheight;
        var baseFieldsetHeight = baseTableHeight + fieldsetAddedheight;
        var appliesFieldsetHeight = appliesTableHeight + fieldsetAddedheight;
        $('.visitor-filter-placeholder-content').css({height: (myHeight - 40) + 'px'});
        $('#visitor-filter-main').css({'min-height': mainFieldsetHeight + 'px'});
        $('#visitor-filter-base').css({'min-height': baseFieldsetHeight + 'px'});
        $('#visitor-filter-applies').css({'min-height': appliesFieldsetHeight + 'px'});
        $('#visitor-filter-reason').css({'min-height': (myHeight - 61) + 'px'});
        $('#visitor-filter-expiration').css({'min-height': (myHeight - 61) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeFilterList = function() {
    if ($('#filter-list').length > 0) {
        $('#filter-list-body').css({'overflow-x': 'auto'});
    }
};

ChatDisplayLayoutClass.prototype.resizeDynamicGroupDialogs = function() {
    if ($('#dynamic-group-body').length > 0) {
        var bodyHeight = $('#dynamic-group-body').height();
        var addNewGroupFormHeight = $('#add-new-group-form').height();
        var addPersistentMemberFormHeight = $('#add-persistent-member-form').height();
        var newGroupFormHeight = bodyHeight - 22;
        var addToGroupFormHeight = bodyHeight - addNewGroupFormHeight - addPersistentMemberFormHeight - 77;

        $('#new-group-form').css({'min-height': newGroupFormHeight + 'px'});
        $('#add-to-group-form').css({'min-height': addToGroupFormHeight + 'px'});
        $('#dynamic-group-table-div').css({'min-height': (addToGroupFormHeight - 34) + 'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeTranslateOptions = function() {
    if ($('#translate-options-body').length > 0) {
        var myHeight = $('#translate-options-body').height();
        var myWidth = $('#translate-options-body').width();
        $('.translate-options-placeholder-content').css({'height': (myHeight - 40)+'px'});
        $('#translate-my-messages').css({'min-height': (myHeight - 62)+'px'});
        $('#translate-visitor-messages').css({'min-height': (myHeight - 62)+'px'});
        $('.translation-language-select').css({'min-width': '0px', width: (myWidth - 50)+'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeGeotrackingMap = function() {
    if (lzm_chatDisplay.selected_view == 'world') {
        var myHeight = $('#geotracking').height();
        var myWidth = $('#geotracking').width();
        var iframeCss = {width: (myWidth + 60)+'px', height: (myHeight-41)+'px'};
        $('#geotracking-iframe').css(iframeCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeChatView = function() {
    if ($('#no-open-chats-message').length > 0) {
        var myWidth = $('#chat-progress').width();
        var myHeight = $('#chat-progress').height();
        var textWidth = $('#no-open-chats-message').width();
        var textHeight = $('#no-open-chats-message').height();
        var textLeft = Math.round((myWidth - textWidth) / 2);
        var textTop = Math.round((myHeight - textHeight) / 2);
        var noOpenMessageCss = {left: textLeft+'px', top: textTop+'px'};

        $('#no-open-chats-message').css(noOpenMessageCss);

        if (lzm_chatDisplay.isApp && appOs == 'windows') {
            setTimeout(function() {
                var thisChatProgress = $('#chat-progress');
                thisChatProgress.scrollTop(thisChatProgress[0].scrollHeight);
            }, 200);
        }
    }
};

ChatDisplayLayoutClass.prototype.resizeSingleStartPage = function() {
    if ($('#single-startpage-iframe').length > 0) {
        var myWidth = $('#startpage-body').width();
        var myHeight = $('#startpage-body').height();

        $('#single-startpage-iframe').css({width: (myWidth - 2)+'px', height: (myHeight - 4)+'px'});
    }
};

ChatDisplayLayoutClass.prototype.resizeMenuPanels = function() {
    var windowWidth = $(window).width(), windowHeight = $(window).height();
    var settingsButtonWidth = (windowWidth > 500) ? 250 : (windowWidth > 400) ? 200 : 150;
    var blankSpaceWidth = windowWidth - 50 - settingsButtonWidth - 40 - 30 - 5;

    var menuPanelCss = {width: (windowWidth - 32)+'px', height: lzm_chatDisplay.userControlPanelHeight+'px', 'background-color': '#f1f1f1', 'border': '1px solid #cccccc',
        'border-radius': '8px', left: lzm_chatDisplay.userControlPanelPosition.left+'px', top: lzm_chatDisplay.userControlPanelPosition.top+'px', 'z-index': '10'};
    $('#main-menu-panel').css(menuPanelCss);
    $('#main-menu-panel-settings').css({width: (settingsButtonWidth)+'px'});
    $('#main-menu-panel-settings-inner').css({width: (settingsButtonWidth)+'px'});
    $('#main-menu-panel-settings-icon').css({left: (settingsButtonWidth - 30)+'px'});
    $('#main-menu-panel-settings-text').css({width: (settingsButtonWidth - 50)+'px'});
    $('#main-menu-panel-blank').css({left: (settingsButtonWidth + 50 + 2)+'px', width: (blankSpaceWidth)+'px'});
    $('#main-menu-panel-blank-inner').css({width: (blankSpaceWidth)+'px'});
};

ChatDisplayLayoutClass.prototype.resizeStartPage = function() {
    if (lzm_chatDisplay.selected_view == 'home') {
        var startPageCss = lzm_commonTools.clone(this.viewContainerCss);
        var startPageHeadlineCss = this.createHeadlineFromContainer(startPageCss);
        var startPageBodyCss = this.createBodyFromContainer(startPageCss, false, false);
        var startPageIframeCss = {border: '0px', width: (this.viewContainerWidth - 18)+'px', height: (this.viewContainerHeight - 65)+'px',
            'background-color': '#ffffff'};
        $('#startpage').css(startPageCss);
        $('#startpage-headline').css(startPageHeadlineCss);
        $('#startpage-body').css(startPageBodyCss);
        var numberOfStartPages = (lzm_chatDisplay.startPages.show_lz == 1) ? 1 : 0;
        for (var i=0; i<lzm_chatDisplay.startPages.others.length; i++) {
            numberOfStartPages++;
        }
        if (numberOfStartPages == 1) {
            this.resizeSingleStartPage();
        } else if (numberOfStartPages > 1) {
            $('.startpage-iframe').css(startPageIframeCss);
        }
    }
};

ChatDisplayLayoutClass.prototype.resizeGeoTracking = function() {
    if (lzm_chatDisplay.selected_view == 'world') {
        var geoTrackingCss = lzm_commonTools.clone(this.viewContainerCss);
        var geoTrackingHeadlineCss = this.createHeadlineFromContainer(geoTrackingCss);
        var geoTrackingBodyCss = this.createBodyFromContainer(geoTrackingCss, false, true);
        geoTrackingBodyCss.padding = '0px';
        geoTrackingBodyCss.width = (parseInt(geoTrackingBodyCss.width) + 10)+'px';
        var geoTrackingFootline = this.createFootlineFromContainer(geoTrackingCss);
        var geotrackingIframeCss = {border: '0px', 'background-color': '#ffffff'};

        $('#geotracking').css(geoTrackingCss);
        $('#geotracking-headline').css(geoTrackingHeadlineCss);
        $('#geotracking-body').css(geoTrackingBodyCss);
        $('#geotracking-footline').css(geoTrackingFootline);
        $('#geotracking-iframe').css(geotrackingIframeCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeMychats = function() {
    if (lzm_chatDisplay.selected_view == 'mychats') {
        var chatQrdPreviewHeight = $('#chat-qrd-preview').height();
        var chatProgressScroll = (lzm_chatDisplay.active_chat_reco != '') ? 'scroll' : 'hidden';
        var chatTableHeight = parseInt(this.viewContainerCss.height) + 16 - lzm_chatDisplay.activeChatPanelHeight;
        var chatTableTop = lzm_chatDisplay.activeChatPanelHeight + 23;

        var mychatsCss = lzm_commonTools.clone(this.viewContainerCss);
        var mychatsHeadlineCss = this.createHeadlineFromContainer(mychatsCss);
        var mychatsSecondheadlineCss = {position: 'absolute', left: '0px', top: 23+'px', height: lzm_chatDisplay.activeChatPanelHeight+'px',
            width: (this.viewContainerWidth + 10)+'px', 'text-align': 'left', background: '#ededed',
            margin: '0px'};
        var mychatsBodyCss = this.createBodyFromContainer(mychatsCss, true, false);
        mychatsBodyCss.height = (chatTableHeight - 38)+'px';
        mychatsBodyCss.top = chatTableTop+'px';
        mychatsBodyCss.padding = '5px';
        var mychatsButtonsCss = {position: 'absolute', left: '0px', top: (chatTableHeight - 109)+'px', width: (this.viewContainerWidth + 10)+'px',
            height: '25px', 'background-color': '#f5f5f5', 'padding-bottom': '5px', 'text-align': 'left'};
        var mychatsActionCss = {position: 'absolute', left: '0px', top: (chatTableHeight - 79)+'px', width: (this.viewContainerWidth + 10)+'px',
            height: '50px', 'background-color': '#ffffff', 'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px',
            'line-height': '0px', 'overflow': 'hidden'};
        var mychatsInputControlsCss = {position: 'absolute', width: '0px', height: '0px', border: '0px', left: '0px', top: '0px', display: 'none'};
        var mychatsInputBodyCss = {position: 'absolute', width: (this.viewContainerWidth + 10)+'px', height: '50px',
            border: '0px', 'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px', left: '0px', top: '0px',
            'overflow-y': 'hidden'};
        if (runningInIframe) {
            mychatsInputControlsCss = {position: 'absolute', width: '30px', height: '26px', border: '0px',
                left: (this.viewContainerWidth - 45)+'px', top: '0px', display: 'block', 'background-color': '#f5f5f5', padding: '12px'};
            mychatsInputBodyCss.width = (this.viewContainerWidth - 45)+'px';
        }
        var mychatsInputCss = {position: 'absolute', width: (this.viewContainerWidth + 6)+'px', height: '46px',
            border: '0px', 'border-bottom-left-radius': '4px', 'border-bottom-right-radius': '4px', left: '0px', top: '0px',
            'text-align': 'left', 'font-size': '12px', 'overflow': 'hidden'};
        var mychatsProgressCss = {position: 'absolute', left: '0px', top: '0px', width: (this.viewContainerWidth + 10)+'px',
            height: (chatTableHeight - chatQrdPreviewHeight -109) + 'px',
            'overflow-y': chatProgressScroll, 'overflow-x': 'hidden'};
        var mychatsQrdPreviewCss = {'background-color': '#ffffe1', position: 'absolute', left: '0px',
            top: (chatTableHeight - chatQrdPreviewHeight -109) + 'px',
            width: (this.viewContainerWidth + 10)+'px', 'overflow-x': 'hidden', 'overflow-y': 'auto'};
        var myChatsAllchatsCss = {position: 'absolute', left: '0px', top: '0px', width: (parseInt(mychatsBodyCss.width) + 10)+'px',
            height: (parseInt(mychatsBodyCss.height) + 10)+'px', 'background-color': '#ffffff'};

        $('#chat-container').css(mychatsCss);
        $('#chat-container-headline').css(mychatsHeadlineCss);
        $('#active-chat-panel').css(mychatsSecondheadlineCss);
        $('#chat-table').css(mychatsBodyCss);
        $('#chat-buttons').css(mychatsButtonsCss);
        $('#chat-action').css(mychatsActionCss);
        $('#chat-input-controls').css(mychatsInputControlsCss);
        $('#chat-input-body').css(mychatsInputBodyCss);
        $('#chat-input').css(mychatsInputCss);
        $('#chat-progress').css(mychatsProgressCss);
        $('#chat-qrd-preview').css(mychatsQrdPreviewCss);
        $('#chat-title').css({display: 'none'});
        $('#chat-allchats').css(myChatsAllchatsCss);
    }

};

ChatDisplayLayoutClass.prototype.resizeTicketList = function() {
    if (lzm_chatDisplay.selected_view == 'tickets') {
        var ticketListCss = lzm_commonTools.clone(this.viewContainerCss);
        var ticketListHeadlineCss = this.createHeadlineFromContainer(ticketListCss);
        var ticketListSecondHeadlineCss = this.createSecondHeadlineFromContainer(ticketListCss);
        ticketListSecondHeadlineCss['text-align'] = 'right';
        ticketListSecondHeadlineCss['font-size'] = '11px';
        ticketListSecondHeadlineCss['font-weight'] = 'none';
        var ticketListBodyCss = this.createBodyFromContainer(ticketListCss, true, true);
        ticketListBodyCss['overflow-x'] = 'auto';
        ticketListBodyCss['height'] = (parseInt(ticketListBodyCss['height']) - 13)+'px';
        var ticketListFootlineCss = this.createFootlineFromContainer(ticketListCss);
        ticketListFootlineCss['text-align'] = 'center';

        $('#ticket-list').css(ticketListCss);
        $('#ticket-list-headline').css(ticketListHeadlineCss);
        $('#ticket-list-headline2').css(ticketListSecondHeadlineCss);
        $('#ticket-list-body').css(ticketListBodyCss);
        $('#ticket-list-footline').css(ticketListFootlineCss);

        if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile && $(window).width() > 1000) {
            var leftWidth = (this.windowWidth - 383);
            var rightWidth = (lzm_displayHelper.checkIfScrollbarVisible('ticket-list-body')) ? 305 - lzm_displayHelper.getScrollBarWidth() : 305;
            $('#ticket-list-left').css({width: leftWidth+'px'});
            $('#ticket-list-right').css({width: rightWidth+'px'});
            $('.ticket-list').css({height: ($('#ticket-list-body').height() - 12) + 'px'});
        }
    }
};

ChatDisplayLayoutClass.prototype.resizeArchive = function() {
    if (lzm_chatDisplay.selected_view == 'archive') {
        var archiveCss = lzm_commonTools.clone(this.viewContainerCss);
        var archiveHeadlineCss = this.createHeadlineFromContainer(archiveCss);
        var archiveSecondHeadlineCss = this.createSecondHeadlineFromContainer(archiveCss);
        archiveSecondHeadlineCss['text-align'] = 'right';
        archiveSecondHeadlineCss['font-size'] = '11px';
        archiveSecondHeadlineCss['font-weight'] = 'none';
        var archiveBodyCss = this.createBodyFromContainer(archiveCss, true, true);
        archiveBodyCss['overflow'] = 'auto';
        archiveBodyCss['height'] = (parseInt(archiveBodyCss['height']) - 13) + 'px';
        var archiveFootlineCss = this.createFootlineFromContainer(archiveCss);
        archiveFootlineCss['text-align'] = 'center';

        $('#archive').css(archiveCss);
        $('#archive-headline').css(archiveHeadlineCss);
        $('#archive-headline2').css(archiveSecondHeadlineCss);
        $('#archive-body').css(archiveBodyCss);
        $('#archive-footline').css(archiveFootlineCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeQrdTree = function() {
    if (lzm_chatDisplay.selected_view == 'qrd') {
        var qrdTreeCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(qrdTreeCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(qrdTreeCss);
        secondHeadlineCss.height = '0px';
        var bodyCss = this.createBodyFromContainer(qrdTreeCss, false, true);
        bodyCss['overflow-x'] = 'auto';
        var footlineCss = this.createFootlineFromContainer(qrdTreeCss);

        $('#qrd-tree').css(qrdTreeCss);
        $('#qrd-tree-headline').css(headlineCss);
        $('#qrd-tree-headline2').css(secondHeadlineCss);
        $('#qrd-tree-body').css(bodyCss);
        $('#qrd-tree-footline').css(footlineCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeOperatorList = function() {
    if (lzm_chatDisplay.selected_view == 'internal') {
        var operatorListCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(operatorListCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(operatorListCss);
        secondHeadlineCss.height = '0px';
        var bodyCss = this.createBodyFromContainer(operatorListCss, false, false);
        bodyCss['overflow-y'] = 'auto';

        $('#operator-list').css(operatorListCss);
        $('#operator-list-headline').css(headlineCss);
        $('#operator-list-headline2').css(secondHeadlineCss);
        $('#operator-list-body').css(bodyCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeVisitorList = function() {
    if (lzm_chatDisplay.selected_view == 'external') {
        var visitorListCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(visitorListCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(visitorListCss);
        secondHeadlineCss['text-align'] = 'left';
        var bodyCss = this.createBodyFromContainer(visitorListCss, true, false);
        bodyCss.overflow = 'auto';
        bodyCss.height = (parseInt(bodyCss.height) - 3) + 'px';

        $('#visitor-list').css(visitorListCss);
        $('#visitor-list-headline').css(headlineCss);
        $('#visitor-list-headline2').css(secondHeadlineCss);
        $('#visitor-list-table-div').css(bodyCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeFilter = function() {
    if (lzm_chatDisplay.selected_view == 'filter') {
        var filterCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(filterCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(filterCss);
        //secondHeadlineCss['text-align'] = 'left';
        var bodyCss = this.createBodyFromContainer(filterCss, true, false);

        $('#filter').css(filterCss);
        $('#filter-headline').css(headlineCss);
        $('#filter-headline2').css(secondHeadlineCss);
        $('#filter-body').css(bodyCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeAllChats = function() {
    if (lzm_chatDisplay.selected_view == 'mychats') {
        var allChatsCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(allChatsCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(allChatsCss);
        var bodyCss = this.createBodyFromContainer(allChatsCss, true, false);
        bodyCss.top = '0px';
        bodyCss.height = (parseInt(bodyCss.height) - 30)+'px';
        bodyCss.overflow = 'auto';
        secondHeadlineCss.top = (parseInt(bodyCss.height)  + 10)+'px';

        $('#all-chats').css(allChatsCss);
        $('#all-chats-headline').css(headlineCss);
        $('#all-chats-headline2').css(secondHeadlineCss);
        $('#all-chats-body').css(bodyCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeReportList = function() {
    if (lzm_chatDisplay.selected_view == 'reports') {
        var reportListCss = lzm_commonTools.clone(this.viewContainerCss);
        var headlineCss = this.createHeadlineFromContainer(reportListCss);
        var secondHeadlineCss = this.createSecondHeadlineFromContainer(reportListCss);
        secondHeadlineCss['text-align'] = 'right';
        secondHeadlineCss['height'] = '22px';
        secondHeadlineCss['padding-top'] = '6px';
        //secondHeadlineCss['text-align'] = 'left';
        var bodyCss = this.createBodyFromContainer(reportListCss, true, true);
        bodyCss['overflow'] = 'auto';
        bodyCss['height'] = (parseInt(bodyCss['height']) - 13) + 'px';
        var footlineCss = this.createFootlineFromContainer(reportListCss);
        footlineCss['text-align'] = 'center';

        $('#report-list').css(reportListCss);
        $('#report-list-headline').css(headlineCss);
        $('#report-list-headline2').css(secondHeadlineCss);
        $('#report-list-body').css(bodyCss);
        $('#report-list-footline').css(footlineCss);
    }
};

ChatDisplayLayoutClass.prototype.resizeTranslationEditor = function() {
    if ($('#translation-editor').length > 0) {
        var bodyHeight = $('#translation-editor-body').height();
        var bodyWidth = $('#translation-editor-body').width();
        var scrollBarHeight = (lzm_displayHelper.checkIfScrollbarVisible('translation-editor-body', 'horizontal')) ?
            lzm_displayHelper.getScrollBarHeight() : 0;
        var fsScrollbarIsVisible = (lzm_chatDisplay.FullscreenDialogWindowWidth <= 1030) ? 'scroll' : 'hidden';
        var fsScrollBarHeight = (lzm_chatDisplay.FullscreenDialogWindowWidth <= 1030) ? lzm_displayHelper.getScrollBarHeight() : 0;
        var colHeight = bodyHeight - scrollBarHeight - fsScrollBarHeight - 38;
        var pfxArray = ['', 'srv-'];
        var langSelColWidth = 250;
        var langTableWidth = langSelColWidth - 22;
        var editorColWidth = Math.max(750, bodyWidth - langSelColWidth - 20);
        //$('#translation-editor-body').css({'overflow': 'auto'});
        $('.translation-editor-placeholder-content').css({position: 'relative', height: (bodyHeight - 40)+'px', 'overflow-y': 'hidden', 'overflow-x': fsScrollbarIsVisible});
        $('#translation-editor-placeholder-tabs-row').css({position: 'relative', 'z-index': 1});
        for (var i=0; i<pfxArray.length; i++) {
            var pfx = pfxArray[i];
            $('#' + pfx + 'translation-language-selection').css({position: 'absolute', left: '5px', top: '4px', width: langSelColWidth+'px', height: colHeight+'px'});
            $('#' + pfx + 'translation-string-editor').css({position: 'absolute', left: '263px', top: '4px', width: editorColWidth+'px', height: colHeight+'px'});
            $('#' + pfx + 'translation-language-selection-inner').css({'min-height': (colHeight - 22)+'px'});
            $('#' + pfx + 'translation-string-editor-inner').css({'min-height': (colHeight - 22)+'px'});
            $('#' + pfx + 'translation-languages-bottom').css({position: 'absolute', bottom: '0px'});
            var leftButtonsHeight = $('#' + pfx + 'translation-languages-bottom').height();
            $('#' + pfx + 'translation-languages-top').css({position: 'absolute', top: '22px', height: (colHeight - leftButtonsHeight - 27)+'px', 'overflow-y': 'auto',
                border: '1px solid #ccc', 'border-radius': '4px'});
            $('#' + pfx + 'translation-values-bottom').css({position: 'absolute', bottom: '0px', width: (editorColWidth - 22)+'px'});
            var rightButtonsHeight = $('#' + pfx + 'translation-values-bottom').height();
            $('#' + pfx + 'translation-values-top').css({position: 'absolute', top: '22px', height: (colHeight - rightButtonsHeight - 38)+'px', width: (editorColWidth - 22)+'px',
                'overflow-y': 'auto', border: '1px solid #ccc', 'border-radius': '4px'});
            $('#' + pfx + 'translation-search-string').css({width: (editorColWidth - 222)+'px'});
            $('#' + pfx + 'translation-language-table').css({'width': langTableWidth+'px'});
            $('.translation-lang-btn').each(function() {
                var myBtnWidth = Math.max(0, $(this).width());
                if (myBtnWidth != 0) {
                    var myLeftPadding = Math.floor((langTableWidth - myBtnWidth) / 2 - 4);
                    var myRightPadding = Math.ceil((langTableWidth - myBtnWidth) / 2 - 4);
                    $(this).css({'padding-left': myLeftPadding+'px', 'padding-right': myRightPadding+'px'});
                }
            });
            var columnWidth = $('#' + pfx + 'translation-translated-column').width();
            $('#' + pfx + 'translation-string-input').css({width: (columnWidth - 20)+'px'});


            // Add Language
            $('#' + pfx + 'translation-string-add-language').css({'min-height': (colHeight + 16)+'px'});
            /*var inputTableWidth = $('#' + pfx + 'add-translation-input-table').width();
            $('#' + pfx + 'select-translation-language').css({width: (inputTableWidth - 6)+'px'});*/
        }
    }
};

ChatDisplayLayoutClass.prototype.resizeSendTranscriptDialog = function() {
    if ($('#send-transcript-to').length > 0) {
        var bodyHeight = $('#send-transcript-to-body').height();
        var bodyWidth = $('#send-transcript-to-body').width();
        var emailWidth = Math.min($('#send-transcript-to-inner').width() - 12, 500);

        $('.send-transcript-placeholder-content').css({height: (bodyHeight - 40)+'px'});
        $('#send-transcript-to-inner').css({'min-height': (bodyHeight - 40 - 22)+'px'});
        $('#send-transcript-to-email').css({'min-width': '0px', width: emailWidth+'px'});
    }
};

/************************************************** Some general tools **************************************************/
ChatDisplayLayoutClass.prototype.createHeadlineFromContainer = function(containerCss) {
    var headlineCss = {position: 'absolute', top: '0px', left: '0px', width: containerCss.width, height: '22px',
        'border-bottom': '1px solid #cccccc', 'border-radius': '0px', 'background-image': 'none',
        'background-color': '#f5f5f5', color: '#333333', 'text-shadow': 'none', 'font-weight': 'bold', 'font-size': '10px',
        'line-height': '0px', 'text-align': 'left', 'padding-left': '10px'};

    return headlineCss;
};

ChatDisplayLayoutClass.prototype.createSecondHeadlineFromContainer = function(containerCss) {
    var headlineCss = {position: 'absolute', top: '23px', left: '0px', width: (parseInt(containerCss.width) + 10)+'px',
        height: '28px', 'background-color': '#ededed', color: '#333333', 'text-shadow': 'none', margin: '0px'};

    return headlineCss;
};

ChatDisplayLayoutClass.prototype.createBodyFromContainer = function (containerCss, withSecondHeadline, withFootline) {
    var bodyHeight = (withSecondHeadline && withFootline) ? this.viewContainerHeight - 66 :
        (withSecondHeadline) ? this.viewContainerHeight - 48 :
            (withFootline) ? this.viewContainerHeight - 41 : this.viewContainerHeight - 23;
    var bodyTop = (withSecondHeadline) ? 51 : 23;
    var bodyCss = {position: 'absolute', 'text-align': 'left', width: containerCss.width, height: bodyHeight+'px',
        top: bodyTop+'px', left: '0px', overflow: 'hidden', padding: '5px', 'text-overflow': 'ellipsis'};

    return bodyCss;
};

ChatDisplayLayoutClass.prototype.createFootlineFromContainer = function(containerCss) {
    var footlineCss = {position: 'absolute', top: (this.viewContainerHeight - 18)+'px', left: '0px',
        width: (parseInt(containerCss.width) + 6)+'px', height: '21px', 'border-radius': '0px',
        'background-color': '#ededed', color: '#333333', 'text-shadow': 'none', 'font-size': '11px', 'line-height': '0px',
        'text-align': 'right', 'padding': '14px 2px 0px'};

    return footlineCss;
};