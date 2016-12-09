'use strict';

/* global window, chrome, $ */

$(function() {
    var lockButtonTime = 1000;

    $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('ul.dropdown-menu [data-toggle=dropdown]').parent().removeClass('open');
        $(this).parent().addClass('open');
    });
    $('ul.dropdown-menu [data-toggle=dropdown]').on('mouseenter', function(event) {
        event.preventDefault();
        event.stopPropagation();
        $('ul.dropdown-menu [data-toggle=dropdown]').parent().removeClass('open');
    });

    var updateFdsFrameSize = function (w) {
        $('body').css('paddingTop', $('.navbar-fixed-top').outerHeight());
        var $frame = $('#fdsFrame');
        $frame.height($(window).innerHeight() - $frame.offset().top - 8);
    };
    $(window).resize(function() {
        updateFdsFrameSize();
    });

    $('.navbar-fixed-top a[target=fdsFrame]').on('click', function(event) {
        $('#fdsDiv').hide();
        $('#fdsFrame').show();
        updateFdsFrameSize();
    });
    $('.navbar-fixed-top a[target=fdsFrame]').on('click', function(event) {
        $('#fdsDiv').hide();
        $('#fdsFrame').show();
    });
    $('.navmenu-helper').on('click', function(event) {
        $('#fdsFrame').attr('src', 'about:blank');
        $('#fdsFrame').hide();
        $('#fdsDiv').show();
    });

    var createHashList = function (arrList, hashFunc) {
        if (!arrList.forEach) {
            return {};
        }
        var result = {};
        arrList.forEach(function (value) {
            var hash = hashFunc ? JSON.stringify(hashFunc(value)) : JSON.stringify(value);
            value.hash = hash;
            result[hash] = value;
        });
        return result;
    };

    var cleanOutdatedElementByHash = function (arrElList, hashedList) {
        arrElList.forEach(function (value) {
            var $el = $(value);
            var hash = $el.data('hash');
            if (hashedList[hash] !== undefined) {
                hashedList[hash].present = true;
            } else {
                $el.remove();
            }
        });
    };

    var fdsInfoUpdate = function (fdsInfo) {
        $('.alert-event-count').text(fdsInfo.count);
        var showCount = 0;
        var $liGroup;
        var hashedList;
        // Добавление "action"
        if (fdsInfo.items && fdsInfo.items.action && fdsInfo.items.action.length) {
            showCount += fdsInfo.items.action.length;
            $liGroup = $('#actionEvents .list-group');
            hashedList = createHashList(fdsInfo.items.action);
            cleanOutdatedElementByHash($liGroup.find('li:gt(0)').toArray(), hashedList);
            fdsInfo.items.action.forEach(function (value) {
                if (value.present !== true) {
                    var $el = $liGroup.find('li.el-template').clone();
                    $el.data('hash', value.hash).data('id', value.id).data('text', value.text);
                    $el.find('.el-text').text(value.text);
                    $el.removeClass('el-template').appendTo($liGroup);
                    window.setTimeout(function() {
                        $el.find('button').removeClass('disabled');
                    }, lockButtonTime);
                    $el.find('button').on('click', function (event) {
                        var $this = $(this);
                        var fdsAction = {id: $this.parent().data('id'), text: $this.parent().data('text'), post: {mark: $this.data('mark')}};
                        chrome.runtime.sendMessage({type: 'sendFdsAction', group: 'action', action: fdsAction});
                    });
                }
            });
            $('#actionEvents').show();
        } else {
            $('#actionEvents').hide();
        }
        // Добавление "approve"
        if (fdsInfo.items && fdsInfo.items.approve && fdsInfo.items.approve.length) {
            showCount += fdsInfo.items.approve.length;
            $liGroup = $('#approveEvents .list-group');
            hashedList = createHashList(fdsInfo.items.approve);
            cleanOutdatedElementByHash($liGroup.find('li:gt(0)').toArray(), hashedList);
            fdsInfo.items.approve.forEach(function (value) {
                if (value.present !== true) {
                    var $el = $liGroup.find('li.el-template').clone();
                    $el.data('hash', value.hash).data('id', value.id).data('text', value.text);
                    var $elBlockquote = $el.find('div');
                    $elBlockquote.css('borderLeftColor', value.commentColor);
                    $elBlockquote.find('.el-text').text(value.text);
                    $elBlockquote.find('.el-comment').text(value.comment).css('color', value.commentColor);
                    if (value.commentColor !== 'green') {
                        $el.find('button.btn-success').removeClass('btn-success').addClass('btn-warning');
                    }
                    $el.removeClass('el-template').appendTo($liGroup);
                    window.setTimeout(function() {
                        $el.find('button').removeClass('disabled');
                    }, lockButtonTime);
                    $el.find('button').on('click', function (event) {
                        var $this = $(this);
                        var fdsAction = {id: $this.parent().data('id'), text: $this.parent().data('text'), post: {virt: $this.data('virt')}};
                        chrome.runtime.sendMessage({type: 'sendFdsAction', group: 'approve', action: fdsAction});
                    });
                }
            });
            $('#approveEvents').show();
        } else {
            $('#approveEvents').hide();
        }
        // Добавление "arbitr"
        if (fdsInfo.items && fdsInfo.items.arbitr && fdsInfo.items.arbitr.length) {
            showCount += fdsInfo.items.arbitr.length;
            $liGroup = $('#arbitrEvents .list-group');
            hashedList = createHashList(fdsInfo.items.arbitr);
            cleanOutdatedElementByHash($liGroup.find('li:gt(0)').toArray(), hashedList);
            fdsInfo.items.arbitr.forEach(function (value) {
                if (value.present !== true) {
                    var $el = $liGroup.find('li.el-template').clone();
                    $el.data('hash', value.hash).data('id', value.id).data('text', value.text);
                    $el.find('.el-text').text(value.text);
                    if (value.comment) {
                        $el.find('.el-comment').text(value.comment);
                    } else {
                        $el.find('.el-comment').hide();
                    }
                    $el.removeClass('el-template').appendTo($liGroup);
                    window.setTimeout(function() {
                        $el.find('button').removeClass('disabled');
                    }, lockButtonTime);
                    $el.find('button').on('click', function (event) {
                        var $this = $(this);
                        var fdsAction = {id: $this.parent().data('id'), text: $this.parent().data('text'), post: {mark: $this.data('mark')}};
                        chrome.runtime.sendMessage({type: 'sendFdsAction', group: 'arbitr', action: fdsAction});
                    });
                }
            });
            $('#arbitrEvents').show();
        } else {
            $('#arbitrEvents').hide();
        }
        // Добавление "verdict"
        if (fdsInfo.items && fdsInfo.items.verdict && fdsInfo.items.verdict.length) {
            showCount += fdsInfo.items.verdict.length;
            $liGroup = $('#verdictEvents .list-group');
            hashedList = createHashList(fdsInfo.items.verdict);
            cleanOutdatedElementByHash($liGroup.find('li:gt(0)').toArray(), hashedList);
            fdsInfo.items.verdict.forEach(function (value) {
                if (value.present !== true) {
                    var $el = $liGroup.find('li.el-template').clone();
                    $el.data('hash', value.hash).data('id', value.id).data('text', value.text);
                    $el.find('.el-text').text(value.text);
                    if (value.comment) {
                        $el.find('.el-comment').text(value.comment);
                    } else {
                        $el.find('.el-comment').hide();
                    }
                    $el.removeClass('el-template').appendTo($liGroup);
                    window.setTimeout(function() {
                        $el.find('button').removeClass('disabled');
                    }, lockButtonTime);
                    $el.find('button').on('click', function (event) {
                        var $this = $(this);
                        var fdsAction = {id: $this.parent().data('id'), text: $this.parent().data('text'), post: {mark: $this.data('mark')}};
                        chrome.runtime.sendMessage({type: 'sendFdsAction', group: 'verdict', action: fdsAction});
                    });
                }
            });
            $('#verdictEvents').show();
        } else {
            $('#verdictEvents').hide();
        }
        // Добавление "help"
        if (fdsInfo.items && fdsInfo.items.help && fdsInfo.items.help.length) {
            showCount += fdsInfo.items.help.length;
            $liGroup = $('#helpEvents .list-group');
            hashedList = createHashList(fdsInfo.items.help);
            cleanOutdatedElementByHash($liGroup.find('li:gt(0)').toArray(), hashedList);
            fdsInfo.items.help.forEach(function (value) {
                if (value.present !== true) {
                    var $el = $liGroup.find('li.el-template').clone();
                    $el.data('hash', value.hash).data('id', value.id).data('text', value.text);
                    $el.find('.el-text').text(value.text);
                    $el.removeClass('el-template').appendTo($liGroup);
                    window.setTimeout(function() {
                        $el.find('button').removeClass('disabled');
                    }, lockButtonTime);
                    $el.find('button').on('click', function (event) {
                        var $this = $(this);
                        var post = ($this.data('vote') === 'plus') ? {vote: 'plus'} : {};
                        var fdsAction = {id: $this.parent().parent().data('id'), text: $this.parent().parent().data('text'), post: post};
                        chrome.runtime.sendMessage({type: 'sendFdsAction', group: 'help', action: fdsAction});
                    });
                }
            });
            $('#helpEvents').show();
        } else {
            $('#helpEvents').hide();
        }
        // Конец добавлений
        if (showCount) {
            $('#noEvents').hide();
        } else {
            $('#noEvents').show();
        }
    };

    var onMessage = function (event) {
        if (event.target !== window || event.data === undefined) {
            return;
        }
        if (event.data.type !== 'onUpdateInfo' || event.data.updateSecondsRemaining === undefined) {
            return;
        }
        if (event.data.fdsInfo !== undefined) {
            fdsInfoUpdate(event.data.fdsInfo);
        }
        var updateSecondsRemaining = event.data.updateSecondsRemaining;
        if (updateSecondsRemaining === false) {
            updateSecondsRemaining = 'Обновление';
        }
        $('.alert-event-update').text(updateSecondsRemaining);
    };

    window.addEventListener('message', onMessage, false);
    chrome.runtime.sendMessage({type: 'sendUpdateInfo'});
    $('.navmenu-update').on('click', function(event) {
        chrome.runtime.sendMessage({type: 'updateFdsInfo'});
    });
});
