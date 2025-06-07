// /Users/tejasgulati/Desktop/kartavya/client/src/context/TaskContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTask, setCurrentTask] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const fetchTasks = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      // Add all filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          queryParams.append(key, value);
        }
      });

      const res = await api.get(`/api/tasks?${queryParams.toString()}`);
      setTasks(res.data.tasks);
      setPagination({
        page: res.data.page,
        limit: res.data.limit,
        total: res.data.total,
        pages: res.data.pages,
      });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch tasks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTaskById = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/tasks/${id}`);
      setCurrentTask(res.data.task);
      return res.data.task;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch task');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const formData = new FormData();
      
      // Append all task fields
      Object.entries(taskData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'attachments' && Array.isArray(value)) {
            value.forEach(file => {
              formData.append('attachments', file);
            });
          } else if (key === 'tags' && Array.isArray(value)) {
            value.forEach(tag => formData.append('tags', tag));
          } else if (key === 'dueDate') {
            formData.append(key, new Date(value).toISOString());
          } else {
            formData.append(key, value);
          }
        }
      });

      const res = await api.post('/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Task created successfully');
      return res.data.task;
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to create task');
      }
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      const res = await api.put(`/api/tasks/${id}`, taskData);
      toast.success('Task updated successfully');
      return res.data.task;
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.field}: ${err.message}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to update task');
      }
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success('Task deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
      throw error;
    }
  }, []);

  const uploadAttachments = useCallback(async (taskId, files) => {
    try {
      const formData = new FormData();
      
      if (files instanceof FileList) {
        Array.from(files).forEach(file => {
          formData.append('attachments', file);
        });
      } else if (Array.isArray(files)) {
        files.forEach(file => {
          formData.append('attachments', file);
        });
      } else {
        formData.append('attachments', files);
      }

      const res = await api.post(
        `/api/tasks/${taskId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Attachments uploaded successfully');
      return res.data.task;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload attachments');
      throw error;
    }
  }, []);

  const downloadAttachment = useCallback(async (taskId, filename) => {
    try {
      const res = await api.get(`/api/tasks/${taskId}/attachments/${filename}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download attachment');
      throw error;
    }
  }, []);

  const deleteAttachment = useCallback(async (taskId, filename) => {
    try {
      await api.delete(`/api/tasks/${taskId}/attachments/${filename}`);
      toast.success('Attachment deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete attachment');
      throw error;
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentTask,
        loading,
        pagination,
        fetchTasks,
        getTaskById,
        createTask,
        updateTask,
        deleteTask,
        uploadAttachments,
        downloadAttachment,
        deleteAttachment,
        setCurrentTask,
        setTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);