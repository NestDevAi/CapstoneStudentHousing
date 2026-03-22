import React, { useState, useRef } from 'react';
import { 
  Shield, 
  GraduationCap, 
  CheckCircle2, 
  Upload,
  Info,
  ArrowRight,
  Loader2,
  FileText,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../lib/db';
import { useNotification } from '../../contexts/NotificationContext';

interface StudentVerificationProps {
  user: any;
  onComplete: () => void;
}

export const StudentVerification: React.FC<StudentVerificationProps> = ({ user, onComplete }) => {
  const { showNotification } = useNotification();
  const [isUploading, setIsUploading] = useState(false);
  const govIdInputRef = useRef<HTMLInputElement>(null);
  const enrollmentCertInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: user.full_name || '',
    university: '',
    studentId: '',
    course: '',
    yearLevel: '1st Year',
    govId: null as File | null,
    enrollmentCert: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'govId' | 'enrollmentCert') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ ...errors, [field]: 'File size must be less than 5MB' });
        return;
      }
      setFormData({ ...formData, [field]: file });
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.university) newErrors.university = 'University is required';
    if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    if (!formData.govId) newErrors.govId = 'Government ID is required';
    if (!formData.enrollmentCert) newErrors.enrollmentCert = 'Enrollment certificate is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);
    setUploadStatus('Uploading documents (0%)...');
    try {
      const timestamp = Date.now();
      
      const progressMap: Record<string, number> = {};
      const updateOverallProgress = () => {
        const values = Object.values(progressMap);
        const avg = values.reduce((a, b) => a + b, 0) / (formData.govId && formData.enrollmentCert ? 2 : 1);
        if (avg === 0 && isUploading) {
          setUploadStatus('Starting upload... (If stuck at 0%, we will try an alternative method in 30s)');
        } else {
          setUploadStatus(`Uploading files (${Math.round(avg)}%)...`);
        }
      };

      const uploadToStorage = async (path: string, file: File, onProgress: (p: number) => void) => {
        const { data, error } = await supabase.storage.from('documents').upload(path, file);
        if (error) throw error;
        onProgress(100);
        return data.path;
      };

      const uploadPromises = [];
      if (formData.govId) {
        uploadPromises.push(uploadToStorage(
          `verifications/${user.id}/gov_id_${timestamp}_${formData.govId.name}`, 
          formData.govId,
          (p) => { progressMap['govId'] = p; updateOverallProgress(); }
        ));
      }
      if (formData.enrollmentCert) {
        uploadPromises.push(uploadToStorage(
          `verifications/${user.id}/enrollment_cert_${timestamp}_${formData.enrollmentCert.name}`, 
          formData.enrollmentCert,
          (p) => { progressMap['cert'] = p; updateOverallProgress(); }
        ));
      }

      const [govIdUrl, enrollmentCertUrl] = await Promise.all(uploadPromises);

      setUploadStatus('Updating profile...');
      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          university: formData.university,
          student_id: formData.studentId,
          course: formData.course,
          year_of_study: formData.yearLevel,
          pending_verification: true
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUploadStatus('Creating verification request...');
      // Create verification request
      const { error: verificationError } = await supabase.from('verifications').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: formData.fullName,
        role: 'student',
        status: 'Pending',
        type: 'Student Verification',
        gov_id_url: govIdUrl,
        enrollment_cert_url: enrollmentCertUrl,
        university: formData.university,
        student_id: formData.studentId,
        course: formData.course,
        year_level: formData.yearLevel
      });

      if (verificationError) throw verificationError;

      setUploadStatus('Complete!');
      onComplete();
    } catch (error: any) {
      console.error('Verification error:', error);
      const message = error.message || 'Unknown error';
      showNotification(`Failed to submit verification: ${message}. Please try again.`, 'error');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-2xl mb-4">
          <Shield className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Student Verification</h2>
        <p className="text-slate-500 text-lg">Complete your profile to start booking properties safely.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" /> Full Name
              </label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="As shown on your ID"
                className={`w-full px-4 py-3 bg-slate-50 border ${errors.fullName ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
              />
              {errors.fullName && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-400" /> University
              </label>
              <input 
                type="text" 
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="Enter your university"
                className={`w-full px-4 py-3 bg-slate-50 border ${errors.university ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
              />
              {errors.university && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{errors.university}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Student ID Number</label>
              <input 
                type="text" 
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="ID Number"
                className={`w-full px-4 py-3 bg-slate-50 border ${errors.studentId ? 'border-rose-500' : 'border-slate-200'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all`}
              />
              {errors.studentId && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{errors.studentId}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Year Level</label>
              <select 
                value={formData.yearLevel}
                onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>5th Year+</option>
                <option>Graduate</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Government Issued ID</label>
              <input 
                type="file" 
                ref={govIdInputRef}
                onChange={(e) => handleFileChange(e, 'govId')}
                className="hidden"
                accept="image/*,.pdf"
              />
              <div 
                onClick={() => govIdInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${
                  formData.govId ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  formData.govId ? 'bg-emerald-100' : 'bg-slate-50 group-hover:bg-orange-100'
                }`}>
                  {formData.govId ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">
                    {formData.govId ? formData.govId.name : 'Click to upload Government ID'}
                  </p>
                  <p className="text-xs text-slate-500">Passport, Driver's License, or National ID</p>
                </div>
              </div>
              {errors.govId && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{errors.govId}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Proof of Enrollment</label>
              <input 
                type="file" 
                ref={enrollmentCertInputRef}
                onChange={(e) => handleFileChange(e, 'enrollmentCert')}
                className="hidden"
                accept="image/*,.pdf"
              />
              <div 
                onClick={() => enrollmentCertInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${
                  formData.enrollmentCert ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-orange-500 hover:bg-orange-50/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  formData.enrollmentCert ? 'bg-emerald-100' : 'bg-slate-50 group-hover:bg-orange-100'
                }`}>
                  {formData.enrollmentCert ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-900">
                    {formData.enrollmentCert ? formData.enrollmentCert.name : 'Click to upload Enrollment Certificate'}
                  </p>
                  <p className="text-xs text-slate-500">Certificate of Enrollment or School ID</p>
                </div>
              </div>
              {errors.enrollmentCert && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{errors.enrollmentCert}</p>}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-blue-900 mb-1">Verification Process</h5>
              <p className="text-xs text-blue-700 leading-relaxed">
                Our team will review your documents within 24-48 hours. Once verified, you'll get a "Verified Student" badge and full access to booking.
              </p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isUploading}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadStatus}</span>
              </div>
            ) : (
              <>
                Submit for Verification <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
