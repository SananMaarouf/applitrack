"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { BusyMan } from "./busyMan";
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { LandingProps } from '@/types/landingProps';

gsap.registerPlugin(useGSAP, SplitText);

export function Landing({ paragraphs }: LandingProps) {
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const subTextRefs = useRef<(HTMLParagraphElement | null)[]>([]);

	useGSAP(() => {
		if (headlineRef.current) {

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
		<section className="w-full rounded-md justify-center flex flex-col lg:flex-row lg:pt-32" >
			<div className="w-full lg:w-1/2 flex flex-col">
				{/* The headline */}
				<h1 ref={headlineRef}
					className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center lg:text-left font-bold mb-3 lg:mb-8 px-1"
				>
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
					<p key={index} ref={el => { subTextRefs.current[index] = el; }}
						className="text-lg sm:text-xl font-bold mb-4 px-4 lg:px-0 text-center lg:text-left"
					>
						{text}
					</p>
				))}
			</div>
			<div className="hidden lg:flex lg:w-1/2 justify-center mt-8 lg:mt-0">
				<div className="w-3/4 max-w-md">
					<BusyMan />
				</div>
			</div>
		</section>
	)
}