const APP_URL = "http://localhost:3000";

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CYBER_SYNC_MESSAGE') {
        const { username, key, tag, alias, ciphertext, isMe } = request.payload;
        
        if (!username || !key || !ciphertext) {
            sendResponse({ success: false, error: 'Missing data' });
            return true;
        }

        fetch(`${APP_URL}/api/extension/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, key, alias, ciphertext, isMe, tag })
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => {
            console.error('Background Sync Error:', error);
            sendResponse({ success: false, error: error.message });
        });

        return true; // Keep message channel open for async response
    }

    if (request.type === 'CYBER_GET_FAVORITES') {
        const { linkedEmail } = request;
        
        // First check session, then get favorites
        fetch(`${APP_URL}/api/auth/session`)
        .then(res => res.json())
        .then(session => {
            if (session?.user?.email) {
                // VERIFICATION: Only return favorites if the linked email matches the session
                if (linkedEmail && session.user.email.toLowerCase() !== linkedEmail.toLowerCase()) {
                    return sendResponse({ success: false, error: 'Linked account mismatch with browser session' });
                }

                return fetch(`${APP_URL}/api/favorites`)
                .then(res => {
                    if (res.status === 404) {
                        return res.json().then(data => { throw new Error('USER_NOT_FOUND'); });
                    }
                    if (!res.ok) throw new Error('FETCH_ERROR');
                    return res.json();
                })
                .then(favData => {
                    sendResponse({ 
                        success: true, 
                        email: session.user.email, 
                        favorites: favData.favorites || [] 
                    });
                });
            } else {
                sendResponse({ success: false, error: 'NOT_LOGGED_IN' });
            }
        })
        .catch(error => {
            console.error('Background Auth/Fav Error:', error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});
