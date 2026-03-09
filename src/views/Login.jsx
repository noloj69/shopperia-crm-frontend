import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useData();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Attempt Login via API
        try {
            const success = await login(username, password);
            if (!success) {
                setError('Username atau Password yang dimasukkan salah.');
            }
            // If success, DataContext updates state and App.jsx handles routing
        } catch (err) {
            setError('Terjadi kesalahan saat menghubungi server.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-brand-logo">
                        <span className="logo-icon">📦</span>
                        <span className="logo-text">Shopperia CRM</span>
                    </div>
                    <h2>Login Admin</h2>
                    <p className="login-slogan">"Siap membantu paket diterima dengan selamat.<br />Tidak ada kata menyerah sebelum di block customer dan kurir!"</p>
                </div>

                {error && (
                    <div className="login-error-alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="username">Email / No. HP</label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Masukkan email atau nomor HP"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Masukkan password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="login-submit-btn">
                        Masuk ke Dashboard
                    </button>
                </form>

                <div className="login-footer">
                    &copy; {new Date().getFullYear()} Shopperia CRM. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
