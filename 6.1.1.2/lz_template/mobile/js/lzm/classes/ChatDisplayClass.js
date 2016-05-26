/****************************************************************************************
 * LiveZilla ChatDisplayClass.js
 *
 * Copyright 2016 LiveZilla GmbH
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
    this.myGroupsAway = null;
    this.newGroupsAway = null;
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
    this.startPageExists = false;
    this.awayAfterTime = userConfigData['awayAfter'];
    this.volume = userConfigData['userVolume'];
    this.playNewMessageSound = userConfigData['playIncomingMessageSound'];
    this.playNewChatSound = userConfigData['playIncomingChatSound'];
    this.repeatNewChatSound = userConfigData['repeatIncomingChatSound'];
    this.playNewTicketSound = userConfigData['playIncomingTicketSound'];
    this.queueSoundActive = false;

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
        mychats: {pos: 0, title: 'Chats', icon: ''}, tickets: {pos: 0, title: 'Tickets', icon: ''},
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
    this.protocols = ['file', 'ftp', 'gopher', 'http', 'https', 'mailto', 'news'];

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
    this.showLinkGeneratorTemplateMenu = false;
    this.showReportFilterMenu = false;
    this.showReportContextMenu = false;

    this.minimizedMemberLists = [];

    this.chatTranslations = {};
    this.translationLanguages = [];
    this.translationLangCodes = [];
    this.translationServiceError = 'No translations fetched';

    this.countryInformation = {};
    this.lastPhoneProtocol = 'callto:';

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
    this.LinkGenerator = null;

    this.chatLeftByOperators = {};
    this.hiddenChats = [];

    this.validationErrorCount = 0;
    this.alertDialogIsVisible = false;
    this.blinkingIconsInterval = false;
    this.blinkingIconsArray = [];
    this.blinkingIconsStatus = 0;
    this.lastBlinkingTime = 0;

    this.memberListWidth = 150;

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


    this.chatPanelLineHeight = 23;
    this.activeChatPanelHeight = this.chatPanelLineHeight;
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

    this.DialogBorderRatioFull = 0.95;
    this.DialogBorderRatioHalf = 0.65;
    this.DialogBorderRatioInput = 0.35;

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

    this.showOfflineOperators = true;
}

ChatDisplayClass.prototype.resetWebApp = function() {
    this.validationErrorCount = 0;
    this.blinkingIconsArray = [];
    this.blinkingIconsStatus = 1;//0;
    this.stopRinging([]);
};

ChatDisplayClass.prototype.switchTypingIndicator = function(isTyping){
    if(isTyping)
    {
        var wasVisible = ($('#chat-typing').css('display') == 'block');
        $('#chat-typing').css({display:'block'});
        $('#chat-typing').html(tid('is_typing').replace(/<!--name-->/g,this.active_chat_realname));
        $('#chat-progress').css({'margin-bottom':($('#chat-typing').outerHeight()+1)+'px'});
        var thisChatProgress = $('#chat-progress');
        setTimeout(function() {thisChatProgress.scrollTop(thisChatProgress[0].scrollHeight);}, 10);
    }
    else
    {
        $('#chat-typing').css({display:'none'});
        $('#chat-progress').css({'margin-bottom':0});
    }
}

ChatDisplayClass.prototype.startBlinkingIcons = function() {
    var that = this;
    if (that.blinkingIconsInterval) {
        clearInterval(that.blinkingIconsInterval);
    }
    /*
    that.blinkingIconsInterval = setInterval(function() {
        that.blinkIcons();
    },5000);*/
};

ChatDisplayClass.prototype.setBlinkingIconsArray = function(blinkingIconsArray) {
    this.blinkingIconsArray = blinkingIconsArray;
    this.blinkIcons();
};

ChatDisplayClass.prototype.blinkIcons = function() {
    this.lastBlinkingTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    var userChat, group, operator, chatIsNew = false, buttonId;
    var messageClass = 'lzm-tabs-message', typingClass = 'lzm-tabs-typing', typingIndicator = false;
    var isMessage = false, isTyping = false;
    var logo = '';
    this.switchTypingIndicator(false);
    for (var i=0; i<this.blinkingIconsArray.length; i++) {
        try {
            isMessage = false;
            isTyping = false;
            userChat = lzm_chatServerEvaluation.userChats.getUserChat(this.blinkingIconsArray[i]);
            chatIsNew = (userChat != null && (userChat.status == 'new' || (typeof userChat.fupr != 'undefined' && (typeof userChat.fuprDone == 'undefined' || userChat.fuprDone != userChat.fupr.id))));
            if (this.blinkingIconsStatus == 1 && (userChat.b_id == '' || userChat.my_chat)) {
                if (userChat.member_status != 2) {
                    if (!chatIsNew) {
                        isTyping = true;
                        typingIndicator = (this.active_chat_reco == userChat.id || this.active_chat_reco == userChat.id + '~' + userChat.b_id);
                    } else {
                        isMessage = true;
                    }
                } else {
                    logo = 'img/lz_hidden.png';
                    isMessage = false;
                }
            } else {
                group = lzm_chatServerEvaluation.groups.getGroup(this.blinkingIconsArray[i]);
                operator = lzm_chatServerEvaluation.operators.getOperator(this.blinkingIconsArray[i]);
                if (this.blinkingIconsArray[i] == 'everyoneintern' || (group != null && typeof group.members == 'undefined')) {
                    logo = '';
                    isMessage = false;
                } else if (group != null && typeof group.members != 'undefined' && group.is_active && (userChat == null || userChat.status != 'left')) {
                    logo = '';
                    isMessage = false;
                } else if (group != null && typeof group.members != 'undefined' && !group.is_active) {
                    logo = '';
                    isMessage = false;
                } else if (operator != null) {
                    logo = operator.status_logo;
                    isMessage = false;
                    // Keep img/lz_away.png and img/lz_busy.png (comment needed for release package creation)
                } else {
                    if (userChat != null && !userChat.group_chat) {
                        if ((userChat.status == 'read' || userChat.status == 'new') && (userChat.b_id == '' || userChat.my_chat)) {
                            if (userChat.member_status != 2) {
                                logo = 'img/lz_online.png?1';
                                isMessage = false;
                            } else {
                                logo = 'img/lz_hidden.png';
                                isMessage = false;
                            }
                        } else {
                            logo = 'img/lz_offline.png';
                            isMessage = false;
                        }
                    }
                    else
                    {

                    }

                }
            }
            buttonId = '#chat-button-' + this.blinkingIconsArray[i].replace(/~/,'_');
            if(logo != '')
                $(buttonId).children('span').css({'background-image': "url('" + logo + "')", 'background-size': '14px 14px'});

            if(isMessage)
                $(buttonId).addClass(messageClass);
            else
                $(buttonId).removeClass(messageClass);

            if(isTyping)
                $(buttonId).addClass(typingClass);
            else
                $(buttonId).removeClass(typingClass);

            this.switchTypingIndicator(typingIndicator);

        } catch(ex) {}
    }
    var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
    for (var key in userChats) {
        try {
            isMessage = false;
            isTyping = false;
            if(userChats.hasOwnProperty(key)) {
                group = lzm_chatServerEvaluation.groups.getGroup(key);
                userChat = lzm_chatServerEvaluation.userChats.getUserChat(key);
                logo = '';
                operator = lzm_chatServerEvaluation.operators.getOperator(key);
                if ($.inArray(key, this.blinkingIconsArray) == -1) {
                    chatIsNew = (userChat['status'] == 'new' ||
                    (typeof userChat.fupr != 'undefined' &&
                    (typeof userChat.fuprDone == 'undefined' ||
                        userChat.fuprDone != userChat.fupr.id)));
                    if (chatIsNew && this.blinkingIconsStatus == 1 && (userChat.b_id == '' || userChat.my_chat)) {
                        if (userChat.member_status != 2) {
                            isMessage = true;
                        } else {
                            logo = 'img/lz_hidden.png';
                            isMessage = false;
                        }
                    } else {
                        if (key == 'everyoneintern' || (group != null && typeof group.members == 'undefined')) {
                            logo = '';
                            isMessage = false;
                        } else if (group != null && typeof group.members != 'undefined' && group.is_active && (userChat == null || userChat.status != 'left')) {
                            logo = '';
                            isMessage = false;
                        } else if (operator != null) {
                            logo = operator.status_logo;
                            isMessage = false;
                        } else {
                            if (typeof userChat != 'undefined' && !userChat.group_chat) {

                                if ((userChat.status == 'read' || userChat.status == 'new') && (userChat.b_id == '' || userChat.my_chat)) {
                                    if (userChat.member_status != 2) {
                                        logo = 'img/lz_online.png?3';
                                        isMessage = false;
                                    } else {
                                        logo = 'img/lz_hidden.png';
                                        isMessage = false;
                                    }
                                } else {
                                    logo = 'img/lz_offline.png?';
                                    isMessage = false;
                                }
                            }
                        }
                    }
                    buttonId = '#chat-button-' + key.replace(/~/,'_');
                    if ($(buttonId).length != 0) {
                        var existingLogo = $(buttonId).children('span').css('background-image').replace(/url\((.*?)\)/, '$1').split('/');
                        existingLogo = 'img/' + existingLogo[existingLogo.length - 1];
                        if (logo != existingLogo && logo != '') {
                            $(buttonId).children('span').css({'background-image': "url('" + logo + "')", 'background-size': '14px 14px'});
                        }

                        if(isMessage)
                            $(buttonId).addClass(messageClass);
                        else
                            $(buttonId).removeClass(messageClass);

                        if(isTyping)
                            $(buttonId).addClass(typingClass);
                        else
                            $(buttonId).removeClass(typingClass);

                        this.switchTypingIndicator(typingIndicator);
                    }
                }
            }
        } catch(ex) {console.log(e);}
    }
    this.blinkingIconsStatus = 1;//1 - this.blinkingIconsStatus;
};

ChatDisplayClass.prototype.createChatWindowLayout = function (recreate, createChatPanel, ratio) {
    createChatPanel = (typeof createChatPanel != 'undefined') ? createChatPanel :  true;
    ratio = (typeof ratio != 'undefined') ? ratio :  this.DialogBorderRatioFull;

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

        if((windowWidth <= 1000 || windowHeight <= 600) && ratio == this.DialogBorderRatioInput)
            ratio = this.DialogBorderRatioHalf;

        this.FullscreenDialogWindowWidth = (windowWidth <= 600 || windowHeight <= 500) ? windowWidth : Math.floor(ratio * windowWidth) - 40;
        this.FullscreenDialogWindowHeight = (windowWidth <= 600 || windowHeight <= 500) ? windowHeight : Math.floor(ratio * windowHeight) - 40;

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

        var thisChatPageCss;
        if (this.isApp && windowHeight < 390) {
            thisChatPageCss = {height: chatPageHeight+'px'};
        }

        // put together the css objects
        var thisChatCss = {width: chatWindowWidth + 'px', height: chatWindowHeight + 'px', padding: '5px 5px 5px 5px',
            position: 'absolute', left: (userControlPanelPosition.left) + 'px',
            top: (chatWindowTop) + 'px'};
        //var dialogWindowBorder = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '2px solid #666' : '0px';
        var dialogWindowBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '6px' : '0px';
        var dialWinIntBorderRadius = (this.dialogWindowWidth < windowWidth && this.dialogWindowHeight < windowHeight) ? '4px' : '0px';
        this.dialogWindowContainerCss = {
            position: 'absolute', left: '0px', bottom: '0px', width: windowWidth+'px', height: windowHeight+'px',
            'background-color': 'rgba(0,0,0,0.75)', 'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.02) 35px, rgba(255,255,255,.02) 70px)', 'z-index': '1001', overflow: 'hidden'
        };
        this.dialogWindowCss = {
            position: 'absolute', left: this.dialogWindowLeft+'px', bottom: this.dialogWindowTop+'px',
            width: this.dialogWindowWidth+'px', height: this.dialogWindowHeight+'px',
            'z-index': '1002'
        };
        this.dialogWindowHeadlineCss = {
            position: 'absolute', left: '0px', top: '0px',
            width: (this.dialogWindowWidth - 5)+'px', height: '20px'};
        this.dialogWindowBodyCss = {
            position: 'absolute', left: '0px', top: '27px',
            width: '100%'/*(this.dialogWindowWidth - 10)+'px'*/, height: (this.dialogWindowHeight - 65)+'px',
            padding: '0', 'text-shadow': 'none',
            'background-color': '#FFFFFF', 'overflow-y': 'auto', 'overflow-x': 'hidden'
        };
        this.dialogWindowFootlineCss = {
            position: 'absolute', left: '0px', top: (this.dialogWindowHeight - 38)+'px', 'border-top': '1px solid #ccc',
            width: (this.dialogWindowWidth - 6)+'px', height: '27px', 'text-align': 'right',
            padding: '10px 6px 0px 0px', 'background-color': '#f5f5f5'
        };

        //var fscrWdBorder = (this.FullscreenDialogWindowWidth < windowWidth) ? '0px solid #666' : '0px';
        var fscrWdBdRadius = (this.FullscreenDialogWindowWidth < windowWidth) ? '6px' : '0px';
        var fscrWdIntBdRadius = (this.FullscreenDialogWindowWidth < windowWidth) ? '4px' : '0px';
        this.FullscreenDialogWindowCss = {
            position: 'absolute', left: this.FullscreenDialogWindowLeft+'px', bottom: this.FullscreenDialogWindowTop+'px',
            width: this.FullscreenDialogWindowWidth+'px', height: this.FullscreenDialogWindowHeight+'px',
            'z-index': '1002'
        };
        this.FullscreenDialogWindowHeadlineCss = {
            position: 'absolute', left: '0px', top: '0px',
            width: (this.FullscreenDialogWindowWidth - 5)+'px', height: '20px'};
        this.FullscreenDialogWindowBodyCss = {
            position: 'absolute', left: '0px', top: '27px',
            width: '100%'/*(this.FullscreenDialogWindowWidth - 10)+'px'*/, height: (this.FullscreenDialogWindowHeight - 65)+'px',
            padding: '0',
            'background-color': '#FFFFFF', 'overflow-y': 'auto', 'overflow-x': 'hidden'
        };
        this.FullscreenDialogWindowFootlineCss = {
            position: 'absolute', left: '0px', top: (this.FullscreenDialogWindowHeight - 38)+'px', 'border-top': '1px solid #ccc',
            width: (this.FullscreenDialogWindowWidth - 6)+'px', height: '27px', 'text-align': 'right',
            padding: '10px 6px 0px 0px', 'background-color': '#f5f5f5'
        };

        //thisBody.css({background: '#e0e0e0'});
        //thisChatPage.css(thisChatPageCss);
        //thisChat.css(thisChatCss);
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

    this.toggleVisibility('resize');
    if (this.selected_view == 'home' && this.startPageExists) {
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
            //$('#chat-container-headline').html('<h3>' + t('Chats') + '</h3>');
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
            var alertString1 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQx'));
            var alertString2 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQy'));
            var alertString3 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQz'));
            var alertString4 = tid(lz_global_base64_decode('b3BlcmF0b3JfbGltaXQ0'));
            alertString = t('<!--limit1--> <!--limit2--> <!--limit3--> <!--limit4-->',[['<!--limit1-->', alertString1], ['<!--limit2-->', alertString2], ['<!--limit3-->', alertString3], ['<!--limit4-->', alertString4]]);
            lzm_commonDialog.createAlertDialog(alertString, [{id: 'ok', name: t('Ok')},{id: 'bx', name: tid(lz_global_base64_decode('YnV5X2xpY2Vuc2U='))}]);
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
            $('#alert-btn-bx').click(function() {
                openLink(lz_global_base64_decode('aHR0cHM6Ly93d3cubGl2ZXppbGxhLm5ldC9zaG9wLw=='));
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
        $('#geotracking-body').html('<iframe id="geotracking-iframe" src=""></iframe>');
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
    var dptLogo = '', onclickAction = '', ondblclickAction = '', oncontextmenuAction = '', lineCounter = 0, i = 0;
    if (lzm_chatServerEvaluation.userChats.getUserChat('everyoneintern') != null &&
        lzm_chatServerEvaluation.userChats.getUserChat('everyoneintern').status == 'new') {

    }
        var internalChatsAreDisabled = (this.myGroups.length > 0);
        for (i=0; i<this.myGroups.length; i++) {
            var myGr = lzm_chatServerEvaluation.groups.getGroup(this.myGroups[i]);
            if (myGr != null && (typeof myGr.internal == 'undefined' || myGr.internal == '1')) {
                internalChatsAreDisabled = false;
            }
        }
    var intUserHtmlString = '<div id="operator-list-headline" class="lzm-dialog-headline"><h3>' + t('Operators') + '</h3></div>' +
        '<div id="operator-list-body"><div><table id="operator-list-table">';
    onclickAction = (this.isApp || this.isMobile) ? ' onclick="openOperatorListContextMenu(event, \'group\', \'everyoneintern\', \'everyoneintern\', \'' + lineCounter + '\');"' :
        ' onclick="selectOperatorLine(\'everyoneintern\', \'' + lineCounter + '\',\'everyoneintern\',\'' + lz_global_base64_url_encode(t('All operators')) + '\', true);"';
    ondblclickAction = (!this.isApp && !this.isMobile && !internalChatsAreDisabled) ? ' ondblclick="chatInternalWith(\'everyoneintern\',\'everyoneintern\',\'' + t('All operators') + '\', true);"' : '';
    oncontextmenuAction = (!this.isApp && !this.isMobile) ? ' oncontextmenu="openOperatorListContextMenu(event, \'group\', \'everyoneintern\', \'everyoneintern\', \'' + lineCounter + '\');"' : '';
    intUserHtmlString += '<tr id="operator-list-line-everyoneintern' + '_' + lineCounter + '" class="operator-list-line" ' +
        /*ondblclickAction + */onclickAction + oncontextmenuAction + '>' +
        '<th class="lzm-unselectable" colspan="2">' +
        '<span class="group-list-icon" style="background-image: url(\'' + dptLogo + '\');"></span>' + t('All operators') +
        '</th></tr>';
    lineCounter++;
    var groups = lzm_chatServerEvaluation.groups.getGroupList('name', false, true);
    var blStyle = '';
    var brStyle = '';
    for (i=0; i<groups.length; i++) {
        var operators = lzm_chatServerEvaluation.operators.getOperatorList('name', groups[i].id, this.showOfflineOperators);
        var showThisGroup = !internalChatsAreDisabled;
        if ($.inArray(groups[i].id, this.myGroups) != -1) {
            showThisGroup = true;
        }
        if (showThisGroup &&
            (operators.length > 0 ||
            (typeof groups[i].o != 'undefined' && groups[i].o == this.myId))) {
            dptLogo = (typeof groups[i].members == 'undefined') ? (groups[i].oh == '1') ? ''/*'img/lz_group.png'*/ : ''/*'img/lz_group_offline.png'*/ : ''/*'img/lz_group_dynamic.png'*/;// img/lz_group_offline.png
            if (lzm_chatServerEvaluation.userChats.getUserChat(groups[i].id) != null &&
                lzm_chatServerEvaluation.userChats.getUserChat(groups[i].id).status == 'new') {

            }
            onclickAction = (this.isApp || this.isMobile) ? ' onclick="openOperatorListContextMenu(event, \'group\', \'' + groups[i].id + '\', \'everyoneintern\', \'' + lineCounter + '\');"' : ' onclick="selectOperatorLine(\'' + groups[i].id + '\', \'' + lineCounter + '\',\'' + groups[i].id + '\',\'' + lz_global_base64_url_encode(groups[i].name) + '\', true);"';
            // ondblclickAction is not used any more because of FF problems, instead workarround using onclickAction and manual dblclick detection
            ondblclickAction = (!this.isApp && !this.isMobile && !internalChatsAreDisabled) ? ' ondblclick="chatInternalWith(\'' + groups[i].id + '\',\'' + groups[i].id + '\',\'' + groups[i].name + '\', true);"' : '';
            oncontextmenuAction = (!this.isApp && !this.isMobile) ? ' oncontextmenu="openOperatorListContextMenu(event, \'group\', \'' + groups[i].id + '\', \'everyoneintern\', \'' + lineCounter + '\');"' : '';
            intUserHtmlString += '<tr id="operator-list-line-' + groups[i].id + '_' + lineCounter + '" class="operator-list-line" ' +
                /*ondblclickAction + */onclickAction + oncontextmenuAction + '>' +
                '<th class="lzm-unselectable" colspan="2">' +
                '<span class="group-list-icon" style="background-image: url(\'' + dptLogo + '\');"></span>' + groups[i].name +
                '</th></tr>';
            lineCounter++;
            if (typeof groups[i].members != 'undefined') {

                var guestCount = 0;
                for (var k=0; k<groups[i].members.length; k++) {
                    if (groups[i].members[k].i.indexOf('~') != -1) {
                        var visitorId = groups[i].members[k].i.split('~')[0], browserId = groups[i].members[k].i.split('~')[1];
                        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(visitorId);
                        if (visitor != null && typeof visitor.b != 'undefined') {

                            guestCount++;
                            continue;
                            /*var visitorName = (visitor.unique_name);
                            var visitorLogo = 'img/lz_offline.png?1';
                            for (var l=0; l<visitor.b.length; l++) {
                                if (visitor.b[l].id == browserId && typeof visitor.b[l].cname != 'undefined' && visitor.b[l].cname != '') {
                                    visitorName = visitor.b[l].cname;
                                }
                                if (visitor.b[l].id == browserId && typeof visitor.b[l].is_active != 'undefined' && visitor.b[l].is_active) {
                                    visitorLogo = 'img/lz_online.png';
                                }
                            }
                            onclickAction = (this.isApp || this.isMobile) ?
                                ' onclick="openOperatorListContextMenu(event, \'visitor\', \'' + visitorId + '~' + browserId + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' :
                                ' onclick="selectOperatorLine(\'' + visitorId + '~' + browserId + '\', \'' + lineCounter + '\', event);"';
                            ondblclickAction = (!this.isApp && !this.isMobile && !internalChatsAreDisabled) ? '' : '';
                            oncontextmenuAction = (!this.isApp && !this.isMobile) ?
                                ' oncontextmenu="openOperatorListContextMenu(event, \'visitor\', \'' + visitorId + '~' + browserId + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' : '';
                            intUserHtmlString += '<tr id="operator-list-line-' + visitorId + '_' + browserId + '_' + lineCounter + '" class="operator-list-line" ' +
                                onclickAction + oncontextmenuAction + '>' +
                                '<td></td>' +
                                '<td class="lzm-unselectable userlist internal-user-' + visitor.id + '">' +
                                '<span class="operator-list-icon" style="background-image: url(\'' + visitorLogo + '\');"></span>' +
                                '' + visitorName + '</td></tr>';
                            lineCounter++;
                            */
                        }

                    }
                }

                if(guestCount>0){

                    var gtitle = guestCount + ' ' +((guestCount==1) ? tid('visitor'): tid('visitors'));
                    intUserHtmlString += '<tr id="operator-list-line-' + groups[i].id + '_ex_' + lineCounter + '" class="operator-list-line" oncontextmenu="return false;">' +
                        '<td></td><td class="lzm-unselectable userlist"><i class="fa fa-users icon-blue"></i>' + gtitle + '</td></tr>';
                }

            }
            for (var j=0; j<operators.length; j++) {
                if (!internalChatsAreDisabled || operators[j].id == this.myId || typeof groups[i].members != 'undefined') {
                    var operatorLogo = operators[j].logo;
                    if (operators[j].status != 2 && $.inArray(groups[i].id, operators[j].groupsAway) != -1) {
                        operatorLogo = 'img/lz_away.png';
                    }
                    var intUserStyle = 'style="' + brStyle + '" ';
                    if (lzm_chatServerEvaluation.userChats.getUserChat(operators[j].id) != null &&
                        lzm_chatServerEvaluation.userChats.getUserChat(operators[j].id).status == 'new') {

                        intUserStyle = 'style="' + brStyle + '" ';
                    }

                    var tmpIntUserStyle;
                    if (operators[j].userid != this.myLoginId &&
                        (typeof operators[j].isbot == 'undefined' || operators[j].isbot != 1)) {
                        onclickAction = (this.isApp || this.isMobile) ?
                            ' onclick="openOperatorListContextMenu(event, \'operator\', \'' + operators[j].id + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' :
                            ' onclick="selectOperatorLine(\'' + operators[j].id + '\', \'' + lineCounter + '\',\'' + operators[j].userid + '\',\'' + lz_global_base64_url_encode(operators[j].name) + '\', true);"';
                        ondblclickAction = (!this.isApp && !this.isMobile && !internalChatsAreDisabled) ?
                            ' ondblclick="chatInternalWith(\'' + operators[j].id + '\',\'' + operators[j].userid + '\',\'' + operators[j].name + '\', true);"' : '';
                        tmpIntUserStyle = intUserStyle.replace(/"$/, '').replace(/" *$/, '');
                        intUserStyle = tmpIntUserStyle + ' cursor: pointer;"';
                    } else {
                        onclickAction = (this.isApp || this.isMobile) ?
                            ' onclick="openOperatorListContextMenu(event, \'operator\', \'' + operators[j].id + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' :
                            ' onclick="selectOperatorLine(\'' + operators[j].id + '\', \'' + lineCounter + '\');"';
                        ondblclickAction = '';
                        tmpIntUserStyle = intUserStyle.replace(/"$/, '').replace(/" *$/, '');
                        intUserStyle = tmpIntUserStyle + ' cursor: default;"';
                    }
                    oncontextmenuAction = (!this.isApp && !this.isMobile) ?
                        ' oncontextmenu="openOperatorListContextMenu(event, \'operator\', \'' + operators[j].id + '\', \'' + groups[i].id + '\', \'' + lineCounter + '\');"' : '';
                    intUserHtmlString += '<tr id="operator-list-line-' + operators[j].id + '_' + lineCounter + '" class="operator-list-line" ' +
                        /*ondblclickAction + */onclickAction + oncontextmenuAction + '>' +
                        '<td></td>' +
                        '<td class="lzm-unselectable userlist internal-user-' + operators[j].id + '" ' + intUserStyle + '>' +
                        '<span class="operator-list-icon" style="background-image: url(\'' + operatorLogo + '\');"></span>';
                    if ((operators[j].mobileAccount && operators[j].status == '2') || (operators[j].clientMobile && operators[j].status != '2')) {
                        intUserHtmlString += '<i class="fa fa-tablet"></i>';
                    }
                    intUserHtmlString += '' + operators[j].name + '</td></tr>';
                    lineCounter++;
                }
            }
        }
    }
    intUserHtmlString += '</table></div></div>';
    $('#operator-list').html(intUserHtmlString);
    lzm_displayLayout.resizeOperatorList();
    }
};

ChatDisplayClass.prototype.createDynamicGroup = function () {
    this.doNotUpdateOpList = true;
    this.newDynGroupHash = md5(String(Math.random())).substr(0, 10);
    var input = '<label>'+tid('group_name')+':</label><input type="text" id="new-dynamic-group-name" data-role="none" class="lzm-text-input" autofocus />';
    lzm_commonDialog.createAlertDialog(input, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
    $('#new-dynamic-group-name').focus();
    $('#alert-btn-cancel').click(function(e) {
        lzm_commonDialog.removeAlertDialog();
    });
    $('#alert-btn-ok').click(function(e) {
        saveNewDynamicGroup();
        lzm_commonDialog.removeAlertDialog();
    });
};

ChatDisplayClass.prototype.addToDynamicGroup = function (id, browserId, chatId) {
    var headerString = t('Add to Dynamic Group');
    var bodyString = lzm_displayHelper.createAddToDynamicGroupHtml(id, browserId);
    var footerString = lzm_displayHelper.createButton('save-dynamic-group', '', '', t('Ok'), '', 'lr',{'margin-left': '4px'},'',30,'d') +
        lzm_displayHelper.createButton('cancel-dynamic-group', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');
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

ChatDisplayClass.prototype.createOperatorListContextMenu = function(myObject) {
    var disabledClass = '', onclickAction = '', contextMenuHtml = '', checkVisibility = '', thisClass = this;
    var browserId = (typeof myObject.browser != 'undefined' && typeof myObject.browser.id != 'undefined') ? myObject.browser.id : '';
    var chatId = (typeof myObject.browser != 'undefined' && typeof myObject.browser.chat != 'undefined') ? myObject.browser.chat.id : '';
    var group = lzm_chatServerEvaluation.groups.getGroup(myObject.groupId);
    var internalChatsAreDisabled = true;
    for (var i=0; i<this.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(this.myGroups[i]);
        if (myGr == null || myGr.internal == '1') {
            internalChatsAreDisabled = false;
        }
    }
    var groupIsDynamic = (group != null && typeof group.i != 'undefined');
    disabledClass = (myObject.type == 'operator' && (myObject['chat-partner'].userid == thisClass.myLoginId ||
        (typeof myObject['chat-partner'].isbot != 'undefined' && myObject['chat-partner'].isbot == 1)) ||
        (myObject.type == 'visitor' && lzm_chatServerEvaluation.userChats.getUserChat(myObject['chat-partner'].id + '~' + myObject.browser.id) == null) ||
        internalChatsAreDisabled) ?
        ' class="ui-disabled"' : '';
    var cpUserId = (myObject.type == 'visitor' || myObject.type == 'group') ? myObject['chat-partner'].id : myObject['chat-partner'].userid;
    onclickAction = (myObject.type == 'visitor') ?
        'viewUserData(\'' + myObject['chat-partner'].id + '\', \'' + myObject.browser.id + '\', \'' + myObject.browser.chat.id + '\', true);' :
        'chatInternalWith(\'' + myObject['chat-partner'].id + '\', \'' + cpUserId + '\', \'' + myObject['chat-partner'].name + '\');';
    contextMenuHtml += '<div' + disabledClass + ' onclick="' + onclickAction + 'removeOperatorListContextMenu();">' +
        '<span id="chat-with-this-partner" class="cm-line cm-click">' +
        t('Start Chat') + '</span></div><hr />';
    disabledClass = (myObject.type != 'operator' || myObject['chat-partner'].userid == thisClass.myLoginId ||
        (typeof myObject['chat-partner'].isbot != 'undefined' && myObject['chat-partner'].isbot == 1) || myObject['chat-partner'].status == 2) ?
        ' class="ui-disabled"' : '';
    onclickAction = 'signOffOperator(\'' + myObject['chat-partner'].id + '\');';
    contextMenuHtml += '<div' + disabledClass + '>' +
        '<span id="sign-off-this-operator" class="cm-line cm-click" onclick="' + onclickAction + 'removeOperatorListContextMenu();">' +
        t('Sign off...') + '</span></div>';
    onclickAction = 'hideOfflineOperators();';
    var showHideText = (thisClass.showOfflineOperators) ? t('Hide offline Operators') : t('Show offline Operators');
    contextMenuHtml += '<div onclick="' + onclickAction + 'removeOperatorListContextMenu();">' +
        '<span id="hide-offline-operators" class="cm-line cm-click">' +
        showHideText + '</span></div>';
    disabledClass = (myObject['chat-partner'].id != thisClass.myId) ? ' class="ui-disabled"' : '';
    onclickAction = 'toggleIndividualGroupStatus(\'' + myObject.groupId + '\', \'remove\');';
    checkVisibility = (myObject.type == 'operator' && $.inArray(myObject.groupId, myObject['chat-partner'].groupsAway) == -1) ? 'visible' : 'hidden';
    contextMenuHtml += '<div' + disabledClass + '>' +
        '<span id="change-operator-group-status" class="cm-line cm-click" onclick="' + onclickAction + '">' +
        t('Status: Default') + ' <span style="visibility: ' + checkVisibility + '">&#10003;</span></span></div>';
    onclickAction = 'toggleIndividualGroupStatus(\'' + myObject.groupId + '\', \'add\');';
    checkVisibility = (myObject.type == 'operator' && $.inArray(myObject.groupId, myObject['chat-partner'].groupsAway) != -1) ? 'visible' : 'hidden';
    contextMenuHtml += '<div' + disabledClass + '>' +
        '<span id="change-operator-group-status" class="cm-line cm-click" onclick="' + onclickAction + '">' +
        t('Status: Away') + ' <span style="visibility: ' + checkVisibility + '">&#10003;</span></span></div><hr />';
    disabledClass = (internalChatsAreDisabled) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + '>' +
        '<span id="create-dynamic-group" class="cm-line cm-click" onclick="createDynamicGroup(); removeOperatorListContextMenu();">' +
        t('Create Dynamic Group') + '</span></div>';
    disabledClass = (myObject.type != 'operator' || internalChatsAreDisabled) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + '>' +
        '<span id="add-to-dynamic-group" class="cm-line cm-click" onclick="addToDynamicGroup(\'' + myObject['chat-partner'].id +
        '\', \'' + browserId + '\', \'' + chatId + '\'); removeOperatorListContextMenu();">' +
        t('Add to Dynamic Group') + '</span></div>';
    disabledClass = ((myObject.type != 'operator' && myObject.type != 'visitor') || !groupIsDynamic || internalChatsAreDisabled) ? ' class="ui-disabled"' : '';
    var cpId = (myObject.type != 'visitor') ? myObject['chat-partner'].id : myObject['chat-partner'].id + '~' + myObject['browser'].id;
    contextMenuHtml += '<div' + disabledClass + ' onclick="removeFromDynamicGroup(\'' + cpId +'\', \'' + myObject.groupId + '\'); removeOperatorListContextMenu();">' +
        '<span id="remove-from-dynamic-group" class="cm-line cm-click">' +
        t('Remove from Dynamic Group') + '</span></div>';

    disabledClass = (myObject.type != 'group' || typeof myObject['chat-partner'].i == 'undefined' || internalChatsAreDisabled) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="deleteDynamicGroup(\'' + myObject['chat-partner'].id + '\'); removeOperatorListContextMenu();">' +
        '<span id="delete-dynamic-group" class="cm-line cm-click">' + t('Delete Dynamic Group') + '</span></div>';

    disabledClass = (myObject.type != 'group' || typeof myObject['chat-partner'].i == 'undefined' || internalChatsAreDisabled) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="getDynamicGroupURL(\'' + myObject['chat-partner'].id + '\'); removeOperatorListContextMenu();">' +
        '<span id="delete-dynamic-group" class="cm-line cm-click">' + tid('get_group_url') + '</span></div>';

    return contextMenuHtml;
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
        var activeCounter = 0, thisActiveChatPanelWidth = thisActiveChatPanel.width();
        var defaultCss = ' height: 22px; position: absolute; padding: 0px 8px 0px 24px; text-align: center; font-size: 12px; overflow: hidden; cursor: pointer; vertical-align: middle;';
        var closeButton = '<div id="close-active-chat" onclick="leaveChat();" style="display: none;"><i class="fa fa-remove"></i></div>';
        var activityHtml = closeButton;
        var newIncomingChats = [];

        this.chatActivity = false;
        var thisDivLeft = [2];
        var thisLine = 0;
        var userChats = lzm_chatServerEvaluation.userChats.getUserChatList();
        var cpIsActive = false, cpDoesExist = false;

        var thisButtonCss = defaultCss;
        var buttonCSSClass = '';
        if (this.active_chat_reco == '' || this.active_chat_reco == 'LIST')
            buttonCSSClass = 'lzm-tabs lzm-tabs-selected';
        else
            buttonCSSClass = 'lzm-tabs';

        var ctxtMenu = (!thisClass.isApp && !thisClass.isMobile) ? ' oncontextmenu="preventDefaultContextMenu(event);"' : '';
        var thisButtonHtml = '<div onclick="showAllchatsList(true);"' + ctxtMenu +
            ' class="' + buttonCSSClass + ' lzm-unselectable" id="show-allchats-list" style=\'left: 0px; top: 1px;' + thisButtonCss + ' display: table-cell; line-height: 22px;' +
            ' background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
            '<span style=\'line-height: 22px; padding-left: 4px; padding-top: 4px; padding-bottom: 4px;\'>' + t('All Chats') + '</span></div>';
        var testLengthDiv = $('#test-length-div');
        testLengthDiv.html(thisButtonHtml.replace(/show-allchats-list/, 'test-show-allchats-list')).trigger('create');
        var thisButtonLength = $('#test-show-allchats-list').width() + 9;
        thisDivLeft[thisLine] += thisButtonLength;
        activityHtml += thisButtonHtml;
        testLengthDiv.html('').trigger('create');

        for (var cp in userChats) {
            try {
                if (userChats.hasOwnProperty(cp)) {
                    var thisUserChat = userChats[cp];

                    if(!this.isVisibleChat(thisUserChat))
                        continue;

                    if (thisUserChat.id != '' && thisUserChat.type == 'external' && thisUserChat.status == 'new' && $.inArray(cp, this.openChats) == -1 && thisUserChat.my_chat) {
                        newIncomingChats.push(cp);
                    }
                    if (thisUserChat.id != '' && ((thisUserChat.status != 'left' && thisUserChat.status != 'declined') || $.inArray(cp, this.closedChats) == -1) &&
                        (thisUserChat.my_chat || thisUserChat.my_chat_old || cp.indexOf('~') == -1)) {
                        var group = lzm_chatServerEvaluation.groups.getGroup(cp);
                        var operator = lzm_chatServerEvaluation.operators.getOperator(cp);
                        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(cp.split('~')[0]);
                        if (thisUserChat.type == 'external') {
                            onclickCommand = 'viewUserData(\'' + thisUserChat.id + '\', \'' + thisUserChat.b_id + '\', \'' + thisUserChat.chat_id + '\', true);';
                            onclickAction = ' onclick="' + onclickCommand + '"';
                            oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ? ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + thisUserChat.id + '~' + thisUserChat.b_id + '\', \'panel\', event);"' : '';
                            buttonId = ' id="chat-button-' + thisUserChat.id + '_' + thisUserChat.b_id + '"';
                            cpIsActive = visitor.is_active;
                            cpDoesExist = true;
                        } else {
                            if (operator != null) {
                                onclickCommand = 'chatInternalWith(\'' + operator.id + '\', \'' + operator.userid + '\', \'' +
                                    operator.name + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ? ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + operator.id + '\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + operator.id + '"';
                                cpIsActive = operator.is_active;
                                cpDoesExist = true;
                            }
                            if (group != null) {
                                onclickCommand = 'chatInternalWith(\'' + group.id + '\', \'' + group.id + '\', \'' +
                                    group.name + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ? ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'' + group.id + '\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + group.id + '"';
                                cpIsActive = group.is_active;
                                cpDoesExist = true;
                            }
                            if (cp == 'everyoneintern') {
                                onclickCommand = 'chatInternalWith(\'' + 'everyoneintern' + '\', \'' + 'everyoneintern' + '\', \'' + t('All operators') + '\');';
                                onclickAction = ' onclick="' + onclickCommand + '"';
                                oncontextmenuAction = (!thisClass.isApp && !thisClass.isMobile) ? ' oncontextmenu="' + onclickCommand + 'showVisitorChatActionContextMenu(\'everyoneintern\', \'panel\', event);"' : '';
                                buttonId = ' id="chat-button-' + 'everyoneintern' + '"';
                                cpIsActive = true;
                                cpDoesExist = true;
                            }
                        }


                        var iconClass = 'lzm-tab-icon-content';
                        var buttonLogo = 'img/lz_offline.png?2';
                        if (cp == 'everyoneintern' || (group != null && typeof group.members == 'undefined' && group.is_active)) {
                            buttonLogo = '';
                            //this.myChatsCounter++;
                            iconClass='lzm-tab-content';
                        } else if (group != null && typeof group.members != 'undefined' && group.is_active) {
                            buttonLogo = '';
                            //this.myChatsCounter++;
                            iconClass='lzm-tab-content';
                        } else if (operator != null) {
                            buttonLogo = operator.status_logo;
                            //this.myChatsCounter++;
                        } else if (visitor != null &&
                            visitor.is_active &&
                            thisUserChat['status'] != 'left' &&
                            thisUserChat['status'] != 'declined' &&
                            thisUserChat['my_chat']) {
                            if (thisUserChat.member_status != 2) {
                                buttonLogo = 'img/lz_online.png';
                            } else {
                                buttonLogo = 'img/lz_hidden.png';
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


                        thisButtonCss = defaultCss;
                        if (cp == this.active_chat_reco) {
                            buttonCSSClass = 'lzm-tabs lzm-tabs-selected';
                            bgGradientColor = 'darkViewSelect';
                        } else {
                            buttonCSSClass = 'lzm-tabs';
                            bgGradientColor = '';
                        }


                        if (cpDoesExist/* && (lzm_chatPollServer.user_status == 0 ||  thisUserChat.status != 'left' || typeof thisUserChat.accepted != 'undefined')*/) {
                            var thisDivTop = 1 + thisLine * this.chatPanelLineHeight;
                            var displayCpName = (thisUserChat.chat_name.length > 18) ? thisUserChat.chat_name.substring(0, 15) + '...' : thisUserChat.chat_name;
                            displayCpName = lzm_commonTools.escapeHtml(displayCpName, true).replace(/ /g, '&nbsp;');
                            thisButtonHtml = '<div' + onclickAction + oncontextmenuAction + buttonId + ' class="'+buttonCSSClass+' lzm-unselectable" style=\'left:' + thisDivLeft[thisLine]+'px; top: ' + thisDivTop+'px;' + thisButtonCss + ' display: table-cell; line-height: 22px; background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
                                '<span class="'+iconClass+'" style=\'background-image: url("' + buttonLogo + '");\'>' + displayCpName + '</span></div>';
                            testLengthDiv = $('#test-length-div');
                            var testButtonId = buttonId.replace(/ id="(.*?)"/, 'test-$1');
                            testLengthDiv.html(thisButtonHtml.replace(/chat-button-/, 'test-chat-button-')).trigger('create');
                            thisButtonLength = $('#' + testButtonId).width() + 11;
                            var thisLineRight = (thisLine == 0) ? 26 : 2;
                            if ((thisDivLeft[thisLine] + thisButtonLength) >= (thisActiveChatPanelWidth - thisLineRight)) {
                                thisLine++;
                                thisDivTop = 1 + thisLine * this.chatPanelLineHeight;
                                thisDivLeft.push(0);
                                thisButtonHtml = '<div' + onclickAction + oncontextmenuAction + buttonId + ' class="'+buttonCSSClass+' lzm-unselectable" style=\'left:' + thisDivLeft[thisLine] + 'px;' +
                                    ' top: ' + thisDivTop+'px;' + thisButtonCss + ' display: table-cell; line-height: 22px; background-position: left; background-repeat: no-repeat; padding-left: 2px;\'>' +
                                    '<span class="'+iconClass+'" style=\'background-image: url("' + buttonLogo + '");\'>' + displayCpName + '</span></div>';
                            }
                            activeCounter++;
                            thisDivLeft[thisLine] += thisButtonLength;
                            activityHtml += thisButtonHtml;
                            this.activeChatPanelHeight = this.chatPanelLineHeight * (thisLine + 1);
                            testLengthDiv.html('').trigger('create');
                        }
                    }
                }
            } catch(e) {console.log(e)}
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
            $('#close-active-chat').css({height: ((thisLine+1)*this.chatPanelLineHeight)+'px'});
            $('#close-active-chat i.fa').css({'line-height': ((thisLine+1)*this.chatPanelLineHeight)+'px'});
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
    this.blinkIcons();
};

ChatDisplayClass.prototype.validateActiveChat = function (id,showNext){
    if(!this.isVisibleChat(lzm_chatServerEvaluation.userChats.getUserChat(id))){
        if(showNext){

                showNextChat();

        }
        return false;
    }
    return true;
}

ChatDisplayClass.prototype.isVisibleChat = function (chat){
    if(chat == null){
        return false;
    }
    var visitorChat = lzm_chatServerEvaluation.visitors.getChatBrowser(chat.id,chat.b_id);

    if(lzm_chatServerEvaluation.userChats.isInPublicGroupChat(chat)){
        if(typeof visitorChat.chat.dgr[0] != 'undefined')
            lzm_chatServerEvaluation.userChats.setUserChat(visitorChat.chat.dgr[0], {});
        return false;
    }

    if(visitorChat != null && typeof visitorChat.chat.dgc != 'undefined' && visitorChat.chat.dgc != ''){
        return false;
    }
    return true;
}

ChatDisplayClass.prototype.createChatHtml = function (thisUser, active_chat_reco) {

    if(!this.validateActiveChat(active_chat_reco,true))
        return false;

    var myCurrentChat = lzm_chatServerEvaluation.userChats.getUserChat(active_chat_reco);
    var chatHtmlString = '';
    var messageText = '';
    var previousMessageSender = '';
    var previousMessageRepost = 1;
    var previousAddMessageStyle = 1;
    var previousMessageTimestamp = 0;
    var avatar = '', addClass = '', aspace = '';
    var tmpDate = lzm_chatTimeStamp.getLocalTimeObject();
    var currentDateObject = {
        day:this.lzm_commonTools.pad(tmpDate.getDate(), 2),
        month:this.lzm_commonTools.pad((tmpDate.getMonth() + 1), 2),
        year:this.lzm_commonTools.pad(tmpDate.getFullYear() ,4)
    };
    if (myCurrentChat != null) {
        myCurrentChat.messages = (typeof myCurrentChat.messages != 'undefined') ? myCurrentChat.messages : [];
        for (var i=0; i<myCurrentChat.messages.length; i++) {
            addClass = ''
            myCurrentChat.messages[i].text = (typeof myCurrentChat.messages[i].text != 'undefined') ?
                lzm_commonTools.replaceLinksInChatView(myCurrentChat.messages[i].text) : '';
            var messageTime = myCurrentChat.messages[i].time_human;
            if (typeof myCurrentChat.messages[i].dateObject != 'undefined' &&
                (myCurrentChat.messages[i].dateObject.year != currentDateObject.year ||
                    myCurrentChat.messages[i].dateObject.month != currentDateObject.month ||
                    myCurrentChat.messages[i].dateObject.day != currentDateObject.day)) {
                messageTime = myCurrentChat.messages[i].date_human + '&nbsp;' + myCurrentChat.messages[i].time_human;
            }
            var chatText = '<span>' + lzm_displayHelper.replaceSmileys(myCurrentChat.messages[i].text) + '</span>';
            if (typeof myCurrentChat.messages[i].tr != 'undefined' && myCurrentChat.messages[i].tr != '') {
                chatText = '<span>' + lzm_displayHelper.replaceSmileys(myCurrentChat.messages[i].tr) + '</span><br />' +
                    '<span class="lz_message_translation">' + lzm_displayHelper.replaceSmileys(myCurrentChat.messages[i].text) + '</span>';
            }
            if (typeof myCurrentChat.messages[i].info_header != 'undefined') {
                var myMailAddress = (myCurrentChat.messages[i].info_header.mail != '') ? this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.mail) : '';
                var targetGroup = lzm_chatServerEvaluation.groups.getGroup(myCurrentChat.messages[i].info_header.group);
                var phoneNumber = (myCurrentChat.messages[i].info_header.phone != '') ?
                    '<span style="color: #5197ff; cursor: pointer; text-decoration: underline;"' +
                        ' onclick="showPhoneCallDialog(\'' + active_chat_reco + '\', -1, \'chat\');">' +
                        this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.phone) + '</span>' : '';

                chatHtmlString = chatHtmlString.replace('header_class_placeholder','TCBOLD');

                var groupName = (targetGroup != null) ? targetGroup.name : myCurrentChat.messages[i].info_header.group;

                var addRow = '<tr><td class="TCBHF"><!--label-->:</td><td class="last"><!--value--></td></tr>';
                var addWrapRow = '<tr><td class="TCBHF"><!--label-->:</td><td class="last" style="white-space: normal;"><!--value--></td></tr>';

                messageText = this.messageTemplates['system'].replace(/<!--message-->/g,'<span>'+tid('new_chat_request')+'</span>');
                messageText += '<div class="TCBB"><table class="TCB header_class_placeholder"><tr><td class="TCBG" rowspan="100"></td><td class="TCBHF"><!--group_label-->:&nbsp;&nbsp;</td><td class="last" style="white-space: normal;"><b><!--group_name--></b><!--receivers--></td></tr>';
                messageText = messageText.replace(/<!--group_label-->/g,tid('group'));
                messageText = messageText.replace(/<!--group_name-->/g,groupName);
                messageText = messageText.replace(/<!--receivers-->/g,(myCurrentChat.messages[i].info_header.operators.length > 0) ? ' (' + myCurrentChat.messages[i].info_header.operators + ')' : '');

                if(myCurrentChat.messages[i].info_header.name.length > 0)
                    messageText += addRow.replace('<!--label-->',t('Name')).replace('<!--value-->',this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.name));

                if(myMailAddress.length > 0)
                    messageText += addRow.replace('<!--label-->',t('Email')).replace('<!--value-->',myMailAddress).replace(/lz_chat_mail/, 'lz_chat_mail_no_icon');

                if(myCurrentChat.messages[i].info_header.company.length > 0)
                    messageText += addRow.replace('<!--label-->',t('Company')).replace('<!--value-->',this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.company));

                if(phoneNumber.length > 0)
                    messageText += addRow.replace('<!--label-->',t('Phone')).replace('<!--value-->',phoneNumber);

                if(myCurrentChat.messages[i].info_header.question.length > 0)
                    messageText += addWrapRow.replace('<!--label-->',t('Question')).replace('<!--value-->',this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.question));

                messageText += addRow.replace('<!--label-->',t('Chat ID')).replace('<!--value-->',this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.chat_id));

                if(lz_global_trim(myCurrentChat.messages[i].info_header.area_code).length > 0)
                    messageText += addRow.replace('<!--label-->',t('Area(s)')).replace('<!--value-->',this.lzm_commonTools.htmlEntities(myCurrentChat.messages[i].info_header.area_code));

                if(myCurrentChat.messages[i].info_header.url.length > 0)
                    messageText += '<tr><td class="TCBHF">'+t('Url')+'</td><td><a class="lz_chat_link_no_icon" href="#" data-url="'+myCurrentChat.messages[i].info_header.url+'" onclick="openLink(\''+myCurrentChat.messages[i].info_header.url+'\');">'+myCurrentChat.messages[i].info_header.url+'</a></td></tr>';

                messageText += myCurrentChat.messages[i].info_header.cf;


                if(thisUser.b_chat != null && thisUser.b_chat.hc != null && thisUser.b_chat.hc.indexOf(';')!==-1 && thisUser.b_chat.hc != '0;0'){

                    var history = '', space = '';
                    var parts = thisUser.b_chat.hc.split(';');
                    if(parts[0]>0)
                        history+= lzm_displayHelper.createButton(thisUser.id+'hisc_btn', '', 'showVisitorInfo(\''+thisUser.id+'\',\'\',\'\',5);', tid('chats_number').replace('<!--number_of_chats-->',parts[0]), '', 'lr', {'margin-right':'4px'}, '', '');
                    if(parts[1]>0)
                        history+= lzm_displayHelper.createButton(thisUser.id+'hist_btn', '', 'showVisitorInfo(\''+thisUser.id+'\',\'\',\'\',6);', tid('tickets_number').replace('<!--number_of_tickets-->',parts[1]), '', 'lr', {}, '', '');

                    messageText += addRow.replace('<!--label-->',tid('history')).replace('<!--value-->','<div style="padding:4px 0;">' + history + '</div>');
                }


                chatHtmlString += messageText + '</table></div>';
                previousMessageSender = '';
                previousMessageRepost = 1;
                previousAddMessageStyle = 1;
            } else {

                if (myCurrentChat.messages[i].rp == 1)
                    addClass = ' RCMT';
                else if (myCurrentChat.messages[i].sen == this.myId)
                    addClass = ' OCMT';
                else
                {
                    var xoperator = lzm_chatServerEvaluation.operators.getOperator(myCurrentChat.messages[i].sen);
                    if(xoperator != null)
                        addClass = ' OOCMT';
                }


                if (previousMessageSender != myCurrentChat.messages[i].sen || previousMessageRepost != myCurrentChat.messages[i].rp || parseInt(myCurrentChat.messages[i].date) - previousMessageTimestamp > 300) {
                    if (myCurrentChat.messages[i].rp == 1) {
                        messageText = this.messageTemplates['repost'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                    } else {

                        if (myCurrentChat.messages[i].sen == this.myId) {
                            messageText = this.messageTemplates['internal'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                        }
                        else if (myCurrentChat.messages[i].sen == '0000000') {
                            messageText = this.messageTemplates['system'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                        } else {
                            messageText = this.messageTemplates['external'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                        }
                    }
                    previousAddMessageStyle = 1;
                } else {


                    if (myCurrentChat.messages[i].sen == '0000000') {
                        messageText = this.messageTemplates['systemadd'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                    }
                    else if (previousAddMessageStyle == 0) {
                        messageText = this.messageTemplates['add'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                    } else {
                        messageText = this.messageTemplates['addalt'].replace(/<!--name-->/g,lzm_commonTools.escapeHtml(myCurrentChat.messages[i].sender_name, true));
                    }
                    previousAddMessageStyle = 1 - previousAddMessageStyle;
                }

                if(lzm_commonStorage.loadValue('show_avatars_' + lzm_chatServerEvaluation.myId,1)!=0){
                    aspace = ' style="width:56px;"';
                    avatar = '<div style="background-image: url(./../picture.php?intid='+lz_global_base64_url_encode(myCurrentChat.messages[i].sen)+');"></div>';
                }

                messageText = messageText.replace(/<!--avatar-->/g, avatar);
                messageText = messageText.replace(/<!--aspace-->/g, aspace);
                messageText = messageText.replace(/<!--t-->/g, addClass);
                messageText = messageText.replace(/<!--time-->/g, messageTime);
                messageText = messageText.replace(/<!--message-->/g, chatText);
                messageText = messageText.replace(/<!--dir-->/g, 'ltr');
                chatHtmlString += messageText;
                previousMessageSender = myCurrentChat.messages[i].sen;
                previousMessageRepost = (myCurrentChat.messages[i].rp == 1) ? 1 : 0;
            }
            previousMessageTimestamp = parseInt(myCurrentChat.messages[i].date);
        }

        this.updateChatMembers();
    }
    else if (active_chat_reco != 'LIST' && this.selected_view == 'mychats') {
        this.lastActiveChat = '';
        openLastActiveChat();
    }
    else {
        showAllchatsList();
    }

    if(myCurrentChat == null || (myCurrentChat != null && (myCurrentChat.status == 'left' || (myCurrentChat.status == 'new' && !myCurrentChat.my_chat))))
        chatHtmlString = chatHtmlString.replace('header_class_placeholder','TCBOLD');

    var thisChatProgress = $('#chat-progress');
    chatHtmlString = chatHtmlString.replace(/lz_chat_link/g, 'lz_chat_link_no_icon').replace(/lz_chat_mail/g, 'lz_chat_mail_no_icon').replace(/_no_icon_no_icon/g, '_no_icon');
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

ChatDisplayClass.prototype.getUserObjectFromChat = function (chat) {
    var group = lzm_chatServerEvaluation.groups.getGroup(chat.id);
    if(group != null)
        return group;
    var operator = lzm_chatServerEvaluation.operators.getOperator(chat.id);
    if(operator != null)
        return operator;


    if(typeof chat.b_id != 'undefined'){
        var browser = lzm_chatServerEvaluation.visitors.getChatBrowser(chat.id,chat.b_id);
        return browser;
    }

    var visitor = lzm_chatServerEvaluation.visitors.getVisitor(chat.id);
    if(visitor != null)
        return visitor;
    return null;
}

ChatDisplayClass.prototype.createHtmlContent = function (thisUser, active_chat_reco, type) {
    type = (typeof type != 'undefined') ? type : '';


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

    if (this.startPageExists) {
        this.startpageDisplay.createStartPage(false, [], []);
    }
    this.createGeoTracking();
    if (this.selected_view == 'reports') {
        this.reportsDisplay.createReportList();
    }
    this.allchatsDisplay.updateAllChats();
};

ChatDisplayClass.prototype.updateChatMembers = function(){
    try{

        var hideMembers = true;
        if(this.active_chat_reco != 'LIST' && this.active_chat_reco != '')
        {
            var userChat = lzm_chatServerEvaluation.userChats.getUserChat(this.active_chat_reco);
            var obj = lzm_chatDisplay.getUserObjectFromChat(userChat);
            var ev_click = '',ev_cm = '', dblc = '', objid = this.active_chat_reco, memberList = [], addedList = [], operator = null, visitor = null, visitorChatBrowser = null, visitorChat = null;
            var chatIsOnline = true, displayMinimized = false;


            if($('#chat-container').width()<500 && $.inArray(objid+"AUTOMIN",this.minimizedMemberLists)==-1){
                this.minimizedMemberLists.push(objid+"AUTOMIN");
                this.minimizedMemberLists.push(objid);
            }

            if($.inArray(objid,this.minimizedMemberLists)>-1){
                displayMinimized = true;
            }


            this.memberListWidth = (displayMinimized) ? 0 : 150;

            try
            {
                if($('#chat-container').width()>260){


                    if(obj != null && typeof obj.members != 'undefined' && this.active_chat_reco == obj.id){
                        memberList = obj.members;
                    }

                    else if(obj != null && typeof obj.chat != 'undefined' && typeof obj.chat.pn != 'undefined'){

                        chatIsOnline = userChat != null && userChat.member_status != 2 && userChat.status != 'left';

                        var isExtMember = false;
                        for(var k = 0;k<obj.chat.pn.member.length;k++){
                            if($.inArray(obj.chat.pn.member[k].id,addedList) == -1 && obj.chat.pn.member[k].st != 2){
                                addedList.push(obj.chat.pn.member[k].id);
                                memberList.push(obj.chat.pn.member[k]);
                                if(obj.chat.pn.member[k].id == objid)
                                    isExtMember = true;
                            }
                        }
                        if(!isExtMember)
                            memberList.push({id:objid});

                    }
                }
            }
            catch(e)
            {
                console.log(e);

            }

            if(memberList.length > 1 && chatIsOnline){
                hideMembers = false;
                $('#chat-members').css('display','block');
                $('#chat-progress').css({right: this.memberListWidth + 'px'});
                $('#chat-typing').css({right: this.memberListWidth + 'px'});
                var membersHtml = '', operatorsHTML = '';
                var nameWidth = ' style="width:' + (this.memberListWidth) + 'px;"';
                var addedMembers = [];
                for(var i = 0;i<memberList.length;i++){

                    var membId = (typeof memberList[i].i != 'undefined') ? memberList[i].i : memberList[i].id;
                    var hasDeclined = (typeof memberList[i].dec != 'undefined' && memberList[i].dec==1);

                    if($.inArray(membId,addedMembers)===-1){
                        addedMembers.push(membId);
                        operator = lzm_chatServerEvaluation.operators.getOperator(membId);

                        visitor = lzm_chatServerEvaluation.visitors.getVisitor(membId.split('~')[0]);
                        visitorChatBrowser = lzm_chatServerEvaluation.visitors.getChatBrowser(membId.split('~')[0],membId.split('~')[1]);
                        visitorChat = lzm_chatServerEvaluation.userChats.getUserChat(membId);

                        if(operator != null){
                            dblc = ' ondblclick="addressChatMember(\''+objid+'\',\''+lz_global_base64_encode(operator.name)+'\');"';
                            ev_cm = (operator.id != lzm_chatServerEvaluation.myId) ? 'openChatMemberContextMenu(event,this.id,\''+obj.id+'\',\''+operator.id+'\',\'\',\'\');' : 'selectChatMemberLine(this.id,\''+obj.id+'\');return false;';
                            ev_click = (lzm_chatDisplay.isApp) ? ev_cm : 'selectChatMemberLine(this.id,\''+obj.id+'\');';
                            var icon = (hasDeclined) ? '<i class="fa fa-times icon-member-status icon-orange"></i>' : '<span class="operator-list-icon" style="background-image: url(\'' + this.lzm_commonConfig.lz_user_states[operator.status].icon + '\');"></span>';
                            operatorsHTML += '<div '+nameWidth+' id="'+(obj.id+'-'+i)+'" class="lzm-unselectable chat-member-div '+obj.id+'" onclick="'+ev_click+'" oncontextmenu="'+ev_cm+'"'+dblc+'>'+icon+operator.name+'</div>';
                        }
                        else if(visitorChatBrowser != null && visitorChat != null && visitorChat.status != 'left'){
                            var active_chat_realname = lzm_commonTools.htmlEntities(lzm_chatServerEvaluation.visitors.getVisitorName(visitor));
                            dblc = ' ondblclick="addressChatMember(\''+objid+'\',\''+lz_global_base64_encode(active_chat_realname)+'\');"';
                            ev_cm = 'openChatMemberContextMenu(event,this.id,\''+obj.id+'\',\''+membId.split('~')[0]+'\',\''+membId.split('~')[1]+'\',\''+visitorChatBrowser.chat.id+'\');';
                            ev_click = (lzm_chatDisplay.isApp) ? ev_cm : 'selectChatMemberLine(this.id,\''+obj.id+'\');';
                            membersHtml += '<div '+nameWidth+' id="'+(obj.id+'-'+i)+'" class="lzm-unselectable chat-member-div '+obj.id+'" onclick="'+ev_click+'" oncontextmenu="'+ev_cm+'"'+dblc+'><span class="user-list-icon"><i class="fa fa-user icon-light"></i></span>'+active_chat_realname+'</div>';
                        }
                    }
                }

                if(operatorsHTML != '')
                    operatorsHTML = '<fieldset class="lzm-fieldset"><legend>'+t('Operators')+'</legend>' + operatorsHTML + '</fieldset>';

                if(membersHtml != '')
                    membersHtml = '<fieldset class="lzm-fieldset"><legend>'+t('Visitors')+'</legend>' + membersHtml + '</fieldset>';

                $('#chat-members-list').html(operatorsHTML + membersHtml)
                $('#chat-members-list').css({display:(displayMinimized) ? 'none' : 'block'});
                $('#chat-members').css({height:(displayMinimized) ? '25px' : '', top: (displayMinimized) ? '' : '0', width: (displayMinimized) ? '19px' : '150px', bottom: (displayMinimized) ? '90px' : '80px'});
                $('#chat-members-minimize i').attr('class',(displayMinimized) ? 'fa fa-chevron-left' : 'fa fa-chevron-right');
                $('#chat-members-minimize').css({bottom:(displayMinimized) ? '0' : '10px'});
                $('#chat-members-minimize').css({display:'block'});
                lzm_displayLayout.resizeChatView();
            }
            else
                hideMembers = true;
        }


        if(hideMembers)
        {
            $('#chat-members-minimize').css({display:'none'});
            $('#chat-members').css({display:'none'});
            $('#chat-progress').css({right: 0});
            $('#chat-typing').css({right: 0});
        }

        $('#chat-members-minimize i').attr('class',(displayMinimized) ? 'fa fa-chevron-left' : 'fa fa-chevron-right');

    }
    catch(e){console.log(e);}
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
    var footerString = lzm_displayHelper.createButton('fwd-button', 'ui-disabled', '', t('Ok'), '', 'lr', {'margin-left': '4px'},'',30,'d') +
        lzm_displayHelper.createButton('cancel-operator-forward-selection', '', '', t('Cancel'), '', 'lr', {'margin-left': '4px'},'',30,'d');
    var bodyString = '<fieldset class="lzm-fieldset" id="fwd-container" data-role="none">' +
        '<legend>' + headerString + '</legend>' +
        '<div id="selection-div">' +
        '<label for="fwdGroupSelect">'+t('Group')+'</label>' +
        '<select id="fwdGroupSelect" data-role="none" data-selected-group="">' +
        '<option value="">' + t('--- Choose a group ---') + '</option>';
    for (i=0; i<groups.length; i++) {
        if (typeof groups[i].id != 'undefined') {
            bodyString += '<option value="' +groups[i].id + '">' +
                groups[i].name + '</option>';
        }
    }
    bodyString += '</select><br />' +
        '<div id="fwdOperatorSelectDiv" class="top-space">' +
        '<label for="fwdOperatorSelect">'+tid('operator')+'</label>' +
        '<select id="fwdOperatorSelect" data-role="none" data-group-chosen="false" data-selected-operator="" data-operator-available="false"' +
        ' class="ui-disabled">' +
        '<option value="">' + t('--- No group chosen ---') + '</option></select></div></div>';
    bodyString += '<div id="operator-text-div" class="top-space">' +
        '<label for="forward-text">' + t('Additional information for the receiver:') + '</label>' +
        '<textarea id="forward-text" placeholder="' + t('Send this text to the other operator.') + '" data-role="none"></textarea></div>';
    bodyString += '</fieldset>';

    var dialogData = {'visitor-id': id+'~'+b_id, 'chat-partner': id + '~' + b_id, 'chat-id': chat_id};
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'operator-forward-selection', {}, {}, {}, {}, '', dialogData, true);
    var fwdTextHeight = Math.max((this.dialogWindowHeight - 205), 100);
    var selWidth = this.dialogWindowWidth - 42;
    if (lzm_displayHelper.checkIfScrollbarVisible('operator-forward-selection')) {
        selWidth -= lzm_displayHelper.getScrollBarWidth();
    }

    /*$('#forward-text').css({height: fwdTextHeight + 'px'});
    $('#fwd-container').css({'min-height':  ($('#operator-forward-selection-body').height() - 22) + 'px'});
    $('#fwdGroupSelect').css({'min-width': '0px', width: (selWidth + 6)+'px'});
    $('#fwdOperatorSelect').css({'min-width': '0px', width: (selWidth + 6)+'px'});
*/
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
                ' data-selected-operator="">' +
                '<option value="">' + t('--- Choose an operator ---') + '</option>';
            var availableOperators = lzm_chatServerEvaluation.operators.getAvailableOperators(id + '~' + b_id);
            for (i=0; i<operators.length; i++) {
                if (operators[i].userid != thisClass.myLoginId &&
                    $.inArray(selectedGroupId, operators[i].groups) != -1 &&
                    (typeof operators[i].isbot == 'undefined' ||
                        operators[i].isbot != 1) &&
                    (operators[i].status != 2 && operators[i].status != 3) &&
                    $.inArray(operators[i].id, memberList) == -1 &&
                    ((type == 'forward' && $.inArray(operators[i].id, availableOperators.fIdList) != -1) ||
                    (type != 'forward' && $.inArray(operators[i].id, availableOperators.iIdList) != -1))) {
                    var thisOpStatus = t(lzm_commonConfig.lz_user_states[operators[i].status].text);
                    opChooseHtml += '<option value="' + operators[i].userid + '">' +
                        t('<!--op_name--> (<!--op_status-->)', [['<!--op_name-->', operators[i].name], ['<!--op_status-->', thisOpStatus]]) + '</option>';
                    numberOfAvailableOp++;
                }
            }
            opChooseHtml += '</select>';
            if (numberOfAvailableOp == 0) {
                opChooseHtml = '<select id="fwdOperatorSelect" data-role="none" data-selected-operator="" data-group-chosen="true"' +
                    ' data-operator-available="false" class="ui-disabled">' +
                    '<option value="">' + t('--- No operators in this group available ---') + '</option></select>';
            }
        } else {
            opChooseHtml = '<select id="fwdOperatorSelect" data-role="none" data-group-chosen="false" data-selected-operator=""' +
                ' data-operator-available="false" class="ui-disabled">' +
                '<option value="">' + t('--- No group chosen ---') + '</option></select>';
        }
        $('#fwdOperatorSelectDiv').html('<label for="fwdOperatorSelect">'+tid('operator')+'</label>' + opChooseHtml).trigger('create');
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

    lzm_displayLayout.resizeOperatorForwardSelection();
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

    var tableWidth = $('#main-menu-panel-settings').width();
    var thisUsersettingsMenu = $('#usersettings-menu');
    var usersettingsMenuHtml = '<table style="min-width: ' + tableWidth + 'px;" class="lzm-unselectable">';
    usersettingsMenuHtml += '<tr><td onclick="manageUsersettings(event);">' + t('Options') + '</td></tr>';
    if (true || !this.isApp && !this.isMobile) {
        usersettingsMenuHtml +='<tr><td onclick="showTranslationEditor(event);">' + t('Translation Editor') + '</td></tr>';
        usersettingsMenuHtml +='<tr><td onclick="showUserManagement(event);">' + t('User Management') + '</td></tr>';
    }
    usersettingsMenuHtml += '<tr><td onclick="showFilterList(event);">' + t('Filters') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="initLinkGenerator(event);">' + t('Link Generator') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="changePassword(event);">' + t('Change Password') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="personalChatLink();">' + tid('per_c_link') + '</td></tr>';
    usersettingsMenuHtml += '<tr><td onclick="logout(true, false, event);">' + t('Log out') + '</td></tr>';
    usersettingsMenuHtml += '</table>';
    thisUsersettingsMenu.html(usersettingsMenuHtml);
    thisUsersettingsMenu.css({display: 'block'});
};

ChatDisplayClass.prototype.createCommentHtml = function(type, line, commentText, operatorName, operatorId, time){
    var commentHtml = '';
    var avatar = '<div style="background-image: url(./../picture.php?intid='+lz_global_base64_url_encode(operatorId)+');"></div>';
    if(type=='ticket'){
        commentHtml = '<tr id="comment-line-' + line + '" class="comment-line lzm-unselectable" style="cursor:pointer;" onclick="handleTicketCommentClick(' + line + ', \'' + lz_global_base64_encode(commentText) + '\');"><td style="width:50px;" class="CMTP">' + avatar + '</td><td style="vertical-align: top;"><span class="comment-line-date">' + time + '</span><br><span><b>' + operatorName + '</b></span><div>'
        +lzm_commonTools.escapeHtml(commentText) +'</div></td></tr>';
        }
    else{
        commentHtml = '<tr onclick="handleVisitorCommentClick(' + line + ');" style="cursor: pointer;" id="visitor-comment-line-' + line + '" class="comment-line lzm-unselectable" data-comment-no="' + line + '"><td style="width:50px;" class="CMTP">' + avatar + '</td><td style="vertical-align: top;"><span class="comment-line-date">' + time + '</span><br><span><b>' + operatorName + '</b></span><div>'
            +lzm_commonTools.escapeHtml(commentText) +'</div></td></tr>';
        }
    return commentHtml;
}

ChatDisplayClass.prototype.showUserstatusMenu = function (user_status, myName, myUserId) {
    $('#usersettings-menu').css('display', 'none');
    $('#minified-dialogs-menu').css('display', 'none');
    this.showUsersettingsHtml = false;
    this.showMinifiedDialogsHtml = false;

    var tableWidth = $('#main-menu-panel-settings').width();
    var thisUserstatusMenu = $('#userstatus-menu');
    var userstatusMenuHtml = '<table style="min-width: ' + tableWidth + 'px;">';
    for (var statusIndex = 0; statusIndex < this.lzm_commonConfig.lz_user_states.length; statusIndex++) {
        if (this.lzm_commonConfig.lz_user_states[statusIndex].index != 2) {
            userstatusMenuHtml += '<tr><td class="lzm-unselectable" ' +
                'onclick="setUserStatus(' + this.lzm_commonConfig.lz_user_states[statusIndex].index + ', event)">' +
                '&nbsp;<img src="' + this.lzm_commonConfig.lz_user_states[statusIndex].icon + '" width="14px" ' +
                'height="14px">&nbsp;&nbsp;&nbsp;' + t(this.lzm_commonConfig.lz_user_states[statusIndex].text) + '</td></tr>'
        }
    }
    //userstatusMenuHtml += '<tr><td></td></tr>' +
    userstatusMenuHtml += '</table>';
    thisUserstatusMenu.html(userstatusMenuHtml);
    thisUserstatusMenu.css({display: 'block'});
};

ChatDisplayClass.prototype.setUserStatus = function (statusValue) {
    $('#userstatus-menu').css('display', 'none');
    this.showUserstatusHtml = false;
    this.user_status = statusValue;
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
    var chatButtonsHtml = '<div' + disabledClass + ' style="margin: 6px 0px;">';
    chatButtonsHtml += lzm_displayHelper.createInputControlPanel();
    chatButtonsHtml += lzm_displayHelper.createButton('visitor-chat-actions', '', 'showVisitorChatActionContextMenu(\'' + this.thisUser.id + '\', \'actions\', event);', t('Actions'), '<i class="fa fa-wrench"></i>', 'lr', {'margin-left': '4px'}, '');
    chatButtonsHtml += '<span style="float:right">'+lzm_displayHelper.createButton('send-chat-btn', '', 'sendTranslatedChat(grabEditorContents())', t('Send'), '<i class="fa fa-send"></i>', 'lr', {'padding-left': '10px', 'padding-right': '10px', 'margin-right': '4px'}, t('Send'));
    chatButtonsHtml += '</span></div>';
    thisChatButtons.html(chatButtonsHtml).trigger('create').css('display', 'block');

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
        openChatHtmlString += '<div style="margin: 6px 0;">';
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
        var myButtonCss = {'margin-left': '4px'};

        var visitorLanguage = lzm_chatServerEvaluation.userLanguage;
        try {
            visitorLanguage = ($.inArray(thisUser.lang, this.translationLangCodes) != -1) ? thisUser.lang : thisUser.lang.split('-')[0].split('_')[0];
        } catch(e) {}
        var translateButtonCss = lzm_commonTools.clone(myButtonCss);
        openChatHtmlString += lzm_displayHelper.createButton('translate-chat', hiddenClass + disabledClass,'showTranslateOptions(\'' + visitorChat + '\', \'' + visitorLanguage + '\');', '', '<i class="fa fa-lg fa-language"></i>', 'lr', translateButtonCss, t('Translate'));
        openChatHtmlString += lzm_displayHelper.createButton('visitor-chat-actions', '', 'showVisitorChatActionContextMenu(\'' + this.thisUser.id + '~' + thisUser.b_id + '\', \'actions\', event);', t('Actions'), '<i class="fa fa-wrench"></i>', 'lr', {'margin-left': '4px'});
        openChatHtmlString += '<span style="float:right">'+lzm_displayHelper.createButton('send-chat-btn', '', 'sendTranslatedChat(grabEditorContents())', t('Send'), '<i class="fa fa-send"></i>', 'lr', {'padding-left': '10px', 'padding-right': '10px','margin-right': '4px'}, t('Send'))+'</span>';
        openChatHtmlString += '</div>';
    }

    thisChatButtons.html(openChatHtmlString).trigger("create");

    if (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null &&
        lzm_chatDisplay.chatTranslations[visitorChat].tvm != null && (lzm_chatDisplay.chatTranslations[visitorChat].tmm.translate ||
        lzm_chatDisplay.chatTranslations[visitorChat].tvm.translate)) {
        //myButtonCss['background-color'] = '#5197ff';

        /*$('#translate-chat').css({'background-color': CommonConfigClass.lz_brand_color, color: '#fff', 'border-color': '#4888e3'});
        $('#translate-chat i.fa').css({color: '#ffffff'});
        */

        $('#translate-chat').addClass('lzm-button-b-active');

    } else {
        /*
        $('#translate-chat').css({'background-color': '#e8e8e8', color: '#666', 'border-color': '#cccccc'});
        $('#translate-chat i.fa').css({color: '#666666'});
        */
        $('#translate-chat').removeClass('lzm-button-b-active');
    }


    thisChatButtons.css('display', 'block');

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
    var vb = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id, b_id), acceptString = t('Start Chat');
    if (vb[1] != null && vb[1].chat.id != '' && vb[1].chat.cmb == 1 && vb[1].cphone != '') {
        acceptString = t('Call now');
    }
    if (thisUserChat != null) {
        var disabledClass = '';
        if (thisUserChat.status == 'left' ||
            thisUserChat.status == 'declined' ||
            thisUserChat.group_chat ||
            !thisUserChat.my_chat) {
            disabledClass = 'ui-disabled ';
        }
        noOpenChatHtmlString += '<div style="margin: 6px 0px;">';
        noOpenChatHtmlString += lzm_displayHelper.createButton('show-visitor-info', '', 'showVisitorInfo(\'' + this.thisUser.id + '\');', '', '<i class="fa fa-info"></i>', 'lr',
                {'margin-left': '4px'}, t('Show information')) +
            lzm_displayHelper.createButton('accept-chat', disabledClass, '', acceptString, '<i class="fa fa-check"></i>', 'force-text',{'margin-left': '2px','font-size':'11px',padding:'2px 6px'}, t('Start Chat'), 20, 'd') +
            lzm_displayHelper.createButton('decline-chat', disabledClass, '', '', '<i class="fa fa-remove"></i>', 'lr', {'margin-left': '4px'}, t('Decline')) +
            lzm_displayHelper.createButton('forward-chat', disabledClass, '', '', '<i class="fa fa-users"></i>', 'lr',{'margin-left': '4px'}, t('Forward')) +
            lzm_displayHelper.createButton('ban-visitor', '', 'showFilterCreation(\'' + this.thisUser.id + '\');', '', '<i class="fa fa-ban"></i>', 'lr',
                {'margin-left': '4px'}, t('Ban (add filter)'));
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

ChatDisplayClass.prototype.createChatMemberActionMenu = function(object) {
    var contextMenuHtml = '', disabledClass = '';
    if(object.browserId.length==0){
        contextMenuHtml += '<div onclick="chatInternalWith(\''+object.userId+'\',\'\',\'\');removeChatMembersListContextMenu();"><span id="chat-show-info" class="cm-line cm-click">' + tid('start_chat') + '</span></div>';
    }
    else{

        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(object.userId + '~' + object.browserId);
        var pgid = lzm_chatServerEvaluation.userChats.isInPublicGroupChat(activeUserChat);
        var cRemove = 'removeFromDynamicGroup(\''+object.userId+'~'+object.browserId+'\', \''+object.groupId+'\');';
        var cTake = 'takeChat(\''+object.userId+'\',\''+object.browserId+'\',\''+object.chatId+'\', \''+object.groupId+'\');';

        disabledClass = (!pgid || lzm_chatDisplay.user_status == 3) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="'+cRemove+cTake+';removeChatMembersListContextMenu();"><span id="chat-show-info" class="cm-line cm-click">' + tid('take') + '</span></div>';

        disabledClass = (activeUserChat.status == 'left') ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="closeChat(\''+object.chatId+'\',\''+object.userId+'\',\''+object.browserId+'\',true);removeChatMembersListContextMenu();"><span id="chat-show-info" class="cm-line cm-click">' + tid('close') + '</span></div>';

        disabledClass = (activeUserChat.status != 'new' || pgid) ? ' class="ui-disabled"' : '';
        contextMenuHtml += '<div' + disabledClass + ' onclick="declineChat(\''+object.userId+'\', \''+object.browserId+'\', \''+object.chatId+'\');removeChatMembersListContextMenu();"><span id="chat-show-info" class="cm-line cm-click">' + tid('decline') + '</span></div>';

        contextMenuHtml += '<div onclick="showFilterCreation(\''+object.userId+'\');removeChatMembersListContextMenu();"><span id="chat-show-info" class="cm-line cm-click">' + tid('ban_add_filter') + '</span></div>';
    }
    return contextMenuHtml;
}

ChatDisplayClass.prototype.createChatActionMenu = function(myObject) {
    var disabledClass = '', contextMenuHtml = '';
    var isDynamicGroup = lzm_chatServerEvaluation.groups.isDynamicGroup(myObject.id);

    disabledClass = (myObject.b_id == '') ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showVisitorInfo(\'' + myObject.id + '\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-show-info" class="cm-line cm-click">' +
        t('Details') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="addQrdToChat(\'file\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-send-file" class="cm-line cm-click">' +
        t('Send File') + '</span></div>';
    contextMenuHtml += '<div onclick="addQrdToChat(\'link\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-send-link" class="cm-line cm-click">' +
        t('Send Url') + '</span></div>';
    disabledClass = (typeof myObject.phone == 'undefined' || myObject.phone == '') ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="showPhoneCallDialog(\'' + myObject.id + '~' + myObject.b_id + '\', -1, \'chat\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-start-phone-call" class="cm-line cm-click"' +
        '>' +
        t('Phone Call') + '</span></div><hr />';
    var availableOperators = lzm_chatServerEvaluation.operators.getAvailableOperators(myObject.id + '~' + myObject.b_id);
    disabledClass = (myObject.b_id == '' || myObject.member_status != 0 || availableOperators['forward'].length == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="forwardChat(\'' + myObject.chat_id + '\', \'forward\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-forward-chat" class="cm-line cm-click"' +
        '>' +
        t('Forward Chat') + '</span></div>';
    disabledClass = (myObject.b_id == '' || myObject.member_status != 0 || availableOperators['invite'].length == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="forwardChat(\'' + myObject.chat_id + '\', \'invite\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-invite-operator" class="cm-line cm-click"' +
        '>' +
        t('Invite Operator') + '</span></div>';
    disabledClass = (myObject.b_id == '' || myObject.member_status != 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="addToDynamicGroup(\'' + myObject.id + '\', \'' + myObject.b_id + '\', \'' + myObject.chat_id + '\');removeVisitorChatActionContextMenu();">' +
        '<span id="chat-add-dynamic" class="cm-line cm-click">' +
        t('Add to Dynamic Group') + '</span></div><hr />';
    disabledClass = (myObject.b_id == '') ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + '><span id="chat-add-filter" class="cm-line cm-click" onclick="showFilterCreation(\'' + myObject.id + '\');removeVisitorChatActionContextMenu();">' + t('Ban (add filter)') + '</span></div><hr />';
    contextMenuHtml += '<div onclick="leaveChat();removeVisitorChatActionContextMenu();"><span id="chat-leave-chat" class="cm-line cm-click">' + t('Leave Chat') + '</span></div>';
    disabledClass = (!isDynamicGroup) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' onclick="leaveChat();removeFromDynamicGroup(\''+lzm_chatServerEvaluation.myId+'\', \''+myObject.id+'\');removeVisitorChatActionContextMenu();"><span id="chat-leave-chat" class="cm-line cm-click">' + tid('leave_group') + '</span></div><hr />';
    contextMenuHtml += '<div><span id="chat-close-all-offline" class="cm-line cm-click" onclick="closeAllInactiveChats();removeVisitorChatActionContextMenu();">' + t('Close all offline chats') + '</span></div>';
    return contextMenuHtml;
};

ChatDisplayClass.prototype.catchEnterButtonPressed = function (e) {
    var that = this, thisChatInput = $('#chat-input');
    if (e.which == 13 || e.keyCode == 13) {
        try {
            var useResource = '';
            for (var i=0; i<shortCutResources.length; i++) {
                if (shortCutResources[i].complete) {
                    useResource = shortCutResources[i].id;
                    break;
                }
            }
            if (useResource != '') {
                var resource = lzm_chatServerEvaluation.cannedResources.getResource(useResource);
                if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && (that.isApp || that.isMobile) &&
                    lzm_chatUserActions.active_chat_reco != '') {
                    sendQrdPreview(useResource, lzm_chatUserActions.active_chat_reco);
                } else if (resource != null && $.inArray(resource.ty, ['2', '3', '4']) != -1 && (that.isApp || that.isMobile) &&
                    lzm_chatUserActions.active_chat_reco == '') {

                } else {
                    useEditorQrdPreview(useResource);
                }
            } else if (!quickSearchReady && thisChatInput.val().indexOf('/') == 0) {

            } else {
                quickSearchReady = false;
                sendTranslatedChat(grabEditorContents());
            }
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
    var sid = (inDialog) ? 'd-' : '';
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
                searchString = $('#'+sid+'search-resource').val();
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
                        searchString = $('#search-resource').val();
                        thisClass.resourcesDisplay.fillQrdSearchList(thisClass.resourcesDisplay.qrdChatPartner, inDialog);
                        break;
                }
            }
        }, 1000);
    }

};

ChatDisplayClass.prototype.showSubMenu = function(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    var i = 0;
    var contextMenuHtml = '<div class="cm lzm-unselectable" id="' + place + '-context" onclick="handleContextMenuClick(event);">';
    contextMenuHtml += '<div onclick="showSuperMenu(\'' + place + '\', \'' + category + '\', \'' + objectId + '\', ' + contextX + ', ' + contextY + ', ' + menuWidth + ', ' + menuHeight + ')"><i class="fa fa-chevron-left lzm-ctxt-left-fa"></i><span id="show-super-menu" class="cm-line cm-line-icon-left cm-click">' + t('Back') + '</span></div><hr />';
    switch(place)
    {
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
            if(category=='operator')
            {
                var operators = lzm_chatServerEvaluation.operators.getOperatorList();
                for (i=0; i<operators.length; i++) {
                    if (operators[i].isbot != '1' && operators[i].id != ticketEditor) {
                        contextMenuHtml += '<div onclick="setTicketOperator(\'' + objectId + '\', \'' + operators[i].id + '\')"><span id="ticket-set-operator-' + operators[i].id + '" class="cm-line cm-click">' + operators[i].name + '</span></div>';
                    }
                }
            }
            else if(category=='group')
            {
                var groups = lzm_chatServerEvaluation.groups.getGroupList();
                for (i=0; i<groups.length; i++) {
                    if (groups[i].id != ticketGroup) {
                        var groupHash = md5(groups[i].id).substr(0,6);
                        contextMenuHtml += '<div onclick="setTicketGroup(\'' + objectId + '\', \'' + groups[i].id + '\')"><span id="ticket-set-group-' + groupHash + '" class="cm-line cm-click">' + groups[i].name + '</span></div>';
                    }
                }
            }
            else if(category=='ticket_status')
            {
                var inDialog = (place == 'ticket-list') ? false : true;
                contextMenuHtml += '<div onclick="changeTicketStatus(0,null,null,null,false)"><i class="fa fa-question-circle" style="color: #5197ff;"></i><span id="set-ticket-open" class="cm-line cm-line-icon-left cm-click">' + t('Open (O)') + '</span></div>';
                contextMenuHtml += '<div onclick="changeTicketStatus(1,null,null,null,false)"><i class="fa fa-gear" style="color: #808080"></i><span id="set-ticket-progress" class="cm-line cm-line-icon-left cm-click">' + t('In Progress (P)') + '</span></div>';
                contextMenuHtml += '<div onclick="changeTicketStatus(2,null,null,null,false)"><i class="fa fa-check-circle" style="color: #009a00;"></i><span id="set-ticket-closed" class="cm-line cm-line-icon-left cm-click">' + t('Closed (C)') + '</span></div>';
                contextMenuHtml += '<div onclick="changeTicketStatus(3,null,null,null,false)"><i class="fa fa-remove" style="color: #cc0000;"></i><span id="set-ticket-deleted" class="cm-line cm-line-icon-left cm-click">' + t('Deleted (D)') + '</span></div>';
            }
            else if(category=='ticket_sub_status')
            {
                var inDialog = (place == 'ticket-list') ? false : true;
                var myStatus = (ticket.editor) ? ticket.editor.st : 0;
                for(key in lzm_chatServerEvaluation.global_configuration.database['tsd'])
                {
                    var elem = lzm_chatServerEvaluation.global_configuration.database['tsd'][key];
                    if(elem.type == 0 && elem.parent == myStatus){
                        contextMenuHtml += '<div onclick="changeTicketStatus(null,\''+elem.name+'\',null,null,false)"><span class="cm-line cm-line-icon-left cm-click">' + elem.name + '</span></div>';
                    }
                }
            }
            else if(category=='ticket_channel')
            {
                var inDialog = (place == 'ticket-list') ? false : true;
                var channels = [t('Web'), t('Email'), t('Phone'), t('Misc'), t('Chat'), t('Rating')];

                for(key in channels)
                {
                    var elem = channels[key];
                    contextMenuHtml += '<div onclick="changeTicketStatus(null,null,\''+key+'\',null,false)"><span class="cm-line cm-line-icon-left cm-click">' + elem + '</span></div>';
                }
            }
            else if(category=='ticket_sub_channel')
            {
                var inDialog = (place == 'ticket-list') ? false : true;
                var myChannel = ticket.t;
                for(key in lzm_chatServerEvaluation.global_configuration.database['tsd'])
                {
                    var elem = lzm_chatServerEvaluation.global_configuration.database['tsd'][key];
                    if(elem.type == 1 && elem.parent == myChannel){
                        contextMenuHtml += '<div onclick="changeTicketStatus(null,null,null,\''+elem.name+'\',false)"><span class="cm-line cm-line-icon-left cm-click">' + elem.name + '</span></div>';
                    }
                }
            }
            else if(category=='add_to_watch_list')
            {
                var operators = lzm_chatServerEvaluation.operators.getOperatorList('name', '', true);
                for (i=0; i<operators.length; i++)
                    if (operators[i].isbot != 1)
                        contextMenuHtml += '<div onclick="addTicketToWatchList(\'' + objectId + '\',\'' + operators[i].id + '\')"><span id="set-ticket-open" class="cm-line cm-line-icon-left cm-click">' + operators[i].name + '</span></div>';
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
    var checkSizeDivHtml = '<div id="context-menu-check-size-div" style="position:absolute; left: -3000px; top: -3000px;' + ' width: 2500px; height: 2500px;"></div>';
    $('body').append(checkSizeDivHtml);
    var testContextMenuHtml = contextMenuHtml.replace(/id="/g, 'id="test-');
    $('#context-menu-check-size-div').html(testContextMenuHtml);
    //var contextWidth = $('#test-' + place + '-context').width();
    var contextHeight = $('#test-' + place + '-context').height();
    var contextWidth = (contextHeight > menuHeight) ? menuWidth + lzm_displayHelper.getScrollBarWidth() : menuWidth;
    contextHeight = Math.min(contextHeight, menuHeight);
    var contextTop = (contextHeight >= menuHeight) ? contextY : contextY + Math.round((menuHeight - contextHeight) / 2);

    $('#context-menu-check-size-div').remove();
    this.storedSuperMenu = $('#' + place + '-context').html();
    $('#' + place + '-context').replaceWith(contextMenuHtml);
    var myStyleObject = {left: contextX, width: contextWidth+'px', height: contextHeight+'px', top: contextTop};
    $('#' + place + '-context').css(myStyleObject);
};

ChatDisplayClass.prototype.showSuperMenu = function(place, category, objectId, contextX, contextY, menuWidth, menuHeight) {
    var contextMenuHtml = '<div class="cm lzm-unselectable" id="' + place + '-context" onclick="handleContextMenuClick(event);">' + this.storedSuperMenu + '</div>';
    $('#' + place + '-context').replaceWith(contextMenuHtml);
    var myStyleObject = {left: contextX+'px', width: menuWidth+'px', height: menuHeight+'px', top: contextY+'px'};
    $('#' + place + '-context').css(myStyleObject);
};

ChatDisplayClass.prototype.showContextMenu = function(place, myObject, mouseX, mouseY, button) {
    button = (typeof button != 'undefined') ? button : '';
    var thisClass = this;
    var contextX = mouseX + 'px', contextY = mouseY + 'px', contextMenuName = place;
    var widthOffset = 0;
    $('#' + place + '-context').remove();

    var contextMenuHtml = '<div class="cm lzm-unselectable" id="' + contextMenuName + '-context" onclick="handleContextMenuClick(event);">';
    switch(place) {
        case 'qrd-tree':
            contextMenuHtml += thisClass.resourcesDisplay.createQrdTreeContextMenu(myObject);
            break;
        case 'ticket-list':
        case 'visitor-information':
            widthOffset = 40;
            contextMenuHtml += thisClass.ticketDisplay.createTicketListContextMenu(myObject, place, widthOffset);
            break;
        case 'ticket-filter':
            contextMenuHtml += thisClass.ticketDisplay.createTicketFilterMenu(myObject);
            place = 'chat_page';
            break;
        case 'ticket-details':
            widthOffset = 20;
            contextMenuHtml += thisClass.ticketDisplay.createTicketDetailsContextMenu(myObject);
            break;
        case 'archive-filter':
            contextMenuHtml += thisClass.archiveDisplay.createArchiveFilterMenu(myObject);
            place = 'chat_page';
            break;
        case 'visitor-list-table-div':
            contextMenuHtml += thisClass.visitorDisplay.createVisitorListContextMenu(myObject);
            break;
        case 'operator-list':
            widthOffset = 20;
            contextMenuHtml += thisClass.createOperatorListContextMenu(myObject);
            break;
        case 'report-list':
            contextMenuHtml += thisClass.reportsDisplay.createReportListContextMenu(myObject);
            break;
        case 'report-filter':
            contextMenuHtml += thisClass.reportsDisplay.createReportFilterMenu(myObject);
            place = 'chat_page';
            break;
        case 'all-chats':
            contextMenuHtml += thisClass.allchatsDisplay.createAllChatsListContextMenu(myObject);
            break;
        case 'allchats-filter':
            contextMenuHtml += thisClass.allchatsDisplay.createAllChatsFilterMenu(myObject);
            place = 'chat_page';
            break;
        case 'filter-list':
            contextMenuHtml += thisClass.visitorDisplay.createFilterListContextMenu(myObject);
            break;
        case 'chat-actions':
            contextMenuHtml += thisClass.createChatActionMenu(myObject);
            place = 'chat-container';
            break;
        case 'archive':
            widthOffset = 20;
            contextMenuHtml += thisClass.archiveDisplay.createArchiveContextMenu(myObject);
            break;
        case 'chat-members':
            widthOffset = 20;
            contextMenuHtml += thisClass.createChatMemberActionMenu(myObject);
            break;
    }
    contextMenuHtml += '</div>';

    var myParent = 'body';
    if (place != 'body' && place != 'ticket-details' && place != 'visitor-list-table-div' && place != 'chat-members' && place != 'chat_page' && place != 'chat-container') {
        myParent = '#' + place + '-body';
    } else if (place != 'body')
        myParent = '#' + place;

    if(typeof myObject.parent != 'undefined')
        myParent = '#' + myObject.parent;

    var checkSizeDivHtml = '<div id="context-menu-check-size-div" style="position:absolute; left: -1000px; top: -1000px; width: 800px; height: 800px;"></div>';
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

        if ($.inArray(contextMenuName, ['ticket-filter', 'report-filter', 'archive-filter']) == -1) {
            if (widthDiff < 0) {
                contextX = Math.max((mouseX - contextWidth - 12), 5) + 'px';
            }
            if (heightDiff < 0) {
                contextY = Math.max((mouseY - contextHeight - 12), 5) + 'px';
            }
        } else {
            if (widthDiff < 0) {
                contextX = Math.max((mouseX + widthDiff - 10), 5) + 'px';
            }
            if (heightDiff < 0) {
                contextY = Math.max((mouseY + heightDiff- 10), 5) + 'px';
            }
        }
    }

    $('#context-menu-check-size-div').remove();
    contextMenuHtml = contextMenuHtml.replace(/%CONTEXTX%/g, parseInt(contextX)).replace(/%CONTEXTY%/g, parseInt(contextY)).replace(/%MYWIDTH%/g, parseInt(contextWidth)).replace(/%MYHEIGHT%/g, parseInt(contextHeight));
    $(myParent).append(contextMenuHtml);




    var myStyleObject = {left: contextX, width: (contextWidth+widthOffset)+'px', height: contextHeight+'px'};

    if (button == 'ticket-message-actions'){
        myStyleObject.bottom = '32px';
    } else if (button == 'chat-actions' && myObject.button == 'actions') {
        myStyleObject.bottom = '76px';
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

    // Remove old menu panel and move view select panel upwards
    //$('#new-view-select-panel').css({'margin-top': '55px', 'margin-left': '0px'});
    lzm_displayLayout.resizeMenuPanels();
};

ChatDisplayClass.prototype.createViewSelectPanel = function(target) {
    var viewSelectPanel = lzm_displayHelper.createViewSelectPanel(target);
    $('#new-view-select-panel').html(viewSelectPanel);
};

ChatDisplayClass.prototype.playSound = function(name, sender) {
    if (name == 'message') {
        blinkPageTitle(t('New chat activity'));
    } else if (name == 'ticket') {
        blinkPageTitle(t('New ticket activity'));
    }
    var thisClass = this;
    $('#sound-'+name)[0].volume = thisClass.volume / 100;
    if ($.inArray(sender, thisClass.soundPlayed) == -1) {
        if (typeof lzm_deviceInterface == 'undefined') {
            $('#sound-'+name)[0].play();
        } else {
            try {
                lzm_deviceInterface.playSound(name, thisClass.volume/100);
                if (lzm_chatPollServer.appBackground == 0 && thisClass.vibrateNotifications != 0) {

                } else {

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

                    var notificationPushText = t('<!--sender--> wants to chat with you.', [['<!--sender-->', lzm_commonTools.htmlEntities(senderName)]]);
                    if (typeof lzm_deviceInterface != 'undefined') {
                        try {
                            thisClass.lastChatSendingNotification = newSender[k];
                            lzm_deviceInterface.showNotification(t('LiveZilla'), notificationPushText, notificationSound, newSender[k], newSender[k], '0');
                        } catch(ex) {
                            try {
                                lzm_deviceInterface.showNotification(t('LiveZilla'), notificationPushText, notificationSound, newSender[k], newSender[k]);
                            } catch(e) {
                                logit('Error while showing notification');
                            }
                        }
                    }
                    if (thisClass.selected_view != 'mychats' || $('.dialog-window-container').length > 0) {

                        if(senderQuestion != '')
                            notificationPushText = senderQuestion;

                        if(lzm_commonStorage.loadValue('not_chats_' + lzm_chatServerEvaluation.myId,1)!=0)
                            lzm_displayHelper.showBrowserNotification({
                                text: notificationPushText,
                                sender: senderName,
                                subject: t('New Chat Request'),
                                action: 'openChatFromNotification(\'' + newSender[k] + '\'); closeOrMinimizeDialog();',
                                timeout: 10,
                                icon: 'fa-commenting-o'
                            });
                    }
                }
            thisClass.playRingSound(senderList);
        }
};

ChatDisplayClass.prototype.playRingSound = function (senderList) {
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
                /*
                if (lzm_chatPollServer.appBackground == 0 && thisClass.vibrateNotifications != 0) {

                } else {

                }
                */
            } catch(ex) {
                logit('Playing ringtone failed.');
            }
        }
        if (thisClass.repeatNewChatSound == 1) {
            setTimeout(function() {
                thisClass.playRingSound(senderList);
            }, 5000);
        }
    }
};

ChatDisplayClass.prototype.playQueueSound = function (count) {
    var thisClass = this;
    var audio = $('#sound-queue')[0];
    var startCircle = false;

    if(count!=null){
        if(!thisClass.queueSoundActive && count>0)
            startCircle = true;
        thisClass.queueSoundActive = (count>0);
    }
    else if(thisClass.queueSoundActive)
        startCircle = true;

    if(!this.isApp && lzm_commonStorage.loadValue('play_queue_sound_' + lzm_chatServerEvaluation.myId,1)!=0)
        if(startCircle){
            audio.volume = this.volume / 100;
            if (typeof lzm_deviceInterface == 'undefined') {
                audio.play();
            } else {
                /*
                try {
                    lzm_deviceInterface.playSound('queue', thisClass.volume/100);

                     if (lzm_chatPollServer.appBackground == 0 && thisClass.vibrateNotifications != 0) {

                     } else {

                     }

                } catch(ex) {
                    logit('Playing ringtone failed.');
                }
                */
            }
            if (thisClass.queueSoundActive) {
                setTimeout(function() {
                    thisClass.playQueueSound(null);
                }, 30000);
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

ChatDisplayClass.prototype.getLanguageDisplayName = function(lang){
    return (typeof this.availableLanguages[lang.toLowerCase()] != 'undefined') ?
        lang + ' - ' + this.availableLanguages[lang.toLowerCase()] :
        (typeof this.availableLanguages[lang.toLowerCase().split('-')[0]] != 'undefined') ?
            lang + ' - ' + this.availableLanguages[lang.toLowerCase().split('-')[0]] :
            lang;
};

/********** Phone calls **********/
ChatDisplayClass.prototype.openPhoneCallDialog = function(myObject, lineNo, caller) {
    var that = this;
    lineNo = (caller == 'ticket') ? (myObject.messages[lineNo].p != '') ? lineNo : 0 : lineNo;
    var dialogId = (caller == 'ticket') ? lzm_chatDisplay.ticketDialogId[myObject.id] : '';
    var windowId = (caller == 'ticket') ? 'ticket-details' : 'phone-call';
    var menuEntry = (caller == 'ticket') ?
        t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', myObject.id],['<!--name-->', myObject.messages[0].fn]]) :
        (caller == 'chat') ? t('Call chat partner <!--chat_partner-->', [['<!--chat_partner-->', myObject[1].cname]]) : t('Phone Call');
    var headerString = t('Start call');
    var footerString =
        lzm_displayHelper.createButton('phone-call-now', '','', t('Call now'), '', 'lr',{'margin-left': '6px'},'',30,'d')+
            lzm_displayHelper.createButton('phone-call-cancel', '','', t('Cancel'), '', 'lr',{'margin-left': '6px'},'',30,'d');
    var bodyString = '<div id="phone-call-phonenumber-placeholder"></div>';

    /*var parsePhoneNumber = function(phoneNumber, country) {
        phoneNumber = phoneNumber.replace(/ /g, '').replace(/[^[0-9+]]/, '');
        var countryCode = '', number = '', remainingNumber = '', langCodeLength;

        if (phoneNumber.indexOf('+') == 0) {
            remainingNumber = phoneNumber.substr(1);
        } else if (phoneNumber.indexOf('011') == 0) {
            remainingNumber = phoneNumber.substr(3);
        } else if (phoneNumber.indexOf('0011') == 0) {
            remainingNumber = phoneNumber.substr(4);
        } else if (phoneNumber.indexOf('00') == 0) {
            remainingNumber = phoneNumber.substr(2);
        } else if (phoneNumber.indexOf('000') == 0) {
            remainingNumber = phoneNumber.substr(3);
        } else {
            remainingNumber = phoneNumber;
        }

        if (remainingNumber != phoneNumber) {
            var ctryCodelength = 0;
            if (remainingNumber.substr(0,1) == '1') {
                ctryCodelength = 1;
            } else if (remainingNumber.substr(0,4) == '7840' || remainingNumber.substr(0,4) == '7940') {
                ctryCodelength = 4;
            } else if (remainingNumber.substr(0,1) == '7' || remainingNumber.substr(0,4) == '7') {
                ctryCodelength = 1;
            } else if ($.inArray(parseInt(remainingNumber.substr(0,2)), [21,22,23,24,25,26,29,35,37,38,42,50,59,67,68,69,80,85,87,88,96,97,99]) == -1) {
                ctryCodelength = 2;
            } else {
                ctryCodelength = 3;
            }
            countryCode = remainingNumber.substr(0, ctryCodelength);
            number = remainingNumber.substr(ctryCodelength);
        } else {
            number = phoneNumber;
            if (typeof lzm_chatDisplay.countryInformation[country.toLowerCase()] != 'undefined') {
                countryCode = lzm_chatDisplay.countryInformation[country.toLowerCase()].callingCodes[0];
                if (number.indexOf('0') == 0) {
                    number = number.substr(1);
                }
            }
        }

        return({ctry: countryCode, nmbr: number});
    };*/

    var phoneNumber = (caller == 'ticket') ? /*parsePhoneNumber(myObject.messages[lineNo].p, myObject.messages[lineNo].c)*/
        myObject.messages[lineNo].p : (caller == 'chat') ? myObject[1].cphone : '';

    var phoneProtocols = [{value: 'callto:', text: t('callto - Open a voip application using the callto: protocol')},
        {value: 'tel:', text: t('tel - Open the phone or a voip application using the tel: protocol')},
        {value: 'skype:', text: t('skype - Start the skype application to call the number')}];
    var phoneContent = '<fieldset id="phone-call-phonenumber-inner" class="lzm-fieldset">' +
        '<legend>' + t('Start call') + '</legend>' +
        '<label for="phonecall-protocol">' + t('Protocol') + '</label>' +
        lzm_inputControls.createSelect('phonecall-protocol', '', '', true, {position: 'right', gap: '0px'},{width: '205px'}, '', phoneProtocols, that.lastPhoneProtocol, '') +
        //lzm_inputControls.createInput('phone-country-code', '', phoneNumber.ctry, t('Country Code'), '<i class="fa fa-flag"></i>', 'text', 'a') +
        //lzm_inputControls.createInput('phone-number', '', phoneNumber.nmbr, t('Number'), '<i class="fa fa-phone"></i>', 'text', 'a') +
        lzm_inputControls.createInput('phone-number', '', phoneNumber, t('Number'), '<i class="fa fa-phone"></i>', 'text', 'a') +
        '</fieldset>';

    var dialogData = (caller == 'ticket') ? {'ticket-id': myObject.id, menu: menuEntry} : {menu: menuEntry};

    if (caller == 'ticket') {
        lzm_displayHelper.minimizeDialogWindow(dialogId, windowId, {'ticket-id': myObject.id, menu: menuEntry}, 'tickets', false);
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, windowId, {}, {}, {}, {}, '', dialogData, true, false, dialogId + '_call');
    } else {
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, windowId, {}, {}, {}, {}, '', dialogData, true, false);
    }

    lzm_displayHelper.createTabControl('phone-call-phonenumber-placeholder', [{name: t('Start call'), content: phoneContent}]);
    $('#phonecall-protocol-inner-text').html(that.lastPhoneProtocol);

    if (caller == 'ticket') {
        lzm_displayLayout.resizeTicketDetails();
    } else {
        lzm_displayLayout.resizePhoneCall();
    }

    $('#phonecall-protocol').change(function() {
        var selectText = '';
        for (var i=0; i<phoneProtocols.length; i++) {
            if (phoneProtocols[i].value == $('#phonecall-protocol').val()) {
                selectText = phoneProtocols[i].value;
            }
        }
        $('#phonecall-protocol-inner-text').html(selectText);
    });
    $('#phone-call-cancel').click(function() {
        if (caller == 'ticket') {
            lzm_displayHelper.removeDialogWindow('ticket-details');
            lzm_displayHelper.maximizeDialogWindow(dialogId);
        } else {
            lzm_displayHelper.removeDialogWindow('phone-call');
            if (caller == 'chat' && $.inArray(myObject[0].id + '~' + myObject[1].id, lzm_chatUserActions.chatCallBackList) == -1) {
                lzm_chatUserActions.chatCallBackList.push(myObject[0].id + '~' + myObject[1].id);
            }
        }
    });
    $('#phone-call-now').click(function() {
        that.lastPhoneProtocol = $('#phonecall-protocol').val();
        //startPhoneCall($('#phonecall-protocol').val(), '+' + $('#phone-country-code').val() + $('#phone-number').val());
        startPhoneCall($('#phonecall-protocol').val(), $('#phone-number').val());
        $('#phone-call-cancel').click();
    });
    $('#phone-number').focus();
    $('#phone-number').blur();
};
