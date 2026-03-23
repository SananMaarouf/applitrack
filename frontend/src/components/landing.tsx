"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Celebrate } from './celebrate';
import { ArrowDown } from 'lucide-react';
import { Button } from './ui/button';

gsap.registerPlugin(useGSAP);

export function Landing() {
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const subTextRef = useRef<HTMLDivElement>(null);
	const celebrateContainerRef = useRef<HTMLDivElement>(null);
	const textColumnRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		gsap.set(subTextRef.current, { y: 20, opacity: 0 });

		const h1 = headlineRef.current;


		const mm = gsap.matchMedia();

		// Desktop: text column slides in from left
		mm.add("(min-width: 1024px)", () => {
			const tl = gsap.timeline();
			tl.from('header', { y: -100, duration: 0.7, ease: "power2.out" });
			tl.from(celebrateContainerRef.current, { y: -80, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.2");
			tl.from(textColumnRef.current, { x: -60, duration: 0.8, ease: "power2.out" }, "-=0.4");
			tl.from(h1, { y: 60, opacity: 0, duration: 1.3, ease: "power2.out" }, "<");
			tl.to(subTextRef.current, { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, "-=0.2");
		});

		// Mobile: headline fades in from top
		mm.add("(max-width: 1023px)", () => {
			const tl = gsap.timeline();
			tl.from('header', { y: -100, duration: 0.7, ease: "power2.out" });
			tl.from(celebrateContainerRef.current, { y: -80, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.2");
			tl.from(h1, { y: -60, opacity: 0, duration: 1.3, ease: "power2.out" }, "-=0.4");
			tl.to(subTextRef.current, { y: 0, opacity: 1, duration: 1.1, ease: "power2.out" }, "-=0.2");
		});
	});

	return (
		<section className="flex flex-col rounded-lg lg:flex-row lg:py-22 max-w-5xl">

			{/* illustration — top on mobile, right column on desktop */}
			<figure ref={celebrateContainerRef} className="
					order-2
					flex justify-center
					lg:order-last lg:items-center lg:justify-center">
				<Celebrate />
			</figure>

			{/* text — below illustration on mobile, left column on desktop */}
			<article ref={textColumnRef} className="
				contents
				lg:order-first lg:flex lg:w-full lg:min-w-0 lg:flex-col
				lg:place-content-evenly">
				{/* Headline */}
				<div className="order-1 grid h-fit items-center lg:relative lg:h-auto lg:order-0">
					<h2
						ref={headlineRef}
						className="
							col-start-1 row-start-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl 
							font-bold px-4 lg:px-0 text-center lg:text-left"
					>
						Stay on track with Applitrack
					</h2>
				</div> 

				{/* Sub-text - animates in after headline */}
				<div ref={subTextRef} className="order-3 mt-4 flex flex-col gap-4 lg:order-0 lg:mt-0 lg:items-start">
					<p
						className="
								text-2xl text-center lg:text-left font-bold"
					>
						Map your job hunt journey
					</p>

					<Button size="lg" className="self-center mt-2 hover:scale-125 transition-all duration-300" onClick={() => window.scrollBy({ top: 500, behavior: 'smooth' })}>
						Learn more
						<ArrowDown className="ml-2" />
					</Button>
				</div>
			</article>
		</section>
	)
}