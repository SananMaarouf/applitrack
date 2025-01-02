
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white text-center py-4 w-full fixed bottom-0">
      <p>&copy; {currentYear} Applitrack. All rights reserved.</p>
    </footer>
  );
};

export default Footer;