import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LightboxProvider } from "@/components/Lightbox";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Impact } from "@/components/sections/Impact";
import { JapanCollection } from "@/components/sections/JapanCollection";
import { Motion } from "@/components/sections/Motion";
import { Projects } from "@/components/sections/Projects";
import { Toolkit } from "@/components/sections/Toolkit";
import { Works } from "@/components/sections/Works";

export default function Home() {
  return (
    <LightboxProvider>
      <Header />
      <main>
        <Hero />
        <Impact />
        <About />
        <JapanCollection />
        <Works />
        <Motion />
        <Experience />
        <Projects />
        <Toolkit />
      </main>
      <Footer />
    </LightboxProvider>
  );
}
