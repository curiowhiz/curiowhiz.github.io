document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pat = document.getElementById('pat').value.trim();
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    const result = await Auth.login(pat);

    if (result.success) {
        window.location.href = 'dashboard.html';
    } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
});

// Auto-redirect if already logged in
if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
}
