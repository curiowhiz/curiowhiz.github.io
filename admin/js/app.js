// ============================================================
// APP — Main dashboard controller
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    Auth.requireAuth();

    // Display user
    document.getElementById('user-info').textContent = `@${Auth.getUser()}`;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Sign out of admin?')) Auth.logout();
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tab}`).classList.add('active');
        });
    });

    // Init all editors
    EditorProfile.init();
    EditorProjects.init();
    EditorTools.init();
    EditorExperience.init();
});

// Status messages
const Status = (function () {
    const bar = document.getElementById('status-bar');
    let timeoutId;

    function show(message, type = 'info', duration = 4000) {
        clearTimeout(timeoutId);
        bar.textContent = message;
        bar.className = `status-bar ${type}`;
        bar.classList.remove('hidden');
        if (duration > 0) {
            timeoutId = setTimeout(() => bar.classList.add('hidden'), duration);
        }
    }

    function hide() {
        clearTimeout(timeoutId);
        bar.classList.add('hidden');
    }

    return { show, hide };
})();