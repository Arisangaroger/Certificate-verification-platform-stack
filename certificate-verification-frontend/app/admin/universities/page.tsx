'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { universitiesApi } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface University {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  wallet_address?: string;
  did_identifier?: string;
  logo_url?: string;
  created_at: string;
}

export default function UniversitiesPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: universities, error, mutate } = useSWR(
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

  const handleOpenModal = (university?: University) => {
    if (university) {
      setEditingUniversity(university);
      setFormData({
        name: university.name,
        email: university.email,
        phone_number: university.phone_number || '',
        logo_url: university.logo_url || '',
      });
    } else {
      setEditingUniversity(null);
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        logo_url: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty optional fields to avoid validation errors
      const sanitizedData: any = {
        name: formData.name,
        email: formData.email,
      };

      // Only include optional fields if they have values
      if (formData.phone_number?.trim()) {
        sanitizedData.phone_number = formData.phone_number.trim();
      }
      if (formData.logo_url?.trim()) {
        sanitizedData.logo_url = formData.logo_url.trim();
      }

      if (editingUniversity) {
        await universitiesApi.update(editingUniversity.id, sanitizedData);
        toast.success('University updated successfully');
      } else {
        await universitiesApi.create(sanitizedData);
        toast.success('University created successfully');
      }
      mutate();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await universitiesApi.delete(id);
      toast.success('University deleted successfully');
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
          <h1 className="text-3xl font-bold text-slate-900">Universities</h1>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add University
          </button>
        </div>

        {error && (
          <div className="status-banner status-banner-error mb-6" role="alert">
            Failed to load universities
          </div>
        )}

        {!universities && !error && (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="skeleton-shimmer h-6 w-3/4 mb-4"></div>
                <div className="skeleton-shimmer h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {universities && universities.length === 0 && (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-lg font-medium text-slate-900 mb-2">No Universities</p>
            <p className="text-sm text-slate-600 mb-4">Get started by adding your first university</p>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              Add University
            </button>
          </div>
        )}

        {universities && universities.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {universities.map((university: University) => (
              <div key={university.id} className="card min-w-0 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{university.name}</h3>
                  <p className="text-sm text-slate-600 break-all">{university.email}</p>
                </div>

                {(university.phone_number || university.wallet_address || university.did_identifier) && (
                  <div className="space-y-3 mb-4">
                    {university.phone_number && (
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-0.5">Phone</p>
                        <p className="text-sm text-slate-700">{university.phone_number}</p>
                      </div>
                    )}
                    {university.wallet_address && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-1">Wallet</p>
                        <p className="font-mono text-sm leading-relaxed text-slate-700 break-all">{university.wallet_address}</p>
                      </div>
                    )}
                    {university.did_identifier && (
                      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 mb-1">DID</p>
                        <p className="font-mono text-sm leading-relaxed text-slate-700 break-all">{university.did_identifier}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(university)}
                    className="btn-secondary flex-1 text-sm py-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(university.id, university.name)}
                    className="btn-secondary text-red-600 hover:bg-red-50 flex-1 text-sm py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="overlay-in fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4 backdrop-blur-sm">
          <div className="card-prominent max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingUniversity ? 'Edit University' : 'Add University'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  University Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  maxLength={255}
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
                  placeholder="contact@university.edu"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="input-field"
                  placeholder="+1234567890"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-brand-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-brand-800 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium mb-1">Blockchain Identity Auto-Generated</p>
                    <p className="text-sm">Wallet address and DID identifier will be automatically created by the system.</p>
                  </div>
                </div>
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
                  {loading ? 'Saving...' : editingUniversity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
