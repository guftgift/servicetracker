import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';

export default function SourceCodeViewer() {
  const [copied, setCopied] = useState('');
  const [expandedFiles, setExpandedFiles] = useState({});

  const copyToClipboard = (text, filename) => {
    navigator.clipboard.writeText(text);
    setCopied(filename);
    setTimeout(() => setCopied(''), 2000);
  };

  const toggleFile = (filename) => {
    setExpandedFiles(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const files = [
    {
      name: 'package.json',
      language: 'json',
      code: `{
  "name": "line-support-ticket",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.0.0"
  }
}`
    },
    {
      name: 'vite.config.js',
      language: 'javascript',
      code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})`
    },
    {
      name: 'index.html',
      language: 'html',
      code: `<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LINE Support Ticket System</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
    },
    {
      name: 'src/main.jsx',
      language: 'javascript',
      code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
    },
    {
      name: 'src/index.css',
      language: 'css',
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
    },
    {
      name: 'src/App.jsx',
      language: 'javascript',
      code: `import React, { useState, useEffect } from 'react';
import { Ticket, Clock, User, Mail, Phone, MessageSquare, CheckCircle, AlertCircle, Calendar, TrendingDown, Database, RefreshCw } from 'lucide-react';

const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value ? { key, value } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async list(prefix) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix || ''));
    return { keys };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  }
};

export default function SupportTicketApp() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [estimateModal, setEstimateModal] = useState(null);
  const [closeModal, setCloseModal] = useState(null);
  const [showGoogleSheetSetup, setShowGoogleSheetSetup] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    email: '',
    phone: '',
    issue: '',
    description: ''
  });
  const [estimateData, setEstimateData] = useState({
    estimatedMandays: ''
  });
  const [closeData, setCloseData] = useState({
    actualMandays: '',
    remainingMandays: ''
  });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadTickets();
    loadCustomers();
    loadGoogleSheetUrl();
  }, []);

  const loadGoogleSheetUrl = async () => {
    try {
      const result = await storage.get('google-sheet-url');
      if (result) {
        setGoogleSheetUrl(result.value);
      }
    } catch (error) {
      console.log('No Google Sheet URL saved');
    }
  };

  const saveGoogleSheetUrl = async (url) => {
    try {
      await storage.set('google-sheet-url', url);
      setGoogleSheetUrl(url);
      showNotification('บันทึก Google Sheet URL สำเร็จ', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึก URL', 'error');
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await storage.get('customers-data');
      if (result) {
        setCustomers(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No customers data');
      setCustomers([]);
    }
  };

  const fetchGoogleSheetData = async () => {
    if (!googleSheetUrl) {
      showNotification('กรุณาตั้งค่า Google Sheet URL ก่อน', 'error');
      setShowGoogleSheetSetup(true);
      return;
    }

    setLoading(true);
    try {
      const match = googleSheetUrl.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        showNotification('URL ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', 'error');
        setLoading(false);
        return;
      }

      const spreadsheetId = match[1];
      const csvUrl = \`https://docs.google.com/spreadsheets/d/\${spreadsheetId}/export?format=csv\`;

      const response = await fetch(csvUrl);
      const csvText = await response.text();

      const lines = csvText.split('\\n');
      const customersData = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length >= 2) {
            customersData.push({
              id: \`customer-\${i}\`,
              name: values[0],
              totalMandays: parseFloat(values[1]) || 0,
              usedMandays: parseFloat(values[2]) || 0,
              remainingMandays: parseFloat(values[1]) - parseFloat(values[2] || 0)
            });
          }
        }
      }

      await storage.set('customers-data', JSON.stringify(customersData));
      setCustomers(customersData);
      showNotification(\`โหลดข้อมูลลูกค้า \${customersData.length} รายการสำเร็จ\`, 'success');
    } catch (error) {
      console.error('Error fetching Google Sheet:', error);
      showNotification('ไม่สามารถดึงข้อมูลจาก Google Sheet ได้', 'error');
    }
    setLoading(false);
  };

  const loadTickets = async () => {
    try {
      const result = await storage.list('ticket:');
      if (result && result.keys) {
        const ticketPromises = result.keys.map(async (key) => {
          const data = await storage.get(key);
          return data ? JSON.parse(data.value) : null;
        });
        const loadedTickets = (await Promise.all(ticketPromises)).filter(Boolean);
        setTickets(loadedTickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch (error) {
      console.log('No existing tickets');
      setTickets([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const selectedCustomer = customers.find(c => c.id === value);
      if (selectedCustomer) {
        setFormData({
          ...formData,
          customerId: value,
          customerName: selectedCustomer.name
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.issue) {
      showNotification('กรุณาเลือกลูกค้าและกรอกปัญหา', 'error');
      return;
    }

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    const newTicket = {
      id: Date.now().toString(),
      ...formData,
      customerRemainingMandays: selectedCustomer.remainingMandays,
      createdAt: new Date().toISOString(),
      status: 'pending-estimate'
    };

    await storage.set(\`ticket:\${newTicket.id}\`, JSON.stringify(newTicket));
    setTickets([newTicket, ...tickets]);
    setFormData({ customerId: '', customerName: '', email: '', phone: '', issue: '', description: '' });
    setShowForm(false);
    showNotification('สร้างรายการสำเร็จ', 'success');
  };

  const openEstimateModal = (ticket) => {
    setEstimateModal(ticket);
    setEstimateData({ estimatedMandays: '' });
  };

  const handleEstimateSubmit = async () => {
    if (!estimateData.estimatedMandays || parseFloat(estimateData.estimatedMandays) <= 0) {
      showNotification('กรุณากรอก Manday ที่ถูกต้อง', 'error');
      return;
    }

    const updatedTicket = {
      ...estimateModal,
      status: 'waiting-approval',
      estimatedMandays: parseFloat(estimateData.estimatedMandays),
      estimatedAt: new Date().toISOString()
    };

    await storage.set(\`ticket:\${updatedTicket.id}\`, JSON.stringify(updatedTicket));
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setEstimateModal(null);
    showNotification('ส่งการประเมินแล้ว', 'success');
  };

  const handleCustomerApprove = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updatedTicket = { ...ticket, status: 'in-progress', approvedAt: new Date().toISOString() };
    await storage.set(\`ticket:\${ticketId}\`, JSON.stringify(updatedTicket));
    setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
    showNotification('ลูกค้ายืนยันแล้ว', 'success');
  };

  const handleCustomerReject = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updatedTicket = { ...ticket, status: 'rejected', rejectedAt: new Date().toISOString() };
    await storage.set(\`ticket:\${ticketId}\`, JSON.stringify(updatedTicket));
    setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
    showNotification('ลูกค้าปฏิเสธ', 'error');
  };

  const openCloseModal = (ticket) => {
    setCloseModal(ticket);
    setCloseData({ actualMandays: '', remainingMandays: ticket.estimatedMandays?.toString() || '' });
  };

  const handleCloseSubmit = async () => {
    if (!closeData.actualMandays) {
      showNotification('กรุณากรอก Manday ที่ใช้จริง', 'error');
      return;
    }

    const updatedTicket = {
      ...closeModal,
      status: 'waiting-confirmation',
      actualMandays: parseFloat(closeData.actualMandays),
      remainingMandays: parseFloat(closeData.remainingMandays),
      completedAt: new Date().toISOString()
    };

    await storage.set(\`ticket:\${updatedTicket.id}\`, JSON.stringify(updatedTicket));
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setCloseModal(null);
    showNotification('ส่งให้ลูกค้ายืนยัน', 'success');
  };

  const handleCustomerConfirm = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const customer = customers.find(c => c.id === ticket.customerId);
    
    if (customer) {
      const updatedCustomer = {
        ...customer,
        usedMandays: customer.usedMandays + ticket.actualMandays,
        remainingMandays: customer.remainingMandays - ticket.actualMandays
      };
      const updatedCustomers = customers.map(c => c.id === customer.id ? updatedCustomer : c);
      await storage.set('customers-data', JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
    }

    const updatedTicket = { ...ticket, status: 'closed', confirmedAt: new Date().toISOString() };
    await storage.set(\`ticket:\${ticketId}\`, JSON.stringify(updatedTicket));
    setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
    showNotification(\`ลูกค้ายืนยัน! หัก \${ticket.actualMandays} Manday\`, 'success');
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending-estimate': 'bg-purple-100 text-purple-800',
      'waiting-approval': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'waiting-confirmation': 'bg-orange-100 text-orange-800',
      'closed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending-estimate': 'รอประเมิน',
      'waiting-approval': 'รอยืนยัน',
      'rejected': 'ปฏิเสธ',
      'in-progress': 'กำลังทำ',
      'waiting-confirmation': 'รอยืนยันผล',
      'closed': 'ปิดแล้ว'
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold">Support Ticket System</h1>
          <p className="text-gray-600">ระบบจัดการ Ticket พร้อม Google Sheet</p>
        </div>
      </div>
    </div>
  );
}`
    },
    {
      name: 'README.md',
      language: 'markdown',
      code: `# LINE Support Ticket System

ระบบจัดการ Support Ticket สำหรับ LINE Mini Application

## ฟีเจอร์

- ✅ สร้างและจัดการ Ticket
- 📊 เชื่อมต่อ Google Sheet
- ⏱️ ติดตาม Manday
- 🔄 Workflow ครบวงจร

## ติดตั้ง

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy

\`\`\`bash
npm run build
\`\`\`

Deploy บน Vercel หรือ Netlify`
    },
    {
      name: '.gitignore',
      language: 'text',
      code: `node_modules
dist
dist-ssr
*.local
.DS_Store`
    },
    {
      name: 'vercel.json',
      language: 'json',
      code: `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📦 LINE Support Ticket - Source Code
          </h1>
          <p className="text-gray-600 mb-6">
            คัดลอกโค้ดแต่ละไฟล์ด้านล่างเพื่อสร้างโปรเจค
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-bold">💡 วิธีใช้:</span> คลิกที่ชื่อไฟล์เพื่อดูโค้ด จากนั้นคลิกปุ่ม Copy เพื่อคัดลอก
            </p>
          </div>

          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.name} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFile(file.name)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedFiles[file.name] ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="font-mono font-semibold text-gray-800">
                      {file.name}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {file.language}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(file.code, file.name);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                  >
                    {copied === file.name ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </button>

                {expandedFiles[file.name] && (
                  <div className="bg-gray-900 p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-100 font-mono">
                      <code>{file.code}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-purple-50 rounded-xl">
            <h3 className="font-bold text-gray-800 mb-4">🚀 ขั้นตอน Deploy</h3>
            <ol className="space-y-2 text-gray-700">
              <li>1. สร้างโฟลเดอร์ใหม่: <code className="bg-white px-2 py-1 rounded">mkdir line-support-ticket</code></li>
              <li>2. สร้างไฟล์ตามโครงสร้างข้างบนและ copy โค้ดใส่</li>
              <li>3. รัน: <code className="bg-white px-2 py-1 rounded">npm install</code></li>
              <li>4. ทดสอบ: <code className="bg-white px-2 py-1 rounded">npm run dev</code></li>
              <li>5. Push ไป GitHub และ deploy บน Vercel/Netlify</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}