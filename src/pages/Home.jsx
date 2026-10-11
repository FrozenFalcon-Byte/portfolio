import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Work from '../components/Work';
import Pair from '../components/Pair';
import Assistant from '../components/Assistant';
import Experience from '../components/Experience';
import Leadership from '../components/Leadership';
import Stack from '../components/Stack';
import Contact from '../components/Contact';
import { ComicLayer, Drip } from '../components/Comic';

const Home = () => (
  <>
    <Hero />
    <About />
    <Experience />
    <Work />
    <Pair />
    <Assistant />
    <Stack />
    <Leadership />
    <Drip />
    <Contact />
    <ComicLayer />
  </>
);

export default Home;
