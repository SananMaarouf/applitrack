"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Celebrate } from './celebrate';
import { ArrowDown } from 'lucide-react';
import { Button } from './ui/button';

gsap.registerPlugin(useGSAP);

export function Landing() {
	const headlineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
	const subTextRef = useRef<HTMLDivElement>(null);
	const celebrateContainerRef = useRef<HTMLDivElement>(null);
	const textColumnRef = useRef<HTMLDivElement>(null);

	const headlines = [
		"Keep losing track of what you've applied to?",
		"Want to know how much you're getting ghosted?",
		"Organize your job search with Applitrack!",
	];

	useGSAP(() => {
		gsap.set([headlineRefs.current[1], headlineRefs.current[2]], { y: 60, opacity: 0 });
		gsap.set(subTextRef.current, { y: 20, opacity: 0 });

		const [h1, h2, h3] = headlineRefs.current;

		const addHeadlineCycling = (tl: gsap.core.Timeline) => {
			tl.to(h1, { y: -40, opacity: 0, duration: 1.3, ease: "power2.in" }, "+=1.8");
			tl.to(h2, { y: 0, opacity: 1, duration: 1.3, ease: "power2.out" }, "-=0.4");
			tl.to(h2, { y: -40, opacity: 0, duration: 1.3, ease: "power2.in" }, "+=2.4");
			tl.to(h3, { y: 0, opacity: 1, duration: 1.3, ease: "power2.out" }, "-=0.4");
			tl.add("reveal", "+=0.7");
			tl.to(subTextRef.current, { y: 0, opacity: 1, duration: 1.3, ease: "power2.out" }, "reveal");
		};


		const mm = gsap.matchMedia();

		// Desktop: text column slides in from left
		mm.add("(min-width: 1024px)", () => {
			const tl = gsap.timeline();
			tl.from('header', { y: -100, duration: 0.7, ease: "power2.out" });
			tl.from(celebrateContainerRef.current, { x: 80, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.2");
			tl.from(textColumnRef.current, { x: -60, duration: 0.8, ease: "power2.out" }, "-=0.4");
			tl.from(h1, { y: 60, opacity: 0, duration: 1.3, ease: "power2.out" }, "<");
			addHeadlineCycling(tl);
		});

		// Mobile: headline fades in from top
		mm.add("(max-width: 1023px)", () => {
			const tl = gsap.timeline();
			tl.from('header', { y: -100, duration: 0.7, ease: "power2.out" });
			tl.from(celebrateContainerRef.current, { x: 80, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.2");
			tl.from(h1, { y: -60, opacity: 0, duration: 1.3, ease: "power2.out" }, "-=0.4");
			addHeadlineCycling(tl);
		});
	});

	return (
		<section className="relative flex flex-col rounded-lg lg:flex-row lg:py-22 max-w-5xl">

			{/* text — overlays illustration on mobile, left column on desktop */}
			<article ref={textColumnRef} className="w-full min-w-0 flex flex-col place-content-between lg:place-content-evenly z-10">
				{/* Headlines - stack in same cell, swap one by one */}
				<div className="grid lg:relative h-fit items-center lg:h-auto">
					{headlines.map((text, index) => (
						<h2 key={index} ref={el => { headlineRefs.current[index] = el; }}
							className="
									col-start-1 row-start-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
								font-bold px-4 lg:px-0 text-center lg:text-left"
						>
							{text}
						</h2>
					))}
				</div> 

				{/* Sub-text - animates in after all headlines */}
				<div ref={subTextRef} className="flex mt-64 md:mt-70 flex-col gap-4 lg:mt-0 lg:items-start">
					<p
						className="
								text-3xl sm:text-3xl text-center lg:text-left font-bold"
					>
						Track every{" "}
						<span className="underline">application</span>,{" "}
						land your next <span className="underline">offer</span>
					</p>

					<Button size="lg" className="self-center mt-2 hover:scale-125 transition-all duration-300" onClick={() => window.scrollBy({ top: 500, behavior: 'smooth' })}>
						Learn more
						<ArrowDown className="ml-2" />
					</Button>
				</div>
			</article>

			{/* illustration — absolute behind text on mobile, right column on desktop */}
			<figure ref={celebrateContainerRef} className="
					absolute inset-0 mt-10 md:mt-5 flex justify-center z-0
					lg:static lg:flex lg:items-center lg:justify-center">
				<Celebrate />
			</figure>
		</section>
	)
}