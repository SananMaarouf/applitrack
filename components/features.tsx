"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExampleSankeyDiagram } from './example-sankey-diagram';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Features() {
	const featuresRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		if (featuresRef.current) {
			gsap.fromTo(
				featuresRef.current,
				{ opacity: 0, y: 50 },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					ease: "power2.out",
					scrollTrigger: {
						trigger: featuresRef.current,
						start: "top 70%", // appears when section is near viewport top
						toggleActions: "play reverse play reverse",
						markers: false // set to true for debugging
					}
				}
			);
		}
	}, []);

	return (
		<section
			ref={featuresRef}
			className="opacity-0 flex flex-col w-full items-center rounded-lg py-12 sm:py-16 lg:py-20"
		>
			<h2 className="text-3xl sm:text-4xl font-bold mb-8">Features</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-2 md:px-0">
				<ExampleSankeyDiagram />
			</div>
		</section>
	);
}