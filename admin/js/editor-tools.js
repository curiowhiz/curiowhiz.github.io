// ============================================================
// EDITOR — TOOLS
// ============================================================

const EditorTools = (function () {
    const FILE_PATH = 'data/tools.json';
    let data = null;
    let sha = null;

    async function init() {
        document.getElementById('save-tools').addEventListener('click', save);
        document.getElementById('add-tool').addEventListener('click', addTool);
        await load();
    }

    async function load() {
        const container = document.getElementById('tools-editor');
        try {
            const result = await GitHubAPI.getJSON(FILE_PATH);
            data = result.data;
            sha = result.sha;
            render();
        } catch (err) {
            container.innerHTML = `<p class="status-bar error">Failed to load tools: ${err.message}</p>`;
        }
    }

    function render() {
        const container = document.getElementById('tools-editor');
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="subtle">No tools yet. Click "+ Add Tool".</p>';
            return;
        }
        container.innerHTML = data.map((t, i) => renderToolCard(t, i)).join('');
        attachHandlers();
    }

    function renderToolCard(tool, idx) {
        const darkBadge = tool.darkCard ? '<span class="item-card-badge">🌙 Dark</span>' : '';
        return `
            <div class="item-card" data-tool-idx="${idx}">
                <div class="item-card-header" data-toggle>
                    <div class="item-card-title">
                        <span>${esc(tool.icon || '')}</span>
                        <span>${esc(tool.name || 'Untitled')}</span>
                        ${darkBadge}
                    </div>
                    <div class="item-card-actions">
                        <button type="button" class="btn-icon up" data-tool-up="${idx}" title="Move up">↑</button>
                        <button type="button" class="btn-icon down" data-tool-down="${idx}" title="Move down">↓</button>
                        <button type="button" class="btn-icon" data-tool-remove="${idx}" title="Remove">✕</button>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div class="item-card-body">
                    <div class="field-row">
                        <div class="field-group">
                            <label>Icon (emoji)</label>
                            <input type="text" class="tool-icon" value="${esc(tool.icon || '')}">
                        </div>
                        <div class="field-group">
                            <label>Order</label>
                            <input type="number" class="tool-order" value="${tool.order ?? idx}">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Name</label>
                        <input type="text" class="tool-name" value="${esc(tool.name || '')}">
                    </div>
                    <div class="field-group">
                        <label>Description</label>
                        <textarea class="tool-description">${esc(tool.description || '')}</textarea>
                    </div>
                    <div class="field-group">
                        <label>Technologies (comma-separated)</label>
                        <input type="text" class="tool-techs" value="${esc((tool.technologies || []).join(', '))}">
                    </div>
                    <div class="field-row">
                        <div class="field-group">
                            <label>Status</label>
                            <select class="tool-status">
                                <option value="active" ${tool.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="building" ${tool.status === 'building' ? 'selected' : ''}>Building</option>
                                <option value="archived" ${tool.status === 'archived' ? 'selected' : ''}>Archived</option>
                            </select>
                        </div>
                        <div class="field-group">
                            <label>Status Label (optional override)</label>
                            <input type="text" class="tool-status-label" value="${esc(tool.statusLabel || '')}">
                        </div>
                    </div>
                    <div class="field-row">
                        <div class="field-group">
                            <label>GitHub URL</label>
                            <input type="url" class="tool-github" value="${esc(tool.githubUrl || '')}">
                        </div>
                        <div class="field-group">
                            <label>Demo URL</label>
                            <input type="url" class="tool-demo" value="${esc(tool.demoUrl || '')}">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Internal Note (shown if no links)</label>
                        <input type="text" class="tool-note" value="${esc(tool.internalNote || '')}">
                    </div>
                    <div class="field-group">
                        <div class="checkbox-field">
                            <input type="checkbox" class="tool-dark" id="tool-dark-${idx}" ${tool.darkCard ? 'checked' : ''}>
                            <label for="tool-dark-${idx}">Dark card variant (technical look with code preview)</label>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Code Preview (only shown on dark cards)</label>
                        <textarea class="tool-code code-input" rows="5">${esc(tool.codePreview || '')}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    function attachHandlers() {
        const container = document.getElementById('tools-editor');
        container.addEventListener('click', (e) => {
            const t = e.target;
            if (t.matches('[data-tool-remove]')) {
                if (!confirm(`Remove tool "${data[parseInt(t.dataset.toolRemove)].name}"?`)) return;
                collectAll();
                data.splice(parseInt(t.dataset.toolRemove), 1);
                render();
            } else if (t.matches('[data-tool-up]')) {
                const i = parseInt(t.dataset.toolUp);
                if (i > 0) {
                    collectAll();
                    [data[i - 1], data[i]] = [data[i], data[i - 1]];
                    render();
                }
            } else if (t.matches('[data-tool-down]')) {
                const i = parseInt(t.dataset.toolDown);
                if (i < data.length - 1) {
                    collectAll();
                    [data[i], data[i + 1]] = [data[i + 1], data[i]];
                    render();
                }
            } else if (t.closest('[data-toggle]')) {
                if (!t.closest('.item-card-actions')) {
                    t.closest('.item-card').classList.toggle('open');
                }
            }
        });
    }

    function addTool() {
        collectAll();
        data.unshift({
            icon: '🔧',
            name: 'New Tool',
            description: '',
            technologies: [],
            status: 'building',
            statusLabel: '',
            githubUrl: '',
            demoUrl: '',
            internalNote: '',
            darkCard: false,
            codePreview: '',
            order: 0
        });
        render();
        const firstCard = document.querySelector('#tools-editor .item-card');
        if (firstCard) firstCard.classList.add('open');
    }

    function collectAll() {
        const cards = document.querySelectorAll('#tools-editor .item-card');
        cards.forEach(card => {
            const idx = parseInt(card.dataset.toolIdx);
            if (isNaN(idx) || !data[idx]) return;
            data[idx] = {
                ...data[idx],
                icon: card.querySelector('.tool-icon').value,
                name: card.querySelector('.tool-name').value,
                description: card.querySelector('.tool-description').value,
                technologies: card.querySelector('.tool-techs').value
                    .split(',').map(s => s.trim()).filter(Boolean),
                status: card.querySelector('.tool-status').value,
                statusLabel: card.querySelector('.tool-status-label').value,
                githubUrl: card.querySelector('.tool-github').value,
                demoUrl: card.querySelector('.tool-demo').value,
                internalNote: card.querySelector('.tool-note').value,
                darkCard: card.querySelector('.tool-dark').checked,
                codePreview: card.querySelector('.tool-code').value,
                order: parseInt(card.querySelector('.tool-order').value) || 0
            };
        });
    }

    async function save() {
        const btn = document.getElementById('save-tools');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        Status.show('Saving tools…', 'info', 0);

        try {
            collectAll();
            const result = await GitHubAPI.putJSON(
                FILE_PATH,
                data,
                sha,
                `Admin: update tools (${new Date().toISOString()})`
            );
            sha = result.content.sha;
            Status.show('✅ Tools saved successfully', 'success');
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