/** @format */
import React from "react";
import { FaLinkedin, FaGithub, FaInstagram, FaWhatsappSquare } from "react-icons/fa";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <nav className=" -mt-6 mb-20 flex items-center justify-between py-6">
      <div className="flex flex-shrink-0 items-center">
        <h2 className="text-3xl">𝞓𝞰𝙞𝞲</h2>
      </div>
      <div className="m-8 flex items-center justify-center gap-4 text-2xl">
        {/* LinkedIn Icon */}
        <motion.a
          href="https://www.linkedin.com/in/anil-anuragee"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="text-blue-600"
        >
          <FaLinkedin />
        </motion.a>

        {/* GitHub Icon */}
        <motion.a
          href="https://github.com/anil4use/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.2, rotate: -15 }}
          whileTap={{ scale: 0.9 }}
          className="text-gray-800"
        >
          <FaGithub />
        </motion.a>

        {/* Instagram Icon */}
        <motion.a
          href="https://www.instagram.com/aniltheboss/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          className="text-pink-600"
        >
          <FaInstagram />
        </motion.a>

        {/* WhatsApp Icon */}
        <motion.a
          href="https://wa.me/+918349283228"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.2, rotate: -15 }}
          whileTap={{ scale: 0.9 }}
          className="text-green-600"
        >
          <FaWhatsappSquare />
        </motion.a>
      </div>
    </nav>
  );
};

export default Navbar;
