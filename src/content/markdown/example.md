---
title: Getting Started
description: A quick tour of how presentations are organized and written in this project.
date: 2026-07-01
order: 1
---

Welcome to the first deck in this collection. This page exists mostly to exercise the
markdown pipeline — headings, lists, code, and quotes — so we can be confident the
typography styles look right before adding real content.

## Why this project exists

This site collects slide decks and write-ups in one place, each described by a small
markdown file with frontmatter for metadata like title, date, and ordering.

## What to check

- Headings render with sensible size and spacing
- Lists (like this one) are indented and bulleted correctly
- Inline `code` and fenced code blocks are legible
- Blockquotes are visually distinct from body text

Here's a tiny snippet showing the shape of a collection entry:

```ts
const presentations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/markdown' }),
});
```

> Good typography is invisible until it's missing — then it's all you notice.
