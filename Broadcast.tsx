import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Save, 
  Eye, 
  Users, 
  CheckCircle, 
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  MoreVertical,
  History,
  Loader2,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BroadcastItem {
  id: string;
  type: string;
  audience: string;
  subject: string;
  message: string;
  send_email: boolean;
  send_sms: boolean;
  send_in_app: boolean;
  status: 'Sent' | 'Draft';
  recipients_count: number;
  created_at: any;
}

export const Broadcast: React.FC = () => {
  const { showNotification } = useNotification();
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'Announcement',
    audience: 'All Users',
    subject: '',
    message: '',
    sendEmail: false,
    sendSms: false,
    sendInApp: true
  });

  const [stats, setStats] = useState({
    totalSent: 0,
    totalRecipients: 0,
    openRate: '0%',
    avgResponse: '0h'
  });

  useEffect(() => {
    const fetchBroadcasts = async () => {
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching broadcasts:', error);
      } else {
        setBroadcasts(data || []);
        
        const sentBroadcasts = (data || []).filter(b => b.status === 'Sent');
        const totalRecipients = sentBroadcasts.reduce((acc, b) => acc + (b.recipients_count || 0), 0);
        
        setStats({
          totalSent: sentBroadcasts.length,
          totalRecipients,
          openRate: '78%', // Mocked for now
          avgResponse: '2.4h' // Mocked
        });
      }
      setLoading(false);
    };

    fetchBroadcasts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('broadcasts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcasts' }, fetchBroadcasts)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSendBroadcast = async () => {
    if (!formData.subject || !formData.message) {
      showNotification('Please fill in both subject and message.', 'error');
      return;
    }

    setIsSending(true);
    try {
      // 1. Fetch target audience
      let query = supabase.from('profiles').select('id, email, phone');
      
      if (formData.audience === 'Students Only') {
        query = query.eq('role', 'student');
      } else if (formData.audience === 'Landlords Only') {
        query = query.eq('role', 'landlord');
      } else if (formData.audience === 'Verified Users Only') {
        query = query.eq('is_verified', true);
      }

      const { data: targetUsers, error: usersError } = await query;
      if (usersError) throw usersError;
      
      const recipientsCount = targetUsers?.length || 0;

      // 2. Create Broadcast Record
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcasts')
        .insert({
          type: formData.type,
          audience: formData.audience,
          subject: formData.subject,
          message: formData.message,
          send_email: formData.sendEmail,
          send_sms: formData.sendSms,
          send_in_app: formData.sendInApp,
          recipients_count: recipientsCount,
          status: 'Sent'
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // 3. Create In-App Notifications if enabled
      if (formData.sendInApp && targetUsers) {
        const notifications = targetUsers.map(user => ({
          user_id: user.id,
          title: formData.subject,
          message: formData.message,
          type: formData.type.toLowerCase(),
          is_read: false,
          broadcast_id: broadcast.id
        }));
        
        const { error: notifyError } = await supabase.from('notifications').insert(notifications);
        if (notifyError) throw notifyError;
      }

      // 4. Send SMS via Backend API (Optional/Placeholder)
      if (formData.sendSms && targetUsers) {
        const phoneNumbers = targetUsers.map(u => u.phone).filter(p => !!p);
        if (phoneNumbers.length > 0) {
          await fetch('/api/broadcast/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipients: phoneNumbers,
              message: `${formData.subject}: ${formData.message}`
            })
          }).catch(err => console.error('SMS API failed:', err));
        }
      }

      // 5. Send Email via Backend API
      if (formData.sendEmail && targetUsers) {
        const emails = targetUsers.map(u => u.email).filter(e => !!e);
        if (emails.length > 0) {
          await fetch('/api/broadcast/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipients: emails,
              subject: formData.subject,
              message: formData.message
            })
          }).catch(err => console.error('Email API failed:', err));
        }
      }

      // 6. Log Audit Action
      await supabase.from('audit_logs').insert({
        action: 'Send Broadcast',
        target_id: 'all',
        target_type: 'broadcast',
        details: { type: formData.type, audience: formData.audience, subject: formData.subject }
      });

      showNotification('Broadcast sent successfully to ' + recipientsCount + ' users!', 'success');
      setFormData({
        type: 'Announcement',
        audience: 'All Users',
        subject: '',
        message: '',
        sendEmail: false,
        sendSms: false,
        sendInApp: true
      });
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      showNotification('Failed to send broadcast: ' + error.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.subject || !formData.message) {
      showNotification('Please fill in both subject and message to save as draft.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('broadcasts')
        .insert({
          type: formData.type,
          audience: formData.audience,
          subject: formData.subject,
          message: formData.message,
          send_email: formData.sendEmail,
          send_sms: formData.sendSms,
          send_in_app: formData.sendInApp,
          recipients_count: 0,
          status: 'Draft'
        });

      if (error) throw error;

      // Log Audit Action
      await supabase.from('audit_logs').insert({
        action: 'Save Broadcast Draft',
        target_id: 'draft',
        target_type: 'broadcast',
        details: { type: formData.type, subject: formData.subject }
      });

      showNotification('Broadcast saved as draft!', 'success');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      showNotification('Failed to save draft.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = (data?: any) => {
    setPreviewData(data || formData);
    setIsPreviewOpen(true);
  };

  const handleDuplicate = (item: BroadcastItem) => {
    setFormData({
      type: item.type,
      audience: item.audience,
      subject: item.subject,
      message: item.message,
      sendEmail: item.send_email,
      sendSms: item.send_sms,
      sendInApp: item.send_in_app
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Sent', value: stats.totalSent, sub: 'This month', color: 'text-blue-500' },
          { label: 'Total Recipients', value: stats.totalRecipients, sub: 'Messages delivered', color: 'text-emerald-500' },
          { label: 'Open Rate', value: stats.openRate, sub: '↑ 5% from last month', color: 'text-emerald-500' },
          { label: 'Avg. Response Time', value: stats.avgResponse, sub: 'User engagement', color: 'text-blue-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", stat.color)}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Create Broadcast Form */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h4 className="text-lg font-bold text-slate-900">Create New Broadcast</h4>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Message Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option>Announcement</option>
                <option>Security Alert</option>
                <option>Maintenance Notice</option>
                <option>Promotion</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Target Audience</label>
              <select 
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option>All Users</option>
                <option>Students Only</option>
                <option>Landlords Only</option>
                <option>Verified Users Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Subject</label>
            <input 
              type="text" 
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter message subject..." 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900">Message</label>
            <textarea 
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your message here..." 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
            ></textarea>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.sendEmail}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-200 text-orange-500 focus:ring-orange-500/20 transition-all" 
              />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Send email notification</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.sendSms}
                onChange={(e) => setFormData({ ...formData, sendSms: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-200 text-orange-500 focus:ring-orange-500/20 transition-all" 
              />
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Send SMS notification</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.sendInApp}
                onChange={(e) => setFormData({ ...formData, sendInApp: e.target.checked })}
                className="w-5 h-5 rounded-lg border-slate-200 text-orange-500 focus:ring-orange-500/20 transition-all" 
              />
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">In-app notification</span>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={handleSendBroadcast}
              disabled={isSending}
              className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
              {isSending ? 'Sending...' : 'Send Broadcast'}
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save as Draft
            </button>
            <button 
              onClick={() => handlePreview()}
              className="flex items-center gap-2 px-8 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Broadcast History</h4>
          <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <History className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : broadcasts.length > 0 ? (
            broadcasts.map((item) => (
              <div key={item.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h5 className="text-sm font-bold text-slate-900">{item.subject}</h5>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest",
                      item.type === 'Maintenance Notice' ? 'bg-amber-100 text-amber-600' : 
                      item.type === 'Security Alert' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                    )}>
                      {item.type}
                    </span>
                    {item.status === 'Draft' && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-widest">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePreview(item)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(item)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Audience: {item.audience}</span>
                  <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> {item.recipients_count} recipients</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 font-medium">
              No broadcast history found.
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Broadcast Preview</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To: {previewData?.audience}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type: {previewData?.type}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 mb-2">{previewData?.subject || 'No Subject'}</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {previewData?.message || 'No message content...'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {(previewData?.send_email || previewData?.sendEmail) && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>}
                {(previewData?.send_sms || previewData?.sendSms) && <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> SMS</span>}
                {(previewData?.send_in_app || previewData?.sendInApp) && <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> In-App</span>}
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
