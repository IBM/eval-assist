import { Head, Html, Main, NextScript } from 'next/document'

import { setInitialThemeScript } from '../components/ThemePreference'

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: setInitialThemeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
