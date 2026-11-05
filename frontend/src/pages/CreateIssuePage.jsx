import { ArrowLeft, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const initial = { title: '', description: '', type: 'BUG', priority: 'MEDIUM' };
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageBytes = 5 * 1024 * 1024;
const maxImages = 5;

export function CreateIssuePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(initial);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const previews = useMemo(() => images.map((file) => ({ file, url: URL.createObjectURL(file) })), [images]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (selected.length > maxImages) {
      setError(`Puoi allegare al massimo ${maxImages} immagini.`);
      return;
    }
    if (selected.some((file) => !acceptedImageTypes.has(file.type))) {
      setError('Sono consentite soltanto immagini JPEG, PNG, WebP o GIF.');
      return;
    }
    if (selected.some((file) => file.size > maxImageBytes)) {
      setError('Ogni immagine può pesare al massimo 5 MB.');
      return;
    }
    setError('');
    setImages(selected);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(values).forEach(([name, value]) => body.append(name, value));
      images.forEach((image) => body.append('images', image, image.name));
      const result = await apiRequest('/issues', { token, method: 'POST', body });
      navigate(`/issues/${result.issue.id}`, { state: { created: true } });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-page">
      <Link className="back-link" to="/"><ArrowLeft size={18} /> Torna alla bacheca</Link>
      <header className="page-heading"><div><p className="eyebrow">Nuovo elemento</p><h1>Crea una issue</h1><p className="supporting-text">Descrivi il contesto necessario per agire, senza rumore.</p></div></header>
      <form className="surface-form" onSubmit={submit}>
        {error && <div className="error-banner" role="alert">{error}</div>}
        <label className="field"><span>Titolo</span><input name="title" required maxLength="160" value={values.title} onChange={change} placeholder="Es. Correggere il reindirizzamento dopo il login" /><small>{values.title.length}/160</small></label>
        <label className="field"><span>Descrizione</span><textarea name="description" required maxLength="10000" rows="8" value={values.description} onChange={change} placeholder="Contesto, comportamento osservato e risultato atteso…" /></label>
        <div className="form-grid"><label className="field"><span>Tipo</span><select name="type" value={values.type} onChange={change}><option value="QUESTION">Domanda</option><option value="BUG">Bug</option><option value="DOCUMENTATION">Documentazione</option><option value="FEATURE">Funzionalità</option></select></label><label className="field"><span>Priorità</span><select name="priority" value={values.priority} onChange={change}><option value="LOW">Bassa</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Critica</option></select></label></div>
        <section className="image-upload" aria-labelledby="image-upload-title">
          <div><p className="eyebrow" id="image-upload-title">Immagini facoltative</p><p>Allega fino a 5 immagini JPEG, PNG, WebP o GIF, massimo 5 MB ciascuna.</p></div>
          <label className="image-picker"><ImagePlus size={22} /><span>{images.length ? 'Sostituisci immagini' : 'Scegli immagini'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={selectImages} /></label>
          {previews.length > 0 && <div className="image-preview-grid" aria-label="Immagini selezionate">{previews.map(({ file, url }, index) => <figure key={`${file.name}-${file.lastModified}`}><img src={url} alt={`Anteprima ${file.name}`} /><figcaption><span>{file.name}</span><button type="button" className="remove-image" aria-label={`Rimuovi ${file.name}`} onClick={() => setImages((current) => current.filter((_item, itemIndex) => itemIndex !== index))}><X size={17} /></button></figcaption></figure>)}</div>}
        </section>
        <div className="form-actions"><Link className="text-button" to="/">Annulla</Link><button className="filled-button" disabled={busy}>{busy ? 'Creazione…' : <><CheckCircle2 size={19} /> Crea issue</>}</button></div>
      </form>
    </section>
  );
}
