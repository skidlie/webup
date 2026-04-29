// Service Worker Registration for background tasks & notifications
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((reg) => {
        console.log('Service Worker registered', reg);
        // Request notification permission early
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }).catch(err => console.error('SW registration failed', err));
}

// Gateway Logic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('gateway-modal');
    const mainContent = document.getElementById('main-content');
    const pinInput = document.getElementById('pin-input');
    const pinSubmit = document.getElementById('pin-submit');
    const pinError = document.getElementById('pin-error');

    if (sessionStorage.getItem('vault_unlocked') === 'true') {
        unlockUI();
    }

    pinSubmit.addEventListener('click', checkPin);
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPin();
        }
    });

    function checkPin() {
        const pin = pinInput.value;
        if (pin === '092') {
            sessionStorage.setItem('vault_unlocked', 'true');
            unlockUI();
        } else {
            pinError.textContent = 'Incorrect PIN.';
            pinError.classList.remove('hidden');
            pinInput.value = '';
            pinInput.focus();
        }
    }

    function unlockUI() {
        if (modal) modal.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        document.dispatchEvent(new Event('gatewayUnlocked'));
    }
});

// Bulletproof Uploader Logic (Phase 2)
document.addEventListener('gatewayUnlocked', () => {
    const fileInput = document.getElementById('file-input');

    if (fileInput) { // only run on index.html
        const uploadBtn = document.getElementById('upload-btn');
        const progressText = document.getElementById('progress-text');
        const uploadSuccess = document.getElementById('upload-success');

        // Connect to the Supabase Black Hole
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        uploadBtn.addEventListener('click', async () => {
            const files = fileInput.files;
            if (files.length === 0) return;

            // Lock UI during upload
            uploadBtn.disabled = true;
            uploadSuccess.classList.add('hidden');
            progressText.classList.remove('hidden');
            progressText.style.color = '#007BFF'; // Blue text for in-progress

            let uploadedCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressText.textContent = `Uploading file ${i + 1} of ${files.length}...`;

                // CRITICAL SECURITY FIX: Strip weird characters to prevent Supabase 400 Errors
                const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
                const filePath = `web_uploads/${Date.now()}_${safeName}`;

                try {
                    const { data, error } = await supabase.storage
                        .from('vault')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false // Never overwrite
                        });

                    if (error) {
                        console.error('Upload error on file ' + (i + 1), error);
                        progressText.textContent = `❌ Error on file ${i + 1}. Secured ${uploadedCount} files.`;
                        progressText.style.color = 'red';
                        uploadBtn.disabled = false;
                        return; // Stop the loop
                    }

                    uploadedCount++;

                } catch (e) {
                    console.error("System error:", e);
                    progressText.textContent = `❌ Network Error. Secured ${uploadedCount} files.`;
                    progressText.style.color = 'red';
                    uploadBtn.disabled = false;
                    return; // Stop the loop
                }
            }

            // Total Success State
            progressText.classList.add('hidden');
            uploadSuccess.textContent = `✅ Successfully secured ${uploadedCount} files in the Vault.`;
            uploadSuccess.classList.remove('hidden');
            uploadSuccess.style.color = 'green';
            uploadBtn.disabled = false;
            fileInput.value = ''; // Clear the input only after total success
        });
    }
});