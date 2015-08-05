/****************************************************************************************
 * LiveZilla ChatVisitorClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatVisitorClass() {
    this.filterMessageIsVisible = false;
    this.lastVisitorTimestampUpdate = 0;
}

/********** Visitor list **********/
ChatVisitorClass.prototype.updateVisitorList = function () {
    var that = this;
    if (!lzm_chatDisplay.VisitorListCreated) {
        that.createVisitorList();
    } else {
        if (lzm_chatTimeStamp.getServerTimeString(null, false, 1) - lzm_chatDisplay.visitorListIsScrolling > 2000) {
            lzm_chatDisplay.activeVisitorNumber = 0;
            var thisVisitorList = $('#visitor-list');
            var visitorListWidth = thisVisitorList.width();
            var visitors = lzm_chatServerEvaluation.visitors.getVisitorList();
            var i = 0, visitorIdList = [];
            for (i=visitors.length-1; i>=0; i--) {
                if (visitors[i].b.length == 0) {
                    visitors[i].is_active = false;
                }
                var existingLine = '';
                try {
                    existingLine = $('#visitor-list-row-' + visitors[i].id).html();
                } catch(ex) {}
                var lineIsExisting = (typeof existingLine != 'undefined') ? true : false;
                var htmlString, thisLine, cssObject;
                if (visitors[i].is_active) {
                    lzm_chatDisplay.activeVisitorNumber++;
                    visitorIdList.push(visitors[i].id);
                }
                if (visitors[i].is_active && lineIsExisting &&
                    (visitors[i].md5 != $('#visitor-list-row-' + visitors[i].id).data('md5') ||
                        $.inArray(visitors[i].id, lzm_chatServerEvaluation.globalTypingChanges) != -1)) {
                    thisLine = that.createVisitorListLine(visitors[i], visitorListWidth, false);
                    htmlString = thisLine[0];
                    cssObject = thisLine[1];
                    if (existingLine != htmlString) {
                        try {
                            $('#visitor-list-row-' + visitors[i].id).html(htmlString).css(cssObject);
                            if (typeof $('#visitor-list-row-' + visitors[i].id).attr('onclick') != 'undefined')
                                $('#visitor-list-row-' + visitors[i].id).attr('onclick', thisLine[2]);
                            if (typeof $('#visitor-list-row-' + visitors[i].id).attr('ondblclick') != 'undefined')
                                $('#visitor-list-row-' + visitors[i].id).attr('ondblclick', thisLine[3]);
                            if (typeof $('#visitor-list-row-' + visitors[i].id).attr('oncontextmenu') != 'undefined')
                                $('#visitor-list-row-' + visitors[i].id).attr('oncontextmenu', thisLine[4]);
                        } catch(ex) {}
                    }
                } else if (visitors[i].is_active && !lineIsExisting) {
                    htmlString = that.createVisitorListLine(visitors[i], visitorListWidth, true)[0];
                    var nextLine = 'visitor-list-row-ERROR';
                    try {
                        nextLine = that.getVisitorListLinePosition(visitors[i]);
                        if ($('#' + nextLine).length > 0) {
                            $('#' + nextLine).after(htmlString);
                        } else {
                            $('#visitor-list-body').prepend(htmlString);
                        }
                    } catch(e) {}
                } else if (!visitors[i].is_active && lineIsExisting) {
                    $('#visitor-list-row-' + visitors[i].id).remove();
                }
            }
            var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1000);
            that.lastVisitorTimestampUpdate = now;
            $('.visitor-list-line').each(function() {
                var userId = $(this).data('user-id');
                if ($.inArray(userId, visitorIdList) == -1) {
                    $('#visitor-list-row-' + userId).remove();
                }
                var myVisitor = lzm_chatServerEvaluation.visitors.getVisitor(userId);
                if (myVisitor != null) {
                    var timeColumns = that.getVisitorOnlineTimes(myVisitor);
                    $('#visitor-online-' + userId).html(timeColumns['online']);
                    $('#visitor-active-' + userId).html(timeColumns['active']);
                }
            });
            lzm_chatServerEvaluation.globalTypingChanges = [];

            var headline2String = '<div style="font-size: 11px; font-weight: normal; margin-top: 10px; margin-left: 4px;">' +
                t('Visitors online: <!--visitor_number-->',[['<!--visitor_number-->', lzm_chatDisplay.activeVisitorNumber]]) + '</div>';
            $('#visitor-list-headline2').html(headline2String);
            lzm_displayLayout.resizeVisitorList();

            lzm_chatDisplay.visitorListScrollingWasBlocked = false;
        } else {
            blockVisitorListUpdate();
        }
    }
};

ChatVisitorClass.prototype.updateVisitorTimestampCells = function() {
    var that = this, i = 0, visitorIdList = [];
    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1000);
    if (now - that.lastVisitorTimestampUpdate > 20) {
        that.lastVisitorTimestampUpdate = now;
        if (lzm_chatDisplay.selected_view == 'external' && $('#visitor-list-table').length > 0) {
            var visitors = lzm_chatServerEvaluation.visitors.getVisitorList();
            for (i=visitors.length-1; i>=0; i--) {
                if (visitors[i].b.length == 0) {
                    visitors[i].is_active = false;
                }
                if (visitors[i].is_active) {
                    lzm_chatDisplay.activeVisitorNumber++;
                    visitorIdList.push(visitors[i].id);
                }
                $('.visitor-list-line').each(function() {
                    var userId = $(this).data('user-id');
                    var myVisitor = lzm_chatServerEvaluation.visitors.getVisitor(userId);
                    if (myVisitor != null) {
                        var timeColumns = that.getVisitorOnlineTimes(myVisitor);
                        $('#visitor-online-' + userId).html(timeColumns['online']);
                        $('#visitor-active-' + userId).html(timeColumns['active']);
                    }
                });
            }
        }
        var infoUser = $('#visitor-information').data('visitor');
        if (typeof infoUser != 'undefined' && infoUser != null && $('#visitor-information').length > 0) {
            var tmpDate = that.calculateTimeDifferenece(infoUser, 'lastOnline', true);
            $('#visitor-online-since').html(tmpDate[0]);
            if (typeof (infoUser.b != 'undefined')) {
                for (i=0; i<infoUser.b.length; i++) {
                    if (infoUser.b[i].is_active) {
                        var lastH = infoUser.b[i].h2.length - 1;
                        if (lastH >= 0) {
                            var lastBeginTimestamp = infoUser.b[i].h2[lastH].time;
                            var beginTime = lzm_chatTimeStamp.getLocalTimeObject(lastBeginTimestamp * 1000, true);
                            var endTime = lzm_chatTimeStamp.getLocalTimeObject();
                            var timeSpan = that.calculateTimeSpan(beginTime, endTime);
                            var beginTimeHuman = lzm_commonTools.getHumanDate(beginTime, 'shorttime', lzm_chatDisplay.userLanguage);
                            var endTimeHuman = lzm_commonTools.getHumanDate(endTime, 'shorttime', lzm_chatDisplay.userLanguage);
                            $('#visitor-history-last-timespan-b' + i).html(timeSpan);
                            $('#visitor-history-last-time-b' + i).html(beginTimeHuman + ' - ' + endTimeHuman);
                        }
                    }
                }
            }

        }
    }
};

ChatVisitorClass.prototype.createVisitorList = function () {
    lzm_chatDisplay.VisitorListCreated = true;
    var i = 0, that = this;
    var thisVisitorList = $('#visitor-list');
    var visitorListWidth = thisVisitorList.width();
    var visitors = lzm_chatServerEvaluation.visitors.getVisitorList();

    var extUserHtmlString = '<div id="visitor-list-headline" class="lzm-dialog-headline"><h3>' + t('Visitors') + '</h3>' +
        '</div><div id="visitor-list-headline2" class="lzm-dialog-headline2"></div>' +
        '<div id="visitor-list-table-div" class="lzm-dialog-body">' +
        '<table id="visitor-list-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"><thead><tr>';
    extUserHtmlString += '<th style="width: 18px;">&nbsp;&nbsp;&nbsp;</th>';
    extUserHtmlString += '<th>&nbsp;&nbsp;&nbsp;</th>';
    extUserHtmlString += '<th>&nbsp;&nbsp;&nbsp;</th>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.visitor.length; i++) {
        if (lzm_chatDisplay.mainTableColumns.visitor[i].display == 1) {
            extUserHtmlString += '<th style="white-space: nowrap">' + t(lzm_chatDisplay.mainTableColumns.visitor[i].title) + '</th>';
        }
    }
    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        var customInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        if (parseInt(customInput.id) < 111 && customInput.active == 1 && customInput.display.visitor) {
            extUserHtmlString += '<th style="white-space: nowrap">' + customInput.name + '</th>';
        }
    }
    extUserHtmlString += '</tr></thead><tbody id="visitor-list-body">';

    lzm_chatDisplay.activeVisitorNumber = 0;
    for (i = 0; i < visitors.length; i++) {
        if (visitors[i].b.length == 0) {
            visitors[i].is_active = false;
        }
        if (visitors[i].is_active) {
            lzm_chatDisplay.activeVisitorNumber++;
            extUserHtmlString += that.createVisitorListLine(visitors[i], visitorListWidth, true)[0];
        }
    }
    extUserHtmlString += '</tbody></table></div>';

    thisVisitorList.html(extUserHtmlString).trigger('create');
    var headline2String = '<span class="lzm-dialog-hl2-info">' +
        t('Visitors online: <!--visitor_number-->',[['<!--visitor_number-->', lzm_chatDisplay.activeVisitorNumber]]) + '</div>';
    $('#visitor-list-headline2').html(headline2String);
    lzm_displayLayout.resizeVisitorList();

    $('#visitor-list-table-div').on("scrollstart", function() {
        lzm_chatDisplay.visitorListScrollingWasBlocked = true;
        lzm_chatDisplay.visitorListIsScrolling = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    });
};

ChatVisitorClass.prototype.createVisitorListLine = function(aUser, visitorListWidth, newLine) {
    var extUserHtmlString = '', i = 0, j = 0, userStyle, userStyleObject, that = this;
    aUser.r.sort(that.chatInvitationSortFunction);
    if (lzm_chatDisplay.isApp) {
        userStyle = ' style="cursor: pointer; line-height: 22px !important;"';
        userStyleObject = {'cursor': 'pointer', 'font-weight': 'normal', 'line-height': '22px !important'};
    } else {
        userStyle = ' style="cursor: pointer;"';
        userStyleObject = {'cursor': 'pointer', 'font-weight': 'normal'};
    }
    var tableRowTitle = '';

    var visitorName = (that.createVisitorStrings('cname', aUser).length > 32) ?
        that.createVisitorStrings('cname', aUser).substring(0, 32) + '...' : that.createVisitorStrings('cname', aUser);
    var visitorEmail = (that.createVisitorStrings('cemail', aUser).length > 32) ?
        that.createVisitorStrings('cemail', aUser).substring(0, 32) + '...' : that.createVisitorStrings('cemail', aUser);
    var visitorCity = (typeof aUser.city != 'undefined' && aUser.city.length > 32) ? aUser.city.substring(0, 32) + '...' : aUser.city;
    var visitorPage = that.createVisitorPageString(aUser);
    var visitorRegion = (typeof aUser.region != 'undefined' && aUser.region.length > 32) ? aUser.region.substring(0, 32) + '...' : aUser.region;
    var visitorISP = (typeof aUser.isp != 'undefined' && aUser.isp.length > 32) ? aUser.isp.substring(0, 32) + '...' : aUser.isp;
    var visitorCompany = (that.createVisitorStrings('ccompany', aUser).length > 32) ?
        that.createVisitorStrings('ccompany', aUser).substring(0, 32) + '...' : that.createVisitorStrings('ccompany', aUser);
    var visitorSystem = (aUser.sys.length > 32) ? aUser.sys.substring(0, 32) + '...' : aUser.sys;
    var visitorBrowser = (aUser.bro.length > 32) ? aUser.bro.substring(0, 32) + '...' : aUser.bro;
    var visitorResolution = (aUser.res.length > 32) ? aUser.res.substring(0, 32) + '...' : aUser.res;
    var visitorHost = (aUser.ho.length > 32) ? aUser.ho.substring(0,32) + '...' : aUser.ho;
    var lastVisitedDate = lzm_chatTimeStamp.getLocalTimeObject(aUser.vl * 1000, true);
    var visitorLastVisited = lzm_commonTools.getHumanDate(lastVisitedDate, 'full', lzm_chatDisplay.userLanguage);
    var visitorSearchStrings = (that.createVisitorStrings('ss', aUser).length > 32) ?
        that.createVisitorStrings('ss', aUser).substring(0, 32) + '...' : that.createVisitorStrings('ss', aUser);


    var visitorOnlineSince = that.calculateTimeDifferenece(aUser, 'lastOnline', false)[0];
    var visitorLastActivity = that.calculateTimeDifferenece(aUser, 'lastActive', false)[0];

    var visitorInvitationStatus = '';
    var visitorInvitationLogo = 'img/632-skills_gray.png';
    if (aUser.r.length > 0) {
        if (aUser.r[0].s != '' && aUser.r[0].ca == '' && aUser.r[0].a == 0 && aUser.r[0].de == 0) {
            visitorInvitationLogo = 'img/632-skills.png';
            visitorInvitationStatus = 'requested'
        } else if(aUser.r[0].s != '' && aUser.r[0].a == '1') {
            visitorInvitationLogo = 'img/632-skills_ok.png';
            visitorInvitationStatus = 'accepted';
        } else if(aUser.r[0].s != '' && aUser.r[0].ca != '') {
            visitorInvitationLogo = 'img/632-skills_not.png';
            visitorInvitationStatus = 'revoked';
        } else if(aUser.r[0].s != '' && aUser.r[0].de == '1') {
            visitorInvitationLogo = 'img/632-skills_not.png';
            visitorInvitationStatus = 'declined';
        }
    }

    var chatQuestion = '';
    if (typeof aUser.b_chat.eq != 'undefined') {
        chatQuestion = aUser.b_chat.eq.substr(0, 32);
        if (aUser.b_chat.eq.length > 32) {
            chatQuestion += '...';
        }
    }

    var visitorIsChatting = false;
    for (var glTypInd=0; glTypInd<lzm_chatServerEvaluation.global_typing.length; glTypInd++) {
        if (lzm_chatServerEvaluation.global_typing[glTypInd].id.indexOf('~') != -1 &&
            lzm_chatServerEvaluation.global_typing[glTypInd].id.split('~')[0] == aUser.id) {
            visitorIsChatting = true;
            break;
        }
    }
    var visitorWasDeclined = true;
    if (visitorIsChatting) {
        for (var bInd=0; bInd<aUser.b.length; bInd++) {
            if (typeof aUser.b[bInd].chat.pn != 'undefined') {
                if (aUser.b[bInd].chat.pn.member.length == 0) {
                    visitorWasDeclined = false;
                }
                for (var mInd=0; mInd<aUser.b[bInd].chat.pn.member.length; mInd++) {
                    if (aUser.b[bInd].chat.pn.member[mInd].dec == 0) {
                        visitorWasDeclined = false;
                    }
                }
            }
        }
    } else {
        visitorWasDeclined = false;
    }

    var onclickAction = '', oncontextmenuAction = '', ondblclickAction = '';
    if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
        onclickAction = ' onclick="openVisitorListContextMenu(event, \'' + aUser.id + '\', \'' + visitorIsChatting + '\', \'' +
            visitorWasDeclined + '\', \'' + visitorInvitationStatus + '\', \'' + visitorInvitationLogo + '\');"';
    } else {
        onclickAction = ' onclick="selectVisitor(event, \'' + aUser.id + '\');"';
        oncontextmenuAction = ' oncontextmenu="openVisitorListContextMenu(event, \'' + aUser.id + '\', \'' + visitorIsChatting + '\', \'' +
            visitorWasDeclined + '\', \'' + visitorInvitationStatus + '\');"';
        ondblclickAction = ' ondblclick="showVisitorInfo(\'' + aUser.id + '\');"';
    }
    var langName = (typeof lzm_chatDisplay.availableLanguages[aUser.lang.toLowerCase()] != 'undefined') ?
        lzm_chatDisplay.availableLanguages[aUser.lang.toLowerCase()] :
        (typeof lzm_chatDisplay.availableLanguages[aUser.lang.toLowerCase().split('-')[0]] != 'undefined') ?
        lzm_chatDisplay.availableLanguages[aUser.lang.toLowerCase().split('-')[0]] :
        aUser.lang;
    var columnContents = [{cid: 'online', contents: visitorOnlineSince, cell_id: 'visitor-online-' + aUser.id},
        {cid: 'last_active', contents: visitorLastActivity, cell_id: 'visitor-active-' + aUser.id},
        {cid: 'name', contents: visitorName}, {cid: 'country', contents: aUser.ctryi2},
        {cid: 'language', contents: langName}, {cid: 'region', contents: visitorRegion},
        {cid: 'city', contents: visitorCity}, {cid: 'page', contents: visitorPage},
        {cid: 'search_string', contents: visitorSearchStrings}, {cid: 'host', contents: visitorHost},
        {cid: 'ip', contents: aUser.ip}, {cid: 'email', contents: visitorEmail},
        {cid: 'company', contents: visitorCompany}, {cid: 'browser', contents: visitorBrowser},
        {cid: 'resolution', contents: visitorResolution}, {cid: 'os', contents: visitorSystem},
        {cid: 'last_visit', contents: visitorLastVisited}, {cid: 'isp', contents: visitorISP}];
    if (newLine) {
        extUserHtmlString += '<tr' + userStyle + tableRowTitle + ' id="visitor-list-row-' + aUser.id + '" data-md5="' + aUser.md5 + '"' +
            ' data-user-id="' + aUser.id + '" class="visitor-list-line lzm-unselectable"' + onclickAction + oncontextmenuAction + ondblclickAction +'>';
    }

    var numberOfActiveInstances = 0;
    var activeInstanceNumber = 0;
    for (i=0; i<aUser.b.length; i++) {
        if (aUser.b[i].is_active && aUser.b[i].h2.length > 0) {
            numberOfActiveInstances++;
            activeInstanceNumber = i;
        }
    }
    extUserHtmlString += '<td class="icon-column" style="background-image: url(\'./php/common/flag.php?cc=' + aUser.ctryi2 + '\'); ' +
        'background-position: center; background-repeat: no-repeat; padding-left: 20px;"></td>';
    if (visitorIsChatting && !visitorWasDeclined) {
        extUserHtmlString += '<td class="icon-column" nowrap style="padding-top: 1px; line-height: ' + lineHeight +
            '; background-image: url(\'./img/217-quote.png\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;">' +
            '</td>';
    } else {
        extUserHtmlString += '<td class="icon-column" nowrap style="padding-top: 1px; line-height: ' + lineHeight +
            '; background-image: url(\'./img/217-quote_gray.png\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;">' +
            '</td>';
    }
    var lineHeight = '18px';
    if (lzm_chatDisplay.isMobile || lzm_chatDisplay.isApp) {
        lineHeight = '18px';
    }
    extUserHtmlString += '<td class="icon-column" nowrap style="line-height: ' + lineHeight + '; background-image: url(\'' + visitorInvitationLogo +
        '\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;">&nbsp;</td>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.visitor.length; i++) {
        for (j=0; j<columnContents.length; j++) {
            if (lzm_chatDisplay.mainTableColumns.visitor[i].cid == columnContents[j].cid && lzm_chatDisplay.mainTableColumns.visitor[i].display == 1) {
                var cellId = (typeof columnContents[j].cell_id != 'undefined') ? ' id="' + columnContents[j].cell_id + '"' : '';
                extUserHtmlString += '<td' + cellId + ' style="white-space: nowrap">' + columnContents[j].contents + '</td>';
            }
        }
    }
    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
        var customInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
        if (parseInt(customInput.id) < 111 && customInput.active == 1 && customInput.display.visitor) {
            extUserHtmlString += '<td nowrap>' + that.createCustomInputString(aUser, customInput.id).replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</td>';
        }
    }

    if (newLine) {
        extUserHtmlString += '</tr>';
    }

    return [extUserHtmlString, userStyleObject, onclickAction.replace(/^ onclick="/, '').replace(/"$/, ''),
        ondblclickAction.replace(/^ ondblclick="/, '').replace(/"$/, ''), oncontextmenuAction.replace(/^ oncontextmenu="/, '').replace(/"$/, '')];
};

/********** Visitor info **********/
ChatVisitorClass.prototype.updateVisitorInformation = function(thisUser) {
    var that = this;
    $('#visitor-details-list').html('<legend>' + t('Details') + '</legend>' + that.createVisitorInformation(thisUser)).trigger('create');
    $('#visitor-history-placeholder-content-0').html(that.createBrowserHistory(thisUser)).trigger('create');
    for (var i=0; i<thisUser.rv.length; i++) {
        if (thisUser.rv[i].f == 1) {
            var recentHistoryHtml = that.createBrowserHistory(thisUser, thisUser.rv[i]);
            $('#recent-history-' + thisUser.rv[i].id).replaceWith(recentHistoryHtml);
        }
    }
    $('#visitor-comment-list').html('<legend>' + t('Comments') + '</legend>' + that.createVisitorCommentTable(thisUser)).trigger('create');
    $('#visitor-invitation-list').html('<legend>' + t('Chat Invites') + '</legend>' + that.createVisitorInvitationTable(thisUser)).trigger('create');
    that.updateCoBrowsingTab(thisUser);
    var numberOfHistories = thisUser.rv.length + 1;
    var numberOfComments = thisUser.c.length;
    var numberOfInvites = thisUser.r.length;
    $('#visitor-info-placeholder-tab-2').html(t('History (<!--number_of_histories-->)', [['<!--number_of_histories-->', numberOfHistories]]));
    $('#visitor-info-placeholder-tab-3').html(t('Comments (<!--number_of_comments-->)', [['<!--number_of_comments-->', numberOfComments]]));
    $('#visitor-info-placeholder-tab-4').html(t('Chat Invites (<!--number_of_invites-->)', [['<!--number_of_invites-->', numberOfInvites]]));

    $('#visitor-info-placeholder-tab-0').removeClass('ui-disabled');
    $('#visitor-info-placeholder-tab-1').removeClass('ui-disabled');
    $('#visitor-info-placeholder-tab-2').removeClass('ui-disabled');
    $('#visitor-info-placeholder-tab-3').removeClass('ui-disabled');
    $('#visitor-info-placeholder-tab-4').removeClass('ui-disabled');

    $('#visitor-information').data('visitor', lzm_commonTools.clone(thisUser));
};

ChatVisitorClass.prototype.updateCoBrowsingTab = function(thisUser) {
    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (var i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1') {
            externalIsDisabled = false;
        }
    }
    var brwsNo = 1, coBrowseSelBrws = '', coBrowseSelectOptions = '', firstActiveBrowser = '', activeBrowserPresent = false;
    for (var j=0; j<thisUser.b.length; j++) {
        if (thisUser.b[j].is_active && thisUser.b[j].ol == 0) {
            activeBrowserPresent = true;
            firstActiveBrowser = (firstActiveBrowser == '') ? thisUser.id + '~' + thisUser.b[j].id : firstActiveBrowser;
            var lastH = thisUser.b[j].h2[thisUser.b[j].h2.length - 1];
            var lastHTime = lzm_chatTimeStamp.getLocalTimeObject(lastH.time * 1000, true);
            var lastHTimeHuman = lzm_commonTools.getHumanDate(lastHTime, 'shorttime', lzm_chatDisplay.userLanguage);
            var selectedString = '';
            if (thisUser.id + '~' + thisUser.b[j].id == $('#visitor-cobrowse-iframe').data('browser'))  {
                selectedString = ' selected="selected"';
                coBrowseSelBrws = thisUser.id + '~' + thisUser.b[j].id;
            }
            coBrowseSelectOptions += '<option value="' + thisUser.id + '~' + thisUser.b[j].id + '"' + selectedString + '>' +
                t('Browser <!--brws_no-->: <!--brws_url--> (<!--brws_time-->)',
                [['<!--brws_no-->', brwsNo], ['<!--brws_url-->', lastH.url], ['<!--brws_time-->', lastHTimeHuman]]) + '</option>';
            brwsNo++;
        }
    }
    coBrowseSelBrws = (coBrowseSelBrws != '') ? coBrowseSelBrws : firstActiveBrowser;

    if (!activeBrowserPresent) {
        coBrowseSelectOptions += '<option>' + t('Offline') + '</option>';
        $('#visitor-cobrowse-iframe').data('browser', '');
    } else {
        $('#visitor-cobrowse-iframe').data('browser', coBrowseSelBrws);
    }
    $('#visitor-cobrowse-browser-select').html(coBrowseSelectOptions);
    if (!activeBrowserPresent) {
        $('#visitor-cobrowse-browser-select').addClass('ui-disabled');
        $('#visitor-cobrowse-action-select').addClass('ui-disabled');
        $('#visitor-cobrowse-language-select').addClass('ui-disabled');
    } else {
        $('#visitor-cobrowse-browser-select').removeClass('ui-disabled');
        $('#visitor-cobrowse-action-select').removeClass('ui-disabled');
        if ($('#visitor-cobrowse-action-select').val() != 0)
            $('#visitor-cobrowse-language-select').removeClass('ui-disabled');
    }
    if (externalIsDisabled) {
        $('#visitor-cobrowse-action-select').addClass('ui-disabled');
        $('#visitor-cobrowse-language-select').addClass('ui-disabled');
        $('#visitor-cobrowse-action-select').val(0);
    }
    if ($('#visitor-information-body').length > 0 && $('#visitor-cobrowse-iframe').data('visible') == '1') {
        if (thisUser.id == $('#visitor-cobrowse-iframe').data('browser').split('~')[0] || !activeBrowserPresent) {
            var vb = lzm_chatServerEvaluation.visitors.getVisitorBrowser($('#visitor-cobrowse-iframe').data('browser'));
            if (!activeBrowserPresent || vb[1] != null && $('#visitor-cobrowse-iframe').data('browser-url') != vb[1].h2[vb[1].h2.length - 1].url) {
                loadCoBrowsingContent(vb, !activeBrowserPresent);
            }
        }
    }
};

ChatVisitorClass.prototype.showVisitorInformation = function (thisUser, chatId, activeTab) {
    var that = this, i, externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1') {
            externalIsDisabled = false;
        }
    }
    thisUser = (typeof lzm_chatDisplay.infoUser.id != 'undefined' && lzm_chatDisplay.infoUser.id != '') ? lzm_chatDisplay.infoUser : thisUser;
    var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1000);
    that.lastVisitorTimestampUpdate = now;
    lzm_chatDisplay.ShowVisitorId = thisUser.id;

    var visitorName = (typeof thisUser.name != 'undefined' && thisUser.name != '') ? thisUser.name : thisUser.unique_name;
    var headerString = t('Visitor (<!--visitor_name-->)',[['<!--visitor_name-->', lzm_commonTools.htmlEntities(visitorName)]]);
    var footerString = lzm_displayHelper.createButton('cancel-visitorinfo', '', '', t('Close'), '', 'lr',
        {'margin-left': '4px'});
    var bodyString = '<div style="margin-top: 5px;" id="visitor-info-placeholder"></div>';
    var dialogData = {'visitor-id': thisUser.id, menu: t('Visitor Information: <!--name-->', [['<!--name-->', visitorName]]),
        'chat-type': '1', 'reload': ['chats', 'tickets']};
    var dialogid = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'visitor-information', {}, {}, {}, {}, '',
        dialogData, true, true);
    $('#visitor-information').data('dialog-id', dialogid);
    $('#visitor-information').data('visitor', thisUser);
    var detailsHtml = '<fieldset id="visitor-details-list" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Details') + '</legend>' +
        that.createVisitorInformation(thisUser) +
        '</fieldset>';
    var historyHtml = '<fieldset id="visitor-history-list" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('History') + '</legend><div id="visitor-history-placeholder"></div></fieldset>';
    var commentText = '', commentsHtml = '';
    try {
        commentText = (thisUser.c.length > 0) ? thisUser.c[0].text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '<br />') : '';
    } catch(e) {}
    commentsHtml = '<fieldset id="visitor-comment-list" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Comments') + '</legend>' +
        that.createVisitorCommentTable(thisUser) +
        '</fieldset>' +
        '<fieldset id="visitor-comment-text" class="lzm-fieldset" data-role="none" style="margin-top: 5px;">' +
        '<legend>' + t('Comment') + '</legend>' +
        lzm_commonTools.escapeHtml(commentText) +
        '</fieldset>';
    var invitationsHtml = '<fieldset id="visitor-invitation-list" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Chat Invites') + '</legend>' +
        that.createVisitorInvitationTable(thisUser) +
        '</fieldset>';
    var chatsHtml = '<div style="margin: 5px 0px 10px;">' + lzm_displayHelper.createButton('create-ticket-from-chat', '', '', t('Create Ticket'),
        '<i class="fa fa-plus"></i>', 'lr', {'margin-left': '4px'}, '', 20) +
        lzm_displayHelper.createButton('send-chat-transcript', '', '', t('Send transcript to...'), '<i class="fa fa-mail-forward"></i>', 'lr',
            {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('link-with-ticket', '', '', t('Link with Ticket'),
            '<i class="fa fa-link"></i>', 'lr', {'margin-left': '4px'}) +
        '</div>' +
        lzm_chatDisplay.archiveDisplay.createMatchingChats(chatId) +
        '<div id="chat-content-inner-div"><fieldset class="lzm-fieldset" data-role="none" id="chat-content-inner" style="margin-top: 5px;">' +
        '<legend>' + t('Text') + '</legend></fieldset></div>';
    var ticketsHtml = lzm_chatDisplay.ticketDisplay.createMatchingTickets() +
        '<fieldset class="lzm-fieldset" data-role="none" id="ticket-content-inner" style="margin-top: 5px;"><legend>' + t('Text') + '</legend></fieldset>';
    var brwsNo = 1, coBrowseSelBrws = '', coBrowseHtml = '';
    if (typeof thisUser.b != 'undefined') {
        var myGroup, myself = lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId), firstLanguage = '', firstGroup = '';
        var defaultLanguage = '', defaultGroup = '';
        if (myself != null && typeof myself.pm != 'undefined') {
            for (i=0; i<myself.pm.length; i++) {
                if (myself.pm[i].def == 1) {
                    defaultLanguage = (defaultLanguage == '') ? myself.pm[i].lang : defaultLanguage;
                }
                if (myself.pm[i].lang == thisUser.lang) {
                    firstLanguage = myself.pm[i].lang;
                }
            }
        }
        for (i=0; i<lzm_chatDisplay.myGroups.length; i++) {
            myGroup = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
            if (firstLanguage == '' && myGroup != null && typeof myGroup.pm != 'undefined' && myGroup.pm.length > 0) {
                for (var j=0; j<myGroup.pm.length; j++) {
                    if (myGroup.pm[j].def == 1) {
                        defaultLanguage = (defaultLanguage == '') ? myGroup.pm[j].lang : defaultLanguage;
                        defaultGroup = myGroup.id;
                    }
                    if (myGroup.pm[j].lang == thisUser.lang) {
                        firstLanguage = myGroup.pm[j].lang;
                        firstGroup = myGroup.id;
                    }
                }
            }
        }
        defaultLanguage = (defaultLanguage != '') ? defaultLanguage : 'en';
        firstLanguage = (firstLanguage != '') ? firstLanguage : defaultLanguage;
        firstGroup = (firstGroup != '') ? firstGroup : defaultGroup;
        var grEncId = (firstGroup != '') ? '~' + lz_global_base64_url_encode(firstGroup) : '';
        coBrowseHtml = '<fieldset class="lzm-fieldset" data-role="none" id="visitor-cobrowse"><legend>' + t('CoBrowse') + '</legend>' +
            '<div id="visitor-cobrowse-inner">' +
            '<div><select id="visitor-cobrowse-browser-select" class="lzm-select" data-role="none">';
        for (i=0; i<thisUser.b.length; i++) {
            if (thisUser.b[i].is_active && thisUser.b[i].ol == 0) {
                var lastH = thisUser.b[i].h2[thisUser.b[i].h2.length - 1];
                var lastHTime = lzm_chatTimeStamp.getLocalTimeObject(lastH.time * 1000, true);
                var lastHTimeHuman = lzm_commonTools.getHumanDate(lastHTime, 'shorttime', lzm_chatDisplay.userLanguage);
                coBrowseHtml += '<option value="' + thisUser.id + '~' + thisUser.b[i].id + '">' + t('Browser <!--brws_no-->: <!--brws_url--> (<!--brws_time-->)',
                    [['<!--brws_no-->', brwsNo], ['<!--brws_url-->', lastH.url], ['<!--brws_time-->', lastHTimeHuman]]) + '</option>';
                if  (coBrowseSelBrws == '') {
                    coBrowseSelBrws = thisUser.id + '~' + thisUser.b[i].id;
                }
                brwsNo++;
            }
        }
        coBrowseHtml += '</select></div><div style="margin-top: 10px;">';
        if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
            coBrowseHtml += '<div id="visitor-cobrowse-iframe-container">'
        }
        coBrowseHtml += '<iframe id="visitor-cobrowse-iframe" data-browser="' + coBrowseSelBrws + '"' +
            ' data-action="0" data-language="' + firstLanguage + '~group' + grEncId + '"></iframe>';
        if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
            coBrowseHtml +='</div>';
        }
        coBrowseHtml += '</div>';
        var disabledClass = (externalIsDisabled) ? ' ui-disabled' : '';
        coBrowseHtml += '<div style="margin-top: 6px;"><select id="visitor-cobrowse-action-select" class="lzm-select' + disabledClass + '" data-role="none">' +
            '<option value="0">' + t('No Forwarding (clicks deactivated)') + '</option>' +
            '<option value="1">' + t('Direct Forwarding (ask user before guiding)') + '</option>' +
            '<option value="2">' + t('Direct Forwarding (don\'t ask user; not recommended)') + '</option>' +
            '</select></div>' +
            '<div style="margin-top: 10px;"><label id="visitor-cobrowse-language-label" for="visitor-cobrowse-language-select" style="margin-right: 10px;">' +
            t('Language:') + '</label>' +
            '<select id="visitor-cobrowse-language-select" class="lzm-select ui-disabled" data-role="none">';
        var languageName = '', existingLanguages = [], selectedLanguage = '';
        if (myself != null && typeof myself.pm != 'undefined') {
            for (i=0; i<myself.pm.length; i++) {
                existingLanguages.push(myself.pm[i].lang.toLowerCase());
                languageName = lzm_chatDisplay.availableLanguages[myself.pm[i].lang.toLowerCase()];
                languageName = (typeof languageName != 'undefined') ? languageName : myself.pm[i].lang;
                selectedLanguage = (myself.pm[i].lang.toLowerCase() == firstLanguage.toLowerCase()) ? ' selected="selected"' : '';
                coBrowseHtml += '<option' + selectedLanguage + ' value="' + myself.pm[i].lang + '~operator~' +
                    lz_global_base64_url_encode(myself.id) + '">' +
                    t('<!--lang_name--> (User)', [['<!--lang_name-->', languageName]]) + '</option>';
            }
        }
        for (var k=0; k<lzm_chatDisplay.myGroups.length; k++) {
            myGroup = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[k]);
            if (myGroup != null && typeof myGroup.pm != 'undefined') {
                for (i=0; i<myGroup.pm.length; i++) {
                    if($.inArray(myGroup.pm[i].lang.toLowerCase(), existingLanguages) == -1) {
                        existingLanguages.push(myGroup.pm[i].lang.toLowerCase());
                        languageName = lzm_chatDisplay.availableLanguages[myGroup.pm[i].lang.toLowerCase()];
                        languageName = (typeof languageName != 'undefined') ? languageName : myGroup.pm[i].lang;
                        selectedLanguage = (myGroup.pm[i].lang.toLowerCase() == firstLanguage.toLowerCase()) ? ' selected="selected"' : '';
                        var pmText =
                        coBrowseHtml += '<option' + selectedLanguage + ' value="' + myGroup.pm[i].lang + '~group~' +
                            lz_global_base64_url_encode(myGroup.id) + '">' +
                            t('<!--lang_name--> (Group)', [['<!--lang_name-->', languageName]]) + '</option>';
                    }
                }
            }
        }
        coBrowseHtml += '</select></div></div></fieldset>';
    }
    var numberOfHistories = (typeof thisUser.rv != 'undefined') ? thisUser.rv.length + 1 : 0;
    var numberOfComments = (typeof thisUser.c != 'undefined') ? thisUser.c.length : 0;
    var numberOfInvites = (typeof thisUser.r != 'undefined') ? thisUser.r.length : 0;
    var numberOfChats = '...'; //lzm_chatServerEvaluation.chatArchive.chats.length;
    var numberOfTickets = '...'; //lzm_chatServerEvaluation.tickets.length;
    var tabsArray = [{name: t('Details'), content: detailsHtml},
        {name: t('CoBrowse'), content: coBrowseHtml},
        {name: t('History (<!--number_of_histories-->)', [['<!--number_of_histories-->', numberOfHistories]]), content: historyHtml},
        {name: t('Comments (<!--number_of_comments-->)', [['<!--number_of_comments-->', numberOfComments]]), content: commentsHtml},
        {name: t('Chat Invites (<!--number_of_invites-->)', [['<!--number_of_invites-->', numberOfInvites]]), content: invitationsHtml},
        {name: t('Chats (<!--number_of_chats-->)', [['<!--number_of_chats-->', numberOfChats]]), content: chatsHtml},
        {name: t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]), content: ticketsHtml}];
    lzm_displayHelper.createTabControl('visitor-info-placeholder', tabsArray, activeTab);
    $('#matching-chats-inner-div').data('chat-dialog-id', dialogid);
    $('#matching-chats-inner-div').data('chat-dialog-window', 'visitor-information');
    $('#matching-chats-inner-div').data('chat-dialog-data', dialogData);
    var currentHistory = that.createBrowserHistory(thisUser);
    var historyTabsArray = [{name: t('Active'), content: currentHistory, hash: md5('Active')}];
    if (typeof thisUser.rv != 'undefined') {
        for (i=0; i<thisUser.rv.length; i++) {
            var date = lzm_chatTimeStamp.getLocalTimeObject(thisUser.rv[i].e * 1000, true);
            var humanDate = lzm_commonTools.getHumanDate(date, 'all', lzm_chatDisplay.userLanguage);
            var recentHistoryHtml = '<div id="recent-history-' + thisUser.rv[i].id + '"' +
                ' class="recent-history-loading browser-history-container"></div>';
            historyTabsArray.push({name: humanDate, content: recentHistoryHtml, hash: thisUser.rv[i].id});
        }
    }
    var tabControlWidth = $('.visitor-info-placeholder-content').width() - 37;
    lzm_displayHelper.createTabControl('visitor-history-placeholder', historyTabsArray, 0, tabControlWidth);
    lzm_displayLayout.resizeVisitorDetails();
    var selectedChatId = $('#matching-chats-table').data('selected-chat-id');
    if (typeof selectedChatId != 'undefined') {
        if (selectedChatId == '') {
            $('#create-ticket-from-chat').addClass('ui-disabled');
        }
    }
    if (Object.keys(thisUser).length == 2) {
        $('#visitor-info-placeholder-tab-0').addClass('ui-disabled');
        $('#visitor-info-placeholder-tab-1').addClass('ui-disabled');
        $('#visitor-info-placeholder-tab-2').addClass('ui-disabled');
        $('#visitor-info-placeholder-tab-3').addClass('ui-disabled');
        $('#visitor-info-placeholder-tab-4').addClass('ui-disabled');
    }
    $('#visitor-info-placeholder-tab-5').addClass('ui-disabled');
    $('#visitor-info-placeholder-tab-6').addClass('ui-disabled');
    if (activeTab == 1) {
        $('#visitor-cobrowse-iframe').data('visible', '1');
    } else {
        $('#visitor-cobrowse-iframe').data('visible', '0');
    }

    $('.visitor-info-placeholder-tab').click(function() {
        lzm_displayLayout.resizeVisitorDetails();
        var tabNo = $(this).data('tab-no');
        if (tabNo == 1) {
            $('#visitor-cobrowse-iframe').data('visible', '1');
            loadCoBrowsingContent();
        } else {
            $('#visitor-cobrowse-iframe').data('visible', '0');
        }
    });

    $('.visitor-history-placeholder-tab').click(function() {
        var tabNo = $(this).data('tab-no');
        if (tabNo > 0) {
            lzm_chatPollServer.pollServerSpecial({visitorId: thisUser.id,
                recentHistoryId: $(this).data('hash')}, 'download_recent_history');
        }
        if (tabNo == 1) {
            loadCoBrowsingContent();
        }
    });

    $('#create-ticket-from-chat').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'create_tickets', {})) {
            showTicketDetails('', false, '', $('#matching-chats-table').data('selected-chat-id'), dialogid);
        } else {
            showNoPermissionMessage();
        }
    });

    $('#send-chat-transcript').click(function() {
        var chatId = $('#matching-chats-table').data('selected-chat-id');
        sendChatTranscriptTo(chatId, dialogid, 'visitor-information', dialogData);
    });

    $('#link-with-ticket').click(function() {
        var chatId = $('#matching-chats-table').data('selected-chat-id');
        showTicketLinker('', chatId, null, 'chat', true);
    });

    $('#cancel-visitorinfo').click(function() {
        lzm_chatPollServer.stopPolling();
        var archiveFetchTime = lzm_chatServerEvaluation.archiveFetchTime;
        var ticketFetchTime = lzm_chatServerEvaluation.ticketFetchTime;
        lzm_displayHelper.removeDialogWindow('visitor-information');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
        }
        try {
            lzm_chatPollServer.chatArchiveFilter = window['tmp-chat-archive-values'].filter;
            lzm_chatPollServer.chatArchivePage = window['tmp-chat-archive-values'].page;
            lzm_chatPollServer.chatArchiveLimit = window['tmp-chat-archive-values'].limit;
            lzm_chatPollServer.chatArchiveQuery = window['tmp-chat-archive-values'].query;
        } catch (e) {
            lzm_chatPollServer.chatArchiveFilter = '012';
            lzm_chatPollServer.chatArchivePage = 1;
            lzm_chatPollServer.chatArchiveLimit = 20;
            lzm_chatPollServer.chatArchiveQuery = '';
        }
        lzm_chatPollServer.chatArchiveFilterGroup = '';
        lzm_chatPollServer.chatArchiveFilterInternal = '';
        lzm_chatPollServer.chatArchiveFilterExternal = '';
        try {
            lzm_chatPollServer.ticketPage = window['tmp-ticket-values'].page;
            lzm_chatPollServer.ticketLimit = window['tmp-ticket-values'].limit;
            lzm_chatPollServer.ticketQuery = window['tmp-ticket-values'].query;
            lzm_chatPollServer.ticketFilter = window['tmp-ticket-values'].filter;
            lzm_chatPollServer.ticketFilterChannel = window['tmp-ticket-values'].filterChannel;
            lzm_chatPollServer.ticketSort = window['tmp-ticket-values'].sort;
        } catch(e) {
            lzm_chatPollServer.ticketPage = 1;
            lzm_chatPollServer.ticketLimit = 20;
            lzm_chatPollServer.ticketQuery = '';
            lzm_chatPollServer.ticketFilter = '012';
            lzm_chatPollServer.ticketFilterChannel = '01234567';
            lzm_chatPollServer.ticketSort = 'update';
        }
        lzm_chatPollServer.resetTickets = true;
        lzm_chatPollServer.resetChats = true;
        lzm_chatPollServer.startPolling();

        switchTicketListPresentation(ticketFetchTime, 0);
        switchArchivePresentation(archiveFetchTime, 0);
        lzm_chatDisplay.ShowVisitorId = '';
    });

    $('#visitor-cobrowse-browser-select').change(function() {
        $('#visitor-cobrowse-iframe').data('browser', $(this).val());
        loadCoBrowsingContent();
    });

    $('#visitor-cobrowse-action-select').change(function() {
        var action = $(this).val();
        $('#visitor-cobrowse-iframe').data('action', action);
        var browserUrlParts = $('#visitor-cobrowse-iframe').data('browser-url').split('://');
        var browserProtocol = browserUrlParts[0] + '://';
        browserUrlParts = (browserUrlParts.length > 1) ? browserUrlParts[1].split('/') : [''];
        var browserAddress = (browserUrlParts[0].indexOf(':') == -1) ? browserUrlParts[0] : browserUrlParts[0].split(':')[0];
        if (action != 0) {
            $('#visitor-cobrowse-iframe')[0].contentWindow.postMessage('unblock_page', browserProtocol + browserAddress);
            $('#visitor-cobrowse-language-select').removeClass('ui-disabled');
        } else {
            $('#visitor-cobrowse-iframe')[0].contentWindow.postMessage('block_page', browserProtocol + browserAddress);
            $('#visitor-cobrowse-language-select').addClass('ui-disabled');
        }
    });

    $('#visitor-cobrowse-language-select').change(function() {
        $('#visitor-cobrowse-iframe').data('language', $('#visitor-cobrowse-language-select').val());
    });
};

ChatVisitorClass.prototype.createVisitorInformation = function(thisUser) {
    var visitorInfoHtml = '', visitorInfoArray, that = this;
    if (typeof thisUser.id != 'undefined' && thisUser.id != '' && typeof thisUser.b_id != 'undefined') {
        var thisChatQuestion = '';
        var thisChatId = '';
        if (typeof thisUser.b_chat != 'undefined') {
            thisChatId = thisUser.b_chat.id;
            thisChatQuestion = (typeof thisUser.b_chat.eq != 'undefined') ? thisUser.b_chat.eq : '';
        }
        var visitorName = that.createVisitorStrings('cname', thisUser);
        var visitorEmail = that.createVisitorStrings('cemail', thisUser);
        var visitorCompany = that.createVisitorStrings('ccompany', thisUser);
        var visitorPhone = that.createVisitorStrings('cphone', thisUser);
        var visitorPage = that.createVisitorPageString(thisUser);
        var visitorSearchString = that.createVisitorStrings('ss', thisUser);
        var lastVisitedDate = lzm_chatTimeStamp.getLocalTimeObject(thisUser.vl * 1000, true);
        var visitorLastVisit = lzm_commonTools.getHumanDate(lastVisitedDate, 'full', lzm_chatDisplay.userLanguage);
        var tmpDate = that.calculateTimeDifferenece(thisUser, 'lastOnline', true);
        var onlineTime = '<span id="visitor-online-since">' + tmpDate[0] + '</span>';
        tmpDate = lzm_chatTimeStamp.getLocalTimeObject(tmpDate[1]);
        var humanDate = lzm_commonTools.getHumanDate(tmpDate, 'all', lzm_chatDisplay.userLanguage);
        var visitorAreas = that.createVisitorAreaString(thisUser);
        var visitorJavascript = (thisUser.js == '1') ? t('Yes') : t('No');
        var pagesBrowsed = 0;
        for (var l=0; l<thisUser.b.length; l++) {
            for (var m=0; m<thisUser.b[l].h2.length; m++) {
                pagesBrowsed += 1;
            }
        }
        var visitorStatus = t('<!--status_style_begin-->Online<!--status_style_end-->',[
            ['<!--status_style_begin-->','<span style="color:#00aa00; font-weight: bold;">'],['<!--status_style_end-->','</span>']
        ]);
        if (typeof thisUser.is_active != 'undefined' && thisUser.is_active == false) {
            visitorStatus = t('<!--status_style_begin-->Offline<!--status_style_end-->',[
                ['<!--status_style_begin-->','<span style="color:#aa0000; font-weight: bold;">'],['<!--status_style_end-->','</span>']
            ]);
        }

        var visitorIsChatting = false;
        for (var glTypInd=0; glTypInd<lzm_chatServerEvaluation.global_typing.length; glTypInd++) {
            if (lzm_chatServerEvaluation.global_typing[glTypInd].id.indexOf('~') != -1 &&
                lzm_chatServerEvaluation.global_typing[glTypInd].id.split('~')[0] == thisUser.id) {
                visitorIsChatting = true;
                break;
            }
        }
        var visitorWasDeclined = true;
        var chatPartners = [];
        if (visitorIsChatting) {
            for (var bInd=0; bInd<thisUser.b.length; bInd++) {
                if (typeof thisUser.b[bInd].chat.pn != 'undefined') {
                    for (var mInd=0; mInd<thisUser.b[bInd].chat.pn.member.length; mInd++) {
                        if (thisUser.b[bInd].chat.pn.member[mInd].dec == 0) {
                            visitorWasDeclined = false;
                            chatPartners.push(thisUser.b[bInd].chat.pn.member[mInd].id);
                        }
                    }
                }
            }
        } else {
            visitorWasDeclined = false;
        }

        var langName = (typeof lzm_chatDisplay.availableLanguages[thisUser.lang.toLowerCase()] != 'undefined') ?
            thisUser.lang + ' - ' + lzm_chatDisplay.availableLanguages[thisUser.lang.toLowerCase()] :
            (typeof lzm_chatDisplay.availableLanguages[thisUser.lang.toLowerCase().split('-')[0]] != 'undefined') ?
            thisUser.lang + ' - ' + lzm_chatDisplay.availableLanguages[thisUser.lang.toLowerCase().split('-')[0]] :
            thisUser.lang;
        visitorInfoArray = {
            details: {title: t('Visitor Details'), rows: [
                {title: t('Status'), content: visitorStatus},
                {title: t('Name'), content: visitorName},
                {title: t('Email'), content: visitorEmail},
                {title: t('Company'), content: visitorCompany},
                {title: t('Phone'), content: visitorPhone},
                {title: t('Language'), content: langName}
            ]},
            location: {title: t('Location'), rows: [
                {title: t('City'), content: thisUser.city},
                {title: t('Region'), content: thisUser.region},
                {title: t('Country'), content: '<span style="background: url(\'./php/common/flag.php?cc=' + thisUser.ctryi2 + '\') left no-repeat; padding-left: 23px;">' + thisUser.ctryi2 + '</span>'},
                {title: t('Time Zone'), content: t('GMT <!--tzo-->', [['<!--tzo-->', thisUser.tzo]])}
            ]},
            device: {title: t('Visitor\'s Computer / Device'), rows: [
                {title: t('Resolution'), content: thisUser.res},
                {title: t('Operating system'), content: thisUser.sys},
                {title: t('Browser'), content: thisUser.bro},
                {title: t('Javascript'), content: visitorJavascript},
                {title: t('IP address'), content: thisUser.ip},
                {title: t('Host'), content: thisUser.ho},
                {title: t('ISP'), content: thisUser.isp},
                {title: t('User ID'), content: thisUser.id}
            ]},
            misc: {title: t('Misc'), rows: [
                {title: t('Date'), content: humanDate},
                {title: t('Online Time'), content: onlineTime},
                {title: t('Area(s)'), content: visitorAreas},
                {title: t('Search string'), content: visitorSearchString},
                {title: t('Page'), content: visitorPage},
                {title: t('Pages browsed'), content: pagesBrowsed},
                {title: t('Visits'), content: thisUser.vts},
                {title: t('Last Visit'), content: visitorLastVisit},
                {title: t('Question'), content: lzm_commonTools.htmlEntities(thisChatQuestion)}
            ]}
        };
        if (visitorIsChatting && !visitorWasDeclined) {
            var chatPartnerNames = [];
            for (var i=0; i<chatPartners.length; i++) {
                var operator = lzm_chatServerEvaluation.operators.getOperator(chatPartners[i]);
                if (operator != null) {
                    chatPartnerNames.push(operator.name);
                }
            }
            visitorInfoArray.misc.rows.push({title: t('Chating with'), content: chatPartnerNames.join(', ')});
        }
    } else {
        visitorStatus = t('<!--status_style_begin-->Offline<!--status_style_end-->',[
            ['<!--status_style_begin-->','<span style="color:#aa0000; font-weight: bold;">'],['<!--status_style_end-->','</span>']
        ]);
        visitorInfoArray = {details: {title: t('Visitor Details'), rows: [
            {title: t('Status'), content: visitorStatus},{title: t('Name'), content: thisUser.unique_name}
        ]}};
    }
    for (var myKey in visitorInfoArray) {
        if (visitorInfoArray.hasOwnProperty(myKey)) {
            visitorInfoHtml += '<table class="visitor-list-table alternating-rows-table" style="width: 100%; margin-bottom: 8px;">' +
                '<thead><tr><th colspan="2">' + visitorInfoArray[myKey].title + '</th></tr></thead><tbody>';
            for (var k=0; k<visitorInfoArray[myKey].rows.length; k++) {
                var contentString = (visitorInfoArray[myKey].rows[k].content != '') ? visitorInfoArray[myKey].rows[k].content : '-';
                visitorInfoHtml += '<tr>' +
                    '<td style="text-align: left; width: 150px; font-weight: bold;" nowrap>' + visitorInfoArray[myKey].rows[k].title + '</td>' +
                    '<td style="text-align: left;">' + contentString + '</td>' +
                    '</tr>';
            }
            visitorInfoHtml += '</tbody></table>';
        }
    }
    return visitorInfoHtml;
};

ChatVisitorClass.prototype.createBrowserHistory = function (visitor, rv) {
    var that = this;
    var containerDivId = (typeof rv != 'undefined') ? ' id="recent-history-' + rv.id + '"' : '';
    var browserHistoryHtml = '<div' + containerDivId + ' class="browser-history-container">' +
        '<table class="browser-history visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;">' +
        '<thead><tr>' +
        '<th style="width: 1px !important;" nowrap>' + t('Browser') + '</th>' +
        '<th nowrap>' + t('Time') + '</th>' +
        '<th nowrap>' + t('Time span') + '</th>' +
        '<th nowrap>' + t('Area') + '</th>' +
        '<th nowrap>' + t('Title') + '</th>' +
        '<th nowrap>' + t('Url') + '</th>' +
        '<th nowrap>' + t('Referrer') + '</th>' +
        '</tr></thead><tbody>';
    var lineCounter = 0;
    var browserCounter = 1;
    try {
        var myB = (typeof rv == 'undefined') ? lzm_commonTools.clone(visitor.b) : lzm_commonTools.clone(rv.b);
        for (var i = 0; i < myB.length; i++) {
            if (myB[i].id.indexOf('OVL') == -1) {
                for (var j = 0; j < myB[i].h2.length; j++) {
                    var browserIcon = 'img/300-web2_gray.png';
                    var beginTime = lzm_chatTimeStamp.getLocalTimeObject(myB[i].h2[j].time * 1000, true);
                    var beginTimeHuman = lzm_commonTools.getHumanDate(beginTime, 'shorttime', lzm_chatDisplay.userLanguage);
                    var endTime = lzm_chatTimeStamp.getLocalTimeObject();
                    if (typeof myB[i].l != 'undefined') {
                        endTime = lzm_chatTimeStamp.getLocalTimeObject(myB[i].l * 1000, true);
                    } else if (myB[i].h2.length > j + 1) {
                        endTime = lzm_chatTimeStamp.getLocalTimeObject(myB[i].h2[j + 1].time * 1000, true);
                    } else if (typeof myB[i].h2[j].time2 != 'undefined') {
                        endTime = lzm_chatTimeStamp.getLocalTimeObject(myB[i].h2[j].time2 * 1000, true);
                    }
                    var endTimeHuman = lzm_commonTools.getHumanDate(endTime, 'shorttime', lzm_chatDisplay.userLanguage);
                    var timeSpan = that.calculateTimeSpan(beginTime, endTime);
                    var referer = '';
                    if (i == 0) {
                        referer = myB[i].ref;
                    }
                    if (j > 0) {
                        try {
                            referer = myB[i].h2[j - 1].url
                        } catch(ex) {}
                    }
                    if (typeof rv == 'undefined' && myB[i].is_active && j == myB[i].h2.length - 1) {
                        browserIcon = 'img/300-web2.png';
                    }
                    var externalPageUrl = '';
                    try {
                        externalPageUrl = myB[i].h2[j].url;
                    } catch(ex) {}
                    var refererLink = (referer != '') ? '<a class="lz_chat_link_no_icon" href="#" onclick="openLink(\'' + referer + '\')">' + referer : '';
                    var chatPageString = (myB[i].h2[j].cp == 1) ? ' (' + t('CHAT') + ')' : '';
                    var lastTimeSpanId = (j == myB[i].h2.length - 1) ? ' id="visitor-history-last-timespan-b' + i + '"' : '';
                    var lastTimeId = (j == myB[i].h2.length - 1) ? ' id="visitor-history-last-time-b' + i + '"' : '';
                    browserHistoryHtml += '<tr class="lzm-unselectable">' +
                        '<td nowrap><span style=\'background-image: url("' + browserIcon + '"); background-position: left center;' +
                        ' background-repeat: no-repeat; background-size: contain; margin-left: 3px; padding-left: 23px; font-weight: bold;\'>' +
                        (browserCounter) + '</span></td>' +
                        '<td nowrap' + lastTimeId + '>' + beginTimeHuman + ' - ' + endTimeHuman + '</td>' +
                        '<td nowrap' + lastTimeSpanId + '>' + timeSpan + '</td>' +
                        '<td nowrap>' + myB[i].h2[j].code + chatPageString + '</td>' +
                        '<td nowrap>' + myB[i].h2[j].title + '</td>' +
                        '<td nowrap><a class="lz_chat_link_no_icon" href="#" onclick="openLink(\'' + externalPageUrl + '\')">' + externalPageUrl + '</a></td>' +
                        '<td nowrap>' + refererLink + '</a></td>' +
                        '</tr>';
                    lineCounter++;
                }
                browserCounter++;
            }
        }
    } catch(e) {}
    browserHistoryHtml += '</tbody></table></div>';

    return browserHistoryHtml;
};

ChatVisitorClass.prototype.createVisitorCommentTable = function(visitor) {
    var userName = (typeof visitor.name != 'undefined' && visitor.name != '') ? visitor.name : visitor.unique_name;
    var menuEntry = t('Visitor Information: <!--name-->', [['<!--name-->', userName]]);
    var selectedRow = (typeof $('#visitor-comment-list').data('selected-row') != 'undefined') ?  $('#visitor-comment-list').data('selected-row') : 0;
    var commentTableHtml = '<table class="visitor-list-table alternating-rows-table lzm-unselectable" id="visitor-comment-table" style="width: 100%;">' +
        '<thead><tr>' +
        '<th style="width: 18px !important;"></th>' +
        '<th>' + t('Date') + '</th>' +
        '<th>' + t('Operator') + '</th>' +
        '</tr></thead><tbody>';
    try {
        for (var i=0; i<visitor.c.length; i++) {
            var operator = lzm_chatServerEvaluation.operators.getOperator(visitor.c[i].o).name;
            var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(visitor.c[i].c * 1000, true);
            var humanDate = lzm_commonTools.getHumanDate(tmpDate, 'all', lzm_chatDisplay.userLanguage);
            var selectedClass = (selectedRow == i) ? ' selected-table-line' : '';
            commentTableHtml += '<tr onclick="handleVisitorCommentClick(' + i + ');"' +
                ' style="cursor: pointer;" id="visitor-comment-line-' + i + '" class="visitor-comment-line lzm-unselectable' + selectedClass + '"' +
                ' data-comment-no="' + i + '">' +
                '<td><i class="fa fa-file-text-o"></i></td>' +
                '<td>' + humanDate + '</td>' +
                '<td>' + operator + '</td>' +
                '</tr>';
        }
    } catch(e) {}
    commentTableHtml += '</tbody></table><div style="margin-top: 20px; margin-bottom: 10px; text-align: right;">' +
        lzm_displayHelper.createButton('add-comment', '', 'addVisitorComment(\'' + visitor.id + '\', \'' + menuEntry + '\')', t('Add'), '', 'lr',
            {}, t('Add Comment')) + '</div>';

    return commentTableHtml;
};

ChatVisitorClass.prototype.createVisitorInvitationTable = function(visitor) {
    var operator, that = this;
    var invitationTableHtml = '<table class="visitor-list-table alternating-rows-table lzm-unselectable" id="visitor-invitation-table" style="width: 100%";>' +
        '<thead><tr>' +
        '<th style="width: 8px !important; padding-left: 11px; padding-right: 11px;"></th>' +
        '<th>' + t('Date') + '</th>' +
        '<th>' + t('Sender') + '</th>' +
        '<th>' + t('Event') + '</th>' +
        '<th>' + t('Shown') + '</th>' +
        '<th>' + t('Accepted') + '</th>' +
        '<th>' + t('Declined') + '</th>' +
        '<th>' + t('Canceled') + '</th>' +
        '</tr></thead><tbody>';
    try {
        for (var i=0; i<visitor.r.length; i++) {
            var invImage = 'img/632-skills_not.png';
            if (visitor.r[i].s != '' && visitor.r[i].a == '0' && visitor.r[i].ca == '' && visitor.r[i].de == '0') {
                invImage = 'img/632-skills.png';
            } else if (visitor.r[i].s != '' && visitor.r[i].a == '1' && visitor.r[i].ca == "") {
                invImage = 'img/632-skills_ok.png';
            }
            var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(visitor.r[i].c * 1000, true);
            var timeHuman = lzm_commonTools.getHumanDate(tmpDate, 'all', lzm_chatDisplay.userLanguage);
            var operatorName = '';
            try {
                operator = lzm_chatServerEvaluation.operators.getOperator(visitor.r[i].s);
                operatorName = (operator != null) ? operator.name : '';
            } catch(e) {}
            var myEvent = (visitor.r[i].e != '') ? visitor.r[i].e : '-';
            var isShown = (visitor.r[i].d == "1") ? t('Yes') : t('No');
            var isAccepted = (visitor.r[i].a == "1" && visitor.r[i].ca == "") ? t('Yes') : t('No');
            var isDeclined = (visitor.r[i].de == "1") ? t('Yes') : t('No');
            var isCanceled = (visitor.r[i].ca != "") ? t('Yes (<!--op_name-->)', [['<!--op_name-->', t('Timeout')]]) : t('No');
            try {
                operator = lzm_chatServerEvaluation.operators.getOperator(visitor.r[i].ca);
                isCanceled = (visitor.r[i].ca != "") ? t('Yes (<!--op_name-->)', [['<!--op_name-->', operator.name]]) : t('No');
            } catch(e) {}
            invitationTableHtml += '<tr class="lzm-unselectable">' +
                '<td style="background-image: url(\'' + invImage + '\'); background-position: center; background-repeat: no-repeat;"></td>' +
                '<td>' + timeHuman + '</td>' +
                '<td>' + operatorName + '</td>' +
                '<td>' + myEvent + '</td>' +
                '<td>' + isShown + '</td>' +
                '<td>' + isAccepted + '</td>' +
                '<td>' + isDeclined + '</td>' +
                '<td>' + isCanceled + '</td>' +
                '</tr>';
        }
    } catch(e) {}
    invitationTableHtml += '</tbody></table>';

    return invitationTableHtml;
};

ChatVisitorClass.prototype.updateShowVisitor = function() {
    var rtValue = false, that = this;
    if (typeof lzm_chatDisplay.infoUser.id != 'undefined' && lzm_chatDisplay.infoUser.id != '') {
        var visitor = lzm_chatServerEvaluation.visitors.getVisitor(lzm_chatDisplay.infoUser.id);
        if (visitor != null) {
            lzm_chatDisplay.infoUser = lzm_commonTools.clone(visitor);
            rtValue = true;
        }
    }
    return rtValue;
};

ChatVisitorClass.prototype.addVisitorComment = function(visitorId, menuEntry) {
    var dialogId = $('#visitor-information').data('dialog-id');
    var headerString = t('Add Comment');
    var footerString = lzm_displayHelper.createButton('comment-cancel', '', '', t('Cancel'), '', 'lr',
        {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
        lzm_displayHelper.createButton('comment-save', '', '', t('Ok'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'});
    var bodyString = '<fieldset id="comment-text" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Your Comment (will be visible to other operators but not to clients/website visitors)') + '</legend>' +
        '<textarea id="comment-input" data-role="none" style="padding: 4px;"></textarea>' +
        '</fieldset>';

    lzm_displayHelper.minimizeDialogWindow(dialogId, 'visitor-information',
        {'visitor-id': visitorId, menu: menuEntry}, 'external', false);
    lzm_displayHelper.createDialogWindow(headerString,bodyString, footerString, 'visitor-information', {}, {}, {}, {}, '',
        {'visitor-id': visitorId, menu: menuEntry}, true, true, dialogId + '_comment');

    $('#comment-text').css({'min-height': ($('#visitor-information-body').height() - 22) + 'px'});
    var inputHeight = Math.max(140, $('#visitor-information-body').height() - 48);
    $('#comment-input').css({
        border: '1px solid #ccc',
        'border-radius': '4px',
        width: ($('#visitor-information-body').width() - 32)+'px',
        height: inputHeight + 'px'
    });

    $('#comment-cancel').click(function() {
        lzm_displayHelper.removeDialogWindow('visitor-information');
        lzm_displayHelper.maximizeDialogWindow(dialogId);
    });
    $('#comment-save').click(function() {
        var commentText = $('#comment-input').val();
        $('#comment-cancel').click();
        lzm_chatUserActions.saveVisitorComment(visitorId, commentText);
    });
};

/********** Visitor invitation **********/
ChatVisitorClass.prototype.showVisitorInvitation = function(aVisitor) {
    var that = this;
    if(!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
        messageEditor = new ChatEditorClass('invitation-text', lzm_chatDisplay.isMobile, lzm_chatDisplay.isApp, lzm_chatDisplay.isWeb);
    }

    var text = '';
    var footerString = lzm_displayHelper.createButton('send-invitation', 'ui-disabled', '', t('Ok'), '', 'lr',
        {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-invitation', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px'});

    var dialogData = {
        editors: [{id: 'invitation-text', instanceName: 'messageEditor'}], 'visitor-id': aVisitor.id};
    lzm_displayHelper.createDialogWindow(t('Chat Invitation'), that.createVisitorInvitation(aVisitor), footerString, 'chat-invitation',
        {}, {}, {}, {}, '', dialogData);
    var invTextHeight = Math.max((lzm_chatDisplay.dialogWindowHeight - 235), 100);
    var textWidth = lzm_chatDisplay.dialogWindowWidth - 39;
    if (lzm_displayHelper.checkIfScrollbarVisible('chat-invitation-body')) {
        textWidth -= lzm_displayHelper.getScrollBarWidth();
    }

    var thisInvitationTextCss = {width: textWidth+'px', height:  invTextHeight+'px'};
    var thisInvitationTextInnerCss = {width: textWidth+'px', height:  (invTextHeight - 20)+'px', border: '1px solid #ccc',
        'background-color': '#f5f5f5'};
    var thisTextInputCss = {width: textWidth+'px', height: (invTextHeight - 20)+'px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'};
    var thisTextInputControlsCss;
    if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
        thisTextInputControlsCss = {width: textWidth+'px', height: '15px','box-shadow': 'none', 'border-radius': '0px',
            padding: '0px', margin: '7px 0px', 'text-align': 'left'};
    } else {
        thisTextInputControlsCss = {display: 'none'};
    }
    var thisTextInputBodyCss = {width: textWidth+'px', height: (invTextHeight - 50)+'px','box-shadow': 'none',
        'border-radius': '0px', padding: '0px', margin: '0px', 'background-color': '#ffffff', 'overflow-y': 'hidden',
        'border-top': '1px solid #ccc'};

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

    try {
        text = lzm_chatUserActions.getChatPM(aVisitor.id, $('#browser-selection').val(), 'invm', $('#language-selection').val().split('---')[0],
            $('#group-selection').val())['invm'];
    } catch (e) {
        text = '';
    }
    if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
        messageEditor.init(text, 'showVisitorInvitation');
    } else {
        $('#invitation-text').html(text);
    }

    $('#language-selection').change(function() {
        var selLanguage = $('#language-selection').val().split('---')[0];
        var selGroup = '';
        if ($('#language-selection').val().split('---')[1] == 'group') {
            selGroup = $('#group-selection').val();
        }
        try {
            text = lzm_chatUserActions.getChatPM(aVisitor.id, $('#browser-selection').val(), 'invm', selLanguage, selGroup)['invm'];
        } catch(e) {
            text = '';
        }
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            messageEditor.setHtml(text);
        } else {
            $('#invitation-text').html(text);
        }
    });

    $('#group-selection').change(function() {
        var selLanguage = $('#language-selection').val().split('---')[0];
        var selGroup = '';
        if ($('#language-selection').val().split('---')[1] == 'group') {
            selGroup = $('#group-selection').val();
        }
        try {
            text = lzm_chatUserActions.getChatPM(aVisitor.id, $('#browser-selection').val(), 'invm', selLanguage, selGroup)['invm'];
        } catch (e) {
            text = '';
        }
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            messageEditor.setHtml(text);
        } else {
            $('#invitation-text').html(text);
        }
    });

    if ($('#browser-selection').val() != -1) {
        $('#send-invitation').removeClass('ui-disabled');
    }
    $('#browser-selection').change(function() {
        if ($('#browser-selection').val() != -1) {
            $('#send-invitation').removeClass('ui-disabled');
        }
    });

    $('#withdraw-invitation').click(function() {
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            delete messageEditor;
        }
        cancelInvitation(aVisitor.id);
        lzm_displayHelper.removeDialogWindow('chat-invitation');

    });
    $('#cancel-invitation').click(function() {
        if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
            delete messageEditor;
        }
        lzm_displayHelper.removeDialogWindow('chat-invitation');
    });
    $('#send-invitation').click(function() {
        var thisGroup = lzm_chatServerEvaluation.groups.getGroup($('#group-selection').val());
        if (thisGroup == null || thisGroup.oh == '1') {
            if (!lzm_chatDisplay.isMobile && !lzm_chatDisplay.isApp) {
                text = messageEditor.grabHtml();
                delete messageEditor;
            } else {
                text = $('#invitation-text').val()
            }
            inviteExternalUser(aVisitor.id, $('#browser-selection').val(), text);
            lzm_displayHelper.removeDialogWindow('chat-invitation');
        } else {
            showOutsideOpeningMessage(thisGroup.name);
        }
    });
};

ChatVisitorClass.prototype.createVisitorInvitation = function(visitor) {
    var pmLanguages = lzm_chatUserActions.getPmLanguages('');
    var myGroups = lzm_chatDisplay.myGroups, i = 0;
    var browsers = [], that = this;
    try {
        for (i=0; i<visitor.b.length; i++) {
            //if (visitor.b[i].olc == 1 && visitor.b[i].id.indexOf('_OVL') == -1 && visitor.b[i].is_active) {
            var historyLength = visitor.b[i].h2.length;
            var browserType = (historyLength > 0) ? visitor.b[i].h2[historyLength - 1].cp : 1;
            if (browserType != 1 && visitor.b[i].id.indexOf('_OVL') == -1 && visitor.b[i].is_active) {
                var thisBrowser = lzm_commonTools.clone(visitor.b[i]);
                var historyLastEntry = thisBrowser.h2.length - 1;
                thisBrowser.url = thisBrowser.h2[historyLastEntry].url;
                var tmpDate = lzm_chatTimeStamp.getLocalTimeObject(thisBrowser.h2[historyLastEntry].time * 1000, true);
                thisBrowser.time = lzm_commonTools.getHumanDate(tmpDate, 'time', lzm_chatDisplay.userLanguage);
                browsers.push(thisBrowser);
            }
        }
    } catch(ex) {}
    var visitorLangString = visitor.lang.toUpperCase().substr(0,2);

    var languageSelectHtml = '<label for="language-selection" style="font-size: 12px;">' + t('Language:') + '</label><br />' +
        '<select id="language-selection" data-role="none">';
    visitorLangString = ($.inArray(visitorLangString, pmLanguages.group) != -1) ? visitorLangString : pmLanguages['default'][1];
    var defaultDefinedBy = pmLanguages['default'][0], langName;
    for (i=0; i<pmLanguages.group.length; i++) {
        langName = (typeof lzm_chatDisplay.availableLanguages[pmLanguages.group[i].toLowerCase().split('-')[0]] != 'undefined') ?
            pmLanguages.group[i] + ' - ' + lzm_chatDisplay.availableLanguages[pmLanguages.group[i].toLowerCase().split('-')[0]] : pmLanguages.group[i];
        if (defaultDefinedBy == 'group' && visitorLangString == pmLanguages.group[i]) {
            languageSelectHtml += '<option selected="selected" value="' + pmLanguages.group[i] + '---group">' + langName + ' (' + t('Group') + ')</option>';
        } else {
            languageSelectHtml += '<option value="' + pmLanguages.group[i] + '---group">' + langName + ' (' + t('Group') + ')</option>';
        }
    }
    for (i=0; i<pmLanguages.user.length; i++) {
        langName = (typeof lzm_chatDisplay.availableLanguages[pmLanguages.user[i].toLowerCase()] != 'undefined') ?
            pmLanguages.user[i] + ' - ' + lzm_chatDisplay.availableLanguages[pmLanguages.user[i].toLowerCase()] :
            (typeof lzm_chatDisplay.availableLanguages[pmLanguages.user[i].toLowerCase().split('-')[0]] != 'undefined') ?
                pmLanguages.user[i] + ' - ' + lzm_chatDisplay.availableLanguages[pmLanguages.user[i].toLowerCase().split('-')[0]] :
                pmLanguages.user[i];
        if (defaultDefinedBy == 'user' && visitorLangString == pmLanguages.user[i]) {
            languageSelectHtml += '<option selected="selected" value="' + pmLanguages.user[i] + '---user">' + langName + ' (' + t('Operator') + ')</option>';
        } else {
            languageSelectHtml += '<option value="' + pmLanguages.user[i] + '---user">' + langName + ' (' + t('Operator') + ')</option>';
        }
    }
    languageSelectHtml += '</select>';
    var groupSelectHtml = '<label for="group-selection" style="font-size: 12px;">' + t('Group:') + '</label><br />' +
        '<select id="group-selection" data-role="none">';
    for (i=0; i<myGroups.length; i++) {
        var thisGroup = lzm_chatServerEvaluation.groups.getGroup(myGroups[i]);
        if (thisGroup != null && typeof thisGroup.oh != 'undefined')
            groupSelectHtml += '<option value="' + myGroups[i] + '">' + lzm_chatServerEvaluation.groups.getGroup(myGroups[i]).name + '</option>';
    }
    groupSelectHtml += '</select>';
    var browserSelectHtml = '<label for="browser-selection" style="font-size: 12px;">' + t('Browser:') + '</label><br />' +
        '<select id="browser-selection" data-role="none">';
    if (browsers.length != 0) {
        for (i=0; i<browsers.length; i++) {
            browserSelectHtml += '<option value="' + browsers[i].id + '">Browser ' + (i + 1) + ': ' + browsers[i].url + ' (' + browsers[i].time + ')</option>';
        }
    } else {
        browserSelectHtml += '<option value="-1">' + t('No active browser') + '</option>';
    }
    browserSelectHtml += '</select>';
    var textInputHtml = '<label for="invitation-text" style="font-size: 12px; background-color: #ffffff;">' + t('Invitation text:') + '</label>' +
        '<div id="invitation-text-inner">' +
        '<div id="invitation-text-controls">' +
        lzm_displayHelper.createInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'messageEditor') +
        '</div><div id="invitation-text-body">' +
        '<textarea id="invitation-text" style="padding: 4px;"></textarea></div>' +
        '</div>';
    var invitationHtml = '<fieldset id="user-invite-form" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Chat Invitation') + '</legend>' +
        '<div id="user-invite-form-inner">' +
        '<table style="width: 100%;">' +
        '<tr><td style="width:50%;">' + languageSelectHtml + '</td><td style="width:50%;">' + groupSelectHtml + '</td></tr>' +
        '<tr><td colspan="2">' + browserSelectHtml + '</td></tr>' +
        '<tr><td colspan="2">' + textInputHtml + '</td></tr>' +
        '</table>' +
        '</div></fieldset>';

    return invitationHtml;
};

/********** Visitor filter **********/
ChatVisitorClass.prototype.showFilterCreation = function(visitor, filter, inDialog) {
    var headerString = t('Filter'), that = this;
    var visitorId = (visitor != null) ? visitor.id : '';
    var filterId = (filter != null) ? filter.filterid : '';
    var bodyString = '<div style="margin-top: 5px;" id="visitor-filter-placeholder"></div>';
    var footerString = lzm_displayHelper.createButton('save-filter', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-filter', '', '', t('Close'), '', 'lr',
            {'margin-left': '4px'});
    var dialogData = {'visitor-id': visitorId, 'filter-id': filterId};
    if (inDialog) {
        lzm_displayHelper.minimizeDialogWindow('filter_list_dialog', 'filter-list', {}, lzm_chatDisplay.selected_view, false);
    }
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'visitor-filter', {}, {}, {}, {}, '', dialogData, true, true);
    var filterHtml = that.createVisitorFilterMainHtml(visitor, filter);
    var reasonHtml = that.createVisitorFilterReasonHtml(filter);
    var expirationHtml = that.createVisitorFilterExpirationHtml(filter);
    var tabArray = [{name: headerString, content: filterHtml}, {name: t('Reason'), content: reasonHtml}, {name: t('Expiration'), content: expirationHtml}];
    lzm_displayHelper.createTabControl('visitor-filter-placeholder', tabArray);
    lzm_displayLayout.resizeFilterCreation();

    $('#filter-ip-check').click(function() {
        if ($('#filter-ip-check').prop('checked')) {
            $('#filter-ip').removeClass('ui-disabled');
        } else {
            $('#filter-ip').addClass('ui-disabled');
        }
    });
    $('#filter-id-check').click(function() {
        if ($('#filter-id-check').prop('checked')) {
            $('#filter-id').removeClass('ui-disabled');
        } else {
            $('#filter-id').addClass('ui-disabled');
        }
    });
    $('#filter-lg-check').click(function() {
        if ($('#filter-lg-check').prop('checked')) {
            $('#filter-lg').removeClass('ui-disabled');
        } else {
            $('#filter-lg').addClass('ui-disabled');
        }
    });
    $('#filter-co-check').click(function() {
        if ($('#filter-co-check').prop('checked')) {
            $('#filter-co').removeClass('ui-disabled');
        } else {
            $('#filter-co').addClass('ui-disabled');
        }
    });

    $('#cancel-filter').click(function() {
        lzm_displayHelper.removeDialogWindow('visitor-filter');
        if (inDialog) {
            lzm_displayHelper.maximizeDialogWindow('filter_list_dialog');
        } else {
            var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
            if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
                var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
                initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
            }
        }
    });
    $('#save-filter').click(function() {
        if (visitor != null || (visitor == null && filter == null)) {
            saveFilter('add');
        } else if (filter != null) {
            saveFilter('edit');
        }
        $('#cancel-filter').click();
        var loadingHtml = '<div id="filter-list-loading"></div>';
        $('#filter-list-body').append(loadingHtml).trigger('create');
        var myWidth = $('#filter-list-body').width() + 10;
        var myHeight = $('#filter-list-body').height() + 10;
        $('#filter-list-loading').css({position: 'absolute', left: '0px', top: '0px', width: myWidth+'px', height: myHeight+'px',
            'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
            'background-position': 'center', 'z-index': 1000, opacity: 0.85});
    });
};

ChatVisitorClass.prototype.createVisitorFilterMainHtml = function(visitor, filter) {
    var that = this;
    var visitorIp = (visitor != null) ? visitor.ip : (filter != null) ? filter.ip : '0.0.0.0';
    var visitorId = (visitor != null) ? visitor.id : (filter != null) ? filter.userid : '';
    var userIdChecked = (visitor != null || (filter != null && filter.userid != '')) ? ' checked="checked"' : '';
    var userIpChecked = (visitor != null || (filter != null && filter.ip != '' && filter.ip != '0.0.0.0') ||
        (visitor == null && filter == null)) ? ' checked="checked"' : '';
    var languagesChecked = (filter != null && filter.languages != '') ? ' checked="checked"' : '';
    var countriesChecked = (filter != null && filter.c != '') ? ' checked="checked"' : '';
    var visitorName = '';
    if (visitor != null) {
        for (var i=visitor.b.length - 1; i>=0; i--) {
            visitorName = (visitorName == '' && visitor.b[i].cname != '') ? visitor.b[i].cname : visitorName;
        }
    }
    var filterName = (filter != null) ? filter.filtername : (visitorName != '') ? visitorName : '-';
    var filterId = (filter != null) ? filter.filterid : '';
    var filterLanguages = (filter != null && typeof filter.languages != 'undefined') ? filter.languages.toUpperCase() : '';
    var filterCountries = (filter != null && typeof filter.c != 'undefined') ? filter.c.toUpperCase() : '';
    var selectedType = (filter != null && filter.exertion == 1) ? ' selected="selected"' : '';
    var appliesChatsChecked = (filter == null || filter.ac == 0) ? ' checked="checked"' : '';
    var appliesTicketsChecked = (filter == null || filter.at == 0) ? ' checked="checked"' : '';
    var appliesMonitoringChecked = (filter == null || filter.atr == 0) ? ' checked="checked"' : '';
    var visitorIdDisabled = ((visitor == null && filter == null) || (filter != null && filter.userid == '')) ? ' ui-disabled' : '';
    var visitorIpDisabled = (filter != null && (filter.ip == '' || filter.ip == '0.0.0.0')) ? ' ui-disabled' : '';
    var languagesDisabled = (filter == null || filter.languages == '') ? ' ui-disabled' : '';
    var countriesDisabled = (filter == null || filter.c == '') ? ' ui-disabled' : '';
    var disableUserId = (visitor == null && filter == null) ? ' ui-disabled' : '';
    var disableUseridCheck = ((visitor == null && filter == null) || (filter != null && filter.userid == '')) ? ' class="ui-disabled"' : '';

    var tliCode = t('Two letter ISO codes');
    var iso639Link = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes\');">' +
        tliCode + '</a>';
    var iso3166Link = '<a href="#" class="lz_chat_link_no_icon" onclick="openLink(\'http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements\');">' +
        tliCode + '</a>';
    var leftColumnWidth = (lzm_chatDisplay.FullscreenDialogWindowWidth > 500) ? 150 : (lzm_chatDisplay.FullscreenDialogWindowWidth > 400) ? 120 : 100;
    var inputWidth = Math.min(450, lzm_chatDisplay.FullscreenDialogWindowWidth - 83 - leftColumnWidth);
    var inputStyle = 'margin-bottom: 3px; min-width: 0px; max-width: 450px; width: ' + inputWidth + 'px';
    var filterHtml = '<fieldset class="lzm-fieldset" data-role="none" id="visitor-filter-main">' +
        '<legend>' + t('Filter') + '</legend>' +
        '<input type="hidden" value="' + filterId + '" id="filter-filterid" />' +
        '<table id="visitor-filter-main-table">' +
        '<tr>' +
        '<td style="width: ' + leftColumnWidth + 'px !important; padding-bottom: 10px; white-space: nowrap;"><span>' + t('Filter Name:') + '</span></td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input type="text" style="' + inputStyle + '" data-role="none" class="lzm-filter-input-main" id="filter-name" value="' + filterName + '" /></span></td>' +
        '</tr>' +
        '<tr>' +
        '<td></td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-active" checked="checked" />' +
        '<label for="filter-active">' + t('Filter active') + '</label></span></td>' +
        '</tr>' +
        '<tr>' +
        '<td style="padding-bottom: 10px; white-space: nowrap;"><span>' + t('Filter Type:') + '</span></td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><select style="min-width: 0px; max-width: 458px; width: ' + (inputWidth + 8) + 'px;" data-role="none" class="lzm-filter-input-main" id="filter-type">' +
        '<option value="0">' + t('Blacklist: Block all users matching this filter (default)') + '</option>' +
        '<option value="1"' + selectedType + '>' + t('Whitelist: Pass only users matching this filter') + '</option>' +
        '</select></span></td>' +
        '</tr>' +
        '</table>' +
        '</fieldset><fieldset style="margin-top: 10px;" class="lzm-fieldset" data-role="none" id="visitor-filter-base">' +
        '<legend>' + t('Based On') + '</legend>' +
        '<table id="visitor-filter-base-table">' +
        '<tr>' +
        '<td style="width: ' + leftColumnWidth + 'px !important; padding-bottom: 10px; white-space: nowrap;">' +
        '<span><input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-ip-check"' + userIpChecked + ' />' +
        '<label for="filter-ip-check">' + t('IP Address:') + '</label></span><br />&nbsp;</td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input type="text" style="' + inputStyle + '" data-role="none" class="lzm-filter-input-main' + visitorIpDisabled + '" id="filter-ip" value="' + visitorIp + '" /><br />' +
        t('Use * as wildcard') + '</span></td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2" style="text-align: center; padding: 4px 4px 10px 4px;"><span>' + t('- OR -') + '</span></td></tr>' +
        '<tr>' +
        '<td style="padding-bottom: 10px; white-space: nowrap;">' +
        '<span><input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-id-check"' + userIdChecked + disableUseridCheck + ' />' +
        '<label for="filter-id-check"' + disableUseridCheck + '>' + t('User ID:') + '</label></span></td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input disabled type="text" style="' + inputStyle + '" data-role="none" class="lzm-filter-input-main' + visitorIdDisabled + '" id="filter-id" value="' + visitorId + '" /></span></td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2" style="text-align: center; padding: 4px 4px 10px 4px;"><span>' + t('- OR -') + '</span></td></tr>' +
        '<tr>' +
        '<td style="padding-bottom: 10px; white-space: nowrap;">' +
        '<span><input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-lg-check"' + languagesChecked + ' />' +
        '<label for="filter-lg-check">' + t('Languages:') + '</label></span>' +
        '<br />&nbsp;</td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input type="text" style="' + inputStyle + '" data-role="none" class="lzm-filter-input-main' + languagesDisabled + '" id="filter-lg" value="' + filterLanguages + '" /></span>' +
        '<br /><span>' + t('comma separated, <!--link-->', [['<!--link-->', iso639Link]]) + '</span></td>' +
        '</tr>' +
        '<tr>' +
        '<td colspan="2" style="text-align: center; padding: 4px 4px 10px 4px;"><span>' + t('- OR -') + '</span></td>' +
        '</tr>' +
        '<tr>' +
        '<td style="padding-bottom: 10px; white-space: nowrap;">' +
        '<span><input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-co-check"' + countriesChecked + ' />' +
        '<label for="filter-co-check">' + t('Countries:') + '</label></span>' +
        '<br />&nbsp;</td>' +
        '<td style="padding-bottom: 10px;">' +
        '<span><input type="text" style="' + inputStyle + '" data-role="none" class="lzm-filter-input-main' + countriesDisabled + '" id="filter-co" value="' + filterCountries + '" />' +
        '</span><br />' + t('comma separated, <!--link-->', [['<!--link-->', iso3166Link]]) + '</td>' +
        '</tr>' +
        '</table>' +
        '</fieldset><fieldset style="margin-top: 10px;" class="lzm-fieldset" data-role="none" id="visitor-filter-applies">' +
        '<legend>' + t('Applies to') + '</legend>' +
        '<table id="visitor-filter-applies-table">' +
        '<tr><td style="padding-bottom: 10px;"><span>' +
        '<input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-chat-check"' + appliesChatsChecked + ' />' +
        '<label for="filter-chat-check">' + t('Chats') + '</label>' +
        '</span></td></tr>' +
        '<tr><td style="padding-bottom: 10px;"><span>' +
        '<input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-ticket-check"' + appliesTicketsChecked + ' />' +
        '<label for="filter-ticket-check">' + t('Tickets') + '</label>' +
        '</span></td></tr>' +
        '<tr><td style="padding-bottom: 10px;"><span>' +
        '<input style="vertical-align: middle;" type="checkbox" data-role="none" id="filter-monitoring-check"' + appliesMonitoringChecked + ' />' +
        '<label for="filter-monitoring-check">' + t('Monitoring / Tracking') + '</label>' +
        '</span></td></tr>' +
        '</table></fieldset>';
    return filterHtml;
};

ChatVisitorClass.prototype.createVisitorFilterReasonHtml = function(filter) {
    var that = this;
    var reason = (filter != null) ? filter.reason : '';
    var filterHtml = '<fieldset class="lzm-fieldset" data-role="none" id="visitor-filter-reason">' +
        '<legend>' + t('Reason') + '</legend>' +
        '<div style="margin-bottom: 10px;">' +
        t('Please enter a reason for banning this user. The reason text will be shown to the banned person and saved on the server.') +
        '</div>' +
        '<input type="text" data-role="none" style="width: 99%;" class="lzm-filter-input" id="filter-reason" value="' + reason + '" />' +
        '</fieldset>';
    return filterHtml;
};

ChatVisitorClass.prototype.createVisitorFilterExpirationHtml = function(filter) {
    var that = this;
    var expirationTime = (filter != null) ? Math.floor(parseInt(filter.expires) / 86400) : 7;
    var filterHtml = '<fieldset class="lzm-fieldset" data-role="none" id="visitor-filter-expiration">' +
        '<legend>' + t('Expiration') + '</legend>' +
        '<div>' +
        '<input type="checkbox" data-role="none" id="filter-exp-check" checked="checked" />' +
        '<label for="filter-exp-check">' + t('Expire after') + '</label>' +
        '&nbsp;&nbsp;<input type="text" data-role="none" style="width: 30px;" class="lzm-filter-input" id="filter-expire-after"' +
        ' value="' + expirationTime + '" />&nbsp;&nbsp;' + t('days') +
        '</div>' +
        '</fieldset>';
    return filterHtml;
};

ChatVisitorClass.prototype.showFilterList = function() {
    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0);
    for (var i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1') {
            externalIsDisabled = false;
        }
    }
    var disabledClass = (externalIsDisabled) ? 'ui-disabled' : '';
    var headerString = t('Filters');
    var footerString = lzm_displayHelper.createButton('add-filter-btn', disabledClass, '', t('New Filter'), '<i class="fa fa-plus"></i>', 'lr',
            {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('close-filters', '', '', t('Close'), '', 'lr',
            {'margin-left': '4px'});
    var dialogData = {};
    var bodyString = this.createFilterListHtml();
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'filter-list', {}, {}, {}, {}, '', dialogData, true, true, 'filter_list_dialog');
    lzm_displayLayout.resizeFilterList();

    $('#add-filter-btn').click(function() {
        showFilterCreation('', '', '', true);
    });

    $('#close-filters').click(function() {
        lzm_displayHelper.removeDialogWindow('filter-list');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var myText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(myText, 'CancelFilterCreation', lzm_chatDisplay.active_chat_reco);
        }
    });
};

ChatVisitorClass.prototype.updateFilterList = function() {
    var that = this;
    if ($('#filter-list-body').length > 0) {
        $('#filter-list-body').html(that.createFilterListHtml());
    }
};

ChatVisitorClass.prototype.createFilterListHtml = function() {
    var filterList = lzm_chatServerEvaluation.filters.getFilterList();
    var bodyString = '<table class="visitor-list-table alternating-rows-table lzm-unselectable" id="filters-table"' +
        ' style="width: 100%;"><thead><tr>' +
        '<th style="width: 20px !important;"><span style="padding:0px 10px;"></span></th>' +
        '<th style="width: 20px !important;"><span style="padding:0px 10px;"></span></th>' +
        '<th>' + t('Filter Name') + '</th><th>' + t('Criteria') + '</th><th>' + t('Created') + '</th>' +
        '<th>' + t('Edited') + '</th><th>' + t('Expires') + '</th>' +
        '</tr></thead><tbody>';
    for (var i=0; i<filterList.length; i++) {
        var criteria = [];
        if (filterList[i].ip != '' && filterList[i].ip != '0.0.0.0') {
            criteria.push(t('IP address'));
        }
        if (filterList[i].userid != '') {
            criteria.push(t('User ID'));
        }
        if (filterList[i].languages != '') {
            criteria.push(t('Language'));
        }
        if (filterList[i].c != '') {
            criteria.push(t('Country'));
        }
        criteria = criteria.join(', ');
        var creator = lzm_chatServerEvaluation.operators.getOperator(filterList[i].creator);
        var editor = lzm_chatServerEvaluation.operators.getOperator(filterList[i].editor);
        var ctTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(filterList[i].created) * 1000, true);
        var ctString = lzm_commonTools.getHumanDate(ctTime, 'date', lzm_chatDisplay.userLanguage);
        if (creator != null) {
            ctString += ' (' + creator.name + ')';
        }
        var edTime = lzm_chatTimeStamp.getLocalTimeObject(parseInt(filterList[i].edited * 1000), true);
        var edString = lzm_commonTools.getHumanDate(edTime, 'date', lzm_chatDisplay.userLanguage);
        if (editor != null) {
            edString += ' (' + editor.name + ')';
        }
        var exTime = lzm_chatTimeStamp.getLocalTimeObject((parseInt(filterList[i].created) + parseInt(filterList[i].expires)) * 1000, true);
        var exString = lzm_commonTools.getHumanDate(exTime, 'full', lzm_chatDisplay.userLanguage);
        var bwIcon = (filterList[i].exertion == 0) ? 'img/137-export.png' : 'img/134-import.png';
        var activeIcon = (filterList[i].active == 0) ? 'img/204-delete3_gray.png' : 'img/206-ok.png';
        var onclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
            ' onclick="selectFiltersLine(event, \'' + filterList[i].filterid + '\');"' : ' onclick="openFiltersListContextMenu(event, \'' + filterList[i].filterid + '\');"';
        var onconetxtMenuAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
            ' oncontextmenu="openFiltersListContextMenu(event, \'' + filterList[i].filterid + '\');"' : '';
        var ondblclickAction =  (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
            ' ondblclick="showFilterCreation(\'\', \'\', \'' + filterList[i].filterid + '\', true);"' : '';
        bodyString += '<tr class="filters-list-line" id="filters-list-line-' + filterList[i].filterid + '" style="cursor: pointer;"' +
            onclickAction + onconetxtMenuAction + ondblclickAction + '>' +
            '<td class="icon-column" style="background-image: url(\'' + activeIcon + '\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;"></td>' +
            '<td class="icon-column" style="background-image: url(\'' + bwIcon + '\'); background-repeat: no-repeat; background-position: center; background-size: 16px 16px;"></td>' +
            '<td>' + filterList[i].filtername + '</td>' +
            '<td>' + criteria + '</td>' +
            '<td>' + ctString + '</td>' +
            '<td>' + edString + '</td>' +
            '<td>' + exString + '</td>' +
            '</tr>';
    }
    bodyString += '</tbody></table>';

    return bodyString;
};

/********** Translate chat input **********/
ChatVisitorClass.prototype.showTranslateOptions = function(visitorChat, language) {
    var headerString = t('Auto Translation Setup'), that = this;
    var bodyString = '<div id="translate-options-placeholder" style="margin-top: 5px;"></div>';
    var footerString =  lzm_displayHelper.createButton('save-translate-options', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-translate-options', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px'});
    var dialogData = {};
    var translateOptions = that.createTranslateOptions(visitorChat, language);
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'translate-options', {}, {}, {}, {}, '', dialogData, false, false);
    lzm_displayHelper.createTabControl('translate-options-placeholder',
        [{name: t('Outgoing'), content: translateOptions[0]}, {name: t('Incoming'), content: translateOptions[1]}]);
    lzm_displayLayout.resizeTranslateOptions();
    if (lzm_chatDisplay.translationServiceError != null) {
        lzm_commonDialog.createAlertDialog(t('An error occured while fetching the languages from the Google Translate server.'), [{id: 'ok', name: t('Ok')}]);
        $('#alert-btn-ok').click(function() {
            lzm_commonDialog.removeAlertDialog();
            lzm_chatUserActions.getTranslationLanguages();
        });
    }

    $('#tmm-checkbox').change(function() {
        if ($('#tmm-checkbox').prop('checked')) {
            $('#tmm-select-div').removeClass('ui-disabled');
        } else {
            $('#tmm-select-div').addClass('ui-disabled');
        }
    });
    $('#tvm-checkbox').change(function() {
        if ($('#tvm-checkbox').prop('checked')) {
            $('#tvm-select-div').removeClass('ui-disabled');
        } else {
            $('#tvm-select-div').addClass('ui-disabled');
        }
    });

    $('#save-translate-options').click(function() {
        var tmm = {translate: $('#tmm-checkbox').prop('checked'), sourceLanguage: $('#tmm-source').val(), targetLanguage: $('#tmm-target').val()};
        var tvm = {translate: $('#tvm-checkbox').prop('checked'), sourceLanguage: $('#tvm-source').val(), targetLanguage: $('#tvm-target').val()};
        lzm_chatUserActions.saveTranslationSettings(visitorChat, tmm, tvm);
        $('#cancel-translate-options').click();
    });
    $('#cancel-translate-options').click(function() {
        lzm_displayHelper.removeDialogWindow('translate-options');
        var activeUserChat = lzm_chatServerEvaluation.userChats.getUserChat(lzm_chatDisplay.active_chat_reco);
        if (lzm_chatDisplay.selected_view == 'mychats' && activeUserChat != null) {
            var chatText = loadChatInput(lzm_chatDisplay.active_chat_reco);
            initEditor(chatText, 'minimzeDialogWindow', lzm_chatDisplay.active_chat_reco);
        }
    });
};

ChatVisitorClass.prototype.createTranslateOptions = function(visitorChat, language) {
    var translateOptions = ['', ''], selectedString = '', i = 0, that = this;
    var sourceLanguage = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tmm.sourceLanguage : lzm_chatUserActions.gTranslateLanguage;
    var targetLanguage = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tmm.targetLanguage : language;
    var translate = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tmm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tmm.translate : false;
    var checkedString = (translate) ? ' checked="checked"' : '';
    var disabledString = (!translate) ? ' class="ui-disabled"' : '';
    translateOptions[0] = '<fieldset data-role="none" class="lzm-fieldset" id="translate-my-messages"><legend>' +
        t('My messages') + '</legend>' +
        '<input' + checkedString + ' type="checkbox" data-role="none" id="tmm-checkbox" style="vertical-align: middle;" />' +
        '<label for="tmm-checkbox" style="padding-left: 5px;">' +
        t('Translate my messages') + '</label><br /><br /><br />' +
        '<div' + disabledString + ' id="tmm-select-div"><label for="tmm-source">' + t('Translate from:') + '</label><br />' +
        '<select data-role="none" class="lzm-select translation-language-select" id="tmm-source">';
    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == sourceLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[0] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            lzm_chatDisplay.translationLanguages[i].name + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }
    translateOptions[0] +='</select><br /><br />' +
        '<label for="tmm-target">' + t('Translate into:') + '</label><br />' +
        '<select data-role="none" class="lzm-select translation-language-select" id="tmm-target">';
    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == targetLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[0] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            lzm_chatDisplay.translationLanguages[i].name + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }
    translateOptions[0] +='</select></div></fieldset>';
    sourceLanguage = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tvm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tvm.sourceLanguage : language;
    targetLanguage = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tvm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tvm.targetLanguage : lzm_chatUserActions.gTranslateLanguage;
    translate = (typeof lzm_chatDisplay.chatTranslations[visitorChat] != 'undefined' && lzm_chatDisplay.chatTranslations[visitorChat].tvm != null) ?
        lzm_chatDisplay.chatTranslations[visitorChat].tvm.translate : false;
    checkedString = (translate) ? ' checked="checked"' : '';
    disabledString = (!translate) ? ' class="ui-disabled"' : '';
    translateOptions[1] = '<fieldset data-role="none" class="lzm-fieldset" id="translate-visitor-messages"><legend>' +
        t('Visitor\'s messages') + '</legend>' +
        '<input' + checkedString + ' type="checkbox" data-role="none" id="tvm-checkbox" style="vertical-align: middle;" />' +
        '<label for="tvm-checkbox" style="padding-left: 5px;">' +
        t('Translate visitor\'s messages') + '</label><br /><br /><br />' +
        '<div' + disabledString + ' id="tvm-select-div"><label for="tvm-source">' + t('Translate from:') + '</label><br />' +
        '<select data-role="none" class="lzm-select translation-language-select" id="tvm-source">';
    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == sourceLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[1] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            lzm_chatDisplay.translationLanguages[i].name + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }
    translateOptions[1] +='</select><br /><br />' +
        '<label for="tvm-target">' + t('Translate into:') + '</label><br />' +
        '<select data-role="none" class="lzm-select translation-language-select" id="tvm-target">';
    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
        selectedString = (lzm_chatDisplay.translationLanguages[i].language.toLowerCase() == targetLanguage.toLowerCase()) ? ' selected="selected"' : '';
        translateOptions[1] += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' +
            lzm_chatDisplay.translationLanguages[i].name + ' - ' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + '</option>';
    }
    translateOptions[1] +='</select></div></fieldset>';
    return translateOptions;
};

/********** Helper functions **********/
ChatVisitorClass.prototype.createVisitorStrings = function(type, aUser) {
    var returnListString = '-', visitorStringList = [], that = this;
    if (type.indexOf('.') != -1) {
        type = type.split('.');
    } else {
        type = [type];
    }
    if (aUser.b.length > 0) {
        for (var i=0; i<aUser.b.length; i++) {
            if (type.length == 1) {
                if (typeof aUser.b[i][type[0]] != 'undefined' && aUser.b[i][type[0]] != '' &&
                    $.inArray(aUser.b[i][type[0]], visitorStringList) == -1) {
                    visitorStringList.push(lzm_commonTools.htmlEntities(aUser.b[i][type[0]]));
                }
            } else {
                if (typeof aUser.b[i][type[0]][type[1]] != 'undefined' && aUser.b[i][type[0]][type[1]] != '' &&
                    $.inArray(aUser.b[i][type[0]][type[1]], visitorStringList) == -1) {
                    visitorStringList.push(lzm_commonTools.htmlEntities(aUser.b[i][type[0]][type[1]]));
                }
            }
        }
    }
    if (typeof visitorStringList != undefined && visitorStringList instanceof Array && visitorStringList.length > 0) {
        returnListString = visitorStringList.join(', ');
    }
    return returnListString;
};

ChatVisitorClass.prototype.createVisitorPageString = function(aUser) {
    var activeBrowserCounter = 0, activeBrowserUrl = '', that = this;
    try {
        for (var i=0; i< aUser.b.length; i++) {
            if (aUser.b[i].id.indexOf('OVL') == -1 && aUser.b[i].is_active) {
                activeBrowserCounter++;
                var historyLength = aUser.b[i].h2.length;
                var url = aUser.b[i].h2[historyLength - 1].url;
                var text = (url.length > 128) ? url.substring(0,124) : url;
                activeBrowserUrl = '<a href="#" class="lz_chat_link_no_icon" data-role="none" onclick="openLink(\'' + url + '\');">' + text + '</a>';
            }
        }
    } catch(ex) {}
    if (activeBrowserCounter > 1) {
        activeBrowserUrl = t('<!--number_of_browsers--> Browsers', [['<!--number_of_browsers-->', activeBrowserCounter]]);
    }
    return activeBrowserUrl;
};

ChatVisitorClass.prototype.createVisitorAreaString = function(aUser) {
    var areaStringArray = [], areaCodeArray = [], that = this;
    for (var i=0; i<aUser.b.length; i++) {
        for (var j=0; j<aUser.b[i].h2.length; j++) {
            if (aUser.b[i].h2[j].code != '' && $.inArray(aUser.b[i].h2[j].code, areaCodeArray) == -1) {
                var chatPageString = (aUser.b[i].h2[j].cp == 1) ? ' (' + t('CHAT') + ')' : '';
                areaCodeArray.push(aUser.b[i].h2[j].code);
                areaStringArray.push(aUser.b[i].h2[j].code + chatPageString);
            }
        }
    }

    return areaStringArray.join(', ');
};

ChatVisitorClass.prototype.chatInvitationSortFunction = function(a, b) {
    var rtValue = 0, that = this;
    if (a.c > b.c) {
        rtValue = -1;
    } else if (a.c < b.c) {
        rtValue = 1;
    }
    return rtValue;
};

ChatVisitorClass.prototype.calculateTimeDifferenece = function(aUser, type, includeSeconds) {
    var tmpBegin, tmpTimeDifference, tmpDiffSeconds, tmpDiffMinutes, tmpDiffHours, tmpDiffDays, tmpRest, returnString = '';
    var i, foo, that = this;
    if (type=='lastOnline') {
        tmpBegin = lzm_chatTimeStamp.getServerTimeString(null, true, 1);
        for (i=0; i<aUser.b.length; i++) {
            if (aUser.b[i].h2.length > 0) {
                tmpBegin = Math.min(aUser.b[i].h2[0].time * 1000, tmpBegin);
                foo = lzm_chatTimeStamp.getLocalTimeObject(tmpBegin, true);
            }
        }
    } else if (type=='lastActive') {
        tmpBegin = 0;
        for (i=0; i<aUser.b.length; i++) {
            if (aUser.b[i].h2.length > 0) {
                var newestH = aUser.b[i].h2.length - 1;
                tmpBegin = Math.max(aUser.b[i].h2[newestH].time * 1000, tmpBegin);
                foo = lzm_chatTimeStamp.getLocalTimeObject(tmpBegin, true);
            }
        }
    }
    if (tmpBegin == 0) {
        tmpBegin = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
    }
    tmpTimeDifference = Math.floor(lzm_chatTimeStamp.getServerTimeString(null, false, 1) - tmpBegin) / 1000;
    tmpDiffSeconds = Math.max(0, tmpTimeDifference % 60);
    tmpRest = Math.floor(tmpTimeDifference / 60);
    tmpDiffMinutes = Math.max(0, tmpRest % 60);
    tmpRest = Math.floor(tmpRest / 60);
    tmpDiffHours = Math.max(0, tmpRest % 24);
    tmpDiffDays = Math.max(0, Math.floor(tmpRest / 24));

    if (tmpDiffDays > 0) {
        returnString += tmpDiffDays + ' ';
    }
    returnString += '<!-- ' + tmpBegin + ' -->' + lzm_commonTools.pad(tmpDiffHours, 2) + ':' + lzm_commonTools.pad(tmpDiffMinutes, 2);
    if (typeof includeSeconds != 'undefined' && includeSeconds) {
        returnString += ':' + lzm_commonTools.pad(Math.round(tmpDiffSeconds), 2);
    }
    return [returnString, tmpBegin];
};

ChatVisitorClass.prototype.createCustomInputString = function(visitor, inputId) {
    var customInputString = null, i = 0, existingCustomInputs = {}, that = this;
    var myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(inputId);
    if (myCustomInput.type == 'ComboBox') {
        for (i=0; i<visitor.b.length; i++) {
            if (customInputString == null && typeof visitor.b[i]['cf' + inputId] != 'undefined') {
                customInputString = visitor.b[i]['cf' + inputId] + ', ' + myCustomInput.value[visitor.b[i]['cf' + inputId]];
                existingCustomInputs['cf' + inputId] = [visitor.b[i]['cf' + inputId]];
            } else if (typeof visitor.b[i]['cf' + inputId] != 'undefined' && $.inArray(visitor.b[i]['cf' + inputId], existingCustomInputs['cf' + inputId]) == -1) {
                customInputString += ', ' + visitor.b[i]['cf' + inputId] + ', ' + myCustomInput.value[visitor.b[i]['cf' + inputId]];
                existingCustomInputs['cf' + inputId].push(visitor.b[i]['cf' + inputId]);
            }
        }
    } else if (myCustomInput.type == 'CheckBox') {
        for (i=0; i<visitor.b.length; i++) {
            if (customInputString == null && typeof visitor.b[i]['cf' + inputId] != 'undefined') {
                customInputString = (visitor.b[i]['cf' + inputId] == 1) ? t('Yes') : t('No');
                existingCustomInputs['cf' + inputId] = [visitor.b[i]['cf' + inputId]];
            } else if (typeof visitor.b[i]['cf' + inputId] != 'undefined' && $.inArray(visitor.b[i]['cf' + inputId], existingCustomInputs['cf' + inputId]) == -1) {
                var newString = (visitor.b[i]['cf' + inputId] == 1) ? t('Yes') : t('No');
                customInputString += ', ' + newString;
                existingCustomInputs['cf' + inputId].push(visitor.b[i]['cf' + inputId]);
            }
        }
    } else {
        for (i=0; i<visitor.b.length; i++) {
            if ((customInputString == null || customInputString == '-') && typeof visitor.b[i]['cf' + inputId] != 'undefined') {
                customInputString = (visitor.b[i]['cf' + inputId] != '') ? lzm_commonTools.htmlEntities(visitor.b[i]['cf' + inputId]) : '-';
                existingCustomInputs['cf' + inputId] = [visitor.b[i]['cf' + inputId]];
            } else if (typeof visitor.b[i]['cf' + inputId] != 'undefined' && $.inArray(visitor.b[i]['cf' + inputId], existingCustomInputs['cf' + inputId]) == -1 &&
                visitor.b[i]['cf' + inputId] != '') {
                customInputString += ', ' + lzm_commonTools.htmlEntities(visitor.b[i]['cf' + inputId]);
                existingCustomInputs['cf' + inputId].push(visitor.b[i]['cf' + inputId]);
            }
        }
    }

    customInputString = (customInputString != null) ? customInputString : '-';
    return customInputString;
};

ChatVisitorClass.prototype.getVisitorOnlineTimes = function(visitor) {
    var rtObject = {}, that = this;
    rtObject['online'] = that.calculateTimeDifferenece(visitor, 'lastOnline', false)[0].replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;');
    rtObject['active'] = that.calculateTimeDifferenece(visitor, 'lastActive', false)[0].replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;');
    return rtObject;
};

ChatVisitorClass.prototype.getVisitorListLinePosition = function(visitor) {
    var nextLine = 'visitor-list-row-NONE', that = this;
    var aUserTimestamp = that.getVisitorOnlineTimestamp(visitor);
    var tmpTimestamp = 4294967295;
    var visitors = lzm_chatServerEvaluation.visitors.getVisitorList();
    for (var i=0; i<visitors.length; i++) {
        var thisUserTimestamp = that.getVisitorOnlineTimestamp(visitors[i]);
        if (thisUserTimestamp >= aUserTimestamp && visitors[i].id != visitor.id && thisUserTimestamp <= tmpTimestamp) {
            nextLine = 'visitor-list-row-' + visitors[i].id;
            tmpTimestamp = thisUserTimestamp;
        }
    }
    return nextLine;
};

ChatVisitorClass.prototype.getVisitorOnlineTimestamp = function(aUser) {
    var selectedUserOnlineBeginn = 4294967295, that = this;
    for (var i=0; i<aUser.b.length; i++) {
        if (typeof aUser.b[i].h2 != 'undefined') {
            for (var j=0; j<aUser.b[i].h2.length; j++) {
                selectedUserOnlineBeginn = (aUser.b[i].h2[j].time < selectedUserOnlineBeginn) ? aUser.b[i].h2[j].time : selectedUserOnlineBeginn;
            }
        }
    }
    return selectedUserOnlineBeginn;
};

ChatVisitorClass.prototype.calculateTimeSpan = function(beginTime, endTime) {
    var that = this;
    var secondsSpent = endTime.getSeconds() - beginTime.getSeconds();
    var minutesSpent = endTime.getMinutes() - beginTime.getMinutes();
    var hoursSpent = endTime.getHours() - beginTime.getHours();
    var daysSpent = endTime.getDate() - beginTime.getDate();
    if (daysSpent < 0) {
        var currentMonth = endTime.getMonth();
        var monthLength = 31;
        if ($.inArray(currentMonth, [3,5,8,10]) != -1) {
            monthLength = 30;
        }
        if (currentMonth == 1) {
            monthLength = 28;
        }
        daysSpent = (monthLength - beginTime.getDate()) + endTime.getDate();
    }
    if (secondsSpent < 0) {
        secondsSpent += 60;
        minutesSpent -= 1;
    }
    if (minutesSpent < 0) {
        minutesSpent += 60;
        hoursSpent -= 1;
    }
    if (hoursSpent < 0) {
        hoursSpent += 24;
        daysSpent -= 1;
    }
    var timeSpan = lzm_commonTools.pad(hoursSpent, 2) + ':' + lzm_commonTools.pad(minutesSpent, 2) + ':' +
        lzm_commonTools.pad(secondsSpent, 2);
    if (daysSpent > 0) {
        timeSpan = daysSpent + '.' + timeSpan;
    }
    return timeSpan;
};

ChatVisitorClass.prototype.createVisitorListContextMenu = function(myObject) {
    var externalIsDisabled = (lzm_chatDisplay.myGroups.length > 0), i = 0;
    for (i=0; i<lzm_chatDisplay.myGroups.length; i++) {
        var myGr = lzm_chatServerEvaluation.groups.getGroup(lzm_chatDisplay.myGroups[i]);
        if (myGr != null && myGr.external == '1') {
            externalIsDisabled = false;
        }
    }
    var contextMenuHtml = '', disabledClass = '';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-this-visitor-details" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showVisitorInfo(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();">' +
        t('Details') + '</span></div><hr />';
    disabledClass = (externalIsDisabled || (myObject.chatting == 'true' && myObject.declined == 'false')) ? ' class="ui-disabled"' : '';
    var invText = (myObject.status != 'requested') ? t('Chat Invitation') : t('Cancel invitation(s)');
    var onclickAction = (myObject.status != 'requested') ? 'showVisitorInvitation(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();' :
        'cancelInvitation(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="invite-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + '">' +
        invText + '</span></div>';
    var usesOlcChat = false;
    for (i=0; i<myObject.visitor.b.length; i++) {
        if (myObject.visitor.b[i].is_active && myObject.visitor.b[i].olc == 1) {
            usesOlcChat = true;
        }
    }
    disabledClass = (!usesOlcChat || externalIsDisabled || (myObject.chatting == 'true' && myObject.declined == 'false') || myObject.status == 'requested') ?
        ' class="ui-disabled"' : '';
    onclickAction = 'startVisitorChat(\'' + myObject.visitor.id + '\');removeVisitorListContextMenu();';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-comment" style="padding-left: 4px;"></i>' +
        '<span id="start-chat-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 4px; cursor:pointer;\' onclick="' + onclickAction + '">' +
        t('Start Chat') + '</span></div><hr />';
    disabledClass = (externalIsDisabled) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="ban-this-visitor" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showFilterCreation(\'' + myObject.visitor.id + '\'); removeVisitorListContextMenu();">' +
        t('Ban (add filter)') + '</span></div>';
    return contextMenuHtml;
};

ChatVisitorClass.prototype.createFilterListContextMenu = function(myObject) {
    var contextMenuHtml = '';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-plus" style="padding-left: 4px;"></i>' +
        '<span id="new-filter" class="cm-line cm-click" onclick="showFilterCreation(\'\', \'\', \'\', true);"' +
        ' style=\'margin-left: 5px; padding: 1px 15px 1px 7px;' +
        ' cursor:pointer;\'>' +
        t('New Filter') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-edit" style="padding-left: 4px;"></i>' +
        '<span id="eidt-filter" class="cm-line cm-click" onclick="showFilterCreation(\'\', \'\', \'' + myObject.filterid + '\', true);"' +
        ' style=\'margin-left: 5px; padding: 1px 15px 1px 4px;' +
        ' cursor:pointer;\'>' +
        t('Edit Filter') + '</span></div><hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="remove-filter" class="cm-line cm-click" onclick="deleteFilter(\'' + myObject.filterid + '\');"' +
        ' style=\'margin-left: 5px; padding: 1px 15px 1px 20px; cursor:pointer;\'>' +
        t('Remove (from server)') + '</span></div>';
    return contextMenuHtml;
};
