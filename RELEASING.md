# Releasing

Releases publish from CI via [npm trusted publishing][tp]: GitHub Actions exchanges a short-lived
OIDC token with the registry, so there is no npm token stored on this repository.

## Cutting a release

1. Bump `version` in `package.json` on a branch, and merge it.
2. Create a GitHub Release tagged `v<version>` — for example `v3.1.0`.

`.github/workflows/publish.yaml` then lints, builds, tests, checks the tag matches `package.json`,
and publishes. Provenance is attached automatically.

## One-time bootstrap

Trusted publishing cannot make a package's *first* publish. npmjs.com only offers the trusted
publisher setting on a package that already exists, and npm has not yet added the pending-publisher
flow that PyPI has ([npm/cli#8544][issue]).

So the first version is published by hand, once:

```sh
npm login                    # interactive, on a maintainer's machine
npm ci
npm run build
npm publish                  # prepack rebuilds, so this is safe to run directly
```

Then configure the trusted publisher at
<https://www.npmjs.com/package/@smartsuite-foundry/twirp-ts/access>:

- Publisher: **GitHub Actions**
- Organization or user: `SmartSuiteFoundry`
- Repository: `twirp-ts`
- Workflow filename: `publish.yaml`

Every release after that runs through CI with no token. Prefer this to minting a CI token and
deleting it later — a token that never exists cannot leak.

[tp]: https://docs.npmjs.com/trusted-publishers
[issue]: https://github.com/npm/cli/issues/8544
