import { createFileRoute, Link } from "@tanstack/react-router";
import BusyMan from "../components/busyMan";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className="bg-background flex flex-col items-center w-full">
      {/* Landing Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col lg:flex-row w-full my-2 px-0 py-1 md:py-16 text-center md:text-left justify-center h-full text-white"
      >
        <div className="w-full lg:w-1/2 flex flex-col md:items-start overflow-hidden">
          <h1 className="text-5xl text-left md:text-7xl font-bold mb-4 md:mx-auto lg:mx-0">
            From{" "}
            <span className="underline text-pretty break-words">
              application
            </span>{" "}
            to offer, <span className="underline">track</span> every step
          </h1>
          <div className="lg:hidden mx-auto">
            <BusyMan />
          </div>
          <p className="text-2xl mb-4 md:mx-auto lg:mx-0">
            Keep losing track of who or what you've applied to?
          </p>
          <p className="text-2xl mb-4 md:mx-auto lg:mx-0">
            Want to know who is ghosting you?
          </p>
          <p className="text-2xl mb-4 md:mx-auto lg:mx-0">
            Organize your job search with Applitrack
          </p>
        </div>
        <div className="w-fit hidden lg:flex justify-center md:justify-end mt-8 md:mt-0">
          <BusyMan />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section className="flex flex-col items-center w-full py-20">
        <h2 className="text-4xl font-bold mb-8">Features</h2>
        <div className="flex flex-wrap justify-center gap-8">
          <motion.div 
            whileHover={{ scale: 0.9 }}
            className="flex flex-col items-center p-6 bg-foreground rounded-lg shadow-md w-11/12 md:w-80">
            <h3 className="text-2xl font-semibold mb-4">User friendly UI</h3>
            <p className="text-center">
              Ditch the spreadsheet, embrace the form
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 0.9 }}
            className="flex flex-col items-center p-6 bg-foreground rounded-lg shadow-md w-11/12 md:w-80">
            <h3 className="text-2xl font-semibold mb-4">Status tracking</h3>
            <p className="text-center">
              See who you have interviews with and who is ghosting you
            </p>
            </motion.div>
          <motion.div 
            whileHover={{ scale: 0.9 }}
            className="flex flex-col items-center p-6 bg-foreground rounded-lg shadow-md w-11/12 md:w-80">
            <h3 className="text-2xl font-semibold mb-4">Application History</h3>
            <p className="text-center">
              Quickly access details of past applications, interviews, and
              offers.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Try It Now Section */}
      <section className="flex flex-col items-center text-center justify-center w-full py-20 px-4 text-white">
        <h2 className="text-4xl font-bold mb-8">What are you waiting for?</h2>
        <p className="text-xl mb-8">Stay on track with Applitrack</p>
        <Link to="/auth">
          <motion.p 
            whileHover={{ scale: 1.1 }}
          className="px-6 py-3 bg-white text-black rounded-md font-semibold">Sign Up</motion.p>
        </Link>
      </section>
    </div>
  );
}

export default HomeComponent;
