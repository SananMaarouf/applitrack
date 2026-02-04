"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { BusyMan } from "../components/busyMan";
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { LandingProps } from '../../../types/landingProps';

gsap.registerPlugin(useGSAP, SplitText);

export function Landing({ paragraphs }: LandingProps) {
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const subTextRefs = useRef<(HTMLParagraphElement | null)[]>([]);
	const headlineContainerRef = useRef<HTMLDivElement>(null);
	const subTextContainerRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		if (headlineRef.current) {
			// Fade in the headline container
			gsap.to(headlineContainerRef.current, {
				opacity: 1,
				duration: 0.3,
				ease: "power1.out"
			});

			// Fade in the subtext container
			gsap.to(subTextContainerRef.current, {
				opacity: 1,
				duration: 0.3,
				ease: "power1.out",
				delay: 0.2
			});

			// Split the text into lines
			const split = new SplitText(headlineRef.current!, {
				type: "lines",
				linesClass: "split-line"
			});

			// Set initial state for headline
			gsap.set(split.lines, {
				y: 100,
				opacity: 0
			});

			// Animate headline lines in
			gsap.to(split.lines, {
				y: 0,
				opacity: 1,
				duration: 0.8,
				stagger: 0.2,
				ease: "power2.out",
				delay: 0.3
			});

			// Animate sub-text paragraphs in after headline
			gsap.set(subTextRefs.current, {
				opacity: 0
			});
			gsap.to(subTextRefs.current, {
				opacity: 1,
				duration: 0.7,
				ease: "power2.out",
				delay: 1.6 // matches headline animation end
			});

			// Handle resize - just revert to allow natural text flow
			const handleResize = () => {
				if (split) split.revert();
			};

			window.addEventListener('resize', handleResize);

			// Cleanup function
			return () => {
				window.removeEventListener('resize', handleResize);
				if (split) split.revert();
			};
		}
	}, { scope: headlineRef });

	return (
		<section className="
			w-full justify-center 
			flex flex-col 
			lg:flex-row lg:py-22
			">
			<div className="w-full lg:w-1/2 flex flex-col">
				{/* The headline */}
				<div ref={headlineContainerRef} className="opacity-0">
					<h1 ref={headlineRef}
						className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center lg:text-left font-bold mb-3 lg:mb-8 px-1"
					>
						From{" "}
						<span className="underline text-pretty wrap-break-word">application</span>{" "}
						to offer, <span className="underline">track</span> your progress
					</h1>
				</div>
				{/* the illustration on mobile */}
				<div className="lg:hidden mx-auto">
					<BusyMan />
				</div>
				{/* the sub-text aka selling points*/}
				<div ref={subTextContainerRef} className="opacity-0">
					{paragraphs.map((text, index) => (
						<p key={index} ref={el => { subTextRefs.current[index] = el; }}
							className="text-lg sm:text-xl font-bold mb-4 px-4 lg:px-0 text-center lg:text-left"
						>
							{text}
						</p>
					))}
				</div>
			</div>
			{/* the illustration on desktop */}
			<div className="hidden lg:flex lg:w-1/2 justify-center mt-8 lg:mt-0">
					<BusyMan />
			</div>
		</section>
	)
}