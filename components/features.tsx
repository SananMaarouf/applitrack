"use client";
import gsap from 'gsap';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FeaturesProps } from '@/types/landingProps';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Features({ features }: FeaturesProps) {
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
				{features.map((feature, index) => (
					<div key={index} className="flex flex-col items-center p-6 bg-card text-card-foreground rounded-lg shadow-md h-full hover:scale-95 transition-transform duration-300">
						<h3 className="text-xl sm:text-2xl font-semibold mb-4">{feature.title}</h3>
						<p>{feature.description}</p>
					</div>
				))}
			</div>
		</section>
	);
}