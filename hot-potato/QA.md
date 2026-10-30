# RING DIVE — QA and implementation history

Production is `https://hot-potato-play.onrender.com`. The owner explicitly authorized the complete premium update, master merge and deployment to the existing service. Only `hot-potato/` changes are in scope. No new paid resources are authorized. The newest release notes below supersede historical implementation/approval descriptions.

## Latest update — centered flight, complete rig and dance arms — 2026-10-30

- Menu: larger running-man knee lifts, heel/toe swivel, syncopated eight-beat timing and independently pumping connected arms/rounded hands. Original 108 BPM music remains unchanged. Arms use the same shoulder/elbow/wrist anchors for drawing and flight collision bounds. Flight retains dangling connected legs and shoes. No body squash/stretch.
- Camera: screen-space horizontal center follows interpolated player position, including recoil. Actual horizontal recovery physics is unchanged. Background parallax .09 → .028; foreground .27 → .085; atmosphere slowed proportionately. Forward speed still increases 130 → 225 with ring progress; gravity 625, impulse −255 and fixed 120 Hz are unchanged.
- Collision now includes a conservative rigid envelope enclosing the body, wings, limbs, hands and shoes at all flight poses/rotations. Swept convex-hull contact and iterative position correction replace the runtime 18 px disc. Rounded rim tube includes visual width. Rebounds are nonfatal with restitution .28, friction .32 and angular contact leverage; damped upright recovery remains.
- Full-rig clearance is required before points; a center crossing alone is insufficient. Returning upward clears the pending entry. PERFECT uses the interpolated downward crossing location. Previous ring stays solid until behind the player.
- Rings are wider (half-widths 128/122/116/110/104, space minimum 96) and paths are regenerated against the full rig, including approach and exit validation. This deliberate geometry change makes room for the whole visible character. The legal witness input uses wider climb/dive arcs; player controls and flight forces are unchanged.
- Automated checks: `node --test hot-potato/tests/*.test.mjs`. 73 tests, including five seeds × 250 rings, 500-ring extension, all world transitions/jumps, 60/120 Hz identical simulation, whole-rig bounds, wing/shoe-only swept hits, 180 rotated contact projections, centered recoil, connected dance arm cycle, UI/results/retry, persistence and audio lifecycle with offline DOM/Canvas/audio doubles. The longer full-rig course requires a larger UI replay frame budget; no gameplay bypass is used.
- Visual check: 32 dance poses over the complete eight-beat phrase and eight rise/fall/tumble/recovery flight poses rendered with actual source assets using a local Canvas-to-SVG adapter; contact sheet inspected. This is not a browser/device test. Browser-local preview could not be opened due to the browser URL policy. Real iOS/Android hardware, silent switch, safe area and real 120 Hz displays have not been tested for this update. Production 2.1 was subsequently verified in cloud Chrome at the existing Render URL: DOM version 2.1, all artwork loaded, connected arm dance, Play, keyboard flap, pause, results, retry, settings, sound test and gesture-unlocked AudioContext `running`; crystal practice displayed the centered flight rig with hands/feet and the test-only label. Music UI reports enabled; no physical speaker/listening test is claimed. This production browser verification supersedes the local-preview limit for those desktop flows. Found and fixed a stale pause accessibility label after restarting, and refreshed the rebound-lab fixture for the larger hull in 2.1.1. Cloud-browser frame timing is not a mobile performance measurement.

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

## Rendering and device limits
This is a 2.5D Canvas sprite game. The rigid body, separate wings, connected legs and layered sneaker occlusion retain intrinsic asset proportions; no body squash/stretch is used. Panoramas, ring halves and atmosphere use layered parallax/crossfades. Physical iOS/Android audio, silent-switch, safe-area and 120 Hz display checks must be distinguished from automated simulation and offline checks. Historical notes below describe earlier iterations, not the current release's validation status.

## Rigid body and nonfatal rim contacts — 2026-10-30

All rim contacts are now nonfatal. They use swept contact detection, restitution 0.28, Coulomb friction 0.32, and unit-mass disc inertia I=1/2*m*r². Normal impulses change linear velocity; tangential impulses produce angular velocity. Air resistance slows rotation continuously. There is no prescribed full turn, fixed spin duration, or snapped angle. Recoil includes horizontal movement, with gentle automatic flight recovery towards the normal screen position. The contact body is a forgiving disc excluding decorative feathers/shoes; this is an arcade rigid-body approximation.

A contact gives no ring completion or points. A real downward crossing inside the opening is still required; touched rings cannot earn PERFECT. Missing a ring or falling out of the playfield still ends the game. A contact grants 0.6 seconds of recovery before a missed-ring verdict, so an outer-rim bounce cannot end the run in the collision tick. Direct head-on contacts can bounce backward without inventing rotation when no tangential impulse is present.

The potato body no longer uses any squash, stretch, nonuniform scaling, or forced sprite aspect ratio. New transparent assets body-happy/body-surprised/wing/shoe were generated with the built-in image generator from the approved character reference (same plump brown potato, expressive eyes/mouth/tongue, detached white feather wing and red sneaker). The body and each component retain their intrinsic aspect ratio. Wings pivot independently, feet swing, facial expressions blend and tilt eases; interpolated rendering includes horizontal recoil and free rotation.

Validation: `node --test hot-potato/tests/*.test.mjs` — 33 tests passed. Includes nonfatal contacts from different angles, direct rebound, friction-generated mirrored spins, speed-dependent rotation, collision energy nonincrease, no touch-only completion, real pass after rebound, missed touched rings, angular damping, and equal 60/120Hz outcomes. Previous five 250-ring replays and the 500-ring extension also pass. Browser menu/character proportions and the rim fixture were inspected before publication.

## Menu shuffle and original music — 2026-10-30
The title potato now performs a smooth running-man/shuffle-inspired side glide, alternating lifted shoes, leaning and independently pivoted wings. Its body retains uniform scale and proportions. The motion is computed analytically from beat time and is synchronized to an original 108 BPM instrumental loop when enabled.

The original eight-bar Fmaj7/Dm7/Bbmaj7/Cadd9 groove uses Web Audio synthesis: kick, clap, swung hats, shaker, syncopated bass, keys and a bell melody, with compression, short echo and fades. No third-party music, downloads or added dependencies. The visible music toggle starts audio from a user gesture, as required by mobile browser autoplay rules. Music stops on gameplay/lab entry or a hidden tab and resumes on returning to the title when enabled. Existing effect mute controls also mute music. All scheduled voices and the timer are stopped on exit; stale asynchronous resume calls are cancelled.

Validation: 38 automated tests passed, including score continuity, dance beat continuity, source/timer cleanup, delayed audio permission cancellation and hidden-tab timer jumps. Browser music toggle, menu-to-play/pause and portrait 390×844/320×568 layouts checked. No physical iOS audio/silent-switch test was available.

## Upright front-facing title dance — 2026-10-30
The menu uses a dedicated standing rig rather than posing the side-facing flight rig. New built-in image-generated transparent assets (`menu-body-front.webp`, `menu-shoe-left.webp`, `menu-shoe-right.webp`) preserve the happy speckled potato identity and show an upright frontal body plus a matched pair of sneakers whose toes point towards the camera. Reference/prompt: re-pose the approved potato upright/front-facing with the same brown material, expressive eyes and tongue; isolate body and front-view red sneakers, no side-facing shoes or background. Game flight sprites are unchanged.

The upright body stays within ±0.02 radians of vertical. Weight shifts by at most three design pixels, while alternating feet lift/slide with zero vertical speed on planting. At least one foot remains planted throughout the cycle. Wings follow the same 108 BPM beat clock. No body stretching or nonuniform scaling is used.

Validation: 40 tests pass, including planted-foot/torso bounds and smooth foot-plant continuity. Browser menu proportions, facing direction and music toggle checked before publishing. The original music and game physics remain unchanged.

## Premium menu, flight recovery and audio — 2026-10-30
Only `hot-potato/` is changed. The title hub has a staged upright dancer, gold primary action, separate score/world/help panels and a settings panel with nickname, independent music/effects sliders, sound check and a calmer menu option. Portrait 390×844 and 320×568 desktop iframe layouts were inspected; small panels scroll. Real finished flights populate a clearly labeled device-local top-20 table, with all-time/week filters and personal play/ring/perfect-chain statistics. No fake players or scores are seeded. Test/demo runs do not enter statistics or scores. Preferences persist locally and synchronize across tabs.

The flight sneaker source is mirrored horizontally so its toe points in the direction of travel. Rim angular impulses still use the same restitution/friction calculation. After 0.32 seconds without a new rim collision, a damped wing-controlled restoring torque settles to the nearest upright revolution. Position, tap impulse, gravity and course generation are unchanged. There is no snap, forced full turn or nonuniform scale.

Music and effects now share one AudioContext, unlocked directly by a menu/play/sound gesture. A supported mobile audio session is marked playback; the UI reports real resume success/failure. Effects have clearer gain, independent persistent volume and a tap sound. Silent settings, hidden tabs and rejected resumes are tested. Browser audio status changes to active on a real button click; sound check and effect/menu transitions were exercised. Physical iPhone speaker, hardware silent-mode and user-perceived volume remain unverified.

`leaderboard-server.mjs` and `leaderboard-client.mjs` prepare a separate durable global leaderboard, with exact simulation replay checks. It is NOT enabled (`API_URL=''`) and no paid resources were created. See `LEADERBOARD.md`. Existing Render production remains a static site. MevsMe was not present in accessible GitHub repositories; the user chose a new Ring Dive leaderboard.

Validation: 50 automated tests pass (`node --test --test-force-exit hot-potato/tests/*.test.mjs`), including inverted-angle settling, preserved impact onset, identical frame-rate outcomes, real/test record separation, profile persistence, shared audio context/failed unlock and server replay verification/duplicate rejection/CORS. Browser checks cover title, audio controls, a real no-input game over and saved scoreboard entry, settings and portrait layouts.

## Grounded menu shuffle — 2026-10-30
Replaced the small alternating shoe bob with an eight-beat running-man / heel-toe T-step phrase. The weighted foot slides backwards on the floor while the free knee lifts, recovers forwards and plants with zero vertical speed. Shoes have separate depth, uniform perspective scale, sole pivots, slight yaw/pitch and contact shadows. Short shaded legs connect hips to ankles; lifted shoes move in front of the torso. The rigid body shifts its weight and counter-swings its wings. Body scale and game physics are unchanged. This is a hand-animated 2.5D rig, not motion capture or a 3D skeletal character.

Music starts at the existing dance phrase position, avoiding an animation reset when sound is enabled. The calmer-menu setting still disables dance. No new services or payments.

Validation: 53 automated tests pass, including support-foot contact, opposite support/recovery trajectories, eight-beat continuity, foot-plant velocity and music-start phase continuity. The updated title rig and floor/contact shadows were inspected in the browser.

## Connected dance legs and hanging flight legs — 2026-10-30
The uploaded 4-second iPhone recording exposed a visual defect: the menu shoe images contained flat-topped brown leg stumps, which were composited on top of the torso. New built-in imagegen assets `assets/dance-shoe-left.webp`, `assets/dance-shoe-right.webp`, `assets/flight-shoe-clean.webp` contain only red/white sneakers with empty collars, no skin or brown cylinders. Prompt: preserve the approved sneakers/materials, remove every brown leg stump, provide frontal left/right and right-facing side shoe on transparent background. The generated atlas was cropped/downscaled into separate WebP sprites; the old assets remain available for history.

Both dance legs now originate inside the rotated body and are drawn behind it. Each rounded ankle endpoint is transformed with the exact same sole pivot/perspective as its shoe, so its connection follows the shuffle. Bare-leg endpoints can no longer be composited over the torso. Flight uses two connected hanging legs below the body with gentle velocity-dependent sway and right-facing shoes; the nearer foot is drawn after the torso. Game physics and collision radii are unchanged.

Validation: 53 tests pass and JS syntax/diff checks pass. Twelve local character poses were rendered from the actual drawing functions using an offline Canvas-to-SVG adapter and inspected for leg/shoe connections, including shuffle and ascending/descending flight. This is local visual inspection, not browser/device QA. Cloud browser preview was blocked by automatic approval review because its review model was at capacity; no alternate browser/network workaround was attempted. New hosting/payment services were not added.

## Fill the dancer's shoe collars — 2026-10-30
The previous clean-shoe fix still composited the entire opaque sneaker over the ankle, so its dark interior made the shoe appear empty. The dance rig now draws the shoe back/collar first, the continuous leg/ankle next, then the body, and finally only the foreground tongue/laces/toe portion of each shoe. This lets the ankle cover the rear rim/interior while its rounded end remains hidden by the front tongue. No detached flat-topped sprites are reintroduced. Flying rig and all simulation code are unchanged.

Validation: JS syntax and diff checks pass. Eight local dance poses across both support legs and the running-man/heel-toe phrase were rendered from the actual drawing functions, including the source-rectangle foreground composite, and inspected for occupied collars and continuous ankles. This is local visual verification, not a new browser/device check.

## Complete premium update — release 2.0 — 2026-10-30

### Implemented
- One consolidated CSS system: warm gold primary action, cyan/blue support colors, matching panels/buttons, original inline SVG icons, readable 13–16 px navigation/body text and 18–22 px main actions. Interactive controls are at least 44 px; checkbox labels provide the larger tap area. No store, currencies, subscriptions, ads or paid services.
- A stage-led title screen: restrained saved pilot profile/settings, logo, the existing shuffle rig, one PELAA action, existing records, score/world/achievement navigation and readily available help/audio controls. Short nonblocking transitions and reduced-motion support.
- A separate results screen with points, rings passed in this run, best PERFECT chain, reached world, genuine new-record states, immediately available retry, home and local leaderboard. The 0.65 s score count can be skipped. Practice retry retains its practice/world options.
- Six persistent achievements: first pass, three PERFECTs, and world entries at passed counts 15/35/60/90 (the next ring is 16/36/61/91). Unlocks come from real pass events; test/demo flights cannot change achievements, statistics, records or history. Older profile-v2 data and best-score-v1 migrate compatibly. World gallery shows discoveries and the next target; practice worlds remain open.
- An explicit browser-local leaderboard, sorted by score/rings/date, with recent-run highlight even when the run misses the top list. Monday 00:00 UTC is shared by local filtering and the dormant server, stated in the UI, and checked for rollover while an open weekly view is displayed. No fake competitors. API_URL remains empty and the UI performs no leaderboard network calls.
- Distinct bounded visual/audio cues for flap, pass, PERFECT, multiplier, rim, world and records. Success messages and achievement toasts use the footer feedback area instead of covering the next ring. Camera response is less than a logical pixel and can be disabled. Particle count is capped at 100; ring halves and the character pose buffer remain cached. HUD text and progress/styles are written only when values change; notices are composed per event, not per rendered frame.
- Original 108 BPM music and beat-aligned shuffle are unchanged. Saved independent volumes and mute use one gesture-unlocked AudioContext. Pause/hidden tabs cancel scheduled effects and music; first audio/return lifecycle is tested with audio doubles. No new recordings or external audio services.
- Connected hips/knees/ankles and layered sneaker collars are retained for the entire shuffle and now also used in flight. One facial sprite is drawn at a time, eliminating crossfade ghost eyes. The original rigid body is never stretched. The complete fixed 400×650 simulation is fitted uniformly; clean scenery extends into spare screen area, so a tall screen does not crop the next ring.

### Preserved exactly
`physics.mjs`, `motion.mjs` and `groove.mjs` are byte-for-byte unchanged from master at task start. Gravity 625, impulse −255, 120 Hz integration, forward motion, horizontal rings, downward gate, nonfatal physical rim impulses, self-righting, PERFECT scoring and seamless five-world transitions remain intact.

### Validation performed
- `node --test --test-force-exit hot-potato/tests/*.test.mjs`: **65 passed, zero failed**.
- Existing deterministic 60/120 Hz comparisons, world boundary/transition tests, five 250-ring witnesses and 500-ring endless continuation pass.
- New tests cover exact achievement boundaries, profile migration/retention, real/test separation, latest run retention, Monday UTC rollover across DST/month/year, saved mute and background effect cancellation.
- Application handlers are exercised with offline DOM/Canvas/audio doubles: all menus, real input replay to 16 rings and achievement unlocks, separate results, skip count, immediate retry, saved settings, local recent-run highlight, practice exclusion, first audio gesture, background pause/return and HUD write counts. This is logic testing, not an actual browser.
- Projection tests at 320×568, 390×844, 430×932, 560×600 and 560×920 retain the whole simulation without anisotropic scale. These are mathematical/application tests with mocked bounds, not CSS layout or device verification.
- Forty local character renders from the actual drawing functions were inspected: 32 poses across the eight-beat dance phrase and eight ascending/descending/tumbling/settled poses. A local Canvas-to-SVG adapter is used for inspection; this is not a browser screenshot.
- JavaScript syntax, duplicate HTML IDs, local linked resources, CSS braces and git whitespace/scope checks pass.

### Verification limits for this release
Cloud browser access to the preview was rejected by automatic approval review because its selected review model was at capacity. No alternate browser/CDP or network workaround was attempted. Consequently **actual browser CSS layouts at 320/390/430 px, actual safe-area behavior, real device performance/audio, and interactive post-deploy browser checks are NOT verified**. The Render deploy/commit state and available static-source delivery can be checked independently; those must not be described as interactive browser/device tests. No physical iOS/Android or real 120 Hz screen test has been performed. The final handoff reports this limitation.
