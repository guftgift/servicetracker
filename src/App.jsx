import React, { useState, useEffect } from 'react';
import { Ticket, Clock, User, Mail, Phone, MessageSquare, CheckCircle, AlertCircle, Calendar, TrendingDown } from 'lucide-react';

export default function SupportTicketApp() {
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [estimateModal, setEstimateModal] = useState(null);
  const [closeModal, setCloseModal] = useState(null);
  const [formData, setFormData] = useState({
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
  }, []);

  const loadTickets = async () => {
    try {
      const result = await window.storage.list('ticket:');
      if (result && result.keys) {
        const ticketPromises = result.keys.map(async (key) => {
          const data = await window.storage.get(key);
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async () => {
    if (!formData.customerName || !formData.issue) {
      showNotification('กรุณากรอกชื่อและปัญหาที่พบ', 'error');
      return;
    }

    const newTicket = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      status: 'pending-estimate'
    };

    try {
      await window.storage.set(`ticket:${newTicket.id}`, JSON.stringify(newTicket));
      setTickets([newTicket, ...tickets]);
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        issue: '',
        description: ''
      });
      setShowForm(false);
      showNotification('สร้างรายการบันทึกปัญหาสำเร็จ!', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const openEstimateModal = (ticket) => {
    setEstimateModal(ticket);
    setEstimateData({ estimatedMandays: '' });
  };

  const handleEstimateSubmit = async () => {
    if (!estimateData.estimatedMandays || parseFloat(estimateData.estimatedMandays) <= 0) {
      showNotification('กรุณากรอกจำนวน Manday ที่ถูกต้อง', 'error');
      return;
    }

    const updatedTicket = {
      ...estimateModal,
      status: 'waiting-approval',
      estimatedMandays: parseFloat(estimateData.estimatedMandays),
      estimatedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`ticket:${updatedTicket.id}`, JSON.stringify(updatedTicket));
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setEstimateModal(null);
      showNotification('ส่งการประเมินงานให้ลูกค้าเรียบร้อย', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleCustomerApprove = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updatedTicket = {
      ...ticket,
      status: 'in-progress',
      approvedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`ticket:${ticketId}`, JSON.stringify(updatedTicket));
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      showNotification('ลูกค้ายืนยันการประเมินแล้ว เริ่มดำเนินการ', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleCustomerReject = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updatedTicket = {
      ...ticket,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`ticket:${ticketId}`, JSON.stringify(updatedTicket));
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      showNotification('ลูกค้าปฏิเสธการประเมิน', 'error');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาด', 'error');
    }
  };

  const openCloseModal = (ticket) => {
    setCloseModal(ticket);
    setCloseData({
      actualMandays: '',
      remainingMandays: ticket.estimatedMandays ? ticket.estimatedMandays.toString() : ''
    });
  };

  const handleCloseSubmit = async () => {
    if (!closeData.actualMandays || !closeData.remainingMandays) {
      showNotification('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    if (parseFloat(closeData.actualMandays) <= 0) {
      showNotification('กรุณากรอก Manday ที่ใช้จริงที่ถูกต้อง', 'error');
      return;
    }

    const updatedTicket = {
      ...closeModal,
      status: 'waiting-confirmation',
      actualMandays: parseFloat(closeData.actualMandays),
      remainingMandays: parseFloat(closeData.remainingMandays),
      completedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`ticket:${updatedTicket.id}`, JSON.stringify(updatedTicket));
      setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setCloseModal(null);
      showNotification('ส่งผลการทำงานให้ลูกค้ายืนยัน', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleCustomerConfirm = async (ticketId) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const updatedTicket = {
      ...ticket,
      status: 'closed',
      confirmedAt: new Date().toISOString()
    };

    try {
      await window.storage.set(`ticket:${ticketId}`, JSON.stringify(updatedTicket));
      setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
      showNotification('ลูกค้ายืนยันการทำงานสำเร็จ! ปิด Case', 'success');
    } catch (error) {
      showNotification('เกิดข้อผิดพลาด', 'error');
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending-estimate': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'waiting-approval': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'waiting-confirmation': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending-estimate': return 'รอประเมินงาน';
      case 'waiting-approval': return 'รอลูกค้ายืนยัน';
      case 'rejected': return 'ลูกค้าปฏิเสธ';
      case 'in-progress': return 'กำลังดำเนินการ';
      case 'waiting-confirmation': return 'รอลูกค้ายืนยันผล';
      case 'closed': return 'ปิดงานแล้ว';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-3 rounded-xl">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Support Ticket</h1>
                <p className="text-gray-600 text-sm">ระบบบันทึกปัญหาลูกค้า</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md"
            >
              {showForm ? 'ยกเลิก' : '+ สร้างรายการใหม่'}
            </button>
          </div>
        </div>

        {notification && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">สร้างรายการบันทึกปัญหาใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  ชื่อลูกค้า *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="กรอกชื่อลูกค้า"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    อีเมล
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0xx-xxx-xxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  หัวข้อปัญหา *
                </label>
                <input
                  type="text"
                  name="issue"
                  value={formData.issue}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="สรุปปัญหาที่พบ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="อธิบายรายละเอียดปัญหา..."
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors shadow-md"
              >
                บันทึกรายการ
              </button>
            </div>
          </div>
        )}

        {/* Estimate Modal */}
        {estimateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ประเมินเวลาการทำงาน</h3>
              <p className="text-gray-600 mb-4">งาน: <span className="font-medium">{estimateModal.issue}</span></p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  จำนวน Manday ที่ประเมิน
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={estimateData.estimatedMandays}
                  onChange={(e) => setEstimateData({ estimatedMandays: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="เช่น 2.5"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEstimateModal(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEstimateSubmit}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  ส่งการประเมิน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Modal */}
        {closeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ปิดงานและบันทึก Manday</h3>
              <p className="text-gray-600 mb-4">งาน: <span className="font-medium">{closeModal.issue}</span></p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Manday ที่ใช้จริง
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={closeData.actualMandays}
                    onChange={(e) => setCloseData({ ...closeData, actualMandays: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="เช่น 2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingDown className="w-4 h-4 inline mr-2" />
                    Manday ที่เหลือ
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={closeData.remainingMandays}
                    onChange={(e) => setCloseData({ ...closeData, remainingMandays: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="เช่น 1.5"
                  />
                  {closeModal.estimatedMandays && (
                    <p className="text-sm text-gray-500 mt-1">
                      ประเมินไว้: {closeModal.estimatedMandays} Manday
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCloseModal(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCloseSubmit}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  ส่งให้ลูกค้ายืนยัน
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            รายการทั้งหมด ({tickets.length})
          </h2>

          {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">ยังไม่มีรายการบันทึกปัญหา</p>
              <p className="text-gray-400 text-sm mt-2">คลิก "สร้างรายการใหม่" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{ticket.issue}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{formatDateTime(ticket.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{ticket.customerName}</span>
                  </div>
                  {ticket.email && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{ticket.email}</span>
                    </div>
                  )}
                  {ticket.phone && (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{ticket.phone}</span>
                    </div>
                  )}
                  {ticket.description && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-700">{ticket.description}</p>
                    </div>
                  )}

                  {/* Manday Info */}
                  {ticket.estimatedMandays && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          ประเมิน: <span className="font-medium">{ticket.estimatedMandays} Manday</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {ticket.actualMandays && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          ใช้จริง: <span className="font-medium">{ticket.actualMandays} Manday</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <TrendingDown className="w-4 h-4 inline mr-1" />
                          เหลือ: <span className="font-medium">{ticket.remainingMandays} Manday</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {ticket.status === 'pending-estimate' && (
                    <button
                      onClick={() => openEstimateModal(ticket)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📋 ประเมินเวลางาน
                    </button>
                  )}

                  {ticket.status === 'waiting-approval' && (
                    <>
                      <button
                        onClick={() => handleCustomerApprove(ticket.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✓ ลูกค้ายืนยัน
                      </button>
                      <button
                        onClick={() => handleCustomerReject(ticket.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✗ ลูกค้าปฏิเสธ
                      </button>
                    </>
                  )}

                  {ticket.status === 'in-progress' && (
                    <button
                      onClick={() => openCloseModal(ticket)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🏁 ทำเสร็จแล้ว
                    </button>
                  )}

                  {ticket.status === 'waiting-confirmation' && (
                    <button
                      onClick={() => handleCustomerConfirm(ticket.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✓ ลูกค้ายืนยันผลงาน
                    </button>
                  )}

                  {ticket.status === 'closed' && (
                    <div className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium text-center">
                      ✓ เสร็จสิ้นแล้ว
                    </div>
                  )}

                  {ticket.status === 'rejected' && (
                    <button
                      onClick={() => openEstimateModal(ticket)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔄 ประเมินใหม่
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}