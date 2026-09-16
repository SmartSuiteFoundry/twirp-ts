# Releasing

Versioning is driven by [semantic-release][sr] from [conventional commits][cc], as in the rest of the
SmartSuite estate. Nobody edits `version` in `package.json` by hand.

Publishing uses [npm trusted publishing][tp]: GitHub Actions exchanges a short-lived OIDC token with
the registry, so there is no npm token stored on this repository, and provenance is attached
automatically.

## Cutting a release

Merge to `main`. That is the whole process.

`.github/workflows/release.yaml` runs on every push to `main`, and semantic-release works out from
the commits since the last tag whether there is anything to release:

| Commit type | Effect |
| --- | --- |
| `fix:` | patch |
| `feat:` | minor |
| any type with `!` or a `BREAKING CHANGE:` footer | major |
| `chore:`, `ci:`, `docs:`, `refactor:`, `test:` | no release |

When there is a release it updates `CHANGELOG.md`, publishes to npm, creates the GitHub release and
tag, and commits the version bump back to `main` as `chore(release): x.y.z [skip ci]`.

**Merge, do not squash.** semantic-release reads the individual commits; squashing replaces them with
the pull request title, so a release either comes out wrong or does not happen at all.

## Why the repository is tagged from v3.0.0

semantic-release derives the previous version from git tags, not from the registry. 3.0.0 was
published by hand before this workflow existed, so `v3.0.0` was tagged retrospectively at the commit
that produced it. Without that tag semantic-release would have treated the next run as a first
release and tried to publish 1.0.0, below what is already on npm.

## One-time bootstrap, for the next package that needs it

Trusted publishing cannot make a package's *first* publish. npmjs.com only offers the trusted
publisher setting on a package that already exists, and npm has not yet added the pending-publisher
flow that PyPI has ([npm/cli#8544][issue]). So the first version goes out by hand:

```sh
npm login                    # interactive, on a maintainer's machine
npm ci
npm publish                  # prepack rebuilds, so this is safe to run directly
```

Then, at `https://www.npmjs.com/package/<name>/access`:

- Publisher: **GitHub Actions**
- Organization or user: `SmartSuiteFoundry`
- Repository: the repository
- Workflow filename: `release.yaml`

Prefer this to minting a CI token and deleting it later — a token that never exists cannot leak.

A version published that way carries no provenance attestation, because provenance requires OIDC from
CI. 3.0.0 has none; every release after it will.

[sr]: https://semantic-release.gitbook.io/semantic-release/
[cc]: https://www.conventionalcommits.org/
[tp]: https://docs.npmjs.com/trusted-publishers
[issue]: https://github.com/npm/cli/issues/8544
