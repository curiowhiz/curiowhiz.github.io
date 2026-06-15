// ============================================================
// EDITOR — EXPERIENCE (Timeline)
// ============================================================

const EditorExperience = (function () {
    const FILE_PATH = 'data/experience.json';
    let data = null;
    let sha = null;

    async function init() {
        document.getElementById('save-experience').addEventListener('click', save);
        document.getElementById('add-experience').addEventListener('click', addRole);
        await load();
    }

    async function load() {
        const container = document.getElementById('experience-editor');
        try {
            const result = await GitHubAPI.getJSON(FILE_PATH);
            data = result.data;
            sha = result.sha;
            render();
        } catch (err) {
            container.innerHTML = `<p class="status-bar error">Failed to load experience: ${err.message}</p>`;
        }
    }

    function render() {
        const container = document.getElementById('experience-editor');
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="subtle">No experience entries yet. Click "+ Add Role".</p>';
            return;
        }
        container.innerHTML = data.map((r, i) => renderRoleCard(r, i)).join('');
        attachHandlers();
    }

    function renderRoleCard(role, idx) {
        const currentBadge = role.current ? '<span class="item-card-badge">● Current</span>' : '';
        const achievements = (role.achievements || []).map((a, ai) => `
            <div class="list-item-row" data-ach-idx="${ai}">
                <textarea class="exp-achievement">${esc(a)}</textarea>
                <button type="button" class="btn-icon" data-ach-remove="${ai}">✕</button>
            </div>
        `).join('');

        return `
            <div class="item-card" data-exp-idx="${idx}">
                <div class="item-card-header" data-toggle>
                    <div class="item-card-title">
                        <span>${esc(role.title || 'Untitled')}</span>
                        <span class="subtle">@ ${esc(role.company || '')}</span>
                        ${currentBadge}
                    </div>
                    <div class="item-card-actions">
                        <button type="button" class="btn-icon up" data-exp-up="${idx}" title="Move up">↑</button>
                        <button type="button" class="btn-icon down" data-exp-down="${idx}" title="Move down">↓</button>
                        <button type="button" class="btn-icon" data-exp-remove="${idx}" title="Remove">✕</button>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div class="item-card-body">
                    <div class="field-row">
                        <div class="field-group">
                            <label>Title</label>
                            <input type="text" class="exp-title" value="${esc(role.title || '')}">
                        </div>
                        <div class="field-group">
                            <label>Company</label>
                            <input type="text" class="exp-company" value="${esc(role.company || '')}">
                        </div>
                    </div>
                    <div class="field-row">
                        <div class="field-group">
                            <label>Start Date</label>
                            <input type="text" class="exp-start" value="${esc(role.startDate || '')}" placeholder="Jan 2024">
                        </div>
                        <div class="field-group">
                            <label>End Date</label>
                            <input type="text" class="exp-end" value="${esc(role.endDate || '')}" placeholder="Present">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Location</label>
                        <input type="text" class="exp-location" value="${esc(role.location || '')}" placeholder="Toronto, ON">
                    </div>
                    <div class="field-group">
                        <div class="checkbox-field">
                            <input type="checkbox" class="exp-current" id="exp-current-${idx}" ${role.current ? 'checked' : ''}>
                            <label for="exp-current-${idx}">Current role (pulses on timeline)</label>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Achievements</label>
                        <div class="list-editor exp-achievements">${achievements}</div>
                        <button type="button" class="btn btn-outline btn-sm exp-add-ach" data-exp-idx="${idx}">+ Add Achievement</button>
                    </div>
                    <div class="field-group">
                        <label>Tags (comma-separated)</label>
                        <input type="text" class="exp-tags" value="${esc((role.tags || []).join(', '))}">
                    </div>
                </div>
            </div>
        `;
    }

    function attachHandlers() {
        const container = document.getElementById('experience-editor');
        container.addEventListener('click', (e) => {
            const t = e.target;
            if (t.matches('[data-exp-remove]')) {
                if (!confirm(`Remove "${data[parseInt(t.dataset.expRemove)].title}"?`)) return;
                collectAll();
                data.splice(parseInt(t.dataset.expRemove), 1);
                render();
            } else if (t.matches('[data-exp-up]')) {
                const i = parseInt(t.dataset.expUp);
                if (i > 0) {
                    collectAll();
                    [data[i - 1], data[i]] = [data[i], data[i - 1]];
                    render();
                }
            } else if (t.matches('[data-exp-down]')) {
                const i = parseInt(t.dataset.expDown);
                if (i < data.length - 1) {
                    collectAll();
                    [data[i], data[i + 1]] = [data[i + 1], data[i]];
                    render();
                }
            } else if (t.matches('.exp-add-ach')) {
                const idx = parseInt(t.dataset.expIdx);
                collectAll();
                if (!data[idx].achievements) data[idx].achievements = [];
                data[idx].achievements.push('');
                render();
            } else if (t.matches('[data-ach-remove]')) {
                const card = t.closest('.item-card');
                const idx = parseInt(card.dataset.expIdx);
                const ai = parseInt(t.dataset.achRemove);
                collectAll();
                data[idx].achievements.splice(ai, 1);
                render();
            } else if (t.closest('[data-toggle]')) {
                if (!t.closest('.item-card-actions')) {
                    t.closest('.item-card').classList.toggle('open');
                }
            }
        });
    }

    function addRole() {
        collectAll();
        data.unshift({
            title: 'New Role',
            company: '',
            location: '',
            startDate: '',
            endDate: 'Present',
            current: false,
            achievements: [],
            tags: []
        });
        render();
        const firstCard = document.querySelector('#experience-editor .item-card');
        if (firstCard) firstCard.classList.add('open');
    }

    function collectAll() {
        const cards = document.querySelectorAll('#experience-editor .item-card');
        cards.forEach(card => {
            const idx = parseInt(card.dataset.expIdx);
            if (isNaN(idx) || !data[idx]) return;
            const achievements = Array.from(card.querySelectorAll('.exp-achievement')).map(t => t.value);
            data[idx] = {
                ...data[idx],
                title: card.querySelector('.exp-title').value,
                company: card.querySelector('.exp-company').value,
                location: card.querySelector('.exp-location').value,
                startDate: card.querySelector('.exp-start').value,
                endDate: card.querySelector('.exp-end').value,
                current: card.querySelector('.exp-current').checked,
                achievements: achievements,
                tags: card.querySelector('.exp-tags').value
                    .split(',').map(s => s.trim()).filter(Boolean)
            };
        });
    }

    async function save() {
        const btn = document.getElementById('save-experience');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        Status.show('Saving experience…', 'info', 0);

        try {
            collectAll();
            const result = await GitHubAPI.putJSON(
                FILE_PATH,
                data,
                sha,
                `Admin: update experience (${new Date().toISOString()})`
            );
            sha = result.content.sha;
            Status.show('✅ Experience saved successfully', 'success');
        } catch (err) {
            Status.show(`❌ Save failed: ${err.message}`, 'error', 0);
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Save All';
        }
    }

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { init };
})();