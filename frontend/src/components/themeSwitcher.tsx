import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react'; // Assuming you use lucide-react for icons

// Theme type definition
type Theme = 'dark' | 'light';

const ThemeSwitcher = () => {
  // State to track current theme
  const [theme, setTheme] = useState<Theme>('dark');

  // Initialize theme from localStorage or use default
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to dark mode
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-3.5 rounded-full hover:bg-card transition-colors duration-500"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'light' ? (
        <Sun className="h-full w-full text-yellow-500" />
      ) : (
        <Moon className="h-full w-full text-white" />
      )}
    </button>
  );
};

export default ThemeSwitcher;