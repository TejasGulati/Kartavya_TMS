// /Users/tejasgulati/Desktop/kartavya/client/src/context/AuthContext.js
import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token') || null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      // Call backend logout endpoint
      await api.post('/api/auth/logout');
      
      // Clear local storage and state
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      
      // Redirect to login and show success message
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if logout API fails, we still want to clear local state
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      navigate('/login');
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  }, [navigate]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (state.token) {
          const res = await api.get('/api/auth/me');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data, token: state.token },
          });
        }
      } catch (error) {
        logout();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    verifyToken();
  }, [state.token, logout]);

  const register = useCallback(async (name, email, password) => {
    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password,
      });
      
      toast.success('Registration successful! Please login');
      navigate('/login');
      dispatch({ type: 'REGISTER_SUCCESS' });
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
      throw error;
    }
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: res.data.user, token: res.data.token },
      });
      toast.success('Login successful!');
      navigate('/tasks');
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Invalid credentials. Please try again.'
      );
      throw error;
    }
  }, [navigate]);

  const getAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/users');
      return res.data.users;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to fetch users. Please try again.'
      );
      throw error;
    }
  }, []);

  const getUserById = useCallback(async (userId) => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      return res.data.user;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to fetch user. Please try again.'
      );
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userId, userData) => {
    try {
      const res = await api.put(`/api/users/${userId}`, userData);
      if (userId === state.user?._id) {
        dispatch({ type: 'SET_USER', payload: res.data.user });
      }
      toast.success('Profile updated successfully');
      return res.data;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
      throw error;
    }
  }, [state.user?._id]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await api.delete(`/api/users/${userId}`);
      if (userId === state.user?._id) {
        logout();
      }
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete user. Please try again.'
      );
      throw error;
    }
  }, [logout, state.user?._id]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        getAllUsers,
        getUserById,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);