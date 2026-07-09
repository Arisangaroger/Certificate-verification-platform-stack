'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminUsersApi, universitiesApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { PasswordInput } from '@/components/PasswordInput';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  university_id: string;
  is_active: boolean;
  created_at: string;
  university?: {
    name: string;
    code: string;
  };
}

interface University {
  id: string;
  name: string;
  code: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'REGISTRAR',
    university_id: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: adminUsers, error, mutate } = useSWR(
    '/admin-users',
    () => adminUsersApi.getAll().then(res => res.data),
    { revalidateOnFocus: false }
  );

  const { data: universities } = useSWR(
    '/universities',
    () => universitiesApi.getAll().then(res => res.data),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user_data');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    const parsedUser = JSON.parse(user);
    if (parsedUser.role !== 'SUPER_ADMIN') {
      router.push('/admin/dashboard');
      return;
    }
    
    setUserData(parsedUser);
  }, [router]);

  const handleOpenModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        role: user.role,
        university_id: user.university_id,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'REGISTRAR',
        university_id: universities?.[0]?.id || '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        const updateData: any = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
        };
        await adminUsersApi.update(editingUser.id, updateData);
        toast.success('Admin user updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new users');
          setLoading(false);
          return;
        }
        await adminUsersApi.create(formData);
        toast.success('Admin user created successfully');
      }
      mutate();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      if (user.is_active) {
        await adminUsersApi.deactivate(user.id);
        toast.success('User deactivated');
      } else {
        await adminUsersApi.activate(user.id);
        toast.success('User activated');
      }
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await adminUsersApi.delete(id);
      toast.success('Admin user deleted successfully');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="skeleton-shimmer h-8 w-32"></div>
    </div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <a href="/admin/dashboard" className="text-sm text-brand-800 hover:text-brand-900 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Users</h1>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Admin User
          </button>
        </div>

        {error && (
          <div className="status-banner status-banner-error mb-6" role="alert">
            Failed to load admin users
          </div>
        )}

        {!adminUsers && !error && (
          <div className="card">
            <div className="skeleton-shimmer h-12 w-full mb-3"></div>
            <div className="skeleton-shimmer h-12 w-full mb-3"></div>
            <div className="skeleton-shimmer h-12 w-full"></div>
          </div>
        )}

        {adminUsers && adminUsers.length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No Admin Users</p>
            <p className="text-sm text-slate-600 mb-4">Add admin users to manage universities</p>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Add Admin User
            </button>
          </div>
        )}

        {adminUsers && adminUsers.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">University</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="py-3 px-4 text-right font-medium text-slate-700 w-52 min-w-52">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user: AdminUser) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{user.full_name}</td>
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                        user.role === 'SUPER_ADMIN' ? 'bg-gold-100 text-gold-700' :
                        user.role === 'REGISTRAR' ? 'bg-brand-100 text-brand-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.university?.name || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                        user.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex min-w-52 flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="whitespace-nowrap text-sm font-medium text-brand-800 hover:text-brand-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`whitespace-nowrap text-sm font-medium ${
                            user.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.full_name)}
                          className="whitespace-nowrap text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4 backdrop-blur-sm">
          <div className="card-prominent max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingUser ? 'Edit Admin User' : 'Add Admin User'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              {!editingUser && (
                <PasswordInput
                  id="password"
                  label="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              )}

              {!editingUser && formData.password && (
                <p className="text-sm text-slate-500">Minimum 8 characters</p>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="REGISTRAR">Registrar</option>
                  <option value="VIEWER">Viewer</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  University *
                </label>
                <select
                  value={formData.university_id}
                  onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                  className="input-field"
                  required
                  disabled={editingUser !== null}
                >
                  <option value="">Select University</option>
                  {universities?.map((uni: University) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
