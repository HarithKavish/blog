/*
 * Behaviour for the blog. Every block below is optional: each one looks for
 * its own markup and returns quietly when the page doesn't have it, so the
 * index and the articles can share a single file.
 */
(function () {
    'use strict';

    /* ------------------------------------------------------------ theme -- */

    /* The same key the main site and Nexus use, so a choice made on any of
       them carries across the whole ecosystem. */
    var THEME_KEY = 'harithkavish-theme';

    (function theme() {
        var button = document.querySelector('[data-theme-toggle]');
        if (!button) {
            return;
        }

        function apply(next, persist) {
            document.documentElement.dataset.theme = next;
            if (persist) {
                try {
                    localStorage.setItem(THEME_KEY, next);
                } catch (error) {
                    // Storage is blocked, so the choice lasts this page only.
                }
            }
            button.textContent = next === 'dark' ? 'Light mode' : 'Dark mode';
            button.setAttribute(
                'aria-label',
                next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }

        apply(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);

        button.addEventListener('click', function () {
            apply(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
        });
    })();

    /* -------------------------------------------------------------- nav -- */

    (function nav() {
        var toggle = document.querySelector('[data-nav-toggle]');
        var menu = document.getElementById('primary-nav');
        if (!toggle || !menu) {
            return;
        }

        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('is-open');
            toggle.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
        });
    })();

    /* ------------------------------------------------------------- year -- */

    document.querySelectorAll('[data-year]').forEach(function (node) {
        node.textContent = String(new Date().getFullYear());
    });

    /* -------------------------------------------------------------- toc -- */

    /*
     * The contents rail is derived from the headings rather than written by
     * hand, so an article can gain or lose a section without anyone having to
     * remember to update a second list.
     */
    (function contents() {
        var body = document.querySelector('[data-article-body]');
        var list = document.querySelector('[data-toc]');
        if (!body || !list) {
            return;
        }

        // Direct children only: a heading nested inside a card or panel titles
        // that component, not a section of the article.
        var headings = Array.prototype.slice.call(
            body.querySelectorAll(':scope > h2, :scope > h3')
        );
        if (!headings.length) {
            var rail = list.closest('.toc');
            if (rail) {
                rail.hidden = true;
            }
            return;
        }

        var used = Object.create(null);

        function slug(text) {
            var base = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-') || 'section';

            // Two sections can legitimately share a title; keep the ids unique
            // so the rail always lands on the right one.
            used[base] = (used[base] || 0) + 1;
            return used[base] > 1 ? base + '-' + used[base] : base;
        }

        var links = headings.map(function (heading) {
            if (!heading.id) {
                heading.id = slug(heading.textContent);
            }

            var item = document.createElement('li');
            item.className =
                'toc__item toc__item--' + (heading.tagName === 'H2' ? 'top' : 'sub');

            var link = document.createElement('a');
            link.className = 'toc__link';
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;

            item.appendChild(link);
            list.appendChild(item);
            return link;
        });

        // Stated in the masthead, counted from the article itself so the two
        // can never disagree.
        var sections = headings.filter(function (heading) {
            return heading.tagName === 'H2';
        }).length;

        document.querySelectorAll('[data-section-count]').forEach(function (node) {
            node.textContent = sections + (sections === 1 ? ' section' : ' sections');
        });

        var active = null;

        function highlight() {
            // The heading nearest the top of the viewport without having
            // scrolled past it — the section the reader is actually in.
            var index = 0;
            for (var i = 0; i < headings.length; i++) {
                if (headings[i].getBoundingClientRect().top > 140) {
                    break;
                }
                index = i;
            }

            var next = links[index];
            if (next === active) {
                return;
            }
            if (active) {
                active.classList.remove('is-active');
                active.removeAttribute('aria-current');
            }
            next.classList.add('is-active');
            next.setAttribute('aria-current', 'true');
            active = next;
        }

        onScroll(highlight);
        highlight();
    })();

    /* --------------------------------------------------------- progress -- */

    (function progress() {
        var bar = document.querySelector('[data-progress]');
        var article = document.querySelector('[data-article-body]');
        if (!bar || !article) {
            return;
        }

        function update() {
            var start = article.offsetTop;
            // The article is finished once its last line clears the viewport,
            // not when the footer does.
            var distance = article.offsetHeight - (window.innerHeight - start);
            var ratio = distance > 0 ? (window.scrollY - start) / distance : 1;
            bar.style.width = Math.min(100, Math.max(0, ratio * 100)).toFixed(2) + '%';
        }

        onScroll(update);
        window.addEventListener('resize', update);
        update();
    })();

    /* ----------------------------------------------------------- filter -- */

    (function filter() {
        var input = document.querySelector('[data-filter]');
        var items = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
        if (!input || !items.length) {
            return;
        }

        var count = document.querySelector('[data-count]');
        var empty = document.querySelector('[data-empty]');

        function apply() {
            var query = input.value.trim().toLowerCase();
            var shown = 0;

            items.forEach(function (item) {
                var match = !query || item.dataset.search.indexOf(query) !== -1;
                item.classList.toggle('is-hidden', !match);
                if (match) {
                    shown++;
                }
            });

            if (count) {
                count.textContent = shown === items.length
                    ? items.length + (items.length === 1 ? ' article' : ' articles')
                    : shown + ' of ' + items.length;
            }
            if (empty) {
                empty.hidden = shown !== 0;
            }
        }

        input.addEventListener('input', apply);
        apply();
    })();

    /* ------------------------------------------------------------ utils -- */

    /* One rAF-throttled scroll listener per caller, so the rail and the
       progress bar never read layout more than once a frame. */
    function onScroll(handler) {
        var queued = false;

        window.addEventListener(
            'scroll',
            function () {
                if (queued) {
                    return;
                }
                queued = true;
                requestAnimationFrame(function () {
                    queued = false;
                    handler();
                });
            },
            { passive: true }
        );
    }
})();
