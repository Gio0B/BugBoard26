import { Archive } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { IssueCard } from '../components/IssueCard.jsx';
import { IssueSkeleton, StatePanel } from '../components/StatePanel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export function ArchivedPage() {
  const { token } = useAuth(); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setResult(await apiRequest('/issues/archived?limit=100', { token })); } catch (caught) { setError(caught.message); } finally { setLoading(false); } }, [token]);
  useEffect(() => { load(); }, [load]);
  return <section><header className="page-heading"><div><p className="eyebrow">Memoria del progetto</p><h1>Issue archiviate</h1><p className="supporting-text">Contesto e conversazioni restano consultabili, senza affollare il lavoro attivo.</p></div><span className="large-symbol"><Archive size={28} /></span></header>{loading ? <div className="issue-grid">{Array.from({ length: 3 }, (_, index) => <IssueSkeleton key={index} />)}</div> : error ? <StatePanel type="error" title="Archivio non disponibile" action={<button className="outlined-button" onClick={load}>Riprova</button>}>{error}</StatePanel> : result?.items.length ? <div className="issue-grid">{result.items.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div> : <StatePanel title="Archivio vuoto">Le issue archiviate compariranno qui.</StatePanel>}</section>;
}
