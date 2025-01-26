/** @format */
import aboutMe from "../assets/Anil3.jpg";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const About = () => {
  const schemaMarkup = {
    "@context": "http://schema.org",
    "@type": "Person",
    name: "Anil Anuragee",
    jobTitle: "Full Stack Developer",
    worksFor: {
      "@type": "Organization",
      name: "Your Portfolio"
    },
    url: "https://www.yourportfolio.com",
    sameAs: [
      "https://www.linkedin.com/in/yourprofile",
      "https://github.com/yourprofile"
    ]
  };
  return (
    <div className="border-b border-neutral-900 pb-4">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>
      <Helmet>
        <meta
          name="description"
          content="Learn more about Anil Anuragee, a passionate full-stack developer with expertise in React.js, Node.js, and more."
        />
        <meta name="keywords" content="full-stack developer, React, Node.js, portfolio, web development" />
        <meta property="og:title" content="About Me - Anil Anuragee" />
        <meta
          property="og:description"
          content="Learn more about Anil Anuragee, a passionate full-stack developer with expertise in React.js, Node.js, and more."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.yourportfolio.com" />
        <meta property="og:image" content="https://www.yourportfolio.com/your-image.jpg" />
      </Helmet>
      <motion.h1
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.5 }}
        className="my-20 text-center text-4xl"
      >
        About
        <span className="text-neutral-500 ml-2">Me</span>
      </motion.h1>

      <div className="flex flex-wrap">
        {/* Image Section */}
        <motion.div
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:w-1/2 lg:p-8"
        >
          <div className="flex items-center justify-center">
            <motion.img
              src={aboutMe}
              alt="Anil Anuragee - Full Stack Developer"
              className="rounded-2xl"
              width={500}
              whileHover={{ scale: 1.05 }}
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* Text Section */}
        <motion.div
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          initial={{ opacity: 0, x: 100, y: -30 }}
          transition={{
            duration: 0.7,
            ease: "easeInOut",
            delay: 0.3,
          }}
          className="w-full lg:w-1/2"
        >
          <div className="flex sticky top-40 justify-center lg:justify-start">
            <motion.p
              className="my-2 py-6 max-w-xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                I am a passionate and driven Full Stack Developer with a deep interest in creating innovative and user-centric web applications. With over a year and a half of experience, I specialize in building modern web applications using React.js, Node.js, and Express.js. My goal is always to enhance user experience and deliver seamless, efficient solutions.
              </motion.span>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Throughout my career, I’ve had the opportunity to work on various projects that range from e-commerce platforms to online course management systems. Each project has taught me the importance of both functionality and design, and I strive to build applications that are not only robust but also intuitive for users.
              </motion.div>

              <motion.div
                whileInView={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                What excites me most about web development is the ability to create something that users interact with daily, solving real problems and improving efficiency. This is why I take pride in delivering high-quality code and ensuring performance optimization in every project I undertake.
              </motion.div>

              <motion.h3
                className="text-xl font-medium mt-6"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                Approach to Development
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                I believe in writing clean, maintainable, and scalable code that can grow with your business needs. I am always striving to improve my skills, whether through learning new frameworks, contributing to open-source projects, or collaborating with other developers to solve complex challenges.
              </motion.p>

              <motion.h3
                className="text-xl font-medium mt-6"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                Personal Projects and Growth
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Outside of work, I dedicate time to exploring the latest web technologies and working on side projects that allow me to experiment with new ideas and frameworks. I find that personal projects give me the freedom to push the boundaries of my skills and try out the latest innovations in the development world.
              </motion.p>

              <motion.h3
                className="text-xl font-medium mt-6"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                Let’s Connect
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Whether you’re looking for a developer to help build a project from scratch, or if you just want to exchange ideas about the latest trends in web development, I’m always open to new opportunities and collaborations. Feel free to reach out, and let's see how we can work together to create something amazing!
              </motion.p>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
