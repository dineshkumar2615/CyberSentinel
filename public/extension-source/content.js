const origin = window.location.hostname;
const storageKeyDb = `cs_keys_db_${origin}`;
const storageKeyAlias = `cs_active_alias_${origin}`;
const storageKeyPos = `cs_widget_pos_${origin}`;

let keysDb = {};
let activeAlias = '';
let sessionKey = '';
let savedPos = {"bottom":"20px","right":"20px"};

// Inject the floating UI
function injectUI() {
    const container = document.createElement('div');
    container.id = 'cs-widget-root';
    
    if (origin.includes('whatsapp.com')) {
        container.dataset.theme = 'whatsapp';
    } else if (origin.includes('instagram.com')) {
        container.dataset.theme = 'instagram';
    }
    
    // Apply saved position
    if (savedPos.bottom) container.style.bottom = savedPos.bottom;
    if (savedPos.right) container.style.right = savedPos.right;
    if (savedPos.top) container.style.top = savedPos.top;
    if (savedPos.left) container.style.left = savedPos.left;

    // Generate options html
    const optionsHtml = Object.keys(keysDb).map(alias => 
        `<div class="cs-option" data-value="${alias}">${alias}</div>`
    ).join('');

    // HTML structure for the widget
    container.innerHTML = `
        <div class="cs-widget-header" id="cs-widget-header">
            <span class="cs-title">CyberSentinel Cipher</span>
            <button id="cs-toggle-btn" class="cs-toggle-btn">Minimize</button>
        </div>
        <div class="cs-widget-body" id="cs-widget-body">
            
            <div class="cs-row">
                <div id="cs-custom-select" class="cs-input" tabindex="0">
                    <div id="cs-select-selected">${activeAlias || 'Select Key...'}</div>
                    <div id="cs-select-options" class="cs-hide">
                        ${Object.keys(keysDb).map(alias =>
                            `<div class="cs-option-row">
                                <div class="cs-option" data-value="${alias}">${alias}</div>
                                <button class="cs-option-del" data-alias="${alias}" title="Delete">✕</button>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                <button id="cs-new-key-mode-btn" title="Add New Key">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                    </svg>
                </button>
            </div>

            <div id="cs-new-key-panel" style="display: none; flex-direction: column; gap: 8px;">
                <input type="text" id="cs-alias-input" class="cs-input" placeholder="Unique name (e.g. Work Chat)">
                <div class="cs-key-box">
                    <input type="password" id="cs-key-input" class="cs-input" placeholder="Session Key...">
                    <button id="cs-show-key-btn" title="Show/Hide Key">
                        <svg id="cs-eye-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button id="cs-generate-key-btn" title="Generate Random Key">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="7.5" cy="15.5" r="5.5"/>
                            <path d="M10.85 12.15 19 4"/>
                            <path d="M18 5l2 2"/>
                            <path d="M15 8l2 2"/>
                        </svg>
                    </button>
                    <button id="cs-save-key-btn" title="Save Key">✓</button>
                </div>
            </div>
            
            <textarea id="cs-message-input" placeholder="Type plain text to encrypt, OR paste incoming ciphertext here to decrypt..."></textarea>
            
            <div style="display: flex; gap: 8px;">
                <button id="cs-encrypt-btn" class="cs-action-btn cs-btn-green">Encrypt &amp; Copy</button>
                <button id="cs-decrypt-btn" class="cs-action-btn cs-btn-outline">Decrypt</button>
            </div>
            
            <div class="cs-status" id="cs-status">Ready - Secure Mode</div>
        </div>
    `;
    
    document.body.appendChild(container);

    attachEventListeners(container);
    makeDraggable(container, document.getElementById('cs-widget-header'));
}

function attachEventListeners(container) {
    const customSelect = document.getElementById('cs-custom-select');
    const selectSelected = document.getElementById('cs-select-selected');
    const selectOptions = document.getElementById('cs-select-options');
    const newKeyPanel = document.getElementById('cs-new-key-panel');
    const toggleBtn = document.getElementById('cs-toggle-btn');
    const msgInput = document.getElementById('cs-message-input');

    // Toggle minimize
    toggleBtn.addEventListener('click', () => {
        const body = document.getElementById('cs-widget-body');
        if (body.style.display === 'none') {
            body.style.display = 'flex';
            toggleBtn.innerText = 'Minimize';
        } else {
            body.style.display = 'none';
            toggleBtn.innerText = 'Expand';
        }
    });

    // Custom Dropdown interaction
    customSelect.addEventListener('click', () => {
        selectOptions.classList.toggle('cs-hide');
    });

    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            selectOptions.classList.add('cs-hide');
        }
    });

    function selectOption(alias) {
        selectSelected.innerText = alias;
        activeAlias = alias;
        sessionKey = keysDb[activeAlias] || '';
        chrome.storage.local.set({ [storageKeyAlias]: activeAlias });
        showStatus(`Key set to "${activeAlias}"`);
        selectOptions.classList.add('cs-hide');
    }

    selectOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('cs-option')) {
            e.stopPropagation();
            selectOption(e.target.dataset.value);
        }
    });

    // Show New Key Panel
    document.getElementById('cs-new-key-mode-btn').addEventListener('click', () => {
        newKeyPanel.style.display = newKeyPanel.style.display === 'none' ? 'flex' : 'none';
    });

    // Show/Hide Key Toggle
    const keyInput = document.getElementById('cs-key-input');
    const showKeyBtn = document.getElementById('cs-show-key-btn');
    let keyVisible = false;
    showKeyBtn.addEventListener('click', () => {
        keyVisible = !keyVisible;
        keyInput.type = keyVisible ? 'text' : 'password';
        const eyeIcon = document.getElementById('cs-eye-icon');
        if (keyVisible) {
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>`;
        } else {
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>`;
        }
    });

    // Save Key logic — with UNIQUE name check
    document.getElementById('cs-save-key-btn').addEventListener('click', () => {
        const alias = document.getElementById('cs-alias-input').value.trim();
        const newKey = document.getElementById('cs-key-input').value.trim();
        
        if (!alias) return showStatus('Enter a name for the key!');
        if (!newKey) return showStatus('Enter a session key!');

        // Unique name check
        if (keysDb.hasOwnProperty(alias)) {
            return showStatus(`"${alias}" already exists! Use a unique name.`);
        }

        keysDb[alias] = newKey;
        chrome.storage.local.set({ [storageKeyDb]: keysDb });
        
        // Add to dropdown with delete button
        const newRow = document.createElement('div');
        newRow.className = 'cs-option-row';
        newRow.innerHTML = `
            <div class="cs-option" data-value="${alias}">${alias}</div>
            <button class="cs-option-del" data-alias="${alias}" title="Delete">✕</button>
        `;
        selectOptions.appendChild(newRow);

        // Attach delete listener to new row's button
        newRow.querySelector('.cs-option-del').addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteOption(alias, newRow);
        });

        selectOption(alias);

        newKeyPanel.style.display = 'none';
        document.getElementById('cs-alias-input').value = '';
        keyInput.value = '';
        keyVisible = false;
        keyInput.type = 'password';

        showStatus('Key Saved Successfully!');
    });

    // Generate Key logic
    document.getElementById('cs-generate-key-btn').addEventListener('click', () => {
        const randomKey = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        keyInput.value = randomKey;
        keyInput.type = 'text';
        keyVisible = true;
        const eyeIcon = document.getElementById('cs-eye-icon');
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>`;
        setTimeout(() => {
            keyInput.type = 'password';
            keyVisible = false;
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>`;
        }, 4000);
    });

    // Delete option handler
    function handleDeleteOption(alias, rowEl) {
        if (!confirm(`Delete key "${alias}"?`)) return;
        delete keysDb[alias];
        chrome.storage.local.set({ [storageKeyDb]: keysDb });
        rowEl.remove();
        if (activeAlias === alias) {
            activeAlias = '';
            sessionKey = '';
            selectSelected.innerText = 'Select Key...';
            chrome.storage.local.set({ [storageKeyAlias]: '' });
        }
        selectOptions.classList.add('cs-hide');
        showStatus(`"${alias}" deleted.`);
    }

    // Attach delete listeners to existing options
    selectOptions.querySelectorAll('.cs-option-del').forEach(btn => {
        const alias = btn.dataset.alias;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('.cs-option-row');
            handleDeleteOption(alias, row);
        });
    });

    // ENCRYPT action
    document.getElementById('cs-encrypt-btn').addEventListener('click', async () => {
        const text = msgInput.value.trim();
        if (!text) return showStatus('Text box is empty!');
        if (!sessionKey) return showStatus('Select or Create a Key first!');

        if (text.startsWith(window.CS_Crypto.prefix)) {
             return showStatus('Already looks encrypted!');
        }

        try {
            const ciphertext = await window.CS_Crypto.encrypt(text, sessionKey);
            await navigator.clipboard.writeText(ciphertext);
            msgInput.value = '';
            showStatus('Encrypted! Copied to clipboard.');
        } catch (err) {
            showStatus('Encryption failed');
        }
    });

    // DECRYPT action
    document.getElementById('cs-decrypt-btn').addEventListener('click', async () => {
        const text = msgInput.value.trim();
        if (!text) return showStatus('Paste ciphertext to decrypt!');
        if (!sessionKey) return showStatus('Select a Key to decrypt with!');

        if (!text.startsWith(window.CS_Crypto.prefix)) {
             return showStatus('Text is not encrypted locally!');
        }

        try {
            const plaintext = await window.CS_Crypto.decrypt(text, sessionKey);
            if (plaintext) {
                msgInput.value = plaintext;
                showStatus('Decrypted Successfully.');
            } else {
                showStatus('Decryption Failed. Wrong Key?');
            }
        } catch (err) {
            showStatus('Decryption failed format error');
        }
    });
}

// Drag and Drop Logic
function makeDraggable(element, dragHandle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    dragHandle.style.cursor = 'grab';

    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get mouse pos at startup
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        dragHandle.style.cursor = 'grabbing';
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate new pos
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set element pos
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.bottom = 'auto'; // Disable bottom/right locking if dragged
        element.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        dragHandle.style.cursor = 'grab';
        
        // Save pos
        const pos = { top: element.style.top, left: element.style.left };
        chrome.storage.local.set({ [storageKeyPos]: pos });
    }
}

function showStatus(msg) {
    const status = document.getElementById('cs-status');
    status.innerText = msg;
    status.classList.add('flash');
    setTimeout(() => {
        status.classList.remove('flash');
        if (status.innerText === msg) {
            status.innerText = 'Ready - Secure Mode';
        }
    }, 3000);
}

// Initialize
chrome.storage.local.get([storageKeyDb, storageKeyAlias, storageKeyPos], (result) => {
    keysDb = result[storageKeyDb] || {};
    activeAlias = result[storageKeyAlias] || '';
    sessionKey = keysDb[activeAlias] || '';
    if (result[storageKeyPos]) {
         savedPos = result[storageKeyPos];
    }
    
    // Now inject UI
    setTimeout(() => {
        injectUI();
    }, 1000);
});
