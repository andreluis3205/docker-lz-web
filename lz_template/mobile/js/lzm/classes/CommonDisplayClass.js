/****************************************************************************************
 * LiveZilla CommonDisplayClass.js
 *
 * Copyright 2013 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

/**
 * Class containing some methods used in several html frontends
 * @constructor
 */
function CommonDisplayClass(isApp) {
    this.isApp = isApp;
    this.orientation = 'vertical';

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
}

CommonDisplayClass.prototype.createLayout = function(userStatusLogo, appOs) {
    userStatusLogo = (typeof userStatusLogo != 'undefined') ? userStatusLogo : 'img/lz_online.png';
    appOs = (typeof appOs != 'undefined') ? appOs : '';
    $('#login_page').css({display: 'block'});

    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var headerHeight = $('#header_login').height();
    var thisInputContainer = $('#input-container');
    var thisLogoContainer = $('#logo-container');
    var thisLoginPage = $('#login_page');
    var thisLoginContainer = $('#login-data-container');
    var thisUserStatus = $('#user_status').parent();
    var thisLoginButton = $('#login_btn');
    var loginTableFirstColumnWidth = $($('#username-container td')[0]).width();
    var loginTableSecondColumnWidth = $($('#username-container td')[1]).width();
    var profileButtonWidth = $('#configure_btn').width() + 42;
    //var thisServerProfileSelection = $('#server_profile_selection').parent().parent();
    var borderStyle = '1px solid #ccc';
    var roundedStyle = '10px';
    var shadowStyle = '4px 4px 2px #eee';

    var inputContainerWidth = Math.min(642, Math.round(0.9 * windowWidth));
    var inputContainerLeft = Math.round(0.5 * (windowWidth - inputContainerWidth) - 10);
    var logoWidth = (inputContainerWidth - 60 > 271) ? 271 : Math.floor(271*((inputContainerWidth - 60)/271));
    var logoHeight = (inputContainerWidth - 60 > 271) ? 84 : Math.floor(84*((inputContainerWidth - 60)/271));
    var logoLeft = (windowWidth - logoWidth) / 2;
    var textInputWidth = Math.min (inputContainerWidth - 150, loginTableSecondColumnWidth - 9);
    var profileSelectWidth = Math.min(inputContainerWidth - 50, loginTableFirstColumnWidth + loginTableSecondColumnWidth - profileButtonWidth);

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

    var logoContainerCss = {
        position: 'absolute',
        left: logoLeft,
        top: headerHeight + 30,
        height: logoHeight,
        width: logoWidth,
        'background-color': '#ffffff',
        'background-image': 'url("img/lz_logo.png")',
        'background-position': 'center',
        'background-repeat': 'no-repeat',
        'background-size': 'contain'
    };
    var inputContainerCss = {position: 'absolute',
        width: inputContainerWidth,
        height: windowHeight - headerHeight - logoHeight - 90,
        left: inputContainerLeft,
        top: logoHeight + headerHeight + 50,
        background: '#ffffff',
        padding: '10px',
        'border-radius': roundedStyle, '-moz-border-radius': roundedStyle, '-webkit-border-radius': roundedStyle,
        'overflow-y': 'auto',
        'overflow-x': 'hidden'
    };
    var loginContainerCss = {padding: '10px 20px', border: borderStyle,
        'border-radius': roundedStyle, '-moz-border-radius': roundedStyle, '-webkit-border-radius': roundedStyle,
        'box-shadow': shadowStyle, '-moz-box-shadow': shadowStyle, '-webkit-box-shadow': shadowStyle};

    thisLoginPage.css({background: '#ffffff'});
    thisLoginContainer.css(loginContainerCss);
    thisInputContainer.css(inputContainerCss);
    thisLogoContainer.css(logoContainerCss);
    $('.lzm-text-input').css({width: textInputWidth+'px', 'min-width': '0px'});
    $('#server_profile_selection').css({width: profileSelectWidth+'px', 'min-width': '0px'});
    $('#server_profile_selection-outer').css({width: (profileSelectWidth - 10)+'px', 'min-width': '0px'});
    $('#configure_btn').css({float: 'right', 'margin-top': '-23px'});

    var loginButtonWidth, statusButtonWidth;
    var userStatusLeft, loginButtonLeft;
    if (this.isApp) {
        loginButtonWidth = 130;
        statusButtonWidth = 130;

        userStatusLeft = inputContainerWidth - loginButtonWidth - statusButtonWidth + 5;
        loginButtonLeft = inputContainerWidth - loginButtonWidth + 5;
    } else {
        loginButtonWidth = 130;
        statusButtonWidth = 130;

        userStatusLeft = inputContainerWidth - loginButtonWidth - statusButtonWidth;
        loginButtonLeft = inputContainerWidth - loginButtonWidth;
    }

    var userStatusCss = {position: 'absolute', width: statusButtonWidth+'px', left: userStatusLeft+'px'};
    var targetOrientation = (this.orientation == 'vertical') ? 'horizontal' : 'vertical';
    var orientationIcon = (this.orientation == 'vertical') ? 'img/jqm-rotate-right.png' : 'img/jqm-rotate-left.png';
    var minWidthHeight = Math.min(windowWidth, windowHeight);
    var thisOrientationButtonCss = (this.isApp && appOs != 'ios' && appOs != 'windows' && (minWidthHeight >= 520 || this.orientation == 'horizontal')) ?
        {'background-color': '#8c8c8c',
        cursor: 'pointer', border: '1px solid #8c8c8c', 'border-radius': '4px',
        width: '32px', height: '24px', display: 'block'} : {'display': 'none'};
    var thisOrientationButtonInnerCss = {'background-image': 'url(\'' + orientationIcon + '\')', 'background-repeat': 'no-repeat',
        'background-position': 'center', padding: '1px 14px 8px 14px'};
    $('#orientation_btn').css(thisOrientationButtonCss);
    $('#orientation_btn-inner').css(thisOrientationButtonInnerCss);

    $('.dialog-window-container').css(this.dialogWindowContainerCss);
    $('.dialog-window').css(this.dialogWindowCss);
    $('.dialog-window-headline').css(this.dialogWindowHeadlineCss);
    $('.dialog-window-body').css(this.dialogWindowBodyCss);
    $('.dialog-window-footline').css(this.dialogWindowFootlineCss);
    $('.dialog-window-fullscreen').css(this.FullscreenDialogWindowCss);
    $('.dialog-window-headline-fullscreen').css(this.FullscreenDialogWindowHeadlineCss);
    $('.dialog-window-body-fullscreen').css(this.FullscreenDialogWindowBodyCss);
    $('.dialog-window-footline-fullscreen').css(this.FullscreenDialogWindowFootlineCss);

    lzm_commonDialog.resizePasswordChange();
    lzm_commonDialog.resizeAlertDialog();
};

CommonDisplayClass.prototype.resizeConfigPage = function() {
    var thisServerProfileSelection = $('#server_profile_selection');
    var thisConfigureForm = $('#configure_form');
    var thisConfigurePage = $('#configure_page');
    var thisLogoContainer = $('#logo-container');

    var windowWidth = $(window).width(), windowHeight = $(window).height(), headerHeight = $('#header_configure').height();
    var configureFormWidth = Math.min(600, Math.round(0.9 * windowWidth) - 42);
    var configureFormLeft = Math.round(0.5 * (windowWidth - configureFormWidth - 42));
    var profileSelectWidth = configureFormWidth, profileSelectLeft = 0;
    var shadowStyle = '4px 4px 2px #eee';
    var configurePageCss = {'background-image': 'none', 'background': '#ffffff'};
    var logoWidth = (configureFormWidth - 60 > 271) ? 271 : Math.floor(271*((configureFormWidth - 60)/271));
    var logoHeight = (configureFormWidth - 60 > 271) ? 84 : Math.floor(84*((configureFormWidth - 60)/271));
    var logoLeft = (windowWidth - logoWidth) / 2;
    var configureFormTop = headerHeight + 60 + logoHeight;
    var logoContainerCss = {position: 'absolute', left: logoLeft, top: headerHeight + 30, height: logoHeight,
        width: logoWidth, background: '#ffffff', 'background-image': 'url("img/lz_logo.png")',
        'background-position': 'center', 'background-repeat': 'no-repeat', 'background-size': 'contain'};
    var configureFormCss = {left: configureFormLeft+'px', top: configureFormTop+'px', width: configureFormWidth+'px',
        'box-shadow': shadowStyle, '-moz-box-shadow': shadowStyle, '-webkit-box-shadow': shadowStyle};
    var serverProfileSelectionCss = {width: profileSelectWidth+'px', 'margin-left': profileSelectLeft+'px'};
    var serverProfileSelectionOuterCss = {width: (profileSelectWidth - 10)+'px', 'margin-left': profileSelectLeft+'px'};

    if (configureFormWidth < 320) {
        $('.lzm-text-input').css({'min-width': '0px', 'width': (configureFormWidth - 120)+'px'});
    }
    thisConfigurePage.css(configurePageCss);
    thisLogoContainer.css(logoContainerCss);
    thisConfigureForm.css(configureFormCss);
    thisServerProfileSelection.css(serverProfileSelectionCss);
    $('#server_profile_selection-outer').css(serverProfileSelectionOuterCss);
};

CommonDisplayClass.prototype.addBrowserSpecificGradient = function(imageString, appOs) {
    var a = '#FFFFFF', b = '#F1F1F1';
    var gradientString = imageString;
    var cssTag = '';
    switch (appOs) {
        case 'iOS':
            cssTag = '-webkit-linear-gradient';
            break;
        default:
            cssTag = 'linear-gradient';
            break;
    }
    switch (imageString) {
        case '':
            gradientString = cssTag + '(' + a + ',' + b + ')';
            break;
        default:
            gradientString += ', ' + cssTag + '(' + a + ',' + b + ')';
            break;
    }
    return gradientString
};

/**
 * Fill the profile select list
 */
CommonDisplayClass.prototype.fillProfileSelectList = function(storageData, runningFromApp, selectedIndex) {
    selectedIndex = (typeof selectedIndex != 'undefined') ? selectedIndex : -1;
    var htmlString = '<option data-placeholder="true" value="-1" id="no-profile">' + t('No profile selected') + '</option>';
    storageData.sort(this.sortProfiles);
    var selectedString = '';
    for (var i=0; i<storageData.length; i++) {
        selectedString = '';
        if (storageData[i].index == selectedIndex) {
            selectedString = ' selected="selected"';
            $('#server_profile_selection-inner-text').html(storageData[i].server_profile);
        }
        if (storageData[i].index != 0) {
            htmlString += '<option value="' + storageData[i].index + '"' + selectedString + '>' + storageData[i].server_profile + '</option>';
        }
    }
    var thisServerProfileSelection = $('#server_profile_selection');
    thisServerProfileSelection.html(htmlString);
};

/**
 * Helper function for sorting the profiles shown in the select lists
 * @param a
 * @param b
 * @return {Boolean}
 */
CommonDisplayClass.prototype.sortProfiles = function(a,b) {
    return (a['server_profile'].toLowerCase() > b['server_profile'].toLowerCase());
};
