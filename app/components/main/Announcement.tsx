import Image from "next/image";
import EmblaCarousel from "./embla/EmblaCarousel";

const Announcement = () => {
	const SLIDE_COUNT = 5;
	const SLIDES = Array.from(Array(SLIDE_COUNT).keys());

	return (
		<div className=" w-full h-full bg-secondary-background">
			<h2 className="text-3xl font-bold py-6 text-center">Announcement</h2>
			<div className="relative w-full h-auto rounded-lg overflow-hidden">
				<EmblaCarousel slides={SLIDES} />
			</div>
		</div>
	);
};

export default Announcement;
