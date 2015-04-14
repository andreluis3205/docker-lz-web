/****************************************************************************************
 * LiveZilla ChatResourcesClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/
function ChatResourcesClass() {
    this.selectedResourceTab = 0;
    this.openedResourcesFolder = ['1'];
    this.qrdSearchCategories = ['ti', 't'];
    this.qrdChatPartner = '';
    this.qrdTreeDialog = {};
    this.resources = [];
    this.qrdSearchResults = [];
}

ChatResourcesClass.prototype.createQrdTree = function(caller, chatPartner) {
    var that = this, resources = lzm_chatServerEvaluation.cannedResources.getResourceList();
    that.qrdChatPartner = chatPartner;
    var i;
    var chatPartnerName = lzm_displayHelper.getChatPartner(chatPartner)['name'];
    $('#qrd-tree-body').data('chat-partner', chatPartner);
    $('#qrd-tree-body').data('in-dialog', false);

    var preparedResources = that.prepareResources(resources);
    resources = preparedResources[0];
    that.resources = resources;
    var allResources = preparedResources[1];
    var topLayerResource = preparedResources[2];
    var thisQrdTree = $('#qrd-tree');

    var treeString = that.createQrdTreeTopLevel(topLayerResource, chatPartner, false);
    var searchString = that.createQrdSearch(chatPartner, false);
    var recentlyString = that.createQrdRecently(chatPartner, false);

    var qrdTreeHtml = '<div id="qrd-tree-headline"><h3>' + t('Resources') + '</h3></div>' +
        '<div id="qrd-tree-headline2"></div>' +
        '<div id="qrd-tree-body" style="text-align: left;" onclick="removeQrdContextMenu();">' +
        '<div id="qrd-tree-placeholder" style="margin-top: 5px;"></div>' +
        '</div>' +
        '<div id="qrd-tree-footline">';
    if (caller == 'view-select-panel') {
        if (typeof chatPartner != 'undefined' && chatPartner != '' && lzm_chatServerEvaluation.userChats.getUserChat(chatPartner) != null &&
            $.inArray(lzm_chatServerEvaluation.userChats.getUserChat(chatPartner).status, ['left', 'declined']) == -1) {
            qrdTreeHtml += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '2px', position: 'absolute', left: '2px', top: '3px', 'padding-top': '10px', height: '6px',
                    'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        }
        qrdTreeHtml += lzm_displayHelper.createButton('add-qrd', 'ui-disabled qrd-change-buttons', 'addQrd();', '', 'img/203-add.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
        qrdTreeHtml += lzm_displayHelper.createButton('edit-qrd', 'ui-disabled qrd-change-buttons', 'editQrd();', '', 'img/100-pen.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
        qrdTreeHtml += lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\');', '', 'img/078-preview.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
        qrdTreeHtml += lzm_displayHelper.createButton('delete-qrd', 'ui-disabled qrd-change-buttons', 'deleteQrd();', '', 'img/201-delete2.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
    } else {
        if (typeof chatPartner != 'undefined' && chatPartner != '' && lzm_chatServerEvaluation.userChats.getUserChat(chatPartner) != null &&
            $.inArray(lzm_chatServerEvaluation.userChats.getUserChat(chatPartner).status, ['left', 'declined']) == -1) {
            qrdTreeHtml += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '2px', 'margin-top': '-5px', 'float': 'left', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        }
        qrdTreeHtml += lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\');', '', 'img/078-preview.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
        qrdTreeHtml += lzm_displayHelper.createButton('cancel-qrd', '', 'cancelQrd();', t('Cancel'), '', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
    }
    qrdTreeHtml += '</div>';
    thisQrdTree.html(qrdTreeHtml).trigger('create');
    lzm_displayHelper.createTabControl('qrd-tree-placeholder', [{name: t('All Resources'), content: treeString},
        {name: t('Quick Search'), content: searchString}, {name: t('Recently used'), content: recentlyString}],
        that.selectedResourceTab);

    that.fillQrdTree(resources, chatPartner, false);

    for (i=0; i<allResources.length; i++) {
        if ($('#folder-' + allResources[i].rid).html() == "") {
            $('#resource-' + allResources[i].rid + '-open-mark').css({background: 'none', border: 'none', width: '9px', height: '9px'})
        }
    }
    lzm_displayLayout.resizeQrdTree();
    lzm_displayLayout.resizeResources();

    for (i=0; i<that.openedResourcesFolder.length; i++) {
        handleResourceClickEvents(that.openedResourcesFolder[i], true);
    }

    $('#search-qrd').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd', allResources, e, false);
    });
    $('#search-text-input').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, false);
    });
    $('.qrd-search-by').change(function() {
        that.fillQrdSearchList(that.qrdChatPartner, false);
    });
    $('#clear-resource-search').click(function() {
        $('#search-text-input').val('');
        $('#search-text-input').keyup();
    });
    $('.qrd-tree-placeholder-tab').click(function() {
        var oldSelectedTabNo = that.selectedResourceTab;
        lzm_displayLayout.resizeResources();
        that.selectedResourceTab = $(this).data('tab-no');
        if (oldSelectedTabNo != that.selectedResourceTab) {
            var newSelectedResource = lzm_chatDisplay.tabSelectedResources[that.selectedResourceTab];
            lzm_chatDisplay.tabSelectedResources[oldSelectedTabNo] = lzm_chatDisplay.selectedResource;
            handleResourceClickEvents(newSelectedResource, true);
        }
        if (that.selectedResourceTab != 0) {
            $('#add-qrd').addClass('ui-disabled');
        }
    });
};

ChatResourcesClass.prototype.createQrdTreeDialog = function(resources, chatPartner, menuEntry) {
    var that = this;
    that.qrdChatPartner = chatPartner;
    var i;
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    $('#qrd-tree-body').data('chat-partner', chatPartner);
    $('#qrd-tree-body').data('in-dialog', true);
    var closeToTicket = '';
    var storedDialogImage = '';
    if (chatPartner.indexOf('TICKET LOAD') == -1 && chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
        var thisChatPartner = lzm_displayHelper.getChatPartner(chatPartner);
        var chatPartnerName = thisChatPartner['name'];
        var chatPartnerUserid = thisChatPartner['userid'];
    } else {
        closeToTicket = chatPartner.split('~')[1];
        storedDialogImage = 'img/023-email2.png';
    }

    var preparedResources = that.prepareResources(resources);
    resources = preparedResources[0];
    that.resources = resources;
    var allResources = preparedResources[1];
    var topLayerResource = preparedResources[2];

    var headerString = t('Resources');
    var footerString = '';

    if (typeof chatPartner == 'undefined' || chatPartner.indexOf('TICKET SAVE') == -1) {
        footerString +=  lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\', \'\', true, \'' + menuEntry + '\');',
            '', 'img/078-preview.png', 'lr',
            {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
    }
    if (typeof chatPartner != 'undefined' && chatPartner != '') {
        if (chatPartner.indexOf('TICKET LOAD') == -1 && chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        } else if (chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString +=  lzm_displayHelper.createButton('insert-qrd-preview', 'ui-disabled qrd-change-buttons', 'insertQrdIntoTicket(\'' + closeToTicket + '\');',
                t('Insert Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        } else if (chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString +=  lzm_displayHelper.createButton('add-or-edit-qrd', 'ui-disabled qrd-change-buttons', 'addOrEditResourceFromTicket(\'' + closeToTicket + '\');',
                t('Save Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        } else {
            footerString +=  lzm_displayHelper.createButton('add-qrd-attachment', 'ui-disabled qrd-change-buttons', 'addQrdAttachment(\'' + closeToTicket + '\');',
                t('Attach Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        }
    }
    footerString +=  lzm_displayHelper.createButton('cancel-qrd', '', 'cancelQrd(\'' + closeToTicket + '\');',
        t('Cancel'), '', 'lr',
        {'margin-left': '5px', 'padding-left': '15px', 'padding-right': '15px', 'cursor': 'pointer'});
    var bodyString = '<div id="qrd-tree-placeholder" style="margin-top: 5px;"></div>';

    var treeString = that.createQrdTreeTopLevel(topLayerResource, chatPartner, true);
    var searchString = that.createQrdSearch(chatPartner, true);
    var recentlyString = that.createQrdRecently(chatPartner, true);

    var dialogData = {'exceptional-img': storedDialogImage};
    if (chatPartner.indexOf('TICKET LOAD') == -1 && chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
        dialogData = {'chat-partner': chatPartner, 'chat-partner-name': chatPartnerName, 'chat-partner-userid': chatPartnerUserid};
    }

    if (chatPartner.indexOf('ATTACHMENT') != -1 || chatPartner.indexOf('TICKET LOAD') != -1 ||
        chatPartner.indexOf('TICKET SAVE') != -1) {
        dialogData.menu = menuEntry
    }

    var dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-tree-dialog', {}, {}, {}, {}, '', dialogData, true, true);
    lzm_displayHelper.createTabControl('qrd-tree-placeholder', [{name: t('All Resources'), content: treeString},
        {name: t('Quick Search'), content: searchString}, {name: t('Recently used'), content: recentlyString}],
        that.selectedResourceTab);

    $('.qrd-tree-placeholder-content').css({height: ($('#qrd-tree-dialog-body').height() - 40) + 'px'});
    var resultListHeight = $('#qrd-tree-dialog-body').height() - $('#search-input').height() - 89;
    $('#search-results').css({'min-height': resultListHeight + 'px'});
    $('#recently-results').css({'min-height': ($('#qrd-tree-dialog-body').height() - 62) + 'px'});
    $('#all-resources').css({'min-height': ($('#qrd-tree-dialog-body').height() - 62) + 'px'});

    that.fillQrdTree(resources, chatPartner, true);

    for (i=0; i<allResources.length; i++) {
        if ($('#folder-' + allResources[i].rid).html() == "") {
            $('#resource-' + allResources[i].rid + '-open-mark').css({background: 'none', border: 'none', width: '9px', height: '9px'})
        }
    }

    for (i=0; i<that.openedResourcesFolder.length; i++) {
        handleResourceClickEvents(that.openedResourcesFolder[i], true);
    }

    $('#search-text-input').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, true);
    });
    $('.qrd-search-by').change(function() {
        that.fillQrdSearchList(that.qrdChatPartner, true);
    });
    $('#clear-resource-search').click(function() {
        $('#search-text-input').val('');
        $('#search-text-input').keyup();
    });
    $('.qrd-tree-placeholder-tab').click(function() {
        var oldSelectedTabNo = that.selectedResourceTab;
        lzm_displayLayout.resizeResources();
        that.selectedResourceTab = $(this).data('tab-no');
        if (oldSelectedTabNo != that.selectedResourceTab) {
            var newSelectedResource = lzm_chatDisplay.tabSelectedResources[that.selectedResourceTab];
            lzm_chatDisplay.tabSelectedResources[oldSelectedTabNo] = lzm_chatDisplay.selectedResource;
            handleResourceClickEvents(newSelectedResource, true);
        }
    });

    return dialogId;
};

ChatResourcesClass.prototype.fillQrdTree = function(resources, chatPartner, inDialog) {
    var tmpResources, alreadyUsedIds, counter = 0, rank = 1, i, that = this;
    while (resources.length > 0 && counter < 1000) {
        tmpResources = [];
        alreadyUsedIds = [];
        for (i=0; i<resources.length; i++) {
            if (rank == resources[i].ra) {
                var resourceHtml = that.createResource(resources[i], chatPartner, inDialog);
                $('#folder-' + resources[i].pid).append(resourceHtml);
                alreadyUsedIds.push(resources[i].rid);
            }
        }
        for (i=0; i<resources.length; i++) {
            if ($.inArray(resources[i].rid, alreadyUsedIds) == -1) {
                tmpResources.push(resources[i]);
            }
        }
        rank++;
        if (resources.length == tmpResources.length) {
            counter = 1000;
        }
        resources = tmpResources;
        counter++;
    }
};

ChatResourcesClass.prototype.fillQrdSearchList = function(chatPartner, inDialog) {
    var that = this, searchCategories =  ['ti', 't', 'text'];
    that.qrdSearchCategories = [];

    for (var i=0; i<searchCategories.length; i++) {
        if ($('#search-by-' + searchCategories[i]).attr('checked') == 'checked') {
            that.qrdSearchCategories.push(searchCategories[i]);
        }
    }
    var searchString = $('#search-text-input').val().replace(/^ */, '').replace(/ *$/, '');
    $('#search-result-table').children('tbody').html(that.createQrdSearchResults(searchString, chatPartner, inDialog));
};

ChatResourcesClass.prototype.highlightSearchResults = function(resources, isNewSearch) {
    var that = this;
    if (isNewSearch) {
        var searchString = $('#search-qrd').val().replace(/^ */, '').replace(/ *$/, '').toLowerCase();
        if (searchString != '') {
            var i, j;
            that.qrdSearchResults = [];
            for (i=0; i<resources.length; i++) {
                if (resources[i].text.toLowerCase().indexOf(searchString) != -1 ||
                    resources[i].ti.toLowerCase().indexOf(searchString) != -1) {
                    that.qrdSearchResults.push(resources[i]);
                }
            }
        } else {
            that.qrdSearchResults = [];
        }
    }

    if (isNewSearch) {
        var openedResourceFolders = that.openedResourcesFolder;
        $('.resource-div').css({'background-color': '#FFFFFF', color: '#000000'});
        for (i=0; i<openedResourceFolders.length; i++) {
            openOrCloseFolder(openedResourceFolders[i], false);
        }
    }
    for (i=0; i<that.qrdSearchResults.length; i++) {
        $('#resource-' + that.qrdSearchResults[i].rid).css({'background-color': '#FFFFC6', color: '#000000', 'border-radius': '4px'});
        var parentId = that.qrdSearchResults[i].pid, counter = 0;
        if (isNewSearch) {
            while (parentId != 0 && counter < 1000) {
                for (j=0; j<resources.length; j++) {
                    if(resources[j].ty == 0 && resources[j].rid == parentId) {
                        openOrCloseFolder(resources[j].rid, true);
                        parentId = resources[j].pid;
                    }
                }
                counter++;
            }
        }
    }
};

ChatResourcesClass.prototype.previewQrd = function(resource, chatPartner, chatPartnerName, chatPartnerUserid, inDialog, menuEntry) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    menuEntry = (typeof menuEntry != 'undefined' && menuEntry != '') ? menuEntry :
        t('Preview Resource <!--resource_title-->',[['<!--resource_title-->', resource.ti]]);
    var that = this, resourceTitle, resourceText;
    switch(parseInt(resource.ty)) {
        case 1:
            resourceTitle = t('Text: <!--resource_title-->',[['<!--resource_title-->',resource.ti]]);
            resourceText = resource.text;
            break;
        case 2:
            resourceTitle = t('Url: <!--resource_title-->',[['<!--resource_title-->',resource.ti]]);
            var resourceLink = '<a href="' + resource.text + '" class="lz_chat_link"' +
                ' style="line-height: 16px;" data-role="none">' + resource.text + '</a>';
            resourceText = '<p>' + t('Title: <!--resource_title-->',[['<!--resource_title-->',resource.ti]]) + '</p>' +
                '<p>' + t('Url: <!--resource_text-->',[['<!--resource_text-->',resourceLink]]) + '</p>';
            break;
        default:
            var fileSize, downloadUrl;
            if (resource.si <= 1024) {
                fileSize = resource.si + ' B';
            } else if (resource.si >= 1024 && resource.si < 1048576) {
                fileSize = (Math.round((resource.si / 1024) * 100) / 100) + ' kB';
            } else {
                fileSize = (Math.round((resource.si / 1048576) * 100) / 100) + ' kB';
            }
            downloadUrl = getQrdDownloadUrl(resource);
            resourceTitle = t('File: <!--resource_title-->',[['<!--resource_title-->',resource.ti]]);
            resourceText = '<p>' + t('File name: <!--resource_title-->',
                [['<!--resource_title-->', '<a style="line-height: 16px;" class="lz_chat_file" href="' + downloadUrl + '">' + resource.ti + '</a>']]) + '</p>' +
                '<p>' + t('File size: <!--resource_size-->',[['<!--resource_size-->',fileSize]]) + '</p>';
            break;
    }
    resourceText = lzm_commonTools.replaceLinksInChatView(resourceText);

    var headerString = t('Preview Resource');
    var footerString = '';
    if (typeof chatPartner != 'undefined' && chatPartner != '' && lzm_chatServerEvaluation.userChats.getUserChat(chatPartner) != null &&
        $.inArray(lzm_chatServerEvaluation.userChats.getUserChat(chatPartner).status, ['left', 'declined']) == -1) {
        if (chatPartner.indexOf('TICKET LOAD') == -1 && chatPartner.indexOf('TICKET SAVE') == -1) {
            footerString += lzm_displayHelper.createButton('send-preview-qrd', '', 'sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'float': 'left', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        } else if (chatPartner.indexOf('TICKET SAVE') == -1) {
            footerString += lzm_displayHelper.createButton('insert-qrd-preview', '', 'insertQrdIntoTicket(' + chatPartner.split('~')[1] + ');', t('Insert Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
        }
    }
    footerString += lzm_displayHelper.createButton('cancel-preview-qrd', '', '', t('Close'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = '<div id="preview-resource-placeholder" style="margin-top: 5px;"></div>';
    var qrdPreviewContentString = '<fieldset id="preview-resource" class="lzm-fieldset" data-role="none">' +
        '<legend>' + resourceTitle + '</legend><div id="preview-resource-inner">' +
        resourceText +
        '</div></fieldset>';

    var dialogData = {'resource-id': resource.rid, 'chat-partner': chatPartner, 'chat-partner-name': chatPartnerName, 'chat-partner-userid': chatPartnerUserid,
        menu: menuEntry};
    if (chatPartner.indexOf('TICKET LOAD') != -1 || chatPartner.indexOf('TICKET SAVE') != -1) {
        dialogData['exceptional-img'] = 'img/023-email2.png';
    }
    if (inDialog) {
        that.qrdTreeDialog[chatPartner] = $('#qrd-tree-dialog-container').detach();
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-tree-dialog', {}, {}, {}, {}, '', dialogData, true, true);

        $('#cancel-preview-qrd').click(function() {
            lzm_displayHelper.removeDialogWindow('qrd-tree-dialog');
            var dialogContainerHtml = '<div id="qrd-tree-dialog-container" class="dialog-window-container"></div>';
            $('#chat_page').append(dialogContainerHtml).trigger('create');
            $('#qrd-tree-dialog-container').css(lzm_chatDisplay.dialogWindowContainerCss);
            $('#qrd-tree-dialog-container').replaceWith(that.qrdTreeDialog[chatPartner]);
            $('#preview-qrd').removeClass('ui-disabled');
            delete that.qrdTreeDialog[chatPartner];
        });
    } else {
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-preview', {}, {}, {}, {}, '', dialogData, false, true);

        $('#cancel-preview-qrd').click(function() {
            $('#preview-qrd').removeClass('ui-disabled');
            lzm_displayHelper.removeDialogWindow('qrd-preview');
        });
    }
    lzm_displayHelper.createTabControl('preview-resource-placeholder', [{name: t('Preview Resource'), content: qrdPreviewContentString}]);
    var myHeight = Math.max($('#qrd-preview-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
    var textWidth = lzm_chatDisplay.FullscreenDialogWindowWidth - 32;
    if (lzm_displayHelper.checkIfScrollbarVisible('qrd-preview-body') ||
        lzm_displayHelper.checkIfScrollbarVisible('qrd-tree-dialog-body') ||
        lzm_displayHelper.checkIfScrollbarVisible('ticket-details-body')) {
        textWidth -= lzm_displayHelper.getScrollBarWidth();
    }
    $('#preview-resource').css({'min-height': (myHeight - 61) + 'px'});
};

ChatResourcesClass.prototype.editQrd = function(resource, ticketId, inDialog) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    ticketId = (typeof ticketId != 'undefined') ? ticketId : '';
    var that = this;
    var headerString = t('Edit Resource');
    var footerString = lzm_displayHelper.createButton('save-edited-qrd', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('cancel-edited-qrd', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = '<div id="edit-resource-placeholder" style="margin-top: 5px;"></div>';
    var qrdEditFormString = '<fieldset id="edit-resource" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Edit Resource') + '</legend><div id="edit-resource-inner">' +
        '<div id="qrd-edit-title-div" class="qrd-edit-resource qrd-edit-html-resource qrd-edit-folder-resource qrd-edit-link-resource"' +
        ' style="margin-top: 0px;">' +
        '<label for="qrd-edit-title" style="font-size: 12px;">' + t('Title') + '</label><br />' +
        '<input type="text" id="qrd-edit-title" class="lzm-text-input resource-ui-control long-ui" data-role="none" value="' + resource.ti + '" />' +
        '</div>' +
        // Tags input
        '<div class="qrd-edit-resource qrd-edit-html-resource qrd-edit-link-resource" id="qrd-edit-tags-div">' +
        '<label for="qrd-edit-tags" style="font-size: 12px;">' + t('Tags') + '</label><br />' +
        '<input type="text" id="qrd-edit-tags" class="lzm-text-input resource-ui-control long-ui" data-role="none" value="' + resource.t + '" />' +
        '</div>' +
        // HTML Resource textarea
        '<div class="qrd-edit-resource qrd-edit-html-resource" id="qrd-edit-text-div">' +
        '<label for="qrd-edit-text" style="font-size: 12px;">' + t('Text') + '</label><br />' +
        '<div id="qrd-edit-text-inner">';
    qrdEditFormString += '<div id="qrd-edit-text-controls">' +
        lzm_displayHelper.createInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'qrdTextEditor') +
        '</div>';
    qrdEditFormString += '<div id="qrd-edit-text-body">' +
        '<textarea id="qrd-edit-text" data-role="none"></textarea>' +
        '</div></div></div>';
        // URL input
    var urlParts = (resource.text.indexOf('mailto:') == -1) ? resource.text.split('://') : ['mailto', resource.text.replace(/mailto:/, '')];
    var protocols = ['file', 'ftp', 'gopher', 'http', 'https', 'mailto', 'news'];
    qrdEditFormString += '<div class="qrd-edit-resource qrd-edit-link-resource" id="qrd-edit-url-div">' +
        '<label for="qrd-edit-url" style="font-size: 12px;">' + t('Url') + '</label><br />' +
        '<select id="qrd-edit-url-protocol" data-role="none">';
    for (var i=0; i<protocols.length; i++) {
        var selectedProtocol = (protocols[i] == urlParts[0]) ? ' selected="selected"' : '';
        var myProtocol = (protocols[i] != 'mailto') ? protocols[i] + '://' : protocols[i] + ':';
        qrdEditFormString +='<option' + selectedProtocol + '>' + myProtocol + '</option>';
    }
    qrdEditFormString += '</select>' +
        '<input type="text" id="qrd-edit-url" class="lzm-text-input resource-ui-control" data-role="none" value="' + urlParts[1] + '" style="margin-left: 5px;" />' +
        '</div>' +
        '</div></fieldset>';
    var defaultCss = {};

    var dialogData = {editors: [{id: 'qrd-edit-text', instanceName: 'qrdTextEditor'}], 'resource-id': resource.rid,
        menu: t('Edit Resource <!--resource_title-->',[['<!--resource_title-->', resource.ti]])};
    if (ticketId != '') {
        dialogData['exceptional-img'] = 'img/023-email2.png';
    }

    if (inDialog) {
        that.qrdTreeDialog[ticketId] = $('#qrd-tree-dialog-container').detach();
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-tree-dialog', defaultCss, {}, {}, {}, '', dialogData, true, true);
    } else {
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-edit', defaultCss, {}, {}, {}, '', dialogData, true, true);
    }
    lzm_displayHelper.createTabControl('edit-resource-placeholder', [{name: t('Edit Resource'), content: qrdEditFormString}]);
    var qrdTextHeight = Math.max((lzm_chatDisplay.FullscreenDialogWindowHeight - 256), 100);
    var textWidth = $('#qrd-edit').width() - 50 - lzm_displayHelper.getScrollBarWidth();
    var thisQrdTextInnerCss = {
        width: (textWidth - 2)+'px', height:  (qrdTextHeight - 20)+'px', border: '1px solid #ccc',
        'background-color': '#f5f5f5', 'border-radius': '4px'
    };
    var thisQrdTextInputCss = {
        width: (textWidth - 2)+'px', height: (qrdTextHeight - 20)+'px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'
    };
    var thisQrdTextInputControlsCss;
    thisQrdTextInputControlsCss = {
        width: (textWidth - 2)+'px', height: '15px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '7px 0px', 'text-align': 'left'
    };
    var thisTextInputBodyCss = {
        width: (textWidth - 2)+'px', height: (qrdTextHeight - 51)+'px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px',
        'background-color': '#ffffff', 'overflow-y': 'hidden', 'border-top': '1px solid #ccc'
    };
    var myHeight = Math.max($('#qrd-edit-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
    $('#edit-resource').css({'min-height': (myHeight - 61) +'px'});
    $('#qrd-edit-text-inner').css(thisQrdTextInnerCss);
    $('#qrd-edit-text-controls').css(thisQrdTextInputControlsCss);
    $('#qrd-edit-text').css(thisQrdTextInputCss);
    $('#qrd-edit-text-body').css(thisTextInputBodyCss);
    var uiWidth = Math.min(textWidth - 10, 300);
    var selectWidth = uiWidth + 10;
    $('.short-ui').css({width: uiWidth + 'px'});
    $('select.short-ui').css({width: selectWidth + 'px'});
    $('.long-ui').css({width: (textWidth - 10) + 'px'});
    var protSelWidth = $('#qrd-edit-url-protocol').width();
    $('#qrd-edit-url').css({width: (textWidth - 17 - protSelWidth) + 'px'});
    $('select.long-ui').css({width: textWidth + 'px'});
};

ChatResourcesClass.prototype.addQrd = function(resource, ticketId, inDialog, toAttachment, sendToChat, menuEntry) {
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    toAttachment = (typeof toAttachment != 'undefined') ? toAttachment : false;
    sendToChat = (typeof sendToChat != 'undefined') ? sendToChat : null;
    menuEntry = (typeof menuEntry != 'undefined') ? menuEntry : '';
    ticketId = (typeof ticketId != 'undefined') ? ticketId : '';
    var that = this;
    var titleString = (sendToChat == null) ? t('Add new Resource') : (sendToChat.type == 'link') ? t('Send Url') : t('Send File');
    var headerString = (sendToChat == null) ? t('Add new Resource') :
        (sendToChat.type == 'link') ? t('Send Url to <!--cp_name>', [['<!--cp_name>', sendToChat.cp_name]]) :
        t('Send File to <!--cp_name>', [['<!--cp_name>', sendToChat.cp_name]]);
    var footerString =  lzm_displayHelper.createButton('save-new-qrd', '', '', t('Ok'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'}) +
        lzm_displayHelper.createButton('cancel-new-qrd', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer'});
    var bodyString = '<div id="add-resource-placeholder" style="margin-top: 5px;"></div>';
    var qrdAddFormString = '<fieldset id="add-resource" class="lzm-fieldset" data-role="none">' +
        '<legend>' + titleString + '</legend><div id="add-resource-inner">';
    var isSelected = '', isVisible = '';
    if (ticketId == '' && !toAttachment && sendToChat == null) {
        // Type select
        var textSelectString = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? t('Text') : t('Text (not available on mobile devices)');
        var fileSelectString = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? t('File') : t('File (not available on mobile devices)');
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<label for="qrd-add-type" style="font-size: 12px;">' + t('Type') + '</label><br />' +
            '<select id="qrd-add-type" class="lzm-select resource-ui-control long-ui" data-role="none">' +
            '<option value="-1">' + t('-- Choose a type ---') + '</option>' +
            '<option value="0">' + t('Folder') + '</option>';
        qrdAddFormString += '<option value="1">' + textSelectString + '</option>';
        qrdAddFormString += '<option value="2">' + t('Link') + '</option>';
        qrdAddFormString += '<option value="3">' + fileSelectString + '</option>';
        qrdAddFormString += '</select>' +
            '</div>';
    } else if (!toAttachment && sendToChat == null){
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="1" id="qrd-add-type" />' +
            '<label for="qrd-add-type-dummy" style="font-size: 12px;">' + t('Type') + '</label><br />' +
            '<input class="lzm-text-input resource-ui-control long-ui lzm-disabled" data-role="none" type="text" id="qrd-add-type-dummy" value="' + t('Text') + '" />' +
            '</div>';
    } else if (sendToChat != null && sendToChat.type == 'link') {
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="2" id="qrd-add-type" />' +
            '</div>';
    } else {
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="3" id="qrd-add-type" />' +
            '<label for="qrd-add-type-dummy" style="font-size: 12px;">' + t('Type') + '</label><br />' +
            '<input class="lzm-text-input resource-ui-control long-ui lzm-disabled" data-role="none" type="text" id="qrd-add-type-dummy" value="' + t('File Resource') + '" />' +
            '</div>';
    }
    // Title input
    isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-title-div" class="qrd-add-resource qrd-add-html-resource qrd-add-folder-resource qrd-add-link-resource">' +
        '<label for="qrd-add-title" style="font-size: 12px;">' + t('Title') + '</label><br />' +
        '<input type="text" id="qrd-add-title" class="lzm-text-input resource-ui-control long-ui" data-role="none" />' +
        '</div>';
        // Tags input
    qrdAddFormString += '<div id="qrd-add-tags-div" class="qrd-add-resource qrd-add-html-resource qrd-add-link-resource">' +
        '<label for="qrd-add-tags" style="font-size: 12px;">' + t('Tags') + '</label><br />' +
        '<input type="text" id="qrd-add-tags" class="lzm-text-input resource-ui-control long-ui" data-role="none" />' +
        '</div>' +
        // HTML Resource textarea
        '<div id="qrd-add-text-div" class="qrd-add-resource qrd-add-html-resource">' +
        '<label for="qrd-add-text" style="font-size: 12px;">' + t('Text') + '</label><br />' +
        '<div id="qrd-add-text-inner">';
    qrdAddFormString += '<div id="qrd-add-text-controls">' +
        lzm_displayHelper.createInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'qrdTextEditor') +
        '</div>';
    qrdAddFormString += '<div id="qrd-add-text-body">' +
        '<textarea id="qrd-add-text" data-role="none"></textarea>' +
        '</div></div></div>';
        // URL input
    isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-url-div" class="qrd-add-link-resource qrd-add-resource">' +
        '<label for="qrd-add-url" style="font-size: 12px;">' + t('Url') + '</label><br />' +
        '<select id="qrd-add-url-protocol" data-role="none">' +
        '<option>file://</option>' +
        '<option>ftp://</option>' +
        '<option>gopher://</option>' +
        '<option selected="selected">http://</option>' +
        '<option>https://</option>' +
        '<option>mailto:</option>' +
        '<option>news://</option>' +
        '</select>' +
        '<input type="url" id="qrd-add-url" class="lzm-text-input resource-ui-control" data-role="none" style="margin-left: 5px;" />' +
        '</div>';
        // File input
    isVisible = (sendToChat != null && sendToChat.type == 'file') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-file-div" class="qrd-add-file-resource qrd-add-resource">' +
        '<label for="qrd-add-file" style="font-size: 12px;">' + t('File') + '</label><br />' +
        '<input type="file" id="file-upload-input" class="lzm-file-upload resource-ui-control long-ui" data-role="none" onchange="changeFile();"/>' +
        '<div id="file-upload-progress" style="display: none; background-image: url(\'../images/chat_loading.gif\');' +
        ' background-position: left center; background-repeat: no-repeat; padding: 5px 230px; margin: 5px 0px 2px 0px;"><span id="file-upload-numeric">0%</span></div>' +
        '<div id="file-upload-name" style="margin: 5px 0px 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-size" style="margin: 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-type" style="margin: 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-error" style="color: #ff0000; font-weight: bold; padding: 10px 0px;"></div>' +
        '<div id="cancel-file-upload-div" style="display: none;">' + lzm_displayHelper.createButton('cancel-file-upload',
        '', 'cancelFileUpload()', t('Cancel file upload'), '', 'lr',
        {'margin-left': '4px', 'padding-left': '12px', 'padding-right': '12px', 'cursor': 'pointer', 'display': 'none'}) + '</div>' +
        '</div>' +
        '</div></fieldset>';

    var dialogData = {editors: [{id: 'qrd-add-text', instanceName: 'qrdTextEditor'}], 'resource-id': resource.rid};
    if (ticketId != '') {
        dialogData['exceptional-img'] = 'img/023-email2.png';
    }

    if (inDialog) {
        if (toAttachment) {
            dialogData.menu = menuEntry;
            lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'ticket-details', {}, {}, {}, {}, '', dialogData, true, true, toAttachment + '_attachment');
        } else {
            that.qrdTreeDialog[ticketId] = $('#qrd-tree-dialog-container').detach();
            lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-tree-dialog', {}, {}, {}, {}, '', dialogData, true, true);
        }
    } else {
        var showFullscreen = (sendToChat == null) ? true : false;
        var dialogId = (sendToChat == null) ? '' : sendToChat.dialog_id;
        if (sendToChat != null) {
            dialogData.menu = headerString;
        }
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-add', {}, {}, {}, {}, '', dialogData, true, showFullscreen, dialogId);
    }
    lzm_displayHelper.createTabControl('add-resource-placeholder', [{name: titleString, content: qrdAddFormString}]);
    var qrdTextHeight = Math.max((lzm_chatDisplay.FullscreenDialogWindowHeight - 312), 100);
    var textWidth = $('#qrd-add').width() - 50 - lzm_displayHelper.getScrollBarWidth();
    var thisQrdTextInnerCss = {
        width: (textWidth - 2)+'px', height:  (qrdTextHeight - 20)+'px', border: '1px solid #ccc',
        'background-color': '#f5f5f5', 'border-radius': '4px'
    };
    var thisQrdTextInputCss = {
        width: (textWidth - 2)+'px', height: (qrdTextHeight - 20)+'px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px', border: '1px solid #ccc'
    };
    var thisQrdTextInputControlsCss;
    thisQrdTextInputControlsCss = {
        width: (textWidth - 2)+'px', height: '15px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '7px 0px', 'text-align': 'left'
    };
    var thisTextInputBodyCss = {
        width: (textWidth - 2)+'px', height: (qrdTextHeight - 51)+'px',
        'box-shadow': 'none', 'border-radius': '0px', padding: '0px', margin: '0px',
        'background-color': '#ffffff', 'overflow-y': 'hidden', 'border-top': '1px solid #ccc'
    };
    var myHeight = Math.max($('#qrd-add-body').height(), $('#qrd-tree-dialog-body').height(), $('#ticket-details-body').height());
    $('#add-resource').css({'min-height': (myHeight - 61) +'px'});
    $('#qrd-add-text-inner').css(thisQrdTextInnerCss);
    $('#qrd-add-text-controls').css(thisQrdTextInputControlsCss);
    $('#qrd-add-text').css(thisQrdTextInputCss);
    $('#qrd-add-text-body').css(thisTextInputBodyCss);
    var uiWidth = Math.min(textWidth - 10, 300);
    var selectWidth = uiWidth + 10;
    $('.short-ui').css({width: uiWidth + 'px'});
    $('select.short-ui').css({width: selectWidth + 'px'});
    $('.long-ui').css({width: (textWidth - 10) + 'px'});
    var protSelWidth = $('#qrd-add-url-protocol').width();
    $('#qrd-add-url').css({width: (textWidth - 17 - protSelWidth) + 'px'});
    $('select.long-ui').css({width: textWidth + 'px'});

    if (ticketId != '') {
        delete lzm_chatDisplay.ticketResourceText[ticketId];
    }
};

ChatResourcesClass.prototype.updateResources = function() {
    var resources = lzm_chatServerEvaluation.cannedResources.getResourceList(), that = this;
    if ($('#resource-1').length > 0) {
        var chatPartner = $('#qrd-tree-body').data('chat-partner');
        chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
        var inDialog = $('#qrd-tree-body').data('in-dialog');
        inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
        var preparedResources = that.prepareResources(resources);
        var i;
        resources = preparedResources[0];
        var allResources = preparedResources[1];
        var counter = 0;
        while (resources.length > 0 && counter < 1000) {
            var tmpResources = [];
            for (i=0; i<resources.length; i++) {
                if ($('#resource-' + resources[i].rid).length == 0) {
                    if ($('#folder-' + resources[i].pid).length > 0) {
                        var resourceHtml = that.createResource(resources[i], chatPartner, inDialog);
                        $('#folder-' + resources[i].pid).append(resourceHtml);
                    } else {
                        tmpResources.push(resources[i]);
                    }
                }
            }
            if (resources.length == tmpResources.length) {
                counter = 1000;
            }
            resources = tmpResources;
            counter++;
        }
        for (i=0; i<allResources.length; i++) {
            if (typeof allResources[i].md5 != 'undefined') {
                for (var j=0; j<that.resources.length; j++) {
                    if (allResources[i].rid == that.resources[j].rid && allResources[i].md5 != that.resources[j].md5) {
                        $('#resource-' + allResources[i].rid).find('span.qrd-title-span').html(lzm_commonTools.htmlEntities(allResources[i].ti));
                        $('#qrd-search-line-' + allResources[i].rid).html(that.createQrdSearchLine(allResources[i], $('#search-result-table').data('search-string'), chatPartner, inDialog));
                        $('#qrd-recently-line-' + allResources[i].rid).html(that.createQrdRecentlyLine(allResources[i], chatPartner, inDialog));
                    }
                }
            }
        }
        that.resources = preparedResources[0];

        $('.resource-div').each(function() {
            var deleteThisResource = true;
            var thisResourceId = $(this).attr('id').split('resource-')[1];
            for (var i=0; i<allResources.length; i++) {
                if (allResources[i].rid == thisResourceId) {
                    deleteThisResource = false;
                }
            }
            if (deleteThisResource) {
                $('#resource-' + thisResourceId).remove();
                $('#qrd-search-line-' + thisResourceId).remove();
                $('#qrd-recently-line-' + thisResourceId).remove();
            }
        });
    }
};

ChatResourcesClass.prototype.prepareResources = function (resources) {
    var allResources = resources;

    var tmpResources = [], topLayerResource, i;
    for (i=0; i<resources.length; i++) {
        resources[i].ti = resources[i].ti
            .replace(/%%_Files_%%/, t('Files'))
            .replace(/%%_External_%%/, t('External'))
            .replace(/%%_Internal_%%/, t('Internal'));
        if (resources[i].ra == 0) {
            topLayerResource = resources[i];
        } else {
            tmpResources.push(resources[i]);
        }
    }
    resources = tmpResources;

    return [resources, allResources, topLayerResource];
};

ChatResourcesClass.prototype.getResourceIcon = function(type, text) {
    var resourceIcon;
    switch(type) {
        case '0':
            resourceIcon = 'img/001-folder.png';
            break;
        case '1':
            resourceIcon = 'img/058-doc_new.png';
            break;
        case '2':
            if (typeof text != 'undefined' && text.indexOf('mailto:') == 0) {
                resourceIcon = 'img/023-email2.png';
            } else {
                resourceIcon = 'img/054-doc_web16c.png';
            }
            break;
        default:
            resourceIcon = 'img/622-paper_clip.png';
            break;
    }
    return resourceIcon;
};

ChatResourcesClass.prototype.createQrdTreeTopLevel = function(topLayerResource, chatPartner, inDialog) {
    var onclickAction = ' onclick="handleResourceClickEvents(\'' + topLayerResource.rid + '\')"';
    var onContextMenu = '', that = this;
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile && !inDialog) {
        onContextMenu = ' oncontextmenu="openQrdContextMenu(event, \'' + chatPartner + '\', \'' + topLayerResource.rid + '\');return false;"';
    }
    var plusMinusImage = ($.inArray("1", that.openedResourcesFolder) != -1) ? 'img/minus.png' : 'img/plus.png';
    var resourceHtml = '<fieldset id="all-resources" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('All Resources') + '</legend>' +
        '<div id="all-resources-inner"><div id="resource-' + topLayerResource.rid + '" class="resource-div lzm-unselectable"' +
        ' style="margin: 4px 0px; padding-left: 5px; padding-top: 1px; padding-bottom: 1px; white-space: nowrap;">' +
        '<span id="resource-' + topLayerResource.rid + '-open-mark" style=\'display: inline-block; width: 7px; ' +
        'height: 7px; border: 1px solid #aaa; background-color: #f1f1f1; ' +
        lzm_displayHelper.addBrowserSpecificGradient('background-image: url("' + plusMinusImage + '")') + '; ' +
        'background-position: center; background-repeat: no-repeat; margin-right: 4px; cursor: pointer;\'' +
        onclickAction + onContextMenu + '></span>' +
        '<span style=\'background-image: url("' + that.getResourceIcon(topLayerResource.ty) + '"); ' +
        'background-position: left center; background-repeat: no-repeat; padding: 3px;\'>' +
        '<span style="padding-left: 20px; cursor: pointer;"' + onclickAction + onContextMenu + '>' +
        lzm_commonTools.htmlEntities(topLayerResource.ti) + '</span>' +
        '</span></div><div id="folder-' + topLayerResource.rid + '" style="display: none;"></div>' +
        '</div></fieldset>';

    return resourceHtml;
};

ChatResourcesClass.prototype.createQrdSearch = function(chatPartner, inDialog) {
    var that = this, attachmentDataString = (chatPartner.indexOf('ATTACHMENT') != -1) ? ' data-attachment="1"' : ' data-attachment="0"';
    var searchHtml = '<fieldset id="search-input" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Search for...') + '</legend>' +
        '<table id="search-input-inner">' +
        '<tr><td colspan="2"><input type="text" data-role="none" id="search-text-input" />' +
        '<span id="clear-resource-search" style="margin-left: 4px; margin-right: 6px;' +
        ' background-image: url(\'js/jquery_mobile/images/icons-18-white.png\'); background-repeat: no-repeat;' +
        ' background-position: -73px -1px; border-radius: 9px; background-color: rgba(0,0,0,0.4); cursor: pointer;' +
        ' display: none;">&nbsp;</span>' +
        '</td>';
    var checkedString = ($.inArray('ti', that.qrdSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td style="width: 20px !important;">' +
        '<input type="checkbox" data-role="none" id="search-by-ti" class="qrd-search-by"' + checkedString + ' /></td>' +
        '<td><label for="search-by-ti">' + t('Title') + '</label></td></tr>';
    checkedString = ($.inArray('t', that.qrdSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td><input type="checkbox" data-role="none" id="search-by-t" class="qrd-search-by"' + checkedString + ' /></td>' +
        '<td><label for="search-by-t">' + t('Tags') + '</label></td></tr>';
    checkedString = ($.inArray('text', that.qrdSearchCategories) != -1) ? ' checked="checked"' : '';
    searchHtml += '<tr><td><input type="checkbox" data-role="none" id="search-by-text" class="qrd-search-by"' + checkedString + ' /></td>' +
        '<td><label for="search-by-text">' + t('Content') + '</label></td></tr>' +
        '</table>' +
        '</fieldset>' +
        '<fieldset id="search-results" class="lzm-fieldset" data-role="none" style="margin-top: 5px;">' +
        '<legend>' + t('Results') + '</legend>' +
        '<table id="search-result-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"' + attachmentDataString + '><thead><tr>' +
        '<th style="padding: 0px 9px; width: 18px !important;"></th><th>' + t('Title') + '</th><th>' + t('Tags') + '</th><th>' + t('Content') + '</th>' +
        '</tr></thead><tbody></tbody></table>' +
        '</fieldset>';

    return searchHtml;
};

ChatResourcesClass.prototype.createQrdSearchResults = function(searchString, chatPartner, inDialog) {
    var searchHtml = '', that = this;
    var resources = lzm_chatServerEvaluation.cannedResources.getResourceList();
    var searchCategories = that.qrdSearchCategories;
    $('#search-result-table').data('search-string', searchString);
    var resultIds = [];
    if (searchString != '') {
        for (var i=0; i<resources.length; i++) {
            for (var j=0; j<searchCategories.length; j++) {
                var contentToSearch = resources[i][searchCategories[j]].toLowerCase();
                if (resources[i].ty != 0 && contentToSearch.indexOf(searchString.toLowerCase()) != -1 && $.inArray(resources[i].rid, resultIds) == -1) {
                    if (resources[i].ty == 3 || resources[i].ty == 4 || $('#search-result-table').data('attachment') != '1') {
                        searchHtml += that.createQrdSearchLine(resources[i], searchString, chatPartner, inDialog);
                        resultIds.push(resources[i].rid);
                    }
                }
            }
        }
    }

    return searchHtml;
};

ChatResourcesClass.prototype.createQrdSearchLine = function(resource, searchString, chatPartner, inDialog) {
    searchString = (typeof searchString != 'undefined') ? searchString : '';
    chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
    var regExp = new RegExp(RegExp.escape(searchString), 'i'), that = this;
    var onclickAction = ' onclick="handleResourceClickEvents(\'' + resource.rid + '\');"';
    var onDblClickAction = '';
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
        if (chatPartner.indexOf('TICKET LOAD') != -1) {
            onDblClickAction = ' ondblclick="insertQrdIntoTicket(\'' + chatPartner.split('~')[1] + '\');"';
        } else if (chatPartner.indexOf('ATTACHMENT') != -1) {
            onDblClickAction = ' ondblclick="addQrdAttachment(\'' + chatPartner.split('~')[1] + '\');"';
        } else if (inDialog && chatPartner != '') {
            onDblClickAction = ' ondblclick="sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');"';
        } else if (parseInt(resource.ty) < 3) {
            onDblClickAction = ' ondblclick="editQrd();"';
        } else {
            onDblClickAction = ' ondblclick="previewQrd(\'' + chatPartner + '\', \'' + resource.rid + '\', false);"';
        }
    }
    var content = ($.inArray(parseInt(resource.ty), [3,4]) == -1) ? resource.text.replace(/<.*?>/g, ' ')
        .replace(regExp, '<span style="color: #000000; background-color: #fff9a9;">' + searchString + '</span>') : '';
    var searchLineHtml = '<tr style="cursor: pointer;" class="qrd-search-line lzm-unselectable" id="qrd-search-line-' + resource.rid + '"' +
        onclickAction + onDblClickAction + '>' +
        '<td style="background-position: center; background-repeat: no-repeat; background-image: url(\'' + that.getResourceIcon(resource.ty, resource.text) + '\');"></td>' +
        '<td>' + lzm_commonTools.htmlEntities(resource.ti).replace(regExp, '<span style="color: #000000; background-color: #fff9a9;">' + searchString + '</span>') + '</td>' +
        '<td>' + resource.t.replace(regExp, '<span style="color: #000000; background-color: #fff9a9;">' + searchString + '</span>') + '</td>' +
        '<td>' + content + '</td>' +
        '</tr>';
    return searchLineHtml;
};

ChatResourcesClass.prototype.createQrdRecently = function(chatPartner, inDialog) {
    var attachmentDataString = (chatPartner.indexOf('ATTACHMENT') != -1) ? ' data-attachment="1"' : ' data-attachment="0"';
    var onlyFiles = (chatPartner.indexOf('ATTACHMENT') != -1) ? true : false, that = this;
    var qrdRecentlyHtml = '<fieldset id="recently-results" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Results') + '</legend>' +
        '<table id="recently-used-table" class="visitor-list-table alternating-rows-table lzm-unselectable" style="width: 100%;"' + attachmentDataString + '><thead><tr>' +
        '<th style="padding: 0px 9px; width: 18px !important;"></th><th>' + t('Title') + '</th><th>' + t('Tags') + '</th><th>' + t('Content') + '</th>' +
        '</tr></thead><tbody>' + that.createQrdRecentlyResults(onlyFiles, chatPartner, inDialog) + '</tbody></table>' +
        '</fieldset>';

    return qrdRecentlyHtml;
};

ChatResourcesClass.prototype.createQrdRecentlyResults = function(onlyFiles, chatPartner, inDialog) {
    var qrdRecentlyHtml = '', that = this;
    var mostUsedResources = lzm_chatServerEvaluation.cannedResources.getResourceList('usage_counter', {ty:'1,2,3,4'});
    var maxIterate = Math.min (20, mostUsedResources.length);
    for (var j=0; j<maxIterate; j++) {
        if (mostUsedResources[j].usage_counter > 0 && (mostUsedResources[j].ty == 3 || mostUsedResources[j].ty == 4 ||
            ($('#recently-used-table').data('attachment') != '1' && !onlyFiles))) {
            qrdRecentlyHtml += that.createQrdRecentlyLine(mostUsedResources[j], chatPartner, inDialog);
        }
    }

    return qrdRecentlyHtml
};

ChatResourcesClass.prototype.createQrdRecentlyLine = function(resource, chatPartner, inDialog) {
    var onclickAction = ' onclick="handleResourceClickEvents(\'' + resource.rid + '\');"';
    var onDblClickAction = '', that = this;
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
        if (chatPartner.indexOf('TICKET LOAD') != -1) {
            onDblClickAction = ' ondblclick="insertQrdIntoTicket(\'' + chatPartner.split('~')[1] + '\');"';
        } else if (chatPartner.indexOf('ATTACHMENT') != -1) {
            onDblClickAction = ' ondblclick="addQrdAttachment(\'' + chatPartner.split('~')[1] + '\');"';
        } else if (inDialog && chatPartner != '') {
            onDblClickAction = ' ondblclick="sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');"';
        } else if (parseInt(resource.ty) < 3) {
            onDblClickAction = ' ondblclick="editQrd();"';
        } else {
            onDblClickAction = ' ondblclick="previewQrd(\'' + chatPartner + '\', \'' + resource.rid + '\', false);"';
        }
    }
    var content = ($.inArray(parseInt(resource.ty), [3,4]) == -1) ? resource.text.replace(/<.*?>/g, ' ') : '';
    var qrdRecentlyLine = '<tr style="cursor: pointer;" class="qrd-recently-line lzm-unselectable" id="qrd-recently-line-' + resource.rid + '"' +
        onclickAction + onDblClickAction + '>' +
        '<td style="background-position: center; background-repeat: no-repeat; background-image: url(\'' + that.getResourceIcon(resource.ty, resource.text) + '\');"></td>' +
        '<td>' + lzm_commonTools.htmlEntities(resource.ti) + '</td>' +
        '<td>' + resource.t + '</td>' +
        '<td>' + content + '</td>' +
        '</tr>';
    return qrdRecentlyLine;
};

ChatResourcesClass.prototype.createResource = function(resource, chatPartner, inDialog) {
    chatPartner = (typeof chatPartner != 'undefined') ? chatPartner : '';
    inDialog = (typeof inDialog != 'undefined') ? inDialog : false;
    var onclickAction = ' onclick="handleResourceClickEvents(\'' + resource.rid + '\')"';
    var onDblClickAction = '', that = this;
    var onContextMenu = '';
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile && !inDialog) {
        onContextMenu = ' oncontextmenu="openQrdContextMenu(event, \'' + chatPartner + '\', \'' + resource.rid + '\');return false;"';
    }
    var resourceHtml = '<div id="resource-' + resource.rid + '" class="resource-div lzm-unselectable" ' +
        'style="padding-left: ' + (20 * resource.ra) + 'px; padding-top: 1px; padding-bottom: 1px; margin: 4px 0px; white-space: nowrap;">';
    if (resource.ty == 0) {
        resourceHtml += '<span id="resource-' + resource.rid + '-open-mark" style=\'display: inline-block; width: 7px; ' +
            'height: 7px; border: 1px solid #aaa; background-color: #f1f1f1; ' +
            lzm_displayHelper.addBrowserSpecificGradient('background-image: url("img/plus.png")') + '; ' +
            'background-position: center; background-repeat: no-repeat; margin-right: 4px; cursor: pointer;\'' +
            onclickAction + onContextMenu + '></span>';
    } else {
        resourceHtml += '<span style="display: inline-block; width: 9px; height: 9px; margin-right: 4px;"></span>';
        if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) {
            if (chatPartner.indexOf('TICKET LOAD') != -1) {
                onDblClickAction = ' ondblclick="insertQrdIntoTicket(\'' + chatPartner.split('~')[1] + '\');"';
            } else if (chatPartner.indexOf('ATTACHMENT') != -1) {
                onDblClickAction = ' ondblclick="addQrdAttachment(\'' + chatPartner.split('~')[1] + '\');"';
            } else if (inDialog && chatPartner != '') {
                onDblClickAction = ' ondblclick="sendQrdPreview(\'' + resource.rid + '\', \'' + chatPartner + '\');"';
            } else if (parseInt(resource.ty) < 3) {
                onDblClickAction = ' ondblclick="editQrd();"';
            } else {
                onDblClickAction = ' ondblclick="previewQrd(\'' + chatPartner + '\', \'' + resource.rid + '\', ' + inDialog + ');"';
            }
        }
    }
    resourceHtml += '<span style=\'background-image: url("' + that.getResourceIcon(resource.ty, resource.text) + '"); ' +
        'background-position: left center; background-repeat: no-repeat; padding: 3px;\'>' +
        '<span class="qrd-title-span" style="padding-left: 20px; cursor: pointer;"' + onclickAction + onDblClickAction + onContextMenu + '>' +
        lzm_commonTools.htmlEntities(resource.ti) + '</span>' +
        '</span></div>';
    if (resource.ty == 0) {
        resourceHtml += '<div id="folder-' + resource.rid + '" style="display: none;"></div>';
    }

    return resourceHtml;
};
