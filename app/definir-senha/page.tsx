'use client';

import { useEffect, useState } from 'react';
import { brandLogo } from '../../components/brand';

export default function DefinirSenha() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const query = new URLSearchParams(location.search);
    setToken(hash.get('access_token') || query.get('access_token') || '');
  }, []);
  const save = async () => {
    if (password.length < 8) { setMessage('A senha deve possuir pelo menos 8 caracteres.'); return; }
    if (password !== confirm) { setMessage('As senhas não coincidem.'); return; }
    setBusy(true);
    const response = await fetch('/api/client-access', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token, password }) });
    const result = await response.json();
    if (response.ok) { setMessage('Senha criada com sucesso. Você já pode entrar na Central.'); setTimeout(() => (location.href = '/login'), 1200); }
    else setMessage(result.error || 'Não foi possível criar a senha.');
    setBusy(false);
  };
  return (
    <main className="password-page"><section className="password-card">
      <img className="password-logo" src={brandLogo} alt="Escala Vendas" />
      <span className="eyebrow">Central Escala Growth</span><h1>Crie sua senha</h1>
      <p className="password-intro">Defina uma senha segura para acessar a jornada da sua empresa.</p>
      {!token ? <p className="error">Este convite é inválido ou não possui o token de acesso.</p> : <div className="password-form">
        <label>Nova senha<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label>Confirmar senha<input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Salvando...' : 'CRIAR MINHA SENHA E ACESSAR'}</button>
      </div>}
      {message && <p className={message.includes('sucesso') ? 'success' : 'error'}>{message}</p>}
    </section></main>
  );
}

