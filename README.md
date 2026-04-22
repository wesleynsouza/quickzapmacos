# QuickZap

Open WhatsApp instantly from any phone number format — right from your desktop.

## Features

- Accepts any phone number format: `+5563992532700`, `+55 63 99253-2700`, `(63) 9 9253-2700`, etc.
- Strips non-digit characters automatically
- Opens WhatsApp desktop directly (no browser required)
- Global shortcut `⌘ Shift W` (macOS) / `Ctrl Shift W` (Windows)
- Auto-detects phone numbers copied to clipboard and asks before pasting

## Getting started

```bash
npm install
npm start
```

## Build

```bash
# macOS (DMG + ZIP)
npm run build:mac

# Windows (NSIS installer + portable)
npm run build:win

# Both platforms
npm run build:all
```

Output goes to `dist/`.

## Assets

Place icons in `assets/` before building:

| File | Usage |
|------|-------|
| `icon.icns` | macOS app icon |
| `icon.ico` | Windows app icon |
| `icon.png` | 512×512 source (optional) |

## Requirements

- Node.js 18+
- npm 9+
