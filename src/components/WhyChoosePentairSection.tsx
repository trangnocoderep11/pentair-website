import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Check } from 'lucide-react';

interface WhyChooseItem {
  title: string;
  desc: string;
}

interface WhyChoosePentairSectionProps {
  sectionTitle?: string;
  reasons: WhyChooseItem[];
  onNavigate: (url: string) => void;
}

const DEFAULT_REASONS = [
  {
    title: "Thương hiệu lọc nước hàng đầu từ Mỹ",
    desc: "Khởi lập năm 1966 tại Minneapolis, Pentair sở hữu hơn 1.200 bằng sáng chế công nghệ nước vĩ mô, tiên phong kiến tạo cuộc cách mạng nước sạch toàn cầu."
  },
  {
    title: "Công nghệ xử lý nước tiên tiến, vận hành ổn định",
    desc: "Trái tim là van điều khiển Fleck thông minh, tự rửa màng dựa trên khối lượng nước thực dùng, đảm bảo hiệu suất đột phá bất chấp áp lực nước phức tạp."
  },
  {
    title: "Thiết kế sang trọng, phù hợp biệt thự, villa, căn hộ",
    desc: "Kiến trúc bộc tủ vững chãi, sơn phủ tĩnh điện satin sang trọng, phối hợp mượt mạc trong phòng kỹ thuật đẳng cấp hay gian bếp châu Âu cao cấp."
  },
  {
    title: "Bảo vệ toàn diện nguồn nước sinh hoạt gia đình",
    desc: "Mang dòng nước chuẩn mực chảy tràn, bảo toàn sức sống mọc mạc cho làn da nhạy cảm trẻ sơ sinh, mái tóc óng ả và dồi dào sức khỏe thể chất."
  },
  {
    title: "Giảm cặn bẩn, clo và nhân tố ảnh hưởng nguồn nước",
    desc: "Khử bỏ triệt để hóa chất tồn dư, clo độc hại, kim loại nặng, hạt vi nhựa cùng tác nhân canxi bám dính cặn ố trên thiết bị vệ sinh mạ vàng đắt đỏ."
  },
  {
    title: "Hệ thống bền bỉ, siêu dễ vận hành & bảo trì",
    desc: "Vòng đời kiên cố trên 20 năm, cơ chế nạp muối và hoàn nguyên thông minh hóa tự động 100%, không đòi hỏi kỹ thuật viên can thiệp thường nhật."
  },
  {
    title: "Giải pháp hoàn mỹ cho biệt thự, resort và spa",
    desc: "Được các thương hiệu lớn như Sheraton, Marriott tin dùng, đáp ứng hiệu quả lưu lượng cho cả dinh thự villa khổng lồ, spa trị liệu hay nhà hàng Michelin cao cấp."
  }
];

export default function WhyChoosePentairSection({ 
  sectionTitle = "Vì sao chọn hệ thống lọc tổng Pentair?", 
  reasons = DEFAULT_REASONS, 
  onNavigate 
}: WhyChoosePentairSectionProps) {
  
  const displayReasons = reasons && reasons.length > 0 ? reasons : DEFAULT_REASONS;

  const getGridColsClass = (count: number) => {
    if (count <= 1) return 'lg:grid-cols-1';
    if (count === 2) return 'lg:grid-cols-2';
    if (count === 4) return 'lg:grid-cols-2'; // 2x2 layout is cleaner
    if (count % 3 === 0) return 'lg:grid-cols-3'; // e.g. 6 items -> 3 cols
    if (count % 4 === 0) return 'lg:grid-cols-4'; // e.g. 8 items -> 4 cols
    if (count % 2 === 0) return 'lg:grid-cols-4';
    return 'lg:grid-cols-3'; // fallback for odd/prime numbers (5, 7, etc.)
  };

  const gridColsClass = getGridColsClass(displayReasons.length);

  return (
    <section className="bg-[#0C3471] text-white py-24 relative overflow-hidden" id="why-choose-us-section">
      {/* Wave graphical backgrounds representing water particles */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-1/2 right-1/10 w-[500px] h-[500px] bg-[#E6C073]/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block with editorial spacing */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24 space-y-4">
          <span className="text-xs font-mono font-black text-[#E6C073] tracking-widest uppercase bg-[#E6C073]/10 border border-[#E6C073]/20 px-3 py-1 rounded">
            The Pinnacle of Water Science
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-black uppercase tracking-tight leading-tight pt-2">
            {sectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-sans font-light leading-relaxed max-w-xl mx-auto">
            Khám phá các giá trị độc tôn đặt móng cho ngôi vương lọc tổng Pentair trên phạm vi toàn cầu.
          </p>
        </div>

        {/* Dynamic Core Elements Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-6 gap-y-12`}>
          
          {displayReasons.map((reason, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 relative hover:bg-white/10 hover:border-[#E6C073]/30 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Sequence Indicator styled like a premium certificate */}
              <div className="absolute -top-6 left-6 text-2xl font-black font-sans leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#E6C073] to-[#E6C073]/20 select-none pb-2">
                0{idx + 1}
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-base font-bold text-white group-hover:text-[#E6C073] transition-colors leading-snug">
                  {reason.title}
                </h3>
                <p className="text-xs text-slate-300 font-sans font-light leading-relaxed">
                  {reason.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-[#E6C073] opacity-40 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] font-mono tracking-widest uppercase">Pentair Standard</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}
