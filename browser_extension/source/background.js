'use strict';

/* global window, console, chrome, $, fds, html5notification */

var config = {
    refresh: {firstPeriodInSec: 3, periodInSec: 60, maxPeriodInSec: 600, minPeriodInSec: 3},
    notification: {useChromeNotification: true},
    browserAction: {
        titlePrefix: 'FDS - ',
        titleError: 'Unknown Error',
        titleNetworkError: 'Network Error',
        titleNotLogged: 'Authorization required',
        titleNoMessage: 'Отдыхаем',
        titleHaveMessages: 'Есть новые сообщения',
        titleRequirePermissions: 'Click fot require permissions'
    },
    iconFiles: {
        error: 'favicon-32x32.png',
        notLogged: 'favicon-32x32.png',
        noMessage: 'favicon-32x32.png',
        haveMessages: 'favicon-32x32.png',
        notification: 'favicon-16x16.png'
    },
    httpRequest: {requestTimeout: 3000}
};

var app = {};
app.data = {
    state: 'not logged',
    prevState: 'not logged',
    count: 0,
    timerId: 0,
    nextEventUpdateTime: 0,
    lastEventUpdateTime: 0,
    updateSecondsRemaining: null,
    lastRefreshPeriodInSec: config.refresh.periodInSec,
    notificationType: 'chrome',
    eventTypes: {action: true, approve: true, arbitr: true, verdict: true, help: true}
};
app.storageData = {notificationType: true, eventTypes: true};
app.storage = {};
app.permissions = {};

var events = {};
events.runtime = {};
events.browserAction = {};
events.storage = {};
events.notifications = {};
events.timer = {};

events.runtime.onInstalled = function (details) {
    console.log('call: events.runtime.onInstalled(reason: "' + details.reason + '")', details);
    app.storage.init(function () {
        events.runtime.onStartup();
    });
};

events.runtime.onStartup = function () {
    console.log('call: events.runtime.onStartup');
    if (fds.config.domain.search('local') !== -1) {
        app.permissions.check(function (granted) {
            if (granted) {
                // Требуется для отладки
            } else {
                app.data.state = 'require permissions';
            }
            app.updateActionIcon();
        });
    }
};

events.runtime.onMessage = function(message, sender, sendResponse)
{
    if (message.type === 'sendUpdateInfo') {
        app.updateFdsInfo(sender.tab.windowId);
	}
    if (message.type === 'updateFdsInfo') {
        if (app.data.nextEventUpdateTime !== false) {
            if (app.timer() > (app.data.lastEventUpdateTime + (config.refresh.minPeriodInSec * 1000))) {
                app.data.nextEventUpdateTime = app.timer();
            } else {
                app.data.nextEventUpdateTime = app.data.lastEventUpdateTime + (config.refresh.minPeriodInSec * 1000);
            }
        }
	}
    if (message.type === 'sendFdsAction' && message.group !== undefined && message.action !== undefined) {
        fds.sendAction(message.group, message.action).always(function () {
            app.data.state = 'wait';
            app.data.count = 0;
            app.updateFdsInfo();
            if (app.data.nextEventUpdateTime !== false) {
                if (app.timer() < (app.data.nextEventUpdateTime - (config.refresh.minPeriodInSec * 1000))) {
                    app.data.nextEventUpdateTime = app.timer() + (config.refresh.minPeriodInSec * 1000);
                }
            }
        });
	}
};

events.browserAction.onClicked = function (tab) {
    console.log('call: events.browserAction.onClicked', tab);
    if (app.data.state === 'require permissions') {
        return app.permissions.request();
    }
    app.openMainTab();
};

events.storage.onChanged = function (changes, namespace) {
    if (namespace === 'local') {
        var key;
        for (key in changes) {
            if (changes.hasOwnProperty(key) && app.storageData[key] === true) {
                app.data[key] = changes[key].newValue;
            }
        }
    }
};

events.notifications.onClicked = function (notificationId) {
    if (notificationId === 'notification') {
        chrome.notifications.clear(notificationId, function (wasCleared) {});
    }
};

events.notifications.onButtonClicked = function (notificationId, buttonIndex) {
    if (notificationId === 'notification') {
        chrome.notifications.clear(notificationId, function (wasCleared) {});
        if (buttonIndex === 0) {
            app.openMainTab();
        }
    }
};

events.timer.updateExternalData = function () {
    if (app.data.state === 'require permissions') {
        return;
    }
    if (app.data.nextEventUpdateTime === false) {
        return;
    }
    var updateSecondsRemaining = Math.round((app.data.nextEventUpdateTime - app.timer()) / 1000);
    if (updateSecondsRemaining > 0) {
        app.data.updateSecondsRemaining = updateSecondsRemaining;
        app.updateSecondsRemainingInfo();
    } else {
        app.data.nextEventUpdateTime = false;
        app.data.updateSecondsRemaining = false;
        app.updateSecondsRemainingInfo();
        fds.loadAllData()
            .done(function () {
                console.log('updateExternalData: done');
                var autoUpdateTime = config.refresh.periodInSec;
                app.data.lastRefreshPeriodInSec = autoUpdateTime;
                app.data.nextEventUpdateTime = app.timer() + (autoUpdateTime * 1000);
                app.data.updateSecondsRemaining = autoUpdateTime;
                app.data.state = 'wait';
                app.data.count = 0;
            })
            .fail(function () {
                console.log('updateExternalData: fail');
                var autoUpdateTime = app.data.lastRefreshPeriodInSec * 2;
                app.data.lastRefreshPeriodInSec = autoUpdateTime;
                app.data.nextEventUpdateTime = app.timer() + (autoUpdateTime * 1000);
                app.data.updateSecondsRemaining = autoUpdateTime;
                app.data.state = 'network error';
                app.data.count = 0;
//                app.data.state = 'not logged';
//                app.data.count = 0;
            })
            .always(function () {
                app.data.lastEventUpdateTime = app.timer();
                app.updateFdsInfo();
            });
    }
};

app.storage.init = function (callback) {
    var defaultValues = {};
    var key;
    for (key in app.storageData) {
        if (app.storageData.hasOwnProperty(key) && app.storageData[key] === true && app.data[key] !== undefined) {
            defaultValues[key] = app.data[key];
        }
    }
    console.log('call: app.storage.init', defaultValues);
    app.storage.update(defaultValues, callback);
};

app.storage.load = function (callback) {
    console.log('call: app.storage.load');
    var names = [];
    var key;
    for (key in app.storageData) {
        if (app.storageData.hasOwnProperty(key) && app.storageData[key] === true) {
            names.push(key);
        }
    }
    if (!names.length) {
        if (typeof callback === 'function') {
            callback();
        }
        return;
    }
    chrome.storage.local.get(names, function (items) {
        var key;
        for (key in items) {
            if (app.data.hasOwnProperty(key)) {
                app.data[key] = items[key];
            }
        }
        if (typeof callback === 'function') {
            callback();
        }
    });
};

app.storage.update = function (values, callback) {
    console.log('call: app.storage.update', values);
    var key;
    var newValues = {};
    for (key in values) {
        if (values.hasOwnProperty(key) && app.storageData[key] === true) {
            newValues[key] = values[key];
        }
    }
    chrome.storage.local.set(newValues, function () {
        if (typeof callback === 'function') {
            callback();
        }
    });
};

app.permissions.check = function(callback) {
    chrome.permissions.contains({
        permissions: ['tabs'],
        origins: ['*://*/']
    }, callback);
};

app.permissions.request = function(callback) {
    chrome.permissions.request({
        permissions: ['tabs'],
        origins: ['*://*/']
    }, function(granted) {
        if (granted) {
            app.storage.init();
        }
    });
};

app.timer = function () {
    return Date.now();
};

if (window.performance && (typeof window.performance.now === 'function')) {
    app.timer = function () {
        return Math.round(window.performance.now());
    };
}

app.updateFdsInfo = function (windowId) {
    var fdsInfo = fds.getInfo();
    if ((typeof fdsInfo.count === 'number') && fdsInfo.items !== undefined) {
        if (fdsInfo.count > 0) {
            if (app.data.state === 'wait') {
                app.data.state = 'have messages';
            }
            app.data.count = fdsInfo.count;
        } else {
            if (app.data.state === 'wait') {
                app.data.state = 'nomessage';
            }
            app.data.count = 0;
        }
    } else {
        fdsInfo = {count: 0, items: {}};
        if (app.data.state === 'wait') {
            app.data.state = 'error';
        }
        app.data.count = 0;
    }
    if (windowId === undefined) {
        app.updateActionIcon();
    }
    var updateSecondsRemaining = app.data.updateSecondsRemaining;
    var origin = chrome.extension.getURL('');
    chrome.extension.getViews({type: 'tab', windowId: windowId}).forEach(function(view) {
        if (view.postMessage !== undefined) {
            view.postMessage({type: 'onUpdateInfo', updateSecondsRemaining: updateSecondsRemaining, fdsInfo: fdsInfo}, origin);
        }
    });
};

app.updateSecondsRemainingInfo = function () {
    var updateSecondsRemaining = app.data.updateSecondsRemaining;
    var origin = chrome.extension.getURL('');
    chrome.extension.getViews({type: 'tab'}).forEach(function(view) {
        if (view.postMessage !== undefined) {
            view.postMessage({type: 'onUpdateInfo', updateSecondsRemaining: updateSecondsRemaining}, origin);
        }
    });
};

app.showNotification = function () {
    if (app.data.notificationType !== 'chrome' && app.data.notificationType !== 'html5') {
        return;
    }
//    app.data.eventTypes;
    var mainTabUrl = chrome.extension.getURL('index.html');
    chrome.tabs.query({currentWindow: true, active: true, url: mainTabUrl}, function(tabs) {
        if (!tabs.length) {
            if (app.data.notificationType === 'chrome') {
                var options = {
                    type: 'basic',
                    iconUrl: config.iconFiles.notification,
                    title: 'FDS notification',
                    message: 'Открыть страницу помощника?',
                    priority: 2,
                    buttons: [{title: 'Открыть'}, {title: 'Забить'}]
                };
                chrome.notifications.create('notification', options, function (notificationId) {});
            } else {
                html5notification.send(
                    'FDS notification',
                    'Открыть страницу помощника?',
                    'notification',
                    config.iconFiles.notification,
                    30000
                ).add(function (event) {
                    if (event === 'onclick') {
                        app.openMainTab();
                    }
                });
            }
        }
    });
};

app.updateActionIcon = function () {
    console.log('call: app.updateActionIcon', app.data);
    switch (app.data.state) {
        case 'not logged':
            chrome.browserAction.setIcon({path: config.iconFiles.notLogged});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleNotLogged});
            chrome.browserAction.setBadgeBackgroundColor({color: [190, 190, 190, 230]});
            chrome.browserAction.setBadgeText({text: '!!!'});
            break;
        case 'nomessage':
            chrome.browserAction.setIcon({path: config.iconFiles.noMessage});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleNoMessage});
            chrome.browserAction.setBadgeBackgroundColor({color: [0, 0, 0, 0]});
            chrome.browserAction.setBadgeText({text: ''});
            break;
        case 'have messages':
            chrome.browserAction.setIcon({path: config.iconFiles.haveMessages});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleHaveMessages});
            chrome.browserAction.setBadgeBackgroundColor({color: [0, 128, 0, 230]});
            chrome.browserAction.setBadgeText({text: app.data.count.toString()});
            if (app.data.prevState !== app.data.state) {
                app.showNotification();
            }
            break;
        case 'network error':
            chrome.browserAction.setIcon({path: config.iconFiles.error});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleNetworkError});
            chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
            chrome.browserAction.setBadgeText({text: '?'});
            break;
        case 'require permissions':
            chrome.browserAction.setIcon({path: config.iconFiles.error});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleRequirePermissions});
            chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
            chrome.browserAction.setBadgeText({text: '?'});
            break;
        default:
            chrome.browserAction.setIcon({path: config.iconFiles.error});
            chrome.browserAction.setTitle({title: config.browserAction.titlePrefix + config.browserAction.titleError});
            chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
            chrome.browserAction.setBadgeText({text: '?'});
            break;
    }
    app.data.prevState = app.data.state;
};

app.openMainTab = function () {
    var mainTabUrl = chrome.extension.getURL('index.html');
    chrome.tabs.query({currentWindow: true, url: mainTabUrl}, function(tabs) {
        if (tabs.length) {
            var tab = tabs[0];
            chrome.tabs.update(tab.id, {active: true}, function (tab) {
                chrome.windows.update(tab.windowId, {focused: true});
            });
        } else {
            chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                if (tabs.length) {
                    var tab = tabs[0];
                    chrome.tabs.create({url: mainTabUrl, openerTabId: tab.id, index: tab.index + 1}, function (tab) {
                        chrome.windows.update(tab.windowId, {focused: true});
                    });
                }
            });
        }
    });
};

app.run = function () {
    app.updateActionIcon();
    app.data.nextEventUpdateTime = app.timer() + (config.refresh.firstPeriodInSec * 1000);
    app.data.timerId = window.setInterval(events.timer.updateExternalData, 1000);
}

chrome.storage.onChanged.addListener(events.storage.onChanged);
app.storage.load(function () {
    chrome.browserAction.onClicked.addListener(events.browserAction.onClicked);
    chrome.notifications.onClicked.addListener(events.notifications.onClicked);
    chrome.notifications.onButtonClicked.addListener(events.notifications.onButtonClicked);
});
chrome.runtime.onInstalled.addListener(events.runtime.onInstalled);
chrome.runtime.onStartup.addListener(events.runtime.onStartup);
chrome.runtime.onMessage.addListener(events.runtime.onMessage);
app.run();
