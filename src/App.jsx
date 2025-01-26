/** @format */

import About from "./components/About";
import Contact from "./components/Contact";
import Experience from "./components/Experience";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Project from "./components/Project";
import Technologies from "./components/Technologies";
import AnimatedCursor from "react-animated-cursor";

export default function App() {
  return (
    <div className="overflow-x-hidden text-neutral-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      <div className="fixed top-0 -z-10 h-full w-full">
        <div className="absolute top-0 z-[-2] h-screen w-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      </div>
      <div className="cursor__dot">
        <AnimatedCursor
          innerSize={15}
          outerSize={15}
          color="255, 255 ,255"
          outerAlpha={0.4}
          innerScale={0.7}
          outerScale={5}
        /></div>
         {/* <AnimatedCursor
        innerSize={20}
        outerSize={24}
        color="255, 147, 1"
        outerAlpha={0.9}
        innerScale={0.9}
        outerScale={0.1}
      /> */}
      <div className="container mx-auto px-2 md:px-8">
        <Navbar />
        <Hero />
        <About />
        <Technologies />
        <Experience />
        <Project />
        <Contact />
      </div>
    </div>
  );
}
