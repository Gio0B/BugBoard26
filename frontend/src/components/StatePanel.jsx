import { AlertCircle, Inbox } from 'lucide-react';

export function StatePanel({ type = 'empty', title, children, action }) {
  const Icon = type === 'error' ? AlertCircle : Inbox;
  return <div className={`state-panel ${type}`} role={type === 'error' ? 'alert' : undefined}><Icon size={34} /><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function IssueSkeleton() {
  return <div className="issue-card skeleton" aria-hidden="true"><span /><span /><span /></div>;
}
