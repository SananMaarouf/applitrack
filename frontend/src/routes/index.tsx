import { createFileRoute, Link } from "@tanstack/react-router";
import BusyMan from "../components/busyMan";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const paragraphs = [
    "Keep losing track of who or what you've applied to?",
    "Want to know who is ghosting you?",
    "Organize your job search with Applitrack",
  ];

  const features = [
    {
      title: "User friendly UI",
      description: "Ditch the spreadsheet, embrace the form",
    },
    {
      title: "Status tracking",
      description: "See who you have interviews with and who is ghosting you",
    },
    {
      title: "Application History",
      description:
        "Quickly access details of past applications, interviews, and offers.",
    },
  ];

  return (
    <div className="flex flex-col items-center w-full lg:w-10/12 mx-auto">
      {/* Landing Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="
          rounded-md justify-center h-full 
          flex flex-col my-2 px-0 py-1 text-center text-primary
          md:py-16 md:text-left 
          lg:flex-row lg:rounded-xl "
      >
        <div className="w-full md:px-0 lg:w-1/2 md:items-start flex flex-col overflow-hidden">
          <h1 className="px-4 text-5xl text-left font-bold mb-4 md:text-7xl md:mx-auto lg:mx-0 lg:px-0">
            From{" "}
            <span className="underline text-pretty break-words">application</span>{" "}
            to offer, <span className="underline">track</span> every step
          </h1>
          <div className="lg:hidden mx-auto">
            <BusyMan />
          </div>
          {paragraphs.map((text, index) => (
            <p
              key={index}
              className="text-2xl font-bold mb-4 md:mx-auto lg:mx-0"
            >
              {text}
            </p>
          ))}
        </div>
        <div className="w-fit hidden lg:flex justify-center md:justify-end mt-8 md:mt-0">
          <BusyMan />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section className="flex flex-col w-full items-center rounded-lg my-4 py-20">
        <h2 className="text-4xl font-bold mb-8 text-primary">Features</h2>
        <div className="flex flex-wrap justify-center gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 0.9 }}
              className="flex flex-col items-center p-6 bg-card rounded-lg shadow-md w-11/12 md:w-80"
            >
              <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-center">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Try It Now Section */}
      <section className="flex flex-col rounded-lg text-primary items-center text-center justify-center w-full py-20 px-4">
        <h2 className="text-4xl font-bold mb-8">What are you waiting for?</h2>
        <p className="text-xl mb-8 font-bold">Stay on track with Applitrack</p>
        <Link to="/auth">
          <p
            className="
              px-6 py-3 bg-card text-secondary
              rounded-md font-semibold duration-300
              hover:scale-125 "
          >
            Get started
          </p>
        </Link>
      </section>
    </div>
  );
}

export default HomeComponent;