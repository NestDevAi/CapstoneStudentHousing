import React, { useState, useEffect } from 'react';
import { db as supabase } from '../../../lib/db';
import { ShieldCheck, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { StudentVerification } from '../../verification/StudentVerification';
import { DocumentUpload } from '../../shared/DocumentUpload';

export const Verification = ({ user }: { user: any }) => {
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchVerification = async () => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching verification:', error);
      } else {
        setVerificationStatus(data?.[0] || null);
      }
      setLoading(false);
    };

    fetchVerification();

    const subscription = supabase
      .channel('public_verifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'verifications',
        filter: `user_id=eq.${user.id}`
      }, fetchVerification)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {user?.is_verified ? (
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">You're Verified!</h2>
          <p className="text-slate-500">Your account has been fully verified. You now have full access to all features.</p>
        </div>
      ) : verificationStatus?.status === 'Pending' ? (
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Verification Pending</h2>
          <p className="text-slate-500 mb-8">Our team is currently reviewing your documents. This usually takes 24-48 hours.</p>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm inline-flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-slate-700">Submitted on {new Date(verificationStatus.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ) : verificationStatus?.status === 'Rejected' ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex gap-4 mb-8">
            <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="font-bold text-rose-900">Verification Rejected</h4>
              <p className="text-sm text-rose-700">{verificationStatus.admin_notes || 'Please review your documents and try again.'}</p>
            </div>
          </div>
          <StudentVerification user={user} onComplete={() => {}} />
        </div>
      ) : (
        <StudentVerification user={user} onComplete={() => {}} />
      )}

      <div className="max-w-4xl mx-auto border-t border-slate-100 pt-12">
        <div className="text-center mb-8">
          <h3 className="text-xl font-black text-slate-900">Additional Documents</h3>
          <p className="text-slate-500 text-sm font-medium">Upload any additional documents requested by the admin or for specific verifications.</p>
        </div>
        <DocumentUpload user={user} role="student" />
      </div>
    </div>
  );
};
