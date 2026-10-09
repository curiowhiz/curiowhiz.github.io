// ============================================================
// LOADER.JS - Portfolio Brain (v3 - Stitch redesign)
// Reads JSON files and dynamically builds homepage sections
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('Loader v3 initialized');

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
// hero metric to the bullet where that figure appears. One request, shared.
const experienceRequest = fetch('data/experience.json').then(response => response.json());

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

// Finds the first bullet (most recent role first) that contains the metric's
// figure as a whole number, so "7%" never matches "17%". Returns an anchor id,
// or null when nothing matches, in which case the metric simply is not a link.
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
// PROFILE LOADER - Hero, Profile Card, About, Capabilities, Contact
// ============================================================
async function loadProfile() {
    try {
        const response = await fetch('data/profile.json');
        const profile = await response.json();

        // PAGE TITLE (plain text, not HTML - no escaping needed here)
        document.title = `${profile.name} - ${profile.subtitle.split(',')[0]}`;

        // HERO LEFT
        const heroEyebrow = document.getElementById('hero-eyebrow');
        if (heroEyebrow) heroEyebrow.textContent = profile.eyebrowLabel;

        const heroTagline = document.getElementById('hero-tagline');
        if (heroTagline) heroTagline.textContent = profile.tagline;

        const heroSubtitle = document.getElementById('hero-subtitle');
        if (heroSubtitle) heroSubtitle.textContent = profile.subtitle;

        const heroBody = document.getElementById('hero-body');
        if (heroBody) heroBody.textContent = profile.supportingBody;

        // PROFILE CARD
        const profilePhoto = document.getElementById('profile-photo');
        if (profilePhoto) {
            profilePhoto.src = profile.profilePhoto;
            profilePhoto.alt = `${profile.name} - ${profile.subtitle.split(',')[0]}`;
        }

        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = profile.name;

        const profileRole = document.getElementById('profile-role');
        if (profileRole) profileRole.textContent = profile.currentRole;

        // Profile metadata chips
        const profileChips = document.getElementById('profile-chips');
        if (profileChips && profile.metadataChips) {
            profileChips.innerHTML = profile.metadataChips
                .map(chip => `<span class="profile-chip">${esc(chip)}</span>`)
                .join('');
        }

        // Profile metrics (3 stats below chips)
        const profileMetrics = document.getElementById('profile-metrics');
        if (profileMetrics && profile.heroMetrics) {
            // Each metric links to the experience bullet it came from. If the
            // experience data cannot be loaded, the metrics still render, unlinked.
            experienceRequest.catch(() => []).then(experience => {
                profileMetrics.innerHTML = profile.heroMetrics.map(metric => {
                    const inner = `
                        <span class="profile-metric-value">${esc(metric.value)}</span>
                        <span class="profile-metric-label">${esc(metric.label)}</span>
                    `;
                    const target = findEvidence(metric.value, experience);
                    return target
                        ? `<a class="profile-metric" href="#${esc(target)}">${inner}</a>`
                        : `<div class="profile-metric">${inner}</div>`;
                }).join('');
            });
        }

        // ABOUT SECTION
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

        // CAPABILITIES GRID
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

        // CONTACT
        const contactEmail = document.getElementById('contact-email');
        if (contactEmail) {
            contactEmail.href = `mailto:${profile.email}`;
            contactEmail.textContent = profile.email;
        }

        const contactLinkedin = document.getElementById('contact-linkedin');
        if (contactLinkedin) contactLinkedin.href = profile.linkedin;

        const contactLocation = document.getElementById('contact-location');
        if (contactLocation) contactLocation.textContent = profile.location;

        const footerGithub = document.getElementById('footer-github');
        if (footerGithub) footerGithub.href = profile.github;

        console.log('Profile loaded');
    } catch (error) {
        console.error('Error loading profile:', error);
        showFallback();
    }
}


// ============================================================
// PROJECTS LOADER - Asymmetric grid with Ladder AI featured
// ============================================================
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
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

            return `
                <a href="${esc(project.link)}" class="project-card ${project.featured ? 'featured' : ''}">
                    ${featuredFlag}
                    <div class="project-thumbnail">
                        ${getProjectThumbnail(project)}
                    </div>
                    <div class="project-content">
                        ${project.category ? `<span class="project-category">${esc(project.category)}</span>` : ''}
                        <h3 class="project-title">${esc(project.title)}</h3>
                        <p class="project-description">${esc(project.description)}</p>
                        <div class="project-tags">
                            ${project.tags.slice(0, 3).map(tag => `<span class="project-tag">${esc(tag)}</span>`).join('')}
                        </div>
                        ${metricLine}
                        <span class="project-cta">View Case Study →</span>
                    </div>
                </a>
            `;
        }).join('');

        console.log(`Projects loaded (${projects.length} total)`);
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Returns thumbnail image OR Ladder AI gradient placeholder
function getProjectThumbnail(project) {
    if (project.id === 'ladder-ai') {
        return `
            <div class="project-emoji-placeholder ladder-ai-gradient">
                <span class="placeholder-emoji"></span>
                <span class="placeholder-label">Ladder AI</span>
            </div>
        `;
    }
    return `<img src="${esc(project.thumbnail)}" alt="${esc(project.title)}" loading="lazy">`;
}


// ============================================================
// TOOLS LOADER - Includes dark technical card
// ============================================================
async function loadTools() {
    try {
        const response = await fetch('data/tools.json');
        const tools = await response.json();

        const sortedTools = [...tools].sort((a, b) => a.order - b.order);

        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        const statusColors = {
            active: '#5B8C5A',
            building: '#D9A441',
            archived: '#6B7280'
        };

        toolsGrid.innerHTML = sortedTools.map(tool => {
            const isDark = tool.darkCard === true;
            const statusLabel = tool.statusLabel || (tool.status.charAt(0).toUpperCase() + tool.status.slice(1));
            const statusDotClass = tool.status === 'building' ? 'status-dot building' : 'status-dot';

            // internal note (tools without a public link still show this)
            const internalNoteHtml = tool.internalNote
                ? `<p class="tool-internal-note">${esc(tool.internalNote)}</p>`
                : '';

            // Code preview for dark cards
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
                        <span class="${statusDotClass}" style="background-color: ${statusColors[tool.status] || statusColors.archived}"></span>
                        <span class="status-label">${esc(statusLabel)}</span>
                    </div>
                    ${internalNoteHtml}
                    ${codePreviewHtml}
                    ${ctaHtml}
                </${cardTag}>
            `;
        }).join('');

        console.log(`Tools loaded (${tools.length} total)`);
    } catch (error) {
        console.error('Error loading tools:', error);
    }
}


// ============================================================
// EXPERIENCE LOADER - Timeline with current-role pulse
// ============================================================
async function loadExperience() {
    try {
        const experience = await experienceRequest;

        const timelineContainer = document.getElementById('experience-timeline');
        if (!timelineContainer) return;

        timelineContainer.innerHTML = experience.map(role => `
            <div class="timeline-item ${role.current ? 'current' : ''}">
                <div class="timeline-marker">
                    ${role.current ? '<span class="current-pulse"></span>' : ''}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3 class="timeline-title">
                            ${role.current ? '<span class="current-badge">CURRENT</span>' : ''}
                            ${esc(role.title)}
                        </h3>
                        <span class="timeline-date">${esc(role.startDate)} - ${esc(role.endDate)}</span>
                    </div>
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

        console.log(`Experience loaded (${experience.length} roles)`);
    } catch (error) {
        console.error('Error loading experience:', error);
    }
}


// ============================================================
// NAVIGATION - Sticky shadow + mobile hamburger
// ============================================================
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navBackdrop = document.getElementById('navBackdrop');
    const navbar = document.querySelector('.navbar');
    const body = document.body;

    if (!hamburger || !navLinks) {
        console.warn('⚠️ Navigation elements missing');
        return;
    }

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

    // Handle nav link clicks - close menu, then smoothly scroll to section
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only intercept internal anchor links (e.g., #about)
            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);

                if (!target) {
                    console.warn('Target section not found:', targetId);
                    closeMenu();
                    return;
                }

                // Close menu first
                closeMenu();

                // Wait for menu close + body unlock, THEN scroll
                setTimeout(() => {
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL hash without causing a jump
                    history.pushState(null, '', href);
                }, 400);
            } else {
                // External link - just close the menu
                closeMenu();
            }
        });
    });

    // Close on backdrop click
    if (navBackdrop) {
        navBackdrop.addEventListener('click', closeMenu);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburger.classList.contains('active')) {
            closeMenu();
        }
    });

    // Sticky nav shadow on scroll
    if (navbar) {
        const handleScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 8);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    console.log('Navigation initialized (v2 with scroll fix)');
}

// ============================================================
// FALLBACK if JS/JSON fails
// ============================================================
function showFallback() {
    const main = document.getElementById('main');
    if (main) {
        const fallback = document.createElement('div');
        fallback.style.cssText = 'padding: 80px 24px; text-align: center; max-width: 600px; margin: 0 auto;';
        fallback.innerHTML = `
            <h2 style="margin-bottom: 16px;">Content could not be loaded.</h2>
            <p style="color: #6B7280;">Please refresh, or visit <a href="https://www.linkedin.com/in/rgdroll" style="color: #0D5C5C;">Rajan Gupta on LinkedIn</a>.</p>
        `;
        main.prepend(fallback);
    }
}