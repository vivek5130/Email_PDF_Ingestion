"use client"
import React, { useState, useEffect } from 'react';

export default function EmailConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({
    emailAddress: '',
    connectionType: '',
    username: '',
    password: '',
    host: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/email-ingestion/config');
    const data = await res.json();
    setConfigs(data.configs);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId
      ? `/api/email-ingestion/config?id=${editId}`
      : '/api/email-ingestion/config';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await fetchConfigs();
      setForm({
        emailAddress: '',
        connectionType: '',
        username: '',
        password: '',
        host: '',
      });
      setEditId(null);
      // After saving a configuration, trigger the email check.
      await fetch('/api/email-ingestion/check-emails', { method: 'POST' });
    }
  };

  const handleEdit = (config) => {
    setForm({
      emailAddress: config.email,
      connectionType: config.connectionType,
      username: config.username,  
      password: config.password,
      host: config.host,
    });
    setEditId(config.id);
  };

  const handleDelete = async (id) => {
    await fetch(`/api/email-ingestion/config?id=${id}`, { method: 'DELETE' });
    fetchConfigs();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Email Configuration</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email Address: </label>
          <input
            type="email"
            name="emailAddress"
            value={form.emailAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Connection Type: </label>
          <select
            name="connectionType"
            value={form.connectionType}
            onChange={handleChange}
            required
          >
            <option value="">Select...</option>
            <option value="IMAP">IMAP</option>
            <option value="POP3">POP3</option>
            <option value="Gmail API">Gmail API</option>
            <option value="Outlook/Graph API">Outlook/Graph API</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Username: </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password/Token: </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Host: </label>
          <input
            type="text"
            name="host"
            value={form.host}
            onChange={handleChange}
          />
        </div>
        <button type="submit">
          {editId ? 'Update Configuration' : 'Add Configuration'}
        </button>
      </form>

      <h2>Saved Configurations</h2>
      {configs.length === 0 && <p>No email configurations added yet.</p>}
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {configs.map((config) => (
          <li
            key={config.id}
            style={{
              marginBottom: '15px',
              borderBottom: '1px solid #ccc',
              paddingBottom: '10px',
            }}
          >
            <strong>{config.emailAddress}</strong> - {config.connectionType}
            <div>Username: {config.username}</div>
            <div>Host: {config.host}</div>
            <button onClick={() => handleEdit(config)} style={{ marginRight: '10px' }}>
              Edit
            </button>
            <button onClick={() => handleDelete(config.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
