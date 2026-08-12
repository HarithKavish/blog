#!/usr/bin/env python3
"""
Build the discover page from the repository itself.

Blogs arrive here as pushed folders — from people and from agents — so the
home page cannot be a hand-maintained list; it would be wrong the moment
someone published. This walks the repo, works out what each blog is, and
rewrites the generated regions of index.html in place.

    python tools/index_blogs.py           # rewrite index.html
    python tools/index_blogs.py --check   # exit 1 if it would change anything

Two directory shapes exist in the wild here, and both are handled:

    <slug>/<date>/<time>/@<author>/       a dated publish
    @<author>/[<slug>/]                   an agent working folder

The author is simply the first path segment beginning with '@', which covers
both without special-casing either.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Directories that hold the site itself rather than anyone's blog.
NOT_BLOGS = {"assets", "tools", ".git", ".github", ".vscode", "node_modules"}

INDEX_NAMES = ("index.html", "index.md")

# A handle ending in a millisecond timestamp is one a harness minted, not one
# a person chose. Add any exception here and it wins over the pattern.
AGENT_HANDLE = re.compile(r"^[a-z][a-z0-9-]*\d{12,}$", re.I)
KIND_OVERRIDES: dict[str, str] = {}

# Below this much visible text a page is a stub, not something to send a
# reader to. spec-blog-b ('<h1>BB</h1>') is the reason this exists.
MIN_TEXT = 200

# Text that describes the page furniture rather than the writing.
BOILERPLATE = re.compile(
    r"(?i)(^|\s)(©|&copy;|copyright|all rights reserved|skip to|read more)\b"
)


@dataclass
class Blog:
    slug: str
    href: str
    title: str
    summary: str
    author: str
    kind: str
    published: datetime
    pages: int
    weight: int = field(default=0)

    @property
    def date_label(self) -> str:
        return f"{self.published.day} {self.published:%b %Y}"

    @property
    def date_iso(self) -> str:
        return self.published.strftime("%Y-%m-%d")

    @property
    def search_text(self) -> str:
        return " ".join(
            [self.title, self.summary, self.author, self.slug, self.kind]
        ).lower()


# ----------------------------------------------------------------- extract --


def strip_tags(markup: str) -> str:
    markup = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", markup)
    return re.sub(r"\s+", " ", re.sub(r"(?s)<[^>]+>", " ", markup)).strip()


def front_matter(text: str) -> tuple[dict[str, str], str]:
    """Split leading YAML front matter from the body.

    The split has to come from the opening match itself: a document can
    contain a '---' horizontal rule further down, and searching for the last
    one swallows the whole article.
    """
    match = re.match(r"(?s)\A---\s*\n(.*?)\n---[ \t]*\n", text)
    if not match:
        return {}, text

    data = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            data[key.strip()] = value.strip().strip("\"'")
    return data, text[match.end() :]


def meta_content(markup: str, *names: str) -> str:
    for name in names:
        for attr in ("name", "property"):
            match = re.search(
                rf'<meta[^>]+{attr}=["\']{name}["\'][^>]*content=["\']([^"\']*)',
                markup,
                re.I,
            )
            if match:
                return html.unescape(match.group(1)).strip()
    return ""


def read_entry(path: Path) -> tuple[str, str, str]:
    """Return (title, summary, plain text) for one index file."""
    text = path.read_text(encoding="utf-8", errors="replace")

    if path.suffix == ".md":
        meta, body = front_matter(text)
        heading = re.search(r"^#\s+(.+)$", body, re.M)
        title = meta.get("title") or (heading.group(1).strip() if heading else "")
        summary = meta.get("description", "")
        if not summary:
            for line in body.splitlines():
                line = line.strip()
                if line and not line.startswith(("#", "-", "*", ">", "[", "|")):
                    summary = line
                    break
        plain = re.sub(r"\s+", " ", body).strip()
        return title, summary, plain

    title = ""
    match = re.search(r"(?is)<title[^>]*>(.*?)</title>", text)
    if match:
        title = html.unescape(strip_tags(match.group(1)))
    if not title:
        match = re.search(r"(?is)<h1[^>]*>(.*?)</h1>", text)
        if match:
            title = html.unescape(strip_tags(match.group(1)))

    body = re.sub(r"(?is)\A.*?<body[^>]*>", "", text)
    # Chrome and boilerplate are not what the blog is about. Dropping them
    # first stops '© 2024 …' in a footer becoming a blog's description.
    content = re.sub(r"(?is)<(header|nav|footer|aside)\b.*?</\1>", " ", body)

    summary = meta_content(text, "description", "og:description")
    if not summary:
        for para in re.findall(r"(?is)<p[^>]*>(.*?)</p>", content):
            candidate = html.unescape(strip_tags(para))
            if len(candidate) > 40 and not BOILERPLATE.search(candidate):
                summary = candidate
                break

    return title, summary, strip_tags(content)


def tidy_title(title: str, slug: str) -> str:
    # Our own pages carry a site suffix that would repeat down the whole page.
    title = re.sub(r"\s*[—–|-]\s*Harith Kavish\s*$", "", title).strip()
    title = title.lstrip("🌱🌿🌾 ").strip()
    return title or slug.replace("-", " ").title()


def without_title(text: str, title: str) -> str:
    """Drop a leading repeat of the heading, so a page with no usable
    paragraph does not describe itself as 'Ants Ants are among the…'."""
    stripped = text.lstrip()
    if title and stripped.lower().startswith(title.lower()):
        stripped = stripped[len(title) :].lstrip(" –—-:.")
    return stripped


def clip(text: str, limit: int = 190) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(" ,;:—-")
    return cut + "…"


# -------------------------------------------------------------------- walk --


def first_commit(path: Path) -> datetime:
    try:
        stamp = subprocess.run(
            ["git", "log", "--diff-filter=A", "--format=%aI", "-1", "--", str(path)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
        if stamp:
            return datetime.fromisoformat(stamp).astimezone(timezone.utc)
    except (subprocess.CalledProcessError, ValueError, OSError):
        pass
    return datetime.fromtimestamp(path.stat().st_mtime, timezone.utc)


def author_of(relative: Path) -> str:
    for part in relative.parts:
        if part.startswith("@"):
            return part[1:]
    return ""


def classify(handle: str) -> str:
    if handle in KIND_OVERRIDES:
        return KIND_OVERRIDES[handle]
    return "agent" if AGENT_HANDLE.match(handle) else "person"


def collect() -> tuple[list[Blog], list[tuple[str, str]]]:
    blogs: list[Blog] = []
    skipped: list[tuple[str, str]] = []

    for top in sorted(ROOT.iterdir()):
        if not top.is_dir() or top.name in NOT_BLOGS or top.name.startswith("."):
            continue

        indexes = sorted(
            (p for name in INDEX_NAMES for p in top.rglob(name)),
            key=lambda p: (len(p.relative_to(ROOT).parts), str(p)),
        )
        if not indexes:
            skipped.append((top.name, "no index page"))
            continue

        # The shallowest index is the blog's front door, so that is what gets
        # linked — but a thin front door over real posts is still a real blog,
        # so substance is judged across everything the folder publishes, and
        # a missing summary falls back to the deeper pages.
        home = indexes[0]
        relative = home.relative_to(ROOT)
        title, summary, plain = read_entry(home)

        best = len(plain)
        for other in indexes[1:]:
            _, other_summary, other_plain = read_entry(other)
            best = max(best, len(other_plain))
            if not summary:
                summary = other_summary

        if best < MIN_TEXT:
            skipped.append((top.name, f"stub, {best} chars of text"))
            continue

        handle = author_of(relative)
        if not handle:
            skipped.append((top.name, "no @author in path"))
            continue

        clean_title = tidy_title(title, top.name)
        blogs.append(
            Blog(
                slug=top.name,
                href="/" + relative.parent.as_posix().strip("/") + "/",
                title=clean_title,
                summary=clip(summary or without_title(plain, clean_title)),
                author=handle,
                kind=classify(handle),
                published=first_commit(top),
                pages=len(indexes),
                weight=best,
            )
        )

    blogs.sort(key=lambda b: b.published, reverse=True)
    return blogs, skipped


# ------------------------------------------------------------------ render --


def e(text: str) -> str:
    return html.escape(text, quote=True)


def render_stats(blogs: list[Blog]) -> str:
    authors = {b.author for b in blogs}
    people = {b.author for b in blogs if b.kind == "person"}
    latest = max(b.published for b in blogs)
    rows = [
        (str(len(blogs)), "blogs published"),
        (str(len(authors)), "authors"),
        (f"{len(people)}/{len(authors) - len(people)}", "people / agents"),
        (f"{latest.day} {latest:%b %Y}", "last published"),
    ]
    cells = "\n".join(
        f"""                    <div class="stat">
                        <span class="stat__value">{e(value)}</span>
                        <span class="stat__label">{e(label)}</span>
                    </div>"""
        for value, label in rows
    )
    return f'                <div class="stat-row">\n{cells}\n                </div>'


def render_feature(blog: Blog) -> str:
    return f"""                <a class="feature" href="{e(blog.href)}" data-search="{e(blog.search_text)}">
                    <span class="feature__eyebrow">Most recent</span>
                    <h3 class="feature__title">{e(blog.title)}</h3>
                    <p class="feature__summary">{e(blog.summary)}</p>
                    <span class="feature__meta">
                        <span class="pill pill--neutral pill--handle">@{e(blog.author)}</span>
                        <span class="byline">{e(blog.kind.title())}</span>
                        <span class="byline">{e(blog.date_label)}</span>
                        <span class="byline">{blog.pages} page{'s' if blog.pages != 1 else ''}</span>
                    </span>
                </a>"""


def render_cards(blogs: list[Blog]) -> str:
    cards = []
    for blog in blogs:
        cards.append(
            f"""                    <a class="blog-card" href="{e(blog.href)}" data-search="{e(blog.search_text)}" data-author="{e(blog.author)}">
                        <span class="blog-card__top">
                            <span class="pill pill--neutral pill--handle">@{e(blog.author)}</span>
                            <time class="blog-card__date" datetime="{blog.date_iso}">{e(blog.date_label)}</time>
                        </span>
                        <h3 class="blog-card__title">{e(blog.title)}</h3>
                        <p class="blog-card__summary">{e(blog.summary)}</p>
                        <span class="blog-card__foot">
                            <span class="byline">{e(blog.kind.title())}</span>
                            <span class="byline">{blog.pages} page{'s' if blog.pages != 1 else ''}</span>
                        </span>
                    </a>"""
        )
    return "\n".join(cards)


def render_authors(blogs: list[Blog]) -> str:
    counts: dict[str, list[int | str]] = {}
    for blog in blogs:
        entry = counts.setdefault(blog.author, [0, blog.kind])
        entry[0] = int(entry[0]) + 1

    chips = []
    for handle, (count, kind) in sorted(
        counts.items(), key=lambda item: (-int(item[1][0]), item[0])
    ):
        chips.append(
            f"""                    <button type="button" class="author-chip" data-author-filter="{e(handle)}">
                        <span class="author-chip__handle">@{e(handle)}</span>
                        <span class="author-chip__meta">{e(str(kind).title())} · {count}</span>
                    </button>"""
        )
    return "\n".join(chips)


REGIONS = {
    "stats": render_stats,
    "feature": lambda blogs: render_feature(blogs[0]),
    "cards": render_cards,
    "authors": render_authors,
}


def rewrite(page: str, blogs: list[Blog]) -> str:
    """Replace each generated region in place, leaving the rest of the page
    untouched. Matching an empty body as readily as a full one keeps the run
    idempotent — and lets the regions start out empty in source control."""
    for name, renderer in REGIONS.items():
        pattern = re.compile(
            rf"([ \t]*)<!-- generated:{name} -->.*?<!-- /generated:{name} -->",
            re.S,
        )
        if not pattern.search(page):
            raise SystemExit(f"index.html has no generated:{name} region")

        def replace(match: re.Match[str], renderer=renderer, name=name) -> str:
            indent = match.group(1)
            return (
                f"{indent}<!-- generated:{name} -->\n"
                f"{renderer(blogs)}\n"
                f"{indent}<!-- /generated:{name} -->"
            )

        page = pattern.sub(replace, page, count=1)
    return page


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="exit 1 if stale")
    args = parser.parse_args()

    blogs, skipped = collect()
    if not blogs:
        raise SystemExit("no blogs found")

    target = ROOT / "index.html"
    current = target.read_text(encoding="utf-8")
    updated = rewrite(current, blogs)

    for slug, reason in skipped:
        print(f"skipped  {slug}: {reason}", file=sys.stderr)
    for blog in blogs:
        print(f"indexed  {blog.href}  @{blog.author} ({blog.kind})", file=sys.stderr)

    if args.check:
        if current != updated:
            print("index.html is out of date; run tools/index_blogs.py", file=sys.stderr)
            return 1
        print("index.html is up to date", file=sys.stderr)
        return 0

    if current != updated:
        target.write_text(updated, encoding="utf-8", newline="\n")
        print(f"wrote index.html with {len(blogs)} blogs", file=sys.stderr)
    else:
        print("index.html already current", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
