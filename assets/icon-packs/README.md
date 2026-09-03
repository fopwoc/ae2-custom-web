# Bundled icon packs

`gtnh-2.9.0-beta-2-default.tar.gz` is the stock icon pack embedded in the container image. It was exported from GTNH 2.9.0 beta 2 without a custom resource pack.

This initial pack contains item entries. The terminal resolves fluids through matching rendered cells when using it; packs created by the current exporter also contain first-class fluid texture entries keyed by Forge fluid registry ID.

The archive contains an `ae2-icons/v1` manifest and its content-addressed PNG tree:

- generated: 2026-08-31T11:30:22.766310Z
- manifest entries: 55,246
- failed renders: 0
- rendered size: 64 × 64 pixels
- mod-list SHA-256: `f27432947afe179d989d2d00a1bde9883fab18c2276fbe7e8726f5084b8b970c`

The archive is used instead of committing roughly 49,000 individual files. Its checksum is recorded beside it and verified in CI.

This is a generated rendering of third-party game and mod resources. It is not covered by the repository's WTFNMFPL license; see `THIRD_PARTY.md`.

```bash
tar -czf assets.tar.gz manifest.json icons && sha256sum assets.tar.gz > assets.tar.gz.sha256
```
