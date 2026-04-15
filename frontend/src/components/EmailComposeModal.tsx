'use client';

import { useState } from 'react';
import { X, Send, Mail, AlertCircle } from 'lucide-react';

interface EmailComposeModalProps {
  onClose: () => void;
  recipientEmail: string;
  recipientName: string;
  defaultSubject?: string;
  defaultMessage?: string;
  onSend: (subject: string, message: string) => Promise<void>;
}

export default function EmailComposeModal({
  onClose,
  recipientEmail,
  recipientName,
  defaultSubject = '',
  defaultMessage = '',
  onSend,
}: EmailComposeModalProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both subject and message');
      return;
    }

    setSending(true);
    try {
      await onSend(subject, message);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Compose Email</h2>
              <p className="text-sm text-gray-600">Send to {recipientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 hover:bg-white/50 rounded-lg transition disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                To
              </label>
              <input
                type="email"
                value={recipientEmail}
                disabled
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-lg cursor-not-allowed"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                placeholder="Enter email subject"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Message *
              </label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                rows={12}
                className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 resize-none"
                placeholder="Write your message here..."
              />
              <p className="text-xs text-gray-500 mt-2">
                This will be sent as a professionally formatted email
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || !subject.trim() || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="h-5 w-5" />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}