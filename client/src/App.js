// /Users/tejasgulati/Desktop/kartavya/client/src/App.js
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage';
import RegisterPage from './pages/RegisterPage';
import TaskDetailPage from './pages/TaskDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import UsersPage from './pages/UsersPage';
import { Toaster } from 'react-hot-toast';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
  </div>;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/tasks" replace />;
  
  return children;
};

const Layout = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  
  const isActive = (path) => location.pathname.startsWith(path);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-xl font-bold text-indigo-600">Kartavya</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/tasks"
                    className={`${isActive('/tasks') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Tasks
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/users"
                      className={`${isActive('/users') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Users
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className={`${isActive('/profile') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Profile
                  </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff'
            }
          }
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tasks" element={
          <PrivateRoute>
            <Layout>
              <TasksPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/tasks/new" element={
          <PrivateRoute>
            <Layout>
              <TaskDetailPage isNew />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/tasks/:id" element={
          <PrivateRoute>
            <Layout>
              <TaskDetailPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Layout>
              <UserProfilePage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute adminOnly>
            <Layout>
              <UsersPage />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </>
  );
}

export default App;