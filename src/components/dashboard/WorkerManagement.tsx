import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Worker } from '../../types';
import { firebaseStorage } from '../../utils/firebaseStorage';

interface WorkerManagementProps {
  agencyId: string;
  agencyName: string;
}

const WorkerManagement: React.FC<WorkerManagementProps> = ({ agencyId, agencyName }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    password: ''
  });

  useEffect(() => {
    loadWorkers();
  }, [agencyId]);

  const loadWorkers = async () => {
    try {
      const fetchedWorkers = await firebaseStorage.getWorkers(agencyId);
      setWorkers(fetchedWorkers);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (editingWorker) {
        // Update existing worker
        const updatedWorker = {
          ...editingWorker,
          name: formData.name,
          password: formData.password
        };
        await firebaseStorage.updateWorker(editingWorker.id, updatedWorker);
        setEditingWorker(null);
      } else {
        // Create new worker
        const exists = await firebaseStorage.workerExists(formData.name, agencyId);
        if (exists) {
          alert('Worker name already exists in this agency');
          setLoading(false);
          return;
        }

        const newWorker = {
          name: formData.name,
          password: formData.password,
          agencyId,
          createdAt: new Date()
        };
        
        await firebaseStorage.saveWorker(newWorker);
      }

      // Reset form
      setFormData({ name: '', password: '' });
      setIsFormOpen(false);
      await loadWorkers();
    } catch (error) {
      console.error('Error saving worker:', error);
      alert('Failed to save worker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setFormData({
      name: worker.name,
      password: worker.password
    });
    setEditingWorker(worker);
    setIsFormOpen(true);
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm('Are you sure you want to delete this worker? This action cannot be undone.')) {
      try {
        await firebaseStorage.deleteWorker(workerId);
        await loadWorkers();
      } catch (error) {
        console.error('Error deleting worker:', error);
        alert('Failed to delete worker. Please try again.');
      }
    }
  };

  const copyToClipboard = async (text: string, workerId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(workerId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (date: Date | any) => {
    const workerDate = date?.toDate ? date.toDate() : new Date(date);
    return workerDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Worker Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage workers for {agencyName}</p>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2">
              Total Workers: {workers.length}
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Worker
          </button>
        </div>
      </div>

      {/* Agency ID Info */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Agency ID</h3>
            <p className="text-lg font-mono text-blue-900 dark:text-blue-300 bg-white dark:bg-gray-700 px-3 py-2 rounded border dark:border-gray-600">
              {agencyId}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share this ID with workers for login</p>
          </div>
          <button
            onClick={() => copyToClipboard(agencyId, 'agency')}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            {copiedId === 'agency' ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy ID
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workers List */}
      <div className="p-6">
        {workers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No workers yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start by adding your first worker to manage orders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <div key={worker.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{worker.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Joined: {formatDate(worker.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(worker)}
                      className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded transition-colors"
                      title="Edit Worker"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(worker.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 rounded transition-colors"
                      title="Delete Worker"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Worker ID</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono flex-1 text-gray-900 dark:text-gray-200">
                        {worker.id.substring(0, 12)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(worker.id, worker.id)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy Worker ID"
                      >
                        {copiedId === worker.id ? (
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
                    <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-900 dark:text-gray-200">
                      {'•'.repeat(worker.password.length)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Worker Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingWorker ? 'Edit Worker' : 'Add New Worker'}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingWorker(null);
                    setFormData({ name: '', password: '' });
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Agency ID
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-mono text-sm">
                  {agencyId}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Worker will use this ID to login</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Worker Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Enter worker name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Enter password"
                  required
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Login Instructions for Worker:</h4>
                <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <li>1. Go to login page and select "Login as Worker"</li>
                  <li>2. Enter worker name: <strong>{formData.name || '[Worker Name]'}</strong></li>
                  <li>3. Enter password: <strong>{'•'.repeat(formData.password.length) || '[Password]'}</strong></li>
                </ol>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingWorker(null);
                    setFormData({ name: '', password: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingWorker ? 'Update Worker' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;