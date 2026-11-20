# La Raza: Coming Soon

The coming soon landing page and design system for **La Raza**, a luxury restaurant and cocktail lounge opening in Newcastle.

- `index.html`: the landing page
- `design-system.html`: the design system (logo, colour, type, space, motion, components, pattern, film grade, voice)

The source of truth is the La Raza Logo Identity, the *La Raza Motion* reveal and the site build film.

## Run locally

It's a static site with no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening the file directly with `file://` also works, but the waitlist form needs a server.

## Deploy

Drag the folder onto Netlify, Vercel or any static host. `netlify.toml` sets cache headers (assets are cached for 7 days).

### Waitlist form

The form in `index.html` (`#waitlist-form`) is ready for two backends:

1. **Netlify Forms (default).** Deploy on Netlify and the form is detected automatically (`data-netlify="true"`). Sign-ups appear under *Site → Forms*. Turn on email notifications there.
2. **Formspree, or any endpoint that accepts form POSTs.** Set `data-endpoint="https://formspree.io/f/XXXXXXX"` on the form.

On any other host the form shows a friendly error that points people to Instagram, so no sign-up is silently lost.

## Structure

```
assets/
  css/tokens.css          design tokens (colour, type, space, motion): the system's source of truth
  css/site.css            landing page styles
  css/design-system.css   design system page styles
  js/main.js              intro, scroll choreography, cursor, form
  js/vendor/              GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13 (vendored, no CDN)
  fonts/                  Antonio, Manrope, Cormorant Garamond (self-hosted, OFL)
  img/logo/               emblem / wordmark / lockup SVGs (gold + mono), favicon
  img/photo/              brand photography, video posters
  video/                  hero loop 1280×720 + portrait 720×1080
```

The logo was traced to vector from the identity artwork. The SVG paths are inlined into each page's sprite (`#sym-emblem`, `#sym-word`), so they can animate and scale without loss.

## The hero film

The hero loop was cut from the build film:

- Kept 8 shots: ring chandeliers, leaf sconce, textured wall, timber slats, crystal chandelier, ring close-up, floor craft, and the "Coming Soon" window.
- Each shot is slowed to about 2.1× with frame blending and given a gentle push-in, then joined with 0.6s dissolves and fades to and from black so it loops seamlessly.
- Shots showing contractor names, phone numbers and the burned-in watermark were removed.

Grade (FFmpeg):

```
hue=s=0.28,eq=contrast=1.12:gamma=0.9,
curves=r='0/0 0.3/0.13 0.65/0.6 1/0.99':g='0/0 0.3/0.095 0.65/0.48 1/0.9':b='0/0 0.3/0.06 0.65/0.33 1/0.73',
vignette=PI/4
```

## Accessibility & performance

- `prefers-reduced-motion` skips the intro, scroll scrubbing, the custom cursor and grain, and pauses the videos.
- Videos only play while on screen. The hero loop is about 1.5MB.
- Without JavaScript the full page still renders, with no animation.
- Every text colour pairing passes WCAG AA, and most pass AAA (see the design system).
