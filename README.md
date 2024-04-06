# acquired-carve-outs

This is a web scraper that collects the "Carve Outs" from the aquired.fm podcast.

## Run

To install dependencies:

```bash
bun install
```

To run the web server:

```bash
bun run dev
```

To seed the data:

```bash
bun run seed.ts
```

To update the data:

```bash
bun run update.ts
```

The 2016/2017 predictions episode is formatted differently, to fix the data for this episode:

```bash
bun run fix.ts
```

This project was created using `bun init` in bun v1.1.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
