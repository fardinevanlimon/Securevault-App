let masterKey = '';

// =================== Master Key Logic ===================

function setNewMasterKey() {
    const newKey = document.getElementById('newMasterKey').value;
    if (!newKey) return alert("Please enter a master key");
    localStorage.setItem('vault_master_key', CryptoJS.SHA256(newKey).toString());
    alert("Master key set successfully!");
    document.getElementById('setupSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
}

function unlockVault() {
    masterKey = document.getElementById('masterKeyInput').value;
    const hashedKey = CryptoJS.SHA256(masterKey).toString();
    const storedHash = localStorage.getItem('vault_master_key');

    if (hashedKey !== storedHash) {
        document.getElementById('loginError').classList.remove('hidden');
        return;
    }

    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    switchTab('notes'); // Initially show notes view
}

function logout() {
    masterKey = '';
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('masterKeyInput').value = '';

    // Reset right panel on logout
    resetRightPanel();
}

function resetVault() {
    const confirmReset = confirm("⚠️ Are you sure you want to reset everything?\nThis will delete your master key and all saved data.");
    if (!confirmReset) return;

    localStorage.removeItem('vault_master_key');
    localStorage.removeItem('secure_notes');
    localStorage.removeItem('secure_passwords');

    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => input.value = '');
    
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('setupSection').classList.remove('hidden');
    
    // Reset right panel on vault reset
    resetRightPanel();

    alert("✅ Vault has been reset. Please set a new master key.");
}

window.onload = function () {
    if (localStorage.getItem('vault_master_key')) {
        document.getElementById('setupSection').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    if (msg) {
        if (localStorage.getItem('vault_master_key')) {
            alert("Please unlock the vault, then switch to the Letter Encryptor tab to decrypt the message.");
        }
        document.getElementById('encryptedText').value = decodeURIComponent(msg);
    }
};

// =================== UI Control Functions ===================

function resetRightPanel() {
    document.getElementById('notesListContainer').classList.add('hidden');
    document.getElementById('passwordsListContainer').classList.add('hidden');
    document.getElementById('decryptedLetterContainer').classList.add('hidden');
    document.getElementById('rightPanelStaticContent').classList.remove('hidden');
}

function switchTab(tab) {
    // Switch tabs in the left panel
    const tabs = ['notesTab', 'passwordsTab', 'loveletterTab'];
    tabs.forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(tab + 'Tab').classList.remove('hidden');

    // Control content in the right panel
    resetRightPanel(); // Reset panel first

    if (tab === 'notes') {
        document.getElementById('rightPanelStaticContent').classList.add('hidden');
        document.getElementById('notesListContainer').classList.remove('hidden');
        loadNotes();
    } else if (tab === 'passwords') {
        document.getElementById('rightPanelStaticContent').classList.add('hidden');
        document.getElementById('passwordsListContainer').classList.remove('hidden');
        loadPasswords();
    }
    // For 'loveletter' tab, the static panel will remain visible by default
}


// =================== AES Utility ===================

function encryptAES(data, key) {
    return CryptoJS.AES.encrypt(data, key).toString();
}

function decryptAES(data, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(data, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
}

// =================== Notes ===================

function addNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    if (!title || !content) return alert("Fill in both fields");
    const encrypted = encryptAES(JSON.stringify({ title, content }), masterKey);
    let notes = JSON.parse(localStorage.getItem('secure_notes') || '[]');
    notes.push(encrypted);
    localStorage.setItem('secure_notes', JSON.stringify(notes));
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    loadNotes();
}

function loadNotes() {
    const container = document.getElementById('notesList');
    if (!container) return;
    container.innerHTML = '';
    let notes = JSON.parse(localStorage.getItem('secure_notes') || '[]');
    notes.forEach((enc) => {
        const dec = decryptAES(enc, masterKey);
        if (dec) {
            const note = JSON.parse(dec);
            const div = document.createElement('div');
            div.className = 'p-3 bg-white bg-opacity-10 rounded shadow text-left';
            div.innerHTML = `<strong>${note.title}</strong><br><p class="whitespace-pre-wrap">${note.content}</p>`;
            container.appendChild(div);
        }
    });
}

// =================== Passwords ===================

function addPassword() {
    const site = document.getElementById('site').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (!site || !username || !password) return alert("All fields are required");
    const encrypted = encryptAES(JSON.stringify({ site, username, password }), masterKey);
    let passwords = JSON.parse(localStorage.getItem('secure_passwords') || '[]');
    passwords.push(encrypted);
    localStorage.setItem('secure_passwords', JSON.stringify(passwords));
    document.getElementById('site').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    loadPasswords();
}

function loadPasswords() {
    const container = document.getElementById('passwordsList');
    if (!container) return;
    container.innerHTML = '';
    let passwords = JSON.parse(localStorage.getItem('secure_passwords') || '[]');
    passwords.forEach((enc) => {
        const dec = decryptAES(enc, masterKey);
        if (dec) {
            const pass = JSON.parse(dec);
            const div = document.createElement('div');
            div.className = 'p-3 bg-white bg-opacity-10 rounded shadow text-left';
            div.innerHTML = `<strong>Site:</strong> ${pass.site}<br><strong>Username:</strong> ${pass.username}<br><strong>Password:</strong> ${pass.password}`;
            container.appendChild(div);
        }
    });
}

// =================== Love Letter Encryptor ===================

function switchMode(mode) {
    document.getElementById('encryptBox').classList.add('hidden');
    document.getElementById('decryptBox').classList.add('hidden');
    
    // When switching modes, reset the right panel to static view
    resetRightPanel();

    if (mode === 'encrypt') {
        document.getElementById('encryptBox').classList.remove('hidden');
    } else {
        document.getElementById('decryptBox').classList.remove('hidden');
    }
}

function encryptMessage() {
    const message = document.getElementById('message').value;
    const passphrase = document.getElementById('passphrase').value;
    if (!message || !passphrase) {
        return alert("Please enter both message and passphrase.");
    }
    const ciphertext = CryptoJS.AES.encrypt(message, passphrase).toString();
    const shareableURL = `${location.origin}${location.pathname}?msg=${encodeURIComponent(ciphertext)}`;
    document.getElementById('shareableLink').value = shareableURL;
    document.getElementById('outputLinkBox').classList.remove('hidden');
}

function copyLink() {
    const link = document.getElementById('shareableLink');
    link.select();
    document.execCommand('copy');
    alert("Link copied to clipboard!");
}

function decryptMessage() {
    const encryptedText = document.getElementById('encryptedText').value;
    const passphrase = document.getElementById('decryptPassphrase').value;
    if (!encryptedText || !passphrase) {
        return alert("Please enter both encrypted text and passphrase.");
    }
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) throw new Error("Invalid decryption.");

        // Show the decrypted message in the right panel
        resetRightPanel(); // Hide other dynamic views
        document.getElementById('rightPanelStaticContent').classList.add('hidden');
        document.getElementById('decryptedOutput').innerText = "💌 Decrypted Letter:\n\n" + originalText;
        document.getElementById('decryptedLetterContainer').classList.remove('hidden');

    } catch (e) {
        alert("Decryption failed. Check your passphrase or ciphertext.");
    }
}

// =================== Share Functionality ===================

async function shareApp() {
  const shareData = {
    title: 'SecureVault',
    text: 'Check out SecureVault, a great tool to keep your notes and passwords safe!',
    url: window.location.href
  };

  // Check if Web Share API is supported by the browser
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      console.log('App shared successfully');
    } catch (err) {
      console.error('Error sharing:', err);
    }
  } else {
    // Fallback for browsers that do not support Web Share API
    navigator.clipboard.writeText(shareData.url).then(() => {
        alert('Sharing is not supported on this browser, but the link has been copied to your clipboard!');
    });
  }
}
