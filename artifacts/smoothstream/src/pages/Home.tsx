export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Precision control for high-stakes live streams.
        </h1>
        <p className="text-xl text-muted-foreground">
          SmoothStream is the command center for event production teams.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <a href="/intake" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
            Submit Event Request
          </a>
          <a href="/login" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 px-8 py-2">
            Team Login
          </a>
        </div>
      </div>
    </div>
  );
}
