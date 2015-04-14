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
    var numberOfPages = Math.ceil(lzm_chatServerEvaluation.reports.getMatching() / lzm_chatServerEvaluation.reports.getReportsPerPage());
    var page = lzm_chatPollServer.reportPage;
    var headLine2Html = '<span style="float: left; margin-top: 2px; margin-left: 6px; font-size: 11px; font-weight: normal;">' +
        t('<!--total_reports--> total entries, <!--filtered_reports--> matching filter',
            [['<!--total_reports-->', lzm_chatServerEvaluation.reports.getTotal()], ['<!--filtered_reports-->', lzm_chatServerEvaluation.reports.getMatching()]]) +
        '</span>' +
        lzm_displayHelper.createButton('report-filter', '', 'openReportFilterMenu(event)', t('Filter'), 'img/103-options2.png', 'lr',
            {'margin-right': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}, '', 10);
    var footLineHtml = '<span id="report-paging">';
    var leftDisabled = (page == 1) ? ' ui-disabled' : '', rightDisabled = (page == numberOfPages) ? ' ui-disabled' : '';
    if (!isNaN(numberOfPages)) {
        footLineHtml += lzm_displayHelper.createButton('report-page-all-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(1);', '',
            'img/415-skip_backward.png', 'l', {'cursor': 'pointer', 'padding': '4px 15px'}) +
            lzm_displayHelper.createButton('report-page-one-backward', 'report-list-page-button' + leftDisabled, 'pageReportList(' + (page - 1) + ');', '', 'img/414-rewind.png', 'r',
                {'cursor': 'pointer', 'padding': '4px 15px'}) +
            '<span style="padding: 0px 15px;">' + t('Page <!--this_page--> of <!--total_pages-->',[['<!--this_page-->', page], ['<!--total_pages-->', numberOfPages]]) + '</span>' +
            lzm_displayHelper.createButton('report-page-one-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + (page + 1) + ');', '', 'img/420-fast_forward.png', 'l',
                {'cursor': 'pointer', 'padding': '4px 15px'}) +
            lzm_displayHelper.createButton('report-page-all-forward', 'report-list-page-button' + rightDisabled, 'pageReportList(' + numberOfPages + ');', '', 'img/419-skip_forward.png', 'r',
                {'cursor': 'pointer', 'padding': '4px 15px'});
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
    var reportImage = (report.r == 'day') ? 'img/175-graph_3d_2.png' : (report.r == 'month') ? 'img/175-graph_3d_2.png' : 'img/175-graph_3d_2.png';
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
    var onclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?' onclick="selectReport(\'' + report.i + '\');"' :
        ' onclick="openReportContextMenu(event, \'' + report.i + '\', ' + canBeReCalculated + ');"';
    var ondblclickAction = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ?' ondblclick="loadReport(\'' + report.i + '\', \'report\');"' : '';
    var lineClasses = ($('#report-list-table').data('selected-report') == report.i) ? ' class="report-list-line selected-table-line"' : ' class="report-list-line"';
    var reportListLine = '<tr id="report-list-line-' + report.i + '" style="cursor: pointer;"' + oncontextmenuAction +
        onclickAction + ondblclickAction + lineClasses + '>' +
        '<td style="padding-left: 10px; padding-right: 10px; background-image: url(' + reportImage + '); background-position: center; background-repeat: no-repeat;"' +
        ' class="icon-column"></td>' +
        '<td>' + periodHumanDate + '</td>' +
        '<td>' + statusLastUpdate + '</td>' +
        '<td>' + report.s + '</td>' +
        '<td>' + report.ch + '</td>' +
        '<td>' + report.c + '%</td>' +
        '</tr>';

    return reportListLine;
};