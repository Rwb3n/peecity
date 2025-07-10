---
id: recipe-docs-structure
title: "Recipe: Documentation Structure (Diátaxis)"
description: "Documentation organization recipe using Diátaxis framework with tutorials, how-to guides, reference, and explanation categories"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---

# Recipe: Documentation Structure with Diátaxis

> "Separate how-to from why." – Diátaxis

This recipe describes how to apply the [Diátaxis](https://diataxis.fr/) methodology to organise documentation for any project.

## 1. Overview

Diátaxis divides docs into four distinct purposes:

| Purpose | Question Answered | Folder |
|---------|------------------|--------|
| **Tutorials** | "Teach me" – progressive learning | `docs/tutorials/` |
| **How-To Guides** | "Show me" – problem-oriented steps | `docs/howto/` |
| **Reference** | "Tell me" – authoritative facts | `docs/reference/` |
| **Explanations** | "Explain" – background & reasoning | `docs/explanations/` |

Keeping these purposes distinct avoids documentation bloat and cognitive overload.

## 2. File Naming & Metadata

1. **Front-Matter**: Begin every markdown file with YAML:
   ```yaml
   ---
   id: unique-id
   title: "Human Readable Title"
   version: 1.0.0
   last_updated: "2025-07-09"
   category: reference # tutorials | howto | reference | explanations | cookbook | adr | archive
   ---
   ```
2. **ids** should be kebab-case and unique across docs.
3. **Titles** appear in the rendered page and indices.

## 3. Directory Conventions

```
docs/
  tutorials/
  howto/
  reference/
  explanations/
  adr/
  cookbook/
  archive/
```

* `adr/` holds Architecture Decision Records – immutable snapshots.
* `cookbook/` stores reusable code patterns.
* `archive/` stores historical or superseded docs.

## 4. Linting & CI

A Jest test (`tests/docs/docs_structure_test.js`) walks the docs tree to ensure:
* Files live in an allowed directory.
* YAML front-matter includes required keys.
* No duplicate titles.

Fail-fast culture keeps docs healthy.

## 5. Updating Documentation

1. Choose the correct category.
2. Write content.
3. Add/maintain front-matter.
4. Run `npm test` to ensure doc-lint passes.

## 6. Further Reading

* Diátaxis Methodology – https://diataxis.fr/
* Write the Docs – https://www.writethedocs.org/

---
*Use this recipe whenever spinning up a new repo or refactoring legacy docs.* 