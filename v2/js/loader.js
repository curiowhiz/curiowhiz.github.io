// ============================================================
// LOADER.JS - Version 2 (inspection record)
// Reads the same data files as the original site (../data/*.json), so the
// words on both designs always match and the admin panel updates both.
// Only the markup it builds and the asset paths differ.
// ============================================================

const DATA = '../data/';

// Data files hold site-root paths such as images/thumbnails/x.png. This
// design lives one folder down, so images and documents are reached via ../.
// Case-study links (projects/x.html) stay as they are: version 2 has its own.
function assetPath(path) {
    const value = String(path ?? '');
    if (!value || /^(https?:|mailto:|#|\/|\.\.\/)/i.test(value)) return value;
    return '../' + value;
}

document.addEventListener('DOMContentLoaded', function () {
    loadProfile();
    loadProjects();
    loadTools();
    loadExperience();
    setupNavigation();
});

// Escapes text before it is inserted via innerHTML, so data/*.json content
// is always rendered as text and can never be interpreted as markup.
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// Experience data is needed twice: to build the timeline, and to link each
// hero reading to the bullet where that figure appears. One request, shared.
const experienceRequest = fetch(DATA + 'experience.json').then(response => response.json());

function slugify(text) {
    return String(text ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Stable anchor for one achievement bullet: company slug plus its position.
function evidenceId(role, index) {
    return `${slugify(role.company)}-${index}`;
}

// Marks the bullet named in the URL hash and, on first load, scrolls to it.
// The bullets are inserted after the page loads, so the browser's own
// :target handling would miss a link that is already in the address bar.
function syncEvidenceTarget(scrollIntoView) {
    document.querySelectorAll('.timeline-achievements li.is-target')
        .forEach(item => item.classList.remove('is-target'));

    const id = decodeURIComponent(location.hash.slice(1));
    const item = id ? document.getElementById(id) : null;
    if (!item || !item.matches('.timeline-achievements li')) return;

    item.classList.add('is-target');
    if (scrollIntoView) item.scrollIntoView();
}

window.addEventListener('hashchange', () => syncEvidenceTarget(false));

// Finds the first bullet (most recent role first) that contains the figure
// as a whole number, so "7%" never matches "17%". Returns an anchor id, or
// null when nothing matches, in which case the reading is simply not a link.
function findEvidence(value, experience) {
    const figure = String(value ?? '').trim();
    if (!figure) return null;
    const escaped = figure.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('(^|[^\\d.])' + escaped + '(?!\\d)');
    for (const role of experience) {
        const index = role.achievements.findIndex(text => pattern.test(text));
        if (index !== -1) return evidenceId(role, index);
    }
    return null;
}


// ============================================================
// PROFILE - Hero, title block, tags, About, Capabilities, Contact
// ============================================================
async function loadProfile() {
    try {
        const response = await fetch(DATA + 'profile.json');
        const profile = await response.json();

        // PAGE TITLE (plain text, not HTML - no escaping needed here)
        document.title = `${profile.name} - ${profile.subtitle.split(',')[0]}`;

        // HERO
        const heroEyebrow = document.getElementById('hero-eyebrow');
        if (heroEyebrow) heroEyebrow.textContent = profile.eyebrowLabel;

        const heroTagline = document.getElementById('hero-tagline');
        if (heroTagline) heroTagline.textContent = profile.tagline;

        const heroSubtitle = document.getElementById('hero-subtitle');
        if (heroSubtitle) heroSubtitle.textContent = profile.subtitle;

        const heroBody = document.getElementById('hero-body');
        if (heroBody) heroBody.textContent = profile.supportingBody;

        // TITLE BLOCK
        const profilePhoto = document.getElementById('profile-photo');
        if (profilePhoto) {
            profilePhoto.src = assetPath(profile.profilePhoto);
            profilePhoto.alt = `${profile.name} - ${profile.subtitle.split(',')[0]}`;
        }

        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = profile.name;

        const profileRole = document.getElementById('profile-role');
        if (profileRole) profileRole.textContent = profile.currentRole;

        const profileChips = document.getElementById('profile-chips');
        if (profileChips && profile.metadataChips) {
            profileChips.innerHTML = profile.metadataChips
                .map(chip => `<span class="profile-chip">${esc(chip)}</span>`)
                .join('');
        }

        // TAGS: each reading links to the experience bullet it came from. If the
        // experience data cannot be loaded, the tags still render, unlinked.
        const profileMetrics = document.getElementById('profile-metrics');
        if (profileMetrics && profile.heroMetrics) {
            experienceRequest.catch(() => []).then(experience => {
                profileMetrics.innerHTML = profile.heroMetrics.map(metric => {
                    const inner = `
                        <span class="profile-metric-value">${esc(metric.value)}</span>
                        <span class="profile-metric-label">${esc(metric.label)}</span>
                    `;
                    const target = findEvidence(metric.value, experience);
                    // The drawn arrow says "this goes somewhere"; the accessible name
                    // says where, without adding any visible words.
                    const cue = '<svg class="tag-cue" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v15M5 13l7 7 7-7"/></svg>';
                    const label = `${metric.value} ${metric.label}, see where this comes from in Professional Experience`;
                    return target
                        ? `<a class="profile-metric" href="#${esc(target)}" aria-label="${esc(label)}">${inner}${cue}</a>`
                        : `<div class="profile-metric">${inner}</div>`;
                }).join('');
            });
        }

        // ABOUT
        const aboutHeadline = document.getElementById('about-headline');
        if (aboutHeadline) aboutHeadline.textContent = profile.aboutHeadline;

        const aboutParagraphs = document.getElementById('about-paragraphs');
        if (aboutParagraphs && profile.aboutParagraphs) {
            // Intentionally not escaped: these paragraphs carry inline <strong>
            // markup by design (edited only via the admin panel).
            aboutParagraphs.innerHTML = profile.aboutParagraphs
                .map(p => `<p>${p}</p>`)
                .join('');
        }

        // CAPABILITIES: a schedule of rows, not a grid of cards
        const capabilitiesGrid = document.getElementById('capabilities-grid');
        if (capabilitiesGrid && profile.capabilities) {
            capabilitiesGrid.innerHTML = profile.capabilities.map(cap => `
                <div class="capability-card">
                    <div class="capability-icon">${esc(cap.icon)}</div>
                    <h3 class="capability-title">${esc(cap.title)}</h3>
                    <p class="capability-description">${esc(cap.description)}</p>
                </div>
            `).join('');
        }

        // CONTACT (the email button keeps its icon; only the label becomes the address)
        const contactEmail = document.getElementById('contact-email');
        if (contactEmail) {
            contactEmail.href = `mailto:${profile.email}`;
            const label = contactEmail.querySelector('span');
            if (label) label.textContent = profile.email;
        }

        const contactLinkedin = document.getElementById('contact-linkedin');
        if (contactLinkedin) contactLinkedin.href = profile.linkedin;

        const contactLocation = document.getElementById('contact-location');
        if (contactLocation) contactLocation.textContent = profile.location;

        const footerGithub = document.getElementById('footer-github');
        if (footerGithub) footerGithub.href = profile.github;
    } catch (error) {
        console.error('Error loading profile:', error);
        showFallback();
    }
}


// ============================================================
// PROJECTS - One featured spread, then a register of the rest
// ============================================================
async function loadProjects() {
    try {
        const response = await fetch(DATA + 'projects.json');
        const projects = await response.json();

        // Sort: featured first
        const sortedProjects = [...projects].sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
        });

        const projectsGrid = document.getElementById('projects-grid');
        if (!projectsGrid) return;

        projectsGrid.innerHTML = sortedProjects.map(project => {
            const metricLine = project.keyMetric
                ? `<div class="project-metric">${esc(project.keyMetric)}</div>`
                : '';

            const featuredFlag = project.featured
                ? '<span class="featured-flag">FEATURED</span>'
                : '';

            const category = project.category
                ? `<span class="project-category">${esc(project.category)}</span>`
                : '';

            return `
                <a href="${esc(project.link)}" class="project-card ${project.featured ? 'featured' : ''}">
                    <div class="project-thumbnail">
                        ${getProjectThumbnail(project)}
                    </div>
                    <div class="project-content">
                        ${featuredFlag}
                        <h3 class="project-title">${esc(project.title)}</h3>
                        <p class="project-description">${esc(project.description)}</p>
                        ${metricLine}
                        <div class="project-meta">
                            ${category}
                            <div class="project-tags">
                                ${project.tags.slice(0, 3).map(tag => `<span class="project-tag">${esc(tag)}</span>`).join('')}
                            </div>
                        </div>
                        <span class="project-cta">View Case Study →</span>
                    </div>
                </a>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Returns thumbnail image OR the Ladder AI placeholder
function getProjectThumbnail(project) {
    if (project.id === 'ladder-ai') {
        return `
            <div class="project-emoji-placeholder ladder-ai-gradient">
                <span class="placeholder-emoji"></span>
                <span class="placeholder-label">Ladder AI</span>
            </div>
        `;
    }
    // The card's link already carries the title, so the picture is decorative.
    return `<img src="${esc(assetPath(project.thumbnail))}" alt="" loading="lazy">`;
}


// ============================================================
// TOOLS - Specification panels, one dark
// ============================================================
async function loadTools() {
    try {
        const response = await fetch(DATA + 'tools.json');
        const tools = await response.json();

        const sortedTools = [...tools].sort((a, b) => a.order - b.order);

        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        const knownStatuses = ['active', 'building', 'archived'];

        toolsGrid.innerHTML = sortedTools.map(tool => {
            const isDark = tool.darkCard === true;
            const statusLabel = tool.statusLabel || (tool.status.charAt(0).toUpperCase() + tool.status.slice(1));
            const statusKey = knownStatuses.includes(tool.status) ? tool.status : 'archived';

            const internalNoteHtml = tool.internalNote
                ? `<p class="tool-internal-note">${esc(tool.internalNote)}</p>`
                : '';

            const codePreviewHtml = tool.codePreview
                ? `<pre class="tool-code-preview">${esc(tool.codePreview)}</pre>`
                : '';

            const cardTag = tool.detailUrl ? 'a' : 'div';
            const hrefAttr = tool.detailUrl ? `href="${esc(tool.detailUrl)}"` : '';
            const ctaHtml = tool.detailUrl ? '<span class="tool-cta">View Details →</span>' : '';

            return `
                <${cardTag} ${hrefAttr} class="tool-card ${isDark ? 'dark' : ''}">
                    <div class="tool-icon">${esc(tool.icon)}</div>
                    <h3 class="tool-name">${esc(tool.name)}</h3>
                    <p class="tool-description">${esc(tool.description)}</p>
                    <div class="tool-tags">
                        ${tool.technologies.map(tech => `<span class="tool-tag">${esc(tech)}</span>`).join('')}
                    </div>
                    <div class="tool-status">
                        <span class="status-dot status-${statusKey}"></span>
                        <span class="status-label">${esc(statusLabel)}</span>
                    </div>
                    ${internalNoteHtml}
                    ${codePreviewHtml}
                    ${ctaHtml}
                </${cardTag}>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading tools:', error);
    }
}


// ============================================================
// EXPERIENCE - A line with stations. The order is real, so it earns the form.
// ============================================================
async function loadExperience() {
    try {
        const experience = await experienceRequest;

        const timelineContainer = document.getElementById('experience-timeline');
        if (!timelineContainer) return;

        timelineContainer.innerHTML = experience.map(role => `
            <div class="timeline-item ${role.current ? 'current' : ''}">
                <div class="timeline-marker"></div>
                <div class="timeline-dates">
                    <span class="timeline-date">${esc(role.startDate)} - ${esc(role.endDate)}</span>
                </div>
                <div class="timeline-content">
                    <h3 class="timeline-title">
                        ${role.current ? '<span class="current-badge">CURRENT</span>' : ''}
                        ${esc(role.title)}
                    </h3>
                    <div class="timeline-company">
                        <strong>${esc(role.company)}</strong> · ${esc(role.location)}
                    </div>
                    <ul class="timeline-achievements">
                        ${role.achievements.map((a, i) => `<li id="${esc(evidenceId(role, i))}">${esc(a)}</li>`).join('')}
                    </ul>
                    <div class="timeline-tags">
                        ${role.tags.map(tag => `<span class="timeline-tag">${esc(tag)}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        syncEvidenceTarget(true);
    } catch (error) {
        console.error('Error loading experience:', error);
    }
}


// ============================================================
// NAVIGATION - Mobile menu and smooth scrolling to sections
// ============================================================
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navBackdrop = document.getElementById('navBackdrop');
    const navbar = document.querySelector('.navbar');
    const body = document.body;

    if (!hamburger || !navLinks) return;

    const closeMenu = () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        if (navBackdrop) navBackdrop.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        body.classList.remove('nav-open');
    };

    const openMenu = () => {
        hamburger.classList.add('active');
        navLinks.classList.add('active');
        if (navBackdrop) navBackdrop.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        body.classList.add('nav-open');
    };

    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (hamburger.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Handle nav link clicks: close the menu, then scroll to the section
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only intercept internal anchor links (e.g., #about)
            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();

                const target = document.getElementById(href.substring(1));

                if (!target) {
                    closeMenu();
                    return;
                }

                closeMenu();

                // Wait for menu close + body unlock, THEN scroll
                setTimeout(() => {
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: reduceMotion.matches ? 'auto' : 'smooth'
                    });

                    history.pushState(null, '', href);
                }, 400);
            } else {
                // External or cross-design link: just close the menu
                closeMenu();
            }
        });
    });

    if (navBackdrop) {
        navBackdrop.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburger.classList.contains('active')) {
            closeMenu();
        }
    });
}

// ============================================================
// FALLBACK if JS/JSON fails
// ============================================================
function showFallback() {
    const main = document.getElementById('main');
    if (main) {
        const fallback = document.createElement('div');
        fallback.className = 'load-fallback';
        fallback.innerHTML = `
            <h2>Content could not be loaded.</h2>
            <p>Please refresh, or visit <a href="https://www.linkedin.com/in/rgdroll">Rajan Gupta on LinkedIn</a>.</p>
        `;
        main.prepend(fallback);
    }
}
