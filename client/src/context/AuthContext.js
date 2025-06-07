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

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
    toast.success('Logged out successfully');
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

  const register = useCallback(async (name, email, password, role = 'user') => {
    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password,
        role
      });
      toast.success('Registration successful! Please login');
      navigate('/login');
      dispatch({ type: 'REGISTER_SUCCESS' });
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.response?.data?.errors?.map(e => e.message).join(', ') || 
        'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    }
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { 
          user: res.data.user, 
          token: res.data.token 
        },
      });
      toast.success('Login successful!');
      navigate('/tasks');
      return res.data;
    } catch (error) {
      const message = error.response?.data?.message || 
        error.response?.data?.errors?.map(e => e.message).join(', ') || 
        'Invalid credentials. Please try again.';
      toast.error(message);
      throw error;
    }
  }, [navigate]);

  const getAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/users');
      return res.data.users;
    } catch (error) {
      const message = error.response?.data?.message || 
        'Failed to fetch users. Please try again.';
      toast.error(message);
      throw error;
    }
  }, []);

  const getUserById = useCallback(async (userId) => {
    try {
      const res = await api.get(`/api/users/${userId}`);
      return res.data.user;
    } catch (error) {
      const message = error.response?.data?.message || 
        'Failed to fetch user. Please try again.';
      toast.error(message);
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
      const message = error.response?.data?.message || 
        error.response?.data?.errors?.map(e => e.message).join(', ') || 
        'Failed to update profile. Please try again.';
      toast.error(message);
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
      const message = error.response?.data?.message || 
        'Failed to delete user. Please try again.';
      toast.error(message);
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