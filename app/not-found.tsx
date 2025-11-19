import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className=" min-h-screen w-full bg-background flex flex-col justify-center items-center gap-4 -mt-[68px] md:-mt-[72px] relative ">
      <div className=" z-50 flex flex-col justify-center items-center gap-4 ">
        <h1 className=" text-6xl md:text-9xl font-semibold ">404</h1>
        <p className=" md:text-2xl">This page could not be found</p>
        <Link href="/" className=" ">
          <button className=" md:text-xl underline mt-2 cursor-pointer">กลับสู่หน้าแรก</button>
        </Link>
      </div>
      <div className=" absolute md:left-1/8 xl:left-1/6 top-1/2 -translate-y-1/2 hidden md:block md:w-[200px] md:h-[200px] lg:w-[250px] lg:h-[250px] ">
        {" "}
        <Image
          src="/illustration/cat_hihi.png"
          alt="Cat Illustration"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <div className=" absolute md:right-1/8 xl:right-1/6 top-1/2 -translate-y-1/2 hidden md:block md:w-[190px] md:h-[190px] lg:w-[235px] lg:h-[235px] ">
        {" "}
        <Image
          src="/illustration/owl_hihi.png"
          alt="Cat Illustration"
          layout="fill"
          objectFit="cover"
        />
      </div>
    </div>
  );
}
