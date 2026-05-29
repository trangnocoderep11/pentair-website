import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Check, Truck, ShieldCheck, AlertCircle } from 'lucide-react';
import { CartItem, Post } from '../types';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onUpdateCartQuantity: (id: string, qty: number) => void;
  onClearCart: () => void;
  onFormSubmitSuccess: () => void;
  posts: Post[];
  onNavigate: (url: string) => void;
}

export default function ShoppingCart({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onClearCart,
  onFormSubmitSuccess,
  posts,
  onNavigate
}: ShoppingCartProps) {
  // Order customer details
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [note, setNote] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [orderSuccess, setOrderSuccess] = React.useState(false);
  const [orderId, setOrderId] = React.useState('');

  // Auto-fill user from local storage if logged in
  React.useEffect(() => {
    const userStr = localStorage.getItem('cms_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setName(user.displayName || user.username || '');
        setEmail(user.email || '');
      } catch (e) {}
    }
  }, [isOpen]);

  // Format currency
  const formatCurrency = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Get active price for a product
  const getProductPrice = (product: Post): number => {
    const { sale_price, regular_price, hide_price } = product.meta || {};
    if (hide_price === true || hide_price === 'true') return 0;
    if (sale_price && sale_price !== "") {
      return Number(sale_price);
    }
    if (regular_price && regular_price !== "") {
      return Number(regular_price);
    }
    return 0;
  };

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (getProductPrice(item.product) * item.quantity);
  }, 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.');
      return;
    }
    if (!name || !phone || !address) {
      setError('Vui lòng điền đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng.');
      return;
    }

    setLoading(true);
    setError('');

    // Construct products list string
    const itemsDescription = cartItems.map(item => {
      const price = getProductPrice(item.product);
      const priceStr = price > 0 ? formatCurrency(price) : 'Liên hệ';
      return `- ${item.product.title} (SL: ${item.quantity} x ${priceStr})`;
    }).join('\n');

    const totalCostStr = subtotal > 0 ? formatCurrency(subtotal) : 'Liên hệ tư vấn báo giá';
    
    const formattedMessage = `
--- CHI TIẾT ĐƠN ĐẶT HÀNG ---
${itemsDescription}

Tổng tiền: ${totalCostStr}
Địa chỉ nhận hàng: ${address}
Ghi chú khách hàng: ${note || "Không có ghi chú thêm."}
    `.trim();

    const cleanProductNames = cartItems.map(item => item.product.title).join(', ');
    const productQuantitySummary = cartItems.map(item => `${item.quantity}`).join(', ');

    try {
      const generatedOrderId = 'PENTAIR-ORDER-' + Math.floor(Math.random() * 90000 + 10000);
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || 'no-email@pentairvn.com',
          phone: phone.trim(),
          message: formattedMessage,
          productInterest: cleanProductNames,
          productQuantity: productQuantitySummary,
          address: address.trim(),
          sourceUrl: window.location.href,
          formName: `Đơn Đặt Hàng Trực Tuyến (${generatedOrderId})`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo đơn hàng.');
      }

      setOrderId(generatedOrderId);
      setOrderSuccess(true);
      onClearCart();
      onFormSubmitSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi liên kết máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToShopping = () => {
    onClose();
    onNavigate('/san-pham');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full md:max-w-md bg-white shadow-2xl border-l border-gray-100 z-[101] flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-pentair flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-pentair text-sm uppercase tracking-wide">Giỏ Hàng Pentair</h3>
                  <p className="text-[10px] text-gray-400 font-sans">
                    {cartItems.length === 0 ? 'Hiện chưa có sản phẩm' : `Đang có ${cartItems.reduce((acc, item) => acc + item.quantity, 0)} thiết bị`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Page */}
            {orderSuccess ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-gray-900 font-sans">Đặt Hàng Thành Công!</h4>
                  <p className="text-xs text-gray-500 font-sans leading-relaxed">
                    Mã đơn hàng của bạn là <strong className="text-pentair font-mono text-sm">{orderId}</strong>. Đội ngũ đại lý ủy quyền Pentair Vietnam sẽ liên hệ ngay để hỗ trợ bàn giao và lắp đặt.
                  </p>
                </div>
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-2xl w-full text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400 font-mono">
                    <Truck className="w-3.5 h-3.5 text-pentair" />
                    Cam kết dịch vụ tối cao
                  </div>
                  <p className="text-gray-600 font-sans">
                    ✓ Bảo hành kép từ đại lý và nhà sản xuất Mỹ.<br />
                    ✓ Miễn phí hoàn toàn khảo sát chỉ số nước tại nhà.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOrderSuccess(false);
                    onClose();
                  }}
                  className="w-full py-3 bg-pentair text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-pentair-light transition-all shadow-md cursor-pointer"
                >
                  Tiếp Tục Tham Quan
                </button>
              </div>
            ) : (
              <>
                {/* Content Area */}
                <div className="flex-grow overflow-y-auto p-5 space-y-6">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <ShoppingBag className="w-12 h-12 text-gray-200" />
                      <div className="space-y-1">
                        <strong className="text-sm text-gray-800 font-sans block">Giỏ hàng của bạn đang trống</strong>
                        <p className="text-xs text-gray-400 font-sans max-w-xs mx-auto">
                          Hãy khám phá các thiết bị lọc trọn bộ nước cao cấp chất lượng vàng từ Pentair USA.
                        </p>
                      </div>
                      <button
                        onClick={handleBackToShopping}
                        className="px-5 py-2 text-xs bg-pentair text-white font-bold rounded-lg hover:bg-pentair-light transition-all uppercase tracking-wider cursor-pointer"
                      >
                        Xem sản phẩm
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Products list */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Đầu lọc / Thiết bị đã chọn</span>
                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                          {cartItems.map((item) => {
                            const price = getProductPrice(item.product);
                            return (
                              <div key={item.id} className="p-4 flex gap-3 items-center">
                                <img
                                  src={item.product.featuredImage}
                                  alt={item.product.title}
                                  className="w-14 h-14 rounded-lg object-cover bg-gray-50 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-grow min-w-0">
                                  <h5 className="text-xs font-bold text-gray-900 truncate" title={item.product.title}>{item.product.title}</h5>
                                  <p className="text-xs text-rose-600 font-serif font-black mt-0.5">
                                    {price > 0 ? formatCurrency(price) : 'Báo giá tư vấn'}
                                  </p>
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    {/* Qty Selector */}
                                    <div className="flex items-center border border-gray-150 rounded-md bg-slate-50">
                                      <button
                                        type="button"
                                        onClick={() => onUpdateCartQuantity(item.id, item.quantity - 1)}
                                        className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="px-2 text-xs font-mono font-bold text-gray-800">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                                        className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Remove icon */}
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFromCart(item.id)}
                                      className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Summary Block */}
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/60 text-xs space-y-2">
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Tổng hàng đã chọn:</span>
                          <span className="font-bold text-gray-900">{cartItems.reduce((acc, item) => acc + item.quantity, 0)} thiết bị</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-100/50">
                          <span className="font-semibold text-pentair">Tạm tính ước lượng:</span>
                          <span className="font-black text-rose-600 text-sm font-mono">
                            {subtotal > 0 ? formatCurrency(subtotal) : 'Liên hệ tư vấn lắp đặt'}
                          </span>
                        </div>
                      </div>

                      {/* Checkout Order Form */}
                      <div className="space-y-4 pt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Thông tin liên hệ giao hàng</span>
                        <form onSubmit={handleSubmitOrder} className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Họ Tên khách hàng *</label>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="Ví dụ: Nguyễn Văn A"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Số điện thoại *</label>
                              <input
                                type="tel"
                                required
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Ví dụ: 0912345678"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Email liên lạc</label>
                              <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tuychon@gmail.com"
                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Địa chỉ nhận thiết bị *</label>
                            <input
                              type="text"
                              required
                              value={address}
                              onChange={e => setAddress(e.target.value)}
                              placeholder="Ví dụ: 90 Đinh Thị Thi, Thủ Đức, TP. HCM"
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Ghi chú giao ráp / Khảo sát trước</label>
                            <textarea
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              rows={2}
                              placeholder="Ghi chú về nguồn nước, thời gian giao hàng thuận tiện..."
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                            />
                          </div>

                          {error && (
                            <div className="p-2.5 bg-red-50 border border-red-150 text-red-600 rounded-xl text-xs flex gap-1.5 items-center">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={loading || cartItems.length === 0}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-rose-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            {loading ? 'Đang xác minh gửi...' : 'Xác Nhận Đặt Hàng Trực Tiếp'}
                          </button>
                        </form>
                      </div>

                      {/* Secure guidelines footer */}
                      <div className="pt-2 flex justify-center items-center gap-1.5 text-[10px] text-gray-400 font-sans">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Giao dịch bảo mật công nghệ mã hóa Pentair USA ssl
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
