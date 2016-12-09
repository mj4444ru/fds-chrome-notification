'use strict';

/* global window, Notification, $ */

var html5notification = {};

html5notification.results = {
    notSupport: {status: false, msg: 'Ваш браузер не поддерживает HTML Notifications, его необходимо обновить.', code: 'notSupport'},
    granted: {status: true, msg: 'Уведомления разрешены.', code: 'granted'},
    denied: {status: false, msg: 'Вы запретили показывать уведомления.', code: 'denied'},
    notAnswer: {status: false, msg: 'Вы не дали согласие на показ уведомлений.', code: 'notAnswer'}
};

/**
 * Возвращает объект со свойствами status, msg, code.
 *
 * @returns {object}
 */
html5notification.getStatus = function () {
    // Проверим, поддерживает ли браузер HTML5 Notifications
    if (!('Notification' in window)) {
        return html5notification.results.notSupport;
    }
    // Проверим, есть ли разрешение на показ уведомлений
    if (Notification.permission === 'granted') {
        return html5notification.results.granted;
    }
    // Проверим, есть ли запрет на показ уведомлений
    if (Notification.permission === 'denied') {
        return html5notification.results.denied;
    }
    return html5notification.results.notAnswer;
};

/**
 * Возвращает $.Callbacks, который вызывает событие, на входе которого объект со свойствами status, msg, code
 *
 * @returns {Callbacks}
 */

html5notification.requestPermission = function () {
    var $callbacks = $.Callbacks('once memory');
    // Проверим, поддерживает ли браузер HTML5 Notifications
    if (!('Notification' in window)) {
        return $callbacks.fire(html5notification.results.notSupport);
    }
    // Пытаемся запросить разрешение на показ уведомлений
    Notification.requestPermission(function (permission) {
        // Если права на показ уведомлений успешно получены
        if (permission === 'granted') {
            return $callbacks.fire(html5notification.results.granted);
        }
        // Если пользователь отклонил наш запрос на показ уведомлений
        if (permission === 'denied') {
            return $callbacks.fire(html5notification.results.denied);
        }
        return $callbacks.fire(html5notification.results.notAnswer);
    });
    return $callbacks;
};

/**
 * Возвращает $.Callbacks, который вызывает события с параметром (event).
 * event: onclick, onshow, onclose, onerror
 *
 * @param {string} title Заголовок уведомления
 * @param {string} body Тело уведомления
 * @param {string} tag Тег группировки уведомлений
 * @param {string} icon Путь к файлу иконки уведомления
 * @param {integer} timeout Количество микросекунд до автоскрытия или 0 для отключения автоскрытия
 * @param {bool} noautofocus Отключает автофокус при клике
 * @returns {Callbacks}
 */
html5notification.send = function (title, body, tag, icon, timeout, noautofocus) {
    var $callbacks = $.Callbacks('memory');
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return $callbacks.fire('onerror');
    }
    var notification = new Notification(title, {body: body, tag: tag, icon: icon});
    notification.onclick = function() {
        if (!noautofocus) {
            window.focus();
            notification.close();
        }
        $callbacks.fire('onclick');
    };
    var closeTimer;
    notification.onshow = function() {
        if ($.isNumeric(timeout) && timeout > 0) {
            closeTimer = window.setTimeout(function() {
                closeTimer = undefined;
                notification.close();
            }, timeout);
        }
        $callbacks.fire('onshow');
    };
    notification.onclose = function() {
        if (closeTimer) {
            window.clearTimeout(closeTimer);
            closeTimer = undefined;
        }
        $callbacks.fire('onclose');
    };
    notification.onerror = function() {
        $callbacks.fire('onerror');
    };
    return $callbacks;
};
