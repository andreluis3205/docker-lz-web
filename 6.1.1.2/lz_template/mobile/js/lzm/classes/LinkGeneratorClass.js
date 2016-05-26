/****************************************************************************************
/****************************************************************************************
 * LiveZilla LinkGeneratorClass.js
 *
 * Copyright 2016 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

LinkGeneratorClass.DataPassThruPlaceholder = '<!--replace_me_with_b64_encoded_';
LinkGeneratorClass.CurrentElements = [];

function LinkGeneratorClass() {
    this.m_MaxImageSetId = 0;
    this.m_CurrentCodeId = null;
    this.m_CurrentCodeName = null;
}

LinkGeneratorClass.prototype.showLinkGenerator = function() {
    var disabledClass = 'ui-disabled';
    var headerString = t('Link Generator');
    var footerString =
        lzm_displayHelper.createButton('preview-btn', disabledClass, 'previewLinkGeneratorCode()', t('Preview'), '<i class="fa fa-rocket"></i>', 'force-text',{'margin-left': '4px'},'',30,'d') +
        lzm_displayHelper.createButton('get-code-btn', disabledClass, 'showLinkGeneratorCode()', tid('get_code'), '<i class="fa fa-code"></i>', 'force-text',{'margin-left': '4px','padding': '3px 10px'},'',30,'d') +
        lzm_displayHelper.createButton('close-link-generator', '', '', t('Close'), '', 'lr',{'margin-left': '4px'},'',30,'d');

    var dialogData = {};
    var bodyString = this.createLinkGeneratorHtml();
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'link-generator', {}, {}, {}, {}, '', dialogData, true, false, 'link_generator_dialog');
    lzm_displayLayout.resizeLinkGenerator();
    $('#close-link-generator').click(function() {
        lzm_displayHelper.removeDialogWindow('link-generator');
    });
};

LinkGeneratorClass.prototype.createLinkGeneratorHtml = function() {
    var disabledClass = 'ui-disabled';
    var contentHtml = '<fieldset class="lzm-fieldset" id="lg-elements-configuration">' +
        '<legend>' + tid('elements') + '</legend>' +
        '<div id="elements-list-div"><div style="display:none;" id="lz_link_generator_load" class="lz_anim_loading"></div><table class="alternating-rows-table" id="elements-list-table">' +
        '<tbody></tbody></table></div><div style="margin-top:12px;">';
    contentHtml += '<span style="float:left;">';
    contentHtml += lzm_inputControls.createButton('save-element-to-server-btn', disabledClass, 'saveLinkGeneratorCode()', t('Save'), '<i class="fa fa-floppy-o"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += lzm_inputControls.createButton('load-element-from-server-btn', '', 'loadLinkGeneratorCode()', t('Load'), '<i class="fa fa-folder-open-o"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, '', 20, 'e');
    contentHtml += '</span>';
    contentHtml += '<span style="float:right;">';
    contentHtml += lzm_inputControls.createButton('add-element-btn', '', 'addLinkGeneratorElement()', t('Add'), '<i class="fa fa-plus"></i>','force-text',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, tid('create_new_element'), 20, 'e');
    contentHtml += lzm_inputControls.createButton('edit-element-btn', 'ui-disabled element-edit-btns', 'editLinkGeneratorElement()', t('Edit'), '<i class="fa fa-gear"></i>', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, t('Edit selected Element'), 20, 'e');
    contentHtml += lzm_inputControls.createButton('rm-element-btn', 'ui-disabled element-edit-btns', 'removeLinkGeneratorElement()', t('Remove'), '<i class="fa fa-remove"></i>', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, t('Remove selected Element'), 20, 'e');
    contentHtml += '</span></div></fieldset>';
    return contentHtml;
};

LinkGeneratorClass.prototype.ValidateButtons = function(){
    var elementsExisting = $('#elements-list-table tr').length > 0;
    var selectedElement = this.GetSelectedElement(false);
    if(selectedElement != null){
        $('.element-edit-btns').removeClass('ui-disabled');

        if(selectedElement.m_Type=='monitoring' && lzm_chatDisplay.LinkGenerator.RequiresMonitoring())
            $('#rm-element-btn').addClass('ui-disabled');
    }
    else
        $('.element-edit-btns').addClass('ui-disabled');

    if(!elementsExisting)
    {
        $('#preview-btn').addClass('ui-disabled');
        $('#get-code-btn').addClass('ui-disabled');
        $('#save-element-to-server-btn').addClass('ui-disabled');
    }
    else
    {
        $('#preview-btn').removeClass('ui-disabled');
        $('#get-code-btn').removeClass('ui-disabled');
        $('#save-element-to-server-btn').removeClass('ui-disabled');
    }
}

LinkGeneratorClass.prototype.createSelectElementTypeHtml = function() {
    var contentHtml = '<fieldset class="lzm-fieldset" id="lg-elements-configuration">' +
        '<legend>' + tid('create_new_element') + '</legend>' +
        '<form id="select-element-form">' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-image')) ? ' ui-disabled' : '')+'"><input id="element-inlay-image" value="inlay-image" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-image" class="radio-custom-label">' + t('Graphic Button') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('inlay-text')) ? ' ui-disabled' : '')+'"><input id="element-inlay-text" value="inlay-text" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-inlay-text" class="radio-custom-label">' + t('Text Link') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('overlay-button-v1')||this.isTypeSelected('overlay-button-v2')) ? ' ui-disabled' : '')+'"><input id="element-overlay-button" value="overlay-button" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-button" class="radio-custom-label">' + t('Floating Button') + '</label>' +
            '<div class="top-space-half left-space-child">' +
                '<input id="element-overlay-button-v1" name="element-overlay-button-type" type="radio" class="radio-custom" value="overlay-button-v1" checked /><label for="element-overlay-button-v1" class="radio-custom-label ui-disabled element-overlay-button-type">' + t('Version 1') + '&nbsp;</label>' +
                '<input id="element-overlay-button-v2" name="element-overlay-button-type" type="radio" class="radio-custom" value="overlay-button-v2" /><label for="element-overlay-button-v2" class="radio-custom-label ui-disabled element-overlay-button-type">' + t('Version 2') + '&nbsp;</label>' +
            '</div>' +
        '</div>' +
        '<div class="top-space-double left-space-child'+((this.isTypeSelected('overlay-widget')) ? ' ui-disabled' : '')+'"><input id="element-overlay-widget" value="overlay-widget" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-overlay-widget" class="radio-custom-label">' + t('On-Site Chat Overlay') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('monitoring')) ? ' ui-disabled' : '')+'"><input id="element-monitoring" value="monitoring" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-monitoring" class="radio-custom-label">' + t('Visitor Monitoring') + '</label></div>' +
        '<div class="top-space left-space-child'+((this.isTypeSelected('no-tracking')) ? ' ui-disabled' : '')+'"><input id="element-no-tracking" value="no-tracking" name="element-type" type="radio" class="radio-custom element-type" /><label for="element-no-tracking" class="radio-custom-label">' + tid('no-tracking') + '</label></div>';
    contentHtml += '</form></fieldset>';
    return contentHtml;
};

LinkGeneratorClass.prototype.createElementConfigurationHtml = function() {
    return '<div id="lg-element-settings-placeholder"></div>';
};

LinkGeneratorClass.prototype.SelectElementType = function(editObj) {
    var that=this;
    var editObj = (typeof editObj != 'undefined') ? editObj : null;
    var headerString = tid('create_new_element');
    var footerString =
        lzm_displayHelper.createButton('select-element-type-btn', 'ui-disabled', '', tid('select'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_displayHelper.createButton('cancel-element-type-btn', '', '', t('Cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var bodyString = this.createSelectElementTypeHtml();
    var dialogData = {};

    lzm_displayHelper.minimizeDialogWindow('link_generator', 'link-generator', dialogData, '', false);
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'link-generator', {}, {}, {}, {}, '', dialogData, true, false, 'link_generator_add_element');

    $('#select-element-type-btn').click(function() {
        var eType = $('input[name=element-type]:checked').val();
        if(eType == 'overlay-button')
            eType = $('input[name=element-overlay-button-type]:checked').val();
        that.AddLinkGeneratorElement(eType ,null);
    });
    $('#cancel-element-type-btn').click(function() {
        lzm_displayHelper.removeDialogWindow('link-generator');
        lzm_displayHelper.maximizeDialogWindow('link_generator');
    });
    $('.element-type').change(function() {
        if ($('#element-overlay-button').prop('checked'))
            $('.element-overlay-button-type').removeClass('ui-disabled');
        else
            $('.element-overlay-button-type').addClass('ui-disabled');
        $('#select-element-type-btn').removeClass('ui-disabled');
    });

    if(editObj != null)
        that.AddLinkGeneratorElement(editObj.m_Type,editObj);

};

LinkGeneratorClass.prototype.AddLinkGeneratorElement = function(elementType, editObj) {

    var that = this;
    editObj = (typeof editObj != 'undefined') ? editObj : null;

    var headerString = tid(elementType);
    var footerString =
        lzm_displayHelper.createButton('save-element-btn', '', '', t('Save'), '', 'lr',{'margin-left': '6px'},'',30,'d') +
        lzm_displayHelper.createButton('cancel-element-btn', '', '', t('Cancel'), '', 'lr', {'margin-left': '6px'},'',30,'d');

    var bodyString = this.createElementConfigurationHtml();
    var dialogData = {};

    lzm_displayHelper.removeDialogWindow('link-generator');
    lzm_displayHelper.createDialogWindow(headerString, bodyString, footerString, 'link-generator', {}, {}, {}, {}, '', dialogData, true, true, 'link_generator_add_element');

    var element = new LinkGeneratorElement(elementType,editObj);
    if(editObj == null && LinkGeneratorClass.CurrentElements.length>0)
        element.LoadSettings(LinkGeneratorClass.CurrentElements[0].m_Settings,true);

    if(element.m_Type == 'overlay-widget' && parseInt(this.GetPositionIndex(element.GetProperty('m_Position').value)) < 20)
        element.GetProperty('m_Position').value = 'right bottom';
    if(element.m_Type == 'inlay-text')
        element.GetProperty('m_TextDefault').value = false;

    var tabs = [];
    element.m_Settings.forEach(function(entry_name) {
        if($.inArray(elementType,entry_name.not) === -1)
            tabs.push({name: entry_name.title, content: element.GetForm(entry_name.name), hash: entry_name.name});
    });

    lzm_displayHelper.createTabControl('lg-element-settings-placeholder',tabs,0);

    if(element.m_Type == 'overlay-widget'){
        $('.y0').addClass('ui-disabled');
        $('.y1').addClass('ui-disabled');
    }
    else if(element.m_Type == 'inlay-text'){
        $('.checkbox-custom-label[for="cb-m_TextDefault"]').addClass('ui-disabled');
        $('#cb-m_TextDefault').addClass('ui-disabled');
    }

    element.m_Settings.forEach(function(entry_name) {
        element.ApplyLogicToForm(entry_name.name);
    });

    $('#save-element-btn').click(function() {
        element.GUIToObject();
        lzm_displayHelper.removeDialogWindow('link-generator');
        lzm_displayHelper.maximizeDialogWindow('link_generator');

        $('#'+element.GetLineId()).remove();
        that.AddElementRow(element.GetRow());

        if(!that.isTypeSelected('monitoring'))
            $('#elements-list-table > tbody').append(new LinkGeneratorElement('monitoring').GetRow());

        that.SettleStaticFields(element,that.GetElementsFromRows(false));
        selectLinkGeneratorElement(element.m_Type);
    });
    $('#cancel-element-btn').click(function() {
        lzm_displayHelper.removeDialogWindow('link-generator');
        lzm_displayHelper.maximizeDialogWindow('link_generator');
    });
};

LinkGeneratorClass.prototype.editLinkGeneratorElement = function(){
    var elementToEdit = this.GetSelectedElement(false);
    this.SelectElementType(elementToEdit);
    selectLinkGeneratorElement('');
}

LinkGeneratorClass.prototype.removeLinkGeneratorElement = function(){
    var that = this;
    this.GetSelectedElement(true).remove();
    $('#elements-list-table > tbody > tr').each(function() {
        selectLinkGeneratorElement(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))).m_Type);
        return false;
    });
    this.ValidateButtons();
}

LinkGeneratorClass.prototype.GetSelectedElement = function(getRow){
    if($('#elements-list-table > tbody > tr').length > 0){
        if(getRow)
            return $(".selected-table-line","#elements-list-table");
        else if($(".selected-table-line","#elements-list-table").length>0)
            return JSON.parse(lz_global_base64_url_decode($(".selected-table-line","#elements-list-table").attr('data-element')));
    }
    return null;
}

LinkGeneratorClass.prototype.GetElement = function(type){
    var elem = null;
    $('#elements-list-table > tbody > tr').each(function() {
        if($(this).attr('id').match(type+'$')){
            elem = new LinkGeneratorElement(type,JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        }
    });
    return elem;
}

LinkGeneratorClass.prototype.isTypeSelected = function(type){
    var res = false;
    $('#elements-list-table > tbody > tr').each(function() {
        if($(this).attr('id').match(type+'$'))
            res = true;
    });
    return res;
}

LinkGeneratorClass.prototype.RequiresMonitoring = function() {
    return this.isTypeSelected('overlay-button-v1')||this.isTypeSelected('overlay-button-v2')||this.isTypeSelected('overlay-widget');
}

LinkGeneratorClass.prototype.GetElementsFromRows = function(encode){
    var objects = [];
    if(encode){
        $('#elements-list-table tr').each(function() {
            objects.push($(this).attr('data-element'));
        });
        return lz_global_base64_encode(JSON.stringify(objects));
    }
    else{
        $('#elements-list-table > tbody > tr').each(function() {
            objects.push(JSON.parse(lz_global_base64_url_decode($(this).attr('data-element'))));
        });
        return objects;
    }
}

LinkGeneratorClass.prototype.Preview = function(){
    this.SaveCodeToServer(true,false,false);
}

LinkGeneratorClass.prototype.SaveCodeToServer = function(preview,openLinkGenerator,askForName){
    var that = this;
    var data = {};
    data.p_cc_c = that.GetCode();
    data.p_cc_e = (preview) ? '' : that.GetElementsFromRows(true);
    data.p_cc_t = (preview) ? '0' : '1';

    if(that.m_CurrentCodeId==null)
        that.m_CurrentCodeId = lzm_commonTools.guid();

    if(!preview)
        data.p_cc_i = that.m_CurrentCodeId;

    if(preview){
        that.SetLoading(true);
        lzm_chatPollServer.pollServerDiscrete('create_code',data).done(function(data) {
            that.SetLoading(false);
            var xmlDoc = $.parseXML(data);
            $(xmlDoc).find('code').each(function(){
                var cid = lz_global_base64_decode($(this).attr('id'));
                var purl = lzm_chatPollServer.chosenProfile.server_protocol + lzm_chatPollServer.chosenProfile.server_url + '/preview.php?id=' + cid;
                openLink(purl);
            });
        }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);that.SetLoading(false);});
    }
    else{

        if(askForName){

            var nameHtml = lzm_inputControls.createInput('template-name','','',t('Name'),'','text','');
            lzm_commonDialog.createAlertDialog(nameHtml, [{id: 'ok', name: t('Save')},  {id: 'cancel', name: t('Cancel')}]);
            if(that.m_CurrentCodeName != null)
                $('#template-name').val(that.m_CurrentCodeName);
            else
                $('#template-name').val("My Code");

            $('#alert-btn-ok').click(function() {
                that.m_CurrentCodeName = data.p_cc_n = $('#template-name').val();
                lzm_commonDialog.removeAlertDialog();
                that.UploadCodeToServer(data);
                if(openLinkGenerator)
                    that.ShowLinkGeneratorCode();
            });
            $('#alert-btn-cancel').click(function() {
                lzm_commonDialog.removeAlertDialog();
            });
            $('#template-name').focus();
        }
        else{
            data.p_cc_n = that.m_CurrentCodeName;
            that.UploadCodeToServer(data);
        }
    }
}

LinkGeneratorClass.prototype.UploadCodeToServer = function(data){
    var that = this;
    that.SetLoading(true);
    lzm_chatPollServer.pollServerDiscrete('create_code',data).done(function(data) {
        that.SetLoading(false);
    }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);that.SetLoading(false);});
}

LinkGeneratorClass.prototype.SetLoading = function(loading){
    if(loading){
        $('#lz_link_generator_load').css({display:'block'});
        $('#elements-list-table').css({display:'none'});
    }
    else{
        $('#lz_link_generator_load').css({display:'none'});
        $('#elements-list-table').css({display:'table'});
    }
}

LinkGeneratorClass.prototype.LoadCodesFromServer = function(){
    var that = this;

    that.SetLoading(true);
    lzm_chatPollServer.pollServerDiscrete('get_code_list',null).done(function(data) {
        var xmlDoc = $.parseXML(data);
        var codes = [];
        var count = 0;
        $(xmlDoc).find('code').each(function(){
            count++;
            var cname = lz_global_base64_decode($(this).attr('n'));
            var ccreate = lz_global_base64_decode($(this).attr('t'));
            ccreate = '['+ lzm_commonTools.getHumanDate(lzm_chatTimeStamp.getLocalTimeObject(ccreate * 1000, true), '', lzm_chatDisplay.userLanguage)+']  ';
            codes.push({value: lz_global_base64_encode(JSON.stringify([$(this).text(),$(this).attr('i')])), text: cname});
        });
        var listHtml = '<div><label>'+t('Load')+'</label></div>'+lzm_inputControls.createSelect('server-codes','','','','','text','',codes,'','');
        that.SetLoading(false);
        lzm_commonDialog.createAlertDialog(listHtml, [{id: 'ok', name: t('Load')}, {id: 'delete', name: t('Delete')}, {id: 'cancel', name: t('Cancel')}]);

        if(count==0){
            $('#alert-btn-delete').addClass('ui-disabled');
            $('#alert-btn-ok').addClass('ui-disabled');
        }
        $('#server-codes').prop('selectedIndex',0);
        $('#alert-btn-ok').click(function() {
            $('#elements-list-table > tbody').empty();

            var valueObj = JSON.parse(lz_global_base64_decode($('#server-codes').val()))[0];
            var objectList = JSON.parse(lz_global_base64_decode(valueObj));
            for (var item in objectList){
                var obj = JSON.parse(lz_global_base64_decode(objectList[item]));
                var element = new LinkGeneratorElement(obj.m_Type,obj);
                that.AddElementRow(element.GetRow());
            }
            that.m_CurrentCodeName = $('#server-codes').text();
            that.m_CurrentCodeId = lz_global_base64_decode(JSON.parse(lz_global_base64_decode($('#server-codes').val()))[1]);
            that.ValidateButtons();
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-cancel').click(function() {
            lzm_commonDialog.removeAlertDialog();
        });
        $('#alert-btn-delete').click(function() {
            lzm_chatPollServer.pollServerDiscrete('delete_code',{p_cc_c: lz_global_base64_decode( JSON.parse(lz_global_base64_decode($('#server-codes').val()))[1] )});
            lzm_commonDialog.removeAlertDialog();
        });
    }).fail(function(jqXHR, textStatus, errorThrown){that.SetLoading(false);alert(textStatus);});
}

LinkGeneratorClass.prototype.AddElementRow = function(row){
    $('#elements-list-table > tbody').append(row);
    this.SortTable();
}

LinkGeneratorClass.prototype.SortTable = function(){
    var $table=$('#elements-list-table');
    var rows = $table.find('tr').get();
    rows.sort(function(a, b) {
        var keyA = $(a).attr('id');
        var keyB = $(b).attr('id');
        if (keyA > keyB) return 1;
        if (keyA < keyB) return -1;
        return 0;
    });
    $.each(rows, function(index, row) {
        $table.children('tbody').append(row);
    });
}

LinkGeneratorClass.prototype.ShowLinkGeneratorCode = function(){

    var that = this;
    if(this.m_CurrentCodeName==null){
        this.SaveCodeToServer(false,true,true);
        return;
    }
    else
        this.SaveCodeToServer(false,true,false);

    var codeHtml = '<div style="max-width:500px;padding-top:10px;">'+lzm_inputControls.createArea('livezilla-code',this.GetCodeWrapper(),'',tid('code_title'),'height:120px;width:100%;font-size:11px;font-family:Monospace;','autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"');
    codeHtml += lzm_inputControls.createRadio('code-type-dynamic', 'top-space', 'code-type', '<b>Dynamic Code</b>', true);
    codeHtml += '<div class="left-space-child bottom-space lzm-info-text">'+tid('code_dynamic')+'</div>';
    codeHtml += lzm_inputControls.createRadio('code-type-static', '', 'code-type', '<b>Static Code</b>', false);
    codeHtml += '<div class="left-space-child lzm-info-text">'+tid('code_static')+'</div></div>';

    lzm_commonDialog.createAlertDialog(codeHtml, [{id: 'copy', name: tid('copy')}, {id: 'close', name: tid('close')}],true,true,false);
    $('#livezilla-code').click(function() {this.select();});
    $('#alert-btn-copy').click(function() {
        if(!lzm_chatDisplay.isMobile)
        {
            var $temp = $("<input>")
            $("body").append($temp);
            $temp.val($('#livezilla-code').text()).select();
            document.execCommand("copy");
            $temp.remove();
            lzm_commonDialog.removeAlertDialog();
        }
    });
    $('#alert-btn-close').click(function() {
        lzm_commonDialog.removeAlertDialog();
    });

    $('.code-type').change(function() {
        if(!$('#code-type-static').attr('checked'))
            $('#livezilla-code').text(that.GetCodeWrapper());
        else
            $('#livezilla-code').text(that.GetCode());
    });
}

LinkGeneratorClass.prototype.SettleStaticFields = function(from,to){
    for(i=0;i<to.length;i++){
        var exEleme = new LinkGeneratorElement(to[i].m_Type,to[i]);
        exEleme.LoadSettings(from.m_Settings,true);
        $('#'+exEleme.GetLineId()).replaceWith(exEleme.GetRow());
    }
}

LinkGeneratorClass.prototype.GetCodeWrapper = function(){
    return '<!-- livezilla.net code --><script type="text/javascript" id="' + this.m_CurrentCodeId +'" src="'+lzm_chatServerEvaluation.getServerUrl('script.php')+'?id=' + this.m_CurrentCodeId +'"></script><!-- http://www.livezilla.net -->';
}

LinkGeneratorClass.prototype.GetCode = function(){
    var code = '', code_elem = '';
    var elements = [];

    elements['inlay-image'] = this.GetElement('inlay-image');
    elements['inlay-text'] =  this.GetElement('inlay-text');
    elements['monitoring'] =  this.GetElement('monitoring');
    elements['overlay-button-v1'] = this.GetElement('overlay-button-v1');
    elements['overlay-button-v2'] = this.GetElement('overlay-button-v2');
    elements['overlay-widget'] = this.GetElement('overlay-widget');
    elements['no-tracking'] = this.GetElement('no-tracking');

    if(this.isTypeSelected('monitoring')){
        code_elem = '<div id="livezilla_tracking" style="display:none"></div><script id="lz_r_scr" type="text/javascript">var script = document.createElement("script");script.async=true;script.type="text/javascript";var src = "<!--server--><!--addition_track-->"+Math.random();script.src=src;document.getElementById(\'livezilla_tracking\').appendChild(script);</script><noscript><img src="<!--server-->&quest;rqst=track&amp;output=nojcrpt" width="0" height="0" style="visibility:hidden;" alt=""></noscript>';
        code_elem = code_elem.replace(/<!--addition_track-->/g,'?rqst=track&output=jcrpt' + this.GetCodeParameters('monitoring',elements['monitoring'],'&') + '&nse=');
        code += code_elem;
    }
    if(this.isTypeSelected('inlay-image')){
        code += '<a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img src="<!--server_image-->?id=<!--image_set-->&type=inlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a>';
        code = code.replace(/<!--class-->/g,'lz_cbl');
        code = code.replace(/<!--image_set-->/, elements['inlay-image'].GetProperty('m_SelectedImageSet').value);
        code = code.replace(/<!--image_set_width-->/, elements['inlay-image'].GetProperty('m_SelectedImageWidth').value);
        code = code.replace(/<!--image_set_height-->/, elements['inlay-image'].GetProperty('m_SelectedImageHeight').value);
        code = code.replace(/<!--addition-->/g,this.GetCodeParameters('inlay-image',elements['inlay-image']));
    }
    if(this.isTypeSelected('overlay-button-v1')){
        code += '<!--hide_element_open--><a href="javascript:void(window.open(\'<!--server_chat--><!--addition-->\',\'\',\'width=<!--width-->,height=<!--height-->,left=0,top=0,resizable=yes,menubar=no,location=no,status=yes,scrollbars=yes\'))" class="<!--class-->"><img <!--img_id-->src="<!--server_image-->?id=<!--image_set-->&type=overlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a><!--hide_element_close-->';
        code = code.replace(/<!--image_set-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageSet').value);
        code = code.replace(/<!--image_set_width-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageWidth').value);
        code = code.replace(/<!--image_set_height-->/, elements['overlay-button-v1'].GetProperty('m_SelectedImageHeight').value);
        code = code.replace(/<!--addition-->/g,this.GetCodeParameters('overlay-button-v1',elements['overlay-button-v1']));
    }
    else if(this.isTypeSelected('overlay-button-v2')){
        code += '<!--hide_element_open--><a href="javascript:lz_tracking_init_floating_button_selector(new Array(<!--selector_params-->));" class="<!--class-->"><img <!--img_id-->src="<!--server_image-->?id=<!--image_set-->&type=overlay" width="<!--image_set_width-->" height="<!--image_set_height-->" style="border:0px;" alt="LiveZilla Live Chat Software"></a><!--hide_element_close-->';
        code = code.replace(/<!--image_set-->/, elements['overlay-button-v2'].GetProperty('m_SelectedImageSet').value);
        code = code.replace(/<!--image_set_width-->/, elements['overlay-button-v2'].GetProperty('m_SelectedImageWidth').value);
        code = code.replace(/<!--image_set_height-->/, elements['overlay-button-v2'].GetProperty('m_SelectedImageHeight').value);

        var e = elements['overlay-button-v2'];
        var selectorParams = "";
        selectorParams += (e.GetProperty('m_LiveChats').value) ? 'true' : 'false';
        selectorParams += "," + ((e.GetProperty('m_PhoneInbound').value) ? 'true' : 'false');
        selectorParams += ",'" + ((e.GetProperty('m_PhoneInbound').value) ? lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundNumber').value) : lz_global_base64_url_encode(''))+"'";
        selectorParams += ",'" + ((e.GetProperty('m_PhoneInbound').value) ? lz_global_base64_url_encode(e.GetProperty('m_PhoneInboundText').value) : lz_global_base64_url_encode("")) + "'";
        selectorParams += "," + ((e.GetProperty('m_PhoneOutbound').value) ? 'true' : 'false');
        selectorParams += "," + ((e.GetProperty('m_CreateTicket').value) ? 'true' : 'false');
        selectorParams += "," + ((e.GetProperty('m_Knowledgebase').value) ? 'true' : 'false');
        selectorParams += ",'" + ((e.GetProperty('m_SocialMediaFacebook').value && e.GetProperty('m_SocialMediaFacebookURL').value.length > 0) ? lz_global_base64_url_encode(e.GetProperty('m_SocialMediaFacebookURL').value) : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'" + ((e.GetProperty('m_SocialMediaTwitter').value && e.GetProperty('m_SocialMediaTwitterURL').value.length > 0) ? lz_global_base64_url_encode(e.GetProperty('m_SocialMediaTwitterURL').value) : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'" + ((e.GetProperty('m_SocialMediaGoogle').value && e.GetProperty('m_SocialMediaGoogleURL').value.length > 0) ? lz_global_base64_url_encode(e.GetProperty('m_SocialMediaGoogleURL').value) : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'" + ((e.GetProperty('m_CustomLink1').value && e.GetProperty('m_CustomLinkTitle1').value.length > 0 && e.GetProperty('m_CustomLinkURL1').value.length > 0) ? lz_global_base64_url_encode("<a href=\"" + e.GetProperty('m_CustomLinkURL1').value + "\">" + e.GetProperty('m_CustomLinkTitle1').value + "</a>") : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'" + ((e.GetProperty('m_CustomLink2').value && e.GetProperty('m_CustomLinkTitle2').value.length > 0 && e.GetProperty('m_CustomLinkURL2').value.length > 0) ? lz_global_base64_url_encode("<a href=\"" + e.GetProperty('m_CustomLinkURL2').value + "\">" + e.GetProperty('m_CustomLinkTitle2').value + "</a>") : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'" + ((e.GetProperty('m_CustomLink3').value && e.GetProperty('m_CustomLinkTitle3').value.length > 0 && e.GetProperty('m_CustomLinkURL3').value.length > 0) ? lz_global_base64_url_encode("<a href=\"" + e.GetProperty('m_CustomLinkURL3').value + "\">" + e.GetProperty('m_CustomLinkTitle3').value + "</a>") : lz_global_base64_url_encode("")) + "'";
        selectorParams += ",'"+lz_global_base64_url_encode(e.GetProperty('m_AdditionalHTML').value)+"'";
        selectorParams += ",'<!--addition-->'";
        code = code.replace(/<!--selector_params-->/, selectorParams);
        code = code.replace(/<!--addition-->/g,this.GetCodeParameters('overlay-button-v2',e,'&'));
    }
    if(this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2')){
        code = code.replace(/<!--img_id-->/g,'id="chat_button_image" ');
        code = code.replace(/<!--hide_element_open-->/g,'<div style=\"display:none;\">');
        code = code.replace(/<!--hide_element_close-->/g,'</div>');
        code = code.replace(/<!--class-->/g,'lz_fl');
    }
    if(this.isTypeSelected('inlay-text')){
        code += '<script type="text/javascript" id="lz_textlink" src="<!--server_image--><!--values-->"></script>';
        var values = "?tl=1&srv=" + lz_global_base64_encode(lzm_chatServerEvaluation.getServerUrl('chat.php') + this.GetCodeParameters('inlay-text',elements['inlay-text']));
        if(elements['inlay-text'].GetProperty('m_TextOnline').value.length>0)values += "&tlont=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_TextOnline').value);
        if(elements['inlay-text'].GetProperty('m_TextOffline').value.length>0)values += "&tloft=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_TextOffline').value);
        if(elements['inlay-text'].GetProperty('m_CSSStyleOnline').value.length>0)values += "&tlons=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_CSSStyleOnline').value);
        if(elements['inlay-text'].GetProperty('m_CSSStyleOffline').value.length>0)values += "&tlofs=" + lz_global_base64_url_encode(elements['inlay-text'].GetProperty('m_CSSStyleOffline').value);
        if(elements['inlay-text'].GetProperty('m_OnlineOnly').value)values += "&tloo=" + lz_global_base64_url_encode(1);
        values += this.GetCodeParameters('inlay-text',elements['inlay-text'],'&');
        code = code.replace(/<!--values-->/g,values);
    }
    if(this.isTypeSelected('no-tracking')){
        code += '<a onclick="lz_tracking_deactivate(\'<!--confirmation-->\',<!--days-->)" href="javascript:void(0);"><!--title--></a>';
        code = code.replace(/<!--confirmation-->/g,elements['no-tracking'].GetProperty('m_OptOutTrackingConfirmation').value);
        code = code.replace(/<!--title-->/g,elements['no-tracking'].GetProperty('m_OptOutTrackingTitle').value);
        code = code.replace(/<!--days-->/g,elements['no-tracking'].GetProperty('m_OptOutTrackingTime').value);
    }

    code = code.replace(/<!--c-->/g,'');
    code = code.replace(/<!--width-->/g,lzm_chatServerEvaluation.getConfigValue('wcl_window_width'));
    code = code.replace(/<!--height-->/g,lzm_chatServerEvaluation.getConfigValue('wcl_window_height'));
    code = code.replace(/<!--hide_element_open-->/g,'');
    code = code.replace(/<!--hide_element_close-->/g,'');
    code = code.replace(/<!--img_id-->/g,'');
    code = code.replace(/<!--addition-->/g,'');
    code = code.replace(/<!--server_image-->/g, lzm_chatServerEvaluation.getServerUrl('image.php'));
    code = code.replace(/<!--server_chat-->/g,lzm_chatServerEvaluation.getServerUrl('chat.php'));
    code = code.replace(/<!--server-->/g,lzm_chatServerEvaluation.getServerUrl('server.php'));
    return '<!-- livezilla.net PLACE IN BODY -->'+code+'<!-- http://www.livezilla.net -->';
}

LinkGeneratorClass.prototype.GetCodeParameters = function(type,element,bind){
    var parameters = '';
    var defElem = new LinkGeneratorElement(type);
    var speElem = null;

    bind = (typeof bind == 'undefined') ? '?' : bind;

    if(element.GetProperty('m_TargetOperator').value){
        parameters += bind + "intid=" + lz_global_base64_url_encode(element.GetProperty('m_TargetOperatorId').value);
        bind = '&';
    }

    if(element.GetProperty('m_TargetGroup').value){
        parameters += bind + "intgroup=" + lz_global_base64_url_encode(element.GetProperty('m_TargetGroupId').value);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroups').value){
        if(element.GetProperty('m_HideAllOtherGroups').value){
            parameters += bind + "hg=" + lz_global_base64_url_encode('?');
            bind = '&';
        }
        else{
            var groups = lzm_chatServerEvaluation.groups.getGroupList('id',true,false);
            var hgroups = '';
            for (i=0; i<groups.length; i++)
                if(element.GetProperty('m_HideGroup' + md5(groups[i].id)).value)
                    hgroups += lz_global_base64_url_encode('?' + groups[i].id);
            parameters += bind + "hg=" + lz_global_base64_url_encode(hgroups);
            bind = '&';
        }
    }

    if(element.GetProperty('m_FieldArea').value.length > 0){
        parameters += bind + "code=" + ((element.GetProperty('m_FieldArea').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_FieldArea').value) : element.GetProperty('m_FieldArea').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field111').value.length > 0){
        parameters += bind + "en=" + ((element.GetProperty('m_Field111').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field111').value) : element.GetProperty('m_Field111').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field112').value.length > 0){
        parameters += bind + "ee=" + ((element.GetProperty('m_Field112').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field112').value) : element.GetProperty('m_Field112').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field113').value.length > 0){
        parameters += bind + "ec=" + ((element.GetProperty('m_Field113').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field113').value) : element.GetProperty('m_Field113').value);
        bind = '&';
    }

    if(element.GetProperty('m_LanguageSelect').value){
        parameters += bind + "el=" + lz_global_base64_url_encode(element.GetProperty('m_Language').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field114').value.length > 0){
        parameters += bind + "eq=" + ((element.GetProperty('m_Field114').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field114').value) : element.GetProperty('m_Field114').value);
        bind = '&';
    }

    if(element.GetProperty('m_Field116').value.length > 0){
        parameters += bind + "ep=" + ((element.GetProperty('m_Field116').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_Field116').value) : element.GetProperty('m_Field116').value);
        bind = '&';
    }

    if(element.GetProperty('m_FieldLogoURL').value.length > 0){
        parameters += bind + "eh=" + ((element.GetProperty('m_FieldLogoURL').value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_FieldLogoURL').value) : element.GetProperty('m_FieldLogoURL').value);
        bind = '&';
    }

    for (i=0; i<10; i++)
        if(element.GetProperty('m_CustomField' + i).value.length > 0){
            parameters += bind + 'cf'+i+'=' + ((element.GetProperty('m_CustomField' + i).value.indexOf(LinkGeneratorClass.DataPassThruPlaceholder)!=0) ? lz_global_base64_url_encode(element.GetProperty('m_CustomField' + i).value) : element.GetProperty('m_CustomField' + i).value);
            bind = '&';
        }

    if(element.GetProperty('m_ChatStartsInstantly').value){
        parameters += bind + "dl=" + lz_global_base64_url_encode(1);
        bind = '&';
    }
    else if(element.GetProperty('m_Field111').value.length>0){
        parameters += bind + "mp=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroupSelectionChats').value){
        parameters += bind + "hcgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_HideGroupSelectionTickets').value){
        parameters += bind + "htgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_GroupSelectionPosition').value==1){
        parameters += bind + "grot=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_ForceGroupSelection').value){
        parameters += bind + "rgs=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_NoChatInvites').value){
        parameters += bind + "hinv=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_PhoneOutbound').value){
        parameters += bind + "ofc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_CreateTicket').value){
        parameters += bind + "nct=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(!element.GetProperty('m_LiveChats').value){
        parameters += bind + "hfc=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_LiveChatsGroup').value && !this.isTypeSelected('overlay-widget')){
        parameters += bind + "edg=" + lz_global_base64_url_encode(element.GetProperty('m_LiveChatsGroupId').value);
        bind = '&';
    }

    if(!element.GetProperty('m_Knowledgebase').value){
        parameters += bind + "hfk=" + lz_global_base64_url_encode(1);
        bind = '&';
    }

    if(element.GetProperty('m_Knowledgebase').value && element.GetProperty('m_KnowledgebaseCustomRoot').value && element.GetProperty('m_KnowledgebaseCustomRootFolder').value){
        parameters += bind + "ckf=" + lz_global_base64_url_encode(lz_global_trim(element.GetProperty('m_KnowledgebaseCustomRootFolder').value));
        bind = '&';
    }

    if(type != 'monitoring' || this.isTypeSelected('overlay-button-v2')){
        speElem = element;
        if(defElem.GetProperty('m_PrimaryColor').value != speElem.GetProperty('m_PrimaryColor').value){
            parameters += bind + "epc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
            bind = '&';
        }
        if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value){
            parameters += bind + "etc=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);
            bind = '&';
        }
    }
    if(type == 'monitoring' && this.isTypeSelected('inlay-image')){
        speElem = this.GetElement('inlay-image');
        if(speElem.GetProperty('m_OnlineOnly').value){
            parameters += bind + "cboo=" + lz_global_base64_url_encode(1);
            bind = '&';
        }
    }
    if(type == 'monitoring' && (this.isTypeSelected('overlay-button-v1') || this.isTypeSelected('overlay-button-v2'))){

        if(this.isTypeSelected('overlay-button-v1'))
            speElem = this.GetElement('overlay-button-v1');
        else
            speElem = this.GetElement('overlay-button-v2');

        parameters += bind + "fbpos=" + (this.GetPositionIndex(speElem.GetProperty('m_Position').value));
        bind = '&';
        parameters += bind + "fbw=" + (speElem.GetProperty('m_SelectedImageWidth').value);
        parameters += bind + "fbh=" + (speElem.GetProperty('m_SelectedImageHeight').value);

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "fbml=" + (speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "fbmt=" + (speElem.GetProperty('m_MarginTop').value);
        if(speElem.GetProperty('m_MarginRight').value>0)parameters += bind + "fbmr=" + (speElem.GetProperty('m_MarginRight').value);
        if(speElem.GetProperty('m_MarginBottom').value>0)parameters += bind + "fbmb=" + (speElem.GetProperty('m_MarginBottom').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "fbshx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "fbshy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "fbshc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "fbshb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        if(speElem.GetProperty('m_OnlineOnly').value)parameters += bind + "fboo=" + lz_global_base64_url_encode(1);

    }
    if(type == 'monitoring' && this.isTypeSelected('overlay-widget')){
        speElem = this.GetElement('overlay-widget');

        parameters += bind + "ovlc=" + lz_global_base64_url_encode(speElem.GetProperty('m_PrimaryColor').value);
        bind = '&';

        if(defElem.GetProperty('m_SecondaryColor').value != speElem.GetProperty('m_SecondaryColor').value)
            parameters += bind + "ovlct=" + lz_global_base64_url_encode(speElem.GetProperty('m_SecondaryColor').value);

        if(!speElem.GetProperty('m_HeaderTextShadow').value)
            parameters += bind + "ovlts=" + lz_global_base64_url_encode('0');

        if(this.GetPositionIndex(speElem.GetProperty('m_Position').value) != '22')
            parameters += bind + "ovlp=" + lz_global_base64_url_encode(this.GetPositionIndex(speElem.GetProperty('m_Position').value));

        if(speElem.GetProperty('m_MarginLeft').value>0)parameters += bind + "ovlml=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginLeft').value);
        if(speElem.GetProperty('m_MarginTop').value>0)parameters += bind + "ovlmt=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginTop').value);
        if(speElem.GetProperty('m_MarginRight').value>0)parameters += bind + "ovlmr=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginRight').value);
        if(speElem.GetProperty('m_MarginBottom').value>0)parameters += bind + "ovlmb=" + lz_global_base64_url_encode(speElem.GetProperty('m_MarginBottom').value);

        if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
            parameters += bind + "ovlt=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOnline').value);
        if(!speElem.GetProperty('m_TextDefault').value && speElem.GetProperty('m_TextOnline').value.length > 0)
            parameters += bind + "ovlto=" + lz_global_base64_url_encode(speElem.GetProperty('m_TextOffline').value);

        if(speElem.GetProperty('m_UseShadow').value){
            if(speElem.GetProperty('m_PositionX').value>0)parameters += bind + "ovlsx=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionX').value);
            if(speElem.GetProperty('m_PositionY').value>0)parameters += bind + "ovlsy=" + lz_global_base64_url_encode(speElem.GetProperty('m_PositionY').value);
            if(speElem.GetProperty('m_ShadowColor').value!='#000000')parameters += bind + "ovlsc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ShadowColor').value);
            if(speElem.GetProperty('m_Blur').value>0)parameters += bind + "ovlsb=" + lz_global_base64_url_encode(speElem.GetProperty('m_Blur').value);
        }

        if(speElem.GetProperty('m_OnlineOnly').value)
            parameters += bind + "ovloo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_ShowOnlyWhenInvited').value)
            parameters += bind + "ovlio=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_OpenExternalWindow').value)
            parameters += bind + "ovloe=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TouchDevicesPhone').value)
            parameters += bind + "hots=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TouchDevicesTablet').value)
            parameters += bind + "hott=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PhoneExternal').value)
            parameters += bind + "oets=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_TabletExternal').value)
            parameters += bind + "oett=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_PopOut').value)
            parameters += bind + "ovlapo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_LeaveMessageWhenOnline').value)
            parameters += bind + "ovltwo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_LeaveMessageWhenOnline').value)
            parameters += bind + "ovltwo=" + lz_global_base64_url_encode('1');

        if(speElem.GetProperty('m_BorderRadius').value != 6)
            parameters += bind + "ovlbr=" + lz_global_base64_url_encode(speElem.GetProperty('m_BorderRadius').value);

        if(!speElem.GetProperty('m_DimensionsAuto').value){
            parameters += bind + "ovlw=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsWidth').value);
            parameters += bind + "ovlh=" + lz_global_base64_url_encode(speElem.GetProperty('m_DimensionsHeight').value);
        }

        if(speElem.GetProperty('m_ECUse').value){

            parameters += bind + "eca=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECTypeOptions').value);

            if(speElem.GetProperty('m_ECWidthAuto').value)
                parameters += bind + "ecw=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECWidth').value);

            if(speElem.GetProperty('m_ECHeightAuto').value)
                parameters += bind + "ech=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECHeight').value);

            if(speElem.GetProperty('m_ECMarginBottom').value != 29)
                parameters += bind + "ecmb=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECMarginBottom').value);

            if(speElem.GetProperty('m_ECFadeIn').value && speElem.GetProperty('m_ECFadeInTime').value > 0)
                parameters += bind + "ecfi=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECFadeInTime').value);

            if(speElem.GetProperty('m_ECFadeOut').value && speElem.GetProperty('m_ECFadeOutTime').value > 0)
                parameters += bind + "ecfo=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECFadeOutTime').value);

            if(speElem.GetProperty('m_ECHideOnPhone').value)
                parameters += bind + "echm=" + lz_global_base64_url_encode('1');

            if(speElem.GetProperty('m_ECTypeOptions').value == 1){

                if(!speElem.GetProperty('m_ECBubbleTitleDefault').value){
                    parameters += bind + "echt=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleTitleOnline').value);
                    parameters += bind + "ecoht=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleTitleOffline').value);
                }

                if(!speElem.GetProperty('m_ECBubbleSubTitleDefault').value){
                    parameters += bind + "echst=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleSubTitleOnline').value);
                    parameters += bind + "ecohst=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleSubTitleOffline').value);
                }

                if(defElem.GetProperty('m_ECBubbleColorBGStart').value != speElem.GetProperty('m_ECBubbleColorBGStart').value)
                    parameters += bind + "ecfs=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleColorBGStart').value);

                if(defElem.GetProperty('m_ECBubbleColorBGEnd').value != speElem.GetProperty('m_ECBubbleColorBGEnd').value)
                    parameters += bind + "ecfe=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleColorBGEnd').value);

                if(defElem.GetProperty('m_ECBubbleTextColor').value != speElem.GetProperty('m_ECBubbleTextColor').value)
                    parameters += bind + "echc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleTextColor').value);

                if(speElem.GetProperty('m_ECBubbleBorderWidth').value != 2)
                    parameters += bind + "ecslw=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderWidth').value);

                if(defElem.GetProperty('m_ECBubbleBorderColorStart').value != speElem.GetProperty('m_ECBubbleBorderColorStart').value)
                    parameters += bind + "ecsgs=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderColorStart').value);

                if(defElem.GetProperty('m_ECBubbleBorderColorEnd').value != speElem.GetProperty('m_ECBubbleBorderColorEnd').value)
                    parameters += bind + "ecsge=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleBorderColorEnd').value);

                if(speElem.GetProperty('m_ECBubbleShadowUse').value){
                    parameters += bind + "ecsa=" + lz_global_base64_url_encode('1');
                    parameters += bind + "ecsb=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowBlur').value);
                    parameters += bind + "ecsx=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowX').value);
                    parameters += bind + "ecsy=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowY').value);

                    if(defElem.GetProperty('m_ECBubbleShadowColor').value != speElem.GetProperty('m_ECBubbleShadowColor').value)
                        parameters += bind + "ecsc=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECBubbleShadowColor').value);
                }

                if(speElem.GetProperty('m_ECPersonalize').value)
                    parameters += bind + "ecsp=" + lz_global_base64_url_encode('1');

            }
            else{
                parameters += bind + "eci=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECImageURLOnline').value);
                parameters += bind + "ecio=" + lz_global_base64_url_encode(speElem.GetProperty('m_ECImageURLOffline').value);
            }
        }
    }


    return parameters;
}

LinkGeneratorClass.prototype.GetPositionIndex = function(pos){
    pos = pos.replace('left','0');
    pos = pos.replace('center','1');
    pos = pos.replace('right','2');
    pos = pos.replace('top','0');
    pos = pos.replace('middle','1');
    pos = pos.replace('bottom','2');
    return pos.replace(' ','').split("").reverse().join("");
};

LinkGeneratorClass.prototype.LoadImageSets = function(type){
    var that = this;
    $('#image-sets-list-table tbody').empty();
    that.m_MaxImageSetId = 0;
    lzm_chatPollServer.pollServerDiscrete('get_banner_list').done(function(data) {
        var xmlDoc = $.parseXML(data);
        var offlineButton, onlineButton = null;
        var toSelectIndex = 0, cindex = 0;
        $(xmlDoc).find('button').each(function(){
            var buttonxml = $(this);
            var button = {imagetype: lz_global_base64_decode(buttonxml.attr('t')), type:lz_global_base64_decode(buttonxml.attr('type')),name:lz_global_base64_decode(buttonxml.attr('name')),data:lz_global_base64_decode(buttonxml.attr('data'))};
            if((type.indexOf('inlay') != -1 && button.name.indexOf('inlay') == -1) || (type.indexOf('overlay') != -1 && button.name.indexOf('overlay') == -1))
                return true;
            var dataId = lz_global_base64_decode(buttonxml.attr('id'));
            that.m_MaxImageSetId = Math.max(that.m_MaxImageSetId,dataId);
            if(lz_global_base64_decode(buttonxml.attr('o'))==0){
                offlineButton = button;
                var id = md5(onlineButton.name);
                var buttonName = lz_global_base64_decode(buttonxml.attr('type')) + " " + lz_global_base64_decode(buttonxml.attr('id'));
                $('#image-sets-list-table > tbody').append('<tr id="'+id+'" data-id="'+dataId+'" data-width="0" data-height="0" data-button="'+lz_global_base64_url_encode(JSON.stringify([onlineButton,offlineButton]))+'" onclick="selectLinkGeneratorImage(\'' +id+ '\');" class="image-sets-list-line"><td class="element-list-line-icon"><i class="fa fa-image"></i></td><td>'+buttonName+'</td></tr>');

                var img = new Image();
                img.onload = function(){
                    $('#' + id).attr('data-width',this.width);
                    $('#' + id).attr('data-height',this.height);
                    $('tr','#image-sets-list-table > tbody').eq(toSelectIndex).click();
                };
                img.src = 'data:image/'+button.imagetype+';base64,' + onlineButton.data;


                if(dataId == $('#m_SelectedImageSet').val())
                    toSelectIndex = cindex;
                cindex++;
            }
            else{
                onlineButton = button;
            }
        });
    }).fail(function(jqXHR, textStatus, errorThrown){alert(textStatus);});
}


function LinkGeneratorElement(_type,_cloneObj) {
    var al = lzm_commonTools.clone(window.parent.lzm_chatDisplay.availableLanguages);
    var hiddenGroupList = [], routingOpArray = [], routingGrArray = [], dynGroupArray = [], langArray = [], langCodeArray = Object.keys(al);
    for (i=0; i<langCodeArray.length; i++)
        langArray.push({value: langCodeArray[i], text: langCodeArray[i].toUpperCase() + ' - ' + al[langCodeArray[i]]});

    for(var i=0;i<lzm_chatServerEvaluation.groups.idList.length;i++){
        var groupObj = lzm_chatServerEvaluation.groups.getGroup(lzm_chatServerEvaluation.groups.idList[i]);
        if(typeof groupObj.members != 'undefined')
            dynGroupArray.push({value: lzm_chatServerEvaluation.groups.idList[i], text: groupObj.name});
    }
    if(dynGroupArray.length==0)
        dynGroupArray.push({value: 'no_dyn_group', text: tid('no_dyn_group')});

    var operators = lzm_chatServerEvaluation.operators.getOperatorList('name','',true,false);
    for (i=0; i<operators.length; i++)
        routingOpArray.push({value: operators[i].userid, text: operators[i].name});

    var groups = lzm_chatServerEvaluation.groups.getGroupList('id',true,false);
    for (i=0; i<groups.length; i++)
    {
        routingGrArray.push({value: groups[i].id, text: groups[i].id});
        hiddenGroupList.push({name:'m_HideGroup' + md5(groups[i].id), type:'bool', class:'m_HideGroups m_HideAllOtherGroups', value: false, title: groups[i].id, left:'single'});
    }

    this.m_Icons = [];
    this.m_Icons['inlay-image']='fa fa-image';
    this.m_Icons['inlay-text']='fa fa-navicon';
    this.m_Icons['overlay-button-v1']='fa fa-arrows-v';
    this.m_Icons['overlay-button-v2']='fa fa-arrows-v';
    this.m_Icons['overlay-widget']='fa fa-square-o';
    this.m_Icons['monitoring']='fa fa-search';
    this.m_Icons['no-tracking']='fa fa-shield';

    this.m_Settings = [
        {name:'General', title: t('General'), groups: [
            {name: 'General', title: t('General'), controls: [
                {name:'m_OnlineOnly', type:'bool', value: false, title: t('Online only (hide when operators are offline)')},
                {name:'m_ShowOnlyWhenInvited', type:'bool', value: false, title: t('Invite only (hide unless there is a chat invite)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_OpenExternalWindow', type:'bool', value: false, title: t('Open external Chat Window'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_PopOut', type:'bool', value: false, title: t('Allow "Popout" (switch from on-site to off-site chat)'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']},
                {name:'m_LeaveMessageWhenOnline', type:'bool', value: false, title: t('Visitors can leave a message when operators are online'), not: ['inlay-image','inlay-text','overlay-button-v1','overlay-button-v2']}
            ], not: ['monitoring']},
            {name: 'GUILanguage', title: t('GUI Language'), controls: [
                {name:'m_LanguageAuto', type:'radio', group: 'language-select', value: true, title: t('Automatic (Browser Language)'), static: true},
                {name:'m_LanguageSelect', type:'radio', group: 'language-select', value: false, title: t('Language:'), static: true},
                {name:'m_Language', type:'array', value: 'auto', options: langArray, left: 'single', top:'half', static: true}
            ]},
            {name: 'TouchDevices', title: t('TouchDevices'), controls: [
                {name:'m_TouchDevicesPhone', type:'label', title: t('Phone')},
                {name:'m_PhoneHide', type:'bool', value:false, title: t('Hide on Smartphones')},
                {name:'m_PhoneExternal', type:'bool', value: false, title: t('Open external Chat Window')},
                {name:'m_TouchDevicesTablet', type:'label', title: t('Tablet'), top:'single'},
                {name:'m_TabletHide', type:'bool', value: false, title: t('Hide on Tablets')},
                {name:'m_TabletExternal', type:'bool', value: false, title: t('Open external Chat Window')}
            ], not: ['inlay-image','inlay-text','overlay-button-v1' ,'overlay-button-v2','monitoring']}
        ], not:['no-tracking']},
        {name:'Colors', title: t('Colors'), groups: [
            {name: 'Colors', title: t('Colors'), controls: [
                {name:'m_PrimaryColor', type:'color', value:'#73BE28', title: t('Primary Color')},
                {name:'m_SecondaryColor', type:'color', value:'#448800', title: t('Secondary Color')},
                {name:'m_HeaderTextShadow', type:'bool', value: false, title: tid('header_text_shadow'), not: ['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'monitoring' ,'no-tracking']}
            ]}
        ],not:['no-tracking']},
        {name:'Images', title: t('Images'), groups: [
            {name: 'Images', title: t('Images'), controls: [
                {name:'m_SelectedImageSet', type:'hidden', value: 0},
                {name:'m_SelectedImageWidth', type:'hidden', value: 0},
                {name:'m_SelectedImageHeight', type:'hidden', value: 0}
            ], custom: true }
        ], not:['inlay-text', 'overlay-widget' ,'monitoring' ,'no-tracking']},
        {name:'Services', title: t('Services'), groups: [
            {name: 'Live Chats', title: t('Live Chats'), controls: [
                {name:'m_LiveChats', type:'bool', value: true, title: t('Live Chats')},
                {name:'m_LiveChatsPrivate', type:'radio', group: 'live-chat-select', value: true, title: t('Private Conversation between Customer and Operator'), left: 'single'},
                {name:'m_LiveChatsGroup', type:'radio', group: 'live-chat-select', value: false, title: t('Public Conversation among all participants of the group:'), left: 'single', not:['overlay-widget']},
                {name:'m_LiveChatsGroupId', type:'array', value:'no_dyn_group', options: dynGroupArray, left: 'double', top:'half', not:['overlay-widget']}
            ]},
            {name: 'Tickets', title: t('Tickets'), controls: [
                {name:'m_CreateTicket', type:'bool', value: true, title: t('Create Ticket (Leave Message)')}
            ]},
            {name: 'Knowledgebase', title: tid('knowledgebase'), controls: [
                {name:'m_Knowledgebase', type:'bool', value: true, title: tid('knowledgebase')},
                {name:'m_KnowledgebaseMainRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: true, title: tid('knowledgebase_default_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRoot', type:'radio', class:'m_Knowledgebase', group: 'knowledgebase_root', value: false, title: tid('knowledgebase_custom_root'), left:'single', static:true},
                {name:'m_KnowledgebaseCustomRootFolder', type:'string', class:'m_Knowledgebase', value: '', title: '', left:'double', static:true}
            ]},
            {name: 'Phone', title: t('Phone'), controls: [
                {name:'m_PhoneOutbound', type:'bool', value: false, title: t('Phone Outbound (Callback Service)')},
                {name:'m_PhoneInbound', type:'bool', value: false, title: t('Phone Inbound (Hotline)'), not:['monitoring','overlay-widget','inlay-image','inlay-text','overlay-button-v1']},
                {name:'m_PhoneInboundNumber', type:'string', value: '', title: t('Phone:'), left:'single', top:'single', not:['monitoring','overlay-widget','inlay-image','inlay-text','overlay-button-v1']},
                {name:'m_PhoneInboundText', type:'string', value: '', title: t('Info Text:'), left:'single', top:'single', bottom:'single', not:['monitoring','overlay-widget','inlay-image','inlay-text','overlay-button-v1']}
            ],not:['overlay-widget']},
            {name: 'Custom Links', title: t('Custom Links'), controls: [
                {name:'m_CustomLinks', type:'bool', value: false, title: t('Custom Links')},
                {name:'m_CustomLink1', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 1"},
                {name:'m_CustomLinkTitle1', class:'m_CustomLink1', type:'string', value: '', title: t('Title')},
                {name:'m_CustomLinkURL1', class:'m_CustomLink1', type:'string', value: '', title: t('URL')},
                {name:'m_CustomLink2', class:'m_CustomLinks',type:'bool', value: false, title: t('Custom Link')+" 2"},
                {name:'m_CustomLinkTitle2',class:'m_CustomLink2', type:'string', value: '', title: t('Title')},
                {name:'m_CustomLinkURL2',class:'m_CustomLink2', type:'string', value: '', title: t('URL')},
                {name:'m_CustomLink3', class:'m_CustomLinks', type:'bool', value: false, title: t('Custom Link')+" 3"},
                {name:'m_CustomLinkTitle3',class:'m_CustomLink3', type:'string', value: '', title: t('Title')},
                {name:'m_CustomLinkURL3',class:'m_CustomLink3', type:'string', value: '', title: t('URL')}
            ], not:['overlay-widget' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true},
            {name: 'Social Media', title: t('Social Media'), controls: [
                {name:'m_SocialMedia', type:'bool', value: false, title: t('Social Media')},
                {name:'m_SocialMediaFacebook', class:'m_SocialMedia',type:'bool', value: false, title: t('Facebook')},
                {name:'m_SocialMediaFacebookURL',class:'m_SocialMediaFacebook',  type:'string', value:'', title: t('URL')},
                {name:'m_SocialMediaTwitter', class:'m_SocialMedia',type:'bool', value: false, title: t('Twitter')},
                {name:'m_SocialMediaTwitterURL', class:'m_SocialMediaTwitter', type:'string', value:'', title: t('URL')},
                {name:'m_SocialMediaGoogle', class:'m_SocialMedia',type:'bool', value: false, title: t('Google')},
                {name:'m_SocialMediaGoogleURL', class:'m_SocialMediaGoogle', type:'string', value:'', title: t('URL')}
            ], not:['overlay-widget' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1'], custom: true}
        ], not:['no-tracking']},
        {name:'Position', title: t('Position'), groups: [
            {name: 'Position', title: t('Position'), controls: [
                {name:'m_Position', type:'position', value:'left middle', title: t('')}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking']},
        {name:'Margin', title: t('Margin'), groups: [
            {name: 'Margin', title: t('Margin'), controls: [
                {name:'m_MarginTop', type:'int', value:0, title: t('Top:')},
                {name:'m_MarginRight', type:'int', value:0, title: t('Right:'), top: 'single'},
                {name:'m_MarginBottom', type:'int', value:0, title: t('Bottom:'), top: 'single'},
                {name:'m_MarginLeft', type:'int', value:0, title: t('Left:'), top: 'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking']},
        {name:'Shadow', title: t('Shadow'), groups: [
            {name: 'Shadow', title: t('Shadow'), controls: [
                {name:'m_UseShadow', type:'bool', value: false, title: t('Shadow')},
                {name:'m_ShadowColor', type:'color', class:'m_UseShadow', value:'#696969', title: t('Color:'), left:'single', top: 'single'},
                {name:'m_PositionX', type:'int', class:'m_UseShadow', value: 0, title: t('X-Position'), left:'single'},
                {name:'m_PositionY', type:'int', class:'m_UseShadow', value: 0, title: t('Y-Position:'), left:'single', top: 'single'},
                {name:'m_Blur', type:'int', class:'m_UseShadow', value: 0, title: t('Blur:'), left:'single', top: 'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'monitoring' ,'no-tracking']},
        {name:'Texts', title: tid('texts'), groups: [
            {name: 'Texts', title: tid('texts'), controls: [
                {name:'m_TextDefault', type:'bool', value: true, title: t('Use Default')},
                {name:'m_TextOnline', type:'string', value: tid('inlay_text_online'), title: tid('online'), left: 'single', top: 'single'},
                {name:'m_TextOffline', type:'string', value: tid('inlay_text_offline'), title: tid('offline'), top: 'single', bottom: 'single', left: 'single'}
            ]},
            {name: 'Texts', title: tid('css'), controls: [
                {name:'m_CSSStyleOnline', type:'string', value: '', title: tid('css_style_online')},
                {name:'m_CSSStyleOffline', type:'string', value: '', title: tid('css_style_offline'), top: 'single'}
            ], not:['overlay-widget']}
        ], not:['inlay-image','monitoring','overlay-button-v1','overlay-button-v2','no-tracking']},
        {name:'Script', title: t('Script'), groups: [
            {name: 'Script', title: t('Script'), controls: [
                {name:'m_AdditionalHTML', type:'area', value:'', title: t('Custom HTML:')}
            ]}
        ],not:['overlay-widget' ,'monitoring', 'inlay-image','inlay-text','overlay-button-v1']},
        {name:'Routing', title: t('Routing'), groups: [
            {name: 'Operator', title: tid('operator'), controls: [
                {name:'m_TargetOperator', type:'bool', value: false, title: tid('target_operator')},
                {name:'m_TargetOperatorId', type:'array', value: '', options: routingOpArray, left:'single'}
            ]},
            {name: 'Group', title: t('Group'), controls: $.merge([
                {name:'m_TargetGroup', type:'bool', value: false, title: t('Target Group:')},
                {name:'m_TargetGroupId', type:'array', value: '', options: routingGrArray, left:'single'},
                {name:'m_HideGroups', type:'bool', value: false, title: t('Hide Groups'), top:'single'},
                {name:'m_HideAllOtherGroups', class:'m_HideGroups', type:'bool', value: false, title: t('Hide all other groups'), top:'half', left:'single'}
            ],hiddenGroupList)}
        ],not:['no-tracking']},
        {name:'Dimensions', title: t('Dimensions'), groups: [
            {name: 'Dimensions', title: t('Dimensions'), controls: [
                {name:'m_DimensionsAuto', type:'bool', value: true, title: tid('automatic')},
                {name:'m_DimensionsWidth', type:'int', value: '280', left:'single', title: t('Width:')+' (px)', top:'single'},
                {name:'m_DimensionsHeight', type:'int', value: '500', left:'single', title: t('Height:')+' (px)', top:'single'}
            ]},
            {name: 'Border Radius', title: tid('border_radius'), controls: [
                {name:'m_BorderRadius', type:'int', value: '6', title:tid('border_radius')+': (px)'}
            ]}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'no-tracking' ,'monitoring']},

        {name:'OptOutTracking', title: tid('no-tracking'), groups: [
            {name: 'OptOutTracking', title: tid('no-tracking'), controls: [
                {name:'m_OptOutTrackingTitle', type:'string', value: t('I want to deactivate tracking'), title: t('Link Title:')},
                {name:'m_OptOutTrackingConfirmation', type:'area', value:t('Thank you. Tracking has been deactivated.'), title: t('Confirmation Text:')},
                {name:'m_OptOutTrackingTime', type:'int', value: 10, title: t('Exclusion period (days):'), top: 'single'}
            ]}
        ],not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'overlay-widget' ,'monitoring']},
        {name:'Eye Catcher', title: t('Eye-Catcher'), groups: [
            {name: 'EyeCatcher', title: t('Eye-Catcher'), controls: [
                {name:'m_ECUse', type:'bool', value: true, title: t('Eye-Catcher')},
                {name:'m_ECTypeLabel', class:'m_ECUse', type:'label', left:'single', title: t('Type:'), top:'single'},
                {name:'m_ECTypeOptions', class:'m_ECUse', type:'array', value: 1, options: [{value: 1, text: t('Bubble')},{value: 2, text: t('Image')}], left:'single', title: ''},
                {name:'m_ECHideOnPhone', class:'m_ECUse', type:'bool', value: false, left:'single', top:'single', title: t('Hide to visitors accessing your website using a Mobile Device / Smartphone')},
                {name:'m_ECPersonalize', class:'m_ECUse', type:'bool', value: true, left:'single', title: t('Personalize (Show Operator Picture and Name)')}
            ]},
            {name: 'ECDimensions', class:'m_ECUse', title: t('Dimensions'), controls: [
                {name:'m_ECWidthAuto', type:'bool', value: '', left:'single', title: t('Width:')+' (px)'},
                {name:'m_ECWidth', class:'m_ECWidthAuto', type:'int', value: '280', left:'double', title:''},
                {name:'m_ECHeightAuto', type:'bool', value: '', left:'single', title: t('Height:')+' (px)', top:'single'},
                {name:'m_ECHeight', class:'m_ECHeightAuto', type:'int', value: '100', left:'double', title:''}
            ]},
            {name: 'ECMargin', class:'m_ECUse', title: t('Margin:')+' (px)', controls: [
                {name:'m_ECMarginBottom', type:'int', value: '29', title: t('Bottom:'), left:'single'}
            ]},
            {name: 'ECFade', class:'m_ECUse', title: t('Fade in') + ' / ' + t('Fade out'), controls: [
                {name:'m_ECFadeIn', type:'bool', value: false, title: t('Fade in')+': ('+t('Seconds')+')', left:'single'},
                {name:'m_ECFadeInTime', class:'m_ECFadeIn', type:'int', value: '0', title: '', left:'double'},
                {name:'m_ECFadeOut', type:'bool', value: false, title: t('Fade out')+': ('+t('Seconds')+')', left:'single', top:'single'},
                {name:'m_ECFadeOutTime', class:'m_ECFadeOut', type:'int', value: '0', title: '', left:'double'}
            ]},
            {name: 'ECBubble', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Bubble'), controls: [
                {name:'m_ECBubbleColorBGStart', type:'color', class:'', value:'#F0FFD5', title: t('Background start color'), left:'single'},
                {name:'m_ECBubbleColorBGEnd', type:'color', class:'', value:'#D3F299', title: t('Background end color'), left:'single'},
                {name:'m_ECBubbleTextColor', type:'color', class:'', value:'#6EA30C', title: t('Text color'), left:'single'},
                {name:'m_ECBubbleBorderWidth', type:'int', value: '2', title: t('Line width (px):'), left:'single'},
                {name:'m_ECBubbleBorderColorStart', type:'color', class:'', value:'#6EA30C', title: t('Border start color'), left:'single', top:'single'},
                {name:'m_ECBubbleBorderColorEnd', type:'color', class:'', value:'#6EA30C', title: t('Border end color'), left:'single'},
                {name:'m_ECBubbleShadowUse', type:'bool', value: false, title: t('Shadow'), left:'single', top:'single'},
                {name:'m_ECBubbleShadowX', class:'m_ECBubbleShadowUse', type:'int', value: '3', title: t('X-Position:'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowY', class:'m_ECBubbleShadowUse', type:'int', value: '3', title: t('Y-Position:'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowBlur', class:'m_ECBubbleShadowUse', type:'int', value: '4', title: t('Blur:'), left:'double', top:'single'},
                {name:'m_ECBubbleShadowColor', class:'m_ECBubbleShadowUse', type:'color', value:'#464646', title: t('Color:'), left:'double', top:'single'}
            ]},
            {name: 'ECBubbleTitle', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Header Text'), controls: [
                {name:'m_ECBubbleTitleDefault', type:'bool', value: true, title: t('Use Default'), left:'single'},
                {name:'m_ECBubbleTitleOnline', class:'m_ECBubbleTitleDefault', type:'string', value:'', title: t('Online:'), left:'double', top:'single'},
                {name:'m_ECBubbleTitleOffline', class:'m_ECBubbleTitleDefault', type:'string', value:'', title: t('Offline:'), left:'double', top:'single'}
            ]},
            {name: 'ECBubbleSubTitle', class:'m_ECUse m_ECTypeOptionsBubble', title: t('Sub Text'), controls: [
                {name:'m_ECBubbleSubTitleDefault', type:'bool', value: true, title: t('Use Default'), left:'single'},
                {name:'m_ECBubbleSubTitleOnline', class:'m_ECBubbleSubTitleDefault', type:'string', value:'', title: t('Online:'), left:'double', top:'single'},
                {name:'m_ECBubbleSubTitleOffline', class:'m_ECBubbleSubTitleDefault', type:'string', value:'', title: t('Offline:'), left:'double', top:'single', bottom:'single'}
            ]},
            {name: 'ECImage', class:'m_ECUse m_ECTypeOptionsImage', title: t('Custom Images'), controls: [
                {name:'m_ECImageURLOnline', type:'string', value:'https://', title: t('Online:')+' (URL)', left:'single'},
                {name:'m_ECImageURLOffline', type:'string', value:'https://', title: t('Offline:')+' (URL)', left:'single', top:'single', bottom:'single'}
            ]}
        ], not:['inlay-image' ,'inlay-text' ,'overlay-button-v1' ,'overlay-button-v2' ,'monitoring' ,'no-tracking']},
        {name:'Advanced', title: tid('advanced'), groups: [
            {name: 'Parameters', title: tid('parameters'), controls: [
                {name:'m_ChatStartsInstantly', type:'bool', value: false, title: tid('instant_chat'), not:['overlay-widget','monitoring']},
                {name:'m_HideGroupSelectionChats', type:'bool', value: false, title: tid('hide_group_select_chats'), not:['monitoring'], static:true},
                {name:'m_HideGroupSelectionTickets', type:'bool', value: false, title: tid('hide_group_select_tickets'), not:['monitoring'], static:true},
                {name:'m_ForceGroupSelection', type:'bool', value: false, title: tid('require_select_group'), not:['monitoring'], static:true},
                {name:'m_NoChatInvites', type:'bool', value: false, title: tid('no_invite_code'), static: true},
                {name:'m_GroupSelectionPosition', type:'array', value: '0', options: [{value: 0, text: tid('group_below')},{value: 1, text: tid('group_above')}], left:'half', top: 'single', bottom:'single', not:['monitoring'], static:true}
            ]}
        ],not:['no-tracking']},
        {name:'Data', title: tid('data'), groups: [
            {name: 'StandardInputFields', title: tid('standard_input_fields'), controls: [
                {name:'m_UsePassThruStandard', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruStandardLink', type:'link', value: 'https://www.livezilla.net/faq/en/?fid=passthrudata', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_Field111', type:'string', class:'m_UsePassThruStandard', dataattr: 'Name', value: '', title: tid('name') + ':', top:'single', static:true},
                {name:'m_Field112', type:'string', class:'m_UsePassThruStandard', dataattr: 'Email', value: '', title: tid('email') + ':', top:'single', static:true},
                {name:'m_Field113', type:'string', class:'m_UsePassThruStandard', dataattr: 'Company', value: '', title: tid('company') + ':', top:'single', static:true},
                {name:'m_Field114', type:'string', class:'m_UsePassThruStandard', dataattr: 'Question', value: '', title: tid('question') + ':', top:'single', static:true},
                {name:'m_Field116', type:'string', class:'m_UsePassThruStandard', dataattr: 'Phone', value: '', title: tid('phone') + ':', top:'single', static:true},
                {name:'m_FieldArea', type:'string', class:'m_UsePassThruStandard', dataattr: 'Area', value: '', title: tid('area') + ':', top:'single', static:true},
                {name:'m_FieldLogoURL', type:'string', class:'m_UsePassThruStandard', dataattr: 'Logo', value: '', title: tid('logo_url'), top:'single', bottom:'single', static:true}

            ]},
            {name: 'CustomInputFields', title: tid('custom_input_fields'), controls: [
                {name:'m_UsePassThruCustom', type:'bool', value: false, title: tid('use_pass_thru'), static:true},
                {name:'m_PassThruCustomLink', type:'link', value: 'https://www.livezilla.net/faq/en/?fid=passthrudata', title: tid('pass_thru_link'), left:'single', top:'falf', persistent: false},
                {name:'m_CustomField0', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField1', value: '', title: tid('custom_field') + ' 1:', top:'single', static:true},
                {name:'m_CustomField1', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField2', value: '', title: tid('custom_field') + ' 2:', top:'single', static:true},
                {name:'m_CustomField2', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField3', value: '', title: tid('custom_field') + ' 3:', top:'single', static:true},
                {name:'m_CustomField3', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField4', value: '', title: tid('custom_field') + ' 4:', top:'single', static:true},
                {name:'m_CustomField4', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField5', value: '', title: tid('custom_field') + ' 5:', top:'single', static:true},
                {name:'m_CustomField5', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField6', value: '', title: tid('custom_field') + ' 6:', top:'single', static:true},
                {name:'m_CustomField6', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField7', value: '', title: tid('custom_field') + ' 7:', top:'single', static:true},
                {name:'m_CustomField7', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField8', value: '', title: tid('custom_field') + ' 8:', top:'single', static:true},
                {name:'m_CustomField8', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField9', value: '', title: tid('custom_field') + ' 9:', top:'single', static:true},
                {name:'m_CustomField9', class:'m_UsePassThruCustom', type:'string', dataattr: 'CustomField10', value: '', title: tid('custom_field') + ' 10:', top:'single', bottom:'single', static:true}
            ]}
        ],not:['no-tracking']}
    ];

    if(typeof _cloneObj != 'undefined' && _cloneObj != null)
    {
        this.m_Id = _cloneObj.m_Id;
        this.m_Type = _cloneObj.m_Type;
        this.LoadSettings(_cloneObj.m_Settings, false);
    }
    else
    {
        this.m_Id = _type;
        this.m_Type = _type;
    }
}

LinkGeneratorElement.prototype.ApplyStaticFields = function(from){
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1 && typeof entry_control.static != 'undefined'){
                            entry_control.value = from;
                        }
                    });
                }
            });
    });

}

LinkGeneratorElement.prototype.LoadSettings = function(settings, staticOnly) {
    for(var entry_name in settings){
        for(var s_entry_name in this.m_Settings){
            if(settings[entry_name].name == this.m_Settings[s_entry_name].name) {
                for(var entry_group in settings[entry_name].groups){
                    for(var s_entry_group in this.m_Settings[s_entry_name].groups){
                        if(settings[entry_name].groups[entry_group].name == this.m_Settings[s_entry_name].groups[s_entry_group].name) {
                            for(var entry_control in settings[entry_name].groups[entry_group].controls){
                                for(var s_entry_control in this.m_Settings[s_entry_name].groups[s_entry_group].controls){
                                    if(settings[entry_name].groups[entry_group].controls[entry_control].name == this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].name) {
                                        if(typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].persistent == 'undefined')
                                            if(!staticOnly || typeof this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].static != 'undefined')
                                                this.m_Settings[s_entry_name].groups[s_entry_group].controls[s_entry_control].value = settings[entry_name].groups[entry_group].controls[entry_control].value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

LinkGeneratorElement.prototype.ApplyLogicToForm = function(formType) {
    var that = this;
    if(formType == "General"){
        if ($('#r-m_LanguageAuto').prop('checked'))
            $('#sl-m_Language').addClass('ui-disabled');
        $('.language-select').change(function() {
            if ($('#r-m_LanguageSelect').prop('checked'))
                $('#sl-m_Language').removeClass('ui-disabled');
            else
                $('#sl-m_Language').addClass('ui-disabled');
        });
    }
    else if(formType == "Colors"){
        $('#ci-m_PrimaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_PrimaryColor').val()))
                $('#ci-m_PrimaryColor-icon').css({background:$('#ci-m_PrimaryColor').val()});
        });
        $('#ci-m_SecondaryColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_SecondaryColor').val()))
                $('#ci-m_SecondaryColor-icon').css({background:$('#ci-m_SecondaryColor').val()});
        });
    }
    else if(formType == "Images"){
        lzm_chatDisplay.LinkGenerator.LoadImageSets(that.m_Type);
    }
    else if(formType == "Services"){
        $('#cb-m_PhoneInbound').change(function() {
            if ($('#cb-m_PhoneInbound').prop('checked')) {
                $('#s-m_PhoneInboundNumber').removeClass('ui-disabled');
                $('#s-m_PhoneInboundText').removeClass('ui-disabled');
            } else {
                $('#s-m_PhoneInboundNumber').addClass('ui-disabled');
                $('#s-m_PhoneInboundText').addClass('ui-disabled');
            }
        });
        if(this.m_Type != 'overlay-widget')
            $('#cb-m_LiveChats').change(function(){
                if ($('#cb-m_LiveChats').prop('checked') && $('#sl-m_LiveChatsGroupId').children('option')[0].value != 'no_dyn_group')
                    $('.live-chat-select').removeClass('ui-disabled');
                else
                    $('.live-chat-select').addClass('ui-disabled');
            });
        else{
            $('#cb-m_LiveChats').parent().addClass('ui-disabled');
            $('#cb-m_Knowledgebase').parent().addClass('ui-disabled');
            $('#cb-m_CreateTicket').parent().addClass('ui-disabled');
            $('#r-m_LiveChatsPrivate').parent().addClass('ui-disabled');
        }

        $('.live-chat-select').change(function() {
            if ($('#r-m_LiveChatsGroup').prop('checked')) {
                $('#sl-m_LiveChatsGroupId').removeClass('ui-disabled');
            } else {
                $('#sl-m_LiveChatsGroupId').addClass('ui-disabled');
            }
        });
        $('#cb-m_CustomLinks').change(function(){
            if ($('#cb-m_CustomLinks').prop('checked'))
                $('.m_CustomLinks').removeClass('ui-disabled');
            else
                $('.m_CustomLinks').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink1').change(function(){
            if ($('#cb-m_CustomLink1').prop('checked'))
                $('.m_CustomLink1').removeClass('ui-disabled');
            else
                $('.m_CustomLink1').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink2').change(function(){
            if ($('#cb-m_CustomLink2').prop('checked'))
                $('.m_CustomLink2').removeClass('ui-disabled');
            else
                $('.m_CustomLink2').addClass('ui-disabled');
        });
        $('#cb-m_CustomLink3').change(function(){
            if ($('#cb-m_CustomLink3').prop('checked'))
                $('.m_CustomLink3').removeClass('ui-disabled');
            else
                $('.m_CustomLink3').addClass('ui-disabled');
        });
        $('#cb-m_SocialMedia').change(function(){
            if ($('#cb-m_SocialMedia').prop('checked'))
                $('.m_SocialMedia').removeClass('ui-disabled');
            else
                $('.m_SocialMedia').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaFacebook').change(function(){
            if ($('#cb-m_SocialMediaFacebook').prop('checked'))
                $('.m_SocialMediaFacebook').removeClass('ui-disabled');
            else
                $('.m_SocialMediaFacebook').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaTwitter').change(function(){
            if ($('#cb-m_SocialMediaTwitter').prop('checked'))
                $('.m_SocialMediaTwitter').removeClass('ui-disabled');
            else
                $('.m_SocialMediaTwitter').addClass('ui-disabled');
        });
        $('#cb-m_SocialMediaGoogle').change(function(){
            if ($('#cb-m_SocialMediaGoogle').prop('checked'))
                $('.m_SocialMediaGoogle').removeClass('ui-disabled');
            else
                $('.m_SocialMediaGoogle').addClass('ui-disabled');
        });
        var fields = $('td', '#tbl-custom-links');
        for(var i = 0;i<3;i++){
            $('#cb-m_CustomLink'+(i+1)).parent().appendTo(fields.eq((i*3)+0));
            $('#s-m_CustomLinkTitle'+(i+1)).parent().parent().appendTo(fields.eq((i*3)+1));
            $('#s-m_CustomLinkURL'+(i+1)).parent().parent().appendTo(fields.eq((i*3)+2));
        }
        fields = $('td', '#tbl-social-media');
        $('#cb-m_SocialMediaFacebook').parent().appendTo(fields.eq(0));
        $('#s-m_SocialMediaFacebookURL').parent().parent().appendTo(fields.eq(1));
        $('#cb-m_SocialMediaTwitter').parent().appendTo(fields.eq(2));
        $('#s-m_SocialMediaTwitterURL').parent().parent().appendTo(fields.eq(3));
        $('#cb-m_SocialMediaGoogle').parent().appendTo(fields.eq(4));
        $('#s-m_SocialMediaGoogleURL').parent().parent().appendTo(fields.eq(5));
        $('#cb-m_Knowledgebase').change(function(){
            if ($('#cb-m_Knowledgebase').prop('checked')){
                $('.m_Knowledgebase').removeClass('ui-disabled');}
            else
                $('.m_Knowledgebase').addClass('ui-disabled');
        });
        $('.knowledgebase_root').change(function(){
            if ($('#r-m_KnowledgebaseCustomRoot').prop('checked')){
                $('#s-m_KnowledgebaseCustomRootFolder').removeClass('ui-disabled');}
            else{
                $('#s-m_KnowledgebaseCustomRootFolder').addClass('ui-disabled');}
        });
        $('#r-m_KnowledgebaseCustomRoot').change();
        $('#cb-m_Knowledgebase').change();
        $('#cb-m_PhoneInbound').change();
        $('#cb-m_LiveChats').change();
        $('.live-chat-select').change();
        $('#cb-m_CustomLinks').change();
        $('#cb-m_CustomLink1').change();
        $('#cb-m_CustomLink2').change();
        $('#cb-m_CustomLink3').change();
        $('#cb-m_SocialMedia').change();
        $('#cb-m_SocialMediaFacebook').change();
        $('#cb-m_SocialMediaTwitter').change();
        $('#cb-m_SocialMediaGoogle').change();
    }
    else if(formType == "Shadow"){
        $('#cb-m_UseShadow').change(function() {
            if ($('#cb-m_UseShadow').prop('checked')) {
                $('.m_UseShadow').removeClass('ui-disabled');
            } else {
                $('.m_UseShadow').addClass('ui-disabled');
            }
        });
        $('#ci-m_ShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ShadowColor').val()))
                $('#ci-m_ShadowColor-icon').css({background:$('#ci-m_ShadowColor').val()});
        });
        $('#ci-m_ShadowColor').change();
        $('#cb-m_UseShadow').change();
    }
    else if(formType == "Position"){
        $('.po-m_Position').click(function() {
            $('.po-m_Position').removeClass('lzm-position-selected');
            $(this).addClass('lzm-position-selected');
        });
    }
    else if(formType == "Routing"){
        $('#cb-m_TargetOperator').change(function() {
            if ($('#cb-m_TargetOperator').prop('checked')) {
                $('#sl-m_TargetOperatorId').removeClass('ui-disabled');
            } else {
                $('#sl-m_TargetOperatorId').addClass('ui-disabled');
            }
        });
        $('#cb-m_TargetGroup').change(function() {
            if ($('#cb-m_TargetGroup').prop('checked')) {
                $('#sl-m_TargetGroupId').removeClass('ui-disabled');
            } else {
                $('#sl-m_TargetGroupId').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideGroups').change(function() {
            if ($('#cb-m_HideGroups').prop('checked')) {
                $('.m_HideGroups').removeClass('ui-disabled');
            } else {
                $('.m_HideGroups').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideAllOtherGroups').change(function() {
            if (!$('#cb-m_HideAllOtherGroups').prop('checked')) {
                $('.m_HideAllOtherGroups').removeClass('ui-disabled');
            } else {
                $('.m_HideAllOtherGroups').addClass('ui-disabled');
            }
        });
        $('#cb-m_HideAllOtherGroups').change();
        $('#cb-m_TargetOperator').change();
        $('#cb-m_TargetGroup').change();
        $('#cb-m_HideGroups').change();
    }
    else if(formType == "Eye Catcher"){
        $('#cb-m_ECUse').change(function() {
            if ($('#cb-m_ECUse').prop('checked')) {
                $('.m_ECUse').removeClass('ui-disabled');
            } else {
                $('.m_ECUse').addClass('ui-disabled');
            }
        });
        $('#sl-m_ECTypeOptions').change(function() {
            if ($('#sl-m_ECTypeOptions').prop('selectedIndex')==0) {
                $('.m_ECTypeOptionsBubble').css({display:'block'});
                $('.m_ECTypeOptionsImage').css({display:'none'});
            } else {
                $('.m_ECTypeOptionsBubble').css({display:'none'});
                $('.m_ECTypeOptionsImage').css({display:'block'});
            }
        });
        $('#cb-m_ECWidthAuto').change(function() {
            if ($('#cb-m_ECWidthAuto').prop('checked'))
                $('.m_ECWidthAuto').removeClass('ui-disabled');
            else
                $('.m_ECWidthAuto').addClass('ui-disabled');
        });
        $('#cb-m_ECHeightAuto').change(function() {
            if ($('#cb-m_ECHeightAuto').prop('checked'))
                $('.m_ECHeightAuto').removeClass('ui-disabled');
            else
                $('.m_ECHeightAuto').addClass('ui-disabled');
        });
        $('#cb-m_ECFadeIn').change(function() {
            if ($('#cb-m_ECFadeIn').prop('checked'))
                $('.m_ECFadeIn').removeClass('ui-disabled');
            else
                $('.m_ECFadeIn').addClass('ui-disabled');
        });
        $('#cb-m_ECFadeOut').change(function() {
            if ($('#cb-m_ECFadeOut').prop('checked'))
                $('.m_ECFadeOut').removeClass('ui-disabled');
            else
                $('.m_ECFadeOut').addClass('ui-disabled');
        });
        $('#cb-m_ECBubbleSubTitleDefault').change(function() {
            if (!$('#cb-m_ECBubbleSubTitleDefault').prop('checked'))
                $('.m_ECBubbleSubTitleDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleSubTitleDefault').addClass('ui-disabled');
        });
        $('#cb-m_ECBubbleTitleDefault').change(function() {
            if (!$('#cb-m_ECBubbleTitleDefault').prop('checked'))
                $('.m_ECBubbleTitleDefault').removeClass('ui-disabled');
            else
                $('.m_ECBubbleTitleDefault').addClass('ui-disabled');
        });
        $('#cb-m_ECBubbleShadowUse').change(function() {
            if ($('#cb-m_ECBubbleShadowUse').prop('checked'))
                $('.m_ECBubbleShadowUse').removeClass('ui-disabled');
            else
                $('.m_ECBubbleShadowUse').addClass('ui-disabled');
        });
        $('#ci-m_ECBubbleColorBGStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGStart').val()))
                $('#ci-m_ECBubbleColorBGStart-icon').css({background:$('#ci-m_ECBubbleColorBGStart').val()});
        });
        $('#ci-m_ECBubbleColorBGEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleColorBGEnd').val()))
                $('#ci-m_ECBubbleColorBGEnd-icon').css({background:$('#ci-m_ECBubbleColorBGEnd').val()});
        });
        $('#ci-m_ECBubbleTextColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleTextColor').val()))
                $('#ci-m_ECBubbleTextColor-icon').css({background:$('#ci-m_ECBubbleTextColor').val()});
        });
        $('#ci-m_ECBubbleBorderColorStart').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorStart').val()))
                $('#ci-m_ECBubbleBorderColorStart-icon').css({background:$('#ci-m_ECBubbleBorderColorStart').val()});
        });
        $('#ci-m_ECBubbleBorderColorEnd').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleBorderColorEnd').val()))
                $('#ci-m_ECBubbleBorderColorEnd-icon').css({background:$('#ci-m_ECBubbleBorderColorEnd').val()});
        });
        $('#ci-m_ECBubbleShadowColor').change(function() {
            if(lzm_commonTools.isHEXColor($('#ci-m_ECBubbleShadowColor').val()))
                $('#ci-m_ECBubbleShadowColor-icon').css({background:$('#ci-m_ECBubbleShadowColor').val()});
        });
        $('#cb-m_ECBubbleSubTitleDefault').change();
        $('#cb-m_ECBubbleTitleDefault').change();
        $('#cb-m_ECBubbleShadowUse').change();
        $('#cb-m_ECFadeIn').change();
        $('#cb-m_ECFadeOut').change();
        $('#cb-m_ECWidthAuto').change();
        $('#cb-m_ECHeightAuto').change();
        $('#sl-m_ECTypeOptions').change();
        $('#cb-m_ECUse').change();
    }
    else if(formType == "Texts"){
        $('#cb-m_TextDefault').change(function() {
            if (!$('#cb-m_TextDefault').prop('checked')){
                $('#s-m_TextOnline').removeClass('ui-disabled');
                $('#s-m_TextOffline').removeClass('ui-disabled');
            }
            else{
                $('#s-m_TextOnline').addClass('ui-disabled');
                $('#s-m_TextOffline').addClass('ui-disabled');
            }
        });
        $('#cb-m_TextDefault').change();
    }
    else if(formType == "Dimensions"){
        $('#cb-m_DimensionsAuto').change(function() {
            if (!$('#cb-m_DimensionsAuto').prop('checked')){
                $('#int-m_DimensionsWidth').removeClass('ui-disabled');
                $('#int-m_DimensionsHeight').removeClass('ui-disabled');
            }
            else{
                $('#int-m_DimensionsWidth').addClass('ui-disabled');
                $('#int-m_DimensionsHeight').addClass('ui-disabled');
            }
        });
        $('#cb-m_DimensionsAuto').change();
    }
    else if(formType == "Advanced"){
        $('#cb-m_UsePassThruStandard').change(function() {
            var active = $('#cb-m_UsePassThruStandard').prop('checked');
            $('.m_UsePassThruStandard input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder+$(this).attr('data-attr-name')+'-->';
                if ($(this).val() == ph && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
        $('#cb-m_UsePassThruCustom').change(function() {
            var active = $('#cb-m_UsePassThruCustom').prop('checked');
            $('.m_UsePassThruCustom input').each(function(){
                var ph = LinkGeneratorClass.DataPassThruPlaceholder+$(this).attr('data-attr-name')+'-->';
                if ($(this).val()==ph && !active)
                    $(this).val('');
                else if($(this).val()== '' && active)
                    $(this).val(ph);
            });
        });
    }

}

LinkGeneratorElement.prototype.GetLineId = function(){
    return 'element-list-line-'+this.m_Id;
}

LinkGeneratorElement.prototype.GUIToObject = function(){
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if($.inArray(that.m_Type,entry_name.not) === -1)
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1){
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1){
                            var val = that.GetControlValue(entry_control);
                            if(val != null)
                                entry_control.value = val;
                        }
                    });
                }
            });
    });
}

LinkGeneratorElement.prototype.GetForm = function(formType) {
    var contentHtml = '';
    var that = this;
    this.m_Settings.forEach(function(entry_name) {
        if(entry_name.name==formType){
            entry_name.groups.forEach(function(entry_group)
            {
                if($.inArray(that.m_Type,entry_group.not) === -1){
                    var addClass = (typeof entry_group.class != 'undefined') ? ' '+entry_group.class : '';
                    contentHtml += '<fieldset class="lzm-fieldset'+addClass+'" id="lg-elements-configuration-'+entry_group.name+'"><legend>' + entry_group.title + '</legend><form>';
                    entry_group.controls.forEach(function(entry_control) {
                        if($.inArray(that.m_Type,entry_control.not) === -1)
                            contentHtml += that.GetControlHTML(entry_control);
                    });
                    if(entry_group.custom == true)
                        contentHtml += that.GetCustomForm(entry_group.name);
                    contentHtml += '</form></fieldset>';
                }
            });
        }
    });
    return contentHtml;
};

LinkGeneratorElement.prototype.RequiresMonitoring = function() {
    return this.m_Type=='overlay-button'||this.m_Type=='overlay-widget';
}

LinkGeneratorElement.prototype.GetControlID = function(controlDefintion) {
    if(controlDefintion.type == 'bool')
        return 'cb-'+controlDefintion.name;
    else if(controlDefintion.type == 'array')
        return 'sl-'+controlDefintion.name;
    else if(controlDefintion.type == 'color')
        return 'ci-'+controlDefintion.name;
    else if(controlDefintion.type == 'position')
        return 'po-'+controlDefintion.name;
    else if(controlDefintion.type == 'int')
        return 'int-'+controlDefintion.name;
    else if(controlDefintion.type == 'string')
        return 's-'+controlDefintion.name;
    else if(controlDefintion.type == 'radio')
        return 'r-'+controlDefintion.name;
    else if(controlDefintion.type == 'area')
        return 'a-'+controlDefintion.name;
    else
        return controlDefintion.name;
}

LinkGeneratorElement.prototype.GetControlHTML = function(controlDefintion) {
    var contentHtml = '';
    var addClass = (typeof controlDefintion.class != 'undefined') ? controlDefintion.class : '';
    if(controlDefintion.type == 'bool')
        contentHtml = lzm_inputControls.createCheckbox(this.GetControlID(controlDefintion), controlDefintion.title, controlDefintion.value, false, addClass);
    else if(controlDefintion.type == 'array')
        contentHtml = lzm_inputControls.createSelect(this.GetControlID(controlDefintion), addClass, '', '', {position: 'right', gap: '0px'}, {}, '', controlDefintion.options, controlDefintion.value, '');
    else if(controlDefintion.type == 'color')
        contentHtml = lzm_inputControls.createColor(this.GetControlID(controlDefintion), addClass, controlDefintion.value, controlDefintion.title, '');
    else if(controlDefintion.type == 'position')
        contentHtml += lzm_inputControls.createPosition(this.GetControlID(controlDefintion), controlDefintion.value);
    else if(controlDefintion.type == 'int')
        contentHtml = lzm_inputControls.createInput(this.GetControlID(controlDefintion), addClass, controlDefintion.value, controlDefintion.title, '', 'number', '');
    else if(controlDefintion.type == 'string'){

        var myData = (typeof controlDefintion.dataattr != 'undefined') ? ' data-attr-name="'+controlDefintion.dataattr+'"' : '';
        contentHtml = lzm_inputControls.createInput(this.GetControlID(controlDefintion), addClass, controlDefintion.value, controlDefintion.title, '', 'text', '', myData);
    }
    else if(controlDefintion.type == 'radio')
        contentHtml = lzm_inputControls.createRadio(this.GetControlID(controlDefintion), addClass, controlDefintion.group, controlDefintion.title, controlDefintion.value);
    else if(controlDefintion.type == 'div')
        contentHtml = '<div id="'+this.GetControlID(controlDefintion)+'"></div>';
    else if(controlDefintion.type == 'label')
        contentHtml = '<label class="'+addClass+'">'+controlDefintion.title+'</label>';
    else if(controlDefintion.type == 'hidden')
        contentHtml = '<input id="'+this.GetControlID(controlDefintion)+'" value="'+controlDefintion.value+'" type="hidden" />';
    else if(controlDefintion.type == 'link')
        contentHtml = '<a class="'+addClass+'" style="font-size:12px;" href="'+controlDefintion.value+'" target="_blank">'+controlDefintion.title+'</a>';
    else if(controlDefintion.type == 'area')
        contentHtml = '<div class="top-space"><label>'+controlDefintion.title+'</label></div><div>' + lzm_inputControls.createArea(this.GetControlID(controlDefintion), controlDefintion.value, addClass) + "</div>";

    var classes = "";
    if(typeof controlDefintion.top != 'undefined' && controlDefintion.top == 'single')
        classes += " top-space";
    if(typeof controlDefintion.top != 'undefined' && controlDefintion.top == 'half')
        classes += " top-space-half";
    if(typeof controlDefintion.bottom != 'undefined' && controlDefintion.bottom == 'single')
        classes += " bottom-space";

    if(typeof controlDefintion.left != 'undefined' && controlDefintion.left == 'single')
        contentHtml = '<div class="left-space-child'+classes+'">' + contentHtml + '</div>';
    else if(typeof controlDefintion.left != 'undefined' && controlDefintion.left == 'double')
        contentHtml = '<div class="left-space-child'+classes+'"><div class="left-space-child">' + contentHtml + '</div></div>';
    else if(classes.length)
        contentHtml = '<div class="'+ $.trim(classes) + '">' + contentHtml + '</div>';

    return contentHtml;
};

LinkGeneratorElement.prototype.GetControlValue = function(controlDefinition) {
    if(controlDefinition.type == 'bool' || controlDefinition.type == 'radio')
        return $('#'+this.GetControlID(controlDefinition)).prop('checked');
    else if(controlDefinition.type == 'hidden' || controlDefinition.type == 'array' || controlDefinition.type == 'string' || controlDefinition.type == 'int' || controlDefinition.type == 'color' || controlDefinition.type == 'area')
    {
        return $('#'+this.GetControlID(controlDefinition)).val();
    }
    else if(controlDefinition.type == 'position')
        return ($(".lzm-position-selected",'#'+this.GetControlID(controlDefinition)).prop('id').replace(this.GetControlID(controlDefinition), ''));
    return null;
}

LinkGeneratorElement.prototype.GetCustomForm = function(formType) {
    var contentHtml = '';
    if(formType == "Images"){
        contentHtml = '<table><tr>' +
            '<td style="width:100px;vertical-align:top;">'+lzm_inputControls.createImageBox('image-online')+'</td>' +
            '<td rowspan="2" style="vertical-align:top;"><div id="image-sets-list-div" class="alternating-rows-table lzm-list-div"><table class="alternating-rows-table" id="image-sets-list-table"><tbody></tbody></table></div>' +
            '<div style="margin-top: 15px; text-align: right;">';
        contentHtml += lzm_inputControls.createButton('add-image-set-btn', '', 'addImageSet(\''+this.m_Type+'\')', t('Add'), '', 'lr',{'margin-right': '5px', 'padding-left': '12px', 'padding-right': '12px'}, tid('create_new_element'), 20, 'b');
        contentHtml += lzm_inputControls.createButton('rm-image-set-btn', 'ui-disabled element-edit-btns', 'removeImageSet(\''+this.m_Type+'\')', t('Remove'), '', 'lr',{'margin-right': '0px', 'padding-left': '12px', 'padding-right': '12px'}, t('Remove selected Element'), 20, 'b');
        contentHtml += '</div>'+
            '</td></tr><tr>'+
            '<td class="top-space" style="vertical-align:top;">'+lzm_inputControls.createImageBox('image-offline')+'</td>' +
            '</tr></table>';
    }
    else if(formType == "Custom Links"){
        contentHtml = '<table id="tbl-custom-links" class="link-generator-table"><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>';
    }
    else if(formType == "Social Media"){
        contentHtml = '<table id="tbl-social-media" class="link-generator-table"><tr><td></td><td></td></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>';
    }
    return contentHtml;
};

LinkGeneratorElement.prototype.GetRow = function() {
    return '<tr id="'+this.GetLineId()+'" ondblclick="editLinkGeneratorElement();" onclick="selectLinkGeneratorElement(\'' + this.m_Id + '\');" class="element-list-line lzm-unselectable" data-element="'+lz_global_base64_encode(JSON.stringify(this))+'"><td class="element-list-line-icon icon-column"><i class="'+this.m_Icons[this.m_Type]+'"></i></td><td><bs>'+tid(this.m_Type)+'</bs></td></tr>';
};

LinkGeneratorElement.prototype.GetProperty = function(propertyName) {
    var that = this;
    var prop = null;
    this.m_Settings.forEach(function(entry_name) {
        entry_name.groups.forEach(function(entry_group) {
            entry_group.controls.forEach(function(entry_control) {
                if(entry_control.name == propertyName)
                    prop = entry_control;
            });
        });
    });
    return prop;
};




