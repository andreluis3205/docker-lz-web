function AdminDisplayLayoutClass() {

}

AdminDisplayLayoutClass.prototype.resizeAll = function() {
    this.resizeUserManagement();
    this.resizeEditUserConfiguration();
    this.resizeSignatureInput();
    this.resizeTextEmailsInput();
    this.resizeGroupTitleInput();
    this.resizeSocialMediaInput();
    this.resizeOpeningHoursInput();
};

AdminDisplayLayoutClass.prototype.resizeUserManagement = function() {
    if ($('#umg-content').length > 0 && $('#umg-list-view').css('display') == 'block') {
        var myWidth = $('#umg-content').width();
        var myHeight = $('#umg-content').height();

        $('#umg-content-inner').css({'height': (myHeight - 10)+'px', 'width': (myWidth - 10)+'px'});
        $('#operator-list-fieldset').css({'min-height': (myHeight - 72)+'px'});
        $('#group-list-fieldset').css({'min-height': (myHeight - 72)+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeEditUserConfiguration = function() {
    if ($('#umg-edit-view').length > 0 && $('#umg-edit-view').css('display') == 'block') {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 98;

        $('#umg-edit-view').css({width: (myWidth - 10)+'px', height: (myHeight - 10)+'px'});
        $('.umg-edit-placeholder-content').css({'min-height': (myHeight - 50)+'px'});
        $('.umg-edit-text-input').css({'height': '60px', 'width': (inputWidth + 27)+'px'});
        $('.umg-edit-text-input').find('input').css({'width': inputWidth+'px'});
        $('.umg-edit-select').css({'width': (inputWidth + 15)+'px'});
        $('.op-config-fs').css({'min-height': (myHeight - 73)+'px'});
        $('.permissions-placeholder-content').css({'min-height': (myHeight - 120)+'px'});
        $('.perm-inner-fs').css({'min-height': (myHeight - 144)+'px'});
        $('#permtab-general-inner-admin').css({'min-height': (myHeight - 285)+'px'});
        $('#signature-list-div').css({height: (myHeight - 154)+'px'});
        $('#text-emails-list-div').css({height: (myHeight - 190)+'px'});
        $('.gr-input-field-select').css({width: '200px'});
        $('#gr-ticket-in-mb-div').css({'min-height': (myHeight - 388)+'px'});
        $('#gr-ticket-social-list-div').css({'min-height': (myHeight - 195)+'px'});
        $('#gr-ticket-assign-list-div').css({'min-height': (myHeight - 196)+'px'});
        $('.gr-ticket-assign-select').css({width: '200px'});
        $('#gr-oh-list-div').css({'min-height': (myHeight - 166)+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeSignatureInput = function() {
    if ($('#signature-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 63;
        var textAreaHeight = Math.max(100, myHeight - 215);

        $('#signature-inner-div').css({height: (myHeight - 10)+'px', overflow: 'auto'});
        $('#signature-inner-fs').css({'min-height': (myHeight - 40)+'px'});
        $('#signature-name').css({width: (inputWidth+'px')});
        $('#signature-text').css({width: ((inputWidth + 16)+'px'), height: textAreaHeight+'px', padding: '4px',
            border: '1px solid #cccccc'});
    }
};

AdminDisplayLayoutClass.prototype.resizeTextEmailsInput = function() {
    if ($('#text-emails-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 102;
        var taaHeight = Math.max(60, Math.floor(myHeight / 2) - 155);
        var tabHeight = Math.max(60, Math.floor(myHeight / 2) - 167);
        var tacHeight = Math.max(60, myHeight - 352);
        var tadHeight = Math.max(60, myHeight - 278);

        $('#text-emails-inner-div').css({height: (myHeight - 10)+'px', overflow: 'auto'});
        $('#text-emails-inner-lang-fs').css({height: '50px'});
        $('.text-emails-edit-placeholder-content').css({'min-height': (myHeight - 165)+'px'});
        $('.text-emails-inner-tabs').css({'min-height': (myHeight - 158)+'px'});
        $('.tae-inner-tab-textarea-a').css({width: (inputWidth)+'px', height: taaHeight + 'px'});
        $('.tae-inner-tab-textarea-b').css({width: (inputWidth)+'px', height: tabHeight + 'px'});
        $('.tae-inner-tab-textarea-c').css({width: (inputWidth)+'px', height: tacHeight + 'px', 'margin-bottom': '10px'});
        $('.tae-inner-tab-textarea-d').css({width: (inputWidth)+'px', height: tadHeight + 'px'});
        $('#tae-inner-tab-text-qmt-container').css({height: '60px'});
        $('.umg-edit-text-input').css({'height': '60px', 'width': (inputWidth + 17)+'px'});
        $('.umg-edit-text-input').find('input').css({'width': (inputWidth - 10)+'px'});
        $('.tae-email-textarea').css({height: (myHeight - 352)+'px', width: (inputWidth - 14)+'px'});
        $('#tae-inner-tab-text-qmt-label').css({'white-space': 'nowrap'});
    }
};

AdminDisplayLayoutClass.prototype.resizeGroupTitleInput = function() {
    if ($('#group-title-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 63;

        $('#group-title-inner-fs').css({'min-height': (myHeight - 35)+'px'});
        $('.umg-edit-text-input').css({'height': '60px', 'width': (inputWidth + 27)+'px'});
        $('.umg-edit-text-input').find('input').css({'width': inputWidth+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeSocialMediaInput = function() {
    if ($('#social-media-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 63 - 15;

        $('#social-media-inner-div').css({height: (myHeight - 5)+'px', 'overflow-y': 'auto'});
        $('#social-media-inner-fs').css({'min-height': (myHeight - 35)+'px'});

        var atWidth = myWidth - $('#smc-create-token').width() - 103;
        $('#smc-track-container').css({width: (atWidth + 27) + 'px', height: '60px', 'margin-top': '10px'});
        $('#smc-track').css({'width': atWidth + 'px'});
        $('#smc-check-interval-container').css({width: '300px', height: '60px'});
        $('#smc-check-interval').css({width: '50px'});
        $('#smc-check-interval-label').css({'white-space': 'nowrap'});

        $('.umg-edit-text-input').css({'height': '60px', 'width': (inputWidth + 27)+'px'});
        $('.umg-edit-text-input').find('input').css({'width': inputWidth+'px'});
    }
};

AdminDisplayLayoutClass.prototype.resizeOpeningHoursInput = function() {
    if ($('#opening-hours-inner-div').length > 0) {
        var myHeight = $(window).height(), myWidth = $(window).width();
        var inputWidth = myWidth - 63 - 15;

        $('#opening-hours-inner-div').css({height: (myHeight - 5)+'px', 'overflow-y': 'auto'});
        $('#opening-hours-inner-fs').css({'min-height': (myHeight - 35)+'px'});

        $('.umg-edit-text-input').css({'height': '60px', 'width': (100 + 27)+'px'});
        $('.umg-edit-text-input').find('input').css({'width': 100+'px'});
    }
};
