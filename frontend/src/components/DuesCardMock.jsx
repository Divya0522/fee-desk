import { CalendarDays } from 'lucide-react'
export default function DuesCardMock({ t }) {
  return <div className="mock-shell" aria-label="Example parent dues card">
    <div className="mock-top"><span className="mock-kicker">{t.mock.account}</span><span className="mock-avatar">IS</span></div>
    <div className="student"><h3>{t.mock.student}</h3><p>{t.mock.batch}</p></div>
    <div className="due-block"><span className="due-label">{t.mock.due}</span><strong className="amount tabular">₹15,000</strong><span className="due-date tabular"><CalendarDays size={14} /> {t.mock.date}</span><span className="status-chip">{t.mock.overdue}</span></div>
    <button className="button pay-button">{t.mock.pay}</button>
  </div>
}
