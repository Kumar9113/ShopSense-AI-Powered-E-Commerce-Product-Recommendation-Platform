import Navbar from '@/components/Navbar'
import './globals.css'
import GlobalState from '@/context'

export const metadata = {
  title: 'Ecommercery',
  description: 'Fashion, considered.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans bg-canvas text-ink">
        <GlobalState>
          <Navbar />
          <main className="flex min-h-screen flex-col mt-[80px]">{children}</main>
        </GlobalState>
      </body>
    </html>
  )
}
