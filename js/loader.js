// ============================================================
// LOADER.JS — Portfolio Brain (v3 — Stitch redesign)
// Reads JSON files and dynamically builds homepage sections
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Loader v3 initialized');

    loadProfile();
    loadProjects();
    loadTools();
    loadExperience();
    setupNavigation();
});


// ============================================================
// PROFILE LOADER — Hero, Profile Card, About, Capabilities, Contact
// ============================================================
async function loadProfile() {
    try {
        const response = await fetch('data/profile.json');
        const profile = await response.json();

        // PAGE TITLE
        document.title = `${profile.name} — ${profile.subtitle.split(',')[0]}`;

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
            profilePhoto.alt = `${profile.name} — ${profile.subtitle.split(',')[0]}`;
        }

        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = profile.name;

        const profileRole = document.getElementById('profile-role');
        if (profileRole) profileRole.textContent = profile.currentRole;

        // Profile metadata chips
        const profileChips = document.getElementById('profile-chips');
        if (profileChips && profile.metadataChips) {
            profileChips.innerHTML = profile.metadataChips
                .map(chip => `<span class="profile-chip">${chip}</span>`)
                .join('');
        }

        // Profile metrics (3 stats below chips)
        const profileMetrics = document.getElementById('profile-metrics');
        if (profileMetrics && profile.heroMetrics) {
            profileMetrics.innerHTML = profile.heroMetrics.map(metric => `
                <div class="profile-metric">
                    <span class="profile-metric-value">${metric.value}</span>
                    <span class="profile-metric-label">${metric.label}</span>
                </div>
            `).join('');
        }

        // ABOUT SECTION
        const aboutHeadline = document.getElementById('about-headline');
        if (aboutHeadline) aboutHeadline.textContent = profile.aboutHeadline;

        const aboutParagraphs = document.getElementById('about-paragraphs');
        if (aboutParagraphs && profile.aboutParagraphs) {
            aboutParagraphs.innerHTML = profile.aboutParagraphs
                .map(p => `<p>${p}</p>`)
                .join('');
        }

        // CAPABILITIES GRID
        const capabilitiesGrid = document.getElementById('capabilities-grid');
        if (capabilitiesGrid && profile.capabilities) {
            capabilitiesGrid.innerHTML = profile.capabilities.map(cap => `
                <div class="capability-card">
                    <div class="capability-icon">${cap.icon}</div>
                    <h3 class="capability-title">${cap.title}</h3>
                    <p class="capability-description">${cap.description}</p>
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

        console.log('✅ Profile loaded');
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        showFallback();
    }
}


// ============================================================
// PROJECTS LOADER — Asymmetric grid with Ladder AI featured
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
                ? `<div class="project-metric">${project.keyMetric}</div>`
                : '';

            const featuredFlag = project.featured
                ? '<span class="featured-flag">⭐ FEATURED</span>'
                : '';

            return `
                <a href="${project.link}" class="project-card ${project.featured ? 'featured' : ''}">
                    ${featuredFlag}
                    <div class="project-thumbnail">
                        ${getProjectThumbnail(project)}
                    </div>
                    <div class="project-content">
                        ${project.category ? `<span class="project-category">${project.category}</span>` : ''}
                        <h3 class="project-title">${project.title}</h3>
                        <p class="project-description">${project.description}</p>
                        <div class="project-tags">
                            ${project.tags.slice(0, 3).map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                        </div>
                        ${metricLine}
                        <span class="project-cta">View Case Study →</span>
                    </div>
                </a>
            `;
        }).join('');

        console.log(`✅ Projects loaded (${projects.length} total)`);
    } catch (error) {
        console.error('❌ Error loading projects:', error);
    }
}

// Returns thumbnail image OR Ladder AI gradient placeholder
function getProjectThumbnail(project) {
    if (project.id === 'ladder-ai') {
        return `
            <div class="project-emoji-placeholder ladder-ai-gradient">
                <span class="placeholder-emoji">🤖</span>
                <span class="placeholder-label">Ladder AI</span>
            </div>
        `;
    }
    return `<img src="${project.thumbnail}" alt="${project.title}" loading="lazy">`;
}


// ============================================================
// TOOLS LOADER — Includes dark technical card
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

            // Action buttons OR internal note
            let actionsHtml = '';
            if (tool.githubUrl || tool.demoUrl) {
                actionsHtml = `
                    <div class="tool-actions">
                        ${tool.githubUrl ? `<a href="${tool.githubUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">GitHub</a>` : ''}
                        ${tool.demoUrl ? `<a href="${tool.demoUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Live Demo →</a>` : ''}
                    </div>
                `;
            } else if (tool.internalNote) {
                actionsHtml = `<p class="tool-internal-note">${tool.internalNote}</p>`;
            }

            // Code preview for dark cards
            const codePreviewHtml = tool.codePreview
                ? `<pre class="tool-code-preview">${tool.codePreview}</pre>`
                : '';

            return `
                <div class="tool-card ${isDark ? 'dark' : ''}">
                    <div class="tool-icon">${tool.icon}</div>
                    <h3 class="tool-name">${tool.name}</h3>
                    <p class="tool-description">${tool.description}</p>
                    <div class="tool-tags">
                        ${tool.technologies.map(tech => `<span class="tool-tag">${tech}</span>`).join('')}
                    </div>
                    <div class="tool-status">
                        <span class="${statusDotClass}" style="background-color: ${statusColors[tool.status] || statusColors.archived}"></span>
                        <span class="status-label">${statusLabel}</span>
                    </div>
                    ${actionsHtml}
                    ${codePreviewHtml}
                </div>
            `;
        }).join('');

        console.log(`✅ Tools loaded (${tools.length} total)`);
    } catch (error) {
        console.error('❌ Error loading tools:', error);
    }
}


// ============================================================
// EXPERIENCE LOADER — Timeline with current-role pulse
// ============================================================
async function loadExperience() {
    try {
        const response = await fetch('data/experience.json');
        const experience = await response.json();

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
                            ${role.title}
                        </h3>
                        <span class="timeline-date">${role.startDate} — ${role.endDate}</span>
                    </div>
                    <div class="timeline-company">
                        <strong>${role.company}</strong> · ${role.location}
                    </div>
                    <ul class="timeline-achievements">
                        ${role.achievements.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                    <div class="timeline-tags">
                        ${role.tags.map(tag => `<span class="timeline-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        console.log(`✅ Experience loaded (${experience.length} roles)`);
    } catch (error) {
        console.error('❌ Error loading experience:', error);
    }
}


// ============================================================
// NAVIGATION — Sticky shadow + mobile hamburger
// ============================================================
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            const isExpanded = navLinks.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isExpanded);
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Sticky nav shadow on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    console.log('✅ Navigation initialized');
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