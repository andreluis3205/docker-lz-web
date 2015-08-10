/****************************************************************************************
 * LiveZilla ChatReportsClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatReportsClass() {

}

ChatReportsClass.prototype.createReportList = function() {
    var numberOfPages = Math.max(1, Math.ceil(lzm_chatServerEvaluation.reports.getMatching() / lzm_chatServerEvaluation.reports.getReportsPerPage()));
    var page = lzm_chatPollServer.reportPage;
    var headLine2Html = '<span  class="lzm-dialog-hl2-info">' +
        t('<!--total_reports--> total entries, <!--filtered_reports--> matching filter',
            [['<!--total_reports-->', lzm_chatServerEvaluation.reports.getTotal()], ['<!--filtered_reports-->', lzm_chatServerEvaluation.reports.getMatching()]]) +
        '</span>' +
        lzm_displayHelper.createButton('report-filter', '', 'openReportFilterMenu(event)', t('Filter'), '<i class="fa fa-filter"></i>', 'lr',
            {'margin-right': '4px', float: 'right'}, '', 10);
    var footLineHtml = '<span id="report-paging">';
    var leftDisabled = (page == 1) ? ' ui-disabled' : '', rightDisabled = (page == numberOfPages) ? ' ui-disabled' : '';
    if (!isNaN(numberOfPages)) {
        footLineHtml += lzm_displayHelper.createButton('report-page-all-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(1);', '',
            '<i class="fa fa-fast-backward"></i>', 'l', {'border-right-width': '1px'}) +
            lzm_displayHelper.createButton('report-page-one-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(' + (page - 1) + ');', '', '<i class="fa fa-backward"></i>', 'r',
                {'border-left-width': '1px'}) +
            '<span style="padding: 0px 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_displayHelper.createButton('report-page-one-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + (page + 1) + ');', '', '<i class="fa fa-forward"></i>', 'l',
                {'border-right-width': '1px'}) +
            lzm_displayHelper.createButton('report-page-all-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + numberOfPages + ');', '', '<i class="fa fa-fast-forward"></i>', 'r',
                {'border-left-width': '1px'});
    }
    footLineHtml += '</span>';

    $('#report-list-headline').html('<h3>' + t('Reports') + '</h3>');
    $('#report-list-headline2').html(headLine2Html);
    $('#report-list-body').html(this.createReportListHtml());
    $('#report-list-footline').html(footLineHtml);
};

ChatReportsClass.prototype.createReportListHtml = function() {
    var reports = lzm_chatServerEvaluation.reports.getReportList();
    var selectedReport = (typeof $('#report-list-table').data('selected-report') != 'undefined') ? $('#report-list-table').data('selected-report') : '';
    var bodyHtml = '<table id="report-list-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"' +
        ' data-selected-report="' + selectedReport + '"><thead>' +
        '<tr><th style="width: 20px !important;"></th><th>' + t('Period') + '</th><th style="width: 150px !important;">' + t('Status (Last Update)') + '</th>' +
        '<th style="width: 150px !important;">' + t('Visitors') + '</th><th style="width: 150px !important;">' + t('Chats') + '</th><th style="width: 150px !important;">' + t('Conversion Rate') + '</th></tr>' +
        '</thead><tbody>';
    for (var i=0; i<reports.length; i++) {
        bodyHtml += this.createReportListLine(reports[i]);
    }
    bodyHtml += '</tbody></table>';

    return bodyHtml;
};

ChatReportsClass.prototype.createReportListLine = function(report) {
    var reportImage = (report.r == 'day') ? '<i class="fa fa-pie-chart"></i>' : (report.r == 'month') ? '<i class="fa fa-pie-chart"></i>' : '<i class="fa fa-pie-chart"></i>';
    var updateTimeObject = lzm_chatTimeStamp.getLocalTimeObject(report.t * 1000, true);
    var currentTimeObject = lzm_chatTimeStamp.getLocalTimeObject(null, false);
    var updateTimeHuman = lzm_commonTools.getHumanDate(updateTimeObject, 'time', lzm_chatDisplay.userLanguage);
    var statusLastUpdate = t('Closed'), canBeReCalculated = false;
    if (report.a == 0) {
        statusLastUpdate = t('Open (<!--update_time-->)', [['<!--update_time-->', updateTimeHuman]]);
        canBeReCalculated = true;
    }
    var periodHumanDate = (report.r == 'day') ?
        lzm_commonTools.getHumanDate([report.y, report.m, report.d, 0, 0, 0], 'longdate', lzm_chatDisplay.userLanguage) :
        (report.r == 'month') ?
            lzm_commonTools.getHumanDate([report.y, report.m, report.d, 0, 0, 0], 'dateyear', lzm_chatDisplay.userLanguage) :
            report.y;
    var oncontextmenuAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?
        ' oncontextmenu="openReportContextMenu(event, \'' + report.i + '\', ' + canBeReCalculated + ');"' : '';
    var onclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? ' onclick="selectReport(\'' + report.i + '\');"' :
        ' onclick="openReportContextMenu(event, \'' + report.i + '\', ' + canBeReCalculated + ');"';
    var ondblclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?' ondblclick="loadReport(\'' + report.i + '\', \'report\');"' : '';
    var lineClasses = ($('#report-list-table').data('selected-report') == report.i) ? ' class="report-list-line selected-table-line"' : ' class="report-list-line"';
    var reportListLine = '<tr id="report-list-line-' + report.i + '" style="cursor: pointer;"' + oncontextmenuAction +
        onclickAction + ondblclickAction + lineClasses + '>' +
        '<td style="text-align: center; padding: 5px 10px;">' + reportImage + '</td>' +
        '<td>' + periodHumanDate + '</td>' +
        '<td>' + statusLastUpdate + '</td>' +
        '<td>' + report.s + '</td>' +
        '<td>' + report.ch + '</td>' +
        '<td>' + report.c + '%</td>' +
        '</tr>';

    return reportListLine;
};

ChatReportsClass.prototype.createReportListContextMenu = function(myObject) {
    var disabledClass = '', onclickAction = '', contextMenuHtml = '';
    disabledClass = '';
    onclickAction = 'loadReport(\'' + myObject.i + '\', \'report\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="load-this-report" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
        t('Report') + '</span></div>';
    disabledClass = (myObject.r != 'day') ? ' class="ui-disabled"' : '';
    onclickAction = 'loadReport(\'' + myObject.i + '\', \'visitors\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="load-this-visitors" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 20px; cursor:pointer;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
        t('Visitors') + '</span></div><hr />';
    disabledClass = (!myObject.canBeReCalculated) ? ' class="ui-disabled"' : '';
    onclickAction = 'recalculateReport(\'' + myObject.i + '\');';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-refresh" style="padding-left: 4px;"></i>' +
        '<span id="recalculate-this-report" class="cm-line cm-click" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 6px; cursor:pointer;\' onclick="' + onclickAction + 'removeReportContextMenu();">' +
        t('Recalculate') + '</span></div>';

    return contextMenuHtml;
};

ChatReportsClass.prototype.createReportFilterMenu = function(myObject) {
    var myVisibility = (lzm_chatPollServer.reportFilter == 'day') ? 'visible' : 'hidden', contextMenuHtml = '';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-day" class="cm-line cm-click" onclick="toggleReportFilter(\'day\', event)" style="padding-left: 0px;">' +
        t('<!--checked--> Day', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    myVisibility = (lzm_chatPollServer.reportFilter == 'month') ? 'visible' : 'hidden';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-month" class="cm-line cm-click" onclick="toggleReportFilter(\'month\', event)" style="padding-left: 0px;">' +
        t('<!--checked--> Month', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    myVisibility = (lzm_chatPollServer.reportFilter == 'year') ? 'visible' : 'hidden';
    contextMenuHtml += '<div style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<span id="toggle-filter-year" class="cm-line cm-click" onclick="toggleReportFilter(\'year\', event)" style="padding-left: 0px;">' +
        t('<!--checked--> Year', [['<!--checked-->', '<span style="visibility: ' + myVisibility + ';">&#10003;</span>']]) + '</span></div>';
    return contextMenuHtml;
};
