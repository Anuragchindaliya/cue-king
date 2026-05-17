'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageTablesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [clubId, setClubId] = useState('');
  
  useEffect(() => {
    params.then(p => setClubId(p.id));
  }, [params]);

  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: 'Snooker Table',
    quantity: 1,
    pricePerHour: 200,
  });
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    const fetchTables = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/clubs/${clubId}`);
        const data = await res.json();
        if (data.success) {
          setTables(data.data.tableCategories || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [clubId]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      let imageUrl = '';
      if (image) {
        const formDataObj = new FormData();
        formDataObj.append('image', image);
        const res = await fetch('http://localhost:5001/api/uploads', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataObj
        });
        const data = await res.json();
        if (data.success) imageUrl = data.data.url;
      }

      const res = await fetch(`http://localhost:5001/api/clubs/${clubId}/table-categories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: formData.name,
          quantity: Number(formData.quantity),
          pricePerHour: Number(formData.pricePerHour),
          image: imageUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        setTables([...tables, data.data]);
        setFormData({ name: 'Snooker Table', quantity: 1, pricePerHour: 200 });
        setImage(null);
      } else {
        alert('Failed to add table: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding table');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link href="/owner/dashboard" className="text-gray-400 hover:text-white mb-2 inline-block">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-snookerGreen to-goldAccent">
              Manage Tables
            </h1>
          </div>
          <Link href="/owner/dashboard" className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Finish Setup
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4">Add Table Type</h2>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400">Type Name</label>
                  <select 
                    className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-snookerGreen"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  >
                    <option value="Snooker Table">Snooker Table</option>
                    <option value="8-Ball Pool Table">8-Ball Pool Table</option>
                    <option value="9-Ball Pool Table">9-Ball Pool Table</option>
                    <option value="Billiards Table">Billiards Table</option>
                    <option value="VIP Table">VIP Table</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Quantity</label>
                  <input type="number" min="1" required className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-snookerGreen"
                    value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Price Per Hour (₹)</label>
                  <input type="number" min="0" required className="mt-1 w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-snookerGreen"
                    value={formData.pricePerHour} onChange={e => setFormData({...formData, pricePerHour: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Table Image (Optional)</label>
                  <input type="file" accept="image/*" className="mt-1 w-full text-gray-400 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white"
                    onChange={e => setImage(e.target.files?.[0] || null)} />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-snookerGreen hover:bg-snookerGreen/80 text-white font-bold py-2 rounded-lg transition-colors mt-2"
                >
                  {submitting ? 'Adding...' : 'Add Table'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold">Current Tables</h2>
            {tables.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-8 rounded-xl text-center text-gray-400">
                No tables added yet.
              </div>
            ) : (
              tables.map(table => (
                <div key={table.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {table.image ? (
                      <div className="w-16 h-16 rounded bg-cover bg-center" style={{ backgroundImage: `url('http://localhost:5001${table.image}')` }} />
                    ) : (
                      <div className="w-16 h-16 rounded bg-white/10 flex items-center justify-center text-xs text-gray-500">No Img</div>
                    )}
                    <div>
                      <h4 className="font-bold">{table.name}</h4>
                      <p className="text-sm text-gray-400">{table.quantity} Tables • ₹{table.pricePerHour}/hr</p>
                    </div>
                  </div>
                  {/* Could add delete button here */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
