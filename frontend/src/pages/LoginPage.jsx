import { ArrowRight, Bug } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (session) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(values); navigate(location.state?.from?.pathname || '/', { replace: true }); }
    catch (caught) { setError(caught.message); } finally { setBusy(false); }
  }
  return (
    <main className="login-layout">
      <section className="login-hero" aria-labelledby="hero-title"><div className="brand-lockup"><span className="brand-mark"><Bug size={28} /></span><span>BugBoard26</span></div><div><p className="eyebrow inverse">Collaborazione che scorre</p><h1 id="hero-title">Porta ogni problema<br />verso una soluzione.</h1><p>Una bacheca condivisa per decisioni chiare, contesto integro e software migliore.</p></div><p className="hero-footnote">Issue · Conversazioni · Risultati</p></section>
      <section className="login-panel"><form className="login-form" onSubmit={submit}><div><p className="eyebrow">Bentornato</p><h2>Accedi al workspace</h2><p className="supporting-text">Usa le credenziali assegnate dal tuo amministratore.</p></div>{error && <div className="error-banner" role="alert">{error}</div>}<label className="field"><span>E-mail</span><input required type="email" autoComplete="username" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} /></label><label className="field"><span>Password</span><input required type="password" autoComplete="current-password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} /></label><button className="filled-button wide" disabled={busy}>{busy ? 'Accesso…' : <>Accedi <ArrowRight size={19} /></>}</button></form></section>
    </main>
  );
}
