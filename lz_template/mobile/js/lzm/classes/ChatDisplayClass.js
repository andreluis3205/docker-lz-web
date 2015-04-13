/****************************************************************************************
 * LiveZilla ChatDisplayClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

/**
 * Class controlling the page layout and the creation of the html parts
 * @constructor
 */
function ChatDisplayClass(now, lzm_commonConfig, lzm_commonTools, lzm_chatInputEditor, web, app, mobile, messageTemplates,
                          userConfigData, multiServerId) {
    this.debuggingDisplayMode = 'none';
    this.debuggingDisplayWidth = 0;

    // variables controlling the behaviour of the chat page
    this.senderType = '';
    this.myLoginId = '';
    this.myId = '';
    this.myName = '';
    this.myEmail = '';
    this.myGroups = [];
    this.allMyGroupsAreOffline = false;
    this.active_chat = 'LIST';
    this.active_chat_reco = 'LIST';
    this.active_chat_realname = '';
    this.user_status = 0;
    this.selected_view = 'mychats';
    this.lastActiveChat = 'LIST';
    this.lastChatSendingNotification = '';
    this.infoCaller = '';
    this.infoUser = {};
    this.thisUser = {id: ''};
    this.editThisTranslation = '';
    this.chatActivity = false;
    this.soundPlayed = [];
    this.isRinging = {};
    this.ringSenderList = [];
    this.VisitorListCreated = false;
    this.ShowVisitorId = '';
    this.newExternalUsers = [];
    this.changedExternalUsers = [];
    this.userLanguage = 'en';
    this.closedChats = [];
    this.selectedResource = '';
    this.tabSelectedResources = ['1', '1', '1'];

    this.serverIsDisabled = false;
    this.lastDiabledWarningTime = 0;
    this.askBeforeUnload = true;

    // Values from the user's configuration
    this.startPages = {show_lz: '0', others: []};
    this.startPageTabControlDoesExist = false;
    this.awayAfterTime = userConfigData['awayAfter'];
    this.volume = userConfigData['userVolume'];
    this.playNewMessageSound = userConfigData['playIncomingMessageSound'];
    this.playNewChatSound = userConfigData['playIncomingChatSound'];
    this.repeatNewChatSound = userConfigData['repeatIncomingChatSound'];
    this.playNewTicketSound = userConfigData['playIncomingTicketSound'];
    this.vibrateNotifications = 1;
    this.ticketReadStatusChecked = 1;
    this.qrdAutoSearch = 1;
    this.alertNewFilter = 1;
    this.backgroundModeChecked = userConfigData['backgroundMode'];
    this.saveConnections = 0;
    if (app && typeof lzm_deviceInterface != 'undefined' && typeof lzm_deviceInterface.keepActiveInBackgroundMode != 'undefined') {
        lzm_deviceInterface.keepActiveInBackgroundMode(this.backgroundModeChecked == 1);
    }
    this.autoAcceptChecked = false;
    this.allViewSelectEntries = {home: {pos: 0, title: 'Startpage', icon: 'img/home-white.png'},
        world: {pos: 0, title: 'Map', icon: ''},
        mychats: {pos: 0, title: 'My Chats', icon: ''}, tickets: {pos: 0, title: 'Tickets', icon: ''},
        external: {pos: 0, title: 'Visitors', icon: ''}, archive: {pos: 0, title: 'Chat Archive', icon: ''},
        internal: {pos: 0, title: 'Operators', icon: ''}, qrd: {pos: 0, title: 'Resources', icon: ''},
        reports: {pos: 1, title: 'Reports', icon: ''}};
    // t('Map') t('All Chats')
    this.showViewSelectPanel = {home: 1, world: 1, mychats: 1, tickets: 1, external: 1, archive: 1, internal: 1, qrd: 1, report: 1};
    this.viewSelectArray = [];
    this.firstVisibleView = 'home';
    this.chatsViewMarked = false;
    this.myChatsCounter = 0;
    this.mainTableColumns = {visitor: [], visitor_custom: [], ticket: [], ticket_custom: [], archive: [], archive_custom: [], allchats: [], allchats_custom: []};
    this.availableLanguages = {'aa':'Afar','ab':'Abkhazian','af':'Afrikaans','am':'Amharic','ar':'Arabic','as':'Assamese','ay':'Aymara','az':'Azerbaijani','ba':'Bashkir',
        'be':'Byelorussian','bg':'Bulgarian','bh':'Bihari','bi':'Bislama','bn':'Bengali','bo':'Tibetan','br':'Breton','ca':'Catalan','co':'Corsican','cs':'Czech','cy':'Welsh',
        'da':'Danish','de':'German','dz':'Bhutani','el':'Greek','en':'English','en-gb':'English (Great Britain)','en-us':'English (United States)','eo':'Esperanto','es':'Spanish',
        'et':'Estonian','eu':'Basque','fa':'Persian','fi':'Finnish','fj':'Fiji','fo':'Faeroese','fr':'French','fy':'Frisian','ga':'Irish','gd':'Gaelic','gl':'Galician','gn':'Guarani',
        'gu':'Gujarati','ha':'Hausa','he':'Hebrew','hi':'Hindi','hr':'Croatian','hu':'Hungarian','hy':'Armenian','ia':'Interlingua','id':'Indonesian','ie':'Interlingue','ik':'Inupiak',
        'is':'Icelandic','it':'Italian','ja':'Japanese','ji':'Yiddish','jw':'Javanese','ka':'Georgian','kk':'Kazakh','kl':'Greenlandic','km':'Cambodian','kn':'Kannada','ko':'Korean',
        'ks':'Kashmiri','ku':'Kurdish','ky':'Kirghiz','la':'Latin','ln':'Lingala','lo':'Laothian','lt':'Lithuanian','lv':'Latvian','mg':'Malagasy','mi':'Maori','mk':'Macedonian',
        'ml':'Malayalam','mn':'Mongolian','mo':'Moldavian','mr':'Marathi','ms':'Malay','mt':'Maltese','my':'Burmese','na':'Nauru','nb':'Norwegian (Bokmal)','ne':'Nepali','nl':'Dutch',
        'nn':'Norwegian (Nynorsk)','oc':'Occitan','om':'Oromo','or':'Oriya','pa':'Punjabi','pl':'Polish','ps':'Pashto','pt':'Portuguese','pt-br':'Portuguese (Brazil)','qu':'Quechua',
        'rm':'Rhaeto-Romance','rn':'Kirundi','ro':'Romanian','ru':'Russian','rw':'Kinyarwanda','sa':'Sanskrit','sd':'Sindhi','sg':'Sangro','sh':'Serbo-Croatian','si':'Singhalese',
        'sk':'Slovak','sl':'Slovenian','sm':'Samoan','sn':'Shona','so':'Somali','sq':'Albanian','sr':'Serbian','ss':'Siswati','st':'Sesotho','su':'Sudanese','sv':'Swedish','sw':'Swahili',
        'ta':'Tamil','te':'Tegulu','tg':'Tajik','th':'Thai','ti':'Tigrinya','tk':'Turkmen','tl':'Tagalog','tn':'Setswana','to':'Tonga','tr':'Turkish','ts':'Tsonga','tt':'Tatar','tw':'Twi',
        'uk':'Ukrainian','ur':'Urdu','uz':'Uzbek','vi':'Vietnamese','vo':'Volapuk','wo':'Wolof','xh':'Xhosa','yo':'Yoruba','zh':'Chinese','zh-cn':'Chinese (Simplified)',
        'zh-tw':'Chinese (Traditional)','zu':'Zulu'};

    this.searchButtonUpSet = {};

    this.storedSuperMenu = null;

    this.StoredDialogs = {};
    this.StoredDialogIds = [];
    this.dialogData = {};

    this.visitorListIsScrolling = 0;
    this.visitorListScrollingWasBlocked = false;

    this.ticketListTickets = [];
    this.ticket = {};
    this.ticketOpenMessages = [];
    this.ticketReplyDraft = {};
    this.showTicketContextMenu = false;
    this.showTicketFilterMenu = false;
    this.showTicketMessageContextMenu = false;
    this.ticketMessageWidth = 0;
    this.ticketDialogId = {};
    this.ticketResourceText = {};
    this.ticketReadArray = [];
    this.ticketUnreadArray = [];
    this.ticketGlobalValues = {t: -1, r: -1, mr: 0, updating: false};
    this.ticketFilterChecked = ['visible', 'visible', 'visible', 'hidden'];
    this.ticketFilterPersonal = 'hidden';
    this.ticketFilterGroup = 'hidden';
    this.selectedTicketRow = '';
    this.selectedTicketRowNo = 0;
    this.numberOfUnreadTickets = -1;
    this.emailReadArray = [];
    this.emailDeletedArray = [];
    this.ticketsFromEmails = [];
    this.emailsToTickets = [];

    this.numberOfRunningChats = 0;

    this.recentlyUsedResources = [];

    this.showArchiveFilterMenu = false;
    this.showArchiveListContextMenu = false;
    this.archiveFilterChecked = ['visible', 'visible', 'visible'];

    this.showReportFilterMenu = false;
    this.showReportContextMenu = false;

    this.chatTranslations = {};
    this.translationLanguages = [];
    this.translationLangCodes = [];
    this.translationServiceError = 'No translations fetched';

    /*this.viewSelectPanelEventsAreRegistered = false;
    this.viewSelectPanelTochStart = 0;
    this.viewSelectPanelTochEnd = 0;*/

    this.doNotUpdateOpList = false;
    this.newDynGroupHash = '';

    this.lastActiveCallCounter = 0;
    this.lastActiveCalledAt = 0;

    this.showUserstatusHtml = false;
    this.showUsersettingsHtml = false;
    this.showMinifiedDialogsHtml = false;
    this.settingsDialogue = false;
    this.showBrowserHistory = ['', ''];
    this.showOpInviteList = false;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.initialWindowHeight = 0;
    this.chatPanelHeight = 0;
    this.visitorListHeight = 140;
    this.visitorSortBy = 'time';
    this.activeVisitorNumber = 0;
    this.visitorInfoVisibleTab = 'info';
    this.blankButtonWidth = 0;
    this.userControlPanelHeight = 40;
    this.userControlPanelPosition = {top: 10, left: 15};
    this.userControlPanelWidth = 0;

    this.showChatActionsMenu = false;
    this.showOpInviteDialog = false;

    this.translationEditor = new ChatTranslationEditorClass();
    this.reportsDisplay = new ChatReportsClass();
    this.settingsDisplay = new ChatSettingsClass();
    this.startpageDisplay = new ChatStartpageClass();
    this.resourcesDisplay = new ChatResourcesClass();
    this.archiveDisplay = new ChatArchiveClass();
    this.visitorDisplay = new ChatVisitorClass();
    this.ticketDisplay = new ChatTicketClass();
    this.allchatsDisplay = new ChatAllchatsClass();

    this.chatLeftByOperators = {};

    this.validationErrorCount = 0;
    this.alertDialogIsVisible = false;
    this.blinkingIconsInterval = false;
    this.blinkingIconsArray = [];
    this.blinkingIconsStatus = 0;
    this.lastBlinkingTime = 0;

    // variables passed to this class as parameters
    this.now = now;
    this.lzm_commonConfig = lzm_commonConfig;
    this.lzm_commonTools = lzm_commonTools;
    this.lzm_chatInputEditor = lzm_chatInputEditor;

    this.lzm_chatTimeStamp = {};
    this.isApp = app;
    this.isWeb = web;
    this.isMobile = mobile;
    this.messageTemplates = messageTemplates;
    this.multiServerId = multiServerId;

    this.activeChatPanelHeight = 28;
    this.activeChatPanelLineCounter = 1;
    this.dialogWindowWidth = 0;
    this.dialogWindowHeight = 0;
    this.FullscreenDialogWindowWidth = 0;
    this.FullscreenDialogWindowHeight = 0;
    this.dialogWindowLeft = 0;
    this.dialogWindowTop = 0;
    this.FullscreenDialogWindowLeft = 0;
    this.FullscreenDialogWindowTop = 0;
    this.dialogWindowContainerCss = {};
    this.dialogWindowCss = {};
    this.dialogWindowHeadlineCss = {};
    this.dialogWindowBodyCss = {};
    this.dialogWindowFootlineCss = {};
    this.FullscreenDialogWindowCss = {};
    this.FullscreenDialogWindowHeadlineCss = {};
    this.FullscreenDialogWindowBodyCss = {};
    this.FullscreenDialogWindowFootlineCss = {};

    this.openChats = [];

        this.browserName = 'other';
    if ($.browser.chrome)
        this.browserName = 'chrome';
    else if ($.browser.mozilla)
        this.browserName = 'mozilla';
    else if ($.browser.msie)
        this.browserName = 'ie';
    else if ($.browser.safari)
        this.browserName = 'safari';
    else if ($.browser.opera)
        this.browserName = 'opera';
    if ($.browser.version.indexOf('.') != -1) {
        this.browserVersion = $.browser.version.split('.')[0];
        this.browserMinorVersion = $.browser.version.split('.')[1];
    } else {
        this.browserVersion = $.browser.version;
        this.browserMinorVersion = 0;
    }
    // workarround for IE 11
    if (this.browserName == 'mozilla' && this.browserVersion == 11) {
        this.browserName = 'ie';
    }
    this.scrollbarWidth = lzm_displayHelper.getScrollBarWidth();

    var thisClass = this;
    this.startBlinkingIcons();

    lzm_displayHelper.browserName = this.browserName;
    lzm_displayHelper.browserVersion = this.browserVersion;
    lzm_displayHelper.browserMinorVersion = this.browserMinorVersion;
    this.templateCloseButton = '<div id="%BTNID%" %BTNONCLICK%' +
        ' style=\'background-image: ' + lzm_displayHelper.addBrowserSpecificGradient('url("img/205-close.png")') + ';' +
        ' background-repeat: no-repeat; background-position: center; display: none;' +
        ' left: %BTNLEFT%px; top: %BTNTOP%px; width: 16px; %BTNDEFAULTCSS%\'></div>';
}

ChatDisplayClass.prototype.resetWebApp = function() {
    this.validationErrorCount = 0;
    this.blinkingIconsArray = [];
    this.blinkingIconsStatus = 0;

    this.stopRinging([]);
};

ChatDisplayClass.prototype.startBlinkingIcons = function() {
    var that = this;
    if (that.blinkingIconsInterval) {
        clearInterval(that.blinkingIconsInterval);
    }
    that.blinkingIconsInterval = setInterval(function() {
        that.blinkIcons();
    },800);
};

ChatDisplayClass.prototype.setBlinkingIconsArray = function(blinkingIconsArray) {
    this.blinkingIconsArray = blinkingIconsArray;
};

ChatDisplayClass.prototype.blinkIcons = function() {
    this.lastBlinkingTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    var userChat, group, operator, chatIsNew = false, buttonId;
    var logo = 'img/lz_offline_14.png';
    for (var i=0; i<this.blinkingIconsArray.length; i++) {
        try {
            userChat = lzm_chatServerEvaluation.userChats.getUserChat(this.blinkingIconsArray[i]);
            chatIsNew = (userChat != null && (userChat.status == 'new' || (typeof userChat.fupr != 'undefined' &&
                (typeof userChat.fuprDone == 'undefined' || userChat.fuprDone != userChat.fupr.id))));
            if (this.blinkingIconsStatus == 1 && (userChat.b_id == '' || userChat.my_chat)) {
                if (userChat.member_status != 2) {
                    if (!chatIsNew) {
                        logo ='img/176-keyboard_14.png';
                    } else {
                        logo = 'img/217-quote_14.png';
                    }
                } else {
                    logo = 'img/lz_hidden_14.png';
                }
            } else {
                group = lzm_chatServerEvaluation.groups.getGroup(this.blinkingIconsArray[i]);
                operator = lzm_chatServerEvaluation.operators.getOperator(this.blinkingIconsArray[i]);
                if (this.blinkingIconsArray[i] == 'everyoneintern' || (group != null && typeof group.members == 'undefined')) {
                    logo = 'img/lz_group_14.png';
                } else if (group != null && typeof group.members != 'undefined' && group.is_active && (userChat == null || userChat.status != 'left')) {
                    logo = 'img/lz_group_dynamic_14.png';
                } else if (group != null && typeof group.members != 'undefined' && !group.is_active) {
                    logo = 'img/lz_offline_14.png';
                } else if (operator != null) {
                    logo = operator.status_logo;
                    // Keep img/lz_away_14.png and img/lz_busy_14.png (comment needed for release package creation)
                } else {
                    if (userChat != null ) {
                        if ((userChat.status == 'read' || userChat.status == 'new') && (userChat.b_id == '' || userChat.my_chat)) {
                            if (userChat.member_status != 2) {
                                logo = 'img/lz_online_14.png';
                            } else {
                                logo = 'img/lz_hidden_14.png';
                            }
                        } else {
                            logo = 'img/lz_offline_14.png';
                        }
                    }
                }
            }
            buttonId = '#chat-button-' + this.blinkingIconsArray[i].replace(/~/,'_');
            $(buttonId).children('span').css('background-image',"url('" + logo + "')");
        } catch(ex) {}
    }
    var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
    for (var key in userChats) {
        try {
            if(userChats.hasOwnProperty(key)) {
                group = lzm_chatServerEvaluation.groups.getGroup(key);
                userChat = lzm_chatServerEvaluation.userChats.getUserChat(key);
                operator = lzm_chatServerEvaluation.operators.getOperator(key);
                if ($.inArray(key, this.blinkingIconsArray) == -1) {
                    chatIsNew = (userChat['status'] == 'new' ||
                    (typeof userChat.fupr != 'undefined' &&
                    (typeof userChat.fuprDone == 'undefined' ||
                        userChat.fuprDone != userChat.fupr.id)));
                    if (chatIsNew && this.blinkingIconsStatus == 1 && (userChat.b_id == '' || userChat.my_chat)) {
                        if (userChat.member_status != 2) {
                            logo = 'img/217-quote_14.png';
                        } else {
                            logo = 'img/lz_hidden_14.png';
                        }
                    } else {
                        if (key == 'everyoneintern' || (group != null && typeof group.members == 'undefined')) {
                            logo = 'img/lz_group_14.png';
                        } else if (group != null && typeof group.members != 'undefined' && group.is_active && (userChat == null || userChat.status != 'left')) {
                            logo = 'img/lz_group_dynamic_14.png';
                        } else if (operator != null) {
                            logo = operator.status_logo;
                        } else {
                            if (typeof (userChat != 'undefined' )) {
                                if ((userChat.status == 'read' || userChat.status == 'new') && (userChat.b_id == '' || userChat.my_chat)) {
                                    if (userChat.member_status != 2) {
                                        logo = 'img/lz_online_14.png';
                                    } else {
                                        logo = 'img/lz_hidden_14.png';
                                    }
                                } else {
                                    logo = 'img/lz_offline_14.png';
                                }
                            }
                        }
                    }
                    buttonId = '#chat-button-' + key.replace(/~/,'_');
                    if ($(buttonId).length != 0) {
                        var existingLogo = $(buttonId).children('span').css('background-image').replace(/url\((.*?)\)/, '$1').split('/');
                        existingLogo = 'img/' + existingLogo[existingLogo.length - 1];
                        if (logo != existingLogo) {
                            $(buttonId).children('span').css('background-image',"url('" + logo + "')");
                        }
                    }
                }
            }
        } catch(ex) {}
    }
    this.blinkingIconsStatus = 1 - this.blinkingIconsStatus;
};

ChatDisplayClass.prototype.createChatWindowLayout = function (recreate, createChatPanel) {
    createChatPanel = (typeof createChatPanel != 'undefined') ? createChatPanel :  true;
    // Definitions for jquery selectors
    var thisBody = $('body');
    var thisChatPage = $('#chat_page');
    var thisContentChat = $('#content_chat');
    var thisChat = $('#chat');
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    if (windowHeight >= this.initialWindowHeight) {
        this.initialWindowHeight = windowHeight;
    }
    var chatPageHeight = windowHeight;
    if (this.isApp && windowHeight < 390) {
        chatPageHeight = Math.min(390, this.initialWindowHeight);
    }

    // Do only do layout changes, when they are neccessary
    if (recreate || windowWidth != this.windowWidth || windowHeight != this.windowHeight ||
        this.activeChatPanelHeight < (this.chatPanelHeight - 5) ||
        this.activeChatPanelHeight > (this.chatPanelHeight + 5)) {
        this.chatPanelHeight = this.activeChatPanelHeight;

        var userControlPanelPosition = this.userControlPanelPosition;
        var userControlPanelHeight = this.userControlPanelHeight;
        this.userControlPanelWidth = windowWidth - 32;
        var userControlPanelWidth = this.userControlPanelWidth;
        var viewSelectPanelHeight = 31;

        // variable declarations, if neccessary
        var chatWindowWidth = userControlPanelWidth - 5;
        var chatWindowHeight = chatPageHeight - (userControlPanelPosition.top + userControlPanelHeight) - 20 - viewSelectPanelHeight;
        var chatWindowTop = userControlPanelPosition.top + userControlPanelHeight + 13 + viewSelectPanelHeight;
        this.FullscreenDialogWindowWidth = (windowWidth <= 600 || windowHeight <= 500) ? windowWidth : Math.floor(0.95 * windowWidth) - 40;
        this.FullscreenDialogWindowHeight = (windowWidth <= 600 || windowHeight <= 500) ? windowHeight : Math.floor(0.95 * windowHeight) - 40;
        if (this.FullscreenDialogWindowWidth <= 600 || this.FullscreenDialogWindowHeight <= 500) {
            this.dialogWindowWidth = this.FullscreenDialogWindowWidth;
            this.dialogWindowHeight = this.FullscreenDialogWindowHeight;
        } else {
            this.dialogWindowWidth = 600;
            this.dialogWindowHeight = 500;
        }
        this.dialogWindowLeft = (this.dialogWindowWidth < windowWidth) ? Math.floor((windowWidth - this.dialogWindowWidth) / 2) : 0;
        this.FullscreenDialogWindowLeft = (this.FullscreenDialogWindowWidth < windowWidth) ? Math.floor((windowWidth - this.FullscreenDialogWindowWidth) / 2) : 0;
        this.dialogWindowTop = (this.dialogWindowHeight < windowHeight) ? Math.floor((windowHeight - this.dialogWindowHeight) / 2) : 0;
        this.FullscreenDialogWindowTop = (this.FullscreenDialogWindowHeight < windowHeight) ? Math.floor((windowHeight - this.FullscreenDialogWindowHeight) / 2) : 0;

        var thisChatPageCss = {
            position: 'absolute',
            top: '0px',
            left: '0px',
            bottom: '0px',
            width: (windowWidth)+'px',
            height: chatPageHeight+'px',
            'overflow-y': 'hidden'
        };
        if (this.isApp && windowHeight < 390) {
            thisChatPageCss = {
                position: 'absolute',
                top: 'auto',
                left: '0px',
                bottom: '0px',
                width: windowWidth+'px',
                height: chatPageHeight+'px',
                'overflow-y': 'hidden'
            };
        }

        // put together the css objects
        var thisChatCss = {width: chatWindowWidth + 'px', height: chatWindowHeight + 'px', padding: '5px 5px 5px 5px',
            position: 'absolute', left: (userControlPanelPosition.left) + 'px',
            top: (chatWindowTop) + 'px'};
        var dialogWindowBorder = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '2px solid #666' : '0px';
        var dialogWindowBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '6px' : '0px';
        var dialWinIntBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '4px' : '0px';
        this.dialogWindowContainerCss = {
            position: 'absolute', left: '0px', bottom: '0px', width: windowWidth+'px', height: windowHeight+'px',
            'background-color': 'rgba(0,0,0,0.75)', 'z-index': '1001', overflow: 'hidden'
        };
        this.dialogWindowCss = {
            position: 'absolute', left: this.dialogWindowLeft+'px', bottom: this.dialogWindowTop+'px',
            width: this.dialogWindowWidth+'px', height: this.dialogWindowHeight+'px',
            border: dialogWindowBorder, 'border-radius': dialogWindowBorderRadius, 'z-index': '1002'
        };
        this.dialogWindowHeadlineCss = {
            position: 'absolute', left: '0px', top: '0px', 'border-bottom': '1px solid #ccc',
            width: (this.dialogWindowWidth - 5)+'px', height: '20px',
            'border-top-left-radius': dialWinIntBorderRadius, 'border-top-right-radius': dialWinIntBorderRadius,
            padding: '6px 0px 0px 5px', 'font-weight': 'bold', 'text-shadow': 'none',
            'background-color': '#8c8c8c', color: '#ffffff'
        };
        this.dialogWindowBodyCss = {
            position: 'absolute', left: '0px', top: '27px',
            width: (this.dialogWindowWidth - 10)+'px', height: (this.dialogWindowHeight - 73)+'px',
            padding: '4px 5px 4px 5px', 'text-shadow': 'none',
            'background-color': '#FFFFFF', 'overflow-y': 'auto', 'overflow-x': 'hidden'
        };
        this.dialogWindowFootlineCss = {
            position: 'absolute', left: '0px', top: (this.dialogWindowHeight - 38)+'px', 'border-top': '1px solid #ccc',
            width: (this.dialogWindowWidth - 6)+'px', height: '27px', 'text-align': 'right',
            padding: '10px 6px 0px 0px',
            'border-bottom-left-radius': dialWinIntBorderRadius, 'border-bottom-right-radius': dialWinIntBorderRadius,
            'background-color': '#f5f5f5'
        };

        var fscrWdBorder = (this.FullscreenDialogWindowWidth < windowWidth) ? '1px solid #666' : '0px';
        var fscrWdBdRadius = (this.FullscreenDialogWindowWidth < windowWidth) ? '6px' : '0px';
        var fscrWdIntBdRadius = (this.FullscreenDialogWindowWidth < windowWidth) ? '4px' : '0px';
        this.FullscreenDialogWindowCss = {
            position: 'absolute', left: this.FullscreenDialogWindowLeft+'px', bottom: this.FullscreenDialogWindowTop+'px',
            width: this.FullscreenDialogWindowWidth+'px', height: this.FullscreenDialogWindowHeight+'px',
            border: fscrWdBorder, 'border-radius': fscrWdBdRadius, 'z-index': '1002'
        };
        this.FullscreenDialogWindowHeadlineCss = {
            position: 'absolute', left: '0px', top: '0px', 'border-bottom': '1px solid #ccc',
            width: (this.FullscreenDialogWindowWidth - 5)+'px', height: '20px',
            'border-top-left-radius': fscrWdIntBdRadius, 'border-top-right-radius': fscrWdIntBdRadius,
            padding: '6px 0px 0px 5px', 'font-weight': 'bold', 'text-shadow': 'none',
            'background-color': '#8c8c8c', color: '#ffffff'
        };
        this.FullscreenDialogWindowBodyCss = {
            position: 'absolute', left: '0px', top: '27px',
            width: (this.FullscreenDialogWindowWidth - 10)+'px', height: (this.FullscreenDialogWindowHeight - 73)+'px',
            padding: '4px 5px 4px 5px', 'text-shadow': 'none',
            'background-color': '#FFFFFF', 'overflow-y': 'auto', 'overflow-x': 'hidden'
        };
        this.FullscreenDialogWindowFootlineCss = {
            position: 'absolute', left: '0px', top: (this.FullscreenDialogWindowHeight - 38)+'px', 'border-top': '1px solid #ccc',
            width: (this.FullscreenDialogWindowWidth - 6)+'px', height: '27px', 'text-align': 'right',
            padding: '10px 6px 0px 0px',
            'border-bottom-left-radius': fscrWdIntBdRadius, 'border-bottom-right-radius': fscrWdIntBdRadius,
            'background-color': '#f5f5f5'
        };

        thisBody.css({background: '#e0e0e0'});
        thisChatPage.css(thisChatPageCss);
        thisChat.css(thisChatCss);
        $('.dialog-window-container').css(this.dialogWindowContainerCss);
        $('.dialog-window').css(this.dialogWindowCss);
        $('.dialog-window-headline').css(this.dialogWindowHeadlineCss);
        $('.dialog-window-body').css(this.dialogWindowBodyCss);
        $('.dialog-window-footline').css(this.dialogWindowFootlineCss);
        $('.dialog-window-fullscreen').css(this.FullscreenDialogWindowCss);
        $('.dialog-window-headline-fullscreen').css(this.FullscreenDialogWindowHeadlineCss);
        $('.dialog-window-body-fullscreen').css(this.FullscreenDialogWindowBodyCss);
        $('.dialog-window-footline-fullscreen').css(this.FullscreenDialogWindowFootlineCss);

        $('#debugging-messages').css({
            position: 'absolute',
            top: Math.floor(0.3 * $(window).height())+'px',
            left: Math.floor(0.3 * $(window).width())+'px',
            width: Math.floor(0.4 * $(window).width())+'px',
            height: Math.floor(0.4 * $(window).height())+'px',
            padding: '10px',
            'background-color': '#ffffc6',
            opacity: '0.9',
            display: this.debuggingDisplayMode,
            'z-index': 1000
        });

        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
    }

    var thisShowVisitorInfo = $('#show-visitor-info');
    var thisAcceptChat = $('#accept-chat');
    var thisLeaveChat = $('#leave-chat');
    var thisDeclineChat = $('#decline-chat');
    var thisForwardChat = $('#forward-chat');

    lzm_displayLayout.resizeAll();

    this.toggleVisibility();
    if (this.selected_view == 'home') {
        this.startpageDisplay.createStartPage(false, [], []);
    } else if (this.selected_view == 'mychats' && createChatPanel) {
        this.createActiveChatPanel(false, false, false);
    }
};

ChatDisplayClass.prototype.toggleVisibility = function (foo) {
    var that = this;
    var setCssDisplay = function(elt, displayMode) {
        if (typeof elt != 'undefined' && elt.length > 0 && elt.css('display') != displayMode) {
            elt.css({display: displayMode});
        }
    };
    var removeVisitorList = function() {
        if ($('#visitor-list-table').length > 0) {
            $('#visitor-list-table').remove();
        }
        that.VisitorListCreated = false;
    };
    var thisOperatorList = $('#operator-list');
    var thisTicketList = $('#ticket-list');
    var thisArchive = $('#archive');
    var thisStartPage = $('#startpage');
    var thisGeoTracking = $('#geotracking');
    var thisChat = $('#chat');
    var thisChatContainer = $('#chat-container');
    var thisErrors = $('#errors');
    var thisChatTable = $('#chat-table');
    var thisActiveChatPanel = $('#active-chat-panel');
    var thisVisitorList = $('#visitor-list');
    var thisQrdTree = $('#qrd-tree');
    var thisFilter = $('#filter');
    var thisAllChats = $('#all-chats');
    var thisReportList = $('#report-list');

    setCssDisplay(thisStartPage, 'none');
    setCssDisplay(thisGeoTracking, 'none');
    setCssDisplay(thisOperatorList, 'none');
    setCssDisplay(thisTicketList, 'none');
    setCssDisplay(thisArchive, 'none');
    setCssDisplay(thisErrors, 'none');
    setCssDisplay(thisVisitorList, 'none');
    setCssDisplay(thisQrdTree, 'none');
    setCssDisplay(thisFilter, 'none');
    setCssDisplay(thisReportList, 'none');
    if (that.selected_view != 'mychats') {
        setCssDisplay($('#chat-progress'), 'none');
        setCssDisplay($('#chat-qrd-preview'), 'none');
        setCssDisplay($('#chat-action'), 'none');
        setCssDisplay($('#chat-buttons'), 'none');
        setCssDisplay(thisChatContainer, 'none');
        setCssDisplay(thisChatTable, 'none');
        setCssDisplay(thisActiveChatPanel, 'none');
        setCssDisplay(thisChat, 'block');
        setCssDisplay(thisAllChats, 'none');
    }
    switch (this.selected_view) {
        case 'mychats':
            $('#chat-container-headline').html('<h3>' + t('My Chats') + '</h3>');
            setCssDisplay(thisChat, 'block');
            setCssDisplay(thisChatContainer, 'block');
            setCssDisplay(thisChatTable, 'block');
            setCssDisplay(thisAllChats, 'none');
            setCssDisplay($('#chat-progress'), 'block');
            if (typeof this.thisUser.id != 'undefined' && this.thisUser.id != '') {
                setCssDisplay($('#chat-qrd-preview'), 'block');
                setCssDisplay($('#chat-action'), 'block');
                setCssDisplay($('#chat-buttons'), 'block');
            } else {
                setCssDisplay($('#chat-qrd-preview'), 'none');
                setCssDisplay($('#chat-action'), 'none');
                setCssDisplay($('#chat-buttons'), 'none');
            }
            removeVisitorList();
            setCssDisplay(thisActiveChatPanel, 'block');
            break;
        case 'internal':
            setCssDisplay(thisOperatorList, 'block');
            removeVisitorList();
            break;
        case 'external':
            setCssDisplay(thisVisitorList, 'block');
            break;
        case 'qrd':
            removeVisitorList();
            setCssDisplay(thisQrdTree, 'block');
            break;
        case 'tickets':
            removeVisitorList();
            setCssDisplay(thisTicketList, 'block');
            break;
        case 'archive':
            setCssDisplay(thisArchive, 'block');
            removeVisitorList();
            break;
        case 'home':
            setCssDisplay(thisStartPage, 'block');
            removeVisitorList();
            break;
        case 'world':
            setCssDisplay(thisGeoTracking, 'block');
            removeVisitorList();
            break;
        case 'reports':
            setCssDisplay(thisReportList, 'block');
            removeVisitorList();
            break;
    }
};

ChatDisplayClass.prototype.logoutOnValidationError = function (validationError, isWeb, isApp) {
    var loginPage, decodedMultiServerId, that = this,  alertString = '';
    if (this.validationErrorCount == 0 && $.inArray(validationError, ['3', '101']) == -1) {
        tryNewLogin(false);
        this.validationErrorCount++;
    } else if (validationError == '3') {
        if (!this.alertDialogIsVisible) {
            alertString = t('You\'ve been logged off by another operator!');
            lzm_commonDialog.createAlertDialog(alertString, [{id: 'ok', name: t('Ok')}]);
            this.alertDialogIsVisible = true;
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
                that.stopRinging([]);
                that.askBeforeUnload = false;
                if (!isApp) {
                    loginPage = 'index.php?LOGOUT';
                    if (multiServerId != '') {
                        decodedMultiServerId = lz_global_base64_url_decode(multiServerId);
                        loginPage += '#' + decodedMultiServerId;
                    }
                    window.location.href = loginPage;
                } else {
                    try {
                        lzm_deviceInterface.openLoginView();
                    } catch(ex) {
                        logit('Opening the login view failed.');
                    }
                }
                that.validationErrorCount++;
                that.alertDialogIsVisible = false;
            });
        }
    } else if (validationError == '101') {
        if (!this.alertDialogIsVisible) {
            var alertString1 = t('No operator licences are available or all operator licences are in use.');
            var alertString2 = t('Any new connections are denied until a licence becomes available.');
            var alertString3 = t('In order to add additional operator seats, please purchase the according amount of operator licences.');
            var alertString4 = t('Thanks for your understanding.');
            alertString = t('<!--limit1--> <!--limit2--> <!--limit3--> <!--limit4-->',
                [['<!--limit1-->', alertString1], ['<!--limit2-->', alertString2], ['<!--limit3-->', alertString3], ['<!--limit4-->', alertString4]]);
            lzm_commonDialog.createAlertDialog(alertString, [{id: 'ok', name: t('Ok')}]);
            this.alertDialogIsVisible = true;
            $('#alert-btn-ok').click(function() {
                that.stopRinging([]);
                that.askBeforeUnload = false;
                if (!isApp) {
                    loginPage = 'index.php?LOGOUT';
                    if (multiServerId != '') {
                        decodedMultiServerId = lz_global_base64_url_decode(multiServerId);
                        loginPage += '#' + decodedMultiServerId;
                    }
                    window.location.href = loginPage;
                } else {
                    try {
                        lzm_deviceInterface.openLoginView();
                    } catch(ex) {
                        logit('Opening the login view failed.');
                    }
                }
                that.validationErrorCount++;
                that.alertDialogIsVisible = false;
            });
        }
    } else if (this.validationErrorCount == 1) {
        this.askBeforeUnload = false;
        var noLogout = false;
        if (!this.alertDialogIsVisible) {
            switch (validationError) {
                case '0':
                    alertString = t('Wrong username or password.');
                    break;
                case '2':
                    alertString = t('The operator <!--op_login_name--> is already logged in.',[['<!--op_login_name-->', this.myLoginId]]);
                    break;
                case '3':
                    alertString = t('You\'ve been logged off by another operator!');
                    break;
                case "4":
                    alertString = t('Session timed out.');
                    break;
                case "5":
                    alertString = t('Your password has expired. Please enter a new password.');
                    break;
                case "9":
                    alertString = t('You are not an administrator.');
                    break;
                case "10":
                    alertString = t('This LiveZilla server has been deactivated by the administrator.') + '\n' +
                        t('If you are the administrator, please activate this server under LiveZilla Server Admin -> Server Configuration -> Server.');
                    break;
                case "13":
                    alertString = t('There are problems with the database connection.');
                    break;
                case "14":
                    alertString = t('This server requires secure connection (SSL). Please activate HTTPS in the server profile and try again.');
                    break;
                case "15":
                    alertString = t('Your account has been deactivated by an administrator.');
                    break;
                case "19":
                    alertString = t('No mobile access permitted.');
                    break;
                default:
                    alertString = 'Validation Error : ' + validationError;
                    break;
            }
            lzm_commonDialog.createAlertDialog(alertString.replace(/\n/g, '<br />'), [{id: 'ok', name: t('Ok')}]);
            this.alertDialogIsVisible = true;
            $('#alert-btn-ok').click(function() {
                if (!noLogout) {
                    that.stopRinging([]);
                    that.askBeforeUnload = false;
                    if (!isApp) {
                        loginPage = 'index.php?LOGOUT';
                        if (multiServerId != '') {
                            decodedMultiServerId = lz_global_base64_url_decode(multiServerId);
                            loginPage += '#' + decodedMultiServerId;
                        }
                        window.location.href = loginPage;
                    } else {
                        try {
                            lzm_deviceInterface.openLoginView();
                        } catch(ex) {
                            logit('Opening the login view failed.');
                        }
                    }
                } else {
                    that.validationErrorCount = 0;
                }
                that.validationErrorCount++;
                that.alertDialogIsVisible = false;
            });
        }
    }
};

ChatDisplayClass.prototype.createGeoTracking = function() {
    $('#geotracking-headline').html('<h3>' + t('Geotracking') + '</h3>');
    if ($('#geotracking-iframe').length == 0) {
        $('#geotracking-body').html('<iframe id="geotracking-iframe" src="" style="background-color: #ffffff; border: 0px;"></iframe>');
        $('#geotracking-body').data('src', '');
        $('#geotracking-footline').html(lzm_displayHelper.createGeotrackingFootline());
    }
};

ChatDisplayClass.prototype.createErrorHtml = function (global_errors) {
    var errorHtmlString = '';
    for (var errorIndex = 0; errorIndex < global_errors.length; errorIndex++) {
        errorHtmlString += '<p>' + global_errors[errorIndex] + '</p>';
        try {
            logit(global_errors[errorIndex]);
        } catch(e) {}
    }
    $('#errors').html(errorHtmlString);
};

ChatDisplayClass.prototype.createOperatorList = function () {
    if (!this.doNotUpdateOpList) {
    var dptLogo = 'img/lz_group_14.png', onclickAction = '', ondblclickAction = '', oncontextmenuAction = '', lineCounter = 0;
    if (lzm_chatServerEvaluation.userChats.getUserChat('everyoneintern') != null &&
        lzm_chatServerEvaluation.userChats.getUserChat('everyoneintern').status == 'new') {
        dptLogo = 'img/217-quote.png';
    }
    var intUserHtmlString = '<div id="operator-list-headline"><h3>' + t('Operators') + '</h3></div>' +
        '<div id="operator-list-headline2"></div>' +
        '<div id="operator-list-body"><table id="operator-list-table" style="margin: 6px 2px 2px 2px;">';
    onclickAction = (this.isApp || this.isMobile) ? ' onclick="openOperatorListContextMenu(event, \'group\', \'everyoneintern\', \'everyoneintern\', \'' + lineCounter + '\');"' :
        ' onclick="selectOperatorLine(\'everyoneintern\', \'' + lineCounter + '\')"';
    ondblclickAction = (!this.isApp && !this.isMobile) ? ' ondblclick="chatInternalWith(\'everyoneintern\',\'everyoneintern\',\'' + t('All operators') + '\', true);"' : '';
    oncontextmenuAction = (!this.isApp && !this.isMobile) ? ' oncontextmenu="openOperatorListContextMenu(event, \'group\', \'everyoneintern\', \'everyoneintern\', \'' + lineCounter + '\');"' : '';
    intUserHtmlString += '<tr id="operator-list-line-everyoneintern' + '_' + lineCounter + '" class="operator-list-line">' +
        '<th class="lzm-unselectable" colspan="2" style="text-align: left; cursor: pointer; padding: 3px 8px 3px 4px;' + blStyle + brStyle + '" ' +
        onclickAction + ondblclickAction + oncontextmenuAction + '>' +
        '<span class="operator-list-icon" style="background-image: url(\'' + dptLogo + '\');"></span>&nbsp;&nbsp;' + t('All operators') +
        '</th></tr>';
    lineCounter++;
    var groups = lzm_chatServerEvaluation.groups.getGroupList('name', false, true);
    var blStyle = 'border-bottom-left-radius: 4px; border-top-left-radius: 4px;';
    var brStyle = 'border-bottom-right-radius: 4px; border-top-right-radius: 4px;';
    for (var i=0; i<groups.length; i++) {
        var operators = lzm_chatServerEvaluation.operators.getOperatorList('name', groups[i].id);
        if (operators.length > 0 || (typeof groups[i].o != 'undefined' && groups[i].o == this.myId)) {
            dptLogo = (typeof groups[i].members == 'undefined') ? (groups[i].oh == '1') ? 'img/lz_group_14.png' : 'img/lz_group_offline_14.png' : 'img/lz_group_dynamic_14.png';// img/lz_group_offline.png
            if (lzm_chatServerEvaluation.userChats.getUserChat(groups[i].id) != null &&
                lzm_chatServerEvaluation.userChats.getUserChat(groups[i].id).status == 'new') {
                dptLogo = 'img/217-quote.png';
            }
            onclickAction = (this.isApp || this.isMobile) ? ' onclick="openOperatorListContextMenu(event, \'group\', \'' + groups[i].id + '\', \'everyoneintern\', \'' + lineCounter + '\');"' :
                ' onclick="selectOperatorLine(\'' + groups[i].id + '\', \'' + lineCounter + '\')"';
            ondblclickAction = (!this.isApp && !this.isMobile) ? ' ondblclick="chatInternalWith(\'' + groups[i].id + '\',\'' + groups[i].id + '\',\'' + groups[i].name + '\', true);"' : '';
            oncontextmenuAction = (!this.isApp && !this.isMobile) ? ' oncontextmenu="openOperatorListContextMenu(event, \'group\', \'' + groups[i].id + '\', \'everyoneintern\', \'' + lineCounter + '\');"' : '';
            intUserHtmlString += '<tr id="operator-list-line-' + groups[i].id + '_' + lineCounter + '" class="operator-list-line">' +
                '<th class="lzm-unselectable" colspan="2" style="text-align: left; cursor: pointer; padding: 3px 8px 3px 4px; ' + blStyle + brStyle + '"' +
                onclickAction + ondblclickAction + oncontextmenuAction + '>' +
                '<span class="operator-list-icon" style="background-image: url(\'' + dptLogo + '\');"></span>&nbsp;&nbsp;' + groups[i].name +
                '</th></tr>';
            lineCounter++;
            if (typeof groups[i].members != 'undefined') {
                for (var k=0; k<groups[i].members.length; k++) {
                    if (groups[i].members[k].i.indexOf('~') != -1) {
                        var visitorId = groups[i].members[k].i.split('~')[0], browserId = groups[i].members[k].i.split('~')[1];
                        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(visitorId);
                        if (visitor != null && typeof visitor.b != 'undefined') {
                            var visitorName = (visitor.unique_name);
                            var visitorLogo = 'img/lz_offline_14.png';
                            for (var l=0; l<visitor.b.length; l++) {
                                if (visitor.b[l].id == browserId && typeof visitor.b[l].cname != 'undefined' && visitor.b[l].cname != '') {
                                    visitorName = visitor.b[l].cname;
                                }
                                if (visitor.b[l].id == browserId && typeof visitor.b[l].is_active != 'undefined' && visitor.b[l].is_active) {
                                    visitorLogo = 'img/lz_online_14.png';
                                }
                            }
                            onclickAction = (this.isApp || this.isMobile) ?
                                ' onclick="openOperatorListContextMenu(event, \'visitor\', \'' + visitorId + '~' + browserId + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' :
                                ' onclick="selectOperatorLine(\'' + visitorId + '~' + browserId + '\', \'' + lineCounter + '\')"';
                            ondblclickAction = (!this.isApp && !this.isMobile) ? '' : '';
                            oncontextmenuAction = (!this.isApp && !this.isMobile) ?
                                ' oncontextmenu="openOperatorListContextMenu(event, \'visitor\', \'' + visitorId + '~' + browserId + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' : '';
                            intUserHtmlString += '<tr id="operator-list-line-' + visitorId + '_' + browserId + '_' + lineCounter + '" class="operator-list-line">' +
                                '<td style="' + blStyle + '">&nbsp;&nbsp;</td>' +
                                '<td class="lzm-unselectable userlist internal-user-' + visitor.id + '" style="text-align: left; padding: 3px 8px 3px 4px; cursor:pointer; ' + brStyle + '"' +
                                onclickAction + ondblclickAction + oncontextmenuAction + '>' +
                                '<span class="operator-list-icon" style="background-image: url(\'' + visitorLogo + '\');"></span>' +
                                '&nbsp;' + visitorName + '</td></tr>';
                            lineCounter++;
                        }

                    }
                }
            }
            for (var j=0; j<operators.length; j++) {
                var intUserStyle = 'style="text-align: left; padding: 3px 8px 3px 4px; ' + brStyle + '" ';
                if (lzm_chatServerEvaluation.userChats.getUserChat(operators[j].id) != null &&
                    lzm_chatServerEvaluation.userChats.getUserChat(operators[j].id).status == 'new') {
                    operators[j].logo = 'img/217-quote.png';
                    intUserStyle = 'style="color: #ED9831; font-weight: bold; text-align: left; padding: 3px 8px 3px 4px; ' + brStyle + '" ';
                }
                var tmpIntUserStyle;
                if (operators[j].userid != this.myLoginId &&
                    (typeof operators[j].isbot == 'undefined' || operators[j].isbot != 1)) {
                    ondblclickAction = (!this.isApp && !this.isMobile) ?
                        ' ondblclick="chatInternalWith(\'' + operators[j].id + '\',\'' + operators[j].userid + '\',\'' + operators[j].name + '\', true);"' : '';
                    tmpIntUserStyle = intUserStyle.replace(/"$/, '').replace(/" *$/, '');
                    intUserStyle = tmpIntUserStyle + ' cursor: pointer;"';
                } else {
                    ondblclickAction = '';
                    tmpIntUserStyle = intUserStyle.replace(/"$/, '').replace(/" *$/, '');
                    intUserStyle = tmpIntUserStyle + ' cursor: default;"';
                }
                onclickAction = (this.isApp || this.isMobile) ?
                    ' onclick="openOperatorListContextMenu(event, \'operator\', \'' + operators[j].id + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' :
                    ' onclick="selectOperatorLine(\'' + operators[j].id + '\', \'' + lineCounter + '\')"';
                oncontextmenuAction = (!this.isApp && !this.isMobile) ?
                    ' oncontextmenu="openOperatorListContextMenu(event, \'operator\', \'' + operators[j].id + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' : '';
                intUserHtmlString += '<tr id="operator-list-line-' + operators[j].id + '_' + lineCounter + '" class="operator-list-line">' +
                    '<td style="' + blStyle + '">&nbsp;&nbsp;</td>' +
                    '<td class="lzm-unselectable userlist internal-user-' + operators[j].id + '" ' + intUserStyle + onclickAction + ondblclickAction + oncontextmenuAction;
                intUserHtmlString += '>' +
                    '<span class="operator-list-icon" style="background-image: url(\'' + operators[j].logo + '\');"></span>';
                if ((operators[j].mobileAccount && operators[j].status == '2') || (operators[j].clientMobile && operators[j].status != '2')) {
                    intUserHtmlString += '&nbsp;<span class="operator-list-mobile-icon" style="background-image: url(\'img/661-cellphone.png\');"></span>';
                }
                intUserHtmlString += '&nbsp;' + operators[j].name + '</td></tr>';
                lineCounter++;
            }
        }
    }
    intUserHtmlString += '</table></div>';
    $('#operator-list').html(intUserHtmlString);
    lzm_displayLayout.resizeOperatorList();
    }
};

ChatDisplayClass.prototype.createDynamicGroup = function () {
    this.doNotUpdateOpList = true;
    this.newDynGroupHash = md5(String(Math.random())).substr(0, 10);
    $('#operator-list-table tbody').prepend('<tr id="operator-list-line-new-' + this.newDynGroupHash + '" class="operator-list-line-new operator-list-line">' +
        '<th class="lzm-unselectable" colspan="2" style="text-align: left; cursor: pointer; padding: 3px 8px 3px 4px;">' +
        '<span class="operator-list-icon" style="background-image: url(\'img/lz_group_dynamic_14.png\');"></span>&nbsp;&nbsp;' +
        '<input type="text" id="new-dynamic-group-name" data-role="none" class="lzm-text-input" autofocus /></th></tr>').trigger('create');
    $('.operator-list-line-new').click(function(e) {
        e.stopPropagation();
    });
    $('#new-dynamic-group-name').keyup(function(e) {
        var keyCode = (typeof e.keyCode != 'undefined') ? e.keyCode :e.which;
        if (keyCode == 13) {
            saveNewDynamicGroup();
        }
    });
};

ChatDisplayClass.prototype.addToDynamicGroup = function (id, browserId, chatId) {
    var headerString = t('Add to Dynamic Group');
    var bodyString = lzm_displayHelper.createAddToDynamicGroupHtml(id, browserId);
    var footerString = lzm_displayHelper.createButton('save-dynamic-group', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('cancel-dynamic-group', '', '', t('Close'), '', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var dialogData = {};
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'dynamic-group', {}, {}, {}, {}, '', dialogData, false, false);
    lzm_displayLayout.resizeDynamicGroupDialogs();

    selectDynamicGroup($('#dynamic-group-table').data('selected-group'));
    $('#save-dynamic-group').click(function() {
        if ($('#create-new-group').attr('checked') == 'checked') {
            lzm_chatUserActions.saveDynamicGroup('create-add', '', $('#new-group-name').val(), id,
                {isPersistent: $('#persistent-group-member').attr('checked') == 'checked', browserId: browserId, chatId: chatId});
        } else {
            var group = lzm_chatServerEvaluation.groups.getGroup($('#dynamic-group-table').data('selected-group'));
            if (lzm_commonPermissions.checkUserPermissions(lzm_chatDisplay.myId, 'group', '', group)) {
                var isAlreadyInGroup = false;
                for (var i=0; i<group.members.length; i++) {
                    isAlreadyInGroup = (group.members[i].i == id) ? true : isAlreadyInGroup;
                }
                if (!isAlreadyInGroup) {
                    lzm_chatUserActions.saveDynamicGroup('add', $('#dynamic-group-table').data('selected-group'), '', id,
                        {isPersistent: $('#persistent-group-member').attr('checked') == 'checked', browserId: browserId, chatId: chatId});
                } else {
                    var alertText =  t('A user with this name already exists in this group.');
                    lzm_commonDialog.createAlertDialog(alertText, [{id: 'ok', name: t('Ok')}]);
                    $('#alert-btn-ok').click(function() {
                        lzm_commonDialog.removeAlertDialog();
                    });
                }
            } else {
                showNoPermissionMessage();
            }
        }
        $('#cancel-dynamic-group').click();
    });
    $('#cancel-dynamic-group').click(function() {
        lzm_displayHelper.removeDialogWindow('dynamic-group');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
        }
    });
};

ChatDisplayClass.prototype.createActiveChatPanel = function (updateVisitorListNow, createLayoutNow, openLastActiveNow, type) {
    var thisClass = this;
    updateVisitorListNow = (typeof updateVisitorListNow == 'undefined') ? true : false;
    createLayoutNow = (typeof createLayoutNow != 'undefined') ? createLayoutNow : false;
    openLastActiveNow = (typeof openLastActiveNow != 'undefined') ? openLastActiveNow : true;
    type = (typeof type != 'undefined') ? type : 'new_chat';
    try {
    if (lzm_chatPollServer.dataObject.p_gl_a != 'N') {
        this.myChatsCounter = 0;
        if (updateVisitorListNow && this.selected_view == 'external' && $('.dialog-window-container').length == 0) {
            this.visitorDisplay.updateVisitorList();
        }

        var thisActiveChatPanel = $('#active-chat-panel');
        var onclickAction = '', oncontextmenuAction = '', onclickCommand = '', buttonId = '', senderId = '', senderBId = '', senderChatId = '';
        var senderUserId = '', activeCounter = 0, thisActiveChatPanelWidth = thisActiveChatPanel.width();

        var defaultCss = ' height: 22px; position: absolute; padding: 0px 5px 0px 21px; text-align: center; font-size: 11px; ' +
            'overflow: hidden; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; vertical-align: middle;';
        this.templateCloseButton = '<div id="%BTNID%" %BTNONCLICK% ' +
            ' style=\'background-image: url("img/205-close.png"); background-color: #f1f1f1;' +
            ' background-repeat: no-repeat; background-position: center; display: none;' +
            ' left: %BTNLEFT%px; top: %BTNTOP%px; width: 16px; %BTNDEFAULTCSS%\'></div>';
        var closeButton = this.templateCloseButton.replace(/%BTNID%/g,'close-active-chat').
            replace(/%BTNONCLICK%/g, 'onclick="leaveChat();" ').
            replace(/%BTNDEFAULTCSS%/g , defaultCss.replace(/padding: 0px 5px 0px 21px;/,'padding: 0px 3px 0px 3px;')).
            replace(/%BTNLEFT%/g, thisActiveChatPanelWidth - 26).
            replace(/%BTNTOP%/g, 2);
        var activityHtml = closeButton;

        var newIncomingChats = [];
        this.chatActivity = false;
        var thisDivLeft = [2];
        var thisLine = 0;
        var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
        var cpIsActive = false, cpDoesExist = false;

        var thisButtonCss = '';
        if (this.active_chat_reco == '' || this.active_chat_reco == 'LIST') {
            thisButtonCss = defaultCss + ' background:#5393C5; color:#FFF; text-shadow: 0 0px #fff; border-color: #2373A5;';
            bgGradientColor = 'darkViewSelect';
        } else {
            thisButtonCss = defaultCss + ' background:#F1F1F1; color:#000; border-color: #ccc;';
            bgGradientColor = '';
        }
        var thisButtonHtml = '<div onclick="showAllchatsList(true);" id="show-allchats-list" style=\'left: 2px;' +
            ' top: 2px;' + thisButtonCss + ' display: table-cell; line-height: 22px;' +
            ' background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
            '<span style=\'line-height: 22px; padding-left: 4px; padding-top: 4px; padding-bottom: 4px;\'>' + t('All Chats') + '</span></div>';
        var testLengthDiv = $('#test-length-div');
        testLengthDiv.html(thisButtonHtml.replace(/show-allchats-list/, 'test-show-allchats-list')).trigger('create');
        var thisButtonLength = $('#test-show-allchats-list').width() + 13;
        thisDivLeft[thisLine] += thisButtonLength;
        activityHtml += thisButtonHtml;
        testLengthDiv.html('').trigger('create');

        for (var cp in userChats) {
            try {
                if (userChats.hasOwnProperty(cp)) {
                    var thisUserChat = userChats[cp];
                    var thisGroup = lzm_chatServerEvaluation.groups.getGroup(cp);
                    if (thisUserChat.id != '' && thisUserChat.type == 'external' && thisUserChat.status == 'new' && $.inArray(cp, this.openChats) == -1 && thisUserChat.my_chat) {
                        newIncomingChats.push(cp);
                    }
                    if (thisUserChat.id != '' && ((thisUserChat.status != 'left' && thisUserChat.status != 'declined') || $.inArray(cp, this.closedChats) == -1) &&
                        (thisUserChat.my_chat || thisUserChat.my_chat_old || cp.indexOf('~') == -1)) {
                        var group = lzm_chatServerEvaluation.groups.getGroup(cp);
                        var operator = lzm_chatServerEvaluation.operators.getOperator(cp);
                        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(cp.split('~')[0]);
                        if (thisUserChat.type == 'external') {
                            onclickCommand = 'viewUserData(\'' + thisUserChat.id + '\', \'' + thisUserChat.b_id + '\', \'' +
                                thisUserChat.chat_id + '\', true);';
                            onclickAction = ' onclick="' + onclickCommand + '"';
                            oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ?
                                ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + thisUserChat.id + '~' + thisUserChat.b_id + '\', \'panel\', event);"' : '';
                            buttonId = ' id="chat-button-' + thisUserChat.id + '_' + thisUserChat.b_id + '"';
                            cpIsActive = visitor.is_active;
                            cpDoesExist = true;
                        } else {
                            if (operator != null) {
                                onclickCommand = 'chatInternalWith(\'' + operator.id + '\', \'' + operator.userid + '\', \'' +
                                    operator.name + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ?
                                    ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + operator.id + '\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + operator.id + '"';
                                cpIsActive = operator.is_active;
                                cpDoesExist = true;
                            }
                            if (group != null) {
                                onclickCommand = 'chatInternalWith(\'' + group.id + '\', \'' + group.id + '\', \'' +
                                    group.name + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ?
                                    ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + group.id + '\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + group.id + '"';
                                cpIsActive = group.is_active;
                                cpDoesExist = true;
                            }
                            if (cp == 'everyoneintern') {
                                onclickCommand = 'chatInternalWith(\'' + 'everyoneintern' + '\', \'' + 'everyoneintern' + '\', \'' +
                                    t('All operators') + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ?
                                    ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'everyoneintern\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + 'everyoneintern' + '"';
                                cpIsActive = true;
                                cpDoesExist = true;
                            }
                        }

                        var buttonLogo = 'img/lz_offline_14.png';
                        if (cp == 'everyoneintern' || (group != null && typeof group.members == 'undefined' && group.is_active)) {
                            buttonLogo = 'img/lz_group_14.png';
                            //this.myChatsCounter++;
                        } else if (group != null && typeof group.members != 'undefined' && group.is_active) {
                            buttonLogo = 'img/lz_group_dynamic_14.png';
                            //this.myChatsCounter++;
                        } else if (operator != null) {
                            buttonLogo = operator.status_logo;
                            //this.myChatsCounter++;
                        } else if (visitor != null &&
                            visitor.is_active &&
                            thisUserChat['status'] != 'left' &&
                            thisUserChat['status'] != 'declined' &&
                            thisUserChat['my_chat']) {
                            if (thisUserChat.member_status != 2) {
                                buttonLogo = 'img/lz_online_14.png';
                            } else {
                                buttonLogo = 'img/lz_hidden_14.png';
                            }
                            this.myChatsCounter++;
                        }

                        var bgGradientColor = '';
                        if (thisUserChat['status'] == 'new' ||
                            (typeof thisUserChat.fupr != 'undefined' &&
                                (typeof thisUserChat.fuprDone == 'undefined' ||
                                    thisUserChat.fuprDone != thisUserChat.fupr.id))) {
                            this.chatActivity = true;
                        }
                        if (cp == this.active_chat_reco) {
                            thisButtonCss = defaultCss + ' background:#5393C5; color:#FFF; text-shadow: 0 0px #fff; border-color: #2373A5;';
                            bgGradientColor = 'darkViewSelect';
                        } else {
                            thisButtonCss = defaultCss + ' background:#F1F1F1; color:#000; border-color: #ccc;';
                            bgGradientColor = '';
                        }

                        if (cpDoesExist && (lzm_chatPollServer.user_status == 0 || thisUserChat.status != 'left' || typeof thisUserChat.accepted != 'undefined')) {
                            var thisDivTop = 2 + thisLine * 28;
                            var displayCpName = (thisUserChat.chat_name.length > 18) ? thisUserChat.chat_name.substring(0, 15) + '...' : thisUserChat.chat_name;
                            displayCpName = lzm_commonTools.escapeHtml(displayCpName, true).replace(/ /g, '&nbsp;');
                            thisButtonHtml = '<div' + onclickAction + oncontextmenuAction + buttonId + ' style=\'left:' + thisDivLeft[thisLine]+'px;' +
                                ' top: ' + thisDivTop+'px;' + thisButtonCss + ' display: table-cell; line-height: 22px;' +
                                ' background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
                                '<span style=\'line-height: 22px; padding-left: 21px; padding-top: 4px; padding-bottom: 4px;' +
                                ' background-image: url("' + buttonLogo + '"); background-position: left;' +
                                ' background-repeat: no-repeat;\'>' + displayCpName + '</span></div>';
                            testLengthDiv = $('#test-length-div');
                            var testButtonId = buttonId.replace(/ id="(.*?)"/, 'test-$1');
                            testLengthDiv.html(thisButtonHtml.replace(/chat-button-/, 'test-chat-button-')).trigger('create');
                            thisButtonLength = $('#' + testButtonId).width() + 13;
                            var thisLineRight = (thisLine == 0) ? 26 : 2;
                            if ((thisDivLeft[thisLine] + thisButtonLength) >= (thisActiveChatPanelWidth - thisLineRight)) {
                                thisLine++;
                                thisDivTop = 2 + thisLine * 28;
                                thisDivLeft.push(2);
                                thisButtonHtml = '<div' + onclickAction + oncontextmenuAction + buttonId + ' style=\'left:' + thisDivLeft[thisLine] + 'px;' +
                                    ' top: ' + thisDivTop+'px;' + thisButtonCss + ' display: table-cell; line-height: 22px;' +
                                    ' background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
                                    '<span style=\'line-height: 22px; padding-left: 21px; padding-top: 4px; padding-bottom: 4px;' +
                                    ' background-image: url("' + buttonLogo + '"); background-position: left;' +
                                    ' background-repeat: no-repeat;\'>' + displayCpName + '</span></div>';
                            }
                            activeCounter++;
                            thisDivLeft[thisLine] += thisButtonLength;
                            activityHtml += thisButtonHtml;
                            this.activeChatPanelHeight = 28 * (thisLine + 1);
                            testLengthDiv.html('').trigger('create');
                        }
                    }
                }
            } catch(e) {}
        }
        if (newIncomingChats.length > 0) {
            this.startRinging(newIncomingChats);
        } else {
            this.stopRinging(newIncomingChats);
        }
        thisActiveChatPanel.html(activityHtml).trigger('create');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(this.active_chat_reco);
        if (this.active_chat_reco != '' && activeUserChat != null &&
            (activeUserChat.status != 'new' || !activeUserChat.my_chat)) {
            $('#close-active-chat').css({display: 'block'});
        }

        if (this.chatActivity && (this.settingsDialogue || this.selected_view != 'mychats')) {
            this.chatsViewMarked = true;
            this.createViewSelectPanel(this.firstVisibleView);
        } else {
            this.chatsViewMarked = false;
            this.createViewSelectPanel(this.firstVisibleView);

        }
        if (createLayoutNow) {
            this.createChatWindowLayout(false);
        }
    } else {
        setTimeout(function() {
            thisClass.createActiveChatPanel(updateVisitorListNow, createLayoutNow, openLastActiveNow);
        }, 200);
    }
    } catch(e) {}
    if (openLastActiveNow && this.selected_view == 'mychats' && this.active_chat_reco == '' &&
        Object.keys(lzm_chatServerEvaluation.userChats.getUserChatList()).length > 0) {
        openLastActiveChat(type);
    }
};

ChatDisplayClass.prototype.createChatHtml = function (thisUser, active_chat_reco) {
    var myChats = lzm_chatServerEvaluation.userChats.getUserChat(active_chat_reco);
    var chatHtmlString = '';
    var messageText = '';
    var previousMessageSender = '';
    var previousMessageRepost = 1;
    var previousAddMessageStyle = 1;
    var previousMessageTimestamp = 0;
    var tmpDate = lzm_chatTimeStamp.getLocalTimeObject();
    var currentDateObject = {
        day:this.lzm_commonTools.pad(tmpDate.getDate(), 2),
        month:this.lzm_commonTools.pad((tmpDate.getMonth() + 1), 2),
        year:this.lzm_commonTools.pad(tmpDate.getFullYear() ,4)
    };
    if (myChats != null) {
        myChats.messages = (typeof myChats.messages != 'undefined') ? myChats.messages : [];
        for (var i=0; i<myChats.messages.length; i++) {
            myChats.messages[i].text = (typeof myChats.messages[i].text != 'undefined') ?
                lzm_commonTools.replaceLinksInChatView(myChats.messages[i].text) : '';
            var messageTime = myChats.messages[i].time_human;
            if (typeof myChats.messages[i].dateObject != 'undefined' &&
                (myChats.messages[i].dateObject.year != currentDateObject.year ||
                    myChats.messages[i].dateObject.month != currentDateObject.month ||
                    myChats.messages[i].dateObject.day != currentDateObject.day)) {
                messageTime = myChats.messages[i].date_human + '&nbsp;' + myChats.messages[i].time_human;
            }
            var chatText = '<span>' + lzm_displayHelper.replaceSmileys(myChats.messages[i].text) + '</span>';
            if (typeof myChats.messages[i].tr != 'undefined' && myChats.messages[i].tr != '') {
                chatText = '<span>' + lzm_displayHelper.replaceSmileys(myChats.messages[i].tr) + '</span><br />' +
                    '<span style="padding-left: 7px; color: #888; font-style: italic;">' + lzm_displayHelper.replaceSmileys(myChats.messages[i].text) + '</span>';
            }
            if (typeof myChats.messages[i].info_header != 'undefined') {
                var myMailAddress = (myChats.messages[i].info_header.mail != '') ?
                    this.lzm_commonTools.htmlEntities(myChats.messages[i].info_header.mail) : '&#8203;';
                var targetGroup = lzm_chatServerEvaluation.groups.getGroup(myChats.messages[i].info_header.group);
                var groupName = (targetGroup != null) ? targetGroup.name : myChats.messages[i].info_header.group;
                messageText = this.messageTemplates['header'].replace(/<!--new_chat_request_label-->/g,t('Chat request to'));
                messageText = messageText.replace(/<!--group_name-->/g,groupName);
                messageText = messageText.replace(/<!--receivers-->/g,myChats.messages[i].info_header.operators);
                messageText = messageText.replace(/<!--name_label-->/g,t('Name'));
                messageText = messageText.replace(/<!--user-->/g,this.lzm_commonTools.htmlEntities(myChats.messages[i].info_header.name));
                messageText = messageText.replace(/<!--email_label-->/g,t('Email'));
                messageText = messageText.replace(/<!--email-->/g,myMailAddress);
                messageText = messageText.replace(/<!--company_label-->/g,t('Company'));
                messageText = messageText.replace(/<!--company-->/g,this.lzm_commonTools.htmlEntities(myChats.messages[i].info_header.company));
                messageText = messageText.replace(/<!--phone_label-->/g,t('Phone'));
                messageText = messageText.replace(/<!--phone-->/g,this.lzm_commonTools.htmlEntities(myChats.messages[i].info_header.phone));
                messageText = messageText.replace(/<!--question_label-->/g,t('Question'));
                messageText = messageText.replace(/<!--question-->/g,this.lzm_commonTools.htmlEntities(myChats.messages[i].info_header.question));
                messageText = messageText.replace(/<!--chat_id_label-->/g,t('Chat ID'));
                messageText = messageText.replace(/<!--chat_id-->/g,myChats.messages[i].info_header.chat_id);
                messageText = messageText.replace(/<!--area_code_label-->/g,t('Area(s)'));
                messageText = messageText.replace(/<!--area_code-->/g,myChats.messages[i].info_header.area_code);
                messageText = messageText.replace(/<!--url_label-->/g,t('Url'));
                messageText = messageText.replace(/<!--url-->/g,myChats.messages[i].info_header.url);
                messageText = messageText.replace(/<!--custom_fields-->/g,myChats.messages[i].info_header.cf);
                messageText = messageText.replace(/lz_chat_mail/, 'lz_chat_mail_no_icon');
                chatHtmlString += messageText;
                previousMessageSender = '';
                previousMessageRepost = 1;
                previousAddMessageStyle = 1;
            } else {
                if (previousMessageSender != myChats.messages[i].sen || previousMessageRepost != myChats.messages[i].rp ||
                    parseInt(myChats.messages[i].date) - previousMessageTimestamp > 300) {
                    if (myChats.messages[i].rp == 1) {
                        messageText = this.messageTemplates['repost'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myChats.messages[i].sender_name, true));
                    } else {
                        if (myChats.messages[i].sen == this.myId) {
                            messageText = this.messageTemplates['internal'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myChats.messages[i].sender_name, true));
                        } else {
                            messageText = this.messageTemplates['external'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myChats.messages[i].sender_name, true));
                        }
                    }
                    previousAddMessageStyle = 1;
                } else {
                    if (previousAddMessageStyle == 0) {
                        messageText = this.messageTemplates['add'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myChats.messages[i].sender_name, true));
                    } else {
                        messageText = this.messageTemplates['addalt'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myChats.messages[i].sender_name, true));
                    }
                    previousAddMessageStyle = 1 - previousAddMessageStyle;
                }
                messageText = messageText.replace(/<!--time-->/g, messageTime);
                messageText = messageText.replace(/<!--message-->/g, chatText);
                messageText = messageText.replace(/<!--dir-->/g, 'ltr');
                chatHtmlString += messageText;
                previousMessageSender = myChats.messages[i].sen;
                previousMessageRepost = (myChats.messages[i].rp == 1) ? 1 : 0;
            }
            previousMessageTimestamp = parseInt(myChats.messages[i].date);
        }
    } else if (active_chat_reco != 'LIST' && this.selected_view == 'mychats') {
        //showAllchatsList();
        this.lastActiveChat = '';
        openLastActiveChat();
    } else {
        showAllchatsList();
    }
    var thisChatProgress = $('#chat-progress');
    thisChatProgress.html(chatHtmlString);
    thisChatProgress.scrollTop(thisChatProgress[0].scrollHeight);
    if (lzm_chatDisplay.isApp && appOs == 'windows') {
        setTimeout(function() {
            thisChatProgress.scrollTop(thisChatProgress[0].scrollHeight);
        }, 500);
    }

    $('#chat-action').css('visibility', 'visible');
    $('#chat-buttons').css('visibility', 'visible');
    lzm_displayLayout.resizeChatView();
};

ChatDisplayClass.prototype.createHtmlContent = function (thisUser, active_chat_reco, type) {
    type = (typeof type != 'undefined') ? type : '';

    // make the user aware of new incoming messages
    this.createActiveChatPanel(false, true, true, type);

    // create the visitor and operator lists
    if (this.selected_view == 'internal') {
        this.createOperatorList();
    }
    if (this.selected_view == 'external' && $('.dialog-window-container').length == 0) {
        this.visitorDisplay.updateVisitorList();
    }

    // fill the chat window with content
    if (this.selected_view == 'mychats') {
        active_chat_reco = (active_chat_reco != '') ? active_chat_reco : this.active_chat_reco;
        this.createChatHtml(thisUser, active_chat_reco);
    }

    this.startpageDisplay.createStartPage(false, [], []);
    this.createGeoTracking();
    if (this.selected_view == 'reports') {
        this.reportsDisplay.createReportList();
    }
    this.allchatsDisplay.updateAllChats();
};

ChatDisplayClass.prototype.createOperatorInviteHtml = function (type, thisUser, id, b_id, chat_id) {
    saveChatInput(lzm_chatDisplay.active_chat_reco);
    var groups = lzm_chatServerEvaluation.groups.getGroupList();
    var memberList = [], i = 0, thisClass = this;
    for (var bInd=0; bInd<thisUser.b.length; bInd++) {
        if (thisUser.b[bInd].id == b_id) {
            memberList = thisUser.b[bInd].chat.pn.memberIdList;
            break;
        }
    }

    var headerString = t('Forward chat to operator');
    if (type != 'forward') {
        headerString = t('Invite operator to chat');
    }
    var footerString = lzm_displayHelper.createButton('fwd-button', 'ui-disabled', '', t('Ok'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('cancel-operator-forward-selection', '', '', t('Cancel'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = '<fieldset class="lzm-fieldset" id="fwd-container" data-role="none">' +
        '<legend>' + headerString + '</legend>' +
        '<div id="selection-div">' +
        '<select id="fwdGroupSelect" data-role="none" data-selected-group="" style="margin-right: 2px;">' +
        '<option value="">' + t('--- Choose a group ---') + '</option>';
    for (i=0; i<groups.length; i++) {
        if (typeof groups[i].id != 'undefined') {
            bodyString += '<option value="' +groups[i].id + '">' +
                groups[i].name + '</option>';
        }
    }
    bodyString += '</select><br />' +
        '<div id="fwdOperatorSelectDiv" style="padding-top: 10px;">' +
        '<select id="fwdOperatorSelect" data-role="none" data-group-chosen="false" data-selected-operator="" data-operator-available="false"' +
        ' class="ui-disabled" style="margin-right: 2px;">' +
        '<option value="">' + t('--- No group chosen ---') + '</option></select></div></div>';
    bodyString += '<div id="operator-text-div" style="margin-top: 10px;">' +
        '<label for="forward-text" style="font-size: 12px;">' + t('Additional information for the receiver:') + '</label>' +
        '<textarea id="forward-text" placeholder="' + t('Send this text to the other operator.') + '" data-role="none"' +
        ' style="padding: 4px;"></textarea></div>';
    bodyString += '</fieldset>';

    var dialogData = {'visitor-id': id+'~'+b_id, 'chat-partner': id + '~' + b_id, 'chat-id': chat_id};
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'operator-forward-selection',
        {}, {}, {}, {}, '', dialogData, true);
    var fwdTextHeight = Math.max((this.dialogWindowHeight - 205), 100);
    var selWidth = this.dialogWindowWidth - 42;
    if (lzm_displayHelper.checkIfScrollbarVisible('operator-forward-selection')) {
        selWidth -= lzm_displayHelper.getScrollBarWidth();
    }
    $('#forward-text').css({width: selWidth + 'px', height: fwdTextHeight + 'px'});
    $('#fwd-container').css({'min-height':  ($('#operator-forward-selection-body').height() - 22) + 'px'});
    $('#fwdGroupSelect').css({'min-width': '0px', width: (selWidth + 6)+'px'});
    $('#fwdOperatorSelect').css({'min-width': '0px', width: (selWidth + 6)+'px'});

    $('#cancel-operator-forward-selection').click(function() {
        lzm_displayHelper.removeDialogWindow('operator-forward-selection');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
        }
    });
    $('#fwd-button').click(function() {
        var operators = lzm_chatServerEvaluation.operators.getOperatorList();
        var operatorIsOnline = false;
        for (var j=0; j<operators.length; j++) {
            if (operators[j].id == lzm_chatUserActions.forwardData.forward_id) {
                operatorIsOnline = (operators[j].status < 2) ? true : false;
                break;
            }
        }
        if (operatorIsOnline) {
            lzm_chatUserActions.forwardData.forward_text = $('#forward-text').val();
            lzm_chatUserActions.forwardChat(thisUser, type);
            $('#cancel-operator-forward-selection').click();
        } else {
            $('#fwdGroupSelect').change();
        }
    });

    $('#fwdGroupSelect').change(function() {
        var operators = lzm_chatServerEvaluation.operators.getOperatorList();
        var selectedGroupId = $('#fwdGroupSelect').val();
        $('#fwdGroupSelect').data('selected-group', selectedGroupId);
        var opChooseHtml = '';
        var numberOfAvailableOp = 0;
        if (selectedGroupId != '') {
            opChooseHtml = '<select id="fwdOperatorSelect" data-role="none" data-group-chosen="true" data-operator-available="true"' +
                ' data-selected-operator="" style="margin-right: 2px;">' +
                '<option value="">' + t('--- Choose an operator ---') + '</option>';
            for (i=0; i<operators.length; i++) {
                if (operators[i].userid != thisClass.myLoginId &&
                    $.inArray(selectedGroupId, operators[i].groups) != -1 &&
                    (typeof operators[i].isbot == 'undefined' ||
                        operators[i].isbot != 1) &&
                    (operators[i].status != 2 && operators[i].status != 3) &&
                    $.inArray(operators[i].id, memberList) == -1) {
                    var thisOpStatus = t(lzm_commonConfig.lz_user_states[operators[i].status].text);
                    opChooseHtml += '<option value="' + operators[i].userid + '">' +
                        t('<!--op_name--> (<!--op_status-->)', [['<!--op_name-->', operators[i].name], ['<!--op_status-->', thisOpStatus]]) + '</option>';
                    numberOfAvailableOp++;
                }
            }
            opChooseHtml += '</select>';
            if (numberOfAvailableOp == 0) {
                opChooseHtml = '<select id="fwdOperatorSelect" data-role="none" data-selected-operator="" data-group-chosen="true"' +
                    ' data-operator-available="false" class="ui-disabled" style="margin-right: 2px;">' +
                    '<option value="">' + t('--- No operators in this group available ---') + '</option></select>';
            }
        } else {
            opChooseHtml = '<select id="fwdOperatorSelect" data-role="none" data-group-chosen="false" data-selected-operator=""' +
                ' data-operator-available="false" class="ui-disabled" style="margin-right: 2px;">' +
                '<option value="">' + t('--- No group chosen ---') + '</option></select>';
        }
        $('#fwdOperatorSelectDiv').html(opChooseHtml).trigger('create');
        $('#fwdOperatorSelect').css({'min-width': '0px', width: (selWidth + 6)+'px'});
        $('#fwdOperatorSelect').change(function() {
            var selectedOpUserId = $('#fwdOperatorSelect').val();
            $('#fwdOperatorSelect').data('selected-operator', selectedOpUserId);
            var selectedOperator = lzm_chatServerEvaluation.operators.getOperator(selectedOpUserId, 'uid');
            if (selectedOpUserId != '') {
                $('#fwdOperatorSelect').data('operator-chosen', true);
                selectOperatorForForwarding(id, b_id, chat_id, selectedOperator.id, selectedOperator.name, selectedGroupId, $('#forward-text').val(), 0);
                $('#fwd-button').removeClass('ui-disabled');
            } else {
                $('#fwdOperatorSelect').data('operator-chosen', false);
                selectOperatorForForwarding('', '', '', '', '', '', '', 0);
                $('#fwd-button').addClass('ui-disabled');
            }
        });
        $('#fwd-button').addClass('ui-disabled');
    });
};

ChatDisplayClass.prototype.createUserControlPanel = function (user_status, myName, myUserId) {
    var userStatusCSS = {'background-repeat': 'no-repeat', 'background-position': 'center'};
    for (var i = 0; i < this.lzm_commonConfig.lz_user_states.length; i++) {
        if (parseInt(user_status) == this.lzm_commonConfig.lz_user_states[i].index) {
            userStatusCSS['background-image'] = lzm_displayHelper.addBrowserSpecificGradient('url("' + this.lzm_commonConfig.lz_user_states[i].icon + '")');
            break;
        }
    }

    var userSettingsHtml = '<span class="ui-btn-inner">' +
        '<span class="ui-icon ui-icon-arrow-d ui-icon-shadow"> </span><span class="ui-btn-text" style="margin-left: -7px;">';
    if (myName != '') {
        userSettingsHtml += myName + '&nbsp;';
    } else {
        userSettingsHtml += myUserId + '&nbsp;';
    }
    userSettingsHtml += '</span></span>';

    var mainArticleWidth = $('#content_chat').width();
    var thisUserstatusButton = $('#userstatus-button');
    var thisUsersettingsButton = $('#usersettings-button');
    var thisBlankButton = $('#blank-button');
    var thisWishlistButton = $('#wishlist-button');

    var userstatusButtonWidth = 50;
    var usersettingsButtonWidth = 150;
    if (mainArticleWidth > 350) {
        usersettingsButtonWidth = 250;
    } else if (mainArticleWidth > 325) {
        usersettingsButtonWidth = 225;
    } else if (mainArticleWidth > 300) {
        usersettingsButtonWidth = 200;
    } else if (mainArticleWidth > 275) {
        usersettingsButtonWidth = 175;
    }
    var wishlistButtonWidth = 40;
    var blankButtonWidth = mainArticleWidth - userstatusButtonWidth - usersettingsButtonWidth - wishlistButtonWidth - 5;

    thisUserstatusButton.css(userStatusCSS);
    thisUsersettingsButton.html(userSettingsHtml);

    thisUserstatusButton.width(userstatusButtonWidth);
    thisUsersettingsButton.width(usersettingsButtonWidth);
    thisWishlistButton.width(wishlistButtonWidth);
    thisBlankButton.width(blankButtonWidth);
    thisWishlistButton.children('.ui-btn-inner').css({'padding-left': '0px'});

    $('#user-control-panel').trigger('create');
};

ChatDisplayClass.prototype.showUsersettingsMenu = function () {
    $('#userstatus-menu').css('display', 'none');
    $('#minified-dialogs-menu').css('display', 'none');
    this.showUserstatusHtml = false;
    this.showMinifiedDialogsHtml = false;

    //calculate position
    var headerHeight = $('#header_chat').height();
    var userControlpanelHeight = this.userControlPanelHeight;
    var topOffset = headerHeight + userControlpanelHeight + 11;
    var leftOffset = 78;
    var tableWidth = $('#main-menu-panel-settings').width() - 12;

    var thisUsersettingsMenu = $('#usersettings-menu');
    var usersettingsMenuHtml = '<table style="min-width: ' + tableWidth + 'px;">';
    usersettingsMenuHtml += '<tr><td onclick="manageUsersettings(event);">' + t('Options') + '</td></tr>';
    if (!this.isApp && !this.isMobile) {
        usersettingsMenuHtml +='<tr><td onclick="showTranslationEditor(event);">' + t('Translation Editor') + '</td></tr>';
    }
    usersettingsMenuHtml += '<tr><td onclick="showFilterList(event);">' + t('Filters') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="changePassword(event);">' + t('Change Password') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="logout(true, false, event);">' + t('Log out') + '</td></tr>';
    usersettingsMenuHtml += '</table>';
    thisUsersettingsMenu.html(usersettingsMenuHtml);
    thisUsersettingsMenu.css({display: 'block', position: 'absolute', top: topOffset + 'px', left: leftOffset + 'px',
        'z-index': '50'});
};

ChatDisplayClass.prototype.showUserstatusMenu = function (user_status, myName, myUserId) {
    $('#usersettings-menu').css('display', 'none');
    $('#minified-dialogs-menu').css('display', 'none');
    this.showUsersettingsHtml = false;
    this.showMinifiedDialogsHtml = false;

    //calculate position
    var headerHeight = $('#header_chat').height();
    var userControlpanelHeight = this.userControlPanelHeight;
    var topOffset = headerHeight + userControlpanelHeight + 11;
    var leftOffset = 30;
    var tableWidth = $('#main-menu-panel-settings').width() - 12;

    var thisUserstatusMenu = $('#userstatus-menu');
    var userstatusMenuHtml = '<table style="min-width: ' + tableWidth + 'px;">';
    for (var statusIndex = 0; statusIndex < this.lzm_commonConfig.lz_user_states.length; statusIndex++) {
        if (this.lzm_commonConfig.lz_user_states[statusIndex].index != 2) {
            userstatusMenuHtml += '<tr><td ' +
                'onclick="setUserStatus(' + this.lzm_commonConfig.lz_user_states[statusIndex].index + ', \'' + myName + '\', \'' + myUserId + '\', event)">' +
                '&nbsp;<img src="' + this.lzm_commonConfig.lz_user_states[statusIndex].icon + '" width="14px" ' +
                'height="14px">&nbsp;&nbsp;&nbsp;' + t(this.lzm_commonConfig.lz_user_states[statusIndex].text) + '</td></tr>'
        }
    }
    //userstatusMenuHtml += '<tr><td></td></tr>' +
    userstatusMenuHtml += '</table>';
    thisUserstatusMenu.html(userstatusMenuHtml);
    thisUserstatusMenu.css({display: 'block', position: 'absolute', top: topOffset + 'px', left: leftOffset + 'px',
        'z-index': '50'});
};

ChatDisplayClass.prototype.setUserStatus = function (statusValue, myName, myUserId) {
    $('#userstatus-menu').css('display', 'none');
    this.showUserstatusHtml = false;
    this.user_status = statusValue;
    //this.createUserControlPanel(this.user_status, myName, myUserId);
    var statusIcon = lzm_commonConfig.lz_user_states[2].icon;
    for (var i=0; i<lzm_commonConfig.lz_user_states.length; i++) {
        if (lzm_commonConfig.lz_user_states[i].index == this.user_status) {
            statusIcon = lzm_commonConfig.lz_user_states[i].icon;
        }
    }
    $('#main-menu-panel-status-icon').css({'background-image': 'url(\'' + statusIcon + '\')'});
};

ChatDisplayClass.prototype.finishOperatorInvitation = function () {
    clearEditorContents();
    $('#chat').css('display', 'block');
};

ChatDisplayClass.prototype.finishChatForward = function () {
    this.showOpInviteList = false;
    clearEditorContents();
    $('#invite-operator').css('display', 'none');
    $('#forward-chat').css('display', 'none');
    $('#leave-chat').css('display', 'none');
    $('#chat-action').css('display', 'none');
    $('#chat-table').css('display', 'block');
    $('#chat-buttons').css('display', 'none');
};

ChatDisplayClass.prototype.finishLeaveChat = function () {
    $('#chat-table').css('display', 'block');
    $('#chat-progress').css('display', 'none');
    $('#chat-qrd-preview').css('display', 'none');
    $('#chat-action').css('display', 'none');
    $('#chat-buttons').css('display', 'none');
};

ChatDisplayClass.prototype.showInternalChat = function (thisUser, enableButtons) {
    var name = '';
    if (typeof thisUser.name != 'undefined') {
        name = thisUser.name;
    } else {
        name = thisUser.userid;
    }
    $('#visitor-info').html('<div id="visitor-info-headline"><h3>' + t('Visitor Information') + '</h3></div>' +
        '<div id="visitor-info-headline2"></div>').trigger('create');

    $('#chat').css('display', 'block');
    $('#errors').css('display', 'none');
    setEditorDisplay('block');

    this.createChatHtml(thisUser, thisUser.id);
    this.createActiveChatPanel(false, true, false);


    $('#chat-progress').css('display', 'block');
    $('#chat-qrd-preview').css('display', 'block');
    $('#chat-action').css('display', 'block');
    $('#active-chat-panel').css('display', 'block');

    var thisChatButtons = $('#chat-buttons');
    var disabledClass = (enableButtons) ? '' : ' class="ui-disabled"';
    var chatButtonsHtml = '<div' + disabledClass + ' style="margin: 7px 0px;">';
    chatButtonsHtml += lzm_displayHelper.createInputControlPanel();
    chatButtonsHtml += lzm_displayHelper.createButton('visitor-chat-actions', '', 'showVisitorChatActionContextMenu(\'' + this.thisUser.id + '\', \'actions\', event);',
        t('Actions'), 'img/637-tools.png', 'lr', {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '');
    chatButtonsHtml += '</div>';
    thisChatButtons.html(chatButtonsHtml).trigger('create').css('display', 'block');
    if (runningInIframe && !this.isApp) {
        var iframeSendButton = '<div id="iframe-send-button" onclick="sendTranslatedChat(grabEditorContents());"' +
            ' title="' + t('Send') + '" style="background: url(\'../images/lz_button_chat.gif\'); background-color: #8c8c8c;' +
            ' background-repeat: no-repeat; background-position: center; border: 1px solid #8c8c8c; border-radius: 4px;' +
            ' width: 28px; height: 28px; cursor: pointer;"></div>';
        $('#chat-input-controls').html(iframeSendButton).trigger('create');
    }

    $('.lzm-button').mouseenter(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#f6f6f6,#e0e0e0)'));
    });
    $('.lzm-button').mouseleave(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#ffffff,#f1f1f1)'));
    });
};

ChatDisplayClass.prototype.showActiveVisitorChat = function (thisUser) {
    this.showOpInviteList = false;
    var thisUserChat = lzm_chatServerEvaluation.userChats.getUserChat(thisUser.id + '~' + thisUser.b_id);
    var thisChatAction = $('#chat-action');
    var thisChatProgress = $('#chat-progress');
    var thisChatQrdPreview = $('#chat-qrd-preview');
    var thisChatTable = $('#chat-table');
    var thisChatButtons = $('#chat-buttons');

    thisChatTable.css('display', 'block');
    if (thisUserChat == null || thisUserChat.member_status != 2) {
        thisChatAction.css('display', 'block');
        setEditorDisplay('block');
    } else {
        thisChatAction.css('display', 'none');
        setEditorDisplay('none');
    }
    thisChatProgress.css('display', 'block');
    thisChatQrdPreview.css('display', 'block');
    $('#active-chat-panel').css({display: 'block'});
    var openChatHtmlString = '';
    if (thisUserChat != null) {
        openChatHtmlString += '<div style="margin: 7px 0px;">';
        var disabledClass = '';
        if (lzm_chatServerEvaluation.userChats.getUserChat(thisUser.id + '~' + thisUser.b_id).status == 'left' ||
            lzm_chatServerEvaluation.userChats.getUserChat(thisUser.id + '~' + thisUser.b_id).status == 'declined') {
            disabledClass += 'ui-disabled ';
        }
        var hiddenClass = (thisUserChat.member_status != 0) ? 'disabled-chat-button ui-disabled ' : '';
        if (thisUserChat.member_status != 2) {
            openChatHtmlString += lzm_displayHelper.createInputControlPanel('', disabledClass);
        }
        var visitorChat = thisUser.id + '~' + thisUser.b_id + '~' + thisUser.b_chat.id;
        var myButtonCss = {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'};
        if (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null &&
            lzm_chatDisplay.chatTranslations[visitorChat].tvm != null && (lzm_chatDisplay.chatTranslations[visitorChat].tmm.translate ||
            lzm_chatDisplay.chatTranslations[visitorChat].tvm.translate)) {
            myButtonCss['background-image'] = lzm_displayHelper.addBrowserSpecificGradient('', 'blue');
            myButtonCss['color'] = '#ffffff';
        }
        var visitorLanguage = lzm_chatServerEvaluation.userLanguage;
        try {
            visitorLanguage = ($.inArray(thisUser.lang, this.translationLangCodes) != -1) ? thisUser.lang : thisUser.lang.split('-')[0].split('_')[0];
        } catch(e) {}
        var translateButtonCss = lzm_commonTools.clone(myButtonCss);
        translateButtonCss['padding-left'] = '14px';
        translateButtonCss['padding-right'] = '14px';
        openChatHtmlString += lzm_displayHelper.createButton('translate-chat', hiddenClass + disabledClass,
            'showTranslateOptions(\'' + visitorChat + '\', \'' + visitorLanguage + '\');', '', 'img/translate.png', 'lr',
            translateButtonCss, t('Translate'));
        openChatHtmlString += lzm_displayHelper.createButton('visitor-chat-actions', '', 'showVisitorChatActionContextMenu(\'' + this.thisUser.id + '~' + thisUser.b_id + '\', \'actions\', event);',
            t('Actions'), 'img/637-tools.png', 'lr', {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '');
        openChatHtmlString += '</div>';
    }
    thisChatButtons.html(openChatHtmlString).trigger("create");
    thisChatButtons.css('display', 'block');
    if (thisUserChat.member_status != -2) {
        if (runningInIframe && !this.isApp) {
            var iframeSendButton = '<div id="iframe-send-button" onclick="sendTranslatedChat(grabEditorContents());"' +
                ' title="' + t('Send') + '" style="background: url(\'../images/lz_button_chat.gif\'); background-color: #8c8c8c;' +
                ' background-repeat: no-repeat; background-position: center; border: 1px solid #8c8c8c; border-radius: 4px;' +
                ' width: 28px; height: 28px; cursor: pointer;"></div>';
            $('#chat-input-controls').html(iframeSendButton).trigger('create');
        }
    }

    $('.lzm-button').mouseenter(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#f6f6f6,#e0e0e0)'));
    });
    $('.lzm-button').mouseleave(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#ffffff,#f1f1f1)'));
    });
};

ChatDisplayClass.prototype.showPassiveVisitorChat = function (thisUser, id, b_id) {
    clearEditorContents();
    this.showOpInviteList = false;
    var thisChatAction = $('#chat-action');
    var thisChatProgress = $('#chat-progress');
    var thisChatQrdPreview = $('#chat-qrd-preview');
    var thisChatButtons = $('#chat-buttons');

    thisChatAction.css('display', 'none');
    setEditorDisplay('none');
    thisChatProgress.css('display', 'block');
    thisChatQrdPreview.css('display', 'block');
    $('#active-chat-panel').css({display: 'block'});

    var noOpenChatHtmlString = '';
    var thisUserChat = lzm_chatServerEvaluation.userChats.getUserChat(id + '~' + b_id);
    if (thisUserChat != null) {
        var disabledClass = '';
        if (thisUserChat.status == 'left' ||
            thisUserChat.status == 'declined' ||
            thisUserChat.group_chat ||
            !thisUserChat.my_chat) {
            disabledClass = 'ui-disabled ';
        }
        noOpenChatHtmlString += '<div style="margin: 7px 0px;">';
        noOpenChatHtmlString += lzm_displayHelper.createButton('show-visitor-info', '', 'showVisitorInfo(\'' + this.thisUser.id + '\');', '', 'img/215-info.png', 'lr',
                {'padding': '4px 14px 4px 14px', 'cursor': 'pointer', 'margin-left': '4px'}, t('Show information')) +
            lzm_displayHelper.createButton('accept-chat', disabledClass, '', t('Start Chat'), 'img/200-ok2.png', 'lr',
                {'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer', 'margin-left': '4px'}, t('Start Chat'), 20) +
            lzm_displayHelper.createButton('decline-chat', disabledClass, '', '', 'img/201-delete2.png', 'lr',
                {'padding': '4px 14px 4px 14px', 'cursor': 'pointer', 'margin-left': '4px'}, t('Decline')) +
            lzm_displayHelper.createButton('forward-chat', disabledClass, '', '', 'img/291-switch_to_employees.png', 'lr',
                {'padding': '4px 12px 4px 12px', 'cursor': 'pointer', 'margin-left': '4px'}, t('Forward')) +
            lzm_displayHelper.createButton('ban-visitor', '', 'showFilterCreation(\'' + this.thisUser.id + '\');', '', 'img/284-user_delete.png', 'lr',
                {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, t('Ban (add filter)'));
        noOpenChatHtmlString += '</div>';
        thisChatButtons.html(noOpenChatHtmlString).trigger("create");
        thisChatAction.css('display', 'none');
        thisChatProgress.css('display', 'block');
        thisChatQrdPreview.css('display', 'block');
        thisChatButtons.css('display', 'block');
    } else {
        thisChatButtons.html(noOpenChatHtmlString).trigger("create");
    }

    $('.lzm-button').mouseenter(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#f6f6f6,#e0e0e0)'));
    });
    $('.lzm-button').mouseleave(function() {
        $(this).css('background-image', $(this).css('background-image').replace(/linear-gradient\(.*\)/,'linear-gradient(#ffffff,#f1f1f1)'));
    });
};

ChatDisplayClass.prototype.showExternalChat = function () {
    var thisInviteOperator = $('#invite-operator');
    var thisForwardChat = $('#forward-chat');
    var thisLeaveChat = $('#leave-chat');
    $('#decline-chat').css('display', 'none');
    $('#accept-chat').css('display', 'none');
    thisLeaveChat.css('display', 'block');
    thisInviteOperator.css('display', 'block');
    thisForwardChat.css('display', 'block');
};

ChatDisplayClass.prototype.showRefusedChat = function (thisUser) {
    this.createActiveChatPanel(false, true, false);
    this.createHtmlContent(thisUser, thisUser.id + '~' + thisUser.b_id);
    $('#visitor-info').html('');
    $('#chat-action').css('display', 'block');
    $('#chat-progress').css('display', 'block');
    $('#chat-qrd-preview').css('display', 'block');
};

ChatDisplayClass.prototype.showLeaveChat = function (thisUser) {
    this.createActiveChatPanel(false, true, false);
    this.createHtmlContent(thisUser, thisUser.id + '~' + thisUser.b_id);
    $('#visitor-info').html('');

    $('#chat-action').css('display', 'none');
};

ChatDisplayClass.prototype.catchEnterButtonPressed = function (e) {
    var thisChatInput = $('#chat-input');
    if (e.which == 13 || e.keyCode == 13) {
        try {
            sendTranslatedChat();
        } catch(ex) {}
        e.preventDefault();
    }
    if (e.which == 10 || e.keyCode == 10) {
        var tmp = thisChatInput.val();
        thisChatInput.val(tmp + '\n');
    }
};

ChatDisplayClass.prototype.searchButtonUp = function(type, myObjects, e, inDialog) {
    e.stopPropagation();
    var thisClass = this,  searchString = '';
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    if (e.which == 13 || e.keycode == 13 || e.charCode == 13) {
        thisClass.searchButtonUpSet[type] = 0;
        switch (type) {
            case 'qrd':
                thisClass.resourcesDisplay.highlightSearchResults(myObjects,true);
                break;
            case 'ticket':
                searchString = $('#search-ticket').val();
                if (searchString != '') {
                    $('#clear-ticket-search').css({display: 'inline'});
                    thisClass.styleTicketClearBtn();
                    $('#ticket-filter').addClass('ui-disabled');
                } else {
                    $('#clear-ticket-search').css({display: 'none'});
                    $('#ticket-filter').removeClass('ui-disabled');
                }
                searchTickets(searchString);
                break;
            case 'archive':
                searchString = $('#search-archive').val();
                if (searchString != '') {
                    $('#clear-archive-search').css({display: 'inline'});
                    thisClass.archiveDisplay.styleArchiveClearBtn();
                    $('#archive-filter').addClass('ui-disabled');
                } else {
                    $('#clear-archive-search').css({display: 'none'});
                    $('#archive-filter').removeClass('ui-disabled');
                }
                searchArchive(searchString);
                break;
            case 'qrd-list':
                searchString = $('#search-text-input').val();
                if (searchString != '') {
                    $('#clear-resource-search').css({display: 'inline'});
                    thisClass.styleResourceClearBtn();
                } else {
                    $('#clear-resource-search').css({display: 'none'});
                }
                thisClass.resourcesDisplay.fillQrdSearchList(thisClass.resourcesDisplay.qrdChatPartner, inDialog);
                break;
        }
    } else {
        thisClass.searchButtonUpSet[type] = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
        setTimeout(function() {
            if (thisClass.searchButtonUpSet[type] != 0 && lzm_chatTimeStamp.getServerTimeString(null, false, 1) - thisClass.searchButtonUpSet[type] >= 990) {
                switch (type) {
                    case 'qrd':
                        thisClass.resourcesDisplay.highlightSearchResults(myObjects,true);
                        break;
                    case 'ticket':
                        searchString = $('#search-ticket').val();
                        if (searchString != '') {
                            $('#clear-ticket-search').css({display: 'inline'});
                            thisClass.styleTicketClearBtn();
                        } else {
                            $('#clear-ticket-search').css({display: 'none'});
                        }
                        searchTickets(searchString);
                        break;
                    case 'archive':
                        searchString = $('#search-archive').val();
                        if (searchString != '') {
                            $('#clear-archive-search').css({display: 'inline'});
                            thisClass.archiveDisplay.styleArchiveClearBtn();
                        } else {
                            $('#clear-archive-search').css({display: 'none'});
                        }
                        searchArchive(searchString);
                        break;
                    case 'qrd-list':
                        searchString = $('#search-text-input').val();
                        if (searchString != '') {
                            $('#clear-resource-search').css({display: 'inline'});
                            thisClass.styleResourceClearBtn();
                        } else {
                            $('#clear-resource-search').css({display: 'none'});
                        }
                        thisClass.resourcesDisplay.fillQrdSearchList(thisClass.resourcesDisplay.qrdChatPartner, inDialog);
                        break;
                }
            }
        }, 1000);
    }

};

ChatDisplayClass.prototype.showSubMenu = function(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    var i = 0;
    var contextMenuHtml = '<div class="lzm-unselectable" id="' + place + '-context" style="position: absolute; background-color: #f1f1f1;' +
        ' padding: 5px; border: 1px solid #ccc; border-radius: 4px; overflow-x: hidden; overflow-y: auto;"' +
        ' onclick="handleContextMenuClick(event);">';
    contextMenuHtml += '<div style="margin: 0px 0px 4px 0px; text-align: left;">' +
        '<span id="show-super-menu" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;' +
        ' background-image: url("img/supermenu.png"); background-position: left center; background-repeat: no-repeat;\'' +
        ' onclick="showSuperMenu(\'' + place + '\', \'' + category + '\', \'' + objectId + '\', ' + contextX + ', ' + contextY + ', ' + menuWidth + ', ' + menuHeight + ')">' +
        t('Back') + '</span></div><hr />';
    switch(place) {
        case 'ticket-list':
        case 'visitor-information':
            var ticket = null, ticketEditor = null, ticketGroup = null;
            for (i=0; i<this.ticketListTickets.length; i++) {
                if(this.ticketListTickets[i].id == objectId) {
                    ticket = this.ticketListTickets[i];
                }
            }
            if (ticket != null) {
                ticketEditor = (typeof ticket.editor != 'undefined' && ticket.editor != false) ? ticket.editor.ed : '';
                ticketGroup = (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.g != '') ? ticket.editor.g : ticket.gr;
            }
            switch(category) {
                case 'operator':
                    var operators = lzm_chatServerEvaluation.operators.getOperatorList();
                    for (i=0; i<operators.length; i++) {
                        if (operators[i].isbot != '1' && operators[i].id != ticketEditor) {
                            contextMenuHtml += '<div style="margin: 4px 0px 8px 0px; text-align: left;">' +
                                '<span id="show-super-menu" class="cm-line cm-click" style=\'margin-left: 5px;' +
                                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                                ' onclick="setTicketOperator(\'' + objectId + '\', \'' + operators[i].id + '\')">' +
                                operators[i].name + '</span></div>';
                        }
                    }
                    break;
                case 'group':
                    var groups = lzm_chatServerEvaluation.groups.getGroupList();
                    for (i=0; i<groups.length; i++) {
                        if (groups[i].id != ticketGroup) {
                            contextMenuHtml += '<div style="margin: 4px 0px 8px 0px; text-align: left;">' +
                                '<span id="show-super-menu" class="cm-line cm-click" style=\'margin-left: 5px;' +
                                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                                ' onclick="setTicketGroup(\'' + objectId + '\', \'' + groups[i].id + '\')">' +
                                groups[i].name + '</span></div>';
                        }
                    }
                    break;
            }
            break;
    }
    contextMenuHtml += '</div>';

    var myParent = 'body';
    if (place != 'body' && place != 'ticket-details' && place != 'visitor-list-table-div') {
        myParent = '#' + place + '-body';
    } else if (place != 'body') {
        myParent = '#' + place;
    }
    var checkSizeDivHtml = '<div id="context-menu-check-size-div" style="position:absolute; left: -3000px; top: -3000px;' +
        ' width: 2500px; height: 2500px;"></div>';
    $('body').append(checkSizeDivHtml);
    var testContextMenuHtml = contextMenuHtml.replace(/id="/g, 'id="test-');
    $('#context-menu-check-size-div').html(testContextMenuHtml);
    var contextWidth = $('#test-' + place + '-context').width();
    var contextHeight = $('#test-' + place + '-context').height();
    contextWidth = (contextHeight > menuHeight) ? menuWidth + lzm_displayHelper.getScrollBarWidth() : menuWidth;
    contextHeight = Math.min(contextHeight, menuHeight);
    var contextTop = (contextHeight >= menuHeight) ? contextY : contextY + Math.round((menuHeight - contextHeight) / 2);

    $('#context-menu-check-size-div').remove();
    this.storedSuperMenu = $('#' + place + '-context').html();
    $('#' + place + '-context').replaceWith(contextMenuHtml);
    var myStyleObject = {left: contextX, width: contextWidth+'px', height: contextHeight+'px', top: contextTop};
    $('#' + place + '-context').css(myStyleObject);
};

ChatDisplayClass.prototype.showSuperMenu = function(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    var contextMenuHtml = '<div class="lzm-unselectable" id="' + place + '-context" style="position: absolute; background-color: #f1f1f1;' +
        ' padding: 5px; border: 1px solid #ccc; border-radius: 4px; overflow-x: hidden; overflow-y: auto;"' +
        ' onclick="handleContextMenuClick(event);">' + this.storedSuperMenu + '</div>';
    $('#' + place + '-context').replaceWith(contextMenuHtml);
    var myStyleObject = {left: contextX+'px', width: menuWidth+'px', height: menuHeight+'px', top: contextY+'px'};
    $('#' + place + '-context').css(myStyleObject);
};

ChatDisplayClass.prototype.showContextMenu = function(place, myObject, mouseX, mouseY, button) {
    button = (typeof button != 'undefined') ? button : '';
    var thisClass = this;
    var myHeight = 200, contextX = mouseX + 'px', contextY = mouseY + 'px', contextMenuName = place;
    var filterList, i, myVisibility;
    $('#' + place + '-context').remove();

    var contextMenuHtml = '<div class="lzm-unselectable" id="' + contextMenuName + '-context" style="position: absolute; background-color: #f1f1f1;' +
        ' padding: 5px; border: 1px solid #ccc; border-radius: 4px; z-index:10; overflow-y: auto; overflow-x: hidden;"' +
        ' onclick="handleContextMenuClick(event);">';
    var disabledClass = '';
    switch(place) {
        case 'qrd-tree':
            disabledClass = (myObject.ty == 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="add-qrd" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/078-preview.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="previewQrd(\'\',\'' + myObject.chatPartner + '\');">' +
                t('Preview') + '</span></div><hr />';
            disabledClass = (myObject.ty != 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px; text-align: left;"><span id="add-qrd" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/059-doc_new2.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="addQrd();">' +
                t('Add') + '</span></div>';
            disabledClass = (myObject.rid == 1) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px; text-align: left;"><span id="edit-qrd" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/048-doc_edit.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="editQrd();">' +
                t('Edit') + '</span></div>';
            disabledClass = (myObject.rid == 1) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px 0px 0px; text-align: left;"><span id="delete-qrd" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/201-delete2.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="deleteQrd();">' +
                t('Delete') + '</span></div>';
            break;
        case 'ticket-list':
        case 'visitor-information':
            var inDialog = (place == 'ticket-list') ? false : true;
            var dialogId = (place == 'ticket-list') ? '' : $('#visitor-information').data('dialog-id');
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="show-ticket-details" class="cm-line cm-click"' +
                ' onclick="showTicketDetails(\'' + myObject.id + '\', true, \'\', \'\', \'' + dialogId + '\');">' +
                t('Open Ticket') + '</span></div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span class="cm-line" style="padding-left: 0px;">' + t('Status:') + '</span>';
            contextMenuHtml += '<div style="margin: 4px 0px 8px 0px; text-align: left;">' +
                '<span id="set-ticket-open" class="cm-line cm-click"' +
                ' style=\'background-image: url("img/215-info.png");\' onclick="changeTicketStatus(0, false, ' + inDialog + ')">' +
                t('Open (O)') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="set-ticket-progress" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/128-status.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="changeTicketStatus(1, false, ' + inDialog + ')">' +
                t('In Progress (P)') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="set-ticket-closed" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/200-ok2.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="changeTicketStatus(2, false, ' + inDialog + ')">' +
                t('Closed (C)') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 0px 0px; text-align: left;">' +
                '<span id="set-ticket-deleted" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/205-close16c.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="changeTicketStatus(3, false, ' + inDialog + ')">' +
                t('Deleted (D)') + '</span></div>';
            contextMenuHtml += '</div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 4px 0px; text-align: left;' +
                ' background-image: url(\'img/submenu.png\'); background-position: right center; background-repeat: no-repeat;">' +
                '<span id="show-operator-submenu" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="showSubMenu(\'' + place + '\', \'operator\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)">' +
                t('Operator') + '</span></div>';
            contextMenuHtml += '<div style="margin: 4px 0px 0px 0px; text-align: left;' +
                ' background-image: url(\'img/submenu.png\'); background-position: right center; background-repeat: no-repeat;">' +
                '<span id="show-group-submenu" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="showSubMenu(\'' + place + '\', \'group\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)">' +
                t('Group') + '</span></div><hr />';
            disabledClass = ((myObject.u <= thisClass.ticketGlobalValues.mr &&
                thisClass.lzm_commonTools.checkTicketReadStatus(myObject.id, thisClass.ticketUnreadArray) == -1) ||
                (myObject.u > thisClass.ticketGlobalValues.mr &&
                    lzm_commonTools.checkTicketReadStatus(myObject.id, thisClass.ticketReadArray, thisClass.ticketListTickets) != -1)) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div ' + disabledClass + 'style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="set-ticket-read" class="cm-line cm-click" onclick="changeTicketReadStatus(\'' + myObject.id + '\', \'read\');">' +
                t('Mark as read') + '</span></div>';
            if (place == 'ticket-list') {
                contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                    '<span id="set-all-tickets-read" class="cm-line cm-click" onclick="setAllTicketsRead();">' +
                    t('Mark all as read') + '</span></div>';
            }
            break;
        case 'ticket-filter':
            filterList = myObject.filter.split('');
            for (i=0; i<4; i++) {
                if ($.inArray(i.toString(), filterList) != -1) {
                    thisClass.ticketFilterChecked[i] = 'visible';
                } else {
                    thisClass.ticketFilterChecked[i] = 'hidden';
                }
            }
            thisClass.ticketFilterPersonal = (myObject.filter_personal) ? 'visible' : 'hidden';
            thisClass.ticketFilterGroup = (myObject.filter_group) ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-open" class="cm-line cm-click" onclick="toggleTicketFilter(0, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Open', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterChecked[0] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-progress" class="cm-line cm-click" onclick="toggleTicketFilter(1, event)" style="padding-left: 0px;">' +
                t('<!--checked--> In Progress', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterChecked[1] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-closed" class="cm-line cm-click" onclick="toggleTicketFilter(2, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Closed', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterChecked[2] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-deleted" class="cm-line cm-click" onclick="toggleTicketFilter(3, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Deleted', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterChecked[3] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-personal" class="cm-line cm-click" onclick="toggleTicketFilterPersonal(0, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Only my tickets', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterPersonal + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-group" class="cm-line cm-click" onclick="toggleTicketFilterPersonal(1, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Only my group\'s tickets', [['<!--checked-->', '<span style="visibility: ' + thisClass.ticketFilterGroup + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<hr />';
            var channels = [t('Web'), t('Email'), t('Phone'), t('Misc'), t('Chat'), t('Rating'), t('Facebook'), t('Twitter')];
            for (i=0; i<channels.length; i++) {
                var thisChannelChecked = (lzm_chatPollServer.ticketFilterChannel.indexOf('' + i) != -1) ? 'visible' : 'hidden';
                contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                    '<span id="toggle-filter-channel-' + i + '" class="cm-line cm-click" onclick="toggleTicketFilterChannel(' + i + ', event)" style="padding-left: 0px;">' +
                    '<span style="visibility: ' + thisChannelChecked + ';">&#10003;</span> ' + channels[i] + '</span></div>';
            }
            place = 'chat_page';
            break;
        case 'ticket-details':
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="reply-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/060-reply.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="removeTicketMessageContextMenu(); $(\'#reply-ticket-details\').click();">' +
                t('Reply') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="forward-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/061-forward.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="showMessageForward(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\');">' +
                t('Forward') + '</span></div>';
            disabledClass = (myObject.ti.messages[myObject.msg].t != 1) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="resend-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/023-email5.png");' +
                ' background-position: left center; background-repeat: no-repeat;\'' +
                ' onclick="sendForwardedMessage({id : \'\'}, \'\', \'\', \'\', \'' + myObject.ti.id + '\', \'\', \'' + myObject.msg + '\')">' +
                t('Resend message') + '</span></div><hr />';
            disabledClass = (myObject.msg == 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="copy-msg-to-new" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="moveMessageToNewTicket(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')">' +
                t('Copy message into new Ticket') + '</span></div><hr />';
            var emailIdEnc = lz_global_base64_url_encode(myObject.ti.messages[myObject.msg].ci);
            disabledClass = (myObject.ti.t == 1 && (myObject.ti.messages[myObject.msg].t == 3 || myObject.ti.messages[myObject.msg].t == 4)) ? '' : ' class="ui-disabled"';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="show-html-email" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="showHtmlEmail(\'' + emailIdEnc + '\')">' +
                t('Show Html Email') + '</span></div><hr />';
            disabledClass = ($('#message-details-inner').data('edit')) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="edit-msg" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="removeTicketMessageContextMenu(); toggleMessageEditMode();">' +
                t('Edit Message') + '</span></div>';
            break;
        case 'archive-filter':
            filterList = myObject.filter.split('');
            for (i=0; i<4; i++) {
                if ($.inArray(i.toString(), filterList) != -1) {
                    thisClass.archiveFilterChecked[i] = 'visible';
                } else {
                    thisClass.archiveFilterChecked[i] = 'hidden';
                }
            }
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-archive-open" class="cm-line cm-click" onclick="toggleArchiveFilter(0, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Operators', [['<!--checked-->', '<span style="visibility: ' + thisClass.archiveFilterChecked[0] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-archive-progress" class="cm-line cm-click" onclick="toggleArchiveFilter(1, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Visitors', [['<!--checked-->', '<span style="visibility: ' + thisClass.archiveFilterChecked[1] + ';">&#10003;</span>']]) + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-archive-closed" class="cm-line cm-click" onclick="toggleArchiveFilter(2, event)" style="padding-left: 0px;">' +
                t('<!--checked--> Groups', [['<!--checked-->', '<span style="visibility: ' + thisClass.archiveFilterChecked[2] + ';">&#10003;</span>']]) + '</span></div>';
            place = 'chat_page';
            break;
        case 'visitor-list-table-div':
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="show-this-visitor-details" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="showVisitorInfo(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();">' +
                t('Details') + '</span></div><hr />';
            disabledClass = (myObject.chatting == 'true' && myObject.declined == 'false') ? ' class="ui-disabled"' : '';
            var invText = (myObject.status != 'requested') ? t('Chat Invitation') : t('Cancel invitation(s)');
            var invLogo = (myObject.status != 'requested') ? 'img/632-skills.png' : 'img/632-skills_not.png';
            var onclickAction = (myObject.status != 'requested') ? 'showVisitorInvitation(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();' :
                'cancelInvitation(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="invite-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("' + invLogo + '");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="' + onclickAction + '">' +
                invText + '</span></div>';
            disabledClass = ((myObject.chatting == 'true' && myObject.declined == 'false') || myObject.status == 'requested') ? ' class="ui-disabled"' : '';
            onclickAction = 'startVisitorChat(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
            '<span id="invite-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
            ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + '">' +
            t('Start Chat') + '</span></div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="ban-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
                ' onclick="showFilterCreation(\'' + myObject.visitor.id + '\'); removeVisitorListContextMenu();">' +
                t('Ban (add filter)') + '</span></div>';
            break;
        case 'operator-list':
            var browserId = (typeof myObject.browser != 'undefined' && typeof myObject.browser.id != 'undefined') ? myObject.browser.id : '';
            var chatId = (typeof myObject.browser != 'undefined' && typeof myObject.browser.chat != 'undefined') ? myObject.browser.chat.id : '';
            var group = lzm_chatServerEvaluation.groups.getGroup(myObject.groupId);
            var groupIsDynamic = (group != null && typeof group.i != 'undefined');
            disabledClass = (myObject.type == 'operator' && (myObject['chat-partner'].userid == thisClass.myLoginId ||
                (typeof myObject['chat-partner'].isbot != 'undefined' && myObject['chat-partner'].isbot == 1)) ||
                (myObject.type == 'visitor' && lzm_chatServerEvaluation.userChats.getUserChat(myObject['chat-partner'].id + '~' + myObject.browser.id) == null)) ?
                ' class="ui-disabled"' : '';
            var cpUserId = (myObject.type == 'visitor' || myObject.type == 'group') ? myObject['chat-partner'].id : myObject['chat-partner'].userid;
            onclickAction = (myObject.type == 'visitor') ?
                'viewUserData(\'' + myObject['chat-partner'].id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', true);' :
                'chatInternalWith(\'' + myObject['chat-partner'].id + '\', \'' + cpUserId + '\', \'' + myObject['chat-partner'].name + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-with-this-partner" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/217-quote.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="' + onclickAction + 'removeOperatorListContextMenu();">' +
                t('Start Chat') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="create-dynamic-group" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/lz_group_dynamic.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="createDynamicGroup(); removeOperatorListContextMenu();">' +
                t('Create Dynamic Group') + '</span></div>';
            disabledClass = (myObject.type != 'operator') ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="add-to-dynamic-group" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="addToDynamicGroup(\'' + myObject['chat-partner'].id +
                '\', \'' + browserId + '\', \'' + chatId + '\'); removeOperatorListContextMenu();">' +
                t('Add to Dynamic Group') + '</span></div>';
            disabledClass = ((myObject.type != 'operator' && myObject.type != 'visitor') || !groupIsDynamic) ? ' class="ui-disabled"' : '';
            var cpId = (myObject.type != 'visitor') ? myObject['chat-partner'].id : myObject['chat-partner'].id + '~' + myObject['browser'].id;
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="remove-from-dynamic-group" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="removeFromDynamicGroup(\'' + cpId +
                '\', \'' + myObject.groupId + '\'); removeOperatorListContextMenu();">' +
                t('Remove from Dynamic Group') + '</span></div>';
            disabledClass = (myObject.type != 'group' || typeof myObject['chat-partner'].i == 'undefined') ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="delete-dynamic-group" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="deleteDynamicGroup(\'' + myObject['chat-partner'].id + '\'); removeOperatorListContextMenu();">' +
                t('Delete Dynamic Group') + '</span></div>';
            break;
        case 'report-list':
            disabledClass = '';
            onclickAction = 'loadReport(\'' + myObject.i + '\', \'report\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="load-this-report" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
                t('Report') + '</span></div>';
            disabledClass = (myObject.r != 'day') ? ' class="ui-disabled"' : '';
            onclickAction = 'loadReport(\'' + myObject.i + '\', \'visitors\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="load-this-visitors" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
                t('Visitors') + '</span></div><hr />';
            disabledClass = (!myObject.canBeReCalculated) ? ' class="ui-disabled"' : '';
            onclickAction = 'recalculateReport(\'' + myObject.i + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="recalculate-this-report" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer; background-image: url("img/127-transfer.png");' +
                ' background-position: left center; background-repeat: no-repeat;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
                t('Recalculate') + '</span></div>';
            break;
        case 'report-filter':
            myVisibility = (lzm_chatPollServer.reportFilter == 'day') ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-day" class="cm-line cm-click" onclick="toggleReportFilter(\'day\', event)" style="padding-left: 0px;">' +
                t('<!--checked--> Day', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
            myVisibility = (lzm_chatPollServer.reportFilter == 'month') ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-month" class="cm-line cm-click" onclick="toggleReportFilter(\'month\', event)" style="padding-left: 0px;">' +
                t('<!--checked--> Month', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
            myVisibility = (lzm_chatPollServer.reportFilter == 'year') ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-filter-year" class="cm-line cm-click" onclick="toggleReportFilter(\'year\', event)" style="padding-left: 0px;">' +
                t('<!--checked--> Year', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
            place = 'chat_page';
            break;
        case 'all-chats':
            disabledClass = '';
            onclickAction = 'showVisitorInfo(\'' + myObject.visitor.id + '\', \'' + myObject.visitor.name + '\', \'' + myObject.browser.chat.id + '\', 0);';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="show-allchats-details" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Details') + '</span></div><hr />';
            disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(thisClass.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
                ' class="ui-disabled"' : '';
            onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', false);';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="join-allchats" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer; background-image: url("img/lz_online_16.png"); background-position: left center' +
                '; background-repeat: no-repeat;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Join') + '</span></div>';
            disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(thisClass.myId, myObject.browser.chat.pn.memberIdList) != -1) ?
                ' class="ui-disabled"' : '';
            onclickAction = 'joinChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', true);';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="join-allchats-invisible" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer; background-image: url("img/lz_hidden.png"); background-position: left center' +
                '; background-repeat: no-repeat;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Join (invisible)') + '</span></div><hr />';
            disabledClass = (myObject.missed || (myObject.browser.chat.pn.acc == 1 && myObject.isBotChat == 0)) ? ' class="ui-disabled"' : '';
            onclickAction = 'takeChat(\'' + myObject.visitor.id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', \'' + myObject.browser.chat.gr + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="take-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Take') + '</span></div><hr />';
            disabledClass = (myObject.missed || myObject.browser.chat.pn.acc == 0 || $.inArray(thisClass.myId, myObject.browser.chat.pn.memberIdList) == -1) ?
                ' class="ui-disabled"' : '';
            onclickAction = 'leaveChat(\'' + myObject.browser.chat.id + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="leave-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Leave') + '</span></div>';
            disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
            onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="forward-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Forward') + '</span></div>';
            disabledClass = (myObject.missed) ? ' class="ui-disabled"' : '';
            onclickAction = 'forwardChat(\'' + myObject.browser.chat.id + '\', \'invite\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="invite-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Invite Operator') + '</span></div><hr />';
            disabledClass = '';
            onclickAction = 'showVisitorInfo(\'' + myObject.visitor.id + '\', \'' + myObject.visitor.name + '\', \'' + myObject.browser.chat.id + '\', 4);';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="show-allchats-archive" class="cm-line cm-click" style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer; background-image: url("img/081-file_manager.png"); background-position: left center' +
                '; background-repeat: no-repeat;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Archive') + '</span></div><hr />';
            disabledClass = '';
            onclickAction = 'showFilterCreation(\'\', \'' + myObject.browser.chat.id + '\');';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="ban-allchats" class="cm-line cm-click" style=\'margin-left: 5px;' +
                ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeChatLineContextMenu();">' +
                t('Ban (add filter)') + '</span></div>';
            break;
        case 'allchats-filter':
            myVisibility = (myObject.filter == 'active') ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-allchats-active" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'active\', event)" style="padding-left: 0px;">' +
                '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Active Chats') + '</span></div>';
            myVisibility = (myObject.filter == 'missed') ? 'visible' : 'hidden';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="toggle-allchats-missed" class="cm-line cm-click" onclick="toggleAllchatsFilter(\'missed\', event)" style="padding-left: 0px;">' +
                '<span style="visibility: ' + myVisibility + ';">&#10003;</span> ' + t('Missed Chats') + '</span></div>';
            place = 'chat_page';
            break;
        case 'filter-list':
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="new-filter" class="cm-line cm-click" onclick="showFilterCreation(\'\', \'\', \'\', true);"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer; background-image: url("img/203-add.png"); background-position: left center' +
                '; background-repeat: no-repeat;\'>' +
                t('New Filter') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="eidt-filter" class="cm-line cm-click" onclick="showFilterCreation(\'\', \'\', \'' + myObject.filterid + '\', true);"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer; background-image: url("img/156-writer.png"); background-position: left center' +
                '; background-repeat: no-repeat;\'>' +
                t('Edit Filter') + '</span></div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="remove-filter" class="cm-line cm-click" onclick="deleteFilter(\'' + myObject.filterid + '\');"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px; cursor:pointer;\'>' +
                t('Remove (from server)') + '</span></div>';
            break;
        case 'chat-actions':
            disabledClass = (myObject.b_id == '') ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-show-info" class="cm-line cm-click" onclick="showVisitorInfo(\'' + myObject.id + '\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Show information') + '</span></div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-send-file" class="cm-line cm-click" onclick="addQrdToChat(\'file\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Send File') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-send-link" class="cm-line cm-click" onclick="addQrdToChat(\'link\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Send Url') + '</span></div><hr />';
            disabledClass = (myObject.b_id == '' || myObject.member_status != 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-forward-chat" class="cm-line cm-click" onclick="forwardChat(\'' + myObject.chat_id + '\', \'forward\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Forward Chat') + '</span></div>';
            disabledClass = (myObject.b_id == '' || myObject.member_status != 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-invite-operator" class="cm-line cm-click" onclick="forwardChat(\'' + myObject.chat_id + '\', \'invite\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Invite Operator') + '</span></div>';
            disabledClass = (myObject.b_id == '' || myObject.member_status != 0) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-add-dynamic" class="cm-line cm-click"' +
                ' onclick="addToDynamicGroup(\'' + myObject.id + '\', \'' + myObject.b_id + '\', \'' + myObject.chat_id + '\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Add to Dynamic Group') + '</span></div><hr />';
            disabledClass = (myObject.b_id == '') ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-add-filter" class="cm-line cm-click" onclick="showFilterCreation(\'' + myObject.id + '\');removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Ban (add filter)') + '</span></div><hr />';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="chat-close-all-offline" class="cm-line cm-click" onclick="closeAllInactiveChats();removeVisitorChatActionContextMenu();"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Close all offline chats') + '</span></div>';
            place = 'chat-container';
            break;
        case 'archive':
            var name = '', opId, cpId, qId;
            if (myObject.t == 0) {
                var opList = myObject.iid.split('-');
                var myPosition = $.inArray(lzm_chatDisplay.myId, opList);
                if (myPosition != -1) {
                    opId = opList[myPosition];
                    cpId = opList[1 - myPosition];
                } else {
                    opId = opList[0];
                    cpId = opList[1];
                }
                qId = myObject.iid;
            } else {
                opId = myObject.iid;
                cpId = (myObject.eid != '') ? myObject.eid : myObject.gid;
                qId = cpId;
            }
            try {
                name = (myObject.t == 0) ? lzm_chatServerEvaluation.operators.getOperator(cpId).name : (myObject.t == 1) ?
                    lzm_commonTools.htmlEntities(myObject.en) : (myObject.gid == 'everyoneintern') ? t('All operators') : capitalize(myObject.gid);
            } catch (e) {}
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="archive-send-transcript" class="cm-line cm-click"' +
                ' onclick="sendChatTranscriptTo(\'' + myObject.cid + '\');"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('Send transcript to...') + '</span></div>';
            disabledClass = (myObject.t == 0 || myObject.t == 2) ? ' class="ui-disabled"' : '';
            contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="archive-send-transcript" class="cm-line cm-click"' +
                ' onclick="showTicketDetails(\'\', false, \'\', \'' + myObject.cid + '\');"' +
            ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
            ' cursor:pointer; background-image: url("img/023-email6.png"); background-position: left center' +
                '; background-repeat: no-repeat;\'>' +
            t('Create Ticket') + '</span></div>';
            contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
                '<span id="archive-show-chats" class="cm-line cm-click"' +
                ' onclick="showArchivedChat(\'' + qId + '\', \'' + name + '\', \'' + myObject.cid + '\', \'' + myObject.t + '\');"' +
                ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px;' +
                ' cursor:pointer;\'>' +
                t('All Chats of this User') + '</span></div>';
            break;
    }
    contextMenuHtml += '</div>';

    var myParent = 'body';
    if (place != 'body' && place != 'ticket-details' && place != 'visitor-list-table-div' && place != 'chat_page' && place != 'chat-container') {
        myParent = '#' + place + '-body';
    } else if (place != 'body') {
        myParent = '#' + place;
    }
    var checkSizeDivHtml = '<div id="context-menu-check-size-div" style="position:absolute; left: -1000px; top: -1000px;' +
        ' width: 800px; height: 800px;"></div>';
    $('body').append(checkSizeDivHtml);
    $('#context-menu-check-size-div').html(contextMenuHtml);
    var parentWidth = $(myParent).width();
    var parentHeight = $(myParent).height();
    var contextWidth = $('#' + contextMenuName + '-context').width();
    var contextHeight = Math.min(parentHeight - 24, $('#' + contextMenuName + '-context').height());

    if (parentHeight != null && parentWidth != null) {
        var remainingHeight = parentHeight - mouseY;
        var remainigWidth = parentWidth - mouseX;
        var widthDiff = remainigWidth - contextWidth - 12;
        var heightDiff = remainingHeight - contextHeight - 12;
        if (widthDiff < 0) {
            contextX = Math.max((mouseX - contextWidth - 12), 5) + 'px';
        }
        if (heightDiff < 0) {
            contextY = Math.max((mouseY - contextHeight - 12), 5) + 'px';
        }
    }

    $('#context-menu-check-size-div').remove();
    contextMenuHtml = contextMenuHtml.replace(/%CONTEXTX%/g, parseInt(contextX)).replace(/%CONTEXTY%/g, parseInt(contextY))
        .replace(/%MYWIDTH%/g, parseInt(contextWidth)).replace(/%MYHEIGHT%/g, parseInt(contextHeight));
    $(myParent).append(contextMenuHtml);
    var myStyleObject = {left: contextX, width: contextWidth+'px', height: contextHeight+'px'};
    if (button == 'ticket-message-actions') {
        myStyleObject.bottom = '30px';
    } else if (button == 'chat-actions' && myObject.button == 'actions') {
        myStyleObject.bottom = '77px';
    } else {
        myStyleObject.top = contextY;
    }
    $('#' + contextMenuName + '-context').css(myStyleObject);
};

ChatDisplayClass.prototype.styleTicketClearBtn = function() {
    var ctsBtnWidth = $('#clear-ticket-search').width();
    var ctsBtnHeight =  $('#clear-ticket-search').height();
    var ctsBtnPadding = Math.floor((18-ctsBtnHeight)/2)+'px ' +  Math.floor((18-ctsBtnWidth)/2)+'px ' + Math.ceil((18-ctsBtnHeight)/2)+'px ' +  Math.ceil((18-ctsBtnWidth)/2)+'px';
    $('#clear-ticket-search').css({padding: ctsBtnPadding});
};

ChatDisplayClass.prototype.styleResourceClearBtn = function() {
    var ctsBtnWidth = $('#clear-resource-search').width();
    var ctsBtnHeight =  $('#clear-resource-search').height();
    var ctsBtnPadding = Math.floor((18-ctsBtnHeight)/2)+'px ' +  Math.floor((18-ctsBtnWidth)/2)+'px ' + Math.ceil((18-ctsBtnHeight)/2)+'px ' +  Math.ceil((18-ctsBtnWidth)/2)+'px';
    $('#clear-resource-search').css({padding: ctsBtnPadding});
};

ChatDisplayClass.prototype.createMainMenuPanel = function() {
    var panelHtml = lzm_displayHelper.createMainMenuPanel();

    $('#main-menu-panel').html(panelHtml).trigger('create');
    $('#main-menu-panel').css('display', 'block');

    // Remove old menu panel and move view select panel upwards
    $('#new-view-select-panel').css('margin-top', '51px');
    lzm_displayLayout.resizeMenuPanels();
};

ChatDisplayClass.prototype.createViewSelectPanel = function(target) {
    var viewSelectPanel = lzm_displayHelper.createViewSelectPanel(target);
    $('#new-view-select-panel').html(viewSelectPanel);
};

ChatDisplayClass.prototype.playSound = function(name, sender) {
    if (name == 'message') {
        blinkPageTitle(t('New chat activity'));
    }
    var thisClass = this;
    $('#sound-'+name)[0].volume = thisClass.volume / 100;
    if ($.inArray(sender, thisClass.soundPlayed) == -1) {
        if (typeof lzm_deviceInterface == 'undefined') {
            $('#sound-'+name)[0].play();
        } else {
            try {
                lzm_deviceInterface.playSound(name, thisClass.volume/100);
                if (thisClass.vibrateNotifications != 0) {
                    if (lzm_chatPollServer.appBackground == 0) {

                    } else {

                    }
                }
            } catch(ex) {
                logit('Playing message sound failed.');
            }
        }
    }
    thisClass.addSoundPlayed(sender);
    setTimeout(function() {thisClass.removeSoundPlayed(sender);}, 2000);
};

ChatDisplayClass.prototype.addSoundPlayed = function(sender) {
    if ($.inArray(sender,this.soundPlayed) == -1) {
        this.soundPlayed.push(sender);
    }
};

ChatDisplayClass.prototype.removeSoundPlayed = function(sender) {
    if ($.inArray(sender,this.soundPlayed) != -1) {
        var tmpSoundPlayed = [];
        for (var i=0; i<this.soundPlayed.length; i++) {
            if (this.soundPlayed[i] != sender) {
                tmpSoundPlayed.push(this.soundPlayed[i]);
            }
        }
        this.soundPlayed = tmpSoundPlayed;
    }
};

ChatDisplayClass.prototype.startRinging = function(senderList) {
    blinkPageTitle(t('New chat activity'));
    var thisClass = this;
    var notificationSound;
    if (thisClass.playNewChatSound == 1) {
        notificationSound = 'NONE';
    } else {
        notificationSound = 'DEFAULT';
    }
        var newSender = [];
        var startRinging = false;
        for (var i = 0; i<senderList.length; i++) {
            if ($.inArray(senderList[i], thisClass.ringSenderList) == -1) {
                thisClass.ringSenderList.push(senderList[i]);
                newSender.push(senderList[i]);
            }
            if (typeof thisClass.isRinging[senderList[i]] == 'undefined' || !thisClass.isRinging[senderList[i]]) {
                startRinging = true;
                this.isRinging[senderList[i]] = true;
            }
        }
        var tmpRingSenderList = [];
        for (var j=0; j<thisClass.ringSenderList.length; j++) {
            if ($.inArray(thisClass.ringSenderList[j], senderList) != -1) {
                tmpRingSenderList.push(thisClass.ringSenderList[j]);
            }
        }
        thisClass.ringSenderList = tmpRingSenderList;
        if (startRinging) {

                for (var k=0; k<newSender.length; k++) {
                    var senderId = newSender[k].split('~')[0];
                    var senderBid = newSender[k].split('~')[1];
                    var senderQuestion, senderName;
                    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(senderId);
                    if (visitor != null) {
                        for (var m=0; m<visitor.b.length; m++) {
                            if (visitor.b[m].id == senderBid) {
                                senderName = (typeof visitor.b[m].cname != 'undefined' && visitor.b[m].cname != '') ? visitor.b[m].cname : visitor.unique_name;
                                senderQuestion = (typeof visitor.b[m].chat.eq != 'undefined' && visitor.b[m].chat.eq != '') ?
                                    visitor.b[m].chat.eq : t('New Chat Request');
                            }
                        }
                    }
                    var notificationText = t('<!--sender--> wants to chat with you.', [['<!--sender-->', lzm_commonTools.htmlEntities(senderName)]]);
                    if (typeof lzm_deviceInterface != 'undefined') {
                        try {
                            thisClass.lastChatSendingNotification = newSender[k];
                            lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, newSender[k], newSender[k], '0');
                        } catch(ex) {
                            try {
                                lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, newSender[k], newSender[k]);
                            } catch(e) {
                                logit('Error while showing notification');
                            }
                        }
                    }
                    if (thisClass.selected_view != 'mychats' || $('.dialog-window-container').length > 0) {
                        lzm_displayHelper.showBrowserNotification({
                            text: notificationText,
                            subject: t('New Chat Request'),
                            action: 'openChatFromNotification(\'' + newSender[k] + '\'); closeOrMinimizeDialog();',
                            timeout: 10
                        });
                    }
                }
            thisClass.ring(senderList);
        }
};

ChatDisplayClass.prototype.ring = function (senderList) {
    var thisClass = this;
    var audio = $('#sound-ringtone')[0];
    var playRingSound = false;
    for (var i=0; i<senderList.length; i++) {
        if (typeof this.isRinging[senderList[i]] != 'undefined' && this.isRinging[senderList[i]]) {
            playRingSound = true;
        }
    }
    if (thisClass.playNewChatSound == 1 &&  playRingSound) {
        audio.volume = this.volume / 100;
        if (typeof lzm_deviceInterface == 'undefined') {
            audio.play();
        } else {
            try {
                lzm_deviceInterface.playSound('ringtone', thisClass.volume/100);
                if (thisClass.vibrateNotifications != 0) {
                    if (lzm_chatPollServer.appBackground == 0) {

                    } else {

                    }
                }
            } catch(ex) {
                logit('Playing ringtone failed.');
            }
        }
        if (thisClass.repeatNewChatSound == 1) {
            setTimeout(function() {
                thisClass.ring(senderList);
            }, 5000);
        }
    }
};

ChatDisplayClass.prototype.stopRinging = function(senderList) {
    for (var key in this.isRinging) {
        if (this.isRinging.hasOwnProperty(key)) {
            if ($.inArray(key, senderList) == -1) {
                delete this.isRinging[key];
            }
        }
    }
};

ChatDisplayClass.prototype.showDisabledWarning = function() {
    var that = this;
    if (this.serverIsDisabled && (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - this.lastDiabledWarningTime >= 90000)) {
        if (!this.alertDialogIsVisible) {
            this.alertDialogIsVisible = true;
            var confirmText = t('This LiveZilla server has been deactivated by the administrator.') + '<br />' +
                t('Do you want to logout now?');
            lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
            $('#alert-btn-ok').click(function() {
                that.alertDialogIsVisible = false;
                logout(false);
            });
            $('#alert-btn-cancel').click(function() {
                that.lastDiabledWarningTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                that.alertDialogIsVisible = false;
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};
