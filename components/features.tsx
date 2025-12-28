"use client";
import gsap from 'gsap';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExampleSankeyDiagram } from './example/exampleSankeyDiagram';
import { ExampleChart } from './example/exampleChart';
import { ExampleDataTable } from './example/exampleDataTable';
import { Progress } from './ui/progress';
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
			description: "Understand your progress with a Sankey diagram that maps each application’s journey from submission to final outcome. Whether that’s an offer, rejection, or being ghosted"
		},
		{
			component: <ExampleChart />,
			title: "Analytics & Insights",
			description: "Get insight with a pie chart that shows the distribution of your applications across statuses"
		},
		{
			component: <ExampleDataTable />,
			title: "Status tracking & Management",
			description: "Work smarter with a searchable, sortable, and filterable data table. Update statuses or remove applications easily"
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
					duration: 0.2,
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
				duration: 0.2,
				onComplete: () => {
					// Change to next feature
					setCurrentFeature((prev) => (prev + 1) % features.length);

					// Entrance animation
					gsap.fromTo(componentRef.current,
						{ opacity: 0, x: 50 },
						{
							opacity: 1,
							x: 0,
							duration: 0.2,
							onComplete: () => {
								setIsTransitioning(false);
							}
						}
					);
				}
			});
		}
	}, [isTransitioning, features.length]);

	// timer to update progress bar
	useEffect(() => {
		// If a transition animation is running, do not update progress
		if (isTransitioning) return;

		// Reset progress to 0 at the start of each cycle
		setProgress(0);

		// Record the start time for accurate progress calculation
		const startTime = Date.now();

		// Start an interval to update progress every 10ms
		const progressInterval = setInterval(() => {
			// Calculate elapsed time since start
			const elapsed = Date.now() - startTime;
			// Calculate new progress value (0 to 100 over 10 seconds)
			const newProgress = Math.min((elapsed / 10000) * 100, 100);

			// Update the progress state
			setProgress(newProgress);

			// When progress reaches 100%
			if (newProgress >= 100) {
				// Stop the interval
				clearInterval(progressInterval);
				// Wait 0.5 seconds, then trigger the feature transition animation
				setTimeout(() => {
					animateTransition();
				}, 500);
			}
		}, 10);

		// Cleanup: clear the interval if the effect is re-run or component unmounts
		return () => clearInterval(progressInterval);
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
		<section ref={featuresRef} className="
			flex flex-col w-full items-center 
			rounded-lg py-12 sm:py-16 lg:py-20
		">
			<h2 className="text-3xl sm:text-4xl font-bold mb-8">
				Features
			</h2>

			<div className="w-full max-w-6xl px-4">
				<div className="flex flex-col lg:flex-row">
					{/* Feature indicators */}
					<div className="
						flex flex-row lg:flex-col lg:h-167.5 
						justify-between items-center gap-2 lg:space-x-0
					">
						{features.map((_, index) => (
							<button
								key={index}
								onClick={() => handleFeatureClick(index)}
								className={`
									h-full 
									w-full lg:w-16 
									lg:border-b-0 
									py-3 lg:py-0 
									rounded-t-xl lg:rounded-t-none 
									lg:rounded-tl-xl lg:rounded-bl-xl 
									flex items-center justify-center 
									font-bold transition-colors duration-300 
									
									${index === currentFeature
										? 'bg-primary text-primary-foreground border-b-2 lg:border-r-4'
										: 'bg-secondary text-secondary-foreground border-b-2 border-b-primary-foreground lg:border-r-4 lg:border-r-primary-foreground'
									}`}
							>
								{index + 1}
							</button>
						))}
					</div>

					{/* Main content container */}
					<div className="
							bg-primary p-6 h-150 
							lg:w-full lg:h-167.5 flex flex-col 
							rounded-b-xl lg:rounded-r-xl lg:rounded-l-none
						">
						{/* Feature content */}
						<div className="flex flex-col gap-2 lg:flex-row justify-center flex-1">
							{/* the feature title and description */}
							<div className="lg:w-1/3 flex flex-col justify-center space-y-2">
								<h3 className="text-2xl font-semibold text-card-foreground">
									{features[currentFeature].title}
								</h3>
								<p className="text-card-foreground leading-relaxed">
									{features[currentFeature].description}
								</p>
							</div>

							{/* the feature component */}
							<div className="lg:w-2/3 flex-1 flex items-center lg:items-center" ref={componentRef}>
								{features[currentFeature].component}
							</div>
						</div>

						{/* Progress bar */}
						<Progress value={progress} className="" />
					</div>
				</div>
			</div>
		</section>
	);
}