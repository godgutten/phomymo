# Phomymo

A free, browser-based label designer for Phomemo thermal printers. No drivers needed - connects via Bluetooth or USB.

**Try it now: https://phomymo.affordablemagic.net**

<p>
  <img src="screenshot.png" alt="Phomymo Label Designer" width="600" />
  <img src="screenshot-mobile.png" alt="Mobile UI" width="200" />
</p>

## Quick Start

1. Open https://phomymo.affordablemagic.net in Chrome (or any Chromium-based browser)
2. Click **Connect** to pair with your printer via Bluetooth (or **USB** for PM-241)
3. Design your label and click **Print**

To run locally (Web Bluetooth requires HTTPS or localhost):

```bash
cd src/web
python3 -m http.server 8080
# Open http://localhost:8080 in Chrome
```

**Requires:** Chrome, Edge, or another Chromium-based browser. Web Bluetooth is not available in Firefox or Safari. Android Chrome is supported with full touch UI; iOS is not supported. PM-241 printers require USB (WebUSB).

## Features

**Design Elements** - Text (multiple fonts including local system fonts, sizes, styles, alignment, background colors), images with scale/aspect lock, barcodes (Code128, EAN-13, UPC-A, Code39), QR codes, and shapes (rectangle, ellipse, triangle, line) with solid, dithered grayscale, and stroke fills.

**Editing** - Drag to move, corner/edge resize handles, rotation. Multi-select (Shift+click), grouping (Ctrl/Cmd+G), undo/redo, keyboard nudge, layer ordering, clipboard image paste (Ctrl/Cmd+V).

**Label Sizes** - Preset sizes for each printer type, round labels, custom dimensions. Auto-switches based on connected printer. Multi-label rolls with clone or individual zone modes.

**Templates & Batch Printing** - Variable fields with `{{FieldName}}` syntax, CSV import, preview grid, and batch printing with progress tracking.

**Instant Expressions** - Dynamic values at print time using `[[expression]]` syntax: `[[date]]`, `[[time]]`, `[[datetime]]`, or custom formats like `[[date|MM/DD/YYYY]]`. Works in text, barcodes, and QR codes.

**Print Preview** - Toggle dither preview to see exact thermal print output before printing.

**Export** - Save/load designs to browser storage, export/import as JSON, export to PDF or PNG.

**Mobile** - Full-featured touch UI with pinch-to-zoom, two-finger pan, slide-up property panels, and complete feature parity with desktop.

**Printer Status** - Live battery level, paper status, firmware version, and serial number with auto-query on connect.

**Cloud Templates** *(optional)* - Sign in with an email and password to save designs to your account and reach them from any device. Off by default; see below.

## Cloud Templates

Phomymo works entirely offline, saving designs to browser storage. If you want accounts and cross-device templates, point it at a [Supabase](https://supabase.com) project — the site stays static, so there is still no server to run.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor -> New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `designs` table and the Row Level Security policies that keep each user's designs private.
3. Open **Project Settings -> API** and copy the **Project URL** and the **anon public** key.
4. Paste both into `src/web/supabase-config.js`:

   ```js
   export const SUPABASE_URL = 'https://yourproject.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGci...';
   ```

5. Reload the app. A **Sign in** button appears in the header.

Both values are safe to commit — the anon key is a public client key, and Row Level Security is what actually protects the data. Leave them empty and the app behaves exactly as it did before: no sign-in button, designs in browser storage only.

Once signed in, saves and loads go to your account instead of browser storage. Designs already saved in the browser stay put, and the account dialog offers a one-click upload for them (existing cloud designs with the same name are skipped rather than overwritten).

By default Supabase emails a confirmation link on sign-up. To skip that while testing, turn off **Confirm email** under **Authentication -> Sign In / Providers -> Email**.

## Print Alignment

Phomemo printers place a label within the full width of the print head, and where the label physically sits under that head varies by model and by how the roll is loaded. If prints land consistently off to one side, set **Horizontal Offset** in Print Settings rather than nudging every element in your design.

The value is in printer dots — 8 dots = 1 mm — and positive moves the print right. It is saved with your other print settings and applies to single prints, batch prints, and the print preview.

It defaults to **38 dots (≈4.75 mm)**, which centres correctly on the setup this fork was tuned against. The right value depends on your printer and how the roll is loaded, so if your prints land off-centre, adjust it once and it will stick.

## Supported Printers

| Model | Width | Notes |
|-------|-------|-------|
| P12 / P12 Pro | 12mm | Continuous tape label maker |
| A30 | 12-15mm | Continuous tape, faster print speed |
| M02 / M02S / M02X | 48mm (384px) | Mini pocket printers, continuous paper |
| M02 Pro | 53mm (626px) | 300 DPI high-resolution mini printer |
| M03 | 53mm (432px) | Mini sticker printer |
| T02 | 48mm (384px) | Mini sticker printer |
| M04S / M04AS | 53/80/110mm | 300 DPI multi-width printer (select paper size in settings) |
| M110 / M120 | 48mm (384px) | Narrow label makers |
| M200 / M250 | 75mm (608px) | Mid-size labels |
| M220 / M221 | 72mm (576px) | Wide labels |
| M260 | 72mm (576px) | Wide label maker |
| D30 / D35 / D50 / D110 | 12-15mm | Smart mini label makers (rotated protocol) |
| Q30 / Q30S | 12-15mm | Similar to D30 |
| PM-241 / PM-241-BT | 102mm (4") | Shipping labels, USB only (TSPL protocol) |

The app auto-detects your printer model from the Bluetooth device name and configures the correct protocol, print width, DPI, and label presets. If auto-detection fails, you can manually select your model in Print Settings, or the app will prompt you on first connection.

D-series printers print labels rotated 90° - the app handles this automatically. PM-241 printers use Bluetooth Classic (not BLE), so use the USB connection instead.

## Custom Printer Definitions

You can add, edit, and override printer definitions through **Print Settings > Manage Printers**. This lets you:

- **Add new printers** not yet in the built-in list with your own protocol, width, DPI, and alignment settings
- **Override built-in printers** to adjust settings like alignment or width for your specific hardware
- **Set auto-detect patterns** so your custom definitions are recognized automatically by BLE device name

Custom definitions are saved in your browser's localStorage and take priority over built-ins. Modified built-in printers can be reset to defaults at any time.

Built-in definitions are loaded from `printers.json` at startup.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + D` | Duplicate selected |
| `Ctrl/Cmd + G` | Group selected |
| `Ctrl/Cmd + Shift + G` | Ungroup |
| `Ctrl/Cmd + V` | Paste image from clipboard |
| `Delete / Backspace` | Delete selected |
| `Arrow keys` | Nudge by 1px |
| `Shift + Arrow keys` | Nudge by 10px |
| `Shift + Click` | Add to selection |

## Connection Tips

When the Bluetooth device picker appears, select the device showing a **signal strength indicator**. Devices listed without signal strength may be cached/ghost entries that won't connect properly.

## Project Structure

```
phomymo/
├── src/
│   └── web/
│       ├── index.html     # Main UI
│       ├── app.js         # Application logic
│       ├── canvas.js      # Canvas rendering & dithering
│       ├── elements.js    # Element management
│       ├── handles.js     # Selection handles
│       ├── storage.js     # localStorage persistence
│       ├── cloud-storage.js    # Supabase design persistence
│       ├── template-store.js   # Routes saves to cloud or localStorage
│       ├── auth.js             # Email/password sign-in
│       ├── supabase-config.js  # Supabase project URL + anon key
│       ├── templates.js   # Variable substitution & CSV
│       ├── ble.js         # Web Bluetooth transport
│       ├── usb.js         # WebUSB transport
│       ├── printer.js     # Print protocols
│       ├── printers.json  # Built-in printer definitions
│       ├── constants.js   # Shared constants
│       └── utils/
│           ├── bindings.js   # Event binding helpers
│           ├── errors.js     # Error handling
│           └── validation.js # Input validation
├── supabase/
│   └── schema.sql     # Cloud templates table + RLS policies
└── README.md
```

## Acknowledgments

Protocol research and inspiration:

- [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools) - CUPS driver with reverse-engineered protocol
- [yaddran/thermal-print](https://github.com/yaddran/thermal-print) - Printer status query commands
- [ooki1jp](https://github.com/vivier/phomemo-tools/issues/27#issuecomment-3850158579) - M04AS/M04S protocol reverse-engineering

Libraries: [JsBarcode](https://github.com/lindell/JsBarcode), [QRCode.js](https://github.com/davidshimjs/qrcodejs), [jsPDF](https://github.com/parallax/jsPDF)

## Support the Project

If Phomymo is useful to you, consider [making a donation](https://donate.stripe.com/7sY7sMese0182tXgn8eAg00) to support ongoing development.

## License

MIT License - see LICENSE file for details.
