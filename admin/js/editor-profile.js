// ============================================================
// EDITOR — PROFILE (Hero, About, Capabilities, Contact)
// ============================================================

const EditorProfile = (function () {
    const FILE_PATH = 'data/profile.json';
    let data = null;
    let sha = null;

    async function init() {
        document.getElementById('save-profile').addEventListener('click', save);
        await load();
    }

    async function load() {
        const container = document.getElementById('profile-editor');
        try {
            const result = await GitHubAPI.getJSON(FILE_PATH);
            data = result.data;
            sha = result.sha;
            render();
        } catch (err) {
            container.innerHTML = `<p class="status-bar error">Failed to load profile: ${err.message}</p>`;
        }
    }

    function render() {
        const container = document.getElementById('profile-editor');
        container.innerHTML = `
            <!-- HERO -->
            <div class="editor-section">
                <h3>Hero Section</h3>
                <div class="field-group">
                    <label>Eyebrow Label</label>
                    <input type="text" id="p-eyebrow" value="${esc(data.eyebrowLabel || '')}">
                </div>
                <div class="field-group">
                    <label>Tagline (Main Headline)</label>
                    <input type="text" id="p-tagline" value="${esc(data.tagline || '')}">
                </div>
                <div class="field-group">
                    <label>Subtitle</label>
                    <textarea id="p-subtitle">${esc(data.subtitle || '')}</textarea>
                </div>
                <div class="field-group">
                    <label>Supporting Body</label>
                    <textarea id="p-body" class="tall">${esc(data.supportingBody || '')}</textarea>
                </div>
            </div>

            <!-- PROFILE CARD -->
            <div class="editor-section">
                <h3>Profile Card</h3>
                <div class="field-row">
                    <div class="field-group">
                        <label>Name</label>
                        <input type="text" id="p-name" value="${esc(data.name || '')}">
                    </div>
                    <div class="field-group">
                        <label>Current Role</label>
                        <input type="text" id="p-role" value="${esc(data.currentRole || '')}">
                    </div>
                </div>
                <div class="field-group">
                    <label>Profile Photo</label>
                    <div class="image-preview">
                        <img id="p-photo-preview" src="../${esc(data.profilePhoto || '')}" alt="" onerror="this.style.display='none'">
                        <div class="upload-controls">
                            <input type="text" id="p-photo-path" value="${esc(data.profilePhoto || '')}" placeholder="images/profile-pic.jpg">
                            <input type="file" id="p-photo-file" accept="image/*">
                            <p class="field-hint">Upload to replace, or type path manually.</p>
                        </div>
                    </div>
                </div>
                <div class="field-group">
                    <label>Metadata Chips (one per line)</label>
                    <textarea id="p-chips">${(data.metadataChips || []).join('\n')}</textarea>
                    <p class="field-hint">e.g. "Toronto, Canada" — one chip per line</p>
                </div>
                <div class="field-group">
                    <label>Hero Metrics (3 stats)</label>
                    <div id="p-metrics-list" class="list-editor">
                        ${renderMetrics(data.heroMetrics || [])}
                    </div>
                </div>
            </div>

            <!-- ABOUT -->
            <div class="editor-section">
                <h3>About Section</h3>
                <div class="field-group">
                    <label>About Headline</label>
                    <input type="text" id="p-about-headline" value="${esc(data.aboutHeadline || '')}">
                </div>
                <div class="field-group">
                    <label>About Paragraphs (one per textarea)</label>
                    <div id="p-about-list" class="list-editor">
                        ${renderParagraphs(data.aboutParagraphs || [])}
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" id="p-add-paragraph">+ Add Paragraph</button>
                </div>
            </div>

            <!-- CAPABILITIES -->
            <div class="editor-section">
                <h3>Capabilities (Grid Cards)</h3>
                <div id="p-capabilities-list">
                    ${renderCapabilities(data.capabilities || [])}
                </div>
                <button type="button" class="btn btn-outline btn-sm" id="p-add-capability">+ Add Capability</button>
            </div>

            <!-- CONTACT -->
            <div class="editor-section">
                <h3>Contact</h3>
                <div class="field-row">
                    <div class="field-group">
                        <label>Email</label>
                        <input type="email" id="p-email" value="${esc(data.email || '')}">
                    </div>
                    <div class="field-group">
                        <label>Location</label>
                        <input type="text" id="p-location" value="${esc(data.location || '')}">
                    </div>
                </div>
                <div class="field-row">
                    <div class="field-group">
                        <label>LinkedIn URL</label>
                        <input type="url" id="p-linkedin" value="${esc(data.linkedin || '')}">
                    </div>
                    <div class="field-group">
                        <label>GitHub URL</label>
                        <input type="url" id="p-github" value="${esc(data.github || '')}">
                    </div>
                </div>
            </div>
        `;

        attachHandlers();
    }

    function renderMetrics(metrics) {
        // Always 3 metrics
        const filled = [...metrics];
        while (filled.length < 3) filled.push({ value: '', label: '' });
        return filled.slice(0, 3).map((m, i) => `
            <div class="field-row" data-metric-idx="${i}">
                <div class="field-group">
                    <label>Metric ${i + 1} Value</label>
                    <input type="text" class="p-metric-value" value="${esc(m.value || '')}">
                </div>
                <div class="field-group">
                    <label>Metric ${i + 1} Label</label>
                    <input type="text" class="p-metric-label" value="${esc(m.label || '')}">
                </div>
            </div>
        `).join('');
    }

    function renderParagraphs(paragraphs) {
        return paragraphs.map((p, i) => `
            <div class="list-item-row" data-para-idx="${i}">
                <textarea class="p-paragraph">${esc(p)}</textarea>
                <button type="button" class="btn-icon" data-remove-para="${i}">✕</button>
            </div>
        `).join('');
    }

    function renderCapabilities(caps) {
        return caps.map((c, i) => `
            <div class="item-card" data-cap-idx="${i}">
                <div class="item-card-header" data-toggle>
                    <div class="item-card-title">
                        <span>${esc(c.icon || '')}</span>
                        <span>${esc(c.title || 'Untitled')}</span>
                    </div>
                    <div class="item-card-actions">
                        <button type="button" class="btn-icon up" data-cap-up="${i}" title="Move up">↑</button>
                        <button type="button" class="btn-icon down" data-cap-down="${i}" title="Move down">↓</button>
                        <button type="button" class="btn-icon" data-cap-remove="${i}" title="Remove">✕</button>
                        <span class="toggle-icon">▼</span>
                    </div>
                </div>
                <div class="item-card-body">
                    <div class="field-row">
                        <div class="field-group">
                            <label>Icon (emoji)</label>
                            <input type="text" class="cap-icon" value="${esc(c.icon || '')}">
                        </div>
                        <div class="field-group">
                            <label>Title</label>
                            <input type="text" class="cap-title" value="${esc(c.title || '')}">
                        </div>
                    </div>
                    <div class="field-group">
                        <label>Description</label>
                        <textarea class="cap-desc">${esc(c.description || '')}</textarea>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function attachHandlers() {
        // Photo file upload preview
        document.getElementById('p-photo-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    document.getElementById('p-photo-preview').src = reader.result;
                    document.getElementById('p-photo-preview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        // Add paragraph
        document.getElementById('p-add-paragraph').addEventListener('click', () => {
            data.aboutParagraphs = collectParagraphs();
            data.aboutParagraphs.push('');
            render();
        });

        // Remove paragraph
        document.getElementById('p-about-list').addEventListener('click', (e) => {
            if (e.target.dataset.removePara !== undefined) {
                data.aboutParagraphs = collectParagraphs();
                data.aboutParagraphs.splice(parseInt(e.target.dataset.removePara), 1);
                render();
            }
        });

        // Add capability
        document.getElementById('p-add-capability').addEventListener('click', () => {
            data.capabilities = collectCapabilities();
            data.capabilities.push({ icon: '✨', title: 'New Capability', description: '' });
            render();
        });

        // Capability card actions
        document.getElementById('p-capabilities-list').addEventListener('click', (e) => {
            const t = e.target;
            if (t.matches('[data-cap-remove]')) {
                if (!confirm('Remove this capability?')) return;
                data.capabilities = collectCapabilities();
                data.capabilities.splice(parseInt(t.dataset.capRemove), 1);
                render();
            } else if (t.matches('[data-cap-up]')) {
                const i = parseInt(t.dataset.capUp);
                if (i > 0) {
                    data.capabilities = collectCapabilities();
                    [data.capabilities[i - 1], data.capabilities[i]] = [data.capabilities[i], data.capabilities[i - 1]];
                    render();
                }
            } else if (t.matches('[data-cap-down]')) {
                const i = parseInt(t.dataset.capDown);
                if (i < data.capabilities.length - 1) {
                    data.capabilities = collectCapabilities();
                    [data.capabilities[i], data.capabilities[i + 1]] = [data.capabilities[i + 1], data.capabilities[i]];
                    render();
                }
            } else if (t.closest('[data-toggle]')) {
                // Avoid toggle when clicking action buttons
                if (!t.closest('.item-card-actions')) {
                    t.closest('.item-card').classList.toggle('open');
                }
            }
        });
    }

    function collectParagraphs() {
        return Array.from(document.querySelectorAll('.p-paragraph')).map(t => t.value);
    }

    function collectCapabilities() {
        return Array.from(document.querySelectorAll('#p-capabilities-list .item-card')).map(card => ({
            icon: card.querySelector('.cap-icon').value,
            title: card.querySelector('.cap-title').value,
            description: card.querySelector('.cap-desc').value
        }));
    }

    function collectMetrics() {
        return Array.from(document.querySelectorAll('#p-metrics-list [data-metric-idx]')).map(row => ({
            value: row.querySelector('.p-metric-value').value,
            label: row.querySelector('.p-metric-label').value
        })).filter(m => m.value || m.label);
    }

    async function save() {
        const btn = document.getElementById('save-profile');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        Status.show('Saving profile…', 'info', 0);

        try {
            // Handle photo upload first if a new file is selected
            const fileInput = document.getElementById('p-photo-file');
            let photoPath = document.getElementById('p-photo-path').value.trim();

            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                // Preserve extension
                const ext = file.name.split('.').pop().toLowerCase();
                photoPath = `images/profile-pic.${ext}`;
                Status.show('Uploading photo…', 'info', 0);
                await GitHubAPI.uploadImage(file, photoPath);
            }

            // Build updated object
            const updated = {
                ...data,
                eyebrowLabel: document.getElementById('p-eyebrow').value,
                tagline: document.getElementById('p-tagline').value,
                subtitle: document.getElementById('p-subtitle').value,
                supportingBody: document.getElementById('p-body').value,
                name: document.getElementById('p-name').value,
                currentRole: document.getElementById('p-role').value,
                profilePhoto: photoPath,
                metadataChips: document.getElementById('p-chips').value
                    .split('\n').map(s => s.trim()).filter(Boolean),
                heroMetrics: collectMetrics(),
                aboutHeadline: document.getElementById('p-about-headline').value,
                aboutParagraphs: collectParagraphs(),
                capabilities: collectCapabilities(),
                email: document.getElementById('p-email').value,
                location: document.getElementById('p-location').value,
                linkedin: document.getElementById('p-linkedin').value,
                github: document.getElementById('p-github').value
            };

            // Need fresh sha (since photo upload may have changed things, but profile.json wasn't touched)
            // We already have the latest sha for profile.json — reuse it
            const result = await GitHubAPI.putJSON(
                FILE_PATH,
                updated,
                sha,
                `Admin: update profile (${new Date().toISOString()})`
            );

            data = updated;
            sha = result.content.sha;
            Status.show('✅ Profile saved successfully', 'success');
        } catch (err) {
            Status.show(`❌ Save failed: ${err.message}`, 'error', 0);
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 Save Changes';
        }
    }

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    return { init };
})();