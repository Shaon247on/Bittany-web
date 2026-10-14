export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="flex justify-between gap-4">
          <div className="h-11 w-96 rounded-2xl bg-white" />
          <div className="h-11 w-44 rounded-full bg-white" />
        </div>
        <div className="h-72 rounded-4xl bg-white" />
        <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-8">
            <div className="h-80 rounded-4xl bg-white" />
            <div className="h-80 rounded-4xl bg-white" />
          </div>
          <div className="space-y-8">
            <div className="h-72 rounded-4xl bg-white" />
            <div className="h-80 rounded-4xl bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}