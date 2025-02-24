"use client";
import React, { useState, useEffect } from 'react';
import './EmailConfigPage.css'; // Importing the CSS file

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
  const [checkResponse, setCheckResponse] = useState(null);
  const [loadingCheck, setLoadingCheck] = useState(false);

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

  // const handleDelete = async (id) => {
  //   console.log("Deleting config with ID:", id); 
  //   if (!id) {
  //     console.error("Error: ID is undefined or null");
  //     return;
  //   }
  //   await fetch(`/api/email-ingestion/config?id=${id}`, { method: 'DELETE' });
  //   fetchConfigs();
  // };
  
  const handleDelete = async (id) => {
    if (!id) return console.error("Invalid ID for deletion");
  
    try {
      const response = await fetch(`/api/email-ingestion/config?id=${id}`, { method: "DELETE" });
  
      if (response.ok) {
        fetchConfigs(); // Refresh the list after successful deletion
      } else {
        const errorData = await response.json();
        console.error("Delete failed:", errorData.error);
      }
    } catch (error) {
      console.error("Error deleting configuration:", error);
    }
  };
  
  const handleCheckEmails = async () => {
    setLoadingCheck(true);
    setCheckResponse(null);
    try {
      const res = await fetch('/api/email-ingestion/check-emails', { method: 'POST' });
      const data = await res.json();
      setCheckResponse(data);
    } catch (err) {
      console.error(err);
      setCheckResponse({ error: 'Failed to check emails' });
    }
    setLoadingCheck(false);
  };

  return (
    <div className="container">
      <h1>Email Configuration</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email Address:</label>
          <input type="email" name="emailAddress" value={form.emailAddress} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Connection Type:</label>
          <select name="connectionType" value={form.connectionType} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="IMAP">IMAP</option>
            <option value="POP3">POP3</option>
            <option value="Gmail API">Gmail API</option>
            <option value="Outlook/Graph API">Outlook/Graph API</option>
          </select>
        </div>
        <div className="form-group">
          <label>Username:</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Password/Token:</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Host:</label>
          <input type="text" name="host" value={form.host} onChange={handleChange} />
        </div>
        <button type="submit">{editId ? 'Update Configuration' : 'Add Configuration'}</button>
      </form>

      <h2>Saved Configurations</h2>
      {configs.length === 0 && <p>No email configurations added yet.</p>}
      <ul className="config-list">
        {configs.map((config) => (
          <li key={config.id} className="config-item">
            <strong>{config.emailAddress}</strong> - {config.connectionType}
            <div>Username: {config.username}</div>
            <div>Host: {config.host}</div>
            <div className="action-buttons">
              <button className="edit-btn" onClick={() => handleEdit(config)}>Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(config.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="check-email-section">
        <h2>Check Inbox</h2>
        <button onClick={handleCheckEmails} disabled={loadingCheck}>
          {loadingCheck ? 'Checking...' : 'Check Inbox Now'}
        </button>
        {checkResponse && <pre>{JSON.stringify(checkResponse, null, 2)}</pre>}
      </div>
    </div>
  );
}
