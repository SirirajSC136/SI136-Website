import Image from 'next/image';
import monke from '@/app/assets/images/monke.jpg';
const Committee = () => {
    return (
        <div className="container mx-auto my-12 px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Student Committee</h2>
            <div className="relative w-full h-auto rounded-lg overflow-hidden shadow-lg">
                <Image
                    src="/images/committee.png" // Make sure this image is in your /public folder
                    alt="Student Committee"
                    width={1920} // Use the original image width
                    height={1080} // Use the original image height
                    layout="responsive"
                    objectFit="contain"
                />
            </div>
        </div>
    );
};

export default Committee;