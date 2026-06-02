"use client"

import { A2UITable } from "@/lib/types"

export function DiagnosisTable({ data }: { data: A2UITable }) {
  return (
    <div className="rounded-xl border border-gdark overflow-hidden">
      <div className="bg-gsurface px-4 py-3 border-b border-gdark">
        <h3 className="font-bold text-sm text-white">{data.title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gdark">
              {data.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-xs font-bold text-glime uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gdark bg-gsurface">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-glime/5 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-ggray2">
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
