"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = { open: boolean; onClose: () => void };

export default function RequestAgentModal({ open, onClose }: Props) {
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
            className="bg-white text-ink w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              onClick={close}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-fern-200 flex items-center justify-center text-muted hover:text-ink transition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2 L12 12 M12 2 L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {!submitted ? (
              <div className="p-8 pt-7">
                <h3 className="text-xl font-semibold tracking-tight">
                  Request a new agent.
                </h3>
                <p className="mt-2 text-sm text-muted">
                  Tell me what you need and I&rsquo;ll scope it. I&rsquo;ll
                  email back within a day with a written proposal — what
                  it&rsquo;d look like, what it&rsquo;d cost, what it&rsquo;d
                  connect to.
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <Field
                    label="What kind of agent do you need?"
                    name="kind"
                    required
                    placeholder="e.g. an SMS agent that handles guest booking confirmations"
                  />
                  <Field
                    label="What tools should it work with?"
                    name="tools"
                    placeholder="e.g. our Mindbody calendar, Twilio, our website form"
                  />
                  <FieldSelect
                    label="When do you need it?"
                    name="urgency"
                    options={[
                      { value: "no-rush", label: "No rush" },
                      { value: "this-month", label: "This month" },
                      { value: "this-week", label: "This week if possible" },
                    ]}
                  />
                  <button
                    type="submit"
                    className="w-full mt-2 bg-fern-800 hover:bg-fern-900 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    Send request
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7h8M8 4l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-fern-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#2D5A3D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-semibold">Got it.</h3>
                <p className="mt-2 text-sm text-muted max-w-xs mx-auto">
                  I&rsquo;ll review what you sent and email a written
                  proposal within a day, often faster.
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

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">
        {label}
        {required && <span className="text-fern-700"> *</span>}
      </span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition placeholder:text-muted"
      />
    </label>
  );
}

function FieldSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}</span>
      <div className="relative mt-1.5">
        <select
          name={name}
          className="w-full appearance-none px-3 py-2.5 pr-9 text-sm rounded-lg border border-rule focus:border-fern-700 focus:ring-2 focus:ring-fern-200 outline-none transition bg-white"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}
