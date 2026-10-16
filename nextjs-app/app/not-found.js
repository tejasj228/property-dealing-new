import Link from 'next/link';

export default function NotFound() {
  return <section className="not-found-page"><span className="page-kicker">Page not found</span><h1>A different direction.</h1><p>This page is no longer here. Explore the property collection to find your next place.</p><Link href="/properties" className="btn btn-primary">Explore properties</Link></section>;
}
