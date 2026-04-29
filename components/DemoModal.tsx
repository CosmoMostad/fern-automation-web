"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function DemoModal({ open, onClose }: Props) {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function close() {
    onClose();
    setTimeout(() => setSubmitted(false), 250);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-fern-200 flex items-center justify-center text-muted hover:text-ink transition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {!submitted ? (
              <div className="p-8 pt-7">
                <div className="flex items-center gap-2">
                  <FernMark />
                  <span className="text-sm font-medium tracking-tight">fern automation</span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight">
                  Get started with Fern.
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Tell me a little about your business and I&rsquo;ll reply
                  within a day. No pitch, no pressure.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <Field label="Work email" name="email" type="email" required placeholder="you@yourbusiness.com" />
                  <Field label="Company name" name="company" required placeholder="Acme Co." />
                  <FieldArea label="How can I help?" name="message" placeholder="I'm losing leads to slow response times and..." />
                  <FieldSelect
                    label="Roughly how many customers do you handle a month?"
                    name="volume"
                    options={[
                      { value: "", label: "Select a range" },
                      { value: "<100", label: "Under 100" },
                      { value: "100-500", label: "100 – 500" },
                      { value: "500-2000", label: "500 – 2,000" },
                      { value: "2000+", label: "2,000+" },
                    ]}
                  />
                  <button
                    type="submit"
                    className="w-full mt-2 bg-fern-800 hover:bg-fern-900 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
                <p className="mt-4 text-xs text-muted text-center">
                  Or email <a href="mailto:cosmo@fernautomation.com">cosmo@fernautomation.com</a> directly.
                </p>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-fern-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#2D5A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-semibold">Got it. Talk soon.</h3>
                <p className="mt-2 text-sm text-muted max-w-xs mx-auto">
                  I&rsquo;ll review what you sent and reply by email within a
                  day, often faster.
                </p>
                <button
                  onClick={close}
                  className="mt-6 text-sm text-fern-800 hover:text-fern-900 font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FernMark() {
  return (
    <svg width="18" height="22" viewBox="0 0 22 26" aria-hidden>
      <path d="M11 1C11 1 4 7.5 4 13.5C4 17 6.5 20 11 21.5C15.5 20 18 17 18 13.5C18 7.5 11 1 11 1Z" fill="#52936B" />
      <path d="M11 8C11 8 11 14 14 17" stroke="#1C3D2A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}{required && <span className="text-fern-700"> *</span>}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition placeholder:text-muted"
      />
    </label>
  );
}

function FieldArea({ label, name, placeholder }: { label: string; name: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}</span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
        className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition placeholder:text-muted resize-none"
      />
    </label>
  );
}

function FieldSelect({ label, name, options }: { label: string; name: string; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}</span>
      <div className="relative mt-1.5">
        <select
          name={name}
          className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition bg-white"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}
