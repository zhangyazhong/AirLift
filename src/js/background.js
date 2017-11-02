chrome.runtime.onInstalled.addListener(function (object) {
    if (chrome.runtime.OnInstalledReason.INSTALL === object.reason) {
        chrome.storage.sync.get('token', function(result) {
            if (result['token'] !== undefined && result['token'].length > 0) {
                const token = result['token'];
                chrome.storage.local.get('token', function(result) {
                    result['token'] = token;
                    chrome.storage.local.set(result);
                });
            }
        });
    }
});