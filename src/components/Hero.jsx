/** @format */

import { HERO_CONTENT } from "../constants/index";
import Anil from "../assets/Anil.jpg";
import { motion } from "framer-motion";

const Hero = () => {
  const container = (delay) => ({
    hidden: {
      x: -100,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: delay,
      },
    },
  });

  const lettersAnil = "ANIL".split(""); // Split the "ANIL" part
  const lettersAnuragee = "ANURAGEE".split(""); // Split the "ANURAGEE" part

  // Array of gradients for each letter
  const gradients = [
    "linear-gradient(to right, #FF7A00, #F02C2C, #5A2D8A)",
    "linear-gradient(to right, #4C9EF8, #6A40F1, #00D4FF)",
    "linear-gradient(to right, #FF7A00, #F02C2C, #5A2D8A)",
    "linear-gradient(to right, #F9D423, #FF4E50, #F02C2C)",
    "linear-gradient(to right, #00C9FF, #92FE9D, #1FA2FF)",
    "linear-gradient(to right, #8A2BE2, #4B0082, #6A5ACD)",
    "linear-gradient(to right, #FF7A00, #F02C2C, #5A2D8A)",
    "linear-gradient(to right, #7F00FF, #E100FF, #7C4DFF)",
    "linear-gradient(to right, #4C9EF8, #6A40F1, #00D4FF)",
    "linear-gradient(to right, #00C9FF, #92FE9D, #1FA2FF)",
    "linear-gradient(to right, #8A2BE2, #4B0082, #6A5ACD)",
    "linear-gradient(to right, #FF7A00, #F02C2C, #5A2D8A)",
  ];

  return (
    <div className="border-b border-neutral-900 pb-4 lg:mb-35 mt-20">
      <div className="flex flex-wrap">
        <div className="w-full lg:w-1/2">
          <div className="flex flex-col items-center lg:items-start">
            <div className="pb-16  text-5xl md:text-6xl font-thin tracking-tight lg:mt-16 lg:text-8xl">
              {lettersAnil.map((letter, index) => (
                <motion.span
                  key={index}
                  variants={container(0)}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                  style={{
                    color: "white", // Default text color (white)
                    transition: "color 0.5s", // Smooth transition when changing to gradient
                    background: gradients[index], // Unique gradient for each letter
                    WebkitBackgroundClip: "text", // Clip the background to the text
                    backgroundClip: "text", // Standard background clip (for some browsers)
                    display: "inline-block",
                  }}
                  whileHover={{
                    color: "transparent", // On hover, make text transparent
                    transition: "color 0.5s", // Smooth transition for gradient color
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              <motion.span className="inline-block mx-1 md:mx-4" style={{ color: "white" }}>
              </motion.span>
              {lettersAnuragee.map((letter, index) => (
                <motion.span
                  key={index}
                  variants={container(0)}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                  style={{
                    color: "white",
                    transition: "color 0.5s",
                    background: gradients[lettersAnil.length + index],
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    display: "inline-block",
                  }}
                  whileHover={{
                    color: "transparent",
                    transition: "color 0.5s",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.span
              variants={container(0.5)}
              initial="hidden"
              animate="visible"
              transition={{
                repeat: Infinity,
                repeatType: "loop",
                duration: 3,
              }}
              className="bg-gradient-to-r from-pink-300 via-slate-500 to-purple-500 bg-clip-text text-3xl tracking-tight text-transparent animate-gradient-x bg-[length:200%_200%]"
            >
              FULL STACK DEVELOPER
            </motion.span>

            <motion.p
              variants={container(1)}
              initial="hidden"
              animate="visible"
              className="my-2 py-6 max-w-xl"
            >
              {HERO_CONTENT}
            </motion.p>
          </div>
        </div>

        <div className="md:-mt-28 w-full lg:w-1/2 lg:p-8">
          <div className="flex justify-center">
            <motion.img
              height={400}
              width={400}
              className="rounded-lg"
              whileInView={{ x: 0, opacity: 1 }}
              initial={{ x: 100, opacity: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              src={Anil}
              loading="lazy"
              alt="Anil Anuragee - Full Stack Developer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
