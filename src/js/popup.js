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
                active($('#share-container'));
                connectSocket();
                bindDevice();
            }
        }
    });
});

$('#share-button').click(function() {
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
                last_text = text;
                notify($('#text-success-info'), "分享成功");
                persist("text", text);
            }
        },
        error: function() {
            notify($('#text-alert-info'), '分享失败');
        }
    });
});

$('#undo-button').click(function() {
    $('#text-area').val(last_text);
});

$(function() {
    chrome.storage.local.get('token', function(result) {
        if (result['token'] !== undefined && result['token'].length > 0) {
            active($('#share-container'));
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

function loadText() {
    chrome.storage.local.get('text', function(result) {
        displayText(result['text']);
    });
}

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

function displayText(text) {
    $('#text-area').val(text);
    last_text = text;
    persist('text', text);
}

function notify(dom, info) {
    dom.html(info);
    dom.css('display', 'block');
    window.setTimeout(function() {
        dom.fadeOut(2000);
    }, 3000);
}

function active(dom) {
    dom.css('display', 'block');
    active_container.css('display', 'none');
    active_container = dom;
}

function persist(key, value) {
    chrome.storage.local.get(key, function(result) {
        result[key] = value;
        chrome.storage.local.set(result);
    });
}

