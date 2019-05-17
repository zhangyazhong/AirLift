let last_text = '';
let active_container = $('#upload-container');
let notify_container = $('#text-success-info');
let text_display_container = $('#text-area');

$('#text-upload-button').click(function() {
    let text_content = text_display_container.val();
    broadcastText(text_content);
});

$('#text-undo-button').click(function() {
    displayText(last_text);
});

$('#text-refresh-button').click(function() {
    refreshText();
});


$(function() {
    initConfig();
    loadText();
});

/**
 * 初始化配置项
 */
function initConfig() {
    // 配置进度条
    NProgress.configure({
        showSpinner: false,
        trickleSpeed: 100
    });
}

/**
 * 从chrome storage中拉取消息，并显示到文本框
 */
function loadText() {
    chrome.storage.sync.get(['text-content'], function(result) {
        last_text = result['text-content'];
        displayText(last_text);
    });
}

/**
 * 从chrome storage中拉取消息，并刷新到文本框
 */
function refreshText() {
    beforeTask();
    chrome.storage.sync.get(['text-content'], function(result) {
        last_text = result['text-content'];
        displayText(last_text);
        afterTask('刷新成功');
    });
}

/**
 * 将编辑的文本广播至其它设备
 */
function broadcastText(text_content) {
    beforeTask();
    chrome.storage.sync.set({'text-content': text_content}, function() {
        last_text = text_content;
        afterTask('分享成功');
    });
}


/**
 * 显示text
 *
 * @param text 文本内容
 */
function displayText(text) {
    text_display_container.val(text);
    // persist('text', text);
}

/**
 * 弹出提示框
 *
 * @param info 提示消息
 */
function notify(info) {
    notify_container.html(info);
    notify_container.css('display', 'block');
    window.setTimeout(function() {
        notify_container.fadeOut(500);
    }, 1000);
}

/**
 * 激活某个顶级container，相当于切换页面
 *
 * @param dom container选择器
 */
function active(dom) {
    active_container.css('display', 'none');
    dom.css('display', 'block');
    active_container = dom;
}

/**
 * 上传之前要做的事情
 */
function beforeTask() {
    $('#loader-circle').css('display', 'block');
    NProgress.start();
}

/**
 * 上传之后要做的事情
 *
 * @param info 提示消息
 */
function afterTask(info) {
    if (NProgress.status <= 0.85) {
        NProgress.set(0.85);
    }
    window.setTimeout(function () {
        NProgress.done();
        notify(info);
        $('#loader-circle').css('display', 'none');
    }, 500);
}

