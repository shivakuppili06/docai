import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-form glass-panel" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', margin: '0' }}>404</h1>
        <h2>Page Not Found</h2>
        <p className="subtitle" style={{ marginBottom: '30px' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
