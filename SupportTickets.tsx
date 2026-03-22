import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Search,
  Filter,
  Plus,
  Eye,
  Reply,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  user_type?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: any;
  last_reply?: string;
}

export const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching support tickets:', error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();

    const subscription = supabase
      .channel('tickets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, fetchTickets)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const stats = [
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'Open').length, sub: 'Needs response', color: 'text-blue-500' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, sub: 'Being handled', color: 'text-amber-500' },
    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'Resolved').length, sub: 'Completed', color: 'text-emerald-500' },
    { label: 'Total Tickets', value: tickets.length, sub: 'All time', color: 'text-blue-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", stat.color)}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Support Tickets</h4>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-500 font-medium">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-900">{ticket.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-900">{ticket.subject}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{ticket.user_name || 'User'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{ticket.user_type || 'Student'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        ticket.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                        ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        ticket.status === 'Open' ? 'bg-blue-50 text-blue-600' : 
                        ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium">
                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(ticket.id, 'In Progress')}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(ticket.id, 'Resolved')}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Response Templates */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-900 mb-8">Quick Response Templates</h4>
          <div className="space-y-4">
            {[
              { title: 'Payment Issue', desc: 'Template for payment-related inquiries and troubleshooting' },
              { title: 'Verification Help', desc: 'Guide users through the verification process' },
              { title: 'Account Access', desc: 'Help with login issues and password resets' },
              { title: 'General Inquiry', desc: 'Standard response for common questions' },
            ].map((template, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all cursor-pointer group">
                <h5 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-orange-600">{template.title}</h5>
                <p className="text-xs text-slate-500 font-medium">{template.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          {selectedTicket ? (
            <div className="w-full text-left">
              <h4 className="text-lg font-bold text-slate-900 mb-4">{selectedTicket.subject}</h4>
              <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedTicket.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Type your response..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <button className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Select a ticket to respond</h4>
              <p className="text-sm text-slate-500 font-medium max-w-xs">Choose a support ticket from the list to view the conversation history and send a response.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
