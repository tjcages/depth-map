import { Canvas } from "@/components/canvas";

export const Home = () => {
  return (
    <section className="flex h-screen w-full items-center justify-center">
      <Canvas />
      <div className="absolute z-10 flex flex-col">
        <h1>
          Off Brand<span className="ml-1 text-xl">®</span>
        </h1>
        <div className="flex w-full items-center justify-between pl-2">
          <p>Creative studio</p>
          <p>Brooklyn, New York</p>
        </div>
      </div>
    </section>
  );
};
