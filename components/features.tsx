"use client";
import gsap from 'gsap';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExampleSankeyDiagram } from './exampleSankeyDiagram';
import { ExampleChart } from './exampleChart';
import { ExampleDataTable } from './exampleDataTable';
gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Features() {
	const featuresRef = useRef<HTMLDivElement>(null);
	const componentRef = useRef<HTMLDivElement>(null);
	const [currentFeature, setCurrentFeature] = useState(0);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const [progress, setProgress] = useState(0);

	const features = [
		{
			component: <ExampleSankeyDiagram />,
			title: "Application Flow Visualization",
			description: "Track your job applications through the entire pipeline with interactive Sankey diagrams. Visualize how many of your applications move from submission to final decision."
		},
		{
			component: <ExampleChart />,
			title: "Analytics & Insights",
			description: "Get detailed analytics on your job search performance"
		},
		{
			component: <ExampleDataTable />,
			title: "Comprehensive Data Management",
			description: "Organize all your job applications in one place. Sort, search and update your applications using a simple data table."
		}
	];

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
						start: "top 70%",
						toggleActions: "play reverse play reverse",
						markers: false
					}
				}
			);
		}
	}, []);

	const animateTransition = useCallback(() => {
		if (componentRef.current && !isTransitioning) {
			setIsTransitioning(true);
			setProgress(0); // Reset progress

			// Exit animation
			gsap.to(componentRef.current, {
				opacity: 0,
				x: -50,
				duration: 0.3,
				ease: "power2.in",
				onComplete: () => {
					// Change to next feature
					setCurrentFeature((prev) => (prev + 1) % features.length);

					// Entrance animation
					gsap.fromTo(componentRef.current,
						{ opacity: 0, x: 50 },
						{
							opacity: 1,
							x: 0,
							duration: 0.3,
							ease: "power2.out",
							onComplete: () => {
								setIsTransitioning(false);
							}
						}
					);
				}
			});
		}
	}, [isTransitioning, features.length]);

	useEffect(() => {
		const progressInterval = setInterval(() => {
			if (!isTransitioning) {
				setProgress(prev => {
					if (prev >= 100) {
						return 0;
					}
					return prev + 0.1; // Increment by 0.1% every 10ms (10ms * 1000 = 10s)
				});
			}
		}, 10);

		const mainInterval = setInterval(() => {
			if (!isTransitioning) {
				animateTransition();
			}
		}, 10000); // Changed back to 10 seconds

		return () => {
			clearInterval(mainInterval);
			clearInterval(progressInterval);
		};
	}, [features.length, isTransitioning, animateTransition]);

	const handleFeatureClick = (index: number) => {
		if (index !== currentFeature && !isTransitioning && componentRef.current) {
			setIsTransitioning(true);
			setProgress(0); // Reset progress

			// Exit animation
			gsap.to(componentRef.current, {
				opacity: 0,
				x: -50,
				duration: 0.3,
				ease: "power2.in",
				onComplete: () => {
					// Change to selected feature
					setCurrentFeature(index);

					// Entrance animation
					gsap.fromTo(componentRef.current,
						{ opacity: 0, x: 50 },
						{
							opacity: 1,
							x: 0,
							duration: 0.3,
							ease: "power2.out",
							onComplete: () => {
								setIsTransitioning(false);
							}
						}
					);
				}
			});
		}
	};
	return (
		<section ref={featuresRef} className="opacity-0 flex flex-col w-full items-center rounded-lg py-12 sm:py-16 lg:py-20">
			<h2 className="text-3xl sm:text-4xl font-bold mb-8">
				Features
			</h2>

			<div className="w-full max-w-6xl px-4">
				<div className="flex flex-col lg:flex-row">
					{/* Feature indicators */}
					<div className="
						flex flex-row
						lg:flex-col lg:h-[670px]
						justify-between items-center gap-2
						lg:space-x-0
						">
						{features.map((_, index) => (
							<button
								key={index}
								onClick={() => handleFeatureClick(index)}
								className={`
									py-3 h-full flex
									font-semibold transition-colors
									items-center justify-center text-sm
									duration-300 rounded-t-xl border-b-2
									lg:py-0 w-full lg:w-16
									lg:border-b-0 lg:rounded-t-none lg:rounded-tl-xl lg:rounded-l-xl lg:border-r-2

									${index === currentFeature
										? 'bg-hover text-card-foreground hover:bg-hover'
										: 'bg-card text-card-foreground hover:bg-hover'
									}`}
							>
								{index + 1}
							</button>
						))}
					</div>

					{/* Main content container */}
					<div className="
						bg-card shadow-lg p-6
						h-[670px] flex flex-col
						rounded-b-xl lg:rounded-b-none
						lg:rounded-r-xl
						">
						{/* Feature content */}
						<div className="flex flex-col lg:flex-row justify-center  gap-6 flex-1">
							<div className="lg:w-1/3 flex flex-col justify-center space-y-4">
								<h3 className="text-2xl font-semibold text-card-foreground">
									{features[currentFeature].title}
								</h3>
								<p className="text-card-foreground leading-relaxed">
									{features[currentFeature].description}
								</p>
							</div>

							<div className="lg:w-2/3 flex-1 flex items-center justify-center overflow-hidden" ref={componentRef}>
								{features[currentFeature].component}
							</div>
						</div>

						{/* Progress bar */}
						<div className="w-full bg-gray-200 rounded-full h-1">
							<div
								className="bg-hover h-1 rounded-full transition-all duration-100 ease-linear"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}