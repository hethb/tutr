import { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Sparkles, BookOpen, Video, Mic } from 'lucide-react';
import { useAuth } from '../services/auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError('No credential received from Google');
      return;
    }
    try {
      await login(response.credential);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="h-screen bg-tutr-darker flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
          <Sparkles size={16} className="text-tutr-accent" />
          <span className="text-sm font-medium text-tutr-accent-light">AI-Powered Tutoring</span>
        </div>

        <h1 className="text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-tutr-accent to-tutr-accent-light bg-clip-text text-transparent">
            Tutr
          </span>
        </h1>
        <p className="text-lg text-gray-400 max-w-sm mx-auto mb-10">
          Your personal AI study partner. Sign in to track your progress and pick up where you left off.
        </p>

        <div className="glass rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { icon: Video, label: 'Video calls' },
              { icon: Mic, label: 'Voice chat' },
              { icon: BookOpen, label: 'RAG tutoring' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 opacity-70">
                <div className="w-10 h-10 rounded-xl bg-tutr-accent/10 flex items-center justify-center">
                  <Icon size={18} className="text-tutr-accent" />
                </div>
                <span className="text-[10px] text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError('Google sign-in failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-3">{error}</p>
          )}

          <p className="text-[10px] text-gray-600 mt-4">
            We only use your name and email to save your progress. No data is shared.
          </p>
        </div>

        <p className="text-xs text-gray-600">
          Powered by Groq + ChromaDB. Free and open-source.
        </p>
      </div>
    </div>
  );
}
