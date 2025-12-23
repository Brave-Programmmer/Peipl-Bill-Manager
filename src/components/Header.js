export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#0f766e] via-[#138d84] to-[#0d9488] shadow-2xl no-print relative overflow-hidden animate-slide-in-up">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14b8a6]/5 to-[#2d3436]/10 animate-gradient-shift"></div>
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-6">
          {/* Left Section: Logo & Company Info */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 backdrop-blur-md flex items-center justify-center overflow-hidden group animate-float bg-white/10 rounded-lg">
                <img
                  src="./logo.png"
                  alt="Pujari Engineers Logo"
                  width={64}
                  height={64}
                  className="object-contain w-14 h-14 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                />
              </div>
            </div>

            <div
              className="space-y-1 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                Pujari Engineers
              </h1>
              <p className="text-white/90 text-sm font-medium tracking-wide">
                Bill Maker & Management System
              </p>
            </div>
          </div>

          {/* Right Section: Status Info */}
          <div
            className="flex items-center space-x-6 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-center space-x-3 text-sm text-white font-semibold">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-pulse shadow-lg"></span>
                <span>System Online</span>
              </span>
              <span className="text-white/50">•</span>
              <span className="text-white/80">v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
