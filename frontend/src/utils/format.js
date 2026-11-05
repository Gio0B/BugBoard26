const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
export const formatDate = (value) => dateFormatter.format(new Date(value));
export const labels = {
  QUESTION: 'Domanda', BUG: 'Bug', DOCUMENTATION: 'Documentazione', FEATURE: 'Funzionalità',
  TODO: 'Da fare', IN_PROGRESS: 'In corso', DONE: 'Completata',
  LOW: 'Bassa', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica',
};
