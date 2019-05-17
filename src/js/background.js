chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync') {
        for (let key in changes) {
            let storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
        }
    }
});