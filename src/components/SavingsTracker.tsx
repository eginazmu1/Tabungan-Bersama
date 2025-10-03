import { useState, useEffect } from 'react';
import { supabase, type Profile, type Saving } from '../lib/supabase';
import { LogOut, Plus, Trash2, Wallet } from 'lucide-react';

type SavingsTrackerProps = {
  onLogout: () => void;
};

export function SavingsTracker({ onLogout }: SavingsTrackerProps) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      const { data: currentProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const { data: savingsData } = await supabase
        .from('savings')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) setProfiles(profilesData);
      if (currentProfileData) setCurrentUser(currentProfileData);
      if (savingsData) setSavings(savingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !amount) return;

    try {
      const { error } = await supabase.from('savings').insert([
        {
          user_id: currentUser.id,
          amount: parseFloat(amount),
          description: description.trim(),
        },
      ]);

      if (error) throw error;

      setAmount('');
      setDescription('');
      loadData();
    } catch (error) {
      console.error('Error adding saving:', error);
    }
  };

  const handleDeleteSaving = async (id: string) => {
    try {
      const { error } = await supabase.from('savings').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting saving:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const getProfileById = (userId: string) => {
    return profiles.find((p) => p.id === userId);
  };

  const calculateTotal = () => {
    return savings.reduce((sum, saving) => sum + Number(saving.amount), 0);
  };

  const calculateUserTotal = (userId: string) => {
    return savings
      .filter((s) => s.user_id === userId)
      .reduce((sum, saving) => sum + Number(saving.amount), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-emerald-600 text-lg">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-full">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Tabungan Berdua</h1>
                <p className="text-sm text-gray-600">Halo, {currentUser?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white mb-6">
            <p className="text-sm opacity-90 mb-2">Total Tabungan</p>
            <p className="text-4xl font-bold mb-4">{formatCurrency(calculateTotal())}</p>
            <div className="grid grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="bg-white/20 rounded-lg p-3">
                  <p className="text-xs opacity-90">{profile.name}</p>
                  <p className="text-lg font-semibold">{formatCurrency(calculateUserTotal(profile.id))}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddSaving} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="0"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan (opsional)
                </label>
                <input
                  id="description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Gaji, bonus, dll"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Tambah Tabungan
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Tabungan</h2>
          {savings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada tabungan</p>
          ) : (
            <div className="space-y-3">
              {savings.map((saving) => {
                const profile = getProfileById(saving.user_id);
                const isOwner = saving.user_id === currentUser?.id;

                return (
                  <div
                    key={saving.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{profile?.name}</span>
                        {isOwner && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(Number(saving.amount))}</p>
                      {saving.description && (
                        <p className="text-sm text-gray-600 mt-1">{saving.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(saving.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteSaving(saving.id)}
                        className="text-red-500 hover:text-red-700 transition p-2"
                        title="Hapus"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
