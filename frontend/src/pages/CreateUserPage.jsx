import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function CreateUserPage() {
  const { token, user } = useAuth(); const [values, setValues] = useState({ email: '', password: '', role: 'USER' });
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false);
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); setSuccess(''); try { const result = await apiRequest('/users', { token, method: 'POST', body: values }); setSuccess(`${result.user.email} è stato creato.`); setValues({ email: '', password: '', role: 'USER' }); } catch (caught) { setError(caught.message); } finally { setBusy(false); } }
  return <section className="form-page"><header className="page-heading"><div><p className="eyebrow">Amministrazione</p><h1>Crea un utente</h1></div><span className="large-symbol"><UserPlus size={28} /></span></header><form className="surface-form" onSubmit={submit}>{error && <div className="error-banner" role="alert">{error}</div>}{success && <div className="success-banner" role="status">{success}</div>}<label className="field"><span>E-mail</span><input required type="email" name="email" autoComplete="off" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></label><label className="field"><span>Password temporanea</span><input required type="password" minLength="12" maxLength="72" name="password" autoComplete="new-password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} /><small>Da 12 a 72 caratteri.</small></label><label className="field"><span>Ruolo</span><select name="role" value={values.role} onChange={(event) => setValues({ ...values, role: event.target.value })}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></label><div className="form-actions"><button className="filled-button" disabled={busy}>{busy ? 'Creazione…' : 'Crea utente'}</button></div></form></section>;
}
