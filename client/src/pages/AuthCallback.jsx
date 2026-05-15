import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setAccessToken(token);
      // Fetch user data to hydrate context
      fetchMe().then(() => {
        navigate('/dashboard', { replace: true });
      }).catch(() => {
        navigate('/login', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, fetchMe]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 rounded-full border-2 border-[#22D3EE] border-t-transparent animate-spin" />
        <p className="mt-4 text-slate-400 font-display">Finalizing login...</p>
      </div>
    </div>
  );
}
