// /Users/tejasgulati/Desktop/kartavya/client/src/pages/TaskDetailPage.js
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { toast } from 'react-hot-toast';
import api   from '../services/api'

const TaskDetailPage = ({ isNew = false }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    tags: [],
    estimatedHours: 0,
    actualHours: 0,
    attachments: []
  });
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const { 
    createTask, 
    updateTask, 
    getTaskById, 
    uploadAttachments, 
    downloadAttachment, 
    deleteAttachment 
  } = useTasks();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users if admin
        if (user?.role === 'admin') {
          const usersRes = await api.get('/api/users');
          setUsers(usersRes.data.users);
        }
        
        // Fetch task data if editing
        if (!isNew && id) {
          const task = await getTaskById(id);
          setFormData({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: new Date(task.dueDate).toISOString().split('T')[0],
            assignedTo: task.assignedTo?._id || '',
            tags: task.tags || [],
            estimatedHours: task.estimatedHours || 0,
            actualHours: task.actualHours || 0,
            attachments: task.attachments || []
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch task data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isNew, user?.role, getTaskById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const taskData = {
        ...formData,
        createdBy: user._id,
        assignedTo: formData.assignedTo || null,
        dueDate: new Date(formData.dueDate).toISOString()
      };

      if (isNew) {
        // Create new task with attachments
        await createTask({
          ...taskData,
          attachments: files
        });
        toast.success('Task created successfully');
      } else {
        // Update existing task
        await updateTask(id, taskData);
        toast.success('Task updated successfully');
      }
      navigate('/tasks');
    } catch (error) {
      // Error handling is done in the context functions
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/tasks/${id}`);
        toast.success('Task deleted successfully');
        navigate('/tasks');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    try {
      const updatedTask = await uploadAttachments(id, files);
      setFormData(prev => ({ ...prev, attachments: updatedTask.attachments }));
      setFiles([]);
    } catch (error) {
      // Error handling is done in the context function
    }
  };

  const handleDownload = async (filename) => {
    try {
      await downloadAttachment(id, filename);
    } catch (error) {
      toast.error(error || 'Download failed');
    }
  };

  const handleDeleteAttachment = async (filename) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment(id, filename);
        setFormData(prev => ({
          ...prev,
          attachments: prev.attachments.filter(a => a.filename !== filename)
        }));
      } catch (error) {
        toast.error(error || 'Failed to delete attachment');
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNew ? 'Create New Task' : 'Task Details'}
        </h1>
        {!isNew && (
          <button 
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Delete Task
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border ${errors.dueDate ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>
          
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              name="estimatedHours"
              min="0"
              max="1000"
              step="0.5"
              value={formData.estimatedHours}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Hours
            </label>
            <input
              type="number"
              name="actualHours"
              min="0"
              max="1000"
              step="0.5"
              value={formData.actualHours}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                setFormData(prev => ({ ...prev, tags }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="urgent, important, etc."
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (PDF only, max 3)
          </label>
          
          <div className="flex items-center mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf"
              className="flex-grow mr-2"
            />
            {!isNew && files.length > 0 && (
              <button
                type="button"
                onClick={handleUpload}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
              >
                Upload
              </button>
            )}
          </div>
          
          {(formData.attachments.length > 0 || files.length > 0) && (
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2">Attachments:</h3>
              <ul>
                {formData.attachments.map((att, index) => (
                  <li key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="truncate max-w-xs">{att.originalName}</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(att.filename)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.filename)}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {files.map((file, index) => (
                  <li key={`new-${index}`} className="flex justify-between items-center py-2 border-b">
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-sm text-gray-500">
                      {isNew ? 'Will be uploaded with task' : 'Ready to upload'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            {isNew ? 'Create Task' : 'Update Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskDetailPage;