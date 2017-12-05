<a name="0.2.2"></a>
- Allow next/prev system carousel while still animating (2017-12-04)
- Option for WAN Edit mode (2017-12-04)
- Scan Fix [#1](https://github.com/gazpan/WebtroPie/issues/1) (2017-12-04)
- Speedup: Cache gamelists client side (2017-12-03)
- Metadata description not saving [#3](https://github.com/gazpan/WebtroPie/issues/3) (2017-11-30)
- Speedup: Cache interpreted gamelist files (json) if gamelist is unchanged (2017-11-28)
- Carousel vertical-wheel style (Space-Oddity theme), don't animate unchanging images (2017-11-22)
- Improved variable substitution (2017-11-22)
- Better handling of features, carousel zindex and gamelist line height (2017-11-22)
- Better z-index calculation (2017-11-19)
- Fix Save bug (2017-11-16)
- Show all systems + get themes even when system ROM dir does not exist (2017-11-12)
- Text positioning, vertical align single line text within available space (2017-11-12)
- auto create external media directory links (2017-11-11)
- remove square/curly brackets from game lists (2017-11-11)
- show system after game name in auto game lists (2017-11-11)
- Change number of players input on Editor to text instead of number (2017-11-11)
- only description set to multiline (2017-11-11)
- handle themes containing unicode chars (2017-11-09)
- better theme failure handling

# 0.2.2 oxymoronic-fixed-variables (2017-11-03)
- fix IE 11 images (not allowing content: url(...))
- fix IE 11 font now allowing embed default font (many theme fonts may also fail to load in IE <=11)
- use default theme when available for systems with no theme
- use value in es_systems.cfg for theme if different from system name
- partial implementation of theme variables

<a name="0.2.1"></a>
# 0.2.1 collection-connections (2017-10-28)
- **carousel** code restructure
  - fix IE carousel flicker
  - automatic collections: All Games, Favorites and Last Played

<a name="0.2.0"></a>
# 0.2.0 transition-revamp (2017-10-16)
- gamelist selector/cursor icon (e.g. hand cursor in retrorama theme)
- game description auto scroll
- carousel: themed + vertical/horizontal scrolling transitions
- carousel: background slide/fade transitions same as Windows build
- app: **major Refactor/Restructure code** as per AngularJS style guide https://github.com/johnpapa/angular-styleguide/tree/master/a1 (2017-09)


----

<a name="0.1.1"></a>
- gui: Menu/ui/View Transitions Setting: Fade and Scroll (2017-06-06)
- themes: get font metrics for better text positioning (2017-05-28)
- app: allow multiline text to scroll (2017-05-27)
- themes: use zIndex if present (2017-05-25)
- themes: use rgba in places where only rgb was being used (2017-05-25)
- code: don't strtolower xml tags, expects exact case in xml but more readable code (2017-05-25)
- app: default to video view if showSnapshotNoVideo even if gamelist has no videos (2017-05-24)
- themes: config/themes.cfg file for themes tweaks (2017-05-24)
- themes: minor fixes, give md_image default origin 0.5 0.5  (famicom-mini) (2017-05-22)
- themes: fix include path handling (famicom-mini) (2017-05-21)
- themes: don't stretch indent Comic-Book (2017-05-21)
- themes: workaround invalid chars outside tags at start of theme files (Comic-Book) (2017-05-18)
- themes: partial system carousel theme support (2017-05-16)
- gui: Ctrl-M on system view for main menu (2017-05-16)
- themes: fix wrong alpha on some theme png images (2017-05-16)
- themes: fix double dates after theme switching and date positioning (2017-05-16)
- themes: color greyscale images client side (2017-05-16)
- themes: don't stretch indent gamelist (2017-05-16)
- themes: show correct selectedcolor background color if has alpha (indent) (2017-05-16)
- themes: workaround wrong theme tags for lastplayed, releasedate, rating (indent) (2017-05-16)
- themes: don't color image if FFFFFFFF (indent) (2017-05-16)
- show fields: allow click on column name (2017-05-15)
- small bug fix 'feature' video (2017-05-15)
- Alternate resize method for selected themes (2017-05-14)

<a name="0.1.0"></a>
# 0.1.0 warts-n-all (2017-05-13)

- First Commit

