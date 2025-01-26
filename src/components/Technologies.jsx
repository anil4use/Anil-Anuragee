/** @format */
import { RiReactjsLine } from "react-icons/ri";
import { TbBrandNextjs } from "react-icons/tb";
import { SiMongodb } from "react-icons/si";
import { FaNodeJs } from "react-icons/fa";
import { BiLogoTypescript } from "react-icons/bi";
import { FaDocker } from "react-icons/fa";
import { SiGraphql } from "react-icons/si";
import { motion } from "framer-motion";

const Technologies = () => {
  const iconVariants = (duration) => ({
    initial: { y: -10 },
    animate: {
      y: [10, -10],
      transition: {
        duration: duration,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
  });

  return (
    <div className="bg-bottom border-neutral-800 pb-24">
      <motion.h1
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.5 }}
        className="text-4xl my-20 text-center"
      >
        Technologies
      </motion.h1>
      <motion.div
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: -100 }}
        transition={{ duration: 1.5 }}
        className="flex flex-wrap  items-center justify-center gap-8"
      >
        {/* TypeScript */}
        <motion.div
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <BiLogoTypescript className="text-7xl text-cyan-400" />
        </motion.div>

        {/* React */}
        <motion.div
          variants={iconVariants(2.5)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <RiReactjsLine className="text-7xl text-cyan-400" />
        </motion.div>

        {/* Next.js */}
        <motion.div
          variants={iconVariants(3)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <TbBrandNextjs className="text-7xl" />
        </motion.div>

        {/* Node.js */}
        <motion.div
          variants={iconVariants(3.5)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <FaNodeJs className="text-7xl text-green-500" />
        </motion.div>

        {/* MongoDB */}
        <motion.div
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <SiMongodb className="text-7xl text-green-500" />
        </motion.div>

        {/* Docker (New Tech) */}
        <motion.div
          variants={iconVariants(4.2)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <FaDocker className="text-7xl text-blue-500" />
        </motion.div>

        {/* GraphQL (New Tech) */}
        <motion.div
          variants={iconVariants(4)}
          initial="initial"
          animate="animate"
          whileHover={{ scale: 1.2, rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="rounded-s-2xl border-4 border-neutral-800 p-4"
        >
          <SiGraphql className="text-7xl text-pink-500" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Technologies;
