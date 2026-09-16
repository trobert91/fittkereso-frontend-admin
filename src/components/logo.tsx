import { Box, BoxProps, ElementProps } from "@mantine/core";

interface LogoMarkProps
  extends Omit<BoxProps, "children" | "ref">,
    ElementProps<"svg", keyof BoxProps> {
  size?: string | number;
}

/**
 * The mark: a barbell, drawn as four plates around a bar.
 *
 * It replaces a stock placeholder glyph that said nothing about the product. This one at
 * least names the domain - a catalogue of fitness equipment - and survives being shrunk to
 * the rail's 48px gutter, where anything finer would turn to mush.
 */
export function LogoMark({ size = 24, style, ...props }: LogoMarkProps) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      {...props}
    >
      {/* Outer plates, then inner plates, then the bar between them. */}
      <rect x="2" y="9" width="2.6" height="6" rx="1.1" opacity=".55" />
      <rect x="19.4" y="9" width="2.6" height="6" rx="1.1" opacity=".55" />
      <rect x="5.6" y="6.4" width="3.2" height="11.2" rx="1.4" />
      <rect x="15.2" y="6.4" width="3.2" height="11.2" rx="1.4" />
      <rect x="8.4" y="10.8" width="7.2" height="2.4" rx="1.2" />
    </Box>
  );
}

interface LogoProps extends Omit<BoxProps, "children" | "ref"> {
  size?: number;
  /** Set false where the mark already sits in its own gutter, as in the rail. */
  mark?: boolean;
}

/**
 * The wordmark.
 *
 * Bricolage Grotesque, wired through next/font in the root layout - a variable grotesque with
 * enough character to read as a brand rather than as UI, which the body face deliberately
 * does not. It carries latin-ext, so "Fittkereső" renders correctly if the accent is ever
 * restored to the spelling.
 */
export function Logo({ size = 24, mark = true, ...props }: LogoProps) {
  return (
    <Box
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        ...props.style,
      }}
    >
      {mark && <LogoMark size={size} />}
      <Box
        component="span"
        style={{
          fontFamily: "var(--font-brand), system-ui, sans-serif",
          fontWeight: 800,
          fontSize: `${size * 0.72}px`,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Fittkereso
      </Box>
    </Box>
  );
}
