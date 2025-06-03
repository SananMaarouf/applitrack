import Link from "next/link";
import { Landing } from "@/components/landing";
import { Features } from "@/components/features";

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
      <Landing paragraphs={paragraphs} />

      {/* Features Section */}
      <Features features={features} />

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

