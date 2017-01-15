'use strict';

/* global window, console, $ */

var fdsConfig = {
    domain: 'http://freedomsex.me/',
    url: {
        action: 'security/action/',
        approve: 'security/approve/',
        arbitr: 'security/arbitr/',
        verdict: 'security/verdict/',
        help: 'security/help/',
        helpPromo: 'admin/promo/',
        helpReply: 'admin/sethelp/?id={{ID}}&ln=0',
        abuse: 'userinfo/abuse/'
    },
    relevanceItemTime: 3000
};

var fds = {};
fds.config = fdsConfig;
fds.sendAction = {};
fds.load = {};
fds.parse = {};
fds.int = {};
fds.int.data = {items: {}, relevanceTimes: {}};
fds.int.data.items = {action: [], approve: [], arbitr: [], verdict: [], help: [], abuse: []};

fds.getInfo = function () {
    var info = {count: 0, items: {}};
    var dataItems = fds.int.data.items;
    var key;
    var items;
    var forEachFunc = function (item) {
        info.count++;
        items.push(item.pub);
    };
    for (key in dataItems) {
        if (dataItems.hasOwnProperty(key)) {
            items = [];
            dataItems[key].forEach(forEachFunc);
            info.items[key] = items;
        }
    }
    return info;
};

fds.timer = function () {
    return Date.now();
};

if (window.performance && (typeof window.performance.now === 'function')) {
    fds.timer = function () {
        return Math.round(window.performance.now());
    };
}

fds.sendAction = function (actionGroup, actionData) {
    var $Deferred;
    if (fds.sendAction[actionGroup] && fds.int.data.items[actionGroup] && actionData.post) {
        fds.int.data.items[actionGroup].forEach(function (value) {
            if (actionData.id === value.pub.id && actionData.text === value.pub.text) {
                var post = actionData.post;
                var key;
                for (key in value.hidden) {
                    post[key] = value.hidden[key];
                }
                var action = value.action ? value.action.substr(1) : undefined;
                var action2 = value.action2 ? value.action2.substr(1) : undefined;
                $Deferred = fds.sendAction[actionGroup](post, action, action2);
            }
        });
    }
    return $Deferred ? $Deferred : $.Deferred().promise();
};

fds.sendAction.action = function (data, action) {
    if (data.mark === undefined) {
        return $.Deferred().promise();
    }
    return fds.parse.action($.post(fds.config.domain + action, data));
};

fds.sendAction.approve = function (data, action, actionArbitr) {
    if (data.virt === undefined) {
        return $.Deferred().promise();
    }
    if (data.virt === 'arbitr') {
        return fds.parse.approve($.get(fds.config.domain + actionArbitr));
    }
    return fds.parse.approve($.post(fds.config.domain + action, data));
};

fds.sendAction.arbitr = function (data, action) {
    if (data.mark === undefined) {
        return $.Deferred().promise();
    }
    return fds.parse.arbitr($.post(fds.config.domain + action, data));
};

fds.sendAction.verdict = function (data, action, actionArbitr) {
    if (data.mark === undefined) {
        return $.Deferred().promise();
    }
    if (data.mark === 'arbitr') {
        return fds.parse.verdict($.get(fds.config.domain + actionArbitr));
    }
    return fds.parse.verdict($.post(fds.config.domain + action, data));
};

fds.sendAction.help = function (data, actionPlus, action) {
    if (data.vote === 'plus') {
        return fds.parse.help($.get(fds.config.domain + actionPlus));
    }
    if (data.vote === 'promo') {
        return fds.parse.help($.post(fds.config.domain + fds.config.url.helpPromo, data));
    }
    return fds.parse.help($.post(fds.config.domain + action, data));
};

fds.sendAction.abuse = function () {
    return $.Deferred().promise();
};

fds.load.action = function () {
    if (fds.int.checkRelevanceTime('loadAction')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.action($.get(fds.config.domain + fds.config.url.action));
};

fds.load.approve = function () {
    if (fds.int.checkRelevanceTime('loadApprove')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.approve($.get(fds.config.domain + fds.config.url.approve));
};

fds.load.arbitr = function () {
    if (fds.int.checkRelevanceTime('loadArbitr')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.arbitr($.get(fds.config.domain + fds.config.url.arbitr));
};

fds.load.verdict = function () {
    if (fds.int.checkRelevanceTime('loadVerdict')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.verdict($.get(fds.config.domain + fds.config.url.verdict));
};

fds.load.help = function () {
    if (fds.int.checkRelevanceTime('loadHelp')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.help($.get(fds.config.domain + fds.config.url.help));
};

fds.load.abuse = function () {
    if (fds.int.checkRelevanceTime('loadAbuse')) {
        return $.Deferred().resolve().promise();
    }
    return fds.parse.abuse($.get(fds.config.domain + fds.config.url.abuse));
};

fds.parse.action = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                if ($iBl.length) {
                    var text = $iBl.children('div:first').text().trim();
                    if (text) {
                        var item = {pub: {id: '', text: text}, action: '', hidden: {}};
                        fds.int.loadFormData($iBl.children('div').children('form'), item);
                        if (item.pub.id) {
                            newItems.push(item);
                        }
                    }
                }
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.action = newItems;
            fds.int.setRelevanceTime('loadAction');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.action = [];
            fds.int.setRelevanceTime('loadAction');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.parse.approve = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                if ($iBl.length) {
                    var text = $iBl.children('div:first').text().trim();
                    var $comment = $iBl.children('div').children('form').children('span');
                    var comment = $comment.text().trim();
                    var commentColor = $comment.css('color');
                    if (text) {
                        var item = {pub: {id: '', text: text, comment: comment, commentColor: commentColor}, action: '', action2: '', hidden: {}};
                        fds.int.loadFormData($iBl.children('div').children('form'), item);
                        if (item.pub.id) {
                            newItems.push(item);
                        }
                    }
                }
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.approve = newItems;
            fds.int.setRelevanceTime('loadApprove');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.approve = [];
            fds.int.setRelevanceTime('loadApprove');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.parse.arbitr = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                if ($iBl.length) {
                    var text = $iBl.children('div:first').text().trim();
                    var $comment = $iBl.children('div:eq(1)');
                    var comment =  $comment.children('form').length ? undefined : $comment.text().trim();
                    if (text) {
                        var item = {pub: {id: '', text: text, comment: comment}, action: '', hidden: {}};
                        fds.int.loadFormData($iBl.children('div').children('form'), item);
                        if (item.pub.id) {
                            newItems.push(item);
                        }
                    }
                }
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.arbitr = newItems;
            fds.int.setRelevanceTime('loadArbitr');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.arbitr = [];
            fds.int.setRelevanceTime('loadArbitr');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.parse.verdict = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                if ($iBl.length) {
                    var text = $iBl.children('div:first').text().trim();
                    var $comment = $iBl.children('div:eq(1)');
                    var comment = $comment.children('form').length ? undefined : $comment.text().trim();
                    if (text) {
                        var item = {pub: {id: '', text: text, comment: comment}, action: '', action2: '', hidden: {}};
                        fds.int.loadFormData($iBl.children('div').children('form'), item);
                        if (item.pub.id) {
                            newItems.push(item);
                        }
                    }
                }
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.verdict = newItems;
            fds.int.setRelevanceTime('loadVerdict');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.verdict = [];
            fds.int.setRelevanceTime('loadVerdict');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.parse.help = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                var $form = $iBl.find('form');
                var actionMinus = $form.attr('action');
                var $helpDivList = $form.children('div').children('div');
                $helpDivList.each(function (index, e) {
                    var $e = $(e);
                    var id = $e.find('input[name="del[]"]').attr('value');
                    var text = $e.find('td:first').text().trim();
                    var replyUrl = (fds.config.domain + fds.config.url.helpReply).replace('{{ID}}', id);
                    var action = $e.find('a').attr('href');
                    if (text && action && id) {
                        var item = {pub: {id: id, text: text, replyUrl: replyUrl}, action: action, action2: actionMinus, hidden: {'del[]': id}};
                        newItems.push(item);
                    }
                });
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.help = newItems;
            fds.int.setRelevanceTime('loadHelp');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.help = [];
            fds.int.setRelevanceTime('loadHelp');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.parse.abuse = function ($request) {
    var $deferred = $.Deferred();
    $request
        .done(function (data) {
            var newItems = [];
            try {
                var $iBl = $(data).children("#page_cont").children('#inner_block');
                var $abuseDivList = $iBl.find('div.brdlft');
                $abuseDivList.each(function (index, e) {
                    var $e = $(e);
                    var $e2 = $(e).prev();
                    var $a = $e.find('a');
                    var $aUsers = $e2.find('a');
                    var aUser1 = $aUsers.get(0);
                    var aUser2 = $aUsers.get(1);
                    var aUser3 = $aUsers.get(2);
                    var text = $a.text().trim();
                    var url = fds.config.domain + $a.attr('href').substr(1);
                    var subjectUserId = aUser1.getAttribute('href').substr(1);
                    var subjectUserLink = fds.config.domain + subjectUserId;
                    var subjectUserName = aUser1.textContent;
                    var subjectUserProfLink = fds.config.domain + aUser2.getAttribute('href').substr(1);
                    var fromUserId = aUser3.getAttribute('href').substr(1);
                    var fromUserLink = fds.config.domain + fromUserId;
                    var fromUserName = aUser3.textContent;
                    var fromUserProfLink = fds.config.domain + aUser2.getAttribute('href').substr(1).replace(subjectUserId, fromUserId);
                    if (text && url) {
                        var item = {pub: {text: text, url: url, subjectUserId: subjectUserId, subjectUserLink: subjectUserLink, subjectUserName: subjectUserName, subjectUserProfLink: subjectUserProfLink, fromUserId: fromUserId, fromUserLink: fromUserLink, fromUserName: fromUserName, fromUserProfLink: fromUserProfLink}, hidden: {}};
                        newItems.push(item);
                    }
                });
            } catch (e) {
                console.error('Error ' + e.name + ':' + e.message, e);
            }
            fds.int.data.items.abuse = newItems;
            fds.int.setRelevanceTime('loadAbuse');
            $deferred.resolve();
        })
        .fail(function () {
            fds.int.data.items.abuse = [];
            fds.int.setRelevanceTime('loadAbuse');
            $deferred.reject();
        });
    return $deferred.promise();
};

fds.loadAllData = function () {
    var $deferred1 = fds.load.action();
    var $deferred2 = fds.load.approve();
    var $deferred3 = fds.load.arbitr();
    var $deferred4 = fds.load.verdict();
    var $deferred5 = fds.load.help();
    var $deferred6 = fds.load.abuse();
    return $.when($deferred1, $deferred2, $deferred3, $deferred4, $deferred5, $deferred6).promise();
};

fds.int.checkRelevanceTime = function(name) {
    var relevanceTimes = fds.int.data.relevanceTimes;
    return (relevanceTimes[name] !== undefined && relevanceTimes[name] > fds.timer()) ? true : false;
};

fds.int.setRelevanceTime = function(name) {
    var relevanceTimes = fds.int.data.relevanceTimes;
    relevanceTimes[name] = fds.timer() + fds.config.relevanceItemTime;
};

fds.int.loadFormData = function ($form, item) {
    item.action = $form.attr('action');
    if (item.action2 !== undefined) {
        $form.children('a').each(function(index, e) {
           item.action2 = e.getAttribute('href');
        });
    }
    $form.children('input[type=hidden]').each(function(index, e) {
        if (item.pub[e.getAttribute('name')] !== undefined) {
            item.pub[e.getAttribute('name')] = e.getAttribute('value');
        }
        item.hidden[e.getAttribute('name')] = e.getAttribute('value');
    });
};
