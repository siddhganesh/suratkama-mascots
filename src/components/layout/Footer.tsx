import { Link } from 'react-router-dom'
import { Zap, Twitter, Instagram, Linkedin, Github, Mail, ArrowUpRight } from 'lucide-react'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Browse Mascots', href: '/events' },
    { label: 'Book Performers', href: '/book' },
    { label: 'My Profile', href: '/profile' },
    { label: 'Auth / Sign In', href: '/auth' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press Kit', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ],
}

const SOCIALS = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-brown-200/50 bg-brown-50/30 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brown-300 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-64
                      bg-brown-200/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl bg-brown-500 flex items-center justify-center
                              group-hover:shadow-[0_0_20px_rgba(192,125,53,0.4)] transition-all duration-300">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-brown-900">
                Suratkama<span className="gradient-text">Mascots</span>
              </span>
            </Link>

            <p className="text-brown-700 text-sm leading-relaxed max-w-xs">
              Surat's premier dancing mascot costume booking services. Bring premium, clean, and highly energetic characters to perform at your celebrations.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-xs section-label mb-3 text-brown-600">Stay in the loop</p>
              <form
                onSubmit={e => e.preventDefault()}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-500" />
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    placeholder="your@email.com"
                    className="input-field pl-9 py-2.5 text-sm bg-white text-brown-900 border-brown-200"
                  />
                </div>
                <button type="submit" className="btn-primary py-2.5 px-4 text-sm whitespace-nowrap">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-heading font-semibold text-brown-900 text-sm mb-4">{section}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-brown-700 hover:text-brown-500 text-sm
                                 flex items-center gap-1 group transition-colors duration-200"
                    >
                      {label}
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 group-hover:opacity-100 transition-opacity -translate-y-0.5 group-hover:translate-x-0.5 duration-200"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="divider-gradient mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brown-600 text-sm">
            © {new Date().getFullYear()} SuratkamaMascot. All rights reserved.
            Built with ♥ in Surat, India.
          </p>

          {/* Socials */}
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-8 h-8 rounded-lg glass border border-brown-200/30 bg-white flex items-center justify-center text-brown-650
                           hover:text-brown-500 hover:border-brown-400/60 transition-all duration-200"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
