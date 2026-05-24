"use client";

import { useActionState } from "react";

import type { SubmitApplicationState } from "@/app/forms/[slug]/actions";
import { submitApplication } from "@/app/forms/[slug]/actions";

export function ApplicationForm({ slug }: { slug: string }) {
  const boundAction = submitApplication.bind(null, slug);
  const [state, formAction, pending] = useActionState<
    SubmitApplicationState | undefined,
    FormData
  >(boundAction, undefined);

  const fieldErrors =
    state && state.ok === false ? state.fieldErrors ?? {} : {};

  const message =
    state?.message ??
    "Fill the form below and attach your CV (PDF/DOC/DOCX).";

  const messageColor =
    state?.ok === true
      ? "text-emerald-700"
      : state?.ok === false
        ? "text-rose-700"
        : "text-zinc-600";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className={`text-sm ${messageColor}`}>{message}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.name?.length ? (
            <p className="text-xs text-rose-700">{fieldErrors.name[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="cnic">
            CNIC
          </label>
          <input
            id="cnic"
            name="cnic"
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.cnic?.length ? (
            <p className="text-xs text-rose-700">{fieldErrors.cnic[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="degree">
            Degree
          </label>
          <input
            id="degree"
            name="degree"
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.degree?.length ? (
            <p className="text-xs text-rose-700">{fieldErrors.degree[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="specialization">
            Area of Specialization
          </label>
          <input
            id="specialization"
            name="specialization"
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.specialization?.length ? (
            <p className="text-xs text-rose-700">
              {fieldErrors.specialization[0]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="years_experience">
            Years of Experience
          </label>
          <input
            id="years_experience"
            name="years_experience"
            type="number"
            min={0}
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.years_experience?.length ? (
            <p className="text-xs text-rose-700">
              {fieldErrors.years_experience[0]}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium"
            htmlFor="previous_organization"
          >
            Notable Previous Organization
          </label>
          <input
            id="previous_organization"
            name="previous_organization"
            required
            className="h-11 rounded-md border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          />
          {fieldErrors.previous_organization?.length ? (
            <p className="text-xs text-rose-700">
              {fieldErrors.previous_organization[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="remarks">
          Remarks (optional)
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows={4}
          className="rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="cv">
          CV Attach (PDF/DOC/DOCX)
        </label>
        <input
          id="cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="h-11 rounded-md border border-zinc-200 px-3 py-2"
        />
        {fieldErrors.cv?.length ? (
          <p className="text-xs text-rose-700">{fieldErrors.cv[0]}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending || state?.ok === true}
        className="h-12 rounded-md bg-zinc-900 px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Submitting..." : state?.ok === true ? "Submitted" : "Submit"}
      </button>
    </form>
  );
}
