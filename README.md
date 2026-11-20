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

The form in `index.html` (`#waitlist-form`) is front end only for now (phase one).

- **No backend yet:** with `data-endpoint=""` the form checks the email and shows "Sign-ups open very soon". Nothing is sent or stored.
- **Phase two:** set `data-endpoint` on the form to your backend URL. The form POSTs its fields (`email`, plus the `company` honeypot, which bots fill and people don't) as `multipart/form-data` with `Accept: application/json`, and treats any 2xx response as success.

## Opening date

The countdown targets `data-opening` on `#countdown` in `index.html` (currently `2026-12-01T18:00:00+02:00`). Set it to the exact opening night once it's confirmed. When the time passes, the countdown hides and the rotating line changes to "Now open."

## The swarm (intro)

`assets/js/swarm.js` runs the intro, which takes about 6.5 seconds:

1. **Birth:** the drawn emblem pulses and releases about 50 tiny gold butterflies, each the emblem split into two flapping wings.
2. **Flight:** each butterfly flies its own curved 3D path, banking and circling in a vortex, with a gold-dust trail drawn on a canvas.
3. **Formation:** they land in the shape of the La Raza butterfly.
4. **Shimmer:** a wave of light runs out from the centre. Each butterfly lifts toward you, flutters and throws off a ring of gold sparks.
5. **Take-off:** the big butterfly flaps twice and flies at the camera, and the page appears.

It plays on every page load. Tapping, Esc, Enter or Space skips it. Tapping the logo replays it. On desktop the formation tilts with the mouse; on phones it sways gently. The formation, depth and timing scale to the screen. With reduced motion turned on, it doesn't play.

## Structure

```
index.html                one-screen landing page: logo, headline, rotating line, countdown, sign-up, socials
design-system.html        logo, colour, type, components, video and voice guidelines
assets/
  css/tokens.css          design tokens: the system's source of truth
  css/site.css            landing page styles (components reused by the design system)
  css/design-system.css   design system page styles
  js/main.js              rotating line, countdown, waitlist form (no libraries)
  js/swarm.js             the intro: gold butterfly swarm → formation → shimmer → take-off
  fonts/                  Manrope (self-hosted, OFL)
  img/logo/               emblem / wordmark / lockup SVGs (gold + one colour), favicon
  img/photo/              video poster frames
  video/                  hero loop 1280×720 + portrait 720×1080
```

The logo was traced to vector from the identity artwork. Its paths are inlined in each page so the emblem can draw itself in on load.

## The hero film

The hero is a 7.5s loop cut from the build film:

- 11 shots at normal speed with hard cuts of about 0.7s: ring chandeliers, a worker on site, the leaf sconce, floor drilling, the crystal chandelier, drilling into a wall, timber slats, the team talking, the textured wall, wallpaper going down, and a ring close-up.
- Each shot gets a gentle push-in.
- Shots showing contractor names, phone numbers and the burned-in watermark were left out.

Grade (FFmpeg): a natural look with a little warmth.

```
eq=contrast=1.12:saturation=1.08:gamma=0.97,colorbalance=rs=.03:bs=-.03:rh=.04:bh=-.04,vignette=PI/5
```

## Accessibility & performance

- With reduced motion turned on, the logo appears without drawing in and the video holds on its poster frame.
- The page uses no JavaScript libraries, and each video is about 1.3MB.
- Soft white and gold both pass WCAG AAA contrast on black.
