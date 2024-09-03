"use client";
import "regenerator-runtime/runtime";
import Head from "next/head";
import WaveSurferRecorderV2 from "@/components/VoiceRecorder";

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12">
      <Head>
        <title>Interactive Chat Application</title>
        <meta
          name="description"
          content="Convert voice to text using Next.js"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="w-full flex flex-col items-center px-4">
        <div className="text-left">
          <h1 className="text-3xl font-bold mb-6 text-black">
            Interactive Chat Application
          </h1>
          <div className="w-full max-w-2xl">
            <WaveSurferRecorderV2 />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
