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

    var qrdTreeHtml = '<div id="qrd-tree-headline" class="lzm-dialog-headline"><h3>' + t('Knowledgebase') + '</h3></div>' +
        '<div id="qrd-tree-body" class="lzm-dialog-body" onclick="removeQrdContextMenu();">' +
        '<div id="qrd-tree-placeholder" style="margin-top: 5px;"></div>' +
        '</div>' +
        '<div id="qrd-tree-footline" class="lzm-dialog-footline">';
    if (caller == 'view-select-panel') {
        if (typeof chatPartner != 'undefined' && chatPartner != '' && lzm_chatServerEvaluation.userChats.getUserChat(chatPartner) != null &&
            $.inArray(lzm_chatServerEvaluation.userChats.getUserChat(chatPartner).status, ['left', 'declined']) == -1) {
            qrdTreeHtml += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '2px', position: 'absolute', left: '2px', top: '4px', 'padding-top': '5px',
                    'padding-bottom': '9px', height: '6px', 'background-color': '#5197ff', color: '#ffffff',
                    'font-weight': 'bold', 'border-color': '#4888E3'});
        }
        qrdTreeHtml += lzm_displayHelper.createButton('add-qrd', 'ui-disabled qrd-change-buttons', 'addQrd();', '', '<i class="fa fa-plus"></i>', 'lr',
            {'margin-left': '4px'});
        qrdTreeHtml += lzm_displayHelper.createButton('edit-qrd', 'ui-disabled qrd-change-buttons', 'editQrd();', '', '<i class="fa fa-edit"></i>', 'lr',
            {'margin-left': '4px'});
        qrdTreeHtml += lzm_displayHelper.createButton('show-qrd-settings', 'ui-disabled qrd-change-buttons', 'showQrdSettings(\'\', \'qrd-tree\');', '', '<i class="fa fa-gears"></i>', 'lr',
            {'margin-left': '4px'});
        qrdTreeHtml += lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\');', '', '<i class="fa fa-search"></i>', 'lr',
            {'margin-left': '4px'});
        qrdTreeHtml += lzm_displayHelper.createButton('delete-qrd', 'ui-disabled qrd-change-buttons', 'deleteQrd();', '', '<i class="fa fa-remove"></i>', 'lr',
            {'margin-left': '4px'});
    } else {
        if (typeof chatPartner != 'undefined' && chatPartner != '' && lzm_chatServerEvaluation.userChats.getUserChat(chatPartner) != null &&
            $.inArray(lzm_chatServerEvaluation.userChats.getUserChat(chatPartner).status, ['left', 'declined']) == -1) {
            qrdTreeHtml += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '2px', 'margin-top': '-5px', 'float': 'left', 'background-color': '#5197ff', color: '#ffffff',
                    'font-weight': 'bold', 'border-color': '#4888E3'});
        }
        qrdTreeHtml += lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\');', '',
            '<i class="fa fa-search"></i>', 'lr', {'margin-left': '5px'});
        qrdTreeHtml += lzm_displayHelper.createButton('cancel-qrd', '', 'cancelQrd();', t('Cancel'), '', 'lr',
            {'margin-left': '5px'});
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
    $('#search-resource').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, false);
    });
    $('.qrd-search-by').change(function() {
        that.fillQrdSearchList(that.qrdChatPartner, false);
    });
    $('#search-resource-icon').click(function() {
        $('#search-resource').val('');
        $('#search-resource').keyup();
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

    var headerString = t('Knowledgebase');
    var footerString = '';

    if (typeof chatPartner == 'undefined' || chatPartner.indexOf('TICKET SAVE') == -1) {
        footerString +=  lzm_displayHelper.createButton('preview-qrd', 'ui-disabled qrd-change-buttons', 'previewQrd(\'' + chatPartner + '\', \'\', true, \'' + menuEntry + '\');',
            '', '<i class="fa fa-search"></i>', 'lr',
            {'margin-left': '5px'});
    }
    if (typeof chatPartner != 'undefined' && chatPartner != '') {
        if (chatPartner.indexOf('TICKET LOAD') == -1 && chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString += lzm_displayHelper.createButton('send-qrd-preview', 'ui-disabled qrd-change-buttons', 'sendQrdPreview(\'\', \'' + chatPartner + '\');',
                t('To <!--chat-partner-->',[['<!--chat-partner-->',chatPartnerName]]), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px', 'background-color': '#5197ff', color: '#ffffff',
                    'font-weight': 'bold', 'border-color': '#4888E3'});
        } else if (chatPartner.indexOf('TICKET SAVE') == -1 && chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString +=  lzm_displayHelper.createButton('insert-qrd-preview', 'ui-disabled qrd-change-buttons', 'insertQrdIntoTicket(\'' + closeToTicket + '\');',
                t('Insert Resource'), '', 'lr', {'margin-left': '8px', 'margin-top': '-5px'});
        } else if (chatPartner.indexOf('ATTACHMENT') == -1) {
            footerString +=  lzm_displayHelper.createButton('add-or-edit-qrd', 'ui-disabled qrd-change-buttons', 'addOrEditResourceFromTicket(\'' + closeToTicket + '\');',
                t('Save Resource'), '', 'lr', {'margin-left': '8px', 'margin-top': '-5px'});
        } else {
            footerString +=  lzm_displayHelper.createButton('add-qrd-attachment', 'ui-disabled qrd-change-buttons', 'addQrdAttachment(\'' + closeToTicket + '\');',
                t('Attach Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px'});
        }
    }
    footerString +=  lzm_displayHelper.createButton('cancel-qrd', '', 'cancelQrd(\'' + closeToTicket + '\');', t('Cancel'), '', 'lr', {'margin-left': '5px'});
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

    $('#search-resource').keyup(function(e) {
        lzm_chatDisplay.searchButtonUp('qrd-list', allResources, e, true);
    });
    $('.qrd-search-by').change(function() {
        that.fillQrdSearchList(that.qrdChatPartner, true);
    });
    $('#search-resource-icon').click(function() {
        $('#search-resource').val('');
        $('#search-resource').keyup();
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
    var searchString = $('#search-resource').val().replace(/^ */, '').replace(/ *$/, '');
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
            var resourceLink = '<a href="' + resource.text + '" class="lz_chat_link_no_icon"' +
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
                {'margin-left': '8px', 'margin-top': '-5px', 'float': 'left', 'background-color': '#5197ff', color: '#ffffff',
                    'font-weight': 'bold', 'border-color': '#4888E3'});
        } else if (chatPartner.indexOf('TICKET SAVE') == -1) {
            footerString += lzm_displayHelper.createButton('insert-qrd-preview', '', 'insertQrdIntoTicket(' + chatPartner.split('~')[1] + ');', t('Insert Resource'), '', 'lr',
                {'margin-left': '8px', 'margin-top': '-5px'});
        }
    }
    footerString += lzm_displayHelper.createButton('cancel-preview-qrd', '', '', t('Close'), '', 'lr',
        {'margin-left': '4px'});
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
    var footerString = '';
    if (!inDialog) {
        footerString += lzm_displayHelper.createButton('edited-qrd-settings', '', '', t('Settings'), '<i class="fa fa-gears"></i>', 'lr',
            {'margin-left': '4px'});
    }
    footerString += lzm_displayHelper.createButton('save-edited-qrd', '', '', t('Ok'), '', 'lr',
            {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-edited-qrd', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px'});
    var bodyString = '<div id="edit-resource-placeholder" style="margin-top: 5px;"></div>';
    // TODO: Fill data fields!
    var qrdEditFormString = '<fieldset id="edit-resource" class="lzm-fieldset" data-role="none"' +
        ' data-is_public="' + resource.p + '" data-full_text_search="' + resource.f + '" data-shorcut_word="' + resource.s + '"' +
        ' data-allow_bot="' + resource.ba + '" data-languages="' + resource.l + '" data-tags="' + resource.t + '">' +
        '<legend>' + t('Edit Resource') + '</legend><div id="edit-resource-inner">' +
        '<div id="qrd-edit-title-div" class="qrd-edit-resource qrd-edit-html-resource qrd-edit-folder-resource qrd-edit-link-resource"' +
        ' style="margin-top: 0px;">' +
        lzm_inputControls.createInput('qrd-edit-title', 'resource-input-new', resource.ti, t('Title'), '', 'text', 'a') +
        '</div>' +
        // HTML Resource textarea
        '<div class="qrd-edit-resource qrd-edit-html-resource" id="qrd-edit-text-div">' +
        '<label for="qrd-edit-text" style="font-size: 11px; font-weight: bold;">' + t('Text') + '</label><br />' +
        '<div id="qrd-edit-text-inner">';
    qrdEditFormString += '<div id="qrd-edit-text-controls">' +
        lzm_displayHelper.createInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'qrdTextEditor') +
        '</div>';
    qrdEditFormString += '<div id="qrd-edit-text-body">' +
        '<textarea id="qrd-edit-text" data-role="none"></textarea>' +
        '</div></div></div>';
        // URL input
    var urlParts = (resource.text.indexOf('mailto:') == -1) ? resource.text.split('://') : ['mailto', resource.text.replace(/mailto:/, '')];
    var selectedProt = (urlParts[0] == 'mailto') ? 'mailto:' : urlParts[0] + '://';
    var protList = [{value: 'file://', text: 'file://'}, {value: 'ftp://', text: 'ftp://'}, {value: 'gopher://', text: 'gopher://'},
        {value: 'http://', text: 'http://'}, {value: 'https://', text: 'https://'}, {value: 'mailto:', text: 'mailto:'},
        {value: 'news://', text: 'news://'}];
    qrdEditFormString += '<div class="qrd-edit-resource qrd-edit-link-resource" id="qrd-edit-url-div">' +
        '<div style="margin-bottom: 4px;"><label for="qrd-edit-url" style="font-size: 11px; font-weight: bold;">' + t('Url') + '</label></div>' +
        '<table style="width: 100%;"><tr><td style="width: 1px !important; padding-top: 2px;">' +
        lzm_inputControls.createSelect('qrd-edit-url-protocol', 'resource-select-prot-new', '', true, {position: 'right', gap: '0px'}, {}, '', protList, selectedProt, 'a') +
        '</td><td>' +
        lzm_inputControls.createInput('qrd-edit-url', 'resource-input-url-new', urlParts[1], '', '', 'text', 'a') +
        '</td></tr></table>' +
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
        var dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-edit', defaultCss, {}, {}, {}, '', dialogData, true, true);
        $('#qrd-edit').data('dialog_id', dialogId);
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
    lzm_displayLayout.resizeAddResources();

    $('#qrd-edit-url-protocol').change(function() {
        $('#qrd-edit-url-protocol-inner-text').html($("#qrd-edit-url-protocol option:selected").text());
    });
};

ChatResourcesClass.prototype.showQrdSettings = function(resource, editorText, caller) {
    var headerString = t('Settings');
    var footerString = lzm_displayHelper.createButton('save-qrd-settings', '', '', t('Ok'), '', 'lr', {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-qrd-settings', '', '', t('Cancel'), '', 'lr', {'margin-left': '4px'});
    var bodyString = '<div id="qrd-settings-placeholder" style="margin-top: 5px;"></div>';
    var entryIsPublic = (resource.p == 1) ? ' checked="checked"' : '';
    var entryUsedByBots = (resource.ba == 1) ? ' checked="checked"' : '';
    var useFullTextSearch = (resource.f == 1) ? ' checked="checked"' : '';
    var shortcutText = (typeof resource.s != 'undefined') ? resource.s : '';
    var languageText = (typeof resource.l != 'undefined') ? resource.l : '';
    var knbContent = '<fieldset class="lzm-fieldset" id="qrd-knb-pub-acc-fs"><legend>' + t('Public Access') + '</legend>' +
        '<div style="margin: 10px 0px;"><input type="checkbox" id="qrd-knb-pub-entry"' + entryIsPublic +
        ' style="margin-right: 10px; vertical-align: middle;" />' +
        '<label for="qrd-knb-pub-entry">' + t('This entry will appear in Public Knowledgebase') +
        '</label></div>';
    var botsDisabled = (resource.ty == 0) ? ' class="ui-disabled"' : '';
    knbContent += '<div' + botsDisabled + ' style="margin: 10px 0px;"><input type="checkbox" id="qrd-knb-pub-bot"' + entryUsedByBots +
        ' style="margin-right: 10px; vertical-align: middle;" />' +
        '<label for="qrd-knb-pub-bot">' + t('Bots will use this resource (Virtual Assistance)') +
        '</label></div>' +
        '</fieldset>';
    var fulltextDisabled = (resource.ty == 0) ? ' class="ui-disabled"' : '';
    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-search-fs" style="margin-top: 5px;"><legend>' + t('Search') + '</legend>' +
        '<div' + fulltextDisabled + ' style="margin: 10px 0px;"><input type="checkbox" id="qrd-knb-search-full"' + useFullTextSearch +
        ' style="margin-right: 10px; vertical-align: middle;" />' +
        '<label for="qrd-knb-search-full">' + t('Fulltext Search (slower)') +
        '</label></div>' +
        '</fieldset>';
    var shortcutDisabeld = (resource.ty == 0) ? 'ui-disabled' : '';
    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-shortcuts-fs" style="margin-top: 5px;"><legend>' + t('Shortcuts') + '</legend>' +
        '<table style="width: 100%; margin-bottom: 10px;"><tr style="vertical-align: bottom;"><td style="width: 1px !important;">' +
        '<div id="qrd-knb-shortcuts-prefix" style="width: 30px; background-color: #e8e8e8; height: 22px; padding-top: 8px;' +
        ' border: 1px solid #cccccc; text-align: center;">/</div>' +
        '</td><td>' +
        lzm_inputControls.createInput('qrd-knb-shortcuts-text', shortcutDisabeld, shortcutText, t('Shortcut (word, global)'), '', 'text', 'a') +
        '</td></tr></table>' +
        '<div>' + t('Example: /welcome') + '</div>' +
        '</fieldset>';
    knbContent += '<fieldset class="lzm-fieldset" id="qrd-knb-language-fs" style="margin-top: 5px;"><legend>' + t('Language') + '</legend>' +
        lzm_inputControls.createInput('qrd-knb-language-text', '', languageText, t('Language (leave blank for all)'), '', 'text', 'a') +
        '<div>' + t('ISO 639-1 twoletter, comma-separated, case insensitive, example: en, it, fr') + '</div>' +
        '</fieldset>';
    var tagsDisabled = (resource.ty == 0) ? ' class="ui-disabled"' : '';
    var tagsText = resource.t;
    var tagsContent = '<fieldset class="lzm-fieldset" id="qrd-tags-fs"><legend>' + t('Tags') + '</legend>' +
        '<textarea' + tagsDisabled + ' id="qrd-tags-input">' + tagsText + '</textarea>' +
        '</fieldset>';
    var tabArray = [{name: t('Knowledgebase'), content: knbContent}, {name: t('Tags'), content: tagsContent}];
    var dialogData = {}, dialogId = '', tabControlWidth = 0;

    if (caller == 'qrd-tree') {
        dialogData = {'resource-id': resource.rid};
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-settings', {}, {}, {}, {}, '', dialogData, true, true);
        tabControlWidth = $('#qrd-settings-body').width();
    } else if (caller == 'add-resource') {
        dialogData = {editors: [{id: 'qrd-add-text', instanceName: 'qrdTextEditor', text: editorText}], 'resource-id': resource.rid};
        dialogId = $('#qrd-add').data('dialog_id');
        tabControlWidth = $('#qrd-add-body').width();
        lzm_displayHelper.minimizeDialogWindow(dialogId, 'qrd-add', dialogData, '', false);
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-add', {}, {}, {}, {}, '', {'resource-id': resource.rid}, true, true, dialogId + '_settings');
    } else if (caller == 'edit-resource') {
        dialogData = {editors: [{id: 'qrd-edit-text', instanceName: 'qrdTextEditor', text: editorText}], 'resource-id': resource.rid,
            menu: t('Edit Resource <!--resource_title-->',[['<!--resource_title-->', resource.ti]])};
        dialogId = $('#qrd-edit').data('dialog_id');
        tabControlWidth = $('#qrd-edit-body').width();
        lzm_displayHelper.minimizeDialogWindow(dialogId, 'qrd-edit', dialogData, '', false);
        lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-edit', {}, {}, {}, {}, '', {'resource-id': resource.rid}, true, true, dialogId + '_settings');
    }
    lzm_inputControls.createTabControl('qrd-settings-placeholder', tabArray, 0, tabControlWidth);

    lzm_displayLayout.resizeResourceSettings();

    $('#cancel-qrd-settings').click(function() {
        if (caller == 'qrd-tree' || caller == 'test') {
            lzm_displayHelper.removeDialogWindow('qrd-settings');
        } else if (caller == 'add-resource') {
            lzm_displayHelper.removeDialogWindow('qrd-add');
            lzm_displayHelper.maximizeDialogWindow(dialogId);
        } else if (caller == 'edit-resource') {
            lzm_displayHelper.removeDialogWindow('qrd-edit');
            lzm_displayHelper.maximizeDialogWindow(dialogId);
        }
    });
    $('#save-qrd-settings').click(function() {
        var isPublic = $('#qrd-knb-pub-entry').prop('checked') ? '1' : '0';
        var allowBot = $('#qrd-knb-pub-bot').prop('checked') ? '1' : '0';
        var fullTextSearch = $('#qrd-knb-search-full').prop('checked') ? '1' : '0';
        var tags = $('#qrd-tags-input').val();
        var shortcutWord = $('#qrd-knb-shortcuts-text').val();
        var languages = $('#qrd-knb-language-text').val().replace(/ +/g, '');
        $('#cancel-qrd-settings').click();
        if (caller == 'qrd-tree' || caller == 'test') {
            lzm_chatPollServer.pollServerResource({
                rid: resource.rid,
                pid: resource.pid,
                ra: resource.ra,
                ti: resource.ti,
                ty: resource.ty,
                text: resource.text,
                si: resource.si,
                t: tags,
                di: 0,
                isPublic: isPublic,
                fullTextSearch: fullTextSearch,
                shortcutWord: shortcutWord,
                allowBotAccess: allowBot,
                languages: languages
            });
        } else if (caller == 'add-resource') {
            $('#add-resource').data('is_public', isPublic);
            $('#add-resource').data('full_text_search', fullTextSearch);
            $('#add-resource').data('shorcut_word', shortcutWord);
            $('#add-resource').data('allow_bot', allowBot);
            $('#add-resource').data('languages', languages);
            $('#add-resource').data('tags', tags);
        } else if (caller == 'edit-resource') {
            $('#edit-resource').data('is_public', isPublic);
            $('#edit-resource').data('full_text_search', fullTextSearch);
            $('#edit-resource').data('shorcut_word', shortcutWord);
            $('#edit-resource').data('allow_bot', allowBot);
            $('#edit-resource').data('languages', languages);
            $('#edit-resource').data('tags', tags);
        }
    });
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
    var footerString = '';
    if (!inDialog && sendToChat == null) {
        footerString += lzm_displayHelper.createButton('new-qrd-settings', 'ui-disabled', '', t('Settings'), '<i class="fa fa-gears"></i>', 'lr',
            {'margin-left': '4px'});
    }
    var okDisabled = (sendToChat == null && toAttachment === false) ? 'ui-disabled' : '';
    footerString += lzm_displayHelper.createButton('save-new-qrd', okDisabled, '', t('Ok'), '', 'lr',
            {'margin-left': '4px'}) +
        lzm_displayHelper.createButton('cancel-new-qrd', '', '', t('Cancel'), '', 'lr',
            {'margin-left': '4px'});
    var bodyString = '<div id="add-resource-placeholder" style="margin-top: 5px;"></div>';
    var qrdAddFormString = '<fieldset id="add-resource" class="lzm-fieldset" data-role="none"' +
        ' data-is_public="" data-full_text_search="" data-shorcut_word="" data-allow_bot="" data-languages="" data-tags="">' +
        '<legend>' + titleString + '</legend><div id="add-resource-inner">';
    var isSelected = '', isVisible = '';
    if (ticketId == '' && !toAttachment && sendToChat == null) {
        // Type select
        var textSelectString = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? t('Text') : t('Text (not available on mobile devices)');
        var fileSelectString = (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile) ? t('File') : t('File (not available on mobile devices)');
        var typeList = [{value: '-1', text: t('-- Choose a type ---')}, {value: '0', text: t('Folder')}, {value: '1', text: textSelectString},
            {value: '2', text: t('Link')}, {value: '3', text: fileSelectString}];
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<div style="margin-bottom: 4px;"><label for="qrd-add-type" style="font-size: 11px; font-weight: bold;">' + t('Type') + '</label></div>';
        qrdAddFormString += lzm_inputControls.createSelect('qrd-add-type', 'resource-select-new', '', true, {position: 'right', gap: '0px'}, {}, '', typeList, '-1', 'a');
        qrdAddFormString += '</div>';
    } else if (!toAttachment && sendToChat == null){
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="1" id="qrd-add-type" />' +
            lzm_inputControls.createInput('qrd-add-type-dummy', 'resource-input-new lzm-disabled', t('Text'), t('Type'), '', 'text', 'a') +
            '</div>';
    } else if (sendToChat != null && sendToChat.type == 'link') {
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="2" id="qrd-add-type" />' +
            '</div>';
    } else {
        qrdAddFormString += '<div id="qrd-add-type-div">' +
            '<input type="hidden" value="3" id="qrd-add-type" />' +
            lzm_inputControls.createInput('qrd-add-type-dummy', 'resource-input-new lzm-disabled', t('File Resource'), t('Type'), '', 'text', 'a') +
            '</div>';
    }
    // Title input
    isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-title-div" class="qrd-add-resource qrd-add-html-resource qrd-add-folder-resource qrd-add-link-resource">' +
        lzm_inputControls.createInput('qrd-add-title', 'resource-input-new', '', t('Title'), '', 'text', 'a') +
        '</div>';
        // HTML Resource textarea
    qrdAddFormString += '<div id="qrd-add-text-div" class="qrd-add-resource qrd-add-html-resource">' +
        '<div style="margin-bottom: 4px;"><label for="qrd-add-text" style="font-size: 11px; font-weight: bold;">' + t('Text') + '</label></div>' +
        '<div id="qrd-add-text-inner">';
    qrdAddFormString += '<div id="qrd-add-text-controls">' +
        lzm_displayHelper.createInputControlPanel('basic').replace(/lzm_chatInputEditor/g,'qrdTextEditor') +
        '</div>';
    qrdAddFormString += '<div id="qrd-add-text-body">' +
        '<textarea id="qrd-add-text" data-role="none"></textarea>' +
        '</div></div></div>';
        // URL input
    isVisible = (sendToChat != null && sendToChat.type == 'link') ? ' style="display:block;"' : '';
    var protList = [{value: 'file://', text: 'file://'}, {value: 'ftp://', text: 'ftp://'}, {value: 'gopher://', text: 'gopher://'},
        {value: 'http://', text: 'http://'}, {value: 'https://', text: 'https://'}, {value: 'mailto:', text: 'mailto:'},
        {value: 'news://', text: 'news://'}];
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-url-div" class="qrd-add-link-resource qrd-add-resource">' +
        '<div style="margin-bottom: 4px;"><label for="qrd-add-url" style="font-size: 11px; font-weight: bold;">' + t('Url') + '</label></div>' +
        '<table style="width: 100%;"><tr><td style="width: 1px !important; padding-top: 2px;">' +
        lzm_inputControls.createSelect('qrd-add-url-protocol', 'resource-select-prot-new', '', true, {position: 'right', gap: '0px'}, {}, '', protList, 'http://', 'a') +
        '</td><td>' +
        lzm_inputControls.createInput('qrd-add-url', 'resource-input-url-new', '', '', '', 'text', 'a') +
        '</td></tr></table>' +
        '</div>';
        // File input
    isVisible = (sendToChat != null && sendToChat.type == 'file') ? ' style="display:block;"' : '';
    qrdAddFormString += '<div' + isVisible + ' id="qrd-add-file-div" class="qrd-add-file-resource qrd-add-resource">' +
        lzm_inputControls.createInput('file-upload-input', 'resource-input-new', '', t('File'), '', 'file', 'a') +
        '<div id="file-upload-progress" style="display: none; background-image: url(\'../images/chat_loading.gif\');' +
        ' background-position: left center; background-repeat: no-repeat; padding: 5px 230px; margin: 5px 0px 2px 0px;"><span id="file-upload-numeric">0%</span></div>' +
        '<div id="file-upload-name" style="margin: 5px 0px 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-size" style="margin: 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-type" style="margin: 2px 0px; padding: 2px 4px;"></div>' +
        '<div id="file-upload-error" style="color: #cc0000; font-weight: bold; padding: 10px 0px;"></div>' +
        '<div id="cancel-file-upload-div" style="display: none;">' + lzm_displayHelper.createButton('cancel-file-upload',
        '', 'cancelFileUpload()', t('Cancel file upload'), '', 'lr',
        {'margin-left': '4px', 'display': 'none'}) + '</div>' +
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
        dialogId = lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'qrd-add', {}, {}, {}, {}, '', dialogData, true, showFullscreen, dialogId);
        $('#qrd-add').data('dialog_id', dialogId);
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
    lzm_displayLayout.resizeAddResources();

    $('#qrd-add-type').change(function() {
        $('#qrd-add-type-inner-text').html($("#qrd-add-type option:selected").text());
    });
    $('#qrd-add-url-protocol').change(function() {
        $('#qrd-add-url-protocol-inner-text').html($("#qrd-add-url-protocol option:selected").text());
    });

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

ChatResourcesClass.prototype.getResourceIcon = function(type, text, title) {
    var that = this;
    text = (typeof text != 'undefined') ? text.toLowerCase() : '';
    title = (typeof title != 'undefined') ? title.toLowerCase() : '';
    var resourceIcon;
    switch(type) {
        case '0':
            resourceIcon = '<i class="fa fa-folder-open"></i>';
            break;
        case '1':
            resourceIcon = '<i class="fa fa-file-text"></i>';
            break;
        case '2':
            if (typeof text != 'undefined' && text.indexOf('mailto:') == 0) {
                resourceIcon = '<i class="fa fa-envelope"></i>';
            } else {
                resourceIcon = '<i class="fa fa-external-link"></i>';
            }
            break;
        default:
            resourceIcon = that.getFileTypeIcon(title);
            break;
    }
    return resourceIcon;
};

ChatResourcesClass.prototype.getFileTypeIcon = function(fileName) {
    var checkEnding = function(fileName, ending) {
        ending = (typeof ending == 'string') ? [ending] : (typeof ending == 'object' && ending instanceof Array) ? ending : [];
        var fnLength = fileName.length, eLength = 0, rt = false;
        for (var i=0; i<ending.length; i++) {
            eLength = ending[i].length;
            rt = rt || (ending[i] != '' && fileName.indexOf('.' + ending[i]) == fnLength - eLength - 1);
        }
        return rt;
    };

    fileName = fileName.toLowerCase();
    var fileIcon = '<i class="fa fa-file"></i>';
    if (checkEnding(fileName, ['mp3', 'wav', 'ogg', 'wma'])) {
        fileIcon = '<i class="fa fa-file-sound-o"></i>';
    } else if (checkEnding(fileName, ['png', 'gif', 'jpg', 'bmp', 'jpeg'])) {
        fileIcon = '<i class="fa fa-file-picture-o"></i>';
    } else if (checkEnding(fileName, ['doc', 'docx', 'odt', 'rtf'])) {
        fileIcon = '<i class="fa fa-file-word-o"></i>';
    } else if (checkEnding(fileName, ['xls', 'xlsx', 'ods', 'csv'])) {
        fileIcon = '<i class="fa fa-file-excel-o"></i>';
    } else if (checkEnding(fileName, ['ppt', 'pptx', 'odp'])) {
        fileIcon = '<i class="fa fa-file-powerpoint-o"></i>';
    } else if (checkEnding(fileName, ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', 'tar.xz', 'tgz', '7z'])) {
        fileIcon = '<i class="fa fa-file-archive-o"></i>';
    } else if (checkEnding(fileName, ['pdf', 'ps'])) {
        fileIcon = '<i class="fa fa-file-pdf-o"></i>';
    } else if (checkEnding(fileName, ['mpg', 'mpeg', 'avi', 'mp4', 'webm', 'mov', 'ogm', 'wmf'])) {
        fileIcon = '<i class="fa fa-file-movie-o"></i>';
    } else if (checkEnding(fileName, ['js', 'php', 'html', 'css', 'py', 'sh', 'pl', 'cs', 'java', 'c', '.c++', '.cpp'])) {
        fileIcon = '<i class="fa fa-file-code-o"></i>';
    }
    return fileIcon;
};

ChatResourcesClass.prototype.createQrdTreeTopLevel = function(topLayerResource, chatPartner, inDialog) {
    var onclickAction = ' onclick="handleResourceClickEvents(\'' + topLayerResource.rid + '\')"';
    var onContextMenu = '', that = this;
    if (!lzm_chatDisplay.isApp && !lzm_chatDisplay.isMobile && !inDialog) {
        onContextMenu = ' oncontextmenu="openQrdContextMenu(event, \'' + chatPartner + '\', \'' + topLayerResource.rid + '\');return false;"';
    }
    var plusMinusImage = ($.inArray("1", that.openedResourcesFolder) != -1 || lzm_chatServerEvaluation.cannedResources.getResourceList('', '1').length == 0) ?
        '<i class="fa fa-minus-square-o"></i>' : '<i class="fa fa-plus-square-o"></i>';
    var resourceHtml = '<fieldset id="all-resources" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('All Resources') + '</legend>' +
        '<div id="all-resources-inner"><div id="resource-' + topLayerResource.rid + '" class="resource-div lzm-unselectable"' +
        ' style="margin: 4px 0px; padding-left: 5px; padding-top: 1px; padding-bottom: 1px; white-space: nowrap;">' +
        '<span class="resource-open-mark" id="resource-' + topLayerResource.rid + '-open-mark"' +
        onclickAction + onContextMenu + '>' + plusMinusImage + '</span>' +
        '<span class="resource-icon-and-text" id="resource-' + topLayerResource.rid + '-icon-and-text"' +
        onclickAction + onContextMenu + '>' + that.getResourceIcon(topLayerResource.ty) +
        '<span style="padding-left: 5px;">' + lzm_commonTools.htmlEntities(topLayerResource.ti) + '</span>' +
        '</span></div><div id="folder-' + topLayerResource.rid + '" style="display: none;"></div>' +
        '</div></fieldset>';

    return resourceHtml;
};

ChatResourcesClass.prototype.createQrdSearch = function(chatPartner, inDialog) {
    var that = this, attachmentDataString = (chatPartner.indexOf('ATTACHMENT') != -1) ? ' data-attachment="1"' : ' data-attachment="0"';
    var searchHtml = '<fieldset id="search-input" class="lzm-fieldset" data-role="none">' +
        '<legend>' + t('Search for...') + '</legend>' +
        '<table id="search-input-inner">' +
        '<tr><td colspan="2">' +
        lzm_inputControls.createInput('search-resource','', '', t('Search'), '<i class="fa fa-remove"></i>', 'text', 'b') +
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
        '<td>' + that.getResourceIcon(resource.ty, resource.text, resource.ti) + '</td>' +
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
        '<td>' + that.getResourceIcon(resource.ty, resource.text, resource.ti) + '</td>' +
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
        var openMarkIcon = (lzm_chatServerEvaluation.cannedResources.getResourceList('', {parent: resource.rid}).length > 0) ?
            '<i class="fa fa-plus-square-o"></i>' : '<i class="fa fa-minus-square-o"></i>';
        resourceHtml += '<span class="resource-open-mark" id="resource-' + resource.rid + '-open-mark"' +
            onclickAction + onContextMenu + '>' + openMarkIcon + '</span>';
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
    resourceHtml += '<span class="resource-icon-and-text" id="resource-' + resource.rid + '-icon-and-text"' +
        onclickAction + onDblClickAction + onContextMenu + '>' +
        that.getResourceIcon(resource.ty, resource.text, resource.ti) +
        '<span class="qrd-title-span" style="padding-left: 5px;">' +
        lzm_commonTools.htmlEntities(resource.ti) + '</span>' +
        '</span></div>';
    if (resource.ty == 0) {
        resourceHtml += '<div id="folder-' + resource.rid + '" style="display: none;"></div>';
    }

    return resourceHtml;
};

ChatResourcesClass.prototype.createQrdTreeContextMenu = function(myObject) {
    var contextMenuHtml = '', disabledClass = '';
    disabledClass = (myObject.ty == 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 0px 0px 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-search" style="padding-left: 4px;"></i>' +
        '<span id="preview-qrd-ctxt" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 5px; cursor:pointer;\' onclick="previewQrd(\'' + myObject.chatPartner + '\');">' +
        t('Preview') + '</span></div><hr />';
    disabledClass = (myObject.ty != 0) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-plus" style="padding-left: 4px;"></i>' +
        '<span id="add-qrd-ctxt" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 7px; cursor:pointer;\' onclick="addQrd();">' +
        t('Add') + '</span></div>';
    disabledClass = (myObject.rid == 1 || myObject.ty == 3 || myObject.ty == 4) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-edit" style="padding-left: 4px;"></i>' +
        '<span id="edit-qrd-ctxt" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 4px; cursor:pointer;\' onclick="editQrd();">' +
        t('Edit') + '</span></div>';
    disabledClass = (myObject.rid == 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px 0px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-remove" style="padding-left: 4px;"></i>' +
        '<span id="delete-qrd-ctxt" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 7px; cursor:pointer;\' onclick="deleteQrd();">' +
        t('Delete') + '</span></div><hr />';
    disabledClass = (myObject.rid == 1) ? ' class="ui-disabled"' : '';
    contextMenuHtml += '<div' + disabledClass + ' style="margin: 8px 0px 0px 0px; text-align: left; white-space: nowrap;">' +
        '<i class="fa fa-gears" style="padding-left: 4px;"></i>' +
        '<span id="show-qrd-settings-ctxt" style=\'margin-left: 5px;' +
        ' padding: 1px 15px 1px 7px; cursor:pointer; white-space: nowrap;\' onclick="showQrdSettings(\'\', \'qrd-tree\');">' +
        t('Settings') + '</span></div>';

    return contextMenuHtml;
};
