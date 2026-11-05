import { ListFilter, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { IssueCard } from '../components/IssueCard.jsx';
import { IssueSkeleton, StatePanel } from '../components/StatePanel.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const initialFilters = { type: '', status: '', priority: '', sortBy: 'createdAt', direction: 'desc', page: 1, limit: 9 };
const options = {
  type: [['', 'Tutti i tipi'], ['QUESTION', 'Domande'], ['BUG', 'Bug'], ['DOCUMENTATION', 'Documentazione'], ['FEATURE', 'Funzionalità']],
  status: [['', 'Tutti gli stati'], ['TODO', 'Da fare'], ['IN_PROGRESS', 'In corso'], ['DONE', 'Completate']],
  priority: [['', 'Tutte le priorità'], ['LOW', 'Bassa'], ['MEDIUM', 'Media'], ['HIGH', 'Alta'], ['CRITICAL', 'Critica']],
};

export function DashboardPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== '') params.set(key, String(value)); });
    return params.toString();
  }, [filters]);
  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { setResult(await apiRequest(`/issues?${query}`, { token, signal })); }
    catch (caught) { if (caught.name !== 'AbortError') setError(caught.message); }
    finally { setLoading(false); }
  }, [query, token]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort(); }, [load]);
  function update(name, value) { setFilters((current) => ({ ...current, [name]: value, page: 1 })); }
  return (
    <section>
      <header className="page-heading"><div><p className="eyebrow">Issue attive</p><h1>La bacheca del team</h1><p className="supporting-text">Dai contesto alle priorità e fai avanzare il lavoro.</p></div><Link className="filled-button" to="/new"><Plus size={19} /> Nuova issue</Link></header>
      <div className="stats-strip"><div><strong>{result?.total ?? '—'}</strong><span>Risultati</span></div><div><strong>{result?.items?.filter((item) => item.priority === 'CRITICAL').length ?? '—'}</strong><span>Critiche</span></div><div><strong>{result?.items?.filter((item) => item.status === 'IN_PROGRESS').length ?? '—'}</strong><span>In corso</span></div></div>
      <div className="filter-bar"><span className="filter-label"><ListFilter size={19} /> Filtra</span>{Object.entries(options).map(([name, values]) => <label key={name} className="compact-field"><span className="sr-only">{name}</span><select value={filters[name]} onChange={(event) => update(name, event.target.value)}>{values.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}<label className="compact-field"><span className="sr-only">Ordinamento</span><select value={`${filters.sortBy}:${filters.direction}`} onChange={(event) => { const [sortBy, direction] = event.target.value.split(':'); setFilters((current) => ({ ...current, sortBy, direction, page: 1 })); }}><option value="createdAt:desc">Più recenti</option><option value="createdAt:asc">Meno recenti</option><option value="priority:desc">Priorità più alta</option><option value="priority:asc">Priorità più bassa</option></select></label><button className="text-button" onClick={() => setFilters(initialFilters)}><RotateCcw size={17} /> Azzera</button></div>
      {loading ? <div className="issue-grid" aria-label="Caricamento issue">{Array.from({ length: 6 }, (_, index) => <IssueSkeleton key={index} />)}</div> : error ? <StatePanel type="error" title="Bacheca non disponibile" action={<button className="outlined-button" onClick={() => load()}>Riprova</button>}>{error}</StatePanel> : result?.items.length ? <><div className="issue-grid">{result.items.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div><nav className="pagination" aria-label="Paginazione"><button className="outlined-button" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Precedente</button><span>Pagina {result.page} di {Math.max(result.totalPages, 1)}</span><button className="outlined-button" disabled={filters.page >= result.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Successiva</button></nav></> : <StatePanel title="Nessuna issue trovata">Prova a rimuovere un filtro oppure crea la prima issue per questa vista.</StatePanel>}
    </section>
  );
}
