import { ToolUploadForm } from "@/components/tool-upload-form";
import { tools } from "@/lib/tools";
import Link from "next/link";

export default function ToolPage({ params }: { params: { tool: string } }) {
  const tool = tools.find((item) => item.slug === params.tool);

  if (!tool) {
    return (
      <section className="px-4 sm:px-6 py-12 max-w-4xl mx-auto">
        <div className="gradient-border rounded-xl p-8 bg-panel text-center">
          <h2 className="text-2xl font-semibold mb-2">Tool not found</h2>
          <p className="text-slate-400 mb-4">Select a valid PDF tool from the homepage.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 rounded-md bg-accent text-slate-900 font-medium hover:opacity-90 transition"
          >
            Browse all tools
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-accent transition inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all tools
          </Link>
          <h1 className="text-3xl sm:text-4xl font-semibold mt-4">{tool.name}</h1>
          <p className="text-slate-400 text-lg mt-2">{tool.description}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <ToolUploadForm tool={tool.slug} />
          </div>
          <div className="space-y-4">
            <div className="gradient-border rounded-xl p-5 bg-panel">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">How it works</h3>
              <ol className="space-y-2 text-sm text-slate-400">
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </span>
                  <span>Upload your PDF file(s)</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </span>
                  <span>Configure options if needed</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </span>
                  <span>Download processed file</span>
                </li>
              </ol>
            </div>
            <div className="gradient-border rounded-xl p-5 bg-panel text-xs text-slate-400">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Security</div>
              <p>Files are processed locally and automatically deleted after 1 hour. We never share your data.</p>
            </div>
            <div className="gradient-border rounded-xl p-5 bg-panel text-xs text-slate-400">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Need help?</div>
              <p>Check our documentation or contact support for assistance.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
