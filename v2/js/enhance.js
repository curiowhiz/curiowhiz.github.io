// ============================================================
// ENHANCE.JS - Version 2 accessibility refinements
// Shared by the homepage and the case-study pages. It changes how existing
// content is exposed to assistive technology; it never adds or removes any
// visible text.
// ============================================================

(function () {
    // A pictograph or emoji, optionally followed by a space (for example the
    // chart emoji at the start of a button label).
    const LEADING_EMOJI = /^([←-⇿⌀-⏿☀-➿⬀-⯿\u{1F000}-\u{1FAFF}][️‍]*\s*)/u;
    const ONLY_EMOJI = /^[\s←-⇿⌀-⏿☀-➿⬀-⯿\u{1F000}-\u{1FAFF}️‍]+$/u;

    // 1. Decorative emoji are not read aloud.
    document.querySelectorAll('.summary-card-icon').forEach(icon => {
        if (ONLY_EMOJI.test(icon.textContent)) icon.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('.btn, .contact-link').forEach(control => {
        const first = control.firstChild;
        if (!first || first.nodeType !== Node.TEXT_NODE) return;
        const match = first.textContent.trimStart().match(LEADING_EMOJI);
        if (!match || !/[^\u0000-ÿ]/.test(match[1].trim())) return;
        // "📊 View Full Analysis" becomes <span aria-hidden>📊</span> View Full Analysis
        const lead = first.textContent.length - first.textContent.trimStart().length;
        const rest = first.textContent.slice(lead + match[1].length);
        const span = document.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        span.textContent = match[1];
        first.textContent = rest;
        control.insertBefore(span, first);
    });

    // 2. Links that open a new tab say so, to screen readers only.
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        if (link.querySelector('.sr-only')) return;
        const note = document.createElement('span');
        note.className = 'sr-only';
        note.textContent = ' (opens in a new tab)';
        link.appendChild(note);
    });

    // 3. Accordions: each button names the panel it controls. (The panels are
    // taken out of the accessibility tree while closed by the stylesheet.)
    document.querySelectorAll('.accordion-item').forEach((item, index) => {
        const button = item.querySelector('.accordion-header');
        const panel = item.querySelector('.accordion-content');
        if (!button || !panel) return;
        const id = panel.id || `accordion-panel-${index + 1}`;
        panel.id = id;
        button.setAttribute('aria-controls', id);
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', button.id || (button.id = `accordion-button-${index + 1}`));
    });

    // 4. Heading outline: the summary cards sit directly under the page title,
    // so they are second-level headings, not third.
    const main = document.querySelector('main');
    if (main) {
        const headings = [...main.querySelectorAll('h1, h2, h3')];
        const firstH2 = headings.findIndex(h => h.tagName === 'H2');
        const firstH1 = headings.findIndex(h => h.tagName === 'H1');
        headings.forEach((h, i) => {
            const beforeAnyH2 = firstH2 === -1 || i < firstH2;
            if (h.tagName === 'H3' && firstH1 !== -1 && i > firstH1 && beforeAnyH2) {
                h.setAttribute('aria-level', '2');
            }
        });
    }
})();
