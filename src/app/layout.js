import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Peipl Bill Manager",
  description: "Made by Brave Programmer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-[Geist] antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  );
}
