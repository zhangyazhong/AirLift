const server_host = 'sissors.cn'; 
const server_http = 'https://' + server_host;
const server_ws = 'wss://' + server_host;

var last_text = '';
var active_container = $('#login-container');
var socket;

$('#login-button').click(function() {
    var email = $('#email_input').val();
    var password = $('#password_input').val();
    $.ajax({
        type: "POST",
        url: server_http + '/flexible/user/login',
        data: {
            'method': 'password',
            'email': email,
            'password': password
        },
        success: function(result) {
            if (result.status_code !== undefined && result.status_code !== 0) {
            } else {
                fetchText();
                active($('#upload-container'));
                connectSocket();
                bindDevice();
            }
        }
    });
});

$('#upload-button').click(function() {
    beforeUpload();
    var text = $('#text-area').val();
    $.ajax({
        type: "POST",
        url: server_http + '/flexible/text/share',
        data: {  
            'text': text
        },
        success: function(result) {
            if (result.status_code !== undefined && result.status_code !== 0) {
                notify($('#text-alert-info'), result.status_msg);
            } else {
                afterUpload($('#text-success-info'), '分享成功');
                last_text = text;
                persist("text", text);
            }
            afterUpload();
        },
        error: function() {
            afterUpload($('#text-alert-info'), '分享失败');
        }
    });
});

$('#undo-button').click(function() {
    $('#text-area').val(last_text);
});

$(function() {
    initConfig();
    chrome.storage.local.get('token', function(result) {
        if (result['token'] !== undefined && result['token'].length > 0) {
            active($('#upload-container'));
            loadText();
            $.ajax({
                type: "POST",
                url: server_http + '/flexible/user/login',
                data: {
                    'method': 'token',
                    'token': result['token']
                },
                success: function(result) {
                    if (result.status_code !== undefined && result.status_code !== 0) {
                        active($('#login-container'));
                    } else {
                        fetchText();
                        connectSocket();
                    }
                },
                error: function() {
                    active($('#login-container'));
                }
            });
        }
    });
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
 * 绑定设备，并把user token记录到chrome storage local及sync中
 */
function bindDevice() {
    $.ajax({
        type: "POST",
        url: server_http + '/flexible/user/bind',
        success: function(result) {
            if (result.status_code !== undefined && result.status_code !== 0) {
            } else {
                const token = result.deviceToken;
                chrome.storage.local.get('token', function(result) {
                    result['token'] = token;
                    chrome.storage.local.set(result);
                });
                chrome.storage.sync.get('token', function (result) {
                    result['token'] = token;
                    chrome.storage.sync.set(result);
                });
            }
        }
    });
}

/**
 * 与server建立web socket连接，接收到消息后，显示到文本框
 */
function connectSocket() {
    socket = new WebSocket(server_ws + '/flexible/ws/text');
    socket.onopen = function(event) {
        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'text': {
                    displayText(data.text.text);
                }
            }
        };
    };
}

/**
 * 从chrome storage中拉取缓存的消息，并显示到文本框
 */
function loadText() {
    chrome.storage.local.get('text', function(result) {
        displayText(result['text']);
    });
}

/**
 * 从server中拉取消息，并显示到文本框
 */
function fetchText() {
    $.ajax({
        type: "GET",
        url: server_http + '/flexible/text/fetch',
        success: function(result) {
            if (result.status_code !== undefined && result.status_code !== 0) {
            } else {
                displayText(result.text);
            }
        }
    });
}

/**
 * 显示text
 *
 * @param text 文本内容
 */
function displayText(text) {
    $('#text-area').val(text);
    last_text = text;
    persist('text', text);
}

/**
 * 弹出提示框
 *
 * @param dom 提示框的dom选择器
 * @param info 提示消息
 */
function notify(dom, info) {
    dom.html(info);
    dom.css('display', 'block');
    window.setTimeout(function() {
        dom.fadeOut(500);
    }, 1000);
}

/**
 * 激活某个顶级container，相当于切换页面
 *
 * @param dom container选择器
 */
function active(dom) {
    dom.css('display', 'block');
    active_container.css('display', 'none');
    active_container = dom;
}

/**
 * 使用chrome storage存储key-value
 *
 * @param key 键
 * @param value 值
 */
function persist(key, value) {
    chrome.storage.local.get(key, function(result) {
        result[key] = value;
        chrome.storage.local.set(result);
    });
}

/**
 * 上传之前要做的东西
 */
function beforeUpload() {
    NProgress.start();
}

/**
 * 上传之后要做的东西
 */
function afterUpload(dom, info) {
    if (NProgress.status <= 0.85) {
        NProgress.set(0.85);
    }
    window.setTimeout(function () {
        NProgress.done();
        notify(dom, info);
    }, 500);
}

