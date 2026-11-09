# FeeDesk Landing Page Images

This directory contains the production editorial photography for FeeDesk.
To adhere to the client's design rules, all photos must use a soft warm colour wash (tone curve tinted slightly toward `#FAF8F4` and `#14211F`), rounded corners (20px), and WebP format.

## Image Requirements & Source Attribution

| File Name | Placement | Recommended Dimensions | Max File Size | Recommended Free Source (Unsplash / Pexels) & Search Terms | License |
|---|---|---|---|---|---|
| `hero-parent.webp` | Hero Section (Right visual frame) | 1200 × 800 px (Hero), with 640 × 427 px mobile srcset | 120 KB | Search: *"Indian parent father smiling smartphone home calm morning"*, e.g. Unsplash by naveen-kumar or Dollar Gill | Free Unsplash / Pexels License |
| `classroom.webp` | "How it works" section (Right column) | 900 × 600 px | 80 KB | Search: *"Indian coaching classroom students studying notes library Jaipur"*, e.g. Unsplash by rajesh-rajput or Dollar Gill | Free Unsplash / Pexels License |
| `accounts-desk.webp` | Optional editorial visual / Accounts section | 800 × 550 px | 75 KB | Search: *"coaching reception accounts desk Indian accountant ledger calculator"* | Free Unsplash / Pexels License |

### Optimization Commands
When exporting final JPG/PNG from cameras/stocks to WebP:
```bash
# Export hero at 82% quality with progressive loading
cwebp -q 82 hero-parent.jpg -o hero-parent.webp
cwebp -q 80 -resize 640 427 hero-parent.jpg -o hero-parent-640.webp

# Export classroom photo
cwebp -q 80 classroom.jpg -o classroom.webp
```
