function CommonDisplayLayoutClass(isApp) {
    this.windowWidth = 0;
    this.windowHeight = 0;
}

CommonDisplayLayoutClass.prototype.resizeAll = function(caller) {
    var that = this;
    that.windowWidth = $(window).width();
    that.windowHeight = $(window).height();

    if (caller == 'index') {
        that.resizeLoginContainer();
    } else {
        that.resizeConfigureContainer();
    }
};

CommonDisplayLayoutClass.prototype.resizeLoginContainer = function() {
    var that = this;
    var lcWidth = Math.min(600, Math.floor(0.9 * that.windowWidth));
    var lcHeight = $('#login-container').height();
    var lcLeft = Math.floor((that.windowWidth - lcWidth) / 2);
    var lcTop = Math.max(145, Math.floor((that.windowHeight - lcHeight) / 4));
    var statusRight = $('#login_btn').width() + parseInt($('#login_btn').css('padding-right')) +
        parseInt($('#login_btn').css('padding-right')) + parseInt($('#login_btn').css('right')) + 1;

    $('#login-container').css({left: lcLeft+'px', top: lcTop+'px', width: lcWidth+'px'});
    $('#login-headline').css({width: (lcWidth - 22)+'px'});
    $('#login-copyright-link').css({top: (lcTop + lcHeight + 10)+'px'});
    that.resizeInput('username', lcWidth, lcHeight, 20, 20);
    that.resizeInput('password', lcWidth, lcHeight, 20, 55);
    $('#user_status-outer').css({right: statusRight+'px', 'border-color': '#cccccc'});
    $('#user_status-inner').css({'padding-top': '6px'});
    $('#user_status-inner-text').css({'font-weight': 'normal'});
    $('#server_profile_selection').css({width: (lcWidth - 82)+'px', 'min-width': '0px'});
    $('#server_profile_selection-outer').css({width: (lcWidth - 92)+'px', 'min-width': '0px'});

    var minWidthHeight = Math.min(that.windowWidth, that.windowHeight);
    var thisOrientationButtonCss = (lzm_commonDisplay.isApp && appOs != 'ios' && appOs != 'windows' &&
        (minWidthHeight >= 520 || lzm_commonDisplay.orientation == 'horizontal')) ? {display: 'block'} : {'display': 'none'};
    $('#orientation_btn').css(thisOrientationButtonCss);
};

CommonDisplayLayoutClass.prototype.resizeConfigureContainer = function() {
    var that = this;
    var lcWidth = Math.min(600, Math.floor(0.9 * that.windowWidth));
    var profileActionType = $('#profile-configuration-div').data('type');
    var lcHeight = (profileActionType == 'empty') ? 180 : 550;
    var peTop = (profileActionType == 'empty') ? 327 : 697;
    var ccbTop = (profileActionType == 'empty') ? 120 : 490;
    var lcLeft = Math.floor((that.windowWidth - lcWidth) / 2);
    var lcTop = Math.max(145, Math.floor((that.windowHeight - 180) / 4));

    $('#configure-container').css({left: lcLeft+'px', top: lcTop+'px', width: lcWidth+'px', height: lcHeight, display: 'block'});
    $('#configure-headline').css({width: (lcWidth - 22)+'px'});
    $('#configure-form').css({height: (lcHeight - 32)+'px'});
    $('#server_profile_selection').css({width: (lcWidth - 40)+'px', 'min-width': '0px'});
    $('#server_profile_selection-outer').css({width: (lcWidth - 50)+'px', 'min-width': '0px'});
    $('#profile-configuration-div').css({width: (lcWidth - 40)+'px'});
    $('#configure-section-divide').css({width: (lcWidth - 40)+'px'});
    $('#configure-page-end').css({'top': peTop+'px', left: lcLeft+'px', width: (lcWidth + 2)+'px'});
    $('#configure-close-buttons-div').css({'top': ccbTop+'px'});

    if (profileActionType != 'empty') {
        that.resizeInput('profile-name', lcWidth + 10, lcHeight, 0, 0);
        that.resizeInput('server-url', lcWidth + 10, lcHeight, 0, 35);
        that.resizeInput('mobile-directory', lcWidth + 10, lcHeight, 0, 70);
        $('#configure-checkbox-div').css({width: (lcWidth - 40)+'px', top: '200px'});
        that.resizeInput('username', lcWidth, lcHeight, 0, 135);
        that.resizeInput('password', lcWidth, lcHeight, 0, 170);
        $('#save_profile').css({display: 'inline', 'margin-right': '10px'});
        $('#back_btn').html(t('Cancel'));
    } else {
        $('#save_profile').css({display: 'none', 'margin-right': '10px'});
        $('#back_btn').html(t('Ok'));
    }
};

CommonDisplayLayoutClass.prototype.resizeInput = function(inputId, width, height, left, top) {
    $('#' + inputId + '-container').css({top: top+'px', left: left+'px', width: (width - 40)+'px'});
    $('#' + inputId + '-text').css({width: (width - 70)+'px'});
    $('#' + inputId).css({width: (width - 80)+'px'});
};


