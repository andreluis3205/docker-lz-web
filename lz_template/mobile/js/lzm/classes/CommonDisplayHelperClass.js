/****************************************************************************************
 * LiveZilla CommonDisplayHelperClass.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function CommonDisplayHelperClass(appOs) {
    this.appOs = appOs;
}

CommonDisplayHelperClass.prototype.createButton = function(myId, myClass, myAction, myText, myIcon, myType, myCss, myTitle) {
    var showNoText = ($(window).width() < 500);
    myId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    myClass = (typeof myClass != 'undefined') ? myClass : '';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : '';
    myIcon = (typeof myIcon != 'undefined') ? myIcon : '';
    myType = (typeof myType != 'undefined') ? myType : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myTitle = (typeof myTitle != 'undefined') ? ' title="' + myTitle + '"' : '';
    var buttonCss = ' style=\'white-space: nowrap; cursor:pointer; %IMAGE%';
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
    buttonCss += '\'';

    switch (myType) {
        case 'l':
            myClass = myClass + ' chat-button-line chat-button-left';
            break;
        case 'r':
            myClass = myClass + ' chat-button-line chat-button-right';
            break;
        case 'm':
            myClass = myClass + ' chat-button-line';
            break;
        default:
            myClass = myClass + ' chat-button-line chat-button-left chat-button-right';
            break;
    }
    myClass += ' lzm-unselectable';
    myClass = (myClass.replace(/^ */, '') != '') ? ' class="' + myClass.replace(/^ */, '') + '"' : '';
    var buttonHtml = '';
    if (myIcon != '' && (myText == '' || showNoText)) {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-color: #8c8c8c; background-image: url("' + myIcon + '"); background-position: center; background-repeat: no-repeat;') +
            myAction + '>&nbsp;&nbsp;</span>';
    } else if (myIcon != '' && (myText != '' && !showNoText)) {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-color: #8c8c8c;') +
            myAction + '><span style=\'background-image: ' + 'url("' + myIcon + '")' + '; background-repeat: no-repeat; ' +
            'background-position: left center; padding: 2px 0px 2px 20px;\'>' + myText + '</span></span>';
    } else {
        buttonHtml += '<span' + myId + myClass + myTitle +
            buttonCss.replace(/%IMAGE%/, 'background-color: #8c8c8c;') + myAction + '>' +
            myText + '</span>';
    }

    return buttonHtml
};

CommonDisplayHelperClass.prototype.createSelect = function(myId, myClass, myAction, myText, myIcon, myCss, myTitle, myOptionList, mySelectedOption) {
    myId = (typeof myId != 'undefined' && myId != '') ? myId : md5('' + Math.random());
    var myInnerId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner"' : '';
    var mySelectId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '"' : '';
    var myIconId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner-icon"' : '';
    var myTextId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-inner-text"' : '';
    var myOuterId = (typeof myId != 'undefined' && myId != '') ? ' id="' + myId + '-outer"' : '';
    myClass = (typeof myClass != 'undefined' && myClass != '') ? ' class="chat-select ' + myClass + '"' : ' class="chat-select"';
    myAction = (typeof myAction != 'undefined' && myAction != '') ? ' onclick="' + myAction + '"' : '';
    myCss = (typeof myCss != 'undefined') ? myCss : {};
    myTitle = (typeof myTitle != 'undefined') ? ' title="' + myTitle + '"' : '';
    myText = (typeof myText != 'undefined') ? myText : true;
    myIcon = (typeof myIcon != 'undefined') ? myIcon : false;
    var myIconImage = '', myIconGap = '0px';
    if (typeof myIcon == 'object') {
        myIconImage = myIcon.image;
        myIconGap = myIcon.gap;
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
    var selectCss = ' style=\'white-space: nowrap; cursor: pointer; background-color: #8c8c8c; color: #ffffff;';
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
        selectTextCss = (myIcon == 'left') ? ' style="padding-right: ' + myIconGap + '; padding-left: 30px; font-size: 14px;"' :
            (!myIcon) ? ' style="font-size: 12px;"' : ' style="padding-left: ' + myIconGap + '; padding-right: 30px; font-size: 14px;"';
        selectInnerCss = (myIcon == 'left') ? ' style="text-align: left; padding-top: 3px;"' :
            (!myIcon) ? ' style="text-align: center; padding-top: 3px;"' : ' style="text-align: left; padding-top: 3px; padding-left: 4px;"';
        myIconImage = (myIconImage == '') ? myOptionList[mySelectedOptionIndex].icon : myIconImage;
        selectIconCss += ' style=\'background-image: url("' + myIconImage + '");' + iconPosition + ' top: -3px;\';';
        selectText = myOptionList[mySelectedOptionIndex].text;
    }
    var iconHtml = '<span' + myIconId + ' class="chat-select-inner-icon"' + selectIconCss + '>&nbsp;</span>';
    var textHtml = '<span' + myTextId + ' class="chat-select-inner-text"' + selectTextCss + '>' + selectText + '</span>';
    var innerHtml = (myIcon && myText) ? iconHtml + textHtml :
        (!myIcon && myText) ? textHtml : iconHtml;
    var selectHtml = '<div' + myOuterId + myClass + myAction + myTitle + selectCss + '>' +
        '<span' + myInnerId + selectInnerCss + ' class="chat-select-inner">' + innerHtml + '</span>' +
        '<select' + mySelectId + ' class="chat-select-select" data-role="none">';
    for (i=0; i<myOptionList.length; i++) {
        var selectValue = (typeof myOptionList[i].value != 'undefined') ? myOptionList[i].value : myOptionList[i].text;
        var selectedString = (i == mySelectedOptionIndex) ? ' selected="selected"' : '';
        selectHtml += '<option' + selectedString + ' value="' + selectValue + '">' + myOptionList[i].text + '</option>';
    }
    selectHtml += '</select>' +
        '</div>';

    return selectHtml;
};

CommonDisplayHelperClass.prototype.createSelectChangeHandler = function(myId, myOptions) {
    $('#' + myId).change(function() {
        for (var i=0; i<myOptions.length; i++) {
            if (myOptions[i].value == $('#' + myId).val()) {
                $('#' + myId + '-inner-icon').css({'background-image': 'url("' + myOptions[i].icon + '")'});
                $('#' + myId + '-inner-text').html(myOptions[i].text);
            }
        }
    });
};

CommonDisplayHelperClass.prototype.addBrowserSpecificGradient = function(imageString, color) {
    var a, b;
    switch (color) {
        case 'darkorange':
            a = '#FDB867';
            b = '#EDA148';
            break;
        case 'orange':
            a = '#FFCC73';
            b = '#FDB867';
            break;
        case 'darkgray':
            a = '#F6F6F6';
            b = '#E0E0E0';
            break;
        case 'blue':
            a = '#5393c5';
            b = '#6facd5';
            break;
        case 'background':
            a = '#e9e9e9';
            b = '#dddddd';
            break;
        case 'darkViewSelect':
            a = '#999999';
            b = '#797979';
            break;
        case 'selectedViewSelect':
            a = '#6facd5';
            b = '#5393c5';
            break;
        case 'tabs':
            a = '#d9d9d9';
            b = '#898989';
            break;
        default:
            a = '#FFFFFF';
            b = '#F1F1F1';
            break;
    }
    var gradientString = imageString;
    var cssTag = '';
    switch (this.appOs) {
        case 'windows':
            cssTag = '-ms-linear-gradient';
            break;
        case 'ios':
            cssTag = '-webkit-linear-gradient';
            break;
        case 'android':
        case 'blackberry':
            cssTag = '-webkit-linear-gradient';
            break;
        default:
            cssTag = 'linear-gradient';
            break;
    }
    switch (imageString) {
        case '':
            gradientString = cssTag + '(' + a + ',' + b + ')';
            break;
        case 'text':
            gradientString = 'background-image: ' + cssTag + '(' + a + ',' + b + ')';
            break;
        default:
            gradientString += ', ' + cssTag + '(' + a + ',' + b + ')';
            break;
    }
    return gradientString
};
