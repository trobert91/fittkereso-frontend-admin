import { createTheme } from "@mantine/core";

/**
 * Admin theme: flat surfaces, coloured semantics.
 *
 * Structure is borrowed from the control-plane design system - 1px borders instead of
 * shadows, the same radius scale, oklch throughout - but where that system is deliberately
 * monochrome ("Ink"), this one carries real hue. An admin that is mostly tables needs colour
 * to do work: a badge has to read as its status from across the row, not just differ in
 * lightness from its neighbour.
 *
 * Every scale below OVERRIDES a Mantine built-in of the same name. That is the point: the
 * ~119 places already written as color="red" / c="dimmed" / color="orange" pick this palette
 * up with no edit to any component. Adding a new name instead would have left those on stock
 * Mantine and split the app in two.
 *
 * oklch is used because its lightness axis is perceptual - shade 6 of every scale below reads
 * as equally "strong", which flat hex ramps never manage. Supported everywhere we target.
 */

/**
 * Shades run 0 (lightest) to 9 (darkest); 6 is what Mantine fills with in light mode and what
 * `color="red"` resolves to. Chroma peaks around 5-6 and tapers at both ends, because near-white
 * and near-black cannot hold saturation without turning muddy.
 */
export const theme = createTheme({
  colors: {
    /* Brand, primary, and the informational chip - all one scale, deliberately.
       The usual objection is that a brand sharing a hue with a status makes a primary button
       read as a status chip. That does not apply here: all nine existing blue call sites are
       soft `variant="light"` badges, spec chips or rating-bar segments, and not one of them is
       a filled action. A filled blue button and a soft blue badge stay distinct by weight.
       Hue sits at 250 rather than the 241 control-plane uses for --color-info: a touch of
       indigo, so it reads as a chosen brand blue instead of default link blue.
       Swapping the brand means editing this one scale - nothing else references it. */
    blue: [
      "oklch(97% 0.016 250)",
      "oklch(94% 0.036 250)",
      "oklch(89% 0.068 250)",
      "oklch(83% 0.105 250)",
      "oklch(75% 0.145 250)",
      "oklch(66% 0.180 250)",
      "oklch(57% 0.195 250)",
      "oklch(49% 0.180 250)",
      "oklch(41% 0.150 250)",
      "oklch(34% 0.120 250)",
    ],

    /* Zero chroma - this is the Ink base the control-plane system is built on, kept intact.
       Mantine derives dimmed text and every default border from gray, so this scale sets the
       app's entire neutral temperature. Shade 6 is `c="dimmed"` (~4.6:1 on white). */
    gray: [
      "oklch(98% 0 0)",
      "oklch(96% 0 0)",
      "oklch(92% 0 0)",
      "oklch(86% 0 0)",
      "oklch(76% 0 0)",
      "oklch(66% 0 0)",
      "oklch(56% 0 0)",
      "oklch(46% 0 0)",
      "oklch(34% 0 0)",
      "oklch(24% 0 0)",
    ],

    /* Destructive and error. Shade 6 is control-plane's --color-error exactly, so a failure
       badge here and a failure badge there are the same red. */
    red: [
      "oklch(97% 0.020 25)",
      "oklch(94% 0.042 25)",
      "oklch(89% 0.078 25)",
      "oklch(83% 0.118 25)",
      "oklch(75% 0.158 25)",
      "oklch(66% 0.190 25)",
      "oklch(58% 0.200 25)",
      "oklch(50% 0.182 25)",
      "oklch(42% 0.152 25)",
      "oklch(35% 0.122 25)",
    ],

    /* Success. Shade 6 matches control-plane's --color-success. */
    green: [
      "oklch(97% 0.021 150)",
      "oklch(94% 0.042 150)",
      "oklch(89% 0.072 150)",
      "oklch(83% 0.100 150)",
      "oklch(75% 0.123 150)",
      "oklch(67% 0.133 150)",
      "oklch(60% 0.130 150)",
      "oklch(52% 0.115 150)",
      "oklch(44% 0.096 150)",
      "oklch(36% 0.078 150)",
    ],

    /* Secondary information - scores, counts, anything that wants colour without claiming a
       status. Now that blue is the brand, this is the scale to reach for when something needs
       to be coloured but must NOT look like an action. */
    teal: [
      "oklch(97% 0.018 190)",
      "oklch(94% 0.038 190)",
      "oklch(89% 0.065 190)",
      "oklch(83% 0.090 190)",
      "oklch(75% 0.108 190)",
      "oklch(67% 0.115 190)",
      "oklch(59% 0.112 190)",
      "oklch(51% 0.097 190)",
      "oklch(43% 0.081 190)",
      "oklch(35% 0.066 190)",
    ],

    /* Warning, and the "partial / degraded" tier generally. Hue drifts from 70 to 56 as it
       darkens: warm hues left on a fixed angle turn brown at low lightness, so the ramp
       rotates slightly toward red to stay recognisably orange. */
    orange: [
      "oklch(97% 0.025 70)",
      "oklch(94% 0.052 70)",
      "oklch(90% 0.090 70)",
      "oklch(85% 0.120 68)",
      "oklch(80% 0.142 66)",
      "oklch(75% 0.152 64)",
      "oklch(69% 0.155 62)",
      "oklch(60% 0.142 60)",
      "oklch(51% 0.120 58)",
      "oklch(42% 0.100 56)",
    ],

    /* "Nothing is broken, but nothing happened either" - the already-running scan, the skipped
       job. Yellow is the one scale that cannot follow the shared lightness ramp: it stops
       reading as yellow below ~70% and becomes olive, so the whole scale sits higher and only
       the last two shades go genuinely dark. */
    yellow: [
      "oklch(98% 0.028 100)",
      "oklch(95% 0.058 98)",
      "oklch(92% 0.100 96)",
      "oklch(89% 0.130 94)",
      "oklch(86% 0.145 92)",
      "oklch(82% 0.150 90)",
      "oklch(77% 0.148 88)",
      "oklch(68% 0.135 85)",
      "oklch(57% 0.115 82)",
      "oklch(46% 0.095 80)",
    ],

    /* Dark-mode surfaces. Mantine reads this scale positionally, so the indices are fixed
       contracts, not free choices: 7 is the body, 6 is a raised surface, 4 is the default
       border, 0-2 are text. Those land on control-plane's dark values (base-100 18%,
       base-200 15%, base-300 24%) so both apps' dark modes sit at the same depth.
       The trace of brand chroma - 0.01 at most, below the threshold you would name as a
       colour - keeps dark mode from going the dead neutral grey that flat designs fall into.
       It tracks the brand hue, so changing blue above means changing 250 here too. */
    dark: [
      "oklch(93% 0.004 250)",
      "oklch(85% 0.005 250)",
      "oklch(72% 0.006 250)",
      "oklch(56% 0.007 250)",
      "oklch(40% 0.008 250)",
      "oklch(31% 0.009 250)",
      "oklch(24% 0.010 250)",
      "oklch(19% 0.010 250)",
      "oklch(15% 0.010 250)",
      "oklch(12% 0.009 250)",
    ],
  },

  primaryColor: "blue",
  /* One shade for both schemes.
     Mantine's own default darkens to 8 in dark mode, which on a 19% ground is nearly
     invisible - but correcting that by moving UP to 4 overshot badly: shade 4 is oklch(75%),
     a pale pastel that reads as a disabled control rather than an action, and light enough to
     cross the luminance threshold below and take black text.
     Shade 6 is oklch(57%): far enough above a 19% background to be unmistakable, saturated
     enough to carry white text, and the same colour the light scheme fills with - which is
     what a chromatic brand normally wants, rather than being two different blues depending on
     the time of day.
     7 (49%) is the next stop if a deeper button is wanted. Going lighter than 6 is what
     crosses 0.65 and flips the label back to black. */
  primaryShade: 6,

  /* Picks black or white text per filled background automatically. Worth turning on precisely
     because this palette is colourful - yellow 5 and blue 6 need opposite text colours, and
     hand-managing that across 36 badges is how contrast bugs get shipped. */
  autoContrast: true,
  /* 0.65, not Mantine's 0.3, because this palette is oklch.
     Mantine's luminance() special-cases oklch and returns the L channel verbatim rather than
     computing relative luminance - so a saturated blue that would score ~0.1 as relative
     luminance scores 0.57 here, sails past a 0.3 threshold, and gets black button text. The
     threshold has to be read in perceptual-lightness terms instead.
     At 0.65 the shade-6 fills land correctly on both sides: white on blue 57%, red 58%,
     teal 59%, green 60% and gray 56%; black on orange 69% and yellow 77%, which genuinely
     are too light to carry white. Changing a scale's lightness means re-checking this. */
  luminanceThreshold: 0.65,

  /* control-plane's --radius-field (0.5rem) and --radius-box (0.75rem), as md and lg. */
  radius: {
    xs: "0.25rem",
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  defaultRadius: "md",

  /* Flat, with one honest exception. Cards and panels get no shadow at all - separation is a
     1px border, which is the whole point of the flat look. But md/lg/xl are what Mantine hands
     to Menu, Popover, Modal and Tooltip, and an overlay with no shadow and no scrim does not
     read as floating above the table underneath it - it reads as part of it. So those keep
     just enough lift to sit forward, and nothing else does. */
  shadows: {
    xs: "none",
    sm: "none",
    md: "0 4px 12px rgba(0, 0, 0, 0.08)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.10)",
    xl: "0 16px 40px rgba(0, 0, 0, 0.12)",
  },

  /* Geist, wired through next/font in app/layout.tsx. The previous value here named Inter,
     which was never actually loaded anywhere in the app - every screen has been rendering in
     the system sans this whole time. */
  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-geist-mono), ui-monospace, monospace",
  headings: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontWeight: "600",
  },

  cursorType: "pointer",

  /* Component defaults are the piece the control-plane system has no equivalent for: there,
     a card is the literal string "rounded-box border border-base-300 bg-base-100" retyped at
     every call site and policed by a test that greps source. Here it is a default, set once. */
  components: {
    Card: {
      defaultProps: { withBorder: true, shadow: "none", radius: "lg" },
    },
    Paper: {
      defaultProps: { withBorder: true, shadow: "none", radius: "lg" },
    },
    Badge: {
      /* Soft fills by default, matching control-plane's badge-soft house style - a table with
         36 saturated badges in it is unreadable. `tt: "none"` turns off Mantine's uppercasing,
         which mangles the spec values and model numbers these badges mostly contain. */
      defaultProps: { variant: "light", radius: "sm", tt: "none" },
    },
    /* Tables, carrying over control-plane's daisyUI `table table-sm`.
       Their metrics translated: padding-block .5rem and padding-inline .75rem, a faint row
       divider, a hover highlight, an enclosing border - and no zebra, since control-plane
       never applies .table-zebra. The old `striped verticalSpacing="md"` was double this
       padding plus stripes, which is why the rows read as so tall.

       What does NOT carry over is the rounded corner. daisyUI can round its table because it
       sets border-collapse: separate; Mantine puts the row divider on the <tr>, and a tr
       border-bottom does not render under `separate` - so copying that would silently delete
       every row line. border-radius is ignored on a collapsed table, so the corners stay
       square. Rounding them needs a wrapper element per table, not a theme default.

       The <th> treatment lives in global.scss instead of here: most of these tables render a
       raw <th> rather than <Table.Th>, and the Styles API only reaches Mantine's own
       components - so a styles.th here would miss the very headers it is meant to style. */
    Table: {
      defaultProps: {
        verticalSpacing: "0.5rem",
        horizontalSpacing: "0.75rem",
        highlightOnHover: true,
        withTableBorder: true,
        striped: false,
        borderColor: "var(--mantine-color-default-border)",
      },
    },
    Modal: {
      defaultProps: { radius: "lg", centered: true },
    },
    Tooltip: {
      defaultProps: { radius: "sm" },
    },
  },

  breakpoints: {
    xs: "30em",
    sm: "40em",
    md: "48em",
    lg: "64em",
    xl: "80em",
    "2xl": "96em",
    "3xl": "120em",
    "4xl": "160em",
  },
});
