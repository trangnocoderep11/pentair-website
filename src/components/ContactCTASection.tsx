import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, PhoneCall, Mail, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface ContactCTASectionProps {
  brandSettings?: {
    email: string;
    phone: string;
    address: string;
  };
}

export default function ContactCTASection({ brandSettings }: ContactCTASectionProps) {
  const email = brandSettings?.email || 'pentairvn@gmail.com';
  const phone = brandSettings?.phone || '1800 8134';
  const address = brandSettings?.address || '90 Đ. Đinh Thị Thi, Khu đô Thị Vạn Phúc, Thủ Đức, Hồ Chí Minh';

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    productInterest: 'Pentair Softena CS Maxi',
    message: ''
  });

  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setErrorMsg('Vui lòng cung cấp ít nhất Họ tên và Số điện thoại liên hệ.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          productInterest: formData.productInterest,
          message: formData.message || 'Mẫu đăng đăng ký được gửi từ trang chủ.',
          sourceUrl: window.location.href,
          formName: 'Biểu mẫu đăng ký tư vấn nhanh (Chân Trang Chủ)'
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Gửi thông tin tư vấn thất bại.');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        productInterest: 'Pentair Softena CS Maxi',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi hệ thống đột ngột xảy ra. Xin hãy gọi số hotline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-50 py-24 relative overflow-hidden" id="homepage-contact-cta">
      {/* Visual top and bottom lines to anchor the section */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gray-200" />
      <div className="absolute top-1/2 left-3/4 w-[450px] h-[450px] bg-[#0C3471]/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Brand Contact Card (Left) */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#0C3471] tracking-widest uppercase block bg-[#0C3471]/5 border border-[#0C3471]/10 px-3 py-1 rounded inline-block">
                Exclusive Concierge
              </span>
              <h2 className="text-3xl sm:text-4xl font-sans font-black uppercase text-[#0B2144] tracking-tight leading-tight">
                Liên hệ & Nhận bản khảo sát nước
              </h2>
              <div className="w-12 h-1 bg-[#E6C073]" />
              <p className="text-xs sm:text-sm text-gray-500 font-sans font-light leading-relaxed">
                Quý khách mong muốn đầu tư hệ thống lọc nước xứng tầm cho biệt thự của mình? Hãy liên hệ hoặc gửi form yêu cầu. Đội ngũ kỹ sư cấp nước chuẩn hãng của chúng tôi sẽ thiết lập lịch hẹn khảo sát chỉ sau 2 giờ làm việc.
              </p>
            </div>

            {/* Direct Information list */}
            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0C3471] shadow-xs border border-gray-100 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Hotline Trực Tuyến 24/7</span>
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-lg font-bold text-[#0B2144] hover:text-[#0C3471] transition-colors font-mono">{phone}</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0C3471] shadow-xs border border-gray-100 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Gửi thư trao đổi</span>
                  <a href={`mailto:${email}`} className="text-sm font-semibold text-gray-700 hover:text-[#0C3471] transition-colors">{email}</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0C3471] shadow-xs border border-gray-100 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Trụ sở phân phối</span>
                  <p className="text-xs text-gray-650 leading-relaxed font-sans font-light">
                    {address}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0C3471]/5 border border-[#0C3471]/10 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#E6C073]" />
              <div className="text-[11px] text-gray-500 font-sans font-light">
                <span className="font-bold text-[#0C3471]">Ghi chú cam kết:</span> Phản hồi khảo sát thiết thực trong vòng 30 phút, lên bản vẽ thiết kế 3D kĩ thuật hệ lọc nước chỉ trong vòng 24h.
              </div>
            </div>
          </div>

          {/* Consultation Form (Right) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-xl relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {!success ? (
                <motion.form 
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <h3 className="text-lg font-black uppercase text-[#0B2144] tracking-tight border-b border-gray-100 pb-3">
                    Đăng ký tư vấn giải pháp
                  </h3>

                  {errorMsg && (
                    <div className="p-3.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg font-sans">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="form-name" className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block">
                        Họ và tên quý khách <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        id="form-name"
                        type="text" 
                        required
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0C3471] focus:border-[#0C3471] transition-all text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="form-phone" className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block">
                        Số điện thoại liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        id="form-phone"
                        type="tel" 
                        required
                        placeholder="Ví dụ: 0912345xxx"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0C3471] focus:border-[#0C3471] transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="form-email" className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block">
                        Email (Không bắt buộc)
                      </label>
                      <input 
                        id="form-email"
                        type="email" 
                        placeholder="vinhhoa@bietthu.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0C3471] focus:border-[#0C3471] transition-all text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="form-product" className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block">
                        Giải pháp quan tâm nhất
                      </label>
                      <select 
                        id="form-product"
                        value={formData.productInterest}
                        onChange={e => setFormData({ ...formData, productInterest: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0C3471] focus:border-[#0C3471] transition-all text-xs appearance-none cursor-pointer"
                      >
                        <option value="Pentair Softena CS Maxi">Pentair Softena CS Maxi (Lâu đài/Biệt thự lớn)</option>
                        <option value="Pentair Softena CS Midi">Pentair Softena CS Midi (Căn hộ chung cư)</option>
                        <option value="Pentair Foleo Pro Max">Pentair Foleo Pro Max (Châu Âu thông minh)</option>
                        <option value="Pentair WaterTrust Pro Series 2.0">WaterTrust Pro Series 2.0 (Lọc sường sỏ công suất lớn)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="form-message" className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest block">
                      Thông tin hiện trạng nguồn nước của biệt thự (Nếu có)
                    </label>
                    <textarea 
                      id="form-message"
                      rows={4}
                      placeholder="Mô tả sơ lược hiện trạng nước, quy mô nhà vệ sinh biệt thự..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-700 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0C3471] focus:border-[#0C3471] transition-all text-xs resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button 
                      id="btn-form-submit-consult"
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-[#0C3471] hover:bg-[#164f9f] text-white font-black text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {loading ? 'Đang gửi thông tin...' : 'Xác nhận yêu cầu tư vấn'}
                      <Send className="w-3.5 h-3.5 text-[#E6C073]" />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xl font-black text-[#0B2144] uppercase tracking-normal font-sans">
                      Đăng Ký Thành Công!
                    </h3>
                    <p className="text-xs text-gray-500 font-sans leading-relaxed">
                      Chân thành cảm ơn Quý khách đã gửi trọn niềm tin cho thương hiệu lọc nước danh tiếng từ Mỹ - Pentair. Yêu cầu của quý khách đã được lưu nhận trên hệ thống và chuyển trực tiếp tới kĩ sư trưởng phân vùng. Chúng tôi sẽ nhanh chóng gọi điện liên lạc lại với quý khách.
                    </p>
                  </div>

                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-250 text-gray-500 font-mono text-[10px] font-black uppercase tracking-widest rounded transition-all cursor-pointer"
                  >
                    Gửi yêu cầu khác 
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
