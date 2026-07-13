import { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { Plus, Mail, MailOpen } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useGetInboxQuery, useGetSentQuery, useSendMessageMutation, useMarkMessageReadMutation } from '../../api/communicationApi.js';
import { useGetDirectoryQuery } from '../../api/usersApi.js';

export default function MessagesTab() {
  const [box, setBox] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [values, setValues] = useState({ recipient: '', subject: '', body: '' });

  const { data: inboxData, isLoading: loadingInbox } = useGetInboxQuery({ limit: 50 });
  const { data: sentData, isLoading: loadingSent } = useGetSentQuery({ limit: 50 }, { skip: box !== 'sent' });
  const { data: directoryData } = useGetDirectoryQuery();
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [markRead] = useMarkMessageReadMutation();

  const messages = box === 'inbox' ? inboxData?.data : sentData?.data;
  const isLoading = box === 'inbox' ? loadingInbox : loadingSent;

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendMessage(values).unwrap();
      toast.success('Message sent');
      setComposeOpen(false);
      setValues({ recipient: '', subject: '', body: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {['inbox', 'sent'].map((b) => (
            <button
              key={b}
              onClick={() => setBox(b)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-sm font-medium capitalize',
                box === b ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {b}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setComposeOpen(true)}>
          <Plus size={16} /> Compose
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size={24} />
        </div>
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {(messages || []).map((m) => (
            <div
              key={m._id}
              className="flex items-start gap-3 p-4"
              onClick={() => box === 'inbox' && !m.isRead && markRead(m._id)}
            >
              {m.isRead || box === 'sent' ? (
                <MailOpen className="mt-0.5 text-gray-400" size={16} />
              ) : (
                <Mail className="mt-0.5 text-primary-600" size={16} />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {box === 'inbox' ? `${m.sender?.firstName} ${m.sender?.lastName}` : `${m.recipient?.firstName} ${m.recipient?.lastName}`}
                  </p>
                  <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                {m.subject && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{m.subject}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-400">{m.body}</p>
              </div>
            </div>
          ))}
          {!messages?.length && <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No messages.</p>}
        </div>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Compose Message">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="label">To</label>
            <select className="input" required value={values.recipient} onChange={(e) => setValues((v) => ({ ...v, recipient: e.target.value }))}>
              <option value="">Select recipient...</option>
              {(directoryData?.data || []).map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={values.subject} onChange={(e) => setValues((v) => ({ ...v, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} required value={values.body} onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))} />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? <Spinner size={16} className="text-white" /> : 'Send'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
