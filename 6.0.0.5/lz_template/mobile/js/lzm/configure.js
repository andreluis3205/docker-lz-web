/****************************************************************************************
 * LiveZilla configure.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

// variables used or lzm class objects
var lzm_commonConfig = {};
var lzm_commonTools = {};
var lzm_commonDisplay = {};
var lzm_commonDialog = {};
var lzm_displayHelper = {};
var lzm_commonStorage = {};
var lzm_commonTranslation = {};

var appOs = '';
var localDbPrefix = '';
var loopCounter = 0;
var mode = '';

/*var console = {};
console.log = function(myString) {
    try {
        lzm_deviceInterface.jsLog(myString, 'log');
    } catch(ex) {}
};
console.info = function(myString) {
    try {
        lzm_deviceInterface.jsLog(myString, 'info');
    } catch(ex) {}
};
console.warn = function(myString) {
    try {
        lzm_deviceInterface.jsLog(myString, 'warn');
    } catch(ex) {}
};
console.error = function(myString) {
    try {
        lzm_deviceInterface.jsLog(myString, 'log');
    } catch(ex) {}
};*/

var windowsCallbackFunction = function (myCallbackString) {
    myCallbackString = myCallbackString.replace(/\n/g, '').replace(/\r/g, '');
    eval(myCallbackString);
};

var logit = function(myObject, myLevel) {
    var myError = (new Error).stack;
    var callerFile = '', callerLine = '';
    try {
        var callerInfo = myError.split('\n')[2].split('(')[1].split(')')[0].split(':');
        callerFile = callerInfo[0] + ':' + callerInfo[1];
        callerLine = callerInfo[2];
    } catch(e) {}
    try {
        console.log(myObject);
        console.log('at line ' + callerLine + ' in ' + callerFile);
    } catch(e) {}
};

var goBackToLogin = function() {
    window.location.href = "./index.html";
};

var t = function(myString, replacementArray) {
    return lzm_commonTranslation.translate(myString, replacementArray);
};

var newProfileOnclickAction = function() {
    createProfileForm('add', null);
};

var editProfileOnclickAction = function() {
    var dataSet = lzm_commonStorage.getProfileByIndex($('#server_profile_selection').val());
    var tmpEditUrl = combineUrl(dataSet.server_protocol, dataSet.server_url, dataSet.server_port);
    var saveLogin = (dataSet.login_name != '' || dataSet.login_passwd != '');
    var profileData = {index: dataSet.index, name: dataSet.server_profile, serverurl: tmpEditUrl, mobiledir: dataSet.mobile_dir,
        savelogin: saveLogin, username: dataSet.login_name, password: dataSet.login_passwd};
    createProfileForm('edit', profileData);
};

var delProfileOnclickAction = function() {
    lzm_commonStorage.deleteProfile($('#server_profile_selection').val());
    lzm_commonStorage.saveValue('last_chosen_profile', -1);
    createConfigurationForm(-1, 'empty');
};

var createConfigurationForm = function(selectedIndex, configFormMode) {
    var profileSelectList = [{value: -1, text: t('No profile selected')}];
    selectedIndex = (typeof selectedIndex != 'undefined') ? selectedIndex : -1;
    var storageData = lzm_commonTools.clone(lzm_commonStorage.storageData);
    storageData.sort(lzm_commonDisplay.sortProfiles);
    for (var i=0; i<storageData.length; i++) {
        profileSelectList.push({value: storageData[i].index, text: storageData[i].server_profile});
    }

    var profileData = null;
    var configureForm = '<div id="profile-selection-div">' +
        lzm_displayHelper.createSelect('server_profile_selection', '', '', true, {position: 'right', gap: '0px'},
            {width: '120px'}, '', profileSelectList, selectedIndex) +
        '</div>' +
        '<div id="configure-buttons-div">' +
        '<span style="padding: 16px 2px;" onclick="newProfileOnclickAction();">' +
        lzm_displayHelper.createButton('new_profile_btn', '', '', '', '<i class="fa fa-plus"></i>', 'lr',
            {'padding-left': '15px', 'padding-right': '15px'}, '', 'c') +
        '</span><span style="padding: 16px 2px;" onclick="editProfileOnclickAction();">' +
        lzm_displayHelper.createButton('edit_profile_btn', 'change-config ui-disabled', '', '', '<i class="fa fa-gear"></i>', 'lr',
            {'padding-left': '15px', 'padding-right': '15px'}, '', 'c') +
        '</span><span style="padding: 16px 2px;" onclick="delProfileOnclickAction();">' +
        lzm_displayHelper.createButton('del_profile_btn', 'change-config ui-disabled', 'delProfileOnclickAction();', '', '<i class="fa fa-minus"></i>', 'lr',
            {'padding-left': '15px', 'padding-right': '15px'}, '', 'c') +
        '</span>' +
        '</div>' +
        '<hr id="configure-section-divide"/>' +
        '<div id="profile-configuration-div" data-type="empty"></div>' +
        '<div id="configure-close-buttons-div">' +
        lzm_displayHelper.createButton('save_profile', '', '', t('Save profile'), '', 'lr', {display: 'none'}, '', 'c') +
        lzm_displayHelper.createButton('back_btn', '', '', t('Ok'), '', 'lr', {}, '', 'c') +
        '</div>';

    if (selectedIndex != -1) {
        profileData = null;//lzm_commonStorage.storageData
    }
    createProfileForm(configFormMode, profileData);
    $('#configure-form').html(configureForm).trigger('create');
    lzm_displayLayout.resizeConfigureContainer();

    $('#back_btn').click(function () {
        goBackToLogin();
    });

    $('#clear_btn').click(function() {
        lzm_commonStorage.clearLocalStorage();
    });

    $('#server_profile_selection').change(function () {
        if ($(this).val() != -1) {
            $('.change-config').removeClass('ui-disabled');
            var dataSet = lzm_commonStorage.getProfileByIndex($('#server_profile_selection').val());
            $('#server_profile_selection-inner-text').html(dataSet.server_profile);
        } else {
            $('.change-config').addClass('ui-disabled');
            $('#server_profile_selection-inner-text').html(t('No profile selected'));
        }
        createProfileForm('empty', null);
    });

    $('.data-input').change(function() {
        unsafed_data = true;
    });

    $('#save_profile').click(function () {
        var dataSet = null, safedIndex = null;
        dataSet = {};
        dataSet.index = $('#profile-index').val();
        dataSet.server_profile = $('#profile-name').val();

        var myNewUrlParts = parseUrl($('#server-url').val());
        dataSet.server_url = myNewUrlParts.server_url;
        dataSet.mobile_dir = $('#mobile-directory').val().replace(/^\//, '').replace(/\/$/, '');
        dataSet.server_protocol = myNewUrlParts.server_protocol;
        dataSet.server_port = myNewUrlParts.server_port;

        dataSet.lz_version = lzm_commonConfig.lz_version;
        if ($('#save-login').prop('checked')) {
            dataSet.login_name = $('#username').val();
            dataSet.login_passwd = $('#password').val();
        } else {
            dataSet.login_name = '';
            dataSet.login_passwd = '';
        }

        try {
            safedIndex = lzm_commonStorage.saveProfile(dataSet);
            lzm_commonStorage.saveValue('last_chosen_profile', safedIndex);
        } catch(ex) {}
        goBackToLogin();
    });
};

var createProfileForm = function(type, profileData) {
    $('#profile-configuration-div').data('type', type);
    var profileForm = '';
    if (type != 'empty') {
        var profileIndex = (profileData != null && typeof profileData.index != 'undefined') ? profileData.index : -1;
        var profileName = (profileData != null && typeof profileData.name != 'undefined') ? profileData.name : '';
        var profileServerUrl = (profileData != null && typeof profileData.serverurl != 'undefined') ? profileData.serverurl : '';
        var profileMobileDir = (profileData != null && typeof profileData.mobiledir != 'undefined') ? profileData.mobiledir : 'mobile';
        var profileUserName = (profileData != null && typeof profileData.username != 'undefined' && typeof profileData.savelogin != 'undefined' &&
            profileData.savelogin) ? profileData.username : '';
        var profilePassword = (profileData != null && typeof profileData.password != 'undefined' && typeof profileData.savelogin != 'undefined' &&
            profileData.savelogin) ? profileData.password : '';
        var profileSaveLoginData = (profileData != null && typeof profileData.savelogin != 'undefined' && profileData.savelogin) ? ' checked="checked"' : '';
        var loginDataClass = (profileData != null && typeof profileData.savelogin != 'undefined' && profileData.savelogin) ? 'login-data' : 'ui-disabled login-data';
        profileForm = lzm_displayHelper.createInput('profile-name', '', profileName, t('Profile Name'), '', 'text', 'a') +
            lzm_displayHelper.createInput('server-url', '', profileServerUrl, t('Server Url'), '', 'text', 'a') +
            lzm_displayHelper.createInput('mobile-directory', '', profileMobileDir, t('Mobile Directory'), '', 'text', 'a') +
            '<div id="configure-checkbox-div"><input type="checkbox" id="save-login"' + profileSaveLoginData +
            ' value="1" style="margin-left: 0px; vertical-align: middle;" />' +
            '<label id="save-login-text" for="save-login" style="padding-left: 5px;">' + t('Save login data') + '</label></div>' +
            lzm_displayHelper.createInput('username', loginDataClass, profileUserName, t('Username'), '<i class="fa fa-user"></i>', 'text', 'a') +
            lzm_displayHelper.createInput('password', loginDataClass, profilePassword, t('Password'), '<i class="fa fa-lock"></i>', 'password', 'a') +
            '<input type="hidden" id="profile-index" value="' + profileIndex + '" />';
    }

    $('#profile-configuration-div').html(profileForm).trigger('create');
    $('#save-login').click(function () {
        if ($(this).prop('checked')) {
            $('.login-data').removeClass('ui-disabled');
        } else {
            $('.login-data').addClass('ui-disabled');
        }
    });
    lzm_displayLayout.resizeConfigureContainer();
};

var parseUrl = function(tmpUrl) {
    var returnObject = {};
    if (tmpUrl.indexOf('://') == -1) {
        tmpUrl = 'http://' + tmpUrl;
    }
    var urlParts = tmpUrl.split('://');
    returnObject.server_protocol = urlParts[0] + '://';
    if (returnObject.server_protocol == 'https://') {
        returnObject.server_port = '443';
    } else {
        returnObject.server_port = '80';
    }
    tmpUrl = urlParts[1];
    if (tmpUrl.indexOf(':') != -1) {
        urlParts = tmpUrl.split(':');
        returnObject.server_url = urlParts[0];
        tmpUrl = urlParts[1];
        if (tmpUrl.indexOf('/') != -1) {
            urlParts = tmpUrl.split('/');
            returnObject.server_port = urlParts[0];
            for (var i=1; i<urlParts.length; i++) {
                returnObject.server_url += '/' + urlParts[i];
            }
        } else {
            returnObject.server_port = tmpUrl;
        }
    } else {
        returnObject.server_url = tmpUrl;
    }
    return returnObject;
};

var combineUrl = function(protocol, url, port) {
    var combinedUrl = protocol;
    if (url.indexOf('/') != -1) {
        var urlParts = url.split('/');
        combinedUrl += urlParts[0];
        if ((protocol == 'http://' && port != '80') || (protocol == 'https://' && port != '443')) {
            combinedUrl += ':' + port;
        }
        for (var i=1; i<urlParts.length; i++) {
            combinedUrl += '/' + urlParts[i];
        }
    } else {
        combinedUrl += url;
        if ((protocol == 'http://' && port != '80') || (protocol == 'https://' && port != '443')) {
            combinedUrl += ':' + port;
        }
    }
    return combinedUrl;
};

var finishLoadingWithProfileData = function() {
    var selectedIndex = (typeof lzm_commonStorage.loadValue('last_chosen_session') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != null) ?
        lzm_commonStorage.loadValue('last_chosen_profile') : -1;
    var chosenProfile = null;
    if (selectedIndex != -1) {
        chosenProfile = lzm_commonStorage.getProfileByIndex(selectedIndex);
    }

    lzm_commonDisplay = new CommonDisplayClass(true);
    lzm_commonDialog = new CommonDialogClass();
    lzm_displayHelper = new CommonDisplayHelperClass(appOs);
    lzm_inputControls = new CommonInputControlsClass();
    lzm_displayLayout = new CommonDisplayLayoutClass();

    if (chosenProfile != null) {
        lzm_commonTranslation = new CommonTranslationClass('', '', '', true, chosenProfile.language);
    } else {
        lzm_commonTranslation = new CommonTranslationClass('', '', '', true, detectedLanguage);
    }
    lzm_commonTranslation.setTranslationData(translationData);

    var configFormMode = ($('#profile-configuration-div').length > 0) ? $('#profile-configuration-div').data('type') : 'empty';
    createConfigurationForm(selectedIndex, configFormMode);

    // read the url of this file and split it into the protocol and the base url of this installation
    var thisUrlParts = lzm_commonTools.getUrlParts();
    var thisUrl = thisUrlParts.urlBase + thisUrlParts.urlRest;


    var unsafed_data = false;


    if (selectedIndex != -1 && selectedIndex !== '') {
        $('.change-config').removeClass('ui-disabled');
    }

    lzm_displayLayout.resizeAll('configure');
    setTimeout(function() {
        lzm_displayLayout.resizeAll('configure');
    }, 200);
    setTimeout(function() {
        lzm_displayLayout.resizeAll('configure');
    }, 1000);
    setTimeout(function() {
        lzm_displayLayout.resizeAll('configure');
    }, 5000);

    $(window).resize(function () {
        lzm_displayLayout.resizeAll('configure');
        setTimeout(function() {
            lzm_displayLayout.resizeAll('configure');
        }, 200);
        setTimeout(function() {
            lzm_displayLayout.resizeAll('configure');
        }, 1000);
        setTimeout(function() {
            lzm_displayLayout.resizeAll('configure');
        }, 5000);
    });
};

$(document).ready(function () {
    // initiate the lzm classes needed
    if (typeof lzm_deviceInterface == 'undefined') {
        if (appOs == 'test') {

        } else if (appOs == 'windows') {
            lzm_deviceInterface = new CommonWindowsDeviceInterfaceClass();
        } else {
            lzm_deviceInterface = new CommonDeviceInterfaceClass();
        }
    }
    lzm_commonConfig = new CommonConfigClass();
    lzm_commonTools = new CommonToolsClass();
    lzm_commonStorage = new CommonStorageClass(localDbPrefix, true);
    // load the storage values and fill the profile select list
    lzm_commonStorage.loadProfileData();
    if (lzm_commonStorage.storageData.length > 0 || appOs != 'windows') {
        finishLoadingWithProfileData();
    } else {
        var loadDataLoopCounter = 1;
        var loadDataLoopNow = function() {
            setTimeout(function() {
                lzm_commonStorage.loadProfileData();
                if (appOs == 'android' || lzm_commonStorage.storageData.length > 0 || loadDataLoopCounter * 20 > 1000) {
                    finishLoadingWithProfileData();
                } else {
                    loadDataLoopCounter++;
                    loadDataLoopNow();
                }
            }, 20);
        };
        loadDataLoopNow();
    }
});
