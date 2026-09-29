/**
 * Whole-screen colour filters for the prizes that change how the game looks. The screen is turned to
 * greys and mapped onto a few colours (the Game Boy's four greens), or warmed to sepia. The game
 * points at these by id from game.css when a colour is picked (`data-palette` on the game).
 */
export function PaletteFilters() {
  return (
    <svg className="palette-filters" width="0" height="0" aria-hidden focusable="false">
      <defs>
        <filter id="palette-gameboy" colorInterpolationFilters="sRGB">
          {/* Grey, then a touch of contrast, so the four greens are spread across the picture. */}
          <feColorMatrix
            type="matrix"
            values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.12" intercept="-0.02" />
            <feFuncG type="linear" slope="1.12" intercept="-0.02" />
            <feFuncB type="linear" slope="1.12" intercept="-0.02" />
          </feComponentTransfer>
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0.059 0.188 0.545 0.608" />
            <feFuncG type="discrete" tableValues="0.220 0.384 0.675 0.737" />
            <feFuncB type="discrete" tableValues="0.059 0.188 0.059 0.059" />
          </feComponentTransfer>
        </filter>
        <filter id="palette-sepia" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.393 0.769 0.189 0 0  0.349 0.686 0.168 0 0  0.272 0.534 0.131 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
