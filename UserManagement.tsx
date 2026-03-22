import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ShieldCheck,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  XCircle
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '../../../contexts/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface User {
  id: string;
  username?: string;
  email?: string;
  fullName?: string;
  role: 'student' | 'landlord' | 'admin';
  verified?: boolean;
  status?: 'Active' | 'Suspended' | 'Pending';
  suspensionReason?: string;
  lastLogin?: any;
  createdAt: any;
}

export const UserManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'landlord' | 'admin'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [activityData, setActivityData] = useState<Record<string, { bookings: number, listings: number }>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('Violation of Terms');
  const [actionType, setActionType] = useState<'Suspended' | 'Restricted'>('Suspended');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
      } else {
        // Map Supabase fields to the User interface
        const mappedUsers = (data || []).map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          verified: u.is_verified,
          status: u.status,
          suspensionReason: u.suspension_reason,
          lastLogin: u.last_login,
          createdAt: u.created_at
        }));
        setUsers(mappedUsers as User[]);
      }
      setLoading(false);
    };

    fetchUsers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: bookings, error: bookingsError } = await supabase.from('bookings').select('student_id, landlord_id');
      const { data: listings, error: listingsError } = await supabase.from('listings').select('landlord_id');

      if (bookingsError || listingsError) {
        console.error('Error fetching activity counts:', bookingsError || listingsError);
        return;
      }

      const counts: Record<string, { bookings: number, listings: number }> = {};
      
      bookings?.forEach(b => {
        if (b.student_id) {
          if (!counts[b.student_id]) counts[b.student_id] = { bookings: 0, listings: 0 };
          counts[b.student_id].bookings++;
        }
        if (b.landlord_id) {
          if (!counts[b.landlord_id]) counts[b.landlord_id] = { bookings: 0, listings: 0 };
          counts[b.landlord_id].bookings++;
        }
      });

      listings?.forEach(l => {
        if (l.landlord_id) {
          if (!counts[l.landlord_id]) counts[l.landlord_id] = { bookings: 0, listings: 0 };
          counts[l.landlord_id].listings++;
        }
      });

      setActivityData(counts);
    };

    fetchActivity();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (currentStatus === 'Active' || !currentStatus) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setActionType('Suspended');
        setIsSuspensionModalOpen(true);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'Active',
          suspension_reason: null 
        })
        .eq('id', userId);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const confirmSuspension = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: actionType,
          suspension_reason: suspensionReason
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;

      setIsSuspensionModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const openDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  useEffect(() => {
    if (!isDetailsModalOpen || !selectedUser) {
      setRecentActions([]);
      return;
    }

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`target_id.eq.${selectedUser.id},admin_id.eq.${selectedUser.id}`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setRecentActions(data || []);
      }
    };

    fetchLogs();
  }, [isDetailsModalOpen, selectedUser?.id]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' ? user.verified === true : user.verified === false);

    return matchesSearch && matchesRole && matchesVerification;
  });

  const stats = [
    { label: 'Total Users', value: users.length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: 'Students', value: users.filter(u => u.role === 'student').length, icon: <UserCheck className="w-6 h-6" />, color: 'bg-emerald-500' },
    { label: 'Landlords', value: users.filter(u => u.role === 'landlord').length, icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-orange-500' },
    { label: 'Suspended', value: users.filter(u => u.status === 'Suspended').length, icon: <UserX className="w-6 h-6" />, color: 'bg-rose-500' },
    { label: 'Restricted', value: users.filter(u => u.status === 'Restricted').length, icon: <Ban className="w-6 h-6" />, color: 'bg-amber-500' },
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
            <div className="flex items-center justify-between mb-4">
              <div className={cn(stat.color, "p-4 rounded-2xl text-white shadow-lg shadow-opacity-20 group-hover:scale-110 transition-transform")}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900">{stat.value.toLocaleString()}</h3>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-lg font-bold text-slate-900">All Users</h4>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="landlord">Landlords</option>
              <option value="admin">Admins</option>
            </select>
            <select 
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Join Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white",
                        user.role === 'student' ? 'bg-blue-500' : 'bg-orange-500'
                      )}>
                        {(user.fullName || user.username || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <button 
                        onClick={() => openDetails(user)}
                        className="text-left hover:opacity-70 transition-opacity"
                      >
                        <p className="text-sm font-bold text-slate-900">{user.fullName || user.username}</p>
                        <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      user.role === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Bookings:</span>
                        <span className="text-xs font-bold text-slate-700">{activityData[user.id]?.bookings || 0}</span>
                      </div>
                      {user.role === 'landlord' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Listings:</span>
                          <span className="text-xs font-bold text-slate-700">{activityData[user.id]?.listings || 0}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Last Login:</span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {user.verified ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-200" />
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-slate-500 font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      user.status === 'Active' || !user.status ? 'bg-emerald-50 text-emerald-600' : 
                      user.status === 'Suspended' ? 'bg-rose-50 text-rose-600' : 
                      user.status === 'Restricted' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                    )}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openDetails(user)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.status || 'Active')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          (user.status === 'Suspended' || user.status === 'Restricted') ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50" : "text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                        )}
                        title={(user.status === 'Suspended' || user.status === 'Restricted') ? 'Activate User' : 'Suspend/Restrict User'}
                      >
                        {(user.status === 'Suspended' || user.status === 'Restricted') ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-500 font-medium">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspension Reason Modal */}
      {isSuspensionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Manage User Access</h3>
              <p className="text-sm text-slate-500 mt-1">Select action for {selectedUser?.fullName || selectedUser?.username}.</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Action Type</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setActionType('Restricted')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-sm font-bold border transition-all",
                      actionType === 'Restricted' ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    Restrict
                  </button>
                  <button 
                    onClick={() => setActionType('Suspended')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-sm font-bold border transition-all",
                      actionType === 'Suspended' ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    Suspend
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Reason</label>
                <select 
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="Violation of Terms">Violation of Terms</option>
                  <option value="Multiple Fraud Reports">Multiple Fraud Reports</option>
                  <option value="Inactivity">Inactivity</option>
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {suspensionReason === 'Other' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Custom Reason</label>
                  <textarea 
                    placeholder="Enter custom reason..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all min-h-[100px]"
                    onChange={(e) => setSuspensionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setIsSuspensionModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSuspension}
                className={cn(
                  "px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg",
                  actionType === 'Restricted' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                )}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">User Details</h3>
                <p className="text-sm text-slate-500 mt-1">Full profile information for {selectedUser.fullName || selectedUser.username}</p>
              </div>
              <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                  <p className="text-slate-900 font-medium">{selectedUser.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email Address</label>
                  <p className="text-slate-900 font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Role</label>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {selectedUser.role}
                    </span>
                    <select 
                      value={selectedUser.role}
                      onChange={async (e) => {
                        const newRole = e.target.value as any;
                        try {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ role: newRole })
                            .eq('id', selectedUser.id);
                          
                          if (error) throw error;
                          
                          setSelectedUser({ ...selectedUser, role: newRole });
                          showNotification(`User role updated to ${newRole}.`, 'success');
                        } catch (error: any) {
                          console.error('Error updating role:', error);
                          showNotification(error.message || 'Failed to update role.', 'error');
                        }
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="student">Student</option>
                      <option value="landlord">Landlord</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                  <p className="text-slate-900 font-medium">{(selectedUser as any).phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Address</label>
                  <p className="text-slate-900 font-medium">{(selectedUser as any).address || 'N/A'}</p>
                </div>

                {selectedUser.role === 'student' && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">University Details</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">University</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).university || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Student ID</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).student_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Course</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).course || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Year</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).year_of_study || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedUser.role === 'landlord' && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block">Business Information</label>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Business Name</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).business_name || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">TIN</p>
                          <p className="text-sm font-bold text-slate-900">{(selectedUser as any).tin || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Website</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{(selectedUser as any).website || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Business Address</p>
                        <p className="text-sm font-bold text-slate-900">{(selectedUser as any).business_address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-3">Activity Summary</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bookings</p>
                      <p className="text-lg font-bold text-slate-900">{activityData[selectedUser.id]?.bookings || 0}</p>
                    </div>
                    {selectedUser.role === 'landlord' && (
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Listings</p>
                        <p className="text-lg font-bold text-slate-900">{activityData[selectedUser.id]?.listings || 0}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Documents Section */}
                {selectedUser.verified && (
                  <div className="pt-4 border-t border-slate-50">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-3">Verification Documents</label>
                    <button
                      onClick={async () => {
                        const { data, error } = await supabase
                          .from('verifications')
                          .select('*')
                          .eq('user_id', selectedUser.id)
                          .eq('status', 'Approved')
                          .order('created_at', { ascending: false })
                          .limit(1)
                          .single();
                        
                        if (data && data.documents) {
                          // Open documents in new tabs
                          data.documents.forEach((doc: any) => {
                            window.open(doc.url, '_blank');
                          });
                        } else {
                          showNotification('No verification documents found.', 'info');
                        }
                      }}
                      className="w-full py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Verified Documents
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    selectedUser.status === 'Active' || !selectedUser.status ? 'bg-emerald-50 text-emerald-600' : 
                    selectedUser.status === 'Suspended' ? 'bg-rose-50 text-rose-600' : 
                    selectedUser.status === 'Restricted' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  )}>
                    {selectedUser.status || 'Active'}
                  </span>
                </div>
                {(selectedUser.status === 'Suspended' || selectedUser.status === 'Restricted') && selectedUser.suspensionReason && (
                  <div>
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest block mb-1",
                      selectedUser.status === 'Suspended' ? "text-rose-500" : "text-amber-500"
                    )}>{selectedUser.status} Reason</label>
                    <div className={cn(
                      "p-4 border rounded-2xl",
                      selectedUser.status === 'Suspended' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-amber-50 border-amber-100 text-amber-700"
                    )}>
                      <p className="text-sm font-medium">{selectedUser.suspensionReason}</p>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-3">Login History</label>
                  <div className="space-y-3">
                    {recentActions.filter(a => a.action.toLowerCase().includes('login')).length > 0 ? (
                      recentActions.filter(a => a.action.toLowerCase().includes('login')).map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{action.action}</p>
                            <p className="text-[10px] text-slate-500">{action.created_at ? new Date(action.created_at).toLocaleString() : 'Recently'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Last Login</p>
                          <p className="text-[10px] text-slate-500">
                            {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Join Date</label>
                  <p className="text-slate-900 font-medium">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-bold text-violet-500 uppercase tracking-widest block mb-3">Recent Actions</label>
                  <div className="space-y-3">
                    {recentActions.length > 0 ? (
                      recentActions.map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                          <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{action.action}</p>
                            <p className="text-[10px] text-slate-500">{action.created_at ? new Date(action.created_at).toLocaleString() : 'Recently'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No recent actions recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-end">
              <button 
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
