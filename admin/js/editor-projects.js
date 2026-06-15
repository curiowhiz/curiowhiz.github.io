// ============================================================
// EDITOR — PROJECTS
// ============================================================

const EditorProjects = (function () {
    const FILE_PATH = 'data/projects.json';
    let data = null;
    let sha = null;
    let pendingUploads = {}; // { projectId: File }

    async function init() {
        document.getElementById('save-projects').addEventListener('click', save);
        document.getElementById('add-project').addEventListener('click', addProject);
        await load();
    }

    async function load() {
        const container = document.getElementById('projects-editor');
        try {
            const result = await GitHubAPI.getJSON(FILE_PATH);
            data = result.data;
            sha = result.sha;
            render();
        } catch (err) {
            container.innerHTML = `<p class="status-bar error">Failed to load projects: ${err.message}</p>`;
        }
    }

    function render() {
        const container = document.getElementById('projects-editor');
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="subtle">No projects yet. Click "+ Add Project".</p>';
            return;
        }

        container.innerHTML = data.map((p, i) => renderProjectCard(p, i)).join('');
        attachHandlers();
    }

    function renderProjectCard(project, idx) {
        const featuredBadge = project.featured ? '<span class="item-card-badge">⭐ Featured</span>' : '';
        return `
            <div class="item-card" data-project-idx="${idx}" data-project-id="${esc(project.id || '')}">
                <div class="item-card-header" data-toggle>
                    <div class="item-card-title">
                        <span>${esc(project.title || 'Untitled')}</span>
                        ${featuredBadge}
                    </div>
                    <div class="item-card-actions">
                        <button type="button" class="btn-icon up" data-proj-up="${idx}" title="Move up">↑</button>
                        <button type="button" class="btn-icon down" data-proj-down="${idx}" title="Move down">↓</button>
                        <button type="button" class="btn-icon" data-proj-remove="${idx}" title="Remove">✕</button>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div class="item-card-body">
                    <div class="field-row">
                        <div class="field-group">
                            <label>ID (slug)</label>
                            <input type="text" class="proj-id" value="${esc(project.id || '')}" placeholder="my-project">
                            <p class="field-hint">Used for URLs and image filenames.</p>
                        </div>
                        <div class="field-group">
                            <label>Category</label>
                            <input type="text" class="proj-category" value="${esc(project.category || '')}" placeholder="Product Case Study">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Title</label>
                        <input type="text" class="proj-title" value="${esc(project.title || '')}">
                    </div>
                    <div class="field-group">
                        <label>Subtitle</label>
                        <textarea class="proj-subtitle">${esc(project.subtitle || '')}</textarea>
                    </div>
                    <div class="field-group">
                        <label>Description (shown on homepage card)</label>
                        <textarea class="proj-description">${esc(project.description || '')}</textarea>
                    </div>
                    <div class="field-group">
                        <label>Overview</label>
                        <textarea class="proj-overview tall">${esc(project.overview || '')}</textarea>
                    </div>
                    <div class="field-group">
                        <label>Objective</label>
                        <textarea class="proj-objective">${esc(project.objective || '')}</textarea>
                    </div>
                    <div class="field-row">
                        <div class="field-group">
                            <label>Detail Page Link</label>
                            <input type="text" class="proj-link" value="${esc(project.link || '')}" placeholder="projects/my-project.html">
                        </div>
                        <div class="field-group">
                            <label>Thumbnail Path</label>
                            <input type="text" class="proj-thumb-path" value="${esc(project.thumbnail || '')}" placeholder="images/thumbnails/my-project.png">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Replace Thumbnail</label>
                        <div class="image-preview">
                            <img class="proj-thumb-preview" src="../${esc(project.thumbnail || '')}" alt="" onerror="this.style.display='none'">
                            <div class="upload-controls">
                                <input type="file" class="proj-thumb-file" accept="image/*" data-proj-idx="${idx}">
                                <p class="field-hint">Upload to replace; auto-saved to <code>images/thumbnails/${esc(project.id || 'slug')}.[ext]</code></p>
                            </div>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Tags (comma-separated)</label>
                        <input type="text" class="proj-tags" value="${esc((project.tags || []).join(', '))}">
                    </div>
                    <div class="field-group">
                        <div class="checkbox-field">
                            <input type="checkbox" class="proj-featured" id="proj-featured-${idx}" ${project.featured ? 'checked' : ''}>
                            <label for="proj-featured-${idx}">Featured project (shown prominently on homepage)</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function attachHandlers() {
        const container = document.getElementById('projects-editor');

        container.addEventListener('click', (e) => {
            const t = e.target;
            if (t.matches('[data-proj-remove]')) {
                if (!confirm(`Remove project "${data[parseInt(t.dataset.projRemove)].title}"?`)) return;
                collectAll();
                data.splice(parseInt(t.dataset.projRemove), 1);
                render();
            } else if (t.matches('[data-proj-up]')) {
                const i = parseInt(t.dataset.projUp);
                if (i > 0) {
                    collectAll();
                    [data[i - 1], data[i]] = [data[i], data[i - 1]];
                    render();
                }
            } else if (t.matches('[data-proj-down]')) {
                const i = parseInt(t.dataset.projDown);
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

        // Thumbnail upload preview + queue
        container.querySelectorAll('.proj-thumb-file').forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const idx = parseInt(e.target.dataset.projIdx);
                const projId = data[idx].id || `project-${idx}`;
                pendingUploads[projId] = file;

                // Preview
                const card = e.target.closest('.item-card');
                const preview = card.querySelector('.proj-thumb-preview');
                const reader = new FileReader();
                reader.onload = () => {
                    preview.src = reader.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);

                // Auto-update path field
                const ext = file.name.split('.').pop().toLowerCase();
                const newPath = `images/thumbnails/${projId}.${ext}`;
                card.querySelector('.proj-thumb-path').value = newPath;
            });
        });
    }

    function addProject() {
        collectAll();
        data.unshift({
            id: 'new-project',
            title: 'New Project',
            description: '',
            thumbnail: '',
            link: '',
            tags: [],
            featured: false,
            category: 'Product Case Study',
            subtitle: '',
            overview: '',
            objective: '',
            sections: []
        });
        render();
        // Expand the new card
        const firstCard = document.querySelector('#projects-editor .item-card');
        if (firstCard) firstCard.classList.add('open');
    }

    function collectAll() {
        const cards = document.querySelectorAll('#projects-editor .item-card');
        cards.forEach((card, i) => {
            const idx = parseInt(card.dataset.projectIdx);
            if (isNaN(idx) || !data[idx]) return;
            data[idx] = {
                ...data[idx],
                id: card.querySelector('.proj-id').value.trim(),
                category: card.querySelector('.proj-category').value,
                title: card.querySelector('.proj-title').value,
                subtitle: card.querySelector('.proj-subtitle').value,
                description: card.querySelector('.proj-description').value,
                overview: card.querySelector('.proj-overview').value,
                objective: card.querySelector('.proj-objective').value,
                link: card.querySelector('.proj-link').value,
                thumbnail: card.querySelector('.proj-thumb-path').value,
                tags: card.querySelector('.proj-tags').value
                    .split(',').map(s => s.trim()).filter(Boolean),
                featured: card.querySelector('.proj-featured').checked
            };
        });
    }

    async function save() {
        const btn = document.getElementById('save-projects');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        Status.show('Saving projects…', 'info', 0);

        try {
            collectAll();

            // Upload any pending thumbnail files
            const uploadKeys = Object.keys(pendingUploads);
            if (uploadKeys.length > 0) {
                for (const projId of uploadKeys) {
                    const file = pendingUploads[projId];
                    const ext = file.name.split('.').pop().toLowerCase();
                    const path = `images/thumbnails/${projId}.${ext}`;
                    Status.show(`Uploading ${path}…`, 'info', 0);
                    await GitHubAPI.uploadImage(file, path);
                }
                pendingUploads = {};
            }

            // Save JSON
            const result = await GitHubAPI.putJSON(
                FILE_PATH,
                data,
                sha,
                `Admin: update projects (${new Date().toISOString()})`
            );
            sha = result.content.sha;
            Status.show('✅ Projects saved successfully', 'success');
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
