import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User as UserIcon, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0c0a09 0%, #000000 100%)',
      fontFamily: 'var(--font-sans)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow design */}
      <div 
        className="absolute pointer-events-none rounded-full blur-[160px] opacity-[0.04]" 
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #FF7A00 0%, transparent 80%)',
          top: '-10%',
          right: '-10%',
        }}
      />
      <div 
        className="absolute pointer-events-none rounded-full blur-[160px] opacity-[0.03]" 
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #00A3FF 0%, transparent 80%)',
          bottom: '-10%',
          left: '-10%',
        }}
      />

      <div className="glass-panel w-full max-w-[420px] p-8 flex flex-col gap-6 animate-slide-up" style={{
        background: 'rgba(9, 9, 11, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header Logo & Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255, 122, 0, 0.1)',
            border: '1.5px solid #FF7A00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 122, 0, 0.25)',
          }}>
            <Shield size={24} style={{ color: '#FF7A00' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              KSP Crime Copilot
            </h1>
            <p style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Intelligence &amp; Decision Support Platform
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#ef4444',
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Access ID
            </label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input 
                type="text" 
                placeholder="Enter access ID (e.g. suresh)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field w-full"
                style={{
                  paddingLeft: '38px',
                  height: '42px',
                  fontSize: '13px',
                  background: 'rgba(20, 20, 23, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Secret Decryption Key
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                style={{
                  paddingLeft: '38px',
                  height: '42px',
                  fontSize: '13px',
                  background: 'rgba(20, 20, 23, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-glow" 
            style={{ 
              height: '44px', 
              width: '100%', 
              justifyContent: 'center', 
              fontSize: '14px', 
              fontWeight: 700,
              marginTop: '8px'
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="typing-dot" style={{ background: '#fff' }}></span>
                <span className="typing-dot" style={{ background: '#fff' }}></span>
                <span className="typing-dot" style={{ background: '#fff' }}></span>
              </div>
            ) : (
              <span>Authenticate &amp; Decrypt</span>
            )}
          </button>
        </form>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '16px', textAlign: 'center', fontSize: '11px', color: '#52525b' }}>
          🔒 Restricted to Karnataka State Police authorised personnel.
        </div>
      </div>
    </div>
  );
};
