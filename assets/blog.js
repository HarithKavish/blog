/*
 * Behaviour for the blog. Every block below is optional: each one looks for
 * its own markup and returns quietly when the page doesn't have it, so the
 * index and the articles can share a single file.
 */
(function () {
    'use strict';

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

    /*
     * One query drives the whole discover page: the search box, the author
     * chips, the counts and the empty state. The author chips are just a
     * shortcut that writes into the same box, so there is never a second
     * piece of filter state to keep in sync with the first.
     */
    (function filter() {
        var input = document.querySelector('[data-filter]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
        if (!input || !cards.length) {
            return;
        }

        var count = document.querySelector('[data-count]');
        var empty = document.querySelector('[data-empty]');
        var chips = Array.prototype.slice.call(document.querySelectorAll('[data-author-filter]'));
        var resets = Array.prototype.slice.call(document.querySelectorAll('[data-clear-filter]'));
        // The feature repeats the newest blog, so it is hidden while filtering
        // rather than shown as a second copy of a card below it.
        var featured = document.querySelector('[data-feature-section]');
        var total = cards.filter(function (card) {
            return card.dataset.author;
        }).length;

        function apply() {
            var query = input.value.trim().toLowerCase();
            var shown = 0;

            cards.forEach(function (card) {
                var match = !query || card.dataset.search.indexOf(query) !== -1;
                card.classList.toggle('is-hidden', !match);
                if (match && card.dataset.author) {
                    shown++;
                }
            });

            chips.forEach(function (chip) {
                chip.classList.toggle(
                    'is-active',
                    query === chip.dataset.authorFilter.toLowerCase()
                );
            });

            if (featured) {
                featured.classList.toggle('is-hidden', Boolean(query));
            }
            if (count) {
                count.textContent = query
                    ? shown + ' of ' + total
                    : total + (total === 1 ? ' blog' : ' blogs');
            }
            if (empty) {
                empty.hidden = shown !== 0;
            }
            resets.forEach(function (reset) {
                reset.classList.toggle('is-hidden', !query);
            });
        }

        function set(value) {
            input.value = value;
            apply();
        }

        input.addEventListener('input', apply);

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                var handle = chip.dataset.authorFilter;
                // Selecting the active author again clears it, so a chip is a
                // toggle rather than a one-way trip.
                set(chip.classList.contains('is-active') ? '' : handle);
                document.getElementById('browse').scrollIntoView({ block: 'start' });
            });
        });

        resets.forEach(function (reset) {
            reset.addEventListener('click', function () {
                set('');
                input.focus();
            });
        });

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
