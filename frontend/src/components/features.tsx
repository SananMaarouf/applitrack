import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ExampleSankeyDiagram } from "./example/exampleSankeyDiagram";
import { ExampleChart } from "./example/exampleChart";
import { ExampleDataTable } from "./example/exampleDataTable";
gsap.registerPlugin(useGSAP, ScrollTrigger);

const features = [
  {
    component: <ExampleSankeyDiagram />,
    title: "Application Flow Visualization",
    description:
      "Understand your progress with a Sankey diagram that maps each application's journey from submission to final outcome. Whether that's an offer, rejection, or being ghosted",
  },
  {
    component: <ExampleChart />,
    title: "Analytics & Insights",
    description:
      "Get insight with a charts that shows the distribution of your applications across statuses",
  },
  {
    component: <ExampleDataTable />,
    title: "Status tracking & Management",
    description:
      "Work smarter with a searchable, sortable, and filterable data table. Update statuses or remove applications easily",
  },
];

export function Features() {
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    featureRefs.current.forEach((el, index) => {
      if (!el) return;
      const fromLeft = index % 2 === 0;
      gsap.fromTo(
        el,
        { opacity: 0, x: fromLeft ? -60 : 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 67%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });
  }, []);

  return (
    <section className="flex flex-col max-w-4xl w-full items-center mt-10 py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="w-full max-w-6xl px-4 flex flex-col gap-20 lg:gap-28">
        {features.map((feature, index) => {
          const textFirst = index % 2 === 0;
          return (
            <div
              key={index}
              ref={(el) => {
                featureRefs.current[index] = el;
              }}
              className={`flex flex-col ${textFirst ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-12 items-center`}
            >
              <div className="lg:w-1/3 px-12 flex flex-col space-y-4">
                <h3 className="text-2xl lg:text-3xl font-semibold">
                  {feature.title}
                </h3>
                <p className="leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="lg:w-2/3 w-11/12">{feature.component}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
