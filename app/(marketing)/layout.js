// app/(marketing)/layout.jsx
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}