import localFont from "next/font/local";

// Anuphan — Thai script. Exposed as --font-th and used as the fallback in the
// font stack so Thai glyphs render correctly even though Geist leads for Latin.
export const fontLocalTh = localFont({
     src: '../static/Anuphan-VariableFont_wght.ttf',
     display: 'swap',
     variable: '--font-th',
})

// Geist — Latin + numerals. Exposed as --font-en and leads the --font-sans
// stack (see globals.css), so labels, data, and IDs render in Geist.
export const fontLocalEn = localFont({
     src: '../static/Geist-VariableFont_wght.ttf',
     display: 'swap',
     variable: '--font-en',
})
