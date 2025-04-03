
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-3 text-primary text-center py-4 w-full">
      <p>&copy; {currentYear} Applitrack. All rights reserved.</p>
    </footer>
  );
};

export default Footer;