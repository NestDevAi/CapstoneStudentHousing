import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Lock, LogOut, Camera, ChevronRight, Save, X, Loader2, Building2, CreditCard, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/db';
import { useNotification } from '../../contexts/NotificationContext';

export const Profile = ({ user }: { user: any }) => {
  const { showNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    // Student specific
    university: user?.university || '',
    studentId: user?.student_id || '',
    course: user?.course || '',
    yearOfStudy: user?.year_of_study || '',
    // Landlord specific
    businessName: user?.business_name || '',
    tin: user?.tin || '',
    businessAddress: user?.business_address || '',
    website: user?.website || '',
  });

  const toggleEditing = () => {
    if (!isEditing) {
      setFormData({
        fullName: user?.full_name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        university: user?.university || '',
        studentId: user?.student_id || '',
        course: user?.course || '',
        yearOfStudy: user?.year_of_study || '',
        businessName: user?.business_name || '',
        tin: user?.tin || '',
        businessAddress: user?.business_address || '',
        website: user?.website || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatePayload: any = {
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
      };

      if (user.role === 'student') {
        updatePayload.university = formData.university;
        updatePayload.student_id = formData.studentId;
        updatePayload.course = formData.course;
        updatePayload.year_of_study = formData.yearOfStudy;
      } else if (user.role === 'landlord') {
        updatePayload.business_name = formData.businessName;
        updatePayload.tin = formData.tin;
        updatePayload.business_address = formData.businessAddress;
        updatePayload.website = formData.website;
      }

      const { error: profileError } = await db
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update related records if necessary
      if (user.role === 'student') {
        await db
          .from('bookings')
          .update({
            student_name: formData.fullName,
            student_phone: formData.phone
          })
          .eq('student_id', user.id);
      } else if (user.role === 'landlord') {
        await db
          .from('listings')
          .update({
            landlord_name: formData.fullName,
            landlord_phone: formData.phone,
            landlord_email: user.email || ''
          })
          .eq('landlord_id', user.id);

        await db
          .from('bookings')
          .update({
            landlord_name: formData.fullName,
            landlord_phone: formData.phone
          })
          .eq('landlord_id', user.id);
      }

      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[40px] bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-400 shadow-2xl shadow-slate-200">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-2 right-2 p-3 bg-orange-500 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">{user?.full_name || 'User'}</h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                user?.is_verified 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                {user?.is_verified ? 'Verified' : 'Unverified'} {user?.role || 'User'}
              </span>
            </div>
            <p className="text-slate-500 mb-6 font-medium capitalize">
              {user?.role} Member • Member since {user?.created_at ? new Date(user.created_at).getFullYear() : '2025'}
            </p>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-bold">{user?.phone || 'No phone set'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={toggleEditing}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 blur-[60px] rounded-full -mr-20 -mt-20"></div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm"
          >
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>

                {/* Role Specific Details */}
                {user.role === 'student' && (
                  <>
                    <div className="md:col-span-2 pt-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">University Details</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">University Name</label>
                      <input
                        type="text"
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                        placeholder="e.g. University of London"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Student ID</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                        placeholder="Enter your student ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Course / Major</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Year of Study</label>
                      <select
                        value={formData.yearOfStudy}
                        onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                      >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="Postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  </>
                )}

                {user.role === 'landlord' && (
                  <>
                    <div className="md:col-span-2 pt-4">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Business Information</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Business Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                          placeholder="e.g. Premium Rentals Ltd"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">TIN (Tax ID)</label>
                      <div className="relative">
                        <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={formData.tin}
                          onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                          placeholder="Enter your TIN"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Business Address</label>
                      <input
                        type="text"
                        value={formData.businessAddress}
                        onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                        placeholder="Enter business address"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address (Immutable)</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={user?.email}
                      className="w-full pl-14 pr-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={toggleEditing}
                  className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Personal Info */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Full Name', value: user?.full_name || 'Not set' },
                  { label: 'Email Address', value: user?.email },
                  { label: 'Phone Number', value: user?.phone || 'Not set' },
                  { label: 'Address', value: user?.address || 'Not set' },
                  { label: 'Role', value: user?.role || 'Not set' },
                ].map((field, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{field.label}</p>
                      <p className="text-sm font-bold text-slate-900">{field.value}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
                  </div>
                ))}
              </div>
            </div>

            {/* Role Specific Info */}
            {user.role === 'student' && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">University Details</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'University', value: user?.university || 'Not set' },
                    { label: 'Student ID', value: user?.student_id || 'Not set' },
                    { label: 'Course', value: user?.course || 'Not set' },
                    { label: 'Year of Study', value: user?.year_of_study || 'Not set' },
                  ].map((field, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{field.label}</p>
                        <p className="text-sm font-bold text-slate-900">{field.value}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user.role === 'landlord' && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Business Information</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { label: 'Business Name', value: user?.business_name || 'Not set' },
                    { label: 'TIN', value: user?.tin || 'Not set' },
                    { label: 'Business Address', value: user?.business_address || 'Not set' },
                    { label: 'Website', value: user?.website || 'Not set' },
                  ].map((field, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{field.label}</p>
                        <p className="text-sm font-bold text-slate-900">{field.value}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security & Notifications */}
            <div className="space-y-8 md:col-span-2">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Security & Privacy</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-900">Change Password</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
                  </button>
                  
                  <button className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-900">Notification Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
