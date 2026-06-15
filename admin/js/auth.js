// ============================================================
// AUTH — PAT-based session
// ============================================================

const Auth = (function () {
    const PAT_KEY = 'admin_pat';
    const USER_KEY = 'admin_user';

    async function login(pat) {
        if (!pat || pat.length < 20) {
            return { success: false, error: 'Token looks too short.' };
        }
        const result = await GitHubAPI.validateToken(pat);
        if (!result.ok) {
            return { success: false, error: result.error };
        }
        sessionStorage.setItem(PAT_KEY, pat);
        sessionStorage.setItem(USER_KEY, result.user);
        return { success: true, user: result.user };
    }

    function logout() {
        sessionStorage.removeItem(PAT_KEY);
        sessionStorage.removeItem(USER_KEY);
        window.location.href = 'index.html';
    }

    function isLoggedIn() {
        return !!sessionStorage.getItem(PAT_KEY);
    }

    function getUser() {
        return sessionStorage.getItem(USER_KEY);
    }

    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'index.html';
        }
    }

    return { login, logout, isLoggedIn, getUser, requireAuth };
})();