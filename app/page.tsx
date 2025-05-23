import Link from "next/link";
import BusyMan from "../components/busyMan";

export default async function Home() {
  const paragraphs = [
    "Keep losing track of what you've applied to ?",
    "Want to know how much you're getting ghosted ?",
    "Organize your job search with Applitrack!",
  ];

  const features = [
    {
      title: "User friendly UI",
      description: "Ditch the spreadsheet, embrace the form",
    },
    {
      title: "Status tracking",
      description: "See where you have applied and who you have interviews with",
    },
    {
      title: "Application History",
      description:
        "Quickly access details of past applications, interviews, and offers.",
    },
  ];

  return (
    <div className="flex flex-col items-center w-full mx-auto overflow-hidden ">
      {/* Landing Section */}
      <section className="w-full rounded-md justify-center flex flex-col  lg:flex-row" >
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* The headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center lg:text-left  font-bold mb-6 lg:mb-8 px-1">
            From{" "}
            <span className="underline text-pretty break-words">application</span>{" "}
            to offer, <span className="underline">track</span> every step
          </h1>
          {/* the illustration */}
          <div className="lg:hidden mx-auto">
            <BusyMan />
          </div>
          {/* the sub-text aka selling points*/}
          {paragraphs.map((text, index) => (
            <p key={index} className="text-lg sm:text-xl font-bold mb-4 px-4 lg:px-0 text-center lg:text-left">
              {text}
            </p>
          ))}
        </div>
        <div className="hidden lg:flex lg:w-1/2 justify-center items-center mt-8 lg:mt-0">
          <div className="w-3/4 max-w-md">
            <BusyMan />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="
        flex flex-col w-full items-center 
        rounded-lg py-12 sm:py-16 lg:py-20">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-2 md:px-0">
          {features.map((feature, index) => (
            <div
              key={index}
              className="
                flex flex-col items-center p-6 
                bg-card text-card-foreground rounded-lg
                shadow-md h-full hover:scale-95 transition-transform duration-300
              ">
              <h3 className="text-xl sm:text-2xl font-semibold mb-4">{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Try It Now Section */}
      <section className="flex flex-col rounded-lg items-center text-center justify-center w-full py-12 sm:py-16 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">What are you waiting for?</h2>
        <p className="text-lg sm:text-xl mb-8 font-bold">Stay on track with Applitrack</p>
        <Link href="/sign-up">
          <p className="
            px-6 py-3 bg-card text-card-foreground
            rounded-md font-semibold duration-500
            hover:scale-110 text-lg"
          >
            Get started
          </p>
        </Link>
      </section>
    </div>
  );
}

