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

function logit(myObject, myLevel) {
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
}

function goBackToLogin() {
    window.location.href = "./index.html";
}

function t(myString, replacementArray) {
    return lzm_commonTranslation.translate(myString, replacementArray);
}

function fillStringsFromTranslation(selectedIndex) {
    if (loopCounter > 49 || lzm_commonTranslation.translationArray.length != 0) {
        lzm_commonDisplay.fillProfileSelectList(lzm_commonStorage.storageData, true, selectedIndex);
        //$('#back_btn span.ui-btn-text').text(t('Cancel'));
        $('#new_profile_btn span.ui-btn-text').text(t('New profile'));
        $('#edit_profile_btn span.ui-btn-text').text(t('Edit profile'));
        $('#del_profile_btn span.ui-btn-text').text(t('Delete profile'));
        $('#headline1').html(t('Server Profiles'));

        //$('#save_new_profile span.ui-btn-text').text(t('Save profile'));
        $('#save_login-text').text(t('Save login data'));
        $('#server_profile-text').html(t('Profile Name:'));
        $('#server_protocol-text').html(t('Server Protocol'));
        $('#server_url-text').html(t('Server Url:'));
        $('#mobile_dir-text').html(t('Mobile Directory:'));
        $('#server_port-text').html(t('Port'));
        //$('#lz_version-text').html(t('Server version'));
        $('#login_name-text').html(t('Username:'));
        $('#login_passwd-text').html(t('Password:'));

        //$('#save_edit_profile span.ui-btn-text').text(t('Save profile'));
        $('#edit_save_login-text').text(t('Save login data'));
        $('#edit_server_profile-text').html(t('Profile Name:'));
        $('#edit_server_protocol-text').html(t('Server Protocol'));
        $('#edit_server_url-text').html(t('Server Url:'));
        $('#edit_mobile_dir-text').html(t('Mobile Directory:'));
        $('#edit_server_port-text').html(t('Port'));
        //$('#edit_lz_version-text').html(t('Server version'));
        $('#edit_login_name-text').html(t('Username:'));
        $('#edit_login_passwd-text').html(t('Password:'));
    } else {
        loopCounter++;
        setTimeout(function() {fillStringsFromTranslation(selectedIndex);}, 50);
    }
}

function parseUrl(tmpUrl) {
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
}

function combineUrl(protocol, url, port) {
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
}

var finishLoadingWithProfileData = function() {
    var selectedIndex = (typeof lzm_commonStorage.loadValue('last_chosen_session') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != 'undefined' &&
        lzm_commonStorage.loadValue('last_chosen_profile') != null) ?
        lzm_commonStorage.loadValue('last_chosen_profile') : -1;
    var chosenProfile = {language: ''};
    if (selectedIndex != -1) {
        chosenProfile = lzm_commonStorage.getProfileByIndex(selectedIndex);
    }

    lzm_commonDisplay = new CommonDisplayClass(true);
    lzm_commonDialog = new CommonDialogClass();
    lzm_displayHelper = new CommonDisplayHelperClass(appOs);

    if (chosenProfile != null) {
        lzm_commonTranslation = new CommonTranslationClass('', '', '', true, chosenProfile.language);
    } else {
        lzm_commonTranslation = new CommonTranslationClass('', '', '', true, 'en');
    }

    var profileSelectList = [{value: -1, text: t('No profile selected')}];
    var profileSelection = lzm_displayHelper.createSelect('server_profile_selection', '', '', true, {image: 'img/jqm-down.png', position: 'right', gap: '4px'},
        {width: '120px', border: '0px'}, '', profileSelectList, -1);
    var profileButtonHtml = lzm_displayHelper.createButton('new_profile_btn', '', '', '', 'img/jqm-plus.png', 'lr',
        {border: '1px solid #8c8c8c', 'margin-right': '10px', 'padding-left': '8px', 'padding-right': '8px'}, '') +
        lzm_displayHelper.createButton('edit_profile_btn', 'change-config ui-disabled', '', '', 'img/jqm-wheel.png', 'lr',
            {border: '1px solid #8c8c8c', 'margin-right': '10px', 'padding-left': '8px', 'padding-right': '8px'}, '') +
        lzm_displayHelper.createButton('del_profile_btn', 'change-config ui-disabled', '', '', 'img/jqm-minus.png', 'lr',
            {border: '1px solid #8c8c8c', 'padding-left': '8px', 'padding-right': '8px'}, '') +
        '<hr style="margin-top: 15px;">';
    $('#server_profile_selection-container').html(profileSelection).trigger('create');
    $('#profile_buttons').html(profileButtonHtml).trigger('create');
    var configureButtonHtml = lzm_displayHelper.createButton('save_profile', '', '', t('Save profile'), '', 'lr', {display: 'none', border: '1px solid #8c8c8c', color: '#ffffff', 'margin-right': '10px'}, '') +
        lzm_displayHelper.createButton('back_btn', '', '', t('Ok'), '', 'lr', {border: '1px solid #8c8c8c', color: '#ffffff'}, '');
    $('#configure_buttons').html(configureButtonHtml).trigger('create');
    fillStringsFromTranslation(selectedIndex);

    // read the url of this file and split it into the protocol and the base url of this installation
    var thisUrlParts = lzm_commonTools.getUrlParts();
    var thisUrl = thisUrlParts.urlBase + thisUrlParts.urlRest;


    var unsafed_data = false;

    var thisLoginData = $('.login_data');

    var thisChangeConfig = $('.change-config');
    var thisEditLoginName = $('#edit_login_name');
    var thisEditLoginPassword = $('#edit_login_passwd');
    var thisEditSaveLogin = $('#edit_save_login');
    var thisEditServerProfile = $('#edit_server_profile');
    var thisEditServerUrl = $('#edit_server_url');
    var thisEditMobileDir = $('#edit_mobile_dir');
    var thisEditServerPort = $('#edit_server_port');
    var thisEditLzVersion = $('#edit_lz_version');

    var thisServerProfile = $('#server_profile');
    var thisServerUrl = $('#server_url');
    var thisMobileDir = $('#mobile_dir');
    var thisSaveLogin = $('#save_login');
    var thisLoginName = $('#login_name');
    var thisLoginPassword = $('#login_passwd');
    var thisLzVersion = $('#lz_version');

    if (selectedIndex != -1 && selectedIndex !== '') {
        thisChangeConfig.removeClass('ui-disabled');
    }

    $('#back_btn').click(function () {
        goBackToLogin();
    });

    $('#clear_btn').click(function() {
        lzm_commonStorage.clearLocalStorage();
    });

    $('#server_profile_selection').change(function () {
        if ($(this).val() != -1) {
            thisChangeConfig.removeClass('ui-disabled');
            var dataSet = lzm_commonStorage.getProfileByIndex($('#server_profile_selection').val());
            $('#server_profile_selection-inner-text').html(dataSet.server_profile);
        } else {
            thisChangeConfig.addClass('ui-disabled');
            $('#server_profile_selection-inner-text').html(t('No profile selected'));
        }
        $('#new_profile_form').css('display', 'none');
        $('#edit_profile_form').css('display', 'none');
        $('#save_profile').css('display', 'none');
        $('#back_btn').html(t('Ok'));
    });

    $('.data-input').change(function() {
        unsafed_data = true;
    });

    $('#new_profile_btn').click(function () {
        mode = 'new';
        $('#no-profile').prop('selected', 'true');
        $('#server_profile_selection-inner-text').html(t('No profile selected'));
        $('#edit_profile_btn').addClass('ui-disabled');
        $('#del_profile_btn').addClass('ui-disabled');
        $('#new_profile_form').css('display', 'block');
        $('#edit_profile_form').css('display', 'none');
        $('#save_profile').css('display', 'inline');
        $('#back_btn').html(t('Cancel'));
        lzm_commonDisplay.resizeConfigPage();
    });

    $('#edit_profile_btn').click(function () {
        mode = 'edit';
        var dataSet = lzm_commonStorage.getProfileByIndex($('#server_profile_selection').val());
        $('#profile_index').val(dataSet.index);
        $('#edit_server_profile').val(dataSet.server_profile);
        var tmpEditUrl = combineUrl(dataSet.server_protocol, dataSet.server_url, dataSet.server_port);
        $('#edit_server_url').val(tmpEditUrl);
        $('#edit_mobile_dir').val(dataSet.mobile_dir);

        if (dataSet.login_name != '' || dataSet.login_passwd != '') {
            thisEditLoginName.val(dataSet.login_name);
            thisEditLoginPassword.val(dataSet.login_passwd);
            thisEditSaveLogin.prop('checked', true);
            thisLoginData.removeClass('ui-disabled');
        } else {
            thisEditLoginName.val('');
            thisEditLoginPassword.val('');
            thisEditSaveLogin.prop('checked', false);
            thisLoginData.addClass('ui-disabled');
        }
        $('#edit_profile_form').css('display', 'block');
        $('#new_profile_form').css('display', 'none');
        $('#save_profile').css('display', 'inline');
        $('#back_btn').html(t('Cancel'));
        lzm_commonDisplay.resizeConfigPage();
    });

    $('#del_profile_btn').click(function () {
        mode = '';
        lzm_commonStorage.deleteProfile($('#server_profile_selection').val());
        $('#new_profile_form').css('display', 'none');
        $('#edit_profile_form').css('display', 'none');
        lzm_commonDisplay.fillProfileSelectList(lzm_commonStorage.storageData, true, -1);
        $('#edit_profile_form').css('display', 'none');
        $('#new_profile_form').css('display', 'none');

        $('#no-profile').prop('selected', 'true');
        $('#server_profile_selection-inner-text').html(t('No profile selected'));
        $('#edit_profile_btn').addClass('ui-disabled');
        $('#del_profile_btn').addClass('ui-disabled');
        lzm_commonStorage.saveValue('last_chosen_profile', -1);
        $('#save_profile').addClass('display', 'none');
        $('#back_btn').html(t('Ok'));
        lzm_commonDisplay.resizeConfigPage();
    });

    $('.save_login').click(function () {
        if ($(this).prop('checked') == true) {
            thisLoginData.removeClass('ui-disabled');
        } else {
            thisLoginData.addClass('ui-disabled');
        }
    });

    $('#save_profile').click(function () {
        var dataSet = null, safedIndex = null;
        if (mode == 'new') {
            unsafed_data = false;
            dataSet = {};
            dataSet.index = -1;
            dataSet.server_profile = thisServerProfile.val();

            var myNewUrlParts = parseUrl(thisServerUrl.val());
            dataSet.server_url = myNewUrlParts.server_url;
            dataSet.mobile_dir = thisMobileDir.val().replace(/^\//, '').replace(/\/$/, '');
            dataSet.server_protocol = myNewUrlParts.server_protocol;
            dataSet.server_port = myNewUrlParts.server_port;

            dataSet.lz_version = thisLzVersion.val();
            if (thisSaveLogin.prop('checked') == true) {
                dataSet.login_name = thisLoginName.val();
                dataSet.login_passwd = thisLoginPassword.val();
            } else {
                dataSet.login_name = '';
                dataSet.login_passwd = '';
            }

            safedIndex = lzm_commonStorage.saveProfile(dataSet);
            lzm_commonDisplay.fillProfileSelectList(lzm_commonStorage.storageData, true, safedIndex);

            thisServerProfile.val('');
            thisServerUrl.val('');
            thisLoginName.val('');
            thisLoginPassword.val('');
            thisSaveLogin.prop('checked', false);
            thisLoginData.addClass('ui-disabled');
            $('#new_profile_form').css('display', 'none');
            lzm_commonStorage.saveValue('last_chosen_profile', safedIndex);
        } else if (mode == 'edit') {
            unsafed_data = false;
            dataSet = {};
            dataSet.index = $('#profile_index').val();
            dataSet.server_profile = thisEditServerProfile.val();

            var myEditUrlParts = parseUrl(thisEditServerUrl.val());
            dataSet.server_url = myEditUrlParts.server_url;
            dataSet.mobile_dir = thisEditMobileDir.val().replace(/^\//, '').replace(/\/$/, '');
            dataSet.server_protocol = myEditUrlParts.server_protocol;
            dataSet.server_port = myEditUrlParts.server_port;

            dataSet.lz_version = thisEditLzVersion.val();
            if (thisEditSaveLogin.prop('checked') == true) {
                dataSet.login_name = thisEditLoginName.val();
                dataSet.login_passwd = thisEditLoginPassword.val();
            } else {
                dataSet.login_name = '';
                dataSet.login_passwd = '';
            }

            safedIndex = lzm_commonStorage.saveProfile(dataSet);
            lzm_commonDisplay.fillProfileSelectList(lzm_commonStorage.storageData, true, safedIndex);

            thisEditServerProfile.val('');
            thisEditServerUrl.val('');
            thisEditServerPort.val('');
            thisEditLoginName.val('');
            thisEditLoginPassword.val('');
            thisEditSaveLogin.prop('checked', false);
            thisLoginData.addClass('ui-disabled');
            $('#edit_profile_form').css('display', 'none');
            $('#edit_profile_btn').addClass('ui-disabled');
            $('#del_profile_btn').addClass('ui-disabled');
            lzm_commonStorage.saveValue('last_chosen_profile', safedIndex);
        }
        goBackToLogin();
    });

    lzm_commonDisplay.resizeConfigPage();
    setTimeout(function() {
        lzm_commonDisplay.resizeConfigPage();
    }, 200);
    setTimeout(function() {
        lzm_commonDisplay.resizeConfigPage();
    }, 1000);
    setTimeout(function() {
        lzm_commonDisplay.resizeConfigPage();
    }, 5000);

    $(window).resize(function () {
        lzm_commonDisplay.resizeConfigPage();
        setTimeout(function() {
            lzm_commonDisplay.resizeConfigPage();
        }, 200);
        setTimeout(function() {
            lzm_commonDisplay.resizeConfigPage();
        }, 1000);
        setTimeout(function() {
            lzm_commonDisplay.resizeConfigPage();
        }, 5000);
    });
};

$(document).ready(function () {
    // initiate the lzm classes needed
    if (typeof lzm_deviceInterface == 'undefined') {
        if (appOs == 'windows') {
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
    if (lzm_commonStorage.storageData.length > 0) {
        finishLoadingWithProfileData();
    } else {
        var loadDataLoopCounter = 1;
        var loadDataLoopNow = function() {
            setTimeout(function() {
                lzm_commonStorage.loadProfileData();
                if (lzm_commonStorage.storageData.length > 0 || loadDataLoopCounter * 20 > 1000) {
                    lzm_deviceInterface.jsLog('Looped for' + (loadDataLoopCounter * 20) + ' ms before finish loading');
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
