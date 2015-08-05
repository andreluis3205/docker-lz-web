/****************************************************************************************
 * LiveZilla ChatObjectClasses.js
 *
 * Copyright 2014 LiveZilla GmbH
 * All rights reserved.
 * LiveZilla is a registered trademark.
 *
 ***************************************************************************************/

function ChatTimestampClass(timeDifference) {
    this.timeDifference = timeDifference * 1000;
}

ChatTimestampClass.prototype.logTimeDifference = function() {
    logit('Timestamp object present - time diff is ' + this.timeDifference);
};

ChatTimestampClass.prototype.setTimeDifference = function(timeDifference) {
    this.timeDifference = timeDifference * 1000;
};

ChatTimestampClass.prototype.getLocalTimeObject = function(timeStamp, doCalcTimeDiff) {
    timeStamp = (typeof timeStamp != 'undefined' && timeStamp != null) ? timeStamp : $.now();
    doCalcTimeDiff = (typeof doCalcTimeDiff != 'undefined') ? doCalcTimeDiff : false;
    var calculatedTimeStamp = (doCalcTimeDiff) ? parseInt(timeStamp) - parseInt(this.timeDifference) : parseInt(timeStamp);
    var tmpDateObject = new Date(calculatedTimeStamp);
    return tmpDateObject;
};

ChatTimestampClass.prototype.getServerTimeString = function(dateObject, doCalcTimeDiff, divideBy) {
    dateObject = (typeof dateObject != 'undefined' && dateObject != null) ? dateObject : new Date();
    doCalcTimeDiff = (typeof doCalcTimeDiff != 'undefined') ? doCalcTimeDiff : false;
    divideBy = (typeof divideBy != 'undefined') ? divideBy : 1000;
    var calculatedTimeString = (doCalcTimeDiff) ? dateObject.getTime() + parseInt(this.timeDifference) : dateObject.getTime();
    return Math.floor(calculatedTimeString / divideBy);
};

function LzmFilters() {
    this.idList = [];
    this.oldFilterIds = [];
    this.objects = {};
    this.initialRun = true;
}

LzmFilters.prototype.setFilter = function(filter) {
    if ($.inArray(filter.filterid, this.idList) == -1) {
        this.idList.push(filter.filterid);
    }
    this.objects[filter.filterid] = filter;

    if (typeof this.objects[filter.filterid] != 'undefined') {
        return this.objects[filter.filterid];
    } else {
        return null;
    }
};

LzmFilters.prototype.getFilter = function(filterId) {
    if ($.inArray(filterId, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[filterId]);
    } else {
        return null;
    }
};

LzmFilters.prototype.getFilterList = function() {
    var filterList = [];
    for (var i=0; i<this.idList.length; i++) {
        var thisFilter = this.getFilter(this.idList[i]);
        if (thisFilter != null) {
            filterList.push(thisFilter);
        }
    }

    return filterList;
};

LzmFilters.prototype.removeFilter = function(filterId) {
    var tmpArray = [];
    for (var i=0; i<this.idList; i++) {
        if (this.idList[i] != filterId) {
            tmpArray.push(this.idList[i]);
        }
    }
    this.idList = tmpArray;
    delete this.objects[filterId];
};

LzmFilters.prototype.getNewFilters = function() {
    var newFilterArray = [];
    for (var i=0; i<this.idList.length; i++) {
        if ($.inArray(this.idList[i], this.oldFilterIds) == -1) {
            var newFilter = this.getFilter(this.idList[i]);
            if (newFilter != null && newFilter.creator != lzm_chatServerEvaluation.myId && !this.initialRun) {
                newFilterArray.push(newFilter);
            }
        }
    }
    this.oldFilterIds = lzm_commonTools.clone(this.idList);
    this.initialRun = false;
    return newFilterArray;
};

LzmFilters.prototype.clearFilters = function() {
    this.idList = [];
    this.objects = {};
};

function LzmCustomInputs() {
    this.idList = [];
    this.objects = {};
    this.nameList = {};
}

LzmCustomInputs.prototype.setCustomInput = function(customInput) {
    var displayVisitor = true, displayTicket = true, displayArchive = true;
    if ($.inArray(customInput.id, this.idList) == -1) {
        this.idList.push(customInput.id);
    } else {
        displayVisitor = this.objects[customInput.id].display.visitor;
        displayTicket = this.objects[customInput.id].display.ticket;
        displayArchive = this.objects[customInput.id].display.archive;
    }
    if (typeof customInput.value == 'string') {
        customInput.value = this.parseInputValue(customInput.value);
    }
    customInput.value.display = {visitor: displayVisitor, ticket: displayTicket, archive: displayArchive};
    this.objects[customInput.id] = customInput.value;
    if (customInput.value.name != '')
        this.nameList[customInput.value.name] = customInput.id;

    if (typeof this.objects[customInput.id] != 'undefined') {
        return this.objects[customInput.id];
    } else {
        return null;
    }
};

LzmCustomInputs.prototype.copyCustomInput = function(customInput) {
    if ($.inArray(customInput.id, this.idList) == -1) {
        this.idList.push(customInput.id);
        this.objects[customInput.id] = customInput;
        this.nameList[customInput.value.name] = customInput.id;
    }
};

LzmCustomInputs.prototype.getCustomInput = function(id, searchBy) {
    searchBy = (typeof searchBy != 'undefined') ? searchBy : 'id';
    if (searchBy == 'id' && $.inArray(id, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[id]);
    } else if (searchBy == 'name' && typeof this.nameList[id] != 'undefined') {
        return this.getCustomInput(this.nameList[id]);
    } else {
        return null;
    }
};

LzmCustomInputs.prototype.getCustomInputList = function(type, onlyActive) {
    type = (typeof type != 'undefined') ? type : 'custom';
    onlyActive = (typeof onlyActive != 'undefined') ? onlyActive : false;
    var limit = (type == 'full') ? 2000000000 : 111;
    var customInputArray = [];
    for (var i=0; i<this.idList.length; i++) {
        if (parseInt(this.idList[i]) < limit) {
            if (!onlyActive || this.objects[this.idList[i]].active == 1) {
                customInputArray.push(lzm_commonTools.clone(this.objects[this.idList[i]]));
            }
        }
    }
    return customInputArray;
};

LzmCustomInputs.prototype.clearCustomInputs = function() {
    this.idList = [];
    this.objects = {};
    this.nameList = {};
};

LzmCustomInputs.prototype.parseInputValue = function(value) {
    value = lz_global_base64_url_decode(value);
    value = lzm_commonTools.phpUnserialize(value);

    var customValue = value[7];
    if (value[3] == 'ComboBox') {
        customValue = (value[7].indexOf(';') != -1) ? value[7].split(';') : [value[7]];
    }
    var valueObject = {id: value[0], /*title: value[1],*/ name: value[2],type: value[3], active: value[4], /*cookie: value[5], position: value[6],*/
        value: customValue};

    return valueObject;
};

LzmCustomInputs.prototype.setDisplay = function(id, type, isVisible) {
    if (typeof this.objects[id] != null) {
        this.objects[id].display[type] = isVisible;
    }
};

function LzmOperators() {
    this.idList = [];
    this.objects = {};
    this.uidList = {};
}

LzmOperators.prototype.setOperator = function(operator) {
    if ($.inArray(operator.id, this.idList) == -1) {
        this.idList.push(operator.id);
    }
    this.objects[operator.id] = operator;
    this.uidList[operator.userid] = operator.id;

    if (typeof this.objects[operator.id] != 'undefined') {
        return this.objects[operator.id];
    } else {
        return null;
    }
};

LzmOperators.prototype.copyOperator = function(operator) {
    if ($.inArray(operator.id, this.idList) == -1) {
        this.idList.push(operator.id);
    }
    try {
        this.objects[operator.id] = lzm_commonTools.clone(operator);
        this.uidList[operator.userid] = operator.id;
    } catch(ex) {}
};

LzmOperators.prototype.setOperatorProperty = function(operatorId, myKey, myValue) {
    if (typeof this.objects[operatorId] != 'undefined') {
        this.objects[operatorId][myKey] = lzm_commonTools.clone(myValue);
        return lzm_commonTools.clone(this.objects[operatorId]);
    }
    return null;
};

LzmOperators.prototype.getOperator = function(operatorId, searchBy) {
    searchBy = (typeof searchBy != 'undefined') ? searchBy : 'id';
    if (searchBy == 'id' && $.inArray(operatorId, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[operatorId]);
    } else if (searchBy == 'name') {
        var resultList = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.getOperator(this.idList[i]).name == operatorId) {
                resultList.push(this.getOperator(this.idList[i]));
            }
        }
        return resultList;
    } else if(searchBy == 'uid' && typeof this.uidList[operatorId] != 'undefined') {
        return this.getOperator(this.uidList[operatorId]);
    } else {
        return null;
    }
};

LzmOperators.prototype.removeOperator = function(operatorId) {
    var operator = this.getOperator(operatorId);
    if (operator != null) {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != operatorId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        var uid = operator.userid;
        delete this.objects[operatorId];
        delete this.uidList[uid];
    }
};

LzmOperators.prototype.clearOperators = function() {
    this.idList = [];
    this.objects = {};
    this.uidList = {};
};

LzmOperators.prototype.getOperatorList = function(sortCriteria, searchBy, showOfflineOperators) {
    sortCriteria = (typeof sortCriteria != 'undefined' && sortCriteria != '') ? sortCriteria : 'name';
    searchBy = (typeof searchBy != 'undefined') ? searchBy : '';
    showOfflineOperators = (typeof showOfflineOperators != 'undefined') ? showOfflineOperators : true;
    var that = this, sortedOperatorList = [], sortedIdList = [], i = 0;
    if (searchBy == '') {
        sortedIdList = lzm_commonTools.clone(this.idList);
    } else {
        for (i=0; i<this.idList.length; i++) {
            if ($.inArray(searchBy, this.getOperator(this.idList[i]).groups) != -1 && (showOfflineOperators || this.getOperator(this.idList[i]).status != 2)) {
                sortedIdList.push(this.idList[i]);
            }
        }
    }

    var sortOperators = function(a, b) {
        var rtValue = 0;
        if (that.getOperator(a)[sortCriteria] > that.getOperator(b)[sortCriteria]) {
            rtValue = 1;
        } else if (that.getOperator(a)[sortCriteria] < that.getOperator(b)[sortCriteria]) {
            rtValue = -1;
        }
        return rtValue;
    };

    sortedIdList.sort(sortOperators);
    for (i=0; i<sortedIdList.length; i++) {
        sortedOperatorList.push(this.getOperator(sortedIdList[i]));
    }

    return sortedOperatorList;
};

LzmOperators.prototype.setLogo = function(operatorId, logo) {
    this.objects[operatorId].logo = logo;
};

LzmOperators.prototype.getOperatorCount = function() {
    var that = this;
    var myOperators = that.getOperatorList('', '', true);
    var operatorCount = myOperators.length;

    return operatorCount;
};

LzmOperators.prototype.getAvailableOperators = function(chatReco) {
    var that = this, myId = (typeof lzm_chatDisplay != 'undefined') ? lzm_chatDisplay.myId : '';
    var avOps = {'forward': [], fIdList: [], 'invite': [], iIdList: []};
    var operators = that.getOperatorList();
    var vb = lzm_chatServerEvaluation.visitors.getVisitorBrowser(chatReco);
    for (var i=0; i<operators.length; i++) {
        if (operators[i].id != myId && $.inArray(parseInt(operators[i].status), [0,1]) != -1 && operators[i].groups.length > operators[i].groupsAway.length) {
            avOps['forward'].push(operators[i]);
            avOps['fIdList'].push(operators[i].id);
            var opPerms = operators[i].perms.split('');
            if (opPerms[7] == 1 && (opPerms[13] == 2 || (opPerms[13] == 1 && vb[1] != null && $.inArray(vb[1].chat.gr, operators[i].groups) != -1))) {
                avOps['invite'].push(operators[i]);
                avOps['iIdList'].push(operators[i].id);
            }
        }
    }
    return avOps;
};

function LzmGroups() {
    this.idList = [];
    this.objects = {};
    this.oldGroupMembers = {};
}

LzmGroups.prototype.setGroup = function(group) {
    if ($.inArray(group.id, this.idList) == -1) {
        this.idList.push(group.id);
    }
    this.objects[group.id] = group;
    if (typeof  group.members != 'undefined' && typeof lzm_chatServerEvaluation != 'undefined') {
        if (typeof this.oldGroupMembers[group.id] == 'undefined') {
            this.oldGroupMembers[group.id] = group.members;
        }
        var i, j, oldGroupMemberId, operator, visitorBrowser, visitor, visitorName, userName;
        var userChat = lzm_chatServerEvaluation.userChats.getUserChat(group.id);
        try {
        for (i=0; i<group.members.length; i++) {
            var memberHasJoined = true;
            for (j=0; j<this.oldGroupMembers[group.id].length; j++) {
                oldGroupMemberId = this.oldGroupMembers[group.id][j].i;
                if (oldGroupMemberId == group.members[i].i) {
                    memberHasJoined = false;
                }
            }
            if (memberHasJoined) {
                operator = lzm_chatServerEvaluation.operators.getOperator(group.members[i].i);
                visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(group.members[i].i);
                visitor = (visitorBrowser[0] != null) ? visitorBrowser[0] : lzm_chatServerEvaluation.visitors.getVisitorBrowser(group.members[i].i.split('~')[0]);
                visitorName = (visitorBrowser[1] != null && visitorBrowser[1].cname != '') ? visitorBrowser[1].cname :
                    (visitor != null) ? visitor.unique_name : group.members[i].i;
                userName = (operator != null) ? operator.name : visitorName;
                if (userChat != null) {
                    addJoinedMessageToChat(group.id, userName, group.name);
                    if (userChat.status == 'left') {
                        lzm_chatServerEvaluation.userChats.setUserChat(group.id, {status: 'read'});
                        if (lzm_chatDisplay.active_chat_reco == group.id) {
                            chatInternalWith(group.id, group.id, group.name);
                        }
                    }
                } else if (group.members[i].i == lzm_chatServerEvaluation.myId) {
                    lzm_chatServerEvaluation.checkMyDynamicGroups(group);
                    lzm_chatServerEvaluation.userChats.setUserChat(group.id, {group_chat: null, status: 'read', type: 'internal'});
                    addJoinedMessageToChat(group.id, userName, group.name);
                }
            }
        }
        } catch(e) {}
        try {
        for (i=0; i<this.oldGroupMembers[group.id].length; i++) {
            oldGroupMemberId = this.oldGroupMembers[group.id][i].i;
            var membersHasLeft = true;
            for (j=0; j<group.members.length; j++) {
                if (group.members[j].i == oldGroupMemberId) {
                    membersHasLeft = false;
                }
            }
            if (membersHasLeft) {
                operator = lzm_chatServerEvaluation.operators.getOperator(oldGroupMemberId);
                visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(oldGroupMemberId);
                visitor = (visitorBrowser[0] != null) ? visitorBrowser[0] : lzm_chatServerEvaluation.visitors.getVisitorBrowser(oldGroupMemberId.split('~')[0]);
                visitorName = (visitorBrowser[1] != null && visitorBrowser[1].cname != '') ? visitorBrowser[1].cname :
                    (visitor != null) ? visitor.unique_name : group.members[i].i;
                userName = (operator != null) ? operator.name : visitorName;
                if (userChat != null) {
                    addLeftMessageToChat(group.id, userName, group.name);
                    if (oldGroupMemberId == lzm_chatServerEvaluation.myId) {
                        disableInternalChat(group.id);
                    }
                }
            }
        }
        } catch(e) {}

        this.oldGroupMembers[group.id] = lzm_commonTools.clone(group.members);
    }

    if (typeof this.objects[group.id] != 'undefined') {
        return this.objects[group.id];
    } else {
        return null;
    }
};

LzmGroups.prototype.copyGroup = function(group) {
    if ($.inArray(group.id, this.idList) == -1) {
        this.idList.push(group.id);
    }
    this.objects[group.id] = lzm_commonTools.clone(group);
    try {
        this.oldGroupMembers[group.id] = lzm_commonTools.clone(group.members);
    } catch(ex) {
        this.oldGroupMembers[group.id] = [];
    }
};

LzmGroups.prototype.getGroup = function(groupId) {
    if ($.inArray(groupId, this.idList) != -1) {
        return lzm_commonTools.clone(this.objects[groupId]);
    } else {
        return null;
    }
};

LzmGroups.prototype.removeGroup = function(groupId, doErase) {
    doErase = (typeof doErase != 'undefined') ? doErase : false;
    if (!doErase) {
        if (typeof this.objects[groupId] != 'undefined') {
            this.objects[groupId].is_active = false;
        }
    } else {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != groupId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        delete this.objects[groupId];
        delete this.oldGroupMembers[groupId];
    }
};

LzmGroups.prototype.clearGroups = function() {
    var i = 0;
    for (i=0; i<this.idList.length; i++) {
        this.objects[this.idList[i]].is_active = false;
    }
    var tmpArray = [];
    for (i=0; i<this.idList.length; i++) {
        var group = this.getGroup(this.idList[i]);
        if (group != null && typeof group.i != 'undefined') {
            tmpArray.push(this.idList[i]);
        } else {
            delete this.objects[this.idList[i]];
            delete this.oldGroupMembers[this.idList[i]];
        }
    }
    this.idList = tmpArray;
};

LzmGroups.prototype.getGroupList = function(sortCriteria, showInactiveGroups, showDynamicGroups) {
    sortCriteria = (typeof sortCriteria == 'string' && sortCriteria != '') ? sortCriteria : 'name';
    showInactiveGroups = (typeof showInactiveGroups != 'undefined') ? showInactiveGroups : false;
    showDynamicGroups = (typeof showDynamicGroups != 'undefined') ? showDynamicGroups : false;
    var that = this, sortedGroupList = [], sortedIdList = [], i = 0;
    sortedIdList = lzm_commonTools.clone(this.idList);

    var sortGroups = function(a, b) {
        var rtValue = 0;
        if (that.getGroup(a)[sortCriteria] > that.getGroup(b)[sortCriteria]) {
            rtValue = 1;
        } else if (that.getGroup(a)[sortCriteria] < that.getGroup(b)[sortCriteria]) {
            rtValue = -1;
        }
        return rtValue;
    };

    sortedIdList.sort(sortGroups);
    for (i=0; i<sortedIdList.length; i++) {
        if ((showInactiveGroups || this.getGroup(sortedIdList[i]).is_active) &&
            (showDynamicGroups || typeof this.getGroup(sortedIdList[i]).members == 'undefined')) {
            sortedGroupList.push(this.getGroup(sortedIdList[i]));
        }
    }

    return sortedGroupList;
};

LzmGroups.prototype.setGroupProperty = function(groupId, property, value) {
    var rt = null;
    try {
    if (typeof this.objects[groupId] != 'undefined') {
        this.objects[groupId][property] = lzm_commonTools.clone(value);
        rt = lzm_commonTools.clone(this.objects[groupId]);
    }
    } catch(ex) {}
    return rt;
};

LzmGroups.prototype.getGroupCount = function() {
    var that = this;
    var myGroups = that.getGroupList('', true, false);
    var groupCount = myGroups.length;

    return groupCount;
};

function LzmVisitors() {
    this.idList = [];
    this.objects = {};
    this.chatIdList = {};
    this.activeVisitors = 0;
}

LzmVisitors.prototype.setVisitor = function(visitor) {
    if ($.inArray(visitor.id, this.idList) == -1) {
        this.idList.push(visitor.id);
        var onlineSince = 2000000000, lastActive = 0, name = '-', bIdList = [], i = 0;
        for (i=0; i<visitor.b.length; i++) {
            bIdList.push(visitor.b[i].id);
            if (visitor.b[i].chat.id != '') {
                this.chatIdList[visitor.b[i].chat.id] = {v: visitor.id, b: visitor.b[i].id};
            }
            for (var j=0; j<visitor.b[i].h2.length; j++) {
                onlineSince = Math.min(onlineSince, visitor.b[i].h2[j].time);
                lastActive = Math.max(lastActive, visitor.b[i].h2[j].time);
            }
            name = (visitor.b[i].cname != '') ? visitor.b[i].cname : name;
        }
        visitor.online_since = onlineSince;
        visitor.last_active = lastActive;
        visitor.name = name;
        visitor.bIdList = bIdList;
        this.objects[visitor.id] = visitor;
        lzm_chatGeoTrackingMap.addOrQueueVisitor(visitor);
        //if (visitor.b.length > 0) {
            this.activeVisitors++;
        /*} else {
            console.log('Set Visitor');
            console.log(visitor);
        }*/
    } else {
        this.objects[visitor.id] = this.updateVisitor(visitor);
    }

    if (typeof this.objects[visitor.id] != 'undefined') {
        return this.objects[visitor.id];
    } else {
        return null;
    }
};

LzmVisitors.prototype.getVisitor = function(visitorId, searchBy) {
    searchBy = (typeof searchBy != 'undefined') ? searchBy : 'id';
    if (searchBy == 'id' && $.inArray(visitorId, this.idList) != -1 && typeof this.objects[visitorId] != 'undefined') {
        return lzm_commonTools.clone(this.objects[visitorId]);
    } else if (searchBy == 'chat_id' && typeof this.chatIdList[visitorId] != 'undefined' && typeof this.objects[this.chatIdList[visitorId].v] != 'undefined') {
        return lzm_commonTools.clone(this.objects[this.chatIdList[visitorId].v]);
    } else {
        return null;
    }
};

LzmVisitors.prototype.getVisitorBrowser = function(visitorId, browserId, chatId) {
    if (typeof chatId != 'undefined' && typeof this.chatIdList[chatId] != 'undefined') {
        visitorId = this.chatIdList[chatId].v;
        browserId = this.chatIdList[chatId].b;
    }
    visitorId = (typeof visitorId == 'string' && visitorId.indexOf('~') != -1) ? visitorId.split('~'): visitorId;
    if (typeof visitorId == 'object' && visitorId  instanceof Array) {
        browserId = visitorId[1];
        visitorId = visitorId[0];
    }
    var visitor = this.getVisitor(visitorId), browser = null;
    if (visitor != null && typeof visitor.b != 'undefined') {
        for (var i=0; i<visitor.b.length; i++) {
            if (visitor.b[i].id == browserId) {
                browser = lzm_commonTools.clone(visitor.b[i]);
            }
        }
    }
    return [visitor, browser];
};

LzmVisitors.prototype.removeVisitor = function (visitorId) {
    var tmpArray = [];
    for (var i=0; i<this.idList.length; i++) {
        if (this.idList[i] != visitorId) {
            tmpArray.push(this.idList[i]);
        }
    }
    this.idList = tmpArray;
    delete this.objects[visitorId];
};

LzmVisitors.prototype.clearVisitors = function() {
    var tmpArray = [], tmpObject = {};
    var tmpExternalUsers = [];
    for (var i=0; i<this.idList.length; i++) {
        for (var j=0; j<this.getVisitor(this.idList[i]).b.length; j++) {
            var tmpChatId = this.idList[i] + '~' + this.getVisitor(this.idList[i]).b[j].id;
            if (lzm_chatServerEvaluation.userChats.getUserChat(tmpChatId) != null &&
                $.inArray(tmpChatId ,lzm_chatDisplay.closedChats) == -1) {
                var thisVisitor = this.getVisitor(this.idList[i]);
                thisVisitor.is_active = false;
                tmpArray.push(this.idList[i]);
                tmpObject[this.idList[i]] = thisVisitor;
            }
        }
    }
    this.setActiveVisitorCount(0);
    this.idList = tmpArray;
    this.objects = tmpObject;
};

LzmVisitors.prototype.getVisitorList = function(sortCriteria, sortOrder, searchBy) {
    sortCriteria = (typeof sortCriteria != 'undefined') ? sortCriteria : 'online';
    sortOrder = (typeof sortOrder != 'undefined') ? sortOrder : 1;
    searchBy = (typeof searchBy != 'undefined') ? searchBy : '';
    var that = this, sortedIdList = [], sortedVisitorList = [], i = 0;
    sortedIdList = lzm_commonTools.clone(this.idList);

    var sortVisitors = function(a, b) {
        var rtValue = 0;
        var visA = that.getVisitor(a), visB = that.getVisitor(b);
        switch (sortCriteria) {
            case 'online':
                    if (visA.online_since < visB.online_since) {
                        rtValue = 1;
                    } else if(visA.online_since > visB.online_since) {
                        rtValue = -1;
                    }
                break;
            case 'active':
                if (visA.last_active < visB.last_active) {
                    rtValue = 1;
                } else if(visA.last_active > visB.last_active) {
                    rtValue = -1;
                }
                break;
            case 'country':
                if (visA.ctryi2 > visB.ctryi2) {
                    rtValue = 1;
                } else if (visA.ctryi2 < visB.ctryi2) {
                    rtValue = -1;
                }
                break;
            case 'language':
                if (visA.lang > visB.lang) {
                    rtValue = 1;
                } else if (visA.lang < visB.lang) {
                    rtValue = -1;
                }
                break;
            case 'name':
                if (visA.name == '-' && visB.name != '-') {
                    rtValue = 1;
                } else if (visB.name == '-' && visA.name != '-') {
                    rtValue = -1;
                } else if (visA.name == '-' && visB.name == '-') {
                    rtValue = 0;
                } else if (visA.name > visB.name) {
                    rtValue = 1;
                } else if (visA.name < visB.name) {
                    rtValue = -1;
                }
                break;
            default:
                rtValue = 0;
                break;
        }
        return rtValue * sortOrder;
    };

    sortedIdList.sort(sortVisitors);
    for (i=0; i<sortedIdList.length; i++) {
        sortedVisitorList.push(this.getVisitor(sortedIdList[i]));
    }

    return sortedVisitorList;
};

LzmVisitors.prototype.updateVisitor = function(visitor) {
    var that = this, existingVisitor = this.getVisitor(visitor.id);
    var existingBrowsers = (typeof existingVisitor.b != 'undefined') ? existingVisitor.b : [];
    var existingBIdList = (typeof existingVisitor.bIdList != 'undefined') ? existingVisitor.bIdList : [];
    var existingComments = (typeof existingVisitor.c != 'undefined') ? existingVisitor.c : [];
    var existingCIdList  = (typeof existingVisitor.cIdList != 'undefined') ? existingVisitor.cIdList : [];
    var existingInvites = (typeof existingVisitor.r != 'undefined') ? existingVisitor.r : [];
    var existingRIdList  = (typeof existingVisitor.rIdList != 'undefined') ? existingVisitor.rIdList : [];
    var existingRecentVisits = (typeof existingVisitor.rv != 'undefined') ? existingVisitor.rv : [];
    var existingRvIdList = (typeof existingVisitor.rvIdList != 'undefined') ? existingVisitor.rvIdList : [];
    var existingRvBIdList = (typeof existingVisitor.rvBIdList != 'undefined') ? existingVisitor.rvBIdList : [];

    var updateUserValues = function(newVisitor, existingVisitor) {
        for (var key in existingVisitor) {
            if (existingVisitor.hasOwnProperty(key)) {
                if (key != 'b_chat' && key != 'b' && key != 'rv' && key != 'c' && key != 'r' && (typeof newVisitor[key] == 'undefined' || newVisitor[key] == '')) {
                    newVisitor[key] = existingVisitor[key];
                }
            }
        }
        return newVisitor;
    };

    var updateVisitorBrowsers = function(newBrowsers, existingBrowsers, existingBIdList, existingRvBIdList) {
        var newBIdList = [], oldBrowsers = [], i = 0;
        for (i=0; i<newBrowsers.length; i++) {
            newBIdList.push(newBrowsers[i].id);
            if (newBrowsers[i].chat.id != '') {
                that.chatIdList[newBrowsers[i].chat.id] = {v: visitor.id, b: newBrowsers[i].id};
            }
            if ($.inArray(newBrowsers[i].id, existingRvBIdList) == -1) {
                if ($.inArray(newBrowsers[i].id, existingBIdList) == -1) {
                    existingBrowsers.push(newBrowsers[i]);
                    existingBIdList.push(newBrowsers[i].id);
                } else {
                    for (var j=0; j<existingBrowsers.length; j++) {
                        if (newBrowsers[i].id == existingBrowsers[j].id) {
                            for (var key in newBrowsers[i]) {
                                if (newBrowsers[i].hasOwnProperty(key)) {
                                    if (key == 'chat' && (newBrowsers[i][key].id == existingBrowsers[j][key].id)) {
                                        var newChat = {};
                                        for (var chatKey in newBrowsers[i][key]) {
                                            if (newBrowsers[i][key].hasOwnProperty(chatKey)) {
                                                if (chatKey == 'pn') {
                                                    newChat[chatKey] = {};
                                                    newChat[chatKey].acc = newBrowsers[i][key][chatKey].acc;
                                                    if (typeof existingBrowsers[j][key][chatKey] != 'undefined') {
                                                        newChat[chatKey].oldMember =  existingBrowsers[j][key][chatKey].member;
                                                        newChat[chatKey].oldMemberIdList = existingBrowsers[j][key][chatKey].memberIdList;
                                                        newChat[chatKey].member = newBrowsers[i][key][chatKey].member;
                                                        newChat[chatKey].memberIdList = newBrowsers[i][key][chatKey].memberIdList;
                                                    } else {
                                                        newChat[chatKey] = newBrowsers[i][key][chatKey];
                                                    }
                                                } else {
                                                    newChat[chatKey] = newBrowsers[i][key][chatKey];
                                                }
                                            }
                                        }
                                        existingBrowsers[j][key] = newChat;
                                    } else {
                                        if ((typeof newBrowsers[i][key] == 'string' && newBrowsers[i][key] != '') ||
                                            (typeof newBrowsers[i][key] == 'object' && newBrowsers[i][key] instanceof Array && newBrowsers[i][key].length != 0) ||
                                            (typeof newBrowsers[i][key] == 'boolean') ||
                                            (typeof newBrowsers[i][key] == 'object' && !(newBrowsers[i][key] instanceof Array)) && !$.isEmptyObject(newBrowsers[i][key])) {
                                            existingBrowsers[j][key] = newBrowsers[i][key];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        for (i=0; i<existingBrowsers.length; i++) {
            if ($.inArray(existingBrowsers[i].id, newBIdList) == -1) {
                oldBrowsers.push(existingBrowsers[i]);
                if (existingBrowsers[i].id.indexOf('_OVL') != -1) {
                    existingBrowsers[i].chat = {id: ''};
                }
            }
        }

        return [existingBrowsers, existingBIdList];
    };

    var updateVisitorComments = function(newComments, existingComments, existingCIdList) {
        for (var i=0; i<newComments.length; i++) {
            if ($.inArray(newComments[i].id, existingCIdList) == -1) {
                existingComments.push(newComments[i]);
                existingCIdList.push(newComments[i].id);
            } else {
                for (var j=0; j<existingComments.length; j++) {
                    if (newComments[i].id == existingComments[j].id) {
                        existingComments[j] = lzm_commonTools.clone(newComments[i]);
                    }
                }
            }
        }
        return [existingComments, existingCIdList];
    };

    var updateVisitorInvites = function(newInvites, existingInvites, existingRIdList) {
        for (var i=0; i<newInvites.length; i++) {
            if ($.inArray(newInvites[i].i, existingRIdList) == -1) {
                existingInvites.push(newInvites[i]);
                existingRIdList.push(newInvites[i].i);
            } else {
                for (var j=0; j<existingInvites.length; j++) {
                    if (newInvites[i].i == existingInvites[j].i) {
                        existingInvites[j] = lzm_commonTools.clone(newInvites[i]);
                    }
                }
            }
        }
        return [existingInvites, existingRIdList];
    };

    var updateVisitorRecentVisits = function(newRecentVisits, existingRecentVisits, existingRvIdList, existingVisitorRvBIdList) {
        for (var i=0; i<newRecentVisits.length; i++) {
            if ($.inArray(newRecentVisits[i].id, existingRvIdList) == -1) {
                existingRecentVisits.push(newRecentVisits[i]);
                existingRvIdList.push(newRecentVisits[i].id);
            } else {
                for (var j=0; j<existingRecentVisits.length; j++) {
                    if (newRecentVisits[i].id == existingRecentVisits[j].id && newRecentVisits[i].f == 1) {
                        existingRecentVisits[j] = lzm_commonTools.clone(newRecentVisits[i]);
                    }
                }
            }
            if (typeof newRecentVisits[i].b != 'undefined') {
                for (var k=0; k<newRecentVisits[i].b.length; k++) {
                    if ($.inArray(newRecentVisits[i].b[k].id, existingVisitorRvBIdList) == -1) {
                        existingVisitorRvBIdList.push(newRecentVisits[i].b[k].id)
                    }
                }
            }
        }
        return [existingRecentVisits, existingRvIdList, existingVisitorRvBIdList];
    };

    if (existingVisitor != null) {
        visitor = updateUserValues(visitor, existingVisitor);
        visitor.b_chat = (visitor.b_chat.id != '') ? visitor.b_chat : existingVisitor.b_chat;
        var updatedRecentVisits = updateVisitorRecentVisits(visitor.rv, existingRecentVisits, existingRvIdList, existingRvBIdList);
        visitor.rv = updatedRecentVisits[0];
        visitor.rvIdList = updatedRecentVisits[1];
        visitor.rvBIdList = updatedRecentVisits[2];
        var updatedBrowsers = updateVisitorBrowsers(visitor.b, existingBrowsers, existingBIdList, updatedRecentVisits[2]);
        visitor.b = updatedBrowsers[0];
        visitor.bIdList = updatedBrowsers[1];
        var updatedComments = updateVisitorComments(visitor.c, existingComments, existingCIdList);
        visitor.c = updatedComments[0];
        visitor.cIdList = updatedComments[1];
        var updatedInvites = updateVisitorInvites(visitor.r, existingInvites, existingRIdList);
        visitor.r = updatedInvites[0];
        visitor.rIdList = updatedInvites[1];
    }

    if (!existingVisitor.is_active && visitor.is_active/* && visitor.b.length > 0*/) {
        this.activeVisitors++;
    }/* else {
        console.log('Update visitor');
        console.log(visitor);
        console.log(existingVisitor);
    }*/
    if (lzm_chatDisplay.active_chat_reco.indexOf('~') != -1 && lzm_chatDisplay.active_chat_reco.split('~')[0] == visitor.id) {
        var thisUser = lzm_commonTools.clone(visitor);
        for (var i=0; i<thisUser.b.length; i++) {
            if (thisUser.b[i].id == lzm_chatDisplay.active_chat_reco.split('~')[1]) {
                thisUser.b_id = thisUser.b[i].id;
                thisUser.b_chat = thisUser.b[i].chat;
            }
        }
        lzm_chatDisplay.thisUser = thisUser;
        lzm_chatPollServer.thisUser = thisUser;
    }
    return visitor;
};

LzmVisitors.prototype.removeOldVisitors = function() {
    var tmpArray = [];
    for (var i=0; i<this.idList.length; i++) {
        if (this.getVisitor(this.idList[i]).is_active || isVisitorNeededInGui(this.idList[i])) {
            tmpArray.push(this.idList[i]);
            if (!this.getVisitor(this.idList[i]).is_active) {
                lzm_chatGeoTrackingMap.removeVisitor(this.idList[i]);
            }
        } else {
            lzm_chatGeoTrackingMap.removeVisitor(this.idList[i]);
            delete this.objects[this.idList[i]];
        }
    }
    this.idList = tmpArray;
};

LzmVisitors.prototype.setVisitorActiveState = function(visitorId, activeState) {
    if (typeof this.objects[visitorId] != 'undefined') {
        var oldActiveState = this.objects[visitorId].is_active;
        this.objects[visitorId].is_active = activeState;
        if (!activeState && oldActiveState != activeState) {
            this.activeVisitors--;
        }
    }
};

LzmVisitors.prototype.setBrowserActiveState = function(visitorId, browserId, activeState) {
    for (var i=0; i<this.objects[visitorId].b.length; i++) {
        if (this.objects[visitorId].b[i].id == browserId) {
            this.objects[visitorId].b[i].is_active = activeState;
        }
    }
};

LzmVisitors.prototype.setBrowserHistoryTime2 = function(visitorId, browserId, historyIndex, time) {
    for (var i=0; i<this.objects[visitorId].b.length; i++) {
        if (this.objects[visitorId].b[i].id == browserId) {
            try {
                this.objects[visitorId].b[i].h2[historyIndex].time2 = '' + time;
            } catch (ex) {}
        }
    }
};

LzmVisitors.prototype.setVisitorValue = function(visitorId, key, value) {
    if (typeof this.objects[visitorId] != 'undefined') {
        this.objects[visitorId][key] = value;
    }
};

LzmVisitors.prototype.getActiveVisitorCount = function() {
    return this.activeVisitors;
};

LzmVisitors.prototype.setActiveVisitorCount = function(number) {
    this.activeVisitors = number;
};

LzmVisitors.prototype.setVisitorProperty = function(visitorId, property, value) {
    var rt = null;
    try {
        if (typeof this.objects[visitorId] != 'undefined') {
            this.objects[visitorId][property] = lzm_commonTools.clone(value);
            rt = lzm_commonTools.clone(this.objects[visitorId]);
        }
    } catch(ex) {}
    return rt;
};

function LzmUserChats() {
    this.messageIdList = [];
    this.userChatObjects = {};
    this.chatMessageCounter = 0;
    this.chatList = [];
    this.storedUserMessages = {};
    this.broswerChatIds = [];
    this.debuggingMessages = [];
}

LzmUserChats.prototype.setUserChat = function(id, data) {
    var isNew = false, i = 0;
    var operator = lzm_chatServerEvaluation.operators.getOperator(id);
    var group = lzm_chatServerEvaluation.groups.getGroup(id);
    var visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(id);
    var visitor = (visitorBrowser[0] != null) ? visitorBrowser[0] : lzm_chatServerEvaluation.visitors.getVisitorBrowser(id.split('~')[0]);
    var userChatName = (operator != null) ? operator.name :
        (group != null) ? group.name :
        (id == 'everyoneintern') ? t('All operators') :
        (visitorBrowser[1] != null && visitorBrowser[1].cname != '') ? visitorBrowser[1].cname :
            (visitor != null) ? visitor.unique_name : id;
    var chatMemberStatus = -1;
    if (visitorBrowser[1] != null && typeof visitorBrowser[1].chat.pn != 'undefined') {
        for (i=0; i<visitorBrowser[1].chat.pn.member.length; i++) {
            if (visitorBrowser[1].chat.pn.member[i].id == lzm_chatServerEvaluation.myId) {
                chatMemberStatus = parseInt(visitorBrowser[1].chat.pn.member[i].st);
            }
        }
    }
    if (typeof this.userChatObjects[id] == 'undefined') {
        data.id = (typeof data.id != 'undefined' && data.id != id) ? data.id : id;
        data.b_id = (typeof data.b_id != 'undefined') ? data.b_id : '';
        data.chat_id = (typeof data.chat_id != 'undefined') ? data.chat_id : '';
        data.group_chat = (typeof data.group_chat != 'undefined') ? data.group_chat : false;
        this.userChatObjects[id] = {};
        if (data.id != '' && data.b_id != '') {
            addChatInfoBlock(data.id, data.b_id);
        }
        if (data.chat_id != '') {
            this.browserChatIdList.push(data.chat_id);
        }
        isNew = true;
        data.messages = (typeof this.userChatObjects[id].messages != 'undefined') ? this.userChatObjects[id].messages : [];
    }
    if (typeof this.userChatObjects[id].id == 'undefined') {
        if (id.indexOf('~') != -1) {
            this.userChatObjects[id].id = id.split('~')[0];
            this.userChatObjects[id].b_id = id.split('~')[1];
        } else {
            this.userChatObjects[id].id = id;
            this.userChatObjects[id].b_id = '';
        }
    }
    data.chat_name = (typeof data.chat_name != 'undefined' && data.chat_name != '') ? data.chat_name : userChatName;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            this.userChatObjects[id][key] = data[key];
        }
    }
    if (id.indexOf('~') != -1) {
        this.userChatObjects[id]['type'] = 'external';
    }
    if (chatMemberStatus != -1 || typeof this.userChatObjects[id]['member_status'] == 'undefined') {
        this.userChatObjects[id]['member_status'] = chatMemberStatus;
    }
    if (id == lzm_chatDisplay.active_chat_reco && chatMemberStatus == 0) {
        enableChatButtons();
    }
    if (typeof this.storedUserMessages[id] != 'undefined') {
        var messageAdded = true;
        for (i=0; i<this.storedUserMessages[id].length; i++) {
            messageAdded = messageAdded && this.setUserChatMessage(this.storedUserMessages[id][i]);
        }
        if (messageAdded) {
            delete this.storedUserMessages[id];
        }
    }
};

LzmUserChats.prototype.setUserChatMessage = function(message, debug) {
    var that = this, rtValue = false, messageAccepted = false, i = 0, cp = '';
    var tmpUserChatObjects = lzm_commonTools.clone(that.userChatObjects);
    debug = (typeof  debug != 'undefined') ? debug : false;
    var myId = lzm_chatServerEvaluation.myId;
    if ($.inArray(message.id, that.messageIdList) == -1) {
        that.chatMessageCounter++;
        message.cmc = that.chatMessageCounter;
        var operatorReco = (message.reco != myId) ? lzm_chatServerEvaluation.operators.getOperator(message.reco) : null;
        var operatorSen = (message.sen != myId) ? lzm_chatServerEvaluation.operators.getOperator(message.sen) : null;
        var groupRec = lzm_chatServerEvaluation.groups.getGroup(message.rec);
        var groupReco = lzm_chatServerEvaluation.groups.getGroup(message.reco);
        var group = (groupRec != null) ? groupRec : groupReco;
        var groupVisitorMembers = [];
        if (group != null && typeof group.members != 'undefined' && group.is_active) {
            for (i=0; i<group.members.length; i++) {
                if (group.members[i].i.indexOf('~') != -1) {
                    groupVisitorMembers.push(group.members[i].i);
                }
            }
        }
        var visitorBrowser, visitor, visitorName, senderName, groupChat, status, messages, newMessage, operator, visIdBId;
        try {
        for (i=0; i<groupVisitorMembers.length; i++) {
            visIdBId = groupVisitorMembers[i];
            if (typeof tmpUserChatObjects[visIdBId] != 'undefined' &&
                ((message.sen == myId && message.reco == group.id) ||
                (operatorSen != null && message.rec == group.id))) {
                    newMessage = lzm_commonTools.clone(message);
                    visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(visIdBId);
                    visitor = (visitorBrowser[0] != null) ? lzm_chatServerEvaluation.visitors.getVisitor(visIdBId.split('~')[0]) : visitorBrowser[0];
                    senderName = (message.sen == myId) ? lzm_chatServerEvaluation.myName : operatorSen.name;
                    status = 'read';
                    //newMessage.text = lzm_chatServerEvaluation.replaceLinks(newMessage.text);
                    newMessage.text = '[' + group.name + ']&nbsp;' + newMessage.text;
                    newMessage.sender_name = senderName;
                    messages = (typeof tmpUserChatObjects[visIdBId] == 'undefined' || typeof tmpUserChatObjects[visIdBId].messages == 'undefined') ?
                        [] : lzm_commonTools.clone(tmpUserChatObjects[visIdBId].messages);
                    messages.push(newMessage);
                    tmpUserChatObjects[visIdBId].messages = messages;
                    tmpUserChatObjects[visIdBId].status = status;
                    tmpUserChatObjects[visIdBId].group_chat = true;
                    that.messageIdList.push(newMessage.id);
                    rtValue = true;
                    messageAccepted = true;
            }
        }
        if ((message.reco == myId && message.rec == message.sen && message.sen.indexOf('~') != -1) ||
            (message.reco == myId && message.rec == '' && message.sen.indexOf('~') != -1) ||
            (operatorReco != null && message.rec == message.sen && message.sen.indexOf('~') != -1) ||
            (operatorSen != null && message.reco == message.rec && message.rec.indexOf('~') != -1) ||
            (message.reco == myId && groupRec != null && message.sen.indexOf('~') != -1) ||
            (message.reco == myId && message.rec != message.sen && message.rec.indexOf('~') != -1 && message.sen.indexOf('~') != -1)) {
                newMessage = lzm_commonTools.clone(message);
                if (newMessage.sen.indexOf('~') != -1) {
                    newMessage.text = lzm_commonTools.escapeHtml(newMessage.text);
                    newMessage.text = lzm_commonTools.addLinksToChatInput(newMessage.text);
                }
                groupChat = newMessage.reco == myId && groupRec != null && newMessage.sen.indexOf('~') != -1;
                cp = (newMessage.rec != newMessage.sen && newMessage.rec.indexOf('~') != -1 && newMessage.sen.indexOf('~') != -1) ?
                    newMessage.rec : newMessage.sen;
                visIdBId = (cp.indexOf('~') != -1) ? cp : newMessage.rec;
                visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(visIdBId);
                visitor = (visitorBrowser[0] != null) ? lzm_chatServerEvaluation.visitors.getVisitor(visIdBId.split('~')[0]) : visitorBrowser[0];
                visitorName = (visitorBrowser[1] != null && visitorBrowser[1].cname != '') ? visitorBrowser[1].cname :
                    (visitor != null) ? visitor.unique_name : visIdBId;
                var visitorChat = (visitorBrowser[1] != null) ? visIdBId + '~' + visitorBrowser[1].chat.id : visIdBId + '~00000';
                senderName = (operatorSen != null) ? operatorSen.name : visitorName;
                status = ((lzm_chatDisplay.selected_view != 'mychats' || lzm_chatServerEvaluation.active_chat_reco != visIdBId) &&
                    (newMessage.rp) != 1 && !groupChat) ? 'new' :
                    (typeof tmpUserChatObjects[visIdBId] != 'undefined' && typeof tmpUserChatObjects[visIdBId].status != 'undefined') ?
                    tmpUserChatObjects[visIdBId].status : 'read';
                var messageText = newMessage.text;
                newMessage.text = (groupChat) ? '[' + groupRec.name + ']&nbsp;' + messageText : messageText;
                newMessage.sender_name = senderName;
                if (typeof tmpUserChatObjects[visIdBId] == 'undefined') {
                    if (typeof that.storedUserMessages[visIdBId] == 'undefined') {
                        that.storedUserMessages[visIdBId] = [];
                    }
                    that.storedUserMessages[visIdBId].push(newMessage);
                } else {
                    messages = (typeof tmpUserChatObjects[visIdBId] == 'undefined' || typeof tmpUserChatObjects[visIdBId].messages == 'undefined') ?
                        [] : lzm_commonTools.clone(tmpUserChatObjects[visIdBId].messages);
                    messages.push(newMessage);
                    tmpUserChatObjects[visIdBId].messages = messages;
                    tmpUserChatObjects[visIdBId].status = status;
                    tmpUserChatObjects[visIdBId].group_chat = groupChat;
                    that.messageIdList.push(newMessage.id);
                    rtValue = true;
                }
                if (typeof newMessage.triso != 'undefined' && newMessage.triso != '' && newMessage.sen.indexOf('~') != -1) {
                    var userLang = '', shortUserLang = '';
                    for (i=0; i<lzm_chatDisplay.translationLanguages.length; i++) {
                        if (lzm_chatDisplay.translationLanguages[i].language == lzm_chatServerEvaluation.userLanguage) {
                            userLang = lzm_chatServerEvaluation.userLanguage;
                        }
                        if (lzm_chatDisplay.translationLanguages[i].language == lzm_chatServerEvaluation.userLanguage.split('-')[0]) {
                            shortUserLang = lzm_chatServerEvaluation.userLanguage.split('-')[0];
                        }
                    }
                    userLang = (userLang != '') ? userLang : shortUserLang;
                    var tmm = {translate: false, sourceLanguage: userLang, targetLanguage: userLang};
                    var tvm = {translate: false, sourceLanguage: userLang, targetLanguage: userLang};
                    if (typeof lzm_chatDisplay.chatTranslations[visitorChat] == 'undefined') {
                        lzm_chatDisplay.chatTranslations[visitorChat] = {
                            tmm: tmm,
                            tvm: tvm
                        };
                    }
                    lzm_chatDisplay.chatTranslations[visitorChat].tvm.translate = true;
                    lzm_chatDisplay.chatTranslations[visitorChat].tvm.sourceLanguage = newMessage.triso;
                    $('#translate-chat').css({'background-color': '#5197ff', color: '#ffffff', 'border-color': '#4888e3'});
                    $('#translate-chat i.fa').css({color: '#ffffff'});
                } else {
                    $('#translate-chat').css({'background-color': '#e8e8e8', color: '#666666', 'border-color': '#cccccc'});
                    $('#translate-chat i.fa').css({color: '#666666'});
                }
                messageAccepted = true;
        }
        if (message.reco == myId && groupRec != null && message.sen.indexOf('~') != -1) {
            newMessage = lzm_commonTools.clone(message);
            if (newMessage.sen.indexOf('~') != -1) {
                newMessage.text = lzm_commonTools.escapeHtml(newMessage.text);
                newMessage.text = lzm_commonTools.addLinksToChatInput(newMessage.text);
            }
            if (typeof tmpUserChatObjects[groupRec.id] == 'undefined') {
                tmpUserChatObjects[groupRec.id] = {};
            }
            visitorBrowser = lzm_chatServerEvaluation.visitors.getVisitorBrowser(newMessage.sen);
            visitor = (visitorBrowser[0] != null) ? lzm_chatServerEvaluation.visitors.getVisitor(newMessage.sen.split('~')[0]) : visitorBrowser[0];
            visitorName = (visitorBrowser[1] != null && visitorBrowser[1].cname != '') ? visitorBrowser[1].cname :
                (visitor != null) ? visitor.unique_name : newMessage.sen;
            status = (lzm_chatDisplay.selected_view != 'mychats' || lzm_chatServerEvaluation.active_chat_reco != groupRec.id) ? 'new' : 'read';
            newMessage.sender_name = visitorName;
            messages = (typeof tmpUserChatObjects[groupRec.id] == 'undefined' || typeof tmpUserChatObjects[groupRec.id].messages == 'undefined') ?
                [] : lzm_commonTools.clone(tmpUserChatObjects[groupRec.id].messages);
            messages.push(newMessage);
            tmpUserChatObjects[groupRec.id].messages = messages;
            tmpUserChatObjects[groupRec.id].status = status;
            tmpUserChatObjects[groupRec.id].group_chat = null;
            tmpUserChatObjects[groupRec.id].chat_name = groupRec.name;
            that.messageIdList.push(newMessage.id);
            rtValue = true;
            messageAccepted = true;
        }
        if ((message.rec == '' && message.reco == myId && operatorSen != null) ||
            (message.reco == myId && groupRec != null && operatorSen != null) ||
            (message.reco == myId && message.rec == 'everyoneintern' && operatorSen != null)) {
            newMessage = lzm_commonTools.clone(message);
            var cpId = '', cpName = '';
            if (newMessage.rec == '' && newMessage.reco == myId && operatorSen != null) {
                cpId = operatorSen.id;
                cpName = operatorSen.name;
            } else if (newMessage.reco == myId && groupRec != null && operatorSen != null) {
                cpId = groupRec.id;
                cpName = groupRec.name;
            } else if (newMessage.reco == myId && newMessage.rec == 'everyoneintern' && operatorSen != null) {
                cpId = 'everyoneintern';
                cpName = t('All operators');
            }
            if (typeof tmpUserChatObjects[cpId] == 'undefined') {
                tmpUserChatObjects[cpId] = {};
            }
            status = (lzm_chatDisplay.selected_view != 'mychats' || lzm_chatServerEvaluation.active_chat_reco != cpId) ? 'new' : 'read';
            newMessage.sender_name = (operatorSen != null ) ? operatorSen.name : newMessage.sen;
            messages = (typeof tmpUserChatObjects[cpId] == 'undefined' || typeof tmpUserChatObjects[cpId].messages == 'undefined') ?
                [] : lzm_commonTools.clone(tmpUserChatObjects[cpId].messages);
            messages.push(newMessage);
            tmpUserChatObjects[cpId].messages = messages;
            tmpUserChatObjects[cpId].status = status;
            tmpUserChatObjects[cpId].group_chat = null;
            tmpUserChatObjects[cpId].chat_name = cpName;
            that.messageIdList.push(newMessage.id);
            rtValue = true;
            messageAccepted = true;
        }
        if (message.sen == myId || message.sen == '0000000') {
            newMessage = lzm_commonTools.clone(message);
            cp = (newMessage.rec != newMessage.reco && newMessage.rec.indexOf('~') != -1 && newMessage.reco.indexOf('~') != -1) ?
                newMessage.rec : newMessage.reco;
            if (typeof tmpUserChatObjects[cp] == 'undefined') {
                tmpUserChatObjects[cp] = {};
            }
            newMessage.sender_name = (newMessage.sen == myId) ? lzm_chatServerEvaluation.myName : t('System');
            messages = (typeof tmpUserChatObjects[cp] == 'undefined' || typeof tmpUserChatObjects[cp].messages == 'undefined') ?
                [] : lzm_commonTools.clone(tmpUserChatObjects[cp].messages);
            messages.push(newMessage);
            status = (typeof tmpUserChatObjects[cp].status != 'undefined') ? tmpUserChatObjects[cp].status : 'read';
            status = (newMessage.sen == '0000000' || newMessage.rp == 1) ? status : 'read';
            groupChat = (typeof tmpUserChatObjects[cp].group_chat != 'undefined') ? tmpUserChatObjects[cp].group_chat : null;
            tmpUserChatObjects[cp].messages = messages;
            tmpUserChatObjects[cp].status = status;
            tmpUserChatObjects[cp].group_chat = groupChat;
            that.messageIdList.push(newMessage.id);
            rtValue = true;
            messageAccepted = true;
        }
        } catch (e) {}
        if (!messageAccepted) {
            that.debuggingMessages.push(message);
        }
        that.chatList.push(message);
    } else {
        //logit('message ' + message.id + ' already in list');
    }
    that.userChatObjects = tmpUserChatObjects;
    return rtValue;
};

LzmUserChats.prototype.removeUserChat = function(id) {
    if (typeof this.userChatObjects[id] != 'undefined') {
        delete this.userChatObjects[id];
    }
};

LzmUserChats.prototype.getUserChat = function(userId, onlyMessages) {
    onlyMessages = (typeof onlyMessages != 'undefined') ? onlyMessages : false;
    if (typeof this.userChatObjects[userId] != 'undefined') {
        if (onlyMessages) {
            return lzm_commonTools.clone(this.userChatObjects[userId].messages);
        } else {
            return lzm_commonTools.clone(this.userChatObjects[userId]);
        }
    } else {
        return null;
    }
};

LzmUserChats.prototype.getUserChatList = function() {
    return lzm_commonTools.clone(this.userChatObjects);
};

LzmUserChats.prototype.getLastActiveUserChat = function() {
    var userChatIds = Object.keys(this.userChatObjects), thisUserChat = {chat_name: null}, thisUserChatId = '';
    for (var i=userChatIds.length - 1; i>=0; i--) {
        var tmpUserChat = this.getUserChat(userChatIds[i]);
        if (tmpUserChat.my_chat && (tmpUserChat.status != 'left' ||
            ($.inArray(userChatIds[i], lzm_chatDisplay.closedChats) == -1 && typeof tmpUserChat.accepted != 'undefined'))) {
            thisUserChat = lzm_commonTools.clone(tmpUserChat);
            thisUserChatId = userChatIds[i];
            break;
        }
    }
    if (thisUserChat.chat_name != null) {
        if (typeof thisUserChat.id == 'undefined') {
            thisUserChat.id = thisUserChatId;
        }
        return thisUserChat;
    } else {
        return null;
    }
};

LzmUserChats.prototype.removeUserChatProperty = function(id, property) {
    if (typeof this.userChatObjects[id] != 'undefined') {
        delete this.userChatObjects[id][property];
    }
};

LzmUserChats.prototype.checkChatExistsAndAdd = function(chat_id) {
    var chatExists = $.inArray(chat_id, this.broswerChatIds) != -1;
    if (!chatExists) {
        this.broswerChatIds.push(chat_id);
    }
    return chatExists;
};

LzmUserChats.prototype.getChatList = function() {
    return lzm_commonTools.clone(this.chatList);
};

LzmUserChats.prototype.restoreUserChats = function(userChats) {
    var that = this, maxChatMessageCounter = that.chatMessageCounter, i = 0, x = '';
    for (x in userChats) {
        if (userChats.hasOwnProperty(x)) {
            for (i=0; i<userChats[x].messages.length; i++) {
                maxChatMessageCounter = Math.max(maxChatMessageCounter, parseInt(userChats[x].messages[i].cmc));
                if ($.inArray(userChats[x].messages[i].id, that.messageIdList) == -1) {
                    that.messageIdList.push(userChats[x].messages[i].id);
                    that.chatList.push(userChats[x].messages[i]);
                }
            }
            if ($.inArray(userChats[x].chat_id, that.broswerChatIds) == -1) {
                that.broswerChatIds.push(userChats[x].chat_id);
            }
        }
    }
    for (x in userChats) {
        if (userChats.hasOwnProperty(x)) {
            if (typeof that.userChatObjects[x] == 'undefined') {
                that.userChatObjects[x] = userChats[x];
            } else {
                var tmpMessages = lzm_commonTools.clone(that.userChatObjects[x].messages);
                for (i=0; i<that.userChatObjects[x].messages.length; i++) {
                    var newMessage = that.userChatObjects[x].messages[i];
                    newMessage.cmc += maxChatMessageCounter;
                    tmpMessages.push(newMessage);
                }
            }
        }
    }
};

function LzmResources() {
    this.idList = [];
    this.objects = {};
}

LzmResources.prototype.setResource = function(resource) {
    if ($.inArray(resource.rid, this.idList) == -1) {
        this.idList.push(resource.rid);
    }
    var usageCounter = (typeof this.objects[resource.rid] != 'undefined' && typeof this.objects[resource.rid].usage_counter != 'undefined') ?
        this.objects[resource.rid].usage_counter : (typeof resource.usage_counter != 'undefined') ? resource.usage_counter : 0;
    resource.usage_counter = usageCounter;
    this.objects[resource.rid] = resource;

};

LzmResources.prototype.getResource = function(resourceId) {
    if (typeof this.objects[resourceId] != 'undefined') {
        return lzm_commonTools.clone(this.objects[resourceId]);
    } else {
        return null;
    }
};

LzmResources.prototype.getResourceList = function(sortCriteria, searchBy) {
    sortCriteria = (typeof sortCriteria != 'undefined' && sortCriteria != '') ? sortCriteria : 'ti';
    searchBy = (typeof searchBy != 'undefined') ? searchBy : {};
    var that = this, sortedResourceList = [], tmpIdList = [], sortedIdList = [], i = 0;
    if (Object.keys(searchBy).length == 0) {
        sortedIdList = lzm_commonTools.clone(this.idList);
    } else {
        if (typeof searchBy.ty != 'undefined') {
            for (i=0; i<this.idList.length; i++) {
                if ($.inArray(this.getResource(this.idList[i]).ty, searchBy.ty.split(',')) != -1) {
                    tmpIdList.push(this.idList[i]);
                }
            }
        } else {
            tmpIdList = lzm_commonTools.clone(this.idList);
        }
        var sortByOtherCriteria = false;
        for (i=0; i<tmpIdList.length; i++) {
            if (typeof searchBy.ti != 'undefined') {
                sortByOtherCriteria = true;
                if (this.getResource(tmpIdList[i]).ti.toLowerCase().indexOf(searchBy.ti.toLowerCase()) != -1) {
                    if ($.inArray(tmpIdList[i], sortedIdList) == -1) {
                        sortedIdList.push(tmpIdList[i]);
                    }
                }
            }
            if (typeof searchBy.text != 'undefined') {
                sortByOtherCriteria = true;
                var thisResource = this.getResource(tmpIdList[i]);
                if (thisResource.ty != 3 && thisResource.ty != 4) {
                    var qrdText = thisResource.text.toLowerCase().replace(/<.*?>/g, '');
                    if (qrdText.indexOf(searchBy.text.toLowerCase()) != -1) {
                        if ($.inArray(tmpIdList[i], sortedIdList) == -1) {
                            sortedIdList.push(tmpIdList[i]);
                        }
                    }
                }
            }
            if (typeof searchBy.t != 'undefined') {
                sortByOtherCriteria = true;
                if (this.getResource(tmpIdList[i]).t.toLowerCase().indexOf(searchBy.t.toLowerCase()) != -1) {
                    if ($.inArray(tmpIdList[i], sortedIdList) == -1) {
                        sortedIdList.push(tmpIdList[i]);
                    }
                }
            }
            if (typeof searchBy.s != 'undefined') {
                sortByOtherCriteria = true;
                if (searchBy.s != '/' && ('/' + this.getResource(tmpIdList[i]).s.toLowerCase()).indexOf(searchBy.s.toLowerCase()) == 0) {
                    if ($.inArray(tmpIdList[i], sortedIdList) == -1) {
                        sortedIdList.push(tmpIdList[i]);
                    }
                }
            }
            if (typeof searchBy.parent != 'undefined') {
                sortByOtherCriteria = true;
                if (searchBy.parent == this.getResource(tmpIdList[i]).pid) {
                    if ($.inArray(tmpIdList[i], sortedIdList) == -1) {
                        sortedIdList.push(tmpIdList[i]);
                    }
                }
            }
        }
        if (!sortByOtherCriteria) {
            sortedIdList = tmpIdList;
        }
    }

    var sortResources = function(a, b) {
        var sortA = (typeof that.getResource(a)[sortCriteria] == 'string') ? that.getResource(a)[sortCriteria].toLowerCase() : that.getResource(a)[sortCriteria];
        var sortB = (typeof that.getResource(b)[sortCriteria] == 'string') ? that.getResource(b)[sortCriteria].toLowerCase() : that.getResource(b)[sortCriteria];
        var rtValue = 0;
        if (sortA > sortB) {
            rtValue = 1;
        } else if (sortA < sortB) {
            rtValue = -1;
        } else if (sortCriteria != 'ti' && that.getResource(a).ti.toLowerCase() < that.getResource(b).ti.toLowerCase()) {
            rtValue = 0.5;
        } else if (sortCriteria != 'ti' && that.getResource(a).ti.toLowerCase() > that.getResource(b).ti.toLowerCase()) {
            rtValue = -0.5;
        }
        rtValue = (sortCriteria == 'usage_counter') ? 0 - rtValue : rtValue;
        return rtValue;
    };

    sortedIdList.sort(sortResources);
    for (i=0; i<sortedIdList.length; i++) {
        sortedResourceList.push(this.getResource(sortedIdList[i]));
    }

    return sortedResourceList;
};

LzmResources.prototype.removeResource = function(resourceId) {
    if (typeof this.objects[resourceId] != 'undefined') {
        var tmpArray = [];
        for (var i=0; i<this.idList.length; i++) {
            if (this.idList[i] != resourceId) {
                tmpArray.push(this.idList[i]);
            }
        }
        this.idList = tmpArray;
        delete this.objects[resourceId];
    }
};

LzmResources.prototype.setResourceProperty = function(resourceId, property, value) {
    if (typeof this.objects[resourceId] != 'undefined') {
        this.objects[resourceId][property] = value;
    }
};

LzmResources.prototype.riseUsageCounter = function(resourceId) {
    if (typeof this.objects[resourceId] != 'undefined') {
        this.objects[resourceId]['usage_counter']++;
    }
};

function LzmReports() {
    this.idList = [];
    this.objects = {};
    this.totalReports = 0;
    this.matchingReports = 0;
    this.reportsPerPage = 20;
}

LzmReports.prototype.setReport = function(report) {
    try {
        this.idList.push(report.i);
        this.objects[report.i] = report;
    } catch(ex) {}
};

LzmReports.prototype.getReport = function (reportId) {
    if (typeof this.objects[reportId] != 'undefined') {
        return lzm_commonTools.clone(this.objects[reportId]);
    } else {
        return null;
    }
};

LzmReports.prototype.getReportList = function() {
    var reportList = [];
    for (var i=0; i<this.idList.length; i++) {
        reportList.push(lzm_commonTools.clone(this.objects[this.idList[i]]));
    }
    return reportList;
};

LzmReports.prototype.clearReports = function() {
    this.idList = [];
    this.objects = {};
};

LzmReports.prototype.setTotal = function(number) {
    this.totalReports = parseInt(number);
};

LzmReports.prototype.getTotal = function() {
    return this.totalReports;
};

LzmReports.prototype.setMatching = function(number) {
    this.matchingReports = parseInt(number);
};

LzmReports.prototype.getMatching = function() {
    return this.matchingReports;
};

LzmReports.prototype.setReportsPerPage = function(number) {
    this.reportsPerPage = parseInt(number);
};

LzmReports.prototype.getReportsPerPage = function() {
    return this.reportsPerPage;
};
