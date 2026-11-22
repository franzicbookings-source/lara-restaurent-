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

The countdown targets `data-opening` on `#countdown` in `index.html` (currently `2026-12-02T18:00:00+02:00`). Opening night is 2 December; the time (6pm South Africa time) is still to be confirmed. When the time passes, the countdown hides and the rotating line changes to "Now open."

## The swarm (intro)

`assets/js/swarm.js` runs a short intro, about 3 seconds from load. The emblem draws itself and pulses, then a flock of small gold butterflies bursts out of it, swoops across the screen and flies off the top, and the page rises in behind them.

Every flight path is worked out up front and handed to the browser as a Web Animation of transform and opacity, so the phone's compositor plays it on its own thread, like a video: nothing else the page is doing while it loads can make it stutter. Each butterfly is the emblem drawn once to a bitmap and split into two wings. The background film waits until the flock has gone. Desktop adds a gold-dust trail.

It plays on every load, except when the link points to a section (such as `#hiring`). Tapping, Esc, Enter or Space skips it. Tapping the logo replays it. With reduced motion turned on, it doesn't play.

## We're hiring: the invitation

After the main screen: "Oh, and one more thing… **We're hiring.**" (`assets/js/hiring.js`).

A cream envelope sits sealed with black wax pressed with the gold emblem. Tap the seal, or just wait a moment once it's on screen: the wax cracks in two with a few gold sparks, the flap swings open on its gold butterfly lining, a handful of tiny butterflies slip out, and the card rises from the envelope:

> **La Raza** requests the pleasure of **your company & your CV**, for one of four seats: Manager · Barman · Hostess · General Workers

- **Each role on the card** opens an email to the CV address with the role as the subject and a ready-made first line. Below the invitation: the one requirement line, an **RSVP by email** button and the address with a Copy button.
- **The pill** on the main screen (a little envelope that wiggles now and then) glides down to it. **Share link:** `https://la-raza-tau.vercel.app/#hiring` skips the intro and opens on the invitation.
- **Editing roles:** the links in `.inv-card__roles` in `index.html` (and "for one of four seats" if the number changes).
- **How it's built:** the card and the envelope pieces share one stacking context (lining 1, card 2, pocket 3, flap 4, seal 5), so the card can sit inside the envelope. Every movement is a Web Animation of transform, translate, scale or opacity, played by the compositor. Without JavaScript, or with reduced motion, the invitation is simply shown open.
- **Made for it:** `img/paper.png` (card grain) is generated noise, and `img/liner.svg` (the gold butterfly lining) is built from the emblem. The wax seal is an SVG symbol in the page with an irregular, hand-made edge.

## Structure

```
index.html                one-screen landing page: logo, headline, rotating line, countdown, sign-up, socials
design-system.html        logo, colour, type, components, video and voice guidelines
assets/
  css/tokens.css          design tokens: the system's source of truth
  css/site.css            landing page styles (components reused by the design system)
  css/design-system.css   design system page styles
  js/main.js              rotating line, countdown, waitlist form (no libraries)
  js/hiring.js            the We're hiring invitation
  js/swarm.js             the intro: a quick flock of gold butterflies
  fonts/                  Manrope (self-hosted, OFL)
  img/logo/               emblem / wordmark / lockup SVGs (gold + one colour), favicon
  img/photo/              video poster frames
  img/paper.png           card paper grain
  img/liner.svg           envelope lining (gold butterflies)
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
