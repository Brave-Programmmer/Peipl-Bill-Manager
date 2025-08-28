import Image from 'next/image';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 shadow-2xl border-b-4 border-blue-700 no-print relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center py-8">
          <div className="flex items-center space-x-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden group hover:bg-white/20 transition-all duration-300">
              <img
                src="./logo.png"
                alt="Pujari Engineers Logo"
                width={80}
                height={80}
                className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Pujari Engineers
              </h1>
              <p className="text-blue-100 text-xl font-medium tracking-wide">
                Professional Bill Maker & Management System
              </p>
              <div className="flex items-center space-x-4 text-sm text-blue-200">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>System Online</span>
                </span>
                <span>•</span>
                <span>Version 2.0</span>
              </div>
            </div>
          </div>
          
          {/* <div className="flex items-center space-x-6">
            <button 
              onClick={() => window.print()}
              className="group bg-white/10 backdrop-blur-md text-white px-8 py-4 hover:bg-white/20 transition-all duration-300 font-semibold shadow-xl border border-white/20 hover:border-white/30 hover:shadow-2xl hover:scale-105 flex items-center space-x-3"
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-300">🖨️</span>
              <span>Print Bill</span>
            </button>
            <button className="group bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 flex items-center space-x-3">
              <span className="text-xl group-hover:scale-110 transition-transform duration-300">💾</span>
              <span>Save Draft</span>
            </button>
          </div> */}
        </div>
      </div>
    </header>
  );
}
