import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, labels } from '../utils/format.js';

export function IssueCard({ issue }) {
  return (
    <article className="issue-card">
      <div className="issue-card-top"><span className={`type-icon type-${issue.type.toLowerCase()}`}>{issue.type.slice(0, 1)}</span><div className="issue-chips"><span className={`chip priority-${issue.priority.toLowerCase()}`}>{labels[issue.priority]}</span><span className="chip tonal">{labels[issue.status]}</span></div></div>
      <div><p className="card-kicker">{labels[issue.type]}</p><h2>{issue.title}</h2><p className="issue-description">{issue.description}</p></div>
      <footer><div><span>{issue.author.email}</span><span className="date"><CalendarDays size={15} /> {formatDate(issue.createdAt)}</span></div><Link className="icon-button" to={`/issues/${issue.id}`} aria-label={`Apri ${issue.title}`}><ArrowUpRight size={20} /></Link></footer>
    </article>
  );
}
