export default function NotFound() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>Page Not Found</h2>
      <p>The page you&apos;re looking for doesn&apos;t exist.</p>
      <a href="/" style={{ padding: '10px 20px', backgroundColor: '#B8860B', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '20px', textDecoration: 'none', display: 'inline-block' }}>
        Go Home
      </a>
    </div>
  );
}
