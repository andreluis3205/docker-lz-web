/****************************************************************************************
 * LiveZilla ChatTicketClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatTicketClass() {}

/********** Ticket list **********/
ChatTicketClass.prototype.createTicketList = function(tickets, ticketGlobalValues, page, sort, query, filter) {
    var that = this;
    lzm_chatDisplay.ticketListTickets = tickets;

    var ticketList = that.createTicketListHtml(tickets, ticketGlobalValues, page, sort, query, filter);
    var ticketListHtml = ticketList[0];
    var numberOfPages = ticketList[1];

    $('#ticket-list').html(ticketListHtml).trigger('create');
    if (lzm_chatDisplay.selectedTicketRow != '') {
        selectTicket(lzm_chatDisplay.selectedTicketRow, true);
    }

    if (page == 1) {
        $('#ticket-page-all-backward').addClass('ui-disabled');
        $('#ticket-page-one-backward').addClass('ui-disabled');
    }
    if (page == numberOfPages) {
        $('#ticket-page-one-forward').addClass('ui-disabled');
        $('#ticket-page-all-forward').addClass('ui-disabled');
    }

    if (sort == 'update') {
        $('#ticket-sort-wait').addClass('inactive-sort-column');
        $('#ticket-sort-date').addClass('inactive-sort-column');
    } else if (sort == 'wait') {
        $('#ticket-sort-update').addClass('inactive-sort-column');
        $('#ticket-sort-date').addClass('inactive-sort-column');
    } else {
        $('#ticket-sort-wait').addClass('inactive-sort-column');
        $('#ticket-sort-update').addClass('inactive-sort-column');
    }

    if (query != '') {
        $('#ticket-filter').addClass('ui-disabled');
    } else {
        $('#ticket-filter').removeClass('ui-disabled');
    }
    lzm_displayLayout.resizeTicketList();
    lzm_chatDisplay.styleTicketClearBtn();

    $('#search-ticket').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('ticket', tickets, e);
    });
    $('#ticket-create-new').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'create_tickets', {})) {
            showTicketDetails('', false);
        } else {
            showNoPermissionMessage();
        }
    });
    $('#ticket-show-emails').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'review_emails', {})) {
            toggleEmailList();
        } else {
            showNoPermissionMessage();
        }
    });

    $('#search-ticket-icon').click(function() {
        $('#search-ticket').val('');
        $('#search-ticket').keyup();
    });

    if (isNaN(numberOfPages)) {
        switchTicketListPresentation(lzm_chatServerEvaluation.ticketFetchTime, 0);
    }
};

ChatTicketClass.prototype.updateTicketList = function(tickets, ticketGlobalValues, page, sort, query, filter, forceRecreate) {
    var that = this, notificationText, notificationSound, selectedTicketExistsInList = false;
    for (var i=0; i<tickets.length; i++) {
        if (tickets[i].id == lzm_chatDisplay.selectedTicketRow || lzm_chatDisplay.selectedTicketRow == '') {
            selectedTicketExistsInList = true;
        }
    }
    if (!selectedTicketExistsInList) {
        try {
            lzm_chatDisplay.selectedTicketRow = (tickets.length > lzm_chatDisplay.selectedTicketRowNo) ?
                tickets[lzm_chatDisplay.selectedTicketRowNo].id : tickets[tickets.length - 1].id;
        } catch(ex) {}
    }
    forceRecreate = (typeof forceRecreate != 'undefined') ? forceRecreate : false;
    forceRecreate = (forceRecreate || lzm_chatDisplay.ticketGlobalValues.updating != ticketGlobalValues.updating) ? true : false;
    var ticketDutHasChanged = (lzm_chatDisplay.ticketGlobalValues['dut'] != ticketGlobalValues['dut']);
    if (!isNaN(parseInt(ticketGlobalValues.elmc)) && (!isNaN(parseInt(lzm_chatDisplay.ticketGlobalValues.elmc)) &&
        parseInt(ticketGlobalValues.elmc) > parseInt(lzm_chatDisplay.ticketGlobalValues.elmc))) {
        notificationText = (ticketGlobalValues.elmn != '') ? t('New message from <!--message_sender-->: <!--message_text-->',
            [['<!--message_sender-->', ticketGlobalValues.elmn], ['<!--message_text-->', ticketGlobalValues.elmt]]) : t('New Message');
        if (lzm_chatDisplay.playNewTicketSound == 1)
            lzm_chatDisplay.playSound('ticket', 'tickets');
        if (typeof lzm_deviceInterface != 'undefined') {
            notificationSound = (lzm_chatDisplay.playNewTicketSound == 1) ? 'NONE' : 'DEFAULT';
            try {
                lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, '', '', '3');
            } catch(e) {
                try {
                    lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, '', '');
                } catch(e) {}
            }
        }
        try {
            if (lzm_chatDisplay.selected_view != 'tickets' || $('.dialog-window-container').length > 0) {
                lzm_displayHelper.showBrowserNotification({
                    text: notificationText,
                    subject: t('New Message'),
                    action: 'selectView(\'tickets\'); closeOrMinimizeDialog();',
                    timeout: 10
                });
            }
        } catch(e) {}
    }
    if (!isNaN(parseInt(ticketGlobalValues.tlmc)) && (!isNaN(parseInt(lzm_chatDisplay.ticketGlobalValues.tlmc)) &&
        parseInt(ticketGlobalValues.tlmc) > parseInt(lzm_chatDisplay.ticketGlobalValues.tlmc))) {
        notificationText = (ticketGlobalValues.tlmn != '') ? t('New message from <!--message_sender-->: <!--message_text-->',
            [['<!--message_sender-->', ticketGlobalValues.tlmn], ['<!--message_text-->', ticketGlobalValues.tlmt]]) : t('New Message');
        if (lzm_chatDisplay.playNewTicketSound == 1)
            lzm_chatDisplay.playSound('ticket', 'tickets');
        if (typeof lzm_deviceInterface != 'undefined') {
            notificationSound = (lzm_chatDisplay.playNewTicketSound == 1) ? 'NONE' : 'DEFAULT';
            try {
                lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, '', '', '2');
            } catch(e) {
                try {
                    lzm_deviceInterface.showNotification(t('LiveZilla'), notificationText, notificationSound, '', '');
                } catch(e) {}
            }
        }
        try {
            if (lzm_chatDisplay.selected_view != 'tickets' || $('.dialog-window-container').length > 0) {
                lzm_displayHelper.showBrowserNotification({
                    text: notificationText,
                    subject: t('New Message'),
                    action: 'selectView(\'tickets\'); closeOrMinimizeDialog();',
                    timeout: 10
                });
            }
        } catch(e) {}
    }
    try {
        lzm_chatDisplay.ticketGlobalValues = lzm_chatDisplay.lzm_commonTools.clone(ticketGlobalValues);
        var selectedTicket = {id: ''};
        for (var j=0; j<tickets.length; j++) {
            var ticketEditor = (typeof tickets[j].editor != 'undefined' && tickets[j].editor != false) ? tickets[j].editor.ed : '';
            if (lzm_commonTools.checkTicketReadStatus(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets) == -1 &&
                (!lzm_chatDisplay.ticketReadStatusChecked || ticketEditor == lzm_chatDisplay.myId || ticketEditor == '')) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.removeTicketFromReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, true);
            }
            if (lzm_chatDisplay.ticketReadStatusChecked && ticketEditor != lzm_chatDisplay.myId && ticketEditor != '' && tickets[j].u > lzm_chatDisplay.ticketGlobalValues.mr) {
                lzm_chatDisplay.ticketReadArray = lzm_commonTools.addTicketToReadStatusArray(tickets[j].id, lzm_chatDisplay.ticketReadArray, tickets, false);
            }
            if (tickets[j].id == lzm_chatDisplay.selectedTicketRow) {
                for (var k=0; k<lzm_chatDisplay.ticketListTickets.length; k++) {
                    if (tickets[j].id == lzm_chatDisplay.ticketListTickets[k].id && tickets[j].md5 != lzm_chatDisplay.ticketListTickets[k].md5) {
                        selectedTicket = tickets[j];
                    }
                }
            }
        }
        lzm_chatDisplay.ticketListTickets  = tickets;

        var numberOfUnreadTickets = lzm_chatDisplay.ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length;
        numberOfUnreadTickets = (typeof numberOfUnreadTickets == 'number' && numberOfUnreadTickets >= 0) ? numberOfUnreadTickets : 0;
        if (lzm_chatDisplay.ticketGlobalValues.u != numberOfUnreadTickets) {
            lzm_chatDisplay.ticketGlobalValues.u = numberOfUnreadTickets;
            lzm_chatDisplay.createViewSelectPanel(lzm_chatDisplay.firstVisibleView);
        }
        $('#ticket-show-emails').children('span').html(t('Emails <!--number_of_emails-->',
            [['<!--number_of_emails-->', '(' + lzm_chatDisplay.ticketGlobalValues['e'] + ')']]));
        if (lzm_chatDisplay.ticketGlobalValues['e'] > 0) {
            $('#ticket-show-emails').removeClass('ui-disabled');
        }

        if ($('#visitor-information-body').length == 0) {
            if (lzm_chatDisplay.selected_view == 'tickets') {
                if (ticketDutHasChanged || forceRecreate) {
                    that.createTicketList(lzm_chatDisplay.ticketListTickets, ticketGlobalValues, page, sort, query, filter);
                }
            }

            if (numberOfUnreadTickets == 0 && lzm_chatDisplay.numberOfUnreadTickets != 0 && lzm_chatDisplay.ticketReadArray.length > 0) {
                setAllTicketsRead();
            }

            lzm_chatDisplay.numberOfUnreadTickets = numberOfUnreadTickets;

            if ($('#ticket-details').length > 0) {
                that.showOtherOpEditWarning(selectedTicket);
            }
            if(($('#ticket-details-placeholder').length == 1) && ($('#ticket-history-div').length == 1) && selectedTicket.id != '') {
                that.updateTicketDetails(selectedTicket);
            }
        } else {
            $('#matching-tickets-table').html(that.createMatchingTicketsTableContent(tickets));
            if ($('#visitor-info-placeholder').length > 0) {
                var numberOfTickets = tickets.length;
                $('#visitor-info-placeholder-tab-6').html(t('Tickets (<!--number_of_tickets-->)', [['<!--number_of_tickets-->', numberOfTickets]]));
                $('#visitor-info-placeholder-tab-6').removeClass('ui-disabled');
            }
        }
        if ($('#ticket-linker-first').length > 0) {
            var position = $('#ticket-linker-first').data('search').split('~')[0];
            var linkerType = $('#ticket-linker-first').data('search').split('~')[1];
            var inputChangeId = $('#ticket-linker-first').data('input');
            if (linkerType == 'ticket') {
                that.fillLinkData(position, $('#' + inputChangeId).val(), false, true);
            }
        }
    } catch(e) {}
};

ChatTicketClass.prototype.showOtherOpEditWarning = function(selectedTicket) {
    if (selectedTicket.id != '') {
        if (typeof selectedTicket.editor != 'undefined' && typeof selectedTicket.editor.ed != 'undefined' &&
            selectedTicket.editor.ed != lzm_chatDisplay.myId) {
            var otherOp = lzm_chatServerEvaluation.operators.getOperator(selectedTicket.editor.ed);
            var opName = (otherOp != null) ? otherOp.name : t('another operator');
            var warningMsg = t('This ticket is already processed by <!--op_name-->.', [['<!--op_name-->', opName]]);
            lzm_commonDialog.createAlertDialog(warningMsg, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    }
};

ChatTicketClass.prototype.createTicketListHtml = function(tickets, ticketGlobalValues, page, sort, query, filter) {
    var that = this, i = 0, emailDisabledClass = (ticketGlobalValues['e'] > 0) ? '' : 'ui-disabled';
    var createDisabledClass = '', displayClearBtn = (query == '') ? 'none' : 'inline', totalTickets = ticketGlobalValues.t;
    var unreadTickets = Math.max(0, ticketGlobalValues.r - lzm_chatDisplay.ticketReadArray.length + lzm_chatDisplay.ticketUnreadArray.length);
    lzm_chatDisplay.ticketGlobalValues.u = unreadTickets;
    var filteredTickets = ticketGlobalValues.q;
    var ticketListInfo1 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries, <!--filtered_tickets--> matching filter', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets], ['<!--filtered_tickets-->', filteredTickets]]);
    var ticketListInfo2 = t('<!--total_tickets--> total entries, <!--unread_tickets--> new entries', [['<!--total_tickets-->', totalTickets], ['<!--unread_tickets-->', unreadTickets]]);
    var ticketListHtml = '<div id="ticket-list-headline" class="lzm-dialog-headline"><h3>' + t('Tickets') + '</h3></div>' +
        '<div id="ticket-list-headline2" class="lzm-dialog-headline2">';
    if ($(window).width() > 800) {
        var ticketListInfo = (lzm_chatPollServer.ticketFilter.length == 4 && lzm_chatPollServer.ticketQuery == '') ? ticketListInfo2 : ticketListInfo1;
        ticketListHtml += '<span class="lzm-dialog-hl2-info">' + ticketListInfo + '</span>';
    }
    ticketListHtml += '<span style="float: right; margin-right: 129px; padding-top: 5px;">' +
        lzm_displayHelper.createButton('ticket-show-emails', emailDisabledClass, '', t('Emails <!--number_of_emails-->',
        [['<!--number_of_emails-->', '(' + ticketGlobalValues['e'] + ')']]), '<i class="fa fa-envelope-o"></i>', 'lr',
        {'margin-right': '4px'}, '', 20) +
        lzm_displayHelper.createButton('ticket-create-new', createDisabledClass, '', t('Create Ticket'), '<i class="fa fa-plus"></i>', 'lr',
            {'margin-right': '4px'}, '', 20) +
        lzm_displayHelper.createButton('ticket-filter', '', 'openTicketFilterMenu(event, \'' + filter + '\')', t('Filter'), '<i class="fa fa-filter"></i>', 'lr',
            {'margin-right': '8px'}, '', 10) +
        '</span>' +
        lzm_inputControls.createInput('search-ticket','', query, t('Search'), '<i class="fa fa-remove"></i>', 'text', 'b') +
        '</div>';
    var ticketListBodyCss = ((lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) || $(window).width() <= 1000) ? ' style="overflow: auto;"' : '';
    ticketListHtml += '<div id="ticket-list-body" class="lzm-dialog-body" onclick="removeTicketContextMenu();"' + ticketListBodyCss + '>';
    if ((!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) && $(window).width() > 1000) {
        ticketListHtml += '<div id="ticket-list-left" class="ticket-list">';
    }
    ticketListHtml += '<table class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;">' +
        '<thead><tr onclick="removeTicketContextMenu();">' +
        '<th style="width: 18px;">&nbsp;</th>' +
        '<th style="width: 18px;">&nbsp;</th>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.ticket.length; i++) {
        var thisTicketColumn = lzm_chatDisplay.mainTableColumns.ticket[i];
        if (thisTicketColumn.display == 1) {
            var cellId = (typeof thisTicketColumn.cell_id != 'undefined') ? ' id="' + thisTicketColumn.cell_id + '"' : '';
            var cellClass = (typeof thisTicketColumn.cell_class != 'undefined') ? ' class="' + thisTicketColumn.cell_class + '"' : '';
            var cellStyle = (typeof thisTicketColumn.cell_style != 'undefined') ? ' style="position: relative; white-space: nowrap; ' + thisTicketColumn.cell_style + '"' :
                ' style="position: relative; white-space: nowrap;"';
            var cellOnclick = (typeof thisTicketColumn.cell_onclick != 'undefined') ? ' onclick="' + thisTicketColumn.cell_onclick + '"' : '';
            var cellIcon = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ?
                '<span style="position: absolute; right: 4px;"><i class="fa fa-caret-down"></i></span>' : '';
            var cellRightPadding = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ?
                ' style="padding-right: 25px;"' : '';
            ticketListHtml += '<th' + cellId + cellClass + cellStyle + cellOnclick + '><span' + cellRightPadding + '>' + t(thisTicketColumn.title) + '</span>' + cellIcon + '</th>';
        }
    }
    ticketListHtml += '</tr></thead><tbody>';
    var lineCounter = 0;
    var numberOfTickets = (typeof ticketGlobalValues.q != 'undefined') ? ticketGlobalValues.q : ticketGlobalValues.t;
    var numberOfPages = Math.max(1, Math.ceil(numberOfTickets / ticketGlobalValues.p));
    if (ticketGlobalValues.updating) {
        ticketListHtml += '<tr><td colspan="15" style="font-weight: bold; font-size: 16px; text-align: center; padding: 20px;">' +
            t('The ticket database is updating.') +
            '</td></tr>';
    } else if (!isNaN(numberOfPages)) {
        var myFilter = lzm_chatPollServer.ticketFilter.split('');
        for (i=0; i<tickets.length; i++) {
            var thisTicketStatus = (typeof tickets[i].editor == 'undefined' || tickets[i].editor == false) ? '0' : '' + tickets[i].editor.st;
            if (tickets[i].del == 0 && $.inArray(thisTicketStatus, myFilter) != -1) {
                ticketListHtml += that.createTicketListLine(tickets[i], lineCounter, false);
                lineCounter++;
            }
        }
    } else {
        ticketListHtml += '';
    }
    ticketListHtml += '</tbody></table>';
    if ((!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) && $(window).width() > 1000) {
        ticketListHtml += '</div><div id="ticket-list-right" class="ticket-list"></div>';
    }
    ticketListHtml += '</div>';

    ticketListHtml += '<div id="ticket-list-footline" class="lzm-dialog-footline">';
    if (!isNaN(numberOfPages)) {
        ticketListHtml += lzm_displayHelper.createButton('ticket-page-all-backward', 'ticket-list-page-button', 'pageTicketList(1);', '', '<i class="fa fa-fast-backward"></i>', 'l',
            {'border-right-width': '1px'}) +
            lzm_displayHelper.createButton('ticket-page-one-backward', 'ticket-list-page-button', 'pageTicketList(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',
                {'border-left-width': '1px'}) +
            '<span style="padding: 0px 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_displayHelper.createButton('ticket-page-one-forward', 'ticket-list-page-button', 'pageTicketList(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',
                {'border-right-width': '1px'}) +
            lzm_displayHelper.createButton('ticket-page-all-forward', 'ticket-list-page-button', 'pageTicketList(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',
                {'border-left-width': '1px'});
    }
    ticketListHtml += '</div>';
    return [ticketListHtml, numberOfPages];
};

ChatTicketClass.prototype.createTicketListLine = function(ticket, lineCounter, inDialog) {
    var that = this, userStyle;
    ticket.messages.sort(that.ticketMessageSortfunction);
    if (lzm_chatDisplay.isApp) {
        userStyle = ' style="line-height: 22px !important; cursor: pointer;"';
    } else {
        userStyle = ' style="cursor: pointer;"';
    }
    var ticketDateObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.messages[0].ct * 1000, true);
    var ticketDateHuman = lzm_commonTools.getHumanDate(ticketDateObject, '', lzm_chatDisplay.userLanguage);
    var ticketLastUpdatedHuman = '-';
    if (ticket.u != 0) {
        var ticketLastUpdatedObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.u * 1000, true);
        ticketLastUpdatedHuman = lzm_commonTools.getHumanDate(ticketLastUpdatedObject, '', lzm_chatDisplay.userLanguage);
    }
    var waitingTime = lzm_chatTimeStamp.getServerTimeString(null, true) - ticket.w;
    var waitingTimeHuman = '-';
    if (waitingTime < 0) {
        waitingTimeHuman = '-';
    } else if (waitingTime > 0 && waitingTime <= 3600) {
        waitingTimeHuman = t('<!--time_amount--> minutes', [['<!--time_amount-->', Math.max(1, Math.floor(waitingTime / 60))]]);
    } else if (waitingTime > 3600 && waitingTime <= 86400) {
        waitingTimeHuman = t('<!--time_amount--> hours', [['<!--time_amount-->', Math.floor(waitingTime / 3600)]]);
    } else if (waitingTime > 86400){
        waitingTimeHuman = t('<!--time_amount--> days', [['<!--time_amount-->', Math.floor(waitingTime / 86400)]]);
    }
    var operator = '';
    var operatorId = '';
    var groupId = (typeof ticket.editor != 'undefined' && ticket.editor != false) ? ticket.editor.g : ticket.gr;
    var myGroup = lzm_chatServerEvaluation.groups.getGroup(groupId);
    var group = (myGroup != null) ? myGroup.name : groupId;
    if (typeof ticket.editor != 'undefined' && ticket.editor != false) {
        operator = (lzm_chatServerEvaluation.operators.getOperator(ticket.editor.ed) != null) ? lzm_chatServerEvaluation.operators.getOperator(ticket.editor.ed).name : '';
        operatorId = ticket.editor.ed;
    }
    var callBack = (ticket.messages[0].cmb == 1) ? t('Yes') : t('No');
    var ticketReadFontWeight = ' font-weight: bold;';
    var ticketReadImage = '<i class="fa fa-envelope"></i>';
    if ((ticket.u <= lzm_chatDisplay.ticketGlobalValues.mr && lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketUnreadArray) == -1) ||
        lzm_commonTools.checkTicketReadStatus(ticket.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1 ||
        (lzm_chatDisplay.ticketReadStatusChecked && operatorId != '' && operatorId != lzm_chatServerEvaluation.myId)) {
        ticketReadImage = '<i class="fa fa-envelope-o"></i>';
        ticketReadFontWeight = '';
    }
    if (ticket.t == 6) {
        ticketReadImage = '<i class="fa fa-facebook"></i>';
    } else if (ticket.t == 7) {
        ticketReadImage = '<i class="fa fa-twitter"></i>';
    }
    var ticketStatusImage = '<i class="fa fa-question-circle" style="color: #5197ff;"></i>';
    if (typeof ticket.editor != 'undefined' && ticket.editor != false) {
        if (ticket.editor.st == 1) {
            ticketStatusImage = '<i class="fa fa-gear" style="color: #808080;"></i>';
        } else if (ticket.editor.st == 2) {
            ticketStatusImage = '<i class="fa fa-check-circle" style="color: #009a00;"></i>';
        } else if (ticket.editor.st == 3) {
            ticketStatusImage = '<i class="fa fa-remove" style="color: #cc0000"></i>';
        }
    }
    var onclickAction = '', ondblclickAction = '', oncontextmenuAction = '';
    if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
        onclickAction = ' onclick="openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + '); return false;"';
    } else {
        onclickAction = ' onclick="selectTicket(\'' + ticket.id + '\', false, ' + inDialog + ');"';
        var dialogId = (!inDialog) ? '' : $('#visitor-information').data('dialog-id');
        ondblclickAction = ' ondblclick="showTicketDetails(\'' + ticket.id + '\', false, \'\', \'\', \'' + dialogId + '\');"';
        oncontextmenuAction = ' oncontextmenu="openTicketContextMenu(event, \'' + ticket.id + '\', ' + inDialog + '); return false;"';
    }
    var thisTicketSubject = (ticket.messages[0].s.length < 80) ? ticket.messages[0].s : ticket.messages[0].s.substr(0, 77) + '...';
    var columnContents = [{cid: 'last_update', contents: ticketLastUpdatedHuman}, {cid: 'date', contents: ticketDateHuman},
        {cid: 'waiting_time', contents: waitingTimeHuman}, {cid: 'ticket_id', contents: ticket.id},
        {cid: 'subject', contents: lzm_commonTools.htmlEntities(thisTicketSubject)},
        {cid: 'operator', contents: operator}, {cid: 'name', contents: lzm_commonTools.htmlEntities(ticket.messages[0].fn)},
        {cid: 'email', contents: lzm_commonTools.htmlEntities(ticket.messages[0].em)},
        {cid: 'company', contents: lzm_commonTools.htmlEntities(ticket.messages[0].co)},
        {cid: 'group', contents: group}, {cid: 'phone', contents: lzm_commonTools.htmlEntities(ticket.messages[0].p)},
        {cid: 'hash', contents: ticket.h}, {cid: 'callback', contents: callBack},
        {cid: 'ip_address', contents: ticket.messages[0].ip}];
    var tblCellStyle = ' style="white-space: nowrap; line-height: 16px;' + ticketReadFontWeight + '"';
    var ticketLineId = (!inDialog) ? 'ticket-list-row-' + ticket.id : 'matching-ticket-list-row-' + ticket.id;
    var selectedClass = (ticket.id == lzm_chatDisplay.selectedTicketRow) ? ' selected-table-line' : '';
    var lineHtml = '<tr data-line-number="' + lineCounter + '" class="ticket-list-row lzm-unselectable' + selectedClass +
        '" id="' + ticketLineId + '"' + userStyle + onclickAction + ondblclickAction + oncontextmenuAction + '>' +
        '<td ' + tblCellStyle.replace(/"$/,'text-align: center; padding: 5px 10px;"') + ' nowrap>' + ticketStatusImage + '</td>' +
        '<td' + tblCellStyle.replace(/"$/,'text-align: center; padding: 5px 10px;"') + ' nowrap>' + ticketReadImage + '</td>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.ticket.length; i++) {
        for (j=0; j<columnContents.length; j++) {
            if (lzm_chatDisplay.mainTableColumns.ticket[i].cid == columnContents[j].cid && lzm_chatDisplay.mainTableColumns.ticket[i].display == 1) {
                lineHtml += '<td' + tblCellStyle + '>' + columnContents[j].contents + '</td>';
            }
        }
    }
    lineHtml += '</tr>';
    return lineHtml;
};

ChatTicketClass.prototype.createMatchingTickets = function() {
    that = this;
    var tickets = [];
    var matchingTicketsHtml = '<fieldset class="lzm-fieldset" data-role="none" id="matching-tickets-inner">' +
        '<legend>' + t('Tickets') + '</legend>' +
        '<table id="matching-tickets-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;">' +
        that.createMatchingTicketsTableContent(tickets) +
        '</table>' +
        '</fieldset>';

    return matchingTicketsHtml;
};

ChatTicketClass.prototype.createMatchingTicketsTableContent = function(tickets) {
    var that = this, lineCounter = 0, i = 0;
    var tableHtml = '<thead><tr onclick="removeTicketContextMenu();">' +
        '<th style="width: 18px;">&nbsp;</th>' +
        '<th style="width: 18px;">&nbsp;</th>';
    for (i=0; i<lzm_chatDisplay.mainTableColumns.ticket.length; i++) {
        var thisTicketColumn = lzm_chatDisplay.mainTableColumns.ticket[i];
        if (thisTicketColumn.display == 1) {
            var inactiveColumnClass = '';
            if (typeof thisTicketColumn.cell_id != 'undefined') {
                inactiveColumnClass = ((lzm_chatPollServer.ticketSort == 'update' && thisTicketColumn.cell_id == 'ticket-sort-update') ||
                    (lzm_chatPollServer.ticketSort == 'wait' && thisTicketColumn.cell_id == 'ticket-sort-wait') ||
                    (lzm_chatPollServer.ticketSort == '' && thisTicketColumn.cell_id == 'ticket-sort-date')) ? '' : ' inactive-sort-column';
            }
            var cellId = (typeof thisTicketColumn.cell_id != 'undefined') ? ' id="' + thisTicketColumn.cell_id + '"' : '';
            var cellClass = (typeof thisTicketColumn.cell_class != 'undefined') ? ' class="' + thisTicketColumn.cell_class + inactiveColumnClass + '"' : '';
            var cellStyle = (typeof thisTicketColumn.cell_style != 'undefined') ? ' style="position: relative; white-space: nowrap; ' + thisTicketColumn.cell_style + '"' :
                ' style="position: relative; white-space: nowrap;"';
            var cellOnclick = (typeof thisTicketColumn.cell_onclick != 'undefined') ? ' onclick="' + thisTicketColumn.cell_onclick + '"' : '';
            var cellIcon = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ?
                '<span style="position: absolute; right: 4px;"><i class="fa fa-caret-down"></i></span>' : '';
            var cellRightPadding = (typeof thisTicketColumn.cell_class != 'undefined' && thisTicketColumn.cell_class == 'ticket-list-sort-column') ?
                ' style="padding-right: 25px;"' : '';
            tableHtml += '<th' + cellId + cellClass + cellStyle + cellOnclick + '><span' + cellRightPadding + '>' + t(thisTicketColumn.title) + '</span>' + cellIcon + '</th>';
        }
    }
    tableHtml += '</tr></thead><tbody>';
    for (i=0; i<tickets.length; i++) {
        if (tickets[i].del == 0) {
            tableHtml += that.createTicketListLine(tickets[i], lineCounter, true);
            lineCounter++;
        }
    }
    tableHtml += '</tbody>';

    return tableHtml;
};

/********** Ticket Details **********/
ChatTicketClass.prototype.updateTicketDetails = function(selectedTicket) {
    var selectedMessage = $('#ticket-history-table').data('selected-message'), that = this;
    var selectedGroup = lzm_chatServerEvaluation.groups.getGroup($('#ticket-details-group').val());
    var ticketId = selectedTicket.id + ' [' + selectedTicket.h + ']';
    var ticketDetails = that.createTicketDetails(ticketId, selectedTicket, {id: 0}, {cid: 0}, ' class="ui-disabled"', false,
        selectedGroup);

    var messageListHtml = that.createTicketMessageTable(selectedTicket, {id: ''}, selectedMessage, false, {cid: ''});
    $('#ticket-message-list').html('<legend>' + t('Ticket History') + '</legend>' + messageListHtml).trigger('create');
    $('#ticket-ticket-details').html('<legend>' + t('Ticket Details') + '</legend>' + ticketDetails.html).trigger('create');
    $('#message-line-' + selectedTicket.id + '_' + (selectedMessage)).addClass('selected-table-line');
    var edit = $('#message-details-inner').data('edit');
    var messageNo = $('#ticket-history-table').data('selected-message');
    var message = selectedTicket.messages[messageNo];
    var detailsHtml = '<legend>' + t('Details') + '</legend>' + lzm_chatDisplay.ticketDisplay.createTicketMessageDetails(message, {id: ''}, false, {cid: ''}, edit);
    var messageHtml = (edit) ? '<legend>' + t('Message') + '</legend><textarea id="change-message-text" data-role="none">' + message.mt + '</textarea>' :
        '<legend>' + t('Message') + '</legend>' + lzm_commonTools.htmlEntities(message.mt).replace(/\n/g, '<br />');
    $('#ticket-message-details').html(detailsHtml);
    $('#ticket-message-text').html(messageHtml);
    if (edit) {
        $('#ticket-message-details').css({'background-color': '#ffffe1'});
        $('#ticket-message-text').css({'background-color': '#ffffe1'});
        $('#change-message-text').css({width: '99%', height: ($('.ticket-details-placeholder-content').height() - 48)+'px',
            'border-radius': '4px', padding: '4px', border: '1px solid #ccc'});
    } else {
        $('#ticket-message-details').css({'background-color': '#ffffff'});
        $('#ticket-message-text').css({'background-color': '#ffffff'});
    }

    $('#message-details-inner').data('message', message);
    $('#message-details-inner').data('email', {id: ''});
    $('#message-details-inner').data('is-new', false);
    $('#message-details-inner').data('chat', {cid: ''});
    $('#message-details-inner').data('edit', edit);

    var commentsHtml = '<legend>' + t('Comments') + '</legend>' + that.createTicketCommentTable(selectedTicket, selectedMessage, '');
    $('#ticket-comment-list').html(commentsHtml);

    that.createTicketDetailsGroupChangeHandler(selectedTicket);
};

ChatTicketClass.prototype.showTicketDetails = function(ticket, isNew, email, chat, existingDialogId) {
    var that = this, saveClicked = false;
    isNew = (typeof isNew != 'undefined') ? isNew : false;
    existingDialogId = (typeof existingDialogId != 'undefined') ? existingDialogId : '';
    var disabledString = (isNew && email.id == '' && chat.cid == '') ? '' : ' class="ui-disabled"';
    var myCustomInput, myCustomFieldValue, i;
    lzm_chatDisplay.ticket = ticket;
    var selectedLanguage = '';
    var selectedGroup = lzm_chatServerEvaluation.groups.getGroupList()[0];
    var headerString = '';
    if (isNew) {
        headerString = t('Ticket');
    } else {
        if (ticket.messages[0].fn != '') {
            headerString = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticket.id],['<!--name-->', ticket.messages[0].fn]]);
        } else {
            headerString = t('Ticket (<!--ticket_id-->)',[['<!--ticket_id-->', ticket.id]]);
        }
    }
    var disabledButtonClass = (isNew) ? ' ui-disabled' : '';
    var footerString = '<span style="float: left;">' +
        lzm_displayHelper.createButton('reply-ticket-details', 'ticket-buttons' + disabledButtonClass, '', t('Reply'), '<i class="fa fa-mail-reply"></i>', 'lr',
            {'margin-left': '6px'}, '', 20) +
        lzm_displayHelper.createButton('ticket-actions', 'ticket-buttons' + disabledButtonClass, '', t('Actions'), '<i class="fa fa-wrench"></i>', 'lr',
            {'margin-left': '6px'}, '', 20) +
        '</span>' +
        lzm_displayHelper.createButton('save-ticket-details', 'ticket-buttons','', t('Ok'), '', 'lr',
            {'margin-left': '6px'}, '', 5) +
        lzm_displayHelper.createButton('cancel-ticket-details', 'ticket-buttons','', t('Cancel'), '', 'lr',
            {'margin-left': '6px'}, '', 9) +
        lzm_displayHelper.createButton('apply-ticket-details', 'ticket-buttons' + disabledButtonClass,'', t('Apply'), '', 'lr',
            {'margin-left': '6px'}, '', 9);

    var ticketHistoryHeadline = (isNew) ? t('Message') : t('Ticket History');

    var lastMessage = (typeof ticket.messages != 'undefined') ? ticket.messages.length - 1 : -1;
    var bodyString = '<div id="ticket-history-div" onclick="removeTicketMessageContextMenu();" style="margin-top: 5px;"><div id="ticket-history-placeholder"></div></div>';

    var historyTableHtml = '<fieldset class="lzm-fieldset" id="ticket-message-list" data-role="none">' +
        '<legend>' + t('Ticket History') + '</legend>' +
        that.createTicketMessageTable(ticket, email, lastMessage, isNew, chat) +
        '</fieldset>';

    bodyString += '<div id="ticket-details-div" onclick="removeTicketMessageContextMenu();" style="margin-top: 15px;"><div id="ticket-details-placeholder"></div></div>';

    var ticketId = (typeof ticket.id != 'undefined') ? ticket.id + ' [' + ticket.h + ']' : '';
    var myDetails = that.createTicketDetails(ticketId, ticket, email, chat, disabledString, isNew, selectedGroup);
    var myMessage = (isNew) ? {} : ticket.messages[lastMessage];
    var detailsHtml = '<fieldset class="lzm-fieldset" id="ticket-message-details" data-role="none">' +
        '<legend>' + t('Details') + '</legend>' +
        that.createTicketMessageDetails(myMessage, email, isNew, chat, false) +
        '</fieldset>';
    var ticketDetailsHtml = '<fieldset class="lzm-fieldset" id="ticket-ticket-details" data-role="none">' +
        '<legend>' + t('Ticket Details') + '</legend>' +
        myDetails.html +
        '</fieldset>';
    selectedLanguage = myDetails.language;
    selectedGroup = myDetails.group;

    var menuEntry = (!isNew) ? t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticket.id],['<!--name-->', ticket.messages[0].fn]]) :
        (email.id == '') ? t('New Ticket') : t('New Ticket (<!--name-->)', [['<!--name-->', email.n]]);
    var attachmentsHtml = '<fieldset class="lzm-fieldset" id="ticket-attachment-list" data-role="none">' +
        '<legend>' + t('Attachments') + '</legend>' +
        that.createTicketAttachmentTable(ticket, email, lastMessage, isNew) +
        '</fieldset>';
    var commentsHtml = '<fieldset class="lzm-fieldset" id="ticket-comment-list" data-role="none">' +
        '<legend>' + t('Comments') + '</legend>' +
        that.createTicketCommentTable(ticket, lastMessage, menuEntry) +
        '</fieldset>';

    var messageHtml = '<fieldset class="lzm-fieldset" id="ticket-message-text" data-role="none">' +
        '<legend>' + t('Message') + '</legend>';
    if (typeof ticket.messages != 'undefined') {
        messageHtml += lzm_commonTools.htmlEntities(ticket.messages[lastMessage].mt).replace(/\n/g, '<br />');
    }
    if (isNew) {
        var newTicketText = (email.id == '') ? (chat.cid == '') ? '' : chat.q : email.text;
        newTicketText = newTicketText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n +/g, '\n').replace(/\n+/g, '\r\n');
        messageHtml += '<textarea id="ticket-new-input" class="ticket-reply-text" style="padding: 4px;">' + newTicketText + '</textarea>';
    }
    messageHtml += '</fieldset>';

    var dialogData = {'ticket-id': ticket.id, 'email-id': email.id, menu: menuEntry};
    var defaultCss = {};
    var dialogId = '';
    if (existingDialogId == '' && email.id == '' && chat.cid == '') {
        dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details',
            defaultCss, {}, {}, {}, '', dialogData, true, true);
        $('#ticket-details-body').data('dialog-id', dialogId);
    } else if (existingDialogId != '' && email.id == '' && chat.cid == '') {
        lzm_displayHelper.minimizeDialogWindow(existingDialogId, 'visitor-information', {}, lzm_chatDisplay.selected_view, false);
        dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details',
            defaultCss, {}, {}, {}, '', dialogData, true, true);
        $('#ticket-details-body').data('dialog-id', dialogId);
    } else if (email.id == '' && chat.cid != '') {
        lzm_displayHelper.minimizeDialogWindow(chat['dialog-id'], 'visitor-information', {}, lzm_chatDisplay.selected_view, false);
        dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'visitor-information',
            defaultCss, {}, {}, {}, '', dialogData, true, true, chat['dialog-id'] + '_ticket');
        $('#visitor-information-body').data('dialog-id', dialogId);
    } else {
        lzm_displayHelper.minimizeDialogWindow(email['dialog-id'], 'email-list', {}, 'tickets', false);
        dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'email-list', defaultCss,
            {}, {}, {}, '', dialogData, true, true, email['dialog-id'] + '_ticket');
        $('#email-list-body').data('dialog-id', dialogId);
    }

    var ticketTabArray = [];
    if (!isNew || chat.cid != '') {
        ticketTabArray.push({name: ticketHistoryHeadline, content: historyTableHtml});
    }
    var ticketDetailsActiveTab = (chat.cid != '') ? 1 : 0;
    ticketTabArray.push({name: t('Ticket Details'), content: ticketDetailsHtml});
    lzm_displayHelper.createTabControl('ticket-history-placeholder', ticketTabArray, ticketDetailsActiveTab);
    lzm_displayHelper.createTabControl('ticket-details-placeholder', [{name: t('Message'), content: messageHtml},
        {name: t('Details'), content: detailsHtml}, {name: t('Attachments'), content: attachmentsHtml},
        {name: t('Comments'), content: commentsHtml}]);
    $('#message-line-' + ticket.id + '_' + (lastMessage)).addClass('selected-table-line');

    var myHeight = Math.max($('#ticket-details-body').height(), $('#email-list-body').height());
    myHeight = Math.max(myHeight, $('#visitor-information-body').height());
    var myWidth = Math.max($('#ticket-details-body').width(), $('#email-list-body').width());
    myWidth = Math.max(myWidth, $('#visitor-information-body').width());
    var historyHeight, detailsHeight;
    if (myHeight > 600) {
        historyHeight = 245;
        detailsHeight = myHeight - historyHeight - 90;
    } else {
        detailsHeight = (myHeight > 535) ? 265 : (myHeight > 340) ? 200 : 120;
        historyHeight = myHeight - detailsHeight - 90;
    }
    var newInputHeight = Math.max(detailsHeight - 48, 150);
    $('.ticket-history-placeholder-content').css({height: historyHeight + 'px'});
    $('.ticket-details-placeholder-content').css({height: detailsHeight + 'px'});
    $('#ticket-comment-list').css({'min-height': (detailsHeight - 22) + 'px'});
    $('#ticket-message-text').css({'min-height': (detailsHeight - 22) + 'px'});
    $('#ticket-message-details').css({'min-height': (detailsHeight - 22) + 'px'});
    $('#ticket-attachment-list').css({'min-height': (detailsHeight - 22) + 'px'});
    $('#ticket-message-list').css({'min-height': (historyHeight - 22) + 'px'});
    $('#ticket-ticket-details').css({'min-height': (historyHeight - 22) + 'px'});
    $('#ticket-new-input').css({height: newInputHeight + 'px', width: (myWidth - 54)+'px'});

    lzm_chatDisplay.ticketMessageWidth = $('#ticket-details-body').width() - 44 - lzm_displayHelper.getScrollBarWidth();
    $('#ticket-details-inner').css({width: Math.min(400, lzm_chatDisplay.ticketMessageWidth)});
    $('#message-details-inner').css({width: Math.min(400, lzm_chatDisplay.ticketMessageWidth)});

    $('.ui-collapsible-content').css({'overflow-x': 'auto'});

    that.createTicketDetailsGroupChangeHandler(ticket);

    $('#message-details-inner').data('message', myMessage);
    $('#message-details-inner').data('email', email);
    $('#message-details-inner').data('is-new', isNew);
    $('#message-details-inner').data('chat', chat);
    $('#message-details-inner').data('edit', false);

    $('#add-attachment').click(function() {
        if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
            lzm_displayHelper.minimizeDialogWindow(dialogId, 'ticket-details',
                {'ticket-id': -1, menu: menuEntry}, 'tickets', false);
            lzm_chatUserActions.addQrd('', true, dialogId, null, menuEntry);
        } else {
            showNotMobileMessage();
        }
    });
    $('#add-attachment-from-qrd').click(function() {
        lzm_displayHelper.minimizeDialogWindow(dialogId, 'ticket-details',
            {'ticket-id': -1, menu: menuEntry}, 'tickets', false);
        var fileResources = lzm_chatServerEvaluation.cannedResources.getResourceList('ti', {ty: '0,3,4'});
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(fileResources, 'ATTACHMENT~' + dialogId, menuEntry);
    });
    $('#remove-attachment').click(function() {
        var resources = $('#ticket-details-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#ticket-details-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });

    $('#ticket-actions').click(function(e) {
        e.stopPropagation();
        if (lzm_chatDisplay.showTicketMessageContextMenu) {
            removeTicketMessageContextMenu();
        } else {
            openTicketMessageContextMenu(e, ticket.id, '', true);
        }
    });
    $('#reply-ticket-details').click(function() {
        var opName = t('another operator'), confirmText = '';
        var openTicket = lzm_commonTools.clone(ticket);
        for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
            if (lzm_chatDisplay.ticketListTickets[i].id == ticket.id) {
                openTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
            }
        }
        if (typeof openTicket.editor != 'undefined' && openTicket.editor != false) {
            try {
                opName = lzm_chatServerEvaluation.operators.getOperator(openTicket.editor.ed).name;
            } catch (e) {}
            confirmText = t('This ticket is already processed by <!--op_name-->. Do you really want to take it over?', [['<!--op_name-->', opName]]);
        }
        var handleTicketTakeOver = function() {
            $('#reply-ticket-details').addClass('ui-disabled');
            if (typeof openTicket.editor == 'undefined' || !openTicket.editor || openTicket.editor.ed == '' ||
                openTicket.editor.ed != lzm_chatDisplay.myId || openTicket.editor.st != 1) {
                var myGroup = (typeof openTicket.editor != 'undefined' && openTicket.editor != false) ? openTicket.editor.g : openTicket.gr;
                saveTicketDetails(openTicket, openTicket.t, 1, myGroup, lzm_chatDisplay.myId, openTicket.l);
                if (typeof openTicket.editor == 'undefined' || openTicket.editor == false) {
                    var now = lzm_chatTimeStamp.getServerTimeString(null, true);
                    openTicket.editor = {id: openTicket.id, u: now, w: now, st: 0, ti: now, g: myGroup};
                }
                openTicket.editor.ed = lzm_chatDisplay.myId;
            }
            that.showMessageReply(openTicket, $('#ticket-history-table').data('selected-message'), selectedGroup, menuEntry);
        };
        if (typeof openTicket.editor == 'undefined' || !openTicket.editor || openTicket.editor.ed == '' || openTicket.editor.ed == lzm_chatDisplay.myId) {
            handleTicketTakeOver();
        } else {
            lzm_commonDialog.createAlertDialog(confirmText, [{id: 'ok', name: t('Ok')}, {id: 'cancel', name: t('Cancel')}]);
            $('#alert-btn-ok').click(function() {
                if (that.checkTicketTakeOverReply()) {
                    handleTicketTakeOver();
                    lzm_commonDialog.removeAlertDialog();
                }
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
        }
    });
    $('#apply-ticket-details').click(function() {
        var myStatus = $('#ticket-details-status').val();
        if (!that.checkTicketDetailsChangePermission(ticket, {status: myStatus})) {
            showNoPermissionMessage();
        } else {
            for (var i=0; i<lzm_chatServerEvaluation.tickets.length; i++) {
                if (lzm_chatServerEvaluation.tickets[i].id == ticket.id) {
                    ticket = lzm_commonTools.clone(lzm_chatServerEvaluation.tickets[i]);
                }
            }
            var attachments, comments, customFields = {};
            if (existingDialogId == '' && email.id == '' && chat.cid == '') {
                var mc = '';
                if ($('#message-details-inner').data('edit')) {
                    var changedMessage = $('#message-details-inner').data('message');
                    mc = {tid: ticket.id, mid: changedMessage.id,
                        n: $('#change-message-name').val(), e: $('#change-message-email').val(),
                        c: $('#change-message-company').val(), p: $('#change-message-phone').val(),
                        s: $('#change-message-subject').val(), t: $('#change-message-text').val(),
                        custom: []};
                    for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
                        myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
                        var myCustomInputValue = $('#change-message-custom-' + myCustomInput.id).val();
                        if (myCustomInput.active == 1 && typeof myCustomInputValue != 'undefined') {
                            mc.custom.push({id: lzm_chatServerEvaluation.inputList.idList[i], value:myCustomInputValue});
                        }
                    }
                }
                attachments = $('#ticket-details-placeholder-content-1').data('selected-resources');
                attachments = (typeof attachments != 'undefined') ? attachments : [];
                comments = $('#ticket-details-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
                    myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
                    if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                        myCustomFieldValue = (myCustomInput.type != 'CheckBox') ? $('#ticket-new-cf' + myCustomInput.id).val() :
                            (typeof $('#ticket-new-cf' + myCustomInput.id).attr('checked') != 'undefined') ? '1' : '0';
                        customFields[myCustomInput.id] = myCustomFieldValue;
                    }
                }
                saveTicketDetails(ticket, $('#ticket-details-channel').val(), $('#ticket-details-status').val(),
                    $('#ticket-details-group').val(), $('#ticket-details-editor').val(), $('#ticket-details-language').val(),
                    $('#ticket-new-name').val(), $('#ticket-new-email').val(), $('#ticket-new-company').val(), $('#ticket-new-phone').val(),
                    $('#ticket-new-input').val(), attachments, comments, customFields, {cid: ''}, mc);
            } else if (existingDialogId != '' && email.id == '' && chat.cid == '') {
                attachments = $('#ticket-details-placeholder-content-1').data('selected-resources');
                attachments = (typeof attachments != 'undefined') ? attachments : [];
                comments = $('#ticket-details-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                saveTicketDetails(ticket, $('#ticket-details-channel').val(), $('#ticket-details-status').val(),
                    $('#ticket-details-group').val(), $('#ticket-details-editor').val(), $('#ticket-details-language').val(),
                    $('#ticket-new-name').val(), $('#ticket-new-email').val(), $('#ticket-new-company').val(), $('#ticket-new-phone').val(),
                    $('#ticket-new-input').val(), attachments, comments, customFields);
            } else if (email.id == '' && chat.cid != '') {
                comments = $('#ticket-details-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                attachments = $('#ticket-details-placeholder-content-1').data('selected-resources');
                attachments = (typeof attachments != 'undefined') ? attachments : [];
                for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
                    myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
                    if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                        myCustomFieldValue = (myCustomInput.type != 'CheckBox') ? $('#ticket-new-cf' + myCustomInput.id).val() :
                            (typeof $('#ticket-new-cf' + myCustomInput.id).attr('checked') != 'undefined') ? '1' : '0';
                        customFields[myCustomInput.id] = myCustomFieldValue;
                    }
                }
                saveTicketDetails(ticket, $('#ticket-details-channel').val(), $('#ticket-details-status').val(),
                    $('#ticket-details-group').val(), $('#ticket-details-editor').val(), $('#ticket-details-language').val(),
                    $('#ticket-new-name').val(), $('#ticket-new-email').val(), $('#ticket-new-company').val(), $('#ticket-new-phone').val(),
                    $('#ticket-new-input').val(), attachments, comments, customFields, chat);
            } else {
                comments = $('#ticket-details-placeholder-content-2').data('comments');
                comments = (typeof comments != 'undefined') ? comments : [];
                for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
                    myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
                    if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                        myCustomFieldValue = (myCustomInput.type != 'CheckBox') ? $('#ticket-new-cf' + myCustomInput.id).val() :
                            (typeof $('#ticket-new-cf' + myCustomInput.id).attr('checked') != 'undefined') ? '1' : '0';
                        customFields[myCustomInput.id] = myCustomFieldValue;
                    }
                }
                lzm_chatDisplay.ticketsFromEmails.push({'email-id': email.id, ticket: ticket, channel: $('#ticket-details-channel').val(), status: $('#ticket-details-status').val(),
                    group: $('#ticket-details-group').val(), editor: $('#ticket-details-editor').val(), language: $('#ticket-details-language').val(),
                    name: $('#ticket-new-name').val(), email: $('#ticket-new-email').val(), company: $('#ticket-new-company').val(), phone: $('#ticket-new-phone').val(),
                    message: $('#ticket-new-input').val(), subject: $('#ticket-new-subject').val(), attachment: email.attachment, comment: comments, custom: customFields});
            }
            if ($('#message-details-inner').data('edit')) {
                toggleMessageEditMode(null, null, true);
            }
        }
    });
    $('#save-ticket-details').click(function() {
        saveClicked = true;
        $('#apply-ticket-details').click();
        $('#cancel-ticket-details').click();
    });
    $('#cancel-ticket-details').click(function() {
        if (email.id != '') {
            lzm_displayHelper.removeDialogWindow('email-list');
            maximizeDialogWindow(email['dialog-id']);
            if (!saveClicked) {
                setTimeout(function() {
                    $('#reset-emails').click();
                }, 50);
            }
        } else if (chat.cid != '') {
            lzm_displayHelper.removeDialogWindow('visitor-information');
            maximizeDialogWindow(chat['dialog-id']);
        } else if (existingDialogId != '') {
            lzm_displayHelper.removeDialogWindow('ticket-details');
            maximizeDialogWindow(existingDialogId);
        } else {
            lzm_displayHelper.removeDialogWindow('ticket-details');
        }
        lzm_chatDisplay.ticketOpenMessages = [];
    });

    return dialogId;
};

ChatTicketClass.prototype.updateAttachmentList = function() {
    var that = this,  tableString = '';
    var resources1 = $('#reply-placeholder-content-1').data('selected-resources');
    var resources2 = $('#ticket-details-placeholder-content-1').data('selected-resources');
    var resources = (typeof resources1 != 'undefined') ? resources1 : (typeof resources2 != 'undefined') ? resources2 : [];

    for (var i=0; i<resources.length; i++) {
        var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(resources[i].ti);
        tableString += '<tr id="attachment-line-' + i + '" class="attachment-line" style="cursor:pointer;"' +
            ' onclick="handleTicketAttachmentClick(' + i + ');">' +
            '<td style="text-align: center;">' + fileTypeIcon + '</td><td' +
            ' style="color: #787878; text-decoration: underline; white-space: nowrap; cursor: pointer;">' +
            lzm_commonTools.htmlEntities(resources[i].ti) + '</td></tr>';
    }
    $('#attachment-table').children('tbody').html(tableString);

};

ChatTicketClass.prototype.updateCommentList = function() {
    var that = this, tableString = '', comments = $('#ticket-details-placeholder-content-2').data('comments');
    comments = (typeof comments != 'undefined') ? comments : [];
    for (var j=0; j<comments.length; j++) {
        var commentTime = lzm_chatTimeStamp.getLocalTimeObject(comments[j].timestamp);
        tableString += '<tr id="comment-line-' + j + '" class="comment-line" style="cursor:pointer;"' +
            ' onclick="handleTicketCommentClick(' + j + ', \'' + lz_global_base64_encode(comments[j].text) + '\');">' +
            '<td style=""><i class="fa fa-file-text-o"></i></td>' +
            '<td>' + lzm_commonTools.getHumanDate(commentTime, '', lzm_chatDisplay.userLanguage) + '</td>' +
            '<td>' + lzm_chatDisplay.myName + '</td>' +
            '</tr>';
    }
    $('#comment-table').children('tbody').html(tableString);
};

ChatTicketClass.prototype.createTicketDetails = function(ticketId, ticket, email, chat, disabledString, isNew, selectedGroup) {
    var that = this, disabledClass = '', i = 0;
    var selectedString, selectedLanguage = '', availableLanguages = [];
    var detailsHtml = '<table id="ticket-details-inner" style="width: 400px;">';detailsHtml += '<tr>' +
        '<th><label for="ticket-details-id" style="font-size: 12px;">' + t('Ticket ID:') + '</label></th>' +
        '<td><div id="ticket-details-id" class="input-like">' + ticketId + '</div></td>' +
        '</tr>';
    detailsHtml += '<tr>' +
        '<th><label for="ticket-details-channel" style="font-size: 12px;">' + t('Channel:') + '</label></th>' +
        '<td><select id="ticket-details-channel" data-role="none"' + disabledString + '>';
    var channels = [t('Web'), t('Email'), t('Phone'), t('Misc'), t('Chat'), t('Rating')];
    if (!isNew) {
        channels.push(t('Facebook'));
        channels.push(t('Twitter'));
    }
    for (var aChannel=0; aChannel<channels.length; aChannel++) {
        selectedString = (aChannel == ticket.t || (email.id != '' && aChannel == 1)) ? ' selected="selected"' :
            (chat.cid != '' && aChannel == 4) ? ' selected="selected"' : '';
        detailsHtml += '<option' + selectedString + ' value="' + aChannel + '">' + channels[aChannel] + '</option>';
    }
    detailsHtml += '</select></td>' +
        '</tr><tr>' +
        '<th><label for="ticket-details-status" style="font-size: 12px;">' + t('Status:') + '</label></th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'change_ticket_status', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td><select id="ticket-details-status" data-role="none"' + disabledClass + '>';
    var states = [t('Open'), t('In Progress'), t('Closed'), t('Deleted')];
    for (var aState=0; aState<states.length; aState++) {
        selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && aState == ticket.editor.st) ? ' selected="selected"' : '';
        detailsHtml += '<option' + selectedString + ' value="' + aState + '">' + states[aState] + '</option>';
    }
    detailsHtml += '</select></td>' +
        '</tr><tr>' +
        '<th><label for="ticket-details-group" style="font-size: 12px;">' + t('Group:') + '</label></th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_groups', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td><select id="ticket-details-group" data-role="none"' + disabledClass + '>';
    var preSelectedGroup = '';
    if (email.id != '') {
        preSelectedGroup = email.g;
    } else {
        preSelectedGroup = (isNew) ? lzm_chatDisplay.myGroups[0] : '';
    }
    var groups = lzm_chatServerEvaluation.groups.getGroupList(), langName = '';
    for (i=0; i<groups.length; i++) {
        selectedString = '';
        if (typeof ticket.editor != 'undefined' && ticket.editor != false) {
            if (groups[i].id == ticket.editor.g) {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            }
        } else {
            if (typeof ticket.gr != 'undefined' && groups[i].id == ticket.gr) {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            } else if (groups[i].id == preSelectedGroup) {
                selectedString = ' selected="selected"';
                selectedGroup = groups[i];
                selectedLanguage = groups[i].pm[0].lang;
            }
        }
        detailsHtml += '<option value="' + groups[i].id + '"' + selectedString + '>' + groups[i].name + '</option>';
    }
    detailsHtml += '</select></td>' +
        '</tr><tr>' +
        '<th><label for="ticket-details-editor" style="font-size: 12px;">' + t('Editor:') + '</label></th>';
    disabledClass = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_operators', {})) ? '' : ' class="ui-disabled"';
    detailsHtml += '<td><select id="ticket-details-editor" data-role="none"' + disabledClass + '>' +
        '<option value="-1">' + t('None') + '</option>';
    var operators = lzm_chatServerEvaluation.operators.getOperatorList('name', selectedGroup.id);
    for (i=0; i<operators.length; i++) {
        if (operators[i].isbot != 1) {
            selectedString = (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.ed == operators[i].id) ? ' selected="selected"' : '';
            detailsHtml += '<option' + selectedString + ' value="' + operators[i].id + '">' + operators[i].name + '</option>';
        }
    }
    detailsHtml += '</select></td>' +
        '</tr><tr>' +
        '<th><label for="ticket-details-language" style="font-size: 12px;">' + t('Language:') + '</label></th>' +
        '<td><select id="ticket-details-language" data-role="none">';
    for (i=0; i<selectedGroup.pm.length; i++) {
        availableLanguages.push(selectedGroup.pm[i].lang);
        selectedString = '';
        if(typeof ticket.l != 'undefined' && selectedGroup.pm[i].lang == ticket.l)  {
            selectedString = ' selected="selected"';
            selectedLanguage = selectedGroup.pm[i].lang;
        }
        langName = (typeof lzm_chatDisplay.availableLanguages[selectedGroup.pm[i].lang.toLowerCase()] != 'undefined') ?
            selectedGroup.pm[i].lang + ' - ' + lzm_chatDisplay.availableLanguages[selectedGroup.pm[i].lang.toLowerCase()] :
            (typeof lzm_chatDisplay.availableLanguages[selectedGroup.pm[i].lang.toLowerCase().split('-')[0]] != 'undefined') ?
            selectedGroup.pm[i].lang + ' - ' + lzm_chatDisplay.availableLanguages[selectedGroup.pm[i].lang.toLowerCase().split('-')[0]] :
            selectedGroup.pm[i].lang;
        detailsHtml += '<option value="' + selectedGroup.pm[i].lang + '"' + selectedString + '>' + langName + '</option>';
    }
    if (typeof ticket.l != 'undefined' && $.inArray(ticket.l, availableLanguages) == -1) {
        langName = (typeof lzm_chatDisplay.availableLanguages[ticket.l.toLowerCase()] != 'undefined') ?
            ticket.l + ' - ' + lzm_chatDisplay.availableLanguages[ticket.l.toLowerCase()] :
            (typeof lzm_chatDisplay.availableLanguages[ticket.l.toLowerCase().split('-')[0]] != 'undefined') ?
                ticket.l + ' - ' + lzm_chatDisplay.availableLanguages[ticket.l.toLowerCase().split('-')[0]] :
                ticket.l;
        detailsHtml += '<option value="' + ticket.l + '" selected="selected">' + langName + '</option>';
        selectedLanguage = ticket.l;
    }
    detailsHtml += '</select></td>' +
        '</tr>' +
        '</table>';

    return {html: detailsHtml, language: selectedLanguage, group: selectedGroup}
};

ChatTicketClass.prototype.createTicketAttachmentTable = function(ticket, email, messageNumber, isNew) {
    var that = this, j, downloadUrl;
    var attachmentsHtml = '<table id="attachment-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%">' +
        '<thead><tr><th style=\'width: 18px !important;\'></th><th>' + t('File name') + '</th></tr></thead><tbody>';
    if (typeof ticket.messages != 'undefined' && typeof ticket.messages[messageNumber] != 'undefined' &&
        typeof ticket.messages[messageNumber].attachment != 'undefined') {
        for (j=0; j<ticket.messages[messageNumber].attachment.length; j++) {
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n),
                rid: ticket.messages[messageNumber].attachment[j].id
            });
            if (isNew) {
                attachmentsHtml += '<tr id="attachment-line-' + j + '" class="attachment- lzm-unselectable" style="cursor:pointer;"' +
                    ' onclick="handleTicketAttachmentClick(' + j + ');">';
            } else {
                attachmentsHtml += '<tr class="lzm-unselectable">';
            }
            var fileTypeIcon = lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(ticket.messages[messageNumber].attachment[j].n);
            attachmentsHtml += '<td class="icon-column" style="text-align: center;">' + fileTypeIcon + '</td><td' +
                ' style="color: #787878; text-decoration: underline; white-space: nowrap; cursor: pointer;"' +
                ' onclick="downloadFile(\'' + downloadUrl + '\');">' +
                lzm_commonTools.htmlEntities(ticket.messages[messageNumber].attachment[j].n) +
                '</td></tr>';
        }
    }
    if (email.id != '') {
        for (var l=0; l<email.attachment.length; l++) {
            downloadUrl = getQrdDownloadUrl({
                ti: lzm_commonTools.htmlEntities(email.attachment[l].n),
                rid: email.attachment[l].id
            });
            attachmentsHtml += '<tr class="lzm-unselectable">' +
                '<td class="icon-column" style="">' + lzm_chatDisplay.resourcesDisplay.getFileTypeIcon(email.attachment[l].n) + '</td><td' +
                ' style="color: #787878; text-decoration: underline; white-space: nowrap; cursor: pointer;"' +
                ' onclick="downloadFile(\'' + downloadUrl + '\');">' +
                lzm_commonTools.htmlEntities(email.attachment[l].n) +
                '</td>' +
                '</tr>';
        }
    }
    attachmentsHtml += '</tbody></table>';
    if(isNew && email.id == '') {
        var disabledClass = (ticket.t == 6 || ticket.t == 7) ? 'ui-disabled' : '';
        attachmentsHtml += '<div style="margin-top: 10px;">' +
            lzm_displayHelper.createButton('add-attachment', disabledClass, '', t('Add'), '<i class="fa fa-upload"></i>', 'lr',
                {}, t('Add Attachment')) +
            lzm_displayHelper.createButton('add-attachment-from-qrd', disabledClass, '', t('Add from resource'), '<i class="fa fa-database"></i>', 'lr',
                {}, t('Add Attachment from Resource')) +
            lzm_displayHelper.createButton('remove-attachment', 'ui-disabled', '', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',
                {}, t('Remove Attachment')) +
            '</div>';
    }

    return attachmentsHtml;
};

ChatTicketClass.prototype.createTicketCommentTable = function(ticket, messageNumber, menuEntry) {
    var that = this;
    var commentsHtml = '<table id="comment-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%">' +
        '<thead><tr><th style=\'width: 18px !important;\'></th><th>' + t('Date') + '</th><th>' + t('Operator') + '</th></tr></thead><tbody>';
    if (typeof ticket.messages != 'undefined' && typeof ticket.messages[messageNumber] != 'undefined') {
        for (var k=0; k<ticket.messages[messageNumber].comment.length; k++) {
            var thisComment = ticket.messages[messageNumber].comment[k];
            var operator = lzm_chatServerEvaluation.operators.getOperator(thisComment.o);
            var commentTime = lzm_chatTimeStamp.getLocalTimeObject(thisComment.t * 1000, true);
            commentsHtml += '<tr id="comment-line-' + k + '" class="comment-line lzm-unselectable" style="cursor:pointer;"' +
                ' onclick="handleTicketCommentClick(' + k + ', \'' + lz_global_base64_encode(thisComment.text) + '\');">' +
                '<td class="icon-column" style=""><i class="fa fa-file-text-o"></i></td>' +
                '<td>' + lzm_commonTools.getHumanDate(commentTime, '', lzm_chatDisplay.userLanguage) + '</td>' +
                '<td>' + operator.name + '</td>' +
                '</tr>';
        }
    }
    commentsHtml += '</tbody></table><div style="margin-top: 20px; margin-bottom: 10px; text-align: right;">' +
        lzm_displayHelper.createButton('add-comment', '', 'addComment(\'' + ticket.id + '\', \'' + menuEntry + '\')', t('Add'), '', 'lr',
            {}, t('Add Comment')) + '</div>';

    return commentsHtml;
};

/********** Ticket messages **********/
ChatTicketClass.prototype.showMessageReply = function(ticket, messageNo, selectedGroup, menuEntry) {
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    var that = this;
    var i = 0, j = 0, signatureText = '', answerInline = false, mySig = {};
    messageNo = (messageNo == -1) ? ticket.messages.length -1 : messageNo;
    var myself = lzm_chatServerEvaluation.operators.getOperator(lzm_chatDisplay.myId);
    var signatures = [];
    var groups = lzm_chatServerEvaluation.groups.getGroupList();
    for (i=0; i<myself.sig.length; i++) {
        mySig = myself.sig[i];
        mySig.priority = 4;
        if (myself.sig[i].d == 1) {
            mySig.priority = 5;
        }
        signatures.push(mySig);
    }
    for (i=0; i<groups.length; i++) {
        if ($.inArray(groups[i].id, myself.groups) != -1) {
            for (j=0; j<groups[i].sig.length; j++) {
                mySig =  groups[i].sig[j];
                mySig.priority = 0;
                if (groups[i].sig[j].d == 1 && groups[i].sig[j].g != selectedGroup.id) {
                    mySig.priority = 1;
                } else if (groups[i].sig[j].d != 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 2;
                } else if (groups[i].sig[j].d == 1 && groups[i].sig[j].g == selectedGroup.id) {
                    mySig.priority = 3;
                }
                signatures.push(mySig);
            }
        }
    }
    signatures.sort(function(a, b) {
        return (a.d < b.d);
    });

    var salutationFields = lzm_commonTools.getTicketSalutationFields(ticket, messageNo);
    var checkedString = (ticket.t != 6 && ticket.t != 7) ? ' checked="checked"' : '';
    var disabledString2 = (ticket.t == 6 || ticket.t == 7) ? ' ui-disabled' : '';
    var disabledString;
    var replyString = '<table style="width: 100%;" id="ticket-reply">' +
        '<tr><td><fieldset class="lzm-fieldset" data-role="none"><legend>' + t('Salutation') + '</legend>' +
        '<div id="tr-enable-salutation-fields" style="padding-bottom: 8px;">' +
        '<input type="checkbox" id="enable-tr-salutation" data-role="none"' + checkedString + ' style="margin-right: 7px;">' +
        '<label for="enable-tr-salutation">' + t('Use salutation') + '</label></div>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';
    checkedString = (salutationFields['salutation'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['salutation'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-greet-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-greet" data-role="none"' + checkedString + ' style="margin-right: 7px;" /> ';
    checkedString = (salutationFields['title'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['title'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-title-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-title" data-role="none"' + checkedString + ' style="margin-right: 7px;" /> ';
    checkedString = (salutationFields['first name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['first name'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<input type="text" id="tr-firstname"' + disabledString + ' data-role="none" style="margin: 2px; min-width: 202px;"' +
        ' placeholder="' + t('First Name') + '" value="' + capitalize(salutationFields['first name'][1]) + '" />' +
        '<input type="checkbox" id="use-tr-firstname" data-role="none"' + checkedString + ' style="margin-right: 7px;" /> ';
    checkedString = (salutationFields['last name'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['last name'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<input type="text" id="tr-lastname"' + disabledString + ' data-role="none" style="margin: 2px; min-width: 202px;"' +
        ' placeholder="' + t('Last Name') + '" value="' + capitalize(salutationFields['last name'][1]) + '" />' +
        '<input type="checkbox" id="use-tr-lastname" data-role="none"' + checkedString + ' style="margin-right: 7px;" />' +
        '<input type="text" id="tr-punctuationmark" data-role="none" style="min-width: 0px; width: 10px; margin: 2px;"' +
        ' value="' + salutationFields['punctuation mark'][1][0][0] + '" />' +
        '</div></fieldset></td></tr>' +
        '<tr><td><fieldset class="lzm-fieldset" data-role="none"><legend>' + t('Introduction Phrase') + '</legend>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';
    checkedString = (salutationFields['introduction phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['introduction phrase'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-intro-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-intro" data-role="none"' + checkedString + ' />' +
        '</div></fieldset></td></tr>' +
        '<tr><td><fieldset class="lzm-fieldset" data-role="none"><legend>' + t('Mail Text') + '</legend>' +
        '<div id="message-reply-container" style="margin: 0px; width: ' + lzm_chatDisplay.ticketMessageWidth + 'px;">' +
        '<div id="ticket-reply-input-buttons" style="padding:5px 0px;">' +
        lzm_displayHelper.createButton('ticket-reply-input-load', '', '', t('Load'), '<i class="fa fa-folder-open-o"></i>', 'lr',
            {'margin-left': '0px'}) +
        lzm_displayHelper.createButton('ticket-reply-input-save', 'ui-disabled', '', t('Save'), '<i class="fa fa-save"></i>', 'lr',
            {'margin-left': '6px'}) +
        lzm_displayHelper.createButton('ticket-reply-input-saveas', '', '', t('Save As ...'),
            '<i class="fa fa-plus"></i>', 'lr',
            {'margin-left': '6px'}) +
        lzm_displayHelper.createButton('ticket-reply-input-clear', '', '', t('Clear'), '<i class="fa fa-remove"></i>', 'lr',
            {'margin-left': '6px'}) +
        '</div><div id="ticket-reply-inline-show-div" style="text-align: right; width: ' + lzm_chatDisplay.ticketMessageWidth + 'px;">' +
        '<a href="#" id="ticket-reply-reply-inline">' + t('Reply Inline') + '</a>&nbsp;&nbsp;' +
        '<a href="#" id="ticket-reply-show-question">' + t('Show Question') + '</a>' +
        '</div>' +
        '<textarea id="ticket-reply-input" class="ticket-reply-text" style="padding: 4px; width: ' + (lzm_chatDisplay.ticketMessageWidth - 10) + 'px;"></textarea>' +
        '<div id="ticket-reply-last-question" style="display: none; border: 0px; border-radius: 4px; padding: 3px;' +
        'width: ' + (lzm_chatDisplay.FullscreenDialogWindowWidth - 72) + 'px; background-color: #ffffe1;"></div><br />' +
        '<input type="hidden" id="ticket-reply-input-resource" value="" />' +
        '</fieldset></td></tr>' +
        '<tr><td><fieldset class="lzm-fieldset" data-role="none"><legend>' + t('Closing Phrase') + '</legend>' +
        '<div class="tr-salutation-fields' + disabledString2 + '">';
    checkedString = (salutationFields['closing phrase'][0]) ? ' checked="checked"' : '';
    disabledString = (salutationFields['closing phrase'][0]) ? '' : ' class="ui-disabled"';
    replyString += '<span id="tr-close-placeholder"' + disabledString + '></span>' +
        '<input type="checkbox" id="use-tr-close" data-role="none"' + checkedString + ' />' +
        '</div></fieldset></td></tr>';
    replyString += '<tr><td><fieldset class="lzm-fieldset" data-role="none"><legend>' + t('Signature') + '</legend>' +
        '<div id="message-signature-container" class="' + disabledString2 + '" style="margin: 0px; width: ' + lzm_chatDisplay.ticketMessageWidth + 'px;">' +
        '<select id="ticket-reply-signature" data-role="none" style="margin-bottom: 5px;">';
    var chosenPriority = -1;
    for (i=0; i<signatures.length; i++) {
        var defaultString = (signatures[i].d == 1) ? t('(Default)') : '';
        var nameString = signatures[i].n + ' ' + defaultString;
        var selectedString = '';
        if (signatures[i].priority > chosenPriority) {
            selectedString = ' selected="selected"';
            signatureText = signatures[i].text;
            chosenPriority = signatures[i].priority;
        }
        replyString += '<option value="' + signatures[i].text + '"' + selectedString + '>' + nameString + '</option>';
    }
    replyString += '</select><br />';
    disabledString = (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'change_signature', {})) ? '' : ' ui-disabled"';
    replyString += '<textarea id="ticket-reply-signature-text" class="ticket-reply-text' + disabledString + '"' +
        ' style="height: 70px; padding: 4px; width: ' + (lzm_chatDisplay.ticketMessageWidth - 10) + 'px;">' + signatureText + '</textarea>';

    replyString += '</div>' +
        '</fieldset></td></tr>' +
        '</table>';

    var attachmentsHtml = '<fieldset data-role="none" class="lzm-fieldset" id="message-attachment-list">' +
        '<legend>' + t('Attachments') + '</legend>' +
        that.createTicketAttachmentTable(ticket, {id: ''}, -1, true) +
        '</fieldset>';
    var commentsHtml = '<fieldset data-role="none" class="lzm-fieldset" id="message-comment-text">' +
        '<legend>' + t('Add Comment') + '</legend>' +
        '<textarea data-role="none" id="new-message-comment" style="padding: 4px;"></textarea>' +
        '</fieldset>';
    var bodyString = '<div id="reply-placeholder" style="margin-top: 5px;"></div>';
    var headerString = t('Compose Response');

    var footerString = lzm_displayHelper.createButton('ticket-reply-preview', '', '', t('Preview'), '', 'lr',
        {'margin-left': '6px', 'margin-top': '-2px'}, '', 20) +
        lzm_displayHelper.createButton('ticket-reply-cancel', '', 'cancelTicketReply(\'ticket-details\', \'' + lzm_chatDisplay.ticketDialogId[ticket.id] + '\');', t('Cancel'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px'}, '', 20);
    lzm_displayHelper.minimizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticket.id], 'ticket-details',
        {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
    var myDialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '',
        {'ticket-id': ticket.id, menu: menuEntry}, true, true, lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply');

    lzm_displayHelper.createTabControl('reply-placeholder', [{name: t('Composer'), content: replyString},
        {name: t('Attachments'), content: attachmentsHtml}, {name: t('Comment'), content: commentsHtml}], 0);

    $('.reply-placeholder-content').css({height: ($('#ticket-details-body').height() - 40) + 'px'});
    $('#message-comment-text').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});
    $('#message-attachment-list').css({'min-height': ($('#ticket-details-body').height() - 62) + 'px'});

    lzm_displayHelper.createInputMenu('tr-greet-placeholder', 'tr-greet', '', 0, t('Salutation'), salutationFields['salutation'][1][0][0],
        salutationFields['salutation'][1], 'reply-placeholder-content-0', -2);
    lzm_displayHelper.createInputMenu('tr-title-placeholder', 'tr-title', '', 0, t('Title'), salutationFields['title'][1][0][0],
        salutationFields['title'][1], 'reply-placeholder-content-0', -2);
    lzm_displayHelper.createInputMenu('tr-intro-placeholder', 'tr-intro', '', lzm_chatDisplay.FullscreenDialogWindowWidth - 122, t('Introduction Phrase'),
        salutationFields['introduction phrase'][1][0][0], salutationFields['introduction phrase'][1], 'reply-placeholder-content-0', 0);
    lzm_displayHelper.createInputMenu('tr-close-placeholder', 'tr-close', '', lzm_chatDisplay.FullscreenDialogWindowWidth - 122, t('Closing Phrase'),
        salutationFields['closing phrase'][1][0][0], salutationFields['closing phrase'][1], 'reply-placeholder-content-0', 0);

    var trFields = ['greet', 'title', 'firstname', 'lastname', 'punctuationmark', 'intro', 'close'];
    for (i=0; i<trFields.length; i++) {
        $('#use-tr-' + trFields[i]).change(function() {
            var inputId = $(this).attr('id').replace(/use-/,'');
            if ($('#use-' + inputId).attr('checked') == 'checked') {
                $('#' + inputId + '-placeholder').removeClass('ui-disabled');
                $('#' + inputId).removeClass('ui-disabled');
            } else {
                $('#' + inputId + '-placeholder').addClass('ui-disabled');
                $('#' + inputId).addClass('ui-disabled');
            }
        });
    }

    $('#enable-tr-salutation').click(function() {
        if ($('#enable-tr-salutation').prop('checked')) {
            $('.tr-salutation-fields').removeClass('ui-disabled');
        } else {
            $('.tr-salutation-fields').addClass('ui-disabled');
        }
    });

    $('#reply-placeholder-tab-2').click(function() {
        lzm_displayLayout.resizeTicketReply();
    });

    $('#add-attachment').click(function() {
        if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
            lzm_displayHelper.minimizeDialogWindow(myDialogId, 'ticket-details',
                {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
            lzm_chatUserActions.addQrd('', true, myDialogId, null, menuEntry);
        } else {
            showNotMobileMessage();
        }
    });
    $('#add-attachment-from-qrd').click(function() {
        lzm_displayHelper.minimizeDialogWindow(myDialogId, 'ticket-details',
            {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
        var fileResources = lzm_chatServerEvaluation.cannedResources.getResourceList('ti', {ty: '0,3,4'});
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(fileResources, 'ATTACHMENT~' + myDialogId, menuEntry);
    });
    $('#remove-attachment').click(function() {
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        var tmpResources = [];
        for (var i=0; i<resources.length; i++) {
            if (i != $('#attachment-table').data('selected-attachment')) {
                tmpResources.push(resources[i]);
            }
        }
        $('#reply-placeholder-content-1').data('selected-resources', tmpResources);
        that.updateAttachmentList();
        $('#attachment-table').data('selected-attachment', -1);
        $('#remove-attachment').addClass('ui-disabled');
    });

    $('#ticket-reply-input-load').click(function() {
        lzm_displayHelper.minimizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply', 'ticket-details',
            {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
        lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(lzm_chatServerEvaluation.cannedResources.getResourceList(), 'TICKET LOAD' + '~' + ticket.id, menuEntry);
    });
    $('#ticket-reply-input-save').click(function() {
        if ($('#ticket-reply-input-resource').val() != '') {
            var resourceText = $('#ticket-reply-input').val();
            var resourceId = $('#ticket-reply-input-resource').val();
            saveQrdFromTicket(resourceId, resourceText);
        }
    });
    $('#ticket-reply-input-saveas').click(function() {
        if (lzm_chatDisplay.isApp || lzm_chatDisplay.isMobile) {
            showNotMobileMessage();
        } else {
            lzm_chatDisplay.ticketResourceText[ticket.id] = $('#ticket-reply-input').val().replace(/\n/g, '<br />');
            lzm_displayHelper.minimizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply', 'ticket-details',
                {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
            var textResources = lzm_chatServerEvaluation.cannedResources.getResourceList('ti', {ty: '0,2'});
            lzm_chatDisplay.resourcesDisplay.createQrdTreeDialog(textResources, 'TICKET SAVE' + '~' + ticket.id, menuEntry);
        }
    });
    $('#ticket-reply-input-clear').click(function() {
        $('#ticket-reply-input').val('');
        $('#ticket-reply-reply-inline').removeClass('ui-disabled');
        answerInline = false;
    });
    $('#ticket-reply-show-question').click(function() {
        if ($('#ticket-reply-last-question').css('display') == 'none') {
            var lastMessageText = lzm_commonTools.htmlEntities(ticket.messages[messageNo].mt).replace(/\r\n/g,'\n').
                replace(/\r/g,'\n').replace(/\n +/g, '\n').replace(/\n+/g,'\n').replace(/\n/g, '<br>');
            $('#ticket-reply-last-question').html(lastMessageText).css({display: 'block'});
            $('#ticket-reply-show-question').html(t('Hide Question'));
        } else {
            $('#ticket-reply-last-question').html('').css({display: 'none'});
            $('#ticket-reply-show-question').html(t('Show Question'));
        }
    });
    $('#ticket-reply-reply-inline').click(function() {
        var lastMessageText = ticket.messages[messageNo].mt.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
            .replace(/\n +/g,'\n').replace(/\n+/g,'\n');
        lastMessageText = '> ' + lastMessageText.replace(/\n/g, '\n> ').replace(/\n/g, '\r\n');
        $('#ticket-reply-reply-inline').addClass('ui-disabled');
        insertAtCursor('ticket-reply-input', lastMessageText);
        answerInline = true;
    });

    $('#ticket-reply-signature').change(function() {
        $('#ticket-reply-signature-text').val($('#ticket-reply-signature').val());
    });
    $('#ticket-reply-preview').click(function() {
        var salutationValues = {
            'enable-salutation': $('#enable-tr-salutation').prop('checked'),
            'salutation': [$('#use-tr-greet').attr('checked') == 'checked', $('#tr-greet').val()],
            'title': [$('#use-tr-title').attr('checked') == 'checked', $('#tr-title').val()],
            'introduction phrase': [$('#use-tr-intro').attr('checked') == 'checked', $('#tr-intro').val()],
            'closing phrase': [$('#use-tr-close').attr('checked') == 'checked', $('#tr-close').val()],
            'first name': [$('#use-tr-firstname').attr('checked') == 'checked', $('#tr-firstname').val()],
            'last name': [$('#use-tr-lastname').attr('checked') == 'checked', $('#tr-lastname').val()],
            'punctuation mark': [true, $('#tr-punctuationmark').val()]
        };
        var replyText = $('#ticket-reply-input').val();
        var commentText = $('#new-message-comment').val();
        var signatureText =  $('#ticket-reply-signature-text').val();
        var thisMessageNo = (!answerInline) ? messageNo : -1;
        var resources = $('#reply-placeholder-content-1').data('selected-resources');
        resources = (typeof resources != 'undefined') ? resources : [];
        that.showMessageReplyPreview(ticket, thisMessageNo, replyText, signatureText, commentText, resources,
            salutationValues, selectedGroup, menuEntry, answerInline);
    });
};

ChatTicketClass.prototype.showMessageReplyPreview = function(ticket, messageNo, message, signature, comment, attachments,
                                                             salutation, group, menuEntry, answerInline) {
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    var that = this, replacementArray = [], messageId = md5(Math.random().toString());
    var email = '', bcc = '', subject = '', i = 0, subjObject = {}, defLanguage = 'EN';
    var groupName = (typeof group.humanReadableDescription[ticket.l.toLowerCase()] != 'undefined') ?
        group.humanReadableDescription[ticket.l.toLowerCase()] :
        (typeof group.humanReadableDescription[lzm_chatServerEvaluation.defaultLanguage] != 'undefined') ?
            group.humanReadableDescription[lzm_chatServerEvaluation.defaultLanguage] : group.id;
    for (i=0; i<group.pm.length; i++) {
        subjObject[group.pm[i].lang] = (group.pm[i].str != '') ? group.pm[i].str : group.pm[i].st;
        if (group.pm[i].def == 1) {
            defLanguage = group.pm[i].lang;
        }
    }
    var previousMessageSubject = (messageNo >= 0) ? ticket.messages[messageNo].s : ticket.messages[0].s;
    var ticketHashRegExp = new RegExp(ticket.h, 'i');
    subject = (typeof subjObject[ticket.l] != 'undefined') ? subjObject[ticket.l] : subjObject[defLanguage];
    subject = (subject.match(/%ticket_hash%/) != null) ? subject : subject + ' %ticket_hash%';
    var subjectHash = (subject.match(/%subject%/) != null && previousMessageSubject.match(ticketHashRegExp) != null) ? '' : '[' + ticket.h + ']';
    replacementArray = [{pl: '%ticket_hash%', rep: subjectHash}, {pl: '%website_name%', rep: lzm_chatServerEvaluation.siteName},
        {pl: '%subject%', rep: previousMessageSubject}, {pl: '%operator_name%', rep: lzm_chatDisplay.myName},
        {pl: '%operator_id%', rep: lzm_chatDisplay.myLoginId}, {pl: '%operator_email%', rep: lzm_chatDisplay.myEmail},
        {pl: '%external_name%', rep: ''}, {pl: '%external_email%', rep: ''}, {pl: '%external_company%', rep: ''},
        {pl: '%external_phone%', rep: ''}, {pl: '%external_ip%', rep: ''}, {pl: '%page_title%', rep: ''}, {pl: '%url%', rep: ''},
        {pl: '%searchstring%', rep: ''}, {pl: '%localtime%', rep: ''}, {pl: '%localdate%', rep: ''}, {pl: '%mailtext%', rep: ''},
        {pl: '%group_id%', rep: groupName}];
    subject = lzm_commonTools.replacePlaceholders('Re: ' + subject, replacementArray);
    subject = subject.replace(/[ -]+$/, '');
    var previousMessageId = (messageNo >= 0) ? ticket.messages[messageNo].id : ticket.messages[0].id;
    var trFields = ['salutation', 'title', 'first name', 'last name', 'punctuation mark', 'introduction phrase'];
    var replyText = '';
    if (salutation['enable-salutation']) {
        for (i=0; i<trFields.length; i++) {
            if (salutation[trFields[i]][0]) {
                var lineBreak = ' ';
                if ((trFields[i] == 'punctuation mark' && salutation[trFields[i]][1] != '') ||
                    trFields[i] == 'introduction phrase' ||
                    (trFields[i] == 'last name' && !salutation['punctuation mark'][0])) {
                    lineBreak = '\n\n';
                } else if ((trFields[i] == 'first name' && salutation['first name'][1] == '') ||
                    (trFields[i] == 'first name' && !salutation['last name'][0]) ||
                    (trFields[i] == 'first name' && salutation['last name'][1] == '') ||
                    trFields[i] == 'last name' ||
                    (trFields[i] == 'salutation' && (!salutation['title'][0] || salutation['title'][1] == '') &&
                        (!salutation['first name'][0] || salutation['first name'][1] == '') &&
                        (!salutation['last name'][0] || salutation['last name'][1] == ''))) {
                    lineBreak = '';
                }
                replyText += salutation[trFields[i]][1] + lineBreak;
            }
        }
    }
    replyText = replyText.replace(/ ,\r\n/, ',\r\n');
    replyText += message + '\r\n\r\n';
    if (salutation['enable-salutation'] && salutation['closing phrase'][0]) {
        replyText += salutation['closing phrase'][1];
    }
    var myself = lzm_chatServerEvaluation.operators.getOperator(lzm_chatServerEvaluation.myId);
    replacementArray = [{pl: '%operator_name%', rep: lzm_chatDisplay.myName}, {pl: '%operator_id%', rep: lzm_chatDisplay.myLoginId},
        {pl: '%operator_email%', rep: lzm_chatDisplay.myEmail}, {pl: '%group_id%', rep: groupName}];
    signature = lzm_commonTools.replacePlaceholders(signature, replacementArray);
    signature = signature.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/ +\n/, '\n').replace(/^\n+/, '');
    var completeMessage = replyText.replace(/^(\r\n)*/, '').replace(/(\r\n)*$/, '');
    if (ticket.t != 6 && ticket.t != 7) {
        completeMessage += (signature.indexOf('--') == 0) ? '\r\n\r\n\r\n' + signature : '\r\n\r\n\r\n--\r\n\r\n' + signature;
    }
    for (i=0; i<ticket.messages.length; i++) {
        if (ticket.messages[i].em != '') {
            var emArray = ticket.messages[i].em.split(',');
            email = emArray.splice(0,1);
            bcc = emArray.join(',').replace(/^ +/, '').replace(/ +$/, '');
        }
    }
    var myInputWidth = lzm_chatDisplay.ticketMessageWidth - 10;
    var disabledClass = (ticket.t == 6 || ticket.t == 7) ? ' class="ui-disabled"' : '';
    var previewHtml = '<table style="width: 100%;"><tr>' +
        '<td id="ticket-reply-cell" colspan="9" style="border: 1px solid #ccc; border-radius: 4px; padding: 10px; background-color: #fff;">' +
        '<div style="margin: 0px;">' +
        '<label for="ticket-reply-receiver" style="font-size: 12px;">' + t('Receiver:') + '</label><br />' +
        '<input type="text" id="ticket-reply-receiver" style="font-size: 12px; width: ' + myInputWidth + 'px; margin-bottom: 12px;"' +
        ' value="' + email + '" data-role="none"' + disabledClass + ' /><br />' +
        '<label for="ticket-reply-bcc" style="font-size: 12px;">' + t('BCC:') + '</label><br />' +
        '<input type="text" id="ticket-reply-bcc" style="font-size: 12px; width: ' + myInputWidth + 'px; margin-bottom: 12px;"' +
        ' value="' + bcc + '" data-role="none" /><br />';
    if (ticket.t != 6 && ticket.t != 7) {
        previewHtml += '<label for="ticket-reply-subject" style="font-size: 12px;">' + t('Subject:') + '</label><br />' +
        '<input type="text" id="ticket-reply-subject" style="font-size: 12px; width: ' + myInputWidth + 'px; margin-bottom: 12px;"' +
        ' value="' + subject + '" data-role="none" /><br />';
    } else {
        previewHtml += '<input type="hidden" id="ticket-reply-subject" value="' + subject + '" data-role="none" />';
    }
    previewHtml += '<label for="ticket-reply-text" style="font-size: 12px;">' + t('Email Body:') + '</label>' +
        '<div id="ticket-reply-text" class="ticket-reply-text" style="height: auto; margin-top: 5px; padding: 5px;' +
        ' border: 1px solid #ccc; overflow-x: hidden">' +
        lzm_commonTools.htmlEntities(completeMessage).replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>') +
        '</div>';
    if (attachments.length > 0) {
        previewHtml += '<br /><label for="ticket-reply-files" style="font-size: 12px;">' + t('Files:') + '</label>' +
            '<div id="ticket-reply-files" class="ticket-reply-text" style="height: auto; margin-top: 5px; padding: 5px; border: 1px solid #ccc;">';
        for (var m=0; m<attachments.length; m++) {
            downloadUrl = getQrdDownloadUrl(attachments[m]);
            previewHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachments[m].ti + '</a>' +
                '</span>&#8203;'
        }
        previewHtml += '</div>';
    }
    previewHtml += '</div></td></tr></table>';
    var commentsHtml = '<fieldset id="preview-comment-text" data-role="none" class="lzm-fieldset">' +
        '<legend>' + t('Your Comment (will be visible to other operators but not to clients/website visitors)') + '</legend>' +
        '<textarea data-role="none" id="new-message-comment" style="padding:4px;">' + comment + '</textarea>' +
        '</fieldset>';

    var footerString = lzm_displayHelper.createButton('ticket-reply-send', '', '', t('Save and send message'), '', 'lr',
        {'margin': '-5px 7px', float: 'left'}) +
        lzm_displayHelper.createButton('ticket-reply-cancel', '', '', t('Cancel'), '', 'lr',
            {'margin': '0px'});
    var bodyString = '<div id="preview-placeholder" style="margin-top: 5px;"></div>';
    lzm_displayHelper.minimizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply', 'ticket-details',
        {'ticket-id': ticket.id, menu: menuEntry}, 'tickets', false);
    lzm_displayHelper.createDialogWindow(t('Preview'), bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '',
        {'ticket-id': ticket.id, menu: menuEntry}, true, true, lzm_chatDisplay.ticketDialogId[ticket.id] + '_preview');
    lzm_displayHelper.createTabControl('preview-placeholder', [{name: t('Preview'), content: previewHtml},
        {name: t('Comment'), content: commentsHtml}], 0);
    $('.preview-placeholder-content').css({height: ($('#ticket-details-body').height() - 40) + 'px'});
    $('#ticket-reply-cell').children('div').css({'min-height': ($('#ticket-details-body').height() - 66)+'px'});
    var replyTextHeight = ($('#ticket-reply-files').height() != null) ?
        $('#ticket-details-body').height() - $('#ticket-reply-files').height() - 245 : $('#ticket-details-body').height() - 200;
    $('#ticket-reply-text').css({'min-height': replyTextHeight+'px'});

    $('#preview-placeholder-tab-1').click(function() {
        lzm_displayLayout.resizeTicketReply();
    });

    $('#ticket-reply-cancel').click(function() {
        lzm_displayHelper.removeDialogWindow('ticket-details');
        lzm_displayHelper.maximizeDialogWindow(lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply');
    });
    $('#ticket-reply-send').click(function() {
        var replyReceiver = $('#ticket-reply-receiver').val().replace(/^ */, '').replace(/ *$/, '');
        var messageIncludingReceiver = replyReceiver + ' ' + completeMessage;
        var messageLength = messageIncludingReceiver.replace(/\r\n/g, '\n').length, errorMessage = '';
        if (ticket.t != 7 || messageLength < 140) {
            if (replyReceiver != '') {
                if (salutation['enable-salutation']) {
                    delete salutation['enable-salutation'];
                    lzm_commonTools.saveTicketSalutations(salutation, ticket.l.toLowerCase());
                }
                var messageSubject = $('#ticket-reply-subject').val();
                sendTicketMessage(ticket, replyReceiver, $('#ticket-reply-bcc').val(), messageSubject, completeMessage,
                    $('#new-message-comment').val(), attachments, messageId, previousMessageId);
                lzm_displayHelper.removeDialogWindow('ticket-details');
                delete lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply'];
                delete lzm_chatDisplay.StoredDialogs[lzm_chatDisplay.ticketDialogId[ticket.id]];
                var tmpStoredDialogIds = [];
                for (var j=0; j<lzm_chatDisplay.StoredDialogIds.length; j++) {
                    if (lzm_chatDisplay.ticketDialogId[ticket.id] != lzm_chatDisplay.StoredDialogIds[j] &&
                        lzm_chatDisplay.ticketDialogId[ticket.id] + '_reply' != lzm_chatDisplay.StoredDialogIds[j]) {
                        tmpStoredDialogIds.push(lzm_chatDisplay.StoredDialogIds[j])
                    }
                }
                lzm_chatDisplay.StoredDialogIds = tmpStoredDialogIds;
            } else {
                errorMessage = t('Please enter a valid email address.');
                lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
                $('#alert-btn-ok').click(function() {
                    lzm_commonDialog.removeAlertDialog();
                });
            }
        } else {
            errorMessage = t('A twitter message may only be 140 characters long. Your message is <!--message_length--> characters long.',
                [['<!--message_length-->', messageLength]]);
            lzm_commonDialog.createAlertDialog(errorMessage, [{id: 'ok', name: t('Ok')}]);
            $('#alert-btn-ok').click(function() {
                lzm_commonDialog.removeAlertDialog();
                $('#ticket-reply-cancel').click();
            });
        }
    });
};

ChatTicketClass.prototype.showMessageForward = function(message, ticketId, ticketSender, group) {
    var that = this;
    var menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticketId],['<!--name-->', ticketSender]]);
    var headerString = t('Send to');
    var footerString = lzm_displayHelper.createButton('send-forward-message', '','', t('Ok'), '', 'lr',
        {'margin-left': '6px'}) +
        lzm_displayHelper.createButton('cancel-forward-message', '','', t('Cancel'), '', 'lr',
            {'margin-left': '6px'});
    var bodyString = '<div style="margin-top: 5px;" id="message-forward-placeholder"></div>';
    var messageTime = lzm_chatTimeStamp.getLocalTimeObject(message.ct * 1000, true);
    var timeHuman = lzm_commonTools.getHumanDate(messageTime, 'all', lzm_chatDisplay.userLanguage);
    var myGroup = lzm_chatServerEvaluation.groups.getGroup(group), sender = '', receiver = '';
    if ($.inArray(parseInt(message.t), [0, 3, 4]) != -1) {
        sender = lzm_commonTools.htmlEntities(message.em);
        receiver = (myGroup != null) ? myGroup.email : group;
    } else if (message.t == 1) {
        sender = (myGroup != null) ? myGroup.email : group;
        receiver = lzm_commonTools.htmlEntities(message.em);
    }
    var emailText = t('-------- Original Message --------') +
        '\n' + t('Subject: <!--subject-->', [['<!--subject-->', lzm_commonTools.htmlEntities(message.s)]]) +
        '\n' + t('Date: <!--date-->', [['<!--date-->', timeHuman]]);
    if ($.inArray(parseInt(message.t), [0, 1, 3, 4]) != -1) {
        emailText += '\n' + t('From: <!--sender_email-->', [['<!--sender_email-->', sender]]) +
            '\n' + t('To: <!--receiver-->', [['<!--receiver-->', receiver]]);
    }
    emailText += '\n\n\n' +
        lzm_commonTools.htmlEntities(message.mt);
    var emailHtml = '<fieldset id="message-forward" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Email') + '</legend>' +
        '<div style="margin-bottom: 15px;"><label for="forward-email-addresses">' + t('Email addresses: (separate by comma)') + '</label><br />' +
        '<input type="text" data-role="none" id="forward-email-addresses" value="' + lzm_commonTools.htmlEntities(message.em) + '" /></div>' +
        '<div style="margin-bottom: 15px;"><label for="forward-subject">' + t('Subject:') + '</label><br />' +
        '<input type="text" data-role="none" id="forward-subject" value="' + lzm_commonTools.htmlEntities(message.s) + '"/></div>' +
        '<div><label for="forward-text">' + t('Email Body:') + '</label><br />' +
        '<textarea id="forward-text" data-role="none" style="padding: 4px;">' + emailText + '</textarea></div>';
    if (message.attachment.length > 0) {
        emailHtml += '<br /><label for="ticket-reply-files" style="font-size: 12px;">' + t('Files:') + '</label>' +
            '<div id="forward-files" class="ticket-reply-text" style="height: auto; margin-top: 5px; padding: 5px; border: 1px solid #ccc;">';
        for (var m=0; m<message.attachment.length; m++) {
            var attachment = {ti: message.attachment[m].n, rid: message.attachment[m].id};
            var downloadUrl = getQrdDownloadUrl(attachment);
            emailHtml += '<span style="margin-right: 10px;">' +
                '<a href="#" onclick="downloadFile(\'' + downloadUrl + '\');" class="lz_chat_file">' + attachment.ti + '</a>' +
                '</span>&#8203;'
        }
        emailHtml += '</div>';
    }
    emailHtml += '</fieldset>';

    var dialogData = {'ticket-id': ticketId, menu: menuEntry};
    var ticketDialogId = lzm_chatDisplay.ticketDialogId[ticketId];
    lzm_displayHelper.minimizeDialogWindow(ticketDialogId, 'ticket-details', dialogData, 'tickets', false);
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '',
        dialogData, true, true, ticketDialogId + '_forward');
    lzm_displayHelper.createTabControl('message-forward-placeholder', [{name: t('Email'), content: emailHtml}]);
    lzm_displayLayout.resizeMessageForwardDialog();

    $('#cancel-forward-message').click(function() {
        lzm_displayHelper.removeDialogWindow('ticket-details');
        lzm_displayHelper.maximizeDialogWindow(ticketDialogId);
    });
    $('#send-forward-message').click(function() {
        sendForwardedMessage(message, $('#forward-text').val(), $('#forward-email-addresses').val(), $('#forward-subject').val(), ticketId, group);
        $('#cancel-forward-message').click();
    });
};

ChatTicketClass.prototype.addMessageComment = function(ticketId, message, menuEntry) {
    var that = this;
    var dialogId = '', windowId = '';
    if (typeof ticketId != 'undefined') {
        dialogId = lzm_chatDisplay.ticketDialogId[ticketId];
        windowId = 'ticket-details';
    } else if (typeof $('#ticket-details-body').data('dialog-id') != 'undefined') {
        dialogId = $('#ticket-details-body').data('dialog-id');
        windowId = 'ticket-details';
    } else {
        dialogId = $('#email-list-body').data('dialog-id');
        windowId = 'email-list';
    }
    var headerString = t('Add Comment');
    var footerString = lzm_displayHelper.createButton('comment-cancel', '', '', t('Cancel'), '', 'lr',
        {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
        lzm_displayHelper.createButton('comment-save', '', '', t('Ok'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'});
    var bodyString = '<fieldset id="comment-text" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Your Comment (will be visible to other operators but not to clients/website visitors)') + '</legend>' +
        '<textarea id="comment-input" data-role="none"></textarea>' +
        '</fieldset>';

    lzm_displayHelper.minimizeDialogWindow(dialogId, windowId,
        {'ticket-id': ticketId, menu: menuEntry}, 'tickets', false);
    lzm_displayHelper.createDialogWindow(headerString,bodyString, footerString, windowId, {}, {}, {}, {}, '',
        {'ticket-id': ticketId, menu: menuEntry}, true, true, dialogId + '_comment');
    $('#comment-text').css({'min-height': ($('#' + windowId + '-body').height() - 22) + 'px'});

    var inputHeight = Math.max(140, $('#' + windowId + '-body').height() - 48);
    $('#comment-input').css({
        border: '1px solid #ccc',
        'border-radius': '4px',
        width: ($('#' + windowId + '-body').width() - 32)+'px',
        height: inputHeight + 'px',
        padding: '4px'
    });

    $('#comment-cancel').click(function() {
        lzm_displayHelper.removeDialogWindow(windowId);
        lzm_displayHelper.maximizeDialogWindow(dialogId);
    });
    $('#comment-save').click(function() {
        var commentText = $('#comment-input').val();
        $('#comment-cancel').click();
        if (typeof ticketId != 'undefined' && typeof message.id != 'undefined') {
            lzm_chatUserActions.saveTicketComment(ticketId, message.id, commentText);
        } else {
            var comments = $('#ticket-details-placeholder-content-2').data('comments');
            comments = (typeof comments != 'undefined') ? comments : [];
            comments.push({text: commentText, timestamp: lzm_chatTimeStamp.getServerTimeString(null, false, 1)});
            $('#ticket-details-placeholder-content-2').data('comments', comments);
            that.updateCommentList();
        }
    });
};

ChatTicketClass.prototype.createTicketMessageTable = function(ticket, email, messageNumber, isNew, chat) {
    var that = this;
    var messageTableHtml = '<table id="ticket-history-table" class="visitor-list-table alternating-rows-table lzm-unselectable"' +
        ' style="width: 100%;" data-selected-message="' + messageNumber + '">';
    if (!isNew) {
        messageTableHtml += that.createTicketMessageList(ticket, {cid: ''});
    } else if (chat.cid != '') {
        messageTableHtml += that.createTicketMessageList({id: ''}, chat);
    }
    messageTableHtml += '</table>';

    return messageTableHtml;
};

ChatTicketClass.prototype.createTicketMessageList = function(ticket, chat) {
    var that = this, operator, tblCellStyle;
    var messageListHtml = '<thead><tr id="ticket-history-header-line">' +
        '<th style="width: 18px !important;">&nbsp;</th>' +
        '<th style="width: 18px !important">&nbsp;</th>' +
        '<th style="width: 18px !important">&nbsp;</th>' +
        '<th style="width: 18px !important">&nbsp;</th>' +
        '<th>' + t('Date').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '<th>' + t('Sender').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '<th>' + t('Receiver').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '<th>' + t('Subject').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '<th>' + t('Company').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '<th>' + t('Phone').replace(/-/g,'&#8209;').replace(/ /g,'&nbsp;') + '</th>' +
        '</tr></thead><tbody>';
    if (chat.cid == '') {
        ticket.messages.sort(that.ticketMessageSortfunction);
        for (var i=ticket.messages.length - 1; i>=0; i--) {
            operator = lzm_chatServerEvaluation.operators.getOperator(ticket.messages[i].sid);
            tblCellStyle = ' style="line-height: 16px;"';
            var messageTimeObject = lzm_chatTimeStamp.getLocalTimeObject(ticket.messages[i].ct * 1000, true);
            var messageTimeHuman = lzm_commonTools.getHumanDate(messageTimeObject, '', lzm_chatDisplay.userLanguage);
            var customerName = '';
            if (ticket.messages[i].fn != '') {
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].fn);
                if (ticket.messages[i].em != '') {
                    customerName += ' &lt;' + lzm_commonTools.htmlEntities(ticket.messages[i].em) + '&gt;'
                }
            } else if (ticket.messages[i].em != '') {
                customerName += lzm_commonTools.htmlEntities(ticket.messages[i].em);
            }
            var sender = (ticket.messages[i].t == 1 && operator != null) ? operator.name : (ticket.messages[i].t == 1) ? '' : customerName;
            var receiver = (ticket.messages[i].t != 1) ? '' : customerName;
            var messageTypeImage = '<i class="fa fa-home"></i>';
            var directionImage = '';
            if (ticket.messages[i].t == 1) {
                directionImage = '<i class="fa fa-arrow-left"></i>';
                if (ticket.t == 6) {
                    messageTypeImage = '<i class="fa fa-facebook"></i>';
                } else if (ticket.t == 7) {
                    messageTypeImage = '<i class="fa fa-twitter"></i>';
                } else {
                    messageTypeImage = '<i class="fa fa-envelope-o"></i>';
                }
            } else if (ticket.messages[i].t == 2) {
                messageTypeImage = '<i class="fa fa-comment"></i>';
            } else if (ticket.messages[i].t == 3) {
                directionImage = '<i class="fa fa-arrow-right"></i>';
                if (ticket.t == 6) {
                    messageTypeImage = '<i class="fa fa-facebook"></i>';
                } else if (ticket.t == 7) {
                    messageTypeImage = '<i class="fa fa-twitter"></i>';
                } else {
                    messageTypeImage = '<i class="fa fa-envelope-o"></i>';
                }
            } else if (ticket.messages[i].t == 4) {
                messageTypeImage = '<i class="fa fa-envelope-o"></i>';
            }
            var onclickAction = ' onclick="handleTicketMessageClick(\'' + ticket.id + '\', \'' + i + '\');"';
            var oncontextMenu = '', ondblclickAction = '';
            if(!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
                oncontextMenu = ' oncontextmenu="openTicketMessageContextMenu(event, \'' + ticket.id + '\', \'' + i + '\', false);"';
                ondblclickAction = ' ondblclick="toggleMessageEditMode(\'' + ticket.id + '\', \'' + i + '\');"';
            }
            var attachmentImage = (ticket.messages[i].attachment.length > 0) ? '<i class="fa fa-paperclip" style="font-size: 14px;"></i>' : '';
            var commentImage = (ticket.messages[i].comment.length > 0) ? '<i class="fa fa-file-text-o" style="font-size: 14px;"></i>' : '';
            messageListHtml += '<tr class="message-line lzm-unselectable" id="message-line-' + ticket.id + '_' + i + '" style="cursor: pointer;"' +
                onclickAction + oncontextMenu + ondblclickAction + '>' +
                '<td' + tblCellStyle.replace(/"$/, 'padding: 5px 10px;"') + ' nowrap>' + messageTypeImage + '</td>' +
                '<td' + tblCellStyle.replace(/"$/, 'text-align: center; padding: 5px 10px;"') + ' nowrap>' + directionImage + '</td>' +
                '<td' + tblCellStyle.replace(/"$/, 'text-align: center; padding: 5px 10px;"') + ' nowrap>' + attachmentImage + '</td>' +
                '<td' + tblCellStyle.replace(/"$/, 'text-align: center; padding: 5px 10px;"') + ' nowrap>' + commentImage + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + messageTimeHuman + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + sender + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + receiver + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + lzm_commonTools.htmlEntities(ticket.messages[i].s) + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + lzm_commonTools.htmlEntities(ticket.messages[i].co) + '</td>' +
                '<td' + tblCellStyle + ' nowrap>' + lzm_commonTools.htmlEntities(ticket.messages[i].p) + '</td>' +
                '</tr>';
        }
    } else {
        operator = lzm_chatServerEvaluation.operators.getOperator(chat.iid);
        tblCellStyle = ' style="line-height: 16px;"';
        var newMessageDate = lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(null, false), '', lzm_chatDisplay.userLanguage);
        var chatMessageDate = lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(chat.ts * 1000, true), '', lzm_chatDisplay.userLanguage);
        var senderName = lzm_commonTools.htmlEntities(chat.en);
        var senderEmail = lzm_commonTools.htmlEntities(chat.em);
        var receiverName = (operator != null) ? operator.name : '-';
        var subject = lzm_commonTools.htmlEntities(chat.q);
        var company = lzm_commonTools.htmlEntities(chat.co);
        var phone = lzm_commonTools.htmlEntities(chat.cp);
        messageListHtml += '<tr>' +
            '<td' + tblCellStyle.replace(/"$/, 'padding: 5px 0px;"') + ' nowrap><i class="fa fa-envelope-o"></i></td>' +
            '<td></td>' +
            '<td></td>' +
            '<td></td>' +
            '<td>' + newMessageDate + '</td>' +
            '<td>' + senderName + '</td>' +
            '<td>' + receiverName + '</td>' +
            '<td>' + subject + '</td>' +
            '<td>' + company + '</td>' +
            '<td>' + phone + '</td>' +
            '</tr><tr>' +
            '<td' + tblCellStyle.replace(/"$/, 'padding: 5px 0px;"') + ' nowrap><i class="fa fa-comment"></i></td>' +
            '<td></td>' +
            '<td></td>' +
            '<td></td>' +
            '<td>' + chatMessageDate + '</td>' +
            '<td>' + senderName + '</td>' +
            '<td>' + receiverName + '</td>' +
            '<td>' + subject + '</td>' +
            '<td>' + company + '</td>' +
            '<td>' + phone + '</td>' +
            '</tr>';
    }
    messageListHtml += '</tbody>';

    return messageListHtml;
};

ChatTicketClass.prototype.createTicketMessageDetails = function(message, email, isNew, chat, edit) {
    chat = (typeof chat != 'undefined') ? chat : {cid: ''};
    var that = this, myCustomInput, myInputText, myInputField, i, j, myDownloadLink = '';
    var detailsHtml = '<table id="message-details-inner" style="width: 400px;">';
    if (isNew) {
        var newTicketName = (email.id == '') ? (chat.cid == '') ? '' : chat.en : email.n;
        var newTicketEmail = (email.id == '') ? (chat.cid == '') ? '' : chat.em : email.e;
        var newTicketCompany = (chat.cid == '') ? '' : chat.co;
        var newTicketPhone = (chat.cid == '') ? '' : chat.cp;
        detailsHtml += '<tr>' +
            '<th>' + t('Name:') + '</th>' +
            '<td><input type="text" id="ticket-new-name" data-role="none" value="' + lzm_commonTools.htmlEntities(newTicketName) + '" /></td>' +
            '</tr><tr>' +
            '<th>' + t('Email:') + '</th>' +
            '<td><input type="text" id="ticket-new-email" data-role="none" value="' + lzm_commonTools.htmlEntities(newTicketEmail) + '" /></td>' +
            '</tr><tr>' +
            '<th>' + t('Company:') + '</th>' +
            '<td><input type="text" id="ticket-new-company" data-role="none" value="' + lzm_commonTools.htmlEntities(newTicketCompany) + '" /></td>' +
            '</tr><tr>' +
            '<th>' + t('Phone:') + '</th>' +
            '<td><input type="text" id="ticket-new-phone" data-role="none" value="' + lzm_commonTools.htmlEntities(newTicketPhone) + '" /></td>' +
            '</tr>';
        if (email.id != '' || chat.cid != '') {
            var newTicketSubject = (email.id == '') ? chat.q : email.s;
            detailsHtml += '<tr>' +
                '<th>' + t('Subject:') + '</th>' +
                '<td><input type="text" id="ticket-new-subject" data-role="none" value="' + lzm_commonTools.htmlEntities(newTicketSubject) + '" /></td>' +
                '</tr>';
        }
        for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
            myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
            var selectedValue = '';
            if (chat.cid != '' && chat.cc.length > 0) {
                for (j=0; j<chat.cc.length; j++) {
                    selectedValue = (chat.cc[j].cuid == myCustomInput.name) ? chat.cc[j].text : selectedValue;
                }
            }
            if (myCustomInput.type == 'ComboBox') {
                myInputField = '<select id="ticket-new-cf' + myCustomInput.id + '" data-role="none">';
                for (j=0; j<myCustomInput.value.length; j++) {
                    var selectedString = (selectedValue == myCustomInput.value[j]) ? ' selected="selected"' : '';
                    myInputField += '<option value="' + j + '"' + selectedString + '>' + myCustomInput.value[j] + '</option>';
                }
                myInputField +='</select>';
            } else if (myCustomInput.type == 'CheckBox') {
                var checkedString = (selectedValue == 1) ? ' checked="checked"' : '';
                myInputText = myCustomInput.value;
                myInputField = '<input type="checkbox" id="ticket-new-cf' + myCustomInput.id + '" data-role="none"' +
                    ' style="min-width: 0px; width: auto;" value="' + myInputText + '"' + checkedString + ' />';
            } else {
                myInputText = lzm_commonTools.htmlEntities(selectedValue);
                myInputField = '<input type="text" id="ticket-new-cf' + myCustomInput.id + '" data-role="none" value="' + myInputText + '" />';
            }
            if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                detailsHtml += '<tr><th>' + myCustomInput.name + ':</th>' +
                    '<td>' + myInputField + '</td></tr>';
            }
        }
    } else {
        var operator = lzm_chatServerEvaluation.operators.getOperator(message.sid);
        if (operator != null) {
            detailsHtml += '<tr><th>' + t('Name:') + '</th><td><div class="input-like" style="background-color: #ffffff;"' +
                ' id="message-operator-name">' + operator.name + '</div></td></tr>';
            if (!edit) {
                detailsHtml += '<tr><th>' + t('Sent to:') + '</th><td><div class="input-like">' + lzm_commonTools.htmlEntities(message.em) + '</div></td></tr>';
            } else {
                detailsHtml += '<tr><th>' + t('Sent to:') + '</th><td><input type="text" data-role="none"' +
                    ' id="change-message-email" class="lzm-text-input" value="' + message.em + '" />' +
                    '<input type="hidden" id="change-message-name" value="" />' +
                    '<input type="hidden" id="change-message-company" value="" />' +
                    '<input type="hidden" id="change-message-phone" value="" /></td></tr>';
            }
        } else {
            if (!edit) {
                detailsHtml += '<tr><th>' + t('Name:') + '</th><td><div class="input-like" id="saved-message-name">' + lzm_commonTools.htmlEntities(message.fn) + '</div></td></tr>';
                detailsHtml += '<tr><th>' + t('Email:') + '</th><td><div class="input-like" id="saved-message-email">' + lzm_commonTools.htmlEntities(message.em) + '</div></td></tr>';
                detailsHtml += '<tr><th>' + t('Company:') + '</th><td><div class="input-like" id="saved-message-company">' + lzm_commonTools.htmlEntities(message.co) + '</div></td></tr>';
                detailsHtml += '<tr><th>' + t('Phone:') + '</th><td><div class="input-like" id="saved-message-phone">' + lzm_commonTools.htmlEntities(message.p) + '</div></td></tr>';
            } else {
                detailsHtml += '<tr><th>' + t('Name:') + '</th><td><input type="text" data-role="none"' +
                    ' id="change-message-name" class="lzm-text-input" value="' + message.fn + '" /></td></tr>';
                detailsHtml += '<tr><th>' + t('Email:') + '</th><td><input type="text" data-role="none"' +
                    ' id="change-message-email" class="lzm-text-input" value="' + message.em + '" /></td></tr>';
                detailsHtml += '<tr><th>' + t('Company:') + '</th><td><input type="text" data-role="none"' +
                    ' id="change-message-company" class="lzm-text-input" value="' + message.co + '" /></td></tr>';
                detailsHtml += '<tr><th>' + t('Phone:') + '</th><td><input type="text" data-role="none"' +
                    ' id="change-message-phone" class="lzm-text-input" value="' + message.p + '" /></td></tr>';
            }
        }
        var subject = (message.t == 0 && message.s != '') ?
            '<a onclick="openLink(\'' + message.s + '\');" href="#" class="lz_chat_link_no_icon">' + message.s + '</a>' :
            lzm_commonTools.htmlEntities(message.s);
        var subjectLabel = (message.t == 0 && message.s != '') ? t('Url:') : t('Subject:');
        if (!edit) {
            detailsHtml += '<tr><th>' + subjectLabel + '</th><td><div class="input-like" id="saved-message-subject">' + subject + '</div></td></tr>';
        } else {
            detailsHtml += '<tr><th>' + subjectLabel + '</th><td><input type="text" data-role="none"' +
                ' id="change-message-subject" class="lzm-text-input" value="' + message.s + '" /></td></tr>';
        }
        for (i=0; i<lzm_chatServerEvaluation.inputList.idList.length; i++) {
            myCustomInput = lzm_chatServerEvaluation.inputList.getCustomInput(lzm_chatServerEvaluation.inputList.idList[i]);
            myInputText = '';
            var myInputValue = '0';
            if (myCustomInput.active == 1 && message.customInput.length > 0 && $.inArray(message.t, ['0', '2', '4']) != -1) {
                for (j=0; j<message.customInput.length; j++) {
                    if (message.customInput[j].id == myCustomInput.name) {
                        myInputText = (myCustomInput.type != 'CheckBox') ? lzm_commonTools.htmlEntities(message.customInput[j].text) :
                            (message.customInput[j].text == 1) ? t('Yes') : t('No');
                        if (myCustomInput.type == 'File') {
                            for (var k=0; k<message.attachment.length; k++) {
                                if (message.attachment[k].n == myInputText) {
                                    myDownloadLink = getQrdDownloadUrl({rid: message.attachment[k].id, ti: message.attachment[k].n});
                                }
                            }
                            myInputText = (myDownloadLink != '') ? '<a href="#" class="lz_chat_file_no_icon"' +
                                ' onclick="downloadFile(\'' + myDownloadLink + '\')">' + myInputText + '</a>' : myInputText;
                        }
                        myInputValue = message.customInput[j].text;
                    }
                }
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                    if (!edit) {
                        detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><div class="input-like">' + myInputText + '</div></td></tr>';
                    } else {
                        if (myCustomInput.type == 'CheckBox') {
                            var inputChecked = (myInputValue == '1') ? ' checked="checked"' : '';
                            detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><input type="checkbox" data-role="none"' +
                                ' id="change-message-custom-' + myCustomInput.id + '" value="1"' + inputChecked +
                                ' style="min-width: 0px; width: initial;" /></td></tr>';
                        } else if(myCustomInput.type == 'ComboBox') {
                            detailsHtml += '<tr><th></th><td><select data-role="none" id="change-message-custom-' + myCustomInput.id + '">';
                            for (j=0; j<myCustomInput.value.length; j++) {
                                var inputSelected = (myCustomInput.value[j] == myInputValue) ? ' selected="selected"' : '';
                                detailsHtml += '<option' + inputSelected + ' value="' + j + '">' + myCustomInput.value[j] + '</option>';
                            }
                            detailsHtml += '</select></td></tr>';
                        } else {
                            detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><input type="text" data-role="none"' +
                                ' id="change-message-custom-' + myCustomInput.id + '" class="lzm-text-input" value="' + myInputText + '" /></td></tr>';
                        }
                    }
                }
            } else if (myCustomInput.active == 1 && message.customInput.length == 0 && $.inArray(message.t, ['0', '2', '4']) != -1) {
                if (myCustomInput.active == 1 && parseInt(myCustomInput.id) < 111) {
                    if (!edit) {
                        detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><div class="input-like">-</div></td></tr>';
                    } else {
                        if (myCustomInput.type == 'CheckBox') {
                            detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><input type="checkbox" data-role="none"' +
                                ' id="change-message-custom-' + myCustomInput.id + '" value="1" /></td></tr>';
                        } else if(myCustomInput.type == 'ComboBox') {
                            detailsHtml += '<tr><th></th><td><select data-role="none" id="change-message-custom-' + myCustomInput.id + '">';
                            for (j=0; j<myCustomInput.value.length; j++) {
                                detailsHtml += '<option value="' + j + '">' + myCustomInput.value[j] + '</option>';
                            }
                            detailsHtml += '</select></td></tr>';
                        } else {
                            detailsHtml += '<tr><th>' + myCustomInput.name + ':</th><td><input type="text" data-role="none"' +
                                ' id="change-message-custom-' + myCustomInput.id + '" class="lzm-text-input" value="" /></td></tr>';
                        }
                    }
                }
            }
        }
    }
    detailsHtml += '</table>';

    return detailsHtml;
};

ChatTicketClass.prototype.showTicketMsgTranslator = function(ticket, msgNo) {
    var headerString = t('Translate');
    var footerString = lzm_displayHelper.createButton('translate-ticket-cancel', '', '', t('Cancel'), '', 'lr',
        {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
        lzm_displayHelper.createButton('translate-ticket-comment', '', '', t('Comment'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
        lzm_displayHelper.createButton('translate-ticket-attach', '', '', t('Attach'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
        lzm_displayHelper.createButton('translate-ticket-replace', '', '', t('Replace'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'});
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
        footerString += lzm_displayHelper.createButton('translate-ticket-retranslate', '', '', t('Translate'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'left'});
    }
    var msgText = ticket.messages[msgNo].mt;
    var translatedText = '', defaultLanguage = lzm_chatServerEvaluation.defaultLanguage, i = 0;
    defaultLanguage = ($.inArray(defaultLanguage, lzm_chatDisplay.translationLangCodes) != -1) ?
        defaultLanguage : ($.inArray(defaultLanguage.split('-')[0], lzm_chatDisplay.translationLangCodes) -1) ?
        defaultLanguage.split('-')[0] : 'en';
    var bodyString = '<fieldset id="ticket-translator-original" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Original') + '</legend>' +
        '<select data-role="none" id="ticket-translator-orig-select" class="lzm-select ui-disabled"><br />' +
        '<option value="">' + t('Auto-Detect') + '</option>';
    bodyString += '</select>' +
        '<textarea id="ticket-translator-orig-text" data-role="none" class="ticket-reply-text" style="padding: 4px;">' + msgText + '</textarea>' +
        '</fieldset>' +
        '<fieldset id="ticket-translator-translation" class="lzm-fieldset" data-role="none" style="margin-top: 5px;">' +
        '<legend>' + t('Translation') + '</legend>' +
        '<select data-role="none" id="ticket-translator-translated-select" class="lzm-select"><br />';
    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
        var selectedString = (lzm_chatDisplay.translationLanguages[i].language == defaultLanguage) ? ' selected="selected"' : '';
        bodyString += '<option' + selectedString + ' value="' + lzm_chatDisplay.translationLanguages[i].language + '">' + lzm_chatDisplay.translationLanguages[i].language.toUpperCase() + ' - ' +
            lzm_chatDisplay.translationLanguages[i].name + '</option>'
    }
    bodyString += '</select>' +
        '<textarea id="ticket-translator-translated-text" data-role="none" class="ticket-reply-text" style="padding: 4px;"></textarea>' +
        '</fieldset>';

    var dialogId = (typeof lzm_chatDisplay.ticketDialogId[ticket.id] != 'undefined') ? lzm_chatDisplay.ticketDialogId[ticket.id] : md5(Math.random().toString());
    var ticketSender = (ticket.messages[0].fn.length > 20) ? lzm_commonTools.escapeHtml(ticket.messages[0].fn).substr(0, 17) + '...' :
        lzm_commonTools.escapeHtml(ticket.messages[0].fn);
    var menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', ticket.id],['<!--name-->', ticketSender]]);
    var dialogData = {'ticket-id': ticket.id, menu: menuEntry};
    lzm_displayHelper.minimizeDialogWindow(dialogId, 'ticket-details', dialogData, 'tickets', false);
    lzm_displayHelper.createDialogWindow(headerString,bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '',
        dialogData, true, true, dialogId + '_translator');
    lzm_displayLayout.resizeTicketMsgTranslator();

    var fillTranslatedText = function(sourceLanguage, targetLanguage) {
        var gUrl = 'https://www.googleapis.com/language/translate/v2';
        var dataObject = {key: lzm_chatServerEvaluation.otrs,
            target: targetLanguage, q: $('#ticket-translator-orig-text').val()};
        if (sourceLanguage != '') {
            dataObject.source = sourceLanguage;
        }
        $.ajax({
            type: "GET",
            url: gUrl,
            data: dataObject,
            dataType: 'json'
        }).done(function(data) {
            $('#ticket-translator-translated-text').val(data.data.translations[0].translatedText);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            logit(jqXHR);
            logit(jqXHR.status);
            logit(textStatus);
            logit(errorThrown);
        });
    };

    fillTranslatedText('', defaultLanguage);
    $('#ticket-translator-translated-select').change(function() {
        fillTranslatedText($('#ticket-translator-orig-select').val(), $('#ticket-translator-translated-select').val());
    });
    $('#ticket-translator-orig-select').change(function() {
        fillTranslatedText($('#ticket-translator-orig-select').val(), $('#ticket-translator-translated-select').val());
    });

    $('#translate-ticket-retranslate').click(function() {
        fillTranslatedText($('#ticket-translator-orig-select').val(), $('#ticket-translator-translated-select').val());
    });

    $('#translate-ticket-replace').click(function() {
        var translatedText = $('#ticket-translator-translated-text').val();
        $('#translate-ticket-cancel').click();
        saveTicketTranslationText(ticket, msgNo, translatedText);
    });
    $('#translate-ticket-attach').click(function() {
        var translatedText = msgText + '\r\n\r\n' + $('#ticket-translator-translated-text').val();
        $('#translate-ticket-cancel').click();
        saveTicketTranslationText(ticket, msgNo, translatedText);
    });
    $('#translate-ticket-comment').click(function() {
        var translatedText = $('#ticket-translator-translated-text').val();
        $('#translate-ticket-cancel').click();
        saveTicketTranslationText(ticket, msgNo, translatedText, 'comment');
    });
    $('#translate-ticket-cancel').click(function() {
        lzm_displayHelper.removeDialogWindow('ticket-details');
        lzm_displayHelper.maximizeDialogWindow(dialogId);
    });
};

ChatTicketClass.prototype.showTicketLinker = function(firstObject, secondObject, firstType, secondType, inChatDialog) {
    var that = this;
    var headerString = t('Create Link');
    var footerString = lzm_displayHelper.createButton('link-ticket-cancel', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'}) +
            lzm_displayHelper.createButton('link-ticket-link', 'ui-disabled', '', t('Link'), '', 'lr',
                {'margin-left': '6px', 'margin-top': '-2px', 'float': 'right'});
    var fsTitle = (firstType == 'ticket') ? t('Link Ticket') : t('Link Chat');
    var linkWithLabel = (secondType == 'ticket') ? t('Ticket ID') : t('Chat ID');
    var firstObjectId = (firstType == 'ticket' && firstObject != null) ? firstObject.id : '';
    var secondObjectId = (secondType == 'ticket' && secondObject != null) ? secondObject.id : (secondType == 'chat' && secondObject != null) ? secondObject.cid : '';
    var firstDivVisible = (firstObject != null) ? 'visibile' : 'hidden';
    var secondDivVisible = (secondObject != null) ? 'visibile' : 'hidden';
    var firstInputDisabled = (firstObject != null) ? ' ui-disabled' : '';
    var secondInputDisabled = (secondObject != null) ? ' ui-disabled' : '';
    var fsSearchData = (firstType == 'ticket' && firstObject != null) ? (secondType == 'ticket') ? ' data-search="second~ticket"' :
        ' data-search="second~chat"' :' data-search="first~ticket"';
    var inputChangeId = (firstObject == null) ? 'first-link-object-id' : (secondObject == null) ? 'second-link-object-id' : '';
    var bodyString = '<fieldset data-role="none"' + fsSearchData + ' data-input="' + inputChangeId + '" class="lzm-fieldset"' +
        ' id="ticket-linker-first"><legend>' + fsTitle + '</legend>' +
        '<label for="first-link-object-id">' + t('Ticket ID') + '</label><br />' +
        '<input data-role="none" class="lzm-text-input' + firstInputDisabled + '" id="first-link-object-id" style="margin-top: 5px;" value="' + firstObjectId + '" />' +
        '<div id="first-link-div" style="margin-top: 10px; padding: 10px 20px; background-color: #ffffe1; border: 1px solid #f9f9da;' +
        ' visibility: ' + firstDivVisible + '">';
    if (firstType == 'ticket' && firstObject != null) {
        bodyString += that.fillLinkData('first', firstObjectId, true);
    }
    bodyString += '</div></fieldset>';
    bodyString += '<fieldset data-role="none" class="lzm-fieldset" id="ticket-linker-second" style="margin-top: 10px;"><legend>' + t('Link with...') + '</legend>' +
        '<label for="second-link-object-id">' + linkWithLabel + '</label><br />' +
        '<input data-role="none" class="lzm-text-input' + secondInputDisabled + '" id="second-link-object-id" style="margin-top: 5px;" value="' + secondObjectId + '" />' +
        '<div id="second-link-div" style="margin-top: 10px; padding: 10px 20px; background-color: #ffffe1; border: 1px solid #f9f9da;' +
        ' visibility: ' + secondDivVisible + '">';
    if (secondType == 'chat' && secondType != null) {
        bodyString += lzm_chatDisplay.archiveDisplay.fillLinkData(secondObjectId, true);
    }
    bodyString += '</div></fieldset>';

    var dialogId, menuEntry, dialogData, chatsDialogId, chatsWindowId, chatsDialogData;
    if (firstType == 'ticket' && firstObject != null) {
        dialogId = (typeof lzm_chatDisplay.ticketDialogId[firstObject.id] != 'undefined') ? lzm_chatDisplay.ticketDialogId[firstObject.id] : md5(Math.random().toString());
        var ticketSender = (firstObject.messages[0].fn.length > 20) ? lzm_commonTools.escapeHtml(firstObject.messages[0].fn).substr(0, 17) + '...' :
            lzm_commonTools.escapeHtml(firstObject.messages[0].fn);
        menuEntry = t('Ticket (<!--ticket_id-->, <!--name-->)',[['<!--ticket_id-->', firstObject.id],['<!--name-->', ticketSender]]);
        dialogData = {'ticket-id': firstObject.id, menu: menuEntry};
        lzm_displayHelper.minimizeDialogWindow(dialogId, 'ticket-details', dialogData, 'tickets', false);
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '',
            dialogData, true, true, dialogId + '_linker');
    } else if (secondType == 'chat' && secondObject != null && !inChatDialog) {
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'link-chat-ticket', {}, {}, {}, {}, '',
            {cid: secondObject.cid, menu: t('Link with Ticket')}, true, true);
    } else if (secondType == 'chat' && secondObject != null) {
        chatsDialogId = $('#matching-chats-inner-div').data('chat-dialog-id');
        chatsWindowId = $('#matching-chats-inner-div').data('chat-dialog-window');
        chatsDialogData = $('#matching-chats-inner-div').data('chat-dialog-data');
        //chatsDialogData['no-chat-reload'] = true;
        lzm_displayHelper.minimizeDialogWindow(chatsDialogId, chatsWindowId, chatsDialogData, 'archive', false);
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, chatsWindowId, {}, {}, {}, {}, '',
            chatsDialogData, true, true, chatsDialogId + '_linker');
    }
    lzm_displayLayout.resizeTicketLinker();

    var ticketPollData = null, chatPollData = null, lastTyping = 0, lastSeachId = '';
    var handleSearch = function(isSame) {
        if ($('#' + inputChangeId).val() != '' && firstObject == null) {
            if (ticketPollData == null) {
                ticketPollData = {s: lzm_chatPollServer.ticketSort, p: lzm_chatPollServer.ticketPage, q: lzm_chatPollServer.ticketQuery,
                    f: lzm_chatPollServer.ticketFilter, c: lzm_chatPollServer.ticketFilterChannel, l: lzm_chatPollServer.ticketLimit};
                $('#ticket-linker-first').data('ticket-poll-data', ticketPollData);
            }
            if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                lzm_chatPollServer.stopPolling();
                lzm_chatPollServer.ticketSort = '';
                lzm_chatPollServer.ticketPage = 1;
                lzm_chatPollServer.ticketQuery = $('#' + inputChangeId).val();
                lzm_chatPollServer.ticketFilter = '0123';
                lzm_chatPollServer.ticketFilterChannel = '01234567';
                lzm_chatPollServer.ticketLimit = 10;
                lzm_chatPollServer.resetTickets = true;
                lzm_chatPollServer.startPolling();
            }
            $('#link-ticket-link').removeClass('ui-disabled');
            that.fillLinkData('first', $('#' + inputChangeId).val());
        } else if ($('#' + inputChangeId).val() != '') {
            $('#link-ticket-link').removeClass('ui-disabled');
            if (secondType == 'ticket') {
                if (ticketPollData == null) {
                    ticketPollData = {s: lzm_chatPollServer.ticketSort, p: lzm_chatPollServer.ticketPage, q: lzm_chatPollServer.ticketQuery,
                        f: lzm_chatPollServer.ticketFilter, c: lzm_chatPollServer.ticketFilterChannel, l: lzm_chatPollServer.ticketLimit};
                    $('#ticket-linker-first').data('ticket-poll-data', ticketPollData);
                }
                if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                    lzm_chatPollServer.stopPolling();
                    lzm_chatPollServer.ticketSort = '';
                    lzm_chatPollServer.ticketPage = 1;
                    lzm_chatPollServer.ticketQuery = $('#' + inputChangeId).val();
                    lzm_chatPollServer.ticketFilter = '0123';
                    lzm_chatPollServer.ticketFilterChannel = '01234567';
                    lzm_chatPollServer.ticketLimit = 10;
                    lzm_chatPollServer.resetTickets = true;
                    lzm_chatPollServer.startPolling();
                }
                that.fillLinkData('second', $('#' + inputChangeId).val());
            } else {
                if (chatPollData == null) {
                    chatPollData = {p: lzm_chatPollServer.chatArchivePage, q: lzm_chatPollServer.chatArchiveQuery, f: lzm_chatPollServer.chatArchiveFilter,
                        l: lzm_chatPollServer.chatArchiveLimit, g: lzm_chatPollServer.chatArchiveFilterGroup, e: lzm_chatPollServer.chatArchiveFilterExternal,
                        i: lzm_chatPollServer.chatArchiveFilterInternal};
                    $('#ticket-linker-first').data('chat-poll-data', chatPollData);
                }
                if ($('#' + inputChangeId).val().length >= 5 && !isSame) {
                    lzm_chatPollServer.stopPolling();
                    lzm_chatPollServer.chatArchivePage = 1;
                    lzm_chatPollServer.chatArchiveQuery = $('#' + inputChangeId).val();
                    lzm_chatPollServer.chatArchiveFilter = '012';
                    lzm_chatPollServer.chatArchiveLimit = 10;
                    lzm_chatPollServer.chatArchiveFilterGroup = '';
                    lzm_chatPollServer.chatArchiveFilterExternal = '';
                    lzm_chatPollServer.chatArchiveFilterInternal = '';
                    lzm_chatPollServer.resetChats = true;
                    lzm_chatPollServer.startPolling();
                }
                lzm_chatDisplay.archiveDisplay.fillLinkData($('#' + inputChangeId).val());
            }
        } else {
            $('#link-ticket-link').addClass('ui-disabled');
            var position = (firstObject == null) ? 'first' : 'second';
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
            ticketPollData = null;
            chatPollData = null;
        }
    };
    if (inputChangeId != '') {
        $('#' + inputChangeId).keyup(function() {
            lastTyping = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
            setTimeout(function() {
                var now = lzm_chatTimeStamp.getServerTimeString(null, false, 1);
                if (lastTyping != 0 && now - lastTyping > 570) {
                    handleSearch(lastSeachId == $('#' + inputChangeId).val());
                    lastSeachId = $('#' + inputChangeId).val();
                }
            }, 600);
        });
    }

    $('#link-ticket-link').click(function() {
        linkTicket(firstType + '~' + secondType, $('#first-link-object-id').val(), $('#second-link-object-id').val());
        $('#link-ticket-cancel').click();
    });
    $('#link-ticket-cancel').click(function() {
        if (ticketPollData != null) {
            lzm_chatPollServer.stopPolling();
            lzm_chatPollServer.ticketSort = ticketPollData.s;
            lzm_chatPollServer.ticketPage = ticketPollData.p;
            lzm_chatPollServer.ticketQuery = ticketPollData.q;
            lzm_chatPollServer.ticketFilter = ticketPollData.f;
            lzm_chatPollServer.ticketFilterChannel = ticketPollData.c;
            lzm_chatPollServer.ticketLimit = ticketPollData.l;
            lzm_chatPollServer.resetTickets = true;
            lzm_chatPollServer.startPolling();
        }
        if (chatPollData != null) {
            lzm_chatPollServer.stopPolling();
            lzm_chatPollServer.chatArchivePage = chatPollData.p;
            lzm_chatPollServer.chatArchiveQuery = chatPollData.q;
            lzm_chatPollServer.chatArchiveFilter = chatPollData.f;
            lzm_chatPollServer.chatArchiveLimit = chatPollData.l;
            lzm_chatPollServer.chatArchiveFilterGroup = chatPollData.g;
            lzm_chatPollServer.chatArchiveFilterExternal = chatPollData.e;
            lzm_chatPollServer.chatArchiveFilterInternal = chatPollData.i;
            lzm_chatPollServer.resetChats = true;
            lzm_chatPollServer.startPolling();
        }
        if (firstType == 'ticket' && firstObject != null) {
            lzm_displayHelper.removeDialogWindow('ticket-details');
            lzm_displayHelper.maximizeDialogWindow(dialogId);
        } else if (secondType == 'chat' && secondObject != null && inChatDialog) {
            lzm_displayHelper.removeDialogWindow(chatsWindowId);
            lzm_displayHelper.maximizeDialogWindow(chatsDialogId);
        } else {
            lzm_displayHelper.removeDialogWindow('link-chat-ticket');
        }
    });
};

ChatTicketClass.prototype.fillLinkData = function(position, ticketId, onlyReturnHtml, doNotClear) {
    onlyReturnHtml = (typeof onlyReturnHtml != 'undefined') ? onlyReturnHtml : false;
    doNotClear = (typeof doNotClear != 'undefined') ? doNotClear : false;
    doNotClear = doNotClear && $('#first-link-div').css('visibility') == 'visible';
    var myTicket = null, tableString = '';
    for (var i=0; i<lzm_chatDisplay.ticketListTickets.length; i++) {
        if (lzm_chatDisplay.ticketListTickets[i].id == ticketId) {
            myTicket = lzm_commonTools.clone(lzm_chatDisplay.ticketListTickets[i]);
        }
    }
    if (myTicket != null) {
        var ticketCreationDate = lzm_chatTimeStamp.getLocalTimeObject(myTicket.messages[0].ct * 1000, true);
        var ticketCreationDateHuman = lzm_commonTools.getHumanDate(ticketCreationDate, 'full', lzm_chatDisplay.userLanguage);
        tableString = '<table>' +
            '<tr><th style="text-align: right;">' + t('Name:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].fn) + '</td></tr>' +
            '<tr><th style="text-align: right;">' + t('Email:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].em) + '</td></tr>' +
            '<tr><th style="text-align: right;">' + t('Company:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].co) + '</td></tr>' +
            '<tr><th style="text-align: right;">' + t('Phone:') + '</th><td>' + lzm_commonTools.escapeHtml(myTicket.messages[0].p) + '</td></tr>' +
            '<tr><th style="text-align: right;">' + t('Date:') + '</th><td>' + ticketCreationDateHuman + '</td></tr>' +
            '<tr><th style="text-align: right;">' + t('Visitor ID:') + '</th><td>' + myTicket.messages[0].ui + '</td></tr>' +
            '</table>';
        if (!onlyReturnHtml)
            $('#' + position + '-link-div').css({'visibility': 'visible'});
    } else {
        if (!onlyReturnHtml && !doNotClear)
            $('#' + position + '-link-div').css({'visibility': 'hidden'});
    }
    if (!onlyReturnHtml && !doNotClear)
        $('#' + position + '-link-div').html(tableString);
    return tableString;
};

/********** Email **********/
ChatTicketClass.prototype.showEmailList = function() {
    var that = this;
    lzm_chatDisplay.emailDeletedArray = [];
    lzm_chatDisplay.ticketsFromEmails = [];
    lzm_commonTools.clearEmailReadStatusArray();

    var headerString = t('Emails');
    var footerString = lzm_displayHelper.createButton('save-email-list', '','', t('Ok'), '', 'lr',
        {'margin-left': '6px'}) +
        lzm_displayHelper.createButton('cancel-email-list', '','', t('Cancel'), '', 'lr',
            {'margin-left': '6px'}) +
        lzm_displayHelper.createButton('delete-email', '','', t('Delete (Del)'), '<i class="fa fa-remove"></i>', 'lr',
            {'margin-left': '6px', float:'left', 'margin-top': '-4px'}) +
        lzm_displayHelper.createButton('create-ticket-from-email', '','', t('Create Ticket'), '<i class="fa fa-plus"></i>', 'lr',
            {'margin-left': '6px', float:'left', 'margin-top': '-4px'}) +
        lzm_displayHelper.createButton('reset-emails', 'ui-disabled','', t('Reset'), '', 'lr',
            {'margin-left': '6px', float:'left', 'margin-top': '-4px'});
    var bodyString = '<div id="open-emails" style="margin-top: 5px;">' +
        '<div id="email-list-placeholder"></div></div>' +
        '<div id="email-details" style="margin-top: 10px;">' +
        '<div id="email-placeholder" data-selected-email="0"></div>' +
        '</div>';
    var emailLoadingDiv = '<div id="email-list-loading"></div>';
    var dialogData = {};
    var dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'email-list', {}, {}, {}, {}, '', dialogData, true, true);

    var emailContentHtml = '<fieldset id="email-content" class="lzm-fieldset"><legend>' + t('Text') + '</legend></fieldset>';
    var emailHtmlHtml = '<fieldset id="email-html" class="lzm-fieldset"><legend>' + t('Html') + '</legend></fieldset>';
    var emailAttachmentHtml = '<fieldset id="email-attachment-list" class="lzm-fieldset"><legend>' + t('Attachments') + '</legend></fieldset>';

    lzm_displayHelper.createTabControl('email-placeholder', [{name: t('Text'), content: emailContentHtml},
        {name: t('Html'), content: emailHtmlHtml}, {name: t('Attachments'), content: emailAttachmentHtml}]);
    lzm_displayHelper.createTabControl('email-list-placeholder', [{name: t('Incoming Emails'), content: emailLoadingDiv}]);

    var myHeight = $('#email-list-body').height() + 10;
    var listHeight = Math.floor(Math.max(myHeight / 2, 175) - 45);
    var contentHeight = (myHeight - listHeight) - 93;
    $('.email-list-placeholder-content').css({height: listHeight + 'px'});
    $('.email-placeholder-content').css({height: contentHeight + 'px'});
    $('#email-list-loading').css({height: listHeight + 'px', 'z-index': 1000000,
        'background-color': '#ffffff', 'background-image': 'url("../images/chat_loading.gif")', 'background-repeat': 'no-repeat',
        'background-position': 'center'});
    var emailDetailsHeight = $('.email-placeholder-content').height();
    $('#email-content').css({'min-height': (emailDetailsHeight - 22) + 'px'});
    $('#email-html').css({'min-height': (emailDetailsHeight - 22) + 'px'});
    $('#email-attachment-list').css({'min-height': (emailDetailsHeight - 22) + 'px'});


    $('.email-placeholder-tab').click(function() {
        lzm_displayLayout.resizeEmailDetails();
    });
    $('#cancel-email-list').click(function() {
        lzm_chatDisplay.emailDeletedArray = [];
        lzm_chatDisplay.ticketsFromEmails = [];
        toggleEmailList();
        lzm_displayHelper.removeDialogWindow('email-list');
    });
    $('#save-email-list').click(function() {
        saveEmailListChanges('', false);
        $('#cancel-email-list').click();
    });
    $('#delete-email').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'delete_emails', {})) {
            deleteEmail();
        } else {
            showNoPermissionMessage();
        }
    });
    $('#create-ticket-from-email').click(function() {
        if (lzm_commonPermissions.checkUserPermissions('', 'tickets', 'create_tickets', {})) {
            var emailId = $('#email-placeholder').data('selected-email-id');
            var emailNo = $('#email-placeholder').data('selected-email');
            $('#reset-emails').removeClass('ui-disabled');
            $('#delete-email').addClass('ui-disabled');
            $('#create-ticket-from-email').addClass('ui-disabled');
            $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-plus" style="color: #00bb00;"></i>');
            lzm_chatDisplay.emailsToTickets.push(emailId);
            saveEmailListChanges(emailId, true);
            showTicketDetails('', false, emailId, '', dialogId);
            $('#email-list-body').data('selected-email', emailNo);
            $('#email-list-body').data('selected-email-id', emailId);
        } else {
            showNoPermissionMessage();
        }
    });
    $('#reset-emails').click(function() {
        var emailNo = $('#email-placeholder').data('selected-email');
        var emailId = $('#email-placeholder').data('selected-email-id');
        lzm_commonTools.removeEmailFromDeleted(emailId);
        lzm_commonTools.removeEmailFromTicketCreation(emailId);
        $('#email-list-line-' + emailNo).children('td:first').html('<i class="fa fa-envelope-o"></i>');
        $('#reset-emails').addClass('ui-disabled');
        $('#delete-email').removeClass('ui-disabled');
        $('#create-ticket-from-email').removeClass('ui-disabled');
        if (lzm_commonTools.checkEmailIsLockedBy(emailId, lzm_chatDisplay.myId)) {
            saveEmailListChanges(emailId, false);
        }
    });
};

ChatTicketClass.prototype.updateEmailList = function() {
    var that = this, emails = lzm_chatServerEvaluation.emails, i = 0;
    var selectedLine = $('#email-placeholder').data('selected-email');
    selectedLine = (typeof selectedLine != 'undefined') ? selectedLine : $('#email-list-body').data('selected-email');
    $('#email-placeholder').data('selected-email-id', emails[selectedLine].id);
    if (lzm_commonTools.checkEmailReadStatus($('#email-placeholder').data('selected-email-id')) == -1 &&
        lzm_chatTimeStamp.getServerTimeString(null, true) - emails[selectedLine].c <= 1209600) {
        lzm_chatDisplay.emailReadArray.push({id: emails[selectedLine].id, c: emails[selectedLine].c});
    }
    var emailListHtml = '<fieldset id="incoming-email-list" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Incoming Emails') + '</legend>' +
        '<table id="incoming-email-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"><thead><tr>' +
        '<th style="width: 18px !important;"></th>' +
        '<th style="width: 18px !important;"></th>' +
        '<th>' + t('Date') + '</th>' +
        '<th>' + t('Subject') + '</th>' +
        '<th>' + t('Email') + '</th>' +
        '<th>' + t('Name') + '</th>' +
        '<th>' + t('Group') + '</th>' +
        '<th>' + t('Sent to') + '</th>' +
        '</tr></thead><tbody>';
    for (i=0; i<emails.length; i++) {
        var group = lzm_chatServerEvaluation.groups.getGroup(emails[i].g);
        emailListHtml += that.createEmailListLine(emails[i], i, group);
    }
    emailListHtml += '</tbody>';
    if (lzm_chatServerEvaluation.emailCount > lzm_chatPollServer.emailAmount) {
        emailListHtml += '<tfoot><tr>' +
            '<td colspan="8" id="emails-load-more">' + t('Load more emails') + '</td>' +
            '</tr></tfoot>';
    }
    emailListHtml += '</table>' +
        '</fieldset>';
    var emailText = lzm_commonTools.htmlEntities(emails[selectedLine].text).
        replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
    var contentHtml = '<legend>' + t('Text') + '</legend>' +
        '<div id="email-subject">' + lzm_commonTools.htmlEntities(emails[selectedLine].s) + '</div>' +
        '<div id="email-text" style="margin-top: 10px;">' + emailText + '</div>';
    var emailIdEnc = lz_global_base64_url_encode(emails[selectedLine].id);
    var htmlEmailUrl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url + '/email.php?ws=' + multiServerId + '&id=' + emailIdEnc;
    var htmlHtml = '<legend>' + t('Html') + '</legend>' +
        '<iframe id="html-email-' + emailIdEnc.substr(0, 10) + '" class="html-email-iframe" src="' + htmlEmailUrl + '"></iframe>';
    var attachmentHtml = '<legend>' + t('Attachments') + '</legend>' +
        that.createTicketAttachmentTable({}, emails[selectedLine], -1, false);
    $('#email-content').html(contentHtml);
    $('#email-html').html(htmlHtml);
    $('#email-attachment-list').html(attachmentHtml);

    $('#email-list-loading').remove();
    $('#email-list-placeholder-content-0').html(emailListHtml);

    var emailListHeight = $('.email-list-placeholder-content').height();
    $('#incoming-email-list').css({'min-height': (emailListHeight - 22) + 'px'});
    $('#email-text').css({'min-height': ($('.email-placeholder-content').height() - 95) + 'px'});

    if (emails[selectedLine].ei != '' && emails[selectedLine].ei != lzm_chatDisplay.myId) {
        $('#reset-emails').addClass('ui-disabled');
        $('#delete-email').addClass('ui-disabled');
        $('#create-ticket-from-email').addClass('ui-disabled');
    } else if (emails[selectedLine].ei != '' && emails[selectedLine].ei == lzm_chatDisplay.myId) {
        $('#reset-emails').removeClass('ui-disabled');
    }

    $('.email-list-line').click(function() {
        var oldSelectedLine = selectedLine;
        var emailId = emails[selectedLine].id;
        $('.email-list-line').removeClass('selected-table-line');
        if (emails[oldSelectedLine].ei != '') {
            if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1) {
                $('#email-list-line-' + oldSelectedLine).children('td:first').html('<i class="fa fa-lock"></i>');
            }
            $('#email-list-line-' + oldSelectedLine).addClass('locked-email-line');
        }
        selectedLine = $(this).data('line-number');
        emailId = emails[selectedLine].id;
        $('#email-list-line-' + selectedLine).removeClass('locked-email-line');
        $('#email-list-line-' + selectedLine).addClass('selected-table-line');
        $('#email-placeholder').data('selected-email', selectedLine);
        $('#email-placeholder').data('selected-email-id', emailId);
        var emailText = lzm_commonTools.htmlEntities(emails[selectedLine].text).
            replace(/\r\n/g, '<br>').replace(/\r/g, '<br>').replace(/\n/g, '<br>');
        var contentHtml = '<legend>' + t('Text') + '</legend>' +
            '<div id="email-subject">' + lzm_commonTools.htmlEntities(emails[selectedLine].s) + '</div>' +
            '<div id="email-text" style="margin-top: 10px;">' + emailText + '</div>';
        var emailIdEnc = lz_global_base64_url_encode(emails[selectedLine].id);
        var htmlEmailUrl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url + '/email.php?ws=' + multiServerId + '&id=' + emailIdEnc;
        var htmlHtml = '<legend>' + t('Html') + '</legend>' +
            '<iframe id="html-email-' + emailIdEnc.substr(0, 10) + '" class="html-email-iframe" src="' + htmlEmailUrl + '"></iframe>';
        var attachmentHtml = '<legend>' + t('Attachments') + '</legend>' +
            that.createTicketAttachmentTable({}, emails[selectedLine], -1, false);
        $('#email-content').html(contentHtml);
        $('#email-html').html(htmlHtml);
        $('#email-attachment-list').html(attachmentHtml);
        $('#email-text').css({'min-height': ($('.email-placeholder-content').height() - 83) + 'px'});
        if (lzm_commonTools.checkEmailReadStatus(emails[selectedLine].id) == -1 &&
            lzm_chatTimeStamp.getServerTimeString(null, true) - emails[selectedLine].c <= 1209600) {
            lzm_chatDisplay.emailReadArray.push({id: emails[selectedLine].id, c: emails[selectedLine].c});
            if (emails[selectedLine].ei != '') {
                if (lzm_commonTools.checkEmailTicketCreation(emailId) == -1 && $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) == -1) {
                    $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-lock"></i>');
                }
            } else {
                $('#email-list-line-' + selectedLine).children('td:first').html('<i class="fa fa-envelope-o"></i>');
            }
            $('#email-list-line-' + selectedLine).children('td').css('font-weight', 'normal');
        }

        if (emails[selectedLine].ei != '' && emails[selectedLine].ei != lzm_chatDisplay.myId) {
            $('#reset-emails').addClass('ui-disabled');
            $('#delete-email').addClass('ui-disabled');
            $('#create-ticket-from-email').addClass('ui-disabled');
        } else {
            if (lzm_commonTools.checkEmailTicketCreation(emailId) != -1 || $.inArray(emailId, lzm_chatDisplay.emailDeletedArray) != -1) {
                $('#reset-emails').removeClass('ui-disabled');
                $('#delete-email').addClass('ui-disabled');
                $('#create-ticket-from-email').addClass('ui-disabled');
            } else if (emails[selectedLine].ei != '' && emails[selectedLine].ei == lzm_chatDisplay.myId) {
                $('#reset-emails').removeClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
            } else {
                $('#reset-emails').addClass('ui-disabled');
                $('#delete-email').removeClass('ui-disabled');
                $('#create-ticket-from-email').removeClass('ui-disabled');
            }
        }
        lzm_displayLayout.resizeEmailDetails();
    });
    $('#emails-load-more').click(function() {
        lzm_chatPollServer.emailAmount += 20;
        lzm_chatPollServer.emailUpdateTimestamp = 0;
        $('#incoming-email-table').children('tfoot').remove();
    });
};

ChatTicketClass.prototype.createEmailListLine = function(email, lineNumber, group) {
    var selectedClass = (lineNumber == $('#email-placeholder').data('selected-email')) ? ' selected-table-line' : '';
    var attachmentIcon = (email.attachment.length > 0) ? '<i class="fa fa-paperclip"></i>' : '';
    var statusIcon = '<i class="fa fa-envelope"></i>';
    var fontWeight = 'bold';
    if ($.inArray(email.id, lzm_chatDisplay.emailDeletedArray) != -1) {
        statusIcon = '<i class="fa fa-remove" style="color: #cc0000;"></i>';
        fontWeight = 'normal';
    } else if (lzm_commonTools.checkEmailTicketCreation(email.id) != -1) {
        statusIcon = '<i class="fa fa-plus" style="color: #00bb00;"></i>';
        fontWeight = 'normal';
    } else if (email.ei != '') {
        statusIcon = '<i class="fa fa-lock"></i>';
        fontWeight = 'normal';
        if (lineNumber != $('#email-placeholder').data('selected-email')) {
            selectedClass = ' locked-email-line';
        }
    } else if (lzm_chatTimeStamp.getServerTimeString(null, true) - email.c > 1209600 || lzm_commonTools.checkEmailReadStatus(email.id) != -1) {
        statusIcon = '<i class="fa fa-envelope-o"></i>';
        fontWeight = 'normal';
    }
    var emailTime = lzm_chatTimeStamp.getLocalTimeObject(email.c * 1000, true);
    var emailHtml = '<tr class="email-list-line lzm-unselectable' + selectedClass + '" id="email-list-line-' + lineNumber + '" data-line-number="' + lineNumber + '"' +
        ' data-locked-by="' + email.ei + '" style="cursor:pointer;">' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; padding: 0px 9px;">' + statusIcon + '</td>' +
        '<td class="icon-column" style="font-weight: ' + fontWeight + '; padding: 0px 9px;">' + attachmentIcon + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.getHumanDate(emailTime, '', lzm_chatDisplay.userLanguage) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(email.s) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(email.e) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + lzm_commonTools.htmlEntities(email.n) + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + group.id + '</td>' +
        '<td style="font-weight: ' + fontWeight + '; white-space: nowrap;">' + email.r + '</td>' +
        '</tr>';
    return emailHtml;
};

/********** Helper functions **********/
ChatTicketClass.prototype.checkTicketTakeOverReply = function() {
    var rtValue = lzm_commonPermissions.checkUserPermissions('', 'tickets', 'assign_operators', {});
    if (!rtValue) {
        showNoPermissionMessage();
    }
    return rtValue;
};

ChatTicketClass.prototype.ticketMessageSortfunction = function(a,b) {
    var rtValue = (parseInt(a.ct) < parseInt(b.ct)) ? -1 : (parseInt(a.ct) > parseInt(b.ct)) ? 1 : 0;
    return rtValue;
};

ChatTicketClass.prototype.checkTicketDetailsChangePermission = function (ticket, changedValues) {
    var rtValue = true;
    if (typeof ticket.editor != 'undefined' && ticket.editor != false && ticket.editor.st != changedValues.status) {
        if ((!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_open', {}) && changedValues.status == 0) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)) {
            rtValue = false;
        }
    } else if ((typeof ticket.editor == 'undefined' || ticket.editor == false) && changedValues.status != 0) {
        if ((!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_progress', {}) && changedValues.status == 1) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_closed', {}) && changedValues.status == 2) ||
            (!lzm_commonPermissions.checkUserPermissions('', 'tickets', 'status_deleted', {}) && changedValues.status == 3)) {
            rtValue = false;
        }
    }
    return rtValue;
};

ChatTicketClass.prototype.createTicketDetailsGroupChangeHandler = function(selectedTicket) {
    $('#ticket-details-group').change(function() {
        var i, selectedString;
        var selectedGroupId = $('#ticket-details-group').val();
        var selectedOperator = $('#ticket-details-editor').val();
        var operators = lzm_chatServerEvaluation.operators.getOperatorList('name', selectedGroupId);
        var editorSelectString = '<option value="-1">' + t('None') + '</option>';
        for (i=0; i<operators.length; i++) {
            if (operators[i].isbot != 1) {
                selectedString = (operators[i].id == selectedOperator) ? ' selected="selected"' : '';
                editorSelectString += '<option value="' + operators[i].id + '"' + selectedString + '>' + operators[i].name + '</option>';
            }
        }
        var selectedLanguage = $('#ticket-details-language').val();
        var availableLanguages = [];
        var group = lzm_chatServerEvaluation.groups.getGroup(selectedGroupId);
        for (i=0; i<group.pm.length; i++) {
            availableLanguages.push(group.pm[i].lang);
        }
        if ( typeof selectedTicket.l != 'undefined' && $.inArray(selectedTicket.l, availableLanguages) == -1) {
            availableLanguages.push(selectedTicket.l);
        }
        if ($.inArray(selectedLanguage, availableLanguages) == -1) {
            availableLanguages.push(selectedLanguage);
        }
        var langSelectString = '';
        for (i=0; i<availableLanguages.length; i++) {
            selectedString = (availableLanguages[i] == selectedLanguage) ? ' selected="selected"' : '';
            langSelectString += '<option value="' + availableLanguages[i] + '"' + selectedString + '>' + availableLanguages[i] + '</option>';
        }

        $('#ticket-details-editor').html(editorSelectString).trigger('create');
        $('#ticket-details-language').html(langSelectString).trigger('create');
    });
};

ChatTicketClass.prototype.createTicketListContextMenu = function(myObject, place) {
    var contextMenuHtml = '', disabledClass = '';
    var inDialog = (place == 'ticket-list') ? false : true;
    var dialogId = (place == 'ticket-list') ? '' : $('#visitor-information').data('dialog-id');
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-ticket-details" class="cm-line cm-click"' +
        ' onclick="showTicketDetails(\'' + myObject.id + '\', true, \'\', \'\', \'' + dialogId + '\');">' +
        t('Open Ticket') + '</span></div><hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span class="cm-line" style="padding-left: 0px;">' + t('Status:') + '</span>';
    contextMenuHtml += '<div style="margin: 4px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-question-circle" style="padding-left: 5px; color: #5197ff;"></i>' +
        '<span id="set-ticket-open" class="cm-line cm-click" onclick="changeTicketStatus(0, false, ' + inDialog + ')" style="padding-left: 5px;">' +
        t('Open (O)') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-gear" style="padding-left: 5px; color: #808080"></i>' +
        '<span id="set-ticket-progress" class="cm-line cm-click"onclick="changeTicketStatus(1, false, ' + inDialog + ')" style="padding-left: 5px;">' +
        t('In Progress (P)') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-check-circle" style="padding-left: 5px; color: #009a00;"></i>' +
        '<span id="set-ticket-closed" class="cm-line cm-click" onclick="changeTicketStatus(2, false, ' + inDialog + ')" style="padding-left: 5px;">' +
        t('Closed (C)') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 0px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-remove" style="padding-left: 5px; color: #cc0000;"></i>' +
        '<span id="set-ticket-deleted" class="cm-line cm-click" onclick="changeTicketStatus(3, false, ' + inDialog + ')" style="padding-left: 6px;">' +
        t('Deleted (D)') + '</span></div>';
    contextMenuHtml += '</div><hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 4px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-operator-submenu" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showSubMenu(\'' + place + '\', \'operator\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)">' +
        t('Operator') + '</span><i class="fa fa-chevron-right lzm-ctxt-right-fa"></i></div>';
    contextMenuHtml += '<div style="margin: 4px 0px 0px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-group-submenu" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showSubMenu(\'' + place + '\', \'group\', \'' + myObject.id + '\', %CONTEXTX%, %CONTEXTY%, %MYWIDTH%, %MYHEIGHT%)">' +
        t('Group') + '</span><i class="fa fa-chevron-right lzm-ctxt-right-fa"></i></div><hr />';
    disabledClass = ((myObject.u <= lzm_chatDisplay.ticketGlobalValues.mr &&
        lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketUnreadArray) == -1) ||
        (myObject.u > lzm_chatDisplay.ticketGlobalValues.mr &&
            lzm_commonTools.checkTicketReadStatus(myObject.id, lzm_chatDisplay.ticketReadArray, lzm_chatDisplay.ticketListTickets) != -1)) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div ' + disabledClass + 'style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="set-ticket-read" class="cm-line cm-click" onclick="changeTicketReadStatus(\'' + myObject.id + '\', \'read\');">' +
        t('Mark as read') + '</span></div>';
    if (place == 'ticket-list') {
        contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
            '<span id="set-all-tickets-read" class="cm-line cm-click" onclick="setAllTicketsRead();">' +
            t('Mark all as read') + '</span></div>';
    }
    return contextMenuHtml
};

ChatTicketClass.prototype.createTicketFilterMenu = function (myObject) {
    var filterList = myObject.filter.split(''), contextMenuHtml = '', i = 0;
    for (i=0; i<4; i++) {
        if ($.inArray(i.toString(), filterList) != -1) {
            lzm_chatDisplay.ticketFilterChecked[i] = 'visible';
        } else {
            lzm_chatDisplay.ticketFilterChecked[i] = 'hidden';
        }
    }
    lzm_chatDisplay.ticketFilterPersonal = (myObject.filter_personal) ? 'visible' : 'hidden';
    lzm_chatDisplay.ticketFilterGroup = (myObject.filter_group) ? 'visible' : 'hidden';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-open" class="cm-line cm-click" onclick="toggleTicketFilter(0, event)" style="padding-left: 0px;">' +
        t('<!--checked--> Open', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterChecked[0] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-progress" class="cm-line cm-click" onclick="toggleTicketFilter(1, event)" style="padding-left: 0px;">' +
        t('<!--checked--> In Progress', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterChecked[1] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-closed" class="cm-line cm-click" onclick="toggleTicketFilter(2, event)" style="padding-left: 0px;">' +
        t('<!--checked--> Closed', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterChecked[2] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-deleted" class="cm-line cm-click" onclick="toggleTicketFilter(3, event)" style="padding-left: 0px;">' +
        t('<!--checked--> Deleted', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterChecked[3] + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-personal" class="cm-line cm-click" onclick="toggleTicketFilterPersonal(0, event)" style="padding-left: 0px;">' +
        t('<!--checked--> Only my tickets', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterPersonal + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left;">' +
        '<span id="toggle-filter-group" class="cm-line cm-click" onclick="toggleTicketFilterPersonal(1, event)" style="padding-left: 0px;">' +
        t('<!--checked--> Only my group\'s tickets', [['<!--checked-->', '<span style="visibility: ' + lzm_chatDisplay.ticketFilterGroup + ';">&#10003;</span>']]) + '</span></div>';
    contextMenuHtml += '<hr />';
    var channels = [t('Web'), t('Email'), t('Phone'), t('Misc'), t('Chat'), t('Rating'), t('Facebook'), t('Twitter')];
    for (i=0; i<channels.length; i++) {
        var thisChannelChecked = (lzm_chatPollServer.ticketFilterChannel.indexOf('' + i) != -1) ? 'visible' : 'hidden';
        contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
            '<span id="toggle-filter-channel-' + i + '" class="cm-line cm-click" onclick="toggleTicketFilterChannel(' + i + ', event)" style="padding-left: 0px;">' +
            '<span style="visibility: ' + thisChannelChecked + ';">&#10003;</span> ' + channels[i] + '</span></div>';
    }
    return contextMenuHtml;
};

ChatTicketClass.prototype.createTicketDetailsContextMenu = function(myObject) {
    var contextMenuHtml = '', disabledClass = '';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-reply" style="padding-left: 4px;"></i>' +
        '<span id="reply-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 4px; cursor:pointer;\' onclick="removeTicketMessageContextMenu(); $(\'#reply-ticket-details\').click();">' +
        t('Reply') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-share" style="padding-left: 4px;"></i>' +
        '<span id="forward-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 4px; cursor:pointer;\' onclick="showMessageForward(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\');">' +
        t('Forward') + '</span></div>';
    disabledClass = (myObject.ti.messages[myObject.msg].t != 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="resend-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="sendForwardedMessage({id : \'\'}, \'\', \'\', \'\', \'' + myObject.ti.id + '\', \'\', \'' + myObject.msg + '\')">' +
        t('Resend message') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-print" style="padding-left: 4px;"></i>' +
        '<span id="print-this-message" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 5px; cursor:pointer;\'' +
        ' onclick="printTicketMessage(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\');">' +
        t('Print Message') + '</span></div><hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-phone" style="padding-left: 4px;"></i>' +
        '<span id="call-this-message-sender" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 7px; cursor:pointer;\'' +
        ' onclick="showPhoneCallDialog(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\', \'ticket\');">' +
        t('Phone Call') + '</span></div><hr />';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="link-ticket-chat" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'chat\')">' +
        t('Link this Ticket with Chat') + '</span></div>';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="link-ticket-chat" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showTicketLinker(\'' + myObject.ti.id + '\', \'\', \'ticket\', \'ticket\')">' +
        t('Link this Ticket with Ticket') + '</span></div>';
    var emailIdEnc = lz_global_base64_url_encode(myObject.ti.messages[myObject.msg].ci);
    disabledClass = (myObject.ti.t == 1 && (myObject.ti.messages[myObject.msg].t == 3 || myObject.ti.messages[myObject.msg].t == 4)) ? '' : ' class="ui-disabled"';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="show-html-email" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showHtmlEmail(\'' + emailIdEnc + '\')">' +
        t('Show Html Email') + '</span></div>';
    disabledClass = (myObject.msg == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="copy-msg-to-new" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="moveMessageToNewTicket(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')">' +
        t('Copy message into new Ticket') + '</span></div>';
    disabledClass = (lzm_chatServerEvaluation.otrs == '' || lzm_chatServerEvaluation.otrs == null) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="translate-ticket-msg" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="showTicketMsgTranslator(\'' + myObject.ti.id + '\', \'' + myObject.msg + '\')">' +
        t('Translate') + '</span></div><hr />';
    disabledClass = ($('#message-details-inner').data('edit')) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="edit-msg" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\'' +
        ' onclick="removeTicketMessageContextMenu(); toggleMessageEditMode();">' +
        t('Edit Message') + '</span></div>';
    return contextMenuHtml;
};
