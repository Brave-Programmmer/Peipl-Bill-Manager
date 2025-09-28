export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#20b4b196] via-[#1577757d] to-[#136664ad] shadow-2xl no-print relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#019b98]/10 to-[#311703]/10"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23019b98' fill-opacity='0.07'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center space-x-8">
            <div className="w-20 h-20 backdrop-blur-md flex items-center justify-center overflow-hidden group">
              <img
                src="./logo.png"
                alt="Pujari Engineers Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow">
                Pujari Engineers
              </h1>
              <p className="text-white text-xl font-medium tracking-wide">
                Professional Bill Maker & Management System
              </p>
              <div className="flex items-center space-x-4 text-sm text-white font-bold">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>System Online</span>
                </span>
                <span>•</span>
                <span>Version 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
