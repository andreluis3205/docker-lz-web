/****************************************************************************************
 * LiveZilla ChatServerEvaluationClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatServerEvaluationClass(lzm_commonTools, chosenProfile, lzm_chatTimeStamp) {

    // load the configuration file
    this.lzm_commonConfig = new CommonConfigClass();
    this.lzm_commonTools = lzm_commonTools;
    this.lzm_chatTimeStamp = lzm_chatTimeStamp;
    this.commonEvaluation = {};

    // variables filled from the server response
    this.myName = '';
    this.myId = '';
    this.myGroup = '';
    this.myUserId = '';
    this.myEmail = '';
    this.chosen_profile = {};
    this.serverUrl = chosenProfile.server_url;
    this.serverProtocol = chosenProfile.server_protocol;
    this.loginTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);

    this.permissions = [];
    this.crc3 = null;
    this.oo = null;
    this.maxOperatorNumber = null;
    this.token = null;
    this.global_configuration = {};
    this.translationLanguages = [];
    this.extForwardIdList = [];
    this.external_forwards = [];
    this.active_chat = 'LIST';
    this.active_chat_reco = 'LIST';
    this.tickets = [];
    this.ticketGlobalValues = {p: 20, q: 0, t: 0, r: 0, e: 0};
    this.ticketFetchTime = 0;
    this.expectTicketChanges = false;
    this.login_data = {};
    this.global_typing = [];
    this.globTypingIdList = [];
    this.globalTypingChanges = [];
    this.global_errors = [];
    this.wps = [];
    this.chatMessageCounter = 0;
    this.browserChatIdList = [];
    this.chatPartners = {};
    this.rec_posts = [];
    this.chatArchive = {chats: [], q: '', p: 20, t: 0};
    this.archiveFetchTime = 0;
    this.expectArchiveChanges = false;
    this.fuprs = [];
    this.fuprIdList = [];
    this.fuprDownloadIdList = [];
    this.settingsDialogue = false;
    this.cannedResources = new LzmResources();
    this.resources = [];
    this.resourceIdList = [];
    this.resourceLastEdited = 0;
    this.emails = [];
    this.emailCount = 0;
    this.reportFetchTime = 0;
    this.expectReportChanges = false;
    this.otrs = null;

    this.translationStrings = {key: '', strings: {}};

    this.pollFrequency = 0;
    this.timeoutClients = 0;
    this.siteName = '';
    this.defaultLanguage = '';
    this.isRootServer = true;
    this.hostName = '';

    this.userLanguage = '';

    this.inputList = new LzmCustomInputs();
    this.filters = new LzmFilters();
    this.operators = new LzmOperators();
    this.groups = new LzmGroups();
    this.oldGroupIdList = [];
    this.myDynamicGroups = [];
    this.visitors = new LzmVisitors();
    this.userChats = new LzmUserChats();
    this.reports = new LzmReports();

    this.new_ext_u = false;
    this.new_ext_f = false;
    this.new_ext_c = false;
    this.new_usr_p = false;
    this.new_int_d = false;
    this.new_int_u = false;
    this.new_glt = false;
    this.new_ev = false;
    this.new_dt = false;
    this.new_de = false;
    this.new_dc = false;
    this.new_dr = false;
    this.new_qrd = false;
    this.new_ext_b = false;
    this.new_trl = false;
    this.new_startpage = {lz: false, ca: [], cr: []};

    this.new_gl_e = false;
}

ChatServerEvaluationClass.prototype.setUserLanguage = function(userLang) {
    this.userLanguage = userLang;
    this.commonEvaluation = new CommonServerEvaluationClass(userLang);
};

/**************************************** Debugging functions ****************************************/
ChatServerEvaluationClass.prototype.debuggingReadKeyValuePairFromConfig = function(keyPart) {
    var i, index, key;
    logit('Key search');
    logit('Top level');
    for (i=0; i<this.global_configuration.toplevel.length; i++) {
        if (this.global_configuration.toplevel[i].key.indexOf(keyPart) != -1 && this.global_configuration.toplevel[i].value != '') {
            index = this.lzm_commonTools.pad(i, 4, 0);
            logit(index + ' : ' + this.global_configuration.toplevel[i].key + ' - ' + this.global_configuration.toplevel[i].value);
        }
    }
    for (key in this.global_configuration.site) {
        if (this.global_configuration.site.hasOwnProperty(key)) {
            logit('Site ' + key);
            for (i=0; i<this.global_configuration.site[key].length; i++) {
                index = this.lzm_commonTools.pad(i, 4, 0);
                if (this.global_configuration.site[key][i].key.indexOf(keyPart) != -1 && this.global_configuration.site[key][i].value != '') {
                    logit(index + ' : ' + this.global_configuration.site[key][i].key + ' - ' + this.global_configuration.site[key][i].value);
                }
            }
        }
    }
    logit('Value search');
    logit('Top level');
    for (i=0; i<this.global_configuration.toplevel.length; i++) {
        if (this.global_configuration.toplevel[i].value.indexOf(keyPart) != -1) {
            index = this.lzm_commonTools.pad(i, 4, 0);
            logit(index + ' : ' + this.global_configuration.toplevel[i].key + ' - ' + this.global_configuration.toplevel[i].value);
        }
    }
    for (key in this.global_configuration.site) {
        if (this.global_configuration.site.hasOwnProperty(key)) {
            logit('Site ' + key);
            for (i=0; i<this.global_configuration.site[key].length; i++) {
                index = this.lzm_commonTools.pad(i, 4, 0);
                if (this.global_configuration.site[key][i].value.indexOf(keyPart) != -1) {
                    logit(index + ' : ' + this.global_configuration.site[key][i].key + ' - ' + this.global_configuration.site[key][i].value);
                }
            }
        }
    }
};

ChatServerEvaluationClass.prototype.debuggingGetConfigWithSubKeys = function() {
    var glConf = lzm_commonTools.clone(lzm_chatServerEvaluation.global_configuration);
    for (var siteName in glConf.site) {
        if (glConf.site.hasOwnProperty(siteName)) {
            for (var i=0; i<glConf.site[siteName].length; i++) {
                if (Object.keys(glConf.site[siteName][i].subkeys).length > 0) {
                    logit(glConf.site[siteName][i]);
                }
            }
        }
    }
    for (var j=0; j<glConf.toplevel.length; j++) {
        if (Object.keys(glConf.toplevel[j].subkeys).length > 0) {
            logit(glConf.toplevel[j]);
        }
    }
};

/**************************************** General functions ****************************************/
ChatServerEvaluationClass.prototype.resetWebApp = function() {
    this.global_configuration = {};
    this.extForwardIdList = [];
    this.external_forwards = [];
    this.active_chat = '';
    this.active_chat_reco = '';
    this.global_typing = [];
    this.globTypingIdList = [];
    this.global_errors = [];
    this.wps = [];
    this.chatPartners = {};
    this.rec_posts = [];
    this.chatArchive = {chats: [], q: '', p: 20, t: 0};
    this.fuprs = [];
    this.fuprIdList = [];
    this.fuprDownloadIdList = [];
    this.settingsDialogue = false;
    this.filters.clearFilters();
    this.inputList.clearCustomInputs();
    this.operators.clearOperators();
    this.groups.clearGroups();
    this.visitors.clearVisitors();
    this.new_ext_u = true;
    this.new_ext_f = true;
    this.new_ext_c = true;
    this.new_usr_p = true;
    this.new_int_d = true;
    this.new_int_u = true;
    this.new_glt = true;
    this.new_ev = true;
    this.new_dt = true;
    this.new_de = true;
    this.new_dc = true;
    this.new_qrd = true;
    this.new_gl_e = true;
    this.new_ext_b = true;
};

ChatServerEvaluationClass.prototype.getLogin = function (xmlDoc) {
    var thisClass = this;
    $(xmlDoc).find('login').each(function () {
        var login = $(this);
        login.children('login_return').each(function () {
            var myReturn = $(this);
            var myAttributes = myReturn[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                thisClass.login_data[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                if (thisClass.oo == null && myAttributes[attrIndex].name == 'oo') {
                    thisClass.oo = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                }
                if (thisClass.token == null && myAttributes[attrIndex].name == 't') {
                    thisClass.token = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                }
            }
            if (typeof thisClass.login_data.perms != 'undefined' && thisClass.login_data.perms != '') {
                thisClass.permissions = thisClass.login_data.perms.split('');
                lzm_commonPermissions.getUserPermissions(true);
            }

        });
        thisClass.myName = thisClass.login_data.name;
        thisClass.myId = thisClass.login_data.sess;
        if (typeof thisClass.login_data != 'undefined' && typeof thisClass.login_data.timediff != 'undefined') {
            thisClass.lzm_chatTimeStamp.setTimeDifference(thisClass.login_data.timediff);
        }
    });
};

ChatServerEvaluationClass.prototype.getValidationError = function (xmlDoc) {
    var error_value = '-1';
    $(xmlDoc).find('validation_error').each(function () {
        if (error_value == -1) {
            error_value = lz_global_base64_url_decode($(this).attr('value'));
        }
    });
    return error_value;
};

ChatServerEvaluationClass.prototype.getServerVersion = function(xmlDoc) {
    var serverVersion = '';
    $(xmlDoc).find('livezilla_version').each(function() {
        serverVersion = lz_global_base64_url_decode($(this).text());
    });

    return serverVersion;
};

ChatServerEvaluationClass.prototype.getCrC3 = function(globalConfig) {
    var validationError = '-1', i = 0;
    var trialTime = 30 * 68400;
    if (this.crc3 == null) {
        try {
            for (i=0; i<globalConfig.toplevel.length; i++) {
                if (globalConfig.toplevel[i].key == 'gl_crc3') {
                    this.crc3 = lz_global_base64_url_decode(globalConfig.toplevel[i].value).split(',');
                }
            }
            if (this.crc3 == null) {
                try {
                    for (i=0; i<globalConfig.site[0].length; i++) {
                        if (globalConfig.site[0][i].key == 'gl_crc3') {
                            this.crc3 = lz_global_base64_url_decode(globalConfig.site[0][i].value).split(',');
                        }
                    }
                } catch(e) {}
            }
            if (this.crc3 != null) {
                this.crc3[0] = this.crc3[0] !== '' ? this.crc3[0] : String(0);
                for (i=1; i<=5; i++) {
                    if (lzm_chatTimeStamp.getServerTimeString(null, true) - parseInt(this.crc3[0]) > trialTime && this.crc3[i] == '0') {
                        this.crc3[i] = '-2';
                    }
                }
                if ((lzm_chatTimeStamp.getServerTimeString(null, true) - parseInt(this.crc3[0]) > trialTime && this.crc3[2] == '0') || this.crc3[2] == '-2') {
                    this.crc3[6] = '';
                }
                /*var noo Math.min(1, parseInt(this.crc3[5]))
                if (parseInt(this.crc3[5]) != -1 && parseInt(this.crc3[5]) != 0 && parseInt(this.oo) > noo) {
                 validationError = '101';
                 }*/
            } else {
                this.crc3 = [String(lzm_chatTimeStamp.getServerTimeString(null, true)), '0', '0', '0', '0', '0', '']
            }
        } catch(e) {}
    }
    return validationError;
};

ChatServerEvaluationClass.prototype.getGlobalConfiguration = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('gl_c').each(function () {
        var gl_c = $(this);
        thisClass.global_configuration = {toplevel: [], site: {}, php_cfg_vars: {}};
        $(gl_c).children('conf').each(function () {
            var conf = $(this);
            var new_conf = {};
            new_conf.key = lz_global_base64_url_decode(conf.attr('key'));
            new_conf.value = lz_global_base64_url_decode(conf.attr('value'));
            new_conf.subkeys = {};
            $(conf).find('sub').each(function () {
                new_conf.subkeys[lz_global_base64_url_decode($(this).attr('key'))] = lz_global_base64_url_decode($(this).text());
            });
            thisClass.global_configuration.toplevel.push(new_conf);
        });
        $(gl_c).children('site').each(function () {
            var site = $(this);
            var index = lz_global_base64_url_decode(site.attr('index'));
            if (typeof thisClass.global_configuration.site[index] == 'undefined') {
                thisClass.global_configuration.site[index] = [];
            }
            $(site).find('conf').each(function () {
                var conf = $(this);
                var new_conf = {};
                new_conf.key = lz_global_base64_url_decode(conf.attr('key'));
                new_conf.value = lz_global_base64_url_decode(conf.attr('value'));
                new_conf.subkeys = {};
                $(conf).find('sub').each(function () {
                    new_conf.subkeys[lz_global_base64_url_decode($(this).attr('key'))] = lz_global_base64_url_decode($(this).text());
                });
                thisClass.global_configuration.site[index].push(new_conf);
            });
        });
        $(gl_c).children('php_cfg_vars').each(function () {
            thisClass.global_configuration.php_cfg_vars['post_max_size'] = lz_global_base64_url_decode($(this).attr('post_max_size'));
            thisClass.global_configuration.php_cfg_vars['upload_max_filesize'] = lz_global_base64_url_decode($(this).attr('upload_max_filesize'));
        });
        $(gl_c).children('translations').each(function() {
            var translations = $(this);
            thisClass.getTranslationLanguages(translations);
        });

        myHash = lz_global_base64_url_decode(gl_c.attr('h'));

        try {
            for (var i=0; i<thisClass.global_configuration.site[0].length; i++) {
                if (thisClass.global_configuration.site[0][i].key == 'gl_input_list') {
                    for (var key in thisClass.global_configuration.site[0][i].subkeys) {
                        if (thisClass.global_configuration.site[0][i].subkeys.hasOwnProperty(key)) {
                            var customInput = {id: key, value: thisClass.global_configuration.site[0][i].subkeys[key]};
                            thisClass.inputList.setCustomInput(customInput);
                        }
                    }
                }
            }
        } catch(e) {}

        thisClass.setConfigValues(thisClass.global_configuration);
        thisClass.setStartPages(thisClass.global_configuration);
        if (!thisClass.isRootServer && thisClass.maxOperatorNumber != null && thisClass.maxOperatorNumber != 0 &&
            parseInt(thisClass.oo) >= parseInt(thisClass.maxOperatorNumber)) {
            lzm_commonDialog.createAlertDialog(t('Maximum number of concurrent operators reached.'), [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
                logout(false);
            });
        }
    });

    return myHash;
};

ChatServerEvaluationClass.prototype.getTranslationLanguages = function(translations) {
    var that = this, derivedLanguages = [], origKeys = [];
    that.translationLanguages = [];
    $(translations).children('language').each(function() {
        var language = $(this);
        var langData = {};
        var myAttributes = language[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            langData[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        langData.blocked = (typeof langData.blocked != 'undefined') ? parseInt(langData.blocked) : 0;
        langData.derived = (typeof langData.derived != 'undefined') ? parseInt(langData.derived) : 0;
        langData.m = parseInt(langData.m);
        if (langData.derived == 1) {
            derivedLanguages.push(langData);
        } else {
            that.translationLanguages.push(langData);
            origKeys.push(langData.key + '~' + langData.m);
        }
    });
    for (var i=0; i<derivedLanguages.length; i++) {
        if($.inArray(derivedLanguages[i].key + '~' + derivedLanguages[i].m, origKeys) == -1) {
            that.translationLanguages.push(derivedLanguages[i]);
        }
    }
};

ChatServerEvaluationClass.prototype.setConfigValues = function(global_config) {
    var i = 0, key = '', startPages = '';
    for (i=0; i<global_config.toplevel.length; i++) {
        for (key in global_config.toplevel[i].subkeys) {
            if (global_config.toplevel[i].subkeys.hasOwnProperty(key)) {
                if (key == 'poll_frequency_clients') {
                    this.pollFrequency = global_config.toplevel[i].subkeys[key];
                }
                if (key == 'timeout_clients') {
                    this.timeoutClients = global_config.toplevel[i].subkeys[key];
                }
                if (key == 'gl_site_name') {
                    this.siteName = global_config.toplevel[i].subkeys[key];
                    if (!doBlinkTitle) {
                        $('title').html(this.siteName);
                    }
                }
                if (key == 'gl_default_language') {
                    this.defaultLanguage = global_config.toplevel[i].subkeys[key];
                }
                if (key == 'gl_root') {
                    this.isRootServer = (global_config.toplevel[i].subkeys[key] == 1);
                }
                if (key == 'gl_host') {
                    this.hostName = global_config.toplevel[i].subkeys[key];
                }
                if (this.maxOperatorNumber == null && key == 'ss_mnos') {
                    this.maxOperatorNumber = global_config.toplevel[i].subkeys[key];
                }
            }
        }
    }
    if (multiServerId == '' && !this.isRootServer && this.hostName != '') {
        multiServerId = lz_global_base64_url_encode(this.hostName);
    }
};

ChatServerEvaluationClass.prototype.setOtrs = function(globalConfig) {
    var otrsKey = '';
    for (i=0; i<globalConfig.toplevel.length; i++) {
        if (typeof globalConfig.toplevel[i].subkeys == 'object') {
            if (typeof globalConfig.toplevel[i].subkeys['gl_otrs'] != 'undefined') {
                otrsKey = globalConfig.toplevel[i].subkeys['gl_otrs'];
            }
        }
    }
    if (otrsKey == '') {
        try {
            for (var i=0; i<globalConfig.site[0].length; i++) {
                if (globalConfig.site[0][i].key == 'gl_otrs') {
                    otrsKey = globalConfig.site[0][i].value;
                }
            }
        } catch(e) {}
    }
    this.otrs = otrsKey;
    lzm_chatUserActions.getTranslationLanguages();
};

ChatServerEvaluationClass.prototype.setStartPages = function(global_config) {
    var i = 0, j = 0, oldStartPages = lzm_commonTools.clone(lzm_chatDisplay.startPages), lzStartPageChange = false, startPages = '';
    for (i=0; i<global_config.toplevel.length; i++) {
        if (typeof global_config.toplevel[i].subkeys == 'object') {
            if (typeof global_config.toplevel[i].subkeys['gl_usrsp'] != 'undefined') {
                startPages = global_config.toplevel[i].subkeys['gl_usrsp'];
            }
        }
    }
    if (startPages == '') {
        try {
            for (i=0; i<global_config.site[0].length; i++) {
                if (global_config.site[0][i].key == 'gl_usrsp') {
                    startPages = global_config.site[0][i].value;
                }
            }
        } catch(e) {}
    }
    if (startPages == '') {
        lzm_chatDisplay.startPages.show_lz = '1';
        lzm_chatDisplay.startPages.others = [];
    } else if (startPages.indexOf('|') == -1) {
        lzm_chatDisplay.startPages.show_lz = lz_global_base64_url_decode(startPages);
        lzm_chatDisplay.startPages.others = [];
    } else {
        var startPageArray = startPages.split('|');
        lzm_chatDisplay.startPages.show_lz = lz_global_base64_url_decode(startPageArray[startPageArray.length - 1]);
        lzm_chatDisplay.startPages.others = [];
        for (i=0; i<startPageArray.length-1; i++) {
            var thisPage = lz_global_base64_url_decode(startPageArray[i]).split('|');
            var thisPageHash = md5(lz_global_base64_url_decode(thisPage[0]) + lz_global_base64_url_decode(thisPage[1]) + lz_global_base64_url_decode(thisPage[2]));
            lzm_chatDisplay.startPages.others.push({url: lz_global_base64_url_decode(thisPage[0]),
                title: lz_global_base64_url_decode(thisPage[1]), get_param: lz_global_base64_url_decode(thisPage[2]),
                hash: thisPageHash});
        }
    }
    if (oldStartPages.show_lz != lzm_chatDisplay.startPages.show_lz) {
        lzStartPageChange = true;
    }
    var customPagesWereAdded = [];
    var customPagesWereRemoved = [];
    for (i=0; i<lzm_chatDisplay.startPages.others.length; i++) {
        var thisCustomPageHasChanged = i;
        for (j=0; j<oldStartPages.others.length; j++) {
            if (oldStartPages.others[j].hash == lzm_chatDisplay.startPages.others[i].hash) {
                thisCustomPageHasChanged = -1;
            }
        }
        if (thisCustomPageHasChanged != -1) {
            customPagesWereAdded.push(lzm_chatDisplay.startPages.others[thisCustomPageHasChanged]);
        }
    }
    for (i=0; i<oldStartPages.others.length; i++) {
        var thisCustomPageWasRemoved = i;
        for (j=0; j<lzm_chatDisplay.startPages.others.length; j++) {
            if (oldStartPages.others[i].hash == lzm_chatDisplay.startPages.others[j].hash) {
                thisCustomPageWasRemoved = -1;
            }
        }
        if (thisCustomPageWasRemoved != -1) {
            customPagesWereRemoved.push(oldStartPages.others[thisCustomPageWasRemoved]);
        }

    }
    lzStartPageChange = (this.new_startpage.lz) ? this.new_startpage.lz : lzStartPageChange;
    this.new_startpage = {lz: lzStartPageChange, ca: customPagesWereAdded, cr: customPagesWereRemoved};
};

ChatServerEvaluationClass.prototype.getGlobalTyping = function(xmlDoc) {
    var thisClass = this;
    var myHash = '', oldTypingIdList = [];

    $(xmlDoc).find('gl_typ').each(function () {
        thisClass.new_glt = true;
        oldTypingIdList = thisClass.globTypingIdList;
        thisClass.global_typing = [];
        thisClass.globTypingIdList = [];
        var gl_typ = $(this);
        $(gl_typ).find('v').each(function() {
            var thisGlTyp = {
                id: lz_global_base64_url_decode($(this).attr('id')),
                tp: lz_global_base64_url_decode($(this).attr('tp'))
            };
            thisClass.global_typing.push(thisGlTyp);
            thisClass.globTypingIdList.push(thisGlTyp.id);
            if (thisGlTyp.id.indexOf('~') != -1) {
                if ($.inArray(thisGlTyp.id, oldTypingIdList) == -1) {
                    thisClass.globalTypingChanges.push(thisGlTyp.id.split('~')[0]);
                }
            }
        });
        for (var i=0; i<oldTypingIdList.length; i++) {
            if (oldTypingIdList[i].indexOf('~') != -1) {
                if ($.inArray(oldTypingIdList[i], thisClass.globTypingIdList) == -1) {
                    thisClass.globalTypingChanges.push(oldTypingIdList[i].split('~')[0]);
                }
            }
        }

        myHash = lz_global_base64_url_decode(gl_typ.attr('h'));
    });

    return myHash;
};

ChatServerEvaluationClass.prototype.getGlobalErrors = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('gl_e').each(function () {
        thisClass.new_gl_e = true;
        var gl_e = $(this);
        thisClass.global_errors = [];
        $(gl_e).find('val').each(function () {
            var val = $(this);
            thisClass.global_errors.push(lz_global_base64_url_decode(val.attr('err')));
        });

        myHash = lz_global_base64_url_decode(gl_e.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.addLinks = function(myText) {
    var i, j, replacement;
    var webSites = myText.match(/(www\.|(http|https):\/\/)[.a-z0-9-]+\.[a-z0-9\/_:@=.+?,##%&~-]*[^.|'|# |!|\(|?|,| |>|<|;|\)]/gi);
    //var webSites = myText.match(/(www\.|(http|https):\/\/)[.a-z0-9-]+\.[a-z0-9\/_:@=.+?,##%&\[\]\{\}\(\)~-]*[^.|'|# |!|\(|?|,| |>|<|;|\)]/gi);
    var existingLinks = myText.match(/<a.*?href.*?>.*?<\/a>/gi);
    if (typeof webSites != 'undefined' && webSites != null) {
        for (i=0; i<webSites.length; i++) {
            var replaceLink = true;
            if (typeof existingLinks != 'undefined' && existingLinks != null) {
                for (j=0;j<existingLinks.length; j++) {
                    if (existingLinks[j].indexOf(webSites[i])) {
                        replaceLink = false;
                    }
                }
            }
            if (replaceLink) {
                if (webSites[i].toLowerCase().indexOf('http') != 0) {
                    replacement = '<a target="_blank" class="lz_chat_link" href="http://' + webSites[i] + '" data-url="http://' + webSites[i] + '">' + webSites[i] + '</a>';
                } else {
                    replacement = '<a target="_blank" class="lz_chat_link" href="' + webSites[i] + '" data-url="' + webSites[i] + '">' + webSites[i] + '</a>';
                }
                myText = myText.replace(webSites[i], replacement);
            }
        }
    }

    var mailAddresses = myText.match(/[\w\.-]{1,}@[\w\.-]{2,}\.\w{2,3}/gi);
    if (typeof mailAddresses != 'undefined' && mailAddresses != null) {
        for (i=0; i<mailAddresses.length; i++) {
            replacement = '<a target="_blank" class="lz_chat_mail" href="mailto:' + mailAddresses[i] + '" data-url="mailto:' + mailAddresses[i] + '">' + mailAddresses[i] + '</a>';
            myText = myText.replace(mailAddresses[i], replacement);
        }
    }
    if (myText.match(/<a.*?href=".*?".+?data\-url=".*?".+?>.*?<\/a>/i) != null) {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3"$4>$5</a>');
    } else if (myText.match(/<a.*?href=".*?".+?data\-url=".*?">.*?<\/a>/i) != null) {
        myText = myText.replace(/<a(.*?)href="(.*?)".*?data\-url="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$3" data-url="$3">$4</a>');
    }
    myText = myText.replace(/<a(.*?)href="(.*?)">(.*?)<\/a>/gi, '<a target="_blank"$1href="$2">$3</a>');
    myText = myText.replace(/<a(.*?)href="(.*?)"(.+?)>(.*?)<\/a>/gi, '<a target="_blank"$1href="$2"$3>$4</a>');
    myText = myText.replace(/(target="_blank" )+/gi, 'target="_blank" ');
    return myText;
};

ChatServerEvaluationClass.prototype.replaceLinks = function(myText) {
    var i, replacement;
    var links = myText.match(/<[aA].*?href.*?<\/[aA]>/);
    if (typeof links != 'undefined' && links != null) {
        for (i=0; i<links.length; i++) {
            var address, shownText;
            if (links[i].indexOf('mailto:') == -1) {
                address = links[i].match(/href=".*?"/);
                if (typeof address == 'undefined' || address == null) {
                    address = links[i].match(/href='.*?'/)[0].replace(/^href='/,'').replace(/'$/, '');
                } else {
                    address = address[0].replace(/^href="/,'').replace(/"$/, '');
                }
                address = address.replace(/ *$/,'').replace(/"*$/,'');
                shownText = links[i].match(/>.*?<\/[aA]>/);
                if (typeof shownText == 'undefined' || shownText == null) {
                    shownText = links[i].match(/href='.*?'/);
                }
                shownText = shownText[0].replace(/^>/,'').replace(/<\/[aA]>$/,'');
                if (links[i].indexOf('lz_chat_file') == -1) {
                    replacement = '<a data-role="none" class="lz_chat_link" href="#" onclick="openLink(\'' + address + '\')">' + shownText + '</a>';
                } else {
                    replacement = '<a data-role="none" class="lz_chat_file" href="#" onclick="downloadFile(\'' + address + '\')">' + shownText + '</a>';
                }
                if (address != '#') {
                    myText = myText.replace(links[i], replacement);
                }
            } else {
                var address2 = links[i].match(/href=".*?"/);
                var address1 = links[i].match(/href='.*?'/);
                var address0 = links[i].match(/href=.*? /);
                if ((typeof address2 == 'undefined' || address2 == null) && (typeof address1 == 'undefined' || address1 == null)) {
                    address = address0[0].replace(/^href=/,'').replace(/ $/, '');
                } else if (typeof address2 == 'undefined' || address2 == null) {
                    address = address1[0].replace(/^href='/,'').replace(/'$/, '');
                } else {
                    address = address2[0].replace(/^href="/,'').replace(/"$/, '');
                }
                address = address.replace(/ *$/,'').replace(/"*$/,'');
                shownText = links[i].match(/>.*?<\/[aA]>/);
                if (typeof shownText == 'undefined' || shownText == null) {
                    shownText = links[i].match(/href='.*?'/);
                }
                shownText = shownText[0].replace(/^>/,'').replace(/<\/[aA]>$/,'');
                replacement = '<a data-role="none" class="lz_chat_mail" href="#" onclick="openLink(\'' + address + '\')">' + shownText + '</a>';
                if (address != '#') {
                    myText = myText.replace(links[i], replacement);
                }
            }
        }
    }
    return myText;
};

ChatServerEvaluationClass.prototype.deletePropertyFromChatObject = function (propertyName) {
    this.userChats.removeUserChat(propertyName);
};

ChatServerEvaluationClass.prototype.getTranslationStrings = function(xmlDoc) {
    var that = this;
    $(xmlDoc).find('response').each(function() {
        var response = $(this);
        response.find('language').each(function() {
            var language = $(this);
            var key = lz_global_base64_url_decode(language.attr('key'));
            that.translationStrings.key = (key != 'orig') ? key : 'en';
            language.children('val').each(function() {
                var val = $(this);
                that.translationStrings.strings[lz_global_base64_url_decode(val.attr('key'))] = lz_global_base64_url_decode(val.text());
                that.new_trl = true;
            });
        });
    });
};

/**************************************** Vsitor and Forward functions ****************************************/
ChatServerEvaluationClass.prototype.getExternalForward = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('ext_f').each(function () {
        thisClass.new_ext_f = true;
        var ext_f = $(this);
        $(ext_f).find('fw').each(function () {
            var fw = $(this);
            var new_forward = {};
            var myAttributes = fw[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                new_forward[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            if ($.inArray(new_forward.id, thisClass.extForwardIdList) == -1) {
                thisClass.extForwardIdList.push(new_forward.id);
                thisClass.external_forwards.push(new_forward);

                var fwdByName = new_forward.i, fwdFromName = new_forward.s, fwdToName = new_forward.r;
                var operatorI = thisClass.operators.getOperator(new_forward.i);
                var operatorS = thisClass.operators.getOperator(new_forward.s);
                var operatorR = thisClass.operators.getOperator(new_forward.r);
                if (operatorI != null) {
                    fwdByName = operatorI.name;
                }
                if (operatorS != null) {
                    fwdFromName = operatorS.name;
                }
                if (operatorR != null) {
                    fwdToName = operatorR.name;
                }
                var extUserName = '';
                var visitorBrowser = thisClass.visitors.getVisitorBrowser(new_forward.u);
                if (visitorBrowser[0] != null && visitorBrowser[1] != null && visitorBrowser[1].chat.id != '') {
                    extUserName = (visitorBrowser[1].cname != '') ? visitorBrowser[1].cname : visitorBrowser[0].unique_name;
                    extUserName = lzm_commonTools.htmlEntities(extUserName);
                    extUserName = lzm_commonTools.htmlEntities(extUserName);

                    var chatText = '';
                    if (new_forward.inv == 0) {
                        chatText = t('<!--visitor_name--> was forwarded by <!--fwd_by_name--> from <!--fwd_from_name--> to <!--my_name-->.',
                            [['<!--visitor_name-->','<b>'+extUserName+'</b>'],['<!--fwd_by_name-->','<b>'+fwdByName+'</b>'],
                                ['<!--fwd_from_name-->','<b>'+fwdFromName+'</b>'],['<!--my_name-->','<b>'+fwdToName+'</b>']]);
                        if (new_forward.s == '') {
                            chatText = t('<!--visitor_name--> was forwarded by <!--fwd_by_name--> to <!--my_name-->.',
                                [['<!--visitor_name-->','<b>'+extUserName+'</b>'],['<!--fwd_by_name-->','<b>'+fwdByName+'</b>'],
                                    ['<!--fwd_from_name-->','<b>'+fwdFromName+'</b>'],['<!--my_name-->','<b>'+fwdToName+'</b>']]);
                        }
                    } else {
                        chatText = t('<!--inv_op_name--> was invited by <!--op_name--> to join the Chat.',
                            [['<!--inv_op_name-->', fwdToName], ['<!--op_name-->', fwdByName]]);
                    }
                    if (new_forward.t != '' && new_forward.r == thisClass.myId) {
                        chatText += ' ' + t(' Additional comment: <!--fwd_comment-->', [['<!--fwd_comment-->', '<b>' + new_forward.t + '</b>']]);
                    }
                    var new_chat = {};
                    new_chat.id = md5(String(Math.random())).substr(0, 32);
                    new_chat.rp = '';
                    new_chat.sen = '0000000';
                    new_chat.rec = '';
                    new_chat.reco = new_forward.u;
                    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject();
                    new_chat.date = lzm_chatTimeStamp.getServerTimeString(tmpdate, true);
                    new_chat.cmc = thisClass.chatMessageCounter++;
                    thisClass.chatMessageCounter++;
                    new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', thisClass.userLanguage);
                    new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', thisClass.userLanguage);
                    new_chat.text = chatText;

                    thisClass.userChats.setUserChatMessage(new_chat);

                    if (new_forward.inv == 1 && new_forward.r == thisClass.myId) {
                        showInvitedMessage(new_forward);
                    }
                }
            } else {
                for (var i = 0; i < thisClass.external_forwards.length; i++) {
                    for (var key in thisClass.external_forwards[i]) {
                        if (thisClass.external_forwards[i].hasOwnProperty(key)) {
                            if (new_forward[key] != '' && typeof new_forward[key] != 'undefined') {
                                thisClass.external_forwards[i][key] = new_forward[key];
                            }
                        }
                    }
                }
            }
            if (new_forward.r == thisClass.myId) {
                var chats = thisClass.userChats.getChatList();
                for (var chatIndex = 0; chatIndex < chats.length; chatIndex++) {
                    if (chats[chatIndex].sen == new_forward.u || chats[chatIndex].reco == new_forward.u) {
                        if (chats[chatIndex].sen != '0000000' &&
                            chats[chatIndex].sen != thisClass.myId &&
                            (chats[chatIndex].sen.indexOf('~') != -1)) {
                            if (thisClass.userChats.getUserChat(chats[chatIndex].sen) == null) {
                                thisClass.userChats.setUserChat(chats[chatIndex].sen, {status: 'new', type: 'external',
                                    id: chats[chatIndex].sen_id, b_id: chats[chatIndex].sen_b_id, group_chat: false});
                            }
                        }
                    }
                }
            }
        });
        myHash = lz_global_base64_url_decode(ext_f.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.getExternalUsers = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    var tmpExtUsers = [];
    var tmpExtUserIdList = [];
    thisClass.visitors.removeOldVisitors();
    $(xmlDoc).find('ext_u').each(function () {
        var ext_u = $(this);
        thisClass.new_ext_u = true;

        // Get the user data
        $(ext_u).find('v').each(function () {
            var v = $(this);
            thisClass.addExtUserV(v);
        });
        $(ext_u).find('cd').each(function () {
            var cd = $(this);
            thisClass.addExtUserCd(cd);
        });

        myHash = lz_global_base64_url_decode(ext_u.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.addExtUserCd = function (cd) {
    var thisClass = this;
    var cdId = lz_global_base64_url_decode(cd.attr('id'));
    var externalUserIndex = 0;
    var i = 0;
    var visitor = thisClass.visitors.getVisitor(cdId);

    var bdExists = false;
    $(cd).find('bd').each(function () {
        var bd = $(this);
        thisClass.addExtUserCdBd(bd, externalUserIndex, cdId);
        bdExists = bdExists || true;
    });

    var userIsActive = false;
    if (cdId == visitor.id && bdExists) {
        for (i = 0; i < visitor.b.length; i++) {
            userIsActive = userIsActive || visitor.b[i].is_active;
            if (thisClass.userChats.getUserChat(cdId + '~' + visitor.b[i].id) != null) {
                if (!visitor.b[i].is_active) {
                    markVisitorAsLeft(cdId, visitor.b[i].id);
                }
            }
        }
    }
    thisClass.visitors.setVisitorActiveState(cdId, userIsActive);
    if (!userIsActive) {
        var matchString = new RegExp('^' + cdId + '~');
        for (var sender in thisClass.userChats.getUserChatList()) {
            if (thisClass.userChats.getUserChatList().hasOwnProperty(sender)) {
                if (sender.match(matchString) != null) {
                    markVisitorAsLeft(sender.split('~')[0], sender.split('~')[1])
                }
            }
        }
        for (i=0; i<visitor.b.length; i++) {
            if (visitor.b[i].is_active) {
                thisClass.visitors.setBrowserActiveState(cdId, visitor.b[i].id, false);
                var historyLength = visitor.b[i].h2.length;
                thisClass.visitors.setBrowserHistoryTime2(cdId, visitor.b[i].id, historyLength - 1, lzm_chatTimeStamp.getServerTimeString());
            }
        }
    }
};

ChatServerEvaluationClass.prototype.addExtUserCdBd = function (bd, externalUserIndex, cdId) {
    var visitorIsActive = true;
    var bdId = lz_global_base64_url_decode(bd.attr('id'));
    var visitor = this.visitors.getVisitor(cdId);
    for (var i=0; i<visitor.b.length; i++) {
        if (visitor.b[i].id == bdId) {
            this.visitors.setBrowserActiveState(cdId, bdId, false);
            var historyLength = visitor.b[i].h2.length;
            this.visitors.setBrowserHistoryTime2(cdId, bdId, historyLength - 1, lzm_chatTimeStamp.getServerTimeString());
            if (this.userChats.getUserChat(cdId + '~' + bdId) != null) {
                markVisitorAsLeft(cdId, bdId);
                this.userChats.setUserChat(cdId + '~' + bdId, {status: 'left'});
            }
        }
    }
};

ChatServerEvaluationClass.prototype.addExtUserR = function(r) {
    var new_r = {};
    var myAttributes = r[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_r[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    new_r.text = lz_global_base64_url_decode(r.text());
    return new_r;
};

ChatServerEvaluationClass.prototype.addExtUserC = function(c) {
    var new_c = {};
    var myAttributes = c[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_c[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    new_c.text = lz_global_base64_url_decode(c.text());
    return new_c;
};

ChatServerEvaluationClass.prototype.addExtUserV = function (v) {
    var thisClass = this;
    var new_user = {}, userLangString = '', i = 0, j = 0;
    var md5Test = md5((new XMLSerializer()).serializeToString(v[0]).replace(/\r/g, '').replace(/\n/g, ''));
    var md5Empty = md5('<v id="' + v.attr('id') + '"></v>');
    var md5Empty2 = md5('<v id="' + v.attr('id') + '"/>');
    var md5Empty3 = md5('<v id="' + v.attr('id') + '" />');
    if (md5Test == md5Empty || md5Test == md5Empty2 || md5Test == md5Empty3) {
        leaveAllChatsOfVisitor(lz_global_base64_url_decode(v.attr('id')));
    } else  {
        new_user.md5 = md5Test;

        var bIndex;
        var myAttributes = v[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            new_user[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        if ((typeof new_user.ctryi2 == 'undefined' || new_user.ctryi2 == '') && (typeof new_user.lang != 'undefined' && new_user.lang != '')) {
            new_user.ctryi2 = new_user.lang;
        }
        new_user.b_id = '';
        if (typeof new_user.ip != 'undefined') {
            new_user.unique_name = t('Visitor <!--visitor_number-->',[['<!--visitor_number-->',thisClass.createUniqueName(new_user.id + new_user.ip)]]);
        }

        new_user.b = [];
        var b_idList = [];
        new_user.b_chat = {id: ''};
        new_user.is_active = true;
        $(v).find('b').each(function () {
            var b = $(this);

            var tmp_b = thisClass.addExtUserVB(b, new_user.id, new_user.unique_name);

            // Deprecated (but still used) old ext user b variant
            new_user.b_id = tmp_b.id;
            new_user.b_chat = tmp_b.chat;
            new_user.b.push(tmp_b);
            b_idList.push(tmp_b.id);
        });
        new_user.r = [];
        new_user.rIdList = [];
        $(v).find('r').each(function () {
            var r = $(this);
            var tmp_r = thisClass.addExtUserR(r);
            if ($.inArray(tmp_r.i, new_user.rIdList) == -1) {
                new_user.rIdList.push(tmp_r.i);
                new_user.r.push(tmp_r);
            } else {
                for (var rNo=0; rNo<new_user.r.length; rNo++) {
                    if (new_user.r[rNo].i == tmp_r.i) {
                        new_user.r[rNo] = tmp_r;
                    }
                }
            }
        });
        new_user.c = [];
        new_user.cIdList = [];
        $(v).find('c').each(function () {
            var c = $(this);
            var tmp_c = thisClass.addExtUserC(c);
            if ($.inArray(tmp_c.id, new_user.cIdList) == -1) {
                new_user.cIdList.push(tmp_c.id);
                new_user.c.push(tmp_c);
            } else {
                for (var cNo=0; cNo<new_user.c.length; cNo++) {
                    if (new_user.c[cNo].id == tmp_c.id) {
                        new_user.c[cNo] = tmp_c;
                    }
                }
            }
        });
        new_user.rv = [];
        new_user.rvIdList = [];
        $(v).find('rv').each(function() {
            var rv = $(this), myAttributes = rv[0].attributes, new_rv = {};
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                new_rv[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            new_rv.b = [];
            $(rv).find('b').each(function() {
                var rv_b = $(this);
                var tmpRvB = thisClass.addExtUserVB(rv_b, new_user.id, new_user.unique_name, true);
                new_rv.b.push(tmpRvB);
            });
            new_rv.id = (typeof new_rv.id != 'undefined') ? new_rv.id : new_rv.vi;
            new_rv.e = (typeof new_rv.e != 'undefined') ? new_rv.e : new_rv.b[0].h2[0].time;
            new_user.rv.push(new_rv);
            new_user.rvIdList.push(new_rv.id);
        });
        var externalUserId = new_user.id;

        var visitor = thisClass.visitors.setVisitor(new_user);
        var thisUserChat = null;
        if (visitor != null && visitor.b.length > 0) {
            for (i=0; i<visitor.b.length; i++) {
                thisUserChat = thisClass.userChats.getUserChat(visitor.id + '~' + visitor.b[i].id);
                // Create userChat entry for visitor/browser, add chat info block and auto accept, if set in options
                try {
                    if (typeof visitor.b[i].chat != 'undefined' && visitor.b[i].chat.id != '') {
                        var chatNotDeclined = true;
                        for (j=0; j<visitor.b[i].chat.pn.member.length; j++) {
                            if (visitor.b[i].chat.pn.member[j].id == thisClass.myId && visitor.b[i].chat.pn.member[j].dec == 1) {
                                chatNotDeclined = false;
                            }
                        }
                        if ($.inArray(thisClass.myId, visitor.b[i].chat.pn.memberIdList) != -1 &&
                            chatNotDeclined) {
                                if (thisUserChat == null) {
                                    thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {status: 'new', type: 'external',
                                        id: visitor.id, b_id: visitor.b[i].id, group_chat: false, my_chat: true});
                                    try {
                                        thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id,
                                            {cmb: visitor.b[i].chat.cmb, phone: visitor.b[i].cphone});
                                    } catch (ex) {}
                                    thisClass.browserChatIdList.push(visitor.b[i].chat.id);
                                    if (visitor.b[i].chat.pn.acc == 1) {
                                        lzm_chatUserActions.acceptChat(visitor.id, visitor.b[i].id, visitor.b[i].chat.id,
                                            visitor.id + '~' + visitor.b[i].id, visitor.lang, false);
                                    }
                                } else if (!thisUserChat.my_chat) {
                                    thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {my_chat: true, status: 'new'});
                                    try {
                                        thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id,
                                            {cmb: visitor.b[i].chat.cmb, phone: visitor.b[i].cphone});
                                    } catch (ex) {}
                                    if (visitor.b[i].chat.pn.acc == 1) {
                                        lzm_chatUserActions.acceptChat(visitor.id, visitor.b[i].id, visitor.b[i].chat.id,
                                            visitor.id + '~' + visitor.b[i].id, visitor.lang, false);
                                    }
                                }
                                if ((visitor.b[i].chat.id == '' || $.inArray(visitor.b[i].chat.id, thisClass.browserChatIdList) != -1) && isAutoAcceptActive()) {
                                    lzm_chatUserActions.acceptChat(visitor.id, visitor.b[i].id, visitor.b[i].chat.id,
                                        visitor.id + '~' + visitor.b[i].id, visitor.lang);
                                }
                        } else {
                            if (thisUserChat == null) {
                                thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {status: 'new', type: 'external',
                                    id: visitor.id, b_id: visitor.b[i].id, group_chat: false, my_chat: false});
                                try {
                                    thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id,
                                        {cmb: visitor.b[i].chat.cmb, phone: visitor.b[i].cphone});
                                } catch (ex) {}
                                thisClass.browserChatIdList.push(visitor.b[i].chat.id);
                            }
                        }
                    }
                } catch(e) {}
                // Add chat_id to userChat entry for visitor/browser
                try {
                    if (typeof visitor.b[i].chat != 'undefined' && visitor.b[i].chat.id != '') {
                        if (thisUserChat != null) {
                            thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {chat_id: visitor.b[i].chat.id});
                        }
                    }
                } catch(e) {}
                // Remove visitor/browser from open chat, add op has left messages or add op has joined messages
                try {
                    if (thisUserChat != null && thisUserChat.my_chat && typeof visitor.b[i].chat.pn != 'undefined' &&
                        visitor.b[i].chat.pn.acc == 1) {
                        var newChatMembers = [];
                        for (j=0; j<visitor.b[i].chat.pn.member.length; j++) {
                            if (visitor.b[i].chat.pn.member[j].id != thisClass.myId && visitor.b[i].chat.pn.member[j].st == 0) {
                                removeFromOpenChats(visitor.id + '~' + visitor.b[i].id, true, true, visitor.b[i].chat.pn.member, 'addExtUserV');
                                break;
                            } else if (visitor.b[i].chat.pn.member[j].id == thisClass.myId && visitor.b[i].chat.pn.member[j].st == 0) {
                                addOpLeftMessageToChat(visitor.id + '~' + visitor.b[i].id, visitor.b[i].chat.pn.oldMember, visitor.b[i].chat.pn.memberIdList);
                            } else if ($.inArray(visitor.b[i].chat.pn.member[j].id, visitor.b[i].chat.pn.oldMemberIdList) == -1 &&
                                visitor.b[i].chat.pn.member[j].st != 2 && visitor.b[i].chat.pn.member[j].id != thisClass.myId) {
                                newChatMembers.push(visitor.b[i].chat.pn.member[j].id);
                            }
                        }
                        if (newChatMembers.length > 0) {
                            addOpJoinedMessageToChat(visitor.id + '~' + visitor.b[i].id, newChatMembers, visitor.b[i].chat.pn.oldMemberIdList);
                        }
                    }
                } catch(e) {}
                // Add chatPartners object for visitor/browser, add declined message to chat
                try {
                    if (typeof visitor.b[i].chat.pn != 'undefined' && typeof visitor.b[i].chat.pn.member != 'undefined' &&
                        (typeof visitor.b[i].chat.pn.memberIdList != 'undefined' && $.inArray(thisClass.myId, visitor.b[i].chat.pn.memberIdList) != -1)) {
                            if (typeof thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id] == 'undefined') {
                                thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id] = {past: [], present: []};
                            }
                            thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].past = thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].present;
                            thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].present = [];
                            var tmpPast = [];
                            for (j=0; j<visitor.b[i].chat.pn.member.length; j++) {
                                if ($.inArray(visitor.b[i].chat.pn.member[j].id, thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].past) != -1) {
                                    tmpPast.push(visitor.b[i].chat.pn.member[j].id);
                                }
                                if (visitor.b[i].chat.pn.member[j].dec == 0) {
                                    thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].present.push(visitor.b[i].chat.pn.member[j].id);
                                }
                            }
                            thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id].past = tmpPast;
                            addDeclinedMessageToChat(visitor.id , visitor.b[i].id, thisClass.chatPartners[visitor.id + '~' + visitor.b[i].id]);
                    }
                } catch(e) {}
            }
            for (i=0; i<visitor.b.length; i++) {
                thisUserChat = thisClass.userChats.getUserChat(visitor.id + '~' + visitor.b[i].id);
                try {
                    if (thisUserChat != null) {
                        // Add question to userChat entry
                        if (typeof visitor.b[i].chat != 'undefined' && typeof visitor.b[i].chat.eq != 'undefined') {
                            thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {eq: visitor.b[i].chat.eq});
                        }
                        // Add name to userChat entry
                        if (typeof visitor.b[i].cname != 'undefined') {
                            thisClass.userChats.setUserChat(visitor.id + '~' + visitor.b[i].id, {sender_name: visitor.b[i].cname});
                        }
                        // Mark visitor as left in chat
                        if ((visitor.b[i].chat == 'undefined' || visitor.b[i].chat.id == '') &&
                            thisUserChat.status != 'left') {
                                markVisitorAsLeft(visitor.id, visitor.b[i].id);
                        }
                    }
                } catch(e) {}
            }
            for (i=0; i<visitor.b.length; i++) {
                thisUserChat = thisClass.userChats.getUserChat(visitor.id + '~' + visitor.b[i].id);
                // Mark visitor as back
                try {
                    if (visitor.b[i].chat.id != '' && $.inArray(visitor.b[i].chat.id, thisClass.browserChatIdList) == -1 &&
                        thisUserChat != null) {
                            var member = [];
                            if (typeof visitor.b[i].chat.pn != 'undefined') {
                                member = visitor.b[i].chat.pn.member;
                            }
                            markVisitorAsBack(visitor.id, visitor.b[i].id, visitor.b[i].chat.id, member);
                    }
                } catch(e) {}
                // Mark visitor as left
                try {
                    if ($.inArray(visitor.id + '~' + visitor.b[i].id, thisClass.globTypingIdList) == -1 &&
                        thisUserChat != null &&
                        thisUserChat.status != 'left') {
                            markVisitorAsLeft(visitor.id, visitor.b[i].id);
                    }
                } catch(e) {}
            }
        }
    }
};

ChatServerEvaluationClass.prototype.addExtUserVB = function (b, id, unique_name, readOnlyH) {
    var thisClass = this;
    var new_b = {};
    var myAttributes = b[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_b[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    new_b.h2 = [];
    new_b.fupr = {};
    new_b.is_active = true;
    new_b.chat = {id: ''};
    $(b).find('h').each(function () {
        var h = $(this);
        var newH = thisClass.addExtUserVBH(h);
        if (newH.url != '') {
            new_b.h2.push(newH);
        }
    });
    if (typeof readOnlyH == 'undefined' || !readOnlyH) {
        $(b).find('chat').each(function () {
            var chat = $(this);
            new_b.chat = thisClass.addExtUserVBChat(chat, id, new_b.id);
        });
        $(b).find('fupr').each(function () {
            var fupr = $(this);
            var name = (new_b.cname != '') ? new_b.cname : unique_name;
            thisClass.addExtUserVBFupr(fupr, id, new_b.id, name, new_b.chat.id);
        });
    }
    return new_b;
};

ChatServerEvaluationClass.prototype.addExtUserVBChat = function (chat, id, b_id) {
    var new_chat = {};
    var myAttributes = chat[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_chat[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    new_chat.pn = {acc: '', member: {}};
    new_chat.cf = {};

    $(chat).find('pn').each(function () {
        new_chat.pn.acc = lz_global_base64_url_decode($(this).attr('acc'));
        new_chat.pn.member = [];
        new_chat.pn.memberIdList = [];

        $(this).find('member').each(function () {
            var myAttributes = $(this)[0].attributes;
            var new_member = {};
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                new_member[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            new_chat.pn.member.push(new_member);
            new_chat.pn.memberIdList.push(new_member.id);
        });
    });
    $(chat).find('cf').each(function () {
        new_chat.cf[lz_global_base64_url_decode($(this).attr('index'))] = lz_global_base64_url_decode($(this).text());
    });
    return new_chat;
};

ChatServerEvaluationClass.prototype.addExtUserVBFupr = function (fupr, id, b_id, name, chat_id) {
    var new_fupr = {};
    var myAttributes = fupr[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_fupr[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }

    var fuprIndex = $.inArray(new_fupr.id, this.fuprIdList);
    var date = lzm_chatTimeStamp.getServerTimeString(null, true);
    var tmpdate = lzm_chatTimeStamp.getLocalTimeObject(date, true);

    var new_chat;
    var fuprName = this.lzm_commonTools.htmlEntities(new_fupr.fn);
    if (fuprIndex == -1) {
        this.fuprs.push(new_fupr);
        this.fuprIdList.push(new_fupr.id);
        new_chat = {id: md5(String(Math.random())).substr(0, 32),
            date: date,
            cmc: this.chatMessageCounter,
            date_human: this.lzm_commonTools.getHumanDate(tmpdate, 'date', this.userLanguage),
            time_human: this.lzm_commonTools.getHumanDate(tmpdate, 'time', this.userLanguage),
            rec: '', rp: '', sen: '0000000',
            text: t('The visitor requested to upload the file <!--request_upload_this-->.',
                [['<!--request_upload_this-->','<b>' + this.lzm_commonTools.htmlEntities(new_fupr.fn) + '</b>']]) + '<br>' +
                t('Do you want to allow this?') + '&nbsp;&nbsp;&nbsp;'+
                '<a class="lz_chat_accept" href="#" id="allow-upload" ' +
                'onclick="handleUploadRequest(\'' + new_fupr.id + '\', \''+ fuprName +'\', \''+ id +'\', \''+ b_id +'\', \'allow\', \'' + chat_id + '\')">' +
                t('Accept') + '</a>&nbsp;&nbsp;&nbsp;&nbsp;' +
                '<a class="lz_chat_decline" href="#" id="deny-upload" ' +
                'onclick="handleUploadRequest(\'' + new_fupr.id + '\', \''+ fuprName +'\', \''+ id +'\', \''+ b_id +'\', \'deny\', \'' + chat_id + '\')">' +
                t('Decline') + '</a>',
            reco: id + '~' + b_id};
        this.chatMessageCounter++;
        this.userChats.setUserChatMessage(new_chat);
        if (lzm_chatDisplay.selected_view != 'mychats' || lzm_chatDisplay.active_chat_reco != new_chat.reco) {
            this.userChats.setUserChat(new_chat.reco, {status: 'new'});
        }
    } else {
        this.fuprs[fuprIndex] = new_fupr;
        if (typeof new_fupr.download != 'undefined' && new_fupr.download == '1' &&
            $.inArray(new_fupr.id, this.fuprDownloadIdList) == -1) {
            this.fuprDownloadIdList.push(new_fupr.id);
            var downloadLink = '<a class="lz_chat_file" target="_blank" href="' + this.serverProtocol + this.serverUrl + '/getfile.php?';
            if (multiServerId != '') {
                downloadLink += 'ws=' + multiServerId + '&';
            }
            downloadLink += 'acid=' + this.lzm_commonTools.pad(Math.floor(Math.random() * 1048575).toString(16), 5) +
                '&id=' + new_fupr.fid + '">';
            new_chat = {id: md5(String(Math.random())).substr(0, 32),
                date: date,
                cmc: this.chatMessageCounter,
                date_human: this.lzm_commonTools.getHumanDate(tmpdate, 'date', this.userLanguage),
                time_human: this.lzm_commonTools.getHumanDate(tmpdate, 'time', this.userLanguage),
                rec: '', rp: '', sen: '0000000',
                text: t('You can download the file <!--download_file_name--> provided by the visitor <!--download_link_begin-->here<!--download_link_end-->.',
                        [['<!--download_file_name-->','<b>' + fuprName + '</b>'],
                            ['<!--download_link_begin-->',downloadLink],['<!--download_link_end-->','</a>']]),
                reco: id + '~' + b_id};
            this.chatMessageCounter++;
            this.userChats.setUserChatMessage(new_chat);
            if (lzm_chatDisplay.selected_view != 'mychats' || lzm_chatDisplay.active_chat_reco != new_chat.reco) {
                this.userChats.setUserChat(new_chat.reco, {status: 'new'});
            }
        }
    }
};

ChatServerEvaluationClass.prototype.addExtUserVBH = function (h) {
    var new_h = {};
    var myAttributes = h[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_h[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return new_h;
};

ChatServerEvaluationClass.prototype.createUniqueName = function(idString) {
    var mod = 111;
    var digit;
    for (var i=0; i<idString.length; i++) {
        digit = 0;
        if (!isNaN(parseInt(idString.substr(i,1)))) {
            digit = parseInt(idString.substr(i,1));
            mod = (mod + (mod* (16+digit)) % 1000);
            if (mod % 10 == 0) {
                mod += 1;
            }
        }
    }
    var result = String(mod).substr(String(mod).length-4,4);
    return result;
};

/**************************************** Resource, Report, Chat archive, Filter and Event functions ****************************************/
ChatServerEvaluationClass.prototype.getChats = function (xmlDoc) {
    var thisClass = this;
    var chatReturn = {dut: ''};
    $(xmlDoc).find('ext_c').each(function () {
        var ext_c = $(this);
        $(ext_c).children('dc').each(function () {
            thisClass.chatArchive = {chats: [], q: '', p: 20, t: 0};
            var myAttributes = $(this)[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                if (myAttributes[attrIndex].name == 'dut') {
                    chatReturn['dut'] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
                }
                thisClass.chatArchive[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            $(this).children('c').each(function () {
                var c = $(this);
                thisClass.chatArchive.chats.push(thisClass.addArchivedChat(c));
            });
            thisClass.new_dc = true;
            thisClass.expectArchiveChanges = false;
        });
    });
    if (thisClass.expectArchiveChanges) {
        thisClass.expectArchiveChanges = false;
    } else {
        thisClass.archiveFetchTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    }
    return chatReturn;
};

ChatServerEvaluationClass.prototype.addArchivedChat = function(c) {
    var thisClass= this;
    var new_c = {cc: []};
    var myAttributes = c[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_c[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    c.children('chtml').each(function() {
        new_c.chtml = lz_global_base64_url_decode($(this).text());//thisClass.replaceLinks(lz_global_base64_url_decode($(this).text()));
    });
    c.children('cplain').each(function() {
        new_c.cplain = lz_global_base64_url_decode($(this).text());
    });
    c.children('cc').each(function() {
        var new_cc = {cuid: lz_global_base64_url_decode($(this).attr('cuid')), text: lz_global_base64_url_decode($(this).text())};
        new_c.cc.push(new_cc);
    });
    return new_c;
};

ChatServerEvaluationClass.prototype.getResources = function (xmlDoc) {
    var thisClass = this;
    var publicFolder = {
        di: "0",
        ed: "0",
        eid: "0000000",
        oid: "0000000",
        pid: "0",
        ra: "0",
        rid: "1",
        si: "6",
        t: "",
        text: t('Public'),
        ti: t('Public'),
        ty: "0"
    };
    thisClass.cannedResources.setResource(publicFolder);
    $(xmlDoc).find('ext_res').each(function() {
        var ext_res = $(this);
        $(ext_res).find('r').each(function () {
            thisClass.new_qrd = true;
            var new_r = {};
            var myAttributes = $(this)[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                new_r[myAttributes[attrIndex].name] = lz_global_base64_decode(myAttributes[attrIndex].value);
            }
            new_r.text = lz_global_base64_decode($(this).text());
            var serializedXmlString = (new XMLSerializer()).serializeToString(this);
            new_r.md5 = md5(serializedXmlString);

            if (new_r.di == 0) {
                thisClass.cannedResources.setResource(new_r);
            }
            if (new_r.di != 0 && new_r.disc != 0) {
                thisClass.cannedResources.removeResource(new_r.rid);
            }

            var editedTime = (typeof new_r.ed != 'undefined') ? new_r.ed : 0;
            thisClass.resourceLastEdited = Math.max(thisClass.resourceLastEdited, editedTime);
        });
    });

    return thisClass.resourceLastEdited;
};

ChatServerEvaluationClass.prototype.getReports = function(xmlDoc) {
    var that = this, myDut = '';
    try {
    $(xmlDoc).find('dr').each(function() {
        var dr = $(this);
        that.reports.clearReports();
        $(dr).children('r').each(function() {
            var r = $(this);
            that.reports.setReport(that.addReport(r));
        });
        var reportGlobalValues = {};
        var myAttributes = dr[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            reportGlobalValues[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        that.reports.setTotal(reportGlobalValues.t);
        that.reports.setMatching(reportGlobalValues.q);
        that.reports.setReportsPerPage(reportGlobalValues.p);
        myDut = reportGlobalValues.dut;
        that.new_dr = true;
        that.expectReportChanges = false;
    });
    } catch(ex) {}
    if (that.expectReportChanges) {
        that.expectReportChanges = false;
    } else {
        that.reportFetchTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    }
    return myDut;
};

ChatServerEvaluationClass.prototype.addReport = function(r) {
    var that = this, newReport = {};
    var myAttributes = r[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newReport[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newReport;
};

ChatServerEvaluationClass.prototype.getFilters = function(xmlDoc) {
    var thisClass = this, myDut = '';
    var filterHash = '';
    $(xmlDoc).find('ext_b').each(function() {
        thisClass.new_ext_b = true;
        var ext_b = $(this);
        filterHash = lz_global_base64_url_decode(ext_b.attr('h'));
        thisClass.filters.clearFilters();
        var filterGlobalValues = {};
        ext_b.find('dfi').each(function() {
            var dfi = $(this);
            var myAttributes = dfi[0].attributes;
            for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
                filterGlobalValues[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
            }
            dfi.find('val').each(function() {
                var newFilter = thisClass.addFilter($(this));
                thisClass.filters.setFilter(newFilter);
             });
        });
        myDut = filterGlobalValues.dut;
    });
    return {hash: filterHash, dut: myDut};
};

ChatServerEvaluationClass.prototype.addFilter = function(val) {
    var newFilter = {};
    var myAttributes = val[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newFilter[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newFilter;
};

ChatServerEvaluationClass.prototype.getEvents = function(xmlDoc) {
    var thisClass = this;
    var myEventDut = '';
    $(xmlDoc).find('listen').each(function() {
        var listen = $(this);
        listen.children('ev').each(function() {
            thisClass.new_ev = true;
            var ev = $(this);
            myEventDut = lz_global_base64_url_decode(ev.attr('dut'));
        });
    });
    return {'event-dut': myEventDut};
};

/**************************************** Chat functions ****************************************/
ChatServerEvaluationClass.prototype.getUsrP = function (xmlDoc) {
    var thisClass = this;
    $(xmlDoc).find('usr_p').each(function () {
        thisClass.new_usr_p = true;
        var usr_p = $(this);
        $(usr_p).find('val').each(function () {
            var val = $(this);
            thisClass.addUsrP(val);
        });
    });
};

ChatServerEvaluationClass.prototype.addUsrP = function (val) {
    try {
        var thisClass = this;
        var new_chat = {};
        var myAttributes = val[0].attributes;
        for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
            new_chat[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
        }
        new_chat.cmc = thisClass.chatMessageCounter;
        thisClass.chatMessageCounter++;
        var tmpdate = lzm_chatTimeStamp.getLocalTimeObject(new_chat.date * 1000, true);
        new_chat.date_human = lzm_commonTools.getHumanDate(tmpdate, 'date', thisClass.userLanguage);
        new_chat.time_human = lzm_commonTools.getHumanDate(tmpdate, 'time', thisClass.userLanguage);
        new_chat.dateObject = {
            day: lzm_commonTools.pad(tmpdate.getDate(), 2),
            month: lzm_commonTools.pad((tmpdate.getMonth() + 1), 2),
            year: lzm_commonTools.pad(tmpdate.getFullYear() ,4)
        };
        if (new_chat.sen.indexOf('~') != -1) {
            new_chat.sen_id = new_chat.sen.split('~')[0];
            new_chat.sen_b_id = new_chat.sen.split('~')[1];
        } else {
            new_chat.sen_id = new_chat.sen;
            new_chat.sen_b_id = '';
        }
        if (new_chat.rec != '' && new_chat.rec != new_chat.sen && new_chat.rec != new_chat.reco) {
            new_chat.sen_id = new_chat.rec;
            new_chat.sen_b_id = '';
        }
        new_chat.text = lz_global_base64_url_decode(val.text());

        if ($.inArray(new_chat.id, thisClass.userChats.messageIdList) == -1) {
            this.userChats.setUserChatMessage(new_chat, true);
            var thisSen;
            if (new_chat.reco == thisClass.myId) {
                if (new_chat.sen != '0000000' && new_chat.sen != thisClass.myId) {
                    thisSen = new_chat.sen;
                    if (new_chat.rec != '' && new_chat.rec != new_chat.sen) {
                        thisSen = new_chat.rec;
                    }
                    if (thisClass.userChats.getUserChat(thisSen) == null) {
                        var dynGroup = thisClass.groups.getGroup(new_chat.rec);
                        if (new_chat.sen.indexOf('~') == -1 || dynGroup != null) {
                            thisClass.userChats.setUserChat(thisSen, {status: 'new', id: new_chat.sen_id, b_id: new_chat.sen_b_id, type: 'internal'});
                            if (dynGroup != null && typeof dynGroup.members != 'undefined') {
                                for (var i=0; i<dynGroup.members.length; i++) {
                                    if (dynGroup.members[i].i.indexOf('~') != -1 && thisClass.userChats.getUserChat(dynGroup.members[i]) != null) {
                                        thisClass.userChats.setUserChat(dynGroup.members[i].i, {group_chat: true});

                                    }
                                }
                            }
                        }
                    }
                    if (thisClass.userChats.getUserChat(thisSen) != null && !thisClass.userChats.getUserChat(thisSen).group_chat) {
                        if ((thisClass.settingsDialogue || new_chat.sen != thisClass.active_chat_reco ||
                            lzm_chatDisplay.selected_view != 'mychats') && new_chat.rp != 1) {
                            thisClass.userChats.setUserChat(thisSen, {status: 'new'});
                            if ($.inArray(new_chat.sen, lzm_chatUserActions.open_chats) == -1 &&
                                isAutoAcceptActive()) {
                                var chatId = '', chatLang = '';
                                var visitor = thisClass.visitors.getVisitor(new_chat.sen_id);
                                if (visitor != null) {
                                    for (var j=0; j<visitor.b.length; j++) {
                                        if (visitor.b[j].id == new_chat.sen_b_id) {
                                            chatId = visitor.b[j].chat.id;
                                        }
                                    }
                                    chatLang = visitor.lang;
                                    lzm_chatUserActions.acceptChat(new_chat.sen_id, new_chat.sen_b_id, chatId, new_chat.sen, chatLang);
                                }
                            }
                        }
                    }

                }
            }
            if (new_chat.reco == thisClass.myId && new_chat.rp != 1 && (thisClass.userChats.getUserChat(thisSen) != null || isAutoAcceptActive())) {
                playIncomingMessageSound(new_chat.sen, new_chat.rec, new_chat.id, new_chat.text);
            }
        }
        //logit('Push ' + new_chat.id + ' to rec_posts');
        thisClass.rec_posts.push(new_chat.id);
    } catch(e) {}
};

ChatServerEvaluationClass.prototype.setChatAccepted = function(objId, accepted) {
    var rtValue = '';
    if (!accepted) {
        try {
            this.userChats.removeUserChatProperty(objId, 'accepted');
            rtValue = objId + ' not accepted';
        } catch(e) {}
    } else {
        this.userChats.setUserChat(objId, {accepted: true});
        rtValue =  objId + ' accepted';
    }
    return rtValue;
};

/**************************************** Operator and group functions ****************************************/
ChatServerEvaluationClass.prototype.getDepartments = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('int_d').each(function () {
        var newGroupIdList = [];
        thisClass.new_int_d = true;
        thisClass.groups.clearGroups();
        var int_d = $(this);
        $(int_d).find('v').each(function () {
            try {
                var v = $(this);
                var newGroup = thisClass.commonEvaluation.addDepartment(v);
                thisClass.groups.setGroup(newGroup);
                newGroupIdList.push(newGroup.id);
            } catch(e) {}
        });

        myHash = lz_global_base64_url_decode(int_d.attr('h'));
        if (thisClass.oldGroupIdList.length != 0) {
            var removedGroupList = [], addedGroupList = [], i = 0, group, operator, visitor, visitorBrowser, userChat,
                visitorName = '';
            for (i=0; i<thisClass.oldGroupIdList.length; i++) {
                if ($.inArray(thisClass.oldGroupIdList[i], newGroupIdList) == -1) {
                    removedGroupList.push(thisClass.oldGroupIdList[i]);
                }
            }
            for (i=0; i<newGroupIdList.length; i++) {
                if ($.inArray(newGroupIdList[i], thisClass.oldGroupIdList) == -1) {
                    addedGroupList.push(newGroupIdList[i]);
                }
            }
            try {
            for (i=0; i<removedGroupList.length;i++) {
                group = thisClass.groups.getGroup(removedGroupList[i]);
                userChat = thisClass.userChats.getUserChat(removedGroupList[i]);
                if (userChat != null && userChat.status != 'left' && group != null && typeof group.members != 'undefined') {
                    for (var j=0; j<group.members.length; j++) {
                        operator = thisClass.operators.getOperator(group.members[j].i);
                        visitorBrowser = thisClass.visitors.getVisitorBrowser(group.members[j].i);
                        visitor = (visitorBrowser[0] != null) ? visitorBrowser[0] : thisClass.visitors.getVisitor(group.members[j].i.split('~')[0]);
                        visitorName = (visitorBrowser[1] != null && visitorName[1].cname != '') ? visitorBrowser[1].cname :
                            (visitor != null) ? visitor.unique_name : group.members[j].i;
                        if (operator != null) {
                            addLeftMessageToChat(group.id, operator.name , group.name);
                        }
                        if (visitor != null) {
                            addLeftMessageToChat(group.id, visitorName , group.name);
                        }
                    }
                    disableInternalChat(removedGroupList[i]);
                }
            }
            } catch(e) {}
            try {
            for (i=0; i<addedGroupList.length;i++) {
                group = thisClass.groups.getGroup(addedGroupList[i]);
                userChat = thisClass.userChats.getUserChat(addedGroupList[i]);
                var newDynGroupWithMe = thisClass.checkMyDynamicGroups(group);
                if (newDynGroupWithMe) {
                    if (userChat == null) {
                        thisClass.userChats.setUserChat(group.id,{group_chat: null, status: 'read', type: 'internal'});
                    } else {
                        thisClass.userChats.setUserChat(group.id,{status: 'read'});
                    }
                    addJoinedMessageToChat(group.id, thisClass.myName, group.name);
                }
            }
            } catch(e) {}
        }
        thisClass.oldGroupIdList = newGroupIdList;
    });

    return myHash;
};

ChatServerEvaluationClass.prototype.checkMyDynamicGroups = function(group) {
    var rtValue = false, meIsIn = false;
    if (group != null && typeof group.members != 'undefined') {
        for (var i=0; i<group.members.length; i++) {
            meIsIn = meIsIn || (group.members[i].i == this.myId);
        }
    }
    if (meIsIn && $.inArray(group.id, this.myDynamicGroups) == -1) {
        this.myDynamicGroups.push(group.id);
        rtValue = true;
    }
    return rtValue;
};

ChatServerEvaluationClass.prototype.getInternalUsers = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('int_r').each(function () {
        thisClass.new_int_u = true;
        thisClass.operators.clearOperators();
        var int_r = $(this);
        $(int_r).find('v').each(function () {
            var v = $(this);
            var newOperator = thisClass.commonEvaluation.addInternalUser(v);
            thisClass.operators.setOperator(newOperator);
            if (thisClass.myEmail == '' && newOperator.id == thisClass.myId) {
                thisClass.myEmail = newOperator.email;
            }
        });

        myHash = lz_global_base64_url_decode(int_r.attr('h'));
    });
    if (thisClass.otrs == null)
        thisClass.setOtrs(thisClass.global_configuration);
    return myHash;
};

ChatServerEvaluationClass.prototype.getIntWp = function (xmlDoc) {
    var thisClass = this;
    var myHash = '';
    $(xmlDoc).find('int_wp').each(function () {
        var int_wp = $(this);
        thisClass.wps = [];
        $(int_wp).find('v').each(function () {
            var v = $(this);
            thisClass.wps.push(thisClass.addWP(v));
        });

        myHash = lz_global_base64_url_decode(int_wp.attr('h'));
    });
    return myHash;
};

ChatServerEvaluationClass.prototype.addWP = function (v) {
    var new_wp = {};
    var myAttributes = v[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        new_wp[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value)
    }
    return new_wp;
};



/**************************************** Ticket functions ****************************************/
ChatServerEvaluationClass.prototype.getTickets = function(xmlDoc, maxRead) {
    var thisClass = this;
    var myHash = '', myTicketDut = '', myEmailDut = '';
    var tlmc = (typeof thisClass.ticketGlobalValues['tlmc'] != 'undefined' && thisClass.ticketGlobalValues['tlmc'] != '') ?
        thisClass.ticketGlobalValues['tlmc'] : 0;
    var elmc = (typeof thisClass.ticketGlobalValues['elmc'] != 'undefined' && thisClass.ticketGlobalValues['elmc'] != '') ?
        thisClass.ticketGlobalValues['elmc'] : 0;
    thisClass.ticketGlobalValues['updating'] = false;
    thisClass.ticketGlobalValues['no_update'] = false;
    thisClass.ticketGlobalValues['mr'] = maxRead;
    $(xmlDoc).find('dt').each(function () {
        thisClass.new_dt = true;
        var dt = $(this);
        $(dt).find('no_update').each(function() {
            thisClass.ticketGlobalValues['no_update'] = true;
        });
        var globValues = {
            q: lz_global_base64_url_decode(dt.attr('q')),
            r: lz_global_base64_url_decode(dt.attr('r')),
            t: lz_global_base64_url_decode(dt.attr('t')),
            p: lz_global_base64_url_decode(dt.attr('p')),
            lmn: lz_global_base64_url_decode(dt.attr('lmn')),
            lmt: lz_global_base64_url_decode(dt.attr('lmt'))
        };
        tlmc = (parseInt(lz_global_base64_url_decode(dt.attr('lmc'))) > tlmc) ? parseInt(lz_global_base64_url_decode(dt.attr('lmc'))) : tlmc;
        if (!thisClass.ticketGlobalValues['no_update']) {
            thisClass.tickets = [];
            $(dt).find('updating').each(function() {
                thisClass.ticketGlobalValues['updating'] = true;
            });
            thisClass.ticketGlobalValues['t'] = (globValues['t'] != '' || typeof thisClass.ticketGlobalValues['t'] == 'undefined') ?
                globValues['t'] : thisClass.ticketGlobalValues['t'];
            thisClass.ticketGlobalValues['r'] = (globValues['r'] != '' || typeof thisClass.ticketGlobalValues['r'] == 'undefined') ?
                globValues['r'] : thisClass.ticketGlobalValues['r'];
            thisClass.ticketGlobalValues['q'] = (globValues['q'] != '' || typeof thisClass.ticketGlobalValues['q'] == 'undefined') ?
                globValues['q'] : thisClass.ticketGlobalValues['q'];
            thisClass.ticketGlobalValues['p'] = (globValues['p'] != '' || typeof thisClass.ticketGlobalValues['p'] == 'undefined') ?
                globValues['p'] : thisClass.ticketGlobalValues['p'];
            thisClass.ticketGlobalValues['tlmn'] = (globValues['lmn'] != '' || typeof thisClass.ticketGlobalValues['tlmn'] == 'undefined') ?
                globValues['lmn'] : thisClass.ticketGlobalValues['tlmn'];
            thisClass.ticketGlobalValues['tlmt'] = (globValues['lmt'] != '' || typeof thisClass.ticketGlobalValues['tlmt'] == 'undefined') ?
                globValues['lmt'] : thisClass.ticketGlobalValues['tlmt'];
            $(dt).find('val').each(function () {
                var thisTicketHash = md5((new XMLSerializer()).serializeToString(this));
                var val = $(this);
                var thisTicket = thisClass.addTicket(val);
                thisTicket.md5 = thisTicketHash;

                thisClass.tickets.push(thisTicket);
            });
        }
        myHash = lz_global_base64_url_decode(dt.attr('h'));
        myTicketDut = lz_global_base64_url_decode(dt.attr('dut'));
        thisClass.ticketGlobalValues['h'] = myHash;
        thisClass.ticketGlobalValues['dut'] = myTicketDut;
        thisClass.expectTicketChanges = false;
    });
    $(xmlDoc).find('de').each(function () {
        thisClass.new_de = true;
        var de = $(this);
        thisClass.emails = [];
        $(de).find('e').each(function () {
            var e = $(this);
            thisClass.emails.push(thisClass.addEmail(e));
        });
        elmc = (parseInt(lz_global_base64_url_decode(de.attr('lmc'))) > elmc) ? parseInt(lz_global_base64_url_decode(de.attr('lmc'))) : elmc;
        myEmailDut = lz_global_base64_url_decode(de.attr('dut'));
        thisClass.emailCount = lz_global_base64_url_decode(de.attr('c'));
        var elmt = lz_global_base64_url_decode(de.attr('lmt'));
        var elmn = lz_global_base64_url_decode(de.attr('lmn'));
        thisClass.ticketGlobalValues['e'] = (thisClass.emailCount !== '') ? thisClass.emailCount : thisClass.ticketGlobalValues['e'];
        thisClass.ticketGlobalValues['elmn'] = (elmn != '' || typeof thisClass.ticketGlobalValues['elmn'] == 'undefined') ?
                elmn : thisClass.ticketGlobalValues['elmn'];
            thisClass.ticketGlobalValues['elmt'] = (elmt != '' || typeof thisClass.ticketGlobalValues['elmt'] == 'undefined') ?
                elmt : thisClass.ticketGlobalValues['elmt'];
        thisClass.emails.sort(lzm_commonTools.sortEmails);
    });
    thisClass.ticketGlobalValues['tlmc'] = tlmc;
    thisClass.ticketGlobalValues['elmc'] = elmc;
    if (thisClass.expectTicketChanges) {
        thisClass.expectTicketChanges = false;
    } else {
        thisClass.ticketFetchTime = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    }
    return {hash: myHash, 'ticket-dut': myTicketDut, 'email-dut': myEmailDut};
};

ChatServerEvaluationClass.prototype.addTicket = function(val) {
    var thisClass = this;
    var newTicket = {};
    var myAttributes = val[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newTicket[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newTicket.messages = [];
    $(val).find('m').each(function(){
        var m = $(this);
        newTicket.messages.push(thisClass.addTicketMessage(m));
    });
    newTicket.editor = false;
    $(val).find('cl').each(function() {
        var cl = $(this);
        newTicket.editor = thisClass.addTicketEditor(cl);
    });
    return newTicket;
};

ChatServerEvaluationClass.prototype.addEmail = function(e) {
    var thisClass = this;
    var newEmail = {text: '', attachment: []};
    var myAttributes = e[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newEmail[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    $(e).find('c').each(function() {
        newEmail.text = lz_global_base64_url_decode($(this).text());
    });
    $(e).find('a').each(function() {
        var a = $(this);
        newEmail.attachment.push(thisClass.addEmailAttachment(a));
    });

    return newEmail;
};

ChatServerEvaluationClass.prototype.addEmailAttachment = function (a) {
    var newAttachment = {};
    var myAttributes = a[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newAttachment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newAttachment.id = lz_global_base64_url_decode(a.text());
    return newAttachment;
};

ChatServerEvaluationClass.prototype.addTicketMessage = function(m) {
    var thisClass = this;
    var newMessage = {attachment: [], comment: [], customInput: []};
    var myAttributes = m[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newMessage[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }

    $(m).find('c').each(function() {
        var c = $(this);
        newMessage.customInput.push(thisClass.addTicketMessageCustomInput(c));
    });
    $(m).find('a').each(function() {
        var a = $(this);
        newMessage.attachment.push(thisClass.addTicketMessageAttachment(a));
    });
    $(m).find('co').each(function() {
        var co = $(this);
        newMessage.comment.push(thisClass.addTicketMessageComment(co));
    });
    return newMessage;
};

ChatServerEvaluationClass.prototype.addTicketMessageAttachment = function (a) {
    var newAttachment = {};
    var myAttributes = a[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newAttachment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newAttachment.n = lz_global_base64_url_decode(a.text());
    return newAttachment;
};

ChatServerEvaluationClass.prototype.addTicketMessageComment = function (co) {
    var newComment = {};
    var myAttributes = co[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newComment[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newComment.text = lz_global_base64_url_decode(co.text());
    return newComment;
};

ChatServerEvaluationClass.prototype.addTicketMessageCustomInput = function (c) {
    var newCustomInput = {};
    var myAttributes = c[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newCustomInput[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    newCustomInput.text = lz_global_base64_url_decode(c.text());
    return newCustomInput;
};

ChatServerEvaluationClass.prototype.addTicketEditor = function (cl) {
    var newEditor = {};
    var myAttributes = cl[0].attributes;
    for (var attrIndex = 0; attrIndex < myAttributes.length; attrIndex++) {
        newEditor[myAttributes[attrIndex].name] = lz_global_base64_url_decode(myAttributes[attrIndex].value);
    }
    return newEditor;
};
