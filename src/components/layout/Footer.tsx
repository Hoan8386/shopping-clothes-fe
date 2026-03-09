import Link from "next/link";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-subtle mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-extrabold text-foreground mb-4 tracking-tight">
              SHOPPER
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Mua sắm thời trang trực tuyến với giá tốt nhất. Cam kết sản phẩm
              chất lượng và dịch vụ uy tín.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiMapPin size={14} className="text-accent shrink-0" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone size={14} className="text-accent shrink-0" />
                <span>0123-456-789</span>
              </div>
              <div className="flex items-center gap-2">
                <FiMail size={14} className="text-accent shrink-0" />
                <span>contact@shopvn.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
              Liên kết nhanh
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/products", label: "Sản phẩm" },
                { href: "/about", label: "Giới thiệu" },
                { href: "/contact", label: "Liên hệ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-accent transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
              Hỗ trợ
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/faq", label: "Câu hỏi thường gặp" },
                { href: "/shipping", label: "Chính sách vận chuyển" },
                { href: "/return", label: "Chính sách đổi trả" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-accent transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5">
              Đăng ký nhận tin
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Nhận thông tin ưu đãi và sản phẩm mới nhất.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 border border-subtle border-r-0 px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition"
              />
              <button
                type="submit"
                className="bg-accent text-white px-5 py-2.5 text-sm font-semibold hover:bg-accent-hover transition shrink-0"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-5 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SHOPPER. Tất cả quyền được bảo
            lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
