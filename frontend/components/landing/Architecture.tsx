'use client';

export function Architecture() {

  return (
    <section
      id="architecture"
      className="relative overflow-hidden border-b border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f0_100%)] py-24"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <h2 className="mt-5 text-4xl font-bold tracking-tight text-[#1a1a1c] md:text-6xl">
            Live request flow, tweak it yourself
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-gray-600 md:text-lg">
            Toggle the runtime strategies and watch the request path change:
            cache hit or miss, query rewrite, dense and BM25 ranking, fusion, and
            hypothetical embeddings.
          </p>
        </div>

        {/* architecture here */}

      </div>
    </section>
  );
}