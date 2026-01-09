import { useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';

// RULE: Page folder structure - index.tsx + flat components (NO subdirectories)
// RULE: Routing via useNavigation only (no Link/a tags)

const HomePage = () => {
  const navigate = useNavigate();

  // Handle navigation
  const handleStartFree = () => {
    navigate('/login/professional');
  };

  const handleAdminAccess = () => {
    navigate('/login/admin');
  };

  const handleRegister = () => {
    navigate('/login/professional');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <HeroSection onStartFree={handleStartFree} onAdminAccess={handleAdminAccess} />

      {/* Features Section */}
      <FeaturesSection />

      {/* CTA Section */}
      <CTASection onRegister={handleRegister} />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default HomePage;
