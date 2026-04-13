# Academic Homepage

A clean, modern personal academic homepage for GitHub Pages.

## Quick Start

### Local Preview

Open `index.html` directly in your browser, or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

### Deploy to GitHub Pages

1. Create a GitHub repository named `<your-username>.github.io`
2. Push all files to the `main` branch
3. Go to **Settings → Pages → Source**, select `main` branch
4. Your site will be live at `https://<your-username>.github.io`

## Customization

### Replace Placeholder Content

Edit `index.html` and replace all `[bracketed placeholders]` with your actual information:

- Name, email, affiliation
- Research interests and descriptions
- Publication details
- Education history
- Skills, awards
- Social links (Google Scholar, ORCID, ResearchGate, GitHub, LinkedIn)

### Add Your Photo

Replace the avatar placeholder in the Hero section with:

```html
<div class="hero-image">
  <div class="avatar-placeholder">
    <img src="images/avatar.jpg" alt="Your Name">
  </div>
</div>
```

Put your photo in the `images/` folder.

### Add Your CV

Place your CV PDF in the root directory and update the link:

```html
<a href="CV.pdf" class="btn btn-outline" target="_blank">
```

## File Structure

```
academic-homepage/
├── index.html          # Main page
├── css/
│   └── style.css       # All styles (light/dark theme)
├── js/
│   └── main.js         # Theme toggle, nav, animations
├── images/             # Your photos and assets
└── README.md
```

## Features

- Responsive design (mobile-friendly)
- Dark / Light mode with localStorage persistence
- Smooth scroll navigation with active section highlight
- Scroll-reveal animations
- Academic icons (Google Scholar, ORCID, ResearchGate)
- Publication list with badges
- Education timeline
- News section

## License

MIT
