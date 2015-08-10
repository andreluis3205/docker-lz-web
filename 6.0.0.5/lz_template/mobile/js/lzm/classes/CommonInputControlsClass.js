function CommonInputControlsClass() {

}

CommonInputControlsClass.prototype.createInputMenu = function(replaceElement, inputId, inputClass, width, placeHolder, value, selectList, scrollParent, selectmenuTopCorrection) {
    scrollParent = (typeof scrollParent != 'undefined') ? scrollParent : 'NOPARENTGIVEN';
    selectmenuTopCorrection = (typeof selectmenuTopCorrection != 'undefined') ? selectmenuTopCorrection : 0;
    var widthString = (width != 0) ? ' width: ' + width + 'px;' : '';
    var inputMenu = '<span id="' + inputId + '-box" class="lzm-combobox ' + inputClass + '">' +
        '<input type="text" data-role="none" id="' +  inputId + '"' +
        ' style="padding: 0px; border: 0px;' + widthString + '" placeholder="' + placeHolder + '" value="' + value + '" />' +
        '<span id="' + inputId + '-menu"' +
        ' style=\'cursor: pointer;\'><i class="fa fa-chevron-down"></i></span>' +
        '</span>' +
        '<ul id="' + inputId + '-select" class="lzm-menu-select" style="display: none; border: 1px solid #ccc; border-radius: 4px;' +
        ' position: absolute; list-style: none; padding: 3px; margin: 0px; z-index: 2; background-color: #f9f9f9; line-height: 1.5;">';
    for (var i=0; i<selectList.length; i++) {
        var listValue = (selectList[i].constructor == Array) ? selectList[i][0] : selectList[i];
        inputMenu += '<li class="' + inputId + '-selectoption input-select-combo" style="cursor: default; position: relative;">' + listValue +
            '<span class="delete-menu-item" style="position: absolute; right: -4px; width: 16px; height: 16px; top: 2px;"' +
            ' onclick="deleteSalutationString(event, \'' + inputId + '\', \'' + listValue + '\');">' +
            '<i class="fa fa-remove" style="color: #ee0000; font-size: 16px;"></i></span></li>';
    }
    inputMenu += '</ul>';
    $('#' + replaceElement).html(inputMenu).trigger('create');
    var eltPos = $('#' + inputId + '-box').position();
    var eltWidth = $('#' + inputId + '-box').width();
    var eltHeight = $('#' + inputId + '-box').height();
    $('#' + inputId + '-select').css({
        left: Math.floor(eltPos.left + 2) + 'px',
        top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection) + 'px',
        width: Math.floor(eltWidth) + 'px'
    });

    $('#' + replaceElement).css({'line-height': 2.5, 'white-space': 'nowrap'});

    $('#' + inputId + '-menu').click(function(e) {
        if ($('#' + inputId + '-select').css('display') == 'block') {
            $('.lzm-menu-select').css('display', 'none');
            $('.lzm-menu-select').data('visible', false);
        } else {
            setTimeout(function() {
                $('.lzm-menu-select').css('display', 'none');
                $('.lzm-menu-select').data('visible', false);
                $('#' + inputId + '-select').css('display', 'block');
                $('#' + inputId + '-select').data('visible', true);
            }, 10);
            var scrollX = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollLeft : 0;
            var scrollY = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollTop : 0;
            $('#' + inputId + '-select').css({
                left: Math.floor(eltPos.left + 2 - scrollX) + 'px',
                top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection - scrollY) + 'px'
            });
        }
    });

    if ($('#' + scrollParent).length > 0) {
        $('#' + scrollParent).on('scrollstop', function() {
            if ($('#' + inputId + '-select').data('visible')) {
                var scrollX = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollLeft : 0;
                var scrollY = ($('#' + scrollParent).length > 0) ? $('#' + scrollParent)[0].scrollTop : 0;
                $('#' + inputId + '-select').css({
                    left: Math.floor(eltPos.left + 2 - scrollX) + 'px',
                    top: Math.floor(eltPos.top + eltHeight + 12 + selectmenuTopCorrection - scrollY) + 'px',
                    display: 'block'
                });
            }
        });
        $('#' + scrollParent).on('scrollstart', function() {
            $('#' + inputId + '-select').css({display: 'none'});
        });
    }

    $('.' + inputId + '-selectoption').click(function(e) {
        $('#' + inputId).val($(this).html().replace(/<span class="delete-menu-item".*?span>/, ''));
        $('#' + inputId + '-select').css('display', 'none');
    });
    $('body').click(function() {
        if ($('#' + inputId + '-select').css('display') == 'block') {
            $('#' + inputId + '-select').css('display', 'none');
        }
    });

};

CommonInputControlsClass.prototype.createInput = function(myId, myClass, myText, myLabel, myIcon, myType, myLayoutType) {
    myLayoutType = (typeof myLayoutType != 'undefined' && myLayoutType != '') ? myLayoutType : 'a';
    myType = (typeof myType != 'undefined' && myType != '') ? myType : 'text';
    myClass = (myClass != '') ? myClass + ' lzm-input-container-' + myLayoutType : 'lzm-input-container-' + myLayoutType;
    var iconWidth = (myIcon != '') ? 10 : 0;
    var textLeft = (myLayoutType == 'a') ? ' style="left: ' + (iconWidth + 21) + 'px;"' : '';
    var inputMarginTop = (myType == 'file') ? ' style="margin-top: 4px;"' : '';
    var inputHtml = '<div class="' + myClass + '" id="' + myId + '-container">' +
        '<label for="' + myId + '" id="' + myId + '-label" class="lzm-label-' + myLayoutType + '">' + myLabel + '</label>' +
        '<div class="lzm-input-icon-' + myLayoutType + '" id="' + myId + '-icon" style="width: ' + iconWidth + 'px;">' + myIcon + '</div>' +
        '<div class="lzm-input-text-' + myLayoutType + '" id="' + myId + '-text"' + textLeft + '>' +
        '<input type="' + myType + '" autocapitalize="off" autocorrect="off" autocomplete="off" id="' + myId + '"' +
        ' class="lzm-input-inner-' + myLayoutType + '" value="' + myText + '" placeholder="' + myLabel + '"' + inputMarginTop + ' />' +
        '</div>' +
        '</div>';

    return inputHtml
};

CommonInputControlsClass.prototype.createSelect = function(myId, myClass, myAction, myText, myIcon, myCss, myTitle, myOptionList, mySelectedOption, myLayoutType, data) {
    myLayoutType = (typeof myLayoutType != 'undefined' && myLayoutType != '') ? myLayoutType : 'a';
    myId = (typeof myId != 'undefined' && myId != '') ? myId : md5('' + Math.random());
    var myInnerId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner"' : '';
    var mySelectId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    var myIconId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner-icon"' : '';
    var myTextId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner-text"' : '';
    var myOuterId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-outer"' : '';
    myClass = (typeof myClass != 'undefined' && myClass != '') ? ' class="lzm-select-' + myLayoutType + ' ' + myClass + '"' :
        ' class="lzm-select-' + myLayoutType + '"';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myTitle = (typeof myTitle != 'undefined' && myTitle != '') ? ' title="' + myTitle + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : true;
    myIcon = (typeof myIcon != 'undefined') ? myIcon : false;
    var myIconImage = '', myIconGap = '0px', myIconTop = '6px', myIconFA = '<i class="fa fa-chevron-down"></i>';
    if (typeof myIcon == 'object') {
        myIconImage = (typeof myIcon.image != 'undefined') ? myIcon.image : 'NONE';
        myIconGap = myIcon.gap;
        myIconTop = (typeof myIcon.top != 'undefined') ? myIcon.top : myIconTop;
        myIcon = myIcon.position;
    }
    myOptionList = (typeof myOptionList != 'undefined') ? myOptionList : [];
    mySelectedOption = (typeof mySelectedOption != 'undefined') ? mySelectedOption : 0;
    var mySelectedOptionIndex = 0, i = 0;
    for (i=0; i<myOptionList.length; i++) {
        if ((typeof myOptionList[i].value != 'undefined' && myOptionList[i].value == mySelectedOption) || myOptionList[i].text == mySelectedOption) {
            mySelectedOptionIndex = i;
        }
    }
    var selectCss = ' style=\'';
    for (var cssTag in myCss) {
        if (myCss.hasOwnProperty(cssTag)) {
            selectCss += ' ' + cssTag + ': ' + myCss[cssTag] + ';';
        }
    }
    selectCss += '\'';
    var selectIconCss = '', selectTextCss = '', selectInnerCss = '';
    var selectText = '';
    if (myOptionList.length > mySelectedOptionIndex && (typeof myOptionList[mySelectedOptionIndex].icon != 'undefined' || myIconImage != '')) {
        var iconPosition = (myIcon == 'left') ? ' left: ' + myIconGap + ';' : ' right: ' + myIconGap + ';';
        selectTextCss = (myIcon == 'left') ? ' style="padding-right: ' + myIconGap + '; padding-left: 30px; font-size: 12px;"' :
            (!myIcon) ? ' style="font-size: 12px;"' : ' style="padding-left: ' + myIconGap + '; padding-right: 30px; font-size: 12px;"';
        selectInnerCss = (myIcon == 'left') ? '' : (!myIcon) ? '' : ' style="padding-left: 4px;"';
        myIconImage = (myIconImage == 'NONE' || myIconImage == '') ? (typeof myOptionList[mySelectedOptionIndex].icon != 'undefined') ?
            myOptionList[mySelectedOptionIndex].icon : '' : myIconImage;
        myIconFA = (myIconImage == '') ? myIconFA : '';
        selectIconCss += ' style=\'background-image: url("' + myIconImage + '"); ' + iconPosition + ' top: ' + myIconTop + ';\';';
        selectText = myOptionList[mySelectedOptionIndex].text;
    }
    var iconHtml = '<span' + myIconId + ' class="lzm-select-inner-icon-' + myLayoutType + '"' + selectIconCss + '>' + myIconFA + '</span>';
    var textHtml = '<span' + myTextId + ' class="lzm-select-inner-text-' + myLayoutType + '"' + selectTextCss + '>' + selectText + '</span>';
    var innerHtml = (myIcon && myText) ? iconHtml + textHtml :
        (!myIcon && myText) ? textHtml : iconHtml;
    var selectData = '';
    if (typeof data != 'undefined' && data != null) {
        for (var dataTag in data) {
            if (data.hasOwnProperty(dataTag)) {
                selectData += ' data-' + dataTag + '=' + data[dataTag];
            }
        }
    }
    var selectHtml = '<div' + myOuterId + myClass + myAction + myTitle + selectCss + '>' +
        '<span' + myInnerId + selectInnerCss + ' class="lzm-select-inner-' + myLayoutType + '">' + innerHtml + '</span>' +
        '<select' + mySelectId + selectData + ' class="lzm-select-select-' + myLayoutType + '" data-role="none">';
    for (i=0; i<myOptionList.length; i++) {
        var selectValue = (typeof myOptionList[i].value != 'undefined') ? myOptionList[i].value : myOptionList[i].text;
        var selectedString = (i == mySelectedOptionIndex) ? ' selected="selected"' : '';
        selectHtml += '<option' + selectedString + ' value="' + selectValue + '">' + myOptionList[i].text + '</option>';
    }
    selectHtml += '</select>' +
        '</div>';

    return selectHtml;
};

CommonInputControlsClass.prototype.createSelectChangeHandler = function(myId, myOptions) {
    $('#' + myId).change(function() {
        for (var i=0; i<myOptions.length; i++) {
            if (myOptions[i].value == $('#' + myId).val()) {
                if (typeof myOptions[i].icon != 'undefined') {
                    $('#' + myId + '-inner-icon').css({'background-image': 'url("' + myOptions[i].icon + '")'});
                }
                $('#' + myId + '-inner-text').html(myOptions[i].text);
            }
        }
    });
};

CommonInputControlsClass.prototype.createButton = function(myId, myClass, myAction, myText, myIcon, myType, myCss, myTitle, myTextLength, myLayoutType) {
    var showNoText = ($(window).width() < 500);
    var myTextId = (typeof myId != 'undefined' && myId != '') ? myId : '';
    myId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    myClass = (typeof myClass != 'undefined') ? myClass : '';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : '';
    myIcon = (typeof myIcon != 'undefined') ? myIcon : '';
    myType = (typeof myType != 'undefined') ? myType : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myTitle = (typeof myTitle != 'undefined') ? ' title="' + myTitle + '"' : '';
    myTextLength = (typeof myTextLength != 'undefined') ? myTextLength : 30;
    if (myTextLength > 4) {
        myText = (myText.length > myTextLength) ? myText.substr(0, myTextLength - 3) + '...' : myText;
    }
    myLayoutType = (typeof myLayoutType != 'undefined' && myLayoutType != '') ? myLayoutType : 'a';
    var buttonCss = ' style="%LEFTPADDING%%RIGHTPADDING%';
    for (var cssTag in myCss) {
        if (myCss.hasOwnProperty(cssTag)) {
            var myCssTag = '';
            if ((cssTag == 'padding-left' || cssTag == 'padding-right' ) && myText != '' && showNoText) {
                myCssTag = (parseInt(myCss[cssTag]) + 8)+'px';
            } else {
                myCssTag = myCss[cssTag];
            }
            buttonCss += ' ' + cssTag + ': ' + myCssTag + ';';
        }
    }
    buttonCss += '"';

    switch (myType) {
        case 'l':
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-left-' + myLayoutType;
            break;
        case 'r':
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-right-' + myLayoutType;
            break;
        case 'm':
            myClass = myClass + ' lzm-button-' + myLayoutType + '';
            break;
        default:
            myClass = myClass + ' lzm-button-' + myLayoutType + ' lzm-button-left-' + myLayoutType + ' lzm-button-right-' + myLayoutType;
            break;
    }
    myClass += ' lzm-unselectable';
    myClass = (myClass.replace(/^ */, '') != '') ? ' class="' + myClass.replace(/^ */, '') + '"' : '';
    var iconPadding = '', buttonTextCss = '';
    if (myIcon != '' && (myText == '' || showNoText)) {
        var padLeft = (typeof myCss['padding-left'] == 'undefined' && typeof myCss['padding'] == 'undefined') ? ' padding-left: 12px;' : '';
        var padRight = (typeof myCss['padding-right'] == 'undefined' && typeof myCss['padding'] == 'undefined') ? ' padding-right: 12px;' : '';
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,padLeft).replace(/%RIGHTPADDING%/g,padRight);
        buttonTextCss = ' display: none;';
    } else if (myIcon != '' && (myText != '' && !showNoText)) {
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,'').replace(/%RIGHTPADDING%/g,'');
        buttonTextCss = 'display: inline; padding-left: 5px;';
    } else {
        buttonCss = buttonCss.replace(/%LEFTPADDING%/g,'').replace(/%RIGHTPADDING%/g,'');
        buttonTextCss = 'display: inline;';
    }
    var buttonHtml = '<span' + buttonCss + myId + myClass + myTitle + myAction + '>' + myIcon +
        '<span id="' + myTextId + '-text" style="' + buttonTextCss + '">' + myText + '</span>' + '</span>';

    return buttonHtml
};

/********** Tab control **********/
CommonInputControlsClass.prototype.createTabControl = function(replaceElement, tabList, selectedTab, placeHolderWidth, layoutType) {
    var mySelectedTab = (typeof selectedTab != 'undefined' && selectedTab > -1 && selectedTab < tabList.length) ? Math.max(selectedTab, 0) : 0;
    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;
    placeHolderWidth = (typeof placeHolderWidth != 'undefined' && placeHolderWidth != 0) ? placeHolderWidth : $('#' + replaceElement).parent().width();
    layoutType = (typeof layoutType != 'undefined') ? layoutType : 'a';
    var allTabsWidth = 0, visibleTabsWidth = 0, bgColor = '#f5f5f5', closedTabColor = '#E0E0E0';
    switch (layoutType) {
        case 'a':
            bgColor = '#f5f5f5';
            break;
        case 'b':
            bgColor = '#ffffff';
            break;
    }

    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -1000px; top: -1000px;' +
        ' width: 800px; height: 100px;"></div>').trigger('create');

    var tabRowHtml = '';
    var tabRowArray = [];
    var contentRowHtml = '';
    var tabsAreTooWide = false, tabsAreStillTooWide = false;
    var thisTabHtml = '', thisTabWidth = [], firstVisibleTab = 0, lastVisibleTab = 0;

    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> ... </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: inline; text-shadow: none;"> ... </span>';
    $('#test-tab-width-container').html(rightTabHtml).trigger('create');
    var rightTabWidth = $('#' + replaceElement + '-tab-more-right').width() + 22;
    $('#test-tab-width-container').html(leftTabHtml).trigger('create');
    var leftTabWidth = $('#' + replaceElement + '-tab-more-left').width() + 22;


    for (var i=0; i<tabList.length; i++) {
        var dataHash = (typeof tabList[i].hash != 'undefined') ? ' data-hash="' + tabList[i].hash + '"' : '';
        var tabName = (tabList[i].name.length <= 20) ? tabList[i].name : tabList[i].name.substr(0, 17) + '...';
        var tabBackgroundColor = (i != mySelectedTab) ? closedTabColor : bgColor;
        var tabBorderBottomColor = (i != mySelectedTab) ? '#ccc' : bgColor;
        var tabOpacity = (i != mySelectedTab) ? ' color: #666;' : '';
        thisTabHtml = '<span class="lzm-tabs ' + replaceElement + '-tab" id="' + replaceElement + '-tab-' + i + '" draggable="true"' +
            ' style="background-color: ' + tabBackgroundColor + '; display: %DISPLAY%; text-shadow: none; border-bottom: 1px solid ' + tabBorderBottomColor +
            tabOpacity + '" data-tab-no="' + i + '"' + dataHash + '>' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;
        if (allTabsWidth + thisTabWidth[i] > placeHolderWidth) {
            tabsAreTooWide = true;
            if (allTabsWidth + rightTabWidth > placeHolderWidth) {
                tabsAreStillTooWide = true;
            }
        }
        if (tabsAreTooWide) {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
            if (tabsAreStillTooWide) {
                var lastTabNo = tabRowArray.length -1;
                tabRowArray[lastTabNo] = tabRowArray[lastTabNo].replace(/inline/, 'none');
            }
        } else {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'inline');
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }

        tabRowArray.push(thisTabHtml);
        tabRowHtml += thisTabHtml;

        var displayString = (i == mySelectedTab) ? 'block' : 'none';
        contentRowHtml += '<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="border: 1px solid #ccc;' +
            ' border-bottom-left-radius: 0px; border-bottom-right-radius: 0px; border-top-right-radius: 0px;' +
            ' padding: 8px; margin-top: 2px; display: ' + displayString + '; overflow: auto; background-color: ' + bgColor + ';"' + dataHash + '>' +
            tabList[i].content +
            '</div>';
    }

    tabRowHtml = tabRowArray.join('');
    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }
    if (tabsAreStillTooWide) {
        lastVisibleTab -= 1;
    }
    var tabString = '<div id="' + replaceElement + '-tabs-row" data-selected-tab="' + selectedTab + '">' + tabRowHtml + '</div>' + contentRowHtml;

    $('#test-tab-width-container').remove();
    $('#' + replaceElement).html(tabString).trigger('create');

    this.addTabControlEventHandler(replaceElement, tabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor, layoutType);

    var moveRightCounter = Math.max(Math.min(selectedTab - lastVisibleTab, 10), 0);
    for (var j=0; j<moveRightCounter; j++) {
        $('#' + replaceElement + '-tab-more-right').click();
    }
};

CommonInputControlsClass.prototype.updateTabControl = function(replaceElement, oldTabList, layoutType) {
    var selectedTab = $('#' + replaceElement + '-tabs-row').data('selected-tab');
    selectedTab = (typeof selectedTab != 'undefined') ? selectedTab : 0;
    layoutType = (typeof layoutType != 'undefined') ? layoutType : 'a';
    var bgColor = '#f5f5f5';
    switch (layoutType) {
        case 'a':
            bgColor = '#f5f5f5';
            break;
        case 'b':
            bgColor = '#ffffff';
            break;
    }
    var i = 0, j = 0, existingTabsArray = [], existingTabsHashArray = [], newTabList = [], lzTabDoesExist = false;
    $('.' + replaceElement + '-tab').each(function() {
        var thisTabHash = $(this).data('hash'), thisTabNo = $(this).data('tab-no'), thisTabHtml = $(this).html();
        existingTabsArray.push({'tab-no': thisTabNo, hash: thisTabHash, html: thisTabHtml});
        existingTabsHashArray.push(thisTabHash);
        if (thisTabHash == 'lz') {
            lzTabDoesExist = true;
        }
    });
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash == 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
            selectedTab += 1;
        }
    }
    for (i=0; i<existingTabsArray.length; i++) {
        var tabWasRemoved = false;
        for (j=0; j<oldTabList.length; j++) {
            if (existingTabsArray[i].hash == oldTabList[j].hash && oldTabList[j].action == 0) {
                tabWasRemoved = true;
                selectedTab = (selectedTab < i) ? selectedTab : (selectedTab > i) ? selectedTab - 1 : 0;
            }
        }
        if (!tabWasRemoved) {
            newTabList.push({name: existingTabsArray[i].html, hash: existingTabsArray[i].hash, content: null});
        }
    }
    for (i=0; i<oldTabList.length; i++) {
        if (oldTabList[i].action == 1 && oldTabList[i].hash != 'lz' && $.inArray(oldTabList[i].hash, existingTabsHashArray) == -1) {
            newTabList.push({name: oldTabList[i].name, hash: oldTabList[i].hash, content: oldTabList[i].content});
        }
    }

    var mySelectedTab = Math.max(selectedTab, 0);
    $('body').append('<div id="test-tab-width-container" style="position: absolute; left: -2000px; top: -2000px;' +
        ' width: 1800px; height: 100px;"></div>').trigger('create');
    var placeHolderWidth = $('#' + replaceElement).parent().width();
    var thisTabHtml = '', tabsAreTooWide = false, allTabsWidth = 0, lastVisibleTab = 0, tabRowHtml = '', thisTabWidth = [],
        firstVisibleTab = 0, visibleTabsWidth = 0, closedTabColor = '#E0E0E0';
    var leftTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-left" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: none; text-shadow: none;"> ... </span>';
    var rightTabHtml = '<span class="lzm-tabs" id="' + replaceElement + '-tab-more-right" draggable="true"' +
        ' style="background-color: ' + closedTabColor + '; display: inline; text-shadow: none;"> ... </span>';
    $('#test-tab-width-container').html(leftTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var leftTabWidth = $('#' + replaceElement + '-test-tab-more-left').width() + 22;
    $('#test-tab-width-container').html(rightTabHtml.replace(/-tab-more-left/, '-test-tab-more-left')).trigger('create');
    var rightTabWidth = $('#' + replaceElement + '-test-tab-more-right').width() + 22;
    for (i=0; i<newTabList.length; i++) {
        var tabName = (newTabList[i].name.length <= 20) ? newTabList[i].name : newTabList[i].name.substr(0, 17) + '...';
        var tabBackgroundColor = (i != mySelectedTab) ? closedTabColor : bgColor;
        var tabBorderBottomColor = (i != mySelectedTab) ? '#ccc' : bgColor;
        var tabOpacity = (i != mySelectedTab) ? ' color: #666;' : '';
        thisTabHtml = '<span class="lzm-tabs ' + replaceElement + '-tab" id="' + replaceElement + '-tab-' + i + '" draggable="true"' +
            ' style="background-color: ' + tabBackgroundColor + '; display: %DISPLAY%; text-shadow: none; border-bottom: 1px solid ' + tabBorderBottomColor +
            tabOpacity + '" data-tab-no="' + i + '" data-hash="' + newTabList[i].hash + '">' + tabName + '</span>';
        $('#test-tab-width-container').html(thisTabHtml).trigger('create');
        thisTabWidth[i] = $('#' + replaceElement + '-tab-' + i).width() + 22;
        if (allTabsWidth + thisTabWidth[i] > placeHolderWidth) {
            tabsAreTooWide = true;
        }
        if (tabsAreTooWide) {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'none');
        } else {
            thisTabHtml = thisTabHtml.replace(/%DISPLAY%/, 'inline');
            allTabsWidth += thisTabWidth[i];
            lastVisibleTab = i;
        }
        tabRowHtml += thisTabHtml;
    }
    $('#test-tab-width-container').remove();


    if(tabsAreTooWide) {
        tabRowHtml = leftTabHtml + tabRowHtml + rightTabHtml;
    }
    $('#' + replaceElement + '-tabs-row').html(tabRowHtml).trigger('create');

    $('.' + replaceElement + '-content').css('display', 'none');
    for (i=0; i<existingTabsArray.length; i++) {
        $('#' + replaceElement + '-content-' + existingTabsArray[i]['tab-no']).attr('id', replaceElement + '-content-' + existingTabsArray[i].hash);
    }
    var lastVisibleElement = replaceElement + '-tabs-row';
    for (i=0; i<newTabList.length; i++) {
        if (newTabList[i].content == null) {
            $('#' + replaceElement + '-content-' + newTabList[i].hash).attr('id', replaceElement + '-content-' + i);
            lastVisibleElement = replaceElement + '-content-' + i;
        } else {
            $('#' + lastVisibleElement).after('<div class="' + replaceElement + '-content" id="' + replaceElement + '-content-' + i + '" style="border: 1px solid #ccc;' +
                ' border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-top-right-radius: 4px;' +
                ' padding: 8px; margin-top: 2px; display: none; overflow: auto; background-color: ' + bgColor + ';" data-hash="' + newTabList[i].hash + '"></div>');
            lastVisibleElement = replaceElement + '-content-' + i;
            $('#' + lastVisibleElement).html(newTabList[i].content).css('display', 'none');
        }
    }
    $('#' + replaceElement + '-content-' + mySelectedTab).css('display', 'block');
    $('#' + replaceElement + '-tabs-row').data('selected-tab', selectedTab);

    this.addTabControlEventHandler(replaceElement, newTabList, firstVisibleTab, lastVisibleTab, thisTabWidth, leftTabWidth,
        rightTabWidth, visibleTabsWidth, placeHolderWidth, closedTabColor, layoutType);
};

CommonInputControlsClass.prototype.addTabControlEventHandler = function(replaceElement, tabList, firstVisibleTab, lastVisibleTab,
                                                                      thisTabWidth, leftTabWidth, rightTabWidth,
                                                                      visibleTabsWidth, placeHolderWidth, closedTabColor, layoutType) {
    layoutType = (typeof layoutType != 'undefined') ? layoutType : 'a';
    var bgColor = '#f5f5f5';
    switch (layoutType) {
        case 'a':
            bgColor = '#f5f5f5';
            break;
        case 'b':
            bgColor = '#ffffff';
            break;
    }
    for (i=0; i<tabList.length; i++) {
        $('#' + replaceElement + '-tab-' + i).click(function() {
            var tabNo = parseInt($(this).data('tab-no'));
            $('.' + replaceElement + '-tab').css({'background-color': closedTabColor});
            $('.' + replaceElement + '-tab').css({'color': '#666'});
            $('.' + replaceElement + '-tab').css({'border-bottom': '1px solid #ccc'});
            $('#' + replaceElement + '-tab-' + tabNo).css({'background-color': bgColor});
            $('#' + replaceElement + '-tab-' + tabNo).css({'color': '#333'});
            $('#' + replaceElement + '-tab-' + tabNo).css({'border-bottom': '1px solid ' + bgColor});
            $('.' + replaceElement + '-content').css({display: 'none'});
            $('#' + replaceElement + '-content-' + tabNo).css({display: 'block'});
            $('#' + replaceElement + '-tabs-row').data('selected-tab', tabNo);
        });
        try {
            $('#' + replaceElement + '-tab-' + i)[0].addEventListener('dragstart', function(e) {
                e.preventDefault();
            });
        } catch(e) {}
    }
    $('#' + replaceElement + '-tab-more-right').click(function() {
        var counter = 0;
        var extraTabWidth = rightTabWidth;
        if (lastVisibleTab < tabList.length - 1) {
            $('#' + replaceElement + '-tab-' + firstVisibleTab).css('display', 'none');
            firstVisibleTab++;
            $('#' + replaceElement + '-tab-' + (lastVisibleTab + 1)).css('display', 'inline');
            lastVisibleTab++;
            visibleTabsWidth = 0;
            for (var j=firstVisibleTab; j<lastVisibleTab + 1; j++) {
                visibleTabsWidth += thisTabWidth[j];
            }
            $('#' + replaceElement + '-tab-more-left').css('display', 'inline');
            while (visibleTabsWidth + rightTabWidth + leftTabWidth > placeHolderWidth && counter < 10) {
                counter++;
                $('#' + replaceElement + '-tab-' + firstVisibleTab).css('display', 'none');
                visibleTabsWidth -= thisTabWidth[firstVisibleTab];
                firstVisibleTab++;
            }
            if (lastVisibleTab == tabList.length - 1) {
                $('#' + replaceElement + '-tab-more-right').css('display', 'none');
                extraTabWidth = 0;
            }
            counter = 0;
            while (visibleTabsWidth + thisTabWidth[firstVisibleTab - 1] + leftTabWidth + extraTabWidth < placeHolderWidth && counter < 10) {
                counter++;
                firstVisibleTab--;
                $('#' + replaceElement + '-tab-' + (firstVisibleTab)).css('display', 'inline');
                visibleTabsWidth += thisTabWidth[firstVisibleTab];
            }
        }
    });
    try {
        $('#' + replaceElement + '-tab-more-right')[0].addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    } catch(e) {}
    $('#' + replaceElement + '-tab-more-left').click(function() {
        var counter = 0;
        var extraTabWidth = leftTabWidth;
        if (firstVisibleTab > 0) {
            $('#' + replaceElement + '-tab-' + (firstVisibleTab - 1)).css('display', 'inline');
            firstVisibleTab--;
            $('#' + replaceElement + '-tab-' + lastVisibleTab).css('display', 'none');
            lastVisibleTab--;
            visibleTabsWidth = 0;
            for (var j=firstVisibleTab; j<lastVisibleTab + 1; j++) {
                visibleTabsWidth += thisTabWidth[j];
            }
            $('#' + replaceElement + '-tab-more-right').css('display', 'inline');
            while (visibleTabsWidth + rightTabWidth + leftTabWidth > placeHolderWidth && counter < 10) {
                counter++;
                $('#' + replaceElement + '-tab-' + lastVisibleTab).css('display', 'none');
                visibleTabsWidth -= thisTabWidth[lastVisibleTab];
                lastVisibleTab--;
            }
            if (firstVisibleTab == 0) {
                $('#' + replaceElement + '-tab-more-left').css('display', 'none');
                extraTabWidth = 0;
            }
            counter = 0;
            while (visibleTabsWidth + thisTabWidth[lastVisibleTab + 1] + rightTabWidth  + extraTabWidth < placeHolderWidth && counter < 10) {
                counter++;
                lastVisibleTab++;
                $('#' + replaceElement + '-tab-' + (lastVisibleTab)).css('display', 'inline');
                visibleTabsWidth += thisTabWidth[lastVisibleTab];
            }
        }
    });
    try {
        $('#' + replaceElement + '-tab-more-left')[0].addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
    } catch(e) {}
};