# RING DIVE — isolated review build

Production `https://hot-potato-play.onrender.com` must remain on master until the owner accepts this build. Only `hot-potato/` changes are in scope.

## Physics provenance
Original Library artifact `HOT_POTATO_playable.html`, created 2026-10-29 21:27 UTC: `vy=-255`, `vy+=625*dt`, `speed=130+min(passed*2.5,95)`. These constants are restored. Simulation uses 120 fixed steps/second. Prototype 60Hz numerical integration differs by approximately one pixel at the apex; coefficients are unchanged.

## Implemented
- Independently generated transparent character and logo, five clean environment panoramas, transparent scenery sprite atlas. No concept-image crops. Asset prompts: premium 3D winged brown potato, red sneakers, large eyes/open mouth/tongue; gold/cyan RING DIVE logo; separate sky/forest/crystal/volcano/space environment panoramas without characters/rings/UI; five isolated corresponding environment props. Generated using built-in image generation; WebP assets in `assets/`.
- Layered scrolling and mirrored panorama continuity, foreground props, ambient motes, crossfades starting three rings before boundaries.
- Horizontal perspective rings: separately rendered back/front halves, relative swept collisions, downward-only scoring, mandatory sequence, PERFECT chain, multiplier.
- 1–15 sky, 16–35 forest, 36–60 crystal, 61–90 volcano, 91+ space. Moving late-world rings. Endless course extension, finite minimum opening size for fairness.
- Tap/pointer and keyboard controls; pause/resume, visibility auto-pause, restart, local best rings/score.
- World test lab and legal input replay pilot; test/demo results never write records.
- Each course uses a deterministic legal witness flight; candidate ring approaches are collision checked before acceptance. Runtime collision checks remain enabled for demo.

## Automated validation
Run `node --test hot-potato/tests/physics.test.mjs` (17 passing tests).
Includes gravity/impulse, downward/upward crossing, both rims/high-speed sweep, ordinary/perfect pass, miss, exact world boundaries, transition interpolation, multipliers, 5 seeds × 250 rings, 500-ring endless extension, identical 60/120Hz simulation, test entry to all five worlds, no-input failure.

## Browser QA
Desktop Chrome and embedded 390×844 / 320×568 portrait viewports checked. Menus, world test selector, crystal replay and PERFECT UI inspected. These are desktop browser viewport checks, not physical iOS/Android device or real 120Hz screen measurements.

## Review limits
This is a 2.5D sprite game, not a real-time 3D scene. The character uses four sprite poses (happy, raised wings, downward flap with closed eyes, startled fall), with animated tilt/squash. It is frame animation rather than a skeletal 3D rig. The panorama crossfade and foreground parallax are implemented; the scenery itself is rendered imagery. A physical-phone performance/touch check and owner acceptance are required before replacing production. No advertising, payments, server leaderboard or app-store packaging is included in this browser scope.
