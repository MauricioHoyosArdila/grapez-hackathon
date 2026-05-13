"use client"

import { A2UITable } from "@/lib/types"

export function DiagnosisTable({ data }: { data: A2UITable }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      <div className="bg-zinc-50 dark:bg-zinc-800 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          {data.title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
              {data.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.rows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
