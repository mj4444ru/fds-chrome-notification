'use strict';

/* global chrome, console, $ */

$(function() {
    $('#notificationType').on('change', function(event) {
        chrome.storage.local.set({notificationType: this.value});
        console.log('chrome.storage.local.set: notificationType =>', this.value);
    });
    $('#eventTypes input:checkbox').on('change', function(event) {
        var eventTypes = {};
        $('#eventTypes input:checkbox').each(function (index, item) {
            eventTypes[item.value] = item.checked;
        });
        chrome.storage.local.set({eventTypes: eventTypes});
        console.log('chrome.storage.local.set: eventTypes =>', eventTypes);
    });
    chrome.storage.local.get({
        notificationType: 'chrome',
        eventTypes: {action: true, approve: true, arbitr: true, verdict: true, help: true}
    }, function(items) {
        $('#notificationType').val(items.notificationType);
        $('#eventTypes input:checkbox').each(function (index, item) {
            item.checked = items.eventTypes[item.value];
        });
    });
});
