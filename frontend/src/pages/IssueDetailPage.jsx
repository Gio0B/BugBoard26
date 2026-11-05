import { Archive, ArrowLeft, CalendarDays, Images, MessageCircle, Play, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiBlobRequest, apiRequest } from '../api/client.js';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { StatePanel } from '../components/StatePanel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { formatDate, labels } from '../utils/format.js';

function AuthenticatedIssueImage({ issueId, image, token }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setSource('');
    setFailed(false);
    apiBlobRequest(`/issues/${issueId}/images/${image.id}`, { token, signal: controller.signal })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setFailed(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.id, issueId, token]);

  return (
    <figure className="issue-image">
      {failed ? <div className="image-load-state">Immagine non disponibile</div> : source ? <a href={source} target="_blank" rel="noreferrer" aria-label={`Apri ${image.originalName}`}><img src={source} alt={image.originalName} /></a> : <div className="image-load-state">Caricamento immagine…</div>}
      <figcaption><span>{image.originalName}</span><small>{Math.max(1, Math.round(image.sizeBytes / 1024))} KB</small></figcaption>
    </figure>
  );
}

export function IssueDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const location = useLocation();
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [issueResult, commentResult] = await Promise.all([
        apiRequest(`/issues/${id}`, { token }),
        apiRequest(`/issues/${id}/comments`, { token }),
      ]);
      setIssue(issueResult.issue);
      setComments(commentResult.items);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  async function submitComment(event) {
    event.preventDefault();
    setBusy(true);
    setActionError('');
    setActionSuccess('');
    try {
      const result = await apiRequest(`/issues/${id}/comments`, { token, method: 'POST', body: { text: comment } });
      setComments((current) => [...current, result.comment]);
      setComment('');
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  async function archiveIssue() {
    setBusy(true);
    setActionError('');
    setActionSuccess('');
    try {
      const result = await apiRequest(`/issues/${id}/archive`, { token, method: 'PATCH' });
      setIssue(result.issue);
      setShowArchiveConfirm(false);
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  async function setInProgress() {
    setBusy(true);
    setActionError('');
    setActionSuccess('');
    try {
      const result = await apiRequest(`/issues/${id}/status`, {
        token,
        method: 'PATCH',
        body: { status: 'IN_PROGRESS' },
      });
      setIssue(result.issue);
      setActionSuccess('Lo stato della issue è ora In corso.');
    } catch (caught) {
      setActionError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="detail-loading">Caricamento dettaglio…</div>;
  if (error) return <StatePanel type="error" title="Issue non disponibile" action={<button className="outlined-button" onClick={load}>Riprova</button>}>{error}</StatePanel>;

  return (
    <article className="detail-page">
      <Link className="back-link" to={issue.archived ? '/archived' : '/'}><ArrowLeft size={18} /> Torna all’elenco</Link>
      {location.state?.created && <div className="success-banner" role="status">Issue creata. Ora è visibile a tutto il team.</div>}
      {actionSuccess && <div className="success-banner" role="status">{actionSuccess}</div>}
      {actionError && <div className="error-banner" role="alert">{actionError}</div>}
      <header className="detail-hero">
        <div className="issue-chips"><span className={`chip priority-${issue.priority.toLowerCase()}`}>{labels[issue.priority]}</span><span className="chip tonal">{labels[issue.status]}</span><span className="chip tonal">{labels[issue.type]}</span>{issue.archived && <span className="chip archived">Archiviata</span>}</div>
        <h1>{issue.title}</h1>
        <div className="detail-meta"><span>{issue.author.email}</span><span><CalendarDays size={16} /> {formatDate(issue.createdAt)}</span></div>
        {!issue.archived && (issue.status !== 'IN_PROGRESS' || user?.role === 'ADMIN') && <div className="detail-actions">
          {issue.status !== 'IN_PROGRESS' && <button className="status-button" disabled={busy} onClick={setInProgress}><Play size={18} /> Segna come in corso</button>}
          {user?.role === 'ADMIN' && <button className="archive-button" disabled={busy} onClick={() => setShowArchiveConfirm(true)}><Archive size={18} /> Archivia issue</button>}
        </div>}
      </header>
      <section className="detail-body"><p>{issue.description}</p></section>
      {issue.images?.length > 0 && <section className="issue-images-section"><header><div><p className="eyebrow">Allegati</p><h2><Images size={23} /> {issue.images.length} {issue.images.length === 1 ? 'immagine' : 'immagini'}</h2></div></header><div className="issue-image-grid">{issue.images.map((image) => <AuthenticatedIssueImage key={image.id} issueId={issue.id} image={image} token={token} />)}</div></section>}
      <section className="comments-section">
        <header><div><p className="eyebrow">Conversazione</p><h2><MessageCircle size={23} /> {comments.length} commenti</h2></div></header>
        <div className="comment-list">{comments.length ? comments.map((item) => <article className="comment" key={item.id}><div className="avatar">{item.author.email.slice(0, 1).toUpperCase()}</div><div><header><strong>{item.author.email}</strong><time>{formatDate(item.createdAt)}</time></header><p>{item.text}</p></div></article>) : <p className="comments-placeholder">Nessun commento. Avvia la conversazione.</p>}</div>
        {!issue.archived && <form className="comment-form" onSubmit={submitComment}><label className="field"><span>Aggiungi un commento</span><textarea required maxLength="5000" rows="4" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Condividi un’osservazione utile…" /></label><button className="filled-button" disabled={busy || !comment.trim()}>{busy ? 'Invio…' : <><Send size={18} /> Pubblica</>}</button></form>}
      </section>
      <ConfirmDialog open={showArchiveConfirm} title="Archiviare questa issue?" confirmLabel="Archivia" busy={busy} onConfirm={archiveIssue} onCancel={() => setShowArchiveConfirm(false)}>Scomparirà dalla bacheca attiva. Issue e commenti resteranno consultabili nell’archivio.</ConfirmDialog>
    </article>
  );
}
