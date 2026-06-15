// ============================================================
// GITHUB API CLIENT
// Reads and writes files in curiowhiz/curiowhiz.github.io
// ============================================================

const GitHubAPI = (function () {
    const REPO_OWNER = 'curiowhiz';
    const REPO_NAME = 'curiowhiz.github.io';
    const BRANCH = 'main';
    const API_BASE = 'https://api.github.com';

    function getToken() {
        return sessionStorage.getItem('admin_pat');
    }

    function getHeaders() {
        const token = getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
        };
    }

    // Validate token by fetching user + repo access
    async function validateToken(pat) {
        try {
            // Check token works for /user
            const userRes = await fetch(`${API_BASE}/user`, {
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (!userRes.ok) {
                return { ok: false, error: 'Invalid token. Check it and try again.' };
            }
            const user = await userRes.json();

            // Check token has access to our repo
            const repoRes = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}`, {
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (!repoRes.ok) {
                return { ok: false, error: `Token does not have access to ${REPO_OWNER}/${REPO_NAME}.` };
            }
            const repo = await repoRes.json();

            // Verify write access
            if (!repo.permissions || !repo.permissions.push) {
                return { ok: false, error: 'Token must have write (Contents: Read & Write) permission.' };
            }

            return { ok: true, user: user.login };
        } catch (err) {
            return { ok: false, error: `Network error: ${err.message}` };
        }
    }

    // GET file contents — returns { content, sha }
    async function getFile(path) {
        const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
        const res = await fetch(url, { headers: getHeaders() });
        if (!res.ok) {
            throw new Error(`Failed to fetch ${path}: ${res.status}`);
        }
        const data = await res.json();
        // GitHub returns base64-encoded content
        const decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        return { content: decoded, sha: data.sha };
    }

    // GET file as JSON
    async function getJSON(path) {
        const { content, sha } = await getFile(path);
        return { data: JSON.parse(content), sha };
    }

    // PUT file (create or update)
    async function putFile(path, content, sha, message) {
        const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        // base64 encode (handle UTF-8)
        const encoded = btoa(unescape(encodeURIComponent(content)));
        const body = {
            message: message || `Update ${path}`,
            content: encoded,
            branch: BRANCH
        };
        if (sha) body.sha = sha;

        const res = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Failed to save ${path}`);
        }
        return await res.json();
    }

    // PUT JSON file
    async function putJSON(path, data, sha, message) {
        const content = JSON.stringify(data, null, 2);
        return await putFile(path, content, sha, message);
    }

    // Upload binary file (image) — content is base64 string (no data: prefix)
    async function putBinary(path, base64Content, sha, message) {
        const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
        const body = {
            message: message || `Upload ${path}`,
            content: base64Content,
            branch: BRANCH
        };
        if (sha) body.sha = sha;

        const res = await fetch(url, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `Failed to upload ${path}`);
        }
        return await res.json();
    }

    // Get sha of existing file (or null if doesn't exist)
    async function getFileSha(path) {
        try {
            const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
            const res = await fetch(url, { headers: getHeaders() });
            if (!res.ok) return null;
            const data = await res.json();
            return data.sha;
        } catch (e) {
            return null;
        }
    }

    // Upload an image from a File object
    async function uploadImage(file, targetPath) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    // Strip "data:image/...;base64," prefix
                    const base64 = reader.result.split(',')[1];
                    const existingSha = await getFileSha(targetPath);
                    const result = await putBinary(
                        targetPath,
                        base64,
                        existingSha,
                        `Upload ${targetPath}`
                    );
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    return {
        validateToken,
        getFile,
        getJSON,
        putFile,
        putJSON,
        uploadImage,
        getFileSha
    };
})();